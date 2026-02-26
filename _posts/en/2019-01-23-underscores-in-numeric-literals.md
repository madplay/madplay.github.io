---
layout:   post
title:    Numeric Literals and Underscores in Java
author:   madplay
tags: 	  java
description: Since Java 7, you can use underscores in numeric literals to improve readability.
category: Java/Kotlin
comments: true
slug:     underscores-in-numeric-literals
lang:     en
permalink: /en/post/underscores-in-numeric-literals
---

# Numeric Literals in Java

Java’s numeric literals are not unusual compared to other languages.
You add a suffix like `2.4F` to force a `float`, and you add `L` to make an integer literal a `long`.

```java
public class TestClass {
    public void someMethod() {
        // int: -2147483648 ~ 2147483647

        // compile error: integer number too large
        long value1 = 2147483648;

        // okay
        long value2 = 2147483648L;
    }
}
```

The `int` range is `-2147483648 ~ 2147483647`. Anything beyond that overflows.
For reference, `long` is `-9223372036854775808 ~ 9223372036854775807`.

In the code above, `value1` is a `long`, but the literal is still an `int`.
That is why it fails. Add the `L` suffix to make it a `long` literal.

<br/>

# Large Numbers Are Hard to Read

Since Java 7, numeric literals can include underscores `_` to improve readability.
You can group digits like a thousands separator.

```java
public void someMethod() {
    // much easier to read
    long valueWithUnderscore = 2_147_483_648L;
}
```

However, underscores are only allowed **between digits**.
Here are a few examples:

```java
public void someMethod() {
    long value1 = 2_147_483_648L; // 2147483648
    System.out.println(value1);

    int value2 = 3_2; // 32
    System.out.println(value2);

    int value3 = 2____4; // 24
    System.out.println(value3);

    long value4 = 2_222_L; // error: only between digits

    float value5 = _24F; // error: treated as a variable name
}
```

If an underscore appears at the beginning, the compiler can read it as an identifier.
And remember: this feature exists only since **Java 7**.

<a href="https://docs.oracle.com/javase/7/docs/technotes/guides/language/underscores-literals.html"
rel="nofollow" target="_blank">Oracle Java Docs: Underscores in Numeric Literals</a>
