---
layout:   post
title:    "[이펙티브 자바 3판] 12장. 직렬화"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter12: Serialization"
category: Java
date: "2019-10-11 00:32:29"
comments: true
---

# 목차
- <a href="#아이템-85-자바-직렬화의-대안을-찾으라">아이템 85. 자바 직렬화의 대안을 찾으라</a>
- <a href="#아이템-86-serializable을-구현할지는-신중히-결정하라">아이템 86. Serializable을 구현할지는 신중히 결정하라</a>
- <a href="#아이템-87-커스텀-직렬화-형태를-고려해보라">아이템 87. 커스텀 직렬화 형태를 고려해보라</a>
- <a href="#아이템-88-readobject-메서드는-방어적으로-작성하라">아이템 88. readObject 메서드는 방어적으로 작성하라</a>
- <a href="#아이템-89-인스턴스-수를-통제해야-한다면-readresolve보다는-열거-타입을-사용하라">
아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라</a>
- <a href="#아이템-90-직렬화된-인스턴스-대신-직렬화-프록시-사용을-검토하라">
아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라</a>

<br>

# 아이템 85. 자바 직렬화의 대안을 찾으라
> Prefer alternatives to Java serialization

<br>

# 아이템 86. Serializable을 구현할지는 신중히 결정하라
> Implement Serializable with great caution

<br>

# 아이템 87. 커스텀 직렬화 형태를 고려해보라
> Consider using a custom serialized form

<br>

# 아이템 88. readObject 메서드는 방어적으로 작성하라
> Write readObject methods defensively

<br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

<br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances