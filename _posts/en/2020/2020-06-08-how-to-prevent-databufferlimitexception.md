---
layout:   post
title:    "Resolving DataBufferLimitException in Spring WebClient"
author:   madplay
tags: 	  spring webclient databufferlimitexception
description: "How to resolve DataBufferLimitException when WebClient exceeds the default codec memory buffer limit."
category: Spring
date: "2020-06-08 01:11:52"
comments: true
lang:     en
slug:     how-to-prevent-databufferlimitexception
permalink: /en/post/how-to-prevent-databufferlimitexception
---


# Root Cause
Spring `WebClient` includes a default codec memory buffer limit to prevent application memory exhaustion.
This limit is set to 256KB by default. `DataBufferLimitException` occurs when the response payload exceeds this threshold.

- <a href="/post/webclient-references-configuration#211-maxinmemorysize" target="_blank">
Reference: [Korean Translation of Web on Reactive Stack] 2. WebClient: 2.1. Configuration</a>

<br>

# Resolution
To resolve `DataBufferLimitException`, increase the codec memory buffer limit using the `maxInMemorySize` parameter during `WebClient` configuration.

```java
ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
    .build();

WebClient webClient = WebClient.builder()
    .exchangeStrategies(exchangeStrategies)
    .build();
```

As documented in `CodecConfigurer#maxInMemorySize`, you can also remove the limit by passing `-1`.

Also note that the `exchangeStrategies` method that accepts a `Consumer` parameter is **deprecated**, as shown below.
Use the approach above that passes an `ExchangeStrategies` instance directly.

```java
WebClient webClient = WebClient.builder()
    .exchangeStrategies(builder ->    // Deprecated approach
        builder.codecs(codecs ->
            codecs.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)
        )
    ).build();
```
