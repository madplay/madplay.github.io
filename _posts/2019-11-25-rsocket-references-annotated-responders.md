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

---

> ### 목차 가이드
> - 다음글 "5.4. MetadataExtractor" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>