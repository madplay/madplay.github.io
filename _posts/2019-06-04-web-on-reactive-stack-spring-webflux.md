---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux"
category: Spring
date: "2019-06-04 22:42:31"
comments: true
---

# 1. 스프링 웹플럭스(Spring Webflux)
스프링 프레임워크의 기존 웹 프레임워크인 스프링 웹 MVC는 서블릿(Servlet) API와 서블릿 컨테이너를 위한 목적으로 개발되었다. 
한편 리액티브 스택 웹 프레임워크인 스프링 웹 플럭스는 5.0 버전에 추가되었다. 이는 완전한 논 블로킹이며 리액티브 스트림 배압(Backpressure)을 지원하고
네티, 언더토우 그리고 서블릿 3.1 버전 이상 컨테이너와 같은 서버 등에서 실행된다.

두 프레임워크 모두 소스 모듈(스프링 웹 MVC와 스프링 웹플럭스)의 이름을 잘 반영하고 있으며 스프링 프레임워크에 나란히 존재한다.
각 모듈은 선택적이다. 애플리케이션은 하나 또는 다른 모듈을 사용하거나 경우에 따라서 둘 다 사용할 수 있다. (예를 들면 리액티브 `WebClient`가 있는
스프링 MVC 컨트롤러)

<br>

# 목차
번역이 완료된 문서는 링크가 생성됩니다.

- <a href="/post/spring-webflux-references-overview" target="_blank">1.1. Overview</a>
- <a href="/post/spring-webflux-references-reactive-core" target="_blank">1.2. Reactive Core</a>
- <a href="/post/spring-webflux-references-dispatcherhandler" target="_blank">1.3. DispatcherHandler</a>
- <a href="/post/spring-webflux-references-annotated-controllers" target="_blank">1.4. Annotated Controllers</a>
- 1.5. Functional Endpoints
- 1.6. URI Links
- 1.7. CORS
- 1.8. Web Security
- 1.9. View Technologies
- 1.10. HTTP Caching
- 1.11. WebFlux Config
- 1.12. HTTP/2

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack" target="_blank">전체 목차 페이지로 이동</a>