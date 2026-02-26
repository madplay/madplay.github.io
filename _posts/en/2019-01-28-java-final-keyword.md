---
layout:   post
title:    The final Keyword in Java
author:   madplay
tags: 	  java final
description: What does the final keyword mean in Java, and how should you use it?
category: Java/Kotlin
comments: true
slug:     java-final-keyword
lang:     en
permalink: /en/post/java-final-keyword
---

# final

The `final` keyword can be applied to classes, methods, and variables.
The meaning is literal: it makes something final. Here is how it behaves.

<br/>

# final and Classes

When you declare a class as `final`, no other class can extend it.
This often supports security and immutability. For example, `java.lang.String` is `final`.

```java
final class MadPlay {
    // ...
}

class MadClass extends MadPlay { // compilation error
    // ...
}
```

Because you cannot extend it, you also cannot override its methods.
However, a `final` class can still extend another class.

```java
class MadMan {
    // ...
}

final class MadPlay extends MadMan {
    // ...
}
```

<br/>

# final and Methods

A method declared `final` cannot be overridden.

```java
class MadClass {
    public final void sayHi() {
        // ...
    }
}

public class MadPlay extends MadClass {
    // compilation error
    // cannot override... overridden method is final    
    public void sayHi() {
        // ...
    }
}
```

<br/>

# final and Variables

A variable declared `final` acts as a constant. You can assign it only once.
So you typically initialize it at declaration time.

```java
public class MadPlay {
    final int MAX_ARRAY_SIZE = 5;

    public void someMethod() {
        int[] array = new int[MAX_ARRAY_SIZE];

        // compilation error
        MAX_ARRAY_SIZE = 10;
    }
}
```

But `final` fields do not always need to be initialized inline. This code is valid:

```java
public class Person {
    private final String name;

    // if you provide a default constructor, initialize here
    public Person() {
        this.name = "kimtaeng";
    }

    public Person(String name) {
        this.name = name;
    }
}
```

Here, the `final` field is initialized in the constructor, which is also valid.

<br/>

# Why Most Constants Are public static

Most `final` constants are declared like this so they can be shared throughout the project:

```java
class GradeHelper {
    public static final String MAX_GRADE = "A+";
}
```

Why `public static`?
`public` makes it accessible across classes and packages.

`static` allocates it once at class load time.
It does not allocate per instance, which makes it ideal for fixed values.
For example, a maximum grade of A+.
