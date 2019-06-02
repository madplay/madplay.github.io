---
layout:   post
title:    "[이펙티브 자바 3판] 6장. 열거 타입과 애너테이션"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter6: Enums and Annotations"
category: Java
date: "2019-06-03 00:02:55"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-34-int-상수-대신-열거-타입을-사용하라">아이템 34. int 상수 대신 열거 타입을 사용하라</a>
- <a href="#아이템-35-ordinal-메서드-대신-인스턴스-필드를-사용하라">아이템 35. ordinal 메서드 대신 인스턴스 필드를 사용하라</a>
- <a href="#아이템-36-비트-필드-대신-enumset을-사용하라">아이템 36. 비트 필드 대신 EnumSet을 사용하라</a>
- <a href="#아이템-37-ordinal-인덱싱-대신-enummap을-사용하라">아이템 37. ordinal 인덱싱 대신 EnumMap을 사용하라</a>
- <a href="#아이템-38-확장할-수-있는-열거-타입이-필요하면-인터페이스를-사용하라">아이템 38. 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라</a>
- <a href="#아이템-39-명명-패턴보다-애너테이션을-사용하라">아이템 39. 명명 패턴보다 애너테이션을 사용하라</a>
- <a href="#아이템-40-override-애너테이션을-일관되게-사용하라">아이템 40. @Override 애너테이션을 일관되게 사용하라</a>
- <a href="#아이템-41-정의하려는-것이-타입이라면-마커-인터페이스를-사용하라">아이템 41. 정의하려는 것이 타입이라면 마커 인터페이스를 사용하라</a>

<br/>

# 아이템 34. int 상수 대신 열거 타입을 사용하라
> Use enums instead of int constants

<br/>

# 아이템 35. ordinal 메서드 대신 인스턴스 필드를 사용하라
> Use instance fields instead of ordinals

<br/>

# 아이템 36. 비트 필드 대신 EnumSet을 사용하라
> Use EnumSet instead of bit fields

<br/>

# 아이템 37. ordinal 인덱싱 대신 EnumMap을 사용하라
> Use EnumMap instead of ordinal indexing

<br/>

# 아이템 38. 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라
> Emulate extensible enums with interfaces

<br/>

# 아이템 39. 명명 패턴보다 애너테이션을 사용하라
> Prefer annotations to naming patterns

<br/>

# 아이템 40. @Override 애너테이션을 일관되게 사용하라
> Consistently use the Override annotation

<br/>

# 아이템 41. 정의하려는 것이 타입이라면 마커 인터페이스를 사용하라
> Use marker interfaces to define types
