---
layout:   post
title:    "[이펙티브 자바 3판] 9장. 일반적인 프로그래밍 원칙"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter9: General Programming"
category: Java
date: "2019-08-14 22:39:53"
comments: true
---

# 목차
- <a href="#아이템-57-지역변수의-범위를-최소화하라">아이템 57. 지역변수의 범위를 최소화하라</a>
- <a href="#아이템-58-전통적인-for-문보다는-for-each-문을-사용하라">아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라</a>
- <a href="#아이템-59-라이브러리를-익히고-사용하라">아이템 59. 라이브러리를 익히고 사용하라</a>
- <a href="#아이템-60-정확한-답이-필요하다면-float와-double은-피하라">아이템 60. 정확한 답이 필요하다면 float와 double은 피하라</a>
- <a href="#아이템-61-박싱된-기본-타입보다는-기본-타입을-사용하라">아이템 61. 박싱된 기본 타입보다는 기본 타입을 사용하라</a>
- <a href="#아이템-62-다른-타입이-적절하다면-문자열-사용을-피하라">아이템 62. 다른 타입이 적절하다면 문자열 사용을 피하라</a>
- <a href="#아이템-63-문자열-연결은-느리니-주의하라">아이템 63. 문자열 연결은 느리니 주의하라</a>
- <a href="#아이템-64-객체는-인터페이스를-사용해-참조하라">아이템 64. 객체는 인터페이스를 사용해 참조하라</a>
- <a href="#아이템-65-리플렉션보다는-인터페이스를-사용하라">아이템 65. 리플렉션보다는 인터페이스를 사용하라</a>
- <a href="#아이템-66-네이티브-메서드는-신중히-사용하라">아이템 66. 네이티브 메서드는 신중히 사용하라</a>
- <a href="#아이템-67-최적화는-신중히-하라">아이템 67. 최적화는 신중히 하라</a>
- <a href="#아이템-68-일반적으로-통용되는-명명-규칙을-따르라">아이템 68. 일반적으로 통용되는 명명 규칙을 따르라</a>

<br/>

# 아이템 57. 지역변수의 범위를 최소화하라
> Minimize the scope of local variables

## 지역변수는 사용할 때 선언하고 초기화해야 한다.
옛날 방식의 습관으로 코드 블록의 첫 부분에 변수를 선언하는 경우가 많았다. 하지만 자바는 어디에서 선언해도 된다. 그렇기 때문에 처음 사용할 때 선언하면
지역변수의 범위를 줄일 수 있다. 그리고 모든 지역변수는 선언과 함께 초기화해야 초깃값을 헷갈리는 경우가 없다.

아직 지역변수를 초기화할 수 없다면 초기화할 수 있을 때 선언하면 된다. 다만 `try-catch` 문장에서는 예외다. try 블록 밖에서도 변수를 사용해야 한다면
지역변수의 **선언은 try 문장 밖에서** 진행하고 초기화는 **try 문장 안에서** 해야 한다.

## 반복문은 while 보다 for 문을 권장한다.
while 문을 사용하면 반복문 밖으로 불필요한 변수가 선언된다.

```java
Iterator<Element> i = c.iterator(); // 불필요하다.
while (i.hasNext()) {
  doSomething(i.next());
}
```

for 문을 사용하면 반복 변수(loop variable)의 범위가 반복문 내부로 제한된다.
따라서 똑같은 이름의 변수를 여러 반복문에서 사용해도 어떠한 영향이 없다.

```java
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    // e와 i로 무언가 한다.
}
```

지역변수의 범위를 줄일 수 있는 또 다른 방법은 메서드를 작게 유지하고 한 가지 기능에만 집중하면 된다. 여러 가지 기능을 처리하게 되면 다른 기능을 수행하는
코드에서 접근할 가능성이 있다. 메서드를 기능별로 나누면 간단해진다.

<div class="post_caption">지역변수의 범위를 최소화해야 잠재적인 오류를 줄일 수 있다.</div>

<br/>

# 아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라
> Prefer for-each loops to traditional for loops

<br/>

# 아이템 59. 라이브러리를 익히고 사용하라
> Know and use the libraries

<br/>

# 아이템 60. 정확한 답이 필요하다면 float와 double은 피하라
> 60: Avoid float and double if exact answers are required

<br/>

# 아이템 61. 박싱된 기본 타입보다는 기본 타입을 사용하라
> Prefer primitive types to boxed primitives

<br/>

# 아이템 62. 다른 타입이 적절하다면 문자열 사용을 피하라
> Avoid strings where other types are more appropriate

<br/>

# 아이템 63. 문자열 연결은 느리니 주의하라
> Beware the performance of string concatenation

<br/>

# 아이템 64. 객체는 인터페이스를 사용해 참조하라
> Refer to objects by their interfaces

<br/>

# 아이템 65. 리플렉션보다는 인터페이스를 사용하라
> Prefer interfaces to reflection

<br/>

# 아이템 66. 네이티브 메서드는 신중히 사용하라
> Use native methods judiciously

<br/>

# 아이템 67. 최적화는 신중히 하라
> Optimize judiciously

<br/>

# 아이템 68. 일반적으로 통용되는 명명 규칙을 따르라
> Adhere to generally accepted naming conventions