---
layout:   post
title:    "[Web on Reactive Stack] 2. WebClient: 2.6. Synchronous Use"
author:   Kimtaeng
tags: 	  spring reactive webclient
description: "한글로 번역한 Web on Reactive Stack, 2. WebClient: 2.6. Synchronous Use"
category: Spring
date: "2019-09-24 00:28:49"
comments: true
---

# 2.6. Synchronous Use
`WebClient`는 마지막에 결과를 블로킹하여 동기식(synchronous) 스타일로 사용할 수 있다:

#### Java:
```java
Person person = client.get().uri("/person/{id}", i).retrieve()
    .bodyToMono(Person.class)
    .block();

List<Person> persons = client.get().uri("/persons").retrieve()
    .bodyToFlux(Person.class)
    .collectList()
    .block();
```

#### Kotlin:
```kotlin
val person = runBlocking {
    client.get().uri("/person/{id}", i).retrieve()
            .awaitBody<Person>()
}

val persons = runBlocking {
    client.get().uri("/persons").retrieve()
            .bodyToFlow<Person>()
            .toList()
}
```

하지만 여러 번의 호출이 필요한 경우에는 각 응답을 개별적으로 블로킹하지 않고 결합된 전체 결과를 기다리는 것이 더 효율적이다:

#### Java:
```java
Mono<Person> personMono = client.get().uri("/person/{id}", personId)
        .retrieve().bodyToMono(Person.class);

Mono<List<Hobby>> hobbiesMono = client.get().uri("/person/{id}/hobbies", personId)
        .retrieve().bodyToFlux(Hobby.class).collectList();

Map<String, Object> data = Mono.zip(personMono, hobbiesMono, (person, hobbies) -> {
            Map<String, String> map = new LinkedHashMap<>();
            map.put("person", person);
            map.put("hobbies", hobbies);
            return map;
        })
        .block();
```

#### Kotlin:
```kotlin
val data = runBlocking {
        val personDeferred = async {
            client.get().uri("/person/{id}", personId)
                    .retrieve().awaitBody<Person>()
        }

        val hobbiesDeferred = async {
            client.get().uri("/person/{id}/hobbies", personId)
                    .retrieve().bodyToFlow<Hobby>().toList()
        }

        mapOf("person" to personDeferred.await(), "hobbies" to hobbiesDeferred.await())
    }
```

위의 코드는 단지 예시에 불과하다. 대량 원격 호출, 일부 중첩되고 상호 의존적이면서 호출이 끝날 때까지 블로킹하지 않는
리액티브 파이프라인을 만드는 수많은 패턴과 연산자가 있다.

> `Flux` 또는 `Mono`를 사용하면, 스프링 MVC 또는 스프링 웹플럭스 컨트롤러에서 차단할 필요가 없다. 단지 컨트롤러 메서드에서 리액티브
타입을 리턴하면 된다. 코틀린 코루틴과 스프링 웹플럭스에서도 동일한 원칙이 적용된다. 컨트롤러 함수에서 일시중지(suspend) 함수를 사용하거나
`Flow`를 반환하면 된다.

<br>

---

> ### 목차 가이드
> - <a href="/post/webclient-references-testing">다음글 "2.7. Testing" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>