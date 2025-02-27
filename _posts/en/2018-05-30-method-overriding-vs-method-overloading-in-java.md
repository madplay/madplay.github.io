---
layout:   post
title:    Java Method Overriding and Overloading
author:   Kimtaeng
tags: 	  java overriding overloading
description: What's the difference between Method Overriding and Method Overloading in Java?
category: Java
comments: true
slug:     method-overriding-vs-method-overloading-in-java
lang:     en
permalink: /en/post/method-overriding-vs-method-overloading-in-java
---

# What is Method Overriding?
It's called **method redefinition**. It can be used in super classes and sub classes, that is, inheritance relationships. It refers to writing methods declared in super classes redundantly in sub classes,
ignoring methods written in super classes and executing methods redundantly written in sub classes.

Java guarantees that overridden methods are always executed through dynamic binding.
> **Dynamic Binding** refers to determining methods to execute at runtime, not at compile time.

On the other hand, when overriding, access modifiers cannot be changed to narrower ranges than super classes, and instances cannot be changed to static or static to instances.

<br/><br/>

# Method Overriding Example
Learning what overriding is through code. The `@Override` annotation used in the example is conventionally good to write to prevent mistakes.

```java
class Unit {
    public void sayName() {
        System.out.println("Unit!");
    }
}

class Zergling extends Unit {
    @Override
    public void sayName() {
        System.out.println("Zergling!");
    }
}

class Marine extends Unit {
    @Override
    public void sayName() {
        System.out.println("Marine!");
    }
}

class Zealot extends Unit {
    @Override
    public void sayName() {
        System.out.println("Zealot!");
    }
}

public class MadPlay {
    static void something(Unit unit) {
        unit.sayName();
    }

    public static void main(String[] args) {
        something(new Unit());
        something(new Zergling());
        something(new Marine());
        something(new Zealot());
    }
}
```

```bash
# Output Result
Unit!
Zergling!
Marine!
Zealot!
```

The Unit class has a method called sayName, and there are sub classes named Zergling, Marine, Zealot that inherit this class.
And each sub class overrode the sayName method differently.

Like this, overriding becomes a tool that realizes **object-oriented polymorphism** of 'implementing different contents with one interface' through inheritance.

<br/><br/>

# Method Overriding and super Keyword
When methods are overridden, we said that overridden methods of sub classes are always called by dynamic binding (Dynamic Binding),
but using the `super` keyword, you can access super class members through static binding (Static Binding).

Unlike when using the `super` keyword in inheritance, it doesn't necessarily have to be on the first line of the method.

- <a href="/en/post/inheritance-in-java#서브-클래스의-수퍼-클래스-생성자-호출" target="_blank">
Reference Link: Java Inheritance</a>

```java
class Unit {
    String weapon;
    public void sayName() {
        System.out.println("Unit!");
    }
}

class Zergling extends Unit {
    @Override
    public void sayName() {
        super.sayName(); // Static binding
        System.out.println("Zergling!");
    }
}

public class MadPlay {
    static void something(Unit unit) {
        unit.sayName();
    }

    public static void main(String[] args) {
        something(new Zergling());
    }
}
```

```bash
# Output Result
Unit!
Zergling!
```

<br/><br/>

# What is Method Overloading?
It's called method **duplicate definition**. It refers to multiple methods with the same name being written in one class or classes in inheritance relationships,
with different parameter types or numbers. Unlike overriding, which is dynamic binding, **overloading is static binding**.
> **Static Binding** refers to determining methods to execute at compile time.

Overloading must have different argument numbers or data types. **Cases where parameters are the same but return types differ do not constitute overloading.**

<br/><br/>

# Method Overloading Example
Checking overloading through code:

```java
public class MadPlay {
    public void show(String name, String nickName) {
        System.out.println("name: " + name);
        System.out.println("nickName: " + nickName);
    }

    public void show(String name) {
        System.out.println("name: " + name);
    }

    public static void main(String[] args) {
        MadPlay instance = new MadPlay();
        instance.show("kimtaeng", "madplay");
        instance.show("kimtaeng");
    }
}
```

```bash
name: kimtaeng
nickName: madplay
name: kimtaeng
```

Looking at the above code, the `MadPlay` class has a method that receives name and email as arguments and a method that receives only name as an argument overloaded.
Therefore, depending on how argument values are given, the compiler decides which method to call.

<br/><br/>

# In Summary
When doing **overriding**, you cannot specify access modifiers to narrower ranges than declared in super classes. You cannot remove static declared in methods or declare static in the overriding process.
So you cannot change instances to static or static to instance form.

On the other hand, cases where parameters are the same but return types differ do not constitute **overloading**.

| Distinction | Method Overriding | Method Overloading |
|:---:|:---:|:---:|
| Declaration | Rewrite methods with the same name as methods in super classes in sub classes | Duplicate write methods with the same name in one class or inheritance relationships |
| Relationship | Inheritance relationships | Within the same class or inheritance relationships |
| Purpose | Redefine methods with new functionality in sub classes, ignoring methods implemented in super classes | Improve convenience of use by duplicate declaring multiple methods with the same name |
| Conditions | Method name, return type, argument types and numbers, etc. must all be identical | Method name must be identical, and method argument numbers or types must differ |
| Binding | Dynamic binding that finds and calls overridden methods at runtime | Static binding that determines which method among duplicate methods is called at compile time |
