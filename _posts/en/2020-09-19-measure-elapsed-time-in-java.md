---
layout:   post
title:    "How to Measure Code Execution Time in Java"
author:   madplay
tags:     currenttimemillis nanotime stopwatch
description: "How can you measure how long code takes to execute in Java?" 
category: Java/Kotlin
lang: en
slug: measure-elapsed-time-in-java
permalink: /en/measure-elapsed-time-in-java/
date: "2020-09-19 22:18:43"
comments: true
---

# currentTimeMillis
First, you can use the `currentTimeMillis` method. It returns time in milliseconds (1/1000 second)
counted from midnight UTC on January 1, 1970. If you convert `currentTimeMillis` output to `Date`,
you can get the current date.

```java
long start = System.currentTimeMillis();
// ... logic omitted
long end = System.currentTimeMillis();
System.out.println("Elapsed time: " + (end - start) + " ms");
```

In practice, `currentTimeMillis` may not be ideal for measuring code performance.
Because it is **wall-clock time**, external workload or system time changes can affect measurements.

So it is better suited for date-related calculations, while `nanoTime` below provides more accurate execution-time measurement.

<br>

# nanoTime
`nanoTime` measures elapsed time from an arbitrary origin in nanoseconds.
The code structure is similar to `currentTimeMillis`,
but it is not tied to system clock changes or **wall-clock time**.

```java
long start = System.nanoTime();
// ... logic omitted
long end = System.nanoTime();
System.out.println("Elapsed time: " + (end - start) + " ns");
```

One thing to note: it measures relative to the **JVM (Java Virtual Machine)**.
As a result, measurements can differ across different JVMs.
In other words, measuring on the same server is generally fine, but results can vary across different servers.

<br>

# Instant
The `Instant` class represents a point on the timeline. Its timestamp uses midnight UTC on January 1, 1970 as zero,
and represents elapsed time after that as positive or negative values.
With `between` in `Instant`, you can get the duration between two `Instant` objects.
The return type is `Duration`, which you can convert to milliseconds via `toMillis`.

```java
Instant start = Instant.now();
// ... logic omitted
Instant end = Instant.now();
System.out.println("Elapsed time: " + Duration.between(start, end).toMillis() + " ms");
```

<br>

# StopWatch
Next is a library-based approach. Apache `commons-lang3` includes a `StopWatch` class.

```java
StopWatch stopWatch = new StopWatch();
stopWatch.start();
// ... logic omitted
stopWatch.stop();
System.out.println("Elapsed time: " + stopWatch.getTime() + " ms");
```

Spring Framework also provides a `StopWatch` class.
Note that both Apache and Spring `StopWatch` classes are not `thread-safe`.

```java
StopWatch stopWatch = new StopWatch();
stopWatch.start();
// ... logic omitted
stopWatch.stop();
System.out.println(stopWatch.prettyPrint());
```

Spring's `StopWatch` class has a `prettyPrint` method, which prints formatted output as the name suggests.

```bash
StopWatch '': running time = 3768817 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
003768817  100% 
```

Because usage is simple and it provides utility methods for execution-time measurement,
`StopWatch` is often the most practical choice.
