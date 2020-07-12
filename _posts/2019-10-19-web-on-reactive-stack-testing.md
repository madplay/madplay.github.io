---
layout:   post
title:    "[Web on Reactive Stack] 4. Testing"
author:   Kimtaeng
tags: 	  spring reactive
description: "한글로 번역한 Web on Reactive Stack, 4. Testing"
category: Spring
date: "2019-10-19 02:34:10"
comments: true
---

# 4. Testing
> <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#testing" target="_blank" rel="nofollow">
서블릿 스택과 동일하다.</a>

`spring-test` 모듈은 `ServerHttpRequest`, `ServerHttpResponse`, `ServerWebExchange`의 mock 구현체를 제공한다.
mock 객체에 대해서는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/testing.html#mock-objects-web-reactive" rel="nofollow" target="_blank">스프링 웹 리액티브(Spring Web Reactive)</a>
를 참고하라.

<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/testing.html#webtestclient" rel="nofollow" target="_blank">`WebTestClient`</a>는
이 mock 요청(request)과 응답(response) 객체를 기반으로 HTTP 서버없이 웹플럭스 애플리케이션을 테스트할 수 있도록 지원한다.
End-to-End 통합 테스트에도 `WebTestClient`를 사용할 수 있다.

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-rsocket">다음장 "5. RSocket"으로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>