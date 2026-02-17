---
layout:   post
title:    Abstract Classes and Methods in Java
author:   madplay
tags: 	  java abstract
description: What's the reason for using abstract classes and abstract methods in Java?
category: Java/Kotlin
comments: true
slug:     abstract-classes-and-methods-in-java
lang:     en
permalink: /en/post/abstract-classes-and-methods-in-java
---

# What is an Abstract Class?

First, an abstract class refers to a class that has abstract methods. Then what is an abstract method?
An abstract method refers to a method that only has a declaration, that is, a body without actual implementation.

Approaching it differently: Assume we're defining part of 'Animal' in code. And we chose 'Dog' and 'Cat' as types of animals.
What do they have in common? There would be many, but they make sounds, eat food, etc. Expressing this in code:

```java
class Dog {
    makeSound() {
        System.out.println("Woof!");
    }
}

class Cat {
    makeSound() {
        System.out.println("Meow!");
    }
}
```

It's very simple. But what if you're writing this code not alone but with friend A? Each taking one animal. Then friend A decided to write the Cat class, but differently from my expectation, they named the method for eating food differently.

```java
class Cat {
    meow() {
        System.out.println("Meow!");
    }
}
```

Actually, if it's a small-scale project, it's not a big problem. I can just modify my code to match the code my friend wrote.
Or conversely, my friend can modify it... But there's a better method. Applying abstract classes here.

<br/>

## How to Use Abstract Classes

Friend and I are writing 'Dog' and 'Cat', parts of 'Animal', in code. Define 'Animal' as an abstract class and define 'common behaviors'
as abstract methods. The code would look like this:

```java
abstract class Animal {
    abstract void makeSound();
}
```

First, define the abstract class and define essential features as abstract methods.
Then friend A and I only need to inherit the abstract class, implement necessary features, and merge them.

```java
class Dog extends Animal {
    @Override
    void makeSound() {
        System.out.println("Woof!");
    }
}

class Cat extends Animal {
    @Override
    void makeSound() {
        System.out.println("Meow!");
    }  
}
```

As such, defining abstract classes makes it easy to present what features are needed. It's especially convenient to use when
you don't have a sense of what features to implement or when you don't clearly know the class structure or composition.

Also, since you can unify rules like method names, you can improve consistency and maintenance efficiency.

<br/>

## Characteristics of Abstract Classes

Abstract classes cannot create their own objects. If you try to create an object, an error occurs.

```java
abstract class MadClass {
    abstract void printMyName();
}

class MadPlay {
    public static void main(String[] args) {
        // Cannot instantiate the type MadClass
        MadClass inst = new MadClass();
    }
}
```

Abstract classes don't necessarily need to have only abstract methods.

```java
abstract class MadClass {
    abstract void printMyName();

    // Regular method
    public void sayHi() {
        System.out.println("Hi~");
    }
}

class MadMan extends MadClass {
    public void sayHello() {
        System.out.println("Hello~");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        MadMan madMan = new MadMan();
        madMan.sayHi();
    }
}
```

Instances of the MadMan class that inherits the abstract class MadClass can call the abstract class's regular methods.
Of course, since the purpose of abstract classes is inheritance and overriding, overriding and using them would be less confusing
when the project scale grows.
