---
layout:   post
title:    "[Web on Reactive Stack] 5. RSocket: 5.1. Overview"
author:   Kimtaeng
tags: 	  spring reactive rsocket
description: "한글로 번역한 Web on Reactive Stack, 5. RSocket: 5.1. Overview"
category: Spring
date: "2019-11-21 21:02:47"
comments: true
---

# 5.1. 개요(Overview)
RSocket은 TCP, 웹소켓 그리고 기타 다른 바이트 스트림 전송을 통한 다중화된 양방향 통신을 위한 애플리케이션 프로토콜이다.
아래 중 하나를 상호작용 모델로 사용한다.

- `Request-Response` - 메시지 하나를 전송하고 하나의 응답을 받는다.
- `Request-Stream` - 메시지 하나를 전송하고 하나의 응답을 스트림으로 받는다.
- `Channel` - 양방향으로 메시지 스트림을 전송한다.
- `Fire-and-Forget` - 단방향 메시지를 전송한다.

커넥션이 맺어지면, "클라이언트"와 "서버" 라는 구분은 사라지고, 양쪽이 대칭이 되어 각각이 위의 상호작용 모델 중 하나를 시작할 수 있다.
따라서 프로토콜에서 참여하는 양쪽을 "요청자(requester)"와 "응답자(responder)" 라고 부르며, 상호 작용 모델은
"요청 스트림(request streams)" 또는 간단히 "요청(requests)" 이라고 부른다.

다음은 RSocket 프로토콜의 주요 기능과 이점이다:

- 네트워크 경계를 가로지르는 리액티브 스트림 시맨틱스 - `Request-Stream`과 `Channel` 같은 스트리밍 요청을 위해서, 백프레셔 신호는
요청자와 응답자 사이를 오가기 때문에 요청자가 응답자의 속도를 제어할 수 있다. 따라서 네트워크 계층의 혼잡 제어에 대한 의존을 줄이고
네트워크 레벨 또는 어떤 레벨에서든지 버퍼링의 필요성을 줄인다.

- 요청 조절(Request throttling) - 한 쪽에서 `LEASE` 프레임을 송신하면 지정된 시간동안 다른 쪽은 보낼 수 있는 요청이 제한된다.
이 기능은 "Leasing" 이라고 부른다. 이는 주기적으로 갱신된다.

- 세션 재개(Session resumption) - 커넥션이 끊어지더라도 일부 상태를 유지해준다. 애플리케이션에 명확하게 상태를 관리할 수 있으며,
백프레셔와 함께 사용하는 경우 생산자(producer)를 중단하고, 필요한 상태의 양을 줄일 수 있다.

- 큰 메시지의 단편화(fragmentation)와 재조립(re-assembly).

- Keepalive (heartbeats).

RSocket은 여러 언어로 구현되어 있다. <a href="https://github.com/rsocket/rsocket-java" rel="nofollow" target="_blank">자바 라이브러리</a>
는 전송을 위한 <a href="https://projectreactor.io/" rel="nofollow" target="_blank">Project Reactor</a>와
<a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">Reactor Netty</a>를 기반으로 한다.
즉, 애플리케이션에서 리액티브 스트림 Publisher의 신호가 Roskcet을 통해 네트워크를 가로질러 투명하게 전파된다는 뜻이다.

---

> ### 목차 가이드
> - 다음글 "5.2. RSocketRequester" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>