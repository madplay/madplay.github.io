---
layout: post
title: "Kotlin Error Handling and Coroutine-Based Failure Resilience"
author: madplay
tags: kotlin coroutine exception-handling retry test runCatching
description: "Covers exception classification, coroutine timeout, retry design, unit testing, runCatching, and lazy patterns for Kotlin failure handling."
category: Kotlin
date: "2025-02-08 12:04:00"
comments: true
lang: en
slug: kotlin-error-handling-and-coroutine
permalink: /en/post/kotlin-error-handling-and-coroutine
---

# Kotlin Series Index

- <a href="/en/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. Kotlin Basic Syntax Guide</a>
- <a href="/en/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. Kotlin Class Design and Type System
  Usage</a>
- <a href="/en/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. Kotlin Null Safety,
  Collections, and Functional Programming</a>
- <a href="/en/post/kotlin-coroutines" target="_blank" rel="nofollow">4. Kotlin Coroutines: Concepts and Practical
  Usage</a>
- **5. Kotlin Error Handling and Coroutine-Based Failure Resilience**

<br>

# Failure-handling code outlives code that merely works

Services fail. Networks slow down, external APIs fail intermittently, and data arrives in unexpected forms. This post
covers exception classification, coroutine timeout, retry design, testing, and `runCatching`—the core patterns for
handling failure in Kotlin.

<br>

# Exception Classification: The Foundation of Error Handling

Catching all exceptions in a single block obscures failure policies. Explicit classification enables targeted recovery
strategies.

```kotlin
// Sealed class enforces exhaustive handling of failure types
sealed class FailureType {
    object Temporary : FailureType() // Transient: safe to retry
    object Permanent : FailureType() // Permanent: fail fast
}

fun classify(throwable: Throwable): FailureType = when (throwable) {
    is java.net.SocketTimeoutException -> FailureType.Temporary
    is java.io.FileNotFoundException -> FailureType.Permanent
    is java.io.IOException -> FailureType.Temporary
    else -> FailureType.Permanent
}
```

This classification drives retry logic, ensuring that we only retry operations likely to succeed on subsequent attempts,
thereby avoiding unnecessary load amplification.

<br>

# Defaulting to Coroutine Timeouts

All external API interactions should have explicit timeouts to prevent cascading latency.

```kotlin
import kotlinx.coroutines.withTimeout

interface PaymentApi {
    suspend fun getStatus(paymentId: String): String
}

suspend fun fetchPaymentStatus(api: PaymentApi, paymentId: String): String {
    // Throws TimeoutCancellationException after 1500ms
    return withTimeout(1_500L) {
        api.getStatus(paymentId)
    }
}

// Use withTimeoutOrNull to handle timeouts as null values instead of exceptions
suspend fun fetchPaymentStatusOrNull(api: PaymentApi, paymentId: String): String? {
    return kotlinx.coroutines.withTimeoutOrNull(1_500L) {
        api.getStatus(paymentId)
    }
}
```

`withTimeout` triggers a `TimeoutCancellationException`, which participates in structured concurrency. Without timeouts,
slow downstream services can exhaust thread pools and connection limits.

<br>

# Designing Idempotent Retries

Retries are effective for transient errors but require idempotency to avoid side effects from duplicate processing.

```kotlin
suspend fun approveWithRetry(
    requestId: String, // Idempotency key
    orderId: String,
    action: suspend () -> String
): String {
    var lastError: Throwable? = null

    repeat(3) { attempt ->
        try {
            return action() // Immediate return on success
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e // propagate cancellation without retrying
        } catch (t: Exception) {
            val temporary = classify(t) is FailureType.Temporary
            println("Payment failed: id=$requestId, order=$orderId, attempt=${attempt + 1}, retryable=$temporary")
            if (!temporary) throw t // Fail fast on permanent errors
            lastError = t
        }
    }
    throw lastError ?: IllegalStateException("Retry exhausted: $requestId")
}
```

Propagating `CancellationException` is critical; retrying during cancellation violates structured concurrency
principles.

<br>

# Stabilizing Policy via Unit Tests

Failure policies often drift during maintenance. Unit tests for classification logic and retry behavior prevent
regressions.

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertTrue

class FailureClassifyTest {
    @Test
    fun `SocketTimeoutException is classified as temporary`() {
        val result = classify(java.net.SocketTimeoutException("timeout"))
        assertTrue(result is FailureType.Temporary)
    }

    @Test
    fun `IllegalArgumentException is classified as permanent`() {
        val result = classify(IllegalArgumentException("invalid"))
        assertTrue(result is FailureType.Permanent)
    }
}
```

<br>

# Explicit Failure Points: require, check, and Nothing

Use standard library functions to make validation and failure states explicit in the code.

```kotlin
fun validateAmount(amount: Long?) {
    require(amount != null) { "Amount is mandatory" } // Throws IllegalArgumentException
    check(amount > 0) { "Amount must be positive" }   // Throws IllegalStateException
}

fun failFast(message: String): Nothing {
    error("Fatal error: $message") // Returns 'Nothing', signaling an unreachable path
}
```

<br>

# Clean Resource Management with use and runCatching

Separate resource cleanup from recovery logic using `use` and `runCatching` to maintain readability.

```kotlin
fun readFirstByte(payload: ByteArray): Result<Int> {
    return runCatching {
        ByteArrayInputStream(payload).use { input ->
            input.read() // 'use' automatically closes the stream
        }
    }.recoverCatching { t ->
        if (t is kotlinx.coroutines.CancellationException) throw t
        println("Read failed: ${t.message}")
        -1
    }
}
```

`runCatching` transforms successes and failures into `Result` values. When used in coroutines, ensure
`CancellationException` is rethrown to allow proper cancellation propagation.

<br>

# Summary: Principles for Resilient Services

Building resilient systems in Kotlin requires more than just correct syntax. Consistent exception classification,
mandatory timeouts, and idempotent retries are foundational. By enforcing these policies via tests and leveraging
primitives like `runCatching` and `sealed classes`, you ensure service stability under load.

<br>

# References

- <a href="https://kotlinlang.org/docs/exception-handling.html" target="_blank" rel="nofollow">Kotlin Docs: Exception
  handling</a>
- <a href="https://kotlinlang.org/docs/coroutines-basics.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutines
  basics</a>
- <a href="https://kotlinlang.org/docs/delegated-properties.html" target="_blank" rel="nofollow">Kotlin Docs: Delegated
  properties</a>
