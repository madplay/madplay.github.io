---
layout:   post
title:    Singleton Pattern
author:   Kimtaeng
tags: 	  DesignPattern
description: Learning about the singleton pattern that limits the number of objects. And why is the singleton pattern called an anti-pattern?
category: DesignPattern
date: "2018-03-06 00:13:21"
comments: true
slug:     singleton-pattern
lang:     en
permalink: /en/post/singleton-pattern
---

# What is the Singleton Pattern?
The Singleton Pattern is a method of limiting the number of class objects. Usually, as the pattern name suggests,
it forces only one object to exist.

But why limit to just one? Consider a **Logger** that simply logs as an example.

If you create a logger object every time you log, it will continuously consume resources.
In Java terms, it's allocating objects to Heap memory through `new()`.

In such cases, creating only one logger (Logger) object and using the same object every time you log
can be a way to reduce system resource consumption.

<br>

# How to Use It?
First, to prevent external creation of that class's objects, the constructor must be declared with **private** access modifier.

Also, define it as a static method so objects can be referenced from any area.
Writing the above rules in Java code looks like this:

```java
/**
 * Basic structure of singleton pattern
 * @author Kimtaeng
 */
public class MadPlay {
	private static MadPlay instance;

    /* 
     * Constructor declared with private access modifier
     */
	private MadPlay() {}

	public static MadPlay getInstance() {
		if (instance == null) {
			instance = new MadPlay();
		}
		return instance;
	}
}
```

<br>

# Is Only One Object Guaranteed to Be Created?
When looking at the basic structure of the singleton pattern above, questions may arise.
**"Can we guarantee that only one object exists in any case?"**

In environments where 2 or more threads are running, not single threads, that is, in multi-threading environments, even if you apply the singleton pattern where only one object should be created,
two or more objects can be created.

This can occur when multiple threads simultaneously access the `getInstance()` method for the first time.

```java
/* What happens if two or more threads access simultaneously before an object is created? */
public static MadPlay getInstance() {
    if(instance == null) {
        instance = new MadPlay();
    }
    return instance;
}
```

<br>

# How to Solve Problems in Multi-threading Environments?

## Method of Creating Objects in Advance at Class Loading Time
This method affects program start time and unconditionally occupies memory.

```java
/**
 * Object creation at class loading time
 * @author Kimtaeng
 */
public class MadPlay {
	private static MadPlay instance = new MadPlay();

    /*
     * Constructor declared with private access modifier
     */
	private MadPlay() {}

	public static MadPlay getInstance() {
		return instance;
	}
}
```

<br>

## Method of Synchronizing getInstance() Method
Since it locks the entire method, it's slow.
Actually, the moment synchronization is needed is when this method starts, so if an object is already created, there's no need to keep this method synchronized.
If it's kept synchronized, speed is affected every time the method is called to reference that reference.

```java
/**
 * Synchronizing getInstance() method
 * @author Kimtaeng
 */
public class MadPlay {
	private static MadPlay instance;

    /**
     * Constructor declared with private access modifier
     */
	private MadPlay() {}

    /**
     * Other threads wait until one thread finishes using the method.
     * That is, two or more threads never execute this method simultaneously.
     */
	public static synchronized MadPlay getInstance() {
		if(instance == null) {
            instance = new MadPlay();
        }
        return instance;
	}
}
```

<br>

## Method Using DCL (Double-Checking Locking)
It synchronizes the `getInstance()` method, but it's a method of reducing that area.
After checking if an object is created, it synchronizes if not created. Simply put, synchronize only at first and don't synchronize afterward.

```java
/**
 * Double-Checking Locking
 * @author Kimtaeng
 */
public class MadPlay {
    /* volatile keyword */
	private volatile static MadPlay instance;

    /**
     * Constructor declared with private access modifier
     */
	private MadPlay() {}

    /**
     * synchronized keyword is removed from the method.
     */
	public static MadPlay getInstance() {
		if(instance == null) {
            synchronized (MadPlay.class) {
                if(instance == null) {
                    instance = new MadPlay();
                }
            }
        }
        return instance;
	}
}
```

Other than the synchronization declaration part, what changed is that the `volatile` keyword was used on the instance reference,
which ensures that the CPU doesn't use cached memory when referencing objects but gets values directly from memory.

> Content about Java's volatile keyword will be covered in another post.
> For now, let's just note that Threads usually read values by referencing Cache Memory!

## Method Using enum
Uses the fact that enum is initialized only once within a program.

The methods presented above have the point that you must directly implement Serializable if you need to **serialize**,
but in the case of enum, that class is automatically Serializable while guaranteeing that it's objectified only once.

- <a href="/en/post/java-serialization" target="_blank">Reference Link: "Java Serialization: Serialization and Deserialization"</a>

```java
/**
 * Singleton using enum
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public enum MadPlay {
	INSTANCE;

	public static MadPlay getInstance() {
		return INSTANCE;
	}
}
```

You can actually see this by checking the compiled source of the above code through the `javap` command in the terminal.

<img class="post_image" width="700" alt="javap compile result"
src="{{ site.baseurl }}/img/post/2018-03-06-singleton-pattern-1.png" />

<div class="post_caption">"javap is a disassembly method that only shows the basic internal structure of class files and JVM binary code.
It differs from decompilation which converts classes to original source."</div>

<br>

# In Summary
The advantage of singleton is resource saving through single object creation as mentioned at the beginning. Also, it has the advantage of being efficiently usable in situations where specific objects are shared.

On the other hand, as disadvantages, first, resources are consumed and it's difficult to know when they're released.
And since it can be called from anywhere, it's no different from global variables, and when structure changes, the change area increases.

It's a point that doesn't match **OOP (Object-Oriented Programming)** concepts. OOP concepts emerged along with research and patterns on objects themselves,
but the singleton pattern is rather recognized as an **Anti Pattern** that should be avoided even though commonly used.

For reference, Java itself has things implemented as singletons by default.
- <a href="https://docs.oracle.com/javase/7/docs/api/java/lang/Runtime.html" target="_blank" rel="nofollow">
Reference Link: java.lang.Runtime</a>
- <a href="https://docs.oracle.com/javase/7/docs/api/java/awt/Desktop.html" target="_blank" rel="nofollow">
Reference Link: java.awt.Desktop</a>
