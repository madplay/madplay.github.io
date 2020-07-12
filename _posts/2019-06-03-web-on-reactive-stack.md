---
layout:   post
title:    "[Web on Reactive Stack] 레퍼런스 한글 번역"
author:   Kimtaeng
tags: 	  spring reactive
description: "한글로 번역한 레퍼런스 가이드, Web on Reactive Stack"
category: Spring
date: "2019-06-03 23:21:34"
comments: true
---

# 들어가기에 앞서
이번 글은 스프링 리액티브 레퍼런스인 "Web on Reactive Stack"를 번역한 내용을 다루고 있습니다. 내용에 오탈자나 오역이 있다면, 언제든지
<a href="https://github.com/madplay/madplay.github.io/issues" target="_blank" rel="nofollow">**이슈로 등록**</a> 또는
<a href="https://github.com/madplay/madplay.github.io/pulls" target="_blank" rel="nofollow">**직접 Pull Request**</a>
주시면 감사드립니다. 레퍼런스의 원본은 아래 링크를 참조하시면 됩니다.

- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html"
rel="nofollow" target="_blank" >참고 링크: Web on Reactive Stack</a>

<br>

# 목차
### <a href="/post/web-on-reactive-stack-spring-webflux">1. Spring WebFlux</a>
- <a href="/post/spring-webflux-references-overview">1.1. Overview</a>
- <a href="/post/spring-webflux-references-reactive-core">1.2. Reactive Core</a>
- <a href="/post/spring-webflux-references-dispatcherhandler">1.3. DispatcherHandler</a>
- <a href="/post/spring-webflux-references-annotated-controllers">1.4. Annotated Controllers</a>
- <a href="/post/spring-webflux-references-functional-endpoints">1.5. Functional Endpoints</a>
- <a href="/post/spring-webflux-references-url-links">1.6. URI Links</a>
- <a href="/post/spring-webflux-references-cors">1.7. CORS</a>
- <a href="/post/spring-webflux-references-web-security">1.8. Web Security</a>
- <a href="/post/spring-webflux-references-view-technologies">1.9. View Technologies</a>
- <a href="/post/spring-webflux-references-http-caching">1.10. HTTP Caching</a>
- <a href="/post/spring-webflux-references-webflux-config">1.11. WebFlux Config</a>
- <a href="/post/spring-webflux-references-http2">1.12. HTTP/2</a>

### <a href="/post/web-on-reactive-stack-webclient">2. WebClient</a>
- <a href="/post/webclient-references-configuration">2.1. Configuration</a>
- <a href="/post/webclient-references-retrieve">2.2. retrieve()</a>
- <a href="/post/webclient-references-exchange">2.3. exchange()</a>
- <a href="/post/webclient-references-request-body">2.4. Request Body</a>
- <a href="/post/webclient-references-client-filters">2.5. Client Filters</a>
- <a href="/post/webclient-references-synchronous-use">2.6. Synchronous Use</a>
- <a href="/post/webclient-references-testing">2.7. Testing</a>

### <a href="/post/web-on-reactive-stack-websockets">3. WebSockets</a>
- <a href="/post/websockets-references-introduction-to-websocket">3.1 Introduction to WebSocket</a>
- <a href="/post/websockets-references-websocket-api">3.2 WebSocket API</a>

### <a href="/post/web-on-reactive-stack-testing">4. Testing</a>

### <a href="/post/web-on-reactive-stack-rsocket">5. RSocket</a>
- <a href="/post/rsocket-references-overview">5.1. Overview</a>
- <a href="/post/rsocket-references-rsocketrequester">5.2. RSocketRequester</a>
- <a href="/post/rsocket-references-annotated-responders">5.3. Annotated Responders</a>
- <a href="/post/rsocket-references-metadataextractor">5.4. MetadataExtractor</a>

### <a href="/post/web-on-reactive-stack-reactive-libraries">6. Reactive Libraries</a>