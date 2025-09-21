---
layout:   post
title:    "[Effective Java 3rd Edition] Item 78. Synchronize Access to Shared Mutable Data"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 78. Synchronize access to shared mutable data" 
category: Java
lang: en
slug: synchronize-access-to-shared-mutable-data
permalink: /en/synchronize-access-to-shared-mutable-data/
date: "2019-09-15 22:19:29"
comments: true
---

# synchronized Keyword
Use `synchronized` to ensure methods or blocks execute by only one thread at a time.
When synchronization is used correctly, no method observes an inconsistent object state.
A thread entering a synchronized method or block sees results of all prior modifications performed under the same lock.
In single-threaded programs, synchronization is less relevant.
In multithreaded programs, you must consider synchronization for shared objects.

<br/>

# Atomic
According to Java language specification, reads/writes for variables except `long` and `double` are atomic.
That means even without synchronization, concurrent writes by multiple threads still produce some valid stored value.

However, while reads can obtain a fully-written value,
Java does **not guarantee visibility** from one thread's write to another thread automatically.
So even with atomic data types, synchronization can still be necessary.

<br/>

# Bad Example: No Synchronization
Let's look at what happens when synchronization is incorrect.
How long will this code run?

```java
public class StopThread {
    private static boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

After `start`, once sleep ends after 1 second, you might expect the loop to stop because `stopRequested` becomes true.
In reality, the program may never terminate.
Without synchronization, the updated boolean value from main thread may never become visible to the background thread in time.
Also, without synchronization, JVM may apply an optimization like below.

```java
// Original code
while (!stopRequested)
    i++;

// Optimized code
if (!stopRequested)
    while (true)
        i++;
```

This is JVM **hoisting** optimization.
The result is liveness failure where code stops making progress.
To fix shared-variable access, add synchronization.

```java
public class StopThread {
    private static boolean stopRequested;

    private static synchronized void requestStop() {
        stopRequested = true;
    }

    private static synchronized boolean stopRequested() {
        return stopRequested;
    }

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested())
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        requestStop();
    }
}
```

Synchronization is required for both reads and writes.
If you synchronize both read/write methods for shared fields, this issue is solved.

<br/>

# volatile
`volatile` is not about mutual exclusion, but it guarantees reading the most recently written value.
Conceptually, reads/writes go to main memory rather than CPU cache.
So both read/write operations happen against main memory visibility.

```java
public class stopThread {
    private static volatile boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

With `volatile`, you can omit synchronization in this case.
But use it carefully.
The following example has a problem.

```java
private static volatile int nextSerialNumber = 0;

public static int generateSerialNumber() {
    return nextSerialNumber++;
}
```

The increment operator looks single-step in code, but actually accesses the volatile field twice:
read current value, increment by one, then write back.
If a second thread runs between those operations, both threads can observe same value.

This wrong-result error is called **safety failure**.
Fix it by synchronizing the method and removing `volatile` from the shared field.

<br/>

# atomic Package
`java.util.concurrent.atomic` provides lock-free thread-safe classes.
`volatile` supports visibility, while this package also supports atomicity (mutual exclusion semantics for operations).
It also usually performs better than synchronized versions.

```java
private static final AtomicLong nextSerialNum = new AtomicLong();

public static long generateSerialNumber() {
    return nextSerialNum.getAndIncrement();
}
```

<br/>

# Conclusion
The best way to avoid synchronization problems is not to share mutable data.
In other words, use mutable data in a single thread when possible.
If one thread modifies data and then shares it with others, synchronize only the shared parts of that object.
This handoff pattern is called **safe publication**.
You can safely publish via static fields during class initialization, volatile fields, final fields,
fields guarded by regular locks, or concurrent collections.
