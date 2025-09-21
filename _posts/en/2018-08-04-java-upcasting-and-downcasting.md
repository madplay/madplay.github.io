---
layout:   post
title:    Java Upcasting and Downcasting
author:   madplay
tags: 	  java upcasting downcasting
description: What are Upcasting and Downcasting in Java?
category: Java
date: "2018-08-04 22:24:10"
comments: true
slug:     java-upcasting-and-downcasting
lang:     en
permalink: /en/post/java-upcasting-and-downcasting
---

# What is Casting?
**Casting** refers to type conversion.
In Java inheritance, types can be converted between parent and child classes.

This post covers **upcasting**, where a child class is cast to a parent class type, and **downcasting**, where a parent class is cast to a child class type.
In this post, the upper class in an inheritance relationship is the **super class** and the lower class is the **sub class**.

<br>

# Upcasting
In Java, subclasses inherit all characteristics of superclasses. Therefore, subclasses can be treated as superclasses.
Here, **upcasting** refers to subclass objects being converted to superclass types.

That means a superclass reference can point to an instance created from a subclass.
As an analogy, think **humans are living things**. Humans are subclasses and living things are superclasses.

The example below shows upcasting in practice:

```java
// Omit private declarations and getter methods for checking direct member access after casting.
class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    String dept;

    public Student(String name) {
        super(name);
    }
}

public class CastingTest {
    public static void main(String[] args) {
        // Using reference student, can access name, dept
        Student student = new Student("MadPlay");

        // Using reference person, among Student object members,
        // only Person class members can be accessed.
        Person person = student;
        person.name = "Kimtaeng";
        
        // Compile-time error for the statement below
        person.dept = "Computer Eng";
    }
}
```

In this code, the `person` reference points to a `Student` object but has the `Person` type, so only members declared on `Person` are accessible.
Since `dept` belongs to `Student`, the assignment fails at compile time.

With upcasting, you cannot access all members of the object. Only superclass members are accessible.
This applies to both fields and methods.

As shown above, upcasting does not require an explicit cast.
The subclass `Student` is also a `Person`.

```java
// Upcasting automatic type conversion
Person person = student;

// No explicit cast is required.
Person person = (Person) student;
```

Why use upcasting? It is closely tied to **polymorphism**.
Here is another example:

```java
// Names in Korean for clarity.
class 해장국 {
    public void 간맞추기() {
        // Adjust seasoning...
    }
}

class 뼈해장국 extends 해장국 {
    @Override public void 간맞추기() {
        // Bone hangover soup uses perilla powder...
    }
}

class 콩나물해장국 extends 해장국 {
    @Override public void 간맞추기() {
        // Bean sprout hangover soup uses chili powder...
    }
}

class 취객 {
    public void 해장국먹기(해장국 어떤해장국) {
        어떤해장국.간맞추기();
    }
}

public class CastingTest {
    public static void main(String[] args) {
        취객 취객1 = new 취객();
        해장국 해장국한그릇 = new 뼈해장국();
        취객1.해장국먹기(해장국한그릇);
    }
}
```

The example uses Korean class names to make the inheritance relationship intuitive.

But what happens if we skip upcasting and call each soup variant directly?
Only after adding conditional statements that check whether `해장국한그릇` is `뼈해장국` or `콩나물해장국`, as in the code below,
do the methods for each concrete type get called.

```java
public void 해장국먹기(해장국 어떤해장국) {
    if (뼈해장국 type?) {
        뼈해장국.간맞추기();
    } else if (콩나물해장국 type?) {
        콩나물해장국.간맞추기();
    }
    // ...What if more soup menus are added?
}
```

Upcasting supports polymorphism. In the example above, the caller passes a single `해장국` reference,
and the `취객` consumes it regardless of whether the instance is `뼈해장국` or `콩나물해장국`, without type checks.

<br>

# Downcasting
**Downcasting** restores a subclass object that has lost its specific type through upcasting.
It returns an upcasted object to its original type.

```java
class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    String dept;

    public Student(String name) {
        super(name);
    }
}

public class CastingTest {
    public static void main(String[] args) {
        // Upcasting precedes
        Person person = new Student("MadPlay");

        // Downcasting
        Student student = (Student) person;

        // Okay!
        student.name = "Kimtaeng";

        // Okay!
        student.dept = "Computer Eng";
    }
}
```

Here, the difference from upcasting is that types must be explicitly specified, and upcasting must happen first.
Even with explicit types, indiscriminate downcasting can cause runtime errors despite compiling successfully.

For example, proceeding as below causes errors during execution.

```java
Student student = (Student) new Person("MadPlay");
```

Therefore, explicit casts remove compile errors, but execution can still throw `ClassCastException`.
To reduce this risk, Java provides an operator that helps distinguish object types.

<br>

# instanceof
Use the `instanceof` operator to distinguish object types.

It is useful when an upcast reference makes the concrete type unclear.
Assume the following inheritance hierarchy:

```java
class Unit {
    // omitted
}

class Zealot extends Unit {
    // omitted
}

class Marine extends Unit {
    // omitted
}

class Zergling extends Unit {
    // omitted
}

public class CastingTest {
    public static void main(String[] args) {
        Unit unit;
        unit = new Unit();
        unit = new Zealot(); // upcasting
        unit = new Marine(); // upcasting
        unit = new Zergling(); // upcasting
    }
}
```

The example classes Zealot, Marine, and Zergling all inherit `Unit`, so the upcasting code executes without compile errors.

But if the `unit` reference points to some object, how do we identify its actual class?
Consider a method like below:

```java
// Attack the enemy!
public void attackEnemy(Unit unit) {
  // The object unit points to could be Unit
  // or could be Zealot, Marine, Zergling.
}
```

Using the `instanceof` operator mentioned earlier, you can easily distinguish object types.
The operation result type is `boolean`, and you can use it like a binary operator as below.

```java
class Unit {
    // omitted
}

class Zealot extends Unit {
    // omitted
}

class Marine extends Unit {
    // omitted
}

class Zergling extends Unit {
    // omitted
}

public class CastingTest {
    public static void main(String[] args) {
        Unit unit1 = new Unit();
        Unit unit2 = new Zealot(); // upcasting
        Unit unit3 = new Marine(); // upcasting
        Unit unit4 = new Zergling(); // upcasting

        if (unit1 instanceof Unit) { // true
            System.out.println("unit1 is Unit type.");
        }
        if (unit1 instanceof Zealot) { // false
            System.out.println("unit1 is Zealot type.");
        }
        if (unit2 instanceof Zealot) { // true
            System.out.println("unit2 is Zealot type.");
        }
        if (unit2 instanceof Zergling) { // false
            System.out.println("unit2 is Zergling type.");
        }
        if (unit3 instanceof Unit) { // true
            System.out.println("unit3 is Unit type.");
        }
        if (unit4 instanceof Zergling) { // false
            System.out.println("unit4 is Zergling type");
        }
    }
}  
```

You can compare what type objects actually are. You can reduce type conversion errors that can occur at runtime.
Looking at the `equals` method of the `java.lang.String` class, it's implemented as below.
It receives the top-level Object object as a parameter, but checks if it's actually `String` type that can compare values with itself.

```java
public boolean equals(Object anObject) {
    if (this == anObject) {
        return true;
    }
    if (anObject instanceof String) {
        String anotherString = (String)anObject;
        int n = value.length;
        if (n == anotherString.value.length) {
            char v1[] = value;
            char v2[] = anotherString.value;
            int i = 0;
            while (n-- != 0) {
                if (v1[i] != v2[i])
                    return false;
                i++;
            }
            return true;
        }
    }
    return false;
}
```

A point to note when using is that the `instanceof` operator can only be used for class (reference) types of objects.

```java
// Class (reference) types are possible!
if("Kimtaeng" instanceof String) {
    // String type, so true
}

// Compile error! Primitive types don't work.
if(3 instanceof int) {

}
```
