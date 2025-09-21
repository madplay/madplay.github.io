---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 3. Methods Common to All Objects"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter3: Methods Common to All Objects"  
category: Java
comments: true
slug:     methods-common-to-all-objects
lang:     en
permalink: /en/post/methods-common-to-all-objects
---

# Table of Contents
- <a href="#item-10-obey-the-general-contract-when-overriding-equals">Item 10. Obey the general contract when overriding equals</a>
- <a href="#item-11-always-override-hashcode-when-you-override-equals">Item 11. Always override hashCode when you override equals</a> 
- <a href="#item-12-always-override-tostring">Item 12. Always override toString</a>
- <a href="#item-13-override-clone-judiciously">Item 13. Override clone judiciously</a>
- <a href="#item-14-consider-implementing-comparable">Item 14. Consider implementing Comparable</a>

<br>

# Item 10. Obey the general contract when overriding equals
> Obey the general contract when overriding equals

First, the conclusion is to avoid overriding and use the default `equals` implementation.

```java
public boolean equals(Object obj) {
    return (this == obj);
}
```

In particular, it is often best not to override in these cases.

First, when the class represents a behavior rather than a value. The default `equals` is enough. For example, the `Thread` class represents a running entity, not just its fields.

Second, when you do not need to test logical equality. For example, it is not meaningful to check whether two `Random` instances produce the same sequence.

Third, when a class is private or package-private and `equals` must never be called. In that case, you should override `equals` so it cannot be called.

- <a href="/post/obey-the-general-contract-when-overriding-equals" target="_blank">Details: 
[Effective Java 3rd Edition] Item 10. Obey the general contract when overriding equals</a>

<div class="post_caption">Do not override equals unless you truly need it.</div>

<br><br>

# Item 11. Always override hashCode when you override equals
> Always override hashCode when you override equals

If you override `equals` but not `hashCode`, you can break collections that rely on hashing. Follow the `hashCode` contract and implement it correctly.

- <a href="/post/always-override-hashcode-when-you-override-equals" target="_blank">
Details: [Effective Java 3rd Edition] Item 11. Always override hashCode when you override equals</a>

<div class="post_caption">When you override equals, always override hashCode.</div>

<br><br>

# Item 12. Always override toString
> Always override toString

`toString` should return a concise, readable, and useful representation. A good `toString` makes a class easier to use and debug.

### A good toString implementation
- Return all the important information in the object.
- Make the output format clear, either via documentation or a comment.
- Provide an API that exposes the same information included in `toString`.

If you do not provide such an API, developers who need the data have to parse the `toString` output.

### When toString is not necessary
- Most static utility classes.
- Most enum types.
- Classes whose superclass already implements it properly.

### ToStringBuilder is practical in production
The `apache-commons-lang3` library provides convenient `toString` formats.

```java
public String toString() {
    /*
     * Change the second argument to select a format.
     * ToStringStyle.JSON_STYLE, etc.
     */
    return ToStringBuilder.reflectionToString(this, ToStringStyle.MULTI_LINE_STYLE);
}
```

<div class="post_caption">toString should return clear and useful information about the object.</div>

<br/>

# Item 13. Override clone judiciously
> Override clone judiciously

`Cloneable` is a mixin interface that indicates a class supports cloning. However, the design is awkward. `clone` is defined in `Object`, not in `Cloneable`, and it is `protected`. The `Cloneable` interface has no methods, yet it controls how `Object.clone` behaves.

```java
package java.lang;

public interface Cloneable {
    // Nothing here
}
```

If a class implements `Cloneable`, calling `clone` returns a field-by-field copy. If a class does not implement it, `clone` throws an exception.

### The usual intent of "copy"
- `x.clone() != x` must be true.
- `x.clone().getClass() == x.getClass()` is not required.
- `x.clone().equals(x)` is not required.

When you override `clone`, be careful about unintended behavior in subclasses. If class B extends class A, B’s `clone` must return a `B`. But if A’s `clone` creates an instance using A’s constructor, B’s `clone` can only return an A. If each class calls `super.clone` in sequence, the result matches the intended type.

### Prefer copy constructors and copy factories over clone
You do not need the complexity of `Cloneable`. Copy constructors and copy factories avoid the drawbacks of cloning.

```java
// Copy constructor
public MadPlay(MadPlay madPlay) { 
    // ...
};

// Copy factory
public static MadPlay newInstance(MadPlay madPlay) {
    // ...
};
```

<div class="post_caption">Except for arrays, constructors and factories are the best way to copy.</div>

<br><br>

# Item 14. Consider implementing Comparable
> Consider implementing Comparable

`Comparable` has only one method: `compareTo`. Implementing it means your class has a natural ordering. It is similar to `equals`, but it can compare order and is generic.

<br>

## The general contract of compareTo
- It compares the order of this object and the given object.
- It returns a negative integer if this object is less than the given object.
- It returns zero if this object is equal to the given object.
- It returns a positive integer if this object is greater than the given object.
- It throws `ClassCastException` if the object cannot be compared.

In the rules below, `sgn(expression)` is the signum function that returns -1, 0, or 1 based on the expression value.

- Symmetry: For all x and y, `sgn(x.compareTo(y)) == -sgn(y.compareTo(x))`.
- Transitivity: If `x.compareTo(y) > 0` and `y.compareTo(z) > 0`, then `x.compareTo(z) > 0`.
- Consistency: If `x.compareTo(y) == 0`, then `sgn(x.compareTo(z)) == sgn(y.compareTo(z))` for all z.
- Consistency with equals: Not required but recommended. `(x.compareTo(y) == 0) == (x.equals(y))`.

If a class does not follow the last rule, it should document the behavior.

<br>

## How to write compareTo
`compareTo` is similar to `equals`, with a few differences.

- You do not need to check the argument type or cast. It is a generic interface. If the type is wrong, the code fails at compile time. If you pass null, throw `NullPointerException`.
- You compare order instead of equality.
- For object reference fields, call `compareTo` recursively.
- If a field does not implement `Comparable` or you need a nonstandard order, use a `Comparator`.
- Since Java 7, compare primitive integers with `compare`, not `<` or `>`.
- Compare the most significant field first. If the order is determined, return immediately.

<br>

## Comparator interface
Since Java 8, `Comparator` provides many factory methods. It makes code concise but can introduce some overhead.

```java
private static final Comparator<User> COMPARATOR =
    comparingInt((User user) -> user.age)
        .thenComparingInt(user -> user.id);

public int compareTo(User user) {
    return COMPARATOR.compare(this, user);
}
```

<div class="post_caption">If you build a value class with a natural order, implement Comparable.</div>
