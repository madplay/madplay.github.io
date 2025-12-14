---
layout: post
title: "Java 21 LTS Is Here: What Changed?"
author: Kimtaeng
tags: java jdk21 openjdk
description: "What has changed in Java 21 LTS?"
category: Java
lang: en
slug: what-is-new-java-21
permalink: /en/what-is-new-java-21
date: "2023-09-20 09:00:00"
comments: true
---

# Java 21 LTS Overview: What Changed After 17

Java 21 includes many changes that directly affect everyday coding style, such as the official release of **Virtual
Threads**, finalized `switch` pattern matching and `record` patterns, and Sequenced Collections (JEP 431).
It also includes runtime-level improvements such as Generational ZGC (JEP 439), which makes performance worth
revisiting.

The center of this release is **Virtual Threads (JEP 444)**.
This is not only about creating more threads. It brings the thread-per-request model back as a practical option.
That makes teams reassess architecture choices: keep an async-chain-heavy structure or migrate parts to synchronous code
on virtual threads.

For reference, you can check Java 17 LTS changes in the post below.

- <a href="/en/post/what-is-new-java-17" target="_blank">What’s New in Java 17: First LTS Release in 3 Years</a>

<br><br>

# JDK 21 Through Key JEPs

This section summarizes notable JEPs in JDK 21 with a focus on practical impact.

## JEP 444: Virtual Threads

> This feature targets high-throughput concurrent applications with a simpler thread-per-request programming model.

The core value of virtual threads is not “more threads,” but lower cost for blocking I/O.
In many systems, the bottleneck then shifts from the thread pool to DB connections or external APIs.

The example below shows the most basic form: start virtual threads and wait with `join()`.

```java
public class VirtualThreadExample {

	public static void main(String[] args) throws InterruptedException {
		// Start each task in a virtual thread.
		Thread paymentTask = Thread.startVirtualThread(() -> callPayment("ORDER-100"));
		Thread stockTask = Thread.startVirtualThread(() -> reserveStock("ORDER-100"));

		// Wait for completion so the main flow does not finish first.
		paymentTask.join();
		stockTask.join();
	}

	private static void callPayment(String orderId) {
		System.out.println("callPayment: " + orderId);
	}

	private static void reserveStock(String orderId) {
		System.out.println("reserveStock: " + orderId);
	}
}
```

The key point is waiting for the created virtual threads to complete. If you skip `join()`, the method can exit before
the tasks finish.

If you need to run many tasks together, you can use `ExecutorService`.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadExecutorExample {

	public static void main(String[] args) throws Exception {
		// Create an executor that assigns a virtual thread per task.
		try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
			var userTask = executor.submit(() -> fetchUser("USER-1"));
			var orderTask = executor.submit(() -> fetchOrder("ORDER-100"));

			// Collect results with Future#get() and verify exceptions.
			System.out.println(userTask.get());
			System.out.println(orderTask.get());
		}
	}

	private static String fetchUser(String userId) {
		return "user=" + userId;
	}

	private static String fetchOrder(String orderId) {
		return "order=" + orderId;
	}
}
```

Comparing this with platform threads makes virtual-thread adoption points clearer.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadComparisonExample {

	public static void main(String[] args) {
		runWithPlatformThreads();
		runWithVirtualThreads();
	}

	private static void runWithPlatformThreads() {
		// Fixed-size pool: concurrent task count is limited by pool size.
		try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
			for (int i = 0; i < 5; i++) {
				int taskId = i;
				executor.submit(() -> simulateBlockingCall("platform", taskId));
			}
		}
	}

	private static void runWithVirtualThreads() {
		// Use a virtual thread per task for lighter handling of wait-heavy work.
		try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
			for (int i = 0; i < 5; i++) {
				int taskId = i;
				executor.submit(() -> simulateBlockingCall("virtual", taskId));
			}
		}
	}

	private static void simulateBlockingCall(String type, int taskId) {
		System.out.println(type + " task-" + taskId + " start");
		try {
			Thread.sleep(300);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
		System.out.println(type + " task-" + taskId + " end");
	}
}
```

<br>

## JEP 441: Pattern Matching for switch

> This feature focuses on writing `switch` branching logic in a more concise and safer way.

This goes beyond syntax convenience.
It makes type-based branching safer and catches missing cases earlier at compile time.

Java 17 already supports `sealed class` and `record`, but Java 21 connects those to branching logic directly.
That raises the modeling bar significantly.
In practice, “weak type design” stops being a style issue and becomes a reliability issue.

<br>

## JEP 440: Record Patterns

> This feature aims to simplify nested data handling by declaratively deconstructing record values and combining that
> with pattern matching.

Its impact grows when used with `JEP 441`.
Record deconstruction and branching fit naturally, so DTO/domain transformation logic becomes shorter.

```java
sealed interface Payment permits CardPayment, BankTransfer {
}

record CardPayment(String company, String maskedNumber) implements Payment {
}

record BankTransfer(String bankCode, String accountToken) implements Payment {
}

public String auditLog(Payment payment) {
	return switch (payment) {
		case CardPayment(String company, var ignored) -> "CARD(" + company + ")";
		case BankTransfer(String bankCode, var ignored) -> "BANK(" + bankCode + ")";
	};
}
```

The real concern is not code length but model-change blast radius.
Once a type spreads widely, rollback cost grows sharply.

In production, the criteria below make operation more stable.

- Do not map external API response models directly to internal domain models.
- When adding a new type in a `sealed` hierarchy, review log/metric key changes together.
- If branching logic keeps growing, stop extending the `switch` and move logic into domain methods.

<br>

## JEP 431: Sequenced Collections

> This feature introduces a consistent API for first/last access and reverse views on ordered collections.

This standardizes front/back access in collections.
It looks small but improves maintainability.

```java
import java.util.ArrayList;
import java.util.List;

List<String> orderIds = new ArrayList<>(List.of("O-100", "O-101", "O-102"));
String newest = orderIds.getLast();
List<String> newestFirst = orderIds.reversed();
```

Remember that `reversed()` is a view, not a copy. **When the source changes, the result changes too.**

Another practical gain is lower "data structure replacement cost."
Previously, switching among `List`, `Deque`, and `LinkedHashMap` often increased boilerplate because their methods
differed.
In JDK 21, front/back access contracts align, so refactoring overhead decreases.

<br>

## JEP 439: Generational ZGC

> This introduces generational separation (young/old) into ZGC to collect short-lived objects more efficiently and
> improve performance efficiency.

If low latency and response time matter, this change is relevant.
From operational experience, it is safer not to change JDK and GC at the same time during upgrades, because root-cause
isolation gets harder.

The core of Generational ZGC is object management by **young/old generations**.
Frequent young-generation collection recovers memory more efficiently.
Compared with non-generational ZGC, CPU overhead decreases and throughput improves.

## JEP 451: Prepare to Disallow the Dynamic Loading of Agents

> This shifts toward restricting dynamic agent loading at runtime by default, with a goal of strengthening JVM integrity
> and security.

This is a gradual change to limit the practice of dynamically loading agents into a running JVM.
In Java 21, it does not block immediately. It warns on dynamic load, signaling that default policy can become stricter
in future versions.

This affects operational workflows directly.
If incident response relies on “attach first, diagnose later,” available options can narrow in later JDK versions.
For that reason, moving APM/security/profiling tools to startup-time attachment is a safer direction.

## JEP 452: Key Encapsulation Mechanism API

> This provides KEM as a standard API so Java cryptography APIs can handle secure key agreement/transport consistently.

JEP 452 introduces the KEM (Key Encapsulation Mechanism) standard API into the JDK.
In short, it provides a common interface for secure symmetric-key agreement/transport, improving portability and
consistency of cryptographic implementations.

This rarely changes business logic directly, but it is meaningful in security libraries and protocol layers.

<br><br>

# Preview and Incubator JEPs

This release also includes **preview features such as JEP 453 (Structured Concurrency), JEP 446 (Scoped Values), JEP
442 (FFM API), JEP 430 (String Templates), and incubator JEP 448 (Vector API)**.

The features are attractive, but APIs and behavior can change in upcoming versions.
If you lock them into core architecture too early, upgrade cost rises sharply.

## JEP 453: Structured Concurrency (Preview)

> This feature treats related concurrent tasks as one structured unit to simplify cancellation, exception handling, and
> completion semantics with higher reliability.

In short, this manages related parallel tasks as one group.
Used with virtual threads, it is effective for handling “subtasks inside one request.”
Success/failure/cancellation propagation becomes explicit, which improves code quality.

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    // Run subtasks in parallel.
    var payment = scope.fork(() -> paymentClient.get(orderId));
    var shipping = scope.fork(() -> shippingClient.get(orderId));
    var coupon = scope.fork(() -> couponClient.get(orderId));

    // Wait for full completion and propagate failures.
    scope.join();
    scope.throwIfFailed();

    // Combine all results into one response.
    return new OrderView(payment.get(), shipping.get(), coupon.get());
}
```

## JEP 446: Scoped Values (Preview)

> This guides developers to safely pass immutable context in a bounded execution scope instead of sharing mutable state
> across threads.

This passes request context more explicitly than `ThreadLocal`.
Its strong point is safe request-context propagation.

```java
class ScopedValueExample {
    static final ScopedValue<String> TENANT_ID = ScopedValue.newInstance();

    void handleRequests() {
        // Naver tenant request scope
        ScopedValue.where(TENANT_ID, "naver_team").run(() -> {
            serviceA();
            serviceB();
        });

        // Kakao tenant request scope
        ScopedValue.where(TENANT_ID, "kakao_team").run(() -> {
            serviceA();
            serviceB();
        });
    }

    void serviceA() {
        // Read the tenant bound to the current scope.
        System.out.println("tenant = " + TENANT_ID.get());
    }

    void serviceB() {
        System.out.println("audit tenant = " + TENANT_ID.get());
    }
}
```

## JEP 442: Foreign Function & Memory API (Third Preview)

> This focuses on replacing JNI complexity and fragility with safer and more intuitive standard APIs for native function
> calls and off-heap memory access.

This API enables native calls and memory access with less JNI.
It keeps evolving as a JNI replacement candidate.
The benefit is more modern native interop code.
At the same time, because the interop layer itself changes, production adoption needs to prioritize regression testing
and deployment stability over raw performance.

```java
Linker linker = Linker.nativeLinker();
SymbolLookup stdlib = linker.defaultLookup();

// Create a handle for C standard library abs(int).
MethodHandle abs = linker.downcallHandle(
    stdlib.find("abs").orElseThrow(),
    FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT)
);

// Invoke the native function directly.
int v = (int) abs.invokeExact(-42); // 42
```

## JEP 430: String Templates (Preview)

> This introduces value interpolation and template processing in string literals to improve readability and standardize
> template validation points.

This syntax makes string interpolation easier to read and less error-prone.
Readability improves clearly for string composition.
That is why SQL, JSON, and logging template code often focuses on this feature.
Security issues (SQL injection, log forgery) are still not solved by syntax alone.
Even so, this significantly improves traditional Java string handling.

```java
String orderId = "O-100";
int amount = 12000;

// Express variable interpolation explicitly with string templates.
String log = STR."orderId=\{orderId}, amount=\{amount}";
System.out.println(log);
```

## JEP 445: Unnamed Classes and Instance Main Methods (Preview)

> This reduces boilerplate in introductory practice code so Java entry-point code can be written faster.

This significantly reduces startup code for learning/sample scenarios.
It is useful for learning and examples, and it lowers writing friction.
For typical server application structures, operational priority is lower.

```java
// Write the entry point directly without a class declaration.
void main() {
    System.out.println("Hello, Java 21!");
}
```

## JEP 443: Unnamed Patterns and Variables (Preview)

> This enables explicit discarding of unused patterns/variables so intent is clearer in pattern-matching code.

In one line, this syntax expresses “unused values” with `_`.
It shortens code by making intentional non-use explicit.
This style is already common in Python and Kotlin.

```java
record User(String name, int age) {}

String group(Object obj) {
    return switch (obj) {
        // Discard name because it is not used.
        case User(_, int age) when age >= 20 -> "adult";
        case User(_, _) -> "minor";
        default -> "unknown";
    };
}
```

## JEP 448: Vector API (Sixth Incubator)

> This incubator API enables vector expressions in Java, allowing runtimes to map them to optimal vector instructions on
> supported CPUs while preserving functional correctness on unsupported environments.

In simple terms, this helps process many numbers at once instead of one by one.
So performance gains are possible in compute-heavy areas such as signal processing, numerical operations, and ML
preprocessing.

```java
var species = FloatVector.SPECIES_PREFERRED;
float[] a = ...;
float[] b = ...;
float[] out = new float[a.length];

// Perform SIMD operations in species-sized chunks.
for (int i = 0; i < species.loopBound(a.length); i += species.length()) {
    var va = FloatVector.fromArray(species, a, i);
    var vb = FloatVector.fromArray(species, b, i);
    va.mul(vb).intoArray(out, i);
}
```

<br><br>

# Closing

This release includes many meaningful points.
From a practical perspective, concurrency (JEP 444) and syntax/modeling (JEP 441, JEP 440) stand out.
Virtual threads reopen a simpler server-code structure option, and pattern matching with record patterns makes branching
intent clearer.

This post is based on the OpenJDK JDK 21 official release page below.
For full release details and the complete integrated JEP list, the official documentation is the best reference.

- <a href="https://openjdk.org/projects/jdk/21/" target="_blank" rel="nofollow">OpenJDK JDK 21</a>
