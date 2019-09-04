---
layout:   post
title:    "[이펙티브 자바 3판] 10장. 예외"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter10: Exceptions"
category: Java
date: "2019-09-03 00:42:12"
comments: true
---

# 목차
- <a href="#아이템-69-예외는-진짜-예외-상황에만-사용하라">아이템 69. 예외는 진짜 예외 상황에만 사용하라</a>
- <a href="#아이템-70-복구할-수-있는-상황에는-검사-예외를-프로그래밍-오류에는-런타임-예외를-사용하라">
아이템 70. 복구할 수 있는 상황에는 검사 예외를, 프로그래밍 오류에는 런타임 예외를 사용하라</a>
- <a href="#아이템-71-필요-없는-검사-예외-사용은-피하라">아이템 71. 필요 없는 검사 예외 사용은 피하라</a>
- <a href="#아이템-72-표준-예외를-사용하라">아이템 72. 표준 예외를 사용하라</a>
- <a href="#아이템-73-추상화-수준에-맞는-예외를-던지라">아이템 73. 추상화 수준에 맞는 예외를 던지라</a>
- <a href="#아이템-74-메서드가-던지는-모든-예외를-문서화하라">아이템 74. 메서드가 던지는 모든 예외를 문서화하라</a>
- <a href="#아이템-75-예외의-상세-메시지에-실패-관련-정보를-담으라">아이템 75. 예외의 상세 메시지에 실패 관련 정보를 담으라</a>
- <a href="#아이템-76-가능한-한-실패-원자적으로-만들라">아이템 76. 가능한 한 실패 원자적으로 만들라</a>
- <a href="#아이템-77-예외를-무시하지-말라">아이템 77. 예외를 무시하지 말라</a>

# 아이템 69. 예외는 진짜 예외 상황에만 사용하라
> Use exceptions only for exceptional conditions

예외를 잘못 사용하는 경우를 만날 수 있다. 아래는 예외를 사용하여 루프를 종료시키도록 한 코드이다.
배열의 마지막 인덱스를 넘는 경우 무한 루프를 종료시키는 의도인데, 이렇게 작성하면 안 된다.

```java
try {
    int i = 0;
    while(true)
        range[i++].climb();
} catch (ArrayIndexOutOfBoundsException e) {

}
```

JVM 동작에 대한 이해 부족으로 인한 잘못된 추론의 결과다. 예외는 예외 상황에 사용할 용도로 설계되었기 때문에 JVM 구현자 입장에서 최적화에 별로 신경 쓰지
않았을 가능성이 크다. 또한 코드가 `try-catch` 블록 안에 들어가면 JVM이 적용할 수 있는 최적화 범위가 제한된다. 위와 같은 코드는 아래처럼 작성해야 한다.

```java
for (Mountain m : range)
    m.climb();
```

따라서 예외는 반드시 예외 상황에서만 사용하며 일상적인 제어 흐름용으로 사용해서는 안 된다. 잘 설계된 API라면 클라이언트가 정상적인 제어 흐름에서 예외를
사용할 일이 없어야 한다. 이를 위해서 상태 검사 메서드를 제공하거나 옵셔널 또는 특정 값을 반환하도록 하면 된다. 

> 예를 들어 `Iterable` 인터페이스에서 상태 검사 메서드는 `hashNext`, 상태 의존적 메서드는 `next`

- 외부 동기화 없이 여러 스레드가 동시 접근하는 경우 옵셔널이나 특정 값을 사용한다. 상태 검사 메서드와 상태 의존적 메서드의 호출 사이에서
객체의 상태가 변할 수 있기 때문이다.
- 성능이 중요한 상황에서 상태 검사 메서드가 상태 의존전 메서드의 작업 일부를 중복 수행한다면 옵셔널이나 특정 값을 선택한다.
- 그 외의 경우에는 상태 검사 메서드 방식이 조금 더 낫다. 가독성이 조금 더 좋고, 잘못 사용했을 때 발견하기 쉽다. 상태 검사 메서드 호출을 잊었다면,
상태 의존적 메서드가 예외를 던져 버그 찾기가 수월할 것이다.

<div class="post_caption">예외는 예외 상황에서 사용될 의도로 설계되었다.</div>

<br/>

# 아이템 70. 복구할 수 있는 상황에는 검사 예외를, 프로그래밍 오류에는 런타임 예외를 사용하라
> Use checked exceptions for recoverable conditions and runtime exceptions for programming errors

**검사 예외(Checked Exception)**와 **비검사 예외(Unchecked Exception)**를 구분하는 기본 규칙은 간단하다. 호출하는 쪽에서 복구할 것이라 여겨지면
검사 예외를 사용하면 된다. 검사 예외를 던지면 `try-catch`로 처리하거나 `throw`를 이용하여 더 바깥으로 전파하도록 강제하게 된다.
따라서 메서드를 호출했을 때 발생할 수 있는 유력한 결과임을 API 사용자에게 알려주는 것이다.

비검사 예외는 런타임 에러와 에러가 있다. 프로그램에서 잡을 필요가 없거나 잡아도 득보다 실이 많은 경우다. 아예 복구가 불가능할 수도 있다.

- <a href="/post/java-checked-unchecked-exceptions" target="_blank">
참고 링크: "자바 예외 구분: Checked Exception, Unchecked Exception"</a>

한편 `throwable`을 직접 구현할 수 있는데, Exception, RuntimeException, Error 클래스를 상속하지 않는 구현은 정상적인 검사 예외보다 나은 것도
없고 API 사용자에게 혼동을 줄 수 있어 권장되지 않는다. 끝으로 throwable 클래스는 JVM이나 릴리스에 따라 포맷이 달라질 수 있어 오류 메시지 포맷을 상세하게
기술하지 않는다.

<div class="post_caption">복구할 수 있다면 검사 예외, 프로그래밍 오류는 비검사 예외를 던지자.</div>

<br/>

# 아이템 71. 필요 없는 검사 예외 사용은 피하라
> Avoid unnecessary use of checked exceptions

<br/>

# 아이템 72. 표준 예외를 사용하라
> Favor the use of standard exceptions

<br/>

# 아이템 73. 추상화 수준에 맞는 예외를 던지라
> Throw exceptions appropriate to the abstraction

<br/>

# 아이템 74. 메서드가 던지는 모든 예외를 문서화하라
> Document all exceptions thrown by each method

<br/>

# 아이템 75. 예외의 상세 메시지에 실패 관련 정보를 담으라
> Include failure-capture information in detail messages

<br/>

# 아이템 76. 가능한 한 실패 원자적으로 만들라
> Strive for failure atomicity

<br/>

# 아이템 77. 예외를 무시하지 말라
> Don’t ignore exceptions