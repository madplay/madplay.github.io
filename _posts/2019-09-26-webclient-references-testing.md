---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.7. Testing"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.7. Testing"
category: Spring
date: "2019-09-26 22:01:53"
comments: true
---

# 2.7. Testing
`WebClient`를 사용하는 코드를 테스트하기 위해 <a href="https://github.com/square/okhttp#mockwebserver" rel="nofollow" target="_blank">OkHttpMockWebServer</a>와
같은 목 웹서버를 사용할 수 있다. 사용 예제를 보려면 스프링 프레임워크 테스트 코드의 <a href="https://github.com/spring-projects/spring-framework/blob/master/spring-webflux/src/test/java/org/springframework/web/reactive/function/client/WebClientIntegrationTests.java" rel="nofollow" target="_blank">`WebClientIntegrationTests`</a> 또는
OkHttp 저장소의 <a href="https://github.com/square/okhttp/tree/master/samples/static-server" rel="nofollow" target="_blank">`static-server`</a> 예제를 확인하라.

<div class="post_comments">[역주] 레퍼런스 원문에 있는 테스트 관련 참조 링크를 아래와 같이 정리합니다.</div>

<br>

- <a href="https://github.com/spring-projects/spring-framework/blob/master/spring-webflux/src/test/java/org/springframework/web/reactive/function/client/WebClientIntegrationTests.java" target="_blank" rel="nofollow">참조 링크: 스프링 프레임워크의 WebClientIntegrationTests</a>
- <a href="https://github.com/square/okhttp#mockwebserver" rel="nofollow" target="_blank">참조 링크: 목 웹서버 OkHttpMockWebServer</a>
- <a href="https://github.com/square/okhttp/tree/master/samples/static-server" target="_blank" rel="nofollow">참조 링크: OkHttp 저장소의 static-server</a>

<br>

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-websockets">다음장 "3. WebSockets" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>