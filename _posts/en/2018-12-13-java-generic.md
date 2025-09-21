---
layout:   post
title:    Java Generics
author:   madplay
tags: 	  java generic generic-class generic-interface generic-method
description: A practical overview of Java generics, including generic classes, interfaces, and methods.
category: Java
comments: true
slug:     java-generic
lang:     en
permalink: /en/post/java-generic
---

# Generics
Java generics were added in `Java 5`. They let you type-check methods and collection classes at compile time, so you can write code without locking into a single type.
In short, you choose the concrete type when you instantiate the class.

Generics are useful but also one of the harder topics when learning Java.
This post summarizes Java generics, generic classes, generic interfaces, and generic methods.

<br/>

# Generic Classes
Defining a generic class is similar to defining any class or interface.
The difference is that you declare a type parameter like `T`.

```java
class MadPlay<T> {
    private T val; // the type of val is T

    public T getVal() {
        // return the value as T
        return val;
    }

    public void setVal(T val) {
        // assign a value of type T
        this.val = val;
    }
}
```

To declare references for a generic class, specify a concrete type:

```java
public void someMethod() {
    MadPlay<String> stringObject;
    MadPlay<Integer> integerObject;
}
```

Next, you **specialize** the generic type by assigning a concrete type parameter and creating an instance.

```java
public void someMethod() {
    MadPlay<String> stringObject = new MadPlay<>();
    stringObject.setVal("Hello, MadPlay!");

    // prints Hello, MadPlay!
    System.out.println(stringObject.getVal());

    MadPlay<Integer> integerObject = new MadPlay<>();
    integerObject.setVal(29);
    
    // prints 29
    System.out.println(integerObject.getVal());
}
```

The diagram below shows a `MadPlay<String>` instance.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-12-13-java-generic-1.png"
width="600" alt="generic class with string"/>

<br/>

# Generic Interfaces
You can apply generics to interfaces as well. A generic interface and its generic implementation look like this:

```java
interface MadLife<T> {
    void addElement(T t, int index);
    T getElement(int index);
}

class MadPlay<T> implements MadLife<T> {
    private T[] array;

    public MadPlay() {
        array = (T[]) new Object[10];
    }

    @Override public void addElement(T element, int index) {
        array[index] = element;
    }

    @Override public T getElement(int index) {
        return array[index];
    }
}

public class GenericTest {
    public static void main(String[] args) {
        MadPlay<String> strObject = new MadPlay<>();
        strObject.addElement("Hello", 0);
        strObject.getElement(0);
        
        // compilation error: already specialized as String
        strObject.addElement(1, 1);
    }
}
```

For reference, `compareTo` in `String` is defined on the `Comparable` interface, which is generic.
That is why types implementing `Comparable` can be sorted easily.

```java
public interface Comparable<T> {
    // ... omitted
    public int compareTo(T o);
}
```

<br/>

# Generic Methods
You can also apply generics at the method level.

```java
class MadPlay {
    public static <T> void arrayToStack(T[] arr, Stack<T> stack) {
        // if the two types differ, this fails at compile time
        for (T element : arr) {
            stack.push(element);
        }
        // alternative approach
        stack.addAll(Arrays.asList(arr));
    }
}

public class GenericTest {
    public static void main(String[] args) {
        String[] array = new String[10];
        Stack<String> stack = new Stack<>();

        // infer T as String
        MadPlay.arrayToStack(array, stack);
    }
}
```

<br/>

# Next
This post covered what generics are and how to use them in classes, interfaces, and methods.
The next post explains why generics help and what to watch out for.
- <a href="/post/java-generic-advanced" target="_blank">Link: Benefits of Java generics and pitfalls to avoid</a>
