---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 8. Methods"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter8: Methods"
category: Java
date: "2019-08-03 02:11:01"
comments: true
slug:     effectivejava-chapter8-methods
lang:     en
permalink: /en/post/effectivejava-chapter8-methods
---

# Table of contents
- <a href="#아이템-49-매개변수가-유효한지-검사하라">Item 49. Check parameters for validity</a>
- <a href="#아이템-50-적시에-방어적-복사본을-만들라">Item 50. Make defensive copies when needed</a>
- <a href="#아이템-51-메서드-시그니처를-신중히-설계하라">Item 51. Design method signatures carefully</a>
- <a href="#아이템-52-다중정의는-신중히-사용하라">Item 52. Use overloading judiciously</a>
- <a href="#아이템-53-가변인수는-신중히-사용하라">Item 53. Use varargs judiciously</a>
- <a href="#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">Item 54. Return empty collections or arrays, not nulls</a>
- <a href="#아이템-55-옵셔널-반환은-신중히-하라">Item 55. Return optionals judiciously</a>
- <a href="#아이템-56-공개된-api-요소에는-항상-문서화-주석을-작성하라">Item 56. Write doc comments for all exposed API elements</a>

<br>

<a id="아이템-49-매개변수가-유효한지-검사하라"></a>
# Item 49. Check parameters for validity
> Check parameters for validity

Validate parameters before the method body starts and document the constraints. Skipping validation leads to ambiguous failures, incorrect results, or delayed failures when another object mutates state.

`public` and `protected` methods should document the exceptions they throw for invalid parameters. Class-level comments apply to all public methods and keep documentation cleaner. You can use annotations like `@Nullable`, but they are not standard. Constructor parameter validation is also required to prevent creation of objects that violate class invariants.

## Validation techniques
The `requireNonNull` method added in Java 7 makes null checks more flexible.

```java
public void someMethod(Integer val) {
    Integer integer = Objects.requireNonNull(val, "Parameter is null");
    System.out.println(integer);
}
```

Passing `null` produces this error:

```bash
Exception in thread "main" java.lang.NullPointerException: Parameter is null
	at java.base/java.util.Objects.requireNonNull(Objects.java:246)
```

Java 9 also adds range-checking utilities in `Objects`: `checkFromIndexSize`, `checkFromToIndex`, and `checkIndex`. They are less flexible than null checks. You cannot specify a custom message and they target lists and arrays.

```java
List<String> list = List.of("a", "b", "c");

// Exception in thread "main" java.lang.IndexOutOfBoundsException: 
//      Index 4 out of bounds for length 3
Objects.checkIndex(4, list.size());
```

If a method is private and not exposed, the developer controls all call sites. In that case, you can validate parameters with `assert`. To enable assertions, pass `-ea` or `--enableassertions` in VM options (IntelliJ). Without it, assertions are ignored. If the condition is false, Java throws an `AssertionError`.

```java
private void someMethod(int arr[], int length) {
    assert arr != null;
    assert length >= 0 && arr.length == length;

    // do something
}
```

## When validation is unnecessary
In some cases, explicit validation is not required. If validation is too expensive or the computation implicitly validates, you can skip it. For example, `Collections.sort(List)` compares all elements. If an element is not comparable, `ClassCastException` occurs. Pre-validating all elements adds no value.

<div class="post_caption">Validate parameters at the beginning of the method body.</div>

<br><br>

<a id="아이템-50-적시에-방어적-복사본을-만들라"></a>
# Item 50. Make defensive copies when needed
> Make defensive copies when needed

Java is safe, but you must assume clients can break invariants. If a class accepts or returns a mutable component, make a defensive copy.

- <a href="/post/make-defensive-copies-when-needed" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 50. Make defensive copies when needed</a>

<div class="post_caption">Create defensive copies when the situation calls for it.</div>

<br><br>

<a id="아이템-51-메서드-시그니처를-신중히-설계하라"></a>
# Item 51. Design method signatures carefully
> Design method signatures carefully

**Name methods carefully.** Follow standard naming conventions and avoid overly long names. When in doubt, refer to the Java library guide and keep names consistent with others in the same package.

**Avoid too many convenience methods.** Each method requires documentation, maintenance, and tests. Keep parameter lists short; four or fewer is a good target. Multiple parameters of the same type in a row are especially problematic. Here are ways to reduce parameters.

**Split the operation into multiple methods.** Suppose you want to find an element in a list using the start, end, and target element. That is three parameters. The `List` interface provides `subList` and `indexOf` as separate methods. Combine them instead.

```java
List<String> list = Lists.of("a", "b", "c", "d");

List<String> newList = list.subList(1, 3);
int index = newList.indexOf("b"); // 0
```

Another approach is a **helper class** that groups parameters.

```java
// Existing method
public void someMethod(String name, String address, String email, String job) {
    // do something
}

// Helper class
class SomeHelper {
    String name;
    String address;
    String email;
    String job;
}

public void someMethod(SomeHelper someHelper) {
    // do something
}
```

You can also use the **builder pattern**.

- <a href="/post/creating-and-destroying-objects#아이템-2-생성자에-매개변수가-많다면-빌더를-고려하라" target="_blank">
Reference: [Effective Java 3rd Edition] Item 2. Consider a builder when a constructor has many parameters</a>

**Prefer interfaces to classes as parameter types.** Use `Map` instead of `HashMap`. A concrete class forces clients into a specific implementation.

**Prefer a two-element enum to a boolean,** unless the boolean is unambiguous. For example:

```java
public void setProgram(boolean isNews) {
    if (isNews) {
        // set program for news
    } else {
        // set anything
    }
}
```

If you add a new program type beyond news, a boolean no longer scales. With an enum, the code stays clean.

```java
public enum ProgramType { NEWS, SPORTS, ENTERTAINMENT }

public void setProgram(ProgramType type) {
    switch (type) {
        case NEWS:
            // do something
            break;
        case SPORTS:
            // do something
            break;
        case ENTERTAINMENT:
            // do something
            break;
    }
}
```

<div class="post_caption">Design method names and parameter lists with care.</div>

<br><br>

<a id="아이템-52-다중정의는-신중히-사용하라"></a>
# Item 52. Use overloading judiciously
> Use overloading judiciously

**Overridden** methods are selected dynamically at runtime, while **overloaded** methods are selected at compile time. That distinction often leads to surprising behavior.

- <a href="/post/method-overriding-vs-method-overloading-in-java" target="_blank">Reference: Overriding vs. Overloading in Java</a>

```java
class ColectionClassifier {
    public static String classify(Set<?> set) {
        return "Set";
    }

    public static String classify(List<?> list) {
        return "List";
    }

    public static String classify(Collection<?> collection) {
        return "Other"
    }

    public static void main(String[] args) {
        Collection<?>[] collections = {
            new HashSet<String>(),
            new ArrayList<Integer>(),
            new HashMap<String, String>().values()
        };

        for (Collection<?> c : collections) {
            System.out.println(classfy(c));
        }
    }
}
```

This prints "Other" three times. At compile time, `c` is always `Collection<?>`. To avoid confusion, avoid overloads with the same number of parameters. Overloading varargs methods is especially dangerous.

Instead of overloading, you can use distinct method names. `ObjectOutputStream` takes this approach with `writeBoolean(boolean)` and `writeInt(int)`. Its counterpart `ObjectInputStream` pairs them with `readBoolean()` and `readInt()`.

Constructors cannot change names, so constructor overloads are inevitable. Use static factories as an alternative when possible.

<div class="post_caption">Avoid overloading when parameter counts are the same.</div>

<br><br>

<a id="아이템-53-가변인수는-신중히-사용하라"></a>
# Item 53. Use varargs judiciously
> Use varargs judiciously

When you call a varargs method, Java creates an array sized to the number of arguments and copies them into it. If at least one argument is required, add a required parameter before the varargs parameter.

```java
static int min(int firstArg, int... remainingArgs) {
    int min = firstArg;
    for (int arg : remainingArgs) {
        if (arg < min) {
            min = arg;
        }
    }
    return min;
}
```

Varargs can hurt performance because each call allocates and initializes an array. You can use fixed-arity overloads for the most common cases and fall back to varargs for the rest.

```java
public void foo() {}
public void foo(int arg1) {}
public void foo(int arg1, arg2) {}
public void foo(int arg1, arg2, arg3) {}
public void foo(int arg1, arg2, arg3, int... restArg) {}
```

The book assumes 95% of method calls use three or fewer arguments, so varargs handles the remaining 5%.

<div class="post_caption">Varargs can be expensive. Use them carefully.</div>

<br><br>

<a id="아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라"></a>
# Item 54. Return empty collections or arrays, not nulls
> Return empty collections or arrays, not nulls

You often see methods return `null` for empty collections.

```java
private final List<Cheese> cheesesInStock = ...;

public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? null : new ArrayList<>(cheesesInStock);
}
```

This forces clients to add defensive null checks. The performance difference between `null` and an empty container is negligible, so return an empty container instead.

```java
public List<Cheese> getCheeses() {
    return new ArrayList<>(cheesesInStock);
}
```

Depending on usage patterns, allocating empty collections might still be costly. In that case, return a shared immutable empty collection.

```java
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? Collections.emptyList() : new ArrayList<>(cheesesInStock);
}
```

The same applies to arrays. Return a zero-length array instead of `null`. You can also avoid repeated allocations by reusing a shared empty array.

```java
// Return a zero-length array
public Cheese[] getCheeses() {
    return cheesesInStock.toArray(new Cheese[0]);
}

// Reuse a shared array
private static final Cheese[] EMPTY_CHEESE_ARRAY = new Cheese[0];


public Cheese[] getCheeses() {
    return cheesesInStock.toArray(EMPTY_CHEESE_ARRAY);
    // Preallocating like this can hurt performance.
    // return cheesesInStock.toArray(new Cheese[cheesesInStock.size()]);
}
```

<div class="post_caption">Return empty arrays or collections, not null.</div>

<br><br>

<a id="아이템-55-옵셔널-반환은-신중히-하라"></a>
# Item 55. Return optionals judiciously
> Return optionals judiciously

Sometimes a method cannot return a value. Before Java 8, you either threw an exception or returned `null`. Exceptions should represent exceptional cases only, and `null` introduces `NullPointerException` risk and extra null-handling code.

Java 8 adds `Optional<T>`, which holds either a non-null `T` reference or nothing. It is an immutable container of at most one element and helps you write null-safe code.

```java
// Without Optional
public static <E extends Comparable<E>> E max(Collection<E> c) {
    if (c.isEmpty()) {
        throw new IllegalArgumentException("Empty collection");
    }        

    E result = null;
    for (E e : c) {
        if (result == null || e.compareTo(result) > 0)
            result = Objects.requireNonNull(e);
    }
    return result;
}

// With Optional and streams
public static <E extends Comparable<E>>
        Optional<E> max(Collection<E> c) {
    return c.stream().max(Comparator.naturalOrder());
}
```

## Using Optional
### Provide a default value
If the method returns no value, you can supply a default.

```java
String lastWordInLexicon = max(words).orElse("No word...");
```

### Throw a specific exception
If no value exists, throw the exception you want. Here we pass an exception factory, so the exception is created only when needed.

```java
Toy myToy = max(toys).orElseThrow(TemperTantrumException::new);
```

### Assume a value is present
Use this only when you are sure a value exists. Otherwise `NoSuchElementException` occurs.

```java
Element lastNobleGas = max(Elements.NOBLE_GASES).get();
```

### When the default is expensive
If creating the default is expensive, use `orElseGet`. It creates the value lazily via `Supplier<T>`.

```java
Connection conn = getConnection(dataSource).orElseGet(() -> getLocalConn());
```

## Pitfalls
Do not wrap containers such as collections, streams, arrays, or optionals inside an `Optional`. Returning `Optional<List<T>>` is worse than returning an empty `List<T>` because clients must handle an extra optional layer.

Also avoid using `Optional` as a map key, map value, collection element, or array element. It creates ambiguity. For example, a map can represent “no key” and “key mapped to an empty optional,” which are different states.

<div class="post_caption">For performance-critical methods, returning null or throwing an exception can be better.</div>

<br><br>

<a id="아이템-56-공개된-api-요소에는-항상-문서화-주석을-작성하라"></a>
# Item 56. Write doc comments for all exposed API elements
> Write doc comments for all exposed API elements

Good documentation improves API usability. Java’s Javadoc collects document comments from source files and generates API docs.

To document correctly, add doc comments to all public classes, interfaces, methods, and field declarations. Method doc comments should describe the contract between the method and the client. For non-inheritance usage, focus on what the method does, not how it works.

## Writing guide

Tag | Usage | Guidance
|:--|:--|:--|
@param | every parameter | use a noun phrase without a period.
@return | non-void return | use a noun phrase without a period. <br/> Omit when it repeats the method description.
@throws | all possible exceptions | use a noun phrase without a period.
@code | render in code font | ignores HTML elements and other Javadoc tags.
@implSpec | implementation spec | describes the contract between the method and subclasses.
@literal | ignore HTML | unlike @code, it does not render in code font.
@index | indexing | added in Java 9; indexes the specified term.
@summary | summary | summary of the description (since Java 10).

## General guidance
- Prioritize readability.
  - `{@literal |r| < 1}` vs. `|r| {@literal < } 1`
  - Only `<` needs `@literal`, but you can wrap a whole phrase for readability.
- Write package documentation in `package-info.java`.
- Write module documentation in `module-info.java`.
- For generics, document every type parameter.
- For enums, document each constant.
- For annotations, document each member.
- For classes or static methods, include thread-safety level.
- For serializable classes, document the serialization form.
- Method docs can be inherited; without a comment, Javadoc pulls from supertypes.
  - Interface docs take precedence over class docs.

<div class="post_caption">Doc comments are the best way to document APIs.</div>
