---
layout:   post
title:    Java 8 날짜와 시간 계산 
author:   Kimtaeng
tags: 	  java date 자바날짜계산
description: 자바 8에서 추가된 날짜 관련 클래스(LocalDate, LocalDateTime)로 날짜와 시간을 계산해보자. 
category: Java
comments: true
---

# java.time 패키지
JDK 1.8 버전에서 `java.time` 패키지에 `LocalDateTime`과 타임존 개념까지 포함할 수 있는 `ZonedDateTime`이 추가되었다.
따라서 이전보다 안전하고 편하게 날짜를 계산할 수 있다.

- <a href="/post/reasons-why-javas-date-and-calendar-was-bad" target="_blank">
참고 링크: Java Date와 Time 클래스를 사용하면 안되는 이유</a>

<br/>

# 날짜 가져오기
`LocalDate` 클래스는 년, 월, 일 정보만을 가지며 `LocalTime`은 시, 분, 초 정보만을 가진다.
그리고 `LocalDateTime` 클래스는 이름으로부터 유추되는 것처럼 두 개의 클래스가 각각 갖는 정보를 모두 가지고 있다.

```java
// 오늘 날짜, 2018-12-11
LocalDate nowDate = LocalDate.now();

// 2018년 12월 11일, 2018-12-11
LocalDate ofDate = LocalDate.of(2018, 12, 11);

// 바로 지금, 2018-12-11T13:12:11
LocalDateTime nowDateTime = LocalDateTime.now();

// 2018년 12월 11일 15시 23분 32초, 2018-12-11T15:23:32
LocalDateTime ofDateTime = LocalDateTime.of(2018, 12, 11, 15, 23, 32);
```

<br/><br/>

# 특정 날짜/시간 가져오기

### 오늘 자정(0시 0분 0초) 가져온 후 문자열 변환 
```java
// 오늘 날짜의 자정(midnight)
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

// 2018-12-12 00:00:00.000
String date = LocalDate.now().atStartOfDay().format(formatter);
```

### 내일 날짜 가져오기
```java
// 2018년 12월 11일 15시 23분 32초, 2018-12-11T15:23:32
LocalDateTime ofDateTime = LocalDateTime.of(2018, 12, 11, 15, 23, 32);

// 2018년 12월 12일 15시 23분 32초, 2018-12-12T15:23:32
LocalDateTime tomorrow = ofDateTime.plusDays(1);
```

### 내일 날짜의 마지막 시간 가져오기
```java
// 2018년 12월 12일 23시 59분 59초
// 정확히는~ 23:59:59.999999999
LocalDateTime.now().plusDays(1).with(LocalTime.MAX);
```

### 정오(오전 12시)
```java
// 오늘 날짜의 정오(오전 12시)
LocalDateTime.now().with(LocalTime.NOON);
```

<br/><br/>

# 날짜 변환하기
날짜 정보를 문자열로 변환하거나 `Date`와 같은 구 버전의 날짜 클래스를 java 8 클래스로 변환할 수 있다.

###  Date to LocalDateTime
```java
// java.util.Date to java.time.LocalDateTime
LocalDateTime.ofInstant(new Date().toInstant(), ZoneId.systemDefault());
```

### LocalDate to LocalDateTime
```java
// java.time.LocalDate to java.time.LocalDateTime
// 오늘 날짜, 15시 23분 30초
LocalDate.now().atTime(15, 23, 30);

// 오늘 날짜, 자정(0시)
LocalDate.now().atStartOfDay();
```

### LocalDateTime to String
```java
// java.time.LocalDateTime to java.lang.String
// 2018-12-11 13:53:21.121
LocalDateTime.now()
    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));
```

### LocalDateTime to String
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

# 요일 다루기
가장 가까운 요일, N 번째 요일 등을 간단한 코드로 가져올 수 있다.

### 오는 일요일(가장 가까운 다음 일요일)
```java
// 12월 11일 기준, 오는 일요일은 12월 16일
LocalDateTime.now().with(TemporalAdjusters.next(DayOfWeek.SUNDAY))
```

### 2018년 12월의 4번째 일요일
```java
// 2018년 12월 기준, 네 번째 일요일은 23일
LocalDate.of(2018, 12, 11).with(TemporalAdjusters.dayOfWeekInMonth(4, DayOfWeek.SUNDAY));
```

### 2018년 12월의 첫 번째 일요일
```java
// 2018년 12월 기준, 첫 번째 일요일은 2일
LocalDate.of(2018, 12, 11).with(TemporalAdjusters.firstInMonth(DayOfWeek.SUNDAY));
```

<br/><br/>

## 언어별 표기 출력
각 나라의 언어별로 월이나 요일 표기도 가능하다.

```java
// 한국어 표기
Month.FEBRUARY.getDisplayName(TextStyle.FULL, Locale.KOREAN); // 2월
Month.FEBRUARY.getDisplayName(TextStyle.NARROW, Locale.KOREAN); // 2월
Month.FEBRUARY.getDisplayName(TextStyle.SHORT, Locale.KOREAN); // 2월

DayOfWeek.SUNDAY.getDisplayName(TextStyle.FULL, Locale.KOREAN); // 일요일
DayOfWeek.SUNDAY.getDisplayName(TextStyle.SHORT, Locale.KOREAN); // 일
DayOfWeek.SUNDAY.getDisplayName(TextStyle.NARROW, Locale.KOREAN); // 일

// 영어 표기
Month.FEBRUARY.getDisplayName(TextStyle.FULL, Locale.ENGLISH); // February
Month.FEBRUARY.getDisplayName(TextStyle.SHORT, Locale.ENGLISH); // Feb
Month.FEBRUARY.getDisplayName(TextStyle.NARROW, Locale.ENGLISH); // F

DayOfWeek.SUNDAY.getDisplayName(TextStyle.FULL, Locale.ENGLISH); // Sunday
DayOfWeek.SUNDAY.getDisplayName(TextStyle.SHORT, Locale.ENGLISH); // Sun
DayOfWeek.SUNDAY.getDisplayName(TextStyle.NARROW, Locale.ENGLISH); // S
```