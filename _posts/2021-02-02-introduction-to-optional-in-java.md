---
layout:   post
title:    "자바 Optional: 2. Optional 소개"
author:   Kimtaeng
tags: 	  java optional
description: 자바8 에서 추가된 옵셔널(optional) 클래스는 무엇일까? 
category: Java
date: "2021-02-02 22:51:54"
comments: true
---

# 목차
- <a href="/post/what-is-null-in-java">자바 Optional: 1. null은 무엇인가?</a>
- 자바 Optional: 2. Optional 소개
- <a href="/post/how-to-handle-optional-in-java">자바 Optional: 3. Optional 중간 처리 메서드</a>
- <a href="/post/how-to-return-value-from-optional-in-java">자바 Optional: 4. Optional 종단 처리 메서드</a>
- <a href="/post/java-optional-advanced">자바 Optional: 5. Optional 톺아보기</a>

<br>

# null이 주는 문제
앞선 글에서는 자바 언어에서 `null`의 특징과 함께 잘못된 `null` 참조로 인해 발생하는 문제들에 대해서 알아보았다.
내용을 정리해보면, 런타임에서 `null`을 잘못 참조하는 경우에는 `NullPointerException`이 발생하여 문제가 발생할 수 있고
이를 피하고자 생겨나는 체크 로직으로 인해 코드가 복잡해지는 문제가 있다.

- <a href="/post/what-is-null-in-java">이전글: "자바 Optional: 1. null은 무엇인가?"</a>

사실 `null` 처리를 개선하려는 노력은 `Optional` 클래스 이전에도 있었다. 자바7 의 **"Project Coin"**에서는
안전 호출(safe call)을 위한 엘비스 연산자(elvis operator)가 제안되었으나 결과적으로는 승인되지 않았다.

새로운 안전장치를 적용하는 이점이 도입하는 비용보다 좋지 않았기 때문이겠지만, 제안이 승인되었다면
우리는 자바에서 `null`이 주는 문제들을 아래와 같은 코드로 회피했을지도 모른다.

```java
// 혹시나 이런 코드가 가능하지 않았을까?
public String getPhoneManufacturerName(Person person) {
    // 체이닝 중에서 null이 있다면, "Samsung"을 반환한다.
    return person?.getPhone()?.getManufacturer()?.getName() : "Samsung";
}
```

그렇다면, 보다 나은 `null` 처리를 위해 탄생한 `Optional` 클래스는 무엇일까?

<br>

# Optional 클래스
`java.util.Optional<T>` 클래스는 함수형(Functional) 언어인 스칼라(Scala)와 하스켈(Haskell)의 영향을 받아서 탄생했다.
아마 스칼라의 `Optional`과 하스켈의 `Maybe`의 영향이 아닐까 싶지만, 자바의 `Optional`의 목적은 반환되는 값이 '없음'을
나타내는 것이다. 이는 클래스에 달린 주석을 통해서도 알 수 있는데, API Note 부분에 아래와 같이 개발자의 의도가 명시돼있다.

> Optional is primarily intended for use as a method return type where there is a clear need to represent "no result,"
> and where using null is likely to cause errors. A variable whose type is Optional should never itself be null; it should always point to an Optional instance. <br>
> 
> 옵셔널은 주로 "결과 없음"을 나타낼 필요가 분명하고 `null`을 사용하면 오류가 발생할 가능성이 있는 메서드 리턴 타입으로 사용하기 위한 것이다.
> 옵셔널 타입의 변수는 그 자체가 `null`이면 안 되며 항상 Optional 인스턴스를 가리켜야 한다.

`Optional`은 빗대어 말하면 유리같이 파손되기 쉬운 것을 포장할 때 감싸는 에어캡(일명 뽁뽁이)과 같다. 쉽게 깨져버리는
유리처럼, 잘못 다루면 심각한 오류를 일으킬 수 있는 `null`을 안전하게 다룰 수 있게 해준다.

그럼 이제부터 `Optional`을 사용하는 방법에 대해서 하나씩 알아보자.

<br>

# Optional 객체 선언
`Optional` 클래스의 명세를 보면 알 수 있듯이, 제네릭 타입으로 제공된다.
따라서 선언과 동시에 타입 매개변수를 지정한다. 즉, `Optional`이 감싸는 객체의 타입을 지정한다.

```java
Optional<Person> person; // Person 타입의 `Optional` 변수
Optional<Phone> phone; // phone 타입의 `Optional` 변수
```

<br>

# Optional 객체 생성
`Optional` 객체를 만들기 위한 정적 팩터리 메서드(static factory method)가 제공된다.

## Optional.empty()
비어있는 `Optional` 객체를 생성한다. 내부적으로는 `Optional` 클래스가 가진 싱글턴 인스턴스를 반환하게 된다.
"비어있다" 라는 의미에서 `null`과 비슷하지만, `Optional.empty()`는 참조하더라도 `NullPointerException`과 같은 예외가
발생하지 않는 점이 다르다.

```java
// `Optional` 클래스의 정적 멤버로 선언되어 있음
private static final Optional<?> EMPTY = new Optional<>();

public static<T> Optional<T> empty() {
    Optional<T> t = (Optional<T>) EMPTY;
    return t;
}
```

## Optional.of(T value)
`null`이 아닌 값을 감싸는 `Optional` 객체를 생성한다. 여기서 값이 `null`인 경우 `NullPointerException`이 발생한다.

```java
public static <T> Optional<T> of(T value) {
    return new Optional<>(value);
}
```

## Optional.ofNullable(T value)
`null` 값을 저장할 수 있는 `Optional` 객체를 생성한다. 값이 `null`인 경우 빈 `Optional` 객체를 반환한다.
따라서 인자로 넘겨지는 값이 `null`일지도 모르는 상황에서 사용하면 된다.

```java
public static <T> Optional<T> ofNullable(T value) {
    return value == null ? empty() : of(value);
}
```

<br>

# 객체는 생성했는데, 어떻게 사용하지?
이번글에서는 `Optional` 클래스에 대한 소개와 `Optional` 객체를 생성하는 방법에 대해서 알아보았다.
이어지는 글에서는 `Optional` 객체의 값을 필터링 하거나 다른 형태로 변환시키는 방법에 대해서 소개한다.

- <a href="/post/how-to-handle-optional-in-java">다음글: "자바 Optional: 3. Optional 중간 처리 메서드"</a>