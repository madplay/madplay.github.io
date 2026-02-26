---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 5. Generics"
author:   madplay
tags: 	  java effectivejava
description: "Effective Java 3rd Edition Chapter 5: Generics"
category: Java/Kotlin
date: "2019-05-28 01:33:05"
comments: true
slug:     effectivejava-chapter5-generics
lang:     en
permalink: /en/post/effectivejava-chapter5-generics
---

# Table of Contents
- <a href="#item-26-dont-use-raw-types">Item 26. Don't use raw types</a>
- <a href="#item-27-eliminate-unchecked-warnings">Item 27. Eliminate unchecked warnings</a>
- <a href="#item-28-prefer-lists-to-arrays">Item 28. Prefer lists to arrays</a>
- <a href="#item-29-favor-generic-types">Item 29. Favor generic types</a>
- <a href="#item-30-favor-generic-methods">Item 30. Favor generic methods</a>
- <a href="#item-31-use-bounded-wildcards-to-increase-api-flexibility">Item 31. Use bounded wildcards to increase API flexibility</a>
- <a href="#item-32-combine-generics-and-varargs-judiciously">Item 32. Combine generics and varargs judiciously</a>
- <a href="#item-33-consider-typesafe-heterogeneous-containers">Item 33. Consider typesafe heterogeneous containers</a>

<br>

# Item 26. Don't use raw types
> Don’t use raw types

A raw type is a generic type that omits type parameters. It exists for backward compatibility with pre-generics code and increases runtime failure risk.

- <a href="/post/dont-use-raw-types" target="_blank">
For details: [Effective Java 3rd Edition] Item 26. Don't use raw types</a>

<div class="post_caption">Avoid raw types. They exist only for backward compatibility.</div>

<br><br>

# Item 27. Eliminate unchecked warnings
> Eliminate unchecked warnings

Removing unchecked warnings prevents runtime cast failures such as `ClassCastException` and improves correctness.

If you cannot eliminate a warning and the code is type-safe, apply `@SuppressWarnings("unchecked")` to silence it. Apply it to the narrowest possible scope, from a local variable declaration to a class. Also leave a **comment that explains why the warning is safe to ignore.**

<div class="post_caption">Remove every unchecked warning you can.</div>

<br><br>

# Item 28. Prefer lists to arrays
> Prefer lists to arrays

## Arrays vs Generics

**Arrays are covariant.** If `Sub` is a subtype of `Super`, then `Sub[]` is a subtype of `Super[]`. **Generics are invariant.** For two different types, `List<Type1>` is neither a subtype nor a supertype of `List<Type2>`.

```java
Object[] objectArray = new Long[1];
objectArray[0] = "Can this be inserted?"; // Compiles, but fails at runtime.

List<Object> objectList = new ArrayList<Long>();
objectList.add("Cannot insert due to different type"); // Does not compile.
```

Arrays fail at runtime; lists fail at compile time. That makes lists safer. Also, **arrays are reifiable.** They know and check their element type at runtime. **Generics use erasure.** Type information exists only at compile time to preserve compatibility with legacy code.

Arrays and generics do not mix well. The following declarations are compile-time errors.

```java
new List<E>[]; // Array of a generic type
new List<String>[]; // Parameterized type
new E[]; // Type parameter
```

## Why can't you create generic arrays?

They are not type safe. If generic arrays were allowed, the following could happen:

```java
// This fails at (1), but assume it compiles.
List<String>[] stringLists = new List<String>[1];   // (1) Assume generic arrays are allowed.
List<Integer> intList = List.of(42);                // (2) List.of: Java 9 syntax
Object[] objects = stringLists;                     // (3)
objects[0] = intList;                               // (4)
String s = stringLists[0].get(0);                   // (5)
```

- (2) creates a list with one element.
- (3) assigns (1) to an `Object[]`. Arrays are covariant, so this is allowed.
- (4) stores the instance from (2) into the first element.
  - Due to erasure, `List<Integer>` becomes `List` and `List<Integer>[]` becomes `List[]` at runtime.
- (5) is the problem. The array contains a `List<Integer>`, but the code expects `List<String>`.
  - Casting the first element to `String` throws `ClassCastException`.

This is why the compiler rejects generic arrays. Types like `E`, `List<E>`, and `List<String>` are **non-reifiable types** because erasure removes their runtime type information.

<div class="post_caption">Prefer lists to arrays to catch errors at compile time.</div>

<br><br>

# Item 29. Favor generic types
> Favor generic types

Generic types are safer and more convenient than types that require explicit casts by the client. When you design a new type, make it generic so clients can use it without casts. If an existing type should have been generic, convert it.

- <a href="/post/java-generic" target="_blank">Related: Java Generics</a>

Here is the conversion process. **(1) Add a type parameter to the class declaration.** Then **(2) replace ordinary types with the type parameter.** Finally, resolve the unchecked warnings that appear.

```java
// Stack implemented with Object
public class Stack { // (1) Change to Stack<E>
    private Object[] elements; // (2) Change to E[] elements
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        // (2) Change to (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(Object e) { // (2) Change to push(E e)
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() { // (2) Change to E pop()
        if (size ==0) {
            throw new EmptyStackException();
        }

        // (2) Change to E result = elements[--size];
        Object result = elements[--size];
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

This example appears to contradict Item 28, but using lists inside generic types is not always possible or optimal. For example, `HashMap` uses arrays for performance.

Generic types do not accept primitive types, but you can use boxed types. Some generic types also constrain their type parameters.

```java
// java.util.concurrent.DelayQueue
class DelayQueue<E extends Delayed> implements BlockingQueue<E>
```

Here, `<E extends Delayed>` restricts the type parameter to subtypes of `Delayed`. That allows the client to call `Delayed` methods without casts. This is a **bounded type parameter**.

<div class="post_caption">Generic types are safer and more convenient than explicit casts.</div>

<br><br>

# Item 30. Favor generic methods
> Favor generic methods

Methods can be generic. The type parameter list here is `<E>` and the return type is `Set<E>`.

```java
// Generic method
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

## Generic singleton factory
Because erasure removes type information at runtime, a single object can be parameterized with different types. A generic singleton factory provides that object for a requested type parameter. `Collections.reverseOrder` and `Collections.emptySet` are standard examples.

## Recursive type bound
A recursive type bound uses a type parameter whose bound refers to itself. It often appears with `Comparable` to impose an ordering.

```java
// Recursive type bound expresses mutual comparability
public static <E extends Comparable<E>> E max(Collection<E> c);
```

`<E extends Comparable<E>>` reads as, "Every type E can be compared to itself."

<div class="post_caption">Generic methods are safer and easier to use than methods that require explicit casts.</div>

<br><br>

# Item 31. Use bounded wildcards to increase API flexibility
> Use bounded wildcards to increase API flexibility

Parameterized types are invariant. Java provides bounded wildcards to increase type flexibility.

- <a href="/post/use-bounded-wildcards-to-increase-api-flexibility" target="_blank">
For details: [Effective Java 3rd Edition] Item 31. Use bounded wildcards to increase API flexibility</a>

<div class="post_caption">Wildcard types add complexity but make APIs far more flexible.</div>

<br><br>

# Item 32. Combine generics and varargs judiciously
> Combine generics and varargs judiciously

Calling a varargs method creates an array to hold the arguments. What happens when you combine generics and varargs? Item 28 says you cannot create generic arrays, so check this example.

```java
import java.util.ArrayList;
import java.util.List;

public class Example {
    static void dangerous(List<String>... stringLists) {
        List<Integer> intList = List.of(42);
        Object[] objects = stringLists;
        objects[0] = intList; // Heap pollution
        String s = stringLists[0].get(0); // ClassCastException
    }

    public static void main(String[] args) {
        List<String> stringList = new ArrayList<>();
        stringList.add("Hi there");
        dangerous(stringList);
    }
}
```

This compiles but fails at runtime because the compiler inserts hidden casts. Storing values in a generic varargs array breaks type safety.

Still, generic and parameterized varargs methods are useful, so Java allows them. Examples include `Arrays.list(T... a)` and `EnumSet.of(E first, E... set)`.

```java
// Arrays.Java
@SafeVarargs
@SuppressWarnings("varargs")
public static <T> List<T> asList(T... a) {
    return new ArrayList<>(a);
}

// EnumSet.java
@SafeVarargs
public static <E extends Enum<E>> EnumSet<E> of(E first, E... rest) {
    EnumSet<E> result = noneOf(first.getDeclaringClass());
    result.add(first);
    for (E e : rest)
        result.add(e);
    return result;
}
```

## How do you know a method is safe?
Since Java 7, `@SafeVarargs` hides warnings about generic varargs usage. You should apply it only to methods that cannot be overridden. In Java 8 it is limited to static and final instance methods, and Java 9 allows private instance methods.

`@SafeVarargs` signals that the method is type-safe. A method is safe when it never writes into the varargs array and never exposes the array reference outside. In other words, the array only transports arguments.

<div class="post_caption">Varargs and generics are a risky mix.</div>

<br><br>

# Item 33. Consider typesafe heterogeneous containers
> Consider typesafe heterogeneous containers

Generics apply to collections like `Set<E>` and `Map<K, V>` and to single-element containers like `ThreadLocal<T>`. The parameterization targets the container itself, not the elements, so each container supports only a limited set of types.
> If you read "container" as "class," this becomes easier.

When you need full flexibility, parameterize the key instead, and supply that key when you put and get values. This design is the **typesafe heterogeneous container pattern.** The class literals used to pass compile-time and runtime type information are **type tokens.**

```java
public class Favorites {
    // With nested generics, any class literal works.
    private Map<Class<?>, Object> favorites = new HashMap<>();

    public <T> void putFavorite(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }

    public static void main(String[] args) {
        Favorites f = new Favorites();
        f.putFavorite(String.class, "Java");
        f.putFavorite(Class.class, Favorites.class);

        String favoriteString = f.getFavorite(String.class);
        Class<?> favoriteClass = f.getFavorite(Class.class);

        // Output: Java Favorites
        System.out.printf("%s %s%n", favoriteString, favoriteClass.getName());
    }
}
```

`Favorites` is type-safe. It does not return an `Integer` when you request a `String`. It still has weaknesses. A bad insert can still break safety.

```java
f.putFavorite((Class)Integer.class, "This is not integer !!!");
Integer notInteger = f.getFavorite(Integer.class); // ClassCastException
```

Non-reifiable types cannot be stored. You can store `String` or `String[]`, but not `List<String>`. A workaround uses a super type token. Spring provides this pattern as a class.

```java
List<String> pets = Arrays.asList("Puppy", "Kitten");
f.putFavorite(new TypeRef<List<String>>(){}, pets);
List<String> list = f.getFavorite(new TypeRef<List<String>>(){});
```

<div class="post_caption">Type-parameterize the key, not the container, to build a typesafe heterogeneous container.</div>
