---
layout:   post
title:    "[Effective Java 3rd Edition] Item 62. Avoid Strings Where Other Types Are More Appropriate"
author:   madplay
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 62. Avoid strings where other types are more appropriate"
category: Java
date: "2019-08-21 00:32:45"
comments: true
slug:     avoid-strings-where-other-types-are-more-appropriate
lang:     en
permalink: /en/post/avoid-strings-where-other-types-are-more-appropriate
---

# Misusing strings
Strings are designed for text, but they are often used for unintended purposes.

<br/><br/>

# Cases where strings are the wrong choice
## Strings are poor substitutes for other value types.
If the data is numeric, use `int` or `float`. If it is a yes/no value, use `enum` or `boolean`. Use strings only when the data is truly textual. If no suitable type exists, define one.

<br/>

## Strings are poor substitutes for enums.
When you enumerate constants, `enum` is far better than strings.

<br/>

## Strings are poor substitutes for aggregate types.
Strings are also a poor choice for aggregate data.

```java
String compoundKey = className + "#" + i.next();
```

If `className` contains the delimiter (`#`), parsing fails. It is slow, awkward, and error-prone. It also forces you to rely on `String`-specific operations. In this case, a `private` static member class is a better design.

<br/>

## Strings are poor substitutes for capabilities.
You sometimes represent capabilities with strings. Here is an example that uses a string key:

```java
public class ThreadLocal {
    private ThreadLocal() { } // No instance

    // Store the current thread's value by key.
    public static void set(String key, Object value);

    // Return the current thread's value for the key.
    public static Object get(String key);
}
```

The problem is that the string key lives in a global namespace. Each client must provide a unique key, or unrelated code will overwrite the same value.

Instead of a string, define a dedicated type.

```java
public class ThreadLocal {
    private ThreadLocal() { } // No instance

    public static class Key { // Capability
        Key() { }
    }

    public static Key getKey() {
        return new Key();
    }

    public static void set(Key key, Object value);
    public static Object get(Key key);
}
```

This fixes the string-key problem but can be improved further. `set` and `get` should be instance methods on `Key`, which makes `Key` the thread-local variable itself. Rename the class to `ThreadLocal`.

```java
public final class ThreadLocal {
    public ThreadLocal();
    public void set(OBject value);
    public Object get();
}
```

Finally, **make it type-safe by using generics** because `Object` requires casting.

```java
public final class ThreadLocal<T> {
    public ThreadLocal();
    public void set(T value);
    public T get();
}
```

This ends up looking like `java.lang.ThreadLocal`. The core idea is the same: replace string-based APIs with dedicated types.
