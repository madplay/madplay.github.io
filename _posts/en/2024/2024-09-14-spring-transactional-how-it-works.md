---
layout: post
title: "How Spring @Transactional Works Under the Hood"
author: madplay
tags: spring transactional aop proxy transaction
description: "From the proxy-based mechanism of Spring @Transactional to the self-invocation trap, propagation behavior, rollback rules, and readOnly optimization."
category: Spring
date: "2024-09-14 20:41:23"
comments: true
lang: en
slug: spring-transactional-how-it-works
permalink: /en/post/spring-transactional-how-it-works
---

# What a Single Annotation on a Method Actually Does

Put `@Transactional` on a method, and the transaction starts automatically, rolls back on exception, and commits on success.
It is so convenient that it is easy to stop thinking about what happens underneath.
But when you call a `@Transactional` method from within the same class and the transaction never starts,
or when a checked exception fires but nothing rolls back, you cannot diagnose the root cause without understanding the internals.

Spring's `@Transactional` operates through proxy objects.
It is worth examining how the proxy is created, what flow a method call follows,
and what pitfalls arise from this architecture.

<br>

# The Proxy Wraps the Transaction

> The code in this post is based on Spring Boot 3.x and Spring Framework 6.x.

When a class or method is annotated with `@Transactional`, Spring registers a **proxy object** in the container instead of the original bean.
When an external caller invokes a method on this bean, the proxy intercepts the call, starts a transaction, delegates to the original method, then commits or rolls back based on the result.

```text
Caller → Proxy Object → TransactionInterceptor → Original Object's Method
                         │
                         ├─ Start transaction
                         ├─ Execute original method
                         └─ Commit or Rollback
```

There are two ways to create this proxy.

**CGLIB proxy** generates a subclass of the target class at runtime.
Spring Boot uses CGLIB by default, so a proxy is created even when you put `@Transactional` directly on a concrete class without an interface.
However, if the class is `final`, subclassing is impossible and proxy creation fails.

**JDK dynamic proxy** creates a proxy based on the interfaces the target class implements.
Only methods declared in the interface can be intercepted by the proxy; methods not in the interface do not get transactional behavior.
This was the default before Spring Boot 2.0, but CGLIB is the default now.

This is exactly where the Proxy pattern from design-pattern theory comes into play in practice.

<br>

# What Happens After the Proxy Intercepts the Call

Once the proxy intercepts a method call, `TransactionInterceptor` handles the actual transaction processing.
This interceptor implements Spring AOP's `MethodInterceptor` and internally delegates to a `TransactionManager` to control the transaction.

Using an article service as an example:

```java
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final IndexService indexService;

    public ArticleService(ArticleRepository articleRepository, IndexService indexService) {
        this.articleRepository = articleRepository;
        this.indexService = indexService;
    }

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        indexService.index(article);
    }
}
```

When `publishArticle()` is called, the following steps happen internally:

1. `TransactionInterceptor` reads the `@Transactional` attributes (propagation level, isolation level, readOnly, rollback rules, etc.).
2. It calls `PlatformTransactionManager.getTransaction()` to start a transaction.
3. It executes the original `publishArticle()` method.
4. If no exception is thrown, it calls `commit()`. If a rollback-eligible exception occurs, it calls `rollback()`.

> The key takeaway here is that the interceptor only kicks in **when the call comes through the proxy**.
> If the call bypasses the proxy, the transaction never starts.

<br>

# The Self-Invocation Trap

The most common issue with `@Transactional` is calling a method from within the same class.

```java
@Service
public class ArticleService {

    public void processArticle(ArticleRequest request) {
        // Directly calls a @Transactional method in the same class
        publishArticle(request);
    }

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        indexService.index(article);
    }
}
```

Calling `articleService.publishArticle()` from outside goes through the proxy, so the transaction applies correctly.
But when `processArticle()` in the same class calls `this.publishArticle()`, the call goes directly to the **original object's method**, not through the proxy.
Since it never passes through `TransactionInterceptor`, `@Transactional` has no effect even though it is present.

```text
External → proxy.processArticle() → original.processArticle() → original.publishArticle()
                                                                    ↑
                                                        Does not go through the proxy → No transaction
```

## How to Solve Self-Invocation

The cleanest approach is to extract the transactional logic into a separate class.
If `ArticleService` injects and calls `ArticleTransactionService`, the call goes through the proxy.

```java
@Service
public class ArticleService {

    private final ArticleTransactionService transactionService;

    public ArticleService(ArticleTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public void processArticle(ArticleRequest request) {
        transactionService.publishArticle(request);
    }
}

@Service
public class ArticleTransactionService {

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        // ...
    }
}
```

You could also retrieve the bean from `ApplicationContext` and call it on yourself, but that looks like a circular reference and hurts readability.
As discussed in
<a href="/en/post/why-constructor-injection-is-better-than-field-injection" target="_blank">why constructor injection is recommended</a>,
keeping the dependency structure explicit through class separation is the better choice.

<br>

# Propagation Determines Transaction Boundaries

The `propagation` attribute of `@Transactional` determines how to handle a new transaction when one is already in progress.
The default is `REQUIRED`. Here are the propagation types commonly used in practice:

| Propagation | Behavior | Notes |
|----------|------|------|
| `REQUIRED` (default) | Joins the existing transaction if one exists, otherwise starts a new one | Suitable for most service methods |
| `REQUIRES_NEW` | Always starts a new transaction, suspending the existing one | Commits independently regardless of outer transaction rollback |
| `MANDATORY` | Requires an existing transaction; throws an exception if none exists | Defensive guard for methods that must not run without a transaction |
| `NESTED` | Savepoint-based nested transaction; nested rollback does not affect the outer transaction | Not supported by `JpaTransactionManager`, only works with `DataSourceTransactionManager` |

## REQUIRED Nesting: Why a Rollback Happens Even When You Catch the Exception

Since `REQUIRED` is the default, when a `@Transactional` method calls another `@Transactional` method, they share the same physical transaction.
This leads to a common pitfall.

```java
@Service
public class ArticleService {

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);

        try {
            indexService.index(article);  // REQUIRED - joins the same transaction
        } catch (Exception e) {
            log.warn("Indexing failed, proceeding anyway", e);
        }
    }
}

@Service
public class IndexService {

    @Transactional  // default REQUIRED
    public void index(Article article) {
        // Marks the transaction as rollback-only on exception
        throw new RuntimeException("Elasticsearch connection failed");
    }
}
```

When `indexService.index()` throws an exception, Spring marks the current transaction as **rollback-only**.
Even though the outer `publishArticle()` catches the exception and continues normally, at commit time Spring detects the rollback-only flag
and throws `UnexpectedRollbackException`. The article save gets rolled back as well.

Once both methods participate in the same transaction, a rollback request from the inner method rolls back everything.
To avoid this, declare the inner method as `REQUIRES_NEW` to run in a separate transaction,
or handle the exception inside the participant before it crosses the transaction boundary.

## REQUIRES_NEW: Records That Must Be Persisted, Like Audit Logs

This is useful when a record must be saved regardless of whether the main business logic succeeds or fails.

```java
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final AuditLogService auditLogService;

    // Constructor omitted

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        auditLogService.log(article);  // Independent transaction via REQUIRES_NEW
    }
}

@Service
public class AuditLogService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Article article) {
        // This log commits even if the article publishing transaction rolls back
    }
}
```

Note that `REQUIRES_NEW` acquires a new connection, so watch out for connection pool exhaustion.
Using it carelessly in high-traffic areas can drain the pool and cause connection timeouts.

`MANDATORY` and `NESTED` are less common in practice, but knowing the behavior in the table above broadens your options when designing transaction boundaries.

<br>

# The Default Rollback Rule Is Not Intuitive

Spring's default rollback rule is to **roll back only on unchecked exceptions (RuntimeException and Error)**.
Checked exceptions do not trigger a rollback; they commit. This behavior is not intuitive and often causes mistakes.

```java
@Transactional
public void publishArticle(ArticleRequest request) throws ExternalApiException {
    Article article = Article.create(request);
    articleRepository.save(article);
    externalNotifier.notify(article);  // External API call that may throw a checked exception
}
```

If `externalNotifier.notify()` throws `ExternalApiException` (a checked exception),
the article is already saved and the transaction commits without rolling back. The notification failed, but the article gets published anyway.

The fix is to specify `rollbackFor` explicitly.

```java
@Transactional(rollbackFor = Exception.class)
public void publishArticle(ArticleRequest request) throws ExternalApiException {
    // Now rolls back even on checked exceptions
}
```

If your team uses checked exceptions frequently, setting `rollbackFor = Exception.class` as the default reduces incidents.
Alternatively, design custom exceptions to extend RuntimeException and rely on the default rollback rule.

<br>

# readOnly Is More Than a Hint

`@Transactional(readOnly = true)` declares that the method does not modify any data.
It may look like a simple hint, but several optimizations actually take effect.

With Hibernate, a readOnly transaction causes the persistence context to **skip dirty checking**.
It does not store entity snapshots, which reduces memory usage, and it skips change detection at flush time, improving performance.

```java
@Transactional(readOnly = true)
public ArticleDetail getArticleDetail(Long articleId) {
    return articleRepository.findById(articleId)
            .map(ArticleDetail::from)
            .orElseThrow(() -> new ArticleNotFoundException(articleId));
}
```

With MySQL or PostgreSQL, the JDBC driver sends a read-only connection hint to the database.
Depending on your setup, combining this with a configuration that routes read-only connections to replicas
lets you distribute write and read traffic.

However, calling `save()` or `delete()` inside a readOnly transaction produces different behavior depending on the database.
Some silently ignore it, others throw an exception. If you declare readOnly, do not include any write operations.

## Should You Add @Transactional to Read-Only Methods?

Explicitly annotating read-only methods with `@Transactional(readOnly = true)` is a good practice.
Without a transaction, each query runs in its own independent transaction,
which can break data consistency when a single read operation issues multiple queries.
Adding readOnly ensures all queries read from a consistent snapshot within a single transaction, and the optimizations mentioned above apply as well.

<br>

# The Illusion @Transactional Creates in Tests

Spring's test framework automatically rolls back test methods annotated with `@Transactional`.
This is convenient because you do not have to worry about data cleanup, but the behavior can hide bugs.

## Transaction Boundaries Disappear

```java
@SpringBootTest
@Transactional
class ArticleServiceTest {

    @Test
    void publishArticle_saves_article() {
        ArticleRequest request = new ArticleRequest("kafka-connect", "Kafka Connect 입문");
        articleService.publishArticle(request);

        Article saved = articleRepository.findBySlug("kafka-connect");
        assertThat(saved).isNotNull();
    }
}
```

This test passes, but the problem is that the entire test runs within a single transaction.
The transaction boundary declared inside `publishArticle()` is effectively ignored.

In production, the transaction commits and the persistence context closes when `publishArticle()` finishes.
In the test, the test method's transaction wraps everything, so `publishArticle()`'s transaction merely participates in the outer one without committing independently.
Even `REQUIRES_NEW` may behave differently in the test environment, causing propagation-related bugs to slip through.

## It Hides Lazy Loading Bugs

```java
@SpringBootTest
@Transactional
class ArticleServiceTest {

    @Test
    void getArticleDetail_returns_tags() {
        Article article = articleRepository.findById(1L).orElseThrow();

        // article.getTags() is LAZY loaded
        // Works fine in the test because the persistence context is still open
        assertThat(article.getTags()).hasSize(3);
    }
}
```

With `@Transactional` on the test method, the persistence context stays open until the test ends.
Accessing a `LAZY`-loaded association at any point triggers a proxy query to fetch the data.

In production, the persistence context closes when the service method's transaction ends.
Calling `getTags()` after that throws a `LazyInitializationException`.
This is a classic pattern where things work in tests but break in production.

## What Happens When You Remove @Transactional from Tests

Removing `@Transactional` from integration tests means you have to handle data cleanup yourself.
In return, the tests run under the same transaction boundaries as production, so you catch the pitfalls mentioned above before they reach users.

There are several cleanup approaches:
call `deleteAll()` in `@AfterEach`, use `@Sql` scripts to reset tables,
or reinitialize the testcontainer's database for each test.

```java
@SpringBootTest
class ArticleServiceTest {

    @AfterEach
    void cleanup() {
        articleRepository.deleteAllInBatch();
    }

    @Test
    void publishArticle_saves_article() {
        ArticleRequest request = new ArticleRequest("kafka-connect", "Kafka Connect 입문");
        articleService.publishArticle(request);

        Article saved = articleRepository.findBySlug("kafka-connect");
        assertThat(saved).isNotNull();
    }
}
```

This does not mean you should remove `@Transactional` from every test.
Auto-rollback is still convenient for unit tests or simple repository tests.
However, when integration tests need to verify transaction boundaries or lazy loading behavior at the service layer, removing `@Transactional` and testing under production-like conditions is the safer approach.

<br>

# Wrapping Up

`@Transactional` operates through a proxy, and without the proxy, no transaction applies.
This single statement is the thread that connects the self-invocation problem, propagation behavior, and testing pitfalls.

The default rule that checked exceptions do not trigger a rollback creates hard-to-forget mistakes once you hit it,
and the readOnly optimization can make a real difference in query performance depending on whether you use it intentionally.
Understanding the mechanism hidden behind a single annotation should help narrow down the root cause when transaction issues arise.
