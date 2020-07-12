---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.8. Web Security"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.8. Web Security"
category: Spring
date: "2019-06-28 21:52:19"
comments: true
---

# 1.8. Web Security
<a href="https://spring.io/projects/spring-security" target="_blank" rel="nofollow">Spring Security</a> 프로젝트는
악의적인 행위(exploit)으로부터 웹 애플리케이션을 보호하는 방법을 제공한다. 다음을 포함한 Spring Security 레퍼런스 가이드를 참고하라.

- <a href="https://docs.spring.io/spring-security/site/docs/current/reference/html5/#jc-webflux" target="_blank" rel="nofollow">WebFlux Security</a>
- <a href="https://docs.spring.io/spring-security/site/docs/current/reference/html5/#test-webflux" target="_blank" rel="nofollow">WebFlux Testing Support</a>
- <a href="https://docs.spring.io/spring-security/site/docs/current/reference/html5/#csrf" target="_blank" rel="nofollow">CSRF Protection</a>
- <a href="https://docs.spring.io/spring-security/site/docs/current/reference/html5/#headers" target="_blank" rel="nofollow">Security Response Headers</a>

<div class="post_comments">[역주] 레퍼런스 원문에는 링크만 게시되어 있어, 첫 번째 링크의 내용을 번역하여 첨부합니다.</div>

<br>

# 23. WebFlux Security
Spring Security의 웹플럭스 지원은 `WebFilter`에 의존하며 Spring Webflux와 Spring WebFlux.Fn.에 대해 동일하게 동작한다.
아래는 몇 가지 샘플 예제 코드다:

- Hello WebFlux <a href="https://github.com/spring-projects/spring-security/tree/5.3.3.RELEASE/samples/boot/hellowebflux" target="_blank" rel="nofollow">hellowebflux</a>
- Hello WebFlux.Fn <a href="https://github.com/spring-projects/spring-security/tree/5.3.3.RELEASE/samples/boot/hellowebfluxfn" target="_blank" rel="nofollow">hellowebfluxfn</a>
- Hello WebFlux Method <a href="https://github.com/spring-projects/spring-security/tree/5.3.3.RELEASE/samples/boot/hellowebflux-method" target="_blank" rel="nofollow">hellowebflux-method</a>

<br>

## 23.1. 최소한의 WebFlux Security 설정(Minimal WebFlux Security Configuration)
아래 예제는 최소로 설정한 WebFlux Security 설정이다.

```java
@EnableWebFluxSecurity
public class HelloWebfluxSecurityConfig {

    @Bean
    public MapReactiveUserDetailsService userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
            .username("user")
            .password("user")
            .roles("USER")
            .build();
        return new MapReactiveUserDetailsService(user);
    }
}
```

이 설정은 폼과 HTTP 기본 인증, 인증된 사용자가 페이지에 접근하도록 요구하는 권한 설정, 기본 로그인 페이지와 로그아웃 페이지 설정,
보안 관련 HTTP 헤더 설정, CSRF로부터의 보호 등을 설정한다.

<br>

## 23.2. 명시적인 WebFlux Security 설정
아래는 명시적으로 선언한 설정이다.

```java
@Configuration
@EnableWebFluxSecurity
public class HelloWebfluxSecurityConfig {

    @Bean
    public MapReactiveUserDetailsService userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
            .username("user")
            .password("user")
            .roles("USER")
            .build();
        return new MapReactiveUserDetailsService(user);
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange(exchanges -> exchanges
                .anyExchange().authenticated()
            )
            .httpBasic(withDefaults())
            .formLogin(withDefaults());
        return http.build();
    }
}
```

이 버전은 위의 설정과 동일한 내용을 명시적으로 설정한 것이다. 여기서는 기본값을 쉽게 변경할 수 있다.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-view-technologies">다음글 "1.9. View Technologies" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>