---
layout: post
title: "Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux"
author: madplay
tags: java virtual-thread kotlin coroutine webflux reactor concurrency comparison
description: "Compare the structural differences between Virtual Threads, Kotlin Coroutines, and WebFlux (Reactor) with code examples. We cover suspension mechanisms, cancellation propagation, context propagation, and decision criteria."
category: Java/Kotlin
date: "2024-12-19 20:57:31"
comments: true
series: "Virtual Thread"
lang: en
slug: java-virtual-thread-vs-coroutine-webflux
permalink: /en/post/java-virtual-thread-vs-coroutine-webflux
---

# Virtual Thread Series Table of Contents

- <a href="/en/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: Introduction and Internal Mechanics</a>
- <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Understanding and Mitigating Pinning</a>
- <a href="/en/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: Performance Benchmarking and Adoption Criteria</a>
- <a href="/en/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot Integration and Best Practices</a>
- **Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux**

<br>

# Same Goal, Different Paths

Since the official release of Virtual Threads in Java 21, a common question has emerged: "Does this make Kotlin Coroutines obsolete?"
When you add Spring WebFlux (Project Reactor) to the mix, you end up with three distinct ways to solve the same problem of high-concurrency I/O.

- **Virtual Threads**: A JVM runtime feature. It improves throughput while allowing you to keep using familiar blocking code.
- **Kotlin Coroutines**: A language-level feature. It uses the `suspend` keyword and coroutine builders to express asynchronous flows.
- **WebFlux (Reactor)**: A reactive programming model. It builds non-blocking pipelines using `Mono` and `Flux`.

In this post, we’ll implement a newsletter dispatch example using all three approaches to understand their structural differences.

<br>

# Code Style Comparison

## Virtual Threads (Java)

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (Subscriber subscriber : subscribers) {
                executor.submit(() -> mailClient.send(subscriber.email(), newsletter));
            }
        }
    }
}
```

`mailClient.send()` is a standard blocking method. The code looks identical to traditional blocking code; only the Executor has changed.

## Kotlin Coroutines

```kotlin
class NewsletterDispatcher(private val mailClient: MailClient) {

    suspend fun dispatch(subscribers: List<Subscriber>, newsletter: Newsletter) {
        coroutineScope {
            subscribers.forEach { subscriber ->
                launch(Dispatchers.IO) {
                    mailClient.send(subscriber.email, newsletter)
                }
            }
        }
    }
}
```

This introduces the `suspend` keyword, `coroutineScope`, and `launch`.
If `mailClient.send()` is a blocking call, it should be executed on `Dispatchers.IO` for efficiency.
If it were a native `suspend` function, it could run on the default dispatcher for true non-blocking execution.

## WebFlux (Reactor)

```java
public class NewsletterDispatcher {

    private final ReactiveMailClient mailClient;

    public NewsletterDispatcher(ReactiveMailClient mailClient) {
        this.mailClient = mailClient;
    }

    public Mono<Void> dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
        return Flux.fromIterable(subscribers)
                .flatMap(subscriber -> mailClient.send(subscriber.email(), newsletter))
                .then();
    }
}
```

`ReactiveMailClient.send()` is a reactive API returning a `Mono<Void>`.
We chain asynchronous sends with `flatMap` and finish with `then()`.
There is no blocking code here, but the entire API signature must change to reactive types.

Note that `flatMap` defaults to processing 256 tasks concurrently (`Queues.SMALL_BUFFER_SIZE`).
To match the "start-immediately" behavior of Virtual Threads, you would need to set the concurrency limit to `Integer.MAX_VALUE`, though the default often acts as a helpful form of backpressure.

<br>

# Structural Differences

Let's summarize the differences in a table before diving into the details.

| Feature | Virtual Thread | Kotlin Coroutines | WebFlux |
|---|---|---|---|
| Suspension | Automatic by JVM at I/O | Explicit at `suspend` calls | Operator chain (no suspension) |
| Cancellation/Timeout | `StructuredTaskScope` (Preview) | `withTimeout` auto-propagation | `.timeout()` operator |
| Context Propagation | `ScopedValue` (Preview) / ThreadLocal | `CoroutineContext` auto-propagation | Reactor Context (needs bridge) |
| Code Style | Imperative (Blocking) | Imperative (Suspending) | Declarative Reactive Pipeline |
| Learning Curve | Low | Medium | High |

## Where Does Suspension Occur?

With Virtual Threads, the JVM automatically yields the carrier thread at blocking I/O points. Developers don't need to mark these points explicitly.

Coroutines can only be suspended at `suspend` function calls. The points where execution might pause are explicitly visible in the code.

**WebFlux has no concept of "suspension" in the traditional sense.**
Operators like `flatMap` and `map` construct a non-blocking pipeline, and the Reactor scheduler handles the flow.
The entire logic is expressed declaratively.

## Cancellation and Timeouts

Coroutines provide built-in Structured Concurrency. If a `coroutineScope` is cancelled, all `launch` blocks within it are cancelled automatically.

```kotlin
withTimeout(5.seconds) {
    coroutineScope {
        subscribers.forEach { subscriber ->
            launch {
                mailClient.send(subscriber.email, newsletter)
            }
        }
    }
}
```

If the task doesn't finish within 5 seconds, the entire scope is cancelled, and the cancellation signal propagates to all child coroutines.

WebFlux achieves the same effect with a single operator:

```java
dispatch(subscribers, newsletter)
    .timeout(Duration.ofSeconds(5))
    .subscribe();
```

Java Virtual Threads also support structured concurrency through `StructuredTaskScope` (JEP 480, Java 23 Preview). This allows you to manage multiple Virtual Threads as a single logical unit.

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    subscribers.forEach(subscriber ->
        scope.fork(() -> {
            mailClient.send(subscriber.email(), newsletter);
            return null;
        })
    );
    scope.join();
    scope.throwIfFailed();
} catch (InterruptedException | ExecutionException e) {
    throw new RuntimeException(e);
}
```

Using the `ShutdownOnFailure` policy, if one child thread fails, the rest are cancelled immediately.

## Context Propagation

Virtual Threads use ThreadLocal-based contexts. To propagate values to child threads, you must explicitly copy them.

`ScopedValue` (JEP 481, Java 23 Preview) improves this by allowing immutable values to be passed within a specific scope, automatically inheriting them in child threads when used with `StructuredTaskScope`.

```java
private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, "req-123").run(() -> {
    mailClient.send(subscriber.email(), newsletter);
});
```

However, compatibility with libraries relying on `ThreadLocal` (like MDC or Spring Security) still requires additional handling.

Coroutines can automatically propagate information like MDC values or transaction contexts using `CoroutineContext`.
For example, `MDCContext` from `kotlinx-coroutines-slf4j` restores MDC values when a coroutine resumes.

```kotlin
launch(Dispatchers.IO + MDCContext()) {
    mailClient.send(subscriber.email, newsletter)
}
```

WebFlux uses Reactor Context. You inject values with `contextWrite()` and read them with `Mono.deferContextual()`.

```java
Mono.just(subscriber)
    .flatMap(s -> mailClient.send(s.email(), newsletter))
    .contextWrite(Context.of("requestId", requestId));
```

Since ThreadLocal-based libraries don't connect directly to Reactor Context, a bridge configuration is usually necessary.

<br>

# Performance Comparison

| Feature | Virtual Thread | Kotlin Coroutines | WebFlux |
|---|---|---|---|
| Thread Count | Carriers ≈ Core count | Depends on Dispatcher | Event Loop (Very few) |
| I/O Handling | Yields Carrier | Suspend + Non-blocking | Fully Non-blocking |
| High Concurrency | Moderate | High | Very High |
| Memory (Heap) | Heap stacks (dynamic) | Continuation objects | Operator chains |

Virtual Threads keep the carrier count proportional to CPU cores and return them during I/O waits, which is sufficient for most server workloads.

Coroutines, when combined with non-blocking I/O libraries, can achieve true non-blocking paths that use almost no OS threads.

WebFlux operates on the Netty event loop, handling extremely high concurrency with a minimal number of threads, making it ideal for environments with massive amounts of simultaneous connections.

Unless you are dealing with hundreds of thousands of concurrent tasks, the memory difference between these three is often negligible.

<br>

# Decision Criteria

| Scenario | Recommended |
|---|---|
| Quickly adopting in existing Java blocking codebases | Virtual Thread |
| Minimizing code changes | Virtual Thread |
| Kotlin-native projects | Coroutine |
| When structured concurrency and cancellation are critical | Coroutine |
| Using with non-blocking libraries (Ktor, R2DBC) | Coroutine |
| Extreme concurrent connections / full reactive ecosystem | WebFlux |
| Mixed Java/Kotlin projects | Can be mixed as needed |

**Virtual Threads** fit most naturally into existing Java codebases.
Since you only change the Executor while keeping the blocking code, it's a practical choice for legacy projects or teams with limited asynchronous experience.

**Kotlin Coroutines** shine in Kotlin projects.
Tools like `withTimeout` and `coroutineScope` express cancellation and exception handling clearly.
Pairing them with libraries like Ktor or R2DBC allows for highly efficient, thread-lite execution.

**WebFlux** is best for environments requiring extreme scalability or projects already committed to the reactive ecosystem.
Given its high learning curve and complexity, it's important to verify if your use case truly requires this level of overhead.

<br>

## Mixing Virtual Threads and Coroutines

In Kotlin projects, you can combine both by replacing `Dispatchers.IO` with a Virtual Thread-based Executor.

```kotlin
val virtualThreadDispatcher = Executors.newVirtualThreadPerTaskExecutor()
    .asCoroutineDispatcher()

launch(virtualThreadDispatcher) {
    mailClient.send(subscriber.email, newsletter)
}
```

However, this combination doesn't always guarantee better performance. Executing blocking code on `Dispatchers.IO` is usually sufficient, so it's best to measure bottlenecks before attempting to mix models.

## Why Not Mix with WebFlux?

Mixing WebFlux and Virtual Threads is generally discouraged.
WebFlux relies on a small number of event loop threads to handle all requests non-blockingly.
Adding Virtual Threads into this mix can lead to thread model conflicts, negating the benefits of both.

Virtual Threads are best suited for the Servlet stack (`spring-boot-starter-web`), while they should generally be avoided in WebFlux (`spring-boot-starter-webflux`) projects.

<br>

# Conclusion

Virtual Threads, Kotlin Coroutines, and WebFlux solve the same problem at different levels:

- **Virtual Threads**: A JVM optimization that lowers the cost of blocking code. It increases throughput without code changes.
- **Kotlin Coroutines**: A language abstraction for structured asynchronous flow. Strong in cancellation and context management.
- **WebFlux**: A programming model for end-to-end non-blocking pipelines. Excels at extreme concurrency.

The arrival of Virtual Threads doesn't make Coroutines or WebFlux obsolete.
For Java users, Virtual Threads are the most practical starting point.
For Kotlin users, Coroutines provide structured concurrency that Virtual Threads alone cannot match.
For those needing extreme scalability, WebFlux remains a powerful tool.

We have covered everything from internal mechanics to pinning, performance, Spring Boot integration, and comparisons. Ultimately, the best choice depends on your project's environment and your team's expertise.
