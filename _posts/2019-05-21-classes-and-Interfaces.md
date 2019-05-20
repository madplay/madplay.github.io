---
layout:   post
title:    "[이펙티브 자바 3판] 4장. 클래스와 인터페이스"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter4: Classes and Interfaces"  
category: Java
comments: true
---

<hr/>

# 목록

- <a href="#아이템-15-클래스와-멤버의-접근-권한을-최소화하라">아이템 15. 클래스와 멤버의 접근 권한을 최소화하라</a>
- <a href="#아이템-16-public-클래스에서는-public-필드가-아닌-접근자-메서드를-사용하라">아이템 16. public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라</a>
- <a href="#아이템-17-변경-가능성을-최소화하라">아이템 17. 변경 가능성을 최소화하라</a>
- <a href="#아이템-18-상속보다는-컴포지션을-사용하라">아이템 18. 상속보다는 컴포지션을 사용하라</a>
- <a href="#아이템-19-상속을-고려해-설계하고-문서화하라-그러지-않았다면-상속을-금지하라">아이템 19. 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라</a>
- <a href="#아이템-20-추상-클래스보다는-인터페이스를-우선하라">아이템 20. 추상 클래스보다는 인터페이스를 우선하라</a>
- <a href="#아이템-21-인터페이스는-구현하는-쪽을-생각해-설계하라">아이템 21. 인터페이스는 구현하는 쪽을 생각해 설계하라</a>
- <a href="#아이템-22-인터페이스는-구현하는-쪽을-생각해-설계하라">아이템 22. 인터페이스는 구현하는 쪽을 생각해 설계하라</a>
- <a href="#아이템-23-태그-달린-클래스보다는-클래스-계층구조를-활용하라">아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라</a>
- <a href="#아이템-24-멤버-클래스는-되도록-static으로-만들라">아이템 24. 멤버 클래스는 되도록 static으로 만들라</a>
- <a href="#아이템-25-톱레벨-클래스는-한-파일에-하나만-담으라">아이템 25. 톱레벨 클래스는 한 파일에 하나만 담으라</a>

<br/>

# 아이템 15. 클래스와 멤버의 접근 권한을 최소화하라
> Minimize the accessibility of classes and members

<br/>

# 아이템 16. public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라
> In public classes, use accessor methods, not public fields

<br/>

# 아이템 17. 변경 가능성을 최소화하라
> Minimize mutability

<br/>

# 아이템 18. 상속보다는 컴포지션을 사용하라
> Favor composition over inheritance

<br/>

# 아이템 19. 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라
> Design and document for inheritance or else prohibit it

<br/>

# 아이템 20. 추상 클래스보다는 인터페이스를 우선하라
> Prefer interfaces to abstract classes

<br/>

# 아이템 21. 인터페이스는 구현하는 쪽을 생각해 설계하라
> Design interfaces for posterity

<br/>

# 아이템 22. 인터페이스는 구현하는 쪽을 생각해 설계하라
> Use interfaces only to define types

<br/>

# 아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라
> Prefer class hierarchies to tagged classes

<br/>

# 아이템 24. 멤버 클래스는 되도록 static으로 만들라
> Favor static member classes over nonstatic

<br/>

# 아이템 25. 톱레벨 클래스는 한 파일에 하나만 담으라
> Limit source files to a single top-level class