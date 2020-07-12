---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.10. HTTP Caching"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.10. HTTP Caching"
category: Spring
date: "2019-07-18 01:25:54"
comments: true
---

# 1.10. HTTP 캐싱(Caching)
HTTP 캐싱은 웹 애플리케이션의 성능을 크게 향상시킬 수 있다. HTTP 캐싱은 `Cache-Control` 응답 헤더와 `Last-Modified`와 `ETag`와
같은 조건부 요청 헤더를 중심으로 동작한다. `Cache-Control`는 클라이언트 캐시(private cache, 예를 들어 브라우저)와
공유 캐시(public cache, 예를 들어 프록시)에 응답을 캐시하고 재사용할지 방법을 정의한다. `ETag` 헤더는 내용이 변경되지 않은 경우 
`body` 없이 304(NOT_MODIFIED) 응답을 내보낼 때 사용된다. `ETag`는 `Last-Modified` 헤더의 보다 정교한 후속 버전으로 볼 수 있다.

이 섹션은 스프링 웹플럭스에서 사용 가능한 HTTP 캐싱 관련 옵션에 대해 설명한다.

<br>

## 1.10.1. CacheControl
<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/http/CacheControl.html" rel="nofollow" target="_blank">`CacheControl`</a>은 `Cache-Control` 헤더와 관련된 설정을 지원하며, 다양한 곳에서 사용할 수 있다.

- 컨트롤러<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-caching-etag-lastmodified" rel="nofollow" target="_blank">(Controllers)</a>
- 정적 자원<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-caching-static-resources" rel="nofollow" target="_blank">(Static Resources)</a>

<a href="https://tools.ietf.org/html/rfc7234#section-5.2.2" rel="nofollow" target="_blank">RFC 7234</a>는
`Cache-Control` 응답 헤더의 모든 지시문(directive)을 설명하지만, `CacheControl` 타입은 아래 예제와 같이 일반적인 시나리오에
중점을 둔, 사용 사례 지향적인(use case-oriented) 접근 방식을 취한다.

<div class="post_comments">[역주] 자주 사용되는 케이스별로 미리 코드를 정의해둘 수 있다.</div>

#### Java:
```java
// Cache for an hour - "Cache-Control: max-age=3600"
CacheControl ccCacheOneHour = CacheControl.maxAge(1, TimeUnit.HOURS);

// Prevent caching - "Cache-Control: no-store"
CacheControl ccNoStore = CacheControl.noStore();

// Cache for ten days in public and private caches,
// public caches should not transform the response
// "Cache-Control: max-age=864000, public, no-transform"
CacheControl ccCustom = CacheControl.maxAge(10, TimeUnit.DAYS).noTransform().cachePublic();
```

#### Kotlin:
```kotlin
// Cache for an hour - "Cache-Control: max-age=3600"
val ccCacheOneHour = CacheControl.maxAge(1, TimeUnit.HOURS)

// Prevent caching - "Cache-Control: no-store"
val ccNoStore = CacheControl.noStore()

// Cache for ten days in public and private caches,
// public caches should not transform the response
// "Cache-Control: max-age=864000, public, no-transform"
val ccCustom = CacheControl.maxAge(10, TimeUnit.DAYS).noTransform().cachePublic()
```

<br>

## 1.10.2. Controllers
컨트롤러는 HTTP 캐시를 명시할 수 있다. 요청 헤더와 비교하기 전에 리소스의 `lastModified` 또는 `ETag` 값을 계산해야 하므로,
보통은 이 방법을 권장한다. 컨트롤러는 아래 예제와 같이 `ETag`와 `Cache-Control` 설정을 `ResponseEntity`에 추가할 수 있다.

#### Java:
```java
@GetMapping("/book/{id}")
public ResponseEntity<Book> showBook(@PathVariable Long id) {

    Book book = findBook(id);
    String version = book.getVersion();

    return ResponseEntity
            .ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
            .eTag(version) // lastModified is also available
            .body(book);
}
```

#### Kotlin:
```kotlin
@GetMapping("/book/{id}")
fun showBook(@PathVariable id: Long): ResponseEntity<Book> {

    val book = findBook(id)
    val version = book.getVersion()

    return ResponseEntity
            .ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
            .eTag(version) // lastModified is also available
            .body(book)
}
```

앞의 예제는 요청 헤더와 비교할 때 내용이 변경되지 않았음인 경우 빈 본문과 304(NOT_MODIFIED) 응답을 전송한다. 아닌 경우는 `ETag`와
`Cache-Control` 헤더를 응답에 추가한다.

다음 예제와 같이 컨트롤러에서 요청 헤더를 검사할 수도 있다.

#### Java:
```java
@RequestMapping
public String myHandleMethod(ServerWebExchange exchange, Model model) {

    long eTag = ... // (1)

    if (exchange.checkNotModified(eTag)) {
        return null; // (2)
    }

    model.addAttribute(...); // (3)
    return "myViewName";
}
```

#### Kotlin:
```kotlin
@RequestMapping
fun myHandleMethod(exchange: ServerWebExchange, model: Model): String? {

    val eTag: Long = ... // (1)

    if (exchange.checkNotModified(eTag)) {
        return null // (2)
    }

    model.addAttribute(...) // (3)
    return "myViewName"
}
```

> (1) 애플리케이션 별로 계산한다.<br>
> (2) 응답을 304 (NOT_MODIFIED)로 설정한다. 더 이상의 처리는 하지 않는다.<br>
> (3) 요청 처리를 계속한다.<br>

요청에 대한 최신 여부를 확인하기 위해 `eTag`나 `lastModified` 또는 둘 다 사용할 수 있다. 조건부 `GET` 요청과 `HEAD` 요청은
응답을 304(NOT_MODIFIED)로 설정할 수 있다. 조건부 `POST`, `PUT` 그리고 `DELETE`의 경우 동시 수정을 막기 위해
412(RECONNDITION_FAILED)로 설정한다.

<br>

## 1.10.3. 정적 자원(Static Resources)
정적 자원도 `Cache-Control`과 조건부 응답 헤더를 사용하여 최적의 성능을 낼 수 있다.
설정 방법은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-static-resources" rel="nofollow" target="_blank">Static Resources</a>를 참고하라.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-webflux-config">다음글 "1.11. WebFlux Config" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>