---
layout:   post
title:    "Java BigInteger: Representing Very Large Integers"
author:   madplay
tags:    java biginteger
description: How can Java represent very large integers?
category: Java
date: "2021-01-17 02:11:31"
comments: true
slug:     biginteger-in-java
lang:     en
permalink: /en/post/biginteger-in-java
---

# Representing very large integers
When solving algorithm problems, input/output ranges are often split into Small Input and Large Input.
Most cases are handled by Java primitive types, but not all.

For example, `int` represents integers only in range $${ -2 }^{ 31 }$$ ~ $${ 2 }^{ 31 } - 1$$.
`long` supports larger values, but still has an upper bound of $${ -2 }^{ 63 }-1$$.

- <a href="/post/java-data-type">Reference: Java Data Types</a>

`long` is already very large for typical applications.
But if you need near-unbounded integer size, use `BigInteger`.

<br>

# Declaration
`BigInteger` is in `java.math`.
As stated in Javadoc, it represents immutable arbitrary-precision integers.
Instances are usually created from strings, and several constructors/static factory methods are available.

```java
// hexadecimal
BigInteger bigIntWithRadix = new BigInteger("64", 16);

// from integer value
BigInteger bigIntWithValue = BigInteger.valueOf(100);

// from string
BigInteger bigIntWithString = new BigInteger("100");
```

<br>

# Arithmetic operations
## Add
Use `add` for addition between `BigInteger` instances.
`BigInteger.TEN` used below is a globally accessible constant.
Other constants include `ONE`, `NEGATIVE_ONE`, and `TWO` (from Java 9).

```java
BigInteger value = new BigInteger("10");

// 20
BigInteger result = value.add(BigInteger.TEN);
```

## Subtract
Use `subtract`.

```java
BigInteger value = BigInteger.TEN;

// 8
BigInteger result = value.subtract(BigInteger.TWO);
```

## Multiply
Use `multiply`.

```java
BigInteger value = BigInteger.valueOf(3);

// 6
BigInteger result = value.multiply(BigInteger.TWO);
```

## Divide
Use `divide` for division between `BigInteger` instances.

```java
BigInteger value = BigInteger.TEN;
	
// 5
BigInteger result = value.divide(BigInteger.TWO);
```

<br>

# Bit operations
Because `BigInteger` handles large immutable values, performance is generally lower than `long`.
To compensate, several bit-level operation methods are provided.

- <a href="/post/effectivejava-chapter4-classes-and-interfaces#불변-클래스와-불변-객체의-특징">Reference: "Effective Java: Item 17. Minimize Mutability"</a>


## bitLength
`bitLength` returns the number of bits required to represent this `BigInteger` value in binary.

```java
BigInteger value = BigInteger.TEN;

// 4
value.bitCount()


// for reference, convert to binary as below
// result: 1010    
value.toString(2);
```

## testBit
`testBit` checks whether a bit at a given position is 1 or 0.
It takes an integer index and checks the (n+1)-th bit from the right in binary representation.

```java
BigInteger value = BigInteger.TEN;

// false
value.testBit(0);
```

## Shift operations (shiftLeft, shiftRight)
You can also do bit shifts as below.
To verify shifted bits, the example prints binary by setting radix parameter to 2 in `toString`.


```java
BigInteger value = BigInteger.TEN;

// value: 1010
value.toString(2)

// shiftLeft: 10100
value.shiftLeft(1).toString(2)

// shiftRight: 101
value.shiftRight(1).toString(2)
```

# Other methods
## Remainder
Use `remainder` to get modulo result.

```java
BigInteger value = new BigInteger("3");

// 1
value.remainder(BigInteger.TWO);
```


## Compare values
Use `compareTo` to compare `BigInteger` instances.
It returns 1 if greater than parameter, 0 if equal, and -1 if smaller.

```java
BigInteger value = BigInteger.TEN;

// 1
value.compareTo(BigInteger.TWO);

// 0
value.compareTo(BigInteger.TEN);

// -1
BigInteger.TWO.compareTo(value);
```


## Max and min
Use `max` and `min` to get larger/smaller value compared with parameter.

```java
BigInteger value = BigInteger.TEN;

// 10
value.max(BigInteger.TWO);

// 2 
value.min(BigInteger.TWO);
```
