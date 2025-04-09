---
layout:   post
title:    "[Effective Java 3rd Edition] Item 50. Make Defensive Copies When Needed"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 50. Make defensive copies when needed"
category: Java
comments: true
slug:     make-defensive-copies-when-needed
lang:     en
permalink: /en/post/make-defensive-copies-when-needed
---

# Is Java Safe?

Because Java avoids native methods, it is safe from memory hazards like buffer overruns, array overruns, and wild pointers in **C/C++**.
But you still have to assume clients can break invariants and code defensively.

<br/>

# A Class That Breaks Its Invariants

Java’s `Date` is mutable, so it is easy to break invariants.

<a href="/post/reasons-why-javas-date-and-calendar-was-bad" target="_blank">
Reference: Why Java Date and Calendar Are a Bad Fit
</a>

```java
import java.util.Date;

class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        if(start.compareTo(end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
        this.start = start;
        this.end = end;
    }
    public Date start() { return start; }
    public Date end() { return end; }
    // ... omitted
}

class Item50Test {
    public void someMethod() {
        Date start = new Date();
        Date end = new Date();
        Period period = new Period(start, end);

        // deprecated method
        // modified the internal state of period
        end().setMonth(3);
    }

    public static void main(String[] args) {
        Item50Test main = new Item50Test();
        main.someMethod();
    }
}   
```

Most `Date` methods are **deprecated**, so avoid them.
Use `LocalDateTime` and related types from **Java 8**.

<a href="/post/java8-date-and-time" target="_blank">Reference: Java 8 Date and Time</a>

To protect against external mutation, **defensively copy** mutable parameters in the constructor.
Update the constructor as follows.

```java
// the rest is the same
public Period(Date start, Date end) {
    this.start = new Date(start.getTime());
    this.end = new Date(end.getTime());

    // copy before validation
    if(start.compareTo(end) > 0) {
        throw new IllegalArgumentException(start + " after " + end);
    }
}
```

Copy before validation. In a multithreaded context, another thread can mutate the original between validation and copy.
This is a time-of-check / time-of-use attack, or **TOCTOU**.

Do not use `clone` when the parameter type is not `final`, because a subclass can override `clone` and return a different subtype.
For example, `Date` can be subclassed, which makes `clone` unsafe.

Even with a defensive constructor, the getters return mutable `Date` objects, so the class is still vulnerable.

```java
public void someMethod() {
    Date start = new Date();
    Date end = new Date();
    Period period = new Period(start, end);

    // deprecated method
    // modified the internal state again
    period.end().setMonth(3);
}  
```

To close this hole, return defensive copies in the accessors:

```java
class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end = new Date(end.getTime());

        if(start.compareTo(end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
    }
    public Date start() { 
        return new Date(start.getTime());
    }
    public Date end() { 
        return new Date(end.getTime());
    }
    // ... omitted
}
```

Unlike the constructor, using `clone` in accessors is safe because you control the returned type.

<br/>

# Summary

If a class receives or returns mutable components, it must defensively copy them.
That said, defensive copies are not always necessary. They add overhead.
If you can guarantee that clients never mutate the object (for example, same-package usage or strict discipline), you can skip the copy.

That does not mean you must always defensively copy when crossing packages.
Passing an object as a parameter also transfers some control to the callee.
The caller should avoid mutating it after passing it in. If that guarantee holds, defensive copies are optional.
