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