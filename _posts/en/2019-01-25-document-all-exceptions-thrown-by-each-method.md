---
layout:   post
title:    "[Effective Java 3rd Edition] Item 74. Document All Exceptions Thrown by Each Method"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 74. Document all exceptions thrown by each method"
category: Java/Kotlin
comments: true
slug:     document-all-exceptions-thrown-by-each-method
lang:     en
permalink: /en/post/document-all-exceptions-thrown-by-each-method
---

# Exceptions Thrown by Methods

Exceptions thrown by a method are critical usage information.
Each method should document its exceptions, and you should invest time in doing it well.

First, separate **errors** from **exceptions**.
Errors represent abnormal system-level states that are difficult to predict or handle in application code.
Exceptions, on the other hand, can be triggered by your own logic, so you can anticipate and handle them.

<br/>

# How Should You Document Them?

For **checked exceptions**, declare each one and document the conditions in Javadoc using `@throws`.

```java
/**
 * blah blah...
 *
 * @param fileName
 * @throws IOException
 */
public void someMethod(String fileName) {
    try (BufferedReader br = new BufferedReader(new FileReader(fileName))) {
    } catch (IOException e) {
        // exception handling
    }
}
```

Do not collapse checked exceptions into a single parent type like `Exception`.
That gives callers no guidance on what to handle.
The only acceptable exception is the `main` method, which only the JVM can call.

For **unchecked exceptions**, document them as well.
They typically indicate programming errors, and documenting them helps developers avoid those mistakes.

If you want the numeric literal with underscores example, see the link below.
<a href="/post/underscores-in-numeric-literals" target="_blank">(Link: Numeric literals and underscores in Java)</a>

```java
/**
 * blah blah...
 *
 * @param divisor
 * @throws ArithmeticException
 *     Exception may occur when divisor is zero    
 */
public int someMethod(int divisor) {
    try {
        // dividend
        int dividend = 2_147_483_647;

        // quotient
        int quotient = dividend / divisor;
        return quotient;

    } catch (ArithmeticException e) {
        // divisor is zero
    }
} 
```

Effective Java recommends **not** listing unchecked exceptions in the method `throws` clause.
Javadoc distinguishes between exceptions listed in the signature and those only in `@throws` tags.

```java
/**
 * blah blah...
 *
 * @param divisor
 * @throws ArithmeticException
 *     Exception may occur when divisor is zero    
 */
public int someMethod(int divisor) throws ArithmeticException {
    // recommended to omit in throws clause
}
```

Sometimes, you cannot document every unchecked exception.
If a method calls an external class that starts throwing new unchecked exceptions,
your method will throw them too without any changes or Javadoc updates.

If most methods in a class throw the same exception for the same reason,
document it at the class level instead.

```java
/**
 * blah... blah...
 *
 * @throws NullPointerException
 *     All methods throw an exception if the argument is null.
 */
public class TestClass {

    /**
     * @param paramObj
     */
    public void someMethod1(Object paramObj) {
        if(paramObj == null) {
            throw new NullPointerException();
        }
        // ...
    }

    /**
     * @param paramObj
     */
    public void someMethod2(Object paramObj) {
        if(paramObj == null) {
            throw new NullPointerException();
        }
        // ...
    }
}
```
