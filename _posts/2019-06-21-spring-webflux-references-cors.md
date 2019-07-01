---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.7. CORS"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.7. CORS"
category: Spring
date: "2019-06-21 23:02:23"
comments: true
---

# 1.7. CORS
스프링 웹플럭스는 CORS(Cross-Origin Resource Sharing)를 처리할 수 있다. 이 섹션은 그 방법을 설명한다.

## 1.7.1. 소개(Introduction)
보안상의 이유로 브라우저는 현재 Origin이 아닌 자원에 대한 AJAX 호출을 금지한다. 예를 들어, 브라우저의 한 탭에서 은행 계좌를 보고 있고 다른 탭에서는
evil.com에 접속했다고 가정해보자. evil.com 사이트에 있는 스크립트는 인증서 등을 사용해서 은행 API에 AJAX 요청을 할 수 없어야 한다. (계좌에서
돈을 인출한다거나)

CORS(Cross-Origin Resource Sharing)는 대부분의 브라우저에서 구현되는 W3C 스펙으로 IFRAME 또는 JSONP을 기반으로 하는 덜 안전한 방법이 아닌
어떤 종류의 크로스 도메인 요청을 허용할 것인지 설정할 수 있다.

## 1.7.2. 처리(Processing)
CORS 스펙은 예비(preflight), 단순(simple), 실제(actual) 요청으로 나뉜다. CORS의 동작 방식에 대해서는
<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">이 문서</a>를 읽거나 자세한 내용을 보려면
스펙 가이드를 참고하라.

스프링 웹플럭스 `HandlerMapping` 구현체는 내장형 CORS를 기본적으로 지원한다. 요청이 핸들러에 매핑한 후 `HandlerMapping`은 주어진 요청과
핸들러에 대한 CORS 설정을 확인하고 추가 조치를 수행한다. 예비(preflight) 요청은 직접 처리하고, 단순(simple)과 실제(actual) 요청은 인터셉트되고
검증하며, 필요한 CORS 응답 헤더를 설정한다.

크로스 오리진(cross-origin, Origin 헤더와 호스트가 다른 요청)을 사용하려면, 명시적으로 CORS 설정을 선언해야 한다. 매칭되는 CORS 설정이 없으면
예비(preflight) 요청은 거부되며, 단순(simple)과 실제(actual) 요청은 응답에 CORS 헤더가 추가되지 않으므로 브라우저에서 거부된다.

URL 패턴 기반 `CorsConfiguration` 매핑으로 각 `HandlerMapping`마다 설정할 수 있다. 대부분 애플리케이션은 웹플럭스 자바 설정을 사용하여
이러한 매핑을 선언하므로 모든 `HandlerMapping` 구현체에 공통으로 적용된다.

`HandlerMapping` 레벨에서의 전역 CORS 설정을 보다 세분화된 핸들러 레벨 CORS 설정과 결합할 수 있다. 예를 들어 어노테이션 컨트롤러는 클래스 또는
메서드 레벨의 `@CrossOrigin` 어노테이션을 사용할 수 있다. (다른 핸들러는 CorsConfigurationSource를 구현할 수 있다.)

글로벌 설정과 로컬 설정을 결합하는 규칙은 일반적으로 더해진다. (예를 들면, 모든 전역 설정과 지역 설정을 더한다) `allowCredentials`과 `maxAge`처럼
단일 값만을 허용할 수 있는 속성의 경우는 지역 설정값이 전역 설정값을 덮어쓴다. 자세한 내용은 `CorsConfiguration#combine(CorsConfiguration)`를
참고하라.

> 소스 코드에서 더 많은 정보를 얻거나 커스텀하고 싶다면 아래를 참조하라.
- `CorsConfiguration`
- `CorsProcessor`와 `DefaultCorsProcessor`
- `AbstractHandlerMapping`

---

> ### 목차 가이드
> - 다음글 "1.8. Web Security" 로 이동
> - <a href="/post/web-on-reactive-stack" target="_blank">전체 목차 페이지로 이동</a>