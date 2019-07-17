---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.10. HTTP 캐싱"
author:   Kimtaeng
tags: 	  spring webflux reactive
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

---

> ### 목차 가이드
> - 다음글 "1.11. WebFlux Config" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>