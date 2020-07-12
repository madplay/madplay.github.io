---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.4. Request Body"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.4. Request Body"
category: Spring
date: "2019-09-19 22:21:43"
comments: true
---

# 2.4. Request Body
Request Body는 `Mono` 또는 코틀린 코루틴 `Deferred`와 같이 `ReactiveAdapterRegistry`가 핸들링하는 모든 비동기 타입으로부터
인코딩될 수 있다. 아래는 그 예제다:

#### Java:
```java
Mono<Person> personMono = ... ;

Mono<Void> result = client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .body(personMono, Person.class)
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
val personDeferred: Deferred<Person> = ...

client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .body<Person>(personDeferred)
        .retrieve()
        .awaitBody<Unit>()
```

또한 다음 예제와 같이 객체 스크림을 인코딩할 수도 있다:

#### Java:
```java
Flux<Person> personFlux = ... ;

Mono<Void> result = client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_STREAM_JSON)
        .body(personFlux, Person.class)
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
val people: Flow<Person> = ...

client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .body(people)
        .retrieve()
        .awaitBody<Unit>()
```

또는 실제 값을 가진 경우에는 `bodyValue` 메서드를 사용할 수 있다.

#### Java:
```java
Person person = ... ;

Mono<Void> result = client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(person)
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
val person: Person = ...

client.post()
        .uri("/persons/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(person)
        .retrieve()
        .awaitBody<Unit>()
```

<br>

### 2.4.1. 폼 데이터(Form Data)
폼 데이터를 전송하기 위해, `MultiValueMap<String, String>`을 body로 사용한다. `FormHttpMessageWriter`에 의해서 자동으로
`application/x-www-form-urlencoded`로 콘텐츠 타입이 설정된다. 다음 `MultiValueMap<String, String>`을 사용하는 예제다:

#### Java:
```java
MultiValueMap<String, String> formData = ... ;

Mono<Void> result = client.post()
        .uri("/path", id)
        .bodyValue(formData)
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
val formData: MultiValueMap<String, String> = ...

client.post()
        .uri("/path", id)
        .bodyValue(formData)
        .retrieve()
        .awaitBody<Unit>()
```

`BodyInserters`를 사용하여 인라인 폼(form) 데이터를 만들 수 있다. 다음은 그 예제다:

#### Java:
```java
import static org.springframework.web.reactive.function.BodyInserters.*;

Mono<Void> result = client.post()
        .uri("/path", id)
        .body(fromFormData("k1", "v1").with("k2", "v2"))
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
import org.springframework.web.reactive.function.BodyInserters.*

client.post()
        .uri("/path", id)
        .body(fromFormData("k1", "v1").with("k2", "v2"))
        .retrieve()
        .awaitBody<Unit>()
```

<br>

### 2.4.2. 멀티파트 데이터(Multipart Data)
멀티파트 데이터를 전송하려면, 값(value)이 파트(part) 컨텐츠를 나타내는 `Object` 또는 파트의 컨텐츠와 헤더를 나타내는 `HttpEntity` 인스턴스인 `MultiValueMap<String, ?>`를 사용하면 된다. `MultipartBodyBuilder`는 멀티파트 요청을 준비하기 위한 편리한 API를
제공한다 다음은 `MultiValueMap<String, ?>`를 어떻게 생성하는지 보여주는 예제다:

#### Java:
```java
MultipartBodyBuilder builder = new MultipartBodyBuilder();
builder.part("fieldPart", "fieldValue");
builder.part("filePart1", new FileSystemResource("...logo.png"));
builder.part("jsonPart", new Person("Jason"));
builder.part("myPart", part); // Part from a server request

MultiValueMap<String, HttpEntity<?>> parts = builder.build();
```

#### Kotlin:
```kotlin
val builder = MultipartBodyBuilder().apply {
    part("fieldPart", "fieldValue")
    part("filePart1", new FileSystemResource("...logo.png"))
    part("jsonPart", new Person("Jason"))
    part("myPart", part) // Part from a server request
}

val parts = builder.build()
```

대부분 각 파트마다 `Content-Type`을 지정할 필요가 없다. 콘텐츠 타입은 직렬화하기 위해 선택한 `HttpMessageWriter`를 기반으로
또는 `Resource`의 경우 파일 확장자에 기반하여 자동으로 결정된다. 필요하다면, 오버로딩된 빌더 `part` 메서드 중 하나를 통해서
각 파트에서 사용할 `MediaType`를 명시적으로 제공할 수 있다.

`MultiValueMap`이 준비됐다면, `WebClient`에 전달하는 가장 쉬운 방법은 `body` 메서드를 사용하는 것이다.
다음은 그 예제다:

#### Java:
```java
MultipartBodyBuilder builder = ...;

Mono<Void> result = client.post()
        .uri("/path", id)
        .body(builder.build())
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
val builder: MultipartBodyBuilder = ...

client.post()
        .uri("/path", id)
        .body(builder.build())
        .retrieve()
        .awaitBody<Unit>()
```

`MultiValueMap`에 일반적인 폼 데이터(`application/x-www-form-urlencoded`)를 나타낼 수 있는 문자열이 아닌 값(non-String)이
하나라도 포함되어 있다면, `Content-Type`을 `multipart/form-data`로 설정할 필요가 없다. `MultipartBodyBuilder`를 사용하는
경우 항상 `HttpEntity`로 래핑해주기 때문이다.

`MultipartBodyBuilder`의 대안으로 내장 `BodyInserters`를 사용하여 인라인 스타알의 멀티파트 콘텐츠를 만들 수도 있다.
다음은 그 예제다:

#### Java:
```java
import static org.springframework.web.reactive.function.BodyInserters.*;

Mono<Void> result = client.post()
        .uri("/path", id)
        .body(fromMultipartData("fieldPart", "value").with("filePart", resource))
        .retrieve()
        .bodyToMono(Void.class);
```

#### Kotlin:
```kotlin
import org.springframework.web.reactive.function.BodyInserters.*

client.post()
        .uri("/path", id)
        .body(fromMultipartData("fieldPart", "value").with("filePart", resource))
        .retrieve()
        .awaitBody<Unit>()
```

---

> ### 목차 가이드
> - <a href="/post/webclient-references-client-filters">다음글 "2.5. Client Filters" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>