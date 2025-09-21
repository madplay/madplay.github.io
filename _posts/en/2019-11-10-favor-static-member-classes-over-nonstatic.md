---
layout:   post
title:    "[Effective Java 3rd Edition] Item 24. Favor Static Member Classes over Nonstatic"
author:   madplay
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 24. Favor static member classes over nonstatic" 
category: Java
lang: en
slug: favor-static-member-classes-over-nonstatic
permalink: /en/favor-static-member-classes-over-nonstatic/
date: "2019-11-10 01:20:59"
comments: true
---

# What Is a Nested Class?
A class defined inside another class is a **nested class**.
A nested class should be used only by its enclosing class. If it has wider use, make it a top-level class.

Nested classes include static member classes, non-static member classes, anonymous classes, and local classes.

<br><br>

# Static Member Class vs Non-Static Member Class
A `static member class` is declared inside another class and is similar to a normal class, except that it can access private members of the outer class.
In code, the difference seems to be only `static`, but semantically it is much larger.

An instance of a `non-static member class` is implicitly associated with an outer instance.
So methods in the non-static member class can reference the outer instance or call its methods through qualified `this`.
Qualified `this` means explicitly writing the outer class name as `ClassName.this`.

Example:

```java
class A {
    int a = 10;

    public void run() {
        System.out.println("Run A");
        B.run();
        C c = new C();
        c.run();
    }

    // Static member class
    public static class B {
        public static void run() {
            System.out.println("Run B");
        }
    }

    // Non-static member class
    public class C {
        public void run() {
            // Referencing through qualified this.
            // Qualified this explicitly uses ClassName.this.
            System.out.println("Run C: " + A.this.a);
        }
    }
}
```

```java
public class Example {
    public static void main(String[] args) {
        // Static member class can be accessed like this.
        A.B.run();
        A a = new A();
        a.run();
        A.C c = a.new C();
        c.run();
    }
}
```

```bash
// Output
Run B
Run A
Run B
Run C: 10
Run C: 10
```

**If a member class does not need access to an enclosing instance, you should add `static` and make it a static member class.**
If you omit `static`, it keeps a hidden reference to the outer instance.
That hidden reference costs time and memory.
A more serious issue is that garbage collection may fail to reclaim the outer instance.

<br><br>

# Anonymous Class and Local Class
An `anonymous class` has no name and does not become a member of the enclosing class.
It is declared and instantiated at the same time where it is used, and can be created almost anywhere in code.

It can only have constant variables as members, and type checks with `instanceof` are not possible.
It also cannot implement multiple interfaces, and cannot both implement an interface and extend another class at once.

```java
Thread th = new Thread() { // Anonymous class
    final int value = 5;
    public void run() {
        System.out.println("Hello Thread: " + value);
    }
};
```

A `local class` can be declared anywhere a local variable can be declared, and its scope is the same as local variables.
It has a name and can be reused.
It can reference an outer instance only in non-static context, cannot have static members,
and should be kept short for readability.

```java
class Test {
    public void say() {
        class LocalInnerClass { // Local class
            public void sayHello() {
                System.out.println("Hello!!!");
            }
        }
        LocalInnerClass lic = new LocalInnerClass();
        lic.sayHello();
    }
}
```
