---
layout:   post
title:    "스프링 @Value 어노테이션에 기본값 설정"
author:   Kimtaeng
tags:     spring annotation value
description: "스프링 프레임워크 @Value 어노테이션에 지정할 수 있는 기본값은 무엇이 있으며 어떻게 설정할 수 있을까?"
category: Spring
date: "2022-06-11 23:09:43"
comments: true
---

# 기본형 타입(Primitive Type)
`int`, `boolean` 타입 등의 값이 기본값으로 선언될 수 있다.

```java
@Value("${taeng.test:1}")
private int value;

@Value("${taeng.test:true}")
private boolean value;
```

주의할 점은 타입 캐스팅이 안되는 경우다. 예를 들어서 아래와 같은 코드를 사용하면 다음과 같은 예외가 발생하며 애플리케이션이 구동되지 않는다.
`TypeMismatchException: Failed to convert value of type 'java.lang.String' to required type 'int'; nested exception is java.lang.NumberFormatException: For input string: "true"`


```java
@Value("${taeng.test:true}")
private int value;
```

<br>

# 문자열(String)
`taeng.test` 속성에 해당되는 값이 없는 경우 "defaultMsg" 라는 문자열이 기본값으로 지정된다. 

```java
@Value("${taeng.test:defaultMsg}")
private String msg;
```

아래처럼 공백 값을 기본값으로도 지정할 수 있다.

```java
@Value("${taeng.test:}")
private String msg;
```

참고로 `:`가 없이 사용되는 경우 해당 속성이 반드시 선언돼야 한다. 그렇지 않으면 예외가 발생한다.
(`Could not resolve placeholder 'taeng.test' in value "${taeng.test}"`)

<br>

# 배열(Array)
배열에도 기본값을 지정할 수 있다. 콤마(,)로 구분하면 된다.

```java
@Value("${taeng.test:1,2,3}")
private int[] values;

@Value("${taeng.test:a,b,c}")
private String[] values;
```

<br>

# SpEL(Spring Expression Language)
스프링 표현 언어(Spring Expression Language, SpEL)에도 기본값을 지정할 수 있다.
`java.home` 이라는 시스템 설정 값이 없는 경우 문자열 "hello"가 기본값으로 지정된다.

```java
@Value("#{systemProperties['java.home'] ?: 'hello'}")
private String values;
```
