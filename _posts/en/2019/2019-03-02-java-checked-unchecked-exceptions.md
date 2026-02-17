---
layout:   post
title:    "Java Exceptions: Checked vs Unchecked"
author:   madplay
tags: 	  java exception
description: How does Java classify exceptions? Differences between checked and unchecked exceptions.
category: Java/Kotlin
comments: true
slug:     java-checked-unchecked-exceptions
lang:     en
permalink: /en/post/java-checked-unchecked-exceptions
---

# What Is an Exception?
Before comparing checked and unchecked exceptions, define **exception** vs **error**.
An **exception** interrupts normal program flow, such as invalid input or invalid references.
In Java, exceptions are recoverable and should be anticipated and handled.

An **error** represents abnormal system conditions, usually thrown by the JVM.
You should not try to handle them in application code.
Examples: `OutOfMemoryError`, `ThreadDeath`, `StackOverflowError`.

```java
/**
 * StackOverflowError example.
 * @author kimtaeng
 */
public class SomeTest {

    public static void test() {
        test();
    }

    public static void main(String[] args) {
        try {
            test();
        } catch (StackOverflowError e) {
            // ...!?
        }
    }
}
```

<br>

# Exception Classification
In Java, exceptions are classified as checked or unchecked.
A simple rule:
- Classes **not** extending `RuntimeException` are **checked**.
- Classes extending `RuntimeException` are **unchecked**.

<img class="post_image" width="700" alt="exceptions"
src="{{ site.baseurl }}/img/post/2019-03-02-java-checked-unchecked-exceptions-1.png"/>

<br>

`RuntimeException` is a subclass of `Exception`, but Java treats it specially.
You are not required to handle it explicitly.

<div class="post_comments">(2022.02.24 update) I removed a previous paragraph about transactions. The post did not explain Spring’s default behavior and the content did not fit this category. Apologies for the confusion.</div>

<br>

# Exception Handling Strategies
There are three common strategies: **recovery**, **propagation**, and **translation**.

## Recovery
- Identify the failure, recover, and continue.
- Retry after waiting for a condition.
- Throw an exception after exceeding retry limits.

```java
final int MAX_RETRY = 100;
public Object someMethod() {
    int maxRetry = MAX_RETRY;
    while(maxRetry > 0) {
        try {
            ...
        } catch(SomeException e) {
            // log and wait
        } finally {
            // cleanup
        }
    }
    // throw after exceeding retries
    throw new RetryFailedException();
}
```

## Propagation
- Do not handle the exception; pass it to the caller.
- If necessary, log and rethrow.
- Blindly throwing exceptions without responsibility is careless unless roles are tightly coupled.

```java
// example 1
public void add() throws SQLException {
    // ...
}

// example 2 
public void add() throws SQLException {
    try {
        // ...
    } catch(SQLException e) {
        // log and rethrow
        throw e;
    }
}
```

## Translation
- Throw a more meaningful exception instead of the original.
- You can also wrap exceptions to simplify handling.
  
```java
// translate to a more meaningful exception
public void add(User user) throws DuplicateUserIdException, SQLException {
    try {
        // ...
    } catch(SQLException e) {
        if(e.getErrorCode() == MysqlErrorNumbers.ER_DUP_ENTRY) {
            throw DuplicateUserIdException();
        }
        else throw e;
    }
}

// wrap to simplify handling
public void someMethod() {
    try {
        // ...
    }
    catch(NamingException ne) {
        throw new EJBException(ne);
        }
    catch(SQLException se) {
        throw new EJBException(se);
        }
    catch(RemoteException re) {
        throw new EJBException(re);
        }
}
```

<br>

# Summary
In Java, exceptions are classified as **checked** (must be handled)
and **unchecked** (extend `RuntimeException` and are not required to be handled explicitly).
