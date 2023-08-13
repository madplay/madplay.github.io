---
layout: post
title: "Decorator Pattern: Combining Features Without Inheritance"
author: madplay
tags: design-pattern java spring
description: "The Decorator pattern dynamically adds features to objects without inheritance. How far can you wrap an object?"
category: Algorithm/CS
date: "2023-08-12 21:03:52"
comments: true
lang: en
slug: decorator-pattern
permalink: /en/post/decorator-pattern
---

# Wanting to Add Features, but Inheritance Is Burdening

You want to add logging to a notification feature. So you create a `LoggingNotificationSender`. Next, you need a retry feature, so you build a `RetryNotificationSender`. What if you want logging and retries simultaneously? You have to create yet another `LoggingRetryNotificationSender`.

As feature combinations increase, the number of classes explodes. The Decorator pattern solves this problem using composition instead of inheritance. You build a wrapper around the existing object, maintaining its original interface while attaching new capabilities.

<br>

# Structure of the Decorator Pattern

There are four components:

- **Component:** The interface defining the core functionality.
- **ConcreteComponent:** The primary implementation of the Component.
- **Decorator:** An abstract class that implements the Component while holding a reference to a Component internally.
- **ConcreteDecorator:** A class extending the Decorator to add supplementary features.

The key is that the Decorator implements the exact same interface as the Component. Thanks to this, decorators can be wrapped in multiple layers, and the client does not need to distinguish between a wrapped object and the original object.

<br>

# Combining Logging and Retry

Let's add logging and retry mechanisms as decorators to a notification sending feature.

First, define the Component and ConcreteComponent.

```java
public interface NotificationSender {
    void send(String recipient, String message);
}

class BasicNotificationSender implements NotificationSender {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Notification to " + recipient + ": " + message);
    }
}
```

Create the Decorator abstract class. It holds a Component reference internally and delegates by default.

```java
abstract class NotificationDecorator implements NotificationSender {
    protected final NotificationSender delegate;

    protected NotificationDecorator(NotificationSender delegate) {
        this.delegate = delegate;
    }

    @Override
    public void send(String recipient, String message) {
        delegate.send(recipient, message);
    }
}
```

Implement the logging decorator and retry decorator separately.

```java
class LoggingDecorator extends NotificationDecorator {
    LoggingDecorator(NotificationSender delegate) {
        super(delegate);
    }

    @Override
    public void send(String recipient, String message) {
        System.out.println("[LOG] Notification sending started: " + recipient);
        delegate.send(recipient, message);
        System.out.println("[LOG] Notification sending complete: " + recipient);
    }
}

class RetryDecorator extends NotificationDecorator {
    private final int maxRetries;

    RetryDecorator(NotificationSender delegate, int maxRetries) {
        super(delegate);
        this.maxRetries = maxRetries;
    }

    @Override
    public void send(String recipient, String message) {
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                delegate.send(recipient, message);
                return; // Exit on success
            } catch (Exception e) {
                lastException = e;
                System.out.println("Retry " + attempt + "/" + maxRetries);
            }
        }
        throw new RuntimeException("Exceeded maximum retries", lastException);
    }
}
```

The point where decorators are combined is the core of this pattern.

```java
NotificationSender sender = new BasicNotificationSender();

// Add only logging
sender = new LoggingDecorator(sender);

// Add retry as well (Combining logging + retry)
sender = new RetryDecorator(sender, 3);

sender.send("user@example.com", "Your order is complete.");
```

There is no need to create a separate class like `LoggingRetryNotificationSender`. You just combine the existing decorators in your preferred order.

<br>

# Wrapping Endlessly in Java I/O

## InputStream Chaining

Java I/O is a representative case of the Decorator pattern. `InputStream` forms the base, heavily wrapped by classes like `BufferedInputStream` and `DataInputStream`.

```java
InputStream input = new FileInputStream("data.bin");
input = new BufferedInputStream(input);    // Adds buffering
DataInputStream dataInput = new DataInputStream(input);  // Adds typed data reading
int value = dataInput.readInt();
```

Each wrapper handles a single responsibility, and by combining them, you produce the desired feature set. Passing streams continuously into constructors might look unfamiliar at first, but once you understand the Decorator pattern, the structure becomes perfectly clear.

## Collections.unmodifiableList()

`Collections.unmodifiableList()` is a decorator that wraps an existing list into an immutable one. It implements the `List` interface as is but throws an exception on modification methods (like `add`, `remove`).

```java
List<String> original = new ArrayList<>(Arrays.asList("a", "b", "c"));
List<String> readOnly = Collections.unmodifiableList(original);
readOnly.add("d"); // UnsupportedOperationException
```

<br>

# How to Decorate Request Objects

## HttpServletRequestWrapper

The Servlet API's `HttpServletRequestWrapper` is a decorator wrapping `HttpServletRequest`. When implementing a Filter in Spring, this is utilized to attach additional context to a request object or alter the behavior of specific methods.

```java
class CustomRequestWrapper extends HttpServletRequestWrapper {
    public CustomRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getHeader(String name) {
        if ("X-Custom".equals(name)) {
            return "custom-value";
        }
        return super.getHeader(name);
    }
}
```

You can override just a specific header value without altering the original request object.

## BeanPostProcessor

Spring's `BeanPostProcessor` is a mechanism that applies additional processing after a bean is created. Strictly speaking, it is not the Decorator pattern itself, but it achieves the same effect when it operates by wrapping the original bean to return a proxy or a wrapper.

<br>

# Decorator vs. Proxy

Both Decorator and Proxy share virtually identical structures in that they implement the same interface as the original object and delegate internally. The difference lies in the intent.

- **Decorator:** The client explicitly wraps it to add features. The combination is visible, like `new BufferedInputStream(new FileInputStream(...))` in Java I/O.
- **Proxy:** Ideally, the client is unaware of the proxy's existence. A classic example is when a framework seamlessly injects it, like Spring's `@Transactional`.

<br>

# Conclusion

The Decorator pattern offers a way to dynamically combine features onto an object without inheritance. Stream chaining in Java I/O is its most widely known application, and Spring leverages the same principle for request wrapping and bean post-processing.

If you find a situation where you need to stack decorators three layers deep or more, examine whether that combination is frequently used. For frequently used combinations, grouping them into a separate class is often easier to read, and it shortens the stack trace during debugging.