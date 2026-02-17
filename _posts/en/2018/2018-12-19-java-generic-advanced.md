---
layout:   post
title:    Benefits of Java Generics and Pitfalls to Avoid
author:   madplay
tags: 	  java generic generic-class generic-interface generic-method
description: Why are Java generics useful, and what should you watch out for?
category: Java/Kotlin
comments: true
slug:     java-generic-advanced
lang:     en
permalink: /en/post/java-generic-advanced
---

# What Are Generics?
In the previous post, we covered what Java generics are and how to apply them to classes, interfaces, and methods.
- <a href="/post/java-generic" target="_blank">Link: Java Generics</a>

This post explains why generics help and what to be careful about.

<br/>

# Why Are Generics Useful?
Generics **check types at compile time**, which improves type safety.
They prevent unintended types from being stored and reduce `ClassCastException` when retrieving values.

Generics also reduce **type casting boilerplate**. Consider this example without generics, using `Object`:

```java
class MadPlay {
    private Object obj;

    public MadPlay(Object obj) { this.obj = obj; }
    public Object getObj() { return obj; }
}

class GenericTester {
    public void executeMethod() {
        MadPlay instance1 = new MadPlay(new String("Hello"));
        MadPlay instance2 = new MadPlay(new Integer(123));
        MadPlay instance3 = new MadPlay(new Character('a'));

        String obj1 = (String) instance1.getObj();
        Integer obj2 = (Integer) instance2.getObj();
        Character obj3 = (Character) instance3.getObj();
    }
}
```

With generics, you avoid explicit casts by declaring the type upfront:

```java
class GenericMadPlay<T> {
    private T obj;

    public GenericMadPlay(T obj) { this.obj = obj; }
    public T getObj() { return obj; }
}

class GenericTester {
    public void executeMethod() {
        GenericMadPlay<String> genericInstance1 = new GenericMadPlay<>("Hello");
        GenericMadPlay<Integer> genericInstance2 = new GenericMadPlay<>(123);
        GenericMadPlay<Character> genericInstance3 = new GenericMadPlay<>('a');

        String genericObj1 = genericInstance1.getObj();
        Integer genericObj2 = genericInstance2.getObj();
        Character genericObj3 = genericInstance3.getObj();
    }
}
```

Without generics, you tend to accept `Object` parameters and cast later.
With generics, you simply specify the type you want.

Lastly, although we used `T` for the type parameter, the name can be anything.
You could write `MadPlay<Kimtaeng>`, but there is a convention that makes code easier to read:

- E(Element): for elements, e.g. `List<E>`
- K(Key): for keys, e.g. `Map<K, V>`
- N(Number): for numeric values
- T(Type): for a type
- V(Value): for a return value or mapped value
- S, U, V: for the 2nd, 3rd, and 4th declared types

<br/>

# What Should You Watch Out For?
Generics apply only to classes and interfaces, so you **cannot use primitive types**.
<a href="/post/java-data-type" target="_blank">(Related link: Java data types)</a> 

```java
public void someMethod() {
    List<int> intList = new List<>(); // primitives are not allowed
    List<Integer> integerList = new List<>(); // okay
}
```

You also cannot instantiate a type parameter directly:

```java
public void someMethod() {
    // Type parameter 'T' cannot be instantiated directly
    T t = new T();
    return t;
}
```

Generics also restrict arrays. You cannot declare arrays of generic class or interface types.
However, arrays of raw types are allowed.

```java
public void someMethod() {
    // generic array creation
    // (before Java 8) Cannot create a generic array of MadPlay<Integer>
    MadPlay<Integer>[] arr1 = new MadPlay<>[10];
    
    MadPlay<Integer>[] arr2 = new MadPlay[10]; // okay
}
```
