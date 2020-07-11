---
layout:   post
title:    "[Web on Reactive Stack] 3. WebSockets: 3.2. 웹소켓 API(WebSocket API)"
author:   Kimtaeng
tags: 	  spring reactive websocket
description: "한글로 번역한 Web on Reactive Stack, 3. WebSockets: 3.2. WebSocket API"
category: Spring
date: "2019-10-15 00:12:21"
comments: true
---

# 3.2. 웹소켓 API(WebSocket API)
스프링 프레임워크는 웹소켓 메시지를 핸들링하는 클라이언트와 서버 사이드 애플리케이션을 작성하는데 사용할 수 있는 웹소켓 API를 제공한다.

<br>

## 3.2.1. 서버(Server)
웹소켓 서버를 작성하려면, 먼저 `WebSocketHandler`를 작성해야 한다. 다음 예제는 이를 생성하는 방법이다:

#### Java:
```java
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;

public class MyWebSocketHandler implements WebSocketHandler {

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
import org.springframework.web.reactive.socket.WebSocketHandler
import org.springframework.web.reactive.socket.WebSocketSession

class MyWebSocketHandler : WebSocketHandler {

    override fun handle(session: WebSocketSession): Mono<Void> {
        // ...
    }
}
```

그 다음에는 핸들러를 URL에 맵핑하고 `WebSocketHandlerAdapter`를 추가한다. 다음 예제를 참조하라:

#### Java:
```java
@Configuration
class WebConfig {

    @Bean
    public HandlerMapping handlerMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/path", new MyWebSocketHandler());
        int order = -1; // before annotated controllers

        return new SimpleUrlHandlerMapping(map, order);
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }
}
```

#### Kotlin:
```kotlin
@Configuration
class WebConfig {

    @Bean
    fun handlerMapping(): HandlerMapping {
        val map = mapOf("/path" to MyWebSocketHandler())
        val order = -1 // before annotated controllers

        return SimpleUrlHandlerMapping(map, order)
    }

    @Bean
    fun handlerAdapter() =  WebSocketHandlerAdapter()
}
```

<br>

## 3.2.2. `WebSocketHandler`
`WebSocketHandler`의 `handle` 메서드는 `WebSocketSession`을 받아서 세션 처리가 완료된 것을 나타내기 위해 `Mono<Void>`를
반환한다. 세션은 두 개의 스트림을 통해 처리되는데, 각각 인바운드 메시지와 아웃바운드 메시지를 위한 것이다. 다음 표는 스트림을 처리하는 두 가지
메서드에 대해서 설명한다:

`WebSocketSession` 메서드 | 설명
---|---
`Flux<WebSocketMessage> receive()` | 인바운드 메시지 스트림에 접근하고 커넥션이 닫힐 때 완료된다.
`Mono<Void> send(Publisher<WebSocketMessage>)` | 전송할 메시지를 받아 메시지를 작성하고, 소스가 완료되고 메시지 작성이 끝날 때, `Mono<Void>`를 반환한다.

`WebSocketHandler`는 인바운드와 아운바운드 스트림을 하나로 통합한 플로우로 구성하고, 이 플로우의 완료를 나타내는 `Mono<Void>`를
리턴해야 한다. 애플리케이션 요구 사항에 따라서 통합된 플로우는 다음과 같은 상황에서 완료된다:

- 인바운드 또는 아웃바운드 메시지 스트림이 완료됐을 때
- 인바운드 스트림이 완료되고(즉, 커넥션이 닫혔을 때), 아웃바운드 스트림이 무한 스트림일 때
- 선택된 시점에서, `WebSocketSession`의 `close` 메서드를 통해서

인바운드와 아웃바인드 메시지 스트림이 함께 구성된 경우, 커넥션이 열려있는지 확ㅇ니할 필요가 없다. 리액티브 스트림 시그널이 활동을 종료하기
때문이다. 인바운드 스트림은 완료 또는 오류 신호를 수신하고 아웃바운드 스트림은 취소 신호를 수신한다.

핸들러의 가장 기본적인 구현체는 인바운드 스트림을 처리하는 것이다. 다음 예제는 이를 보여준다:

#### Java:
```java
class ExampleHandler implements WebSocketHandler {

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        return session.receive()            (1)
                .doOnNext(message -> {
                    // ...                  (2)
                })
                .concatMap(message -> {
                    // ...                  (3)
                })
                .then();                    (4)
    }
}
```

#### Kotlin:
```kotlin
class ExampleHandler : WebSocketHandler {

    override fun handle(session: WebSocketSession): Mono<Void> {
        return session.receive()            (1)
                .doOnNext {
                    // ...                  (2)
                }
                .concatMap {
                    // ...                  (3)
                }
                .then()                     (4)
    }
}
```

> (1) 인바운드 메시지 스트림에 접근한다.<br>
> (2) 각 메시지에 대한 처리를 수행한다.<br>
> (3) 메시지 콘텐츠를 사용하는 중첩된 비동기 작업을 수행한다.<br>
> (4) 수신이 완료되면 `Mono<Void>`를 반환한다.

> 중첩된 비동기 작업의 경우, 풀링된 데이터 버퍼(pooled data buffers)를 사용하는 서버(예를 들면, Netty)에서 `message.retain()`을
호출해야 할 수 있다. 그렇지 않으면 데이터를 읽기 전에 버퍼가 비워질 수 있다. 자세한 내용은 
<a target="_blank" rel="nofollow" href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers">
데이터 버퍼와 코덱(Data Buffers and Codecs)</a>을 참고하라.

다음은 인바운드와 아웃바운드 스트림을 결합한다:

#### Java:
```java
class ExampleHandler implements WebSocketHandler {

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        Flux<WebSocketMessage> output = session.receive()               (1)
                .doOnNext(message -> {
                    // ...
                })
                .concatMap(message -> {
                    // ...
                })
                .map(value -> session.textMessage("Echo " + value));    (2)

        return session.send(output);                                    (3)
    }
}
```

#### Kotlin:
```kotlin
class ExampleHandler : WebSocketHandler {

    override fun handle(session: WebSocketSession): Mono<Void> {

        val output = session.receive()                      (1)
                .doOnNext {
                    // ...
                }
                .concatMap {
                    // ...
                }
                .map { session.textMessage("Echo $it") }    (2)

        return session.send(output)                         (3)
    }
}
```

> (1) 인바운드 메시지 스트림을 처리한다.<br>
> (2) 아웃바운드 메시지를 생성하고 결합된 플로우를 만든다.<br>
> (3) 수신하는 동안에는 처리가 완료하지 않는 `Mono<Void>`를 반환한다.<br>

인바운드와 아웃바운드 스트림은 독립적일 수 있으며, 완료시에만 결합될 수 있다. 다음은 그 예제다:

#### Java:
```java
class ExampleHandler implements WebSocketHandler {

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        Mono<Void> input = session.receive()                                (1)
                .doOnNext(message -> {
                    // ...
                })
                .concatMap(message -> {
                    // ...
                })
                .then();

        Flux<String> source = ... ;
        Mono<Void> output = session.send(source.map(session::textMessage)); (2)

        return Mono.zip(input, output).then();                              (3)
    }
}
```

#### Kotlin:
```kotlin
class ExampleHandler : WebSocketHandler {

    override fun handle(session: WebSocketSession): Mono<Void> {

        val input = session.receive()                                   
                .doOnNext {
                    // ...
                }
                .concatMap {
                    // ...
                }
                .then()

        val source: Flux<String> = ...
        val output = session.send(source.map(session::textMessage))     

        return Mono.zip(input, output).then()                           
    }
}
```

> (1) 인바운드 메시지 스트림을 처리한다.<br>
> (2) 발신 메시지를 전송한다.<br>
> (3) 스트림을 결합하고 두 스트림이 모두 끝나면 종료하는 `Mono<Void>`를 반환한다.

<br>

## 3.2.3. `DataBuffer`
`DataBuffer`는 웹플럭스의 바이트 버퍼다. 관련해서는 스프링 코어 레퍼런스의
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#databuffers" target="_blank" rel="nofollow">데이터 버퍼와 코덱(Data Buffers and Codecs)</a> 섹션에서 더 자세히 설명한다.
중요한 점은 네티(Netty)와 같은 일부 서버에서는 바이트 버퍼를 메모리 풀을 사용하여 처리하고 참조를 카운트하기 때문에 메모리 누수를
피하려면 소비(consume)한 다음에는 메모리를 해제해야 한다는 것이다.

네티에서 애플리케이션을 실행하는 경우, 입력 데이터 버퍼가 해제되지 않고 유지해야 한다면 `DataBufferUtils.retain(dataBuffer)`를
사용하고, 버퍼에 있는 데이터를 소비했다면 `DataBufferUtils.release(dataBuffer)`를 호출해야 한다.

<br>

## 3.2.4. Handshake
`WebSocketHandlerAdapter`는 `WebSocketService`에 처리를 위임한다. 기본 구현체 `HandshakeWebSocketService`는
웹소켓 요청에 대한 기본적인 검사를 한 다음에 구동중인 서버에 대해서 `RequestUpgradeStrategy`를 사용한다.
현재 리액터 네티(Reactor Netty), 톰캣(Tomcat), 제티(Jetty) 그리고 언더토우(Undertow)를 기본적으로 지원한다.

`HandshakeWebSocketService`는 `sessionAttributePredicate` 속성을 가지고 있으며, `Predicate<String>`를 설정하여
`WebSession`으로부터 속성을 추출하고 `WebSocketSession`의 속성으로 입력한다.

<br>

## 3.2.5. 서버 설정(Server Configuration)
각 서버의 `RequestUpgradeStrategy` 구현체를 이용하여 웹소켓 엔진 관련한 웹소켓 관련 설정을 할 수 있다. 다음 예제는 톰캣에서 실행되는
웹소켓 옵션을 설정한다:

#### Java:
```java
@Configuration
class WebConfig {

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter(webSocketService());
    }

    @Bean
    public WebSocketService webSocketService() {
        TomcatRequestUpgradeStrategy strategy = new TomcatRequestUpgradeStrategy();
        strategy.setMaxSessionIdleTimeout(0L);
        return new HandshakeWebSocketService(strategy);
    }
}
```

#### Kotlin:
```kotlin
@Configuration
class WebConfig {

    @Bean
    fun handlerAdapter() =
            WebSocketHandlerAdapter(webSocketService())

    @Bean
    fun webSocketService(): WebSocketService {
        val strategy = TomcatRequestUpgradeStrategy().apply {
            setMaxSessionIdleTimeout(0L)
        }
        return HandshakeWebSocketService(strategy)
    }
}
```

사용 가능한 옵션을 확인하려면 서버의 업그레이드 전략(upgrade strategy)을 확인하라. 현재 톰캣과 제티만이 이 옵션을 제공한다.

<br>

## 3.2.6. CORS
CORS를 설정하고 웹소켓 엔드포인트로의 접근을 제한하는 가장 간단한 방법은 `WebSocketHandler`가 `CorsConfigurationSource`를
구현하여 허용할 origin, 헤더 그리고 다른 상세 설정등을 가진 `CorsConfiguration`을 반환하는 것이다. 만일 이렇게 할 수 없다면,
`SimpleUrlHandler`의 `corsConfigurations` 속성에 URL 패턴 별로 CORS 설정을 넣을 수 있다. 만일 두 방법 모두 사용한다면,
`CorsConfiguration`의 `comine` 메서드에서 두 설정은 결합된다.

<br>

## 3.2.7. 클라이언트(Client)
스프링 웹플럭스는 리액터 네티(Reactor Netty), 톰캣(Tomcat), 제티(Jetty), 언더토우(Undertow) 그리고 표준 자바(JSR-356)에
대한 구현체로 `WebSocketClient` 인터페이스를 제공한다.

웹소켓 세션을 시작하기 위해 클라이언트의 인스턴스를 생성하고 해당 `execute` 메서드를 사용한다.

#### Java:
```java
WebSocketClient client = new ReactorNettyWebSocketClient();

URI url = new URI("ws://localhost:8080/path");
client.execute(url, session ->
        session.receive()
                .doOnNext(System.out::println)
                .then());
```

#### Kotlin:
```kotlin
val client = ReactorNettyWebSocketClient()

        val url = URI("ws://localhost:8080/path")
        client.execute(url) { session ->
            session.receive()
                    .doOnNext(::println)
            .then()
        }
```

제티(Jetty)와 같은 `LifeCycle` 인터페이스를 구현하는 일부 클라이언트는 사용하기 전에 중지하고 시작해야 한다. 모든 클라이언트는 기본적으로
기본 웹소켓 클라이언트의 설정과 관련된 생성자 옵션이 있다.

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-testing">다음장 "4. Testing" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>