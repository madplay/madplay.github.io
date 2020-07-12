---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.3. exchange()"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.3. exchange()"
category: Spring
date: "2019-09-04 21:02:09"
comments: true
---

# 2.3. `exchange()`
`exchange()` 메서드는 `retrieve` 메서드보다 더 많은 기능을 제공한다. 다음 예제는 `retrieve()` 예제와 같지만,
`ClientResponse`에 접근한다.

#### Java:
```java
Mono<Person> result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .exchange()
        .flatMap(response -> response.bodyToMono(Person.class));
```

#### Kotlin:
```kotlin
val result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .awaitExchange()
        .awaitBody<Person>()
```

이 레벨에서, 완전한 `ResponseEntity`를 생성할 수도 있다.

#### Java:
```java
Mono<ResponseEntity<Person>> result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .exchange()
        .flatMap(response -> response.toEntity(Person.class));
```

#### Kotlin:
```kotlin
val result = client.get()
        .uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
        .awaitExchange()
        .toEntity<Person>()
```

`exchange()`는 (`retrieve()`와 다르게) 4xx, 5xx 응답에 대한 자동적인 에러 처리가 없다. 직접 상태 코드(status code)를 검사해서
이어지는 동작을 결정해야 한다.

> `retrieve()`와 다르게 `exchange()`를 사용하는 경우, 시나리오(성공, 오류, 예상치 못한 데이터 등)에 관계없이 애플리케이션이
직접 응답 콘텐츠(response content)를 소비해야 한다. 그렇지 않으면 메모리 누수(memory leak)이 발생할 수 있다.
`ClientResponse` javadoc에 본문(body)를 소비할 수 있는 모든 옵션이 설명되어 있다. `exchange()`를 사용해서 응답 상태와 헤더를
확인해야 하는 경우나 응답을 소비해야 하는 상황이 아니라면, 일반적으로 `retrieve()`를 쓰는 것이 좋다.

---

> ### 목차 가이드
> - <a href="/post/webclient-references-request-body">다음글 "2.4. Request Body" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>