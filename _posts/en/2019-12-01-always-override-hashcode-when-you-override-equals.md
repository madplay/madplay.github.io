---
layout:   post
title:    "[Effective Java 3rd Edition] Item 11. Always Override hashCode When You Override equals"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 11. Always override hashCode when you override equals" 
category: Java
lang: en
slug: always-override-hashcode-when-you-override-equals
permalink: /en/always-override-hashcode-when-you-override-equals/
comments: true
---

# If You Overrode equals
Every class that overrides `equals` should also override `hashCode`.
Otherwise it violates the general contract of `hashCode`, causing issues when instances are used in hash-based collections such as
`HashMap` and `HashSet`.

Below is a summary of the `hashCode` contract from `Object` specification.

- First, if information used in equals comparison does not change, `hashCode` must return the same value consistently
for the life of the application. It may change between application runs.
- Second, if `equals(Object)` says two objects are equal, both objects must return the same `hashCode`.
- Third, if `equals(Object)` says two objects are not equal, they do not have to return different `hashCode` values.
  But returning different values for different objects improves hash-table performance.

The most critical point is the second rule.
Logically equal objects must return the same hash value.
You should override `hashCode` so objects that are not equal by `equals(Object)` tend to have different hashes.
After implementation, add unit tests to verify equal instances produce identical hash codes.

<br><br>

# How to Write a Good hashCode Method
A good hash function returns different hash codes for different instances.
Ideally, it distributes instances uniformly over the 32-bit integer range.

- First, declare `int result` and initialize it with a field hash computed as in step 2.
- Second, compute each field hash using helpers such as `Type.hashCode` and `Arrays.hashCode`.
- Third, update result as `result = 31 * result + c;` and return it.
  - 31 is an odd prime. If the multiplier is even and overflow occurs, information loss increases.
- Fourth, fields not used in `equals` comparison must be excluded from hash computation.

<br><br>

# One-Line hashCode Method
You can use `Objects.hash`.
It accepts a variable number of objects and computes hash code.
With this method, you can implement a hash function similar to manual code in one line.

```java
@Override public int hashCode() {
    return Objects.hash(lineNum, prefix, areaCode);
}
```

But it is relatively slower.
It needs an array for input arguments, and if primitive values are present,
boxing and unboxing also occur.

<br><br>

# Lazy Initialization of hashCode
If a class is immutable and hash calculation is expensive, caching can be better than recomputing every time.
**Lazy initialization** is useful for this, but thread safety must be considered.
Below is a `hashCode` method that lazily initializes the hash value.

```java
private int hashCode; // Automatically initialized to 0.

@Override public int hashCode() {
    int result = hashCode;
    if (result == 0) {
        result = Short.hashCode(areaCode);
        result = 31 * result + Short.hashCode(prefix);
        result = 31 * result + Short.hashCode(lineNum);
        hashCode = result;
    }
    return result;
}
```

<br><br>

# Recommended Approach in Practice
In practice, `HashCodeBuilder` or `@EqualsAndHashCode` is commonly used.

```java
// HashCodeBuilder
public int hashCode() {
    return HashCodeBuilder.reflectionHashCode(this);
}
```

Add `@EqualsAndHashCode` at class level.
It generates `equals` and `hashCode` methods for all non-static and non-transient fields.

```java
@EqualsAndHashCode
public class Example {
    private transient int transientVal = 10;
    private String name;
    private int id;
}
```

Since this approach uses reflection, evaluate potential performance impact.

<br><br>

# Notes
Do not omit core fields in hash computation just for speed.
You may reduce method cost, but severely degrade hash-table performance.
And fields not used in `equals` must also be excluded from `hashCode`.

Finally, do not expose hash generation rules to API users.
If callers depend on those values, changing hash strategy later becomes difficult.
