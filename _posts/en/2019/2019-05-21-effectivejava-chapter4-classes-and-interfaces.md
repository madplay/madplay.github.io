---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 4. Classes and Interfaces"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter4: Classes and Interfaces"  
category: Java/Kotlin
date: "2019-05-21 02:12:22"
comments: true
slug:     effectivejava-chapter4-classes-and-interfaces
lang:     en
permalink: /en/post/effectivejava-chapter4-classes-and-interfaces
---

# Table of Contents
- <a href="#item-15-minimize-the-accessibility-of-classes-and-members">Item 15. Minimize the accessibility of classes and members</a>
- <a href="#item-16-in-public-classes-use-accessor-methods-not-public-fields">Item 16. In public classes, use accessor methods, not public fields</a>
- <a href="#item-17-minimize-mutability">Item 17. Minimize mutability</a>
- <a href="#item-18-favor-composition-over-inheritance">Item 18. Favor composition over inheritance</a>
- <a href="#item-19-design-and-document-for-inheritance-or-else-prohibit-it">Item 19. Design and document for inheritance or else prohibit it</a>
- <a href="#item-20-prefer-interfaces-to-abstract-classes">Item 20. Prefer interfaces to abstract classes</a>
- <a href="#item-21-design-interfaces-for-posterity">Item 21. Design interfaces for posterity</a>
- <a href="#item-22-use-interfaces-only-to-define-types">Item 22. Use interfaces only to define types</a>
- <a href="#item-23-prefer-class-hierarchies-to-tagged-classes">Item 23. Prefer class hierarchies to tagged classes</a>
- <a href="#item-24-favor-static-member-classes-over-nonstatic">Item 24. Favor static member classes over nonstatic</a>
- <a href="#item-25-limit-source-files-to-a-single-top-level-class">Item 25. Limit source files to a single top-level class</a>

<br>

# Item 15. Minimize the accessibility of classes and members
> Minimize the accessibility of classes and members

A key to good component design is to narrow the accessibility of classes and members as much as possible. Always apply the lowest access level.

- <a href="/post/minimize-the-accessibility-of-classes-and-members" target="_blank">Details:
[Effective Java 3rd Edition] Item 15. Minimize the accessibility of classes and members</a>

<div class="post_caption">Keep program element accessibility as small as possible.</div>

<br><br>

# Item 16. In public classes, use accessor methods, not public fields
> In public classes, use accessor methods, not public fields

A class like this has no encapsulation benefits because clients can access fields directly.

```java
class Point {
    public double x;
    public double y;
}
```

If a public class exposes public fields, clients may depend on them and you cannot change them freely. For example, `Point` and `Dimension` in `java.awt` expose public fields.

Instead, make fields private and add public accessors.

```java
class Point {
    private double x;
    private double y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() { return x; }
    public double getY() { return y; }

    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }
}
```

If the class is package-private or a private nested class, public fields are acceptable. In such cases, field access can be simpler than getters because it is used internally only.

```java
public class Example {
    private static class InnerNested {
        public String memberField;
    }

    public void somePrint() {
        InnerNested instance = new InnerNested();
        System.out.println(instance.memberField);
    }
}
```

<div class="post_caption">Never expose mutable fields in public classes.</div>  

<br><br>

# Item 17. Minimize mutability
> Minimize mutability

An immutable class is a class whose instances cannot be modified. Once created, its state never changes. Immutable classes are easier to design, implement, and use, and they are safer because they reduce errors.

## Rules for creating immutable classes
- Do not provide mutator methods that change the state.
- Prevent extension.
- A common approach is to declare the class `final`.
- Declare all fields `final` to make your intent clear.
- Declare all fields `private` to prevent direct access to mutable objects.
- Do not allow external access to internal mutable components.

Declaring the class `final` prevents inheritance, but another flexible approach is to make all constructors `private` or package-private and provide public static factories. Below is an immutable class using static factories instead of constructors.

```java
public class Complex {
    private final double re;
    private final double im;

    // Constructor is private.
    private Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    // Static factory method
    public static Complex valueOf(double re, double im) {
        return new Complex(re, im);
    }
	// Other members omitted
}
```

## Characteristics of immutable classes
Instances are inherently **thread-safe and can be shared without synchronization.** Reuse instances whenever possible. Immutable objects also provide **failure atomicity**.

> What is failure atomicity?<br/>
> After a method throws an exception, the object remains in the same valid state as before the method call.

```java
public class BigInteger extends Number implements Comparable<BigInteger> {
    final int signum;
    final int[] mag;
    ...
    public BigInteger negate() {
        return new BigInteger(this.mag, -this.signum);
    }
    ...
}
```

**Immutable classes have drawbacks.** If the value changes, you must create a new object. For example, changing one bit in a million-bit `BigInteger` requires a new instance. Building complex objects can also create many intermediate objects that are discarded, which impacts performance.

A common workaround is to provide a mutable companion class for multi-step operations. **Companion classes** for `String` are `StringBuilder` and `StringBuffer`.

## Summary
- Make classes immutable unless you have a good reason not to.
- If a class cannot be immutable, minimize the mutable parts.
- Unless there is a strong reason, declare all fields `private final`.
- Constructors must create fully initialized objects with all invariants established.
- Unless there is a compelling reason, do not expose any public initialization methods beyond constructors and static factories.

<div class="post_caption">Design classes to be immutable unless you truly need mutability.</div>

<br><br>

# Item 18. Favor composition over inheritance
> Favor composition over inheritance

Inheritance can easily lead to errors. It is a powerful reuse mechanism, but it is not always the best choice.

Here, inheritance means implementation inheritance where one class extends another. It does not refer to interface inheritance where a class implements an interface or an interface extends another interface.

- <a href="/post/favor-composition-over-inheritance" target="_blank">Details:
[Effective Java 3rd Edition] Item 18. Favor composition over inheritance</a>

<div class="post_caption">Use inheritance only when the relationship is a true is-a.</div>

<br><br>

# Item 19. Design and document for inheritance or else prohibit it
> Design and document for inheritance or else prohibit it

## Documentation
Classes designed for inheritance must document how they use overridable methods (self-use). Document every situation where an overridable method is called. Here, **overridable** means any public or protected method that is not final.

## What to watch for when designing for inheritance
- Think carefully about which protected methods or fields to expose.
- From a maintenance perspective, keep protected members minimal, but a class with none offers no value for inheritance.
- The best way to test an inheritance-focused class is to write subclasses. Missing protected hooks become obvious.
- If a protected member remains unused until you create several subclasses, it likely should have been private.
- Constructors must not call overridable methods, directly or indirectly.
- Superclass constructors run before subclass constructors, so an overridden method can run before subclass state is initialized.
- It is safe to call private, final, or static methods from constructors because they cannot be overridden.

## How to prohibit inheritance
Designing for inheritance is hard and restrictive. If a class is not designed for inheritance, prohibit it. You can declare the class `final`, or make all constructors private or package-private and provide public static factories.

<div class="post_caption">Designing for inheritance is hard. You must document all self-use and follow that documentation.</div>

<br><br>

# Item 20. Prefer interfaces to abstract classes
> Prefer interfaces to abstract classes

Java offers two mechanisms for multiple implementation inheritance: abstract classes and interfaces. Since Java 8, interfaces can include default methods. Both mechanisms can now provide instance method implementations, which makes extension more flexible. With default methods, implementing classes do not have to override every method.

```java
public interface SomeThings {
    void walk();
    void sleep();
    default void eat() {
        System.out.println("I am eating the food");
    }
}
```

## Differences between abstract classes and interfaces
The key difference is that a class implementing an abstract class must be a subclass of that abstract class. Because Java only supports single inheritance, extending an abstract class can make it hard to define new types. In contrast, any class that correctly implements an interface is treated as that type regardless of its existing superclass.

Interfaces are more flexible. It is difficult to retrofit an abstract class onto an existing class. If two classes must extend the same abstract class, that abstract class must be a common ancestor in the hierarchy. With an interface, you only need to implement the required methods.

- <a href="/post/abstract-classes-and-methods-in-java" target="_blank">
Details: Abstract classes and abstract methods in Java</a>

## Interfaces are a good fit for mixins
A mixin adds optional functionality to a target type.

```java
package java.io;

public class File implements Serializable, Comparable<File> {
    ...
}
```

Here, `File` implementing `Comparable` means `File` instances are orderable. Abstract classes are difficult to apply to existing classes, and in class hierarchies that cannot have multiple parents, there is no good place to attach a mixin.

## Interfaces enable non-hierarchical type frameworks
```java
public interface Singer { // singer
    AudioClip sing(Song s);
}

public interface Songwriter { // songwriter
    Song compose(int chartPosition);
}

// Then, a singer-songwriter who sings and writes songs
public interface SingerSongWriter extends Singer, Songwriter {
    AudioClip strum();
    void actSensitive();
}
```

## Interfaces + skeletal implementations
You can provide both an interface and an abstract skeletal implementation to get the best of both. The interface defines the type and default methods, and the skeletal class implements the rest. This structure often uses the Template Method pattern.

By convention, if the interface is named `XXX`, the skeletal class is `AbstractXXX`. Examples include `AbstractSet`, `AbstractList`, and `AbstractMap`.

<div class="post_caption">Interfaces are usually the best choice for multiple implementation inheritance.</div>

<br><br>

# Item 21. Design interfaces for posterity
> Design interfaces for posterity

Adding new methods to an interface is hard because it can break existing implementations. Java 8 introduced default methods, but writing defaults that preserve all invariants is still difficult.

Here is a case where a new default method does not fit existing implementations. The example is `removeIf`, which was added to the `Collection` interface in Java 8.

```java
default boolean removeIf(Predicate<? super E> filter) {
    Objects.requireNonNull(filter);
    boolean removed = false;
    final Iterator<E> each = iterator();
    while (each.hasNext()) {
        if (filter.test(each.next())) {
            each.remove();
            removed = true;
        }
    }
    return removed;
}
```

Apache’s `SynchronizedCollection` does not override this method. It adds locking around the wrapped collection, but because it does not override `removeIf`, this method can cause concurrency errors.

Default methods can compile but still trigger runtime errors in existing implementations. Avoid adding new default methods to existing interfaces unless it is absolutely necessary. Also remember that default methods are not a way to remove methods or change existing signatures.

<div class="post_caption">Designing interfaces requires careful attention and extensive testing.</div>

<br><br>

# Item 22. Use interfaces only to define types
> Use interfaces only to define types

An interface defines a type that can refer to instances of classes that implement it. In other words, implementing an interface tells clients what they can do with instances. This is the interface’s purpose, and it should stay that way.

A common misuse is a constant interface. It is an interface with no methods and only `static final` constants, like this:

```java
public interface PhysicalConstants {
    // Avogadro's number (1/mol)
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    // Boltzmann constant (J/K)
    static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;
    // Electron mass (kg)
    static final double ELECTRON_MASS = 9.109_383_56e-31;
}
```

This is a misuse because constants are internal implementation details, yet the interface exposes them as API.

If you want to expose constants, consider other options. You can add them to the class or interface itself. For example, `Integer` and `Double` expose `MIN_VALUE` and `MAX_VALUE`. You can also use an **enum** or provide a noninstantiable **utility class**.

```java
public class PhysicalConstants {
    private PhysicalConstants() {
        // Prevent instantiation.
        throw new AssertionError("Cannot instantiate !!!");
    }
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    static final double BOLTZMANN_NUMBER = 1.380_648_52e-23;
    static final double ELECTRON_NUMBER = 9.109_383_56e-31;
}
```

<div class="post_caption">Use interfaces only to define types.</div>

<br><br>

# Item 23. Prefer class hierarchies to tagged classes
> Prefer class hierarchies to tagged classes

A **tagged class** uses a field to indicate which behavior it supports. It includes multiple implementations and lots of unnecessary code, which hurts readability and wastes memory.

- <a href="/post/prefer-class-hierarchies-to-tagged-classes" target="_blank">Details:
[Effective Java 3rd Edition] Item 23. Prefer class hierarchies to tagged classes</a>

<div class="post_caption">You almost never want a tagged class.</div>

<br><br>

# Item 24. Favor static member classes over nonstatic
> Favor static member classes over nonstatic

There are four kinds of nested classes: static member classes, nonstatic member classes, anonymous classes, and local classes.

- <a href="/post/favor-static-member-classes-over-nonstatic" target="_blank">Details:
[Effective Java 3rd Edition] Item 24. Favor static member classes over nonstatic</a>

<div class="post_caption">Nested classes come in four kinds, and each has a different use case.</div>

<br><br>

# Item 25. Limit source files to a single top-level class
> Limit source files to a single top-level class

The Java compiler allows multiple top-level classes in a single source file. But if another file defines classes with the same names, you can get compilation failures or different behavior depending on compile order.

The fix is simple: **put each top-level class in its own file.** If you must keep multiple types in one file, consider using static member classes. It improves readability and limits access when you declare them `private`.

<div class="post_caption">Keep exactly one top-level class or interface per source file.</div>
