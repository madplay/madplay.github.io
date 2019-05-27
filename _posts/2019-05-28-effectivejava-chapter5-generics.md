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

로(raw) 타입이란 제네릭 타입에서 타입 매개 변수를 전혀 사용하지 않은 타입을 말한다. 현재로서는 제네릭 이전의 코드와 호환하기 위해서 사용될 뿐, 런타임 시점에 오류를 발생할 소지가 많다.

- <a href="/post/dont-use-raw-types">더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 26. 로 타입은 사용하지 말라</a>

<div class="post_caption">로 타입을 사용하지 말자. 오직 하위 버전과 호환하기 위해서 남아있다.</div>

<br/>

# 아이템 27. 비검사 경고를 제거하라
> Eliminate unchecked warnings

비검사 경고(unchecked warnings)를 제거하면 런타임에 형변환 예외(ClassCastException)이 발생할 일이 없고, 코드의 올바른 동작을 기대할 수 있다.

만일 경고를 제거할 수 없지만 타입이 안전하다고 확신할 수 있다면 ```@SuppressWarnings("unchecked")``` 어노테이션을 붙여 경고를 숨기자. 리턴 문장을 제외한 개별 지역변수 선언부터 클래스 전체까지 어떤 선언에도 달 수 있지만, 가능한 좁은 범위에 적용해야 한다. 이 때는 경고를 **무시해도 안전한 이유를 주석으로** 같이 남겨두도록 하자.

<div class="post_caption">할 수 있는 한 모든 비검사 경고를 모두 제거하자.</div>

<br/>

# 아이템 28. 배열보다는 리스트를 사용하라
> Prefer lists to arrays

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
