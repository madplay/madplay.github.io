---
layout:   post
title:    "[Effective Java 3rd Edition] Item 17. Minimize Mutability"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 17. Minimize mutability"
category: Java
comments: true
slug:     minimize-mutability
lang:     en
permalink: /en/post/minimize-mutability
---

# Immutable Classes
To make a class immutable, instances created from that class must never change their internal state.
In other words, an immutable instance must remain the same until it is destroyed.

Designing immutable classes has many advantages. They are safer and less error-prone.

<br/>

# Rules for Immutable Classes
- Do not provide methods that modify state.
  - For example, avoid setters that mutate fields.
- Prevent subclassing.
  - You must block unintended state changes in subclasses.
- Declare all fields as `final`.
  - This makes the intent explicit.
  - It also helps guarantee safety in multithreaded environments.
- Declare all fields as `private`.
  - Prevents clients from modifying fields directly.
- Do not allow external access to internal mutable components.
  - If the class references mutable objects, clients must not obtain those references.
  - Accessors must not return mutable fields directly.
  - <a href="/post/make-defensive-copies-when-needed" target="_blank">[Effective Java 3rd Edition] Item 50. Make defensive copies when needed</a>

<br/>

# Pros and Cons of Immutable Classes
Consider this immutable class. It is `final` to prevent extension, and all fields are `final`.
 
```java
/**
 * @author madplay
 */
public final class Complex {

    private final double realNumber; // real part
    private final double imaginaryNumber; // imaginary part

    public Complex(double realNumber, double imaginaryNumber) {
        this.realNumber = realNumber;
        this.imaginaryNumber = imaginaryNumber;
    }

    /**
     * addition
     */
    public Complex plus(Complex c) {
        return new Complex(realNumber + c.realNumber, imaginaryNumber + c.imaginaryNumber);
    }
}
```

An immutable object is simple: its state never changes.
It is inherently thread-safe, so no extra synchronization is required.
You can freely share immutable objects, and they can even share internal data.

Take `BigInteger`. It stores sign and magnitude in separate fields.
The `negate` method returns a new instance while sharing the same mutable array for magnitude.

```java
// partial code
public class BigInteger extends Number implements Comparable<BigInteger> {
    final int signum;
    final int[] mag;
    
    // ... omitted
    
    public BigInteger negate() {
        return new BigInteger(this.mag, -this.signum);
    }
}
```

Immutable objects also provide failure atomicity: even after an exception, the object remains unchanged.

**But there are downsides.** Every distinct value requires a new object.
To mitigate that, provide a mutable companion class.
For example, `StringBuilder` is the mutable companion for immutable `String`.

A practical point not covered in the reference text: libraries like `Jackson` often require a no-arg constructor.
The following code throws an exception at runtime.

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;

class TestObj {
    private final String hello;

    public TestObj(String hello) {
        this.hello = hello;
    }

    public String getHello() {
        return hello;
    }
}

public class TestClass {
    public void someMethod() throws IOException {
        String s = "{\"hello\":\"hi\"}";

        // jackson.databind.exc.MismatchedInputException:
        // Cannot construct instance of `TestObj` (although at least one Creator exists):
        // cannot deserialize from Object value ... omitted
        TestObj complex = new ObjectMapper().readValue(s, TestObj.class);
        System.out.println(complex.getHello());
    }

    // main omitted
}
```

<br/>

# Another Way to Build Immutable Classes
You can also build immutable classes with static factory methods instead of constructors.

```java
/**
 * @author Kimtaeng
 */
public class Complex {
    // no final on the class

    private final double realNumber; // real part
    private final double imaginaryNumber; // imaginary part

    // private constructor
    private Complex(double realNumber, double imaginaryNumber) {
        this.realNumber = realNumber;
        this.imaginaryNumber = imaginaryNumber;
    }

    public static Complex valueOf(double re, double im) {
        return new Complex(re, im);
    }

    // ... omitted
}
```

Because the constructor is **private**, the class is **effectively final** to clients.
Other packages cannot extend it.
This static factory approach also enables flexibility with multiple implementations
and supports caching for better performance.

<br/>

# Summary
Having a getter does not mean you must also provide a setter.
Unless you have a clear reason, **make classes immutable**.
The benefits are significant; the main drawback is potential performance cost in some cases.

Even if a class cannot be fully immutable, minimize the mutable parts.
Fewer states make the object easier to reason about and reduce errors.
Unless you have a strong reason not to, keep fields `private final` to preserve immutability.
