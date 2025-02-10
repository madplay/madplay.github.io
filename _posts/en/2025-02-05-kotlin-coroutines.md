---
layout: post
title: "Kotlin Coroutines: Concepts and Practical Usage"
author: madplay
tags: kotlin coroutine suspend dispatcher flow async launch
description: "Covers coroutine fundamentals, CoroutineScope, Dispatcher, async/await, structured concurrency, and Flow. A concise guide to Kotlin coroutines for production use."
category: Kotlin
date: "2025-02-05 08:18:00"
comments: true
lang: en
slug: kotlin-coroutines
permalink: /en/post/kotlin-coroutines
---

# Kotlin Series Index

- <a href="/en/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. Kotlin Basic Syntax Guide</a>
- <a href="/en/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. Kotlin Class Design and Type
  System</a>
- <a href="/en/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. Kotlin Null Safety,
  Collections, and Functional Programming</a>
- **4. Kotlin Coroutines: Concepts and Practical Usage**
- <a href="/en/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. Kotlin Exception Handling and
  Coroutine-Based Failure Handling</a>

<br>

# Coroutines Let You Write Async Code Like Sync Code

Thread-based async code suffers from callback nesting, exception propagation, and resource cleanup. Kotlin coroutines
address this with `suspend` functions and structured concurrency.
This post explains how coroutines work and outlines patterns you can use in production.

<br>

# What Is a Coroutine

A coroutine is a unit of computation that can suspend and resume execution. Unlike threads, coroutines are controlled at
the application level rather than the OS scheduler.

Threads are resource-intensive; they block on I/O and occupy stack memory while waiting. In contrast, a coroutine yields
its underlying thread at a `suspend` point, allowing the thread to perform other work. This enables thousands of
concurrent coroutines to run on a limited thread pool.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job1 = launch {
        println("Coroutine 1 started on ${Thread.currentThread().name}")
        delay(500) // Suspends the coroutine without blocking the thread
        println("Coroutine 1 resumed on ${Thread.currentThread().name}")
    }
    val job2 = launch {
        println("Coroutine 2 started on ${Thread.currentThread().name}")
        delay(100)
        println("Coroutine 2 completed on ${Thread.currentThread().name}")
    }
    job1.join()
    job2.join()
}
```

While Coroutine 1 is suspended for 500ms, the underlying thread is released, allowing Coroutine 2 to execute and finish
in 100ms.

<br>

# suspend Functions

Functions marked with the `suspend` modifier can only be invoked from within a coroutine or another suspend function.
This modifier signals to the compiler that the function may yield execution before returning.

```kotlin
import kotlinx.coroutines.*

suspend fun fetchUserName(userId: Long): String {
    delay(200)
    return "user-$userId"
}

suspend fun fetchUserScore(userId: Long): Int {
    delay(300)
    return 100
}

fun main() = runBlocking {
    // Sequential execution: total time ~500ms
    val name = fetchUserName(1L)
    val score = fetchUserScore(1L)
    println("name=$name score=$score")
}
```

Sequential execution is the default. To execute independent tasks concurrently, use `async`.

```kotlin
fun main() = runBlocking {
    // Concurrent execution: total time bounded by the slowest task (~300ms)
    val nameDeferred = async { fetchUserName(1L) }
    val scoreDeferred = async { fetchUserScore(1L) }

    val name = nameDeferred.await()
    val score = scoreDeferred.await()
    println("name=$name score=$score")
}
```

<br>

# CoroutineScope: Lifecycle Management

All coroutines must reside within a `CoroutineScope`, which manages their lifecycle and ensures that cancellation and
exceptions propagate through parent-child relationships.

```kotlin
import kotlinx.coroutines.*

class OrderService(private val scope: CoroutineScope) {
    fun processAsync(orderId: String): Job {
        // launch: starts a fire-and-forget coroutine
        return scope.launch {
            println("Processing order: $orderId")
            delay(100)
            println("Order completed: $orderId")
        }
    }
}
```

`runBlocking` bridges regular code to the coroutine world by blocking the current thread until all internal coroutines
finish. While useful for `main()` or tests, avoid `runBlocking` in service-layer code (e.g., Spring services), as it
blocks the request thread and significantly reduces throughput.

<br>

# launch vs async

- **launch**: Used for fire-and-forget tasks where no result is expected. Returns a `Job`.
- **async**: Used when a result is required. Returns a `Deferred<T>`, which is awaited using `await()`.

```kotlin
import kotlinx.coroutines.*

suspend fun main() = coroutineScope {
    // Fire-and-forget background task
    val logJob = launch {
        delay(100)
        println("Audit log saved.")
    }

    // Concurrent tasks with results
    val nameDeferred = async { fetchUserName(1L) }
    val scoreDeferred = async { fetchUserScore(1L) }

    val name = nameDeferred.await()
    val score = scoreDeferred.await()
    println("User: $name, Score: $score")

    logJob.join()
}
```

<br>

# Dispatchers: Thread Selection

A `Dispatcher` determines which thread pool handles the coroutine execution.

| Dispatcher               | Recommended Use Case                                       |
|:-------------------------|:-----------------------------------------------------------|
| `Dispatchers.IO`         | I/O-bound operations (DB, Network, File I/O).              |
| `Dispatchers.Default`    | CPU-intensive tasks (Parsing, Sorting).                    |
| `Dispatchers.Main`       | UI thread interactions (Android, Desktop UIs).             |
| `Dispatchers.Unconfined` | Not confined to any specific thread (Avoid in production). |

Use `withContext` to switch dispatchers within a specific block.

```kotlin
suspend fun loadData(): String = withContext(Dispatchers.IO) {
    // Executed in the IO thread pool
    "data"
}

suspend fun processData(data: String): String = withContext(Dispatchers.Default) {
    // Executed in the Default thread pool
    data.uppercase()
}
```

<br>

# Structured Concurrency

Structured concurrency ensures that child coroutines do not leak. When a parent scope is cancelled, all of its children
are automatically cancelled.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val parentJob = launch {
        launch {
            delay(1000)
            println("Child 1 completed") // Will not execute
        }
        launch {
            delay(500)
            println("Child 2 completed") // Will not execute
        }
        delay(300)
        println("Cancelling parent")
        cancel() // All children are cancelled immediately
    }
    parentJob.join()
}
```

<br>

# Exception Handling: coroutineScope vs supervisorScope

- **coroutineScope**: A failure in one child cancels the entire scope and all other siblings.
- **supervisorScope**: A failure in one child does not affect its siblings.

Use `supervisorScope` when tasks are independent (e.g., multiple external API calls) and you want to recover partial
results.

```kotlin
suspend fun fetchWithSupervisor(): Pair<String?, String?> = supervisorScope {
    val nameDeferred = async {
        delay(100)
        "user-1"
    }
    val scoreDeferred = async {
        delay(50)
        throw IllegalStateException("Score service failed")
    }

    val name = runCatching { nameDeferred.await() }.getOrNull()
    val score = runCatching { scoreDeferred.await() }.getOrNull()
    name to score // Returns ("user-1", null)
}
```

<br>

# Job and Cancellation Handling

A `Job` is a handle for managing coroutines. Cancellation in Kotlin is cooperative. Use `try-catch` with
`CancellationException` for cleanup, and always rethrow the exception to preserve structured concurrency.

```kotlin
val job = launch {
    try {
        doWork()
    } catch (e: CancellationException) {
        println("Performing cleanup...")
        throw e // Mandatory: rethrow to allow scope-level cancellation logic
    }
}
```

<br>

# Flow: Asynchronous Data Streams

`Flow` emits multiple values sequentially. It is a "cold" stream by default, meaning the code inside the `flow { ... }`
block only executes when `collect` is called.

```kotlin
fun orderEvents(orderId: String): Flow<String> = flow {
    emit("CREATED")
    delay(100)
    emit("PAID")
}

fun main() = runBlocking {
    orderEvents("order-1")
        .filter { it != "CREATED" }
        .collect { event -> println("Received: $event") }
}
```

`StateFlow` and `SharedFlow` are "hot" versions. `StateFlow` is ideal for state management (it always has a current
value), while `SharedFlow` is better suited for event broadcasting.

<br>

# Summary

Coroutines allow developers to write asynchronous logic in a synchronous style, drastically reducing complexity. By
mastering scopes, dispatchers, and structured concurrency, you can build highly scalable and resilient systems.

Using `SupervisorJob` as the root Job prevents a coroutine's failure from cascading to siblings. While individual
failures are isolated, cancelling the parent scope still terminates all children. This pattern is essential for managing
background tasks in server applications.

The next post covers advanced error handling, timeouts, and retry strategies.

- <a href="/en/post/kotlin-error-handling-and-coroutine" target="_blank">Next: Kotlin Error Handling and Coroutine-Based
  Failure Handling</a>

<br>

# References

- <a href="https://kotlinlang.org/docs/coroutines-basics.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutines
  basics</a>
- <a href="https://kotlinlang.org/docs/coroutines-and-channels.html" target="_blank" rel="nofollow">Kotlin Docs:
  Coroutines and channels</a>
- <a href="https://kotlinlang.org/docs/flow.html" target="_blank" rel="nofollow">Kotlin Docs: Asynchronous Flow</a>
- <a href="https://kotlinlang.org/docs/exception-handling.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutine
  exceptions handling</a>
