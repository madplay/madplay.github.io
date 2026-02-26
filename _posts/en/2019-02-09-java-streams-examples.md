---
layout:   post
title:    "Java Streams: 4. Examples"
author:   madplay
tags: 	  java stream
description: Practical examples using the Java Stream API.
category: Java/Kotlin
comments: true
slug:     java-streams-examples
lang:     en
permalink: /en/post/java-streams-examples
---

# Table of Contents
- <a href="/post/introduction-to-java-streams">Java Streams: 1. API Overview and Stream Creation</a>
- <a href="/post/java-streams-intermediate-operations">Java Streams: 2. Intermediate Operations</a>
- <a href="/post/java-streams-terminal-operations">Java Streams: 3. Terminal Operations</a>
- Java Streams: 4. Examples
- <a href="/post/mistakes-when-using-java-streams">Java Streams: 5. Common Mistakes</a>

<br/>

# Stream API Examples
This post walks through practical stream examples.
Assume the `Person` class below exists:

```java
class Person {
    private String name;
    private int age;
    private String phoneNumber;

    public Person(String name, int age, String phoneNumber) {
        this.name = name;
        this.age = age;
        this.phoneNumber = phoneNumber;
    }
    
    // getters and setters omitted
}
```

<br/>

# `List<V> to Map<K, V>`
Convert a list of objects into a map keyed by one of their fields.

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("Alice", 23, "010-1234-1234"));
personList.add(new Person("Yuri", 24, "010-2341-2341"));
personList.add(new Person("Chris", 29, "010-3412-3412"));
personList.add(new Person("Mango", 25, null));

// Function.identity is t -> t
Map<String, Person> personMap = personList.stream()
        .collect(Collectors.toMap(Person::getName, Function.identity()));
```

When you first learn streams, the concise form can be hard to read.
Here is the expanded version:

```java
Map<String, Person> personMap = personList.stream()
        .collect(Collectors.toMap(new Function<Person, String>() {
            @Override
            public String apply(Person person) {
                return person.getName();
            }
        }, new Function<Person, Person>() {
            @Override
            public Person apply(Person person) {
                return person;
            }
        }));
```

You can also use `filter` to keep only certain elements.

```java
Map<String, Person> personMap = personList.stream()
        .filter(person -> person.getAge() > 24) // 25+ only
        .collect(Collectors.toMap(Person::getName, Function.identity()));
```

If multiple values map to the same key, `Collectors.toMap` throws `IllegalStateException`.
You can provide a `BinaryOperator` to resolve conflicts.

```java
Map<Integer, Person> personMap = personList.stream()
        .collect(Collectors.toMap(
                o -> o.getAge(),
                Function.identity(),
                (oldValue, newValue) -> newValue)); // keep new value
```

If you want duplicate keys, use `groupingBy` and collect values into a list:

```java
// collect values into a list
Map<Integer, List<Person>> duplicatedMap = personList.stream()
        .collect(Collectors.groupingBy(Person::getAge));
```

<br/>

# Filter out nulls
Use `filter` with `Objects::nonNull` to remove null values.

```java
Stream<String> stream = Stream.of("Alice", "Hoon", null, "Yuri", null);
List<String> filteredList = stream.filter(Objects::nonNull)
        .collect(Collectors.toList());        
```

<br/>

# Find the First Match
Use `filter` with `findFirst`.

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("Alice", 23, "010-1234-1234"));
personList.add(new Person("Yuri", 24, "010-2341-2341"));
personList.add(new Person("Mango", 23, "010-3412-3412"));

// Alice
Person person = personList.stream()
        .filter(p -> p.getAge() == 23)
        .findFirst().get();
```

You can also use `findAny`. In sequential streams, it returns the same element.
In parallel streams, it may return any matching element.

```java
// Alice or Mango
Person person = personList.parallelStream()
        .filter(p -> p.getAge() == 23)
        .findAny().get();
```

<br/>

# Sort a Stream
Sort by age ascending:

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("Alice", 25, "010-1234-1234"));
personList.add(new Person("Yuri", 24, "010-2341-2341"));
personList.add(new Person("Mango", 23, "010-3412-3412"));
personList.add(new Person("Hoon", 26, "010-4123-4123"));

// Mango, Yuri, Alice, Hoon
personList.stream()
        .sorted(Comparator.comparing(Person::getAge))
        .forEach(p -> System.out.println(p.getName()));
```

Reverse the order with `reversed()`.

```java
// Hoon, Alice, Yuri, Mango
personList.stream()
        .sorted(Comparator.comparing(Person::getAge).reversed())
        .forEach(p -> System.out.println(p.getName()));
```

<br/>

# Reduce
Use `reduce` to fold elements into one result.

```java
List<Integer> list = List.of(5, 4, 2, 1, 6, 7, 8, 3);
        
// 36
Integer result = list.stream()
        .reduce(0, (value1, value2) -> value1 + value2);
```

For primitives, use `IntStream` to avoid boxing.

```java
// 36
int intResult = list.stream()
        // or .mapToInt(x -> x).sum();
        .mapToInt(Integer::intValue).sum();
```

You can also apply custom conditions, such as “the longest string longer than Swift.”

```java
List<String> list = List.of("Java", "C++", "Python", "Ruby");

// Python
String result = list.stream()
        .reduce("Swift", (val1, val2) ->
                val1.length() >= val2.length() ? val1 : val2);
```

<br/>

# Flatten a Nested Collection
Use `flatMap` to collapse nested structures.

```java
String[][] names = new String[][]{
        {"Alice", "Chris"}, {"Hoon", "Mango"}
};

// to list
List<String> list = Arrays.stream(names)
        .flatMap(Stream::of)
        .collect(Collectors.toList());
        
// to array
String[] flattedNames = Arrays.stream(names)
        .flatMap(Stream::of).toArray(String[]::new);
```

<br/>

# Next
We covered practical stream examples.
The next post discusses common mistakes when using the Stream API.
 
- <a href="/post/mistakes-when-using-java-streams">Java Streams: 5. Common Mistakes</a>
