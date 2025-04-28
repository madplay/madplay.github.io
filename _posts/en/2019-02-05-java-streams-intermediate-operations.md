---
layout:   post
title:    "Java Streams: 2. Intermediate Operations"
author:   Kimtaeng
tags: 	  java stream
description: What intermediate operations exist in Java streams, and how do you use them?
category: Java
comments: true
slug:     java-streams-intermediate-operations
lang:     en
permalink: /en/post/java-streams-intermediate-operations
---

# Table of Contents
- <a href="/post/introduction-to-java-streams">Java Streams: 1. API Overview and Stream Creation</a>
- Java Streams: 2. Intermediate Operations
- <a href="/post/java-streams-terminal-operations">Java Streams: 3. Terminal Operations</a>
- <a href="/post/java-streams-examples">Java Streams: 4. Examples</a>
- <a href="/post/mistakes-when-using-java-streams">Java Streams: 5. Common Mistakes</a>

<br/>

# Intermediate Operations
Now we move to operations that filter or transform a stream.
Intermediate operations return another stream, so you can chain them.
The stream runs only once, at the end, when you call a terminal operation.

```java
List<String> list = List.of("a", "ab", "abc", "abcd");

List<String> result = list.stream()
        .filter(x -> { // intermediate op 1
            System.out.println(x + " in filter method");
            return x.length() >= 1;
        }).map(x -> { // intermediate op 2
            System.out.println(x + " in map method");
            return x.toUpperCase();
        }).limit(2) // intermediate op 3
        .collect(Collectors.toList()); // terminal op (covered later)

System.out.println(result);
// a in filter method
// a in map method
// ab in filter method
// ab in map method
// [A, AB]
```

Even though four strings match the `filter`, `limit` selects only the first two.
`filter` and `map` run together as one pipeline step.

Let’s look at the common intermediate operations.

<br/>

# filter
Use `filter` to keep only elements that satisfy a predicate.
`Predicate<T>` defines a single `test` method that returns a boolean.

```java
List<String> list = List.of("kim", "taeng");
list.stream().filter(s -> s.length() == 5);
// "taeng"

// without lambda expression
list.stream().filter(new Predicate<String>() {
    @Override
    public boolean test(String s) {
        return s.length() == 5;
    }
});
```

<br/>

# map
Use `map` to transform each element.

```java
List<String> list = List.of("mad", "play");
list.stream().map(s -> s.toLowerCase());
// "MAD", "PLAY"

// without lambda expression
list.stream().map(new Function<String, String>() {
    @Override
    public String apply(String s) {
        return s.toLowerCase();
    }
});
```

<br/>

# mapToInt / mapToLong / mapToDouble
Convert to a primitive stream to avoid boxing overhead.

```java
// IntStream example
List<String> list = List.of("0", "1");
IntStream intStream = list.stream()
        .mapToInt(value -> Integer.parseInt(value));
intStream.forEach(System.out::println);
// prints 0, 1

// without lambda expression
list.stream().mapToInt(new ToIntFunction<String>() {
    @Override
    public int applyAsInt(String value) {
        return Integer.parseInt(value);
    }
});
```

<br/>

# flatMap
`flatMap` flattens nested structures into a single stream.

```java
List<String> list1 = List.of("mad", "play");
List<String> list2 = List.of("kim", "taeng");
List<List<String>> combinedList = List.of(list1, list2);

List<String> streamByList = combinedList.stream()
        .flatMap(list -> list.stream())
        .collect(Collectors.toList());

// mad, play, kim, taeng
System.out.println(streamByList);

// 2D array
String[][] arrs = new String[][]{
        {"mad", "play"}, {"kim", "taeng"}
};

List<String> streamByArr = Arrays.stream(arrs)
        .flatMap(arr -> Arrays.stream(arr))
        .collect(Collectors.toList());
        
// mad, play, kim, taeng
System.out.println(streamByArr);
```

<br/>

# distinct
`distinct` removes duplicates. For primitives, it uses value equality.
For objects, it uses `Object.equals`.

```java
// example class
class Foo {
    private String bar;
    public Foo(String bar) {
        this.bar = bar;
    }
    
    public String toString() {
        return "bar: " + bar;
    }
}

public void someMethod() {
    IntStream stream = Arrays.stream(
            new int[]{1, 2, 2, 3, 3});

    // 1, 2, 3
    stream.distinct()
            .forEach(System.out::println);

    Foo foo1 = new Foo("123");
    Foo foo2 = new Foo("123");
    List<Foo> list = List.of(foo1, foo2, foo1);
    
    // bar: 123
    // bar: 123
    list.stream().distinct()
        .forEach(System.out::println);
}
```

<br/>

# sorted
Use `sorted` to order elements.

```java
// 1, 2, 3
List.of(1, 2, 3).stream()
    .sorted();

// 3, 2, 1
List.of(1, 2, 3).stream()
    .sorted(Comparator.reverseOrder());
```

For primitive streams like `IntStream`, `sorted` does not accept a comparator.
Use `boxed()` to convert to object streams first.

```java
// 2, 1, 0
IntStream.range(0, 3)
        .boxed() // boxing
        .sorted(Comparator.reverseOrder());
```

<br/>

# peek
`peek` performs an action on each element without consuming the stream.
It is useful for debugging pipeline stages.
Note that `peek` runs only if a terminal operation runs.

```java
List<Integer> otherList = new ArrayList<>();
List.of(1, 2, 3).stream()
        .limit(2)
        .peek(i -> {
            // do not use this in production
            otherList.add(i);
        })
        .forEach(System.out::println);

// 1, 2
System.out.println(otherList);

// without forEach, otherList remains empty
```

<br/>

# limit
`limit` caps the number of elements.

```java
List<String> list = List.of("a", "b", "c").stream()
        .limit(2).collect(Collectors.toList());

// a, b
System.out.println(list);
```

<br/>

# skip
`skip` drops the first N elements.

```java
List<String> list = Arrays.stream(new String[]{"a", "b", "c"})
        .skip(2).collect(Collectors.toList());

// c
System.out.println(list);
```

<br/>

# boxed
`boxed` converts a primitive stream into an object stream.

```java
IntStream intStream = IntStream.range(0, 3);

// convert to object stream
Stream<Integer> boxedStream = intStream.boxed();
```

<br/>

# Next
We covered how to transform and filter stream elements.
The next post covers terminal operations.
 
- <a href="/post/java-streams-terminal-operations">Java Streams: 3. Terminal Operations</a>
