---
layout: post
title: "Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교"
author: madplay
tags: java virtual-thread kotlin coroutine webflux reactor concurrency comparison
description: "Virtual Thread, Kotlin Coroutine, WebFlux(Reactor)의 구조적 차이를 코드로 비교한다. 중단 방식, 취소 전파, 컨텍스트 전파, 선택 기준까지 정리한다."
category: Java/Kotlin
date: "2024-12-19 20:57:31"
comments: true
series: "Virtual Thread"
---

# Virtual Thread 시리즈 목차

- <a href="/post/java-virtual-thread-introduction" target="_blank">Java Virtual Thread: 소개와 동작 원리</a>
- <a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Pinning 발생 원인과 대응</a>
- <a href="/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: 성능 측정과 적용 기준</a>
- <a href="/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot 적용과 주의사항</a>
- **Java Virtual Thread: Coroutine, WebFlux와 비교**

<br>

# 같은 목표, 다른 방법

Java 21에서 Virtual Thread가 정식으로 들어온 뒤 "그러면 Kotlin Coroutine은 필요 없어지는 건 아닌가"라는 이야기가 나왔다.
여기에 Spring WebFlux(Project Reactor)까지 더하면 같은 문제를 세 가지 다른 방법으로 푸는 구조가 된다.

- **Virtual Thread**: JVM 런타임이 제공하는 기능. 블로킹 코드를 그대로 쓰면서 처리량을 높인다.
- **Kotlin Coroutine**: 언어 수준의 기능. `suspend` 함수와 코루틴 빌더로 비동기 흐름을 표현한다.
- **WebFlux (Reactor)**: 리액티브 프로그래밍 모델. `Mono`/`Flux`로 비블로킹 파이프라인을 구성한다.

이 편에서는 뉴스레터 발송 예시를 세 방식으로 구현하면서 구조적 차이를 살펴본다.

<br>

# 코드 스타일 비교

## Virtual Thread (Java)

```java
public class NewsletterDispatcher {

    private final MailClient mailClient;

    public NewsletterDispatcher(MailClient mailClient) {
        this.mailClient = mailClient;
    }

    public void dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (Subscriber subscriber : subscribers) {
                executor.submit(() -> mailClient.send(subscriber.email(), newsletter));
            }
        }
    }
}
```

`mailClient.send()`는 일반 블로킹 메서드다. 기존 블로킹 코드와 차이가 없다. Executor만 바꿨다.

## Kotlin Coroutine

```kotlin
class NewsletterDispatcher(private val mailClient: MailClient) {

    suspend fun dispatch(subscribers: List<Subscriber>, newsletter: Newsletter) {
        coroutineScope {
            subscribers.forEach { subscriber ->
                launch(Dispatchers.IO) {
                    mailClient.send(subscriber.email, newsletter)
                }
            }
        }
    }
}
```

`suspend` 키워드와 `coroutineScope`, `launch` 같은 코루틴 빌더가 등장한다.
`mailClient.send()`가 블로킹 호출이라면 `Dispatchers.IO`에서 실행해야 스레드를 효율적으로 사용한다.
`mailClient.send()`가 `suspend` 함수라면 `Dispatchers.IO` 없이 기본 디스패처에서 실행할 수 있고, 진정한 비블로킹 처리가 된다.

## WebFlux (Reactor)

```java
public class NewsletterDispatcher {

    private final ReactiveMailClient mailClient;

    public NewsletterDispatcher(ReactiveMailClient mailClient) {
        this.mailClient = mailClient;
    }

    public Mono<Void> dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
        return Flux.fromIterable(subscribers)
                .flatMap(subscriber -> mailClient.send(subscriber.email(), newsletter))
                .then();
    }
}
```

`ReactiveMailClient.send()`는 `Mono<Void>`를 반환하는 리액티브 API다.
`flatMap`으로 각 구독자에게 비동기 발송을 연결하고, 전체가 완료되면 `then()`으로 마무리한다.
블로킹 코드가 전혀 없다. 대신 API 전체가 리액티브 타입으로 바뀐다.

`flatMap`은 기본적으로 최대 256개 작업을 동시에 처리한다(`Queues.SMALL_BUFFER_SIZE`).
Virtual Thread처럼 태스크마다 즉시 시작하려면 `flatMap(f, Integer.MAX_VALUE)`로 동시성 제한을 풀어야 한다.
다만 기본값은 자연스러운 백프레셔 역할도 하므로 무작정 제거할 필요는 없다.

<br>

# 구조적 차이

세 방식이 어떻게 다른지 먼저 표로 정리하고, 각 항목을 자세히 살펴본다.

| 항목 | Virtual Thread | Kotlin Coroutine | WebFlux |
|---|---|---|---|
| 중단 방식 | JVM이 I/O 지점에서 자동 처리 | `suspend` 호출 지점에서 명시적 중단 | 오퍼레이터 체인, 중단 개념 없음 |
| 취소/타임아웃 | `StructuredTaskScope` (Preview) | `withTimeout` 자동 전파 | `.timeout()` 오퍼레이터 |
| 컨텍스트 전파 | `ScopedValue` (Preview) / ThreadLocal | `CoroutineContext` 자동 전파 | Reactor Context, 별도 브리지 필요 |
| 코드 스타일 | 기존 블로킹 코드 그대로 | `suspend` 함수 도입 | 선언형 리액티브 파이프라인 |
| 학습 비용 | 낮음 | 중간 | 높음 |

## 어디서 중단되는가

Virtual Thread는 블로킹 I/O 지점에서 JVM이 자동으로 carrier를 양보한다.
개발자가 중단 지점을 명시하지 않아도 된다.

Coroutine은 `suspend` 함수 호출 지점에서만 중단될 수 있다.
중단 가능한 지점이 코드에 명시적으로 드러난다.

**WebFlux는 중단이라는 개념이 없다.** `flatMap`, `map` 같은 오퍼레이터가 비블로킹 파이프라인을 구성하고, Reactor 스케줄러가 흐름을 처리한다.
코드 전체가 선언형으로 표현된다.

## 취소와 타임아웃

Coroutine은 구조적 동시성(Structured Concurrency)을 지원한다.
`coroutineScope`가 취소되면 그 안의 모든 `launch` 블록이 함께 취소된다.

```kotlin
withTimeout(5.seconds) {
    coroutineScope {
        subscribers.forEach { subscriber ->
            launch {
                mailClient.send(subscriber.email, newsletter)
            }
        }
    }
}
```

`withTimeout`은 `kotlin.time.Duration`을 파라미터로 받는다.
5초 안에 완료되지 않으면 `coroutineScope` 전체가 취소되고, 진행 중인 모든 자식 코루틴에 취소 신호가 전파된다.

WebFlux는 오퍼레이터 한 줄로 동일한 효과를 낼 수 있다.

```java
dispatch(subscribers, newsletter)
    .timeout(Duration.ofSeconds(5))
    .subscribe();
```

Java의 Virtual Thread도 `StructuredTaskScope`(JEP 480, Java 23 Preview)를 통해 구조적 동시성을 지원한다.
`StructuredTaskScope`를 사용하면 여러 Virtual Thread를 하나의 논리적 단위로 묶어 관리할 수 있다.

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    subscribers.forEach(subscriber ->
        scope.fork(() -> {
            mailClient.send(subscriber.email(), newsletter);
            return null;
        })
    );
    scope.join();
    scope.throwIfFailed();
} catch (InterruptedException | ExecutionException e) {
    throw new RuntimeException(e);
}
```

`ShutdownOnFailure` 정책을 사용하면 자식 스레드 중 하나가 실패할 경우 나머지를 즉시 취소한다.
`join()`은 `InterruptedException`을, `throwIfFailed()`는 `ExecutionException`을 던지므로 예외 처리가 필요하다.

## 컨텍스트 전파

Virtual Thread는 ThreadLocal 기반 컨텍스트를 사용한다.
자식 스레드로 전파하려면 값을 명시적으로 복사해야 한다.

Java 21부터 Preview로 도입된 `ScopedValue`(JEP 481, Java 23 Preview)는 이 문제를 개선한다.
불변 값을 특정 범위 안에서만 유효하게 전달하며, `StructuredTaskScope`와 함께 쓰면 자식 스레드로 자동 상속된다.

```java
private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, "req-123").run(() -> {
    mailClient.send(subscriber.email(), newsletter);
});
```

다만 `ThreadLocal` 기반 라이브러리(MDC, Spring Security 등)와의 호환을 위해서는 여전히 별도 처리가 필요하다.

Coroutine은 `CoroutineContext`를 통해 MDC 값, 트랜잭션 컨텍스트 같은 정보를 자식 코루틴에 자동으로 전파할 수 있다.
`kotlinx-coroutines-slf4j`가 제공하는 `MDCContext`를 사용하면 MDC 값이 코루틴 재개 시 자동으로 복원된다.

```kotlin
launch(Dispatchers.IO + MDCContext()) {
    mailClient.send(subscriber.email, newsletter)
}
```

WebFlux는 Reactor Context로 컨텍스트를 전파한다.
파이프라인 안에서 `contextWrite()`로 값을 주입하고 `Mono.deferContextual()`로 읽는다.

```java
Mono.just(subscriber)
    .flatMap(s -> mailClient.send(s.email(), newsletter))
    .contextWrite(Context.of("requestId", requestId));
```

ThreadLocal 기반 라이브러리는 Reactor Context와 직접 연결되지 않아 별도 브리지 설정이 필요하다.

<br>

# 성능 비교

| 항목 | Virtual Thread | Kotlin Coroutine | WebFlux |
|---|---|---|---|
| 스레드 수 | carrier 수 ≈ 코어 수 | 디스패처 설정에 따라 다름 | 이벤트 루프 (매우 적음) |
| I/O 대기 처리 | carrier 양보 | suspend + 비블로킹 선택 가능 | 완전 비블로킹 |
| 극한 동시 연결 | 보통 | 높음 | 매우 높음 |
| 메모리 (힙) | 힙 스택, 필요한 만큼만 | continuation 객체 | 오퍼레이터 체인 |

Virtual Thread는 carrier 수가 CPU 코어 수에 비례한다.
대기 중에는 carrier를 반환하므로 대부분의 서버 워크로드에서 충분한 성능을 낸다.

Coroutine은 `suspend` + 비블로킹 I/O 라이브러리를 조합하면 OS 스레드를 거의 사용하지 않는 진정한 비블로킹 경로를 선택할 수 있다.

WebFlux는 Netty의 이벤트 루프 위에서 동작한다.
극소수의 스레드로 매우 높은 동시성을 처리할 수 있어, 연결 수가 극단적으로 많은 환경에서 이점이 있다.

수십만 개 동시성 상황이 아니라면 세 방식 간 메모리 차이는 크지 않다.

<br>

# 선택 기준

| 상황 | 권장 |
|---|---|
| 기존 Java 블로킹 코드베이스에 빠르게 적용 | Virtual Thread |
| 코드 변경 최소화 | Virtual Thread |
| Kotlin 프로젝트 | Coroutine |
| 구조적 동시성, 취소 전파가 중요한 경우 | Coroutine |
| 비블로킹 라이브러리(Ktor, R2DBC)와 함께 사용 | Coroutine |
| 극한의 동시 연결 수, 리액티브 생태계 전체 활용 | WebFlux |
| Java + Kotlin 혼합 프로젝트 | 상황에 따라 혼합 가능 |

**Virtual Thread**는 기존 Java 코드베이스에 가장 자연스럽게 녹아든다.
블로킹 코드를 그대로 두고 Executor만 바꾸면 되므로, 레거시 프로젝트나 팀 내 비동기 경험이 많지 않은 경우에 실용적인 선택이다.

**Coroutine**은 Kotlin 프로젝트에서 제 역량을 발휘한다.
`withTimeout`, `coroutineScope` 같은 구조적 동시성 도구가 취소 전파와 예외 처리를 명확하게 표현해 준다.
비블로킹 라이브러리(Ktor 클라이언트, R2DBC)와 조합하면 OS 스레드를 거의 사용하지 않는 진정한 비블로킹 경로를 구성할 수 있다.

**WebFlux**는 극단적인 동시 연결이 요구되는 환경, 또는 이미 리액티브 생태계를 전면 채택한 프로젝트에 적합하다.
학습 비용과 코드 복잡도가 높은 만큼, 이 이점이 실제로 필요한 상황인지 먼저 따져보는 것이 좋다.

<br>

## Virtual Thread + Coroutine

Kotlin 프로젝트에서 Virtual Thread와 Coroutine을 함께 사용할 수도 있다.
`Dispatchers.IO`를 Virtual Thread 기반 Executor로 교체하면 두 방식을 조합할 수 있다.

```kotlin
val virtualThreadDispatcher = Executors.newVirtualThreadPerTaskExecutor()
    .asCoroutineDispatcher()

launch(virtualThreadDispatcher) {
    mailClient.send(subscriber.email, newsletter)
}
```

단, 이 조합이 항상 더 나은 성능을 보장하지는 않는다.
블로킹 코드를 `Dispatchers.IO`에서 실행하는 기존 패턴이 대부분의 경우 충분하다.
두 방식을 혼용하기 전에 실제로 병목이 어디에 있는지 먼저 측정하는 것이 순서다.

## WebFlux와 혼용하지 않는 이유

WebFlux와 Virtual Thread는 함께 쓰지 않는 것이 좋다.
WebFlux는 소수의 이벤트 루프 스레드가 비블로킹으로 모든 요청을 처리하는 구조다.
여기에 Virtual Thread를 추가하면 두 스레드 모델이 충돌해 어느 쪽의 이점도 제대로 얻지 못한다.

Virtual Thread는 `spring-boot-starter-web` 기반 Servlet 스택에서 활성화하는 것이 적합하다.
WebFlux(`spring-boot-starter-webflux`) 기반 프로젝트에서는 활성화하지 않는다.

<br>

# 마무리

Virtual Thread, Kotlin Coroutine, WebFlux는 같은 문제를 서로 다른 수준에서 해결한다.

- **Virtual Thread**: 블로킹 코드의 비용을 낮추는 JVM 런타임 최적화. 코드 변경 없이 처리량을 높인다.
- **Coroutine**: 비동기 흐름을 구조적으로 표현하는 언어 추상화. 취소 전파와 컨텍스트 관리가 강점이다.
- **WebFlux**: 리액티브 파이프라인 전체를 비블로킹으로 구성하는 프로그래밍 모델. 극한의 동시성이 필요할 때 강점이 있다.

Virtual Thread가 나왔다고 Coroutine이나 WebFlux가 필요 없어지는 건 아니다.
Java만 쓴다면 Virtual Thread가 가장 실용적인 출발점이다.
Kotlin을 쓴다면 Coroutine이 제공하는 구조적 동시성은 Virtual Thread만으로는 얻기 어렵다.
연결 수가 극단적으로 많고 리액티브 생태계를 이미 쓰고 있다면 WebFlux가 여전히 유효하다.

지금까지 Virtual Thread의 동작 원리부터 Pinning 진단, 성능 측정, Spring Boot 적용, 그리고 다른 방식과의 비교까지 다뤄봤다.
결국 어느 쪽이 더 낫다는 문제가 아니라, 프로젝트 환경과 팀 상황에 맞는 것을 고르는 것이 중요하다.
