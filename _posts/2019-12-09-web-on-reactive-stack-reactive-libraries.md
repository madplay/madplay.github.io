---
layout:   post
title:    "[Web on Reactive Stack] 6. Reactive Libraries"
author:   Kimtaeng
tags: 	  spring reactive
description: "한글로 번역한 Web on Reactive Stack, 6. Reactive Libraries"
category: Spring
date: "2019-12-09 22:52:41"
comments: true
---

# 6. Reactive Libraries
`spring-webflux`는 `reactor-core`에 의존하여 내부적으로 이를 사용하여 비동기 로직을 구성하고 리액티브 스트림 지원을 제공한다.
일반적으로 웹플럭스 API는 `Flux` 또는 `Mono`를 반환한다.(내부적으로 사용되므로) 그리고 어떤 리액티브 스트림 `Publisher` 구현체든
입력으로 받을 수 있다. `Flux`와 `Mono`의 사용은 중요하다. 카디널리티 표현에 도움되기 때문이다. - 예를 들어, 비동기 값이 단일 또는
다중값인지 여부, 그리고 이는 어떤(예를 들면, HTTP 메시지를 인코딩 또는 디코딩할 때 등) 결정을 할 때 필수적일 수 있다.

어노테이션 컨트롤러의 경우 웹플럭스는 애플리케이션에서 선택한 리액티브 라이브러리에 잘 맞춰진다. 이는 리액티브 라이브러리나 기타 비동기 타입을
플러그인처럼 해주는 `ReactiveAdapterRegistry`의 도움으로 수행된다. 레지스트리는 RxJava와 `CompletableFuture`를
기본적으로 내장 지원하지만 다른 라이브러리도 등록 가능하다.

함수형 API(예를 들어, 함수형 엔드포인트, 웹크랄이언트 등)의 경우 웹플럭스 API에 대한 일반 규칙을 적용한다. `Flux`와 `Mono`는 반환값으로,
입력으로는 리액티브 스트림 `Publisher`는 입력으로 받는다. 커스텀 구현체나 다른 리액티브 라이브러리의 `Publisher`는 의미를 알 수 없는
스트림(0..N)으로만 처리할 수 밖에 없다. 그러나 시맨틱스를 알고 있다면, raw한 `Publisher`를 전달하는 대신에 `Flux` 또는
`Mono.from(Publisher)`로 래핑할 수 있다.

예를 들어, `Mono`가 아닌 `Publisher`인 경우, Jackson JSON 메시지 작성자는 여러 개의 값을 예상한다. 만약 미디어 타입이 무한 스트림을
나타낸다면(예를 들어, `application/json+stream`), 개별적으로 작성(write)하고 플러시(flush) 한다. 그렇지 않으면 값이 목록으로
버퍼링되어 JSON 배열로 렌더링된다.

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>