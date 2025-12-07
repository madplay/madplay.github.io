---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 12. Serialization"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter12: Serialization"
category: Java
lang: en
slug: effectivejava-chapter12-serialization
permalink: /en/effectivejava-chapter12-serialization/
date: "2019-10-11 00:32:29"
comments: true
---

# Table of Contents
- <a href="#아이템-85-자바-직렬화의-대안을-찾으라">Item 85. Prefer alternatives to Java serialization</a>
- <a href="#아이템-86-serializable을-구현할지는-신중히-결정하라">Item 86. Implement Serializable with great caution</a>
- <a href="#아이템-87-커스텀-직렬화-형태를-고려해보라">Item 87. Consider using a custom serialized form</a>
- <a href="#아이템-88-readobject-메서드는-방어적으로-작성하라">Item 88. Write readObject methods defensively</a>
- <a href="#아이템-89-인스턴스-수를-통제해야-한다면-readresolve보다는-열거-타입을-사용하라">
Item 89. For instance control, prefer enum types to readResolve</a>
- <a href="#아이템-90-직렬화된-인스턴스-대신-직렬화-프록시-사용을-검토하라">
Item 90. Consider serialization proxies instead of serialized instances</a>

<br>

# Item 85. Prefer alternatives to Java serialization
> Prefer alternatives to Java serialization

Serialization is risky because it expands the attack surface.
The best way to avoid that risk is to deserialize nothing.
If you must use it, apply object deserialization filtering.

- <a href="/post/prefer-alternatives-to-java-serialization" target="_blank">
For details: [Effective Java 3rd Edition] Item 85. Prefer alternatives to Java serialization</a>

<div class="post_caption">Choose alternatives such as JSON instead of Java serialization.</div>

<br><br>

# Item 86. Implement Serializable with great caution
> Implement Serializable with great caution

Making a class serializable is simple: implement `Serializable`.
But the tradeoff is significant. The class takes on security and maintenance risk and loses extensibility.

- <a href="/post/implement-serializable-with-great-caution" target="_blank">
For details: [Effective Java 3rd Edition] Item 86. Implement Serializable with great caution</a>

<div class="post_caption">Declaring Serializable is simple, but the cost is real.</div>

<br><br>

# Item 87. Consider using a custom serialized form
> Consider using a custom serialized form

An ideal serialized form should represent only logical state, independent of physical implementation.
If a class implements `Serializable` and uses default serialization,
the serialized form becomes coupled to the current implementation.

- <a href="/post/consider-using-a-custom-serialized-form" target="_blank">
For details: [Effective Java 3rd Edition] Item 87. Consider using a custom serialized form</a>

<div class="post_caption">Design a custom serialized form that correctly describes the object.</div>

<br><br>

# Item 88. Write readObject methods defensively
> Write readObject methods defensively

`readObject` is effectively another `public` constructor.
Treat it with the same rigor as constructors.
Validate arguments and defensively copy mutable parameters.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
For details: [Effective Java 3rd Edition] Item 88. Write readObject methods defensively</a>

<div class="post_caption">Handle readObject methods carefully.</div>

<br><br>

# Item 89. For instance control, prefer enum types to readResolve
> For instance control, prefer enum types to readResolve

A singleton design can break as soon as it implements `Serializable`.
Whether you avoid default serialization or provide `readObject` explicitly,
you may lose instance-count guarantees. Using **enum** preserves invariants safely.

- <a href="/post/for-instance-control-prefer-enum-types-to-readresolve" target="_blank">
For details: [Effective Java 3rd Edition] Item 89. For instance control, prefer enum types to readResolve</a>

<div class="post_caption">Use enum types when controlling instance count to preserve invariants.</div>

<br><br>

# Item 90. Consider serialization proxies instead of serialized instances
> Consider serialization proxies instead of serialized instances

Implementing `Serializable` introduces ways to create instances outside constructors.
That increases bug and security risk. The serialization proxy pattern significantly reduces that risk.

- <a href="/post/consider-serialization-proxies-instead-of-serialized-instances" target="_blank">
For details: [Effective Java 3rd Edition] Item 90. Consider serialization proxies instead of serialized instances</a>

<div class="post_caption">Serialization proxy pattern enables safer invariant-preserving serialization.</div>
