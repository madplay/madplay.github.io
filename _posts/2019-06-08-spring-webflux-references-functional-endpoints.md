---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.5. Functional Endpoints"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.5. Functional Endpoints"
category: Spring
date: "2019-06-08 22:11:53"
comments: true
---

# 1.5 함수형 엔드포인트(Functional Endpoints)
스프링 웹플럭스는 요청을 라우팅하고 핸들링하는데 사용하고 불변성을 위해 설계된 경량 함수형 프로그래밍 모델인 WebFlux.fn을 포함한다.
어노테이션 기반 프로그래밍 모델의 대안이지만 동일한 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-spring-web" rel="nofollow" target="_blank">리액티브 코어(Reactive Core)</a> 기반에서 실행된다.

<div class="post_comments">[역주] 웹플럭스는 기존의 MVC처럼 어노테이션 기반의 프로그래밍 모델도 지원합니다.</div>

<br>

## 1.5.1. 개요(Overview)
WebFlux.fn에서 HTTP 요청은 `HandlerFunction`으로 핸들링한다: `ServerRequest`를 인자로 받아 지연된 `ServerResponse`를 반환한다.
(예를 들어 `Mono<ServerResponse>`) 요청과 응답 객체 모두 불변형이며 HTTP 요청과 응답으로의 접근에 자바 8에 친화적인 기능을 제공한다.
`HandlerFunction`은 어노테이션 기반 프로그래밍 모델의 `@RequestMapping` 메서드의 바디와 같다.

`RouterFunction`은 인입되는 요청을 핸들러 함수로 라우팅한다: `ServerRequest`를 인자로 받아 지연된 `HandlerFunction`(예를 들어,
`Mono<HandlerFunction>`)을 반환한다. 라우터 함수가 매칭되면 핸들러 함수를 반환하고 그렇지 않으면 빈 `Mono`를 반환한다. `RouterFunction`은
`@RequestMapping` 어노테이션과 동일하지만 라우터 함수가 데이터뿐만 아니라 동작도 제공한다는 큰 차이점이 있다.

`RouterFunctions.router()` 는 아래 예제와 같이 라우터 작성을 쉽게하는 라우터 빌더를 제공한다.

#### Java:
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

#### Kotlin:
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

`RouterFunction`을 실행하는 한 가지 방법은 이를 `HttpHandler`로 바꾸고 내장 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">서버 어댑터</a> 중 하나를 통해 설치하는 것이다.

- `RouterFunctions.toHttpHandler(RouterFunction)`
- `RouterFunctions.toHttpHandler(RouterFunction, HandlerStrategies)`

대부분의 응용 프로그램은 웹플럭스 자바 설정을 통해 실행할 수 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-fn-running" rel="nofollow" target="_blank">Running a Server</a>를 참조하라.

<br>

## 1.5.2. HandlerFunction
`ServerRequest`와 `ServerResponse`는 불변 인터페이스며, HTTP 요청과 응답에 대한 자바 8 친화적인 방식을 제공한다. 요청과 응답 모두 바디 스트림에
대한 리액티브 스트림 벡프레셔를 제공한다. 요청 본문(request body)은 리액터 `Flux` 또는 `Mono`로 표현한다. 응답 본문(response body)은 `Flux`와
`Mono`를 포함한 모든 리액티브 스트림 Publisher로 표현된다. 이에 대한 더 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-libraries" rel="nofollow" target="_blank">Reactive Libraries</a>를 참조하라.

<br>

### ServerRequest
`ServerRequest`는 HTTP 메서드, URI, 헤더와 쿼리 파라미터에 대한 접근을 제공하며, 본문(body)에 대한 접근은 메서드를 제공한다.

아래는 `request body`를 `Mono<String>`으로 추출하는 예제다.

#### Java:
```java
Mono<String> string = request.bodyToMono(String.class);
```

#### Kotlin:
```kotlin
val string = request.awaitBody<String>()
```

다음 예제는 본문을 `Flux<Person>` (또는 코틀린의 `Flow<Person>`)으로 추출한다. 여기서 Person 객체는 JSON이나 XML과 같은 직렬화된 데이터로부터
디코딩된다.

#### Java:
```java
Flux<Person> people = request.bodyToFlux(Person.class);
```

#### Kotlin:
```kotlin
val people = request.bodyToFlow<Person>()
```

위의 예제는 함수형 전략 인터페이스인 `BodyExtractor`를 받는 `ServerRequest.body(BodyExtractor)` 메서드의 축약형 버전이다.
유틸리티 클래스 `BodyExtractors`에 있는 여러 인스턴스에 대한 접근을 제공한다. 예를 들어 위의 예제는 아래와 같이 작성할 수도 있다.

#### Java:
```java
Mono<String> string = request.body(BodyExtractors.toMono(String.class));
Flux<Person> people = request.body(BodyExtractors.toFlux(Person.class));
```

#### Kotlin:
```kotlin
val string = request.body(BodyExtractors.toMono(String::class.java)).awaitFirst()
val people = request.body(BodyExtractors.toFlux(Person::class.java)).asFlow()
```

아래는 폼 데이터에 접근하는 예제다:

#### Java:
```java
Mono<MultiValueMap<String, Part> map = request.multipartData();
```

#### Kotlin:
```kotlin
val map = request.awaitFormData()
```

아래는 맵 방식으로 멀티파트 데이터에 접근하는 예제다:

#### Java:
```java
Mono<MultiValueMap<String, Part> map = request.multipartData();
```

#### Kotlin:
```kotlin
val map = request.awaitMultipartData()
```

아래 예제는 스트리밍 방식으로 한 번에 하나씩 멀티파트 데이터에 접근하는 예제다:

#### Java:
```java
Flux<Part> parts = request.body(BodyExtractors.toParts());
```

#### Kotlin:
```kotlin
val parts = request.body(BodyExtractors.toParts()).asFlow()
```

<br>

### ServerResponse
`ServerResponse`는 HTTP 응답에 대한 접근을 제공하며, 불변형이므로 `build` 메서드를 사용하여 작성할 수 있다. 빌더를 사용하여 응답 상태를 설정하거나
응답 헤더를 추가하거나 본문을 제공할 수 있다. 아래 예제는 JSON 컨텐츠로 200(OK) 응답을 작성한다.

#### Java:
```java
Mono<Person> person = ...
ServerResponse.ok().contentType(MediaType.APPLICATION_JSON).body(person, Person.class);
```

#### Kotlin:
```kotlin
val person: Person = ...
ServerResponse.ok().contentType(MediaType.APPLICATION_JSON).bodyValue(person)
```

아래는 본문(body) 없이 `Location` 헤더를 사용하여 201(CREATED) 응답을 작성하는 예제다:

#### Java:
```java
URI location = ...
ServerResponse.created(location).build();
```

#### Kotlin:
```kotlin
val location: URI = ...
ServerResponse.created(location).build()
```

사용된 코덱에 따라 힌트 매개변수(hint parameters)를 전달하여 본문(body)이 직렬화 또는 역직렬화되는 방식을 지정할 수 있다.
예를 들면 <a href="https://www.baeldung.com/jackson-json-view-annotation" rel="nofollow" target="_blank">Jackson JSON view</a>를 지정한다:

#### Java:
```java
ServerResponse.ok().hint(Jackson2CodecSupport.JSON_VIEW_HINT, MyJacksonView.class).body(...);
```

#### Kotlin:
```kotlin
ServerResponse.ok().hint(Jackson2CodecSupport.JSON_VIEW_HINT, MyJacksonView::class.java).body(...)
```

<br>

### 핸들러 클래스(Handler Classes)
핸들러 함수를 아래와 같이 람다로 만들 수 있다.

#### Java:
```java
HandlerFunction<ServerResponse> helloWorld =
  request -> ServerResponse.ok().bodyValue("Hello World");
```

#### Kotlin:
```kotlin
val helloWorld = HandlerFunction<ServerResponse> { ServerResponse.ok().bodyValue("Hello World") }
```

편리하지만 애플리케이션에서 여러 개의 함수를 사용한다면, 인라인 람다가 지저분할 수도 있다. 따라서 핸들러 클래스로 그룹화하여 핸들러 함수를 묶을 수 있다.
그러면 어노테이션 기반 애플리케이션에서의 `@Controller`와 비슷한 역할을 한다. 예를 들어 다음 클래스는 리액티브 `Person` 관련 처리를 한다:

#### Java:
```java
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.web.reactive.function.server.ServerResponse.ok;

public class PersonHandler {

    private final PersonRepository repository;

    public PersonHandler(PersonRepository repository) {
        this.repository = repository;
    }

    public Mono<ServerResponse> listPeople(ServerRequest request) { (1)
        Flux<Person> people = repository.allPeople();
        return ok().contentType(APPLICATION_JSON).body(people, Person.class);
    }

    public Mono<ServerResponse> createPerson(ServerRequest request) { (2)
        Mono<Person> person = request.bodyToMono(Person.class);
        return ok().build(repository.savePerson(person));
    }

    public Mono<ServerResponse> getPerson(ServerRequest request) { (3)
        int personId = Integer.valueOf(request.pathVariable("id"));
        return repository.getPerson(personId)
            .flatMap(person -> ok().contentType(APPLICATION_JSON).bodyValue(person))
            .switchIfEmpty(ServerResponse.notFound().build());
    }
}
```

> (1) `listPeople`은 repository에서 검색한 모든 `Person` 객체를 JSON 형태로 반환하는 핸들러 함수다.<br>
> (2) `createPerson`은 요청 본문(request body)에 있는 `Person`을 저장하는 핸들러 함수다. `PersonRepository.savePerson(Person)`은
`Mono<Void>`를 반환한다. 빈 `Mono`는 `Person`이 리퀘스트에서 읽혀지고 저장되면 완료됐다는 신호를 보낸다. 그래서 이 완료 신호를 받았을 때(즉, Person이
저장되었을 때) 응답을 보내기 위해 `build(Publisher<Void>`를 사용한다.<br>
> (3) `getPerson`은 `id` 경로 변수(path variable)로 식별되는 `Person` 객체 하나를 반환하는 핸들러 함수다. repository에서 `Person`을
찾으면 JSON 응답을 만든다. 하지만 찾지 못했다면 `switchIfEmpty(Mono<T>)`를 실행해 404 Not Found 응답을 반환한다.


#### Kotlin:
```kotlin
class PersonHandler(private val repository: PersonRepository) {

    suspend fun listPeople(request: ServerRequest): ServerResponse { (1)
        val people: Flow<Person> = repository.allPeople()
        return ok().contentType(APPLICATION_JSON).bodyAndAwait(people);
    }

    suspend fun createPerson(request: ServerRequest): ServerResponse { (2)
        val person = request.awaitBody<Person>()
        repository.savePerson(person)
        return ok().buildAndAwait()
    }

    suspend fun getPerson(request: ServerRequest): ServerResponse { (3)
        val personId = request.pathVariable("id").toInt()
        return repository.getPerson(personId)?.let { ok().contentType(APPLICATION_JSON).bodyValueAndAwait(it) }
                ?: ServerResponse.notFound().buildAndAwait()

    }
}
```

> (1) `listPeople`은 repository에서 검색한 모든 `Person` 객체를 JSON 형태로 반환하는 핸들러 함수다.<br>
> (2) `createPerson`은 요청 본문(request body)에 있는 `Person`을 저장하는 핸들러 함수다. `PersonRepository.savePerson(Person)`은
반환 타입이 없는 suspend 함수다.<br>
> (3) `getPerson`은 `id` 경로 변수(path variable)로 식별되는 `Person` 객체 하나를 반환하는 핸들러 함수다. repository에서 `Person`을
찾으면 JSON 응답을 만든다. 하지만 찾지 못했다면 404 Not Found 응답을 반환한다.

<br>

### Validation
함수형 엔드포인트는 스프링의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation" rel="nofollow" target="_blank">검증(Validation)</a> 기능을 사용하여 요청 본문(request body)를 검증할 수 있다.
예를 들어, 사용자가 정의한 스프링 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation" rel="nofollow" target="_blank">Validator</a> 구현체로 `Person`을 검증하다:

#### Java:
```java
public class PersonHandler {

    private final Validator validator = new PersonValidator(); (1)

    // ...

    public Mono<ServerResponse> createPerson(ServerRequest request) {
        Mono<Person> person = request.bodyToMono(Person.class).doOnNext(this::validate); (2)
        return ok().build(repository.savePerson(person));
    }

    private void validate(Person person) {
        Errors errors = new BeanPropertyBindingResult(person, "person");
        validator.validate(person, errors);
        if (errors.hasErrors()) {
            throw new ServerWebInputException(errors.toString()); (3)
        }
    }
}
```

#### Kotlin:
```kotlin
class PersonHandler(private val repository: PersonRepository) {

    private val validator = PersonValidator() (1)

    // ...

    suspend fun createPerson(request: ServerRequest): ServerResponse {
        val person = request.awaitBody<Person>()
        validate(person) (2)
        repository.savePerson(person)
        return ok().buildAndAwait()
    }

    private fun validate(person: Person) {
        val errors: Errors = BeanPropertyBindingResult(person, "person");
        validator.validate(person, errors);
        if (errors.hasErrors()) {
            throw ServerWebInputException(errors.toString()) (3)
        }
    }
}
```

> (1) `Validator` 인스턴스를 만든다.
> (2) 검증 로직을 수행한다.
> (3) 400으로 응답하는 예외를 발생시킨다.

핸들러는 `LocationValidatorFactoryBean`을 기반으로 글로벌 `Validator` 인스턴스를 주입하여 표준 빈 유효성 검증 API(JSR-303)을
사용할 수도 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation-beanvalidation" rel="nofollow" target="_blank">Spring Validation</a>를 참조하라.

<br>

## 1.5.3. RouterFunction
라우터 함수는 요청을 해당 `HandlerFunction`으로 라우팅하는데 사용된다. 일반적으로 라우터 함수를 직접 작성하지 말고 `RouterFunctions` 유틸리티
클래스에서 메서드를 사용하여 작성한다. `RouterFunctions.route()`(매개변수 없음)는 라우터 함수를 생성하기 위한 유연한 빌더를 제공하는 반면,
`RouterFunctions.route(RequestPredicate, HandlerFunction)`은 라우터를 생성하는 직접적인 방법을 제공한다.

일반적으로 `route()` 빌더 사용을 권장한다. 일반적인 매핑 시나리오를 찾기 어려운 정적 임포트 없이 사용할 수 있도록 제공되기 때문이다.
예를 들면, 라우터 함수 빌더는 `GET(String, HandlerFunction)` 메서드를 제공하여 GET 요청에 대한 매핑을 생성한다. POST의 경우는
`POST(String, HandlerFunction)` 메서드가 있다.

HTTP 메서드 기반 매핑 외에도 라우트 빌더는 요청에 매핑할 때 추가적인 술어(predicates)를 도입하는 방법을 제공한다. 각 HTTP 메서드마다
`RequestPredicate`를 매개 변수로 받는 메서드를 오버로딩하고 있기 때문에 다른 조건을 추가할 수 있다.

<div class="post_comments">[역주] 'predicate'를 술어로 번역하였습니다. 주어에 대해 주장되는 개념으로 '스프링은 프레임워크다', '꽃은 아름답다'
와 같은 문장이 있을 때, '프레임워크', '아름답다' 에 해당합니다.</div>

<br>

### Predicates
직접 `RequestPredicate`를 작성할 수 있지만, `RequestPredicates` 유틸리티 클래스는 요청 경로, HTTP 메서드, 콘텐츠 유형 등을 기반으로 공통적으로
사용되는 구현체들을 제공한다. 아래는 요청 술어(request predicates)를 사용하여 `Accept` 헤더에 기반한 조건을 생성하는 예제다.

#### Java:
```java
RouterFunction<ServerResponse> route = RouterFunctions.route()
    .GET("/hello-world", accept(MediaType.TEXT_PLAIN),
        request -> ServerResponse.ok().bodyValue("Hello World")).build();
```

#### Kotlin:
```kotlin
val route = coRouter {
    GET("/hello-world", accept(TEXT_PLAIN)) {
        ServerResponse.ok().bodyValueAndAwait("Hello World")
    }
}
```

다음을 사용하여 여러 요청 술어를 함께 작성할 수 있다.

- `RequestPredicate.and(RequestPredicate)` - 둘 다 만족해야 한다.
- `RequestPredicate.or(RequestPredicate)` - 둘 중 하나라도 만족하면 된다.

`RequestPredicates`에는 많은 술어가 구성되어 있다. 예를 들어 `RequestPredicates.GET(String)`은
`RequestPredicates.method(HttpMethod)`와 `RequestPredicates.path(String)`으로 구성된다. 위의 예제에서의 빌더도 내부적으로
`RequestPredicates.GET`와 accept 술어(predicate)를 같이 구성한다.

<br>

### Routes
라우터 함수는 순서대로 실행된다: 첫 번째 경로가 일치하지 않으면 두 번째를 실행하는 방식이다. 따라서, 일반적인 경로보다 구체적인 경로를 먼저 선언해야 한다.
이 동작은 어노테이션 기반 프로그래밍 모델과 다르다. 어노테이션 기반에서는 "가장 구체적인" 컨트롤러 메서드가 자동으로 선택된다.

라우터 함수 빌더를 사용하면, 정의된 모든 라우터는 `build()`에서 리턴되는 하나의 `RouterFunction`으로 구성된다. 또한 여러 라우터 기능을 함께 구성하는
다른 방법도 있다.

- `RouterFunctions.route()` 빌더의 `add(RouterFunction)`
- `RouterFunction.and(RouterFunction)`
- `RouterFunction.andRoute(RequestPredicate, HandlerFunction)` - `RouterFunction.and()` 와
중첩된 `RouterFunctions.route()` 의 축약형

다음 예제는 4개의 라우팅 구성을 보여준다:

#### Java:
```java
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.web.reactive.function.server.RequestPredicates.*;

PersonRepository repository = ...
PersonHandler handler = new PersonHandler(repository);

RouterFunction<ServerResponse> otherRoute = ...

RouterFunction<ServerResponse> route = route()
    .GET("/person/{id}", accept(APPLICATION_JSON), handler::getPerson) (1)
    .GET("/person", accept(APPLICATION_JSON), handler::listPeople) (2)
    .POST("/person", handler::createPerson) (3)
    .add(otherRoute) (4)
    .build();
```

#### Kotlin:
```kotlin
import org.springframework.http.MediaType.APPLICATION_JSON

val repository: PersonRepository = ...
val handler = PersonHandler(repository);

val otherRoute: RouterFunction<ServerResponse> = coRouter {  }

val route = coRouter {
    GET("/person/{id}", accept(APPLICATION_JSON), handler::getPerson) (1)
    GET("/person", accept(APPLICATION_JSON), handler::listPeople) (2)
    POST("/person", handler::createPerson) (3)
}.and(otherRoute) (4)
```

> (1) `GET /person/{id}`와 `Accept` 헤더가 JSON으로 매핑되면 `PersonHandler.getPerson`으로 라우팅한다. <br>
> (2) `GET /person`과 `Accept` 헤더가 JSON으로 매핑되면 `PersonHandler.listPeople`로 라우팅한다. <br>
> (3) `POST /person`이 매핑되면 `PersonHandler.createPerson`으로 라우팅한다. 그리고 <br>
> (4) `otherRoute`는 다른 곳에서 만들어진 라우터 함수다. 라우팅에 추가한다. (나머지 요청을 처리한다)

<br>

### Nested Routes
라우터 함수 그룹은 경로를 공유하는 것처럼 일반적으로 술어(predicate)를 공유한다. 위의 예제에서 공유된 술어는 3개의 라우팅에서 사용된 `/person`에
매핑되는 경로 술어다. 어노테이션을 사용할 때 `/person`에 매핑되는 타입 레벨 `@RequestMapping` 어노테이션을 사용하여 이러한 중복을 제거했다.
**WebFlux.fn**에서는 라우터 함수 빌더의 `path` 메서드로 경로 술어를 공유할 수 있다. 예를 들어, 위 예제의 마지막 몇 줄은 중첩된 라우팅을 사용하여
아래와 같이 개선될 수 있다:

#### Java:
```java
RouterFunction<ServerResponse> route = route()
    .path("/person", builder -> builder (1)
        .GET("/{id}", accept(APPLICATION_JSON), handler::getPerson)
        .GET("", accept(APPLICATION_JSON), handler::listPeople)
        .POST("/person", handler::createPerson))
    .build();
```

> (1) `path` 메서드의 두 번째 파라미터는 라우터 빌더를 사용하는 컨슈머다.

#### Kotlin:
```kotlin
val route = coRouter {
    "/person".nest {
        GET("/{id}", accept(APPLICATION_JSON), handler::getPerson)
        GET("", accept(APPLICATION_JSON), handler::listPeople)
        POST("/person", handler::createPerson)
    }
}
```

경로 기반 중첩이 가장 일반적이지만 빌더에서 `nest` 메서드를 사용하여 모든 유형의 술어를 중첩할 수 있다. 위의 예제는 여전히 `Accept` 헤더가 중복이다.
`accept`와 `nest` 메서드를 함께 사용하면 더 개선할 수 있다:

#### Java:
```java
RouterFunction<ServerResponse> route = route()
    .path("/person", b1 -> b1
        .nest(accept(APPLICATION_JSON), b2 -> b2
            .GET("/{id}", handler::getPerson)
            .GET("", handler::listPeople))
        .POST("/person", handler::createPerson))
    .build();
```

#### Kotlin:
```kotlin
val route = coRouter {
    "/person".nest {
        accept(APPLICATION_JSON).nest {
            GET("/{id}", handler::getPerson)
            GET("", handler::listPeople)
            POST("/person", handler::createPerson)
        }
    }
}
```

<br>

## 1.5.4. 서버 실행(Running a Server)
HTTP 서버에서 어떻게 라우터 기능을 실행할까? 간단한 옵션은 다음 중 하나를 사용하여 라우터 기능을 `HttpHandler`로 변환하는 것이다.

- `RouterFunctions.toHttpHandler(RouterFunction)`
- `RouterFunctions.toHttpHandler(RouterFunction, HandlerStrategies)`

반환된 `HttpHandler`를 서버 지사사항에 따라 서버 어댑터와 함께 사용할 수 있다.

스프링 부트에서도 사용되는 보다 일반적인 옵션은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">Webflux Config</a>를
통해 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-dispatcher-handler" rel="nofollow" target="_blank">`DispatcherHandler`</a> 기반 설정으로 실행하는 것이다.
**WebFlux Config**는 스프링 설정을 사용하여 요청을 처리하는데 필요한 컴포넌트를 선언한다. 웹플럭스 자바 설정은 함수형 엔드포인트를 지원하기 위해
아래와 같은 컴포넌트를 지원한다:

- `RouterFunctionMapping`: 스프링 설정에서 하나 이상의 `RouterFunction<?>` 빈을 찾고 `RouterFunction.andOther`로 결합한 후
요청을 구성한 `RouterFunction`으로 라우팅한다.
- `HandlerFunctionAdapter`: `DispatcherHandler`가 요청에 매핑된 `HandlerFunction`을 호출할 수 있게 도와주는 간단한 어댑터다.
- `ServerResponseResultHandler`: `ServerResponse`의 `writeTo` 메서드로 `HandlerFunction` 호출 결과를 처리한다.

위에서 살펴본 컴포넌트들은 함수형 엔드포인트가 `DispatcherHandler` 요청 처리 라이프 사이클에 적합하고 어노테이션 컨트롤러가 선언되어 있다면, 이와
함께(잠재적으로) 실행될 수 있도록 한다. 이것은 또한 스프링 부트 웹플럭스 스타터(starter)가 함수형 엔드포인트를 적용하는 방식이다.

다음 예제는 웹플럭스 자바 설정을 보여준다. (실행 방법은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-dispatcher-handler" rel="nofollow" target="_blank">DispatcherHandler</a>를 참조하라):

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Bean
    public RouterFunction<?> routerFunctionA() {
        // ...
    }

    @Bean
    public RouterFunction<?> routerFunctionB() {
        // ...
    }

    // ...

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        // configure message conversion...
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // configure CORS...
    }

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        // configure view resolution for HTML rendering...
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    @Bean
    fun routerFunctionA(): RouterFunction<*> {
        // ...
    }

    @Bean
    fun routerFunctionB(): RouterFunction<*> {
        // ...
    }

    // ...

    override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
        // configure message conversion...
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        // configure CORS...
    }

    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        // configure view resolution for HTML rendering...
    }
}
```

<br>

## 1.5.5. Filtering Handler Functions
라우팅 함수 빌더의 `before`, `after` 또는 `filter` 메서드를 사용하여 핸들러 함수를 필터링할 수 있다. 어노테이션으로는 `@ControllerAdvice`,
`ServletFilter` 또는 둘 다를 사용하여 유사한 기능을 수행할 수 있다. 필터는 빌더의 모든 라우팅에 적용된다. 그러니까, 중첩된 라우팅에 정의된 필터는
"최상위" 라우팅에 적용되지 않는다는 것이다. 예를 들어, 아래 예제를 보라:

#### Java:
```java
RouterFunction<ServerResponse> route = route()
    .path("/person", b1 -> b1
        .nest(accept(APPLICATION_JSON), b2 -> b2
            .GET("/{id}", handler::getPerson)
            .GET("", handler::listPeople)
            .before(request -> ServerRequest.from(request) (1)
                .header("X-RequestHeader", "Value")
                .build()))
        .POST("/person", handler::createPerson))
    .after((request, response) -> logResponse(response)) (2)
    .build();
```

#### Kotlin:
```kotlin
val route = router {
    "/person".nest {
        GET("/{id}", handler::getPerson)
        GET("", handler::listPeople)
        before { (1)
            ServerRequest.from(it)
                    .header("X-RequestHeader", "Value").build()
        }
        POST("/person", handler::createPerson)
        after { _, response -> (2)
            logResponse(response)
        }
    }
}
```

> (1) 커스텀 요청 헤더를 추가하는 `before` 필터의 경우 두 개의 GET 라우팅에만 적용된다.<br>
> (2) 로그를 기록하는 `after` 필터의 경우 중첩된 경로를 포함하여 모든 라우팅에 적용된다.

라우터 빌더에 있는 `filter` 메서드는 `HandlerFilterFunction`을 인자로 받는다. 이는 `ServerRequest`와 `HandlerFunction`을 받아
`ServerResponse`를 반환하는 함수다. 핸들러 함수 매개변수는 체인의 다음 요소를 나타낸다. 다음 요소는 일반적으로 라우팅되는 핸들러지만 여러 개 필터가
적용되는 경우에는 다른 필터가 될 수도 있다.

이제 특정 경로의 접근 여부를 결정할 수 있는 `SecurityManager`가 있다고 가정하고 간단한 보안 필터를 추가할 수 있다. 다음 예제는 이를 수행하는 방법을
보여준다:

#### Java:
```java
SecurityManager securityManager = ...

RouterFunction<ServerResponse> route = route()
    .path("/person", b1 -> b1
        .nest(accept(APPLICATION_JSON), b2 -> b2
            .GET("/{id}", handler::getPerson)
            .GET("", handler::listPeople))
        .POST("/person", handler::createPerson))
    .filter((request, next) -> {
        if (securityManager.allowAccessTo(request.path())) {
            return next.handle(request);
        }
        else {
            return ServerResponse.status(UNAUTHORIZED).build();
        }
    })
    .build();
```

#### Kotlin:
```kotlin
val securityManager: SecurityManager = ...

val route = router {
        ("/person" and accept(APPLICATION_JSON)).nest {
            GET("/{id}", handler::getPerson)
            GET("", handler::listPeople)
            POST("/person", handler::createPerson)
            filter { request, next ->
                if (securityManager.allowAccessTo(request.path())) {
                    next(request)
                }
                else {
                    status(UNAUTHORIZED).build();
                }
            }
        }
    }
```

앞선 예제는 `next.handle(ServerRequest)` 실행이 선택 사항임을 보여준다. 접근이 허용된 경우에만 핸들러 함수가 실행된다.
라우터 함수 빌더의 `filter` 메서드를 사용하는 것 외에, `RouterFunction.filter(HandlerFilterFunction)`을 통해 기존 라우터 함수에 필터를
적용할 수 있다.

> 함수형 엔드포인트에 대한 CORS 지원은 `CorsWebFilter`를 통해 제공된다.

<br>

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-url-links">다음글 "1.6. URI Links" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>