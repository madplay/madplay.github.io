---
layout: post
title: "What Is a Java Record and When Should You Use It?"
author: madplay
tags: java record dto immutable pattern-matching
description: "A practical guide to Java records: how they work under the hood, their constraints, and when to choose them over regular classes for DTOs and value objects."
category: Java/Kotlin
date: "2024-06-08 07:42:14"
comments: true
lang: en
slug: java-record-when-to-use
permalink: /en/post/java-record-when-to-use
---

# Do You Really Need All That Boilerplate?

Creating a single DTO requires field declarations, a constructor, getters, `equals`, `hashCode`, and `toString`.
A single class easily takes dozens of lines, and every time you add a field, you repeat the same ritual.

Consider a simple class that holds article summary information.

```java
public class ArticleSummary {
    private final String articleId;
    private final int viewCount;
    private final LocalDateTime publishedAt;

    public ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
        this.articleId = articleId;
        this.viewCount = viewCount;
        this.publishedAt = publishedAt;
    }

    public String getArticleId() {
        return articleId;
    }

    public int getViewCount() {
        return viewCount;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ArticleSummary)) return false;
        ArticleSummary that = (ArticleSummary) o;
        return viewCount == that.viewCount
                && Objects.equals(articleId, that.articleId)
                && Objects.equals(publishedAt, that.publishedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(articleId, viewCount, publishedAt);
    }

    @Override
    public String toString() {
        return "ArticleSummary[articleId=" + articleId
                + ", viewCount=" + viewCount
                + ", publishedAt=" + publishedAt + "]";
    }
}
```

A class with just three fields already exceeds 40 lines. You can reduce the noise with Lombok's `@Value` or IDE code generation, but those are workarounds outside the language itself.
Starting with Java 16, `record` addresses this problem at the language level.

> Records <a href="/en/post/what-is-new-in-java-14" target="_blank">first appeared as a preview feature in Java 14 (JEP 359)</a>
> and became a permanent feature in Java 16 (JEP 395).

<br>

# Record Basics

## What the Compiler Generates for You

Rewriting the `ArticleSummary` class above as a record gives you this:

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
}
```

This single line makes the compiler generate the following:

- Three `private final` fields
- A canonical constructor that accepts all fields
- Accessor methods named after each field: `articleId()`, `viewCount()`, `publishedAt()`
- Field-value-based `equals` and `hashCode`
- A `toString` that displays all field values

Note that accessor names follow the pattern `articleId()` rather than `getArticleId()`, which differs from the traditional JavaBean convention.

```java
ArticleSummary article = new ArticleSummary("ART-001", 1024, LocalDateTime.now());

// accessor
String id = article.articleId();
int views = article.viewCount();

// equals: objects with the same field values are considered equal
ArticleSummary another = new ArticleSummary("ART-001", 1024, article.publishedAt());
assert article.equals(another);

// toString
System.out.println(article);
// ArticleSummary[articleId=ART-001, viewCount=1024, publishedAt=2024-06-08T14:00]
```

## Comparison with a Regular Class

The regular `ArticleSummary` class above took roughly 45 lines. The record version is two lines, including the braces.
The gap only widens as you add more fields.
More important than the line count reduction is the signal the declaration itself sends: "this class exists solely to carry data."

<br>

# Record Constraints

## No Inheritance

Every record implicitly extends `java.lang.Record`. Since Java does not allow multiple inheritance, a record cannot `extends` another class.
Implementing interfaces, however, is perfectly fine.

```java
public interface Printable {
    String toPrintFormat();
}

public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt)
        implements Printable {

    @Override
    public String toPrintFormat() {
        return articleId + " / views " + viewCount;
    }
}
```

## Fields Are Immutable

All fields in a record are `final`. There are no setters. If you need a different value, you create a new instance.

```java
// To change the view count, create a new record
ArticleSummary updated = new ArticleSummary(article.articleId(), 2048, article.publishedAt());
```

This characteristic makes records <a href="/en/post/minimize-mutability" target="_blank">immutable objects</a> by nature.
You can safely share them across threads without synchronization, and defensive copying is unnecessary.
Keep in mind, though, that if a component itself is a mutable type (`List`, `Map`, etc.), mutation through the reference is still possible. For true immutability, the component types must be immutable as well.

## No Additional Instance Fields

You cannot declare extra instance fields inside a record body. All state is defined exclusively through the header components.
`static` fields, `static` methods, and instance methods can be added freely.

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    // static fields are allowed
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // instance methods are allowed
    public String formattedDate() {
        return publishedAt.format(DATE_FMT);
    }
}
```

<br>

# Validating with a Compact Constructor

Records offer a special syntax called the compact constructor. It omits the parameter list and the `this.field = param` assignments,
letting you focus purely on validation or normalization logic. The compiler automatically handles the assignment at the end of the compact constructor.

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    public ArticleSummary {
        if (articleId == null || articleId.isBlank()) {
            throw new IllegalArgumentException("articleId must not be blank");
        }
        if (viewCount < 0) {
            throw new IllegalArgumentException("viewCount must be >= 0: " + viewCount);
        }
        // normalize: strip leading/trailing whitespace
        articleId = articleId.strip();
    }
}
```

Assigning a new value to a parameter inside the compact constructor stores the normalized value in the field.
You can also write the canonical constructor explicitly, but for simple validation or normalization, the compact constructor is more concise.

```java
// Writing the canonical constructor explicitly
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    public ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
        if (articleId == null || articleId.isBlank()) {
            throw new IllegalArgumentException("articleId must not be blank");
        }
        this.articleId = articleId.strip();
        this.viewCount = viewCount;
        this.publishedAt = publishedAt;
    }
}
```

The compact constructor has no `this.field = param` assignments, keeping the code short and focused on validation logic.

<br>

# Combining Sealed Classes with Records

A single record has limited expressiveness on its own. Think about events in a news domain.
An article gets published, archived, or deleted. Each event carries different data, but they all belong to a common "article event" type.

By locking down the subtypes with a `sealed interface` and declaring each event as a record, you get a structure that is both concise and type-safe.

```java
public sealed interface ArticleEvent
        permits ArticleEvent.Published, ArticleEvent.Archived, ArticleEvent.Deleted {

    String articleId();

    record Published(String articleId, String title, LocalDateTime publishedAt)
            implements ArticleEvent {
    }

    record Archived(String articleId, String reason, LocalDateTime archivedAt)
            implements ArticleEvent {
    }

    record Deleted(String articleId, String deletedBy, LocalDateTime deletedAt)
            implements ArticleEvent {
    }
}
```

Pair this with Java 21 switch pattern matching, and the compiler catches any unhandled event type as a compile error.

```java
String describe(ArticleEvent event) {
    return switch (event) {
        case ArticleEvent.Published p ->
                "Article published: " + p.articleId() + ", " + p.title();
        case ArticleEvent.Archived a ->
                "Article archived: " + a.articleId() + ", reason: " + a.reason();
        case ArticleEvent.Deleted d ->
                "Article deleted: " + d.articleId() + ", deleted by: " + d.deletedBy();
    };
}
```

Since the interface is `sealed`, no `default` branch is needed. If a new event like `Restored` is added later, both the `permits` clause and the `switch` must be updated.
Miss either one, and the compiler flags it. For a deeper look at <a href="/en/post/java-when-to-use-sealed-abstract-interface" target="_blank">when to choose sealed classes</a>, check out the dedicated post.

<br>

# Where Records Shine in Practice

## DTOs and API Response Mapping

Records pair well with Spring's `@RequestBody` and `@ResponseBody`. Jackson 2.12+ supports records out of the box, so JSON serialization and deserialization work without extra configuration.

```java
public record ArticleResponse(String articleId, String title, String status) {
}

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @GetMapping("/{articleId}")
    public ArticleResponse getArticle(@PathVariable String articleId) {
        // Return service results as a record
        return new ArticleResponse(articleId, "Intro to Kafka Connect", "PUBLISHED");
    }

    @PostMapping
    public ArticleResponse createArticle(@RequestBody ArticleRequest request) {
        // Requests can also be received as records
        return new ArticleResponse(request.articleId(), request.title(), "DRAFT");
    }
}

public record ArticleRequest(String articleId, String title) {
}
```

Because records are immutable with explicit fields, you can verify the API contract directly in the code.
Adding or removing a field breaks every constructor call site, so the impact of changes surfaces at compile time, which is highly useful in production codebases.

## Immutable Value Objects

Records also work well for objects where "the value itself is the identity," such as tags.
Comparing two tags by field values rather than references feels natural, and the auto-generated `equals` guarantees exactly that.

```java
public record Tag(String name, String slug) {

    public Tag {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("slug is required");
        }
    }
}
```

<br>

# When Records Are Not the Right Fit

## JPA Entities

Records cannot serve as JPA entities. The JPA specification's requirements conflict with record characteristics.

- **No-arg constructor:** JPA requires a `no-arg constructor`, but records do not have one.
- **Proxy inheritance:** JPA creates proxies by subclassing entity classes for lazy loading, but records are `final` and cannot be subclassed.
- **Mutable setters:** The dirty-checking mechanism needs field mutations, which conflicts with records' immutable fields.

That said, records are not entirely off-limits with JPA. You can use them as **projection DTOs** in JPQL or native queries.

```java
// Using a record as a projection DTO
public record ArticleSummaryDto(String articleId, int viewCount) {
}

// DTO projection in JPQL
@Query("SELECT new com.example.ArticleSummaryDto(a.articleId, a.viewCount) FROM Article a WHERE a.status = :status")
List<ArticleSummaryDto> findSummariesByStatus(@Param("status") String status);
```

## When Mutable State Is Required

Records do not fit scenarios where you assemble objects incrementally with the builder pattern, or where domain object state changes as business logic progresses.
If an article entity needs to transition through `DRAFT` → `PUBLISHED` → `ARCHIVED`,
creating a new instance each time is technically possible, but for domain objects with frequent state transitions, a regular class tends to be more practical.

<br>

# Wrapping Up

When you are unsure whether to use a record, ask one question: **"Is carrying data all this class does?"**

If the answer is yes, a record is a strong fit. Instead of hand-writing constructors, getters, `equals`, `hashCode`, and `toString`, or delegating to Lombok,
you can use a concise language-level declaration that makes your intent explicit. On the other hand, if the class needs mutable state, an inheritance hierarchy,
or operates under framework constraints like JPA entities, I think sticking with a regular class is the better call.
