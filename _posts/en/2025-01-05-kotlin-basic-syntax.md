---
layout: post
title: "Kotlin Basics: Syntax and Core Concepts"
author: madplay
tags: kotlin basic var-val function control-flow
description: "Introduces Kotlin syntax, variables, functions, control flow, and collections with practical examples."
category: Kotlin
date: "2025-01-05 23:59:00"
comments: true
lang:     en
slug:     kotlin-basic-syntax
permalink: /en/post/kotlin-basic-syntax
---


# Kotlin Basic Syntax
- **1. Kotlin Basic Grammar Guide**
- <a href="/en/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. Kotlin class design and use of type system</a>
- <a href="/en/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. Kotlin null safety, collections, functional programming</a>
- <a href="/en/post/kotlin-coroutines" target="_blank" rel="nofollow">4. Kotlin coroutine concept and practical use</a>
- <a href="/en/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. Kotlin exception handling and coroutine-based failure response</a>

<br>

# Kotlin Foundations for Backend Development
When transitioning to Kotlin, focus on the idioms and patterns most relevant to building reliable services. Rather than memorizing the entire language specification, prioritize the syntax that appears most frequently in backend engineering: variable declarations, functions, control flow, and string templates.

<br>

# var and val: Immutability as a Default
`var` and `val` are design primitives that determine how much state mutability your system allows.

```kotlin
// val: Immutable request objects ensure thread safety
data class CreateUserRequest(
    val email: String,
    val nickname: String
)

class UserTokenIssuer(
    private val tokenSecret: String // val: Immutable once injected
) {
    fun issue(userId: Long): String {
        val issuedAt = System.currentTimeMillis() // val: Calculated once
        return "$userId:$issuedAt:$tokenSecret"
    }
}
```

Favoring `val` for request objects and intermediate state increases predictability and reduces the surface area for bugs in concurrent environments. Use `var` only when state mutation is strictly necessary, such as for counters or accumulators.

```kotlin
fun countProcessedEvents(events: List<String>): Int {
    var processedCount = 0 // var: Mutation is required for accumulation
    for (event in events) {
        if (event.isNotBlank()) {
            processedCount++
        }
    }
    return processedCount
}
```

Keep the scope of `var` as narrow as possible.

<br>

# Functions: Default Values, Named Arguments, and Single-Expressions
Explicitly declaring return types for public APIs is a best practice for maintainability.

```kotlin
class PaymentService {
    // Block body: Clear sequence for complex logic
    fun calculateVat(amount: Long): Long {
        return (amount * 0.1).toLong()
    }

    // Expression body (=): Concise one-liners for simple transforms
    fun normalizeEmail(raw: String): String = raw.trim().lowercase()
}
```

Use expression bodies (`=`) for simple conversions and block bodies for logic involving branching or validation. Avoid over-complicating functions; separate verification, transformation, and persistence to ensure testability.

<br>

# if and when: Statements vs. Expressions

Kotlin's `if` and `when` function as both statements and value-returning expressions. Using them as expressions reduces intermediate state and allows the compiler to verify branch coverage.

```kotlin
enum class OrderStatus { PENDING, PAID, CANCELLED }

// when as an expression: Compiler ensures all enum cases are handled
fun describeStatus(status: OrderStatus): String = when (status) {
    OrderStatus.PENDING   -> "Awaiting Payment"
    OrderStatus.PAID      -> "Payment Completed"
    OrderStatus.CANCELLED -> "Canceled"
}

// if as an expression: Direct return without temporary variables
fun discountRate(userLevel: Int): Double = if (userLevel >= 5) 0.2 else 0.1
```

Expression-based `when` prevents bugs caused by missing `else` branches or unhandled cases.

<br>

# String Templates: Value Injection without Concatenation

String templates use `$variable` or `${expression}` to inject values directly into strings, ideal for logging, formatting, and message generation.

```kotlin
data class User(val id: Long, val name: String, val grade: String)

fun greet(user: User): String {
    return "Hello, ${user.name}! Your current grade is ${user.grade}." // ${expression}: property access
}

fun summarize(user: User, orderCount: Int): String {
    val suffix = if (orderCount >= 10) "Premier" else "Regular"
    return "[userId=${user.id}] $suffix (Orders: $orderCount)" // $variable: direct injection
}
```

This syntax eliminates the need for the `+` operator, significantly improving readability.

<br>

# Iteration and Range: for, while, and Collections

Kotlin's `for` loop supports various range expressions (`..`, `until`, `downTo`, `step`).

```kotlin
// 1 to 5 (inclusive)
for (i in 1..5) print("$i ") // 1 2 3 4 5

// 1 to 4 (exclusive of end)
for (i in 1 until 5) print("$i ") // 1 2 3 4

// Reverse from 5 to 1, step by 2
for (i in 5 downTo 1 step 2) print("$i ") // 5 3 1

// De-structuring iteration
val items = listOf("a", "b", "c")
for ((index, value) in items.withIndex()) {
    println("$index: $value")
}
```

While `while` is used for manual condition control, collection operations are often more idiomatic for filtering and mapping.

```kotlin
data class OrderEvent(val orderId: Long, val status: String)

fun extractPaidOrderIds(events: List<OrderEvent>): List<Long> {
    return events
        .asSequence() // Lazy evaluation to avoid intermediate allocations
        .filter { it.status == "PAID" }
        .map { it.orderId }
        .toList() // Terminal operation triggers execution
}
```

Use `asSequence()` for large datasets to reduce GC pressure by avoiding intermediate collection allocations. For small lists, standard collection operations are usually sufficient.

<br>

# Keywords: in, is, as?, object, and companion object

These keywords are essential for common Kotlin backend patterns.

```kotlin
sealed interface Principal
data class AdminPrincipal(val adminId: Long): Principal
data class UserPrincipal(val userId: Long): Principal

class AuthContext private constructor(
    private val allowedRoles: Set<String>
) {
    companion object {
        // Factory method accessible via class name (AuthContext.of(...))
        fun of(vararg roles: String): AuthContext = AuthContext(roles.toSet())
    }

    // in: Membership check
    fun canAccess(role: String): Boolean = role in allowedRoles
}

fun extractUserId(principal: Principal): Long? {
    return when (principal) {
        is UserPrincipal  -> principal.userId // is: Type check + Smart cast
        is AdminPrincipal -> principal.adminId
    }
}

fun parseCount(raw: Any): Int? {
    val asString = raw as? String ?: return null // as?: Safe cast, returns null on failure
    return asString.toIntOrNull()
}
```

<br>

# Control Flow: break, continue, and Labeled Returns

Use `break` and `continue` for manual loop control, and labeled returns for early exits in higher-order functions.

```kotlin
fun pollMessages(maxRetry: Int): Boolean {
    var retry = 0
    while (retry < maxRetry) {
        val received = receiveFromQueue()
        if (received == null) {
            retry++
            continue // Skip to next iteration
        }
        if (received == "STOP") break // Exit loop
        return true
    }
    return false
}

fun hasNegative(values: List<Int>): Boolean {
    values.forEach loop@{ value ->
        if (value < 0) return@loop // Labeled return: exits only the lambda
    }
    return values.any { it < 0 }
}
```

<br>

# try-catch-finally: Structured Exception Handling

Separate concerns within exception blocks: `try` for the happy path, `catch` for classification/logging, and `finally` for resource cleanup.

```kotlin
fun readRequiredEnv(name: String): String {
    try {
        val value = System.getenv(name)
        if (value.isNullOrBlank()) {
            throw IllegalStateException("Missing env: $name")
        }
        return value
    } catch (t: Throwable) {
        val retryable = t is java.io.IOException // Type-based classification
        println("Env read failed: key=$name, retryable=$retryable, cause=${t.message}")
        throw t
    } finally {
        println("Env lookup finished: key=$name") // Always executes
    }
}
```

Avoid heavy I/O in `finally` to prevent blocking failure paths. Centralize cleanup logic for clarity.

Doing heavy I/O in `finally` can result in slower failure paths. It is safer to just do the cleanup work and separate the logic into a separate function.

<br>

# Next Steps: Advancing to Type Systems
Building a solid foundation with these basics allows for more productive engineering. Focus on writing clean functions and managing state safely.
The next post explores Kotlin’s advanced type system, including constructor validation, interfaces, sealed classes, and generics.

- <a href="/en/post/kotlin-class-and-type-system" target="_blank">Next: Kotlin Class Design and Type System Usage</a>

<br>

# References
- <a href="https://kotlinlang.org/docs/basic-syntax.html" target="_blank" rel="nofollow">Kotlin Docs: Basic syntax</a>
- <a href="https://kotlinlang.org/docs/control-flow.html" target="_blank" rel="nofollow">Kotlin Docs: Control flow</a>
