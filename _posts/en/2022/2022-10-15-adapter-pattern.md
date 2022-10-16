---
layout: post
title: "Adapter Pattern: The Solution for Incompatible Interfaces"
author: madplay
tags: design-pattern java spring
description: "When the interface of an external library does not match your system, the Adapter pattern connects the two without modifying existing code."
category: Algorithm/CS
date: "2022-10-15 20:52:37"
comments: true
lang: en
slug: adapter-pattern
permalink: /en/post/adapter-pattern
---

# When Interfaces Don't Match

Imagine integrating an external library or legacy code into an existing system. What if the method signatures of the newly imported class differ from the interface expected by your system? In most cases, directly modifying the source of that class is not an option.

The Adapter pattern provides a conversion layer between incompatible interfaces, allowing them to work together without modifying the existing code. It works exactly like a travel plug adapter. Just as you use an adapter to plug an international device into a local socket, an intermediate conversion layer performs that role in code.

<br>

# Structure of the Adapter Pattern

There are three components:

- **Target:** The interface expected by the client.
- **Adaptee:** An existing class that is incompatible with the Target.
- **Adapter:** A conversion class that implements the Target interface while internally invoking the Adaptee.

There are two implementation methods.
An **Object Adapter** holds the Adaptee as a field and delegates requests to it.
A **Class Adapter** inherits from the Adaptee and implements the Target interface. In Java, if the Target is an interface, a Class Adapter is possible, but since it creates strong coupling with the Adaptee, the Object Adapter is much more common.

<br>

# Connecting LegacyMailer

In the existing system, notifications are sent through the `NotificationSender` interface. The newly introduced external library uses a class named `LegacyMailer` to send emails, but its method signature is different.

```java
// Target: The interface expected by our system
public interface NotificationSender {
    void send(String recipient, String message);
}

// Adaptee: Existing class from an external library (unmodifiable)
class LegacyMailer {
    public void sendMail(String to, String subject, String body) {
        System.out.println("Mail sent to " + to + ": [" + subject + "] " + body);
    }
}
```

We create an adapter to connect the two interfaces.

```java
// Adapter: Adapts LegacyMailer to NotificationSender
class MailerAdapter implements NotificationSender {
    private final LegacyMailer legacyMailer;

    public MailerAdapter(LegacyMailer legacyMailer) {
        this.legacyMailer = legacyMailer;
    }

    @Override
    public void send(String recipient, String message) {
        // Adapts to the signature of LegacyMailer
        legacyMailer.sendMail(recipient, "Notification", message);
    }
}
```

The client code only needs to know about `NotificationSender`.

```java
NotificationSender sender = new MailerAdapter(new LegacyMailer());
sender.send("user@example.com", "Your order is complete.");
// Mail sent to user@example.com: [Notification] Your order is complete.
```

Not a single line of `LegacyMailer`'s code was modified. The adapter absorbs the interface differences in the middle.

<br>

# Arrays.asList() is Also an Adapter

## Arrays.asList()

`Arrays.asList()` is an adapter that wraps an array into a `List` interface. While arrays do not possess `List` methods, they can be manipulated like a `List` through this method.

```java
String[] array = {"singleton", "strategy", "observer"};
List<String> list = Arrays.asList(array);
```

However, the returned `List` is fixed-size, so invoking `add()` or `remove()` throws an `UnsupportedOperationException`. It is worth noting that hiding the structural constraints of an array behind the `List` interface means the original constraints follow along.

## InputStreamReader

`InputStreamReader` is an adapter that converts a byte stream (`InputStream`) into a character stream (`Reader`). `InputStream`, which handles bytes, and `Reader`, which handles characters, have different interfaces, but `InputStreamReader` connects them.

```java
InputStream byteStream = new FileInputStream("data.txt");
Reader charStream = new InputStreamReader(byteStream, StandardCharsets.UTF_8);
```

<br>

# How DispatcherServlet Invokes Handlers

## HandlerAdapter

Spring MVC's `HandlerAdapter` is a textbook example of the Adapter pattern. Spring supports various forms of handlers (annotation-based controllers, `HttpRequestHandler`, `Controller` interface, etc.), and `DispatcherServlet` can invoke them in a unified manner thanks to `HandlerAdapter`.

`DispatcherServlet` does not know the specific type of the handler. Instead, it delegates to `HandlerAdapter`, requesting "Please execute this handler," and each adapter (such as `RequestMappingHandlerAdapter` or `HttpRequestHandlerAdapter`) converts the invocation appropriately for that handler.

```java
public interface HandlerAdapter {
    boolean supports(Object handler);
    ModelAndView handle(HttpServletRequest request, HttpServletResponse response,
                        Object handler) throws Exception;
}
```

It determines whether it can process the handler via the `supports()` method, and executes the actual request processing using the `handle()` method.

<br>

# Adapter vs. Decorator, Adapter vs. Facade

The Adapter pattern is easily confused with other structural patterns.
The Decorator pattern adds functionality to an object while maintaining the same interface, whereas the Facade pattern provides a single, simple interface in front of a complex subsystem, enabling clients to use features without knowing the internal structure.

| Criteria | Adapter | Decorator | Facade |
|------|--------|-----------|--------|
| Purpose | Interface conversion | Adding features | Simplifying complex subsystems |
| Existing Interface | Modifies | Preserves | Provides a new interface |
| Target Count | Wraps a single class | Wraps a single object | Groups multiple classes |

An adapter's purpose is to convert interfaces, not to add functionality or simplify systems. Remembering this distinction makes it easier to differentiate the three patterns.

<br>

# Conclusion

The Adapter pattern solves problems by providing a conversion layer between classes with incompatible interfaces. It is particularly useful in situations where existing code cannot be modified, such as external library integration or legacy code coupling.

As shown by Spring MVC's `HandlerAdapter`, an adapter becomes the natural choice when various implementations must be treated through a unified interface. It is natural for adapters to be used at the boundaries with external systems. However, if adapters begin to appear between internal modules, aligning the interfaces first might be better in the long run than adding adapters.