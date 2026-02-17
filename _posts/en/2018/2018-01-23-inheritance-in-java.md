---
layout:   post
title:    Java Inheritance
author:   madplay
tags: 	  java inheritance
description: Examining the concept and usage examples of inheritance in Java
category: Java/Kotlin
comments: true
slug:     inheritance-in-java
lang:     en
permalink: /en/post/inheritance-in-java
---

# What is Inheritance

- It's a characteristic of object-oriented languages and a technology that enables software reuse.
- A real-life example would be similar to genetic inheritance where children inherit parent genes.
- It's similar to the concept of inheritance in ```C++``` language.
  - The difference is that multiple inheritance is not possible in Java.
- In Java, parent-child inheritance relationships are declared between two classes.
  - At this time, the parent class is called a super class, and the child class is called a sub class.
  - Sub classes include not only their own members but also super class members.

> Base class? Parent class?<br/>
The names for two classes in an inheritance relationship differ slightly by programming language.
In C++, the class that provides inheritance is called a base class, and conversely, the class that receives inheritance is called a derived class.
Also, in C#, they're called parent class and child class respectively.

<br/>

# Advantages of Inheritance

Examining the advantages inheritance provides through the example code below:

```java
class Student {
    void eat() {} // eating
    void sleep() {} // sleeping
    void study() {} // studying
}

class StudentDeveloper {
    void eat() {} // eating
    void sleep() {} // sleeping
    void study() {} // studying
    void develop() {} // developing
}

class Professor {
    void eat() {} // eating
    void sleep() {} // sleeping
    void research() {} // researching
}
```

- There are Student, StudentDeveloper, and Professor.
- They all have common behaviors (code) of eating (eat) and sleeping (sleep).
- Also, Student and StudentDeveloper have common behavior (code) of studying (study).
- If we assume that eating and sleeping don't differ and serve the same role,
  the inconvenience arises of having to modify all three classes above to modify one behavior.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-23-inheritance-in-java-1.jpg"
width="450" height="350" alt="class structure"/>

- Using inheritance, you can modify it concisely as shown below:

```java
class Person {
    void eat() {} // eating
    void sleep() {} // sleeping
}

class Student extends Person {
    void study() {} // studying
}

class StudentDeveloper extends Student {
    void develop() {} // developing
}
```

- Common characteristics were grouped and defined as a Person class.
- And classes that need common characteristics inherit and use it.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-23-inheritance-in-java-2.jpg"
width="350" height="450" alt="class structure with inheritance"/>

- As such, inheritance has the advantage of not having to duplicate member declarations between classes.
- It also allows hierarchical classification of classes, enabling efficient management.
- Therefore, it can improve software productivity through class reuse and extension.

<br/>

# How to Use Inheritance

## Declaration Method

- In Java, inheritance is declared using the ```extends``` keyword.
- Write it as ```class sub class extends super class```.

## Usage

```java
class Point {
    private int xPos, yPos;

    void setPoint(int xPos, int yPos) {
        this.xPos = x;
        this.yPos = y;
    }

    void showPoint() {
        System.out.println("(" + xPos + "," + yPos + ")");
    }
}

class ColorPoint extends Point {
    private String color;

    void setColor(String color) {
        this.color = color;
    }

    void showColorPoint() {
        showPoint(); // Call Point class's showPoint method
        System.out.println("Color : " + color);
    }
}

public class ExampleTest {
    public static void main(String[] args) {
        Point p = new Point();
        p.setPoint(3, 4);
        p.showPoint();

        ColorPoint cp = new ColorPoint();
        cp.setPoint(2, 3);
        cp.setColor("Yellow");
        cp.showColorPoint();
    }
}
```

- Sub classes extend super class members as their own members through inheritance.
  - Therefore, they can access all members except private members of the super class.
- That is, ColorPoint not only has its own member variable string color but also
  Point class's integer xPos and yPos by inheriting the Point class.
- Also, the sub class ColorPoint's member method showColorPoint can call the super class's showPoint.
- However, since xPos and yPos are Point's private members, Color class members cannot access them.
  - Therefore, they access indirectly through setPoint and showPoint methods.

## Types of Inheritance

- Java doesn't specify public inheritance, protected inheritance, etc. like C++.
- As mentioned above, it's only declared as ```sub class extends super class```, and depending on the access specifiers of super class members,
  they're inherited differently to the sub class.

```java
class Point {
    private int privateVal;
    protected int protectedVal;
    public int publicVal;
    int defaultVal;
}

// In the same package.
class ColorPoint extends Point {
    void someMethod() {
        privateVal = 1; // Error!
        protectedVal = 2;
        publicVal = 3;
        defaultVal = 4;
    }
}
```

Class type accessing super class members | private | default | protected | public
|:--:|:--:|:--:|:--:|:--:
Same package class | X | O | O | O
Different package class | X | X | X | O
Same package sub class | X | O | O | O
Different package sub class | X | X | O | O

<br/>

# Inheritance and Constructors

## Constructors of Super Class and Sub Class

- Both super class and sub class have constructors.
- When a sub class object is created, both the sub class constructor and super class constructor execute.
- Since the purpose of constructors is object initialization, sub class constructors perform initialization of sub class members or necessary initialization.
- Super class constructors each perform initialization of super class members or necessary initialization.
- Among super class constructors and sub class constructors, the super class constructor executes first.

```java
class Point {
    Point() {
        // Executes first.
        System.out.println("Point constructor executed");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        // Executes afterward.
        System.out.println("ColorPoint constructor executed");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        ColorPoint cp = new ColorPoint();
    }
}
```

- When the ```new``` statement executes, the compiler calls the ColorPoint constructor.
- However, ColorPoint first calls the super class constructor before executing its own code.
- The sub class constructor is called first, but ultimately the super class constructor executes first.
- For any sub class, regarding constructors, the compiler compiles to call the super class constructor and then execute its own code.
  - This is because the super class must be initialized first, and then the sub class inheriting it must be initialized.

## Sub Class Calling Super Class Constructor

- There can be multiple super class constructors. Of course, the same goes for sub classes.
- If the super class constructor is not explicitly specified, the compiler compiles to implicitly call the super class's default constructor.

```java
class Point {
    Point() {
        // Executes first.
        System.out.println("Point default constructor");
    }

    Point(int x) {
        // Does not execute.
        System.out.println("Point parameter constructor");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        // Executes second.
        System.out.println("ColorPoint default constructor");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        ColorPoint cp = new ColorPoint();
    }
}
```

- If the super class's default constructor is not declared, an error occurs.
- Even when calling a constructor with parameters from the sub class constructor, the compiler
  implicitly calls the super class's default constructor.
- To explicitly select the super class constructor, write the code as shown below:

```java
class Point {
    Point() {
        System.out.println("Point default constructor");
    }

    Point(int x) {
        System.out.println("Point parameter constructor");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        System.out.println("ColorPoint default constructor");
    }

    ColorPoint(int x) {
        super(x); // Must be at the method start position.
        System.out.println("ColorPoint parameter constructor");
    }
}
```

- Code that explicitly calls the super class constructor using the ```super``` keyword must be on the first line of the sub class constructor.
  - Otherwise, an error occurs. _Constructor call must be the first statement in a constructor_
