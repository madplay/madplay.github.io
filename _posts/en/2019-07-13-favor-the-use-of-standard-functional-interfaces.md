---
layout:   post
title:    "[Effective Java 3rd Edition] Item 44. Favor the Use of Standard Functional Interfaces"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 44. Favor the use of standard functional interfaces"
category: Java
date: "2019-07-13 23:51:29"
comments: true
slug:     favor-the-use-of-standard-functional-interfaces
lang:     en
permalink: /en/post/favor-the-use-of-standard-functional-interfaces
---

# With lambdas in Java

The template method pattern loses much of its appeal. The modern alternative uses static factories or constructors that accept function objects. That means you create more constructors and methods that take functional parameters. In this setup, choose functional parameter types carefully.

Consider `LinkedHashMap`. You can override `removeEldestEntry` and use it as a cache.

```java
public class CacheExample {
    public static void main(String[] args) {
        // You cannot omit generic types with <> in an anonymous class.
        LinkedHashMap<String, Integer> map = new LinkedHashMap<String, Integer>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > 3;
            }
        };

        map.put("a", 1); map.put("b", 2);
        map.put("c", 3); map.put("d", 4);

        // Output is {b=2, c=3, d=4}
        System.out.println(map);
    }
}
```

It works. But when you implement this with lambdas, you typically expose a static factory or constructor that takes a function object. The overridden `removeEldestEntry` method calls `size`, which is an instance method. A factory or constructor does not have an instance of `Map`, so you must pass the map itself into the function object.

That interface looks like this:

```java
@FunctionInterface interface EldestEntryRemovalFunction<K, V> {
    boolean remove(Map<K,V> map, Map.Entry<K, V> eldest);
}
```

A lambda expression works only for interfaces with a single abstract method. In this context, **an interface with exactly one abstract method is a functional interface.**

<br/>

# Standard functional interfaces

When a standard interface fits your use case, prefer it over a custom interface. It reduces maintenance and provides useful default methods. `java.util.function` already provides equivalent interfaces—43 in total. The six basic ones are:

Interface | Function signature | Meaning | Example
|:--|:--|:--|:--
```UnaryOperator<T>``` | ```T apply(T t)``` | Function with one argument and return value of the same type | ```String::toLowerCase```
```BinaryOperator<T>``` | ```T apply(T t1, T t2)``` | Function with two arguments and return value of the same type | ```BigInteger::add```
```Predicate<T>``` | ```boolean test(T t)``` | Function that takes one argument and returns boolean | ```Collection::isEmpty```
```Function<T,R>``` | ```R apply(T t)``` | Function with different argument and return types | ```Arrays::asList```
```Supplier<T>``` | ```T get()``` | Function that returns a value with no arguments | ```Instant::now```
```Consumer<T>``` | ```void accept(T t)``` | Function that takes one argument and returns no value | ```System.out::println```

Even with standard interfaces, there are pitfalls. Most standard functional interfaces support only primitive types. Do not use boxed primitives for performance-sensitive work. It still runs but can become slow due to boxing. If no standard interface fits, define your own.

<br/>

# When should you define your own?

The `Comparator<T>` interface is structurally identical to `ToIntBiFunction<T,U>`. Both take two arguments and return an `int`.

```java
// Comparator
@FunctionInterface
public interface Comparator<T> {
    int compare(T o1, T o2);
}

// ToIntBiFunction
@FunctionalInterface
public interface ToIntBiFunction<T, U> {
    int applyAsInt(T t, U u);
}
```

Even though `Comparator` appears first, it still does not use the standard `ToIntBiFunction`. Here is why. First, the name is precise and describes a common use case in APIs. Second, it defines a clear contract that implementations must follow. Third, it includes useful default methods. If you have one or more of these reasons, consider writing a custom functional interface.

<br/>

# @FunctionalInterface

This annotation tells readers that the interface is designed for lambdas. It also enforces the rule of a single abstract method. The compiler rejects interfaces that violate it, which prevents accidental method additions. Always use `@FunctionalInterface` for custom functional interfaces.

<br/>

## Caution when using functional interfaces

Do not overload methods that accept different functional interfaces at the same parameter position. It creates ambiguity for clients and causes errors.

```java
public interface ExecutorService extends Executor {
    // Overloaded with Callable<T> and Runnable parameters.
    // Every call to submit requires a cast.
    <T> Future<T> submit(Callback<T> task);
    Future<?> submit(Runnable task);
}
```
