---
layout:   post
title:    "Java Optional: 3. Intermediate Optional Methods"
author:   madplay
tags:    java optional
description: How to filter or transform values in Optional objects
category: Java/Kotlin
date: "2021-02-05 20:49:50"
comments: true
slug:     how-to-handle-optional-in-java
lang:     en
permalink: /en/post/how-to-handle-optional-in-java
---

# Table of Contents
- <a href="/post/what-is-null-in-java">Java Optional: 1. What is null?</a>
- <a href="/post/introduction-to-optional-in-java">Java Optional: 2. Introduction to Optional</a>
- Java Optional: 3. Intermediate Optional methods
- <a href="/post/how-to-return-value-from-optional-in-java">Java Optional: 4. Terminal Optional methods</a>
- <a href="/post/java-optional-advanced">Java Optional: 5. A closer look at Optional</a>

<br>

# Intermediate Optional methods
You can filter or transform values in an `Optional` using several methods.
Like `Stream`, `Optional` supports chaining of intermediate operations,
then final retrieval through terminal methods.

## Filter with filter
`filter` keeps only Optionals matching a condition.
It takes `Predicate<T>` and is implemented as follows.

```java
public Optional<T> filter(Predicate<? super T> predicate) {
    Objects.requireNonNull(predicate);
    if (!isPresent()) {
        return this;
    } else {
        return predicate.test(value) ? this : empty();
    }
}
```

You can keep only matching Optionals like below.
If no match exists, it returns empty Optional.

```java
public Optional<Person> filterName(Person person) {
	// when `name` field equals "Kimtaeng"
    return Optional.ofNullable(person)
        .filter(p -> p.getName().equals("Kimtaeng"));
}
```

## Transform with map
`map` converts Optional values into another form.
Method shape:

```java
public <U> Optional<U> map(Function<? super T, ? extends U> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()) {
        return empty();
    } else {
        return Optional.ofNullable(mapper.apply(value));
    }
}
```

If Optional has value, `map` applies the converter function.
If empty, no conversion runs.

```java
// convert to String type
public Optional<String> extractName(Person person) {
    return Optional.ofNullable(person)
        .map(p -> p.getName());

    // can be replaced with
	// return Optional.ofNullable(person)
	//      .map(Person::getName);
}
```

## Flatten with flatMap
`flatMap` removes one level of nested Optional and returns a single layer.

```java
public <U> Optional<U> flatMap(Function<? super T, ? extends Optional<? extends U>> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()) {
        return empty();
    } else {
        @SuppressWarnings("unchecked")
        Optional<U> r = (Optional<U>) mapper.apply(value);
        return Objects.requireNonNull(r);
    }
}
```

Difference from `map` can be unclear. Let's use an example.

Assume a `Person` class.
Unlike earlier examples, its `Phone` field is wrapped with `Optional`.
Because depending on person object, phone may be absent.

```java
class Person {
	private Optional<Phone> phone;
	
	// getter, setter omitted
}
```

If you want phone info from `Person`, `map` seems fine, but not here.

```java
public Optional<Phone> testMap(Person person) {
	// compile error because type becomes Optional<Optional<Phone>>
	return Optional.ofNullable(person)
	    .map(Person::getPhone);
}
```

`getPhone` already returns Optional-wrapped object.
This is where `flatMap` is needed.

```java
public Optional<Phone> testFlatMap(Person person) {
    return Optional.ofNullable(person)
        .flatMap(Person::getPhone);
}
```

## Convert to stream
`Optional` has `stream` method as well.
Added in Java 9, it converts Optional to Stream.

```java
public Stream<T> stream() {
    if (!isPresent()) {
        return Stream.empty();
    } else {
        return Stream.of(value);
    }
}
```
Let's see usage.
Example converts values to Optional via Stream `map`.
When empty Optional is returned, that chain path does not propagate value.

`List.of` used here was added in Java 9.
It returns unmodifiable list, so be careful not to mutate it elsewhere.

```java
public void testOptionalWithStream() {
    // factory method added in Java 9
    // returns unmodifiable list
    List.of(4, 3, 2, 5)
        .stream()
        .map(value -> value > 2 ? Optional.of(value) : Optional.empty())
        .flatMap(Optional::stream)
        .forEach(System.out::println);
}
```

To understand flow in detail, expand lambda/method references and print intermediate values.

```java
public void testOptionalWithStream() {
    List.of(4, 3, 2, 5)
        .stream()
        .map(value -> {
            return value > 2 ? Optional.of(value) : Optional.empty();
        })
        .peek(v -> {
            // print incoming values
            System.out.println("peek: " + v);
        })
        .flatMap(new Function<Optional<? extends Object>, Stream<?>>() {
            @Override
            public Stream<?> apply(Optional<?> o) {
                System.out.println("flatMap: " + o);
                return o.stream();
            }
        })
        .forEach(v -> {
            System.out.println("forEach: " + v);
        });
}
```

In `map`, values > 2 remain, smaller values become `Optional.empty()`.
`peek` prints each step.

Then `flatMap` returns `Optional.stream()`.
If argument is `Optional.empty()`, `stream` returns `Stream.empty()` internally.
That branch effectively ends.

Finally, terminal `forEach` prints output.
Result:

```bash
peek: Optional[4]
flatMap: Optional[4]
forEach: 4
peek: Optional[3]
flatMap: Optional[3]
forEach: 3
peek: Optional.empty
flatMap: Optional.empty
peek: Optional[5]
flatMap: Optional[5]
forEach: 5
```

## Provide alternative Optional with or
`or` was added in Java 9.
If value exists, it returns the same Optional.
If empty, it uses supplier to produce alternative Optional.

```java
public Optional<T> or(Supplier<? extends Optional<? extends T>> supplier) {
    Objects.requireNonNull(supplier);
    if (isPresent()) {
        return this;
    } else {
        @SuppressWarnings("unchecked")
        Optional<T> r = (Optional<T>) supplier.get();
        return Objects.requireNonNull(r);
    }
}
```

Example below fails `filter`, so empty Optional flows forward.
Then `or` replaces it with supplier-produced Optional.

```java
Optional.ofNullable("Hi")
    .filter(value -> value.length() > 3) // filtered out -> empty Optional
    .or(() -> Optional.of("Hello")) // no value -> replace with Optional[Hello]
```

<br>

# How do we extract values?
This post covered intermediate Optional operations for filtering and transformation.
Next post covers terminal operations that end chaining and extract/handle results conditionally.

- <a href="/post/how-to-return-value-from-optional-in-java">Next: "Java Optional: 4. Terminal Optional methods"</a>
