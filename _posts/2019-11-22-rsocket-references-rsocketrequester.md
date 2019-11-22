---
layout:   post
title:    "[Web on Reactive Stack] 5. RSocket: 5.2. RSocketRequester"
author:   Kimtaeng
tags: 	  spring reactive rsocket
description: "한글로 번역한 Web on Reactive Stack, 5. RSocket: 5.2. RSocketRequester"
category: Spring
date: "2019-11-22 22:53:22"
comments: true
---

# 5.2. RSocketRequester
`RSocketRequester`는 RSocket 요청을 처리하는 능숙한 API 제공하여, 하위 수준 데이터 버퍼 대신에 데이터와 메타 데이터에 대한 객체를
받고 반환한다. 클라이언트 요청과 서버 요청 둘다 작성하기 위해 `RSocketRequest`를 사용할 수 있다.

<br>

## 5.2.1. Client Requester
클라이언트 측에서 `RSocketRequester`를 얻으려면 서버에 커넥션을 요청하고 RSocket `SETUP` 프레임을 준비하여 전송해야 한다.
`RSocketRequester`는 이를 위한 빌더를 제공한다. 내부적으로 `io.rsocket.core.RSocketConnector`를 기반으로 한다.

아래는 디폴트 설정으로 커넥션을 맺는 가장 기본적인 방법이다:

#### Java:
```java
Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .connectTcp("localhost", 7000);

Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .connectWebSocket(URI.create("https://example.org:8080/rsocket"));
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.connectTcpAndAwait
import org.springframework.messaging.rsocket.connectWebSocketAndAwait

val requester = RSocketRequester.builder()
        .connectTcpAndAwait("localhost", 7000)

val requester = RSocketRequester.builder()
        .connectWebSocketAndAwait(URI.create("https://example.org:8080/rsocket"))
```

위 예제 코드는 바로 커넥션을 맺지 않고 연기한다. 실제로 커넥션을 맺고 requester를 사용하려면 다음을 수행하라:

#### Java:
```java
// Connect asynchronously
RSocketRequester.builder().connectTcp("localhost", 7000)
    .subscribe(requester -> {
        // ...
    });

// Or block
RSocketRequester requester = RSocketRequester.builder()
    .connectTcp("localhost", 7000)
    .block(Duration.ofSeconds(5));
```

#### Kotlin:
```kotlin
// Connect asynchronously
import org.springframework.messaging.rsocket.connectTcpAndAwait

class MyService {

    private var requester: RSocketRequester? = null

    private suspend fun requester() = requester ?:
        RSocketRequester.builder().connectTcpAndAwait("localhost", 7000).also { requester = it }

    suspend fun doSomething() = requester().route(...)
}

// Or block
import org.springframework.messaging.rsocket.connectTcpAndAwait

class MyService {

    private val requester = runBlocking {
        RSocketRequester.builder().connectTcpAndAwait("localhost", 7000)
    }

    suspend fun doSomething() = requester.route(...)
}
```

<br>

### 커넥션 설정(Connection Setup)
`RSocketRequester.Builder`는 초기 `SETUP` 프레임을 커스텀하기 위해 다음을 제공한다:

- `dataMimeType(MimeType)` - 커넥션을 통하는 데이터의 mime 타입 설정
- `metadataMimeType(MimeType)` - 커넥션을 통하는 메타 데이터의 mime 타입 설정
- `setupData(Object)` - `SETUP` 프레임에 포함할 데이터 설정
- `setupRoute(String, Object...)` - `SETUP` 프레임에 포함될 메타 데이터를 라우팅
- `setupMetadata(Object, MimeType)` - `SETUP` 프레임에 포함될 다른 메타데이터

데이터의 기본 mime 타입은 처음 설정된 `Decoder`로 결정된다. 메타 데이터의 경우 기본 mime 타입은 요청 당 메타 데이터와 mime 타입을
여러개 사용할 수 있는 <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/CompositeMetadata.md" rel="nofollow" target="_blank">
composite metadata</a>다. 일반적으로 둘 다 변경할 필요는 없다.

`SETUP` 프레임의 데이터와 메타 데이터는 선택사항이다. 서버 측에서 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-annot-connectmapping" rel="nofollow" target="_blank">
@ConnectionMapping</a> 메서드를 사용하여 커넥션의 시작과 `SETUP` 프레임의 컨텐츠를 처리한다. 메타 데이터는 커넥션 레벨 보안에
사용될 수 있다.

<br>

### 전략(Strategies)
`RSocketRequster.Builder`는 `RSocketStrategies`를 받아 requester를 설정한다. 이를 사용하여 데이터와 메타 데이터 값을
(역)직렬화할 인코더와 디코더를 제공한다. 기본적으로 `spring-core`에 있는 `String`, `byte[]`, `ByteBuffer`에 대한 코덱만
기본값으로 등록된다. `spring-web` 모듈을 사용하여 다음과 같은 코덱을 추가 등록할 수 있다:

#### Java:
```java
RSocketStrategies strategies = RSocketStrategies.builder()
    .encoders(encoders -> encoders.add(new Jackson2CborEncoder()))
    .decoders(decoders -> decoders.add(new Jackson2CborDecoder()))
    .build();

Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .rsocketStrategies(strategies)
    .connectTcp("localhost", 7000);
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.connectTcpAndAwait

val strategies = RSocketStrategies.builder()
        .encoders { it.add(Jackson2CborEncoder()) }
        .decoders { it.add(Jackson2CborDecoder()) }
        .build()

val requester = RSocketRequester.builder()
        .rsocketStrategies(strategies)
        .connectTcpAndAwait("localhost", 7000)
```

`RSocketStrategies`는 재사용이 고려되어 만들어졌다. 일부 시나리오에서는, 예를 들면 클라이언트와 서버가 같은 애플리케이션에 동작할 때,
`RSocketStrategies`를 스프링 설정에 선언하는 것이 더 나을 수 있다.

<br>

### 클라이언트 응답자(Client Responders)
`RSocketRequester.Builder`를 사용하여 서버의 요청에 대한 responder를 구성할 수 있다. 클라이언트 측의 응답에 어노테이션 핸들러를
사용할 수 있다. 서버에서 사용되는 것과 동일한 인프라를 기반으로 하지만, 다음과 같은 프로그래밍 방식으로 등록한다:

#### Java:
```java
RSocketStrategies strategies = RSocketStrategies.builder()
    .routeMatcher(new PathPatternRouteMatcher())  (1)
    .build();

SocketAcceptor responder =
    RSocketMessageHandler.responder(strategies, new ClientHandler()); (2)

Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .rsocketConnector(connector -> connector.acceptor(responder)) (3)
    .connectTcp("localhost", 7000);
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.connectTcpAndAwait

val strategies = RSocketStrategies.builder()
        .routeMatcher(PathPatternRouteMatcher())  
        .build()

val responder =
    RSocketMessageHandler.responder(strategies, new ClientHandler()); 

val requester = RSocketRequester.builder()
        .rsocketConnector { it.acceptor(responder) } 
        .connectTcpAndAwait("localhost", 7000)
```

> (1) `spring-web` 모듈이 존재하는 경우, 효과적인 라우팅 매칭을 위하여 `PathPatternRouteMatcher`를 사용한다.<br>
> (2) `@MessageMapping` 또는 `@ConnectMapping` 메서드를 포함하는 responder를 만든다.<br>
> (3) responder를 등록한다.

위의 내용은 클라이언트 responder를 프로그래밍 방식으로 등록하는 간단한 예제다. responder가 스프링 설정에 있는 다른 시나리오의 경우에는
다음과 같이 `RSocketMessageHandler`를 스프링 빈으로 선언한 후에 등록하면 된다:

#### Java:
```java
ApplicationContext context = ... ;
RSocketMessageHandler handler = context.getBean(RSocketMessageHandler.class);

Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .rsocketConnector(connector -> connector.acceptor(handler.responder()))
    .connectTcp("localhost", 7000);
```

#### Kotlin:
```kotlin
import org.springframework.beans.factory.getBean
import org.springframework.messaging.rsocket.connectTcpAndAwait

val context: ApplicationContext = ...
val handler = context.getBean<RSocketMessageHandler>()

val requester = RSocketRequester.builder()
        .rsocketConnector { it.acceptor(handler.responder()) }
        .connectTcpAndAwait("localhost", 7000)
```

위의 경우 `RSocketMessageHandler`의 `setHandlerPredicate`를 사용하여 클라이언트 responder를 감지하기 위한 다른 전략으로
전환해야 할 수도 있다. `@Controller`과 같은 기본 어노테이션 대신 `@RSocketClientResponder`와 같은 커스텀 어노테이션 사용을
예로 들 수 있다. 클라이언트와 서버 또는 여러 클라이언트가 같은 애플리케이션에서 동작하는 시나리오에서 이런 전략 전환이 필요하다.

프로그래밍 모델에 대한 자세한 내용은  <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-annot-responders" rel="nofollow" target="_blank">
Annotated Responders</a>를 참조하라.

<br>

### 고급(Advanced)
`RSocketRequesterBuilder`는 keepalive 간격, 세션 제개, 인터셉터 등을 위한 추가 설정 옵션을 위해
`io.rsocket.core.RSocketConnector` 콜백을 제공한다. 다음과 같이 해당 레벨에서 옵션을 설정할 수 있다:

#### Java:
```java
Mono<RSocketRequester> requesterMono = RSocketRequester.builder()
    .rsocketConnector(connector -> {
        // ...
    })
    .connectTcp("localhost", 7000);
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.connectTcpAndAwait

val requester = RSocketRequester.builder()
        .rsocketConnector {
            //...
        }.connectTcpAndAwait("localhost", 7000)
```

---

> ### 목차 가이드
> - 다음글 "5.3. Annotated Responders" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>