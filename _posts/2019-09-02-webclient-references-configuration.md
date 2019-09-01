---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.1. 설정(Configuration)"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.1. Configuration"
category: Spring
date: "2019-09-02 21:50:34"
comments: true
---

# 2.1. 설정(Configuration)
`WebClient`를 생성하는 가장 간단한 방법은 정적 팩터리 메서드 중 하나를 사용하는 것이다.

- `WebClient.create()`
- `WebClient.create(String baseUrl)`

위 메서드는 기본 설정으로 리액터 네티 `HttpClient`를 사용하기 때문에 클래스패스에 `io.projectreactor.netty:reactor-netty`가
있어야 한다.

물론 `WebClient.builder()`와 함께 다른 옵션을 사용할 수 있다.

- `uriBuilderFactory`: base URL을 사용하기 위한 커스터마이징한 `UriBuilderFactory`
- `defaultHeader`: 모든 요청에 대한 헤더
- `defaultCookie`: 모든 요청에 대한 쿠키
- `defaultRequest`: 모든 요청에 대해 커스터마마이징할 `Consumer`
- `filter`: 모든 요청에 대한 클라이언트 필터
- `exchangeStrategies`: HTTP 메시지 reader/writer 커스터마이징
- `clientConnector`: HTTP 클라이언트 라이브러리 세팅

다음 예제는 **HTTP 코덱**을 설정한다:

#### Java:
```java
WebClient client = WebClient.builder()
        .exchangeStrategies(builder -> {
                return builder.codecs(codecConfigurer -> {
                    //...
                });
        })
        .build();
```

#### Kotlin:
```kotlin
val webClient = WebClient.builder()
        .exchangeStrategies { strategies ->
            strategies.codecs {
                //...
            }
        }
        .build()
```

한 번 만들어진 `WebClient` 인스턴스는 불변(immutable)이다. 하지만 원본 인스턴스에 영향을 주지 않고 복제하여 설정을 수정할 수 있다.
다음은 그 예제다:

#### Java:
```java
WebClient client1 = WebClient.builder()
        .filter(filterA).filter(filterB).build();

WebClient client2 = client1.mutate()
        .filter(filterC).filter(filterD).build();

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

#### Kotlin:
```kotlin
val client1 = WebClient.builder()
        .filter(filterA).filter(filterB).build()

val client2 = client1.mutate()
        .filter(filterC).filter(filterD).build()

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

## 2.1.1. MaxInMemorySize
스프링 웹플럭스는 애플리케이션의 메모리 이슈를 피하기 위해 코덱의 메모리 버퍼 사이즈에 대한 **제한(limits)** 설정한다. 기본값으로 256KB로
설정되어 있는데, 이 값으로 충분히 수용하지 못하는 경우 아래와 같은 메시지를 볼 수 있다.

```bash
org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer
```

아래 코드 샘플을 사용하여 모든 기본 코덱에서 제한값을 설정할 수 있다:

#### Java
```java
WebClient webClient = WebClient.builder()
        .exchangeStrategies(builder ->
            builder.codecs(codecs ->
                codecs.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)
            )
        )
        .build();
```

#### Kotlin
```kotlin
val webClient = WebClient.builder()
    .exchangeStrategies { builder ->
            builder.codecs {
                it.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)
            }
    }
    .build()
```

---

> ### 목차 가이드
> - 다음글 "2.2. retrieve()" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>