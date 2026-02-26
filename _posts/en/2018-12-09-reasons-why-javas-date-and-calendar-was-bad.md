---
layout:   post
title:    Why Java Date and Calendar Are a Bad Fit
author:   madplay
tags: 	  java date calendar
description: Why should you avoid Java’s legacy Date and Calendar APIs?
category: Java/Kotlin
comments: true
slug:     reasons-why-javas-date-and-calendar-was-bad
lang:     en
permalink: /en/post/reasons-why-javas-date-and-calendar-was-bad
---

# Java Date APIs
Java provides many classes for date and time calculations.
`Date` has been available since JDK 1.0, `Calendar` since JDK 1.1, and the `java.time` package arrived in JDK 8 with improved types such as `ZonedDateTime` and `LocalDateTime`.

The legacy `Date` and `Calendar` classes, however, have more issues than expected.
Let’s look at why.

<br/>

# A Quick Example
Because they are built-in, many developers have used `Date` and `Calendar`.
Over time, many `Date` methods became deprecated.
Still, the following code formats today’s date using the legacy API:

```java
import java.text.SimpleDateFormat;
import java.util.Date;

public class JavaDateTest {
    public static void main(String[] args) {
        Calendar cal = Calendar.getInstance();
        Date date = cal.getTime();
        String dateString = new SimpleDateFormat("yyyy-MM-dd").format(date);
        // 2018-12-09
        System.out.println(dateString);

        // add one day
        cal.add(Calendar.DATE, 1);
        date = cal.getTime();
        dateString = new SimpleDateFormat("yyyy-MM-dd").format(date);

        // 2018-12-10
        System.out.println(dateString);
    }
}
```

It is simple, aside from the ambiguity of `getTime`, which gives no hint about the return type.

<br/>

# Ambiguous Constants
The API has many places that confuse developers.
As shown above, date arithmetic errors are not caught at compile time.

For example, the following code compiles even though the intent is unclear:

```java
Calendar cal = Calendar.getInstance();

// add one Monday?
cal.add(Calendar.MONDAY, 1);
```

<br/>

# Month Calculation
`Calendar` uses confusing month constants.
Here is how the month fields are defined:

```java
/**
 * Value of the {@link #MONTH} field indicating the
 * first month of the year in the Gregorian and Julian calendars.
 */
public final static int JANUARY = 0;

/**
 * Value of the {@link #MONTH} field indicating the
 * second month of the year in the Gregorian and Julian calendars.
 */
public final static int FEBRUARY = 1;

/**
 * Value of the {@link #MONTH} field indicating the
 * third month of the year in the Gregorian and Julian calendars.
 */
public final static int MARCH = 2;
```

To set February, you have to subtract 1 from the month value.
If you avoid constants, you still end up with `-1` in code, which is not readable.

<br/>

# Even Subclasses Are Affected
This design affects subclasses as well.
`java.sql.Timestamp` extends `java.util.Date` and adds a nanosecond field.

It violates the `equals` contract. For a detailed explanation, see this link:

<a href="/post/obey-the-general-contract-when-overriding-equals" target="_blank">
[Effective Java 3rd Edition] Item 10. Obey the general contract when overriding equals</a>

<br/>

# Not Immutable
```java
Calendar cal = Calendar.getInstance();
cal.set(Calendar.MONTH, 2 - 1);
```

As this shows, Java’s legacy date types are **mutable**.
If `Date` or `Calendar` objects are shared across code, a change in one place can leak into another.

Also, simple date arithmetic is awkward with `Date` alone, so you end up creating a `Calendar` to modify a `Date`.
In many cases, libraries like Apache Commons `DateUtils` are more practical.

<br/>

# What Should You Use Instead?
Since JDK 8, safer and cleaner date/time classes are available. The next post covers how to use them.

- <a href="/post/java8-date-and-time" target="_blank">Next: "Java 8 Date and Time"</a>
