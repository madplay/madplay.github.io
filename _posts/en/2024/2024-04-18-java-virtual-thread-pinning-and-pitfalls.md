---
layout: post
title: "Java Virtual Thread: Understanding and Mitigating Pinning"
author: madplay
tags: java virtual-thread pinning synchronized threadlocal jdk21
description: "When blocking I/O occurs within a synchronized block, it can lead to Pinning, where the carrier thread becomes tied up. Learn how to diagnose this using tracePinnedThreads and JFR, and how to transition to ReentrantLock."
category: Java/Kotlin
date: "2024-04-18 21:34:07"
comments: true
series: "Virtual Thread"
lang: en
slug: java-virtual-thread-pinning-and-pitfalls
permalink: /en/post/java-virtual-thread-pinning-and-pitfalls
---

# Virtual Thread Series

- <a href="/en/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: Introduction and Internal Mechanics</a>
- **Java Virtual Thread: Understanding and Mitigating Pinning**
- <a href="/en/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: Performance Benchmarking and Adoption Criteria</a>
- <a href="/en/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot Integration and Best Practices</a>
- <a href="/en/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux</a>

<br>

# When the Carrier Gets Tied Up

In the <a href="/en/post/java-virtual-thread-introduction" target="_blank">previous post</a>, we explored the core principles of Virtual Threads.
When a Virtual Thread encounters blocking I/O, it yields the carrier thread, which immediately picks up another Virtual Thread.
This structure allows thousands of tasks to run concurrently on a small number of carrier threads.

However, there are cases where this structure breaks down, situations where the carrier thread cannot be released even when blocking I/O occurs.
**This is known as Pinning.**

<br>

# What is Pinning?

Pinning occurs when a Virtual Thread is "stuck" to its carrier thread and cannot be unmounted.

Under normal circumstances, a Virtual Thread unmounts when it hits blocking I/O, allowing the carrier to continue with other work.
When Pinning happens, the carrier thread is blocked along with the Virtual Thread while waiting for I/O.
Since the number of carrier threads is proportional to the number of CPU cores, multiple instances of Pinning can exhaust all available carriers.
In this state, other Virtual Threads cannot get a chance to run, leading to a sharp drop in throughput.

## Scenarios Where Pinning Occurs

There are two primary causes:

- First, when blocking I/O occurs inside a `synchronized` block or method.
- Second, when blocking occurs during the execution of native code via JNI.

In this post, we will focus on the `synchronized` case, which is more commonly encountered in practice.

<br>

# Why Synchronized Causes Pinning

## Pinning in Code

Consider the following example using `synchronized` in a `NewsletterDispatcher`.

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;
    private int dispatchCount = 0;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public synchronized void dispatch(Subscriber subscriber, Newsletter newsletter) {
        mailClient.send(subscriber.email(), newsletter); // blocking I/O
        dispatchCount++;
    }
}
```

The `mailClient.send()` method is called inside a `synchronized` method.
While waiting for the SMTP response, this Virtual Thread cannot unmount from the carrier.
This is because the monitor lock is tied to the carrier thread when entering the `synchronized` block.

## Why the JVM Behaves This Way

The JVM specification defines monitor locks in association with OS threads.
Since the carrier might change when a Virtual Thread is unmounted and then remounted, it becomes ambiguous which OS thread owns the monitor.
To avoid this, the JVM does not allow unmounting within a `synchronized` block.

> This limitation is resolved in Java 24 (JEP 491). However, in JDK 21-23, blocking within `synchronized` still causes Pinning.

<br>

# Diagnosing Pinning

## -Djdk.tracePinnedThreads

You can use a JVM option to print stack traces when Pinning occurs.

```
-Djdk.tracePinnedThreads=short
```

`short` prints only the frames that caused Pinning, while `full` prints the entire stack trace. Starting with `short` is usually sufficient for development environments.

Example output:

```
Thread[#25,ForkJoinPool-1-worker-1,5,CarrierThreads]
    com.example.NewsletterDispatcher.dispatch(NewsletterDispatcher.java:12) <== monitors:1
```

`monitors:1` indicates that the thread is blocking while holding one monitor lock.

## JDK Flight Recorder

In production, you can track Pinning using the `jdk.VirtualThreadPinned` event in JFR (JDK Flight Recorder).
JFR is a low-overhead profiling tool built into the JDK that can be kept on or activated for specific intervals.

To start JFR recording, add the following JVM option:

```
-XX:StartFlightRecording=filename=recording.jfr,settings=default
```

After recording, you can filter and print only Pinning events:

```bash
jfr print --events jdk.VirtualThreadPinned recording.jfr
```

Example output:

```
jdk.VirtualThreadPinned {
  startTime = 2024-04-18T10:15:00.123456789Z
  duration = 523.1 ms
  eventThread = "ForkJoinPool-1-worker-1" (javaThreadId = 25)
  stackTrace = [
    com.example.NewsletterDispatcher.dispatch(NewsletterDispatcher.java:12)
    ...
  ]
}
```

A long `duration` means the carrier was tied up for that amount of time. If these values are large or frequent, they can be the direct cause of throughput degradation.

While `-Djdk.tracePinnedThreads` is great for immediate checks during development, JFR is better suited for long-term tracking in production.
Using both tools allows you to accurately pinpoint the location and impact of Pinning.

<br>

# Mitigation Strategies

## Switching to ReentrantLock

Using `java.util.concurrent.locks.ReentrantLock` instead of `synchronized` allows Virtual Threads to work with locks without Pinning.
Since `ReentrantLock` uses the JVM's parking mechanism rather than OS-level monitor locks, the carrier can unmount even during blocking.

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;
    private final ReentrantLock lock = new ReentrantLock();
    private int dispatchCount = 0;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(Subscriber subscriber, Newsletter newsletter) {
        lock.lock();
        try {
            mailClient.send(subscriber.email(), newsletter); // blocking I/O
            dispatchCount++;
        } finally {
            lock.unlock();
        }
    }
}
```

## Minimizing Lock Scope

In the code above, the entire `dispatch()` method is wrapped in a lock, creating a bottleneck.
Only state changes like `dispatchCount++` actually need protection.
Moving blocking I/O outside the lock reduces Pinning risks and increases parallelism.

```java
public void dispatch(Subscriber subscriber, Newsletter newsletter) {
    mailClient.send(subscriber.email(), newsletter); // I/O outside the lock

    lock.lock();
    try {
        dispatchCount++;
    } finally {
        lock.unlock();
    }
}
```

In this structure, multiple Virtual Threads can execute `mailClient.send()` concurrently, entering the lock sequentially only to update the counter.

## Synchronized in Third-Party Libraries

While you can fix your own code, it's harder when a library you depend on uses `synchronized` internally.

In such cases, you have three options:

- Check if the library has been updated. Hibernate and several connection pool implementations have already released patches.
- Isolate calls to that library in a separate thread pool to limit the impact of carrier exhaustion.
- Consider upgrading to Java 24 or later.

<br>

# Cautions with ThreadLocal

## Virtual Threads and ThreadLocal

In platform thread pools, threads are reused. Values stored in `ThreadLocal` might unexpectedly persist into the next task.

Virtual Threads create a new thread for every task.
While this eliminates "pollution" issues, it introduces initialization overhead for every task.
Storing heavy objects in `ThreadLocal` while spawning tens of thousands of Virtual Threads can put significant pressure on the heap memory.

## Cautions with MDC

Logging frameworks like MDC (Mapped Diagnostic Context) use `ThreadLocal` internally.
While MDC works fine with Virtual Threads, it's good practice to explicitly call `MDC.clear()` at the end of a task.
Although Virtual Threads aren't typically reused, clearing them is a good habit for memory management.

```java
executor.submit(() -> {
    MDC.put("subscriberId", subscriber.id());
    try {
        mailClient.send(subscriber.email(), newsletter);
    } finally {
        MDC.clear();
    }
});
```

<br>

# Wrapping Up

The principle that Virtual Threads yield the carrier during blocking I/O stops at the doorstep of `synchronized`.
Knowing that the carrier becomes tied up due to monitor lock ownership issues within `synchronized` blocks helps in making faster decisions when writing code.

In reality, you'll encounter `synchronized` methods inside libraries more often than in your own code. Identifying where Pinning occurs using `-Djdk.tracePinnedThreads=short` is the essential first step.

In the next post, we'll measure just how fast Virtual Threads really are in I/O-intensive workloads using JMH.

- <a href="/en/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: Performance Benchmarking and Adoption Criteria</a>
