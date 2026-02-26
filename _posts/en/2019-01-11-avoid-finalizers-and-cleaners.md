---
layout:   post
title:    "[Effective Java 3rd Edition] Item 8. Avoid Finalizers and Cleaners"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 8. Avoid finalizers and cleaners"
category: Java/Kotlin
comments: true
slug:     avoid-finalizers-and-cleaners
lang:     en
permalink: /en/post/avoid-finalizers-and-cleaners
---

# Object Finalizers

Java provides two object finalizers: the `finalize` method on `Object` and the `Cleaner` class introduced in **Java 9** under `java.lang.ref`.

Both run when the JVM performs garbage collection.
However, `finalize` is **deprecated in Java 9**, and Cleaner is also discouraged.
Here is why.

<a href="/post/java-finalize" target="_blank">Reference: Finalize method</a>

<br/>

# Why You Should Avoid Them

**You cannot guarantee the execution time.** Like `finalize`, `Cleaner` does not guarantee when it runs.

**It may never run.** Even if you accept delays, abnormal termination can prevent it from running at all.
So do not rely on it for anything that must happen.

**It can backfire.** When an object becomes unreachable, the finalizer is queued and executed later.
If `finalize` runs slowly, object reclamation slows down and can trigger `OutOfMemory`.

**It is slow.** Releasing resources with `AutoCloseable` and try-with-resources costs about 12ns,
while garbage collection with finalizers costs about 550ns.

**It is a security risk.** If you override `finalize` and make it slow, you can degrade the system.
Because it can be overridden, the method should be marked `final` to prevent malicious subclasses.

<br/>

# Why Use It At All?

Finalizers can release **native resources** that the garbage collector does not manage.
Because these are not Java objects, the GC does not reclaim them.
Calling a finalizer can release them.

Effective Java also notes that finalizers can serve as a safety net when developers **forget to call `close`**.
Personally, I still question whether calling `finalize` is better than forgetting `close`.

If you need cleanup, implement `AutoCloseable` and use try-with-resources,
or implement `close` and invoke it explicitly.
