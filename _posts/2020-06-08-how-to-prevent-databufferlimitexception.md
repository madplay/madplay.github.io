---
layout:   post
title:    "DataBufferLimitException 해결 방법"
author:   Kimtaeng
tags: 	  spring webclient databufferlimitexception
description: "WebClient를 사용할 때 코덱의 메모리 버퍼 사이즈를 초과하는 경우 발생하는 DataBufferLimitException을 해결하는 방법"
category: Spring
date: "2020-06-08 01:11:52"
comments: true
---

# 왜 발생할까
우리가 사용하는 `WebClient` 설정에는 애플리케이션의 메모리 이슈를 방지할 수 있도록 코덱(codec)의 메모리 버퍼 사이즈
제한 값을 갖고 있다. 이 값은 기본적으로 256KB로 설정되어 있는데, 이 값을 넘어가는 경우 `DataBufferLimitException` 예외가 발생한다.

- <a href="/post/webclient-references-configuration#211-maxinmemorysize" target="_blank">
참고 링크: [한글로 번역한 Web on Reactive Stack] 2. WebClient: 2.1. Configuration</a>

<br>

# 어떻게 해결할까?
`DataBufferLimitException` 예외가 발생하지 않도록 `WebClient`를 설정할 때 코덱(codec)의 메모리 버퍼 사이즈 제한 값을
`maxInMemorySize` 메서드의 파라미터로 넣어주면 된다.

```java
ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
	.build();

WebClient webClient = WebClient.builder()
	.exchangeStrategies(exchangeStrategies)
	.build();
```

`CodecConfigurer` 클래스에서 `maxInMemorySize` 메서드 명세에도 있듯이 사이즈 제한을 없앨 수도 있는데,
메서드 파라미터로 -1을 전달하면 된다.

참고로 아래와 같이 **Consumer를 파라미터로 받는 `exchangeStrategies` 메서드는 deprecated 되었다.**
따라서 앞서 살펴본 `ExchangeStrategies` 객체 자체를 넘기는 방식을 사용하자.

```java
WebClient webClient = WebClient.builder()
	.exchangeStrategies(builder ->    // Deprecated 된 방식
	    builder.codecs(codecs ->
	        codecs.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)
	    )
	).build();
```