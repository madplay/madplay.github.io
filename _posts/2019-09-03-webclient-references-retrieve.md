---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.2. retrieve()"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.2. retrieve()"
category: Spring
date: "2019-09-03 00:32:11"
comments: true
---

# 2.2. `retrieve()`
`retrieve()` 메서드는 응답 본문(response body)를 가져와서 디코딩하는 가장 간단한 방법이다. 다음 예제는 이를 수행하는 방법이다:

#### Java:
```java
WebClient client = WebClient.create("https://example.org");

Mono<Person> result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .bodyToMono(Person.class);
```

#### Kotlin:
```kotlin
val client = WebClient.create("https://example.org")

val result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .awaitBody<Person>()
```

또한 응답으로부터 디코딩된 객체 스트림을 얻을 수도 있다.

#### Java:
```java
Flux<Quote> result = client.get()
        .uri("/quotes").accept(MediaType.TEXT_EVENT_STREAM)
        .retrieve()
        .bodyToFlux(Quote.class);
```

#### Kotlin:
```kotlin
val result = client.get()
        .uri("/quotes").accept(MediaType.TEXT_EVENT_STREAM)
        .retrieve()
        .bodyToFlow<Quote>()
```

기본적으로 4xx 또는 5xx 상태 코드(status code)로 응답하면 `WebClientResponseException` 혹은
`WebClientResponseException.BadRequest`, `WebClientResponseException.NotFound` 등과 같은 각 HTTP 상태에 맞는
예외를 던진다. 또한 `onStatus` 메서드를 사용하여 결과 예외를 커스터마이징할 수 있다. 다음은 그 예제다:

#### Java:
```java
Mono<Person> result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .onStatus(HttpStatus::is4xxClientError, response -> ...)
        .onStatus(HttpStatus::is5xxServerError, response -> ...)
        .bodyToMono(Person.class);
```

#### Kotlin:
```kotlin
val result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .onStatus(HttpStatus::is4xxClientError) { ... }
        .onStatus(HttpStatus::is5xxServerError) { ... }
        .awaitBody<Person>()
```

`onStatus`가 사용되는 경우, 응답에 내용(body가)이 있을 것으로 예상되면 `onStatus` 콜백에서 이를 소비해야 한다.
그렇지 않으면 리소스 반환을 위해서 응답 내용(body가)이 자동으로 비워진다.

---

> ### 목차 가이드
> - <a href="/post/webclient-references-exchange">다음글 "2.3. exchange()" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>