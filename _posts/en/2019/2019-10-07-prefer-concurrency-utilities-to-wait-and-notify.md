---
layout:   post
title:    "[Effective Java 3rd Edition] Item 81. Prefer Concurrency Utilities to wait and notify"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 81. Prefer concurrency utilities to wait and notify"
category: Java/Kotlin
lang: en
slug: prefer-concurrency-utilities-to-wait-and-notify
permalink: /en/prefer-concurrency-utilities-to-wait-and-notify/
date: "2019-10-07 23:19:34"
comments: true
---

# concurrent Package
`java.util.concurrent` provides high-level concurrency utilities.
It can be grouped into three areas: executor framework, concurrent collections, and synchronizers.
Let's review each. For executor framework details, use the link below.

- <a herf="/post/prefer-executors-tasks-and-streams-to-threads" target="_blank">
Reference: "[Effective Java 3rd Edition] Item 80. Prefer executors, tasks, and streams to threads"</a>

<br/>

# Concurrent Collections
These add concurrency support to standard collection interfaces like `List`, `Queue`, and `Map`.
Synchronization is handled internally for high concurrency.
You cannot disable this safely, and external locking can reduce performance.

<br/>

# State-Dependent Methods
Because concurrent collections should not be externally synchronized,
you also cannot safely group arbitrary method calls into one atomic sequence.
So **state-dependent methods** were added to bundle frequent operations atomically.
Some became so useful that they were added as default methods in common collection interfaces.

For example, `putIfAbsent` is a default method on `Map`.
It inserts a value only if the key is absent.
If a value already exists, it returns that value; if not, it returns null.
You can mimic `String.intern` as follows.

```java
private static final ConcurrentMap<String, String> map =
        new ConcurrentHashMap<>();

public static String intern(String s) {
    String result = map.get(s);
    if (result == null) {
        result = map.putIfAbsent(s, s);
        if (result == null) {
            result = s;
        }
    }
    return result;
}
```

Prefer concurrent collections over synchronized wrappers.
For example, `ConcurrentHashMap` is generally better than `Collections.synchronizedMap`.
Replacing synchronized maps with concurrent maps alone can improve performance.

<br/>

# Synchronizers
Synchronizers let threads wait for other threads and coordinate work.
Representative examples are `CountDownLatch` and `Semaphore`, plus `CyclicBarrier` and `Exchanger`.
A more powerful synchronizer is `Phaser`.

`CountDownLatch` lets one or more threads wait until one or more other threads complete work.
The constructor argument defines how many times `countDown` must be called before waiting threads are released.

For example, you can measure elapsed time for concurrently started actions as below.

```java
public class CountDownLatchTest {
    public static void main(String[] args) {

        ExecutorService executorService = Executors.newFixedThreadPool(5);
        try {
            long result = time(executorService, 3,
                    () -> System.out.println("hello"));
            System.out.println(result);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            executorService.shutdown();
        }
    }

    public static long time(Executor executor, int concurrency,
                            Runnable action) throws InterruptedException {
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);

        for (int i = 0; i < concurrency; i++) {
            executor.execute(() -> {
                // Signal that this worker is ready to the timer.
                ready.countDown();
                try {
                    // Wait until all worker threads are ready.
                    start.await();
                    action.run();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    // Signal completion to the timer.
                    done.countDown();
                }
            });
        }

        ready.await(); // Wait until all workers are ready.
        long startNanos = System.nanoTime();
        start.countDown(); // Release workers.
        done.await(); // Wait for all workers to finish.
        return System.nanoTime() - startNanos;
    }
}
```

In this code, the executor must be able to create at least `concurrency` threads.
Otherwise execution may never complete, which is called thread-starvation deadlock.
Also, for timing, `System.nanoTime` is more accurate because it is independent of wall-clock time.

<br/>

# wait and notify Methods
For new code, prefer concurrency utilities instead of `wait` and `notify`.
If you must use them, always call them inside synchronized regions,
and always use them inside loops.

```java
synchronized (obj) {
    while (condition is not satisfied) {
        obj.wait(); // Releases lock, then reacquires on wake-up.
    }

    ... // Perform action when condition is satisfied.
}
```
The loop checks condition validity before and after `wait`.
Checking before waiting prevents **liveness failure**.
If condition is already true, the thread can skip waiting.
If a thread enters waiting after `notify` or `notifyAll` was already called,
it might never be woken again.

Checking again after wake-up prevents **safety failure** from computing invalid results.
A thread can still wake up even when condition is not satisfied:

- Another thread acquires lock after `notify` wakes a waiting thread.
- `notify` is called by mistake or maliciously even when condition is not satisfied.
- `notifyAll` wakes all waiting threads even when only some conditions are satisfied.
- Rarely, a waiting thread wakes without notification (spurious wakeup).

In general, `notifyAll` is safer than `notify`, and `wait` should always be called inside a `while` loop.
