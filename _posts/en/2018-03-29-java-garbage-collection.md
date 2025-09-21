---
layout:   post
title:    Java Garbage Collection
author:   madplay
tags: 	  Java Garbage GC
description: Learning about Garbage, which refers to memory no longer in use, and Garbage Collection, which cleans it up.
category: Java
comments: true
slug:     java-garbage-collection
lang:     en
permalink: /en/post/java-garbage-collection
---

# What is Garbage?
Garbage is also called invalid area and refers to **memory that is no longer in use**.
Objects or Array memory that were allocated from the heap area using Java's `new` operator and used but are no longer in use
correspond to garbage.

Here, "no longer in use" means that there are no references pointing to objects or arrays.

<br>

# Cases Where Garbage Occurs
Garbage can occur even in simple code like below.

```java
/**
 * Garbage & Garbage Collection in Java
 * @author Kimtaeng
 */
public class MadPlay {
    public static void main(String[] args) {
        MadMan madMan1 = new MadMan("Kim");
        MadMan madMan2 = new MadMan("Taeng");

        /* Object that madMan2 was pointing to becomes garbage. */
        madMan2 = madMan1;
        
        /*
         * Code below omitted,
         * No code exists that points to MadMan object with name Taeng
         */ 
    }
}

class MadMan {
    private String name;

    public MadMan(String name) {
        this.name = name;
    }
}
```

The madMan2 reference was pointing to a MadMan object with name "Taeng", but due to the `madMan2 = madMan1;` code in the above example,
from then on, it points to an object with name field "Kim" that the madMan1 reference points to.

Due to this, the object that the madMan2 reference initially pointed to is no longer referenced by any reference variable and cannot be accessed.
This is garbage.

Garbage can also occur in situations like below.
 
```java
/**
  * Garbage & Garbage Collection in Java
  * @author Kimtaeng
  */
 public class MadPlay {
     public static void main(String[] args) {
         String testVar1 = new String("MadPlay");
         String testVar2 = new String("MadLife");
         String testVar3 = new String("Kimtaeng");
         String testVar4 = null;
 
         testVar1 = null;
         testVar4 = testVar3;
         testVar3 = null;
     }
 }
```

Due to the `testVar1 = null;` statement, there's no reference variable pointing to the String object "MadPlay".
Therefore, it became garbage.

On the other hand, reference variable testVar3 was initialized to null so it doesn't point to an object, but since testVar4 points to it in the line immediately above,
the String object "Kimtaeng" does not become garbage.

Finally, the object with name "MadLife" does not become garbage because reference variable testVar2 points to it until program execution ends.

<br>

# What is Garbage Collection?
The work of collecting garbage and increasing usable memory space is called **Garbage Collection**.
And the thing that performs this work is called a **Garbage Collector**.

Java Virtual Machine has a Garbage Collection Thread that performs the role of Garbage Collector.
When garbage increases, relatively available memory that can be allocated decreases, and in the worst case, situations where memory can no longer be allocated
can occur.

On the other hand, since Garbage Collection is performed by judgment of JVM's internal algorithms, it's difficult to know when Garbage Collection occurs.
Thinking of valet parking service that receives car keys, parks, and turns off the engine makes it easy to understand.

There's also a way to hope (?) that Garbage Collection will execute. You can request Garbage Collection by calling the gc() method of System or Runtime objects.

```java
System.gc(); 
or
Runtime.getRuntime().gc();
```

However, the above code is literally a hopeful "request". Garbage Collector doesn't operate immediately after executing the above statement.
Because Garbage Collection is judged by Java Virtual Machine (JVM) as mentioned earlier.

<br>

# In Summary
Unlike C++ language's new and delete operators, Java only provides the new operator for creating objects.
In C++'s case, constructors are called when creating objects, and destructors are called when releasing objects from memory,
but in Java, Garbage Collector directly performs the role of releasing objects from memory.

That doesn't mean there's no concept of destructors. If you look at the `java.lang.Object` class, the `finalize()` method exists.
Garbage Collector internally calls this method to release objects from memory.

- <a href="/en/post/java-finalize" target="_blank">Reference Link: Java Finalize Method</a>
