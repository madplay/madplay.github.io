---
layout: post
title: "Template Method Pattern: Fixing the Skeleton, Changing the Steps"
author: madplay
tags: design-pattern java spring
description: "Fixing the overall flow while changing specific steps is the core of the Template Method pattern. Spring's JdbcTemplate also relies on this principle."
category: Algorithm/CS
date: "2021-04-10 22:41:08"
comments: true
lang: en
slug: template-method-pattern
permalink: /en/post/template-method-pattern
---

# Repetitive Procedures, Changing Details

Consider the task of processing data. The flow of reading data from a file, processing it, and outputting the result is the same, but the reading method differs between CSV and JSON data sources. Due to this difference, duplicating the entire logic to create separate classes is inefficient.

The Template Method pattern defines the skeleton of an algorithm in a superclass and lets subclasses override the varying steps. It manages the overall flow in one place while flexibly responding to changes in detail implementations.

<br>

# Structure of the Template Method Pattern

There are two components:

- **AbstractClass:** Contains the template method defining the algorithm's skeleton and abstract methods that subclasses must implement.
- **ConcreteClass:** Overrides the abstract methods to provide specific behaviors.

The template method is usually declared `final` to prevent subclasses from altering the skeleton itself. Since only the abstract methods are subject to change, the scope of extension is clearly restricted.

<br>

# Implementing a Data Processor

Let's implement a processor that reads, processes, and outputs a data file as an example.

```java
public abstract class DataProcessor {

    // Template method: Defines the overall flow
    public final void process() {
        String rawData = readData();
        String processed = transform(rawData);
        output(processed);
    }

    // Steps subclasses must implement
    protected abstract String readData();
    protected abstract String transform(String data);

    // Common step: Can be overridden if needed (Hook method)
    protected void output(String data) {
        System.out.println("Result: " + data);
    }
}
```

We create implementations for processing CSV data and JSON data.

```java
class CsvDataProcessor extends DataProcessor {
    @Override
    protected String readData() {
        // Logic to read a CSV file
        return "name,age\nmadplay,30";
    }

    @Override
    protected String transform(String data) {
        // Parse and process CSV
        return data.replace(",", " | ");
    }
}

class JsonDataProcessor extends DataProcessor {
    @Override
    protected String readData() {
        // Logic to read a JSON file
        return "{\"name\":\"madplay\",\"age\":30}";
    }

    @Override
    protected String transform(String data) {
        // Parse and process JSON
        return data.replaceAll("[{}\"]", "");
    }
}
```

The caller does not need to know the specific data format.

```java
DataProcessor processor = new CsvDataProcessor();
processor.process();
// Result: name | age
// madplay | 30

processor = new JsonDataProcessor();
processor.process();
// Result: name:madplay,age:30
```

Because the `process()` method is `final`, subclasses cannot change the overall flow. They can only override `readData()` and `transform()`, making the modifiable scope clear.

<br>

# Hook Method

A method with a default implementation that subclasses can optionally override, like the `output()` method in the example above, is called a hook. Unlike abstract methods, overriding is optional, not mandatory.

```java
public abstract class DataProcessor {

    public final void process() {
        if (validate()) {  // Hook: Default is true
            String rawData = readData();
            String processed = transform(rawData);
            output(processed);
        }
    }

    // Hook method: Provides a default implementation but can be overridden
    protected boolean validate() {
        return true;
    }

    // ... Rest omitted
}
```

Using hook methods allows subclasses to selectively intervene at specific points in the algorithm.

<br>

# Why JdbcTemplate is a Template

## JdbcTemplate

Spring's `JdbcTemplate` hides the repetitive JDBC procedures (acquiring connection → creating statement → executing query → mapping results → cleaning up resources) within a skeleton, leaving developers to provide only the query and result mapping logic. Strictly speaking, `JdbcTemplate` relies on injecting callbacks (like `RowMapper`) rather than inheritance, making it closer to the Strategy pattern. However, the design intent of fixing the repetitive procedure as a skeleton and receiving only the variable parts from the outside aligns with the Template Method pattern.

```java
List<Article> articles = jdbcTemplate.query(
    "SELECT title, author FROM article WHERE category = ?",
    (rs, rowNum) -> new Article(
        rs.getString("title"),
        rs.getString("author")
    ),
    "Algorithm/CS"
);
```

The template handles the repetitive boilerplate of connection management and exception handling on your behalf.

## RestTemplate

`RestTemplate` is similar. It frames the common procedure of an HTTP request (connection setup → sending request → reading response → conversion) as a skeleton, requiring the caller only to specify the URL and response type. Like `JdbcTemplate`, it is callback-based and not a pure Template Method pattern, but the design philosophy of hiding repetitive procedures in a skeleton remains identical.

```java
Article article = restTemplate.getForObject(
    "https://api.example.com/articles/{id}",
    Article.class,
    42
);
```

## AbstractController

Spring MVC's `AbstractController` places the common request processing flow (request validation → session check → caching) in the superclass, designing only the `handleRequestInternal()` method for subclass implementation. Although it is rarely used directly now that annotation-based controllers (`@Controller`) are mainstream, it serves as an example of how extensively the Template Method pattern is utilized in Spring's internal design.

<br>

# Template Method vs. Strategy Pattern

The Template Method and Strategy patterns solve similar problems but with different approaches.

| Criteria | Template Method | Strategy Pattern |
|------|-------------|----------|
| Extension Mechanism | Inheritance (Subclasses override steps) | Composition (Injecting strategy objects) |
| Skeleton Modification | Impossible (final template method) | The entire strategy can be replaced |
| Coupling | Coupling between superclass and subclass | Loose coupling via interfaces |
| Ideal Scenarios | Fixed overall flow, only specific steps change | Replacing the entire algorithm at runtime |

If the overall flow is firmly fixed and only some steps change, the Template Method is appropriate. On the other hand, if the algorithm itself must be swapped freely at runtime, the Strategy pattern is more flexible.

Neither is absolutely superior. You can choose the appropriate one depending on the situation, and as seen with Spring's `JdbcTemplate`, there are cases where the Template Method and Strategy (callback) are used together.

<br>

# Conclusion

The Template Method pattern features a structure where the algorithm's skeleton is fixed in a superclass, and variable parts are delegated to subclasses. Spring's `JdbcTemplate` and `RestTemplate` are more like variations combined with callbacks than pure Template Method patterns, but the core idea of concealing repetitive procedures within a skeleton and receiving variable parts from the outside remains identical.

In fact, Spring has also shifted from the approach of inheriting `AbstractController` to using the `@Controller` annotation. When introducing a template method, it might be better to first consider whether it can be transitioned to a callback or a functional interface before the inheritance hierarchy deepens.