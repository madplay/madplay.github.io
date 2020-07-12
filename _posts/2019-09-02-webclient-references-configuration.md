---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.1. Configuration"
author:   Kimtaeng
tags: 	  spring rective webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.1. Configuration"
category: Spring
date: "2019-09-02 21:50:34"
comments: true
---

# 2.1. 설정(Configuration)
`WebClient`를 생성하는 가장 간단한 방법은 정적 팩터리 메서드 중 하나를 사용하는 것이다.

- `WebClient.create()`
- `WebClient.create(String baseUrl)`

위 메서드는 기본 설정으로 리액터 네티 `HttpClient`를 사용하기 때문에 클래스패스에 `io.projectreactor.netty:reactor-netty`가
있어야 한다.

물론 `WebClient.builder()`와 함께 다른 옵션을 사용할 수 있다.

- `uriBuilderFactory`: base URL을 사용하기 위한 커스터마이징한 `UriBuilderFactory`
- `defaultHeader`: 모든 요청에 대한 헤더
- `defaultCookie`: 모든 요청에 대한 쿠키
- `defaultRequest`: 모든 요청에 대해 커스터마마이징할 `Consumer`
- `filter`: 모든 요청에 대한 클라이언트 필터
- `exchangeStrategies`: HTTP 메시지 reader/writer 커스터마이징
- `clientConnector`: HTTP 클라이언트 라이브러리 세팅

다음 예제는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">HTTP 코덱</a>을 설정한다:

#### Java:
```java
WebClient client = WebClient.builder()
        .exchangeStrategies(builder -> {
                return builder.codecs(codecConfigurer -> {
                    //...
                });
        })
        .build();
```

#### Kotlin:
```kotlin
val webClient = WebClient.builder()
        .exchangeStrategies { strategies ->
            strategies.codecs {
                //...
            }
        }
        .build()
```

한 번 만들어진 `WebClient` 인스턴스는 불변(immutable)이다. 하지만 원본 인스턴스에 영향을 주지 않고 복제하여 설정을 수정할 수 있다.
다음은 그 예제다:

#### Java:
```java
WebClient client1 = WebClient.builder()
        .filter(filterA).filter(filterB).build();

WebClient client2 = client1.mutate()
        .filter(filterC).filter(filterD).build();

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

#### Kotlin:
```kotlin
val client1 = WebClient.builder()
        .filter(filterA).filter(filterB).build()

val client2 = client1.mutate()
        .filter(filterC).filter(filterD).build()

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

<br>

## 2.1.1. MaxInMemorySize
스프링 웹플럭스는 애플리케이션의 메모리 이슈를 피하기 위해 코덱의 메모리 버퍼 사이즈에 대한 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs-limits" rel="nofollow" target="_blank">제한(limits)</a>을 설정한다.
기본값으로 256KB로 설정되어 있는데, 이 값으로 충분히 수용하지 못하는 경우 아래와 같은 메시지를 볼 수 있다.

```bash
org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer
```

아래 코드 샘플을 사용하여 모든 기본 코덱에서 제한값을 설정할 수 있다:

#### Java
```java
WebClient webClient = WebClient.builder()
        .exchangeStrategies(builder ->
            builder.codecs(codecs ->
                codecs.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)
            )
        )
        .build();
```

#### Kotlin
```kotlin
val webClient = WebClient.builder()
    .exchangeStrategies { builder ->
            builder.codecs {
                it.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)
            }
    }
    .build()
```

<br>

## 2.1.2. 리액터 네티(Reactor Netty)
리액터 네티 설정을 커스텀하기 위해, 미리 설정된 `HttpClient`를 제공한다:

#### Java:
```java
HttpClient httpClient = HttpClient.create().secure(sslSpec -> ...);

WebClient webClient = WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
```

#### Kotlin:
```kotlin
val httpClient = HttpClient.create().secure { ... }

val webClient = WebClient.builder()
    .clientConnector(ReactorClientHttpConnector(httpClient))
    .build()
```

### Resources
기본적으로 `HttpClient`는 이벤트 루프 스레드와 커넥션 풀을 포함하여 `reactor.netty.http.HttpResources`에 포함된 전역 Reactor
Netty 자원을 사용한다. 이벤트 루프 동시성에는 공유 자원을 고정해놓는 것이 좋기 때문에 이 모드는 권장된다. 이 모드에서는 프로세스가
종료될 때까지 공유 자원은 활성화된 상태를 유지한다.

서버가 프로세스에 맞춰진다면, 일반적으로 명시적으로 셧다운할 필요는 없다. 하지만 서버가 프로세스 내에서 시작하거나 중단될 수 있다면
(예를 들어, WAR로 배포된 스프링 MVC 애플리케이션), 스프링이 관리하는 `ReactorResourceFactory` 빈(bean)을
`globalResources=true`로 설정하여 스프링 `ApplicationContext`가 닫힐 때 Reactor Netty 공유 자원이 종료되도록 설정할 수 있다.
다음은 그 예제다:

#### Java:
```java
@Bean
public ReactorResourceFactory reactorResourceFactory() {
    return new ReactorResourceFactory();
}
```

#### Kotlin:
```kotlin
@Bean
fun reactorResourceFactory() = ReactorResourceFactory()
```

또한 Reactor Netty 리소스를 사용하지 않게 설정할 수도 있다. 하지만 이 모드에서는, 다음 예제와 같이 모든 Reactor Netty 클라이언트와
서버 인스턴스가 공유 자원을 사용하도록 해야하는 부담이 있다:

#### Java:
```java
@Bean
public ReactorResourceFactory resourceFactory() {
    ReactorResourceFactory factory = new ReactorResourceFactory();
    factory.setUseGlobalResources(false); (1)
    return factory;
}

@Bean
public WebClient webClient() {

    Function<HttpClient, HttpClient> mapper = client -> {
        // Further customizations...
    };

    ClientHttpConnector connector =
            new ReactorClientHttpConnector(resourceFactory(), mapper); (2)

    return WebClient.builder().clientConnector(connector).build(); (3)
}
```

#### Kotlin:
```kotlin
@Bean
fun resourceFactory() = ReactorResourceFactory().apply {
    isUseGlobalResources = false (1)
}

@Bean
fun webClient(): WebClient {

    val mapper: (HttpClient) -> HttpClient = {
        // Further customizations...
    }

    val connector = ReactorClientHttpConnector(resourceFactory(), mapper) (2)

    return WebClient.builder().clientConnector(connector).build() (3)
}
```

> (1) 전역 자원과 독립된 자원을 생성한다.<br>
> (2) 자원 팩토리(resource factory)로 `ReactorClientHttpConnector` 생성자를 사용한다.<br>
> (3) 커넥터를 `WebClient.Builder`에 연결한다.

### 타임아웃(Timeouts)
다음은 커넥션 타임아웃을 설정하는 예제다:

#### Java:
```java
import io.netty.channel.ChannelOption;

HttpClient httpClient = HttpClient.create()
        .tcpConfiguration(client ->
                client.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000));
```

#### Kotlin:
```kotlin
import io.netty.channel.ChannelOption

val httpClient = HttpClient.create()
        .tcpConfiguration { it.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)}
```

다음은 read/write 타임아웃을 설정하는 예제다:

#### Java:
```java
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;

HttpClient httpClient = HttpClient.create()
        .tcpConfiguration(client ->
                client.doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(10))
                        .addHandlerLast(new WriteTimeoutHandler(10))));
```

#### Kotlin:
```kotlin
import io.netty.handler.timeout.ReadTimeoutHandler
import io.netty.handler.timeout.WriteTimeoutHandler

val httpClient = HttpClient.create().tcpConfiguration {
    it.doOnConnected { conn -> conn
            .addHandlerLast(ReadTimeoutHandler(10))
            .addHandlerLast(WriteTimeoutHandler(10))
    }
}
```

<br>

## 2.1.3. 제티(Jetty)
다음은 제티 `HttpClient` 설정을 커스터마이징하는 예제다:

#### Java:
```java
HttpClient httpClient = new HttpClient();
httpClient.setCookieStore(...);
ClientHttpConnector connector = new JettyClientHttpConnector(httpClient);

WebClient webClient = WebClient.builder().clientConnector(connector).build();
```

#### Kotlin:
```kotlin
val httpClient = HttpClient()
httpClient.cookieStore = ...
val connector = JettyClientHttpConnector(httpClient)

val webClient = WebClient.builder().clientConnector(connector).build();
```

기본적으로 `HttpClient`는 자신의 고유한 자원(`Executor`, `ByteBufferPool`, `Scheduler`)을 생성해서, 프로세스가 종료되거나
`stop()`이 호출될 때까지 활성 상태를 유지한다.

제티 클라이언트(및 서버)의 여러 인스턴스 간에 자원을 공유할 수 있고, `JettyResourceFactory` 타입의 스프링이 관리하는 빈으로 선언하여
스프링 `ApplicationContext`가 닫힐 때 자원이 종료되도록 할 수 있다. 다음은 그 예제다:

#### Java:
```java
@Bean
public JettyResourceFactory resourceFactory() {
    return new JettyResourceFactory();
}

@Bean
public WebClient webClient() {

    HttpClient httpClient = new HttpClient();
    // Further customizations...

    ClientHttpConnector connector =
            new JettyClientHttpConnector(httpClient, resourceFactory()); (1)

    return WebClient.builder().clientConnector(connector).build(); (2)
}
```

#### Kotlin:
```kotlin
@Bean
fun resourceFactory() = JettyResourceFactory()

@Bean
fun webClient(): WebClient {

    val httpClient = HttpClient()
    // Further customizations...

    val connector = JettyClientHttpConnector(httpClient, resourceFactory()) (1)

    return WebClient.builder().clientConnector(connector).build() (2)
}
```

> (1) `JettyClientHttpConnector` 생성자에 리소스 팩토리를 사용한다.<br>
> (2) 커넥터를 `WebClient.Builder`에 연결한다.

<br>

---

> ### 목차 가이드
> - <a href="/post/webclient-references-retrieve">다음글 "2.2. retrieve()" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>