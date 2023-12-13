---
layout: post
title: "Java Virtual Thread: 소개와 동작 원리"
author: madplay
tags: java virtual-thread loom jdk21 concurrency
description: "Java 21에서 정식 출시된 Virtual Thread가 플랫폼 스레드와 어떻게 다른지 살펴본다. OS 스레드 한계, mount/unmount 원리, ForkJoinPool 스케줄러까지 코드로 확인한다."
category: Java/Kotlin
date: "2023-12-14 08:17:42"
comments: true
series: "Virtual Thread"
---

# Virtual Thread 시리즈 목차

- **Java Virtual Thread: 소개와 동작 원리**
- <a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Pinning 발생 원인과 대응</a>
- <a href="/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: 성능 측정과 적용 기준</a>
- <a href="/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot 적용과 주의사항</a>
- <a href="/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Kotlin Coroutine, WebFlux와 비교</a>

<br>

# 뉴스레터 5만 건, 스레드는 몇 개 필요할까

매주 월요일 아침, 5만 명 구독자에게 뉴스레터를 보낸다고 가정해 보자.
겉으로 보기엔 그냥 "발송 버튼 한 번" 누르면 되지만, 내부 서버 입장에서는 스레드 몇 개로 이 일을 처리할지가 꽤 중요한 결정이 된다.

## 스레드 풀로 먼저 시도해 본다

가장 흔한 접근은 스레드 풀을 만들고, 구독자마다 발송 작업을 제출하는 방식이다.

```java
public class NewsletterDispatcher {

	private final ExecutorService executor = Executors.newFixedThreadPool(200);
	private final MailClient mailClient;

	public NewsletterDispatcher(MailClient mailClient) {
		this.mailClient = mailClient;
	}

	public void dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
		for (Subscriber subscriber : subscribers) {
			executor.submit(() -> mailClient.send(subscriber.email(), newsletter));
		}
	}
}
```

스레드 풀이 200개, 5만 건 발송은 이 200개가 돌려가며 처리한다. 각 발송은 SMTP 호출이 끝날 때까지 스레드를 점유한다.
응답이 늦어지면 스레드는 그 시간 동안 아무것도 하지 못한 채 기다린다.

## 스레드를 더 늘리면 되지 않을까

스레드를 더 많이 만들면 동시 처리량이 늘어날 것 같다. 하지만 플랫폼 스레드는 OS 스레드와 1:1로 매핑된다.
JVM과 OS 설정에 따라 다르지만, 스레드 하나당 스택 메모리는 통상 512KB에서 1MB 수준이다.
5만 개를 만들려면 수십 GB가 필요하고, 설령 메모리가 된다 해도 OS 스케줄러가 수만 개의 스레드를 컨텍스트 스위칭하는 비용이 만만치 않다.

결국 스레드 수를 늘리는 방식에는 한계가 있고, 이 한계를 넘으려면 reactive 같은 비동기 프로그래밍 모델을 써야 한다.
코드 구조가 복잡해지는 대가를 치르면서 말이다.

<br>

# Virtual Thread로 바꿔보면

스레드 수를 늘리는 데 한계가 있다면, 스레드가 기다리는 시간을 낭비하지 않으면 되지 않을까?
<a href="/post/what-is-new-java-21" target="_blank">Java 21</a>부터 정식으로 들어온 Virtual Thread가 그 방향으로 문제를 푼다.

## 한 줄을 바꾼다

비즈니스 로직은 건드리지 않는다.
단순히 `Executors.newFixedThreadPool(200)`을 `Executors.newVirtualThreadPerTaskExecutor()`로 바꾸면 된다.

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

`try-with-resources`로 감싼 이유가 있다.
`ExecutorService`가 `AutoCloseable`을 구현하고 있고, 블록이 닫힐 때 제출된 모든 작업이 완료될 때까지 기다린다.

발송 작업 전체가 끝나야 다음 단계로 넘어가는 흐름에 잘 맞는다.

> Java 19부터 `ExecutorService`가 `AutoCloseable`을 구현하고, `close()`가 
> 내부적으로 `shutdown()` 후 `awaitTermination(Long.MAX_VALUE,NANOSECONDS)`를 호출한다.
> 블록을 빠져나오는 시점에 제출된 모든 작업이 완료된 것이 보장된다.

## 5만 개가 돌아도 메모리는 여유롭다

Virtual Thread 5만 개가 각각의 발송 작업을 맡는다. OS 스레드는 CPU 코어 수 정도만 쓰인다.
스레드 수가 5만 개인데도 메모리와 CPU에 여유가 남는다. 물론 이건 단순화된 관찰이다.
실제 발송에는 외부 SMTP의 rate limit, 백프레셔 같은 제약이 있어서 5만 개를 한꺼번에 쏘기보다는 흐름 제어가 필요하다.

그렇다면 스레드가 5만 개인데, 메모리는 왜 여유롭고 CPU는 왜 한산한가?

<br>

# 안에서는 무슨 일이 벌어지는가

## Virtual Thread는 OS 스레드가 아니다

**Virtual Thread는 JVM이 관리하는 경량 스레드다.** OS 스레드 위에서 실행되지만, **OS 스레드와 1:1로 매핑되지는 않는다.**
실제 실행을 담당하는 OS 스레드를 carrier thread라고 부른다. Virtual Thread는 이 carrier에 올라타서 CPU를 쓰고, 필요할 때 내려온다.

Virtual Thread의 스택도 플랫폼 스레드와 다르다. 고정 크기로 미리 잡아두는 게 아니라, 실행 중 필요한 프레임만큼 힙에 저장된다.
그래서 수만 개를 만들어도 메모리가 크게 늘지 않는다.

## mount와 unmount

Virtual Thread의 생명주기에서 핵심은 mount와 unmount다.

**mount**는 Virtual Thread가 carrier에 올라타 실제로 CPU를 점유하는 시점이다.
**unmount**는 blocking I/O를 만났을 때 carrier에서 내려오는 시점이다.
unmount 직후 carrier는 즉시 다른 Virtual Thread를 태운다.
Virtual Thread 수천 개가 carrier 몇 개 위에서 교대로 실행되는 M:N 구조다.

뉴스레터 발송 예시로 돌아오면, 한 구독자에게 메일을 보내는 중 SMTP 서버의 응답을 기다리는 순간이 바로 unmount 지점이다.
비워진 carrier는 곧바로 다른 Virtual Thread를 태워 다음 발송을 시작한다.
플랫폼 스레드였다면 SMTP 응답이 올 때까지 그 자리 전체가 묶여 있었을 구간이다.

## continuation: 실행 상태를 저장하는 장치

carrier를 떠난 Virtual Thread의 실행 상태, 즉 스택 프레임은 JVM 힙에 보관된다.
JVM 내부의 continuation 메커니즘이 이 상태를 저장해 두고, I/O 완료 알림이 오면 꺼내어 이어서 실행한다.

내부적으로는 `jdk.internal.vm.Continuation`을 기반으로 동작하지만, 이는 내부 패키지이므로 직접 import해서 쓰면 안 된다.
Virtual Thread API를 쓸 때 continuation은 눈에 보이지 않게 동작한다.

Virtual Thread의 생명주기는 이런 식으로 carrier 위를 오르내린다.

<pre class="mermaid">
stateDiagram-v2
    [*] --> Created
    Created --> Running: mount
    Running --> Parked: blocking I/O (unmount)
    Parked --> Running: I/O 완료 (remount)
    Running --> [*]: 작업 종료
</pre>

## 스케줄러는 누구인가

Virtual Thread를 스케줄링하는 주체는 `ForkJoinPool`이다.
기본 parallelism은 `Runtime.getRuntime().availableProcessors()`, 즉 CPU 코어 수와 같다.
시스템 프로퍼티 `-Djdk.virtualThreadScheduler.parallelism`으로 조정할 수 있지만, 대부분의 I/O 집약 워크로드에서는 기본값으로 충분하다.

## carrier thread 이름 확인해 보기

실제로 어떤 carrier가 Virtual Thread를 태우고 있는지 이름으로 확인할 수 있다.

```java
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 5; i++) {
        executor.submit(() -> System.out.println(Thread.currentThread()));
    }
}
```

출력은 이런 형태다.

```
VirtualThread[#21]/runnable@ForkJoinPool-1-worker-1
VirtualThread[#22]/runnable@ForkJoinPool-1-worker-2
```

`VirtualThread[#...]`가 Virtual Thread 자체의 이름이고, `@` 뒤에 붙은 `ForkJoinPool-1-worker-N`이 지금 태우고 있는 carrier thread다.
같은 Virtual Thread가 실행될 때마다 뒤의 carrier 이름이 바뀌는 것을 보면 교대 장면을 눈으로 확인할 수 있다.

참고로 `synchronized` 블록 안에서 blocking I/O가 발생하면 carrier가 unmount되지 못하고 묶이는 **pinning 현상**이 생긴다.
이 부분은 다음 편에서 다룬다.

<br>

# 플랫폼 스레드와 무엇이 다른가

원리를 짚었으니 차이를 정리한다.

## 핵심 비교

| 기준              | 플랫폼 스레드         | Virtual Thread                 |
|-----------------|-----------------|--------------------------------|
| OS 매핑           | 1:1             | M:N (다수 VT가 소수 carrier 위에서 교대) |
| 스택 메모리          | 통상 512KB~1MB 고정 | 힙에 필요한 프레임만큼                   |
| 생성 비용           | 무거움 (OS 시스템 콜)  | 가벼움 (JVM 내부)                   |
| 스케줄링 주체         | OS 스케줄러         | JVM `ForkJoinPool`             |
| Blocking I/O 처리 | 스레드 점유          | unmount 후 carrier 반환           |
| 적합한 작업          | CPU 집약          | I/O 집약                         |

대기가 많고 짧은 작업이 많을수록 Virtual Thread의 효과가 크다.
CPU를 쉬지 않고 쓰는 작업은 carrier를 양보할 기회가 없으므로 플랫폼 스레드와 큰 차이가 없다.

## 언제 효과가 있는가

외부 API 호출, DB 쿼리, 메시징 대기처럼 I/O 집약 워크로드에서 이득이 크다.
반대로 이미지 인코딩, 해시 계산 같은 CPU 집약 작업은 코어 수가 병목이라 Virtual Thread로 바꿔도 의미 있는 차이가 나지 않는다.

뉴스레터 발송 시나리오는 구독자마다 SMTP 응답을 기다리는 시간이 대부분이라 Virtual Thread에 잘 맞는 케이스다.

<br>

# 정리하며

스레드를 더 많이 만들 수 있게 된 것보다 중요한 사실은, 스레드가 기다림에 갇히는 대신 carrier를 양보한다는 점이 아닐까 싶다.
이 한 가지 아이디어가 왜 I/O 집약 워크로드에서 큰 차이를 만드는지 설명해 주고, 왜 CPU 바운드 작업에서는 큰 차이가 없는지도 함께 설명해 주는 것 같다.

물론 실전에서 쓰다 보면 이 그림이 잠깐 깨지는 순간이 있다.
carrier가 묶여버리는 상황, 그리고 그걸 어떻게 찾아내는지는 다음 편에서 다룬다.

- <a href="/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Pinning 발생 원인과 대응</a>
