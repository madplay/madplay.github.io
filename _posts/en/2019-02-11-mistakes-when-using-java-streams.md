---
layout:   post
title:    "Java Streams: 5. Common Mistakes"
author:   madplay
tags: 	  java stream
description: Common pitfalls and trade-offs when using the Java Stream API.
category: Java
comments: true
slug:     mistakes-when-using-java-streams
lang:     en
permalink: /en/post/mistakes-when-using-java-streams
---

# Table of Contents
- <a href="/post/introduction-to-java-streams">Java Streams: 1. API Overview and Stream Creation</a>
- <a href="/post/java-streams-intermediate-operations">Java Streams: 2. Intermediate Operations</a>
- <a href="/post/java-streams-terminal-operations">Java Streams: 3. Terminal Operations</a>
- <a href="/post/java-streams-examples">Java Streams: 4. Examples</a>
- Java Streams: 5. Common Mistakes

<br/>

# Are Streams Always Better?
We covered stream creation, intermediate operations, terminal operations, and examples.
Streams often produce shorter and more expressive code, but they are not always the best option.
Depending on the case, they can be slower.

This post summarizes pitfalls and trade-offs when using the Stream API.

<br/>

# Reusing a Stream
A common mistake is to reuse a stream.

```java
// create a stream
Stream<String> langNames = Stream.of("Java", "C++", "Python", "Ruby");

// consume the stream
langNames.forEach(System.out::println);

// reuse the stream... throws an exception
Stream<String> filtered = langNames.filter(lang -> !lang.equals("Java"));
filtered.forEach(System.out::println);
```

This throws `IllegalStateException`:

<div class="post_caption">java.lang.IllegalStateException: stream has already been operated upon or closed</div>

A stream can be consumed only once.

<br/>

# Streams Are Not Always Faster
Replacing every `for` loop with `forEach` is tempting, but it is not always faster.

Consider the following example: find the maximum value in a 100,000-element array.
We compare a `for` loop, a sequential stream, and a parallel stream.

```java
// assume this array is initialized with new Random().nextInt
int[] intArray;

// Case 1: for loop
int maxValue1 = Integer.MIN_VALUE;
for (int i = 0; i < intArray.length; i++) {
    if (intArray[i] > maxValue1) {
        maxValue1 = intArray[i];
    }
}

// Case 2: stream
int maxValue2 = Arrays.stream(intArray)
    .reduce(Integer.MIN_VALUE, Math::max);

// Case 3: parallel stream
int maxValue3 = Arrays.stream(intArray).parallel()
    .reduce(Integer.MIN_VALUE, Math::max);    
```

We measure time with `System.nanoTime()` and convert to milliseconds:

```java
// nanoseconds to milliseconds
TimeUnit.MILLISECONDS.convert((endTime - startTime), TimeUnit.NANOSECONDS)
```

Results often look like this:

```bash
for-loop: 8ms
Stream: 123ms
Parallel Stream: 15ms
```

A simple `for` loop has minimal overhead and uses index-based memory access.
Streams introduce overhead and are harder for the compiler to optimize the same way.

So replacing every loop with a stream can reduce performance.

<br/>

# Readability
This is not a strict rule, but worth considering.
Shorter code is not always more readable if the team is not fluent in streams.

Here is an example of searching a string array.

```java
// array
String[] languages = {"Java", "C", "Python", "Ruby", "C++", "Kotlin"};
        
// for loop
String result = "";
for (String language : languages) {
    if (language.equals("Java")) {
        result = language;
        break;
    }
}
if(result != null && result != "") {
    System.out.println(result);
}

// stream
Arrays.stream(languages)
        .filter(lang -> lang.equals("Java"))
        .findFirst().ifPresent(System.out::println);
```

The stream version is shorter and more declarative, but it assumes familiarity with the API.

<br/>

# Infinite Streams
Creating a stream from a collection is safe, but some generators create infinite streams.
Even with `limit`, you can still hang a pipeline.

```java
Stream.iterate(0, i -> (i + 1) % 2)
        .distinct()
        .limit(10)
        .forEach(System.out::println);
System.out.println("done");
```

Line by line:

- `iterate`: generates 0 and 1 repeatedly.
- `distinct`: keeps only 0 and 1.
- `limit`: tries to limit to 10 elements.
- `forEach`: prints elements.

`distinct` never allows the stream to progress to `limit`, because it keeps waiting for new distinct elements.
So the pipeline never finishes.

Swap the order to fix it:

```java
Stream.iterate(0, i -> (i + 1) % 2)
        .limit(10)
        .distinct()
        .forEach(System.out::println);
System.out.println("done");

// 0
// 1
// done
```

<br/>

# Variable Access
When you use lambdas or method references, you cannot mutate local variables.

```java
int sumForLambda = 0;
for (int i = 0; i < 5; i++) {
    // it works
    sumForLambda += i;
}

int sumForloop = 0;
IntStream.range(0, 5).forEach(i -> {
    // compile error
    sumForloop += i;
}); 
```

You also cannot access variables from intermediate steps in the pipeline.
`peek` is not a way to access earlier lambda variables.

```java
Arrays.stream(array)
        .filter(first -> first % 2 == 0)
        .filter(second -> second > 3)
        .peek(value -> {
            // compile error: cannot access second
            int printValue = value + second;
            System.out.println(printValue);
        })
        .sum();
```

Remember: `peek` runs only when a terminal operation runs.

<br/>

# Execution Order
Streams process elements one by one through the entire pipeline.
This example shows the actual call order:

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .filter(word -> {
            System.out.println("Call filter method: " + word);
            return word.length() > 3;
        })
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.substring(0, 3);
        }).findFirst();
```

Output:

```java
Call filter method: c
Call filter method: python
Call map method: python
```

The pipeline stops after finding the first match. It never processes "java".

<br/>

# Performance Tuning
You can improve performance by rearranging operations.

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.toUpperCase();
        })
        .skip(2)
        .collect(Collectors.toList());

// Call map method: c
// Call map method: python
// Call map method: java
```

Now swap `skip` before `map`:

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .skip(2)
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.toUpperCase();
        })
        .collect(Collectors.toList());

// Call map method: java
```

Be careful when filters are involved. Order changes results.

```java
List<String> list = Arrays.stream(new String[]{"abc", "abcd", "abcde", "abcdef"})
        .filter(word -> word.length() > 3)
        .map(word -> word.toUpperCase())
        .skip(2)
        .collect(Collectors.toList());
        
// ABCDEF 
list.forEach(System.out::println);

List<String> list2 = Arrays.stream(new String[]{"abc", "abcd", "abcde", "abcdef"})
        .skip(2)
        .filter(word -> word.length() > 3)
        .map(word -> word.toUpperCase())
        .collect(Collectors.toList());
        
// ABCDE
// ABCDEF 
list2.forEach(System.out::println);
```

<br/>

# References
- <a href="https://jaxenter.com/java-performance-tutorial-how-fast-are-the-java-8-streams-118830.html" 
rel="nofollow" target="_blank">How fast are the Java 8 streams? - Angelika Langer</a>
- <a href="https://blog.jooq.org/2014/06/13/java-8-friday-10-subtle-mistakes-when-using-the-streams-api/"
rel="nofollow" target="_blank">10 Subtle Mistakes When Using the Streams API</a>
