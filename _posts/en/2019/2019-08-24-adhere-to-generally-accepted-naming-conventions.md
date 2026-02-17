---
layout:   post
title:    "[Effective Java 3rd Edition] Item 68. Adhere to Generally Accepted Naming Conventions"
author:   madplay
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 68. Adhere to generally accepted naming conventions"
category: Java/Kotlin
date: "2019-08-24 23:19:31"
comments: true
slug:     adhere-to-generally-accepted-naming-conventions
lang:     en
permalink: /en/post/adhere-to-generally-accepted-naming-conventions
---

# Java naming conventions
Java naming conventions are well defined. They fall into two categories: spelling and grammar. For details, see the link below.

- <a href="https://docs.oracle.com/javase/specs/jls/se9/html/jls-6.html#jls-6.1" target="_blank" rel="nofollow">
Link: Java Language Specification (JLS) 6.1</a>

<br/>

# Spelling rules
These rules apply to package, class, interface, method, field, and type variable names. Follow them unless you have a compelling reason not to. Violations complicate maintenance and increase the chance of misunderstanding.

## Packages, modules
- Use dot-separated hierarchies.
  - Example: `java.util.function`
- Use lowercase letters or digits for each element.
- For externally visible packages, reverse the organization’s internet domain name.
  - `com.madplay.madlife`
- Use short words, typically eight letters or fewer.
  - Use a meaningful abbreviation like `util` instead of `utilities`.

## Classes, interfaces
- Use one or more words.
- Use PascalCase; capitalize the first letter of each word.
  - `ToIntBiFunction`
- Avoid abbreviations unless they are standard (e.g., max, min).
- For acronyms, capitalize only the first letter when possible.
  - `HttpUrl` is more readable than `HTTPURL`.

## Methods, fields
- Use camelCase; the first letter is lowercase and each subsequent word starts with uppercase.
  - `requireNonNull`
- If the first word is an acronym, keep it lowercase.
- Constants are an exception: use all caps with underscores.
  - `MAX_ID_NUM`

## Local variables
- Abbreviations are acceptable when the context makes the meaning clear.
  - Example: loop variable `i`.

## Type parameters
- Usually a single letter.
- `T`: arbitrary type
- `E`: collection element type
- `K`: map key
- `V`: map value
- `X`: exception
- `R`: return type
- `T, U, V`, `T1, T2, T3`: a sequence of arbitrary types

## Summary examples

| Identifier type | Examples |
|:--|:--|
| Package, module | org.junit.jupiter.api, com.google.common.collect |
| Class, interface | Stream, FutureTask, HttpClient |
| Method, field | remove, groupingBy |
| Constant field | MIN_VALUE, MAX_VALUE |
| Local variable | i, denom, houseNum |
| Type parameter | T, E, K, V, X, R, U, V, T1, T2 |


<br/><br/>

# Grammar rules
## Instantiable classes, enums
- Use singular nouns or noun phrases.
  - `Thread`, `PriorityQueue`

## Non-instantiable classes
- Use plural nouns.
  - `Collectors`, `Collections`

## Interfaces
- Same as classes.
  - `Collection`, `Comparator`
- Use adjectives ending with `able` or `ible`.
  - `Runnable`, `Accessible`

## Annotations
- No strict rule; nouns, verbs, adjectives, and prepositions are all used.
  - `BindingAnnotation`, `Inject`, `Singleton`

## Methods
- Use verbs or verb phrases.
  - `append`, `drawImage`
- If a method returns boolean, start with is or has and end with a noun, noun phrase, or adjective.
  - `isBlank`, `hasSiblings`
- If it returns non-boolean or an instance property, use a noun, noun phrase, or a verb phrase starting with get.
  - `size`, `hashCode`, `getTime`
- If a class provides both getter and setter, `get~` and `set~` are idiomatic.

## Special methods
- Methods that return a different type often use `to~`.
  - `toString`, `toArray`
- Methods that present another view of an object often use `as~`.
  - `asList`, `asType`
- Methods that return primitive values often use `~Value`.
  - `intValue`
- Static factories commonly use `from`, `of`, `valueOf`, `newInstance`, `getType`, and similar forms.

## Fields
- Rules are less strict and less important.
- Boolean fields usually drop the leading word from the boolean accessor.
  - `initialized`, `composite`
- Other fields use nouns or noun phrases.
  - `height`, `digits`, `bodyStyle`
- Local variable names are similar but more relaxed.
