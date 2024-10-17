---
layout: post
title: "Java Virtual Thread: Spring Boot Integration and Best Practices"
author: madplay
tags: java virtual-thread spring-boot tomcat async threadlocal
description: "Enabling Virtual Threads in Spring Boot is as simple as setting spring.threads.virtual.enabled=true. This post explores how it affects Tomcat, @Async, and provides essential cautions for MDC and connection pools."
category: Java/Kotlin
date: "2024-10-17 22:08:53"
comments: true
series: "Virtual Thread"
lang: en
slug: java-virtual-thread-spring-boot
permalink: /en/post/java-virtual-thread-spring-boot
---

# Virtual Thread Series

- <a href="/en/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: Introduction and Internal Mechanics</a>
- <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Understanding and Mitigating Pinning</a>
- <a href="/en/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: Performance Benchmarking and Adoption Criteria</a>
- **Java Virtual Thread: Spring Boot Integration and Best Practices**
- <a href="/en/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux</a>

<br>

# Integrating with Spring Boot

Now, let's explore how to apply Virtual Threads to a real Spring Boot application.

With the release of Spring Boot 3.2 in November 2023, Virtual Thread support was introduced as an auto-configuration feature.
With just a single line of configuration, Tomcat, `@Async`, and `TaskExecutor` all transition to using Virtual Threads.

> This post is based on Spring Boot 3.2 and Java 21.

<br>

# Activation Settings

## application.yml

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

By adding this configuration, Spring Boot's Auto-Configuration automatically handles the following:

- **Tomcat**: Switches the request-processing threads to Virtual Threads.
- **@Async**: Uses a Virtual Thread-based Executor for asynchronous tasks.
- **SimpleAsyncTaskExecutor**: Configured to be Virtual Thread-based.

## Gradle Dependencies

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    // Java 21+ required; no additional dependencies needed.
}
```

Since Virtual Threads are a standard feature of Java 21, no separate library is required as long as you use the correct JDK version.

<br>

# Verifying Tomcat Behavior

After applying the settings, you can verify the name of the thread handling requests.

```java
@RestController
public class NewsletterController {

    @GetMapping("/dispatch/status")
    public String status() {
        return Thread.currentThread().toString();
    }
}
```

Response when `spring.threads.virtual.enabled=false`:

```
Thread[http-nio-8080-exec-1,5,main]
```

Response when `spring.threads.virtual.enabled=true`:

```
VirtualThread[#42]/runnable@ForkJoinPool-1-worker-3
```

A new Virtual Thread is created for each request, with a `ForkJoinPool` worker acting as the carrier thread.

<br>

# @Async and Virtual Threads

## Default Behavior

When `spring.threads.virtual.enabled=true`, using `@Async` automatically utilizes Virtual Threads without further configuration.

```java
@Service
public class NewsletterService {

    private final MailClient mailClient;

    public NewsletterService(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    @Async
    public CompletableFuture<Void> dispatchAsync(Subscriber subscriber, Newsletter newsletter) {
        mailClient.send(subscriber.email(), newsletter);
        return CompletableFuture.completedFuture(null);
    }
}
```

## Customizing TaskExecutor

When you need more control over throughput or logging, you can configure a `TaskExecutor` directly.
You can specify a name pattern using `Thread.ofVirtual().name(...).factory()` and pass it to `Executors.newThreadPerTaskExecutor()` to create an Executor that generates Virtual Threads with that name for every task.

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "newsletterExecutor")
    public Executor newsletterExecutor() {
        ThreadFactory factory = Thread.ofVirtual()
                .name("newsletter-vt-", 0)
                .factory();
        return Executors.newThreadPerTaskExecutor(factory);
    }
}
```

```java
@Async("newsletterExecutor")
public CompletableFuture<Void> dispatchAsync(Subscriber subscriber, Newsletter newsletter) {
    mailClient.send(subscriber.email(), newsletter);
    return CompletableFuture.completedFuture(null);
}
```

Adding the `newsletter-vt-` prefix to thread names makes log tracing much easier.

<br>

# Cautions and Considerations

## Synchronized and Pinning

As discussed in the <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">previous post</a>, some libraries that Spring depends on (like older versions of Hibernate or certain connection pool implementations) use `synchronized` internally.
After enabling Virtual Threads, it's wise to check for Pinning using `-Djdk.tracePinnedThreads=short`.

## MDC and ThreadLocal

MDC (Mapped Diagnostic Context) uses `ThreadLocal` internally.
While MDC works correctly in a Virtual Thread environment, it's safer to maintain the pattern of calling `MDC.clear()` in a Filter or Interceptor to ensure that data doesn't persist across threads.

```java
@Component
public class MdcClearFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

## Connection Pool Size

In a Virtual Thread environment, the number of request-processing threads is effectively unlimited.
If your database connection pool is too small, Virtual Threads will pile up waiting for a connection.
The service won't necessarily crash, because Virtual Threads yield their carrier during the wait, but the database load could increase significantly.
You should adjust HikariCP's `maximum-pool-size` appropriately.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
```

There's no need to increase the connection pool size infinitely just because the number of Virtual Threads has grown. Set it based on the number of concurrent queries the database server can handle.

## @Scheduled is Not Automatically Converted

While `spring.threads.virtual.enabled=true` automatically handles Tomcat and `@Async`, it does not apply to `@Scheduled`. To run scheduled tasks using Virtual Threads, you must configure a `TaskScheduler` separately.

```java
@Configuration
public class SchedulerConfig {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadFactory factory = Thread.ofVirtual()
                .name("scheduler-vt-", 0)
                .factory();
        return new ConcurrentTaskScheduler(Executors.newScheduledThreadPool(1, factory));
    }
}
```

However, note that `ScheduledThreadPool` is internally based on platform threads, so it may not behave exactly like a full Virtual Thread-based system.
It's worth evaluating if `@Scheduled` is the right architectural choice for your use case before switching.

## Pinning Risks in Hibernate 5.x

Hibernate 5.x uses `synchronized` extensively. While Spring Boot 3.x defaults to Hibernate 6.x, projects that explicitly downgrade their dependencies might face frequent Pinning.

```
-Djdk.tracePinnedThreads=short
```

If you see the `hibernate` package in the stack trace when using this option, your first priority should be upgrading to Hibernate 6.2 or later.
Hibernate 6.2+ transitioned internal locks to `ReentrantLock`, resolving most Pinning issues.

## Beware of Explosive Concurrent Requests

In the platform thread pool model, the pool size acted as a hard limit on concurrent processing.
Because Virtual Threads can be created without limit, the volume of requests to external APIs or databases could explode uncontrollably.
It's best to explicitly limit concurrency using a `Semaphore` when throughput control is necessary.

```java
@Service
public class NewsletterService {

    private final MailClient mailClient;
    private final Semaphore semaphore = new Semaphore(100);

    public NewsletterService(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(Subscriber subscriber, Newsletter newsletter) throws InterruptedException {
        semaphore.acquire();
        try {
            mailClient.send(subscriber.email(), newsletter);
        } finally {
            semaphore.release();
        }
    }
}
```

Since `Semaphore` handles waiting by yielding the carrier thread, it can be used safely with Virtual Threads without causing Pinning.

## Cautions with WebFlux

Enabling Virtual Threads in a project based on `spring-boot-starter-webflux` overlaps with Reactor's non-blocking model.
Reactor rotates a non-blocking event loop using a small number of threads, while Virtual Threads approach the problem by lightweighting blocking code.
Mixing these two models can prevent you from gaining the full benefits of either.

Virtual Threads are best suited for projects based on the Servlet stack (`spring-boot-starter-web`).

<br>

# Wrapping Up

Setting `spring.threads.virtual.enabled=true` changes a lot.
It transitions Tomcat request handling, `@Async`, and `TaskExecutor` all to Virtual Threads.
The biggest advantage is that you can expect throughput improvements for I/O-bound tasks without modifying almost any of your existing code.

However, before turning it on, you must check for Pinning and verify your connection pool settings.
Especially for projects using legacy libraries, checking with `tracePinnedThreads` should be the first order of business.

In the next post, we will compare Virtual Threads with Kotlin Coroutines and WebFlux, which approach the same goals in different ways.

- <a href="/en/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux</a>
