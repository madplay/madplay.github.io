---
layout:   post
title:    "자바의 메인 메서드는 왜 public static을 사용할까?"
author:   Kimtaeng
tags: 	  java main
description: "자바에서 main 메서드의 구조는 왜 public static void main(String[] args) 일까?"
category: Java
comments: true
---

# 왜 그럴까?
우리는 자바에서 메인(main) 메서드를 작성할 때 아래와 같이 `public static void main`을 붙여 작성한다.

`java
public static void main(String[] args) {
    // do something
}
`

왜 이런 구조를 갖게 되었을까? 하나씩 살펴보자.

### public
`public` 접근 지정자 또는 접근 제한자라고 부른다. 접근 지정자 중에서 `public`은 제한없이 어디에서나 사용이 가능하다는
뜻이 된다. 반대로 상속 클래스 등에서만 사용할 수 있는 `protected`와 외부에서 접근 가능한 `private` 등이 있다.

### static
정적이란 뜻이다. 메서드에 붙이게 되면 이 메서드는 정적 메서드임을 나타낸다. `static`으로 선언하게 되는 경우
자바가 컴파일 되는 시점에 정의가 된다. 그리고 static 요소를 static이 아닌 요소에서 호출하는 것은 불가능하다.

특히나 main 메서드처럼 프로그램의 시작점이 되는 요소는 객체를 생성하지 않아도 작업을 수행해야 하기 떄문에 static이어야 한다.

### void
메서드의 반환형이다. `void`는 반환할 것이 없다는 의미가 된다.
단지 해당 메서드가 종료되면 호출한 곳으로 돌아갈 뿐이다.

### main
메서드의 이름이다. C 언어에서도 main 함수가 있듯이 자바에도 있다. 프로그램이 시작되면 가장 먼저 실행된다.

### String[] args
메서드의 매개변수를 나타낸다. 이름이 args인 String 타입의 배열이다. 아래와 같이 자바를 커맨드 라인을 통해 실행할 때,
매개변수를 넘겨줄 수 있다.

```bash
java test.class test1 test2
```

<br/>

## 정리해보자
C언어와 마찬가지로 자바 언어에서도 `main` 메서드가 먼저 실행된다. 그런데 실행되기 위해서는 메모리에 미리 올라가야 한다.
그렇기 때문에 `static`을 선언하여 메모리 할당(new)를 하지 않아도 사용할 수 있게 만든다. 특히나 `main` 메서드는
자바 가상 머신(JVM: Java Virtual Machine)에 의해 호출되기 때문에 반드시 `static`으로 선언되어 미리 로드되어 있어야 한다.