---
layout:   post
title:    "[Effective Java 3rd Edition] Item 4. Enforce Noninstantiability with a Private Constructor"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 4. Enforce noninstantiability with a private constructor"
category: Java/Kotlin
comments: true
slug:     enforce-noninstantiability-with-private-constructor
lang:     en
permalink: /en/post/enforce-noninstantiability-with-private-constructor
---

# Not Every Class Should Be Instantiated

Classes that contain only static methods and fields are useful.
You can group primitive- or array-related methods in classes like `java.lang.Math` and `java.util.Array`,
or expose factory methods like `java.util.Collections` that create implementations of interfaces.

The same applies to methods tied to a `final` class, because it cannot be extended.

<br/>

# How Do You Prevent Instantiation?

Assume you have a utility class like this. It does not need instances, so it has no explicit constructor.
It only contains static methods, and the name emphasizes that it is a utility class.

```java
public class DateUtility {
    private static String FULL_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";

    // no constructor

    public static String convertDateToString(Date date) {
        return new SimpleDateFormat(FULL_DATE_FORMAT).format(date);
    }
}
```

If you do not declare a constructor, the compiler generates a default one.
So even though the class is meant to be used statically, someone can still instantiate it.

```java
public void someMethod() {
    // expected usage
    DateUtility.convertDateToString(new Date());
    
    // but someone can still do this
    DateUtility dateUtility = new DateUtility();
    String formattedToday = dateUtility.convertDateToString(new Date());
}
```

Making the class abstract does not solve this. A subclass can still be instantiated.

```java
abstract class DateUtility {
    // ... omitted
}

class SubDateUtility extends DateUtility {
    // ... omitted
}

public class PrivateConstructorTest {
    public static void main(String[] args) {
        // abstract classes cannot be instantiated
        // DateUtility dateUtility = new DateUtility();

        // okay
        SubDateUtility subDateUtility = new SubDateUtility();
    }
}
```

The fix is simple: add a **private constructor**.

```java
class DateUtility {
    private DateUtility() {
        /**
         * Block usage inside the class as well.
         */
        throw new AssertionError();
    }

    // omitted
}

public class PrivateConstructorTest {
    public static void main(String[] args) {
        // DateUtility() has private access in DateUtility
        DateUtility dateUtility = new DateUtility();
    }
}
```

The `AssertionError` prevents accidental construction even inside the class.
With no accessible constructors, the class cannot be extended either.

One more detail: if there is another `public` constructor with different parameters and the subclass defines a matching constructor,
inheritance is still possible even if the no-arg constructor is `private`.

```java
class DateUtility {
    private DateUtility() {
        throw new AssertionError();
    }

    public DateUtility(int val) {
        //
    }
}

class SubDateUtility extends DateUtility {
    public SubDateUtility(int val) {
        // must call the matching constructor in the superclass
        super(val);
    }
}
```
