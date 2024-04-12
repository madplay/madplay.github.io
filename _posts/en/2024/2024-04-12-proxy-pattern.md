---
layout: post
title: "The Proxy Pattern Hidden Behind @Transactional"
author: madplay
tags: design-pattern java spring
description: "How does Spring's @Transactional manage transactions before and after method execution? The secret lies in the Proxy pattern!"
category: Algorithm/CS
date: "2024-04-12 08:14:29"
comments: true
lang: en
slug: proxy-pattern
permalink: /en/post/proxy-pattern
---

# What Happens When You Add @Transactional

When you attach `@Transactional` to a method in Spring, transaction management occurs automatically. If the method succeeds, it commits; if an unchecked exception (RuntimeException, Error) occurs, it rolls back. However, this behavior happens without writing any transaction code in the method body. How is this possible?

The answer lies in proxies. Spring creates a proxy object of the bean annotated with `@Transactional`, intercepts the method call, and inserts the transaction logic before and after execution. The Proxy pattern is an approach that introduces a surrogate object to control access to the real object or to provide supplementary features.

<br>

# Structure of the Proxy Pattern

There are three components:

- **Subject:** The interface used by the client.
- **RealSubject:** The implementation class containing the actual business logic.
- **Proxy:** Implements the Subject and holds a reference to the RealSubject to control invocations.

Since the client invokes through the Subject interface, it cannot distinguish between the actual object and the proxy. The proxy intercepts the call, performs supplementary functions like access control, lazy loading, or logging, and then delegates the request to the real object.

Proxies are categorized based on their usage:

- **Protection Proxy:** Checks access permissions.
- **Virtual Proxy:** Delays the creation of expensive objects.
- **Logging/Caching Proxy:** Performs supplementary features before and after invocations.

<br>

# Creating a Caching Proxy

Let's apply a caching proxy to a service that retrieves data.

```java
public interface ArticleService {
    Article findById(Long id);
}

class ArticleServiceImpl implements ArticleService {
    @Override
    public Article findById(Long id) {
        // In reality, this is an expensive database retrieval operation
        System.out.println("Retrieve Article from DB: " + id);
        return new Article(id, "Utilizing Proxy Pattern");
    }
}
```

Create the caching proxy.

```java
class CachingArticleServiceProxy implements ArticleService {
    private final ArticleService delegate;
    private final Map<Long, Article> cache = new HashMap<>();

    public CachingArticleServiceProxy(ArticleService delegate) {
        this.delegate = delegate;
    }

    @Override
    public Article findById(Long id) {
        if (cache.containsKey(id)) {
            System.out.println("Return from cache: " + id);
            return cache.get(id);
        }
        Article article = delegate.findById(id);
        cache.put(id, article);
        return article;
    }
}
```

The caller remains unaware of the proxy's existence.

```java
ArticleService service = new CachingArticleServiceProxy(new ArticleServiceImpl());
service.findById(1L); // Retrieve Article from DB: 1
service.findById(1L); // Return from cache: 1
```

The first invocation delegates to the actual service, while subsequent invocations return from the cache. Not a single line of the actual service code was altered.

<br>

# JDK Dynamic Proxy

If you write proxies manually as in the example above, you must create a proxy class for every interface. The JDK automates this via the `java.lang.reflect.Proxy` class.

```java
ArticleService proxy = (ArticleService) Proxy.newProxyInstance(
    ArticleService.class.getClassLoader(),
    new Class[]{ArticleService.class},
    new InvocationHandler() {
        private final ArticleService target = new ArticleServiceImpl();

        @Override
        public Object invoke(Object proxyObj, Method method, Object[] args) throws Throwable {
            System.out.println("[Proxy] Invoking " + method.getName());
            Object result = method.invoke(target, args);
            System.out.println("[Proxy] Completed " + method.getName());
            return result;
        }
    }
);

proxy.findById(1L);
// [Proxy] Invoking findById
// Retrieve Article from DB: 1
// [Proxy] Completed findById
```

Implementing an `InvocationHandler` allows you to process all method calls in a single handler. Since proxy classes are generated dynamically at runtime, there is no need to create separate proxies for each interface.

However, JDK Dynamic Proxy only works if an interface is present. To proxy a class directly without an interface, a library like CGLIB is required.

<br>

# Spring AOP and Proxies

Spring AOP is built upon the Proxy pattern. Annotations like `@Transactional`, `@Cacheable`, and `@Async` operate based on proxies.

## JDK Dynamic Proxy vs. CGLIB

Spring supports two methods for generating proxies.

| Criteria | JDK Dynamic Proxy | CGLIB |
|------|-------------------|-------|
| Requirements | Interface required | Interface not required |
| Proxy Target | Interface | Class (Bytecode manipulation) |
| Performance | Reflection-based | Relatively faster via bytecode generation |
| Spring Boot Default | No | Default since Spring Boot 2.0 |

Since Spring Boot 2.0, CGLIB is the default proxy mechanism. It can be changed via the `spring.aop.proxy-target-class` property, but unless there is a specific reason, maintaining the default is advisable.

## Execution Flow of @Transactional

A simplified invocation flow of an `@Transactional` method is as follows.

<pre class="mermaid">
sequenceDiagram
    participant C as Client
    participant P as Proxy Object
    participant R as Real Object

    C->>P: Call updateInventory()
    P->>P: Start transaction
    P->>R: Delegate updateInventory()
    R-->>P: Return result
    P->>P: Commit or rollback transaction
    P-->>C: Return result
</pre>

One caveat is that invoking an `@Transactional` method from within the same class bypasses the proxy. Proxies only intercept external invocations.

```java
@Service
public class OrderService {

    public void placeOrder() {
        updateInventory(); // Does not go through the proxy! Transaction is not applied.
    }

    @Transactional
    public void updateInventory() {
        // ...
    }
}
```

This problem can only be discovered if you understand the proxy-based behavior of Spring AOP. It can be bypassed via `self-injection` or fetching the bean from the `ApplicationContext`, but separating the design is generally cleaner.

<br>

# Proxy vs. Decorator

The <a href="/en/post/decorator-pattern" target="_blank">Decorator pattern</a> and the Proxy pattern are structurally almost identical. Both implement the same interface as the original object and delegate to the original internally.

The difference lies in their intent.

- **Decorator:** Its purpose is to add functionality. The client is aware of the decorator's existence.
- **Proxy:** Its purpose is to control access. Ideally, the client remains unaware of the proxy's existence.

Spring's `@Transactional` is an excellent example of the Proxy pattern. Developers do not need to be conscious of the transaction proxy; transactions are applied with just one annotation. On the other hand, Java I/O's `BufferedInputStream` is a good example of a Decorator. The developer explicitly wraps the object to add buffering capabilities.

<br>

# Conclusion

The Proxy pattern controls access to a real object or provides supplementary features by introducing a surrogate object. Because Spring AOP is built on this pattern, understanding proxies is a prerequisite for comprehending the operational mechanics of `@Transactional`, `@Cacheable`, and `@Async`.

In practice, the most frequently encountered pitfall of the Proxy pattern is self-invocation. When a transaction is not applied after calling an `@Transactional` method within the same class, recalling the proxy structure discussed in this article immediately reveals the cause.