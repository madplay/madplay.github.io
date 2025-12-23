---
layout:   post
title:    "[Effective Java 3rd Edition] Item 23. Prefer Class Hierarchies to Tagged Classes"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 23. Prefer class hierarchies to tagged classes" 
category: Java
lang: en
slug: prefer-class-hierarchies-to-tagged-classes
permalink: /en/prefer-class-hierarchies-to-tagged-classes/
comments: true
---

# Tagged Class
A class that has two or more behaviors and uses a tag field to indicate which behavior is active is called a tagged class.
It often looks like this:

```java
class Figure {
    enum Shape { RECTANGLE, CIRCLE };

    final Shape shape; // Tag field - indicates current shape.

    // Fields used only when shape is RECTANGLE.
    double length;
    double width;

    // Field used only when shape is CIRCLE.
    double radius;

    // Constructor for circle.
    Figure(double radius) {
        shape = Shape.CIRCLE;
        this.radius = radius;
    }

    // Constructor for rectangle.
    Figure(double length, double width) {
        shape = Shape.RECTANGLE;
        this.length = length;
        this.width = width;
    }

    double area() {
        switch(shape) {
            case RECTANGLE:
                return length * width;
            case CIRCLE:
                return Math.PI * (radius * radius);
            default:
                throw new AssertionError(shape);
        }
    }
}
```

This style is problematic for many reasons.

- It contains unnecessary code: enum declarations, tag fields, switch statements.
- Multiple implementations are mixed in one class, which hurts readability.
- Memory use increases because code and fields for different meanings coexist.
- To declare fields as final, constructors must initialize irrelevant fields too.
  - That creates initialization code for unused fields.
- Adding another meaning requires modifying existing code, especially switch statements.
- You cannot easily infer a runtime meaning from the instance type.

<br><br>

# Improving It
Replace tagged classes with class hierarchies.

```java
abstract class Figure {
    abstract double area();
}

class Circle extends Figure {
    final double radius;
    Circle(double radius) { this.radius = radius; }
    @Override double area() { return Math.PI * (radius * radius); }
}

class Rectangle extends Figure {
    final double length;
    final double width;
    Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    }
    @Override double area() { return length * width; }
}
```

**The result is simpler and clearer, and all unnecessary code is removed.**
Because each meaning lives in an independent class, unrelated fields disappear.
You also avoid runtime errors caused by missing switch cases.

Natural type hierarchies improve flexibility and compile-time type checking.
With class hierarchies, adding `Square` is also straightforward.

```java
class Square extends Rectangle {
    Square(double side) {
        super(side, side);
    }
}
```
