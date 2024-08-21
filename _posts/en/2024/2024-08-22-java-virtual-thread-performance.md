---
layout: post
title: "Java Virtual Thread: Performance Benchmarking and Adoption Criteria"
author: madplay
tags: java virtual-thread jmh benchmark performance concurrency
description: "We measured the performance of Virtual Threads for both I/O and CPU-bound tasks using JMH. This post summarizes the comparison with platform threads, the limitations in CPU-intensive scenarios, and adoption criteria based on workload."
category: Java/Kotlin
date: "2024-08-22 08:43:19"
comments: true
series: "Virtual Thread"
lang: en
slug: java-virtual-thread-performance
permalink: /en/post/java-virtual-thread-performance
---

# Virtual Thread Series

- <a href="/en/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: Introduction and Internal Mechanics</a>
- <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Understanding and Mitigating Pinning</a>
- **Java Virtual Thread: Performance Benchmarking and Adoption Criteria**
- <a href="/en/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot Integration and Best Practices</a>
- <a href="/en/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux</a>

<br>

# Before Believing the "Faster" Hype

In previous posts, we explored the mechanics of Virtual Threads and the issue of Pinning.
While there is plenty of talk about how "fast" Virtual Threads are, it's hard to get a real feel for their performance without measuring them under specific conditions.
In this post, we'll look at actual performance data obtained using JMH (Java Microbenchmark Harness).

The benchmarks were conducted using Java 21 on an 8-core machine.
Since the number of carrier threads in the Virtual Thread scheduler defaults to the number of cores, comparing them against a platform thread pool of size 8 is appropriate for CPU-centric scenarios.

<br>

# Benchmark Environment and Scenarios

## What is JMH?

JMH is a microbenchmark tool for the JVM. It automatically handles benchmark variables like warm-up to reduce JIT compilation impact, GC interference removal, and repeated measurements.

```groovy
dependencies {
    testImplementation 'org.openjdk.jmh:jmh-core:1.37'
    annotationProcessor 'org.openjdk.jmh:jmh-generator-annprocess:1.37'
}
```

## Scenario Design

We measured performance across two distinct scenarios:

**Scenario A: I/O-Bound (Newsletter Dispatch Simulation)**

Each task blocks for 50ms, simulating waiting for an SMTP response using `Thread.sleep(50)`. We measured the total time to process 500 dispatches.

**Scenario B: CPU-Bound (Hash Calculation)**

Each task repeatedly calculates a SHA-256 hash 500,000 times, continuously utilizing the CPU without blocking. We measured the total time to process 500 tasks.

## Comparison Targets

- **Platform Thread Pool (200)**: `Executors.newFixedThreadPool(200)`
- **Platform Thread Pool (8)**: A small pool matching the core count.
- **Virtual Thread**: `Executors.newVirtualThreadPerTaskExecutor()`

<br>

# Scenario A: I/O-Bound Benchmark

## Code Implementation

Key JMH annotations used:

- `@BenchmarkMode(Mode.AverageTime)`: Measures the average execution time across iterations.
- `@Warmup` / `@Measurement`: Performs 3 warm-up iterations followed by 5 measurement iterations to ensure JIT stability.
- `@State(Scope.Benchmark)`: Shares the benchmark instance across the entire measurement interval.

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(1)
@State(Scope.Benchmark)
public class NewsletterDispatchBenchmark {

    private static final int TASK_COUNT = 500;
    private static final long IO_DELAY_MS = 50;

    @Benchmark
    public void platformThread_pool200() throws InterruptedException {
        runWithExecutor(Executors.newFixedThreadPool(200));
    }

    @Benchmark
    public void platformThread_pool8() throws InterruptedException {
        runWithExecutor(Executors.newFixedThreadPool(8));
    }

    @Benchmark
    public void virtualThread() throws InterruptedException {
        runWithExecutor(Executors.newVirtualThreadPerTaskExecutor());
    }

    private void runWithExecutor(ExecutorService executor) throws InterruptedException {
        try (executor) {
            CountDownLatch latch = new CountDownLatch(TASK_COUNT);
            for (int i = 0; i < TASK_COUNT; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(IO_DELAY_MS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        latch.countDown();
                    }
                });
            }
            latch.await();
        }
    }
}
```

The `close()` method in the `try-with-resources` block internally calls `shutdown()` and `awaitTermination()`, waiting for all tasks to complete.
While it works without a `CountDownLatch`, I've included it here to explicitly indicate the task completion point in the code.

## Results

| Execution Method | Average Execution Time |
|---|---|
| Platform Thread Pool (8) | ~3,150ms |
| Platform Thread Pool (200) | ~178ms |
| Virtual Thread | ~54ms |

**Platform Thread Pool (8):** Processing 500 tasks with 8 threads requires approximately 63 rounds. At 50ms per round, this takes over 3 seconds.

**Platform Thread Pool (200):** Processing 200 tasks at a time requires 3 rounds, taking around 150ms plus overhead.

**Virtual Thread:** 500 Virtual Threads start simultaneously. Each yields its carrier while waiting for 50ms, then completes. The result is close to the theoretical minimum of 50ms.

<br>

# Scenario B: CPU-Bound Benchmark

## Code Implementation

Since `MessageDigest` is not thread-safe, sharing a single instance across multiple threads leads to race conditions. An instance must be created within each task.

```java
@Benchmark
public void platformThread_cpuBound() throws InterruptedException {
    runCpuTaskWithExecutor(Executors.newFixedThreadPool(8));
}

@Benchmark
public void virtualThread_cpuBound() throws InterruptedException {
    runCpuTaskWithExecutor(Executors.newVirtualThreadPerTaskExecutor());
}

private void runCpuTaskWithExecutor(ExecutorService executor) throws InterruptedException {
    try (executor) {
        CountDownLatch latch = new CountDownLatch(TASK_COUNT);
        for (int i = 0; i < TASK_COUNT; i++) {
            executor.submit(() -> {
                try {
                    MessageDigest digest = MessageDigest.getInstance("SHA-256");
                    for (int j = 0; j < 500_000; j++) {
                        digest.update(new byte[]{(byte) j});
                    }
                } catch (NoSuchAlgorithmException e) {
                    throw new RuntimeException(e);
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await();
    }
}
```

## Results

| Execution Method | Average Execution Time |
|---|---|
| Platform Thread Pool (8) | ~6,200ms |
| Virtual Thread | ~6,350ms |

The results for Virtual Threads and the platform thread pool of 8 are nearly identical. Virtual Threads offer no performance advantage here.

**In CPU-bound tasks, there is no blocking, and thus no opportunity for unmounting.**
With 8 carrier threads constantly executing tasks on an 8-core machine, the level of parallel processing is effectively identical to a platform thread pool of 8.
The slight overhead of Virtual Thread creation and scheduling can even make them slightly slower.

<br>

# What the Results Tell Us

## Gains in I/O-Bound Workloads

In I/O-bound scenarios, Virtual Threads were faster even than a thread pool of 200.
The key isn't the number of threads, but whether waiting time is wasted.
Platform threads occupy memory and remain registered with the OS scheduler even while waiting.
Virtual Threads, however, release their carrier during waits and exist only in the heap.

## Limitations in CPU-Bound Workloads

For CPU-bound tasks, the upper limit for parallel processing is the number of physical cores.
No matter how many Virtual Threads you have, the number that can execute concurrently is equal to the number of carriers (i.e., cores).
In this case, using a platform thread pool matched to the core count is more appropriate.

## Practical Adoption Criteria

| Workload Type | Recommended Approach |
|---|---|
| External API calls, DB queries, message waiting | Virtual Thread |
| Image processing, encryption, data transformation | Platform Thread Pool (based on core count) |
| Mixed I/O + Light CPU | Virtual Thread (typical web service pattern) |

Most backend web services follow an I/O-bound pattern dominated by DB queries, external API calls, and cache lookups, making them ideal candidates for Virtual Threads.

<br>

# Wrapping Up

The numbers meet expectations, and in some cases exceed them.
In I/O-bound tasks, the reason Virtual Threads outperform a thread pool of 200 isn't that they "use more threads," but because they don't waste carrier threads during wait times.

Conversely, it's important to manage expectations for CPU-bound tasks. Virtual Threads cannot solve problems that require more physical cores.

In the next post, we'll look at how to actually enable Virtual Threads in Spring Boot 3.2+ and which configuration settings require caution.

- <a href="/en/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot Integration and Best Practices</a>
