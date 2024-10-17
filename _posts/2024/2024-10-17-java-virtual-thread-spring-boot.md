---
layout: post
title: "Java Virtual Thread: Spring Boot 적용과 주의사항"
author: madplay
tags: java virtual-thread spring-boot tomcat async threadlocal
description: "spring.threads.virtual.enabled=true 한 줄로 Spring Boot에서 Virtual Thread를 활성화할 수 있다. Tomcat, @Async 동작 방식과 MDC, 커넥션 풀 주의사항을 정리한다."
category: Java/Kotlin
date: "2024-10-17 22:08:53"
comments: true
series: "Virtual Thread"
---

# Virtual Thread 시리즈 목차

- <a href="/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: 소개와 동작 원리</a>
- <a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Pinning 발생 원인과 대응</a>
- <a href="/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: 성능 측정과 적용 기준</a>
- **Java Virtual Thread: Spring Boot 적용과 주의사항**
- <a href="/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교</a>

<br>

# Spring Boot에 적용하기

이번에는 실제 Spring Boot 애플리케이션에 적용하는 방법에 대해서 알아보자.

Spring Boot 3.2가 2023년 11월 출시되면서 Virtual Thread 지원이 자동 설정으로 들어왔다.
설정 한 줄이면 Tomcat, `@Async`, `TaskExecutor`가 모두 Virtual Thread로 전환된다.

> 버전 기준은 Spring Boot 3.2, Java 21이다.

<br>

# 활성화 설정

## application.yml

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

이 설정을 추가하면 Spring Boot Auto Configuration이 다음을 자동으로 처리한다.

- **Tomcat**: 요청 처리 스레드를 Virtual Thread로 전환
- **@Async**: 비동기 작업에 Virtual Thread 기반 Executor 사용
- **SimpleAsyncTaskExecutor**: Virtual Thread 기반으로 설정

## Gradle 의존성

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    // Java 21 이상 필요, 별도 의존성 추가 불필요
}
```

Virtual Thread는 Java 21 표준 기능이므로 별도 라이브러리 없이 JDK 버전만 맞으면 된다.

<br>

# Tomcat 동작 확인

설정 적용 후 요청을 처리하는 스레드 이름을 확인해 본다.

```java
@RestController
public class NewsletterController {

    @GetMapping("/dispatch/status")
    public String status() {
        return Thread.currentThread().toString();
    }
}
```

`spring.threads.virtual.enabled=false`일 때 응답:

```
Thread[http-nio-8080-exec-1,5,main]
```

`spring.threads.virtual.enabled=true`일 때 응답:

```
VirtualThread[#42]/runnable@ForkJoinPool-1-worker-3
```

요청마다 새 Virtual Thread가 생성되고, carrier thread는 ForkJoinPool 워커가 담당한다.

<br>

# @Async와 Virtual Thread

## 기본 동작

`spring.threads.virtual.enabled=true` 상태에서 `@Async`를 사용하면 별도 설정 없이 Virtual Thread를 사용한다.

```java
@Service
public class NewsletterService {

    private final MailClient mailClient;

    public NewsletterService(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    @Async
    public CompletableFuture<Void> dispatchAsync(Subscriber subscriber, Newsletter newsletter) {
        mailClient.send(subscriber.email(), newsletter);
        return CompletableFuture.completedFuture(null);
    }
}
```

## TaskExecutor 커스터마이징

처리량 제어나 로그 추적이 필요할 때는 `TaskExecutor`를 직접 구성한다.
`Thread.ofVirtual().name(...).factory()`로 이름 패턴을 지정하고, `Executors.newThreadPerTaskExecutor()`에 넘기면 태스크마다 해당 이름의 Virtual Thread를 생성하는 Executor가 만들어진다.

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "newsletterExecutor")
    public Executor newsletterExecutor() {
        ThreadFactory factory = Thread.ofVirtual()
                .name("newsletter-vt-", 0)
                .factory();
        return Executors.newThreadPerTaskExecutor(factory);
    }
}
```

```java
@Async("newsletterExecutor")
public CompletableFuture<Void> dispatchAsync(Subscriber subscriber, Newsletter newsletter) {
    mailClient.send(subscriber.email(), newsletter);
    return CompletableFuture.completedFuture(null);
}
```

스레드 이름에 `newsletter-vt-` 접두사가 붙어 로그 추적이 편리해진다.

<br>

# 주의사항

## synchronized와 Pinning

<a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">앞 편</a>에서 다뤘지만,
Spring이 의존하는 일부 라이브러리(구버전 Hibernate, 일부 커넥션 풀 구현체)가 내부적으로 `synchronized`를 사용한다.
`spring.threads.virtual.enabled=true`로 전환한 뒤 `-Djdk.tracePinnedThreads=short`를 붙여 Pinning 발생 여부를 확인하는 것이 좋다.

## MDC와 ThreadLocal

MDC는 내부적으로 ThreadLocal을 사용한다.
Virtual Thread 환경에서 MDC는 정상 작동하지만, 요청 간 ThreadLocal이 정리되지 않는 경우를 대비해 Filter나 Interceptor에서 `MDC.clear()`를 호출하는 패턴을 유지하는 것이 안전하다.

```java
@Component
public class MdcClearFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

## 커넥션 풀 크기

Virtual Thread 환경에서는 요청 처리 스레드 수가 사실상 무제한이 된다.
DB 커넥션 풀 크기가 작으면 Virtual Thread들이 커넥션을 기다리며 쌓인다.
커넥션 대기 중에는 Virtual Thread가 carrier를 양보하므로 서비스가 중단되지는 않지만, DB 쪽 부하가 커질 수 있다.
HikariCP의 `maximum-pool-size`를 적절히 조정해야 한다.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
```

Virtual Thread 수가 늘어난다고 커넥션 풀을 무작정 키울 필요는 없다.
DB 서버가 처리할 수 있는 동시 쿼리 수에 맞춰 설정하면 된다.

## @Scheduled는 자동 전환되지 않는다

`spring.threads.virtual.enabled=true`는 Tomcat과 `@Async`는 자동으로 전환하지만, `@Scheduled`는 해당되지 않는다.
`@Scheduled`를 Virtual Thread로 실행하려면 `TaskScheduler`를 별도로 구성해야 한다.

```java
@Configuration
public class SchedulerConfig {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadFactory factory = Thread.ofVirtual()
                .name("scheduler-vt-", 0)
                .factory();
        return new ConcurrentTaskScheduler(Executors.newScheduledThreadPool(1, factory));
    }
}
```

단, `ScheduledThreadPool`은 내부적으로 플랫폼 스레드 기반이므로 Virtual Thread와 완전히 동일한 동작을 기대하기는 어렵다.
`@Scheduled` 자체가 Virtual Thread에 적합한 구조인지 먼저 검토하는 것이 좋다.

## Hibernate 5.x의 Pinning 위험

Hibernate 5.x는 내부적으로 `synchronized`를 광범위하게 사용한다.
Spring Boot 3.x는 기본적으로 Hibernate 6.x를 사용하지만, 의존성을 명시적으로 낮춰 쓰는 프로젝트에서는 Pinning이 빈번하게 발생할 수 있다.

```
-Djdk.tracePinnedThreads=short
```

위 옵션으로 확인했을 때 `hibernate` 패키지가 스택에 보인다면 Hibernate 버전을 6.2 이상으로 올리는 것이 우선이다.
Hibernate 6.2+에서는 내부 락을 `ReentrantLock`으로 전환해 대부분의 Pinning이 해소된다.

## 동시 요청 폭발 주의

플랫폼 스레드 풀은 크기 자체가 동시 처리 수의 상한선이었다.
Virtual Thread는 무제한으로 생성되므로 외부 API나 DB로의 요청이 통제 없이 폭발적으로 늘어날 수 있다.
처리량 제어가 필요한 경우 `Semaphore`로 동시 실행 수를 명시적으로 제한하는 것이 좋다.

```java
@Service
public class NewsletterService {

    private final MailClient mailClient;
    private final Semaphore semaphore = new Semaphore(100);

    public NewsletterService(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(Subscriber subscriber, Newsletter newsletter) throws InterruptedException {
        semaphore.acquire();
        try {
            mailClient.send(subscriber.email(), newsletter);
        } finally {
            semaphore.release();
        }
    }
}
```

`Semaphore`의 대기는 Virtual Thread가 carrier를 양보하는 방식으로 처리되므로 Pinning 없이 안전하게 사용할 수 있다.

## WebFlux와 혼용 주의

`spring-boot-starter-webflux` 기반 프로젝트에서 Virtual Thread를 함께 활성화하면 Reactor의 비블로킹 모델과 의미가 겹친다.
Reactor는 소수의 스레드로 비블로킹 이벤트 루프를 돌리는 방식이고, Virtual Thread는 블로킹 코드를 경량화하는 방식으로 문제를 다르게 접근한다.
두 모델을 혼용하면 어느 쪽의 이점도 제대로 얻지 못할 수 있다.

Virtual Thread는 Servlet 스택(`spring-boot-starter-web`) 기반 프로젝트에서 활성화하는 것이 적합하다.

<br>

# 정리하며

`spring.threads.virtual.enabled=true` 한 줄이 실제로 꽤 많은 것을 바꾼다.
Tomcat 요청 처리, `@Async`, `TaskExecutor`가 모두 Virtual Thread로 전환된다.
기존 코드를 거의 수정하지 않고도 I/O 대기 작업에서의 처리량 개선을 기대할 수 있다는 게 장점이라고 생각한다.

다만 켜기 전에 Pinning 여부와 커넥션 풀 설정을 확인하는 과정이 빠지면 안 된다.
특히 레거시 라이브러리를 많이 사용하는 프로젝트라면 `tracePinnedThreads`로 먼저 점검하는 게 순서다.

다음 편에서는 Virtual Thread와 같은 목표를 다른 방식으로 접근하는 Kotlin Coroutine, WebFlux를 비교해 본다.

- <a href="/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교</a>
