---
layout:   post
title:    "[Web on Reactive Stack] 5. RSocket: 5.3. Annotated Responders"
author:   Kimtaeng
tags: 	  spring reactive rsocket
description: "한글로 번역한 Web on Reactive Stack, 5. RSocket: 5.3. Annotated Responders"
category: Spring
date: "2019-11-25 23:43:29"
comments: true
---

# 5.3. Annotated Responders
RSocket 응답자는 `@MessageMapping`과 `@ConnectMapping` 메서드로 구현할 수 있다. `@MessageMapping` 메서드는 각 요청을
처리하고 `@ConnectMapping` 메서드는 커넥션 레벨 이벤트(설정과 메타 데이터 푸시)를 처리한다. 어노테이션 달린 응답자(annotated
responder)는 서버 측에서 응답하고 클라이언트 측에서 응답하기 위해 대칭적으로 모두 지원한다.

<br>

## 5.3.1. Server Responders
서버 측에서 어노테이션 달린 응답자(annotated responder)를 사용하려면 `RSocketMessageHandler`를 스프링 설정에 추가하여
`@Controller` 빈과 `@MessageMapping` 및 `@ConnectMapping` 메서드를 감지하도록 한다.

#### Java:
```java
@Configuration
static class ServerConfig {

    @Bean
    public RSocketMessageHandler rsocketMessageHandler() {
        RSocketMessageHandler handler = new RSocketMessageHandler();
        handler.routeMatcher(new PathPatternRouteMatcher());
        return handler;
    }
}
```

#### Kotlin:
```kotlin
@Configuration
class ServerConfig {

    @Bean
    fun rsocketMessageHandler() = RSocketMessageHandler().apply {
        routeMatcher = PathPatternRouteMatcher()
    }
}
```

다음으로 자바 RSocket API를 통해 RSocket 서버를 시작하고 다음과 같이 responder에 대한 `RSocketMessageHandler`를 연결한다:

#### Java:
```java
ApplicationContext context = ... ;
RSocketMessageHandler handler = context.getBean(RSocketMessageHandler.class);

CloseableChannel server =
    RSocketServer.create(handler.responder())
        .bind(TcpServerTransport.create("localhost", 7000))
        .block();
```

#### Kotlin:
```kotlin
import org.springframework.beans.factory.getBean

val context: ApplicationContext = ...
val handler = context.getBean<RSocketMessageHandler>()

val server = RSocketServer.create(handler.responder())
        .bind(TcpServerTransport.create("localhost", 7000))
        .awaitFirst()
```

`RSocketMessageHandler`는 메타데이터 <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/CompositeMetadata.md" rel="nofollow" target="_blank">
composite</a>와 <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/Routing.md" rel="nofollow" target="_blank">routing</a>을 기본적으로 지원한다. 다른 mime 타입으로 바꾸거나 다른 메타 데이터 mime 타입을
등록하려면 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-metadata-extractor" rel="nofollow" target="_blank">
MetadataExtractor</a>을 설정할 수 있다.

메타 데이터와 데이터 포맷을 지원하는데 필요한 `Encoder`와 `Decoder` 인스턴스를 설정해야 한다. 코덱 구현을 위해서는 `spring-web`
모듈이 필요할 수 있다.

기본적으로 `SimpleRouteMatcher`는 `AntPathMatcher`를 통해 라우팅 매칭하는데 사용된다. 효과적인 라우팅 매칭을 위해 `spring-web`
모듈의 `PathPatternRouteMatcher`를 사용하는 것이 좋다. RSocket 라우팅은 계층적일 수 있지만 URL path는 아니다. 두 라우팅 매칭은
기본적으로 "."를 구분자로 사용하며 HTTP URL과 마찬가지로 URL 디코딩은 없다.

`RSocketMessageHandler`는 `RSocketStrategies`를 통해 설정할 수 있으며, 동일한 프로세스에서 클라이언트와 서버 사이의 설정을
공유해야하는 경우 유용할 수 있다:

#### Java:
```java
@Configuration
static class ServerConfig {

    @Bean
    public RSocketMessageHandler rsocketMessageHandler() {
        RSocketMessageHandler handler = new RSocketMessageHandler();
        handler.setRSocketStrategies(rsocketStrategies());
        return handler;
    }

    @Bean
    public RSocketStrategies rsocketStrategies() {
        return RSocketStrategies.builder()
            .encoders(encoders -> encoders.add(new Jackson2CborEncoder()))
            .decoders(decoders -> decoders.add(new Jackson2CborDecoder()))
            .routeMatcher(new PathPatternRouteMatcher())
            .build();
    }
}
```

#### Kotlin:
```kotlin
@Configuration
class ServerConfig {

    @Bean
    fun rsocketMessageHandler() = RSocketMessageHandler().apply {
        rSocketStrategies = rsocketStrategies()
    }

    @Bean
    fun rsocketStrategies() = RSocketStrategies.builder()
            .encoders { it.add(Jackson2CborEncoder()) }
            .decoders { it.add(Jackson2CborDecoder()) }
            .routeMatcher(PathPatternRouteMatcher())
            .build()
}
```

<br>

### 5.3.2. Client Responders
클라이언트 측의 어노테이션 응답자는 `RSocketRequester.Builder`에서 설정해야 한다. 자세한 내용은
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-requester-client-responder" rel="nofollow" target="_blank">Client Responders</a>을 참조하라.

<br>

### 5.3.3. @MessageMapping
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-annot-responders-server" rel="nofollow" target="_blank">
서버</a> 또는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-annot-responders-client" rel="nofollow" target="_blank">
클라이언트 responder 설정이 완료되면 `@MessageMapping` 메서드를 다음과 같이 사용할 수 있다:

#### Java:
```java
@Controller
public class RadarsController {

    @MessageMapping("locate.radars.within")
    public Flux<AirportLocation> radars(MapRequest request) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@Controller
class RadarsController {

    @MessageMapping("locate.radars.within")
    fun radars(request: MapRequest): Flow<AirportLocation> {
        // ...
    }
}
```

위의 `@MessageMapping` 메서드는 "locate.radars.within" 라우팅을 가진 Request-Stream 상호작용에 응답한다. 이 메서드는
다음 메서드 인자를 사용하는 유연한 메서드 시그니처를 지원한다:

| 메서드 인자 | 설명 |
| -- | -- |
`@Payload` | 요청의 페이로드. `Mono` 또는 `Flux`와 같이 비동기 타입의 구체적인 값이 될 수 있다. <br><br> **참고**: 어노테이션 사용은 선택사항이다. 단순 타입이 아니면서 지원되는 인자가 아닌 경우에는 페이로드로 간주된다.
`RSocketRequester` | 원격 종료 요청을 보낸 요청자(requester)
`@DestinationVariable` | 매핑 패턴의 변수에 기반한 라우팅으로부터 추출된 값. 예로, `@MessageMapping("find.radar.{id}")`
`@Header` | 등록된 메타 데이터를 추출한 값. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-metadata-extractor" rel="nofollow" target="_blank">MetadataExtractor</a> 참고
`@Headers Map<String, Object>` | 등록된 모든 메타 데이터를 추출한 값. <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-metadata-extractor" rel="nofollow" target="_blank">MetadataExtractor</a> 참고

반환값은 응답 페이로드로 직렬화될 하나 이상의 객체로 예상된다. 반환값은 `Mono` 또는 `Flux`와 같은 비동기 타입이거나, 구체적인 값 또는
`void` 또는 `Mono<Void>`와 같은 값이 없는(no-value) 비동기 타입일 수 있다.

`@MessageMapping` 메서드가 지원하는 RSocket 상호작용 타입은 입력(예: `@Payload` 인자) 및 출력의 카디널리티로부터 결정된다.
여기서 카디널리티는 다음을 의미한다:

| 카디널리티(Cardinality) | 설명 |
| -- | -- |
1 | 명시적인 값, 혹은 `Mono<T>`와 같은 단일값(single-value) 비동기 타입
Many | `Flux<T>`와 같은 다중값(multi-value) 비동기 타입
0 | 입력에서는 메서드에 `@Payload` 인자가 없음을 의미한다. <br><br> 출력의 경우 `void` 또는 `Mono<Void>`와 같은 값이 없는(no-value) 비동기 타입

다음은 모든 입력과 출력 카디널리티 조합과 그에 따른 상호작용 타입 유형이다:

입력 카디널리티<br>(Input Cardinality) | 출력 카디널리티<br>(Output Cardinality) | 상호동작 유형<br>(Interaction Types)
| -- | -- |
0, 1 | 0 | Fire-and-Forget, Request-Response
0, 1 | 1 | Request-Response
0, 1 | Many | Request-Stream
Many | 0, 1, Many | Request-Channel

<br>

### 5.3.4. @ConnectMapping
`@ConnectMapping`은 RSocket 커넥션 시작시 `SETUP` 프레임을 핸들링한다. 그리고 `METADATA_PUSH` 프레임
(예: `io.rsocket.RSocket`의 `metadataPush(payload)`)으로 이어지는 메타 데이터 푸시 알림을 핸들링한다.

`@ConnectMapping` 메서드는 `@MessageMapping`과 동일한 인자를 지원하지만 `SETUP`과 `METADATA_PUSH` 프레임의 메타 데이터와
데이터를 기반으로 한다. `@ConnectMapping`에 패턴을 지정하면 특정 라우팅 정보가 있는 커넥션만 처리한다. 아무 패턴도 선언되지
않은 경우라면 모든 커넥션이 매칭된다.

`@ConnectMapping` 메서드는 데이터를 반환할 수 없으며 `void` 또는 `Mono<Void>`를 반환 타입으로 선언해야 한다.
만일 신규 커넥션에 대해 오류를 반환하면 커넥션은 거절된다. `RSocketRequester`에 커넥션을 요청하기 위해 처리를 보류해서는
안 된다. 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#rsocket-requester-server" rel="nofollow" target="_blank">Server Requester</a>를 참조하라.

---

> ### 목차 가이드
> - <a href="/post/rsocket-references-metadataextractor">다음글 "5.4. MetadataExtractor" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>