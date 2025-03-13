---
layout:   post
title:    Java Language Characteristics
author:   Kimtaeng
tags: 	  java
description: Java is object-oriented and platform independent, and it supports multithreading and encapsulation. What else defines the language?
category: Java
comments: true
slug:     java-characteristic
lang:     en
permalink: /en/post/java-characteristic
---

# Characteristics of the Java Language and Runtime
Java and its runtime provide distinctive characteristics such as object orientation, multithreading, and platform independence. Below is a quick tour.

## 1. Object-Oriented
- Java is an object-oriented language that supports class hierarchies, inheritance, polymorphism, and encapsulation.

<br/>

## 2. Multithreading
- Java provides an environment where multiple threads can run concurrently within a single program.
- Many languages such as C and C++ rely on OS support for multithreading, but Java enables multithreaded programming without explicit OS-level APIs.

<br/>

## 3. Platform Independence
- Java compiles to platform-independent bytecode rather than hardware- or OS-specific binaries.
- With a Java Virtual Machine, Java programs run on any hardware or OS.

<br/>

## 4. Executable Modules
- Java applications consist of one or more class files.
- Execution starts from the main method, and a class file can have only one main method, but multiple class files can each declare their own main method.

<br/>

## 5. Encapsulation in Classes
- Java follows encapsulation strictly: variables and methods are implemented inside classes.
- There are no variables or methods that exist outside a class, and you can define inner classes within a class.

<br/>

## 6. Packages
- Related classes can be grouped into packages, similar to folders in a file system.
- For example, the `java.lang.System` class maps to the `System.class` file under the `java/lang` directory, and `java.lang` is the package name.

<br/>

## 7. Source Files and Class Files
- A single Java source file can define multiple classes, but each class file contains exactly one compiled class.
- Compiling a source file with multiple classes produces a separate class file for each class.
- For example, the following source produces multiple class files:

```java
public class A {	
    ...
}

class B {
	...
}
class C {
	...
	class D {
        ...
    }
}

```

Compiling `A.java` produces A.class, B.class, C.class, and C&D.class.

Here, class D is an inner class declared inside class C, and only one class in a Java source file can be declared **public**.
Also, the name of a `public` class must match the source file name.
