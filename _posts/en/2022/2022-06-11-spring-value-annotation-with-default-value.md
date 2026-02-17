---
layout:   post
title:    "Set Default Values in Spring @Value Annotation"
author:   madplay
tags:     spring annotation value
description: "What default values can you use with Spring's @Value annotation, and how do you configure them?"
category: Spring
date: "2022-06-11 23:09:43"
comments: true
slug:     spring-value-annotation-with-default-value
lang:     en
permalink: /en/post/spring-value-annotation-with-default-value
---

# Primitive Types
Values such as `int` and `boolean` can be declared with defaults.

```java
@Value("${taeng.test:1}")
private int value;

@Value("${taeng.test:true}")
private boolean value;
```

One important caveat is type casting failure. For example, the following code throws an exception and the application does not start.
`TypeMismatchException: Failed to convert value of type 'java.lang.String' to required type 'int'; nested exception is java.lang.NumberFormatException: For input string: "true"`


```java
@Value("${taeng.test:true}")
private int value;
```

<br>

# String
If no value exists for `taeng.test`, the string `defaultMsg` is used as the default.

```java
@Value("${taeng.test:defaultMsg}")
private String msg;
```

You can also set an empty string as the default value.

```java
@Value("${taeng.test:}")
private String msg;
```

For reference, if you omit `:`, the property must exist. Otherwise an exception occurs.
(`Could not resolve placeholder 'taeng.test' in value "${taeng.test}"`)

<br>

# Array
You can assign default values to arrays as well. Separate items with commas.

```java
@Value("${taeng.test:1,2,3}")
private int[] values;

@Value("${taeng.test:a,b,c}")
private String[] values;
```

<br>

# SpEL (Spring Expression Language)
You can also set defaults in Spring Expression Language (SpEL).
If the `java.home` system property does not exist, the string `hello` is used as the default.

```java
@Value("#{systemProperties['java.home'] ?: 'hello'}")
private String values;
```
