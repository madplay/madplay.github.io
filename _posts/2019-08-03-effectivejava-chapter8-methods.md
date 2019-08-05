---
layout:   post
title:    "[이펙티브 자바 3판] 8장. 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter8: Methods"
category: Java
date: "2019-08-03 02:11:01"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-49-매개변수가-유효한지-검사하라">아이템 49. 매개변수가 유효한지 검사하라</a>
- <a href="#아이템-50-적시에-방어적-복사본을-만들라">아이템 50. 적시에 방어적 복사본을 만들라</a>
- <a href="#아이템-51-메서드-시그니처를-신중히-설계하라">아이템 51. 메서드 시그니처를 신중히 설계하라</a>
- <a href="#아이템-52-다중정의는-신중히-사용하라">아이템 52: 다중정의는 신중히 사용하라</a>
- <a href="#아이템-53-가변인수는-신중히-사용하라">아이템 53. 가변인수는 신중히 사용하라</a>
- <a href="#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라</a>
- <a href="#아이템-55-옵셔널-반환은-신중히-하라">아이템 55. 옵셔널 반환은 신중히 하라</a>
- <a href="#아이템-56-공개된-api-요소에는-항상-문서화-주석을-작성하라">아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라</a>

<br/>


# 아이템 49. 매개변수가 유효한지 검사하라
> Check parameters for validity

매개변수의 유효성 검사는 메서드 몸체가 시작되기 전에 해야 한다. 그리고 매개변수에 대한 제약사항은 문서화가 필요하다.
유효성 검사를 제대로 하지 못하는 경우에는 어떻게 될까? 메서드가 수행되는 중간에 모호한 오류가 발생할 수 있으며
행여나 수행되더라도 잘못된 결과가 반환될 수 있다. 최악의 경우에는 잘 수행되다가 다른 객체의 상태 변경으로 인해
미래의 알 수 없는 시점에 오류가 발생할 수도 있다.

```public```과 ```protected``` 메서드는 매개변수 값이 잘못됐을 때 던지는 예외를 문서화해야 한다. 클래스 수준 주석은
그 클래스의 모든 public 메서드에 적용되므로 훨씬 깔끔하다. ```@Nullable```과 같은 어노테이션을 사용할 수도 있지만 표준은 아니다.
더불어 생성자 매개변수 검사도 클래스 불변식을 어기는 객체가 생성되지 않게 하기 위하여 꼭 필요하다. 

## 유효성 검사 방법

자바 7에 추가된 ```requireNonNull``` 메서드를 이용하면 조금 더 유연한 null 검사가 가능하다.

```java
public void someMethod(Integer val) {
    Integer integer = Objects.requireNonNull(val, "매개변수가 null 이네요?");
    System.out.println(integer);
}
```

위 메서드에 ```null```을 입력하면 아래와 같은 오류가 발생한다.

```bash
Exception in thread "main" java.lang.NullPointerException: 매개변수가 null 이네요?
	at java.base/java.util.Objects.requireNonNull(Objects.java:246)
```

자바 9에서는 Objects에 범위 검사 기능도 가능해졌다. ```checkFromIndexSize```, ```checkFromToIndex```, ```checkIndex``` 라는
메서드인데 null 검사 메서드만큼 유연하지는 않다. 예외 메시지를 지정할 수 없고 리스트와 배열 전용으로 설계됐다.

```java
List<String> list = List.of("a", "b", "c");

// Exception in thread "main" java.lang.IndexOutOfBoundsException: 
//      Index 4 out of bounds for length 3
Objects.checkIndex(4, list.size());
```

private으로 공개되지 않은 메서드라면 개발자가 직접 호출되는 상황을 통제할 수 있다. 이럴 때는 ```assert```를 사용하여
매개변수 유효성을 검사할 수 있다. 실행시에 assert를 수행하려면 인텔리제이 기준으로 VM Options에 ```-ea``` 또는 ```--enableassertions```
를 넘겨주어야 한다. 값을 넘겨주지 않으면 무시된다. 넘어온 매개변수가 조건식을 참으로 만들지 않으면 ```AssertionError```를 던진다.

```java
private void someMethod(int arr[], int length) {
    assert arr != null;
    assert length >= 0 && arr.length == length;

    // do something
}
```

## 유효성 검사가 필요 없는 경우

매개변수에 대한 유효성 검사가 꼭 필요하지 않는 경우도 있다. 유효성을 검사하는 비용이 지나치게 큰 경우 또는 계산 과정에서 암묵적으로
유효성 검사가 진행될 때이다. 예를 들어 ```Collections.sort(List)```처럼 리스트를 정렬할 때는 정렬 과정에서 모든 객체가 상호 비교된다.
만일 비교할 수 없는 타입의 객체가 있으면 ```ClassCastException```이 발생할 것이기 때문에 비교하기에 앞서 모든 원소를 검증하는 것은
불필요한 과정이 된다.

<div class="post_caption">매개변수는 메서드 코드 시작 부분에서 검사하자</div>

<br/>

# 아이템 50. 적시에 방어적 복사본을 만들라
> Make defensive copies when needed

자바는 안전한 언어다. 하지만 클라이언트가 언제든지 불변식을 깨드릴 수 있다고 가정하고 방어적인 프로그래밍을 해야 한다.
클래스가 클라이언트로부터 받거나 클라이언트에게 반환하는 구성 요소가 가변적이라면 그 요소는 반드시 방어적으로 복사해야 한다.

- <a href="/post/make-defensive-copies-when-needed">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라</a>

<div class="post_caption">경우에 따라서 방어적 복사본을 만들어야 한다.</div>

<br/>

# 아이템 51. 메서드 시그니처를 신중히 설계하라
> Design method signatures carefully

<br/>

# 아이템 52: 다중정의는 신중히 사용하라
> Use overloading judiciously

<br/>

# 아이템 53. 가변인수는 신중히 사용하라
> Use varargs judiciously

<br/>

# 아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라
> Return empty collections or arrays, not nulls

<br/>

# 아이템 55. 옵셔널 반환은 신중히 하라
> Return optionals judiciously

<br/>

# 아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라
> Write doc comments for all exposed API elements