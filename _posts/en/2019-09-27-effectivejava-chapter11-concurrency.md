---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 11. Concurrency"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter11: Concurrency"
category: Java
lang: en
slug: effectivejava-chapter11-concurrency
permalink: /en/effectivejava-chapter11-concurrency/
date: "2019-09-27 23:25:42"
comments: true
---

# Table of Contents
- <a href="#item-78-synchronize-access-to-shared-mutable-data">Item 78. Synchronize access to shared mutable data</a>
- <a href="#item-79-avoid-excessive-synchronization">Item 79. Avoid excessive synchronization</a>
- <a href="#item-80-prefer-executors-tasks-and-streams-to-threads">Item 80. Prefer executors, tasks, and streams to threads</a>
- <a href="#item-81-prefer-concurrency-utilities-to-wait-and-notify">Item 81. Prefer concurrency utilities to wait and notify</a>
- <a href="#item-82-document-thread-safety">Item 82. Document thread safety</a>
- <a href="#item-83-use-lazy-initialization-judiciously">Item 83. Use lazy initialization judiciously</a>
- <a href="#item-84-dont-depend-on-the-thread-scheduler">Item 84. Don’t depend on the thread scheduler</a>

<br>

# Item 78. Synchronize Access to Shared Mutable Data {#item-78-synchronize-access-to-shared-mutable-data}
> Synchronize access to shared mutable data

If multiple threads share mutable data, reads and writes must be synchronized.
Otherwise threads may observe unintended values.

- <a href="/post/synchronize-access-to-shared-mutable-data" target="_blank">
For details: [Effective Java 3rd Edition] Item 78. Synchronize access to shared mutable data</a>

<div class="post_caption">When multiple threads share mutable data, synchronize both read and write operations.</div>

<br><br>

# Item 79. Avoid Excessive Synchronization {#item-79-avoid-excessive-synchronization}
> Avoid excessive synchronization

Lack of synchronization is harmful, but excessive synchronization is also harmful.
It can reduce performance, cause deadlocks, and even produce unpredictable failures.

- <a href="/post/avoid-excessive-synchronization" target="_blank">
For details: [Effective Java 3rd Edition] Item 79. Avoid excessive synchronization</a>

<div class="post_caption">Never hand control to clients inside synchronized methods or blocks.</div>

<br><br>

# Item 80. Prefer Executors, Tasks, and Streams to Threads {#item-80-prefer-executors-tasks-and-streams-to-threads}
> Prefer executors, tasks, and streams to threads

You can manage threads directly, but using the `concurrent` package yields much simpler code.

- <a href="/post/prefer-executors-tasks-and-streams-to-threads" target="_blank">
For details: [Effective Java 3rd Edition] Item 80. Prefer executors, tasks, and streams to threads</a>

<div class="post_caption">Use the executor framework instead of managing threads directly.</div>

<br><br>

# Item 81. Prefer Concurrency Utilities to wait and notify {#item-81-prefer-concurrency-utilities-to-wait-and-notify}
> Prefer concurrency utilities to wait and notify

Use higher-level utilities instead of `wait` and `notify`.
Utilities in `java.util.concurrent` are broadly grouped into executor framework,
concurrent collections, and synchronizers.

- <a href="/post/prefer-concurrency-utilities-to-wait-and-notify" target="_blank">
For details: [Effective Java 3rd Edition] Item 81. Prefer concurrency utilities to wait and notify</a>

<div class="post_caption">Use concurrency utilities instead of wait/notify methods.</div>

<br><br>

# Item 82. Document Thread Safety {#item-82-document-thread-safety}
> Document thread safety

`synchronized` itself does not document thread-safety policy.
For conditionally thread-safe classes, clients need to know required call order and required external locks.
For unconditionally thread-safe classes, private lock objects are preferred.

- <a href="/post/document-thread-safety" target="_blank">
For details: [Effective Java 3rd Edition] Item 82. Document thread safety</a>

<div class="post_caption">Document thread-safety characteristics explicitly.</div>

<br><br>

# Item 83. Use Lazy Initialization Judiciously {#item-83-use-lazy-initialization-judiciously}
> Use lazy initialization judiciously

In short: do not use it until necessary.
Lazy initialization postpones field initialization until first use, usually for optimization.
But depending on initialization cost, access patterns, and usage ratio,
it can degrade performance instead of improving it.
In most cases, normal eager initialization is better.

```java
// Typical initialization for instance field
private final FieldType field = computeFieldValue();
```

If lazy initialization helps break initialization cycles, use a synchronized accessor.

```java
private FieldType field;

private synchronized FieldType getField() {
    if (field == null)
        field = computeFieldValue();
    return field;
}
```

For static field lazy initialization with performance concerns, use lazy holder class.

```java
private static class FieldHolder {
    static final FieldType field = computeFieldValue();
}

private static FieldType getField() { 
    return FieldHolder.field;
}
```

For instance field lazy initialization with performance concerns, use double-check idiom.
The local variable `result` helps ensure one field read when already initialized.

```java
// Must be declared volatile
private volatile FieldType field;

private FieldType getField() {
    FieldType result = field;
    if (result != null) // first check (no lock)
        return result;

    synchronized(This) {
        if (field == null) // second check (with lock)
            field = computeFieldValue();
        return field;
    }
}
```

If repeated initialization is acceptable, second check can be removed (single-check idiom).

```java
// volatile is still required.
private volatile FieldType field;

private FieldType getField() {
    FieldType result = field;
    if (result == null)
        field = result = computeFieldValue();
    return result;
}
```

For primitive field types other than long/double, even volatile may be removable in this single-check variant.

<div class="post_caption">Lazy initialization can degrade performance in some cases.</div>

<br><br>

# Item 84. Don’t Depend on the Thread Scheduler {#item-84-dont-depend-on-the-thread-scheduler}
> Don’t depend on the thread scheduler

## Do not depend on scheduler behavior
When multiple threads run, OS thread scheduler decides execution order.
Policies differ by operating system.
So application behavior should not rely on specific scheduling behavior.
Otherwise performance differs by platform and portability suffers.

## Characteristics of performant and portable programs
Average number of runnable threads should not significantly exceed number of processors.
Then scheduler has less contention to resolve.
Runnable threads should continue until assigned work completes.

To keep runnable thread count low, each thread should wait after finishing current work until new work arrives.
A thread with no work should not stay runnable.

With executor frameworks, this means sizing thread pools properly and keeping tasks reasonably short.
Too short tasks can also degrade performance.

## Never keep threads in busy-wait state
Do not spin continuously checking shared state changes.
Busy waiting is vulnerable to scheduler variance and wastes CPU,
stealing execution opportunities from useful work.

```java
public class SlowCountDownLatch {
    private int count;

    public SlowCountDownLatch(int count) {
        if (count < 0)
            throw new IllegalArgumentException(count + " < 0");
        this.count = count;
    }

    public void await() {
        while (true) {
            synchronized(this) {
                if (count == 0)
                    return;
            }
        }
    }

    public synchronized void countDown() {
        if (count != 0)
            count--;
    }
}
```

This code is much slower than `CountDownLatch` from `concurrent` package.
When one or more threads stay runnable unnecessarily, performance and portability drop.

`Thread.yield` gives execution chance to other threads.
Even when a program seems to progress only because one thread rarely gets CPU time,
using `yield` is usually a bad fix.

It is hard to test reliably, and even if performance improves on one platform,
portability can worsen.
A better approach is redesigning structure to reduce simultaneous runnable threads.
Changing thread priority is also risky and highly non-portable.

<div class="post_caption">Do not rely on thread scheduler behavior for program correctness.</div>
