---
layout: post
title: "Kotlin Scope Functions Compared: let, run, with, apply, also"
author: madplay
tags: kotlin scope-function let run with apply also null-safety
description: "Compares receiver reference style and return values of let, run, with, apply, and also with practical examples, and outlines criteria for choosing the right function."
category: Kotlin
date: "2025-02-14 07:44:00"
comments: true
lang: en
slug: kotlin-scope-functions
permalink: /en/post/kotlin-scope-functions
---

# Why Five Scope Functions in Kotlin?

The Kotlin standard library provides five scope functions: `let`, `run`, `with`, `apply`, and `also`.
They look similar, so developers often pick one arbitrarily. But receiver reference style and return value differ across
them; the wrong choice obscures intent.

This post clarifies the differences and provides practical criteria for choosing the right function in each situation.

<br>

# Core Functional Axes

The five scope functions are distinguished by two primary characteristics: how they reference the receiver (`this` vs
`it`) and what they return (the lambda result vs the receiver itself).

| Function  | Extension? | Receiver Reference | Return Value  | Primary Use Case                           |
|:----------|:-----------|:-------------------|:--------------|:-------------------------------------------|
| **let**   | Yes        | `it` (or named)    | Lambda Result | Null-safe transformations, scope limiting. |
| **run**   | Yes*       | `this`             | Lambda Result | Configuration + result computation.        |
| **with**  | No         | `this`             | Lambda Result | Grouping operations on an existing object. |
| **apply** | Yes        | `this`             | Receiver      | Object configuration (setting properties). |
| **also**  | Yes        | `it`               | Receiver      | Side effects (logging, validation).        |

*\*Note: `run` exists both as an extension function (`T.run`) and a standalone block.*

<br>

# let: Null-Safe Transformations and Scoping

`let` is commonly used with the safe-call operator (`?.`) to execute a block only when the receiver is non-null. It
references the object as `it`.

```kotlin
data class RawSignupRequest(
    val email: String?,
    val nickname: String?
)

fun extractEmail(request: RawSignupRequest): String? {
    return request.email?.let { raw ->
        // Executes only if email is non-null
        raw.trim().lowercase().takeIf { it.contains("@") }
    }
}
```

`let` is also useful for isolating variables within a specific scope to prevent namespace pollution.

```kotlin
fun storeIfAbsent(cache: MutableMap<String, String>, userId: Long, value: String) {
    buildKey(userId).let { key ->
        if (!cache.containsKey(key)) {
            cache[key] = value
        }
    }
}
```

**Anti-pattern**: Avoid deeply nested `let` blocks, as they make it difficult to track which object `it` refers to. Use
explicit parameter names or early returns instead.

<br>

# run: Direct Access and Result Computation

`run` is similar to `let` but references the receiver as `this`. This allows for direct member access, making it feel
more natural for computing a result from multiple properties.

```kotlin
data class ReportConfig(
    val title: String,
    val maxRows: Int
)

fun summarize(config: ReportConfig): String {
    return config.run {
        // Direct access to 'title' and 'maxRows' via 'this'
        "$title (Limit: $maxRows rows)"
    }
}
```

The non-extension version of `run` is useful for grouping multiple statements into a single expression.

```kotlin
val hexRegex = run {
    val digits = "0-9"
    val hexDigits = "A-Fa-f"
    Regex("[$digits$hexDigits]+")
}
```

<br>

# with: Operating on Existing Objects

`with` is a non-extension function that takes the receiver as an argument. Use it when the object is already non-null
and you want to perform multiple operations without repeating the object's name.

```kotlin
fun describeProfile(profile: UserProfile): String {
    return with(profile) {
        // 'this' is implicit
        "User: $nickname, Grade: $grade"
    }
}
```

Unlike `run`, `with` does not support safe-call chaining (`?.with`).

<br>

# apply: Object Configuration

`apply` is the standard choice for initializing or configuring an object. It returns the receiver, allowing for
immediate chaining.

```kotlin
fun buildPushPayload(userId: Long, message: String): NotificationPayload {
    return NotificationPayload().apply {
        // Configure mutable properties
        targetUserId = userId
        body = message
        priority = "HIGH"
    }
}
```

**Engineering Tip**: Keep `apply` blocks focused purely on configuration. Avoid complex branching or I/O operations
inside `apply` to maintain predictability.

<br>

# also: Observability and Side Effects

`also` is intended for actions that do not modify the object, such as logging or validation. It returns the original
receiver unchanged.

```kotlin
fun processPayment(orderId: Long, amount: Long): PaymentResult {
    return executePayment(orderId, amount)
        .also { result ->
            println("Payment processed: id=${result.transactionId}, status=${result.status}")
        }
        .also { result ->
            check(result.status != "FAILED") { "Validation failed" }
        }
}
```

<br>

# Decision Heuristics

To choose the correct function, evaluate the following:

1. **Do you need to return the object itself?**
    - Yes, for configuration → **apply**
    - Yes, for side effects → **also**
2. **Do you need to return a computed result?**
    - Yes, and the object might be null → **let** (for `it`) or **run** (for `this`)
    - Yes, and the object is guaranteed non-null → **with**

<br>

# Summary

Scope functions should enhance code clarity, not just reduce line count. Use `apply` for initialization, `also` for
logging, and `let/run` for transformations. Clear, consistent usage of these functions allows reviewers to immediately
understand the intent of a logic block.

<br>

# References

- <a href="https://kotlinlang.org/docs/scope-functions.html" target="_blank" rel="nofollow">Kotlin Docs: Scope
  functions</a>
