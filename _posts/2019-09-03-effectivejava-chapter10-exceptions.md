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

<br>

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

<br><br>

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

<br><br>

# 아이템 71. 필요 없는 검사 예외 사용은 피하라
> Avoid unnecessary use of checked exceptions

검사 예외는 발생한 문제를 개발자가 처리하여 안전성을 높인다. 따라서 제대로 활용하면 API와 프로그램의 질을 높일 수 있다.
하지만 과하게 사용하는 경우 오히려 사용하기 불편한 API가 될 수 있다.

메서드가 검사 예외를 던질 수 있다고 선언됐다면, 이를 호출하는 곳에서는 그 예외를 붙잡아 처리하거나(catch) 더 바깥으로 던져 전파(throw) 해야 한다.
한편 자바 8에서는 검사 예외를 던지는 메서드를 스트림 안에서 직접 사용할 수도 없다.

그렇다면 **검사 예외와 비검사 예외 중에서 어떤 것을 선택**해야 할까? API를 제대로 사용해도 발생할 수 있거나 개발자가 의미 있는 조치를 할 수 있다면
검사 예외를 사용하는 것이 좋다. 그렇지 않은 경우는 대부분 비검사 예외를 사용하는 게 좋다.

## 검사 예외를 회피하는 방법
이미 다른 검사 예외를 던지는 상황에서 또 다른 검사 예외를 추가할 때는 catch 문 하나만 추가하면 되지만, 새롭게 추가하거나 단 하나의 검사 예외를 던질 때는
고민이 된다. 사용자가 try 블록을 추가해야 하고, 스트림에서도 직접 사용하지 못하게 되기 때문이다. 그러니 검사 예외를 안 던지는 방법도 고민해보자.

### 적절한 결과 타입을 담은 옵셔널
검사 예외를 던지는 대신에 빈 옵셔널을 반환해보는 것이다. 단점이라면 예외가 발생한 이유를 알려주는 부가 정보를 담을 수 없다.

### 검사 예외를 던지는 메서드를 쪼개본다.
```java
// 변경 전
try {
    obj.action(args);
} catch (TheCheckedException e) {
    // 예외 핸들링
}
```

```java
// 변경 후
if (obj.actionPermitted(args)) {
    obj.action(args);
} else {
    // 예외 핸들링
}
```

예외가 던져질지 여부를 boolean 값을 반환하는 메서드를 통해 결정하는 것이다. 조건문이 생기긴 하지만 예외에 대해 조금 더 유연하게 대처할 수 있다.

한편 변경한 코드에서 상태 검사 메서드(actionPemitted)와 상태 의존적 메서드(action) 호출 사이에서 객체의 상태가 변할 수 있기 때문에
외부 동기화 없이 여러 스레드가 동시에 접근하는 경우에서는 위와 같은 리팩토링은 적절하지 않다.

<div class="post_caption">꼭 필요한 곳에서만 검사 예외를 사용하자.</div>

<br><br>

# 아이템 72. 표준 예외를 사용하라
> Favor the use of standard exceptions

예외도 재사용하는 것이 좋다. 예외 클래스의 수가 적을수록 메모리 사용량도 줄고 클래스 적재 시간도 적게 걸리며 다른 사람에게도 읽기 쉽고 익숙하다는 장점이 있다.

### 널리 재사용되는 예외 목록
- `IllegalArgumentException`
  - 허용하지 않는 값이 인수로 건네졌을 때
  - null의 경우는 NullPointerException이 처리
- `IllegalStateException`
  - 객체가 메서드를 수행하기에 적절하지 않은 상태일 때
- `NullPointerException`
  - null을 허용하지 않는 메서드에 null을 건넸을 때
- `IndexOutOfBoundsException`
  - 인덱스가 범위를 넘어섰을 때
- `ConcurrentModificationException`
  - 허용하지 않는 동시 수정이 발견됐을 때
- `UnsupportedOpertionException`
  - 호출한 메서드를 지원하지 않을 때

더 많은 정보를 제공하고 싶은 경우에는 표준 예외를 확장해도 좋다. 하지만 예외는 직렬화할 수 있는데, 직렬화에는 많은 부담이 따르므로 예외를 새로 만들지
않는 것이 권장된다.

<div class="post_caption">자바 라이브러리는 대부분 API에서 쓰기에 충분한 수의 예외를 제공한다.</div>

<br><br>

# 아이템 73. 추상화 수준에 맞는 예외를 던지라
> Throw exceptions appropriate to the abstraction

예를 들어 기사 제목을 가져오는 메서드를 실행했는데, IndexOutOfBoundsException이 발생하면 당황스러울 것이다. 메서드가 저수준 예외를 처리하지 않고
상위로 전파했을 때 종종 일어난다. 이를 피하려면 예외 번역(exception translation) 기법을 사용하면 된다. 상위 계층에서 저수준의 예외를 잡아 자신의
추상화 수준에 맞는 예외로 바꿔 던지는 것을 말한다.

```java
try {
    // 저수준 추상화를 이용한다.
} catch (LowerLevelException e) {
    // 추상화 수준에 맞게 번역한다.
    throw new HigherLevelException(...);
}
```

여기서 저수준의 예외가 디버깅에 도움된다면 원인을 고수준 예외에 실어 보낸다. 이를 예외 연쇄(exception chaining)이라고 한다.

```java
try {
    // 저수준 추상화를 이용한다.
} catch (LowerLevelException e) {
    // 저수준 예외를 고수준 예외에 실어 보낸다.
    throw new HigherLevelException(e);
}
```

무턱대고 예외를 전파하는 것보다 예외 번역이 더 좋지만 남용하는 것은 좋지 않다. 가능하다면 저수준 메서드가 반드시 성공하도록 해야 한다.
따라서 저수준에서 오류가 발생하지 않도록 상위에서 매개변수 값을 미리 검사하는 것도 방법이다. 차선책으로 아래 계층에서의 예외를 피할 수 없다면
로깅을 하고 API 호출자에게까지 문제를 전파하지 않는 방법도 있다. 사용자에게 문제를 전파하지 않으면서도 개발자가 로그를 분석할 수 있게 하는 것이다.

<div class="post_caption">예외 번역과 예외 연쇄를 적절하게 이용하자.</div>

<br><br>

# 아이템 74. 메서드가 던지는 모든 예외를 문서화하라
> Document all exceptions thrown by each method

메서드가 던지는 예외는 그 메서드를 올바르게 사용하게 하는 중요한 정보다. 따라서 문서화하는데 충분한 시간을 써야 한다.

- <a href="/post/document-all-exceptions-thrown-by-each-method" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 74. 메서드가 던지는 모든 예외를 문서화하라</a>

<div class="post_caption">메서드가 던질 가능성이 있는 모든 예외는 문서화하자.</div>

<br><br>

# 아이템 75. 예외의 상세 메시지에 실패 관련 정보를 담으라
> Include failure-capture information in detail messages

예외를 잡지 못하여 프로그램이 실패하면 시스템에서 자동으로 스택 추적(stack trace) 정보를 출력해준다. 이때 출력되는 문자열은 `Throwable` 클래스의
toString 메서드에서 반환하는 클래스 이름과 상세 메시지이다.

```java
public String toString() {
    String s = getClass().getName();
    String message = getLocalizedMessage();
    return (message != null) ? (s + ": " + message) : s;
}
```

실패 순간을 적절히 포착하려면 발생한 예외예 관여된 모든 매개변수와 필드의 값을 실패 메시지에 담아야 한다. 예를 들어, IndexOutOfBoundsException 이라면
범위의 최솟값, 최댓값 그리고 범위를 벗어난 인덱스의 값을 담아야 한다.

하지만 주의할 점도 있다. 관련 데이터를 모두 담아야 하지만 장황할 필요는 없듯이 실패 원인을 분석할 때 도움이 되는 정보만을 담아야 한다.
또한 보안과 관련한 정보는 포함해서는 안된다. 상세 메시지에 비밀번호나 암호화 키 같은 정보까지 담을 필요는 없다.

<div class="post_caption">예외를 메시지를 보고 실패 원인을 알 수 있어야 한다.</div>

<br><br>

# 아이템 76. 가능한 한 실패 원자적으로 만들라
> Strive for failure atomicity

실패 원자적이란 호출한 메서드가 실패해도 호출 전 상태를 유지하는 것을 말한다. 가능하다면 실패 원자성을 지키는 것이 중요하다.

- <a href="/post/strive-for-failure-atomicity" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 76. 가능한 한 실패 원자적으로 만들라</a>

<div class="post_caption">메서드가 실패해도 가능하면 해당 객체는 호출 전 상태를 유지해야 한다.</div>

<br><br>

# 아이템 77. 예외를 무시하지 말라
> Don’t ignore exceptions

예외가 선언된 API는 그 메서드를 사용할 때 적절한 조치를 해야 한다는 뜻이다. 따라서 catch 블록을 비워두면 예외가 존재할 이유가 없다.

```java
try {
    ...
} catch (SomeException e) { }
```

물론 예외를 무시해야 할 때도 있다. 예를 들어 `FileInputStream`을 닫을 때 그렇다. 파일의 상태를 변경하지 않았으니 복구할 것도 없고,
스트림을 닫는 것은 필요한 내용은 모두 다 읽었다는 뜻이기 때문이다.

그래도 예외를 무시하기로 했다면 `catch` 블록 안에서 그렇게 결정한 이유를 주석으로 남기고 예외 변수의 이름도 변경하자.

```java
try {
    ...
} catch (SomeException ignored) {
    // 변수 이름은 ignored 등으로 바꾸고,
    // 예외를 무시하되 관련 로그를 남겨둔다.
}
```

<div class="post_caption">catch 블록을 비워두면 예외가 존재할 이유가 없다.</div>