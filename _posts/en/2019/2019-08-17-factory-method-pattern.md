---
layout: post
title: "Factory Method Pattern: Delegating Object Creation to Subclasses"
author: madplay
tags: design-pattern java
description: "What are the benefits of delegating object creation to subclasses? We examine the structure of the Factory Method pattern and its practical use cases in Java and Spring."
category: Algorithm/CS
date: "2019-08-17 21:18:43"
comments: true
lang: en
slug: factory-method-pattern
permalink: /en/post/factory-method-pattern
---

# Why Not Create Objects Directly

Creating objects directly with the `new` keyword is simple, but it requires modifying the caller code whenever a new class is added. For example, if a notification system originally only sends emails but later needs to support SMS and push notifications, the code must change.

```java
// You must modify this code whenever a new notification type is added
if (type.equals("email")) {
    notification = new EmailNotification();
} else if (type.equals("sms")) {
    notification = new SmsNotification();
} else if (type.equals("push")) {
    notification = new PushNotification();
}
```

As conditional branches grow and creation logic scatters, the impact of changes expands. The Factory Method pattern solves this problem by delegating the responsibility of object creation to subclasses.

<br>

# Structure of the Factory Method Pattern

The Factory Method Pattern defines an interface for creating an object, but lets subclasses decide which class to instantiate.

The components include:

- **Product:** The interface of the object to be created.
- **ConcreteProduct:** The actual class that implements the Product.
- **Creator:** The abstract class that declares the factory method.
- **ConcreteCreator:** The class that overrides the factory method to return a ConcreteProduct.

The core idea is that the Creator does not directly know the ConcreteProduct. Since the ConcreteCreator decides which object to instantiate, adding a new Product does not require modifying the Creator's code.

<br>

# Example: Notification System

Let's implement a Notification system as an example of the Factory Method pattern.

First, define the `Notification` interface (Product) and its implementations.

```java
public interface Notification {
    void send(String message);
}

class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email sent: " + message);
    }
}

class SmsNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS sent: " + message);
    }
}
```

Next, define the `NotificationCreator` abstract class (Creator). `createNotification()` is the factory method.

```java
public abstract class NotificationCreator {

    // Factory method: The subclass decides which Notification to create
    protected abstract Notification createNotification();

    public void sendNotification(String message) {
        Notification notification = createNotification();
        notification.send(message);
    }
}
```

The ConcreteCreator overrides the factory method to return a specific Notification object.

```java
class EmailNotificationCreator extends NotificationCreator {
    @Override
    protected Notification createNotification() {
        return new EmailNotification();
    }
}

class SmsNotificationCreator extends NotificationCreator {
    @Override
    protected Notification createNotification() {
        return new SmsNotification();
    }
}
```

The caller code demonstrates the effectiveness of this pattern.

```java
public class FactoryMethodTest {
    public static void main(String[] args) {
        NotificationCreator creator = new EmailNotificationCreator();
        creator.sendNotification("Your order is complete.");

        // The caller code remains the same even if the notification method changes to SMS
        creator = new SmsNotificationCreator();
        creator.sendNotification("Your order is complete.");
    }
}
```

Even if a new notification method (e.g., push notification) is added, you only need to create `PushNotification` and `PushNotificationCreator`. Because existing code remains unmodified, this naturally follows the Open-Closed Principle (OCP).

<br>

# Why JDK Calendar Avoids 'new'

The Factory Method pattern is used extensively throughout the JDK.

## Calendar.getInstance()

The `getInstance()` method of `java.util.Calendar` returns different Calendar implementations depending on the locale or time zone.

```java
Calendar calendar = Calendar.getInstance();
// Returns GregorianCalendar, JapaneseImperialCalendar, etc., depending on the locale
```

The caller does not need to know the specific implementation class. Date operations can be performed using only the abstract `Calendar` type.

## NumberFormat.getInstance()

`java.text.NumberFormat` has a similar structure. Methods like `getInstance()`, `getCurrencyInstance()`, and `getPercentInstance()` return appropriate formatters based on the locale.

```java
NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.KOREA);
System.out.println(formatter.format(50000)); // ₩50,000
```

These are often called Static Factory Methods. A static factory method is closer to an idiom that returns an object via a static method instead of a constructor, whereas the GoF Factory Method pattern delegates the creation decision to subclasses through inheritance. Although the approaches differ, both essentially encapsulate object creation.

<br>

# Bean Creation Mechanism in Spring

## BeanFactory and ApplicationContext

Spring's `BeanFactory` is literally a factory that creates Bean objects. Calling the `getBean()` method returns the appropriate bean instance according to the configuration.

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
NotificationService service = context.getBean(NotificationService.class);
```

The caller does not need to know the implementation class of `NotificationService`. The configuration determines which implementation is injected.

## FactoryBean Interface

Spring can encapsulate complex object creation logic through the `FactoryBean<T>` interface. By overriding the `getObject()` method to return the desired object, the Spring container registers it as a bean.

```java
public class NotificationFactoryBean implements FactoryBean<Notification> {

    private String type;

    @Override
    public Notification getObject() throws Exception {
        if ("email".equals(type)) {
            return new EmailNotification();
        }
        return new SmsNotification();
    }

    @Override
    public Class<?> getObjectType() {
        return Notification.class;
    }

    public void setType(String type) {
        this.type = type;
    }
}
```

This is useful when there is complex initialization logic that is difficult to express with standard bean registration.

<br>

# Factory Method vs. Abstract Factory

Abstract Factory is a pattern easily confused with Factory Method. Both encapsulate object creation, but their focus differs.

| Criteria | Factory Method | Abstract Factory |
|------|-------------|------------|
| Creation Target | One type of object | A family of related objects |
| Extension Mechanism | Inheritance (Subclass overrides the factory method) | Composition (Injects the factory object) |
| Complexity | Relatively simple | Complex, as it groups multiple factory methods |

If you only need to create one notification, the Factory Method is sufficient. If you need to create a related family of objects like notifications, loggers, and monitoring components, the Abstract Factory is more appropriate.

<br>

# Ideal Use Cases and Anti-Patterns

The Factory Method pattern shines when the type of object to create is determined at runtime, or when there is a high probability of adding new types continuously.

On the other hand, if there are only one or two types of objects to create and the likelihood of change is low, applying this pattern can be overengineering. This is because the amount of code unnecessarily increases as Creator and ConcreteCreator classes multiply.

Patterns are closer to tools. It is always better to first ask, "Do I need this tool in this situation?"

<br>

# Conclusion

The Factory Method pattern focuses on isolating changes in creation logic from caller code by delegating the responsibility of object creation to subclasses. It is already utilized in JDK's `Calendar` and `NumberFormat`, and the same principle can be found in Spring's `BeanFactory` and `FactoryBean`.

During a code review, if you see type-based `if-else` branches copied in multiple places, it is time to consider the Factory Method. Simply consolidating these branches into one place noticeably reduces the impact of changes.