---
layout:   post
title:    "[Effective Java 3rd Edition] Item 15. Minimize the Accessibility of Classes and Members"
author:   madplay
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 15. Minimize the accessibility of classes and members" 
category: Java
lang: en
slug: minimize-the-accessibility-of-classes-and-members
permalink: /en/minimize-the-accessibility-of-classes-and-members/
date: "2019-11-06 22:34:15"
comments: true
---

# Encapsulation
The quality of a well-designed component depends on how well it hides internal data and implementation details from external components.
It should hide implementation and separate implementation from API cleanly.
This is called **information hiding** or **encapsulation**.

<br><br>

# Benefits of Information Hiding
Information hiding bundles fields and methods and hides part of actual implementation from outside.
In other words, external code cannot directly access variables and can modify values only through methods.

Information hiding reduces coupling and dependency between system components.
Since external code cannot alter implementation details directly, changes affect only the specific class in many cases.
So code modification scope for requirement changes can be minimized.

Benefits include higher development speed because components can be developed in parallel.
It also helps performance optimization because problem components are easier to isolate and tune without impacting others.
It reduces maintenance cost and improves reusability because each component is easier to understand and replace.
And even when the full system is incomplete, individual component behavior can be verified,
which makes building large systems easier.

<br><br>

# Access Modifier Types
From narrowest to widest access scope:

- private
  - Accessible only within the top-level class that declares the member.
- package-private
  - Accessible from all classes in the same package.
  - This is the default when no access modifier is declared.
  - Interface members are `public` by default.
- protected
  - Includes package-private scope and is also accessible from subclasses.
- public
  - Accessible from everywhere.

<br><br>

# How to Design Components
The core principle is to narrow accessibility of every class and member as much as possible.
Always assign the **lowest possible access level**.

- If there is no reason to use it outside the package, declare it as **package-private**.
  - Then it stays internal implementation and can change at any time.
- Consider **private static nested classes** in some cases.
  - Target: package-private top-level classes or interfaces used by a single class.
  - Nest them as private static inside that class.
  - Then only the outer class can access them.
- Make **all members private** except the class's public API.
  - Open to package-private only for members that other classes in the same package must access.
  - When overriding superclass methods, do not reduce accessibility below the superclass level.
- Do not make classes, interfaces, or members part of public API only for testing.
- Instance fields of public classes should generally **not be public**.
  - It is hard to guarantee immutability and usually not thread-safe.
- `public static final` fields should reference **primitive types or immutable objects**.
  - Do not expose `public static final` array fields or accessors returning them.
  - References cannot be redirected, but referenced objects can still be mutated.
  - Any non-empty array is mutable.

```java
class Example {
    public static final Integer[] SOME_VALUES = {1, 2, 3};
}

class Test {
    public static void main(String[] args) {
        System.out.println(Example.SOME_VALUES[0]); // 1
        Example.SOME_VALUES[0] = 5;
        System.out.println(Example.SOME_VALUES[0]); // 5
    }
}
```

In this case, change the array to private and expose an unmodifiable public list.

```java
private static final Integer[] SOME_VALUES = {1, 2, 3};
public static final List<Integer> VALUES = Collections.unmodifiableList(Arrays.asList(SOME_VALUES));
```

Or keep the array private and add a public method that returns a copy.

```java
private static final Integer[] SOME_VALUES = {1, 2, 3};
public static final Integer[] values() {
    return SOME_VALUES.clone();
}
```
