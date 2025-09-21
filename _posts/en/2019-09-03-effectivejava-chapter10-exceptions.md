---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 10. Exceptions"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter 10: Exceptions"
category: Java
date: "2019-09-03 00:42:12"
comments: true
lang: en
slug: effectivejava-chapter10-exceptions
permalink: /en/effectivejava-chapter10-exceptions/
---

# Table of Contents
- <a href="#item-69-use-exceptions-only-for-truly-exceptional-conditions">Item 69. Use exceptions only for truly exceptional conditions</a>
- <a href="#item-70-use-checked-exceptions-for-recoverable-conditions-and-runtime-exceptions-for-programming-errors">Item 70. Use checked exceptions for recoverable conditions, and runtime exceptions for programming errors</a>
- <a href="#item-71-avoid-unnecessary-use-of-checked-exceptions">Item 71. Avoid unnecessary use of checked exceptions</a>
- <a href="#item-72-favor-the-use-of-standard-exceptions">Item 72. Favor the use of standard exceptions</a>
- <a href="#item-73-throw-exceptions-appropriate-to-the-abstraction">Item 73. Throw exceptions appropriate to the abstraction</a>
- <a href="#item-74-document-all-exceptions-thrown-by-each-method">Item 74. Document all exceptions thrown by each method</a>
- <a href="#item-75-include-failure-capture-information-in-detail-messages">Item 75. Include failure-capture information in detail messages</a>
- <a href="#item-76-strive-for-failure-atomicity">Item 76. Strive for failure atomicity</a>
- <a href="#item-77-dont-ignore-exceptions">Item 77. Don’t ignore exceptions</a>

<br>

# Item 69. Use exceptions only for truly exceptional conditions
> Use exceptions only for exceptional conditions

A common misuse is using exceptions for normal loop control:

```java
try {
    int i = 0;
    while(true)
        range[i++].climb();
} catch (ArrayIndexOutOfBoundsException e) {

}
```

This style is wrong.
Exceptions are designed for exceptional conditions, not regular control flow.
`try-catch` can also limit JVM optimization opportunities.
Use ordinary iteration:

```java
for (Mountain m : range)
    m.climb();
```

A well-designed API should not force clients to use exceptions in normal paths.
Prefer state-check methods, optional return values, or sentinel values where appropriate.

Example: in `Iterable`, `hasNext` is the state-check method and `next` is state-dependent.

- In concurrent access without external synchronization, optional/sentinel results can be safer,
  because state may change between state check and dependent call.
- In performance-sensitive paths where state-check duplicates expensive work,
  optional/sentinel results may be preferable.
- Otherwise, state-check APIs are often more readable and easier to debug.

<div class="post_caption">Exceptions are designed for exceptional situations.</div>

<br><br>

# Item 70. Use checked exceptions for recoverable conditions and runtime exceptions for programming errors
> Use checked exceptions for recoverable conditions and runtime exceptions for programming errors

The rule is simple:
if callers can reasonably recover, use **checked exceptions**.
Checked exceptions force callers to handle (`try-catch`) or propagate (`throw`) them.

Unchecked exceptions (runtime exceptions and errors) are typically for bugs or unrecoverable conditions,
where catching often adds little value.

- <a href="/post/java-checked-unchecked-exceptions" target="_blank">
Reference: "Java exception categories: Checked Exception, Unchecked Exception"</a>

You can subclass `Throwable` directly,
but types that do not extend `Exception`, `RuntimeException`, or `Error`
usually add confusion and are not recommended.
Also, throwable message formats can differ across JVMs/releases,
so avoid strict assumptions about output format.

<div class="post_caption">Use checked exceptions when recovery is possible; use unchecked exceptions for programming errors.</div>

<br><br>

# Item 71. Avoid unnecessary use of checked exceptions
> Avoid unnecessary use of checked exceptions

Checked exceptions can improve robustness when used correctly,
but overuse makes APIs harder to consume.

If a method declares a checked exception, callers must catch or propagate it.
Also, in Java 8, methods that throw checked exceptions cannot be used directly in streams.

How to choose between checked and unchecked?
- If failure can occur despite correct API usage and callers can take meaningful action,
  checked exceptions are appropriate.
- Otherwise, unchecked exceptions are usually better.

## Ways to avoid checked exceptions when appropriate
When adding a new standalone checked exception, reconsider alternatives:

### Return `Optional` with an appropriate result type
Instead of throwing a checked exception, return an empty optional.
Tradeoff: you lose rich failure details.

### Split API into state-check and action

```java
// before
try {
    obj.action(args);
} catch (TheCheckedException e) {
    // handle exception
}
```

```java
// after
if (obj.actionPermitted(args)) {
    obj.action(args);
} else {
    // handle alternative path
}
```

This adds a branch but can simplify callers.
However, if object state can change between `actionPermitted` and `action`
in concurrent access without external synchronization,
this refactoring may not be safe.

<div class="post_caption">Use checked exceptions only where they are truly necessary.</div>

<br><br>

# Item 72. Favor the use of standard exceptions
> Favor the use of standard exceptions

Exceptions should be reused too.
Fewer exception classes reduce memory footprint, class-loading overhead,
and improve readability through familiar semantics.

### Commonly reused exceptions
- `IllegalArgumentException`
  - Argument value is invalid
  - For null specifically, prefer `NullPointerException`
- `IllegalStateException`
  - Object state is inappropriate for method invocation
- `NullPointerException`
  - Null passed where not allowed
- `IndexOutOfBoundsException`
  - Index exceeds valid range
- `ConcurrentModificationException`
  - Illegal concurrent modification detected
- `UnsupportedOpertionException`
  - Operation is not supported

You may extend standard exceptions to add context,
but creating many custom exceptions is usually discouraged,
partly because exception types are serializable and carry long-term compatibility burden.

<div class="post_caption">Java libraries already provide enough standard exceptions for most APIs.</div>

<br><br>

# Item 73. Throw exceptions appropriate to the abstraction
> Throw exceptions appropriate to the abstraction

If a high-level method leaks a low-level exception (for example `IndexOutOfBoundsException`),
it breaks abstraction boundaries.
Use **exception translation**:
catch lower-level exceptions and throw higher-level exceptions aligned with your API.

```java
try {
    // use lower-level abstraction
} catch (LowerLevelException e) {
    // translate to higher-level abstraction
    throw new HigherLevelException(...);
}
```

If lower-level cause helps debugging,
attach it using **exception chaining**:

```java
try {
    // use lower-level abstraction
} catch (LowerLevelException e) {
    // include lower-level cause
    throw new HigherLevelException(e);
}
```

Exception translation is better than blindly propagating low-level details,
but do not overuse it.
Prefer preventing lower-level failures when possible,
for example by validating inputs in higher layers.
As a fallback, you can log and contain failures where appropriate,
so users are not exposed to internal exceptions while developers keep diagnostics.

<div class="post_caption">Use exception translation and exception chaining appropriately.</div>

<br><br>

# Item 74. Document all exceptions thrown by each method
> Document all exceptions thrown by each method

Thrown exceptions are part of method contract.
They are essential for correct API usage,
so they must be documented carefully.

- <a href="/post/document-all-exceptions-thrown-by-each-method" target="_blank">
Detailed post: [Effective Java 3rd Edition] Item 74. Document all exceptions thrown by each method</a>

<div class="post_caption">Document every exception a method can throw.</div>

<br><br>

# Item 75. Include failure-capture information in detail messages
> Include failure-capture information in detail messages

When an exception escapes and fails a program,
the system prints stack trace including `Throwable.toString()` output:

```java
public String toString() {
    String s = getClass().getName();
    String message = getLocalizedMessage();
    return (message != null) ? (s + ": " + message) : s;
}
```

Good detail messages should capture relevant state values at failure time.
For example, for `IndexOutOfBoundsException`, include min/max bounds and actual index.

Do not make messages verbose without value.
Include information that helps failure analysis,
and never include sensitive data such as passwords or encryption keys.

<div class="post_caption">Detail messages should make failure causes diagnosable.</div>

<br><br>

# Item 76. Strive for failure atomicity
> Strive for failure atomicity

Failure atomicity means: if a method fails,
object state remains as it was before the call.
Whenever possible, preserve this property.

- <a href="/post/strive-for-failure-atomicity" target="_blank">
Detailed post: [Effective Java 3rd Edition] Item 76. Strive for failure atomicity</a>

<div class="post_caption">Even when a method fails, the object should ideally remain in its pre-call state.</div>

<br><br>

# Item 77. Don’t ignore exceptions
> Don’t ignore exceptions

If an API declares exceptions,
callers are expected to handle them appropriately.
An empty `catch` block defeats that contract:

```java
try {
    ...
} catch (SomeException e) { }
```

There are rare cases where ignoring is acceptable.
For example, when closing `FileInputStream`,
recovery may not be meaningful once all needed data is already read.

Even then, if you choose to ignore:
- document the reason in comments
- rename the exception variable clearly (for example `ignored`)

```java
try {
    ...
} catch (SomeException ignored) {
    // intentionally ignored; keep rationale and relevant logging
}
```

<div class="post_caption">If catch blocks are empty, exceptions lose their purpose.</div>
