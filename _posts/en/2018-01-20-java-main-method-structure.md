---
layout:   post
title:    Why Does Java Main Method Use public static?
author:   madplay
tags: 	  java main
description: Why is the structure of the main method in Java public static void main(String[] args)?
category: Java/Kotlin
comments: true
slug:     java-main-method-structure
lang:     en
permalink: /en/post/java-main-method-structure
---

# Why Is That?
When writing the main method in Java, we write it with `public static void main` as shown below.

```java
public static void main(String[] args) {
    // do something
}
```

Why does it have this structure? Examining each part:

### public
`public` is called an access specifier or access modifier. Among access specifiers, `public` means it can be used anywhere without restrictions.
Conversely, there are `protected` which can only be used in inherited classes and `private` which cannot be accessed externally.

### static
It means static. When attached to a method, it indicates that this method is a static method. When declared as `static`,
it's defined at the time Java is compiled. And it's impossible to call static elements from non-static elements.

Especially, elements like the main method that serve as program entry points must be static because they need to perform work without creating objects.

### void
It's the return type of the method. `void` means there's nothing to return.
It simply returns to the calling location when the method ends.

### main
It's the method name. Just as there's a main function in C language, Java also has one. It executes first when the program starts.

### String[] args
It represents method parameters. It's a String type array named args. As shown below, when executing Java through the command line,
you can pass parameters.

```bash
java test.class test1 test2
```

<br/>

## Summary
Just like C language, the `main` method executes first in Java language. However, to execute, it must be loaded into memory in advance.
Therefore, `static` is declared to make it usable without memory allocation (new). Especially, since the `main` method
is called by the Java Virtual Machine (JVM), it must be declared as `static` and pre-loaded.
