---
layout:   post
title:    "[이펙티브 자바 3판] 10장. 예외"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter10: Exceptions"
category: Java
date: "2019-09-03 00:42:12"
comments: true
---

# 목차
- <a href="#아이템-69-예외는-진짜-예외-상황에만-사용하라">아이템 69. 예외는 진짜 예외 상황에만 사용하라</a>
- <a href="#아이템-70-복구할-수-있는-상황에는-검사-예외를-프로그래밍-오류에는-런타임-예외를-사용하라">
아이템 70. 복구할 수 있는 상황에는 검사 예외를, 프로그래밍 오류에는 런타임 예외를 사용하라</a>
- <a href="#아이템-71-필요-없는-검사-예외-사용은-피하라">아이템 71. 필요 없는 검사 예외 사용은 피하라</a>
- <a href="#아이템-72-표준-예외를-사용하라">아이템 72. 표준 예외를 사용하라</a>
- <a href="#아이템-73-추상화-수준에-맞는-예외를-던지라">아이템 73. 추상화 수준에 맞는 예외를 던지라</a>
- <a href="#아이템-74-메서드가-던지는-모든-예외를-문서화하라">아이템 74. 메서드가 던지는 모든 예외를 문서화하라</a>
- <a href="#아이템-75-예외의-상세-메시지에-실패-관련-정보를-담으라">아이템 75. 예외의 상세 메시지에 실패 관련 정보를 담으라</a>
- <a href="#아이템-76-가능한-한-실패-원자적으로-만들라">아이템 76. 가능한 한 실패 원자적으로 만들라</a>
- <a href="#아이템-77-예외를-무시하지-말라">아이템 77. 예외를 무시하지 말라</a>

# 아이템 69. 예외는 진짜 예외 상황에만 사용하라
> Use exceptions only for exceptional conditions

<br/>

# 아이템 70. 복구할 수 있는 상황에는 검사 예외를, 프로그래밍 오류에는 런타임 예외를 사용하라
> Use checked exceptions for recoverable conditions and runtime exceptions for programming errors

<br/>

# 아이템 71. 필요 없는 검사 예외 사용은 피하라
> Avoid unnecessary use of checked exceptions

<br/>

# 아이템 72. 표준 예외를 사용하라
> Favor the use of standard exceptions

<br/>

# 아이템 73. 추상화 수준에 맞는 예외를 던지라
> Throw exceptions appropriate to the abstraction

<br/>

# 아이템 74. 메서드가 던지는 모든 예외를 문서화하라
> Document all exceptions thrown by each method

<br/>

# 아이템 75. 예외의 상세 메시지에 실패 관련 정보를 담으라
> Include failure-capture information in detail messages

<br/>

# 아이템 76. 가능한 한 실패 원자적으로 만들라
> Strive for failure atomicity

<br/>

# 아이템 77. 예외를 무시하지 말라
> Don’t ignore exceptions