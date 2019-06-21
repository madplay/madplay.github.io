---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.4 어노테이션 컨트롤러"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.4 Annotated Controllers"
category: Spring
date: "2019-06-07 23:59:22"
comments: true
---

## 1.4. 어노테이션 컨트롤러(Annotated Controllers)
스프링 웹플럭스는 어노테이션 기반 프로그래밍 모델을 제공하며 `@Controller`와 `@RestController` 컴포넌트는 어노테이션을 사용하여 요청 매핑,
요청 입력, 예외 처리 등의 기능을 제공한다. 어노테이션 컨트롤러는 유연한 메서드 시그니처를 가지며 기반 클래스를 확장하거나 특정 인터페이스를 구현할 필요가 없다.

아래는 기본적인 예제이다.

Java:
```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String handle() {
        return "Hello WebFlux";
    }
}
```

Kotlin:
```kotlin
@RestController
class HelloController {

    @GetMapping("/hello")
    fun handle() = "Hello WebFlux"
}
```

앞선 예제에서 메서드는 응답 본문(Response body)에 사용할 문자열(String)을 반환한다.

### 1.4.1. `@Controller`
표준 스프링 빈 정의를 따라 컨트롤러 빈을 정의할 수 있다. `@Controller` 스트레오 타입은 클래스 패스에서 `@Component` 클래스를 감지하고 자동 빈 등록을
허용한다. 또한 웹 컴포넌트의 역할임을 나타내는 어노테이션이 달린 클래스(annotated class)의 스트레오 타입 역할을 한다.

이러한 `@Controller` 빈의 자동 감지를 사용하려면, 아래 예제와 같이 자바 설정에 컴포넌트 스캔을 추가한다.

Java:
```java
@Configuration
@ComponentScan("org.example.web") // (1)
public class WebConfig {

    // ...
}
```

Kotlin:
```kotlin
@Configuration
@ComponentScan("org.example.web") // (1)
class WebConfig {

    // ...
}
```

> (1) org.example.web 패키지를 스캔한다.

`@RestController`는 `@Controller`와 `@ResponseBody`가 합쳐진 **조합 어노테이션(composed annotation)**로, 모든 메서드가 타입 레벨
`@ResponseBody`가 적용되므로 뷰 리졸루션과 HTML 템플릿 렌더링 대신에 응답 본문(response body)에 직접 응답을 작성한다.

### 1.4.2. 리퀘스트 매핑(Request Mapping)
`@RequestMapping` 어노테이션은 요청을 컨트롤러 메서드에 매핑하는데 사용된다. 이 어노테이션은 URL, HTTP 메서드, 요청 매개변수, 헤더 및 미디어 타입별로
요청을 매칭할 수 있는 다양한 속성을 가지고 있다. 클래스 레벨에서 매핑을 공유할 수 있고, 메서드 레벨에서 특정 엔드 포인트 매핑으로 좁히기 위해 사용할 수도 있다.

HTTP 메서드에 대한 `@RequestMapping`의 변형도 있다:

- `@GetMapping`
- `@PostMapping`
- `@PutMapping`
- `@DeleteMapping`
- `@PatchMapping`

위의 어노테이션들은 모든 HTTP 메서드에 매핑되어 HTTP 메서드가 구분되지 않는 기본 형태의 `@RequestMapping`을 사용하는 대신에 특정 HTTP 메서드에
매핑되는 것이 더 권장되므로 제공되는 **사용자 정의 어노테이션(Custom Annotations)**이다. 동시에 `@RequestMapping`은 클래스 레벨에서
공유된 매핑을 표현하기 위해서 여전히 필요하다.

아래는 그 유형과 메서드 레벨 매핑을 사용한 예제다.

Java:
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

Kotlin:
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

#### URI 패턴(URI Patterns)
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

Java:
```java
@GetMapping("/owners/{ownerId}/pets/{petId}")
public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
    // ...
}
```

Kotlin:
```kotlin
@GetMapping("/owners/{ownerId}/pets/{petId}")
fun findPet(@PathVariable ownerId: Long, @PathVariable petId: Long): Pet {
    // ...
}
```

아래 예제와 같이 클래스와 메서드 레벨에서 URI 변수를 선언할 수 있다.

Java:
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

Kotlin:
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

URI 변수는 자동으로 적절헌 타입으로 변환되거나 `TypeMismatchException`이 발생한다. 단순 타입(int, long, Data 등)은 기본적으로 지원되며,
다른 데이터 타입에 대한 지원도 등록 가능하다. **타입 변환(Type Conversion)**과 `DataBinder`를 참조하라.

URI 변수의 이름을 명시적으로 지정할 수 있지만(예를 들어, `@PathVariable("customId")`) 이름이 동일하고, 디버깅 정보 또는 Java 8의
`-parameters` 컴파일러 플래그로 코드를 컴파일하는 경우 이런 세부 정보는 생략할 수 있다.

`{*varName}` 구문은 0개 이상의 나머지 경로 세그먼트와 일치하는 URI 변수를 선언한다. 예를 들면 `/resources/{*path}`는 `/resources`의 모든
파일과 일치하며, "path" 변수는 전체 상대 경로를 캡쳐한다.

`{varName:regex}` 구문은 URI 변수를 `{varName:regex}`인 정규식을 사용하여 선언한다. 예를 들어 `/spring-web-3.0.5 .jar`의 URL을 지정하면
아래 이어지는 메서드와 같은 방법으로 이름, 버전 그리고 파일 확장자를 추출한다.

Java:
```java
@GetMapping("/{name:[a-z-]+}-{version:\\d\\.\\d\\.\\d}{ext:\\.[a-z]+}")
public void handle(@PathVariable String version, @PathVariable String ext) {
    // ...
}
```

Kotlin:
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

#### 패턴 비교(Pattern Comparison)
여러 패턴이 URL과 매칭되면 가장 일치하는 패턴을 찾기 위해 패턴을 비교해야 한다. 이는 `PathPattern.SPECIFICITY_COMPARATOR`를 통해 보다 구체적인
패턴을 찾는 작업이 수행된다.

모든 패턴에 대해 URI 변수와 와일드카드 숫자를 기반으로 점수가 계계산된다. URI 변수는 와일드카드보다 점수가 낮다. 총점이 낮은 패턴이 선택되며 두 패턴의
점수가 같다면 더 긴 패턴이 선택된다.

포괄(Catch-all) 패턴(예를 들어, `**`, `{*varName}`)은 점수 계산에서 제외되며 항상 마지막 순위를 갖는다. 두 패턴이 모두 포괄적인 경우
더 긴 패턴이 선택된다.

#### 소비 가능한 미디어 타입(Consumable Media Types)
다음 예제와 같이 요청의 `Content-Type`을 기반으로 요청 매핑을 좁힐 수 있다.

Java:
```java
@PostMapping(path = "/pets", consumes = "application/json")
public void addPet(@RequestBody Pet pet) {
    // ...
}
```

Kotlin:
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

#### 생산 가능한 미디어 타입(Producible Media Types)
다음 예제와 같이 `Accept` 요청 헤더와 컨트롤러 메서드가 생성하는 컨텐츠 타입 목록을 기반으로 요청 매핑을 좁힐 수 있다:

Java:
```java
@GetMapping(path = "/pets/{petId}", produces = "application/json")
@ResponseBody
public Pet getPet(@PathVariable String petId) {
    // ...
}
```
Kotlin:
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

#### 파라미터와 헤더(Parameters and Headers)
쿼리 파라미터 조건으로 요청 매핑 범위를 좁힐 수 있다. 쿼리 파라미터(myParam)가 있는지, 없는지(!myParam) 또는 특정값(myParam=myValue)을
테스트 할 수 있다. 아래 예제에서는 값을 가진 파라미터를 테스트한다.

Java:
```java
@GetMapping(path = "/pets/{petId}", params = "myParam=myValue") (1)
public void findPet(@PathVariable String petId) {
    // ...
}
```

Kotlin:
```kotlin
@GetMapping("/pets/{petId}", params = ["myParam=myValue"]) (1)
fun findPet(@PathVariable petId: String) {
    // ...
}
```

> (1) `myParam`의 값이 `myValue`와 같은지 확인하라.

아래 예제와 같이 요청 헤더 조건에 동일하게 사용할 수도 있다.

Java:
```java
@GetMapping(path = "/pets", headers = "myHeader=myValue") (1)
public void findPet(@PathVariable String petId) {
    // ...
}
```

Kotlin:
```kotlin
@GetMapping("/pets", headers = ["myHeader=myValue"]) (1)
fun findPet(@PathVariable petId: String) {
    // ...
}
```

> (1) `myHeader`의 값이 `myValue`와 같은지 확인하라.

#### HTTP HEAD, OPTIONS
`@GetMapping`과 `@RequestMapping(method=HttpMethod.GET)`은 요청 매핑 목적의 HTTP HEAD를 투명하게 지원한다.
컨트롤러 메서드는 변경할 필요가 없다. `HttpHandler` 서버 어댑터에 적용된 응답 래퍼는 `Content-Length` 헤더가 실제로 응답에 쓰이지 않고
바이트 수로 설정되도록 한다.

기본적으로 HTTP OPTIONS은 매칭 URL 패턴을 갖는 모든 `@RequestMapping` 메서드의 HTTP 메서드 목록에 Allow 응답 헤더를 설정하여 핸들링 된다.

HTTP 메서드 선언이 없는 `@RequestMapping`의 경우 Allow 헤더는 GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS로 설정된다. 컨트롤러 메서드는
항상 지원되는 HTTP 메서드를 선언해야 한다. (예를 들어, `@GetMapping`, `@PostMapping` 등)

`@RequestMapping` 메서드를 HTTP HEAD와 HTTP OPTIONS으로 명시적으로 매핑할 수 있지만 일반적으로 필요하지 않다.

#### 사용자 정의 어노테이션(Custom Annotations)
스프링 웹플럭스는 요청 매핑을 위해 조합 어노테이션(composed annotations) 사용을 지원한다. 이러한 어노테이션들은 `@RequestMapping`으로 메타
어노테이션이 달렸으며, 더 구체적인 목적으로 `@RequestMapping` 속성의 일부분(또는 모든)을 다시 선언하도록 구성되었다.

`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, 그리고 `@PatchMapping`이 조합 어노테이션의 예이다. 기본형으로
`@RequestMapping`을 사용하여 모든 HTTP 메서드와 일치시키는 것보다, 대부분 컨트롤러 메서드는 특정 HTTP 메서드에 매핑되는 것이 권장되기 때문에
이러한 어노테이션이 제공된다. 예제가 필요하다면 이 어노테이션들이 어떻게 선언되었는지 살펴보라.

스프링 웹플럭스는 또한 사용자 정의(custom) 요청 매칭 로직을 가진 사용자 정의 요청 매핑 속성을 지원한다. 이는 `RequestMappingHandlerMapping`의
확장을 필요로 하고 `getCustomMethodCondition` 메서드를 재정의(override) 하는 고급 옵션으로서 사용자 지정 속성을 확인하고 사용자만의 고유한
`RequestCondition`을 반환할 수 있다.

#### 명시적 등록(Explicit Registrations)
핸들러 메서드를 프로그래밍 방식으로 등록할 수 있다. 이 방법은 동적으로 등록하거나 동일한 핸들러의 서로 다른 인스턴스로 다른 URL을 처리하는 경우처럼
보다 고급 사례에 사용할 수 있다. 아래 예제는 이를 수행하는 방법이다:

Java:
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

Kotlin:
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

---

> ### 목차 가이드
> - 다음글 "1.5 Functional Endpoints" 로 이동(준비중)
> - <a href="/post/web-on-reactive-stack" target="_blank">전체 목차 페이지로 이동</a>