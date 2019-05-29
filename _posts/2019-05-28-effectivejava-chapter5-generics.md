---
layout:   post
title:    "[이펙티브 자바 3판] 5장. 제네릭"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter5: Generics"  
category: Java
date: "2019-05-28 01:33:05"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-26-로-타입은-사용하지-말라">아이템 26. 로 타입은 사용하지 말라</a>
- <a href="#아이템-27-비검사-경고를-제거하라">아이템 27. 비검사 경고를 제거하라</a>
- <a href="#아이템-28-배열보다는-리스트를-사용하라">아이템 28. 배열보다는 리스트를 사용하라</a>
- <a href="#아이템-29-이왕이면-제네릭-타입으로-만들라">아이템 29. 이왕이면 제네릭 타입으로 만들라</a>
- <a href="#아이템-30-이왕이면-제네릭-메서드로-만들라">아이템 30. 이왕이면 제네릭 메서드로 만들라</a>
- <a href="#아이템-31-한정적-와일드카드를-사용해-api-유연성을-높이라">아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라</a>
- <a herf="#아이템-32-제네릭과-가변인수를-함께-쓸-때는-신중하라">아이템 32. 제네릭과 가변인수를 함께 쓸 때는 신중하라</a>
- <a href="#아이템-33-타입-안전-이종-컨테이너를-고려하라">아이템 33. 타입 안전 이종 컨테이너를 고려하라</a>


<br/>

# 아이템 26. 로 타입은 사용하지 말라
> Don’t use raw types

로(raw) 타입이란 제네릭 타입에서 타입 매개 변수를 전혀 사용하지 않은 타입을 말한다. 현재로서는 제네릭 이전의 코드와 호환하기 위해서 사용될 뿐,
런타임 시점에 오류를 발생할 소지가 많다.

- <a href="/post/dont-use-raw-types">더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 26. 로 타입은 사용하지 말라</a>

<div class="post_caption">로 타입을 사용하지 말자. 오직 하위 버전과 호환하기 위해서 남아있다.</div>

<br/>

# 아이템 27. 비검사 경고를 제거하라
> Eliminate unchecked warnings

비검사 경고(unchecked warnings)를 제거하면 런타임에 형변환 관련 예외(ClassCastException)가 발생할 일이 없으며
코드의 올바른 동작도 기대할 수 있게 된다.

만일 경고를 제거할 수 없지만 타입이 안전하다고 확신할 수 있다면 ```@SuppressWarnings("unchecked")``` 어노테이션을 붙여 경고를 숨기자.
리턴 문장을 제외한 개별 지역변수 선언부터 클래스 전체까지 어떤 선언에도 달 수 있지만, 가능한 좁은 범위에 적용해야 한다.
이 때는 경고를 **무시해도 안전한 이유를 주석으로** 같이 남겨두도록 하자.

<div class="post_caption">할 수 있는 한 모든 비검사 경고를 모두 제거하자.</div>

<br/>

# 아이템 28. 배열보다는 리스트를 사용하라
> Prefer lists to arrays

## 배열 vs 제네릭

**배열은 공변(covariant)이다.** 즉, ```Sub``` 클래스가 ```Super``` 라는 클래스의 하위 타입이라면,
배열 ```Sub[]```은 배열 ```Super[]```의 하위 타입이 된다. 이것을 공변이라고 한다. 하지만 **제네릭 불공변(invariant)이다.**
서로 다른 Type1과 Type2가 있을 때, ```List<Type1>```은 ```List<Type2>```의 상위 타입도 하위 타입도 아니다.

<pre class="line-numbers"><code class="language-java" data-start="1">Object[] objectArray = new Long[1];
objectArray[0] = "들어갈 수 있나?"; // 컴파일은 되지만, 런타임 시에 오류가 발생한다.

List&lt;Object> objectList = new ArrayList&lt;Long>();
objectList.add("타입이 달라서 들어갈 수 없다"); // 컴파일조차 되지 않는다.
</code></pre>

배열에서는 위와 같은 실수를 실행 중에 알 수 있지만, 리스트는 코드를 실행하기 전에 알 수 있다. 즉, 오류가 발생하기 전에 미리 알 수 있기 때문에
더 안전하다. 또한 **배열은 실체화(reify) 된다.** 그러니까 런타임에도 원소의 타입을 인지하고 확인한다. 위의 예제에서 Long 타입 배열에
문자열을 넣을 때 예외가 발생한 것처럼 말이다. 하지만 **제네릭은 런타임 시에 타입이 소거(erasure) 된다.** 타입 정보를 컴파일 시점에만
인지하는 것인데, 이는 제네릭 지원 전의 레거시 코드와 함께 사용하기 위함이다.

이처럼 배열과 제네릭은 쉽게 친해지지 못한다. 아래와 같이 배열을 선언하면 컴파일 오류가 발생한다.

<pre class="line-numbers"><code class="language-java" data-start="1">new List&lt;E>[]; // 제네릭 타입의 배열
new List&lt;String>[]; // 매개변수화 타입
new E[]; // 타입 매개변수
</code></pre>

## 왜 제네릭 배열을 생성하지 못할까?

타입 안전(type-safe) 하지 않다는 것을 생각할 수 있다. 만일, 제네릭 배열을 생성할 수 있게 되면 어떤 일이 발생할 수 있을까?

<pre class="line-numbers"><code class="language-java" data-start="1">// 원래는 1번부터 오류가 발생하지만, 가정해보자
List&lt;String>[] stringLists = new List&lt;String>[1];   // (1) 제네릭 배열이 허용된다고 하자.
List&lt;Integer> intList = List.of(42);                // (2) List.of: java 9 문법
Object[] objects = stringLists;                     // (3)
objects[0] = intList;                               // (4)
String s = stringLists[0].get(0);                   // (5)
</code></pre>

- (2)에서는 원소가 하나인 리스트를 생성했다.
- (3)에서는 (1)을 Object[]에 할당한다. 배열은 공변이므로 아무런 문제가 없다.
- (4)에서는 (2)에서 생성한 인스턴스를 Object 배열의 첫 번째 원소로 저장한다.
  - 제네릭의 소거 특성으로 인해 런타임 시에 ```List<Integer>```는 ```List```, ```List<Integer>[]```는 ```List[]```가 된다.
- (5)가 문제다. (1)에서 ```List<String>```만 담겠다고 했으나, 배열에는 현재 ```List<Integer>```가 담겨있다.
  - 첫 번째 원소를 꺼내어 String으로 형변환할 때 ```ClassCastException```가 발생한다.

이러한 이유를 보았을 때, 제네릭 배열이 생성되지 않도록 사전에 컴파일 오류가 발생되어야 한다.
한편 ```E```, ```List<E>```, ```List<String>```과 같은 타입을 **실체화 불가 타입(non-reifiable type)** 이라고 한다.
제네릭의 소거 특성으로 인해 실체화되지 않아 런타임 시에 컴파일 타임보다 타입 정보를 적게 갖는 타입을 말한다.

<div class="post_caption">배열보다 리스트를 사용하면 컴파일 시점에 오류를 확인할 수 있다.</div>

<br/>

# 아이템 29. 이왕이면 제네릭 타입으로 만들라
> Favor generic types

<br/>

# 아이템 30. 이왕이면 제네릭 메서드로 만들라
> Favor generic methods

<br/>

# 아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라
> Use bounded wildcards to increase API flexibility

<br/>

# 아이템 32. 제네릭과 가변인수를 함께 쓸 때는 신중하라
> Combine generics and varargs judiciously

<br/>

# 아이템 33. 타입 안전 이종 컨테이너를 고려하라
> Consider typesafe heterogeneous containers
