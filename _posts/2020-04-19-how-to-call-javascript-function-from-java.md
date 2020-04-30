---
layout:   post
title:    "Java Scripting API: 자바에서 자바스크립트의 함수를 호출할 수 있을까?"
author:   Kimtaeng
tags: 	  java scriptengine
description: "자바의 Scripting API를 이용하여 자바스크립트(Javascript) 파일 내의 함수를 호출해보자" 
category: Java
date: "2020-04-19 23:49:51"
comments: true
---

# 자바(Java)에서 자바스크립트(Javascript)를?
자바는 개발자가 활용할 수 있는 많은 API를 제공한다. 이번 글의 주제인 "자바에서 자바스크립트 함수 호출" 도 가능하다.
이를 가능하게 하는 것은 바로 자바의 **Java Scripting API**다.

`Java Scripting API`는 생각보다 꽤 오래전부터 사용 가능했다. 자바 커뮤니티 프로세스(Java Community Process, 이하 JCP)에 의해 자바 스펙 명세인
JSR(Java Specification Request, 이하 JSR)의 223 명세 문서로 정의되었는데, 버전으로 따져보면 10년도 넘게 지난 자바 6이다.

- 참고 링크: <a href="https://jcp.org/en/jsr/detail?id=223" target="_blank" rel="nofollow">
"JSR 223: Scripting for the Java Platform"</a>

<br><br>

# 패키지 살펴보기
Scripting API는 자바 11을 기준으로 `javax.script` 패키지에 있다. 패키지 안에는 스크립트 엔진의 팩토리를 찾는 `ScriptEngineManager` 클래스를
비롯하여 여러 개의 클래스와 인터페이스가 있다. 이러한 스크립트를 위한 API뿐만 아니라 `jdk`에는 스크립트 엔진의 구현체도 포함되어 있다.
최초 릴리즈 버전에서는 자바스크립트 엔진으로 Mozilla의 Rhino이 사용되었는데, **자바 8부터는 Nashorn 스크립트 엔진**으로 변경되었다.

그런데 오라클의 초안 스펙 프로세스인 JEP(JDK Enhancement Proposal, 이하 JEP)를 보면, Nashorn 엔진도 자바 11버전부터는 Deprecated 되었다.
이유는 다음과 같다. _"출시 당시 ECMAScript-262 5.1 표준을 완벽히 구현했으나, ECMAScript 스펙 변경마다 Nashorn의 유지 보수가 어렵다."_

- 참고 링크: <a href="https://openjdk.java.net/jeps/335" target="_blank" rel="nofollow">
"JEP 335: Deprecate the Nashorn JavaScript Engine"</a>
- 참고 링크: <a href="https://openjdk.java.net/jeps/372" target="_blank" rel="nofollow">
"JEP 372: Remove the Nashorn JavaScript Engine"</a>

게다가 향후 릴리즈에서 제거될지 모른다. 실제 코드를 봐도 `@Deprecated` 어노테이션과 함께 향후 버전 삭제를 예고하는 `forRemoval` 플래그가 `true`로
설정된 것을 확인할 수 있다.

```java
 /**
 * ... 생략
 *
 * @deprecated Nashorn JavaScript script engine and APIs, and the jjs tool
 * are deprecated with the intent to remove them in a future release.
 *
 * @since 1.8u40
 */
@Deprecated(since="11", forRemoval=true)
public final class NashornScriptEngine extends AbstractScriptEngine implements Compilable, Invocable {
```

우선 사라질 스크립트 엔진에 대한 대안은 나중에 알아보고, 이번 글의 주제인 "자바에서 자바스크립트 함수를 실행" 하도록 도와주는
`Java Scripting API`에 대해서 살펴보자.

<br><br>

# ScriptEngineManager
Java Scripting API 사용의 시작점이 되는 클래스다. 이 클래스는 클래스 로더에서 접근 가능한 모든 스크립트 엔진 팩토리와 관련된 스크립트 엔진을 찾는다.
간단하게 아래와 같은 선언으로 스크립트 엔진을 얻을 수 있다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");
```

여기서 얻어지는 `ScriptEngine` 인스턴스로 스크립트를 실행하게 된다. 참고로 `ScriptEngineManager` 인스턴스는 현재 환경에서 사용할 수 있는
모든 스크립트 엔진 팩토리 리스트를 가지고 있는데, 아래와 같은 코드로 전체 팩토리의 내용을 출력할 수 있다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
List<ScriptEngineFactory> engineFactories = manager.getEngineFactories();

for (ScriptEngineFactory factory : engineFactories) {
    System.out.println("engine name: " + factory.getEngineName());
    System.out.println("engine version: " + factory.getEngineVersion());

    String extensions = factory.getExtensions().stream()
            .collect(Collectors.joining(", "));
    System.out.println("extensions: " + extensions);

    System.out.println("language name: " + factory.getLanguageName());
    System.out.println("language version: " + factory.getLanguageVersion());

    String mimeTypes = factory.getMimeTypes().stream()
            .collect(Collectors.joining(", "));
    System.out.println("mimeTypes: " + mimeTypes);

    String shortNames = factory.getNames().stream()
            .collect(Collectors.joining(", "));
    System.out.println("shortNames :" + shortNames);

    String[] params = {
            ScriptEngine.NAME, ScriptEngine.ENGINE,
            ScriptEngine.ENGINE_VERSION, ScriptEngine.LANGUAGE,
            ScriptEngine.LANGUAGE_VERSION
    };

    for (String param : params) {
        System.out.printf("parameter '%s': %s\n", param, factory.getParameter(param));
    }
    System.out.println("---------------");
}
```

위의 코드에서는 생략했지만, 팩토리의 `getParameter` 메서드의 파라미터로 `"THREADING"`을 입력할 수 있다.
`NashornScriptEngineFactory` 클래스의 `getParameter` 메서드의 구현 코드를 보면 `switch` 문의 조건으로 있지만 `null`을 반환한다.
이유는 스레드 safe 하지 않기 때문에 멀티 스레드 환경에서 스크립트를 실행하지 말 것을 권장하기 때문이다.

위 코드의 실행 결과는 아래와 같다. 현재 환경에서 사용 가능한 모든 스크립트 엔진 팩토리의 정보를 출력한다.

```bash
engine name: Oracle Nashorn
engine version: 11.0.2
extensions: js
language name: ECMAScript
language version: ECMA - 262 Edition 5.1
mimeTypes: application/javascript, application/ecmascript, text/javascript, text/ecmascript
shortNames: nashorn, Nashorn, js, JS, JavaScript, javascript, ECMAScript, ecmascript
parameter 'javax.script.name': javascript
parameter 'javax.script.engine': Oracle Nashorn
parameter 'javax.script.engine_version': 11.0.2
parameter 'javax.script.language': ECMAScript
parameter 'javax.script.language_version': ECMA - 262 Edition 5.1
---------------
```

출력 결과에서 볼 수 있듯이, 스크립트를 실행하기 위한 `ScriptEngine` 인스턴스는 `ScriptEngineManager` 클래스의 아래와 같은 메서드를 이용하면
쉽게 얻을 수 있다.

- `getEngineByName`
  - 스크립트 엔진의 이름을 통해서 찾는다. 위의 코드 출력 결과인 "shotNames"에 해당된다.
  - nashorn, Nashorn, js, JS, JavaScript, javascript, ECMAScript, ecmascript
- `engineByExtension`
  - 스크립트의 확장자(extension)을 파라미터로 하여 찾는다.
  - 위의 예제 결과인 `Oracle Nashorn` 엔진 기준으로는 `js`를 입력하면 된다.
- `engineByMimeType`
  - 스크립트의 MIME 타입을 기준으로 찾는다.
  - application/javascript, application/ecmascript, text/javascript, text/ecmascript

일반적으로는 이름을 파라미터로 넘기는 `getEngineByName` 메서드가 가장 사용하기 편리하다. 따라서 이번 글의 예제에서는 이 메서드를 이용하여
스크립트 엔진 인스턴스를 얻는다.

<br><br>

# 스크립트 실행: 기본적인 인라인 선언
이제 앞에서 얻은 `ScriptEngine`를 이용하여 스크립트를 실행해보자. 간단하게 클래스의 `eval` 메서드를 이용하면 된다.
예제에서는 자바스크립트에서 최솟값을 구하는 `Math.min` 함수를 호출했다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    Object result = engine.eval("Math.min(2, 3)");

    if (result instanceof Integer) {
        System.out.println(result);
    }
} catch (ScriptException e) {
    System.err.println(e);
}
```

실행 결과는 아무 문제없이 아래와 같이 정속 출력된다. 만일 실행 중에 에러가 발생하면 `ScriptException` 예외가 던져진다.

```bash
Hello Madplay!
2
```

<br><br>

# 스크립트 실행: 바인딩 이용하기
글의 후반부에서 살펴볼 부분이긴 한데, Scripting API에는 `Bindings` 이라는 인터페이스가 있다. 이 인터페이스를 구현한 구현체 클래스는 객체의 상태를
저장하거나 저장한 상태를 가져올 수 있는 기능을 제공할 수 있다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    // "myName" 이라는 이름으로 "madplay" 라는 문자열 값을 저장
    engine.put("myName", "madplay");

    // 스크립트 실행, myName 변수의 값이 "madplay" 인 경우, "kimtaeng" 이란 문자열을 대입한다.
    engine.eval("var yourName = ''; if (myName === 'madplay') yourName = 'kimtaeng'");

    // 결과 출력, "yourName" 변수를 가져올 수 있다.
    System.out.println("Your name: " + engine.get("yourName"));

} catch (ScriptException e) {
    System.err.println(e);
}
```

출력 결과는 어떻게 될까? 예상한 것처럼 `kimtaeng` 이라는 문자열이 대입된 결과가 출력된다.
이처럼 Scripting API를 이용하면 스크립트 엔진 내부 상태에 값을 저장하거나 읽어올 수 있다.

<br><br>

# 스크립트 실행: 파일을 읽어서 호출하기
앞서 살펴본 직접 스크립트를 자바 코드 내에 실행하는 방법 말고도 외부의 자바 스크립트 파일을 로드하여, 그 안에 포함된 함수를 실행할 수도 있다.

`Maven` 프로젝트를 기준으로 `resources` 디렉토리 바로 밑에 `sampel_script.js` 라는 파일을 만들고 아래와 같은 내용을 작성한다.

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

위에서 만든 자바스크립트 파일의 함수를 실행하는 자바 코드를 작성해보자. 중요한 것은 함수를 호출하기 전에 `ScriptEngine` 인스턴스의 `eval` 메서드를
사용해서 미리 컴파일시켜야 한다. 따라서 코드의 도입부에 해당 파일을 읽는 코드가 위치하게 된다.

함수를 호출할 때는 `Invocable` 인터페이스를 이용한다. 다만, 모든 스크립트 엔진이 `Invocable` 인터페이스를 구현하고 있는 것이 아니기 때문에
사용하기 전에 이를 확인하는 코드가 필요하다. 이슈가 없다면 `invokeFunction` 메서드를 이용하여 스크립트 파일 내에 선언된 전역(global) 함수를
호출하여 객체를 가져올 수 있다.

또한 스크립트를 통해 얻은 객체의 함수를 실행시키는 `invokeMethod` 메서드가 있다. 앞선 `invokeFunction` 메서드로 통해 가져온 객체를 파라미터로
넘겨 특정 멤버 함수를 호출하도록 할 수 있다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    engine.eval(Files.newBufferedReader(Paths.get(
            ClassLoader.getSystemResource("sample_script.js").toURI())));

    // 현재 스크립트 엔진이 Invocable을 구현하고 있는지?
    if(!(engine instanceof Invocable))  {
        System.out.println("Invocable 인터페이스 사용 불가");
        return;
    }

    // 자바스크립트의 함수를 실행하게 해주는 Invocable`
    Invocable inv = (Invocable) engine;

    // `makeContract` 자바스크립트 함수를 호출하고, 결과 반환
    Object object = inv.invokeFunction("makeContract", "madplay", "010-1234-1234");

    if (object instanceof ScriptObjectMirror) {
        // 스크립트 실행 결과는 key/value 구조인 자바스크립트 Object 이므로 Map에 매핑된다.
        // 이를 stream + foreach로 출력한다.
        ScriptObjectMirror scriptObject = (ScriptObjectMirror) object;
        scriptObject.keySet().stream()
                .forEach(key -> {
                    String value = String.valueOf(scriptObject.getOrDefault(key, "Not Found"));
                    System.out.printf("%s: %s\n", key, value);
                });
    }

    System.out.println("----------");

    // `invokeFunction`을 통해 가져온 결과에서 멤버함수 `print`를 호출한다.
    Object name = inv.invokeMethod(object, "print");

    System.out.println("----------");

    // Javascript의 Number 타입 연산은 Java의 Double 타입에 매핑된다.
    Object result = inv.invokeFunction("accumulator", 1, 2);

    if (result instanceof Double) {
        System.out.println("accumulator: " + result);
    }

} catch (Exception e) {
    System.err.println(e);
}
```

`InvokeFunction` 메서드는 파라미터로 넘어온 문자열에 해당하는 함수가 없는 경우 `NoSuchMethodException`이 발생하고, 
스크립트 실행 과정에서 오류가 있는 경우에는 `ScriptException`이 발생한다. 함수의 이름을 입력하는 첫 번째 파라미터는 내부적으로 `requireNonNull`
메서드로 `null` 검사를 하고 있으니 반드시 입력해야 한다.

`invokeMethod` 에서는 첫 번째 파라미터로 넘겨진 객체가 `null`이면 `IllegalArgumentException` 오류가 발생한다. 또한 스크립트를 통해 얻어진
객체가 아닌 일반 객체를 넘기는 경우에도 **"getInterface cannot be called on non-script object"** 라는 메시지와 함께 동일한 예외가 발생하며
두 번째 파라미터로 넘겨진 문자열이 객체의 함수가 아닌 경우에는 **"No such function name"** 메시지와 함께 `NoSuchMethodException` 예외가 발생한다.


예제의 출력 결과는 아래와 같다. 자바스크립트 파일에 있는 두 가지 함수 모두 정상적으로 출력되었다.

따로 살펴볼 부분은 `accumulator` 함수의 반환값인데, 자바스크립트의 숫자 타입인 `Number`의 연산은 자바의 `Double` 타입에 매핑된다.
따라서 결과는 정숫값 3이 아닌 3.0이 반환되는 점에 주의하자.

```bash
name: madplay
phoneNumber: 010-1234-1234
print: function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }
----------
name =madplay
phoneNumber =010-1234-1234
----------
accumulator: 3.0
```

<br><br>

# 이어지는 글에서는
지금까지 자바에서 자바스크립트 코드를 호출할 수 있는 방법인 `Java Scripting API`에 대해서 알아보았다.
이어지는 글에서는 객체의 상태를 저장하고 가져올 수 있게 해주는 **바인딩**과 자바 코드와 자바스크립트 엔진을 결합시키는 **스크립트 컨텍스트**에 대해서 알아본다.

- 이어지는 글: <a href="/post/understanding-java-scripting-api">"Java Scripting API: 바인딩과 컨텍스트 그리고 성능 개선"</a>

참고로 예제에 사용한 모든 소스 코드는 <a href="https://github.com/madplay/java-scripting-api" target="_blank">
"github 저장소 (링크)"</a>에 있습니다.