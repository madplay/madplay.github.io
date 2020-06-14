---
layout: post
title: "Builder Pattern for Many Parameters"
author: madplay
tags: design-pattern java
description: "As the number of parameters in a constructor increases, the code becomes difficult to read. How does the Builder pattern solve this problem?"
category: Algorithm/CS
date: "2020-06-13 08:27:15"
comments: true
lang: en
slug: builder-pattern
permalink: /en/post/builder-pattern
---

# Problems with Long Constructors

You have likely seen constructors with four or five parameters. Just reading which value maps to which field becomes exhausting, and putting parameters in the wrong order might not be caught at compile time.

```java
// It is hard to figure out which value corresponds to which field just by looking at the call
Article article = new Article("Design Patterns", "madplay", "Algorithm/CS",
    "Covers the Builder pattern", true, LocalDateTime.now());
```

A traditional solution is the telescoping constructor pattern. It involves overloading the constructor for different parameter combinations. However, as parameters increase, the number of constructors grows, making maintenance difficult.

Using setters, like the JavaBeans pattern, is another approach. However, it can break consistency until the object is fully constructed, and it prevents the creation of immutable objects.

The Builder pattern solves both of these problems simultaneously. It ensures readability through method chaining while allowing the creation of immutable objects when `build()` is called.

<br>

# Structure of the Builder Pattern

The Builder Pattern separates the construction process of a complex object into steps, allowing the same construction process to create different representations of the object.

The form frequently used in practice is the one introduced in Effective Java. It defines a Builder as a static inner class within the target class, sets fields through method chaining, and creates the object with `build()`.

<br>

# Creating an Article Object

Let's create an object representing a blog post (Article) using the Builder pattern.

```java
public class Article {
    private final String title;
    private final String author;
    private final String category;
    private final String description;
    private final boolean published;

    private Article(Builder builder) {
        this.title = builder.title;
        this.author = builder.author;
        this.category = builder.category;
        this.description = builder.description;
        this.published = builder.published;
    }

    public static class Builder {
        // Required parameters
        private final String title;
        private final String author;

        // Optional parameters (default values set)
        private String category = "";
        private String description = "";
        private boolean published = false;

        public Builder(String title, String author) {
            this.title = title;
            this.author = author;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder published(boolean published) {
            this.published = published;
            return this;
        }

        public Article build() {
            if (title == null || title.isBlank()) {
                throw new IllegalStateException("Title is required.");
            }
            return new Article(this);
        }
    }
}
```

For the caller, it is clear which value goes into which field.

```java
Article article = new Article.Builder("Design Patterns", "madplay")
    .category("Algorithm/CS")
    .description("Covers the Builder pattern")
    .published(true)
    .build();
```

Since the Article constructor is `private`, the object cannot be created without going through the Builder. Because all fields are `final`, the created Article becomes an immutable object that cannot be altered.

<br>

# Builders We Already Use

## StringBuilder

The most familiar example is `StringBuilder`. The `append()` method returns itself, enabling chaining.

```java
String result = new StringBuilder()
    .append("Factory")
    .append(" Method")
    .append(" Pattern")
    .toString();
```

Strictly speaking, this differs from the GoF Builder pattern definition, but the essence of constructing an object step-by-step is identical.

## Stream.Builder

Introduced in Java 8, `Stream.Builder` follows the same principle.

```java
Stream<String> stream = Stream.<String>builder()
    .add("singleton")
    .add("strategy")
    .add("observer")
    .build();
```

<br>

# From URI Assembly to Response Configuration

## UriComponentsBuilder

`UriComponentsBuilder`, frequently used in Spring to assemble URIs, is a representative use case of the Builder pattern.

```java
String uri = UriComponentsBuilder.fromUriString("https://api.example.com")
    .path("/articles")
    .queryParam("category", "design-pattern")
    .queryParam("page", 1)
    .build()
    .toUriString();
// https://api.example.com/articles?category=design-pattern&page=1
```

It hides complex logic such as query parameter encoding and path variable substitution inside the builder, so the caller only needs to focus on the assembly order.

## ResponseEntity.BodyBuilder

The Builder pattern is also utilized when creating a `ResponseEntity`.

```java
return ResponseEntity.ok()
    .header("X-Custom-Header", "value")
    .body(articleList);
```

You can configure the status code, headers, and body step-by-step, making the response configuration clear.

<br>

# Convenience and Limitations of Lombok @Builder

Applying Lombok's `@Builder` annotation automatically generates the builder code. It reduces boilerplate, making it widely used in practice.

```java
@Builder
public class Article {
    private String title;
    private String author;
    private String category;
}
```

However, it has a few limitations:

- **Cannot enforce required parameters.** Lombok's `@Builder` treats all fields as optional. Even if `title` must be present, `build()` can be called without it, causing the problem to be discovered only at runtime.
- **Lacks build-time validation.** If you implement the Builder manually, you can validate relationships between fields in the `build()` method, but it is difficult to insert such logic into the `build()` generated by Lombok.
- **Constraints in inheritance structures.** To set parent class fields in a child Builder, you must use `@SuperBuilder`, which does not operate smoothly in all situations.

For simple DTOs or configuration objects, `@Builder` is sufficient. But if enforcing required fields or build-time validation is necessary, implementing the Builder manually is safer.

<br>

# Conclusion

The Builder pattern focuses on creating objects with many parameters safely and in a readable manner. The principles of the Builder pattern are embedded in APIs we already use familiarly, such as JDK's `StringBuilder` and Spring's `UriComponentsBuilder`.

The moment a constructor exceeds four parameters, introducing a Builder often comes up in code reviews. It might look fine initially, but as fields are added one by one, order mistakes inevitably occur. By adopting a Builder early, you can catch those mistakes during the readability phase rather than at compile time.