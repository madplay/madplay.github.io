---
layout: post
title: "JDK 25 LTS Release Notes: Key Changes at a Glance"
author: madplay
tags: java jdk25 openjdk
description: "Let’s review the key changes in JDK 25, the fifth LTS Java release, based on the official release notes."
category: Java/Kotlin
lang: en
slug: what-is-new-java-25
permalink: /en/what-is-new-java-25
date: "2025-09-19 21:32:10"
comments: true
---

# Java 25 LTS Overview

Java 25 is the next LTS released two years after Java 21 (September 2023). It is the fifth LTS after versions 8, 11, 17,
and 21.
According to the official OpenJDK announcement, it was released on September 16, 2025 (UTC).

This post introduces each JEP included in the official release.
For reference, you can check Java 21 LTS in the post below.

- <a href="/en/post/what-is-new-java-21" target="_blank">Java 21 LTS Is Here: What Changed?</a>

<br><br>

# JDK 25 Standard JEP

## JEP 503: Remove the 32-bit x86 Port

> This removes the 32-bit x86 port and simplifies the maintained platform set.

This removes the 32-bit x86 port. It is not a feature addition, but it can directly affect legacy deployment targets and
agent compatibility.

## JEP 506: Scoped Values

> This officially provides immutable context propagation based on execution scope.

This officially ships Scoped Values as an alternative to `ThreadLocal`.
It provides a more predictable lifetime scope when passing immutable context through call chains and child threads.

```java
class ScopedValueExample {
	static final ScopedValue<String> TENANT_ID = ScopedValue.newInstance();

	void handle() {
		ScopedValue.where(TENANT_ID, "naver_team").run(this::service);
	}

	void service() {
		System.out.println(TENANT_ID.get());
	}
}
```

## JEP 510: Key Derivation Function API

> This introduces KDF as a standard Java API for consistent key derivation handling.

This provides KDF (Key Derivation Function) as a standard Java API.
It becomes easier to manage key derivation with a shared interface instead of provider-specific implementation styles.

```java
import javax.crypto.KDF;

KDF kdf = KDF.getInstance("HKDF-SHA256");
```

## JEP 511: Module Import Declarations

> This adds module-level import support in Java syntax.

This introduces `import module ...;` and supports module-level imports.
It simplifies import declarations and makes module dependency boundaries more explicit in source files.

```java
// Before

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
```

```java
// After

import module java.base;
```

## JEP 512: Compact Source Files and Instance Main Methods

> This officially provides a source-file style that reduces boilerplate in small programs.

This officially provides a lightweight style for small programs that reduces boilerplate.
As shown below, it makes quick sample code straightforward.

```java
void main() {
	System.out.println("Hello, Java 25!");
}
```

## JEP 513: Flexible Constructor Bodies

> This relaxes constructor constraints so initial validation and computation logic can be placed more naturally.

This allows more flexible preprocessing logic in constructor bodies before `super(...)`/`this(...)` calls.
Validation, computation, and normalization steps before object setup become easier to express.

```java
class PositiveValue {
	PositiveValue(int value) {
		if (value <= 0) {
			throw new IllegalArgumentException();
		}
		this.value = value;
	}

	private final int value;
}
```

## JEP 514: Ahead-of-Time Command-Line Ergonomics

> This improves command-line configuration experience for AOT usage.

This improves command-line configuration and usability for AOT.
The focus is reducing setup complexity so AOT is easier to apply in real build/run pipelines.
Previously, long and complex option combinations increased experimentation cost.
This item mainly lowers that entry cost.
In other words, this is closer to improving “AOT operability” than changing “AOT performance itself.”

## JEP 515: Ahead-of-Time Method Profiling

> This adds method profiling support for better AOT optimization.

This introduces method profiling support to improve AOT optimization quality.
It aims to enable better ahead-of-time optimization based on runtime profiles.
The core is reflecting actual execution patterns during AOT so frequently used paths are optimized more realistically.
So if JEP 514 emphasizes usability, JEP 515 emphasizes optimization accuracy.

## JEP 518: JFR Cooperative Sampling

> This improves JFR sampling strategy to balance overhead and observability quality.

This improves JFR sampling to better balance observation overhead and data quality.
It addresses a common barrier where profiling cost makes production usage difficult.

## JEP 519: Compact Object Headers

> This targets better memory efficiency by handling HotSpot object headers in a more compact form.

The core is reducing per-object header overhead so more objects fit in the same heap size.
In workloads with many small objects, this can improve memory footprint and cache locality.
Because you can test it with a JVM option and without code changes, a practical upgrade approach is to compare heap
occupancy and GC frequency together.

```bash
java -XX:+UseCompactObjectHeaders -jar app.jar
```

## JEP 520: JFR Method Timing & Tracing

> This adds method timing and tracing observability to JFR.

This adds method timing/tracing observability to JFR.
It helps analyze execution flow in more detail and locate bottlenecks.

```bash
jcmd <pid> JFR.start name=trace settings=profile filename=trace.jfr
```

## JEP 521: Generational Shenandoah

> This provides generational Shenandoah GC as a product feature.

The key point is collection by young/old generation separation.
Short-lived objects are recovered first in young generation to reduce unnecessary full-scan pressure, while long-lived
objects are managed in old generation.
In Java 25, this is no longer an experimental option but a product feature, which makes production evaluation easier.

```bash
java -XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational -jar app.jar
```

# JDK 25 Preview and Incubator JEP

## JEP 470: PEM Encodings of Cryptographic Objects (Preview)

> This preview aims to handle PEM encoding/decoding of cryptographic objects through standard Java APIs.

This preview provides standard APIs for handling cryptographic keys and certificate objects in PEM format.
It encourages migration from custom text-based PEM handling logic to standardized APIs.

## JEP 502: Stable Values (Preview)

> This preview provides a model for safely sharing a value that is initialized once.

This preview introduces a model where values remain stable after lazy initialization.
It is designed to express the “compute once and reuse safely” pattern more clearly in concurrent environments.

```java
import java.util.concurrent.atomic.AtomicInteger;

import jdk.incubator.concurrent.StableValue;

class StableValueExample {
	private static final AtomicInteger INIT_COUNT = new AtomicInteger();

	// Compute once on demand, then reuse the same value.
	private static final StableValue<String> TOKEN =
			StableValue.supplier(() -> "token-" + INIT_COUNT.incrementAndGet());

	public static void main(String[] args) {
		// The supplier runs only on the first call and creates token-1.
		System.out.println(TOKEN.get()); // token-1
		// Subsequent calls reuse the same value without re-running initialization.
		System.out.println(TOKEN.get()); // token-1
		System.out.println(TOKEN.get()); // token-1
	}
}
```

The key point is that initialization logic runs once regardless of `get()` call count.
It also makes the lazy-init + reuse pattern explicit in multithreaded code.

## JEP 505: Structured Concurrency (Fifth Preview)

> This preview helps manage related concurrent tasks structurally so completion/failure/cancellation are handled
> consistently.

This keeps refining a model that groups related parallel tasks and handles success/failure/cancellation together.
The direction improves readability and exception-handling consistency in virtual-thread-based concurrency code.

```java
import java.util.concurrent.StructuredTaskScope;

class OrderService {
    Result loadOrder(String orderId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // Start related tasks at the same time.
            var payment = scope.fork(() -> paymentClient.get(orderId));
            var shipping = scope.fork(() -> shippingClient.get(orderId));

            // Wait until all tasks complete.
            scope.join();
            // Propagate an exception if any task fails.
            scope.throwIfFailed();

            // Return the merged successful results.
            return new Result(payment.get(), shipping.get());
        }
    }
}
```

## JEP 507: Primitive Types in Patterns, instanceof, and switch (Third Preview)

> This preview extends pattern matching from reference types to primitive types so numeric branching is expressed more
> directly.

Until now, working with primitive types in `switch`/`instanceof` branches often required workaround code.
This JEP reorganizes syntax and APIs so primitive types such as `int`, `long`, and `double` fit pattern matching more
naturally.

```java
static String classify(Object value) {
    return switch (value) {
        case int i when i < 0 -> "negative int";
        case int i -> "non-negative int";
        case long l -> "long";
        case double d -> "double";
        default -> "other";
    };
}
```

## JEP 508: Vector API (Tenth Incubator)

> This continues to evolve the incubating vector API for SIMD-based computation.

This continues developing the vector API in incubator form and expands SIMD usage paths.
It is useful when targeting performance gains in compute-heavy paths such as numerical processing and preprocessing
pipelines.

```java
import jdk.incubator.vector.FloatVector;

var species = FloatVector.SPECIES_PREFERRED;
float[] a = ...;
float[] b = ...;
float[] out = new float[a.length];

for (int i = 0; i < species.loopBound(a.length); i += species.length()) {
    var va = FloatVector.fromArray(species, a, i);
    var vb = FloatVector.fromArray(species, b, i);
    va.mul(vb).intoArray(out, i);
}
```

## JEP 509: JFR CPU-Time Profiling (Experimental)

> This experimentally adds CPU-time-based profiling support to JFR.

This experimentally adds CPU-time-centric profiling to JFR.
The objective is analyzing actual CPU usage time more directly, beyond wall-clock metrics.

```bash
jcmd <pid> JFR.start name=cpu settings=profile filename=cpu.jfr
```

<br><br>

# Closing

As expected from an LTS release, Java 25 includes changes across language, runtime, and security.
This post is also organized based on official release pages.

- <a href="https://openjdk.org/projects/jdk/25/" target="_blank" rel="nofollow">OpenJDK JDK 25</a>
- <a href="https://openjdk.org/projects/jdk/25/jeps-since-jdk-21" target="_blank" rel="nofollow">JEPs in JDK 25
  integrated since JDK 21</a>
