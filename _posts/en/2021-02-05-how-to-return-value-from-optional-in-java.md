---
layout:   post
title:    "Java Optional: 4. Terminal Optional Methods"
author:   madplay
tags:    java optional
description: How to end Optional chaining and extract values or handle branches conditionally
category: Java
date: "2021-02-05 23:49:11"
comments: true
slug:     how-to-return-value-from-optional-in-java
lang:     en
permalink: /en/post/how-to-return-value-from-optional-in-java
---

# Table of Contents
- <a href="/post/what-is-null-in-java">Java Optional: 1. What is null?</a>
- <a href="/post/introduction-to-optional-in-java">Java Optional: 2. Introduction to Optional</a>
- <a href="/post/how-to-handle-optional-in-java">Java Optional: 3. Intermediate Optional methods</a>
- Java Optional: 4. Terminal Optional methods
- <a href="/post/java-optional-advanced">Java Optional: 5. A closer look at Optional</a>

<br>

# Terminal Optional methods
After chaining intermediate operations for filtering/transformation,
terminal methods let you extract values, branch logic, and complete processing.

### Extract value with get
`get` is the simplest way to extract wrapped value.
But it requires care.
If Optional is empty, `NoSuchElementException` is thrown.

```java
public T get() {
    if (value == null) {
        throw new NoSuchElementException("No value present");
    }
    return value;
}
```

So use `get` only when value presence is guaranteed.

```java
// returns "str"
Optional.ofNullable("str").get();

// throws `NoSuchElementException`
Optional.ofNullable(null).get();
```

## Set default with orElse
`orElse` sets default value for empty Optional.
Method:

```java
public T orElse(T other) {
    return value != null ? value : other;
}
```

If Optional has value, return it.
Otherwise return provided default.

```java
String str = null;

// returns "hi"
Optional.ofNullable(str).orElse("hi");
```

## Set default with orElseGet
Similar to `orElse`, but `orElseGet` takes `Supplier`.

```java
public T orElseGet(Supplier<? extends T> supplier) {
    return value != null ? value : supplier.get();
}
```

```java
String str = null;

// returns "hi"
Optional.ofNullable(str).orElseGet(() -> "hi");
```

> Difference between orElse and orElseGet

`orElseGet` can be seen as lazy version of `orElse`.
`orElseGet` runs only when value is absent.
`orElse` argument is always evaluated whether value exists or not.

```java
User user = new User();

System.out.println("userByOrElse");
User orElse = Optional.ofNullable(user)
    .orElse(makeDefaultUser());

System.out.println("---------------");

System.out.println("userByOrElseGet");
User userByOrElseGet = Optional.ofNullable(user)
    .orElseGet(() -> makeDefaultUser());
```

Output:

```bash
userByOrElse
makeDefaultUser method called!
---------------
userByOrElseGet
```

As shown, `orElse` executes its argument even when Optional has value.
So if argument method contains expensive or side-effect logic, take care.

For example, if it calls APIs or updates databases,
using it in `orElse` can create unintended traffic or data mutation.
Use `orElseGet` in such cases.

## Throw exception with orElseThrow
Unlike `orElse` and `orElseGet` which provide defaults,
`orElseThrow` throws exception when Optional is empty.

```java
public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X {
    if (value != null) {
        return value;
    } else {
        throw exceptionSupplier.get();
    }
}
```

It is similar to `get` (which throws `NoSuchElementException`),
but `orElseThrow` lets you choose exception type.

```java
Optional.ofNullable(user)
    .orElseThrow(IllegalArgumentException::new);

// same as below
Optional.ofNullable(user)
    .orElseThrow(() -> {
        return new IllegalArgumentException();
    });
```

Java 10 added overloaded `orElseThrow()` without arguments.
When no exception supplier is passed, default is `NoSuchElementException`.

```java
public T orElseThrow() {
    if (value == null) {
        throw new NoSuchElementException("No value present");
    }
    return value;
}
```

## Conditional handling with ifPresent and ifPresentOrElse
`ifPresent` runs provided `Consumer` only when value exists.
If empty, it does nothing.

```java
public void ifPresent(Consumer<? super T> action) {
    if (value != null) {
        action.accept(value);
    }
}
```

Usage:

```java
Optional.of("value").ifPresent(v -> {
    System.out.println(v); // runs
});
```

`ifPresentOrElse` was added in Java 9.
Unlike `ifPresent`, it takes one more argument.

```java
public void ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction) {
    if (value != null) {
        action.accept(value);
    } else {
        emptyAction.run();
    }
}
```

First argument is `Consumer` for present value.
Second is `Runnable` for empty case.

```java
Optional.of("value").ifPresentOrElse(v -> {
    System.out.println(v); // runs
}, () -> {
	System.out.println("emitAction!"); // does not run
});

Optional.ofNullable(null).ifPresentOrElse(v -> {
    System.out.println(v); // does not run
}, () -> {
    System.out.println("emitAction!"); // runs
});
```

## Check presence with isPresent and isEmpty
`isPresent` returns `true` when Optional has value, `false` otherwise.

```java
public boolean isPresent() {
    return value != null;
}
```

`isEmpty` was added in Java 11 and does the opposite.

```java
public boolean isEmpty() {
    return value == null;
}
```

<br>

# Am I using it correctly?
So far, we covered Optional creation, filtering/transformation,
and terminal operations for extraction and conditional handling.

Next is usage quality: applying Optional according to its design intent.
The next post covers practical guidance for that.

- <a href="/post/java-optional-advanced">Next: "Java Optional: 5. A closer look at Optional"</a>
