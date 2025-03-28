---
layout:   post
title:    Java 8 Date and Time
author:   Kimtaeng
tags: 	  java date time
description: Use Java 8 date/time classes (LocalDate, LocalDateTime) to handle dates and times.
category: Java
comments: true
slug:     java8-date-and-time
lang:     en
permalink: /en/post/java8-date-and-time
---

# The java.time Package
JDK 1.8 added `LocalDateTime` and `ZonedDateTime` to the `java.time` package.
These types make date and time handling safer and more convenient than legacy APIs.

- <a href="/post/reasons-why-javas-date-and-calendar-was-bad" target="_blank">
Reference: Why Java Date and Calendar Are a Bad Fit</a>

<br/>

# Getting Dates
`LocalDate` holds year, month, and day. `LocalTime` holds hour, minute, and second.
`LocalDateTime` combines both.

```java
// today, 2018-12-11
LocalDate nowDate = LocalDate.now();

// 2018-12-11
LocalDate ofDate = LocalDate.of(2018, 12, 11);

// now, 2018-12-11T13:12:11
LocalDateTime nowDateTime = LocalDateTime.now();

// 2018-12-11T15:23:32
LocalDateTime ofDateTime = LocalDateTime.of(2018, 12, 11, 15, 23, 32);
```

<br/><br/>

# Getting Specific Dates/Times

### Get today at midnight, then format
```java
// midnight today
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

// 2018-12-12 00:00:00.000
String date = LocalDate.now().atStartOfDay().format(formatter);
```

### Get tomorrow
```java
// 2018-12-11T15:23:32
LocalDateTime ofDateTime = LocalDateTime.of(2018, 12, 11, 15, 23, 32);

// 2018-12-12T15:23:32
LocalDateTime tomorrow = ofDateTime.plusDays(1);
```

### Get the last moment of tomorrow
```java
// 2018-12-12 23:59:59
// actually 23:59:59.999999999
LocalDateTime.now().plusDays(1).with(LocalTime.MAX);
```

### Get noon
```java
// noon today
LocalDateTime.now().with(LocalTime.NOON);
```

<br/><br/>

# Converting Dates
Convert date values to strings or from legacy types.

### Date to LocalDateTime
```java
// java.util.Date to java.time.LocalDateTime
LocalDateTime.ofInstant(new Date().toInstant(), ZoneId.systemDefault());
```

### LocalDate to LocalDateTime
```java
// java.time.LocalDate to java.time.LocalDateTime
// today at 15:23:30
LocalDate.now().atTime(15, 23, 30);

// today at midnight
LocalDate.now().atStartOfDay();
```

### LocalDateTime to String
```java
// java.time.LocalDateTime to java.lang.String
// 2018-12-11 13:53:21.121
LocalDateTime.now()
    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));
```

### LocalDate to String
```java
// java.time.LocalDate to java.lang.String
// 2018-12-11
LocalDate.now().format(DateTimeFormatter.ISO_DATE);
```

### String to LocalDateTime
```java
// java.lang.String to java.time.LocalDateTime
// 2018-12-11T13:43:21.222
LocalDateTime.parse("2018-12-11 13:43:21.221",
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));       
```

### String to LocalDate
```java
// java.lang.String to java.time.LocalDate 
// 2018-12-11
LocalDate.parse("2018-12-11");
```

<br/><br/>

# Working with Weekdays
You can compute the next weekday or the Nth weekday of a month with compact code.

### Next Sunday
```java
// based on Dec 11, next Sunday is Dec 16
LocalDateTime.now().with(TemporalAdjusters.next(DayOfWeek.SUNDAY))
```

### Fourth Sunday of December 2018
```java
// based on Dec 2018, the fourth Sunday is the 23rd
LocalDate.of(2018, 12, 11).with(TemporalAdjusters.dayOfWeekInMonth(4, DayOfWeek.SUNDAY));
```

### First Sunday of December 2018
```java
// based on Dec 2018, the first Sunday is the 2nd
LocalDate.of(2018, 12, 11).with(TemporalAdjusters.firstInMonth(DayOfWeek.SUNDAY));
```

<br/><br/>

## Locale-Specific Names
You can render month and weekday names in different locales.

```java
// Korean output
Month.FEBRUARY.getDisplayName(TextStyle.FULL, Locale.KOREAN);
Month.FEBRUARY.getDisplayName(TextStyle.NARROW, Locale.KOREAN);
Month.FEBRUARY.getDisplayName(TextStyle.SHORT, Locale.KOREAN);

DayOfWeek.SUNDAY.getDisplayName(TextStyle.FULL, Locale.KOREAN);
DayOfWeek.SUNDAY.getDisplayName(TextStyle.SHORT, Locale.KOREAN);
DayOfWeek.SUNDAY.getDisplayName(TextStyle.NARROW, Locale.KOREAN);

// English output
Month.FEBRUARY.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
Month.FEBRUARY.getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
Month.FEBRUARY.getDisplayName(TextStyle.NARROW, Locale.ENGLISH);

DayOfWeek.SUNDAY.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
DayOfWeek.SUNDAY.getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
DayOfWeek.SUNDAY.getDisplayName(TextStyle.NARROW, Locale.ENGLISH);
```
