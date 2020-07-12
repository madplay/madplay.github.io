---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.2. Reactive Core"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.2. Reactive Core"
category: Spring
date: "2019-06-05 00:31:24"
comments: true
---

# 1.2. 리액티브 코어(Reactive Core)
`spring-web` 모듈은 리액티브 웹 애플리케이션에 대한 다음과 같은 기본 지원이 포함한다.

- 서버 요청 처리에는 두 가지 수준의 지원이 있다.
  - <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">HttpHandler</a>: Reactor Netty, Undertow, Tomcat, Jetty 및 모든 Servlet 3.1+ 컨테이너용 어댑터와 함께 동작하는 HTTP 요청 핸들링을 위한
  논 블로킹 I/O 및 리액티브 스트림 기반의 기본 핸들러다.
  - <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a>: 약간 더 높은 수준의 요청 처리를 위한 범용적인 웹 API다. 어노테이션 컨트롤러 및 함수형 엔드포인트와 같은 구체적인 프로그래밍
  모델 위에 위치한다.

- 클라이언트 측의 경우, 리액터 네티<a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">(Reactor Netty)</a> 및 리액티브 <a href="https://github.com/jetty-project/jetty-reactive-httpclient" rel="nofollow" targt="_blank">Jetty HttpClient</a>용 어댑터와 함께 논 블로킹 I/O 및 리액티브 스트림 백프레셔로 HTTP 요청을 수행하는
기본 `ClientHttpConnector` 계약이 있다. 애플리케이션에서 사용되는 고수준(high-level)의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-client" rel="nofollow" target="_blank">WebClient</a>는 이 기본 계약을 기반으로 한다.

- 클라이언트와 서버의 경우 HTTP 요청 및 응답 컨텐츠를 직렬화(serialization)와 역직렬화(deserialization)하기 위해 코덱<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">(codecs)</a>을 사용한다.

<br>

## 1.2.1. `HttpHandler`
<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/http/server/reactive/HttpHandler.html" rel="nofollow" target="_blank">HttpHandler</a>는 요청과 응답을 처리하는 단일 메서드를 가진 간단한 계약이다. 의도적으로 최소한으로 만들어졌으며, 유일한 목적은 다른 HTTP 서버 API에 대한
최소한의 추상화이다.

다음 표는 지원되는 서버 API를 설명한다.

서버 이름 | 사용된 서버 API | 리액티브 스트림 지원
|--|--|--|
Netty | Netty API | <a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">Reactor Netty</a>
Undertow | Undertow API | spring-web: undertow to 리액티브 스트림 브릿지
Tomcat | 서블릿 3.1 논 블로킹 I/O; byte[]에 대응하여 ByteBuffer를 읽고 쓰는 Tomcat API | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지
Jetty | 서블릿 3.1 논 블로킹 I/O; byte[]에 대응하여 ByteBuffer를 읽고 쓰는 Jetty API | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지
Servlet 3.1+ 컨테이너 | 서블릿 3.1 논 블로킹 I/O | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지

다음 표는 서버 의존성에 대해 설명한다(<a href="https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-Versions" rel="nofollow" target="_blank">지원되는 버전</a>도 참조할 것):

서버 이름 | 그룹 ID | 아티팩트 이름
|--|--|--|
Reactor Netty | io.projectreactor.netty | reactor-netty
Underrtow | io.undertow | undertow-core
Tomcat | org.apache.tomcat.embed | tomcat-embed-core
Jetty | org.eclipse.jetty | jetty-server, jetty-servlet

아래 코드 스니펫은 각 서버 API로 `HttpHandler` 어댑터를 사용하는 것을 보여준다.

### 리액터 네티(Reactor Netty)
#### Java:
```java
HttpHandler handler = ...
ReactorHttpHandlerAdapter adapter = new ReactorHttpHandlerAdapter(handler);
HttpServer.create().host(host).port(port).handle(adapter).bind().block();
```

#### Kotlin:
```kotlin
val handler: HttpHandler = ...
val adapter = ReactorHttpHandlerAdapter(handler)
HttpServer.create().host(host).port(port).handle(adapter).bind().block()
```

### 언더토우(Undertow)
#### Java:
```java
HttpHandler handler = ...
UndertowHttpHandlerAdapter adapter = new UndertowHttpHandlerAdapter(handler);
Undertow server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build();
server.start();
```

#### Kotlin:
```kotlin
val handler: HttpHandler = ...
val adapter = UndertowHttpHandlerAdapter(handler)
val server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build()
server.start()
```

### 톰캣(Tomcat)
#### Java:
```java
HttpHandler handler = ...
Servlet servlet = new TomcatHttpHandlerAdapter(handler);

Tomcat server = new Tomcat();
File base = new File(System.getProperty("java.io.tmpdir"));
Context rootContext = server.addContext("", base.getAbsolutePath());
Tomcat.addServlet(rootContext, "main", servlet);
rootContext.addServletMappingDecoded("/", "main");
server.setHost(host);
server.setPort(port);
server.start();
```

#### Kotlin:
```kotlin
val handler: HttpHandler = ...
val servlet = TomcatHttpHandlerAdapter(handler)

val server = Tomcat()
val base = File(System.getProperty("java.io.tmpdir"))
val rootContext = server.addContext("", base.absolutePath)
Tomcat.addServlet(rootContext, "main", servlet)
rootContext.addServletMappingDecoded("/", "main")
server.host = host
server.setPort(port)
server.start()
```

### 제티(Jetty)
#### Java:
```java
HttpHandler handler = ...
Servlet servlet = new JettyHttpHandlerAdapter(handler);

Server server = new Server();
ServletContextHandler contextHandler = new ServletContextHandler(server, "");
contextHandler.addServlet(new ServletHolder(servlet), "/");
contextHandler.start();

ServerConnector connector = new ServerConnector(server);
connector.setHost(host);
connector.setPort(port);
server.addConnector(connector);
server.start();
```

#### Kotlin:
```kotlin
val handler: HttpHandler = ...
val servlet = JettyHttpHandlerAdapter(handler)

val server = Server()
val contextHandler = ServletContextHandler(server, "")
contextHandler.addServlet(ServletHolder(servlet), "/")
contextHandler.start();

val connector = ServerConnector(server)
connector.host = host
connector.port = port
server.addConnector(connector)
server.start()
```

### 서블릿 3.1+ 컨테이너
서블릿 3.1+ 컨테이너에 WAR로 배포하기 위해 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/adapter/AbstractReactiveWebInitializer.html" rel="nofollow" target="_blank">`AbstractReactiveWebInitializer`</a>를 확장하여 WAR에 포함해야 한다. 이 클래스는 `ServletHttpHandlerAdapter`로 `HttpHandler`를 래핑하고 이를 서블릿으로 등록한다.

<br>

## 1.2.2. WebHandler API
`org.springframework.web.server` 패키지는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">`HttpHandler`</a>를
기반으로 다중 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/WebExceptionHandler.html" rel="nofollow" target="_blank">`WebExceptionHandler`**`</a>
와 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/WebFilter.html" rel="nofollow" target="_blank">`WebFilter`</a>
그리고 단일 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/WebHandler.html" rel="nofollow" target="_blank">`WebHandler`</a>
컴포넌트의 체인을 통해 요청을 처리하기 위한 범용 웹 API 제공한다. 체인은 컴포넌트가 자동 감지<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api-special-beans" rel="nofollow" target="_blank">(auto-detected)</a>되는
스프링 `ApplicationContext`에 지정하거나 빌더에 컴포넌트를 등록하여 WebHttpHandlerBuilder와 함께 사용할 수 있다.

`HttpHandler`의 목적은 서로 다른 HTTP 서버에서의 사용을 추상화하는 것이지만, `WebHandler` API는 아래와 같이 웹 애플리케이션에서 일반적으로
사용되는 보다 더 광범위한 기능을 제공하는 것을 목표로 한다.

- 속성이 있는 사용자 세션(User session with attributes)
- 요청 속성(Request attributes)
- 요청에 대한 리졸브된 Locale 또는 Principal(Resolved Locale or Principal for the request)
- 구문 분석과 캐시된 폼 데이터에 대한 액세스(Access to parsed and cached form data)
- 멀티파트 데이텅츼 추상화(Abstractions for multipart data)
- 기타 등등.. (and more..)

### 특별한 빈 타입들(Special bean types)
아래 표는 `WebHttpHandlerBuilder`가 스프링 애플리케이션 컨텍스트에서 자동 감지하거나, 직접 등록할 수 있는 컴포넌트 목록이다.

| 빈 이름 | 빈 타입 | 개수 | 설명
|--|--|--|--|
`<any>` | `WebExceptionHandler` | 0..N | `WebFilter` 인스턴스 체인과 대상 `WebHandler`에서 예외에 대한 처리를 제공한다. 자세한 내용은 예외<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-exception-handler" rel="nofollow" target="_blank">(Exceptions)</a>를 참조
`<any>` | `WebFilter` | 0..N | 타겟 `WebHandler` 전후에 인터셉터 스타일의 처리를 제공한다. 자세한 내용은 필터<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-filters" rel="nofollow" target="_blank">(Filters)</a> 참조
`webHandler` | `WebHandler` | 1 | 요청을 처리한다.
`webSessionManager` | `WebSessionManager` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출된 `WebSession` 인스턴스 관리자. 디폴트는 `DefaultWebSessionManager`
`serverCodecConfigurer` | `ServerCodecConfigurer` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출된 폼 데이터와 멀티파트 데이터를 구문 분석하기 위해 `HttpMessageReader`에 액세스. 기본적으로 `ServerCodecConfigurer.create()`
`localeContextResolver` | `LocaleContextResolver` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출되는 `LocaleContext`에 대한 리졸버
`forwardedHeaderTransformer` | `ForwardedHeaderTransformer` | 0..1 | 포워드 타입 헤더를 추출 및 제거 또는 제거만 한다. 디폴트는 사용하지 않음

### 폼 데이터(Form Data)
`ServerWebExchange`는 아래와 같은 폼 데이터 액세스 메서드를 제공한다.

#### Java:
```java
Mono<MultiValueMap<String, String>> getFormData();
```

#### Kotlin:
```kotlin
suspend fun getFormData(): MultiValueMap<String, String>
```

`DefaultServerWebExchange`는 설정된 `HttpMessageReader`를 사용하여 폼 데이터(application/x-www-form-urlencoded)를
MultiValueMap 으로 파싱한다. 기본적으로 `FormHttpMessageReader`는 `ServerCodecConfigurer` 빈에서 사용하도록 설정된다.
(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">웹 핸들러 API</a> 참조)

### 멀티파트 데이터(Multipart Data)
`ServerWebExchange`는 아래와 같은 멀티파트 데이터 액세스 메서드를 제공한다.

#### Java:
```java
Mono<MultiValueMap<String, Part>> getMultipartData();
```

#### Kotlin:
```kotlin
suspend fun getMultipartData(): MultiValueMap<String, Part>
```

`DefaultServerWebExchange`는 설정된 `HttpMessageReader <MultiValueMap<String, Part>>`를 사용하여 multipart/form-data 컨텐츠를
`MultiValueMap`으로 파싱한다. 현재로서는 <a href="https://github.com/synchronoss/nio-multipart" rel="nofollow" target="_blank">Synchronoss NIO Multipart</a>가
유일하게 지원되는 써드파티 라이브러리며, 멀티파트 요청을 논 블로킹으로 파싱하는 유일한 라이브러리다. `ServerCodecConfigurer` 빈을
통해 활성화된다. (<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">웹 핸들러 API</a> 참조)

멀티파트 데이터를 스트리밍 방식으로 파싱하려면 `HttpMessageReader<Party>`에서 반환된 `Flux<Part>`를 대신 사용할 수 있다. 예를 들어, 어노테이션
컨트롤러에서 `@RequestPart`를 사용하면 이름 별로 개별 파트에 대한 `Map`과 같은 액세스를 의미한다. 따라서, 멀티파트 데이터를 전체적으로 파싱해야 한다.
반면에 `@RequestBody`를 사용하여 `MultiValueMap`으로 모으지 않고 `Flux<Part>`로 컨텐츠를 디코딩할 수 있다.

### 전달된 헤더(Forwarded Headers)
요청이 프록시(예를 들면 로드 밸런서)를 통과하면 호스트, 포트 그리고 체계(scheme)가 변경될 수 있다. 따라서 클라이언트 관점에서 올바른 호스트,
포트 그리고 체계가 가리키는 링크를 만드는 것은 쉽지 않다.

RFC 7239<a href="https://tools.ietf.org/html/rfc7239" rel="nofollow" target="_blank">(링크)</a>는 원래 요청에 대한
정보를 제공하는데 사용할 수 있는 Forwarded HTTP 헤더를 정의한다. `X-Forwarded-Host`, `X-Forwarded-Port`, `X-Forwarded-Proto`,
`X-Forwarded-Ssl` 그리고 `X-Forwarded-Prefix` 를 포함한 다른 비표준 헤더도 있다.

`ForwardedHeaderTransformer`는 ForwardedHeader를 기반으로 요청의 호스트, 포트 그리고 체계(scheme)를 수정한 후에 해당 헤더를 제거하는
컴포넌트다. 이름이 `forwardedHeaderTransformer`인 빈으로 선언하면 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api-special-beans" rel="nofollow" target="_blank">감지</a>되어 사용된다.

애플리케이션은 헤더가 프록시에 의해 추가되었는지 또는 악의적인 클라이언트에 의해 의도적으로 추가되었는지 알 수 없으므로 전달된 헤더(forwarded headers)의
보안 고려사항이 있다. 이것이 신뢰의 경계에 있는 프록시를 구성하여 외부에서 들어오는 신뢰할 수 없는 트래픽을 제거하도록 설정해야 하는 이유다.
`removeOnly=true` 옵션으로 `ForwardedHeaderTransformer`를 구성할 수도 있다. 이 경우 헤더는 제거하지만 사용하지 않는다.

> 5.1 버전에서는 `ForwardedHeaderFilter`가 deprecated 되었고 `ForwardedHeaderTransformer`로 대체되었다. 그렇기 때문에 전달된
헤더(forwarded headers)는 exchange의 생성되기 전에 더 일찍 처리될 수 있다. 필터가 설정된 경우라면 필터 목록에서 제거되고 대신
`ForwardedHeaderTransformer`가 사용된다.

<br>

## 1.2.3. 필터
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a>에서
`WebFilter`를 사용하여 인터셉터 스타일의 로직을 `WebHandler`의 전후에 체이닝 방식으로 적용할 수 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">Webflux Config</a>를 사용하는 경우, `WebFilter`를 등록하는 것은 스프링 빈을 등록하는 것만큼 간단하며 빈 선언에 `@Order`를 사용하거나 `Ordered` 인터페이스를 구현하여 우선순위를 표시할 수 있다.

### CORS
스프링 웹플럭스는 컨트롤러의 어노테이션을 통해 CORS 설정을 세부적으로 지원한다. 그러나 스프링 시큐리티(Spring Security)와 함께 사용하는 경우
내장 `CorsFilter`를 사용하는 것을 권장한다. 이 필터는 스프링 시큐리티의 필터 체인보다 먼저 적용되어야 한다.

더 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-cors" rel="nofollow" target="_blank">CORS</a>와 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/webflux-cors.html#webflux-cors-webfilter" rel="nofollow" target="_blank">webflux-cors</a>를 참조하라.

<br>

## 1.2.4. 예외
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a>에서
`WebExceptionHandler`를 사용하여 WebFilter 인스턴스와 타겟 WebHandler의 예외를 처리할 수 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">WebFlux Config</a>를
사용하는 경우, `WebExceptionHandler`를 등록하는 것은 스프링 빈을 등록하는 것만큼 간단하며 빈 선언에 `@Order`를 사용하거나 `Ordered` 인터페이스를
구현하여 우선순위를 표시할 수 있다.

아래 표는 사용 가능한 `WebExceptionHandler` 구현체에 대한 설명이다.

| 예외 핸들러 | 설명 
|--|--|
`ResponseStatusExceptionHandler` | 예외의 HTTP 상태 코드에 대한 응답을 설정하여 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/ResponseStatusException.html" rel="nofollow" target="_blank">`ResponseStatusException`</a> 유형의 예외를 처리한다.
`WebFluxResponseStatusExceptionHandler` | 예외 유형에 상관없이 `@ResponseStatus`의 상태 코드를 결정할 수 있는 `ResponseStatusExceptionHandler`의 확장 버전이다. 이 핸들러는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">Webflux Config</a>에 선언한다.

<br>

## 1.2.5. 코덱(Codecs)
`spring-web`과 `spring-core` 모듈은 리액티브 스트림 백프레셔와 논 블로킹 I/O를 통하여 고수준 객체와 바이트 컨텐츠를 직렬화(serialization)하고
역직렬화(deserialization)하는 기능을 지원한다. 다음은 지원하는 기능에 대한 설명이다.

- <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/codec/Encoder.html" rel="nofollow" target="_blank">`Encoder`</a>와 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/codec/Decoder.html" rel="nofollow" target="_blank">`Decoder`</a>는 HTTP와 무관하게 컨텐츠를 인코딩하고 디코딩하는 저수준(low level) 기능이다.
- <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/http/codec/HttpMessageReader.html" rel="nofollow" target="_blank">`HttpMessageReader`</a>와 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/http/codec/HttpMessageWriter.html" rel="nofollow" target="_blank">`HttpMessageWriter`</a>는 HTTP 메시지 컨텐츠를 인코딩하고 디코딩하기 위해 사용된다.
- 인코더는 `EncoderHttpMessageWriter`로 래핑되어 웹 애플리케이션에서 사용할 수 있도록 조정할 수 있고, 디코더는 `DecoderHttpMessageReader`로
래핑될 수 있다.

- <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/io/buffer/DataBuffer.html" rel="nofollow" target="_blank">`DataBuffer`</a>는 다른 바이트 버퍼 표현(예를 들면 Netty ByteBuf, java.nio.ByteBuffer 등)을 추상화하며 모든 코덱은 여기서 동작한다. 관련하여 자세한 내용은 "Spring Core"의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers" rel="nofollow" target="_blank">Data Buffers and Codecs</a>를 참고하라.

`spring-core` 모듈은 `byte[]`, `ByteBuffer`, `Resource`, `String` 인코더 및 디코더 구현체를 제공한다.
`spring-web` 모듈은 Jackson JSON, Jackson Smile, JAXB2, Protocol Buffer 그리고 기타 다른 인코더와 디코더와 함께 폼 데이터,
멀티파트 컨텐츠, 서버 전송 이벤트 및 기타 처리를 위한 웹 전용 HTTP 메시지 reader/writer 구현체를 제공한다.

`ClientCodecConfigurer`와 `ServerCodecConfigurer`는 일반적으로 애플리케이션에서 사용할 코덱을 설정하고 사용자 맞춤 설정(customize)을 위해
사용된다. 이 부분은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-message-codecs" rel="nofollow" target="_blank">HTTP 메시지 코덱</a> 설정에 대한 섹션을 참조하라.

### 잭슨(Jackson) JSON
잭슨(Jackson) 라이브러리가 있으면, JSON과 이진 JSON<a href="https://github.com/FasterXML/smile-format-specification" rel="nofollow" target="_blank">(Smile)</a>이 모두 지원된다.

`Jackson2Decoder`는 아래와 같이 동작한다:

- Jackson의 비동기, 논 블로킹 파서는 바이트 청크 스트림을 각각 JSON 객체를 나타내는 `TokenBuffer`로 수집하기 위해 사용된다.
- 각 `TokenBuffer`는 Jackson의 `ObjectMapper`로 전달되어 더 높은 수준의 객체를 만든다.
- 단일값 퍼블리셔(Mono)로 디코딩할 때는, 하나의 `TokenBuffer`가 존재한다.
- 다중값 퍼블리셔(Flux)로 디코딩할 때는, 각 `TokenBuffer`는 완전히 포맷팅된 객체가 될 정도의 충분한 바이트가 수신되는 즉시 `ObjectMapper`로
전달된다. 입력 컨텐츠는 JSON 배열이거나, 컨텐츠 유형이 `application/stream+json`인 경우 라인 구분된 JSON<a href="https://en.wikipedia.org/wiki/JSON_streaming" rel="nofollow" target="_blank">(line-delimited JSON)</a>일 수 있다.

`Jackson2Encoder`는 아래와 같이 동작한다:

- 단일값 퍼블리셔(Mono)의 경우, 간단히 `ObectMapper`로 직렬화(serialization)한다.
- `application/json`을 사용하는 다중값 퍼블리셔의 경우, 기본적으로 `Flux#collectToList()`로 값을 모은 후에 그 결과를 직렬화한다.
- `application/stream+json` 또는 `application/stream+x-jackson-smile`과 같은 스트리밍 미디어 타입의 다중값 퍼블리셔의 경우
라인 구분된 JSON<a href="https://en.wikipedia.org/wiki/JSON_streaming" rel="nofollow" target="_blank">(line-delimited JSON)</a> 포맷을 이용하여 각 값을 개별적으로 인코딩, 쓰기 그리고 플러싱한다.
- SSE(Server-Sent Events)의 경우 `Jackson2Encoder`가 이벤트마다 호출되며 출력(output)은 지연 없이 전달되도록 플러싱된다.

> 기본적으로 `Jackson2Encoder`와 `Jackson2Decoder` 모두 문자열(String) 타입의 요소를 지원하지 않는다. 대신에 기본 가정은 문자열 또는 문자열
시퀀스가 직렬화된 JSON 컨텐츠를 나타내며 `CharSequenceEncoder`에 의해 렌더링된다는 것이다. `Flux<String>`에서 JSON 배열을 렌더링해야 하는 경우,
`Flux#collectToList()`를 사용하고 `Mono<List<String>>`을 인코딩하라.

### 폼 데이터(Form Data)
`FormHttpMessageReader`와 `FormHttpMessageWriter`는 `application/x-www-form-urlencoded` 컨텐츠의 디코딩과 인코딩을 지원한다.

여러 곳에서 폼 컨텐츠에 접근해야 하는 서버 측에서는 `ServerWebExchange`가 제공하는 `getFormData()` 메서드로 파싱한다.
`FormHttpMessageReader` 통해 내용을 파싱한 후 반복적인 액세스를 위해 결과를 캐싱한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a> 섹션의
폼 데이터<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-form-data" rel="nofollow" target="_blank">(Form Data)</a>를 참조하라.

`getFormData()` 메서드가 호출되면, 더 이상 요청 본문에서 원래의 원본 컨텐츠는 읽을 수 없다. 이러한 이유로 애플리케이션은 요청 본문에서 원본 컨텐츠를
읽는 것 대신에 `ServerWebExchange`를 통해 캐싱된 폼 데이터에 접근하도록 한다.

### 멀티파트(Multipart)
`MultipartHttpMessageReader`와 `MultipartHttpMessageWriter`는 `multipart/form-data` 컨텐츠의 디코딩과 인코딩을 지원한다. 결과적으로
`MultipartHttpMessageReader`는 `Flux<Part>`로의 파싱 작업은 `HttpMessageReader`에게 위임한 후에 결과를 `MultiValueMap`에 수집한다.
현재는 <a href="https://github.com/synchronoss/nio-multipart" rel="nofollow" target="_blank">Synchronoss NIO Multipart</a>가 실제 파싱에 사용된다.

여러 곳에서 멀티파트 컨텐츠에 접근해야 하는 서버 측에서는 `ServerWebExchange`가 제공하는 `getMultipartData()` 메서드로 파싱한다.
`MultipartHttpMessageReader`를 통해 내용을 파싱한 후 반복적인 액세스를 위해 결과를 캐싱한다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">`WebHandler` API</a> 섹션의
멀티파트 데이터<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multipart" rel="nofollow" target="_blank">(Multipart Data)</a>를 참조하라.

`getMultipartData()` 메서드가 호출되면, 더 이상 요청 본문에서 원래의 원본 컨텐츠는 읽을 수 없다. 이로 인해 애플리케이션은 반복적인 맵과 같은 액세스에
대해서 `getMultipartData()` 메서드를 지속적으로 사용해야 하며, `Flux<Part>`로의 일회성 접근에는 `SynchronossPartHttpMessageReader`를
사용한다.

### 제한(Limits)
입력 스트림의 일부 또는 전부를 버퍼링하는 `Decoder`와 `HttpMessageReader` 구현체는 메모리에서 버퍼링할 최대 바이트 사이즈를 지정할 수 있다.
입력 버퍼링이 발생하는 경우가 있다. 예를 들면 `@RequestBody byte[]`, `x-www-form-urlencoded` 등의 데이터를 다루는 컨트롤러 메서드처럼
입력이 합쳐져 단일 객체로 표현되는 경우가 있다. 또한, 구분된 텍스트(delimited text), JSON 객체의 스트림 등과 같은 입력 스트림을 분리할 때
스트리밍에서에서 버퍼링이 발생할 수 있다. 이러한 스트리밍 경우, 버퍼 바이트 사이즈 제한은 스트림에서 하나의 객체와 연결된 바이트 수에 적용된다.

버퍼 사이즈를 설정하기 위해서, 지정된 `Decoder` 또는 `HttpMessageReader`의 `maxInMemorySize` 설정이 가능한지 확인하고, Javadoc에 기본값에
대한 세부 사항이 있는지 확인할 수 있다. 서버 측에서 `ServerCodecConfigurer`은 모든 코덱을 설정할 수 있는 단일 위치를 제공한다.
관련 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-message-codecs" rel="nofollow" target="_blank">HTTP 메시지 코덱</a>을 참조하라.
클라이언트 쪽에서는 모든 코덱에 대한 제한을 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-client-builder-maxinmemorysize" rel="nofollow" target="_blank">WebClient.Builder</a>에서
변경할 수 있다.

`maxInMemorySize` 속성은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs-multipart" rel="nofollow" target="_blank">멀티파트 파싱</a>에
적용되는 non-file 파트의 크기를 제한한다. 파일 파트의 경우 파트가 디스크에 기록되는 임계값을 결정한다. 디스크에 기록된 파일 파트의 경우
파트 당 디스크 공간의 양을 제한하는 `maxDiskUsagePerPart` 속성이 추가적으로 있다. 또한 `maxParts` 속성은 멀티파트 요청의
전체 사이즈를 제한한다. 웹플럭스에서 이 세가지 속성을 모두 설정하려면 미리 설정된 `MultipartHttpMessageReader` 인스턴스를
`ServerCodecConfigurer`에 설정해야 한다.

### 스트리밍(Streaming)
`text/event-stream`, `application/stream+json`과 같은 HTTP 응답으로 스트리밍 할 때는 연결이 끊어진 클라이언트를 보다 빨리 감지할 수 있도록
주기적으로 데이터를 보내야한다. 이러한 전송은 코멘트만 있거나, 빈 SSE(Server Sent Events) 또는 심장박동(heartbeat) 역할을 하는 다른 어떠한
"동작없음(no-op)" 데이터일 수 있다.

### 데이터 버퍼(`Data Buffer`)
`DataBuffer`는 웹플럭스의 바이트 버퍼를 나타낸다. 스프링 코어의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers" rel="nofollow" target="_blank">데이터 버퍼와 코덱</a> 섹션에서
더 자세히 확인할 수 있다. 중요한 점은 네티(Netty)와 같은 일부 서버에서 바이트 버퍼가 풀링되고 참조 카운트되며 메모리 누수(leak)를
방지하기 위해 소비될 때 해제되어야 한다는 것이다.

데이터 버퍼를 직접 소비하거나 생산하지 않는 한, 더 높은 수준의 개체로 변환하거나 사용자 지정 코덱을 만들어 사용하거나 또는 코덱을 사용하여
고수준 객체들로/로부터 변환하는 작업을 하지 않는 이상, 웹플럭스 애플리케이션은 일반적으로 이러한 이슈에 대해서 걱정할 필요가 없다.
이러한 경우에 대해서는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers" rel="nofollow" target="_blank">데이터 버퍼와 코덱</a>,
특히 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers-using" rel="nofollow" target="_blank">데이터 버퍼 사용</a>에 대한 섹션을 참조하라.

<br>

## 1.2.6. 로깅(Logging)
스프링 웹플럭스의 **DEBUG** 레벨 로깅은 가볍고, 최소화되며, 인간 친화적으로 설계되었다. 특정 문제를 디버깅할 때만 유용한 다른 정보에 비해
계속해서 가치가 있는 정보에 중점을 둔다.

**TRACE** 레벨 로깅은 일반적으로 DEBUG와 동일한 원칙을 따르지만(예를 들어, firehose가 되어선 안된다.) 어떠한 디버깅에도 사용될 수 있다.
또한 일부 로그 메시지는 TRACE와 DEBUG 레벨에서 서로 다른 수준의 세부 정보를 표시할 수 있다.

좋은 로깅은 사용 경험에서 비롯된다. 명시된 목표를 충족하지 못하는 것이 발견되면 제보하라.

### 로그 아이디(Log Id)
웹플럭스에서는 단일 요청을 여러 스레드에서 실행할 수 있기 때문에, 특정 요청에 대한 로그 메시지의 연관성을 찾는데 스레드 ID는 유용하지 못하다.
이것이 웹플럭스 로그 메시지 앞에 기본적으로 요청별 ID가 접두사로 붙는 이유다.

서버 측에서 로그 ID는 `ServerWebExchange` 속성(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/server/ServerWebExchange.html#LOG_ID_ATTRIBUTE" rel="nofollow" target="_blank">`LOG_ID_ATTRIBUTE`</a>)으로
저장되며 `ServerWebExchange#getLogPrefix()` 메서드를 통해 해당 ID를 기반으로 한 완전히 포맷팅된 접두사를 얻을 수 있다.
클라이언트 측에서 로그 ID는 `ClientRequest` 속성(<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/function/client/ClientRequest.html#LOG_ID_ATTRIBUTE" rel="nofollow" target="_blank">`LOG_ID_ATTRIBUTE`</a>)로 저장되며
`ClientRequest#logPrefix()` 메서드를 통해 완전히 포맷팅된 접두사를 얻을 수 있다.

### 민감한 데이터(Sensitive Data)
DEBUG와 TRACE 로깅은 민감한 정보를 기록할 수 있다. 그렇기 때문에 폼 파라미터와 헤더는 기본적으로 마스킹되어야 하고, 전체 로깅은 명시적으로 활성화돼야
한다.

다음 예제는 서버 측 요청에 대한 로깅 설정 방법이다:

#### Java:
```java
@Configuration
@EnableWebFlux
class MyConfig implements WebFluxConfigurer {

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().enableLoggingRequestDetails(true);
    }
}
```

Kotlin
```kotlin
@Configuration
@EnableWebFlux
class MyConfig : WebFluxConfigurer {

    override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
        configurer.defaultCodecs().enableLoggingRequestDetails(true)
    }
}
```

다음 예제는 클라이언트 측 요청에 대한 로깅 설정 방법이다:

#### Java:
```java
Consumer<ClientCodecConfigurer> consumer = configurer ->
        configurer.defaultCodecs().enableLoggingRequestDetails(true);

WebClient webClient = WebClient.builder()
        .exchangeStrategies(strategies -> strategies.codecs(consumer))
        .build();
```

#### Kotlin:
```kotlin
val consumer: (ClientCodecConfigurer) -> Unit  = { configurer -> configurer.defaultCodecs().enableLoggingRequestDetails(true) }

val webClient = WebClient.builder()
        .exchangeStrategies({ strategies -> strategies.codecs(consumer) })
        .build()
```

### 사용자 지정 코덱(Custom codecs)
애플리케이션은 추가적인 미디어 유형을 지원하거나 기본 코덱에서 지원하지 않는 특정 동작을 지원하기 위해 사용자 지정 코덱을 등록할 수 있다.

개발자가 설정할 수 있는 일부 옵션은 기본 코덱에 적용된다. 사용자 지정 코덱은 버퍼링 제한(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs-limits" rel="nofollow" target="_blank">enforcing buffering limits</a>) 또는 민감한 데이터 로깅(<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-logging-sensitive-data" rel="nofollow" target="_blank">logging sensitive data</a>)과
같은 설정을 필요로 할 수 있다.

아래 예제는 클라이언트측 요청에 대한 설정 방법이다.

#### Java:
```java
WebClient webClient = WebClient.builder()
        .codecs(configurer -> {
                CustomDecoder decoder = new CustomDecoder();
                configurer.customCodecs().registerWithDefaultConfig(decoder);
        })
        .build();
```

#### Kotlin:
```kotlin
val webClient = WebClient.builder()
        .codecs({ configurer ->
                val decoder = CustomDecoder()
                configurer.customCodecs().registerWithDefaultConfig(decoder)
         })
        .build()
```

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-dispatcherhandler">다음글 "1.3. DispatcherHandler" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>