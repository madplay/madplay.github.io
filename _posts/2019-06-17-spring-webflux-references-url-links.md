---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.6. URI Links"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.6. URI Links"
category: Spring
date: "2019-06-17 20:13:12"
comments: true
---

# 1.6. URI 링크(URI Links)
이 섹션에서는 스프링 프레임워크에서 URI를 구성할 때 사용할 수 있는 다양한 옵션에 대해 설명한다.

<br>

## 1.6.1. UriComponents
`UriComponentsBuilder`는 변수를 사용한 URI 템플릿에서 URI를 작성하는데 도움을 준다. 아래는 그 예제다.

Java
```java
UriComponents uriComponents = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}") (1)
        .queryParam("q", "{q}") (2)
        .encode() (3)
        .build(); (4)

URI uri = uriComponents.expand("Westin", "123").toUri(); (5)
```

#### Kotlin:
```kotlin
val uriComponents = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}") (1)
        .queryParam("q", "{q}") (2)
        .encode() (3)
        .build() (4)

val uri = uriComponents.expand("Westin", "123").toUri() (5)
```

> (1) URI 템플릿을 사용하는 정적 팩토리 메서드<br>
> (2) URI 컴포넌트를 추가하거나 교체한다.<br>
> (3) URI 템플릿과 URI 변수를 인코딩하도록 요청한다.<br>
> (4) `UriComponents`를 빌드한다.<br>
> (5) 템플릿 변수를 확장하고 `URI`를 얻는다.

아래 예제와 같이 `buildAndExpand`를 사용하여 앞의 예제를 하나의 체인으로 통합할 수 있다.

#### Java:
```java
URI uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}")
        .queryParam("q", "{q}")
        .encode()
        .buildAndExpand("Westin", "123")
        .toUri();
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}")
        .queryParam("q", "{q}")
        .encode()
        .buildAndExpand("Westin", "123")
        .toUri()
```

아래 예제와 같이 URI(인코딩이 적용된)로 바로 만들면 더 단축시킬 수 있다.

#### Java:
```java
URI uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}")
        .queryParam("q", "{q}")
        .build("Westin", "123");
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}")
        .queryParam("q", "{q}")
        .build("Westin", "123")
```

아래 예제와 같이 전체를 URI 템플릿으로 사용해서 더 짧게 만들 수 있다.

#### Java:
```java
URI uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}?q={q}")
        .build("Westin", "123");
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder
        .fromUriString("https://example.com/hotels/{hotel}?q={q}")
        .build("Westin", "123")

```

<br>

## 1.6.2. UriBuilder
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#web-uricomponents" rel="nofollow" target="_blank">`UriComponentsBuilder`</a>는
`UriBuilder` 인터페이스를 구현한다. `UriBuilderFactory`를 사용하여 `UriBuilder`를 생성할 수 있다. `UriBuilderFactory`와
`UriBuilder`는 URI 템플릿으로부터 기본(base) URL, 인코딩 설정 그리고 기타 세부사항과 같은 공유 가능한 설정을 기반으로 URI를 빌드하는
플러그인과 같은 메커니즘을 제공한다.

`UriBuilderFactory`를 사용하여 `RestTemplate`와 `WebClient`를 설정하여 URI 준비 과정을 사용자 정의(커스텀마이징)할 수 있다.
`DefaultUriBuilderFactory`는 내부적으로 `UriComponentsBuilder`를 사용하고 공유 설정 옵션을 제공하는 `UriBuilderFactory`의 기본 구현체다.

아래는 `RestTemplate`을 설정하는 예제다.

#### Java:
```java
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode;

String baseUrl = "https://example.org";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl);
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);
```

#### Kotlin:
```kotlin
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode

val baseUrl = "https://example.org"
val factory = DefaultUriBuilderFactory(baseUrl)
factory.encodingMode = EncodingMode.TEMPLATE_AND_VALUES

val restTemplate = RestTemplate()
restTemplate.uriTemplateHandler = factory
```

아래는 `WebClient`를 설정하는 예제다.

#### Java:
```java
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode;

String baseUrl = "https://example.org";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl);
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

WebClient client = WebClient.builder().uriBuilderFactory(factory).build();
```

#### Kotlin:
```kotlin
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode

val baseUrl = "https://example.org"
val factory = DefaultUriBuilderFactory(baseUrl)
factory.encodingMode = EncodingMode.TEMPLATE_AND_VALUES

val client = WebClient.builder().uriBuilderFactory(factory).build()
```

또한 `DefaultUriBuilderFactory`를 직접 사용할 수도 있다. 이는 `UriComponentsBuilder`를 사용하는 것과 유사하지만, 정적 팩토리 메서드 대신에
아래 예제와 같이 설정을 가지고 있는 실제 인스턴스다.

#### Java:
```java
String baseUrl = "https://example.com";
DefaultUriBuilderFactory uriBuilderFactory = new DefaultUriBuilderFactory(baseUrl);

URI uri = uriBuilderFactory.uriString("/hotels/{hotel}")
        .queryParam("q", "{q}")
        .build("Westin", "123");
```

#### Kotlin:
```kotlin
val baseUrl = "https://example.com"
val uriBuilderFactory = DefaultUriBuilderFactory(baseUrl)

val uri = uriBuilderFactory.uriString("/hotels/{hotel}")
        .queryParam("q", "{q}")
        .build("Westin", "123")
```

<br>

## 1.6.3. URI 인코딩(URI Encoding)
`UriComponentsBuilder`는 두 가지 레벨로 인코딩 옵션을 제공한다.

- <a href="https://docs.spring.io/spring-framework/docs/5.2.6.RELEASE/javadoc-api/org/springframework/web/util/UriComponentsBuilder.html#encode--" rel="nofollow">UriComponentsBuilder#encode()</a>: URI 템플릿을 먼저 인코딩한 후에 URI 변수를
적용할 때 인코딩한다.
- <a href="https://docs.spring.io/spring-framework/docs/5.2.6.RELEASE/javadoc-api/org/springframework/web/util/UriComponents.html#encode--" rel="nofollow">UriComponents#encode()</a>: URI 변수가 적용된 후 URI 컴포넌트를 인코딩한다.

두 가지 옵션은 아스키(ASCII)가 아닌 잘못된 문자를 이스케이프한 8진수로 대체한다. 하지만 첫 번째 옵션은 URI 변수에 예약 문자가 있는 경우 치환한다.

> ";"를 생각해보자. path에 사용할 수 있지만 예약된 문자다. 첫 번째 옵션의 경우 URI 변수에 있는 ";"를 "%3B"로 대체하지만, URI 템플릿에서는
그렇지 않다. 반대로 두 번째 옵션은 ";"를 절대 대체하지 않는다. 이유는 path에서 유효한 문자이기 때문이다.

대부분의 경우 첫 번째 옵션은 예상한 결과를 제공할 가능성이 높다. 이유는 첫 번째 옵션은 URI 변수를 인코딩할 불분명한 데이터로 취급하기 때문이다. 
두 번째 옵션은 URI 변수에 의도적으로 예약 문자가 포함된 경우에 유용하다.

아래는 첫 번째 옵션을 사용한 예제다:

#### Java:
```java
URI uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
        .queryParam("q", "{q}")
        .encode()
        .buildAndExpand("New York", "foo+bar")
        .toUri();

// Result is "/hotel%20list/New%20York?q=foo%2Bbar"
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
        .queryParam("q", "{q}")
        .encode()
        .buildAndExpand("New York", "foo+bar")
        .toUri()

// Result is "/hotel%20list/New%20York?q=foo%2Bbar"
```

아래 예제와 같이 URI로 바로 만들면(인코딩을 포함하여) 앞의 예제를 더 줄일 수 있다:

#### Java:
```java
URI uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
        .queryParam("q", "{q}")
        .build("New York", "foo+bar")
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
        .queryParam("q", "{q}")
        .build("New York", "foo+bar")
```

완전한 URL 템플릿으로 더 단축시킬 수 있다:

#### Java:
```java
URI uri = UriComponentsBuilder.fromPath("/hotel list/{city}?q={q}")
        .build("New York", "foo+bar")
```

#### Kotlin:
```kotlin
val uri = UriComponentsBuilder.fromPath("/hotel list/{city}?q={q}")
        .build("New York", "foo+bar")
```

`WebClient`와 `RestTemplate`은 `UriBuilderFactory` 전략을 통해 내부적으로 URI 템플릿을 확장하고 인코딩한다. 두 가지 모두 커스텀 전략으로
아래 예제와 같이 설정할 수 있다:

#### Java:
```java
String baseUrl = "https://example.com";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl)
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

// Customize the RestTemplate..
RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);

// Customize the WebClient..
WebClient client = WebClient.builder().uriBuilderFactory(factory).build();
```

#### Kotlin:
```kotlin
val baseUrl = "https://example.com"
val factory = DefaultUriBuilderFactory(baseUrl).apply {
    encodingMode = EncodingMode.TEMPLATE_AND_VALUES
}

// Customize the RestTemplate..
val restTemplate = RestTemplate().apply {
    uriTemplateHandler = factory
}

// Customize the WebClient..
val client = WebClient.builder().uriBuilderFactory(factory).build()
```

`DefaultUriBuilderFactory` 구현체는 `UriComponentsBuilder`를 내부적으로 사용하여 URI 템플릿을 확장하고 인코딩한다.
팩토리로서 아래 인코딩 모드 중 하나를 인코딩 방식으로 설정할 수 있다:

- `TEMPLATE_AND_VALUES`: 위에서 살펴본 첫 번째 옵션인 `UriComponentsBuilder#encode()`를 사용하여 URI 템플릿을 먼저 인코딩하고
URI 변수를 적용할 때 인코딩 한다.
- `VALUES_ONLY`: URI 템플릿을 인코딩하지 않고 `UriUtils#encodeUriUriVariables`를 사용하여 URI 변수를 템플릿에 적용하기 전에 엄격히 인코딩한다.
- `URI_COMPONENT`: 위에서 살펴본 두 번째 옵션인 `UriComponents#encode()`를 사용하여 URI 변수를 적용한 후에 URI 컴포넌트를 인코딩한다.
- `NONE`: 인코딩을 적용하지 않는다.

`RestTemplate`은 이전 버전과의 호환성을 위해서 `EncodingMode.URI_COMPONENT`로 설정된다. `WebClient`는 `DefaultUriBuilderFactory`의
기본값을 사용하며 5.0.x 버전에서는 `EncodingMode.URI_COMPONENT`이지만, 5.1 버전에서는 `EncodingMode.TEMPLATE_AND_VALUES`로 변경되었다.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-cors">다음글 "1.7. CORS" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>