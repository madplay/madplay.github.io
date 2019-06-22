---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.5 함수형 엔드포인트"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.5 Functional Endpoints"
category: Spring
date: "2019-06-08 22:11:53"
comments: true
---

# 1.5 함수형 엔드포인트(Functional Endpoints)
스프링 웹플럭스는 요청을 라우팅하고 핸들링하는데 사용하고 불변성을 위해 설계된 경량 함수형 프로그래밍 모델인 WebFlux.fn을 포함한다.
어노테이션 기반 프로그래밍 모델의 대안이지만 동일한 리액티브 코어(Reactive Core) 기반에서 실행된다.

<div class="post_comments">[역주] 웹플럭스는 기존의 MVC처럼 어노테이션 기반의 프로그래밍 모델도 지원합니다.</div>

## 1.5.1. 개요(Overview)
WebFlux.fn에서 HTTP 요청은 `HandlerFunction`으로 핸들링한다: `ServerRequest`를 인자로 받아 지연된 `ServerResponse`를 반환한다.
(예를 들어 `Mono<ServerResponse>`) 요청과 응답 객체 모두 불변형이며 HTTP 요청과 응답으로의 접근에 자바 8에 친화적인 기능을 제공한다.
`HandlerFunction`은 어노테이션 기반 프로그래밍 모델의 `@RequestMapping` 메서드의 바디와 같다.

`RouterFunction`은 인입되는 요청을 핸들러 함수로 라우팅한다: `ServerRequest`를 인자로 받아 지연된 `HandlerFunction`(예를 들어,
`Mono<HandlerFunction>`)을 반환한다. 라우터 함수가 매칭되면 핸들러 함수를 반환하고 그렇지 않으면 빈 `Mono`를 반환한다. `RouterFunction`은
`@RequestMapping` 어노테이션과 동일하지만 라우터 함수가 데이터뿐만 아니라 동작도 제공한다는 큰 차이점이 있다.

`RouterFunctions.router()` 는 아래 예제와 같이 라우터 작성을 쉽게하는 라우터 빌더를 제공한다.

Java:
```java
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

PersonRepository repository = ...
PersonHandler handler = new PersonHandler(repository);

RouterFunction<ServerResponse> route = route()
    .GET("/person/{id}", accept(APPLICATION_JSON), handler::getPerson)
    .GET("/person", accept(APPLICATION_JSON), handler::listPeople)
    .POST("/person", handler::createPerson)
    .build();


public class PersonHandler {

    // ...

    public Mono<ServerResponse> listPeople(ServerRequest request) {
        // ...
    }

    public Mono<ServerResponse> createPerson(ServerRequest request) {
        // ...
    }

    public Mono<ServerResponse> getPerson(ServerRequest request) {
        // ...
    }
}
```

Kotlin:
```kotlin
val repository: PersonRepository = ...
val handler = PersonHandler(repository)

val route = coRouter { (1)
    accept(APPLICATION_JSON).nest {
        GET("/person/{id}", handler::getPerson)
        GET("/person", handler::listPeople)
    }
    POST("/person", handler::createPerson)
}


class PersonHandler(private val repository: PersonRepository) {

    // ...

    suspend fun listPeople(request: ServerRequest): ServerResponse {
        // ...
    }

    suspend fun createPerson(request: ServerRequest): ServerResponse {
        // ...
    }

    suspend fun getPerson(request: ServerRequest): ServerResponse {
        // ...
    }
}
```

`RouterFunction`을 실행하는 한 가지 방법은 이를 `HttpHandler`로 바꾸고 내장 서버 어댑터 중 하나를 통해 설치하는 것이다.

- `RouterFunctions.toHttpHandler(RouterFunction)`
- `RouterFunctions.toHttpHandler(RouterFunction, HandlerStrategies)`

대부분의 응용 프로그램은 웹플럭스 자바 설정을 통해 실행할 수 있다. **Running a Server**를 참조하라.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-annotated-controllers" target="_blank">다음글 "1.6 URI Links" 로 이동</a>
> - <a href="/post/web-on-reactive-stack" target="_blank">전체 목차 페이지로 이동</a>