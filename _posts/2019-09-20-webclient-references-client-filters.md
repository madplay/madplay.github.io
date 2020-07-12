---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.5. Client Filters"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.5. Client Filters"
category: Spring
date: "2019-09-20 23:17:32"
comments: true
---

# 2.5. Client Filters
`WebClient.Builder`를 통해 클라이언트 필터(`ExchangeFilterFunction`)를 등록하면 요청을 인터셉트하여 수정할 수 있다.
다음은 그 예제다:

#### Java:
```java
WebClient client = WebClient.builder()
        .filter((request, next) -> {

            ClientRequest filtered = ClientRequest.from(request)
                    .header("foo", "bar")
                    .build();

            return next.exchange(filtered);
        })
        .build();
```

#### Kotlin:
```kotlin
val client = WebClient.builder()
        .filter { request, next ->

            val filtered = ClientRequest.from(request)
                    .header("foo", "bar")
                    .build()

            next.exchange(filtered)
        }
        .build()
```

필터는 인증과 같은 횡단 관심사(cross-cutting concerns)를 다룰 때 사용할 수 있다. 다음은 정적 팩토리 메서드를 통한 기본 인증에
필터를 사용하는 예제다.

#### Java:
```java
import static org.springframework.web.reactive.function.client.ExchangeFilterFunctions.basicAuthentication;

WebClient client = WebClient.builder()
        .filter(basicAuthentication("user", "password"))
        .build();
```

#### Kotlin:
```kotlin
import org.springframework.web.reactive.function.client.ExchangeFilterFunctions.basicAuthentication

val client = WebClient.builder()
        .filter(basicAuthentication("user", "password"))
        .build()
```

필터는 모든 요청에 전역으로 적용된다. 특정 요청에 대한 필터 동작을 변경하려면, `ClientRequest`에 request 속성을 추가하고, 필터 체인에서
이 속성에 접근하면 된다. 다음은 그 예제다:

#### Java:
```java
WebClient client = WebClient.builder()
        .filter((request, next) -> {
            Optional<Object> usr = request.attribute("myAttribute");
            // ...
        })
        .build();

client.get().uri("https://example.org/")
        .attribute("myAttribute", "...")
        .retrieve()
        .bodyToMono(Void.class);

    }
```

#### Kotlin:
```kotlin
val client = WebClient.builder()
            .filter { request, _ ->
        val usr = request.attributes()["myAttribute"];
        // ...
    }.build()

    client.get().uri("https://example.org/")
            .attribute("myAttribute", "...")
            .retrieve()
            .awaitBody<Unit>()
```

기존의 `WebClient`를 복제하거나, 새로운 필터를 삽입하거나, 이미 등록된 필터를 제거할 수도 있다. 다음 예제는 인덱스 0번 째에 인증 필터를
추가한다.

#### Java:
```java
import static org.springframework.web.reactive.function.client.ExchangeFilterFunctions.basicAuthentication;

WebClient client = webClient.mutate()
        .filters(filterList -> {
            filterList.add(0, basicAuthentication("user", "password"));
        })
        .build();
```

#### Kotlin:
```kotlin
val client = webClient.mutate()
        .filters { it.add(0, basicAuthentication("user", "password")) }
        .build()
```

---

> ### 목차 가이드
> - <a href="/post/webclient-references-synchronous-use">다음글 "2.6. Synchronous Use" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>