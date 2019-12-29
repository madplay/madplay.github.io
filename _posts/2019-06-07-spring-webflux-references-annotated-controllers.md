---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.4. Annotated Controllers"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.4. Annotated Controllers"
category: Spring
date: "2019-06-07 23:59:22"
comments: true
---

# 1.4. 어노테이션 컨트롤러(Annotated Controllers)
스프링 웹플럭스는 어노테이션 기반 프로그래밍 모델을 제공하며 `@Controller`와 `@RestController` 컴포넌트는 어노테이션을 사용하여 요청 매핑,
요청 입력, 예외 처리 등의 기능을 제공한다. 어노테이션 컨트롤러는 유연한 메서드 시그니처를 가지며 기반 클래스를 확장하거나 특정 인터페이스를 구현할 필요가 없다.

아래는 기본적인 예제이다.

<ul class="nav nav-tabs _code_box">
    <li class="active">
        <a href="javascript:void(0);" data-language-type="java">Java</a>
    </li>
    <li>
        <a href="javascript:void(0);" data-language-type="kotlin">Kotlin</a>
    </li>
</ul>

#### Java:
```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String handle() {
        return "Hello WebFlux";
    }
}
```

#### Kotlin:
```kotlin
@RestController
class HelloController {

    @GetMapping("/hello")
    fun handle() = "Hello WebFlux"
}
```

앞선 예제에서 메서드는 응답 본문(Response body)에 사용할 문자열(String)을 반환한다.

<br>

## 1.4.1. `@Controller`
표준 스프링 빈 정의를 따라 컨트롤러 빈을 정의할 수 있다. `@Controller` 스트레오 타입은 클래스 패스에서 `@Component` 클래스를 감지하고 자동 빈 등록을
허용한다. 또한 웹 컴포넌트의 역할임을 나타내는 어노테이션이 달린 클래스(annotated class)의 스트레오 타입 역할을 한다.

이러한 `@Controller` 빈의 자동 감지를 사용하려면, 아래 예제와 같이 자바 설정에 컴포넌트 스캔을 추가한다.

#### Java:
```java
@Configuration
@ComponentScan("org.example.web") // (1)
public class WebConfig {

    // ...
}
```

#### Kotlin:
```kotlin
@Configuration
@ComponentScan("org.example.web") // (1)
class WebConfig {

    // ...
}
```

> (1) org.example.web 패키지를 스캔한다.

`@RestController`는 `@Controller`와 `@ResponseBody`가 합쳐진 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-meta-annotations" rel="nofollow" target="_blank">composed annotation</a>로,
모든 메서드가 타입 레벨 `@ResponseBody`가 적용되므로 뷰 리졸루션과 HTML 템플릿 렌더링 대신에 응답 본문(response body)에 직접 응답을
작성한다.

<br>

## 1.4.2. 리퀘스트 매핑(Request Mapping)
`@RequestMapping` 어노테이션은 요청을 컨트롤러 메서드에 매핑하는데 사용된다. 이 어노테이션은 URL, HTTP 메서드, 요청 매개변수, 헤더 및 미디어 타입별로
요청을 매칭할 수 있는 다양한 속성을 가지고 있다. 클래스 레벨에서 매핑을 공유할 수 있고, 메서드 레벨에서 특정 엔드 포인트 매핑으로 좁히기 위해 사용할 수도 있다.

HTTP 메서드에 대한 `@RequestMapping`의 변형도 있다:

- `@GetMapping`
- `@PostMapping`
- `@PutMapping`
- `@DeleteMapping`
- `@PatchMapping`

위의 어노테이션들은 모든 HTTP 메서드에 매핑되어 HTTP 메서드가 구분되지 않는 기본 형태의 `@RequestMapping`을 사용하는 대신에 특정 HTTP 메서드에
매핑되는 것이 더 권장되므로 제공되는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestmapping-composed" rel="nofollow" target="_blank">커스텀 어노테이션(Custom Annotations)</a>이다.
동시에 `@RequestMapping`은 클래스 레벨에서 공유된 매핑을 표현하기 위해서 여전히 필요하다.

아래는 그 유형과 메서드 레벨 매핑을 사용한 예제다.

#### Java:
```java
@RestController
@RequestMapping("/persons")
class PersonController {

    @GetMapping("/{id}")
    public Person getPerson(@PathVariable Long id) {
        // ...
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void add(@RequestBody Person person) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@RestController
@RequestMapping("/persons")
class PersonController {

    @GetMapping("/{id}")
    fun getPerson(@PathVariable id: Long): Person {
        // ...
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun add(@RequestBody person: Person) {
        // ...
    }
}
```

<br>

### URI 패턴(URI Patterns)
글롭 패턴(glob pattern)과 와일드 카드를 사용하여 요청을 매핑할 수 있다:

| 패턴 | 설명 | 예제
|--|--|--|
| `?` | 한 문자와 매칭된다 | `"/pages/t?st.html"` 인 경우 `"/pages/test."`, `"/pages/t3st.html"` 가 매칭된다. |
| `*` | 한 경로 세그먼트 안에서 0개 이상의 문자와 매칭된다 | `"/resources/*.png"` 인 경우 `"/resources/file.png"` 가 매칭된다. <br><br> `"/projects/*/versions"` 인 경우 `"/projects/spring/versions"`는 매칭되지만 `"/projects/spring/boot/versions"` 는 매칭되지 않는다. |
| `**` | 경로의 세그먼트를 포함, 0개 이상의 문자와 매칭된다 | `"/resources/**"` 인 경우 `"/resources/file.png"`와 `"/resources/images/file.png"`가 매칭된다. <br><br> `**`는 경로 끝에만 허용되므로 `"/resources/**/file.png"`는 유효하지 않다. |
| `{name}` | 경로 세그먼트로 일치시키고 "name" 이라는 변수로 매칭시킨다. | `"/projects/{project}/versions"`인 경우 `"/projects/spring/versions"` 가 매칭되며 `project=spring`로 변수가 매칭된다. |
| `{name:[a-z]+}` | 정규식 "[a-z]+"를 "name" 이라는 경로 변수(path variable)로 일치시킨다. | `"/projects/{project:[a-z]+}/versions"` 인 경우 `"/projects/spring/versions"`는 매칭되지만 `"/projects/spring1/versions"`는 매칭되지 않는다. |
| `{*path}` | 경로 끝까지 0개 이상의 경로 세그먼트를 일치시키고 "path" 라는 변수로 매칭시킨다. | `"/resources/{*file}"` 인 경우 `"/resources/images/file.png"` 와 매칭되고 `file=resources/file.png`로 변수가 매칭된다.

캡쳐된 URI 변수는 아래 예제와 같이 `@PathVariable`을 사용하여 접근할 수 있다.

#### Java:
```java
@GetMapping("/owners/{ownerId}/pets/{petId}")
public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/owners/{ownerId}/pets/{petId}")
fun findPet(@PathVariable ownerId: Long, @PathVariable petId: Long): Pet {
    // ...
}
```

아래 예제와 같이 클래스와 메서드 레벨에서 URI 변수를 선언할 수 있다.

#### Java:
```java
@Controller
@RequestMapping("/owners/{ownerId}") // (1)
public class OwnerController {

    @GetMapping("/pets/{petId}") // (2)
    public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@Controller
@RequestMapping("/owners/{ownerId}") // (1)
class OwnerController {

    @GetMapping("/pets/{petId}") // (2)
    fun findPet(@PathVariable ownerId: Long, @PathVariable petId: Long): Pet {
        // ...
    }
}
```

> (1) 클래스 레벨 URI 매핑, (2) 메서드 레벨 URI 매핑

URI 변수는 자동으로 적절헌 타입으로 변환되거나 `TypeMismatchException`이 발생한다. 단순 타입(int, long, Data 등)은 기본적으로
지원되며, 다른 데이터 타입에 대한 지원도 등록 가능하다. 타입 변환(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-typeconversion" rel="nofollow" target="_blank">Type Conversion</a>)과 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-initbinder" rel="nofollow" target="_blank">`DataBinder`</a>를 참조하라.

URI 변수의 이름을 명시적으로 지정할 수 있지만(예를 들어, `@PathVariable("customId")`) 이름이 동일하고, 디버깅 정보 또는 Java 8의
`-parameters` 컴파일러 플래그로 코드를 컴파일하는 경우 이런 세부 정보는 생략할 수 있다.

`{*varName}` 구문은 0개 이상의 나머지 경로 세그먼트와 일치하는 URI 변수를 선언한다. 예를 들면 `/resources/{*path}`는 `/resources`의 모든
파일과 일치하며, "path" 변수는 전체 상대 경로를 캡쳐한다.

`{varName:regex}` 구문은 URI 변수를 `{varName:regex}`인 정규식을 사용하여 선언한다. 예를 들어 `/spring-web-3.0.5 .jar`의 URL을 지정하면
아래 이어지는 메서드와 같은 방법으로 이름, 버전 그리고 파일 확장자를 추출한다.

#### Java:
```java
@GetMapping("/{name:[a-z-]+}-{version:\\d\\.\\d\\.\\d}{ext:\\.[a-z]+}")
public void handle(@PathVariable String version, @PathVariable String ext) {
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/{name:[a-z-]+}-{version:\\d\\.\\d\\.\\d}{ext:\\.[a-z]+}")
fun handle(@PathVariable version: String, @PathVariable ext: String) {
    // ...
}
```

URI 경로 패턴에는 시작 시점에 로컬, 시스템, 환경 그리고 기타 속성 소스에 대해 `PropertyPlaceHolderConfigurer`를 통해 리졸빙되는 `${...}`
플레이스 홀더를 포함되어 있을 수 있다. 예를 들어, 일부 외부 설정을 기반으로 하는 기본 URL을 파라미터화하는데 사용할 수 있다.

> 스프링 웹플럭스는 URI 경로 매칭을 위해 `PathPattern`과 `PathPatternParser`를 사용한다. 두 클래스 모두 `spring-web`에 포함되며,
런타임에 많은 URI 경로 패턴 매칭이 일어나는 웹 애플리케이션에서 HTTP URL 경로와 함께 사용하도록 명시적으로 설계됐다.

스프링 MVC에서는 `/person`이 `/person.*`에 매칭되지만 스프링 웹플럭스에서는 이와 같은 접미사 패턴 매칭을 지원하지 않는다.
URI 기반 컨텐츠 협상(content negotiation)의 경우, 필요하다면 더 간단하고 명시적이며 URL 경로를 악용에 대해 덜 취약한 쿼리 파라미터 사용을 권장한다.

<br>

### 패턴 비교(Pattern Comparison)
여러 패턴이 URL과 매칭되면 가장 일치하는 패턴을 찾기 위해 패턴을 비교해야 한다. 이는 `PathPattern.SPECIFICITY_COMPARATOR`를 통해 보다 구체적인
패턴을 찾는 작업이 수행된다.

모든 패턴에 대해 URI 변수와 와일드카드 숫자를 기반으로 점수가 계계산된다. URI 변수는 와일드카드보다 점수가 낮다. 총점이 낮은 패턴이 선택되며 두 패턴의
점수가 같다면 더 긴 패턴이 선택된다.

포괄(Catch-all) 패턴(예를 들어, `**`, `{*varName}`)은 점수 계산에서 제외되며 항상 마지막 순위를 갖는다. 두 패턴이 모두 포괄적인 경우
더 긴 패턴이 선택된다.

<br>

### 소비 가능한 미디어 타입(Consumable Media Types)
다음 예제와 같이 요청의 `Content-Type`을 기반으로 요청 매핑을 좁힐 수 있다.

#### Java:
```java
@PostMapping(path = "/pets", consumes = "application/json")
public void addPet(@RequestBody Pet pet) {
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/pets", consumes = ["application/json"])
fun addPet(@RequestBody pet: Pet) {
    // ...
}
```

**consumes** 속성은 부정 표현식도 지원한다. 예를 들어 `!text/plain`은 `text/plain` 이외의 모든 컨텐츠 타입을 의미한다.

클래스 레벨에서 consumes 속성을 선언하여 공유할 수 있다. 하지만 대부분의 다른 요청 매핑 속성과 달리 클래스 레벨에서 사용되는 경우 메서드 레벨에서는
클래스 레벨에서 선언한 것을 확장하기보다는 속성을 재정의한다.

> `MediaType`은 일반적으로 사용되는 미디어 타입(예를 들어, `APPLICATION_JSON_VALUE`와 `APPLICATION_XML_VALUE`)에 대한 상수를 제공한다.

<br>

### 생산 가능한 미디어 타입(Producible Media Types)
다음 예제와 같이 `Accept` 요청 헤더와 컨트롤러 메서드가 생성하는 컨텐츠 타입 목록을 기반으로 요청 매핑을 좁힐 수 있다:

#### Java:
```java
@GetMapping(path = "/pets/{petId}", produces = "application/json")
@ResponseBody
public Pet getPet(@PathVariable String petId) {
    // ...
}
```
#### Kotlin:
```kotlin
@GetMapping("/pets/{petId}", produces = ["application/json"])
@ResponseBody
fun getPet(@PathVariable String petId): Pet {
    // ...
}
```

이 미디어 타입은 문자 집합을 지정할 수 있다. 예를 들어 `!text/plain`은 `text/plain`을 이외의 모든 컨텐츠 타입을 의미한다.

클래스 레벨에서 공유용 produces 속성을 선언할 수 있다. 그러나 대부분의 요청 매핑 속성과 다르게 클래스 레벨에서 사용할 경우 메서드 레벨에서는
클래스 레벨에서의 선언을 확장하기보다는 속성을 재정의한다.

> `MediaType`은 일반적으로 사용되는 미디어 타입(예를 들어, `APPLICATION_JSON_VALUE`와 `APPLICATION_XML_VALUE`)에 대한 상수를 제공한다.

<br>

### 파라미터와 헤더(Parameters and Headers)
쿼리 파라미터 조건으로 요청 매핑 범위를 좁힐 수 있다. 쿼리 파라미터(myParam)가 있는지, 없는지(!myParam) 또는 특정값(myParam=myValue)을
테스트 할 수 있다. 아래 예제에서는 값을 가진 파라미터를 테스트한다.

#### Java:
```java
@GetMapping(path = "/pets/{petId}", params = "myParam=myValue") (1)
public void findPet(@PathVariable String petId) {
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/pets/{petId}", params = ["myParam=myValue"]) (1)
fun findPet(@PathVariable petId: String) {
    // ...
}
```

> (1) `myParam`의 값이 `myValue`와 같은지 확인하라.

아래 예제와 같이 요청 헤더 조건에 동일하게 사용할 수도 있다.

#### Java:
```java
@GetMapping(path = "/pets", headers = "myHeader=myValue") (1)
public void findPet(@PathVariable String petId) {
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/pets", headers = ["myHeader=myValue"]) (1)
fun findPet(@PathVariable petId: String) {
    // ...
}
```

> (1) `myHeader`의 값이 `myValue`와 같은지 확인하라.

<br>

### HTTP HEAD, OPTIONS
`@GetMapping`과 `@RequestMapping(method=HttpMethod.GET)`은 요청 매핑 목적의 HTTP HEAD를 투명하게 지원한다.
컨트롤러 메서드는 변경할 필요가 없다. `HttpHandler` 서버 어댑터에 적용된 응답 래퍼는 `Content-Length` 헤더가 실제로 응답에 쓰이지 않고
바이트 수로 설정되도록 한다.

기본적으로 HTTP OPTIONS은 매칭 URL 패턴을 갖는 모든 `@RequestMapping` 메서드의 HTTP 메서드 목록에 Allow 응답 헤더를 설정하여 핸들링 된다.

HTTP 메서드 선언이 없는 `@RequestMapping`의 경우 Allow 헤더는 GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS로 설정된다. 컨트롤러 메서드는
항상 지원되는 HTTP 메서드를 선언해야 한다. (예를 들어, `@GetMapping`, `@PostMapping` 등)

`@RequestMapping` 메서드를 HTTP HEAD와 HTTP OPTIONS으로 명시적으로 매핑할 수 있지만 일반적으로 필요하지 않다.

<br>

### 사용자 정의 어노테이션(Custom Annotations)
스프링 웹플럭스는 요청 매핑을 위해 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-meta-annotations" rel="nofollow" target="_blank">composed annotations</a> 사용을 지원한다.
이러한 어노테이션들은 `@RequestMapping`으로 메타 어노테이션이 달렸으며, 더 구체적인 목적으로 `@RequestMapping` 속성의
일부분(또는 모든)을 다시 선언하도록 구성되었다.

`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, 그리고 `@PatchMapping`이 조합 어노테이션의 예이다. 기본형으로
`@RequestMapping`을 사용하여 모든 HTTP 메서드와 일치시키는 것보다, 대부분 컨트롤러 메서드는 특정 HTTP 메서드에 매핑되는 것이 권장되기 때문에
이러한 어노테이션이 제공된다. 예제가 필요하다면 이 어노테이션들이 어떻게 선언되었는지 살펴보라.

스프링 웹플럭스는 또한 사용자 정의(custom) 요청 매칭 로직을 가진 사용자 정의 요청 매핑 속성을 지원한다. 이는 `RequestMappingHandlerMapping`의
확장을 필요로 하고 `getCustomMethodCondition` 메서드를 재정의(override) 하는 고급 옵션으로서 사용자 지정 속성을 확인하고 사용자만의 고유한
`RequestCondition`을 반환할 수 있다.

<br>

### 명시적 등록(Explicit Registrations)
핸들러 메서드를 프로그래밍 방식으로 등록할 수 있다. 이 방법은 동적으로 등록하거나 동일한 핸들러의 서로 다른 인스턴스로 다른 URL을 처리하는 경우처럼
보다 고급 사례에 사용할 수 있다. 아래 예제는 이를 수행하는 방법이다:

#### Java:
```java
@Configuration
public class MyConfig {

    @Autowired
    public void setHandlerMapping(RequestMappingHandlerMapping mapping, UserHandler handler) // (1)
            throws NoSuchMethodException {

        RequestMappingInfo info = RequestMappingInfo
                .paths("/user/{id}").methods(RequestMethod.GET).build(); // (2)

        Method method = UserHandler.class.getMethod("getUser", Long.class); // (3)

        mapping.registerMapping(info, handler, method); // (4)
    }
}
```

#### Kotlin:
```kotlin
@Configuration
class MyConfig {

    @Autowired
    fun setHandlerMapping(mapping: RequestMappingHandlerMapping, handler: UserHandler) { // (1)

        val info = RequestMappingInfo.paths("/user/{id}").methods(RequestMethod.GET).build() // (2)

        val method = UserHandler::class.java.getMethod("getUser", Long::class.java) // (3)

        mapping.registerMapping(info, handler, method) // (4)
    }
}
```

> (1) 타겟 핸들러와 핸들러 매핑을 컨트롤러에 주입한다.
> (2) 요청 매핑 데이터를 준비한다.
> (3) 핸들러 메서드를 얻는다.
> (4) 등록을 추가한다.

<br>

## 1.4.3. 핸들러 메서드(Handler Methods)
`@RequestMapping` 핸들러 메서드는 유연한 시그니처를 가지며, 지원되는 다양한 컨트롤러 메서드 인자와 반환값을 선택할 수 있다.

<br>

### 메서드 인자(Method Arguments)
다음 표는 지원되는 컨트롤러 메서드 인자를 보여준다.

리액티브 타입(Reactor, RxJava, 기타 등) 블로킹 I/O(예를 들어, request body 읽기)를 요구하는 인자를 지원한다.
이는 설명(Description) 열에 표시되어 있다. 블로킹이 필요하지 않은 인자는 리액티브 타입을 필요로 하지 않는다.

JDK 1.8의 `java.util.Optional`은 필수(`required`) 속성(예를 들어, `@RequestParam`, `@RequestHeader` 등)이 있는
어노테이션과 함께 메서드 인자로 지원되며 `required=false`와 같다.

컨트롤러 메서드 시그니처 | 설명(Description)
| -- | -- |
`ServerWebExchange` | `ServerWebExchange` 전체에 접근한다. - 이는 HTTP 요청과 응답, 세션 속성, `checkNotModified` 메서드 등을 포함하고 있는 컨테이너다.
`ServerHttpRequest`, `ServerHttpResponse` | HTTP 요청 또는 응답에 접근한다.
`WebSession` | 세션에 접근한다. 따로 추가한 속성이 없다면 새로운 세션을 강제로 열지 않는다. 리액티브 타입을 지원한다. 
`java.security.Principal` | 현재 인증된 사용자 - 특정 `Principal` 구현 클래스일 수 있다. 리액티브 타입을 지원한다.
`org.springframework.http.HttpMethod` | 요청 HTTP 메서드
`java.util.Locale` | 현재 요청의 locale 정보다. 사용 가능한 가장 구체적인 `LocaleResolver`에 의해 결정된다. 사실상 설정된 `LocaleResolver`/`LocaleContextResolver`
`java.util.TimeZone` + `java.time.ZoneId` | `LocaleContextResolver`에 의해 결정된 현재 요청과 관련된 타임존
`@PathVariable` | URI 템플릿 변수로 접근하기 위해 사용. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestmapping-uri-templates" rel="nofollow" target="_blank">URI Patterns</a> 참조.
`@MatrixVariable` | URI 경로 세그먼트의 이름-값(name-value) 쌍에 접근하기 위해 사용. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-matrix-variables" rel="nofollow" target="_blank">Matrix Variables</a> 참조.
`@RequestParam` | 서블릿 요청 파라미터에 접근한다. 파라미터 값은 선언된 메서드 인자 타입으로 변환된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestparam" rel="nofollow" target="_blank">`@RequestParam`</a> 참조<br><br>`@RequestParam` 사용은 다. - 예를 들어, 속성을 설정하기 위해 사용할 수 있다. 이 표의 "그 외의 인자"를 참조.
`@RequestHeader` | 요청 헤더에 접근한다. 헤더 값은 선언된 메서드 인자 타입으로 변환된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestheader" rel="nofollow" target="_blank">`@RequestHeader`</a> 참조
`@CookieValue` | 쿠키에 접근한다. 쿠키 값은 선언된 메서드 인자 타입으로 변환된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-cookievalue" rel="nofollow" target="_blank">`@CookieValue`</a> 참조
`@RequestBody` | HTTP request body에 접근한다. 본문 콘텐츠는 `HttpMessageReader` 인스턴스를 사용하여 선언된 메서드 인자 타입으로 변환된다. 리액티브 타입을 지원한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestbody" rel="nofollow" target="_blank">`@RequestBody`</a> 참조
`@HttpEntity<B>` | 요청 헤더와 본문에 접근한다. body는 `HttpMessageReader` 인스턴스로 변환된다. 리액티브 타입을 지원한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-httpentity" rel="nofollow" target="_blank">`HttpEntity`</a> 참조
`@RequestPart` | 멀티파트 / 폼 데이터 요청에서 part에 접근한다. 리액티브 타입을 지원한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multipart-forms" rel="nofollow" target="_blank">Multipart Content</a>와 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multipart" rel="nofollow" target="_blank">Multipart Data</a> 참조
`java.util.Map`, `org.springframework.ui.Model`, `org.springframework.ui.ModelMap` | HTML 컨트롤러에서 사용되며 뷰 렌더링의 일부로 템플릿이 되는 모델에 접근한다.
`@ModelAttribute` | 데이터 바인딩과 유효성 검사가 적용된 모델(없다면 인스턴스화)의 기존 속성에 접근한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-modelattrib-method-args" rel="nofollow" target="_blank">`@ModelAttribute`</a>, <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-modelattrib-methods" rel="nofollow" target="_blank">`Model`</a>, <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-initbinder" rel="nofollow" target="_blank">`DataBinder`</a> 참조<br><br>`@ModelAttribute`를 사용하는 것은 선택적이다. 예를 들어, 이 어노테이션의 속성을 설정하기 위해 사용할 수 있다. 이 표의 "그 외 인자" 부분을 참조하라.
`Erros`, `BindingResult` | 커맨드 객체에 대한 유효성 검사와 데이터 바인딩에서의 오류에 접근한다. (예: `@ModelAttribute` 인자) `Erros` 또는 `BindingResult` 인자는 유효성 검증 대상 메서드 인자 바로 뒤에 선언돼야 한다.
`SessionStatus` + 클래스레벨 `@SessionAttributes` | 요청 처리 완료를 위해 사용한다. 클래스 레벨 `@SessionAttributes` 어노테이션을 통해서 선언된 세션 속성을 비운다. 더 자세한 정보는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-sessionattributes" rel="nofollow" target="_blank">`@SessionAttributes`</a>
`UriComponentsBuilder` | 현재 요청의 호스트, 포트, 스키마, 경로와 관련된 URL을 준비한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-uri-building" rel="nofollow" target="_blank">URI Links</a> 참조
`@SessionAttribute` | 모든 세션 속성에 접근하기 위해 사용한다. 클래스 레벨 `@SessionAttributes` 선언하면 세션에 모델 속성을 저장하는 것과 다르다. 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-sessionattribute" rel="nofollow" target="_blank">`@SessionAttribute`</a> 참조
`@RequestAttribute` | 요청 속성에 접근한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-requestattrib" rel="nofollow" target="_blank">`@RequestAttribute`</a> 참조
그 외의 인자 | 메서드 인자가 위의 어떤 것과도 일치하지 않을 때, <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-" rel="nofollow" target="_blank">BeanUtils#isSimpleProperty</a>에 의해 결정된 간단한 타입인 경우 기본적으로 `@RequestParam`을 통해 리졸브되고, 아닌 경우에는 `@ModelAttribute`로 리졸브된다.

<br>

### 반환 값(Return Values)
다음 표는 지원되는 컨트롤러 메서드 반환 값을 보여준다. Reactor, RxJava <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-libraries" rel="nofollow" target="_Blank">또는 기타</a>
라이브러리의 리액티브 타입은 일반적으로 모든 반환 값에 대해서 지원한다.

컨트롤러 메서드 반환 값 | 설명
| -- | -- |
`@ResponseBody` | 반환 값은 `HttpMessageWriter` 인스턴스를 통해 인코딩되어 response body에 작성된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-responsebody" rel="nofollow" target="_blank">`@ResponseBody`</a> 참조
`HttpEntity<B>`, `ResponseEntity<B>` | HTTP 헤더를 포함한 전체 응답을 지정한다. body는 `HttpMessageWriter`를 통해 인코딩 되어 response에 작성된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-responseentity" rel="nofollow" target="_blank">`ResponseEntity`</a> 참조
`HttpHeaders` | body가 없이 헤더로만 응답을 반환할 때 사용한다.
`String` | `ViewResolver` 인스턴스에서 사용되고 커맨드 객체와 `@ModelAttribute` 메서드로 만들어진 모델과 함께 사용되는 뷰 이름. (view name) 핸들러 메서드에서 `Model` 인자를 선언하여 프로그래밍 방식으로 더 보강할 수도 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-viewresolution-handling" rel="nofollow" target="_blank">(앞서 설명)</a>
`View` | 커맨드 객체와 `@MoelAttribute` 메서드를 통해 만들어진 모델과 함께 렌더링에 사용되는 `View` 인스턴스. 핸들러 메서드는 `Model` 인자를 받아 프로그래밍 방식으로 더 보강할 수 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-viewresolution-handling" rel="nofollow" target="_blank">(앞서 설명)</a>
`java.util.Map`, `org.springframework.ui.Model` | 모델에 속성(attribute)을 추가하기 위해 사용한다. 요청 path를 바탕으로 뷰 이름이 다.
`@ModelAttribute` | 모델에 속성을 추가하기 위해 사용한다. 요청 path를 바탕으로 뷰 이름이 결정된다.<br><br>`@ModelAttribute`는 선택적이다. 이 테이블의 "그 외의 반환값"을 참조하라.
`Rendering` | 모델과 뷰 렌더링 시나리오를 위한 API
`void` | 비동기 값(예를 들어, `Mono<Void>`)이나 `null`을 반환하는 메서드는 `ServerHttpResponse`, `ServerWebExchange` 인자를 갖거나, `@ResponseStatus` 어노테이션이 선언되있다면 응답 전체를 완전히 처리한 것으로 간주된다. 컨트롤러가 ETag나 `lastModifed` 헤더의 타임스탬프로 (클라이언트 캐시 데이터를)체크한 경우에도 마찬가지다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-caching-etag-lastmodified" rel="nofollow" target="_blank">Controllers</a>를 참조하라.<br><br>그 외에는 `void` 반환 타입은 REST 컨트롤러에서는 "response body가 없다"를 의미하며 HTML 컨트롤러에서는 디폴트 뷰(view) 이름이 선택된다.
`Flux<ServerSentEvent>`, `Observable<ServerSentEvent>` 또는 리액티브 타입 | 서버 전송 이벤트(Server Sent Event, SSE)를 발생시킨다. 오직 데이터만 전송해도 된다면 `ServerSentEvent` 래퍼는 생략할 수 있다. (단, `text/event-stream` 헤더를 사용하거나 `produces` 속성으로 매핑해야 한다.)
그 외의 반환값 | 반환값이 위의 어떤 것과도 일치하지 않을 때, 기본적으로 `String`은 뷰 이름으로 `void`는 디폴트 뷰 이름으로 적용된다. 그 밖에는 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-" rel="nofollow" target="_blank">`BeanUtils#isSimpleProperty`</a>가 단순 타입으로 판단하지 않는다면(반환값이 false라면) 모델에 추가할 모델 속성(attribute)으로 사용하고, 반대의 경우는 리졸브하지 않은 상태로 남는다.

<br>

### 타입 변환(Type Conversion)
몇몇 어노테이션 컨트롤러 메서드에 사용하는 인자는 문자열 기반으로 요청한 입력(예를 들어, `@RequestParam`, `@RequestHeader`,
`@PathVariable`, `@MatrixVariable`, `@CookieValue`)을 매핑한다. 따라서 `String`이 아닌 타입으로 선언된 경우 타입 변환이
필요할 수 있다.

이러한 경우에는 설정한 컨버터에 따라 타입 변환이 자동으로 적용된다. 기본적으로 단순 타입(예를 들어, `int`, `long`, `Date` 등)은
기본적으로 지원된다. 타입 변환은 `WebDataBinder`(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-initbinder" rel="nofollow" target="_blank">`DataBinder`</a> 참조)를 만들거나
`FormattingConversionService`(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#format" rel="nofollow" target="_blank">Spring Field Formatting</a> 참조)에 `Firnatter`를 등록함으로서
커스터마이징할 수 있다.

<br>

### 매트릭스 변수(Matrix Variables)
<a href="https://tools.ietf.org/html/rfc3986#section-3.3" rel="nofollow" target="_blank">RFC 3986</a>에서는
경로 세그먼트(path segment)의 이름/값(name/value) 쌍에 대해서 설명한다. 스프링 웹플럭스에서는 팀 버너스-리(Tim Berners-LEE)의
<a href="https://www.w3.org/DesignIssues/MatrixURIs.html" rel="nofollow" target="_blank">"오래된 게시글"</a>에
기반하여 "매트릭스 변수" 라고 부르는데, URI 경로 매개변수(URI path parameter)라고도 한다.

매트릭스 변수는 어떠한 경로 세그먼트에서든 존재할 수 있다. 각 변수는 세미콜론으로 구분되며 콤마로 나누어진 다중값으로 이루어져 있다.
예를 들어, `"/cars;color=red,green;year=2012"`, 다중값은 변수 이름이 반복될 수 있다. 예를 들어, `"color=red;color=green;color=blue"`

스프링 MVC와는 다르게 웹플럭스에서는 URI에 매트릭스 변수가 있는지 여부는 요청을 매핑하는데 영향을 주지 않는다. 다시 말하면, URI 변수를
사용할 필요가 없다. 즉, 컨트롤러 메서드에서 매트릭스 변수에 접근하려면 매트릭스 변수가 필요한 경로 세그먼트에 URI 변수를 추가하면 된다.
다암은 이를 수행하는 예제다:

#### Java:
```java
// GET /pets/42;q=11;r=22

@GetMapping("/pets/{petId}")
public void findPet(@PathVariable String petId, @MatrixVariable int q) {

    // petId == 42
    // q == 11
}
```

#### Kotlin:
```kotlin
// GET /pets/42;q=11;r=22

@GetMapping("/pets/{petId}")
fun findPet(@PathVariable petId: String, @MatrixVariable q: Int) {

    // petId == 42
    // q == 11
}
```

주어진 모든 경로 세그먼트는 매트릭스 변수를 포함할 수 있다. 따라서 다음 예제와 같이 매트릭스 변수에 어떤 경로 변수(path variable)가 있는지
구분할 필요가 있을 수 있다:

#### Java:
```java
// GET /owners/42;q=11/pets/21;q=22

@GetMapping("/owners/{ownerId}/pets/{petId}")
public void findPet(
        @MatrixVariable(name="q", pathVar="ownerId") int q1,
        @MatrixVariable(name="q", pathVar="petId") int q2) {

    // q1 == 11
    // q2 == 22
}
```

#### Kotlin:
```kotlin
@GetMapping("/owners/{ownerId}/pets/{petId}")
fun findPet(
        @MatrixVariable(name = "q", pathVar = "ownerId") q1: Int,
        @MatrixVariable(name = "q", pathVar = "petId") q2: Int) {

    // q1 == 11
    // q2 == 22
}
```

매트릭스 변수를 선택적으로 정의하고 다음 예제와 같이 기본값을 지정할 수 있다:

#### Java:
```java
// GET /pets/42

@GetMapping("/pets/{petId}")
public void findPet(@MatrixVariable(required=false, defaultValue="1") int q) {

    // q == 1
}
```

#### Kotlin:
```kotlin
// GET /pets/42

@GetMapping("/pets/{petId}")
fun findPet(@MatrixVariable(required = false, defaultValue = "1") q: Int) {

    // q == 1
}
```

`MultiValueMap`을 사용하여 모든 매트릭스 변수를 가져올 수도 있다:

#### Java:
```java
// GET /owners/42;q=11;r=12/pets/21;q=22;s=23

@GetMapping("/owners/{ownerId}/pets/{petId}")
public void findPet(
        @MatrixVariable MultiValueMap<String, String> matrixVars,
        @MatrixVariable(pathVar="petId") MultiValueMap<String, String> petMatrixVars) {

    // matrixVars: ["q" : [11,22], "r" : 12, "s" : 23]
    // petMatrixVars: ["q" : 22, "s" : 23]
}
```

#### Kotlin:
```kotlin
// GET /owners/42;q=11;r=12/pets/21;q=22;s=23

@GetMapping("/owners/{ownerId}/pets/{petId}")
fun findPet(
        @MatrixVariable matrixVars: MultiValueMap<String, String>,
        @MatrixVariable(pathVar="petId") petMatrixVars: MultiValueMap<String, String>) {

    // matrixVars: ["q" : [11,22], "r" : 12, "s" : 23]
    // petMatrixVars: ["q" : 22, "s" : 23]
}
```

<br>

### `@RequestParam`
`@RequestParam` 어노테이션을 사용하여 쿼리 매개변수를 컨트롤러의 메서드 인자에 바인딩할 수 있다. 다음 코드 스니펫은 그 사용법이다:

#### Java:
```java
@Controller
@RequestMapping("/pets")
public class EditPetForm {

    // ...

    @GetMapping
    public String setupForm(@RequestParam("petId") int petId, Model model) { // (1) `@RequestParam`을 사용.
        Pet pet = this.clinic.loadPet(petId);
        model.addAttribute("pet", pet);
        return "petForm";
    }

    // ...
}
```

#### Kotlin:
```kotlin
import org.springframework.ui.set

@Controller
@RequestMapping("/pets")
class EditPetForm {

    // ...

    @GetMapping
    fun setupForm(@RequestParam("petId") petId: Int, model: Model): String { // (1) `@RequestParam`을 사용.
        val pet = clinic.loadPet(petId)
        model["pet"] = pet
        return "petForm"
    }

    // ...
}
```

> 서블릿 API "요청 파라미터"는 쿼리 파라미터, 폼(form) 데이터, 멀티파트(multiparts) 데이터를 하나로 통합하는 개념이다.
> 그러나 웹플럭스에서는 각각 `ServerExchange`를 통해 개별적으로 접근한다. `@RequestParam`이 쿼리 파라미터만을 바인딩하는 것과 다르게
> 데이터 바인딩을 사용하여 쿼리 파라미터, 폼 데이터, 멀티파트를 커맨드 객체에 적용할 수 있다.

`@RequestParam` 어노테이션을 사용하는 메서드 파라미터는 기본값이 필수적이다. `@RequestParam`의 required 값을 `false`로 설정하거나
인자를 `java.util.Optional` 래퍼로 선언하여 메서드 파라미터를 선택적으로 지정할 수 있다.

타겟 메서드 파라미터가 `String`이 아닌 경우에 타입 변환은 자동으로 적용된다.
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-typeconversion" rel="nofollow" target="_blank">Type Conversion</a> 참조

`Map<String, String>` 또는 `MultiValueMap<String, String>`에 `@RequestParam` 을 선언하면 map은 모든 쿼리 파라미터로
채워진다.

`@RequestParam`은 선택적이다. 예를 들어, 속성을 설정하는 것이다. 기본적으로 단순 값 타입
(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-" rel="nofollow" target="_blank">`BeanUtils#isSimpleProperty`</a>에 의해
판단되는)이고 어떠한 인자 리졸버에 의해서도 리졸브되지 않는 인자는 `@RequestParam`이 선언된 것처럼 처리된다.

<br>

### `@RequestHeader`
`@RequestHeader` 어노테이션을 사용하여 요청 헤더를 컨트롤러의 메서드 인자로 바인드할 수 있다. 다음은 요청 헤더 예시다:

```bash
Host                    localhost:8080
Accept                  text/html,application/xhtml+xml,application/xml;q=0.9
Accept-Language         fr,en-gb;q=0.7,en;q=0.3
Accept-Encoding         gzip,deflate
Accept-Charset          ISO-8859-1,utf-8;q=0.7,*;q=0.7
Keep-Alive              300
```

다음은 `Accept-Encoding`, `Keep-Alive` 헤더 값을 가져온다:

#### Java:
```java
@GetMapping("/demo")
public void handle(
        @RequestHeader("Accept-Encoding") String encoding, (1)
        @RequestHeader("Keep-Alive") long keepAlive) { (2)
    //...
}
```

#### Kotlin:
```kotlin
@GetMapping("/demo")
fun handle(
        @RequestHeader("Accept-Encoding") encoding: String, (1)
        @RequestHeader("Keep-Alive") keepAlive: Long) { (2)
    //...
}
```

> (1) `Accept-Encoding` 헤더 값을 가져온다.<br>
> (2) `Keep-Alive` 헤더 값을 가져온다.

타겟 메서드 파라미터 타입이 `String`이 아닌 경우, 타입 변환이 자동으로 적용된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-typeconversion" target="_blank" rel="nofollow">
Type Conversion</a>을 참조하라.

`@RequestHeader` 어노테이션이 `Map<String, String>`, `MultiValueMap<String, String>`, `HttpHeaders`에 인자로
사용되면 맵은 모든 헤더 값으로 채워진다.

> 쉼표로 구분 된 문자열을 배열 또는 문자열 컬렉션으로 타입 변환해준다. 예를 들면, `@RequestHeader("Accept")`의 매개변수는 `String`
타입이지만 `String[]`이나 `List<String>`에 선언할 수 있다.

<br>

### `@CookieValue`
`@CookieValue` 어노테이션을 사용하여 HTTP 쿠키의 값을 컨트롤러의 메서드 인자에 바인딩할 수 있다.

다음은 쿠키 예시다:
```bash
JSESSIONID=415A4AC178C59DACE0B2C9CA727CDD84
```

#### Java:
```java
@GetMapping("/demo")
public void handle(@CookieValue("JSESSIONID") String cookie) { (1)
    //...
}
```

#### Kotlin:
```kotlin
@GetMapping("/demo")
fun handle(@CookieValue("JSESSIONID") cookie: String) { (1)
    //...
}
```

> (1) 쿠키 값을 가져온다.

타겟 메서드 파라미터 타입이 `String`이 아니라면 타입 변환이 자동 적용된다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-typeconversion" rel="nofollow" target="_blank">Type Conversion</a>을 참조하라.

<br>

### `@ModelAttribute`
메서드 인자에 `@ModelAttribute` 어노테이션을 사용하여 모델의 속성(attribute)에 접근하거나 속성이 존재하지 않는 경우 인스턴스화할 수 있다.
또한 쿼리 파라미터나 폼 필드의 이름이 모델의 필드 이름과 일치하면 값을 덮어쓴다. 이를 데이터 바인딩이라고 하며, 쿼리 파라미터와 폼 필드를
각각 파싱하고 변환하지 않아도 된다. 다음 예제는 `Pet` 인스턴스로 바인딩한다:

#### Java:
```java
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
public String processSubmit(@ModelAttribute Pet pet) { } (1)
```

#### Kotlin:
```kotlin
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
fun processSubmit(@ModelAttribute pet: Pet): String { } (1)
```

> (1) `Pet` 인스턴스에 바인딩한다.

`Pet` 인스턴스는 다음과 같이 리졸브된다:

- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-modelattrib-methods" rel="nofollow" target="_blank">`Model`</a>을 통해 이미 추가된 경우 모델로부터
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-sessionattributes" rel="nofollow" target="_blank">`@SessionAttributes`</a>을 통해 HTTP 세션으로부터
- 기본 생성자의 실행으로부터
- 쿼리 파라미터 또는 폼(form) 필드와 매칭되는 인자를 받는 "기본 생성자"를 통해서. 인자 이름은 자바빈 `@ConstructorProperties` 또는
바이트코드의 런타임 파라미터 이름을 통해 정해진다.

모델 속성 인스턴스를 생성되면 데이터 바인딩이 적용된다. `WebExchangeDataBinder` 클래스는 쿼리 파라미터 이름과 폼(form) 필드를
대상 객체의 필드 이름과 매칭한다. 필요에 따라서 타입 변환을 적용하여 값을 설정한다. 데이터 바인딩과 유효성 검사에 대한 자세한 내용은
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation" target="_blank" rel="nofollow">Validation</a>을 참조하라. 커스텀 데이터 바인딩 관련해서는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-initbinder">`DataBinder`</a>를 참고하라.

데이터 바인딩에서 오류가 발생할 수 있다. 기본적으로 `WebExchangeBindException`이 발생되지만 컨트롤러 메서드에서 이러한 오류를 검사하기
위해서는 `BindingResult` 인자를 `@ModelAttribute` 바로 다음에 선언해야 한다. 다음은 그 예를 보여준다:

#### Java:
```java
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
public String processSubmit(@ModelAttribute("pet") Pet pet, BindingResult result) { (1)
    if (result.hasErrors()) {
        return "petForm";
    }
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
fun processSubmit(@ModelAttribute("pet") pet: Pet, result: BindingResult): String { (1)
    if (result.hasErrors()) {
        return "petForm"
    }
    // ...
}
```

> (1) `BindingResult`를 추가한다.

`javax.validation.Valid` 어노테이션 또는 스프링의 `@Validated` 어노테이션을 추가하여 데이터 바인딩 후에 유효성 검증을 자동으로
적용할 수 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation-beanvalidation" rel="nofollow" target="_blank">Bena Validation</a>과 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation" rel="nofollow" target="_blank">Spring validation</a>을 참조하라.
다음은 `@Valid` 어노테이션을 사용 예제다:

#### Java:
```java
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
public String processSubmit(@Valid @ModelAttribute("pet") Pet pet, BindingResult result) { (1)
    if (result.hasErrors()) {
        return "petForm";
    }
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
fun processSubmit(@Valid @ModelAttribute("pet") pet: Pet, result: BindingResult): String { (1)
    if (result.hasErrors()) {
        return "petForm"
    }
    // ...
}
```

> (1) `@Valid`를 모델 속성(attribute) 인자에 적용한다.

스프링 MVC와 다르게 스프링 웹플럭스는 모델에서 리액티브 타입을 지원한다. - 예를 들면, `Mono<Account>` 또는 `io.reactivex.Single<Account>`.
`@ModelAttribute` 인자와 리액티브 타입 래퍼를 함께 사용하거나, 사용하지 않아도 필요에 따라 실제 값으로 리졸브된다. 하지만 위 예시처럼
`BindResult` 인자는 반드시 `@ModelAttribute` 인자 이후에 리액티브 타입 래퍼없이 선언해야 한다. 또는 다음 예제와 같이 리액티브 타입을
통해 오류를 처리할 수 있다:

#### Java:
```java
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
public Mono<String> processSubmit(@Valid @ModelAttribute("pet") Mono<Pet> petMono) {
    return petMono
        .flatMap(pet -> {
            // ...
        })
        .onErrorResume(ex -> {
            // ...
        });
}
```

#### Kotlin:
```kotlin
@PostMapping("/owners/{ownerId}/pets/{petId}/edit")
fun processSubmit(@Valid @ModelAttribute("pet") petMono: Mono<Pet>): Mono<String> {
    return petMono
            .flatMap { pet ->
                // ...
            }
            .onErrorResume{ ex ->
                // ...
            }
}
```

`@ModelAttribute`의 사용은 선택적이다. - 예를 들어, 어노테이션에 속성(attibutes)를 설정하기 위해 사용한다. 기본적으로 단순 값 타입이
아닌(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-" rel="nofollow" target="_blank">BeanUtils#isSimpleProperty</a>이 false로 판단된)
것으로 판단된 인자면서, 다른 리졸버에 의해서도 리졸브되지 않는 인자는 `@ModelAttribute`가 적용된 것처럼 처리된다.

<br>

### `@SessionAttributes`
`@SessionAttributes`는 요청간에 모델 속성을 `WebSession`에 저장하는데 사용한다. 타입-레벨 어노테이션으로 특정 컨트롤러에 의해 사용되는
세션 속성을 선언한다. 일반적으로 후속 요청에 접근하기 위해 세션에 그대로 저장해야 하는 모델 속성 이름이나 타입을 나열한다.

다음 예제를 참고하라:

#### Java:
```java
@Controller
@SessionAttributes("pet") (1)
public class EditPetForm {
    // ...
}
```

#### Kotlin:
```kotlin
@Controller
@SessionAttributes("pet") (1)
class EditPetForm {
    // ...
}
```

> (1) `@SessionAttributes` 어노테이션을 사용한다.

첫 번째 요청에서 이름이 `Pet`인 모델 속성이 모델에 추가되면, 자동으로 `WebSession`에 추가된다. 다음 예제와 같이 컨트롤러 메서드가
`SessionStatus` 메서드 인자를 사용하여 세션 저장소를 비우기 전까지 유지된다:

#### Java:
```java
@Controller
@SessionAttributes("pet") (1)
public class EditPetForm {

    // ...

    @PostMapping("/pets/{id}")
    public String handle(Pet pet, BindingResult errors, SessionStatus status) { (2)
        if (errors.hasErrors()) {
            // ...
        }
            status.setComplete();
            // ...
        }
    }
}
```

#### Kotlin:
```kotlin
@Controller
@SessionAttributes("pet") (1)
class EditPetForm {

    // ...

    @PostMapping("/pets/{id}")
    fun handle(pet: Pet, errors: BindingResult, status: SessionStatus): String { (2)
        if (errors.hasErrors()) {
            // ...
        }
        status.setComplete()
        // ...
    }
}
```

> (1) `@SessionAttributes` 어노테이션을 사용한다.<br>
> (2) `SessionStatus` 변수를 사용한다.

<br>

### `@SessionAttribute`
전역적으로(즉, 컨트롤러 외부에서 - 예를 들면, 필터처럼) 관리되는 기존 세션 속성에 접근해야 하는 경우 다음과 같이 메서드 파라미터에
`@SessionAttribute` 어노테이션을 사용할 수 있다:

#### Java:
```java
@GetMapping("/")
public String handle(@SessionAttribute User user) { (1)
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/")
fun handle(@SessionAttribute user: User): String { (1)
    // ...
}
```

> (1) `@SessionAttribute`를 사용한다.

세션 attributes를 추가하거나 제거하려는 경우, 컨트롤러 메서드에서 `WebSession`을 주입하는 것을 고려할 수 있다.

컨트롤러 작업흐름(workflow) 일부로 세션에 모델 attributes를 임시로 저장하려면 `SessionAttributes`를 사용할 수 있다.
앞선 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-sessionattributes" rel="nofollow" target="_blank">`@SessionAttributes`</a>에 설명되어 있다.

<br>

### `@RequestAttribute`
`@SessionAttribute`와 비슷하게, `@RequestAttribute` 어노테이션으로 기존 생성된 request attributes에 접근할 수 있다.
(예를 들면, `WebFilter`에 의해 만들어진) 다음은 그 예제다:

#### Java:
```java
@GetMapping("/")
public String handle(@RequestAttribute Client client) { (1)
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/")
fun handle(@RequestAttribute client: Client): String { (1)
    // ...
}
```

> (1) `@RequestAttribute`를 사용한다.

<br>

### Multipart Content
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multipart" rel="nofollow" target="_blank">Multipart Data</a>에서 설명한 것처럼, `ServerWebExchange`로 멀티파트 컨텐츠에 접근할 수 있다.
컨트롤러에서 파일 업로드 폼(예를 들어, 브라우저에서)을 다루는 가장 최선의 방법은 커맨드 객체<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-modelattrib-method-args" rel="nofollow" target="_blank">(command object)</a>에 바인딩하는 것이다.
다음은 그 예제다:

#### Java:
```java
class MyForm {

    private String name;

    private MultipartFile file;

    // ...

}

@Controller
public class FileUploadController {

    @PostMapping("/form")
    public String handleFormUpload(MyForm form, BindingResult errors) {
        // ...
    }

}
```

#### Kotlin:
```kotlin
class MyForm(
        val name: String,
        val file: MultipartFile)

@Controller
class FileUploadController {

    @PostMapping("/form")
    fun handleFormUpload(form: MyForm, errors: BindingResult): String {
        // ...
    }

}
```

Restful 서비스로 시나리오의 브라우저가 아닌 클라이언트의 멀티팥 요청을 전송할 수 있다. 다음 예제는 JSON과 함께 파일을 사용한다:

```bash
POST /someUrl
Content-Type: multipart/mixed

--edt7Tfrdusa7r3lNQc79vXuhIIMlatb7PQg7Vp
Content-Disposition: form-data; name="meta-data"
Content-Type: application/json; charset=UTF-8
Content-Transfer-Encoding: 8bit

{
    "name": "value"
}
--edt7Tfrdusa7r3lNQc79vXuhIIMlatb7PQg7Vp
Content-Disposition: form-data; name="file-data"; filename="file.properties"
Content-Type: text/xml
Content-Transfer-Encoding: 8bit
... File Data ...
```

각 파트는 다음 예제처럼 `@RequestPart`로 접근할 수 있다:

#### Java:
```java
@PostMapping("/")
public String handle(@RequestPart("meta-data") Part metadata, (1)
        @RequestPart("file-data") FilePart file) { (2)
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/")
fun handle(@RequestPart("meta-data") Part metadata, (1)
        @RequestPart("file-data") FilePart file): String { (2)
    // ...
}
```

> (1) `@RequestPart`로 메타데이터를 가져온다.<br>
> (2) `@RequestPart`로 파일을 가져온다.

원본 파트 콘텐츠를 역직렬화하기 위해(예를 들면, JSON으로 `@RequestBody`와 비슷하다) 다음 예제와 같이 `Part` 대신에 구체적인 대상
`Object`를 선언할 수 있다:

#### Java:
```java
@PostMapping("/")
public String handle(@RequestPart("meta-data") MetaData metadata) { (1)
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/")
fun handle(@RequestPart("meta-data") metadata: MetaData): String { (1)
    // ...
}
```

> (1) `@RequestPart`로 메타데이터를 가져온다.

`@RequestPart`를 `javax.validation.Valid` 또는 스프링의 `@Validated` 어노테이션과 함께 사용하여 표준 빈 검증을 적용할 수 있다.
유효성 검증 오류는 `WebExchangeBindException` 예외를 발생시키고 400(BAD_REQUEST)으로 응답한다. 예외는 오류 상세 정보인
`BindingResult`를 담고 있으며, 비동기 래퍼로 인자를 선언한 다음에 오류 관련 연산자를 사용하여 컨트롤러 메서드에서 처리할 수 있다.

#### Java:
```java
@PostMapping("/")
public String handle(@Valid @RequestPart("meta-data") Mono<MetaData> metadata) {
    // use one of the onError* operators...
}
```

#### Kotlin:
```kotlin
@PostMapping("/")
fun handle(@Valid @RequestPart("meta-data") metadata: MetaData): String {
    // ...
}
```

모든 멀티파트 데이터를 `MultiValueMap`으로 접근하려면, 다음 예제아 같이 `@RequestBody`를 사용할 수 있다.

#### Java:
```java
@PostMapping("/")
public String handle(@RequestBody Mono<MultiValueMap<String, Part>> parts) { (1)
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/")
fun handle(@RequestBody parts: MultiValueMap<String, Part>): String { (1)
    // ...
}
```

> (1) `@RequestBody`를 사용한다.

<br>

### `@RequestBody`
`@RequestBody`를 사용하여 request body를 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">HttpMessageReader</a>를 통해 `Object`로 역직렬화할 수 있다.
다음 예제는 `@RequestBody` 인자를 사용한다:

#### Java:
```java
@PostMapping("/accounts")
public void handle(@RequestBody Account account) {
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/accounts")
fun handle(@RequestBody account: Account) {
    // ...
}
```

스프링 MVC와 다르게 웹플럭스는 `@RequestBody` 메서드 인자는 리액티브 타입 및 완전한 논 블로킹 읽기와 (클라이언트 to 서버) 스트리밍을
지원한다.

#### Java:
```java
@PostMapping("/accounts")
public void handle(@RequestBody Mono<Account> account) {
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/accounts")
fun handle(@RequestBody accounts: Flow<Account>) {
    // ...
}
```

메시지 리더 설정 또는 커스텀은 웹플럭스 설정<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">(WebFlux Config)</a>의
HTTP 메시지 코덱<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-message-codecs" rel="nofollow" target="_blank">(HTTP message codecs)</a> 옵션을 사용하면 된다.

`@RequestBody`를 `javax.validation.Valid` 또는 스프링의 `@Validated` 어노테이션과 함께 사용하여 표준 빈 검증을 적용할 수 있다.
유효성 검증 오류는 `WebExchangeBindException` 예외를 발생시키고 400(BAD_REQUEST)으로 응답한다. 예외는 오류 상세 정보인
`BindingResult`를 담고 있으며, 비동기 래퍼로 인자를 선언한 다음에 오류 관련 연산자를 사용하여 컨트롤러 메서드에서 처리할 수 있다.

#### Java:
```java
@PostMapping("/accounts")
public void handle(@Valid @RequestBody Mono<Account> account) {
    // use one of the onError* operators...
}
```

#### Kotlin:
```kotlin
@PostMapping("/accounts")
fun handle(@Valid @RequestBody account: Mono<Account>) {
    // ...
}
```

<br>

### `HttpEntity`
`HttpEntity`는 `@RequestBody`를 사용하는 것과 비슷하지만, request 헤더와 body를 감싸는 컨테이너 객체를 기반으로 한다.
다음 예제는 `HttpEntity`를 사용한다:

#### Java:
```java
@PostMapping("/accounts")
public void handle(HttpEntity<Account> entity) {
    // ...
}
```

#### Kotlin:
```kotlin
@PostMapping("/accounts")
fun handle(entity: HttpEntity<Account>) {
    // ...
}
```

<br>

### `@ResponseBody`
메서드에 `@ResponseBody` 어노테이션을 사용하여 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">HttpMessageWriter</a>를 통해 반환값을 response
body로 직렬화할 수 있다. 다음은 그 예제다:

#### Java:
```java
@GetMapping("/accounts/{id}")
@ResponseBody
public Account handle() {
    // ...
}
```

#### Kotlin:
```kotlin
@GetMapping("/accounts/{id}")
@ResponseBody
fun handle(): Account {
    // ...
}
```

`@ResponseBody`를 클래스 레벨에 선언하면 컨트롤러 내 모든 메서드에서 상속된다. 이는 `@RestController`의 효과와 같은데 단순히
`@Controller`와 `@ResponseBody`를 가진 메타 어노테이션으로 적용하는 것이다.

`@ResponseBody`는 리액티브 타입을 지원한다. Reactor 또는 RxJava 타입을 리턴하고 생성된 비동기 값을 응답에 렌더링할 수 있다.
자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs-streaming" rel="nofollow" target="_blank">Streaming</a>과
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs-jackson" rel="nofollow" target="_blank">JSON rendering</a>을 참조하라.

`@ResponseBody`는 JSON 시리얼라이즈 뷰와 함께 사용할 수 있다. 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-jackson" rel="nofollow" target="_blank">Jackson JSON</a>을 참조하라.

메시지 리더 설정 또는 커스텀은 웹플럭스 설정<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">(WebFlux Config)</a>의
HTTP 메시지 코덱<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-message-codecs" rel="nofollow" target="_blank">(HTTP message codecs)</a> 옵션을 사용하면 된다.

<br>

### `ResponseEntity`
`ResponseEntity`는 `@ResponseBody`와 비슷하지만 상태 코드와 헤더를 가진다:

#### Java:
```java
@GetMapping("/something")
public ResponseEntity<String> handle() {
    String body = ... ;
    String etag = ... ;
    return ResponseEntity.ok().eTag(etag).build(body);
}
```

#### Kotlin:
```kotlin
@GetMapping("/something")
fun handle(): ResponseEntity<String> {
    val body: String = ...
    val etag: String = ...
    return ResponseEntity.ok().eTag(etag).build(body)
}
```

웹플럭스는 단일 값(single value) 리액티브 타입을 사용하여 `ResponseEntity`를 비동기식으로 만들 수 있다. 그리고/또는  body를 단일 값,
다중 값 리액티브 타입으로 만들 수 있다.

<br>

### Jackson JSON
스프링은 Jackson JSON 라이브러리를 지원한다.

#### JSON Views
스프링 웹플럭스는 기본적으로 <a href="https://www.baeldung.com/jackson-json-view-annotation" rel="nofollow" target="_blank">Jackson's Serialization Views</a>를 지원하기 때문에 `Object`의 필드 중 일부만 렌더링할 수 있다.
`@ResponseBody` 또는 `ResponseEntity` 컨트롤러 메서드와 함께 사용하려면 Jackson의 `@JsonView` 어노테이션을 사용하여
직렬화 뷰 클래스를 활성화할 수 있다. 다음은 그 예제다:

#### Java:
```java
@RestController
public class UserController {

    @GetMapping("/user")
    @JsonView(User.WithoutPasswordView.class)
    public User getUser() {
        return new User("eric", "7!jd#h23");
    }
}

public class User {

    public interface WithoutPasswordView {};
    public interface WithPasswordView extends WithoutPasswordView {};

    private String username;
    private String password;

    public User() {
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    @JsonView(WithoutPasswordView.class)
    public String getUsername() {
        return this.username;
    }

    @JsonView(WithPasswordView.class)
    public String getPassword() {
        return this.password;
    }
}
```

#### Kotlin:
```kotlin
@RestController
class UserController {

    @GetMapping("/user")
    @JsonView(User.WithoutPasswordView::class)
    fun getUser(): User {
        return User("eric", "7!jd#h23")
    }
}

class User(
        @JsonView(WithoutPasswordView::class) val username: String,
        @JsonView(WithPasswordView::class) val password: String
) {
    interface WithoutPasswordView
    interface WithPasswordView : WithoutPasswordView
}
```

> `@JsonView`는 뷰 클래스의 배열을 허용하지만 컨트롤러 메서드 당 하나만 지정할 수 있다. 여러 개의 뷰를 활성화해야 하는 경우
컴포짓(composite) 인터페이스를 사용하라.

<br>

## 1.4.4. `Model`
`@ModelAttribute`를 다음과 같이 사용할 수 있다:

- `@RequestMapping` 메서드의 메서드 인자<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-modelattrib-method-args" rel="nofollow" target="_blank">(method argument)</a>에 선언하여 모델로부터 오브젝트를 생성 또는 접근하고 `WebDataBinder`를 통해 이를 요청에 바인딩한다.
- `@Controller` 또는 `@ControllerAdvice` 클래스의 메서드 레벨 어노테이션으로 `@RequestMapping` 메서드 실행 전에 모델을 초기화한다.
- `@RequestMapping` 메서드의 리턴 값을 모델 속성(model attribute)로 표시한다.

이 섹션에서는 `@ModelAttribute` 메서드 또는 위의 두 번째 항목에 대해서 설명한다. 컨트롤러는 여러 `@ModelAttribute` 메서드를
가질 수 있다. 이 메서드들은 같은 컨트롤러에 있는 `@RequestMapping` 메서드보다 먼저 호출된다. `@ControllerAdvice`를 통해서
`@ModelAttribute` 메서드를 공유할 수도 있다. 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-controller-advice" rel="nofollow" target="_blank">Controller Advice</a> 섹션을 참고하라.

`@ModelAttribute` 메서드는 유연한 메서드 시그니처를 갖는다. `@RequestMapping` 메서드와 동일한 인자를 다수 지원한다.
(`@ModelAttribute` 자체와 request body 항목을 제외하고)

다음은 `@ModelAttribute` 메서드 예제다:

#### Java:
```java
@ModelAttribute
public void populateModel(@RequestParam String number, Model model) {
    model.addAttribute(accountRepository.findAccount(number));
    // add more ...
}
```

#### Kotlin:
```kotlin
@ModelAttribute
fun populateModel(@RequestParam number: String, model: Model) {
    model.addAttribute(accountRepository.findAccount(number))
    // add more ...
}
```

다음 예제는 하나의 속성(attribute)만 추가한다:

#### Java:
```java
@ModelAttribute
public Account addAccount(@RequestParam String number) {
    return accountRepository.findAccount(number);
}
```

#### Kotlin:
```kotlin
@ModelAttribute
fun addAccount(@RequestParam number: String): Account {
    return accountRepository.findAccount(number);
}
```

> 속성(attribute)의 이름을 명시적으로 지정하지 않은 경우 기본적으로 타입별 디폴트 이름이 선택된다.
(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/Conventions.html" rel="nofollow" target="_blank">Conventions</a> javadoc 참고) 오버로딩된 `addAttribute` 메서드를 사용하거나
`@ModelAttribute`의 name 속성을 통해 명시적으로 이름을 지정할 수 있다.

스프링 MVC와 다르게 스프링 웹플럭스는 모델에서 리액티브 타입을 지원한다. (예를 들어, `Mono<Account>` 또는 `io.reactivex.Single<Account>`)
이러한 비동기 모델 속성(model attribute)은 `@RequestMapping` 메서드를 실행할 때 실제 값으로 리졸빙된다.(모델이 업데이트됨)
`@ModelAtrribute` 인자는 리액티브 타입 래퍼로 감싸지 않아도 된다. 다음은 예제다:

#### Java:
```java
@ModelAttribute
public void addAccount(@RequestParam String number) {
    Mono<Account> accountMono = accountRepository.findAccount(number);
    model.addAttribute("account", accountMono);
}

@PostMapping("/accounts")
public String handle(@ModelAttribute Account account, BindingResult errors) {
    // ...
}
```

#### Kotlin:
```kotlin
import org.springframework.ui.set

@ModelAttribute
fun addAccount(@RequestParam number: String) {
    val accountMono: Mono<Account> = accountRepository.findAccount(number)
    model["account"] = accountMono
}

@PostMapping("/accounts")
fun handle(@ModelAttribute account: Account, errors: BindingResult): String {
    // ...
}
```

또한, 반응형 타입 래퍼로 감싼 모델 속성(model attributes)은 뷰 렌더링 직전에 실제값으로 리졸빙된다. (그리고 모델도 업데이트됨)

`@RequestMapping` 메서드의 리턴 값이 모델 속성으로 해석되는 경우, `@RequestMapping` 메서드에서 `@ModelAtrribute`를
메서드 레벨 어노테이션으로 선언할 수도 있다. HTML 컨트롤러에서는 `String`만 뷰 이름으로 사용하기 때문에 생략할 수 있다.
다음 예제처럼 `@ModelAttribute`를 사용하여 모델 속성 이름을 커스터마이징할 수 있다:

#### Java:
```java
@GetMapping("/accounts/{id}")
@ModelAttribute("myAccount")
public Account handle() {
    // ...
    return account;
}
```

#### Kotlin:
```kotlin
@GetMapping("/accounts/{id}")
@ModelAttribute("myAccount")
fun handle(): Account {
    // ...
    return account
}
```

<br>

## 1.4.5. `DataBinder`
`@Controller`, `@ControllerAdvice` 클래스는 `@InitBinder` 메서드로 `WebDataBinder`의 인스턴스를 초기화할 수 있다.
이들은 아래와 같이 사용된다:

- 요청 파라미터(form data 또는 query parameters)를 model 객체에 바인딩한다.
- `String` 기반 요청 값(request parameters, path variables, headers, cookies 등)을 타겟 컨트롤러 메서드 인자 타입으로 변환한다.
- HTML 폼을 렌더링할 때 모델 객체 값들을 `String`으로 포맷팅한다.

`@InitBinder` 메서드는 컨트롤러별 `java.bean.PropertyEditor` 또는 스프링 `Converter`, `Formatter` 컴포넌트를 등록할 수 있다.
추가로, 웹플럭스 자바 설정<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-conversion" rel="nofollow" target="_blank">(WebFlux Java Configuration)</a>을 사용하여
`FormattingConversionService`에 전역적으로 공유되는 `Converter`와 `Formatter`를 등록할 수 있다.

`@InitBinder` 메서드는 `@ModelAttribute` (커맨드 객체) 인자만 제외하고, `@RequestMapping` 메서드와 동일한 여러 인자를 제공한다.
일반적으로 컴포넌트 등록을 위해 `WebDataBinder` 인자를 받고 `void`를 반환한다. 다음 예제는 `@InitBinder` 어노테이션을 사용한다:

#### Java:
```java
@Controller
public class FormController {

    @InitBinder (1)
    public void initBinder(WebDataBinder binder) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        dateFormat.setLenient(false);
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, false));
    }

    // ...
}
```

#### Kotlin:
```kotlin
@Controller
class FormController {

    @InitBinder (1)
    fun initBinder(binder: WebDataBinder) {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd")
        dateFormat.isLenient = false
        binder.registerCustomEditor(Date::class.java, CustomDateEditor(dateFormat, false))
    }

    // ...
}
```

> (1) `@InitBinder` 어노테이션을 사용한다.

또는 `FormattingConversionService`를 통해 포맷터(Formatter) 기반 설정을 사용하는 경우, 다음 예제처럼 같은 방식을 재사용하고
컨트롤러별 포맷터 인스턴스를 등록할 수 있다:

#### Java:
```java
@Controller
public class FormController {

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.addCustomFormatter(new DateFormatter("yyyy-MM-dd")); (1)
    }

    // ...
}
```

#### Kotlin:
```kotlin
@Controller
class FormController {

    @InitBinder
    fun initBinder(binder: WebDataBinder) {
        binder.addCustomFormatter(DateFormatter("yyyy-MM-dd")) (1)
    }

    // ...
}
```

> (1) 커스텀 포맷터를 추가한다(여기서는 `DateFormatter` 사용)

<br>

## 1.4.6. 예외 관리(Managing Exceptions)
`@Controller`와 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-controller-advice" rel="nofollow" target="_blank">@ControllerAdvice</a> 클래스는
`@ExceptionHandler` 메서드로 컨트롤러 메서드의 예외를 처리할 수 있다. 다음은 이러한 예외를 처리하는 메서드를 포함한다:

#### Java:
```java
@Controller
public class SimpleController {

    // ...

    @ExceptionHandler (1)
    public ResponseEntity<String> handle(IOException ex) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@Controller
class SimpleController {

    // ...

    @ExceptionHandler (1)
    fun handle(ex: IOException): ResponseEntity<String> {
        // ...
    }
}
```

> (1) `@ExceptionHandler`를 적용한다.

예외는 전파된 최상위 예외(예를 들면 `IOException`) 또는 최상위 레벨에서 감싸고 있는 래퍼 예외(예를 들면 `IllegalStateException`)와
매칭될 수 있다.

예외 타입을 매칭시키려면, 앞의 예제처럼 원하는 예외 타입을 메서드 인자로 선언하는 것이 좋다. 또는 어노테이션으로 선언하여 매칭할 예외의 범위를
좁힐 수도 있다. 가능한 구체적으로 인자 시그니처를 작성하고 주요한 루트 예외 매핑을 `@ControllerAdvice`에 선언할 것을 권한다.
자세한 것은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-ann-exceptionhandler" rel="nofollow" target="_blank">MVC 섹션</a>을 참고하라.

> 웹플럭스의 `@ExceptionHandler` 메서드는 request body와 `@ModelAttribute` 관련 메서드 인자를 제외하고 `@RequestMapping`
메서드와 동일한 메서드 인자 및 반환값을 지원한다.

스프링 웹플럭스에서는 `@RequestMapping` 메서드에 대한 `HandlerAdapter`가 `@ExceptionHandler`를 처리한다.
자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-dispatcher-handler" rel="nofollow" target="_blank">`DispatcherHandler`</a>를 참조하라.

### Rest API 예외
REST 서비스의 공통 요구사항은 respose body에 오류 세부사항을 포함하는 것이다. 오류 세부사항 표시는 애플리케이션마다 다르기 때문에
스프링 프레임워크는 이를 자동으로 해주지 않는다. 하지만, `@RestController`는 `@ExceptionHandler` 메서드를 사용하여
`ResponseEntity` 반환 값으로 상태 코드와 body를 설정할 수 있다. 이러한 메서드는 `@ControllerAdivce` 클래스에 선언하여
전역적으로 적용할 수도 있다.

> 스프링 웹플럭스는 스프링 MVC의 `ResponseEntityExceptionHandler` 같은 핸들러가 없다. 스프링 웹플럭스에서 발생하는 모든 예외는
`ResponseStatusException`(또는 이 클래스의 서브클래스)이고, 이 예외는 HTTP 상태 코드로 변환될 필요가 없기 때문이다.

<br>

## 1.4.7. Controller Advice
보통 `@ExceptionHandler`, `@InitBinder`와 `@ModelAttribute` 메서드는 선언된 `@Controller` 클래스(또는 클래스 계층)에
적용된다. 이러한 메서드를 전체적으로 적용하려면 `@ControllerAdvice` 또는 `@RestControllerAdvice`를 선언한 클래스 안에서
선언해야 한다.

`@ControllerAdvice`는 `@Component` 어노테이션이 선언되어 있다. 그렇기 때문에 컴포넌트 스캐닝<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-java-instantiating-container-scan" rel="nofollow" target="_blank">(component scanning)</a>을 통해 스프링 빈으로 등록할 수 있다. `@RestControllerAdvice`는 `@ControllerAdvice`와
`@ResponseBody`가 모두 선언된 어노테이션이다. 이는 `@ExceptionHandler` 메서드가 메시지 변환을 통해 response body로
렌더링함을 의미한다. (뷰나 템플릿을 렌더링하는 것 대신에)

애플리케이션을 시작할 때 `@ControllerAdvice` 어노테이션이 달린 스프링 빈을 찾아 런타임에 `@RequestMapping`과 `@ExceptionHandler` 메서드의
기반 클래스를 적용한다. 전역으로 설정한 `@ExceptionHandler`(`@ControllerAdvice`에 선언된)는 지역 메서드(`@Controller`에 선언된)가
적용된 후에 적용된다. 반대로 전역 `@ModelAttribute`, `@InitBinder` 메서드는 로컬 메서드보다 먼저 적용된다.

기본적으로 `@ControllerAdvice` 메서드는 모든 요청(즉, 모든 컨트롤러)에 적용되지만, 어노테이션의 속성을 사용하여 컨트롤러의 적용 범위를
좁힐 수 있다. 다음은 그 예제다:

#### Java:
```java
// Target all Controllers annotated with @RestController
@ControllerAdvice(annotations = RestController.class)
public class ExampleAdvice1 {}

// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}

// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = {ControllerInterface.class, AbstractController.class})
public class ExampleAdvice3 {}
```

#### Kotlin:
```kotlin
// Target all Controllers annotated with @RestController
@ControllerAdvice(annotations = [RestController::class])
public class ExampleAdvice1 {}

// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}

// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = [ControllerInterface::class, AbstractController::class])
public class ExampleAdvice3 {}
```

앞 예제에서 어노테이션 관련 셀렉터는 런타임에 결정되기 때문에 광범위하게 사용하는 경우 성능에 부정적인 영향을 줄 수 있다.
자세한 내용은 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html" rel="nofollow" target="_blank">`@ControllerAdvice`</a> javadoc을 참고하라.


---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-functional-endpoints">다음글 "1.5. Functional Endpoints" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>