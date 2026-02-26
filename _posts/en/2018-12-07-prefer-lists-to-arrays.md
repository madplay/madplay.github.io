---
layout:   post
title:    "[Effective Java 3rd Edition] Item 28. Prefer Lists to Arrays"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 28. Prefer lists to arrays"
category: Java/Kotlin
comments: true
slug:     prefer-lists-to-arrays
lang:     en
permalink: /en/post/prefer-lists-to-arrays
---

# Arrays vs Generic Types
First, arrays are **covariant**. If `Sub` is a subtype of `Super`, then `Sub[]` is a subtype of `Super[]`.
That is covariant: they vary together.

Generics are **invariant**. `List<Sub>` is neither a subtype nor a supertype of `List<Super>`.

This may look like a generics problem, but the real problem is arrays.
You cannot store a `String` into a `Long` container.
With arrays, the error shows up at runtime, while with lists, the compiler catches it.

```java
Object[] objectArray = new Long[1];
// ArrayStoreException
objectArray[0] = "Kimtaeng";

// compilation error
List<Object> objectList = new ArrayList<Long>();
objectList.add("Kimtaeng");
```

Next, arrays are **reified**, so they know their element type at runtime.
That is why `ArrayStoreException` happens.

Generics use **erasure**. Type information disappears at runtime.
Raw types exist to keep legacy code compatible.

- <a href="/post/dont-use-raw-types" target="_blank">Reference: [Effective Java 3rd Edition] Item 26: Don't use raw types</a> 

Because arrays and generics work differently, they do not mix well.
Arrays cannot be used with generic types, parameterized types, or type parameters:

```java
// arrays cause errors in these cases
new List<E>[]; // generic type
new List<String>[]; // parameterized type
new E[]; // type parameter
```

<br/>

# Why Are Generic Arrays Forbidden?
Type safety is not guaranteed.
If generic arrays were allowed, compiler-generated casts could throw `ClassCastException` at runtime.
That defeats the purpose of generics. Consider this case where line `(1)` is allowed:

```java
List<String>[] stringLists = new List<String>[1]; // (1) 
List<Integer> intList = List.of(42);              // (2)
Object[] objects = stringLists;                   // (3)
objects[0] = intList;                             // (4)
String s = stringLists[0].get(0);                 // (5)
```

- `(2)` creates a `List` with a single element. `List.of` is available since `JDK 9`.
- `(3)` assigns the generic array to an `Object[]`. Arrays are covariant, so this compiles.
- `(4)` stores a `List<Integer>` into the array. With erasure, `List<Integer>` becomes `List` and `List<Integer>[]` becomes `List[]`, so no `ArrayStoreException` occurs.
- The problem is `(5)`. The array claims to hold `List<String>`, but it contains a `List<Integer>`. When you read the element and cast to `String`, the runtime throws `ClassCastException`.

To prevent this, the compiler must reject line `(1)`.

<br/>

# Non-Reifiable Types
Types like `E`, `List<E>`, and `List<String>` are **non-reifiable**.
Because of erasure, they carry less type information at runtime than at compile time.

- <a href="https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html#non-reifiable-types"
rel="nofollow" target="_blank">Reference: Oracle Docs: Non-Reifiable Types</a>

Because of erasure, the only parameterized types that remain reifiable are unbounded wildcard types like `List<?>` and `Map<?,?>`.

<br/>

# If Casting Arrays Fails
If you see generic array creation errors or unchecked cast warnings, replacing arrays with lists often fixes the problem.

```java
public class Chooser {
    private final Object[] choiceArray;
    
    public Chooser(Collection choices) {
        this.choiceArray = choices.toArray();
    }
    
    // callers must cast every time
    // casts can fail at runtime
    public Object choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceArray[rnd.nextInt(choiceArray.length)];
    }
}
```

With generics, it looks like this:

```java
public class Chooser<T> {
    private final T[] choiceArray;

    public Chooser(Collection<T> choices) {
        // error: incompatible types: java.lang.Object[] cannot be converted to T[]
        this.choiceArray = choices.toArray();
    }

    // choose method is the same
}
```

You can fix the compilation error with a cast:

```java
// cast Object[] to T[]
this.choiceArray = (T[]) choices.toArray();
```

The compilation error disappears, but an `Unchecked Cast` warning appears.
Because the type parameter `T` is erased at runtime, the cast cannot be proven safe.
To remove unchecked cast warnings, use a list instead of an array.

```java
class Chooser<T> {
    private final List<T> choiceList;

    public Chooser(Collection<T> choices) {
        this.choiceList = new ArrayList<>(choices);
    }

    public T choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceList.get(rnd.nextInt(choiceList.size()));
    }
}
```

In summary, arrays are covariant and reified, while generics are invariant and erased.
Arrays are safe at runtime but unsafe at compile time. Generics are the opposite.
