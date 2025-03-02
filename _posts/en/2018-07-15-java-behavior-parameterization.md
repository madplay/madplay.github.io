---
layout:   post
title:    Java and Behavior Parameterization
author:   Kimtaeng
tags: 	  java parameterization lambda
description: Passing code to methods when execution behavior hasn't been decided yet.
category: Java
comments: true
slug:     java-behavior-parameterization
lang:     en
permalink: /en/post/java-behavior-parameterization
---

# They're Asking to Change the Spec Again..?
When developing, you sometimes encounter unintended changes.
You might encounter them in hobby toy projects, or when developing with colleagues at companies or schools,
you may face unexpected changes due to various factors.

Frequent changes in development code can lead to unwanted `Side Effects`.
If code unrelated to changes is mixed together, the likelihood of unexpected errors increases.
This can be intimidating for developers. (But you shouldn't fear changes...)

Following the important software design principle of **separating changing parts from unchanging parts**,
Behavior Parameterization (or Action Parameterization) in Java can be viewed as a technique
that responds more effectively to frequently changing requirements.

Exploring this concept by examining the following requirements and code:
  - Books have color and page count information.
  - We need to filter only books with red color.

```java
import org.apache.commons.lang3.StringUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author Kimtaeng
 * Created on 2018. 7. 15.
 */
public class Test {
    static List<Book> filterBooksByColor(List<Book> bookList) {
        List<Book> redBookList = new ArrayList<>();
        for (Book book : bookList) {
            // Filter!
            if(StringUtils.equals(book.getColor(), "red")) {
                redBookList.add(book);
            }
        }
        return redBookList;
    }

    public static void main(String[] args) {
        List<Book> bookList = Arrays.asList(
            new Book("MadPlay", "green", 500), new Book("Hello", "red", 300));
            
        // Only books with color red!
        filterBooksByColor(bookList);
    }
}

class Book {
    private String title;
    private String color;
    private int page;

    Book(String title, String color, int page) {
        this.title = title;
        this.color = color;
        this.page = page;
    }
    
    public String getTitle() {
        return title;
    }

    public String getColor() {
        return color;
    }

    public Integer getPage() {
        return page;
    }
}
```

The code itself is simple. On line 46, it compares the book's color value and filters only red ones.
If the spec changed to green instead of red, you'd only need to change that line.

However, this approach requires continuously responding to changes. If you hard-code filtering for specific colors
and requirements change again, direct code modification is needed.

What about passing color as a parameter? Like this:

```java
/**
 * At least... it's better
 */
static List<Book> filterBooksByColor(List<Book> bookList, String color) {
    List<Book> redBookList = new ArrayList<>();
    for (Book book : bookList) {
        // Receive as parameter and filter!
        if(StringUtils.equals(book.getColor(), color)) {
            redBookList.add(book);
        }
    }
    return redBookList;
}
```

The method itself is better because it avoids hard-coding.
But what happens if filtering by page count is needed instead of by color?
You could solve this by creating another method that receives page count instead of color.

However, this approach leads to code duplication. If you implement it, you'll notice that
most of the code is identical except for the conditional statement.

<br/>

# Passing Filter Conditions as Parameters
If you study software engineering or development methodologies, you might encounter the term **Coupling**.
Even before seeing examples of condition parameters, you'll recognize that what I'm about to introduce is not an ideal approach.

<div class="post_caption">Coupling refers to the degree to which modules mutually depend on each other. Lower coupling indicates better modularization.</div>

Creating one method that can filter by color or by page count.
As mentioned earlier, determining what to filter using flag-based condition parameters.

```java
/**
 * It's bad. Let's not do this.
 */
static List<Book> filterBooks(List<Book> bookList, String color, int page, boolean colorFlag) {
    List<Book> resultList = new ArrayList<>();
    for (Book book : bookList) {
        // Filter by color or filter by page count
        if(colorFlag && StringUtils.equals(book.getColor(), color)
                || !colorFlag && book.getPage() > page) {
            resultList.add(book);
        }
    }
    return resultList;
}

...
// Call like this!
List<Book> redBooks = filterBooks(bookList, "red", 0, true);
List<Book> manyPagesBooks = filterBooks(bookList, "green", 400, false);
```

This code is problematic. A flag variable called `colorFlag` that determines filtering type
creates tight `Control Coupling`, even if it's not limited to boolean with only 2 choices,
making it difficult to flexibly respond to additional changes.

<br/>

# Is There Another Approach?
Designing it so multiple behaviors can be passed to determine selection conditions. First, defining the interface!

```java
interface BookPredicate {
    boolean excute(Book book);
}
```

The method with parameters that would keep growing changes as follows:

```java
/**
 * Behavior is received as a parameter.
 */
static List<Book> filterBooks(List<Book> bookList, BookPredicate predicate) {
    List<Book> resultList = new ArrayList<>();
    for (Book book : bookList) {
        if (predicate.excute(book)) {
            resultList.add(book);
        }
    }
    return resultList;
}
```

You can use it as follows. Since code related to classes implementing interfaces increases significantly, which looks verbose,
implementing it with **Anonymous Classes** first.

```java
/**
 * Not bad. Only need to implement Predicate part for changes.
 */
List<Book> redBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return StringUtils.equals(book.getColor(), "red");
    }
});

List<Book> manyPagesBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return book.getPage() > 400;
    }
});
```

Still! There's a drawback. Even with anonymous classes,
you can see duplication of boilerplate code.

<br/>

# Lambda Expressions
Starting with Java 8, you can use `Lambda Expressions`. Code becomes more concise. Refactoring it:

```java
/*
 * This code~
 */
List<Book> redBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return StringUtils.equals(book.getColor(), "red");
    }
});

/*
 * Changes to this.
 */
List<Book> redBooks = filterBooks(bookList,
        book -> StringUtils.equals(book.getColor(), "red"));
```

Not only is the code shorter, but it's also more readable. Of course, preferences may vary.

Lambda expressions can be viewed as simplified anonymous functions that can be passed to methods.
Lambda characteristics include: first, they have anonymity since they have no name.
Also, since they're not bound to specific classes like methods, they're called functions.

Lambdas consist of three parts:

- **Parameter List**
  - Located on the left side of the arrow and refers to parameters.
  - For void form, write like `() -> expression`.
- **Arrow**
  - The arrow separates the lambda's parameter list and body.
- **Body**
  - The body refers to expressions corresponding to the lambda's return value.

We'll cover more detailed expression methods and content about lambdas in another post.

<br/>

# Is There Another Approach?
Using the `Stream API` introduced in Java 8, code for filtering collection elements becomes very concise.
If you simply extract elements with specific conditions from lists, it can be done in a few lines:

```java
/*
 * Using Stream. Filter only books with 400 pages or more.
 */
bookList.stream()
    .filter(book -> book.getPage() > 400)
    .collect(Collectors.toList());
```

You can achieve this without method implementation in just a few lines of code. **Filter and collect to list** - it's also more readable.
