---
layout: post
title: "Java Sealed Class vs Abstract Class vs Interface: When to Use Each"
author: madplay
tags: java sealed-class abstract-class interface type-system class-hierarchy java17
description: "Compares sealed class, abstract class, and interface in Java with practical criteria and examples."
category: Java
date: "2023-02-07 08:55:00"
comments: true
lang: en
slug: java-when-to-use-sealed-abstract-interface
permalink: /en/post/java-when-to-use-sealed-abstract-interface
---

# Three Type Abstractions and Why the Distinction Matters

Java provides three primary mechanisms for defining common types: `interface`, `abstract class`, and `sealed class`.
While they may appear syntactically similar, their design objectives differ significantly. Misusing these
abstractions—such as using an `interface` where an `abstract class` is more appropriate or failing to use a
`sealed class` when exhaustion checks are required—leads to fragile designs. This often results in logic errors within
`switch` branches that could have been caught at compile time.

The `sealed class` was officially introduced in Java 17 (JEP 409) following previews in Java 15 (JEP 360). When combined
with `switch` pattern matching (Java 21, JEP 441), it allows the compiler to verify the exhaustiveness of type
hierarchies.

This article examines the characteristics and constraints of each abstraction with production-oriented examples to guide
appropriate selection.

<br>

# interface: Defining the Contract

## Basic Characteristics

An interface defines a contract specifying "what an implementation can do." Since Java 8, interfaces can include default
implementations via the `default` keyword, but they cannot maintain instance state. Only constants (`static final`) are
permitted.

```java
public interface Notifiable {
	// Abstract method: must be implemented by concrete classes
	String getRecipientId();

	void notify(String message);

	// Default implementation: used unless overridden (Java 8+)
	default void notifyWithPrefix(String prefix, String message) {
		notify("[" + prefix + "] " + message);
	}
}
```

## Combining Roles via Multiple Implementation

The primary advantage of interfaces is the ability for a single class to implement multiple roles.

```java
public interface Auditable {
	long getCreatedAt();

	String auditLog();
}

public interface Cacheable {
	String getCacheKey();

	boolean isCacheExpired(long nowMs);
}

// UserSession implements multiple roles: Notifiable, Auditable, and Cacheable
public class UserSession implements Notifiable, Auditable, Cacheable {
	private final String recipientId;
	private final long createdAt;
	private final long ttlMs; // Session TTL in milliseconds

	public UserSession(String recipientId, long createdAt, long ttlMs) {
		this.recipientId = recipientId;
		this.createdAt = createdAt;
		this.ttlMs = ttlMs;
	}

	@Override
	public String getRecipientId() {
		return recipientId;
	}

	@Override
	public void notify(String message) {
		System.out.println("Push to " + recipientId + ": " + message);
	}

	@Override
	public long getCreatedAt() {
		return createdAt;
	}

	@Override
	public String auditLog() {
		return "Session created at " + createdAt + " for " + recipientId;
	}

	@Override
	public String getCacheKey() {
		return "session:" + recipientId;
	}

	@Override
	public boolean isCacheExpired(long nowMs) {
		return (nowMs - createdAt) > ttlMs;
	}
}
```

## Stateless Constraint

Interfaces do not store instance state. While `default` methods provide common logic, state management remains the
responsibility of the implementation.

```java
public interface Describable {
	String getName();

	String getCode();

	// The interface provides calculation logic but is stateless
	default String displayName() {
		return "[" + getCode() + "] " + getName();
	}
}

public class ProductCategory implements Describable {
	private final String name;
	private final String code;

	public ProductCategory(String name, String code) {
		this.name = name;
		this.code = code;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getCode() {
		return code;
	}
}
```

## Testability Benefits

Interface boundaries simplify the replacement of external systems (e.g., payment gateways or message queues) with test
doubles.

```java
// Fixed result hierarchy using a sealed interface
public sealed interface ChargeResult permits ChargeResult.Success, ChargeResult.Failure {
	record Success(String transactionId) implements ChargeResult {
	}

	record Failure(String reason) implements ChargeResult {
	}
}

public interface PaymentGateway {
	ChargeResult charge(String orderId, long amount);
}

// Production implementation: communicates with external API
public class TossPaymentGateway implements PaymentGateway {
	@Override
	public ChargeResult charge(String orderId, long amount) {
		// Implementation for external API call
		return new ChargeResult.Success("txn-" + orderId);
	}
}

// Test double: returns success without external calls
public class FakePaymentGateway implements PaymentGateway {
	@Override
	public ChargeResult charge(String orderId, long amount) {
		return new ChargeResult.Success("fake-txn-" + orderId);
	}
}
```

<br>

# abstract class: Sharing Implementation

## Basic Characteristics

Abstract classes maintain instance fields and share common logic with subclasses. They cannot be instantiated directly
and must be extended.

```java
public abstract class BaseRepository<T> {
	protected final String tableName; // Shared field for subclasses

	protected BaseRepository(String tableName) {
		this.tableName = tableName;
	}

	// Common implementation shared unless overridden
	public List<T> findAll() {
		System.out.println("SELECT * FROM " + tableName);
		return Collections.emptyList();
	}

	// Abstract method: implementation specifics delegated to subclasses
	public abstract Optional<T> findById(long id);

	// Template method: defines the sequence (validate -> persist)
	public T save(T entity) {
		validate(entity);
		return persist(entity);
	}

	protected abstract void validate(T entity);

	protected abstract T persist(T entity);
}
```

## Encapsulating Common State and Logic

Abstract classes are effective for sharing state or logic across implementations. The goal is to centralize common
execution flows while delegating specific behaviors to subclasses.

```java
public abstract class DiscountPolicy {
	protected final long minAmount;

	protected DiscountPolicy(long minAmount) {
		this.minAmount = minAmount;
	}

	// Centralized flow: minimum amount check is fixed in the base class
	public final long apply(long amount) {
		if (amount < minAmount) {
			return amount;
		}
		return calculate(amount);
	}

	protected abstract long calculate(long amount);
}

public class FixedDiscountPolicy extends DiscountPolicy {
	private final long discountAmount;

	public FixedDiscountPolicy(long minAmount, long discountAmount) {
		super(minAmount);
		this.discountAmount = discountAmount;
	}

	@Override
	protected long calculate(long amount) {
		return Math.max(0, amount - discountAmount);
	}
}
```

## Combined Patterns

A common pattern involves an abstract class implementing an interface to provide shared boilerplate, while concrete
subclasses handle implementation-specific logic.

```java
public interface EventHandler<T> {
	boolean canHandle(Object event);

	void handle(T event);
}

// Abstract class handles shared logging and flow control
public abstract class BaseEventHandler<T> implements EventHandler<T> {
	private final String handlerName;

	protected BaseEventHandler(String handlerName) {
		this.handlerName = handlerName;
	}

	// final: prevents subclasses from modifying the core flow (logging -> doHandle)
	@Override
	public final void handle(T event) {
		System.out.println(handlerName + " processing started");
		doHandle(event);
		System.out.println(handlerName + " processing completed");
	}

	protected abstract void doHandle(T event);
}

// record: concise immutable data carrier (Java 16+)
public record OrderCreatedEvent(String orderId, long amount) {
}

public class OrderCreatedHandler extends BaseEventHandler<OrderCreatedEvent> {
	public OrderCreatedHandler() {
		super("OrderCreationHandler");
	}

	// Pattern matching for instanceof (Java 16+)
	@Override
	public boolean canHandle(Object event) {
		return event instanceof OrderCreatedEvent;
	}

	@Override
	protected void doHandle(OrderCreatedEvent event) {
		System.out.printf("Processing order: id=%s, amount=%d%n", event.orderId(), event.amount());
	}
}
```

<br>

# sealed class/interface: Constraining Hierarchies

## Core Characteristics (Java 17+)

A `sealed class` or `sealed interface` restricts which other classes or interfaces may extend or implement them.
Subtypes are explicitly listed using the `permits` keyword (which can be omitted if subtypes are defined in the same
file). Subtypes must be declared as `final`, `sealed`, or `non-sealed`.

```java
// Explicitly permitted subtypes
public sealed class ApiResponse permits ApiResponse.Ok, ApiResponse.Error {
	public static final class Ok extends ApiResponse {
		public final String body;

		public Ok(String body) {
			this.body = body;
		}
	}

	public static final class Error extends ApiResponse {
		public final int statusCode;
		public final String message;

		public Error(int statusCode, String message) {
			this.statusCode = statusCode;
			this.message = message;
		}
	}
}
```

## switch Pattern Matching: Eliminating the default Case (Java 21+)

Combining `sealed` types with `switch` pattern matching allows for compile-time exhaustiveness checks. If a new subtype
is added but not handled in a `switch` expression, the compiler generates an error.

```java
// Java 21+: exhaustive switch without a default clause
String describe(ApiResponse response) {
	return switch (response) {
		case ApiResponse.Ok ok -> "Success: " + ok.body;
		case ApiResponse.Error error -> "Error " + error.statusCode + ": " + error.message;
	};
}
```

Adding a `Redirect` subtype to `ApiResponse` would immediately trigger a compilation failure in the `describe` method,
surfacing missing logic during build time rather than runtime.

## Subtype Constraints

Subtypes specified in `permits` must use one of the following modifiers:

| Modifier     | Meaning                                                 |
|:-------------|:--------------------------------------------------------|
| `final`      | Prevents further extension (leaf node).                 |
| `sealed`     | Restricts further hierarchy via its own `permits` list. |
| `non-sealed` | Re-opens the hierarchy for arbitrary extension.         |

Permitted subtypes must reside in the same package (unnamed module) or the same module (named module) as the sealed
type.

```java
// Sealed interface combined with records
public sealed interface PaymentEvent
	permits PaymentEvent.Approved, PaymentEvent.Failed, PaymentEvent.Pending {

	record Approved(String transactionId, long amount) implements PaymentEvent {
	}

	record Failed(String reason, boolean retryable) implements PaymentEvent {
	}

	record Pending() implements PaymentEvent {
	}
}

// Java 21+: exhaustive type pattern matching
String describeEvent(PaymentEvent event) {
	return switch (event) {
		case PaymentEvent.Approved a -> "Approved: txn=" + a.transactionId();
		case PaymentEvent.Failed f -> "Failed (retry=" + f.retryable() + "): " + f.reason();
		case PaymentEvent.Pending p -> "Pending";
	};
}
```

Using `sealed` interfaces with `record` types provides a concise way to model sum types while benefiting from
boilerplate-free data structures.

<br>

# Comparative Analysis

## Feature Matrix

| Feature               | `interface`                     | `abstract class`       | `sealed class`                                      |
|:----------------------|:--------------------------------|:-----------------------|:----------------------------------------------------|
| **Instantiation**     | No                              | No                     | Conditional (concrete sealed classes only)          |
| **Instance Fields**   | No (Constants only)             | Yes                    | Yes                                                 |
| **Inheritance**       | Multiple implementation         | Single inheritance     | Single inheritance (Multiple for sealed interfaces) |
| **Constructor**       | No                              | Yes                    | Yes                                                 |
| **Hierarchy Control** | Open                            | Open                   | Restricted via `permits`                            |
| **switch Exhaustion** | No (Yes for `sealed interface`) | No                     | Yes (Java 21+)                                      |
| **Default Logic**     | Yes (`default` methods)         | Yes                    | Yes                                                 |
| **Primary Use Case**  | Role/Contract definition        | Implementation sharing | Sum types, State machines                           |

<br>

## Practical Comparison

Consider modeling payment results using each abstraction.

**Using an interface:** The hierarchy is open, and `switch` blocks require a default case or manual checks.

```java
public interface PaymentResult {
	boolean isSuccess();

	String describe();
}

public class ApprovedResult implements PaymentResult {
	private final String transactionId;

	public ApprovedResult(String transactionId) {
		this.transactionId = transactionId;
	}

	@Override
	public boolean isSuccess() {
		return true;
	}

	@Override
	public String describe() {
		return "Approved: " + transactionId;
	}
}

public class FailedResult implements PaymentResult {
	private final String reason;

	public FailedResult(String reason) {
		this.reason = reason;
	}

	@Override
	public boolean isSuccess() {
		return false;
	}

	@Override
	public String describe() {
		return "Failed: " + reason;
	}
}

// Compiler cannot verify if all implementations are handled
String process(PaymentResult result) {
	if (result.isSuccess())
		return "Done";
	return "Error"; // New implementations may lead to unhandled logic
}
```

**Using an abstract class:** Shared state is centralized, but hierarchy remains open and not exhaustive.

```java
public abstract class PaymentResultBase {
	public final String requestId;
	public final long transactionFee; // Shared state

	protected PaymentResultBase(String requestId, long transactionFee) {
		this.requestId = requestId;
		this.transactionFee = transactionFee;
	}

	public abstract boolean isSuccess();

	public abstract String describe();

	public String summary() {
		return "id=" + requestId + ", fee=" + transactionFee + ", success=" + isSuccess();
	}
}
```

**Using a sealed type:** Hierarchies are closed and exhaustive (Java 21+).

```java
public sealed interface PaymentOutcome
	permits PaymentOutcome.Approved, PaymentOutcome.Failed, PaymentOutcome.Pending {

	record Approved(String requestId, String transactionId, long transactionFee) implements PaymentOutcome {
	}

	record Failed(String requestId, String reason, boolean retryable) implements PaymentOutcome {
	}

	record Pending(String requestId) implements PaymentOutcome {
	}
}

// Exhaustive switch: compiler flags errors if 'Pending' is omitted
String handleOutcome(PaymentOutcome outcome) {
	return switch (outcome) {
		case PaymentOutcome.Approved a -> "Approved: " + a.transactionId() + " (Fee: " + a.transactionFee() + ")";
		case PaymentOutcome.Failed f -> "Failed (Retry=" + f.retryable() + "): " + f.reason();
		case PaymentOutcome.Pending p -> "Processing: " + p.requestId();
	};
}
```

<br>

# Selection Criteria

### modeling Domain States and Events (Java 17+)

For types where the set of possible values is fixed—such as API responses, domain states, or event types—`sealed`
hierarchies are the preferred choice. Combined with Java 21's `switch` pattern matching, they provide stronger safety
guarantees.

- Use `sealed class` when sharing state or implementation is required.
- Use `sealed interface` for better flexibility (e.g., when combined with `record` types).

### Sharing State or Logic

If multiple subtypes must share instance fields or common execution flows (e.g., Template Method Pattern) while
remaining open for extension, choose an `abstract class`.

### Defining Roles and Contracts

When the goal is to define a behavioral contract ("what a class can do") or create boundaries for dependency injection
and testing, use an `interface`.

### Architectural Synergy

These abstractions often work together. An `interface` might define a high-level role, an `abstract class` provides a
base implementation, and a `sealed` type represents the resulting domain objects.

```java
// Role definition
public interface OrderProcessor {
	ProcessResult process(String orderId);
}

// Domain result (Closed set)
public sealed interface ProcessResult permits ProcessResult.Done, ProcessResult.Rejected {
	record Done(long confirmedAt) implements ProcessResult {
	}

	record Rejected(String reason) implements ProcessResult {
	}
}

// Base implementation for shared logic
public abstract class BaseOrderProcessor implements OrderProcessor {
	@Override
	public final ProcessResult process(String orderId) {
		System.out.println("Processing order: " + orderId);
		return doProcess(orderId);
	}

	protected abstract ProcessResult doProcess(String orderId);
}
```

<br>

# References

- <a href="https://openjdk.org/jeps/409" target="_blank" rel="nofollow">JEP 409: Sealed Classes (Java 17)</a>
- <a href="https://openjdk.org/jeps/441" target="_blank" rel="nofollow">JEP 441: Pattern Matching for switch (Java
  21)</a>
- <a href="https://docs.oracle.com/en/java/javase/17/language/sealed-classes-and-interfaces.html" target="_blank" rel="nofollow">
  Java 17 Docs: Sealed Classes and Interfaces</a>
- <a href="https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html" target="_blank" rel="nofollow">Java Docs:
  Abstract Methods and Classes</a>
