---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 6. Enums and Annotations"
author:   madplay
tags: 	  java effectivejava
description: "Effective Java 3rd Edition Chapter 6: Enums and Annotations"
category: Java/Kotlin
date: "2019-06-03 00:02:55"
comments: true
slug:     effectivejava-chapter6-enums-and-annotations
lang:     en
permalink: /en/post/effectivejava-chapter6-enums-and-annotations
---

# Table of Contents
- <a href="#item-34-use-enums-instead-of-int-constants">Item 34. Use enums instead of int constants</a>
- <a href="#item-35-use-instance-fields-instead-of-ordinals">Item 35. Use instance fields instead of ordinals</a>
- <a href="#item-36-use-enumset-instead-of-bit-fields">Item 36. Use EnumSet instead of bit fields</a>
- <a href="#item-37-use-enummap-instead-of-ordinal-indexing">Item 37. Use EnumMap instead of ordinal indexing</a>
- <a href="#item-38-emulate-extensible-enums-with-interfaces">Item 38. Emulate extensible enums with interfaces</a>
- <a href="#item-39-prefer-annotations-to-naming-patterns">Item 39. Prefer annotations to naming patterns</a>
- <a href="#item-40-consistently-use-the-override-annotation">Item 40. Consistently use the Override annotation</a>
- <a href="#item-41-use-marker-interfaces-to-define-types">Item 41. Use marker interfaces to define types</a>

<br>

# Item 34. Use enums instead of int constants
> Use enums instead of int constants

Before enums, Java relied on the int enum pattern.

```java
public static final int APPLE_FUJI = 0;
public static final int APPLE_PIPPIN = 1;

public static final int ORANGE_NEVEL = 0;
public static final int ORANGE_TEMPLE = 1;
```

This approach is unsafe and verbose. A method that expects an orange can accept an apple, and comparing with `==` produces no warning.

- <a href="/post/use-enums-instead-of-int-constants" target="_blank">
For details: [Effective Java 3rd Edition] Item 34. Use enums instead of int constants</a>

<div class="post_caption">Enums are far superior to int constants.</div>

<br><br>

# Item 35. Use instance fields instead of ordinals
> Use instance fields instead of ordinals

Enums expose `ordinal`, which returns the position of a constant. The first constant returns 0. It is tempting to use it as an associated value, but it is risky.

```java
public enum Ensemble {
    SOLO, DUET, TRIO, QUARTET, QUINTET,
    SEXTET, SEPTET, OCTET, NONET, DECTET;

    public int numberOfMusicians() { return ordinal() + 1; }   
}
```

Reordering constants breaks the logic, and you cannot add new constants with existing values. The fix is simple: **store the value in an instance field instead of using ordinal.**

```java
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5),
    SEXTET(6), SEPTET(7), OCTET(8), NONET(9), DECTET(10),
    DOUBLE_QUARTET(8), TRIPLE_QUARTET(12);

    private final int int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
```

<div class="post_caption">Store associated values in instance fields, not ordinals.</div>

<br><br>

# Item 36. Use EnumSet instead of bit fields
> Use EnumSet instead of bit fields

Historically, code used the int enum pattern for bit fields.

```java
public class Text {
    public static final int STYLE_BOLD          = 1 << 0;  // 1
    public static final int STYLE_ITALIC        = 1 << 1;  // 2
    public static final int STYLE_UNDERLINE     = 1 << 2;  // 4
    public static final int STYLE_STRIKETHROUGH = 1 << 3; // 8

    // Parameter styles is the bitwise OR of zero or more STYLE_ constants.
    public void applyStyles(int styles) { ... }
}
```

You can combine values with bitwise OR, but bit fields inherit the weaknesses of int enums and become harder to read. Iterating meaningful elements is awkward, and you must predefine how many bits you need.

**EnumSet fixes these problems.** It implements `Set`, is type-safe, and interoperates with other `Set` implementations. Internally, it uses a bit vector. With up to 64 elements, EnumSet fits in a single `long`. Methods like `removeAll` and `retainAll` use efficient bit operations without the error-prone manual work.

```java
public class Text {
    public enum Style { BOLD, ITALIC, INDERLINE, STRIKETHROUGH }

    // Clean and safe. Any Set works, but EnumSet is best.
    // Accepting the interface is usually a good habit.
    public void applyStyles(Set<Style> styles) { ... }
}
```

**EnumSet's only real drawback is the lack of an immutable variant.** Java 11 still does not provide one. You can wrap it with Guava's `Collections.unmodifiableSet`.

```java
// Use Guava
Set immutableEnumSet = Collections.unmodifiableSet(EnumSet.of(Text.Style.BOLD, Text.Style.ITALIC));
immutableEnumSet.add(Text.Style.INDERLINE); // java.lang.UnsupportedOperationException
```

This wrapper costs some performance because it sits on top of EnumSet.

<div class="post_caption">Bit fields have no advantage here. Use EnumSet.</div>

<br><br>

# Item 37. Use EnumMap instead of ordinal indexing
> Use EnumMap instead of ordinal indexing

## Using ordinal as an array index is risky

```java
// Arrays are not compatible with generics, so an unchecked cast is required.
Set<Plant>[] plantByLifeCycle = 
    (Set<Plant>[]) new Set[Plant.LifeCycle.values().length];

for (int i = 0; i < plantsByLifeCycle.length; i++) {
    plantsByLifeCycle[i] = new HashSet<>();
}

for (plant p : garden) {
    plantsByLifeCycle[p.lifeCycle.ordinal()].add(p);
}

// Print results
for (int i = 0; i < plantsByLifeCycle.length; i++) {
    System.out.printf("%s: %s%n", Plant.LifeCycle.values()[i], plantsByLifeCycle[i]);
}
```

Arrays do not encode the meaning of an index, so you must format outputs manually. The bigger risk is that **you must guarantee correct ordinal values yourself.** If the order changes, the logic fails.

## EnumMap makes it safe

**EnumMap solves this.** It is a fast Map implementation designed for enum keys.

```java
// Map data to enums with EnumMap.
Map<Plant.LifeCycle, Set<Plant>> plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);

for (Plant.LifeCycle lc : Plant.LifeCycle.values()) {
    plantsByLifeCycle.put(lc, new HashSet<>());
}

for (Plant p : garden) {
    plantsByLifeCycle.get(p.lifeCycle).add(p);
}
System.out.println(plantsByLifeCycle);
```

No unsafe casts appear. This hides the array-based implementation but keeps its performance and the Map type safety. Each enum key can also format its own string, so you no longer need manual formatting. The Class object passed to the constructor is a bounded type token that provides runtime generic type information.

## Stream-based approach
Streams reduce boilerplate.

```java
// Map data to enums with Map
Arrays.stream(garden)
    .collect(groupingBy(p -> p.lifeCycle))

// Map data to enums with EnumMap
Arrays.stream(garden)
    .collect(groupingBy(
        p -> p.lifeCycle, 
        () -> new EnumMap<>(LifeCycle.class),
        toSet())
    );
```

<div class="post_caption">Use EnumMap instead of array indexing.</div>

<br><br>

# Item 38. Emulate extensible enums with interfaces
> Emulate extensible enums with interfaces

**Extending enums is usually a bad idea.** It can work for operation codes. An enum can implement an interface, which enables this pattern.

```java
public interface Operation {
    double apply(double x, double y);
}

public enum BasicOperation implements Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };

    private final String symbol;
    BasicOperation(String symbol) { this.symbol = symbol; }
    @Override public String toString() { return symbol; }
}
```

`BasicOperation` cannot be extended, but the `Operation` interface can. You can add more operations by defining new enums that implement the interface.

```java
public enum ExtendedOperation implements Operation {
    EXP("^") {
        public double apply(double x, double y) {
            return Math.pow(x, y);
        }
    },
    REMAINDER("%") {
        public double apply(double x, double y) {
            return x % y;
        }
    };

    private final String symbol;
    // Constructor and toString omitted
}
```

You can also pass the extended enum type and iterate over all values.

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    test(ExtendedOperation.class, x, y);
}

private static <T extends Enum<T> & Operation> void test(Class<T> opEnumType, double x, double y) {
    for (Operation op : opEnumType.getEnumConstants()) {
        System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
    }
}
```

`<T extends Enum<T> & Operation>` means the Class object is both an enum and a subtype of Operation. You can also accept a bounded wildcard list of enums.

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    test(Arrays.asList(ExtendedOperation.values()), x, y);
}

private static void test(Collection<? extends Operation> opSet, double x, double y) {
    for (Operation op : opSet) {
        System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
    }
}
```

Enums cannot share implementation via inheritance. When shared behavior grows, extract it into a helper class or method.

<div class="post_caption">Enums can emulate extensibility through interfaces.</div>

<br><br>

# Item 39. Prefer annotations to naming patterns
> Prefer annotations to naming patterns

JUnit 3 required test method names to start with `test`. A typo prevents execution, and you cannot pass parameters to express expected exceptions. JUnit 4 solves this by using annotations.

- <a href="/post/prefer-annotations-to-naming-patterns" target="_blank">
For details: [Effective Java 3rd Edition] Item 39. Prefer annotations to naming patterns</a>

<div class="post_caption">Annotations replace naming patterns.</div>

<br><br>

# Item 40. Consistently use the Override annotation
> Consistently use the Override annotation

`@Override` indicates that a method overrides a method in a supertype and it can appear only on method declarations. Using it consistently prevents subtle bugs.

```java
public class Bigram {
    private final char first;
    private final char second;

    public boolean equals(Bigram b) {
        return b.first == first && b.second == second;
    }

    public int hashCode() {
        return 31 * first * second;
    }

    // Other code omitted
}
```

At a glance, `equals` looks like an override, and `hashCode` is present. But `equals` is overloaded, not overridden, because the parameter type is wrong. If `@Override` were present, the compiler would catch this error before runtime.

Add `@Override` to every method that overrides a supertype method. The only exception is when you override an abstract method; the compiler already flags missing implementations. The same applies to interfaces. Since default methods exist, use `@Override` for interface implementations as well. Most IDEs add it automatically.

<div class="post_caption">`@Override` eliminates many override mistakes.</div>

<br><br>

# Item 41. Use marker interfaces to define types
> Use marker interfaces to define types

A **marker interface** has no methods and indicates that implementing classes possess a specific property. `Serializable` is a common example: it signals that instances are serializable.

## Advantages of marker interfaces
**First, they define a type that the compiler can check.** This catches errors at compile time. A marker annotation pushes these checks to runtime.

**Second, they allow a more precise target.** A marker annotation with `@Target(ElementType.TYPE)` applies to classes, interfaces, enums, and annotations. A marker interface applies only to types that explicitly implement or extend it.

## Advantages of marker annotations
Marker annotations integrate with larger annotation systems. If a framework relies heavily on annotations, using a marker annotation maintains consistency.

## Summary
Use a marker interface when you need a type without adding methods. If you expect methods to accept only marked instances, a marker interface is a strong fit.

<div class="post_caption">Marker interfaces and marker annotations both have clear use cases.</div>
