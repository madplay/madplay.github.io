---
layout:   post
title:    "[Effective Java 3rd Edition] Item 76. Strive for Failure Atomicity"
author:   madplay
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 76. Strive for failure atomicity" 
category: Java
lang: en
slug: strive-for-failure-atomicity
permalink: /en/strive-for-failure-atomicity/
comments: true
---

# Failure Atomicity
The property that an object remains in its pre-call state even when a called method fails is called **failure atomicity**.

<br><br>

# How to Make Methods Failure-Atomic
### Design immutable objects.
Because immutable objects never change after creation, existing instances do not fall into unstable states.

<br>

### Validate parameters before executing logic.
Filter out most potential exceptions before changing internal state.

```java
public Object pop() {
    if (size == 0)
        throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // Eliminate obsolete reference
    return result;
}
```

### Place all code that can fail before code that mutates object state.
Use this when validating arguments before execution is difficult. In `TreeMap`, for example, adding an element of the wrong type throws
`ClassCastException` while finding an insertion position, before mutating the tree.

<br>

### Perform work on a temporary copy and replace the original object only after success.
This works well when operating on temporary data structures is faster. `List`'s `sort` method is an example.
It copies elements to an array first, then sorts.

```java
default void sort(Comparator<? super E> c) {
    Object[] a = this.toArray();
    Arrays.sort(a, (Comparator) c);
    ListIterator<E> i = this.listIterator();
    for (Object e : a) {
        i.next();
        i.set((E) e);
    }
}
```

### Write recovery code that intercepts failures and rolls back to the previous state.
This is mostly used in data structures that must guarantee disk-based durability. It is not commonly used.

<br>

# Should You Always Enforce Failure Atomicity?
Even if you catch `ConcurrentModificationException`, you should not assume the object remains usable.
**So this is recommended, but you cannot always guarantee failure atomicity.**

Even when failure atomicity is possible, it is not always worth doing. Cost can be high, or the operation can become too complex.
If you cannot satisfy this rule, document the object's state after failure in the API.

`Error` types are not recoverable, so there is no reason to make `AssertionError` failure-atomic.
