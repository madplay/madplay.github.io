---
layout:   post
title:    "Java Streams: 1. API Overview and Stream Creation"
author:   madplay
tags: 	  java stream
description: What are Java 8 streams? This post introduces the Stream API and ways to create streams.
category: Java/Kotlin
comments: true
slug:     introduction-to-java-streams
lang:     en
permalink: /en/post/introduction-to-java-streams
---

# Table of Contents
- Java Streams: 1. API Overview and Stream Creation
- <a href="/post/java-streams-intermediate-operations">Java Streams: 2. Intermediate Operations</a>
- <a href="/post/java-streams-terminal-operations">Java Streams: 3. Terminal Operations</a>
- <a href="/post/java-streams-examples">Java Streams: 4. Examples</a>
- <a href="/post/mistakes-when-using-java-streams">Java Streams: 5. Common Mistakes</a>

<br/>

# What Is a Stream?
Streams were added in **Java 8**. They pair well with **lambdas** and functional interfaces.
Before streams, you typically iterated arrays or collections and wrote procedural logic inside loops.
Streams and lambdas reduce boilerplate and make the pipeline more explicit.

Streams also enable **parallel processing** without explicit multithreading code.
With loops, you often manage synchronization yourself.

A stream pipeline has three stages:
A **source** that creates the stream, **intermediate operations** that transform it,
and **terminal operations** that produce a result.

<br/>

# Create a Stream from a Collection
Any collection can create a stream via `stream()`.

```java
// List.of is available since Java 9
List<String> list = List.of("mad", "play");
Stream<String> stream = list.stream();
```

<br/>

# Create a Stream from an Array
Use `Arrays.stream` to build a stream from an array.

```java
String[] arr = new String[]{"mad", "play"};
Stream<String> stream = Arrays.stream(arr);

// select only index 0 (closed range)
Stream<String> specificStream = Arrays.stream(arr, 0, 1);

// prints "mad"
specificStream.forEach(System.out::println);
```

<br/>

# Create a Parallel Stream
Call `parallelStream()` instead of `stream()`.
The stream splits into multiple **chunks** and runs across threads.

```java
List<String> list = List.of("mad", "play", "...");
Stream<String> stream = list.parallelStream();
```

<br/>

# Create Primitive Streams
To avoid boxing overhead, use primitive streams:
`IntStream`, `LongStream`, and `DoubleStream`.

```java
// 0, 1, 2
IntStream intStream = IntStream.range(0, 3);

// 0, 1, 2, 3
IntStream closedIntStream = IntStream.rangeClosed(0, 3);

// 0, 1, 2
LongStream longStream = LongStream.range(0, 3);

// 0.0, 0.3
DoubleStream doubleStream = DoubleStream.of(0, 3);
```

You can also create random streams. Because they are infinite, you must limit them.

```java
// random int stream, limit to 3
IntStream intStream = new Random().ints().limit(3);

// random doubles, limit to 3
DoubleStream doubles = new Random().doubles(3);
```

<br/>

# Create a Stream from Files
Use `java.nio.file.Files`. `list` creates a stream of paths,
`lines` creates a stream of lines.

```java
Path path = Paths.get("~");
Stream<Path> list = Files.list(path);

Path filePath = Paths.get("~.txt");
Stream<String> lines = Files.lines(path);
```

<br/>

# BufferedReader.lines()
You can also create a stream of lines from `BufferedReader`.

```java
// try-with-resources
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    Stream<String> stream = br.lines();
    // do something
} catch (Exception e) {
    // exception handling
}
```

<br/>

# Stream from Pattern
```java
Stream<String> stream = Pattern.compile(",")
    .splitAsStream("mad,play");
stream.forEach(System.out::println);
// mad
// play
```

<br/>

# Stream.builder()
`Stream.builder()` creates a stream via a builder. Call `build()` at the end.

```java
// Stream.builder signature
// public static<T> Builder<T> builder() {
//     return new Streams.StreamBuilderImpl<>();
// }

Stream<String> stream = Stream.<String>builder()
    .add("mad").add("play").build();
```

<br/>

# Stream.iterate()
`iterate` takes an initial value and a lambda. It produces an infinite stream,
so use `limit`.

```java
// 0, 1, 2
Stream<Integer> stream = Stream.iterate(0, x -> x + 1).limit(3);
```

<br/>

# Stream.generate()
Unlike `iterate`, `generate` does not use the previous value.
It takes a `Supplier<T>` and returns an infinite stream.

```java
// 1, 1, 1
Stream<Integer> stream = Stream.generate(() -> 1).limit(3);

// three random values
Stream<Double> randomStream = Stream.generate(Math::random).limit(3);
```

<br/>

# Stream.concat()
`Stream.concat` merges two streams into one.

```java
List<String> list1 = List.of("mad", "play");
List<String> list2 = List.of("mad", "life");
Stream<String> stream = Stream.concat(list1.stream(), list2.stream());
// mad, play, mad, life
```

<br/>

# Empty Stream
`Stream.empty()` creates an empty stream, useful for validation paths.

```java
// empty stream
Stream<Object> empty = Stream.empty();
```

<br/>

# Next
We covered the major ways to create streams.
The next post covers **intermediate operations** that transform or filter streams.

- <a href="/post/java-streams-intermediate-operations">Java Streams: 2. Intermediate Operations</a>
