---
layout:   post
title:    "[Effective Java 3rd Edition] Item 86. Implement Serializable with Great Caution"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 86. Implement Serializable with great caution"
category: Java
lang: en
slug: implement-serializable-with-great-caution
permalink: /en/implement-serializable-with-great-caution/
date: "2019-11-02 22:13:54"
comments: true
---

# Serializable Classes
If a class declares `Serializable`, the class becomes serializable.
Unlike this simple declaration, the implementation cost is high.
From that moment, the class takes on multiple risks and loses extensibility.
Let's review the issues.

<br>

# It Becomes Hard to Change After Release
When you implement `Serializable`, the serialized form becomes part of your public API.
That serialized form depends on the internal implementation at the time of release.
Even private and package-private instance fields become part of the exposed contract, which breaks encapsulation.

If you modify internal implementation, serialized form changes.
If you serialize an old-version instance and deserialize with a new version,
errors can occur.

Another factor is `SerialVersionUID`.
Every serializable class gets a unique identifier.
If not explicitly declared, the runtime generates it.

SUID generation considers class name, declared interfaces, and more.
If you modify class structure later, SUID changes as well.
Relying on auto-generated values breaks compatibility easily.

- <a href="/post/java-serialization-advanced" target="_blank">
Reference: "Java serialization: what is SerialVersionUID?"</a>

<br>

# It Is Vulnerable to Bugs and Security Issues
In Java, objects are normally created through constructors.
Serialization bypasses this language-level creation mechanism.
Deserialization is a hidden constructor that carries constructor-like risks.
It can break invariants and expose unauthorized access paths.

<br>

# New Releases Require More Tests
When a serializable class changes, you need compatibility tests.
You should test serializing with the new version and deserializing with the old version,
and vice versa.

<br>

# Do Not Decide Lightly
If a class must implement `Serializable`, evaluate benefits and costs each time you design it.
For example, value classes like `BigInteger` and `Instant`, and collection classes, implement `Serializable`.
Classes that represent behavior, such as thread pools, usually do not.

<br>

# When Not to Implement Serializable
Classes designed for inheritance and most interfaces should not implement `Serializable`.
Otherwise you push the same risks onto subclasses and implementers.

However, if you must use a framework that supports only serializable classes,
you may have no alternative.
`Throwable` is a representative case: it implements `Serializable` so servers can send exceptions to clients through RMI.

If you create classes that support both serialization and inheritance,
prevent subclasses from overriding `finalize`.
Override it in your class and mark it `final`.
If invariants can break when instance fields are initialized to defaults,
add a method like below.

```java
private void readObjectNoData() throws InvalidObjectException {
    throw new InvalidObjectException("Stream data is required.");
}
```

<br>

# Inner Classes Should Not Implement Serialization
The default serialized form is not clear.
Inner classes require fields to store references to enclosing instances and captured local variables.
Compilers add these fields automatically.
As with naming rules for anonymous and local classes, Java spec does not define stable details for these synthetic fields.
Static member classes are an exception.
