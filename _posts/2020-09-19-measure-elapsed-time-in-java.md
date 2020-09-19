---
layout:   post
title:    "자바에서 코드 실행 시간을 측정하는 방법"
author:   Kimtaeng
tags:     currenttimemillis nanotime stopwatch
description: "자바에서 코드가 수행되는 데 걸린 시간을 측정하려면 어떻게 해야 할까?" 
category: Java
date: "2020-09-19 22:18:43"
comments: true
---

# currentTimeMillis
먼저 `currentTimeMillis` 메서드를 사용해볼 수 있다. UTC인 1970년 1월 1일 자정부터 현재까지 카운트된 시간을 1/1000초인
밀리초(milliseconds) 단위로 표시한다. `currentTimeMillis`의 출력값을 `Date`로 변환하면 현재 날짜를 구할 수 있다.

```java
long start = System.currentTimeMillis();
// ... 로직 생략
long end = System.currentTimeMillis();
System.out.println("수행시간: " + (end - start) + " ms");
```

사실 `currentTimeMillis`는 성능 측정을 위한 코드의 수행 시간을 기록하기에는 적합하지 않을 수 있다. **wall-clock time**이기 때문에
다른 작업의 영향을 받거나 시스템의 시간을 변경하는 경우 등 측정 결과에 영향을 줄 수 있는 요소들이 있기 때문이다.

따라서 날짜와 관련한 계산을 위해 사용하는 것이 적합하며, 코드의 수행 시간 측정은 이어서 살펴볼 `nanoTime`를 사용하는 것이 더 정확하다.

<br>

# nanoTime
`nanoTime`은 기준이 되는 시점에서 경과된 시간을 나노초(nanoseconds) 단위로 측정한다. 앞서 살펴본 `currentTimeMillis`와 
코드 구성은 같지만 시스템이나 **wall-clock time**에 관련이 없는 것이 차이점이다.

```java
long start = System.nanoTime();
// ... 로직 생략
long end = System.nanoTime();
System.out.println("수행시간: " + (end - start) + " ns");
```

한 가지 주의할 점은 **JVM(Java Virtual Machine)을 기준으로 측정**하기 때문에 서로 다른 JVM에서는 측정 결과가 발생할 수 있다.
즉, 같은 서버에 측정하는 것은 이슈가 없으나, 서로 다른 서버에서 측정할 때는 측정 결과가 서로 다를 수 있다.

<br>

# Instant
`Instant` 클래스는 타임라인의 한 시점을 나타낸다. 타임스탬프는 UTC인 1970년 1월 1일 자정을 0으로 하여, 그 이후 경과된 시간을
양수 또는 음수로 표현한다. `Instant` 클래스의 `between` 메서드를 이용하면 두 `Instant` 객체 사이의 기간을 얻을 수 있다.
반환값은 `Duration`인데 이를 `toMillis` 메서드를 이용해 밀리초(milliseconds)로 변환하면 된다.

```java
Instant start = Instant.now();
// ... 로직 생략
Instant end = Instant.now();
System.out.println("수행시간: " + Duration.between(start, end).toMillis() + " ms");
```

<br>

# StopWatch
다음으로 라이브러리를 이용하는 방법이다. 아파치의 `commons-lang3` 패키지에 포함되어 있는 `StopWatch` 클래스가 있다.

```java
StopWatch stopWatch = new StopWatch();
stopWatch.start();
// ... 로직 생략
stopWatch.stop();
System.out.println("수행시간: " + stopWatch.getTime() + " ms");
```

스프링 프레임워크에서도 `StopWatch` 클래스를 제공한다. 
참고로 아파치와 스프링 프레임워크의 `StopWatch` 클래스 모두 스레드 안전(`thread-safe`)하지 않는 점에 유의하자.

```java
StopWatch stopWatch = new StopWatch();
stopWatch.start();
// ... 로직 생략
stopWatch.stop();
System.out.println(stopWatch.prettyPrint());
```

스프링 프레임워크의 `StopWatch` 클래스에는 `prettyPrint` 메서드가 있는데, 이를 사용하면 메서드 이름처럼 예쁜(?) 출력을 볼 수 있다.

```bash
StopWatch '': running time = 3768817 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
003768817  100% 
```

사용법이 간단하고 수행 시간 측정을 위한 부수적인 메서드를 제공하기 때문에 `StopWatch` 클래스가 가장 활용도가 높다.