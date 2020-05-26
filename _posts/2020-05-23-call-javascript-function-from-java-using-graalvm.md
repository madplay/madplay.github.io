---
layout:   post
title:    "Java Scripting API: GraalVM 적용해보기"
author:   Kimtaeng
tags: 	  java scriptengine graalvm
description: "자바 11에서 Deprecated된 Nashorn 스크립트 엔진을 GraalVM으로 대체해보자." 
category: Java
date: "2020-05-23 23:26:53"
comments: true
---

# 앞선 글에서는
자바에서 자바스크립트 코드를 실행하고, 상태를 관리하는 등 전반적인 `Java Scripting API` 사용 방법에 대해 알아보았다.
그리고 스크립트를 수행 속도를 개선시킬 수 있는 `Compilable` 인터페이스를 사용하여 성능을 개선시켰다.

- 이전 글: <a href="/post/understanding-java-scripting-api">"Java Scripting API: 바인딩과 스크립트 컨텍스트 그리고 실행 성능 개선"</a>

다만 `Java Scripting API` 시리즈의 첫 번째 글에서 언급한 것처럼 자바 11버전부터는 `Nashorn` 스크립트 엔진의 Deprecated가 확정되었고
향후 릴리즈 버전에서 삭제될지 모르는 `forRemoval` 플래그도 어노테이션에 선언되어 있다.

<br><br>

# GrralVM
오라클(Oracle)은 JDK의 초안 스펙 프로세스인 JEP(JDK Enhancement Proposal, 이하 JEP)에서 `Nashorn` 자바스크립트 엔진의 제거 이유로는
_"ECMA 스펙 변경마다 이를 관리하기가 어렵다"_ 라고 언급했는데, 관련된 글들을 찾아보면 대안으로 등장하는 것이 있다. 바로 `GraalVM` 이다.

`GraalVM`은 Java VM의 한 종류인데 자바 언어 외에도 다양한 언어를 제공한다. 오라클에서도 `Nashorn`을 대체하는 '훨씬 더 좋은 성능과 ECMAScript와의
호환성을 제공하는 대안' 이라고 언급했다. 이러한 `GraalVM`의 자세한 내용은 다른 글을 통해서 살펴보고, 이번 글에서는 Deprecated된 `Nashorn` 스크립트
엔진을 `GraalVM`으로 대체하는 방법에 대해 알아본다.

<br><br>

# 언젠가 동작하지 못하는 코드
앞선 글에서 살펴본 코드들로 구성한 기본적인 자바스크립트를 실행하는 코드다. 향후 릴리즈 버전에서는 더 이상 실행되지 않을 것이다.
"nashorn" 파라미터로 반환되는 `ScriptEngine`이 없을 것이기 때문이다.

참고로 자바 8버전 이후부터는 "JavaScript"로 입력해도 되는데 기본 스크립트 엔진이 `Nashorn` 이기 때문이다. (자바 7에서는 `Rhino`다.)

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("nashorn");

// "Oracle Nashorn" 출력
System.out.println("engine name: " + engine.getFactory().getEngineName());

try {
    // 2 출력
    engine.eval("print( Math.min(2, 3) )");
} catch (ScriptException e) {
    System.err.println(e);
}
```

이제 `Nashorn` 스크립트 엔진을 `GrralVM`을 사용하여 사용하지 않도록 해보자.

<br>

# 바꿔보자!
이번 글의 예제는 메이븐을 기반으로 프로젝트를 구성한다. (전체 소스 코드는 글 하단에 링크를 참조해주세요.)

## 의존성 설정 추가
먼저, 관련 라이브러리를 사용하기 위해 `pom.xml`에 의존성 설정을 추가해주어야 한다.
스크립트 엔진을 직접 변경할 것이다.

```xml
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js</artifactId>
    <version>19.2.0.1</version>
</dependency>  
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js-scriptengine</artifactId>
    <version>19.2.0.1</version>
</dependency>
```

## 코드 변경
다음으로 코드를 변경해준다. `ScriptEngineManager`를 통해 스크립트 엔진을 가져올 때, 파라미터의 이름을 `graal.js`로 지정하면 된다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("graal.js");

// "Graal.js" 출력
System.out.println("engine name: " + engine.getFactory().getEngineName());

try {
    // 2 출력
    engine.eval("print( Math.min(2, 3) )");
} catch (ScriptException e) {
    System.err.println(e);
}
```

실행 결과를 보면 알 수 있듯이, 사용되는 엔진이 `graal.js`로 바뀐 것을 알 수 있다.

사실 이렇게만 해도 `Nashorn` 스크립트 엔진을 사용하지 않게 되긴 한데, 기존 코드와의 호환성이 조금 고민될 수 있다.
특히나 `GrralVM`은 `ScriptObjectMirror`와 같은 내부 객체를 직접 노출하지 않는다.

하지만 관련해서 대부분의 대안책은 마이그레이션 가이드를 통해 제공하고 있다. 가이드는 글 하단에 링크로 걸어두었다.

<br>

# polyglot API
조금 다른 방법도 있다. `GraalVM`의 **Polyglot API**를 이용하는 것이다. 이 API를 사용하면 기본적인 Scripting API와 마찬가지로
자바 코드에서 스크립트를 실행시킬 수 있다. 예제를 통해 확인해보자.

## 문자열로 선언된 스크립트 실행
`org.graalvm.polyglot` 패키지에 있는 `Context` 클래스를 이용한다. 이 클래스는 `AutoCloseable`이기 때문에 아래와 같이 `try-with-resources`
문장으로 작성할 수 있다. 그리고 해당 인스턴스의 `eval` 메서드를 이용하여 자바스크립트 코드를 실행할 수 있다.

```java
try (Context context = Context.create("js")) {

    // 2 출력
    context.eval("js", "print( Math.min(2, 3) )");
} catch (Exception e) {
    System.err.println();
}
```

<br>

## 스크립트 파일 내의 함수 실행
`Java Scripting API`와 마찬가지로 외부의 스크립트 파일에 접근할 수 있고, 그 안에 선언된 함수도 호출할 수 있다.

`Maven` 프로젝트를 기준으로 `resources` 디렉토리 바로 밑에 "sample_script.js" 이라는 이름으로 파일을 생성하고 아래와 같이
자바스크립트 코드를 입력해준다.

```js
function accumulator(a, b) {
    return a + b;
}

function makeContract(name, phoneNumber) {
    var contract = new Object();
    contract.name = name;
    contract.phoneNumber = phoneNumber;
    contract.print = function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }
    return contract
}
```

그리고 자바 코드는 아래처럼 작성해준다. 각 코드의 설명은 주석을 추가했다.

```java
try (Context context = Context.create("js")) {

    // 스크립트 파일을 읽어와서 실행시킨다.
    context.eval(Source.newBuilder("js",
            ClassLoader.getSystemResource("sample_script.js")).build());

    // 컨텍스트의 바인딩 객체에서 "accumulator" 함수를 가져온다.
    Value accumulatorFunc = context.getBindings("js").getMember("accumulator");

    // 함수를 파라미터 1, 2을 넘겨 실행시키고 결과는 int에 매핑시킨다.
    int result = accumulatorFunc.execute(1, 2).asInt();
    System.out.println("result: " + result);
} catch (IOException e) {
    System.err.println(e);
}
```

실행 결과는 다음과 같다.

```bash
result: 3
```

코드는 `Java Scripting API`와 비슷하다. 어떻게 보면 더 직관적인 것 같기도 하다. (아무래도 상대적으로 최근에 등장해서 그런가?)
스크립트 실행 결과가 매핑되는 자바 클래스의 타입이 조금씩 다르다. 이러한 부분은 `GraalVM`에서 제공하는 마이그레이션 가이드를 잘 숙지해야 할 것 같다.

<br>

## 객체 접근
함수 실행뿐만 아니라 객체에 대한 접근도 가능하다. 역시나 반환값 결과가 `Java Scripting API`와 조금씩 다르다.

```java
try (Context context = Context.create("js")) {
    context.eval(Source.newBuilder("js",
            ClassLoader.getSystemResource("sample_script.js")).build());

    // 컨텍스트의 바인딩 객체에서 "makeContract" 함수를 가져온다.
    Value makeContractFunc = context.getBindings("js").getMember("makeContract");

    // 함수를 파라미터와 함께 실행시키고 결과를 `Value` 객체에 매핑한다.
    Value obj = makeContractFunc.execute("madplay", "010-1234-1234");

    // 반환값의 key-value 구조를 스트림을 이용해 모두 출력한다.
    obj.getMemberKeys().stream()
            .forEach(key -> System.out.printf("%s: %s\n", key, obj.getMember(key)));
} catch (IOException e) {
    System.err.println(e);
}
```

```bash
name: madplay
phoneNumber: 010-1234-1234
print: function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }

```

<br>

# 마치며
지금까지 "자바에서 자바스크립트 함수를 호출할 수 있을까?" 라는 의문을 시작으로 이를 실현 가능하게 해주는 `Java Scripting API`와
자바 11버전부터 제거가 예고된 `Nashorn` 스크립트 엔진을 `GraalVM`을 이용하여 대체할 수 있는 방법 대해서 알아보았다.

앞서 언급한 것처럼 `Nashorn`보다 보안적인 측면을 강조하여 직접적인 객체 접근이 안되는 부분도 있다. 특히나 자바 메서드를 호출할 때 데이터의 형변환으로 인한
손실을 막기 위해서, `GraalVM`은 값을 변환시 에러를 내뱉기도 한다.

관련해서 자세한 내용은 <a href="https://github.com/graalvm/graaljs/blob/master/docs/user/NashornMigrationGuide.md"
target="_blank" rel="nofollow">GraalVM: Migration Guide from Nashorn to GraalVM JavaScript (링크)</a>를 참고하면 될 것 같다.

가이드를 한 번 살펴보니 `Nashorn`과의 호환모드도 지원하는 것 같다. 하지만 스타일이나 일관성 그리고 성능상의 이유로, 특히나 호환모드에서 다르게
동작할 수 있기 때문에 이러한 호환모드 기능은 부득이한 경우에만 사용할 것을 권장한다. 그래도 마이그레이션을 할 때 덜 힘들게 해주고 싶어서 그런 것 같다.

- 참고 링크: <a href="https://github.com/madplay/java-scripting-api" target="_blank">예제에서 사용한 소스 코드(github)</a>