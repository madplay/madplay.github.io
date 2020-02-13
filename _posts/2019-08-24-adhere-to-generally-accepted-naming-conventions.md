---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 68. 일반적으로 통용되는 명명 규칙을 따르라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 68. Adhere to generally accepted naming conventions"
category: Java
date: "2019-08-24 23:19:31"
comments: true
---

# 자바의 명명 규칙
자바는 명명 규칙이 잘 정립되어 있다. 크게 철자와 문법, 두 범주로 나뉜다. 자세한 내용은 아래 링크를 참고하면 된다.

- <a href="https://docs.oracle.com/javase/specs/jls/se9/html/jls-6.html#jls-6.1" target="_blank" rel="nofollow">
링크: 자바 언어 명세(Java Language Specification) 6.1</a>

<br/>

# 철자 규칙
패키지, 클래스, 인터페이스, 메서드, 필드, 타입 변수의 이름을 다룬다. 특별한 이유가 없다면 반드시 따라야한다. 그렇지 않으면 유지보수가 어려워지고
의미를 오해할 수 있어 오류 발생 가능성을 높인다.

## 패키지, 모듈
- 각 요소를 점(.)으로 구분하여 계층으로 짓는다.
  - 예를 들어 `java.util.function`
- 요소들은 모두 소문자 알파벳 또는 숫자로 짓는다.
- 외부에서도 사용될 패키지라면 조직의 인터넷 도메인 이름을 역순으로 한다.
  - `com.madplay.madlife`
- 각 요소는 일반적으로 8글자 이하의 짧은 단어로 짓는다.
  - `utilities` 보다는 의미가 통하는 약어인 `util`로 짓는다.

## 클래스, 인터페이스
- 하나 이상의 단어로 이루어진다.
- Pascal Case로 작성한다. 각 단어의 첫 번째 글자는 대문자이다.
  - `ToIntBiFunction`
- max, min과 같이 널리 통용되는 줄임말이 아니면 단어는 줄여쓰지 않는다.
- 약자(줄임말)의 경우는 첫 글자만 대문자로 하는 경우가 많다.
  - `HttpUrl`과 `HTTPURL`를 비교해보면 전자가 약자의 시작과 끝을 구분하긴 편하다.

## 메서드, 필드
- Camel Case로 작성한다. 첫 글자는 소문자이고 나머지 단어의 첫 글자는 대문자로 작성한다.
  - `requireNonNull`
- 첫 단어가 약자라면 그 단어 전체는 소문자로 작성한다.
- 상수 필드는 예외로 모두 대문자로 작성하며 단어 사이에는 언더바(_)로 구분한다.
  - `MAX_ID_NUM`

## 지역변수
- 약어를 사용해도 좋다. 변수가 사용된 문맥에서 의미를 쉽게 유추할 수 있기 때문이다.
  - 예를 들어 루프변수 `i`가 있다.

## 타입 매개변수
- 보통 한 문자로 표현한다.
- `T`: 임의의 타입, Type
- `E`: 컬렉션 원소의 타입, Element
- `K`: 맵의 키, Key
- `V`: 맵의 값, Value
- `X`: 예외, eXception
- `R`: 메서드의 반환 타입, Return
- `T, U, V`, `T1, T2, T3`: 임의 타입의 시퀀스

## 예시로 정리하면

| 식별자 타입 | 예시 |
|:--|:--|
| 패키지, 모듈 | org.junit.jupiter.api, com.google.common.collect |
| 클래스, 인터페이스 | Stream, FutureTask, HttpClient |
| 메서드, 필드 | remove, groupingBy |
| 상수 필드 | MIN_VALUE, MAX_VALUE |
| 지역변수 | i, denom, houseNum |
| 타입 매개변수 | T, E, K, V, X, R, U, V, T1, T2 |


<br/><br/>

# 문법 규칙
## 객체를 생성할 수 있는 클래스, Enum
- 보통 단수 명사 또는 명사구를 사용한다.
  - `Thread`, `PriorityQueue`

## 객체를 생성할 수 없는 클래스
- 보통 복수형 명사를 사용한다.
  - `Collectors`, `Collections`

## 인터페이스
- 클래스와 동일하다.
  - `Collection`, `Comparator`
- able 또는 ible로 끝나는 형용사를 사용한다.
  - `Runnable`, `Accessible`

## 어노테이션
- 큰 규칙 없이 명사, 동사, 형용사, 전치사가 두루 쓰인다.
  - `BindingAnnotation`, `Inject`, `Singleton`

## 메서드
- 동사나 동사구를 사용한다.
  - `append`, `drawImage`
- boolean을 반환한다면 is나 has로 시작하고 명사, 명사구, 형용사로 끝난다.
  - `isBlank`, `hasSiblings`
- boolean을 반환하지 않거나 인스턴스의 속성을 반환한다면 보통 명사, 명사구 혹은 get으로 시작하는 동사구를 사용한다.
  - `size`, `hashCode`, `getTime`
- 클래스가 한 속성의 getter와 setter를 모두 제공한다면 `get~`, `set~`이 좋다.

## 특별한 메서드
- 타입을 바꿔서 다른 타입의 객체를 반환하는 역할을 한다면 `to~`
  - `toString`, `toArray`
- 객체의 내용을 다른 뷰로 보여주는 메서드는 `as~`
  - `asList`, `asType`
- 객체의 값을 기본형(primitive) 타입으로 반환한다면 `~Value`
  - `intValue`
- 정적 팩터리라면 `from`, `of`, `valueOf`, `newInstance`, `getType` 등을 흔히 사용한다.

## 필드
- 규칙이 덜 명확하고 덜 중요하다.
- boolean 타입의 필드명은 보통 boolean 접근자 메서드에서 앞 단어를 뺀 형태이다.
  - `initialized`, `composite`
- 다른 타입의 필드는 명사, 명사구를 사용한다.
  - `height`, `digits`, `bodyStyle`
- 지역변수 명은 비슷하지만 조금 더 느슨하다.