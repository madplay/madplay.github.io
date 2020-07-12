---
layout:   post
title:    "[Web on Reactive Stack] 5. RSocket: 5.4. MetadataExtractor"
author:   Kimtaeng
tags: 	  spring reactive rsocket
description: "한글로 번역한 Web on Reactive Stack, 5. RSocket: 5.4. MetadataExtractor"
category: Spring
date: "2019-12-04 00:49:15"
comments: true
---

# 5.4. MetadataExtractor
응답자는 메타 데이터를 해석해야 한다. <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/CompositeMetadata.md" rel="nofollow" target="_blank">Composite metadata</a>는 각각 고유한 mime 타입으로 포맷팅된
메타 데이터 값(예를 들면, 라우팅, 보안, 추적)을 허용한다. 애플리케이션은 지원할 메타 데이터 mime 타입을 설정하고, 추출된 값에 접근하는
방법이 필요하다.

`MetadataExtractor`는 직렬화된 메타 데이터를 받아와서 디코딩한 이름-값(name-value) 쌍을 반환한다. 이 값은 헤더처럼 이름으로
접근할 수 있다. 예를 들면, 핸들러 메서드에 적용된 `@Header`

`DefaultMetadataExtractor`에 메타 데이터를 디코딩하기 위한 `Decoder`를 설정할 수 있다. 기본적으로 `String`으로 디코딩하여
"route" 키에 저장하는 <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/Routing.md" rel="nofollow" target="_blank">"message/x.rsocket.routing.v0"</a> 에 대한 지원 기능이 내장되어 있다. 다른 mime 타입의 경우 `Decoder`를
제공하고 다음과 같이 mime 타입을 등록해야 한다.

#### Java:
```java
DefaultMetadataExtractor extractor = new DefaultMetadataExtractor(metadataDecoders);
extractor.metadataToExtract(fooMimeType, Foo.class, "foo");
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val extractor = DefaultMetadataExtractor(metadataDecoders)
extractor.metadataToExtract<Foo>(fooMimeType, "foo")
```

복합 메타 데이터(Composite metadata)는 독립적인 메타 데이터 값을 결합하는데 효과적이다. 하지만 요청자(requester)가 복합 메타 데이터를
지원하지 않거나 사용하지 않을 수 있다. 이를 위해서 `DefaultMetadataExtractor`는 디코딩한 값을 출력 map에 매핑하는 커스텀 로직이
필요하다. 다음은 메타 데이터에 JSON을 사용하는 예제다:

#### Java:
```java
DefaultMetadataExtractor extractor = new DefaultMetadataExtractor(metadataDecoders);
extractor.metadataToExtract(
    MimeType.valueOf("application/vnd.myapp.metadata+json"),
    new ParameterizedTypeReference<Map<String,String>>() {},
    (jsonMap, outputMap) -> {
        outputMap.putAll(jsonMap);
    });
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val extractor = DefaultMetadataExtractor(metadataDecoders)
extractor.metadataToExtract<Map<String, String>>(MimeType.valueOf("application/vnd.myapp.metadata+json")) { jsonMap, outputMap ->
    outputMap.putAll(jsonMap)
}
```

`RSocketStrategies`를 사용하여 `MetadataExtractor`를 설정할 때는, `RSocketStrategies.Builder`에서 설정된 디코더로
추출자(extractor)를 생성할 수 있다. 그리고 콜백을 사용하여 다음과 같이 등록 작업을 커스텀할 수 있다.

#### Java:
```java
RSocketStrategies strategies = RSocketStrategies.builder()
    .metadataExtractorRegistry(registry -> {
        registry.metadataToExtract(fooMimeType, Foo.class, "foo");
        // ...
    })
    .build();
```

#### Kotlin:
```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val strategies = RSocketStrategies.builder()
        .metadataExtractorRegistry { registry: MetadataExtractorRegistry ->
            registry.metadataToExtract<Foo>(fooMimeType, "foo")
            // ...
        }
        .build()
```

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-reactive-libraries">다음장 "6. Reactive Libraries" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>