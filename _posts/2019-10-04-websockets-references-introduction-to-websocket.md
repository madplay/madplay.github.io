---
layout:   post
title:    "[Web on Reactive Stack] 3. WebSockets: 3.1. 웹소켓 소개"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 3. WebSockets: 3.1. Introduction to WebSocket"
category: Spring
date: "2019-10-04 23:41:53"
comments: true
---

# 3.1. 웹소켓 소개(Introduction to WebSocket)
웹소켓 프로토콜(<a href="https://tools.ietf.org/html/rfc6455" target="_blank" rel="nofollow">RFC 6455</a>)는
단일 TCP 커넥션으로 클라이언트와 서버 사이의 양방향 통신 채널을 설정하는 표준화된 방법을 제공한다. HTTP와 다른 TCP 프로토콜이지만
포트번호 80과 443를 사용하고 기존 방화벽 정책을 재사용할 수 있도록 HTTP를 통해 동작하도록 설계되었다.

웹소켓 상호 작용은 HTTP 요청을 HTTP `Upgrade` 헤더를 사용하여 업그레이드하는 것으로 시작된다. 그러면 웹소켓 프로토콜로 전환할 수 있다.
다음은 이러한 상호작용을 보여주는 예제다:

```yaml
GET /spring-websocket-portfolio/portfolio HTTP/1.1
Host: localhost:8080
Upgrade: websocket (1)
Connection: Upgrade (2)
Sec-WebSocket-Key: Uc9l9TMkWGbHFD2qnFHltg==
Sec-WebSocket-Protocol: v10.stomp, v11.stomp
Sec-WebSocket-Version: 13
Origin: http://localhost:8080
```

> (1) `Upgrade` 헤더 (2) `Upgrade` 커넥션 사용

보통의 200 상태코드 대신에, 웹소켓 서버는 아래와 비슷한 아웃풋을 반환한다.

```yaml
HTTP/1.1 101 Switching Protocols (1)
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: 1qVdfYHU9hPOl4JYYNXF623Gzn0=
Sec-WebSocket-Protocol: v10.stomp
```

> (1) 프로토콜 전환(switch)

핸드셰이크(handshake)에 성공한 후에 HTTP 업그레이드 요청의 기반한 TCP 소켓은 서버 열려 있기 떄문에 클라이언트와 서버 모두가
계속 메시지를 주고 받을 수 있다.

웹소켓의 동작 방식을 모두 소개하기에는 이 문서 범위를 벗어난다. RFC 6455, HTML5의 웹소켓 챕터 또는 웹에 있는 많은 소개와 튜토리얼을
참고하라.

웹소켓 서버가 웹 서버(예를 들어, nginx) 뒤에서 실행중인 경우 웹소켓 업그레이드 요청을 웹소켓 서버로 전달하도록 서버 설정이 필요하다.
마찬가지로, 애플리케이션이 클라우드 환경에서 실행되는 경우에는 웹소켓 지원과 관련된 클라이두 제공자의 지시 사항을 확인하라.


---

> ### 목차 가이드
> - 다음글 "3.2. WebSocket API" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>