---
layout:   post
title:    "[Effective Java 3rd Edition] Item 26. Don't Use Raw Types"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 26. Don't use raw types"
category: Java
comments: true
slug:     dont-use-raw-types
lang:     en
permalink: /en/post/dont-use-raw-types
---

# What Is a Raw Type?
A **raw type** is a generic type used without any type parameters.
When a class or interface declaration includes type parameters, it is a generic class or interface.
For example, `List<E>`. The term **generic type** refers to both generic classes and generic interfaces.

<br/>

# What Happens If You Use Raw Types?
Before Java 1.5 introduced generics, collections were written like this:

```java
private final Collection stamps = ...;
stamps.add(new Coin(...));
// unchecked call warning, but it still compiles and runs.
```

Because this code compiles, it can fail at runtime.
For example, when you pull a `Coin` and try to assign it to a `Stamp`, you get a `ClassCastException`.

<br/>

# What Changes After Generics?
With generics, the code becomes:

```java
private final Collection<Stamp> stamps = ...;
stamps.add(new Coin()); // compilation error
```

The compiler catches the error immediately. So why do raw types still exist?
They remain for backward compatibility with pre-generics code.

<br/>

# Raw Types Are Not Recommended
A raw `List` is discouraged, but `List<Object>` is acceptable because it explicitly tells the compiler that all types are allowed.
So what is the difference between `List` and `List<Object>`?

`List` is unrelated to generics. `List<Object>` means the list accepts all types.
That means you can pass a `List<String>` to a method that takes `List`, but you cannot pass it to a method that takes `List<Object>` because of generic subtyping rules.

`List<String>` is a subtype of the raw type `List`, but it is not a subtype of `List<Object>`.
So using a raw type loses type safety compared to using a parameterized type like `List<Object>`.

<br/>

<div class="post_caption">Is it really unsafe?</div>

<br/>

Let’s check with an example.

```java
public static void main(String[] args) {
    List<String> strings = new ArrayList<>();
    
    unsafeAdd(strings, Integer.valueOf(42));
    String s = strings.get(0);
}

// raw type
private static void unsafeAdd(List list, Object o) {
    list.add(o);
}
```

This compiles, but because it uses the raw `List`, the compiler emits an **unchecked call warning**.
At runtime, `strings.get(0)` triggers a `ClassCastException` because an `Integer` is being cast to `String`.

What if we change it to `List<Object>`?

```java
public static void main(String[] args) {
    List<String> strings = new ArrayList<>();

    unsafeAdd(strings, Integer.valueOf(42));
    String s = strings.get(0);
}

// List<Object>
private static void unsafeAdd(List<Object> list, Object o) {
    list.add(o);
}
```

Now the compiler fails with `incompatible types: List<String> cannot be converted to List<Object>`.
That is safer because you learn about the problem at compile time rather than at runtime.

<br/>

# What If You Don’t Know the Element Type?
Use an unbounded wildcard type. The unbounded wildcard type for `Set<E>` is `Set<?>`.
It works when you want a generic type but do not care about the actual type parameter.

So what is the difference between `Set<?>` and the raw type `Set`?
Compare the following examples.

```java
public class TypeTest {
    private static void addtoObjList(final List<Object> list, final Object o) {
        list.add(o);
    }

    private static void addToWildList(final List<?> list, final Object o) {
        // only null is allowed
        list.add(o);
    }

    private static <T> void addToGenericList(final List<T> list, final T o) {
        list.add(o);
    }


    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        String s = "kimtaeng";

        // any type is okay, but the method fails
        addToWildList(list, s);

        // List<Object>, so incompatible types
        addtoObjList(list, s);
        
        // okay
        addToGenericList(list, s);
    }
}
```

```java
public class TypeTest2 {
    public static void main(String[] args) {
        List raw = new ArrayList<String>(); // okay
        List<?> wildcard = new ArrayList<String>(); // okay
        List<Object> generic = new ArrayList<String>(); // compilation error
            
        raw.add("Hello"); // okay, but raw types allow anything
        wildcard.add("Hello"); // compilation error
        wildcard.size(); // okay, no dependency on type parameters
        wildcard.clear(); // okay, no dependency on type parameters
    }
}
```

In short, raw types are unsafe, while wildcard types are safe.
A raw collection accepts any element, so it easily violates the type invariant.
`Collection<?>`, however, accepts only `null`, and the compiler rejects any operation that depends on the type parameter.

<br/>

# There Are Still Exceptions
**Class literals** must use raw types. `List.class`, `String[].class`, and `int.class` are legal, but `List<String>.class` and `List<?>.class` are not.

The `instanceof` operator is another exception. **At runtime**, generic type information is erased, so `instanceof` cannot apply to parameterized types except for unbounded wildcard types.
Raw types and unbounded wildcard types behave the same for `instanceof`.

```java
// Check whether o is a Set, then cast to a wildcard type.
// Note: cast to Set<?> rather than the raw Set.
if( o instanceof Set) {
    Set<?> s = (Set<?>) o;
}
```

**In summary**, avoid raw types whenever possible. They remain only for backward compatibility.
That said, **class literals** and the `instanceof` operator require raw types.
