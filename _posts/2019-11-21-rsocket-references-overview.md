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

- 네트워크 경계를 가로지르는 <a href="https://www.reactive-streams.org/" rel="nofollow" target="_blank">리액티브 스트림</a> 시맨틱스 - `Request-Stream`과 `Channel` 같은 스트리밍 요청을 위해서, 백프레셔 신호는
요청자와 응답자 사이를 오가기 때문에 요청자가 응답자의 속도를 제어할 수 있다. 따라서 네트워크 계층의 혼잡 제어에 대한 의존을 줄이고
네트워크 레벨 또는 어떤 레벨에서든지 버퍼링의 필요성을 줄인다.
- 요청 조절(Request throttling) - 한 쪽에서 `LEASE` 프레임을 송신하면 지정된 시간동안 다른 쪽은 보낼 수 있는 요청이 제한된다.
이 기능은 "Leasing" 이라고 부른다. 이는 주기적으로 갱신된다.
- 세션 재개(Session resumption) - 커넥션이 끊어지더라도 일부 상태를 유지해준다. 애플리케이션에 명확하게 상태를 관리할 수 있으며,
백프레셔와 함께 사용하는 경우 생산자(producer)를 중단하고, 필요한 상태의 양을 줄일 수 있다.
- 큰 메시지의 단편화(fragmentation)와 재조립(re-assembly).
- Keepalive (heartbeats).

RSocket은 여러 언어로 구현되어 있다. <a href="https://github.com/rsocket/rsocket-java" rel="nofollow" target="_blank">자바 라이브러리</a>는
전송을 위한 <a href="https://projectreactor.io/" rel="nofollow" target="_blank">Project Reactor</a>와
<a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">Reactor Netty</a>를 기반으로 한다.
즉, 애플리케이션에서 리액티브 스트림 Publisher의 신호가 Roskcet을 통해 네트워크를 가로질러 투명하게 전파된다는 뜻이다.

<br>

## 5.1.1. 프로토콜(The Protocol)
RSocket의 장점 중 하나는 네트워크망에서의 동작이 잘 정의되어 있고 일부 프로토콜
<a href="https://github.com/rsocket/rsocket/tree/master/Extensions" rel="nofollow" target="_blank">확장(extensions)</a>과
함께 읽기 쉬운  <a href="https://rsocket.io/docs/Protocol" rel="nofollow" target="_blank">스펙(specification)</a>이라는 것이다.
따라서 언어 구현 및 상위 레벨 프레임워크 API와 상관없이 스펙사항을 읽어보는 것이 좋다. 이 섹션에서는 맥락을 정립하기 위한 간결한 개요를 제공한다.

### Connecting
초기에 클라이언트는 TCP 또는 웹소켓과 같은 저수준 스트리밍 전송을 통해 서버와 연결하고, 커넥션 파라미터 설정을 위해 `SETUP` 프레임을
서버로 전송한다.

서버는 `SETUP` 프레임을 거부할 수 있지만, 일반적으로 이 프레임을 전송(클라이언트가)하고 수신(서버가)했다면, 양쪽에서 요청을 시작할 수 있다.
하지만 `SETUP` 프레임이 요청 수를 제한하기 위해 leasing 시맨틱스를 사용했다면, 요청을 하기 위해 양쪽 모두에서는 다른 쪽이 `LEASE`
프레임을 보내 요청을 수락할 때까지 기다려야 한다.

### Making Requests
한 번 커넥션이 맺어지면, 양쪽은 `REQUEST_RESPONSE`, `REQUEST_STREAM`, `REQUEST_CHANNEL`, `REQUEST_FNF` 프레임 중 하나를
통해 요청을 시작할 수 있다. 각 프레임은 요청자로부터 응답자에게 메시지 하나를 전송한다.

응답자는 `PAYLOAD` 프레임을 응답 메시지와 함께 보내고, `REQUEST_CHANNEL` 요청인 경우, 요청자는 `PAYLOAD` 프레임과 함께 요청 메시지를
더 보낼 수 있다.

요청에 `Request-Stream`과 `Channel`과 같은 메시지 스트림에 포함된 경우, 응답자는 요청자가 보낸 요구 신호(Demand signals)를
준수해야 한다. 요구사항은 메시지 수로 표현된다. 초기 요구사항은 `REQUEST_STREAM`, `REQUEST_CHANNEL` 프레임에 지정한다.
후속 요구사항은 `REQUEST_N` 프레임을 통한다.

각 측은 `METADATA_PUSH` 프레임을 개별 요청이 아닌 전체 연결과 관련된 메타 데이터 알림을 전송할 수도 있다.

### Message Format
RSocket 메시지에는 데이터와 메타 데이터가 포함된다. 메타 데이터는 라우팅, 보안 토큰 등을 전송하는데 사용될 수 있다. 데이터와 메타 데이터는
다른 포맷을 사용한다. 각각에 대한 MIME 유형은 `SETUP` 프레임에 선언되어 지정된 커넥션의 모든 요청에 적용된다.

모든 메시지는 메타 데이터를 가질 수 있지만 일반적으로 라우팅과 같은 메타 데이터는 보통 요청 당 하나만 필요하므로, 요청의 첫 번째 메시지에만
포함시킨다. 예를 들어, `REQUEST_RESPONSE`, `REQUEST_STREAM`, `REQUEST_CHANNEL`, `REQUEST_FNF`.

프로토콜 확장은 애플리케이션에서 사용하기 위한 일반적인 공통 메타 데이터 포맷을 정의한다:

- <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/CompositeMetadata.md" rel="nofollow" target="_blank">Composite Metadata</a> - 다수의 독립적으로 포맷팅된 메타데이터 엔트리
- <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/Routing.md" rel="nofollow" target="_blank">Routing</a> - 요청에 대한 라우팅

<br>

## 5.1.2. 자바 구현(Java Implementation)
RSocket <a href="https://github.com/rsocket/rsocket-java" rel="nofollow" target="_blank">자바 구현체</a>
는<a href="https://projectreactor.io/" rel="nofollow" target="_blank">Project Reactor</a>를 기반으로 한다.
TCP와 웹소켓 전송은 <a href="https://github.com/reactor/reactor-netty" rel="nofollow" target="_blank">Reactor
Netty</a>를 기반으로 한다. 리액티브 스트림 라이브러리로서, 리액터는 프로토콜 구현 구현을 단순하게 한다.
애플리케이션에서는 선언적인(declarative) 연산자와 투명한 백프레셔 지원 기능을 갖춘 `Flux`와 `Mono`를 사용하는 것이 자연스럽다.

RSocket 자바 API는 의도적으로 최소적이고 기본적이다. API는 프로토콜 기능에만 중점을 두고 애플리케이션 프로그래밍 모델(예를 들어,
RPC codegen, 다른 코드 등)은 더 높은 수준의 독립된 관심사만 보면 된다.

구현체인 <a href="https://github.com/rsocket/rsocket-java/blob/master/rsocket-core/src/main/java/io/rsocket/RSocket.java" rel="nofollow" target="_blank">
io.rsocket.RSocket</a>의 주요 역할은 네 가지 상호동작 타입을 만드는 것이다. 단일 메시지는 `Mono`, 메시지 스트림은 `Flux`,
바이트 버퍼로 데이터와 메타 데이터에 접근하는 실제 메시지는 `io.rsocket.Payload`가 있다. `RSocket`의 역할은 대칭적으로 사용된다.
요청에 대해서는 애플리케이션에 요청을 위한 `RSocket`이 주어지고, 응답에 대해서는 `RSocket`을 구현하여 요청을 핸들링한다.

이것들은 완전한 소개가 아니다. 대부분 스프링 애플리케이션이 API를 직접 사용할 필요가 없다.
그러나 스프링과 독립적으로 RSocket을 보거나 테스트하는 것이 중요할 수 있다. RSocket 자바 저장소에는 API와 프로토콜 기능을 보여주는
많은 <a href="https://github.com/rsocket/rsocket-java/tree/master/rsocket-examples" rel="nofollow" target="_blank">샘플 앱</a>이 포함되어 있다.

<br>

## 5.1.3. 스프링 지원(Spring Support)
`spring-messaging` 모듈은 다음을 포함한다:

- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-requester" rel="nofollow" target="_blank">RSocketRequester</a> - `io.rsocket.RSocket`과 데이터,
메타 데이터와 인코딩/디코딩을 통해 요청을 생성하는 유연한 API
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-annot-responders" rel="nofollow" target="_blank">Annotated Responders</a> - 응답을 위한 `@RequestMapping` 어노테이션이 적용된 핸들러 메서드

`spring-web` 모듈에는 RSocket 애플리케이션이 필요할 수도 있는 Jackson, CBOR/JSON, Protobuf와 같은 `Encoder`와 `Decoder`
구현체가 포함되어 있다. 또한 효과적으로 라우팅 매칭을 하기 위한 `PathPatternParser`도 포함되어 있다.

스프링부트 2.2는 TCP나 웹소켓을 사용하여 RSocket 서버를 지원하고, 웹플럭스 서버에서 웹소켓을 통한 RSocket을 노출하는 옵션을 포함한다.
또한 `RSocketRequester.Builder`와 `RSocketStrategies`에 대한 클라이언트 지원 및 자동 설정도 있다. 자세한 내용은
스프링 부트 레퍼런스의 <a href="https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-rsocket">RSocket</a> 섹션을 참조하라.

스프링 시큐리티(Spring Security) 5.2는 RSocket을 지원한다.

스프링 Integration 5.2는 인바운드와 아웃바운드 게이트 웨이를 제공하여 RSocket 클라이언트와 서버와 상호작용한다. 자세한 내용은
Spring Integration Reference Manual을 참조하라.

스프링 클라우드 게이트웨이는(Spring Cloud Gateway)는 RSocket 커넥션을 지원한다.

---

> ### 목차 가이드
> - <a href="/post/rsocket-references-rsocketrequester">다음글 "5.2. RSocketRequester" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>