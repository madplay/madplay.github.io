---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient"
author:   Kimtaeng
tags: 	  spring rective webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient"
category: Spring
date: "2019-08-29 00:53:22"
comments: true
---

# 2. WebClient
스프링 웹플럭스는 리액티브, 논 블로킹 HTTP 요청을 위한 `WebClient`를 갖고 있다. 웹클라이언트는 선언적(declarative) 구성을 위해
리액티브 타입을 사용하는 함수형 API를 가지고 있다. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-libraries" rel="nofollow" target="_blank">리액티브 라이브러리</a>를 참조하라.
웹플럭스 클라이언트와 서버는 동일한 논 블로킹 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">코덱(codecs)</a>을
사용하여 요청과 응답 내용을 인코딩하고 디코딩한다.

내부적으로 `WebClient`는 HTTP 클라이언트 라이브러리에 처리를 위임한다. 기본적으로 <a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">Reactor Netty</a>를
사용하고 제티 <a href="https://github.com/jetty-project/jetty-reactive-httpclient" rel="nofollow" target="_blank">리액티브 HttpClient</a>를
내장형으로 제공하며, `ClientHttpConnector`를 통해서 다른 라이브러리도 연결할 수 있다.

<br>

# 목차
- <a href="/post/webclient-references-configuration">2.1. Configuration</a>
- <a href="/post/webclient-references-retrieve">2.2. retrieve()</a>
- <a href="/post/webclient-references-exchange">2.3. exchange()</a>
- <a href="/post/webclient-references-request-body">2.4. Request Body</a>
- <a href="/post/webclient-references-client-filters">2.5. Client Filters</a>
- <a href="/post/webclient-references-synchronous-use">2.6. Synchronous Use</a>
- <a href="/post/webclient-references-testing">2.7. Testing</a>

<br>

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-websockets">다음장 "3. WebSockets"으로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>