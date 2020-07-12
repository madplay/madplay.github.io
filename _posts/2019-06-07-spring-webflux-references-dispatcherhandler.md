---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.3. DispatcherHandler"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.3. DispatcherHandler"
category: Spring
date: "2019-06-07 23:24:14"
comments: true
---

## 1.3. 디스패처 핸들러(`Dispatcher Handler`)
스프링 MVC와 유사하게 스프링 웹플럭스는 프론트 컨트롤러 패턴을 중심으로 설계되었으며 중앙의 WebHandler인 `DispatcherHandler`는 요청 처리를 위한
공유 알고리즘을 제공하며, 실제 작업은 설정 가능한 위임 컴포넌트에 의해 수행된다. 이 모델은 유연하고 다양한 작업 흐름을 지원한다.

`DispatcherHandler`는 스프링 설정에서 필요한 위임 컴포넌트를 탐색한다. 또한 스프링 빈 자체로 설계되었으며 실행되는 컨텍스트에 접근하기 위해
`ApplicationContextAware`를 구현한다. `DispatcherHandler`의 빈 이름이 webHandler로 선언되면, <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/adapter/WebHttpHandlerBuilder.html" rel="nofollow" target="_blank">`WebHttpHandlerBuilder`</a>에 의해
발견되어 사용되며 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a>에서 설명한 것처럼 요청 처리 체인을 구성한다.

웹플럭스 애플리케이션의 스프링 설정에는 일반적으로 아래 내용이 포함된다.

- 빈 이름이 webHandler로 선언된 `DispatcherHandler`
- `WebFilter`와 `WebExceptionHandler` 빈
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-special-bean-types" rel="nofollow" target="_blank">`DispatcherHandler` 스페셜 빈</a>
- 기타 등등

다음 예제와 같이 `WebHttpHandlerBuilder`에 처리 체인이 만들기 위한 설정이 제공된다.

#### Java:
```java
ApplicationContext context = ...
HttpHandler handler = WebHttpHandlerBuilder.applicationContext(context).build();
```

```kotlin
val context: ApplicationContext = ...
val handler = WebHttpHandlerBuilder.applicationContext(context).build()
```

위 결과 HttpHandler는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">서버 어댑터</a>와 함께 사용할 수 있다.

<br>

### 1.3.1. 특별한 빈 타입들(Special bean types)
`DispatcherHandler`는 요청을 처리하고 적절한 응답을 제공하기 위해 특별한(special) 빈에 작업을 위임한다. "특별한 빈" 은 웹플럭스 프레임워크의
스펙을 구현한 스프링이 관리하는 객체 인스턴스를 의미한다. 보통 기본적으로 제공되지만, 속성값을 변경하거나 확장 또는 다른 빈으로 대체하는 일도 가능하다.

아래 표는 `DispatcherHandler`에 의해 발견되는 특별한 빈 목록을 보여준다. 낮은 레벨(low-level)에서는 이 빈들 외에도 다른 빈들도 있다.
(WebHandler API의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api-special-beans" rel="nofollow" target="_blank">Special bean types</a> 참고)

| 빈 타입 | 설명 |
|-------|---------|
| `HandlerMapping` | 요청을 핸들러에 매핑한다. 매핑은 몇 가지 기준을 기반으로 하며, `HandlerMapping` 구현에 따라 달라진다. 어노테이션 컨트롤러, 단순 URL 패턴 매핑, 기타 등등 <br><br> `@RequestMapping` 어노테이션이 있는 메서드에 대한 주요 `HandlerMapping` 구현은   `RequestMappingHandlerMapping`, 함수형 엔드 포인트 라우팅에 대해서는 `RouterFunctionMapping`, URL 경로 패턴 및 WebHandler 인스턴스의 명시적 등록을 위한 `SimpleUrlHandlerMapping` 다.
| `HandlerAdapter` | 핸들러가 실제로 호출되는 방식에 관계없이 `DispatcherHandler`가 요청에 매핑된 핸들러를 실행하도록 도와준다. 예를 들어, 어노테이션 컨트롤러를 호출하려면 어노테이션 리졸빙(resolving)이 필요하다. `HandlerAdapter`의 주요 목적은 이러한 세부 사항으로부터 `DispatcherHandler`를 가리는 것이다.
| `HandlerResultHandler`| 핸들러 실행 결과를 처리하고 응답을 완료한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-resulthandling" rel="nofollow" target="_blank">Result Handling</a>을 참조하라.

<br>

### 1.3.2. 웹플럭스 설정(Webflux Config)
애플리케이션은 요청을 처리하는데 필요한 빈(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api-special-beans" rel="nofollow" target="_blank">Web Handler API</a>와
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-special-bean-types" rel="nofollow" target="_blank">`DispatcherHandler`</a>에 나열된)을 선언할 수 있다.
하지만 대부분 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api-special-beans" rel="nofollow" target="_blank">WebFlux Config</a>가
가장 좋은 시작점이다. 필요한 빈을 선언하고 이를 사용자 정의(customize)하기 위한 고수준(high-level)의 설정 콜백 API를 제공한다.

> 스프링 부트는 웹플럭스 설정을 사용하여 스프링 웹플럭스를 설정하며, 다양하며 편리한 추가 옵션을 제공한다.

<br>

### 1.3.3. 처리(Processing)
`DispatcherHandler`는 아래와 같이 요청을 처리한다.

- 각 `HandlerMapping`이 핸들러를 매칭하도록 요청받고, 처음으로 매칭된 핸들러가 사용된다.
- 핸들러를 찾으면, 적절한 `HandlerAdapter`를 통해 핸들러가 실행되며, 리턴되는 값은 `HandlerResult`이다.
- `HandlerResult`는 적절한 `HandlerResultHandler`에게 제공되며, 응답에 바로 쓰이거나 뷰를 사용하여 렌더링하는 방식으로 처리를 완료한다.

<br>

### 1.3.4. 결과 핸들링(Result Handling)
`HandlerAdapter`를 통해 실행하여 반환된 값은 일부 추가적인 컨텍스트와 함께 `HandlerResult`로 래핑되며, 이 래핑된 반환값을 핸들링할 수 있는 첫 번째
`HandlerResultHandler`로 전달된다.

아래 표는 사용 가능한 `HandlerResultHandler` 구현체를 보여준다. 이 구현체는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">WebFlux Config</a>에 선언된다.

| 결과 핸들러 타입 | 반환 값 | 디폴트 적용 순서
| `ResponseEntityResultHandler` | `ResponseEntity`, 전형적으로 `@Controller` 인스턴스들로부터 반환된다. | 0
| `ServerResponseResultHandler` | `ServerResponse`, 전형적으로 함수형 엔드포인트로부터 반환된다.  | 0
| `ResponseBodyResultHandler` | `@ResponseBody` 메서드나 `@RestController` 클래스로부터의 반환값을 처리한다. | 100
| `ViewResolutionResultHandler` | `CharSequence`, <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/result/view/View.html" rel="nofollow" target="_blank">`View`</a>, <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/ui/Model.html" rel="nofollow" target="_blank">Model</a>, `Map`, <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/result/view/Rendering.html" rel="nofollow" target="_blank">Rendering</a> 또는 모델 속성으로 처리되는 기타 객체 <br><br> <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-viewresolution" rel="nofollow" target="_blank">View Resolution</a>를 참조하라. | `Integer.MAX_VALUE`

<br>

### 1.3.5. 예외(Exceptions)
`HandlerAdapter`에서 반환된 `HandlerResult`는 몇몇 핸들러별 메커니즘에 기반한 오류 처리를 위한 함수를 제공한다. 이 함수가 호출되는 조건은
아래와 같다:

- 핸들러 실행이 실패한 경우
- `HandlerResultHandler`를 통한 핸들러 반환값 처리를 실패한 경우

핸들러에서 반환된 리액티브 타입이 데이터를 생성하기 전에 오류 신호(error signal)가 발생되면 오류 처리를 위한 함수는 응답(예를 들어, 오류 상태)을
변경할 수 있다.

`@Controller` 클래스의 `@ExceptionHandler` 메서드는 이렇게 지원된다. 이와는 대조적으로 스프링 MVC에서는 `HandlerExceptionResolver`가
동일한 기능을 지원한다. 이 차이점은 크게 중요하지 않지만 웹플럭스에서는 핸들러를 선택하기 전에 발생하는 예외를 `@ControllerAdvice`를 사용하여
처리할 수 없는 것을 유의해야 한다.

"어노테이션 컨트롤러" 섹션의 예외 관리(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-ann-controller-exceptions" rel="nofollow" target="_blank">Managing Exceptions</a>) 또는 WebHandler API 섹션의 예외(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-exception-handler" rel="nofollow" target="_blank">Exceptions</a>)를 참조하라.

<br>

### 1.3.6. 뷰 리졸루션(View Resolution)
뷰 리졸루션은 특정 뷰 기술에 종속되지 않고도 HTML 템플릿과 모델로 브라우저에 렌더링할 수 있다. 스프링 웹플럭스의 `ViewResolver` 인스턴스를 사용하여
문자열(논리적인 뷰 이름을 나타내는)을 `View` 인스턴스에 매핑하는 전용 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-resulthandling" rel="nofollow" target="_blank">HandlerResultHandler</a>를
통해 뷰 리졸루션이 동작한다. 이 `View`는 응답을 렌더링하는데 사용된다.

#### 핸들링(Handling)
`ViewResolutionResultHandler`에 전달된 `HandlerResult`는 핸들러의 반환 값과 요청 처리 중에 추가된 속성을 포함하는 모델이 포함되어 있다.
반환 값은 다음 중 하나로 처리된다.

- `String`, `CharSequence`: 설정된 `ViewResolver` 구현체 목록을 통해 View로 리졸브(resolve)될 논리적인 뷰 이름이다.
- `void`: 요청 경로에 따라 디폴트 뷰 이름을 선택하고, 처음과 끝의 슬래시를 뺀 후 `View`로 동작한다. 뷰 이름이 없는 경우(예를 들어, 모델 속성이
반환된 경우) 또는 비동기 반환 값(예를 들어, Mono가 비어있음)도 마찬가지다.
- <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/result/view/Rendering.html" rel="nofollow" target="_blank">Rendering</a>: 뷰 리졸루션 시나리오를 위한 API다. IDE의 옵션을 참고
- `Model`, `Map`: 요청에 대한 모델에 이 속성을 추가로 더한다.
- 기타: 다른 반환 값(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-" rel="nofollow" target="_blank">BeanUtils#isSimpleProperty</a>)에 결정된 단순 타입을 제외하고)은 요청의 모델에 추가할 모델 속성으로 처리된다. `@ModelAttribute` 어노테이션 핸들러가 없는 경우 속성 이름은 규칙<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/Conventions.html" rel="nofollow" target="_blank">(conventions)</a>을 사용하여 클래스 이름으로부터 얻어진다.

모델에는 비동기, 리액티브 타입(예를 들어, Reactor 또는 RxJava)을 포함할 수 있다. 렌더링을 하기 전에 `AbstractView`는 이러한 모델 속성을 구체적인
값으로 리졸브하고 모델을 업데이트한다. 단일 값 리액티브 타입은 단일 값 또는 없는 값(비어있는 경우)으로 처리되며, 다중값 리액티브 타입(예로 `Flux<T>`)은
모아진(collected) 후 `List<T>`로 처리된다.

뷰 리졸루션 설정은 스프링 설정에 `ViewResolutionResultHandler` 빈을 추가하는 것만큼 간단하다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-view-resolvers" rel="nofollow" target="_blank">WebFlux Config</a>는 뷰 리졸루션을 위한
전용 설정 API를 제공한다.

스프링 웹플럭스와 통합된 뷰 기술에 대한 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-view" rel="nofollow" target="_blank">View Technologies</a>를 참조하라.

#### 리다이렉팅(Redirecting)
뷰 이름의 접두어사로 `redirect:`를 사용하여 리다이렉트를 수행할 수 있다. `UrlBasedViewResolver`(및 하위 클래스)는 이를 리다이렉트가 필요하다는
것으로 인식한다. 접두사를 제외한 뷰 이름의 나머지 부분은 리다이렉트 URL이다.

실질적 효과는 컨트롤러가 `RedirectView` 또는 `Rendering.redirectTo("abc").build()`를 반환한 것과 동일하지만, 이제는 컨트롤러 자체적으로
뷰 이름으로 동작할 수 있다. `redirect:/some/resource `와 같은 뷰 이름은 현재 애플리케이션에 상대 주소로 연결되지만
`redirect:https://example.com/arbitrary/path`와 같은 뷰 이름은 절대 경로 URL로 리다이렉트된다.

#### 컨텐츠 협상(Content Negotiation)
`ViewResolutionResultHandler`는 컨텐츠 협상을 지원한다. 요청 미디어 유형을 선택한 각 `View`가 지원하는 미디어 유형과 비교한다.
그리고 요청된 미디어 유형을 지원하는 첫 번째 `View`가 사용된다.

JSON과 XML 같은 미디어 유형을 지원하기 위해 스프링 웹플럭스는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">HttpMessageWriter</a>를
통해 렌더링 되는 특별한 `View`인 `HttpMessageWriterView`를 제공한다.
일반적으로 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-view-resolvers" rel="nofollow" target="_blank">웹플럭스 설정</a>을
통해 이 뷰를 디폴트 뷰로 설정한다. 요청된 미디어 유형과 매칭되는 경우, 항상 디폴트 뷰가 선택되고 사용된다.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-annotated-controllers">다음글 "1.4. Annotated Controllers" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>