---
layout:   post
title:    "[Effective Java 3rd Edition] Item 89. For Instance Control, Prefer Enum Types to readResolve"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 89. For instance control, prefer enum types to readResolve"
category: Java
lang: en
slug: for-instance-control-prefer-enum-types-to-readresolve
permalink: /en/for-instance-control-prefer-enum-types-to-readresolve/
date: "2019-10-30 23:52:10"
comments: true
---

# Is It Really a Singleton?
In Item 3, we saw the singleton pattern below. It uses a `public static final` field.
The constructor is declared with `private` access to hide it from outside and is called only once when `INSTANCE` is initialized.

```java
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { }

    ...
}
```

However, this class stops being a singleton the moment it implements `Serializable`. Even if you do not use default
serialization or explicitly provide a `readObject` method, it does not help. No matter which `readObject` method you use,
deserialization returns an instance different from the one created during initialization.

<br>

# readResolve
In this case, the `readResolve` method can replace the instance created by `readObject` with another one.
The instance created by `readObject` then becomes eligible for garbage collection.

- <a href="/post/what-is-readresolve-method-and-writereplace-method" target="_blank">
Reference: Java Serialization: readResolve and writeReplace</a>

```java
private Object readResolve() {
    // Returns the existing instance.
    return INSTANCE;
}
```

Also, because the serialized form of the `Elvis` instance shown here does not need to hold real data, all instance fields
must be declared as `transient`. In other words, if you use `readResolve` for instance control, all fields must be `transient`.

Otherwise, deserialization can expose the deserialized instance. That means the singleton is broken.

<br>

# The Solution Is enum
Using `enum` solves this cleanly. Java guarantees that no object exists other than the declared constants.
An exception is when reflection APIs such as `AccessibleObject.setAccessible` are used.

```java
public enum Elvis {
    INSTANCE;

    ...required data
}
```

Still, there are cases where `readResolve` matters for instance control. When you need to implement a serializable
instance-control class, you may not know which instances exist at compile time.
In that case, representing them as an enum is impossible, so you need to use `readResolve`.
