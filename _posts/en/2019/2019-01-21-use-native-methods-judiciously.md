---
layout:   post
title:    "[Effective Java 3rd Edition] Item 66. Use Native Methods Judiciously"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 66. Use native methods judiciously"
category: Java/Kotlin
comments: true
slug:     use-native-methods-judiciously
lang:     en
permalink: /en/post/use-native-methods-judiciously
---

# Native Methods

A native method is a method written in a native language such as **C/C++**.
Calling native methods from Java uses JNI (Java Native Interface).

```java
public class HelloJNITest {
    static {
        // load native library (libhello.so on Unix, hello.dll on Windows)
        System.loadLibrary("hello");
    }
    
    // native method declaration; implemented in C/C++
    private native void sayHi();
    
    public static void main(String[] args) {
        // create instance, call native method
        new HelloJNITest().sayHi();
    
    }
}
```

<br/>

# When to Use Native Methods

First, native methods can access **platform-specific features** such as the registry or file locks.
However, the need has decreased as Java evolves. For example, **Java 9** added the Process API, which can access OS processes.
If no Java alternative exists, you may need native libraries.

Second, use native methods when you need to **reuse an existing native library**.

Third, you can use native code for **performance** in a critical path.
But in most cases, native code is not recommended for performance alone.
For example, `java.math.BigInteger` in **JDK 1.1** depended on a C library, but by **JDK 1.3** it was rewritten in pure Java
and, with careful tuning, outperformed the native implementation.

<br/>

# Downsides of Native Methods

They are unsafe. Even Java apps that use native methods can suffer memory corruption.
<a href="/post/make-defensive-copies-when-needed" target="_blank">
(Reference: [Effective Java 3rd Edition] Item 50. Make defensive copies when needed)</a>

Native code is less portable, harder to debug, and can be slower in practice.
The garbage collector cannot manage native memory and cannot even track it.
Crossing the boundary between Java and native code adds overhead.
Writing the bridge code is also tedious and hurts readability.

Unless you must use low-level resources or native libraries, avoid native code.
If you do use it, keep it minimal and test it thoroughly.
