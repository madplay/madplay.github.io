---
layout:   post
title:    "[Web on Reactive Stack] 3. WebSockets: 3.1. Introduction to WebSocket"
author:   Kimtaeng
tags: 	  spring reactive websocket
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

<br>

## 3.1.1. HTTP vs 웹소켓(HTTP Versus WebSocket)
웹소켓이 HTTP와 호환 가능하도록 설계되었고, HTTP 요청으로 시작하더라도 두 프로토콜은 아키텍처나 애플리케이션 프로그래밍 모델이 매우
다르다는 것을 이해해야 한다.

HTTP와 REST에서 애플리케이션은 여러 URL을 모델링하여 갖는다. 애플리케이션과 상호 작용하기 위해서 클라이언트는 이 URL에 접근하여 요청/응답을
한다. 서버는 요청을 HTTP URL, 메서드 그리고 헤더를 기반으로 적절한 핸들러로 라우팅한다.

반대로 웹소켓에서는 일반적으로 초기 커넥션을 위한 URL이 하나만 있다. 결과적으로 모든 애플리케이션 메시지는 동일한 TCP 커넥션을 통해서 흐른다.
이것은 완전히 다른 비동기식, 이벤트 중심(event-driven)의 메시징 아키텍처다.

웹소켓은 HTTP와 다르게 메시지 내용에 대해 규정이 없는 저수준(low-level) 전송 프로토콜이다. 즉, 클라이언트와 서버가 메시지 관련 규정을
설계하지 않았다면, 메시지를 라우팅하거나 처리할 수 있는 방법이 없다.

웹소켓 클라이언트와 서버는 HTTP 핸드 셰이크 요청에 `Sec-WebSocket-Protocol` 헤더를 통해서 상위 수준의 메시징 프로토콜
(예를 들어, STOMP) 사용을 고려할 수도 있다. 그렇지 않으면, 자체적인 컨벤션을 규정해야 한다.

<br>

## 3.1.2. 웹소켓을 언제 사용할까(When to Use WebSockets)
웹소켓은 웹페이지를 동적이고 상호적으로 만들 수 있다. 그러나 많은 경우에 Ajax와 HTTP 스트리밍 또는 긴 폴링(polling)의 조합으로
더 간단하고 효과적으로 해결할 수 있다.

예를 들어 뉴스, 메일 그리고 소셜 피드는 동적으로 업데이트해야 하지만 몇 분마다 한 번씩 업데이트 하는 것만으로도 충분할 수 있다. 반면에 협업,
게임 그리고 금융 앱은 훨씬 더 실시간이어야 한다.

지연 시간(latency)만이 결정적인 요소는 아니다. 메시지 볼륨이 상대적으로 작다면(예를 들어, 네트워크 장애 모니터링) HTTP 스트리밍 또는
폴링이 더 효과적일 수 있다. 웹소켓을 사용하는 가장 적합한 경우는 짧은 지연 시간과 높은 빈도 그리고 높은 볼륨의 조합이다.

또한 인터넷을 벗어나 직접 제어할 수 없는 프록시의 제한이 웹소켓의 상호작용을 방해할 수 있음을 주의해야 한다. `Upgrade` 헤더를 통과하도록
설정하지 않았거나, 유휴(idle) 상태로 오래 지속되는 커넥션을 닫을 수도 있기 때문이다. 이는 방화벽 내부에서 애플리케이션에 웹소켓을 사용하는 것이
외부 공개된 애플리케이션을 사용하는 것보다 더 간단하다는 의미다. (그러니까, 신중히 사용하라)

---

> ### 목차 가이드
> - <a href="/post/websockets-references-websocket-api">다음글 "3.2. WebSocket API" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>