---
layout:   post
title:    The Difference Between map and flatMap in Java
author:   Kimtaeng
tags: 	  java java8 map flatmap
description: What is the difference between map and flatMap in Java 8?
category: Java
comments: true
slug:     difference-between-map-and-flatmap-methods-in-java
lang:     en
permalink: /en/post/difference-between-map-and-flatmap-methods-in-java
---

# Before You Start
This post explains the **difference between `map` and `flatMap`** based on Java Streams. You may need some familiarity with Java 8 Streams. If Streams are new to you, check this post first.

- <a href="/post/introduction-to-java-streams" target="_blank">Reference: Java Streams: 1. Introduction and Stream Creation</a>

<br/>

# Look at map
The `map` method transforms each element in a stream into a desired shape. Here is an example: from a list of `Person` objects, collect only the `name` field into a `Set`.

```java
// imports omitted

class Person {
    private String name;
    private Integer age;

    // constructor, getter, setter omitted
}

public class MapMethodTest {
    public static void main(String[] args) {
        List<Person> personList = Arrays.asList(new Person("Kimtaeng", 30),
                new Person("Madplay", 29));

        Set<String> names = personList.stream()
                .map(Person::getName)
                .collect(Collectors.toSet());

        // Print Kimtaeng, Madplay
        names.forEach(System.out::println);
    }
}
```

The code uses Streams together with **Lambda Expressions** and **Method References**. If you apply them step by step, the code becomes simpler.

```java
// Create list
List<Person> personList = Arrays.asList(new Person("Kimtaeng", 30),
        new Person("Madplay", 29));

// Initial form
personList.stream().map(new Function<Person, String>() {
    @Override
    public String apply(Person person) {
        return person.getName();
    }
}).collect(Collectors.toSet());

// Apply lambda
personList.stream().map(person -> person.getName())
    .collect(Collectors.toSet());
    
// Apply method reference
personList.stream().map(Person::getName)
    .collect(Collectors.toSet());
```

<br/>

# Look at flatMap
The `flatMap` method flattens a stream of arrays into a single-element stream. Here is an example that prints strings longer than 3 from a 2D array.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"},
        {"kim", "mad"}, {"taeng", "play"}};
        
Set<String> namesWithFlatMap = Arrays.stream(namesArray)
        .flatMap(innerArray -> Arrays.stream(innerArray))
        .filter(name -> name.length() > 3)
        .collect(Collectors.toSet());
        
// Print play, taeng
namesWithFlatMap.forEach(System.out::println);
```

Because `flatMap` returns a single-element stream, you can chain `filter` directly. It is very useful when the stream is backed by an array.

<br/>

# Compare map vs flatMap
Let’s compare the two methods in more detail. First, here is the same `flatMap` example again.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"},
        {"kim", "mad"}, {"taeng", "play"}};

Set<String> namesWithFlatMap = Arrays.stream(namesArray)
        .flatMap(innerArray -> Arrays.stream(innerArray))
        .filter(name -> name.length() > 3)
        .collect(Collectors.toSet());
```

Now, write it without `flatMap`. You can still handle a stream of arrays, but the code is more complex.

```java
// 2D array declaration omitted
Set<String> namesWithMap = Arrays.stream(namesArray)
        .map(innerArray -> Arrays.stream(innerArray)
                .filter(name -> name.length() > 3)
                .collect(Collectors.toSet()))
        .collect(HashSet::new, Set::addAll, Set::addAll);
```

The `collect` usage might look unfamiliar. Its method signature is:

```java
<R> R collect(Supplier<R> supplier,
              BiConsumer<R, ? super T> accumulator,
              BiConsumer<R, R> combiner);
```

`supplier` creates the result container (a `HashSet` here). The second argument, `accumulator`, merges elements into the result. The last argument, `combiner`, merges partial results.

If you define a **custom Collector**, you use `Collector.of`, where `combiner` is a `BinaryOperator`. You can write it like this:

```java
// The data structure used here is a Set.
// Duplicates are not allowed.
// With a Map, choose whether to keep oldValue or newValue.
Set<String> namesWithMap = Arrays.stream(namesArray)
    .map(names -> Arrays.stream(names)
            .filter(name -> name.length() > 3)
            .collect(Collectors.toSet()))
    .collect(Collector.of(HashSet::new, Set::addAll, (oldValue, newValue) -> oldValue));
```

<br/>

# Compare with Another Example
Here is another example that prints a specific value from a 2D string array.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"}};

// flatMap
Arrays.stream(namesArray)
        .flatMap(inner -> Arrays.stream(inner))
        .filter(name -> name.equals("taeng"))
        .forEach(System.out::println);

// map
Arrays.stream(namesArray)
        .map(inner -> Arrays.stream(inner))
        .forEach(names -> names.filter(name -> name.equals("taeng"))
            .forEach(System.out::println));
```

When you compare only the printing logic, the difference is clearer. `flatMap` returns a stream, so you can chain `forEach` and print all elements immediately.

With `map`, each element is itself a stream, so you iterate with `forEach` and then chain another `forEach` inside it. The output is the same, but the flow is different.

Finally, here is the simplest comparison: print every element in a 2D array.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"}};

// flatMap
Arrays.stream(namesArray)
    .flatMap(inner -> Arrays.stream(inner))
    .forEach(System.out::println);

// map
Arrays.stream(namesArray)
    .map(inner -> Arrays.stream(inner))
    .forEach(names -> names.forEach(System.out::println));
```

<br/>

# Closing
So far, I covered **map** and **flatMap** in Java 8. I explained them using `Stream`, but `Optional` also provides map and flatMap with the same role.

```java
// Stream
<R> Stream<R> map(Function<? super T, ? extends R> mapper);
<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper);

// Optional
public<U> Optional<U> map(Function<? super T, ? extends U> mapper)
public<U> Optional<U> flatMap(Function<? super T, Optional<U>> mapper)
```

In short, `map` returns a stream of streams, while `flatMap` returns a stream of elements. If the stream is backed by arrays or if you want to flatten nested streams, `flatMap` is the right tool.
