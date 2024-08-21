---
layout: post
title: "Java Virtual Thread: 성능 측정과 적용 기준"
author: madplay
tags: java virtual-thread jmh benchmark performance concurrency
description: "JMH로 Virtual Thread의 I/O와 CPU 작업 성능을 직접 측정했다. 플랫폼 스레드와의 수치 비교, CPU 작업에서의 한계, 워크로드별 적용 기준을 정리한다."
category: Java/Kotlin
date: "2024-08-22 08:43:19"
comments: true
series: "Virtual Thread"
---

# Virtual Thread 시리즈 목차

- <a href="/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: 소개와 동작 원리</a>
- <a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Pinning 발생 원인과 대응</a>
- **Java Virtual Thread: 성능 측정과 적용 기준**
- <a href="/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot 적용과 주의사항</a>
- <a href="/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교</a>

<br>

# "빠르다"는 말을 믿기 전에

앞 편들에서 Virtual Thread의 원리와 Pinning 문제를 살펴봤다.
Virtual Thread가 빠르다는 이야기는 많지만, 어느 조건에서 빠른지는 직접 측정해 보기 전에는 감이 잡히지 않는다.
이번 편에서는 JMH(Java Microbenchmark Harness)로 실제 수치를 측정해 본 결과를 정리한다.

기준은 Java 21, 측정 환경은 8코어 머신이다.
Virtual Thread 스케줄러의 carrier thread 수는 기본적으로 코어 수와 같아서, CPU 위주 시나리오에서는 플랫폼 스레드 풀 8개와 비교하는 것이 적절하다.

<br>

# 측정 환경과 시나리오

## JMH란

JMH는 JVM 기반 마이크로벤치마크 도구다.
JIT 컴파일 영향을 줄이기 위한 워밍업, GC 영향 제거, 반복 측정 같은 벤치마크 변수를 자동으로 처리해 준다.

```groovy
dependencies {
    testImplementation 'org.openjdk.jmh:jmh-core:1.37'
    annotationProcessor 'org.openjdk.jmh:jmh-generator-annprocess:1.37'
}
```

## 시나리오 설계

두 가지 시나리오로 나눠서 측정한다.

**시나리오 A: I/O 대기 위주 (뉴스레터 발송 시뮬레이션)**

각 작업이 50ms 동안 블로킹된다.
SMTP 응답 대기를 `Thread.sleep(50)`으로 단순화했다.
총 500건의 발송 작업을 처리하는 시간을 측정한다.

**시나리오 B: CPU 위주 (해시 계산)**

각 작업이 SHA-256 해시를 50만 번 반복 계산한다.
블로킹 없이 CPU를 계속 사용한다.
총 500건의 작업 처리 시간을 측정한다.

## 비교 대상

- **플랫폼 스레드 풀 (200개)**: `Executors.newFixedThreadPool(200)`
- **플랫폼 스레드 풀 (8개)**: 코어 수와 동일한 작은 풀
- **Virtual Thread**: `Executors.newVirtualThreadPerTaskExecutor()`

<br>

# 시나리오 A: I/O 대기 위주 벤치마크

## 코드

주요 JMH 어노테이션의 역할은 다음과 같다.

- `@BenchmarkMode(Mode.AverageTime)`: 반복 실행의 평균 처리 시간을 측정한다.
- `@Warmup` / `@Measurement`: 워밍업 3회 후 측정 5회를 수행한다. JIT 컴파일이 안정된 상태에서 측정하기 위해 워밍업 단계를 거친다.
- `@State(Scope.Benchmark)`: 벤치마크 인스턴스를 전체 측정 구간에서 공유한다.

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(1)
@State(Scope.Benchmark)
public class NewsletterDispatchBenchmark {

    private static final int TASK_COUNT = 500;
    private static final long IO_DELAY_MS = 50;

    @Benchmark
    public void platformThread_pool200() throws InterruptedException {
        runWithExecutor(Executors.newFixedThreadPool(200));
    }

    @Benchmark
    public void platformThread_pool8() throws InterruptedException {
        runWithExecutor(Executors.newFixedThreadPool(8));
    }

    @Benchmark
    public void virtualThread() throws InterruptedException {
        runWithExecutor(Executors.newVirtualThreadPerTaskExecutor());
    }

    private void runWithExecutor(ExecutorService executor) throws InterruptedException {
        try (executor) {
            CountDownLatch latch = new CountDownLatch(TASK_COUNT);
            for (int i = 0; i < TASK_COUNT; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(IO_DELAY_MS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        latch.countDown();
                    }
                });
            }
            latch.await();
        }
    }
}
```

`try-with-resources`의 `close()`는 내부적으로 `shutdown()` 후 `awaitTermination()`을 호출해 모든 작업이 끝날 때까지 기다린다.
`CountDownLatch` 없이도 동일하게 동작하지만, 태스크 완료 시점을 코드에서 명시적으로 드러내기 위해 함께 사용했다.

## 결과

| 실행 방식 | 평균 처리 시간 |
|---|---|
| 플랫폼 스레드 풀 (8개) | 약 3,150ms |
| 플랫폼 스레드 풀 (200개) | 약 178ms |
| Virtual Thread | 약 54ms |

플랫폼 스레드 풀 8개: 500건을 8개 스레드가 처리하므로 약 63 라운드가 필요하고, 라운드마다 50ms씩 걸려 3초를 넘는다.

플랫폼 스레드 풀 200개: 200개씩 처리하므로 3 라운드, 약 150ms에 오버헤드가 더해진다.

Virtual Thread: 500개 Virtual Thread가 동시에 시작하고, 각자 carrier를 양보하면서 50ms 대기 후 완료한다.
이론적 최솟값인 50ms에 근접한다.

<br>

# 시나리오 B: CPU 위주 벤치마크

## 코드

`MessageDigest`는 스레드 안전하지 않아 단일 인스턴스를 여러 스레드가 공유하면 race condition이 발생한다.
각 태스크 안에서 인스턴스를 생성해야 한다.

```java
@Benchmark
public void platformThread_cpuBound() throws InterruptedException {
    runCpuTaskWithExecutor(Executors.newFixedThreadPool(8));
}

@Benchmark
public void virtualThread_cpuBound() throws InterruptedException {
    runCpuTaskWithExecutor(Executors.newVirtualThreadPerTaskExecutor());
}

private void runCpuTaskWithExecutor(ExecutorService executor) throws InterruptedException {
    try (executor) {
        CountDownLatch latch = new CountDownLatch(TASK_COUNT);
        for (int i = 0; i < TASK_COUNT; i++) {
            executor.submit(() -> {
                try {
                    MessageDigest digest = MessageDigest.getInstance("SHA-256");
                    for (int j = 0; j < 500_000; j++) {
                        digest.update(new byte[]{(byte) j});
                    }
                } catch (NoSuchAlgorithmException e) {
                    throw new RuntimeException(e);
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await();
    }
}
```

## 결과

| 실행 방식 | 평균 처리 시간 |
|---|---|
| 플랫폼 스레드 풀 (8개) | 약 6,200ms |
| Virtual Thread | 약 6,350ms |

Virtual Thread와 플랫폼 스레드 풀 8개의 결과가 거의 같다.
Virtual Thread가 더 빠르지 않다.

**CPU 위주 작업에서는 blocking이 없으므로 unmount가 일어날 기회도 없다.**
8코어 머신에서 8개의 carrier thread가 계속 작업을 실행하는 구조이므로, 플랫폼 스레드 풀 8개와 사실상 동일한 병렬 처리 수준이다.
Virtual Thread 생성과 스케줄링 오버헤드가 소폭 추가되어 오히려 약간 느릴 수도 있다.

<br>

# 결과가 말하는 것

## I/O 대기 작업에서의 이득

I/O 대기 시나리오에서 Virtual Thread는 스레드 풀 200개보다도 빨랐다.
핵심은 스레드 수가 아니라 대기 시간의 낭비 여부다.
플랫폼 스레드는 대기 중에도 메모리를 점유하고 OS 스케줄러에 등록된 상태로 남는다.
Virtual Thread는 대기 중 carrier를 반환하고 힙에만 남는다.

## CPU 위주 작업에서의 한계

CPU 위주 작업에서 병렬 처리의 상한은 물리 코어 수다.
Virtual Thread가 아무리 많아도 동시에 실행 가능한 수는 carrier 수, 즉 코어 수와 같다.
이 경우 플랫폼 스레드 풀을 코어 수에 맞춰 사용하는 것이 오히려 적합하다.

## 실무에서의 적용 기준

| 워크로드 유형 | 권장 방식 |
|---|---|
| 외부 API 호출, DB 쿼리, 메시지 대기 | Virtual Thread |
| 이미지 처리, 암호화, 데이터 변환 | 플랫폼 스레드 풀 (코어 수 기준) |
| I/O + 경량 CPU 혼합 | Virtual Thread (대부분의 웹 서비스 패턴) |

대부분의 백엔드 웹 서비스는 DB 쿼리, 외부 API 호출, 캐시 조회가 주를 이루는 I/O 대기 패턴이라 Virtual Thread의 이득을 보기 좋다.

<br>

# 정리하며

수치로 보면 기대만큼, 혹은 그 이상이다. 특히 I/O 대기 작업에서 Virtual Thread가 스레드 풀 200개보다 빠른 이유는
스레드를 더 많이 쓰기 때문이 아니라 대기 시간에 carrier를 낭비하지 않기 때문이라고 생각한다.

그리고 CPU 위주 작업에서는 기대를 내려놓는 것이 맞다. 코어를 더 사야 해결되는 문제를 Virtual Thread가 해결해 주지는 않는다.

다음 편에서는 Spring Boot 3.2+에서 Virtual Thread를 실제로 어떻게 활성화하고, 주의할 설정이 무엇인지 살펴본다.

- <a href="/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot 적용과 주의사항</a>
