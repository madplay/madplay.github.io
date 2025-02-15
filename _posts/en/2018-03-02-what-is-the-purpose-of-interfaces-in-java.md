---
layout:   post
title:    Java Interface
author:   Kimtaeng
tags: 	  java interface
description: What is an interface in Java? And how can multiple inheritance be implemented in Java?
category: Java
comments: true
slug:     what-is-the-purpose-of-interfaces-in-java
lang:     en
permalink: /en/post/what-is-the-purpose-of-interfaces-in-java
---

# What is an Interface?

The dictionary meaning of interface is "conditions and agreements that enable multiple components or systems to interact."
In Java, interfaces are features that enable implementation of multiple inheritance.

Actually, the purpose of interfaces is similar to abstract classes. They serve very well for collaboration.
It would be good to refer to the link below for the purpose.

- <a href="/en/post/abstract-classes-and-methods-in-java" target="_blank">Reference Link: Abstract Classes and Abstract Methods</a>

Of course, there are differences between interfaces and abstract classes. Checking through the content that follows below.

<br/>

# How to Use

For declaration, write the ```interface``` keyword in front and the interface name after it. It's similar to class declaration.

```java
interface MadInterface {
    // ...
}
```

Interfaces can only have abstract methods and constants. This is the difference from abstract classes.
Abstract classes can have member variables or regular methods in addition to abstract methods, but interfaces cannot.

```java
interface MadInterface {
    
    // Error occurs. interface abstract methods cannot have body
    public void someMethod() {

    }
}
```

On the other hand, all member variables of interfaces are ```public static final``` and can be omitted. All methods are ```public abstract``` and
can also be omitted. It may differ by IDE, but IntelliJ recommends omitting unnecessary keywords as shown below.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-02-what-is-the-purpose-of-interfaces-in-java-1.jpg"
width="500" height="350" alt="interface's method and variable"/>

When modified, it looks like below. However, note that omitting them doesn't make them ```default``` access modifier.
**Only public access modifier is allowed to be controlled from outside the interface.**

```java
interface MadInterface {
    String SAY_HI = "Hi!";
    void someThing();
}
```

<br/>

# Characteristics of Interfaces

Classes could only have one super class, but interfaces can have multiple. Therefore, they help implement multiple inheritance.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface {
    void yourMethod();
}

class MadPlay implements MyInterface, YourInterface {

    @Override
    public void myMethod() {
        // do something
    }

    @Override
    public void yourMethod() {
        // do something
    }
}
```

Between interfaces and classes, the expression "implementation" is used rather than "inheritance."
Therefore, when using, the keyword "implements" is used rather than "extends" between classes.

Interfaces don't have constructors, and **all methods that interfaces have are public access modifiers.**
Classes that implement interfaces must implement all methods of the interface. Otherwise, they must be declared as abstract classes.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface {
    void yourMethod();

}

abstract class MadPlay implements MyInterface, YourInterface {
    // Don't have to implement interface methods.
}
```

Also, interfaces can extend (extends) other interfaces.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface extends MyInterface {
    void yourMethod();
}

class MadPlay implements YourInterface {

    @Override
    public void myMethod() {

    }

    @Override
    public void yourMethod() {

    }
}
```

However, since interfaces cannot implement methods, they cannot directly override them. Using the above example,
the ```MadPlay``` class that implements ```YourInterface``` must redefine all methods of the interface extended by the implemented interface.
Otherwise, it must also become an abstract class.
