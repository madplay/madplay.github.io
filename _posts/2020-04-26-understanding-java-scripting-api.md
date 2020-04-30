---
layout:   post
title:    "Java Scripting API: 바인딩과 스크립트 컨텍스트 그리고 실행 성능 개선"
author:   Kimtaeng
tags: 	  java scriptengine
description: "자바 프로그램에서 자바스크립트 코드를 실행하고 그 변수를 참조할 수 있을까?" 
category: Java
date: "2020-04-26 01:11:23"
comments: true
---

# 앞선 글에서는
이전 글에서는 자바에서 자바스크립트 코드를 실행시킬 수 있는 `Java Scripting API`에 대한 소개와
간단한 사용 방법에 대해서 알아보았다.

- 이전 글: <a href="/post/how-to-call-javascript-function-from-java">
"Java Scripting API: 자바에서 자바스크립트의 함수를 호출할 수 있을까?"</a>

이번 글에서는 스크립트를 실행할 때 상태를 저장하거나 읽도록 도와주는 바인딩(Bindings) 인터페이스와 자바 코드와 자바스크립트 엔진을 연결시키는
스크립트 컨텍스트(ScriptContext)에 대해서 알아본다.

<br><br>

# 바인딩(binding)과 범위(scope)
앞선 예제에서 아래와 같은 코드를 봤을 것이다. `ScriptEngine` 클래스의 `put` 메서드와 `get` 메서드를 이용하여 마치 자바의 `Map` 클래스 객체를
전역에 설정해둔 것처럼 스크립트 영역을 넘어서까지 이용할 수 있었다.

```java
// "myName" 이라는 이름으로 "madplay" 라는 문자열 값을 저장
engine.put("myName", "madplay");

// 스크립트 실행, myName 변수의 값이 "madplay" 인 경우, "kimtaeng" 이란 문자열을 대입한다.
engine.eval("var yourName = ''; if (myName === 'madplay') yourName = 'kimtaeng'");

// 결과 출력, "yourName" 변수를 가져올 수 있다.
System.out.println("Your name: " + engine.get("yourName"));
```

위와 같은 객체의 상태를 저장하고 가져올 수 있게 하는 것은 Scripting API의 `Bindings` 인터페이스의 구현체 클래스 덕분이다. 
`Bindings` 인터페이스는 `java.util.Map` 인터페이스를 상속(extends) 하고 있어서 key/value 형태로 사용 사용 가능하다.

상태를 저장하는 `put` 메서드의 내부로 들어가 보면 `ScriptEngine` 구현체에서 아래와 비슷한 `scope` 관련 분기 코드를 볼 수 있다. 
전역(global) 범위와 엔진(engine) 범위로 나뉘어 있는데, 파라미터로 전달되는 scope 값에 따라 `ScriptContext`에서 특정 범위(scope)를 가진
바인딩 객체를 가져온다. `setBindings` 메서드도 비슷한 분기 형태로 되어 있다.

```java
public Bindings getBindings(int scope) {
    if (scope == ScriptContext.GLOBAL_SCOPE) {
        return context.getBindings(ScriptContext.GLOBAL_SCOPE);
    } else if (scope == ScriptContext.ENGINE_SCOPE) {
        return context.getBindings(ScriptContext.ENGINE_SCOPE);
    } else {
        throw new IllegalArgumentException("Invalid scope value.");
    }
}
```

앞서 언급한 것처럼 위와 같은 코드의 위치는 `ScriptEngine` 구현체에 있는데, 내부적으로 수행되는 코드를 보면 단순히 `ScriptContext` 인터페이스에
접근을 위한 것임을 알 수 있다.

이처럼 `ScriptContext`는 자바 애플리케이션과 스크립트 엔진과 연결시키는 역할을 하며, 자바 코드가 스크립트와 한 프로그램처럼 동작할 수 있게 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-04-26-how-to-call-javascript-function-from-java-1.jpg"
width="750" alt="ScriptContext in Java"/>

이 설정은 바인딩 객체의 값들이 보이는지 안 보이는지(visible), 다시 말하면 접근 가능한지 아닌지를 결정한다. 즉 범위(scope)가 전역인 경우에는 모든
스크립트 엔진에서 접근 가능하고, 엔진 범위로 설정된 경우에는 바인딩 객체가 해당 엔진에서만 접근 가능하게 된다.

기본적으로 `ScriptEngineManager` 클래스는 전역(global) 바인딩을 만들고 이를 초기화해서 사용한다. 제공되는 `setBindings` 메서드를 이용하면
전역 범위의 바인딩 객체를 변경할 수 있고 `getBindings` 메서드로 전역 바인딩 객체를 얻을 수 있다. 따라서 이 클래스에서 제공되는 바인딩 관련 기능은
모두 전역 범위(global scope)로 적용된다.

`ScriptEngine` 클래스에서도 마찬가지로 `setBindings` 메서드를 이용하여 범위를 지정할 수 있는데, 앞서 살펴본 전역 바인딩 객체 설정과 다르게
범위를 직접 설정할 수 있도록 파라미터가 하나 더 있다. 더불어 `getBindings` 메서드에도 범위를 지정할 수 있는 파라미터가 있다.

이를 잘 이용하면 바인딩 객체에 상태를 저장하고 관리하면서 스크립트를 실행할 수 있다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    engine.put("myName", "madplay");
    engine.eval("var yourName = ''; " +
            "if (myName === 'madplay') yourName = 'kimtaeng';" +
            "else yourName = 'madplay';");
    System.out.println("Your name: " + engine.get("yourName"));
    System.out.println("----------");

    // 현재 엔진의 바인딩 객체를 가져온다.
    Bindings oldBindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);

    // 새로운 바인딩 객체를 생성하고 새로운 상태를 저장한다.
    Bindings newBindings = engine.createBindings();
    newBindings.put("myName", "kimtaeng");

    // 새로운 바인딩 객체를 현재 바인딩으로 설정한다.
    engine.setBindings(newBindings, ScriptContext.ENGINE_SCOPE);

    engine.eval("var yourName = ''; " +
            "if (myName === 'madplay') yourName = 'kimtaeng';" +
            "else yourName = 'madplay';");
    System.out.println("Your name: " + engine.get("yourName"));
    System.out.println("----------");

} catch (ScriptException e) {
    System.err.println(e);
}
```

실행 결과는 아래와 같다.

```bash
Your name: kimtaeng
----------
Your name: madplay
```

다른 방법도 있다. `eval` 메서드를 실행할 때 바인딩 객체를 직접 저장해 주는 것이다. 아래와 같이 새로운 바인딩 객체를 만들고 `eval` 메서드에 넘기면
상태는 넘겨진 바인딩 객체로 관리된다.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

// 새로운 바인딩 객체를 생성하고 새로운 상태를 저장한다.
Bindings newBindings = engine.createBindings();
newBindings.put("myName", "madplay");

try {
    // `eval` 메서드를 호출할 때 파라미터로 바인딩 객체를 넣어준다.
    engine.eval("var yourName = ''; " +
            "if (myName === 'madplay') yourName = 'kimtaeng';" +
            "else yourName = 'madplay';", newBindings);

    // 새로운 바인딩 객체에서 값을 가져온다.
    System.out.println("Your name: " + newBindings.get("yourName"));

    // 엔진에 설정된 기본 바인딩 객체에서 가져온다.
    System.out.println("Your name(engine): " + engine.get("yourName"));
} catch (ScriptException e) {
    System.err.println(e);
}
```

실행 결과를 보면, `eval` 메서드에서 문자열로 선언된 스크립트에서 `yourName`에 새로 저장한 상태의 값이 출력되는 것을 알 수 있다.
그리고 기본으로 설정된 바인딩 객체에는 상태가 저장되지 않은 것을 알 수 있다.

```bash
Your name: kimtaeng
Your name(engine): null
```

<br><br>

# 스크립트 컨텍스트(ScriptContext)
바인딩에 대해서 살펴보면서 `ScriptEngine` 구현체 코드에서 아래와 유사한 코드를 볼 수 있었다. 앞서 언급한 것처럼 코드를 자세히 보면,
실제로는 단순히 `ScriptContext` 인터페이스에 접근을 위한 것을 알 수 있다. 

```java
public Bindings getBindings(int scope) {
    if (scope == ScriptContext.GLOBAL_SCOPE) {
        return context.getBindings(ScriptContext.GLOBAL_SCOPE);
    } else if (scope == ScriptContext.ENGINE_SCOPE) {
        return context.getBindings(ScriptContext.ENGINE_SCOPE);
    } else {
        throw new IllegalArgumentException("Invalid scope value.");
    }
}
```

그리고 `ScriptContext`는 자바 프로그램을 스크립트 엔진과 결합하는 역할을 한다고도 언급했다. 기본적으로 스크립트 컨텍스트는 연결된 바인딩을 스크립트 엔진에
노출시키는 것과 동시에 스크립트 엔진의 I/O를 위해 `Reader`와 `Writer`를 사용한다.

기본 제공되는 구현체인 `SimpleScriptContext`의 생성자를 보면 스크립트 엔진의 바인딩 초기화뿐만 아니라, 기본 입력은 `InputStreamReader` 클래스로
표준 입력(System.in)을 하고, 기본 출력은 `PrintWriter` 클래스로 표준 출력(System.out), 표준 에러(System.err) 출력을 하는 것을 알 수 있다.

```java
public SimpleScriptContext() {
    this(new InputStreamReader(System.in),
            new PrintWriter(System.out , true),
            new PrintWriter(System.err, true));
    engineScope = new SimpleBindings();
    globalScope = null;
}
```

표준 입력과 에러 출력을 포함한 출력은 `ScriptContext`의 인스턴스 필드로 존재하는데, 이 또한 접근자(getter)와 수정자(setter)를 이용하여 수정할 수 있다.
간단한 예제를 통해 표준 출력을 변경해보자.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

// 컨텍스트를 얻는다.
ScriptContext context = engine.getContext();

// try-with-resources 사용
try (StringWriter writer = new StringWriter()) {

    // wrtier를 지정하는 코드의 주석 여부에 따라 결과가 다르다.
    context.setWriter(writer);

    engine.eval("print ('hello! madplay :) ');");
    StringBuffer buffer = writer.getBuffer();

    System.out.println("StringBuffer: " + buffer.toString());
} catch (ScriptException | IOException e) {
    System.err.println(e);
}
```

실행 결과는 아래와 같다. 컨텍스트의 `setWriter` 메서드 호출 부분을 주석했을 때와 해제했을 때의 실행 결과가 다르다.
표준 출력을 어느 것으로 지정하느냐에 따라 달라지기 때문이다.

```bash
# 주석 처리했을 때
hello! madplay :) 
StringBuffer:

# 주석을 해제했을 때
StringBuffer: hello! madplay :) 
```

이처럼 `ScriptEngine`은 컨텍스트에 대해 접근자(getter)와 수정자(setter)를 제공하기 때문에 스크립트를 실행하거나 실행 후에 컨텍스트를 저장할 수 있다.

컨텍스트를 저장하는 절차가 복잡하다면, 스크립트를 실행할 때 바인딩 객체를 넘길 때처럼 `eval` 메서드의 두 번째 파라미터로 `ScriptContext` 자체를 넘길
수도 있다. 그런 경우 스크립트를 실행할 때 주어진 컨텍스트를 사용하게 되기 때문에 스크립트 엔진에 연결된 컨텍스트는 영향이 없게 된다.

<br><br>

# 스크립트 실행 성능 개선
스크립트 엔진이 스크립트를 실행시키는 `eval` 코드 내부로 들어가면 `ScriptEngine` 인터페이스의 구현체 클래스의 코드를 볼 수 있는데,
과정을 살펴보면 스크립트 파싱하여 실행 가능한 코드로 변환/컴파일하고 실행하는 과정이 담겨있다.

즉, 실행할 때마다 파싱하여 변환/컴파일하는 과정이 반복된다. 따라서 같은 스크립트를 계속 참조해서 사용한다면 반복되는 변환/컴파일 과정으로 인해 전반적인
스크립트의 수행 속도는 느려지게 될 것이다.

다행히도 `Java Scripting API`는 이러한 문제에 대한 대안을 가지고 있다. `Compilable` 인터페이스를 이용하여 미리 스크립트를 컴파일시키고
이 컴파일된 스크립트를 반복해서 사용하면 된다.

어떤 방식의 코드인지 살펴보자. 실제 성능이 향상되는지 보기 위해서 실행 속도도 측정해보자.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");
final int MAX_LOOP_COUNT = 100_000;

try {
    // 스크립트 파일 읽기
    String script = Files.readAllLines(Paths.get(
            ClassLoader.getSystemResource("sample_script.js").toURI())
    ).stream().collect(Collectors.joining("\n"));

    // 기존 방식으로 실행
    long start = System.nanoTime();
    for (int i = 0; i < MAX_LOOP_COUNT; i++) {
        engine.eval(script);
    }
    long end = System.nanoTime();
    System.out.printf("script: %d ms\n", TimeUnit.MILLISECONDS.convert(
            end - start, TimeUnit.NANOSECONDS));


    // `Compilable` 인터페이스 참조가 가능한지 먼저 확인이 필요하다.
    if (!(engine instanceof Compilable)) {
        System.err.println("Compilable 인터페이스 사용 불가");
    }
    Compilable compilable = (Compilable) engine;
    CompiledScript compiledScript = compilable.compile(script);

    // `CompiledScript` 사용
    start = System.nanoTime();
    for (int i = 0; i < MAX_LOOP_COUNT; i++) {
        compiledScript.eval();
    }
    end = System.nanoTime();
    System.out.printf("compiled script: %d ms\n", TimeUnit.MILLISECONDS.convert(
            end - start, TimeUnit.NANOSECONDS));


} catch (Exception e) {
    System.err.println(e);
}
```

`Compilable` 인터페이스는 `compile` 메서드를 제공하는데, 인자로 스크립트를 받아서 중간 코드(intermediate code)로 변환해준다.
그리고 반환값으로 `CompiledScript` 객체를 반환하는데, 이 객체를 이용해서 스크립트를 실행시키면 된다.

다만 사용할 때는 모든 스크립트 엔진이 `Compilable` 인터페이스를 구현하여 컴파일 기능을 제공하는 것이 아닐 수 있기 때문에 앞선 `Invocable` 인터페이스를
사용할 수 있는지 검사한 것처럼 사용 전에 체크하는 과정이 필요하다.

컴파일 결과로 반환되는 `CompiledScript` 클래스 객체는 `ScriptEngine`과 동일하게 `eval` 메서드를 가지고 있다. 하지만 차이점이라면 내부 코드를
보면 알 수 있듯이, 스크립트를 파싱해서 중간 코드로 변환/컴파일하는 과정이 없다.

그럼 **실제 실행 속도는 어떻게 차이날까?** 아래 결과에서 볼 수 있듯이 꽤 많은 차이가 난다.

```bash
script: 5734 ms
compiled script: 108 ms
```

<br><br>

# 이어지는 글에서는
지금까지 자바에서 자바스크립트 코드를 실행할 수 있는 `Java Scripting API`에 대해서 알아보았다.
다음 이어지는 글을 통해서 자바 버전 11부터 Deprecated된 `Nashorn` 스크립트 엔진을 대응할 수 있는 방법에 대해서 확인해보자.

- 이어지는 글: <a href="/post/call-javascript-function-from-java-using-graalvm">"Java Scripting API: GraalVM 사용해보기"</a>

예제에서 사용한 전체 소스 코드는 <a href="https://github.com/madplay/java-scripting-api" target="_blank">github 저장소 (링크)</a>를
참조하면 됩니다.