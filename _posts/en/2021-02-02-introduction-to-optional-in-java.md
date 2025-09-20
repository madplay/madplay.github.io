---
layout:   post
title:    "Java Optional: 2. Introduction to Optional"
author:   Kimtaeng
tags:    java optional
description: What is the Optional class added in Java 8?
category: Java
date: "2021-02-02 22:51:54"
comments: true
slug:     introduction-to-optional-in-java
lang:     en
permalink: /en/post/introduction-to-optional-in-java
---

# Table of Contents
- <a href="/post/what-is-null-in-java">Java Optional: 1. What is null?</a>
- Java Optional: 2. Introduction to Optional
- <a href="/post/how-to-handle-optional-in-java">Java Optional: 3. Intermediate Optional methods</a>
- <a href="/post/how-to-return-value-from-optional-in-java">Java Optional: 4. Terminal Optional methods</a>
- <a href="/post/java-optional-advanced">Java Optional: 5. A closer look at Optional</a>

<br>

# Problems caused by null
In the previous post, we reviewed characteristics of `null` and issues caused by wrong `null` references in Java.
In short, wrong runtime `null` references can cause `NullPointerException`,
and check logic added to avoid that can make code complex.

- <a href="/post/what-is-null-in-java">Previous post: "Java Optional: 1. What is null?"</a>

Attempts to improve `null` handling existed before Optional.
In Java 7 **Project Coin**, the elvis operator for safe call was proposed, but not adopted.

> Elvis operator usually means `?:`. Rotated 90 degrees, it resembles Elvis Presley.

The proposal likely failed because adoption cost outweighed benefit,
but if adopted, we might have avoided `null` issues in Java like this:

```java
// Could code like this have been possible?
public String getPhoneManufacturerName(Person person) {
    // if any part of chaining is null, return "Samsung"
    return person?.getPhone()?.getManufacturer()?.getName() : "Samsung";
}
```

Then what is the `Optional` class introduced for better `null` handling?

<br>

# Optional class
`java.util.Optional<T>` was influenced by functional languages such as Scala and Haskell.
Likely from Scala `Optional` and Haskell `Maybe`.
In Java, the purpose of `Optional` is to represent absence of return value.
The class API note states this intent explicitly:

> Optional is primarily intended for use as a method return type where there is a clear need to represent "no result,"
> and where using null is likely to cause errors. A variable whose type is Optional should never itself be null; it should always point to an Optional instance. <br>
> 
> Optional is mainly for method return types where representing "no result" is clear and using null is likely to cause errors.
> A variable of Optional type must never be null itself; it should always reference an Optional instance.

In simple terms, `Optional` is like bubble wrap for fragile glass.
Like glass, `null` can cause severe failures if mishandled.
Optional provides a safer wrapper.

Now let's look at how to use `Optional`.

<br>

# Declaring Optional objects
As the specification shows, `Optional` is generic.
So you specify a type parameter at declaration.
That is, define the type wrapped by `Optional`.

```java
Optional<Person> person; // Optional variable of Person type
Optional<Phone> phone; // Optional variable of Phone type
```

<br>

# Creating Optional objects
Static factory methods are provided for creating `Optional` objects.

## Optional.empty()
Creates an empty `Optional`.
Internally, it returns a singleton instance held by `Optional`.
It is similar to `null` in meaning "empty", but unlike `null`, `Optional.empty()` does not throw `NullPointerException` when referenced.

```java
// declared as static member in Optional class
private static final Optional<?> EMPTY = new Optional<>();

public static<T> Optional<T> empty() {
    Optional<T> t = (Optional<T>) EMPTY;
    return t;
}
```

## Optional.of(T value)
Creates an `Optional` wrapping a non-null value.
If value is `null`, it throws `NullPointerException`.

```java
public static <T> Optional<T> of(T value) {
    return new Optional<>(value);
}
```

## Optional.ofNullable(T value)
Creates an `Optional` that can handle `null` values.
If value is `null`, it returns an empty `Optional`.
Use this when input may be null.

```java
public static <T> Optional<T> ofNullable(T value) {
    return value == null ? empty() : of(value);
}
```

<br>

# We created it, now how do we use it?
This post introduced `Optional` and creation patterns.
The next post covers how to filter values or transform them into other forms.

- <a href="/post/how-to-handle-optional-in-java">Next: "Java Optional: 3. Intermediate Optional methods"</a>
