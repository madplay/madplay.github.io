---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.7. CORS"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.7. CORS"
category: Spring
date: "2019-06-21 23:02:23"
comments: true
---

# 1.7. CORS
스프링 웹플럭스는 CORS(Cross-Origin Resource Sharing)를 처리할 수 있다. 이 섹션은 그 방법을 설명한다.

<br>

## 1.7.1. 소개(Introduction)
보안상의 이유로 브라우저는 현재 Origin이 아닌 자원에 대한 AJAX 호출을 금지한다. 예를 들어, 브라우저의 한 탭에서 은행 계좌를 보고 있고 다른 탭에서는
evil.com에 접속했다고 가정해보자. evil.com 사이트에 있는 스크립트는 인증서 등을 사용해서 은행 API에 AJAX 요청을 할 수 없어야 한다. (계좌에서
돈을 인출한다거나)

CORS(Cross-Origin Resource Sharing)는 <a href="https://caniuse.com/#feat=cors" rel="nofollow" target="_blank">대부분의 브라우저</a>에서
구현되는 <a href="https://www.w3.org/TR/cors/" rel="nofollow" target="_blank">W3C 스펙</a>으로 IFRAME 또는 JSONP을
기반으로 하는 덜 안전한 방법이 아닌 어떤 종류의 크로스 도메인 요청을 허용할 것인지 설정할 수 있다.

<br>

## 1.7.2. 처리(Processing)
CORS 스펙은 예비(preflight), 단순(simple), 실제(actual) 요청으로 나뉜다. CORS의 동작 방식에 대해서는
<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" rel="nofollow" target="_blank">이 문서</a>를 읽거나 자세한 내용을 보려면
스펙 가이드를 참고하라.

스프링 웹플럭스 `HandlerMapping` 구현체는 내장형 CORS를 기본적으로 지원한다. 요청이 핸들러에 매핑한 후 `HandlerMapping`은 주어진 요청과
핸들러에 대한 CORS 설정을 확인하고 추가 조치를 수행한다. 예비(preflight) 요청은 직접 처리하고, 단순(simple)과 실제(actual) 요청은 인터셉트되고
검증하며, 필요한 CORS 응답 헤더를 설정한다.

크로스 오리진(cross-origin, Origin 헤더와 호스트가 다른 요청)을 사용하려면, 명시적으로 CORS 설정을 선언해야 한다. 매칭되는 CORS 설정이 없으면
예비(preflight) 요청은 거부되며, 단순(simple)과 실제(actual) 요청은 응답에 CORS 헤더가 추가되지 않으므로 브라우저에서 거부된다.

URL 패턴 기반 `CorsConfiguration` 매핑으로 각 `HandlerMapping`마다 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/handler/AbstractHandlerMapping.html#setCorsConfigurations-java.util.Map-" rel="nofollow" target="_blank">설정</a>할 수 있다. 대부분 애플리케이션은 웹플럭스 자바 설정을 사용하여
이러한 매핑을 선언하므로 모든 `HandlerMapping` 구현체에 공통으로 적용된다.

`HandlerMapping` 레벨에서의 전역 CORS 설정을 보다 세분화된 핸들러 레벨 CORS 설정과 결합할 수 있다. 예를 들어 어노테이션 컨트롤러는 클래스 또는
메서드 레벨의 `@CrossOrigin` 어노테이션을 사용할 수 있다. (다른 핸들러는 CorsConfigurationSource를 구현할 수 있다.)

글로벌 설정과 로컬 설정을 결합하는 규칙은 일반적으로 더해진다. (예를 들면, 모든 전역 설정과 지역 설정을 더한다) `allowCredentials`과 `maxAge`처럼
단일 값만을 허용할 수 있는 속성의 경우는 지역 설정값이 전역 설정값을 덮어쓴다. 자세한 내용은 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/cors/CorsConfiguration.html#combine-org.springframework.web.cors.CorsConfiguration-" rel="nofollow" target="_blank">`CorsConfiguration#combine(CorsConfiguration)`</a>를 참고하라.

> 소스 코드에서 더 많은 정보를 얻거나 커스텀하고 싶다면 아래를 참조하라.
- `CorsConfiguration`
- `CorsProcessor`와 `DefaultCorsProcessor`
- `AbstractHandlerMapping`

<br>

## 1.7.3. @CrossOrigin
<a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/bind/annotation/CrossOrigin.html" rel="nofollow" target="_blank">`@CrossOrigin`</a> 어노테이션은 아래 예제와 같이 어노테이션 컨트롤러 메서드에서 cross-origin 요청을 가능하게 한다:

#### Java:
```java
@RestController
@RequestMapping("/account")
public class AccountController {

    @CrossOrigin
    @GetMapping("/{id}")
    public Mono<Account> retrieve(@PathVariable Long id) {
        // ...
    }

    @DeleteMapping("/{id}")
    public Mono<Void> remove(@PathVariable Long id) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@RestController
@RequestMapping("/account")
class AccountController {

    @CrossOrigin
    @GetMapping("/{id}")
    suspend fun retrieve(@PathVariable id: Long): Account {
        // ...
    }

    @DeleteMapping("/{id}")
    suspend fun remove(@PathVariable id: Long) {
        // ...
    }
}
```

기본적으로, `@CrossOrigin`은 다음을 허용한다.

- 모든 origin
- 모든 헤더
- 컨트롤러 메서드에 매핑된 모든 HTTP 메서드

`allowedCredentials`는 기본적으로 비활성화되어 있다. 이유는 민감한 유저 식별 정보(쿠키와 CSRF 토큰과 같은)를 노출하는 신뢰 수준을 설정하기 때문이다.
따라서 적절한 상황에서만 사용해야 한다.

`maxAge`는 30분으로 설정되어 있다.

`@CrossOrigin`은 클래스 수준에서도 지원되며 클래스에 적용한 경우 모든 메서드에서 상속된다. 아래 예제는 특정 도메인을 지정하고 `maxAge`를 1시간으로
설정한다:

#### Java:
```java
@CrossOrigin(origins = "https://domain2.com", maxAge = 3600)
@RestController
@RequestMapping("/account")
public class AccountController {

    @GetMapping("/{id}")
    public Mono<Account> retrieve(@PathVariable Long id) {
        // ...
    }

    @DeleteMapping("/{id}")
    public Mono<Void> remove(@PathVariable Long id) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@CrossOrigin("https://domain2.com", maxAge = 3600)
@RestController
@RequestMapping("/account")
class AccountController {

    @GetMapping("/{id}")
    suspend fun retrieve(@PathVariable id: Long): Account {
        // ...
    }

    @DeleteMapping("/{id}")
    suspend fun remove(@PathVariable id: Long) {
        // ...
    }
}
```

아래 예제처럼 `@CrossOrigin`을 클래스 레벨과 메서드 레벨 동시에 선언할 수도 있다.

#### Java:
```java
@CrossOrigin(maxAge = 3600) (1)
@RestController
@RequestMapping("/account")
public class AccountController {

    @CrossOrigin("https://domain2.com") (2)
    @GetMapping("/{id}")
    public Mono<Account> retrieve(@PathVariable Long id) {
        // ...
    }

    @DeleteMapping("/{id}")
    public Mono<Void> remove(@PathVariable Long id) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@CrossOrigin(maxAge = 3600) (1)
@RestController
@RequestMapping("/account")
class AccountController {

    @CrossOrigin("https://domain2.com") (2)
    @GetMapping("/{id}")
    suspend fun retrieve(@PathVariable id: Long): Account {
        // ...
    }

    @DeleteMapping("/{id}")
    suspend fun remove(@PathVariable id: Long) {
        // ...
    }
}
```

> (1) `@CrossOrigin`을 클래스 레벨에 사용한다.<br>
> (2) `@CrossOrigin`을 메서드 레벨에 사용한다.

<br>

## 1.7.4. 전역 설정(Global Configuration)
컨트롤러 메서드 레벨에 세분화하여 설정하는 것 대신에 전역으로 CORS 설정이 필요할 수도 있다. URL 기반 `CorsConfiguration` 매핑을 어떠한
어떤 `HandlerMapping`에든 개별적으로 설정할 수 있다. 하지만 대부분 애플리케이션은 웹플럭스 자바 설정을 사용하여 전역으로 설정한다.

전역 설정을 사용하면 다음을 기본적으로 허용한다.

- 모든 origin
- 모든 헤더
- `GET`, `HEAD` 그리고 `POST` 메서드

`allowedCredentials`는 기본적으로 비활성화되어 있다. 이유는 민감한 유저 식별 정보(쿠키와 CSRF 토큰과 같은)를 노출하는 신뢰 수준을 설정하기 때문이다.
따라서 적절한 상황에서만 사용해야 한다.

`maxAge`는 30분으로 설정되어 있다.

웹플럭스 자바 설정으로 CORS를 사용하려면 아래 예제와 같이 `CorsRegistry` 콜백을 사용한다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/api/**")
            .allowedOrigins("https://domain2.com")
            .allowedMethods("PUT", "DELETE")
            .allowedHeaders("header1", "header2", "header3")
            .exposedHeaders("header1", "header2")
            .allowCredentials(true).maxAge(3600);

        // Add more mappings...
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun addCorsMappings(registry: CorsRegistry) {

        registry.addMapping("/api/**")
                .allowedOrigins("https://domain2.com")
                .allowedMethods("PUT", "DELETE")
                .allowedHeaders("header1", "header2", "header3")
                .exposedHeaders("header1", "header2")
                .allowCredentials(true).maxAge(3600)

        // Add more mappings...
    }
}
```

<br>

## 1.7.5. CORS `WebFilter`
함수형 엔드포인트와 적합한 내장된 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/cors/reactive/CorsWebFilter.html" rel="nofollow" target="_blank">`CorsWebFilter`</a>를
통해 CORS 지원을 적용할 수 있다.

> Spring Security와 `CorsFilter`를 함께 사용하는 경우, Spring Security에는 <a href="https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#cors" rel="nofollow" target="_blank">내장형 지원</a> CORSdl 있는 것을 유념하라.

필터를 설정하기 위해 아래 예제와 같이 `CorsWebFilter` 빈을 선언하고 `CorsConfigurationSource`를 생성자에 전달한다:

#### Java:
```java
@Bean
CorsWebFilter corsFilter() {

    CorsConfiguration config = new CorsConfiguration();

    // Possibly...
    // config.applyPermitDefaultValues()

    config.setAllowCredentials(true);
    config.addAllowedOrigin("https://domain1.com");
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);

    return new CorsWebFilter(source);
}
```

#### Kotlin:
```kotlin
@Bean
fun corsFilter(): CorsWebFilter {

    val config = CorsConfiguration()

    // Possibly...
    // config.applyPermitDefaultValues()

    config.allowCredentials = true
    config.addAllowedOrigin("https://domain1.com")
    config.addAllowedHeader("*")
    config.addAllowedMethod("*")

    val source = UrlBasedCorsConfigurationSource().apply {
        registerCorsConfiguration("/**", config)
    }
    return CorsWebFilter(source)
}
```

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-web-security">다음글 "1.8. Web Security" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>