---
layout: post
title: "Java Virtual Thread: Pinning 발생 원인과 대응"
author: madplay
tags: java virtual-thread pinning synchronized threadlocal jdk21
description: "synchronized 블록에서 blocking I/O가 발생하면 carrier가 묶이는 Pinning이 일어난다. tracePinnedThreads와 JFR로 진단하고 ReentrantLock으로 전환하는 방법, ThreadLocal 사용 시 주의사항까지 정리한다."
category: Java/Kotlin
date: "2024-04-18 21:34:07"
comments: true
series: "Virtual Thread"
---

# Virtual Thread 시리즈 목차

- <a href="/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: 소개와 동작 원리</a>
- **Java Virtual Thread: Pinning 발생 원인과 대응**
- <a href="/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: 성능 측정과 적용 기준</a>
- <a href="/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot 적용과 주의사항</a>
- <a href="/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교</a>

<br>

# carrier가 묶이는 경우

<a href="/post/java-virtual-thread-introduction" target="_blank">앞 편</a>에서 Virtual Thread의 핵심 원리를 살펴봤다.
blocking I/O를 만나면 carrier에서 내려오고, carrier는 즉시 다른 Virtual Thread를 태운다.
5만 개의 발송 작업이 소수의 carrier 위에서 교대로 실행되는 구조였다.

그런데 이 구조가 깨지는 경우가 있다. blocking I/O를 만났는데 carrier가 내려오지 못하고 그대로 묶여버리는 상황이다.
**이를 Pinning이라고 부른다.**

<br>

# Pinning이란 무엇인가

Pinning은 Virtual Thread가 carrier thread에서 unmount되지 못하고 고정된 상태를 말한다.

일반적인 흐름에서는 Virtual Thread가 blocking I/O를 만나면 unmount하고, carrier는 다른 작업을 이어받는다.
Pinning이 발생하면 Virtual Thread가 I/O를 기다리는 동안 carrier도 함께 블로킹된다.
carrier 수는 CPU 코어 수에 비례하는데, Pinning이 여러 곳에서 겹치면 모든 carrier가 묶혀버린다.
이 상태에서는 다른 Virtual Thread들이 실행 기회를 얻지 못해 처리량이 급격히 떨어진다.

## Pinning이 발생하는 상황

두 가지 주요 원인이 있다.

- 첫째, `synchronized` 블록 또는 메서드 안에서 blocking I/O가 발생할 때다.
- 둘째, JNI를 통한 native 코드 실행 중 blocking이 발생할 때다.

이 글에서는 실무에서 더 자주 마주치는 `synchronized` 케이스를 중점적으로 다룬다.

<br>

# synchronized가 Pinning을 일으키는 이유

## 코드로 보는 Pinning

`NewsletterDispatcher`에서 `synchronized`를 사용하는 경우를 보자.

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;
    private int dispatchCount = 0;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public synchronized void dispatch(Subscriber subscriber, Newsletter newsletter) {
        mailClient.send(subscriber.email(), newsletter); // blocking I/O
        dispatchCount++;
    }
}
```

`synchronized` 메서드 안에서 `mailClient.send()`가 호출된다.
SMTP 응답을 기다리는 동안 이 Virtual Thread는 carrier에서 내려오지 못한다.
모니터 락이 `synchronized` 블록 진입 시 carrier thread에 귀속되기 때문이다.

## JVM이 이렇게 동작하는 이유

`synchronized`는 JVM 스펙에서 monitor lock을 OS 스레드와 연결하도록 정의되어 있다.
Virtual Thread가 unmount되면 carrier가 바뀔 수 있는데, 이 경우 어느 OS 스레드가 모니터를 소유하는지 모호해진다.
JVM은 이를 피하기 위해 `synchronized` 블록 안에서는 unmount를 허용하지 않는다.

> Java 24(JEP 491)에서 이 제약이 해소된다.
> JDK 21~23 기준에서는 `synchronized` 안에서 blocking이 발생하면 Pinning이 일어난다.

<br>

# Pinning 진단하기

## -Djdk.tracePinnedThreads

JVM 옵션으로 Pinning 발생 시 스택 트레이스를 출력할 수 있다.

```
-Djdk.tracePinnedThreads=short
```

`short`는 Pinning을 일으킨 프레임만 출력하고, `full`은 전체 스택 트레이스를 출력한다.
개발 환경에서 Pinning 여부를 확인할 때 `short`부터 시작하면 충분하다.

출력 예시:

```
Thread[#25,ForkJoinPool-1-worker-1,5,CarrierThreads]
    com.example.NewsletterDispatcher.dispatch(NewsletterDispatcher.java:12) <== monitors:1
```

`monitors:1`은 모니터 락을 1개 보유한 채 blocking 중임을 나타낸다.

## JDK Flight Recorder

운영 환경에서는 JFR(JDK Flight Recorder)의 `jdk.VirtualThreadPinned` 이벤트를 통해 Pinning을 추적할 수 있다.
JFR은 JDK에 내장된 저오버헤드 프로파일링 도구로, 항상 켜두거나 특정 구간에만 활성화하는 방식으로 쓸 수 있다.

JFR 기록을 시작하려면 JVM 옵션을 추가한다.

```
-XX:StartFlightRecording=filename=recording.jfr,settings=default
```

기록이 끝난 뒤 Pinning 이벤트만 걸러서 출력할 수 있다.

```bash
jfr print --events jdk.VirtualThreadPinned recording.jfr
```

출력 예시:

```
jdk.VirtualThreadPinned {
  startTime = 2024-04-18T10:15:00.123456789Z
  duration = 523.1 ms
  eventThread = "ForkJoinPool-1-worker-1" (javaThreadId = 25)
  stackTrace = [
    com.example.NewsletterDispatcher.dispatch(NewsletterDispatcher.java:12)
    ...
  ]
}
```

`duration`이 길다면 carrier가 그 시간 동안 묶여 있었다는 의미다.
이 값이 크거나 자주 나타난다면 처리량 저하의 직접 원인이 될 수 있다.

`-Djdk.tracePinnedThreads`는 개발 환경에서 즉각 확인하는 데 적합하고, JFR은 운영 환경에서 장기 추적에 적합하다.
두 도구를 병행하면 Pinning 발생 위치와 영향을 더 정확히 파악할 수 있다.

<br>

# 해결 방법

## ReentrantLock으로 전환

`synchronized` 대신 `java.util.concurrent.locks.ReentrantLock`을 사용하면 Pinning 없이 Virtual Thread와 락을 함께 쓸 수 있다.
`ReentrantLock`은 JVM 모니터를 직접 사용하지 않고 JVM 수준의 파킹 메커니즘을 이용하므로, blocking 중에도 carrier가 unmount될 수 있다.

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;
    private final ReentrantLock lock = new ReentrantLock();
    private int dispatchCount = 0;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(Subscriber subscriber, Newsletter newsletter) {
        lock.lock();
        try {
            mailClient.send(subscriber.email(), newsletter); // blocking I/O
            dispatchCount++;
        } finally {
            lock.unlock();
        }
    }
}
```

## 락 범위 최소화

위 코드는 `dispatch()` 전체를 락으로 감싸고 있어 병목이 된다.
실제로 보호가 필요한 부분은 `dispatchCount++` 같은 상태 변경뿐이다.
blocking I/O를 락 밖으로 꺼내면 Pinning 위험을 줄이면서 병렬성도 높아진다.

```java
public void dispatch(Subscriber subscriber, Newsletter newsletter) {
    mailClient.send(subscriber.email(), newsletter); // 락 밖에서 I/O

    lock.lock();
    try {
        dispatchCount++;
    } finally {
        lock.unlock();
    }
}
```

이 구조에서는 여러 Virtual Thread가 동시에 `mailClient.send()`를 실행하고, 카운터 갱신 시에만 순차적으로 진입한다.

## 라이브러리 내부의 synchronized

직접 작성한 코드에서는 `synchronized`를 제거하거나 범위를 좁힐 수 있다.
하지만 의존하는 라이브러리가 내부적으로 `synchronized`를 사용하는 경우는 직접 바꾸기 어렵다.

이 경우 선택지는 세 가지다.

- 해당 라이브러리의 최신 버전에서 수정됐는지 확인한다. Hibernate나 일부 커넥션 풀 구현체는 이미 패치된 버전이 있다.
- 해당 라이브러리 호출을 별도 스레드 풀로 격리해 carrier 고갈이 전체 처리에 미치는 영향을 줄인다.
- Java 24 이상으로 업그레이드를 검토한다.

<br>

# ThreadLocal 사용 시 주의사항

## Virtual Thread와 ThreadLocal의 관계

플랫폼 스레드 풀에서는 스레드가 재사용된다. 작업이 끝나도 스레드 풀에 반환되고, 다음 작업이 같은 스레드를 가져간다.
ThreadLocal에 저장된 값이 의도치 않게 다음 작업에 남아있는 문제가 생기기도 한다.

Virtual Thread는 작업마다 새 스레드를 생성한다. ThreadLocal 오염 문제는 없지만, 대신 매번 초기화 비용이 발생한다.
무거운 객체를 ThreadLocal에 저장하고 Virtual Thread를 수만 개 생성하면 힙 메모리 압박이 생긴다.

## MDC 사용 시 주의

로깅 프레임워크의 MDC(Mapped Diagnostic Context)는 내부적으로 ThreadLocal을 사용한다.
Virtual Thread 환경에서 MDC는 정상 작동하지만, 작업이 끝날 때 명시적으로 `MDC.clear()`를 호출하지 않으면 해당 Virtual Thread의 ThreadLocal에 값이 남는다.
Virtual Thread가 재사용될 가능성이 없어 실질적 오염은 없지만, 메모리 관점에서 정리하는 습관이 좋다.

```java
executor.submit(() -> {
    MDC.put("subscriberId", subscriber.id());
    try {
        mailClient.send(subscriber.email(), newsletter);
    } finally {
        MDC.clear();
    }
});
```

<br>

# 정리하며

Virtual Thread가 blocking I/O에서 carrier를 양보한다는 원리는 `synchronized` 앞에서 멈춘다.
`synchronized` 블록 안에서 blocking이 일어나면 모니터 락 귀속 문제 때문에 carrier가 묶인다는 걸 알고 있으면, 코드를 짤 때 판단이 빨라지는 것 같다.

실제로 마주치는 상황은 직접 작성한 코드보다 라이브러리 내부의 `synchronized` 메서드가 더 많다.
`-Djdk.tracePinnedThreads=short`로 먼저 어디서 Pinning이 발생하는지 확인하는 게 첫 번째 단계라고 생각한다.

다음 편에서는 Virtual Thread가 I/O 집약 워크로드에서 실제로 얼마나 빠른지 JMH로 측정해 본다.

- <a href="/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: 성능 측정과 적용 기준</a>
