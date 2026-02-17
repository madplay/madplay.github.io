---
layout:   post
title:    "[Effective Java 3rd Edition] Item 85. Prefer Alternatives to Java Serialization"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 85. Prefer alternatives to Java serialization"
category: Java/Kotlin
lang: en
slug: prefer-alternatives-to-java-serialization
permalink: /en/prefer-alternatives-to-java-serialization/
date: "2019-10-12 01:21:59"
comments: true
---

# Java Serialization Is Risky
To start with the conclusion: serialization is risky.
The best way to avoid serialization risk is to deserialize nothing.

<br><br>

# Why Is It Risky?
Serialization is risky because its attack surface is too broad, and it keeps growing.
Deserialization of object graphs happens when calling `readObject` on `ObjectInputStream`.

During deserialization of a byte stream, `readObject` can run all code in the involved types.
That means the entire code path of those types enters the potential attack surface.

Methods invoked during deserialization that can perform dangerous behavior are called **gadgets**.
One gadget, or a gadget chain, can execute arbitrary code.
So you should deserialize only carefully produced byte streams.

<br><br>

# Deserialization Bomb
A short stream that takes excessive time to deserialize is called a deserialization bomb.
Let's test a deserialization bomb using `HashSet` and strings.

```java
static byte[] bomb() {
    Set<Object> root = new HashSet<>();
    Set<Object> s1 = root;
    Set<Object> s2 = new HashSet<>();

    for (int i=0; i < 100; i++) {
        Set<Object> t1 = new HashSet<>();
        Set<Object> t2 = new HashSet<>();

        t1.add("foo"); // Make t1 different from t2.
        s1.add(t1); s1.add(t2);

        s2.add(t1); s2.add(t2);
        s1 = t1; s2 = t2;
    }
    return serialize(root);
}
```

The instance reference shape before calling `serialize` looks like this.
The depth reaches 100. To deserialize this, `hashCode` must be called more than $${ 2 }^{ 100 }$$ times.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-10-12-prefer-alternatives-to-java-serialization-1.png"
width="400" alt="serialization bomb"/>

<br><br>

# Cross-Platform Structured Data Representation
Use cross-platform structured data formats instead of Java serialization, such as JSON and Protocol Buffers.
Protocol Buffers use a binary format and are more efficient, while JSON is text-based and human-readable.

<br><br>

# If You Cannot Replace Serialization
If a legacy system forces Java serialization, **deserialize only trusted data**.

If you cannot avoid serialization and cannot guarantee deserialized data safety,
use **object deserialization filtering**.
It was added in Java 9 and backported for older versions.
You can run filters before deserialization to allow or reject specific classes.

- <a href="/post/why-java-serialization-is-bad#역직렬화-필터링" target="_blank">
Reference: "Java serialization: concerns and cautions when using it"</a>

Serialization has many risk factors. Even with extra effort, migrating to JSON or similar alternatives is recommended.
