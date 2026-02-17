---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 9. General Programming"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter9: General Programming"
category: Java/Kotlin
date: "2019-08-14 22:39:53"
comments: true
slug:     effectivejava-chapter9-general-programming
lang:     en
permalink: /en/post/effectivejava-chapter9-general-programming
---

# Table of contents
- <a href="#아이템-57-지역변수의-범위를-최소화하라">Item 57. Minimize the scope of local variables</a>
- <a href="#아이템-58-전통적인-for-문보다는-for-each-문을-사용하라">Item 58. Prefer for-each loops to traditional for loops</a>
- <a href="#아이템-59-라이브러리를-익히고-사용하라">Item 59. Know and use the libraries</a>
- <a href="#아이템-60-정확한-답이-필요하다면-float와-double은-피하라">Item 60. Avoid float and double if exact answers are required</a>
- <a href="#아이템-61-박싱된-기본-타입보다는-기본-타입을-사용하라">Item 61. Prefer primitive types to boxed primitives</a>
- <a href="#아이템-62-다른-타입이-적절하다면-문자열-사용을-피하라">Item 62. Avoid strings where other types are more appropriate</a>
- <a href="#아이템-63-문자열-연결은-느리니-주의하라">Item 63. Beware the performance of string concatenation</a>
- <a href="#아이템-64-객체는-인터페이스를-사용해-참조하라">Item 64. Refer to objects by their interfaces</a>
- <a href="#아이템-65-리플렉션보다는-인터페이스를-사용하라">Item 65. Prefer interfaces to reflection</a>
- <a href="#아이템-66-네이티브-메서드는-신중히-사용하라">Item 66. Use native methods judiciously</a>
- <a href="#아이템-67-최적화는-신중히-하라">Item 67. Optimize judiciously</a>
- <a href="#아이템-68-일반적으로-통용되는-명명-규칙을-따르라">Item 68. Adhere to generally accepted naming conventions</a>

<br>

<a id="아이템-57-지역변수의-범위를-최소화하라"></a>
# Item 57. Minimize the scope of local variables
> Minimize the scope of local variables

## Declare and initialize local variables where you use them
Older coding habits put declarations at the top of a block. Java allows declarations anywhere, so declare variables when you first need them. This reduces scope. Also initialize every local variable when you declare it to avoid confusion.

If you cannot initialize a variable immediately, declare it when you can. `try-catch` is an exception. If you must use the variable outside the `try`, declare it before the `try` and initialize inside the `try`.

## Prefer for loops to while loops
`while` loops often leave variables in scope after the loop ends.

```java
Iterator<Element> i = c.iterator(); // Unnecessary.
while (i.hasNext()) {
    doSomething(i.next());
}
```

`for` loops keep the loop variable inside the loop scope. You can reuse the same variable name in another loop without interference.

```java
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    // Do something with e and i.
}
```

Another way to reduce scope is to keep methods small and focused. When a method does multiple jobs, unrelated code can access variables it should not. Splitting methods by responsibility keeps scopes tight.

<div class="post_caption">Minimizing local variable scope reduces potential bugs.</div>

<br><br>

<a id="아이템-58-전통적인-for-문보다는-for-each-문을-사용하라"></a>
# Item 58. Prefer for-each loops to traditional for loops
> Prefer for-each loops to traditional for loops

You often traverse arrays and collections with `for` loops. The iterator or index variable exists only to reach elements, so it adds noise and can introduce errors.

Prefer the **enhanced for statement** (`for-each`).

- <a href="/post/prefer-foreach-loops-to-traditional-for-loops" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 58. Prefer for-each loops to traditional for loops</a>

<div class="post_caption">For-each loops are clearer, safer, and do not hurt performance.</div>

<br><br>

<a id="아이템-59-라이브러리를-익히고-사용하라"></a>
# Item 59. Know and use the libraries
> Know and use the libraries

## Benefits of standard libraries

- You leverage the expertise of the developers who wrote them.
- You spend less time on non-core work.
- Performance improves continuously without extra effort.
- Features keep expanding as the community drives new releases.
- The code is familiar to more people, so it is easier to read, maintain, and reuse.

## Third-party libraries
Major releases add many features to the standard library. Java developers should be comfortable with `java.lang`, `java.util`, `java.io`, and subpackages. If what you need is missing, look for a reliable third-party library.

<div class="post_caption">Using libraries is often better than writing everything yourself.</div>

<br><br>

<a id="아이템-60-정확한-답이-필요하다면-float와-double은-피하라"></a>
# Item 60. Avoid float and double if exact answers are required
> 60: Avoid float and double if exact answers are required

`float` and `double` are designed for scientific and engineering calculations. They represent a wide range of numbers as fast, precise approximations. Because they cannot represent 0.1 or powers of 10 exactly, they are not suitable for financial calculations.

```java
System.out.println(1.03 - 0.42);
// Expected: 0.61
// Actual: 0.6100000000000001
```

When you need exact answers, use `BigDecimal`, `int`, or `long`.

`BigDecimal` is slower and less convenient than primitives. Use `int` or `long` when possible, but note the range limits and the need to manage the decimal point yourself.

- <a href="/post/the-need-for-bigdecimal-in-java">Reference: BigDecimal in Java: precise decimal representation</a>

If performance is not a priority, use `BigDecimal`. If your numbers fit, use `int` or `long`. Use `int` for up to 9 decimal digits, `long` for up to 18, and `BigDecimal` beyond that.

<div class="post_caption">Avoid float and double when you need exact calculations.</div>

<br><br>

<a id="아이템-61-박싱된-기본-타입보다는-기본-타입을-사용하라"></a>
# Item 61. Prefer primitive types to boxed primitives
> Prefer primitive types to boxed primitives

Java types fall into primitives like `int`, `double`, and `boolean`, and reference types like `String` and `List`. Each primitive has a boxed counterpart such as `Integer`, `Double`, and `Boolean`.

Autoboxing and unboxing make them easy to mix, but there are important differences.

First, primitives have values only, while boxed types have values and identity. Two boxed instances can have the same value but still be distinct objects. Second, primitives always have a valid value, while boxed types can be `null`. Third, primitives are generally faster and more memory-efficient.

## Problem 1: incorrect comparison
```java
Comparator<Integer> naturalOrder = (i, j) -> (i < j) ? -1 : (i == j ? 0 : 1);

// What does this return?
naturalOrder.compare(new Integer(42), new Integer(42));
```

This comparator uses `==` on boxed primitives, which compares identity. It returns 1.

## Problem 2: runtime error
```java
public class Unbelievable {
    static Integer i;

    public static void main(String[] args) {
      if (i == 42) {
        System.out.println("Hello!");
      }
    }
}
```

This prints nothing and throws `NullPointerException` because `i` is `null`. When you mix primitives and boxed types, Java unboxes the boxed value. The fix is to declare `i` as `int`.

## Problem 3: performance regression
```java
private static long sum() {
    Long sum = 0L;
    for (long i = 0; i <= Integer.MAX_VALUE; i++>) {
      sum += i;
    }
    return sum;
}
```

Boxing and unboxing inside the loop slows performance significantly.

## When to use boxed primitives
Use boxed primitives as collection elements, keys, or values because collections cannot store primitives. Use them as type parameters for generics and when invoking methods via reflection.

<div class="post_caption">Be deliberate when you use boxed primitives.</div>

<br><br>

<a id="아이템-62-다른-타입이-적절하다면-문자열-사용을-피하라"></a>
# Item 62. Avoid strings where other types are more appropriate
> Avoid strings where other types are more appropriate

Strings are easy to use, so they are often misused.

- <a href="/post/avoid-strings-where-other-types-are-more-appropriate" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 62. Avoid strings where other types are more appropriate</a>

<div class="post_caption">Misused strings are slow, error-prone, and cumbersome.</div>

<br><br>

<a id="아이템-63-문자열-연결은-느리니-주의하라"></a>
# Item 63. Beware the performance of string concatenation
> Beware the performance of string concatenation

Concatenating `n` strings takes time proportional to $${ n }^{ 2 }$$. Strings are immutable, so each concatenation copies both sides, which is expensive.

- <a href="/post/difference-between-string-stringbuilder-and-stringbuffer-in-java" target="_blank">
Reference: String vs. StringBuilder vs. StringBuffer</a>

<div class="post_caption">Use StringBuilder for many concatenations.</div>

<br><br>

<a id="아이템-64-객체는-인터페이스를-사용해-참조하라"></a>
# Item 64. Refer to objects by their interfaces
> Refer to objects by their interfaces

If a suitable interface exists, declare parameters, return values, variables, and fields using that interface type.

```java
// Good: interface type
Set<Fruit> fruitSet = new LinkedHashSet<>();

// Bad: concrete class type
LinkedHashSet<Fruit> fruitSet = new LinkedHashSet<>();
```

Interface types let you swap implementations later for performance or features. For example, switching from `HashMap` to `EnumMap` improves speed and iteration order. But `EnumMap` works only when keys are enums, so a general alternative is `LinkedHashMap`.

If the implementation adds special behavior beyond the interface contract, be careful. Code that assumes ordering with `LinkedHashSet` can break if you replace it with `HashSet`.

**If no suitable interface exists, use a class type.** Value classes like `String` and `BigInteger` are examples. Objects provided by class-based frameworks (for example, classes in `java.io`) also require class types. So do classes like `PriorityQueue` that expose special methods not present in interfaces.

<div class="post_caption">Prefer interface types when possible.</div>

<br><br>

<a id="아이템-65-리플렉션보다는-인터페이스를-사용하라"></a>
# Item 65. Prefer interfaces to reflection
> Prefer interfaces to reflection

Java reflection lets you access arbitrary classes at runtime.

- <a href="/post/java-reflection" target="_blank">Reference: Java Reflection and dynamic loading</a>

Reflection is powerful, but it has major downsides. It bypasses compile-time checks, increases runtime failures, makes code verbose and hard to read, and reduces performance. The author reports a 11x slowdown in experiments.

If you are unsure whether to use reflection, you probably should not. If you do use it, limit it. Use reflection only for instance creation, then refer to the instance through an interface or superclass.

Reflection is appropriate when you must deal with classes, methods, or fields that may not exist at runtime. This is useful when supporting multiple versions of external packages. Compile against the oldest supported version and access newer APIs via reflection, accepting that they may not exist at runtime.

<div class="post_caption">Reflection is powerful but full of tradeoffs.</div>

<br><br>

<a id="아이템-66-네이티브-메서드는-신중히-사용하라"></a>
# Item 66. Use native methods judiciously
> Use native methods judiciously

The Java Native Interface (JNI) allows Java programs to call native methods. A native method is written in a native programming language.

- <a href="/post/use-native-methods-judiciously" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 66. Use native methods judiciously</a>

<div class="post_caption">If you must use native methods, use the minimum necessary.</div>

<br><br>

<a id="아이템-67-최적화는-신중히-하라"></a>
# Item 67. Optimize judiciously
> Optimize judiciously

## Write good programs, not just fast programs
Do not sacrifice solid structure for performance. Good programs outlast fast hacks. Consider performance at design time, because architectural flaws can limit performance and may require a rewrite to fix.

## Avoid designs that limit performance
The hardest design decisions to change after release are how components communicate with each other and with external systems. These choices often limit performance and can be difficult or impossible to change later.

## Consider performance impact when you design APIs
If public methods allow internal data modification, you force defensive copies. If you choose inheritance instead of composition, you lock yourself into a superclass and inherit its performance characteristics, making it difficult to adopt faster implementations later.

## Measure before and after each optimization
Profiling tools show where to focus optimization work. Start by examining your algorithms.

<div class="post_caption">Optimization requires restraint. Usually, do less of it.</div>

<br><br>

<a id="아이템-68-일반적으로-통용되는-명명-규칙을-따르라"></a>
# Item 68. Adhere to generally accepted naming conventions
> Adhere to generally accepted naming conventions

Make standard naming rules a habit. Java’s naming rules are well defined. If a long-standing local rule conflicts, do not follow it blindly. Use common sense.

- <a href="/post/adhere-to-generally-accepted-naming-conventions" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 68. Adhere to generally accepted naming conventions</a>

<div class="post_caption">Follow standard naming conventions with good judgment.</div>
