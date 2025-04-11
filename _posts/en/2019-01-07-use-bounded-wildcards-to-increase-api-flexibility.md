---
layout:   post
title:    "[Effective Java 3rd Edition] Item 31. Use Bounded Wildcards to Increase API Flexibility"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 31. Use bounded wildcards to increase API flexibility"
category: Java
comments: true
slug:     use-bounded-wildcards-to-increase-api-flexibility
lang:     en
permalink: /en/post/use-bounded-wildcards-to-increase-api-flexibility
---

# Generics Are Invariant
As discussed in
<a href="/post/prefer-lists-to-arrays" target="_blank">[Effective Java 3rd Edition] Item 28. Prefer lists to arrays</a>,
parameterized types are invariant. For types `Type1` and `Type2`, `List<Type1>` is neither a subtype nor a supertype of `List<Type2>`.

To expand: `List<Object>` can hold any object, but `List<String>` can hold only strings.
`List<String>` cannot serve as a drop-in replacement for `List<Object>`, so it is not a subtype.

If you are new to generics, start here:

- <a href="/post/java-generic" target="_blank">Link: Java Generics</a>

<br/>

# Producers and Wildcards
Assume the `Stack` public API includes a method that pushes all elements from a parameter.

```java
// add all elements from src to the stack
public void pushAll(Iterable<E> src) {
    for (E e : src) {
        push(e);
    }
}
```

This compiles, but if you pass an `Iterable<Integer>` into a `Stack<Number>`, the compiler fails.
`Integer` is a subtype of `Number`, yet the error says `Iterable<Integer> cannot be converted to Iterable<Number>`.

```java
import java.util.Arrays;

/**
 * Source code from Item 29
 */
class Stack<E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    // ... omitted

    // add all elements from src to the stack
    public void pushAll(Iterable<E> src) {
        for (E e : src) {
            push(e);
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Iterable<Integer> integers = Arrays.asList(
                Integer.valueOf(1), Integer.valueOf(2));

        // incompatible types...
        numberStack.pushAll(integers);
    }
}
```

Because parameterized types are invariant, there is no subtype relationship here.
To fix this, use a **bounded wildcard**.
Since `Integer` extends `Number`, declare the parameter like this:

```java
// class Integer extends Number ...
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
```

This means the parameter is not an `Iterable<E>`, but an `Iterable` of a subtype of `E`.
Now the method accepts `Integer`, `Long`, `Double`, and any other subtype of `Number`.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-01-07-use-bounded-wildcards-to-increase-api-flexibility-1.png"
width="600" height="300" alt="producer with wildcard"/>

The custom `Stack` can add elements only via `push(E)`, so type safety holds.
However, the `elements` array is an `Object[]`, not an `E[]`, because generics are erased at runtime.

<br/>

# Consumers and Wildcards
Now write a `popAll` method that moves all stack elements into a collection parameter.

```java
import java.util.Arrays;
import java.util.Collection;
import java.util.EmptyStackException;

// Effective Java Item 29 source
class Stack<E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public E pop() {
        if (size == 0)
            throw new EmptyStackException();

        // safe cast because push accepts only E
        @SuppressWarnings("unchecked") E result =
                (E) elements[--size];

        elements[size] = null; // eliminate obsolete reference
        return result;
    }

    // add all elements from src to the stack
    public void pushAll(Iterable<? extends E> src) {
        for (E e : src) {
            push(e);
        }
    }

    // move all elements into the destination collection
    public void popAll(Collection<E> dst) {
        while(!isEmpty()) {
            dst.add(pop());
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Collection<Object> objects = Arrays.asList(new Object());

        // incompatible types...
        numberStack.popAll(objects);
    }
}
```

The same error appears. The element types differ, and invariance blocks the assignment.
To fix it, declare the parameter as a **supertype** of `E`.

```java
// the collection must accept E or its supertypes
public void popAll(Collection<? super E> dst) {
    while(!isEmpty()) {
        dst.add(pop());
    }
}
```

Because any type is a supertype of itself, `Collection<? super Number>` accepts `Collection<Number>` and `Collection<Object>`.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-01-07-use-bounded-wildcards-to-increase-api-flexibility-2.png"
width="600" height="300" alt="consumer with wildcard"/>

<br/>

# PECS
> Producer-Extends-Consumer-Super = PECS
As shown in the examples, use the right wildcard to improve flexibility.
If you forget which one to use, remember **PECS**.

When a parameter **produces**, use `<? extends T>`.
When it **consumes**, use `<? super T>`.

<div class="post_caption">If the producer/consumer idea is still fuzzy...</div>

In `pushAll`, the parameter `src` produces elements for the stack, so it is a **producer**.
That is why the parameter uses `extends`.

```java
// class Integer extends Number ...
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
```

In `popAll`, the parameter `dst` consumes elements from the stack, so it is a **consumer**.
That is why the parameter uses `super`.

```java
// the collection must accept E or its supertypes
public void popAll(Collection<? super E> dst) {
    while(!isEmpty()) {
        dst.add(pop());
    }
}
```

<br/>

# Advanced
Do **not** use wildcards in return types. That forces callers to deal with wildcards as well.

For example, a `union` method that merges two sets uses `extends` because both parameters are producers.
The return type is a concrete `Set<E>`, so callers do not deal with wildcards.

```java
public class Union {
    public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) {
        Set<E> result = new HashSet<>(s1);
        result.addAll(s2);
        return result;
    }

    public static void main(String[] args) {
        // Set.of is supported in Java 9+
        Set<Double> doubleSet = Set.of(1.0, 2.1);
        Set<Integer> integerSet = Set.of(1, 2);
        Set<Number> unionSet = union(doubleSet, integerSet);
    }
}
```

This code compiles on **Java 9**.
If you use Java 8 or earlier, the compiler cannot infer the type and you must provide the type argument explicitly.

```java
public class Union {
    public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) {
        Set<E> result = new HashSet<>(s1);
        result.addAll(s2);
        return result;
    }

    public static void main(String[] args) {
        // compiled with Java 7
        Set<Double> doubleSet = new HashSet<>(Arrays.asList(1.0, 2.1));
        Set<Integer> integerSet = new HashSet<>(Arrays.asList(1, 2));
        Set<Number> unionSet = Union.<Number>union(doubleSet, integerSet);
    }
}
```

Now look at a method that uses a **recursive type bound**:

```java
class RecursiveTypeBound {
    public static <E extends Comparable<E>> E max(Collection<E> collection) {
        if (collection.isEmpty()) {
            // Exception Handling
        }

        E result = null;
        for (E e : collection) {
            if (result == null || e.compareTo(result) > 0) {
                result = Objects.requireNonNull(e);
            }
        }
        return result;
    }
}

class Item28Test {
    public static void main(String[] args) {
        List<Integer> integerList = Arrays.asList(1, 3, 2);
        System.out.println(RecursiveTypeBound.max(integerList));
    }
}
```

Apply PECS here as well. The parameter produces `E`, so it becomes `Collection<? extends E>`.
`Comparable` consumes `E`, so it becomes `Comparable<? super E>`.
That gives:

```java
// before
public static <E extends Comparable<E>> E max(Collection<E> collection)

// after (PECS applied twice)
public static <E extends Comparable<? super E>> E max(Collection<? extends E> collection)
```

This form supports types that extend a class implementing `Comparable`, not only those that implement it directly.

For example, look at `ScheduledFuture` (Java 5+). It extends `Delayed`, which extends `Comparable<Delayed>`.
But `ScheduledFuture` does not extend `Comparable<ScheduledFuture>`.

```java
// ScheduledFuture interface
public interface ScheduledFuture<V> extends Delayed, Future<V> {
    // ...
}

// Delayed interface
public interface Delayed extends Comparable<Delayed> {
    // ...
}

// Comparable interface
public interface Comparable<T> {
    // ...
}
```

Without PECS, the original `max` rejects this case:

```java
class RecursiveTypeBound {
    public static <E extends Comparable<E>> E max(Collection<E> collection) {
        // ...
    }
}

class Item28Test {
    public static void main(String[] args) {
        List<ScheduledFuture<?>> scheduledFutureList = ...

        // incompatible types...
        RecursiveTypeBound.max(scheduledFutureList);
    }
}
```

Finally, here is a comparison between type parameters and wildcards:

```java
class swapTest {
    // Option 1) unbounded type parameter
    public static <E> void typeArgSwap(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }

    // Option 2) unbounded wildcard
    public static void wildcardSwap(List<?> list, int i, int j) {
        wildcardSwapHelper(list, i, j);
    }

    // Option 2-1) a wildcard list accepts only null
    // same signature (name and parameters) as option 1
    private static <E> void wildcardSwapHelper(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }
}
```

For public APIs, option 2 is convenient because callers do not specify type parameters.
However, `List<?>` accepts only `null`, so you need a helper method to capture the type.

- <a href="/post/dont-use-raw-types#%EC%9B%90%EC%86%8C%EC%9D%98-%ED%83%80%EC%9E%85%EC%9D%84-%EB%AA%A8%EB%A5%B8%EC%B1%84-%EC%93%B0%EA%B3%A0-%EC%8B%B6%EB%8B%A4%EB%A9%B4" target="_blank">Link: [Effective Java 3rd Edition] Item 26. Don't use raw types</a>

The helper method captures the list’s element type, so it can write values safely.
It adds an extra method, but it gives clients a **type-agnostic API**.
