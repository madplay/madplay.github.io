---
layout: post
title: "Kotlin Class Design and Type System Usage"
author: madplay
tags: kotlin class sealed generics interface value-class delegation
description: "A concise guide to building safe domain models using constructor validation, access control, interfaces, sealed class, generics, delegation by, and enum/value class."
category: Kotlin
date: "2025-01-13 22:11:00"
comments: true
lang: en
slug: kotlin-class-and-type-system
permalink: /en/post/kotlin-class-and-type-system
---

# Kotlin Series Index
- <a href="/en/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. Kotlin Basic Syntax Guide</a>
- **2. Kotlin Class Design and Type System Usage**
- <a href="/en/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. Kotlin Null Safety, Collections, and Functional Programming</a>
- <a href="/en/post/kotlin-coroutines" target="_blank" rel="nofollow">4. Kotlin Coroutines: Concepts and Practical Usage</a>
- <a href="/en/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. Kotlin Error Handling and Coroutine-Based Failure Recovery</a>

<br>

# Bridging Object Design and Type Systems
Kotlin combines concise class syntax with a powerful type system. However, without deliberate design rules, domain constraints can be lost in the code, leading to runtime failures that could have been prevented at compile time.
This post provides a practical guide to constructor validation, access control, sealed classes, generics, and value classes for building robust domain models.

<br>

# Enforce Invariants in the Constructor

Preventing invalid state at the point of instantiation is the most cost-effective defensive strategy.

```kotlin
class UserAccount(
    val userId: Long,
    email: String
) {
    // Properties are initialized before the init block
    val email: String = email.trim().lowercase()

    init {
        // Validation logic ensures the object is always in a valid state
        require(userId > 0) { "userId must be positive" }
        require(this.email.contains("@")) { "invalid email" }
    }
}
```

Once a `UserAccount` is successfully instantiated, its validity is guaranteed, eliminating the need for redundant checks in downstream services or repositories.

<br>

# data class: Optimized for Value-Centric Objects

`data class` automatically generates `equals`, `hashCode`, `copy`, and `toString`. This makes them ideal for DTOs and response models.

```kotlin
// Boilerplate-free value comparison and immutability-friendly copying
data class PaymentResult(
    val paymentId: String,
    val approved: Boolean,
    val amount: Long
)
```

For entities where identity is managed by a lifecycle—such as JPA entities—standard classes are often preferred to avoid issues with auto-generated `equals` and `hashCode`.

<br>

# Access Control: Minimizing API Surface

Kotlin provides `public`, `internal`, `private`, and `protected`. Using `internal` is a best practice for multi-module projects to hide implementation details from consumers.

```kotlin
// internal: scoped to the module, preventing implementation leakage
internal class OrderEventParser {
    fun parse(raw: String): OrderEvent {
        val (orderId, status) = raw.split(":") // Concise destructuring
        return OrderEvent(orderId.toLong(), status)
    }
}

data class OrderEvent(
    val orderId: Long,
    val status: String
)
```

<br>

# Property Accessors: Avoid Hidden Costs

Custom accessors (`get`, `set`) should not perform expensive operations like I/O or network calls. Such logic belongs in explicit functions to ensure caller awareness of performance impacts.

```kotlin
class TokenCache {
    // Encapsulated state: mutable internally, private externally
    private val store = mutableMapOf<Long, String>()

    fun put(userId: Long, token: String) {
        store[userId] = token
    }

    fun get(userId: Long): String? = store[userId]
}
```

<br>

# Decoupling with Interfaces

Interface boundaries simplify testing via mocks and allow for seamless swapping of external integrations.

```kotlin
// Behavioral contract decoupled from concrete implementation
interface PaymentGateway {
    fun approve(command: ApproveCommand): GatewayResult
}

data class ApproveCommand(
    val requestId: String, // Idempotency key for safe retries
    val orderId: String,
    val amount: Long
)
```

Kotlin classes are `final` by default. Use `open` and `abstract` judiciously to manage extension points.

```kotlin
// abstract: Defines a common interface and cannot be instantiated directly
abstract class DiscountPolicy {
    abstract fun discount(amount: Long): Long
}

class FixedRateDiscountPolicy(
    private val rate: Double
): DiscountPolicy() {
    override fun discount(amount: Long): Long = (amount * rate).toLong()
}
```

<br>

# Exhaustive Modeling with sealed class

Using `Boolean` or general exceptions for operation results often leads to unhandled cases. `sealed class` restricts the hierarchy, allowing the compiler to enforce exhaustive `when` branches.

```kotlin
// Hierarchical sum types restricted to the current module
sealed class GatewayResult {
    data class Approved(val transactionId: String): GatewayResult()
    data class RetryableFailure(val reason: String): GatewayResult()
    data class PermanentFailure(val reason: String): GatewayResult()
}

// Compiler ensures all cases are handled; no 'else' required
fun handle(result: GatewayResult): String = when (result) {
    is GatewayResult.Approved         -> "OK:${result.transactionId}"
    is GatewayResult.RetryableFailure -> "RETRY:${result.reason}"
    is GatewayResult.PermanentFailure -> "FAIL:${result.reason}"
}
```

<br>

# Generics and Variance: out, in, and reified

Generics should be used to enforce type safety rather than just for code reuse. Use `out` for producers (covariance) and `in` for consumers (contravariance).

```kotlin
interface EventReader<out T> { // Covariant: T is only returned
    fun read(): T
}

interface EventWriter<in T> { // Contravariant: T is only consumed
    fun write(event: T)
}

// reified: Enables runtime type access (requires inline)
inline fun <reified T> Any.castOrNull(): T? = this as? T
```

<br>

# Composition and Delegation

Kotlin encourages composition by making classes `final` by default. The `by` keyword enables interface delegation without boilerplate, forwarding all calls to a delegate.

```kotlin
interface Masker {
    fun mask(value: String): String
}

class AsteriskMasker: Masker {
    override fun mask(value: String): String = "*".repeat(value.length)
}

// Delegation via 'by': Boilerplate-free decorator pattern
class LoggingMasker(
    private val delegate: Masker
): Masker by delegate {
    override fun mask(value: String): String {
        println("Masking value of length: ${value.length}")
        return delegate.mask(value)
    }
}
```

<br>

# Concretizing Types with value class

Avoid "stringly-typed" APIs where typos can bypass the compiler. `value class` provides type safety with minimal runtime overhead by inlining the underlying value.

```kotlin
@JvmInline
value class OrderId(val value: String)

enum class PaymentStatus {
    REQUESTED, APPROVED, FAILED
}

// Compiler prevents accidentally passing a generic String as an OrderId
data class PaymentRecord(
    val orderId: OrderId,
    val status: PaymentStatus,
    val amount: Long
)
```

On the JVM, `OrderId` is represented as a primitive `String` at runtime, ensuring safety without the cost of object allocation. Avoid using strings for identifiers or statuses.

On the JVM, `value class` is often represented as the inner value (`String`), adding type safety with low overhead. Boxing can occur at generic, nullable, or interface boundaries.
JPA mapping and serialization frameworks like Jackson may require extra configuration; verify before adoption.

<br>

# Core Design Principles for Stability
To stabilize your Kotlin codebase, prioritize these five principles: constructor-level validation, read-only collections, strict access control, sealed result types, and precise type parameters.
The next post covers null safety, collection transformations, and functional patterns for cleaner data processing.

- <a href="/en/post/kotlin-null-safety-and-functional" target="_blank">Next: Kotlin Null Safety, Collections, and Functional Programming</a>

<br>

# References
- <a href="https://kotlinlang.org/docs/classes.html" target="_blank" rel="nofollow">Kotlin Docs: Classes</a>
- <a href="https://kotlinlang.org/docs/sealed-classes.html" target="_blank" rel="nofollow">Kotlin Docs: Sealed classes and interfaces</a>
- <a href="https://kotlinlang.org/docs/generics.html" target="_blank" rel="nofollow">Kotlin Docs: Generics</a>
- <a href="https://kotlinlang.org/docs/inline-classes.html" target="_blank" rel="nofollow">Kotlin Docs: Inline value classes</a>
