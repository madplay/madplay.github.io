---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.1. Overview"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.1. Overview"
category: Spring
date: "2019-06-05 00:01:24"
comments: true
---

# 1.1. 개요(Overview)
스프링 웹플럭스는 왜 만들어졌을까?

이 의문에 대한 답의 일부는 적은 수의 스레드로 동시성을 처리하고 더 적은 하드웨어 리소스로 확장하기 위해 논 블로킹 웹 스택이 필요하다는 것이다.
서블릿 3.1은 논 블로킹 I/O를 위한 API를 제공했다. 하지만 이를 사용하면 Filter, Servlet과 같은 동기(synchronous)식과
`getParameter`, `getPart` 등의 블로킹(blocking) 방식 같은 다른 서블릿 API와의 어울리지 못한다. 이것이 논 블로킹 실행환경에서
기반 역할을 하는 새로운 공통 API가 탄생하게 된 동기다. 이점은 비동기, 논 블로킹이 잘 확립된 서버(예를 들면 Netty) 때문에 중요하다.

또 다른 탄생 배경은 함수형 프로그래밍(functional programming)이다. 자바 5에 어노테이션을 추가한 것처럼(어노테이션이 붙은 Rest 컨트롤러,
단위 테스트) 자바 8에서 추가된 람다 표현식은 자바의 함수형 API를 위한 기회를 만들었다. 람다 표현식은 비동기 로직을 서술적으로 작성할 수 있게
하는 논 블로킹 애플리케이션과 연속형 API(예를 들면 `CompletableFuture`, `ReactiveX`)에게 도움이 된다. 프로그래밍 모델 수준으로 보면,
자바 8은 스프링 웹플럭스가 어노테이션 컨트롤러와 함수형 웹 엔드포인트를 사용할 수 있게 만들었다.

<br>

## 1.1.1. "리액티브" 정의(Define "Reactive")
앞서 "논 블로킹(non-blocking)"과 "함수형(functional)"에 대해서 간단히 다뤘다. 그런데 리액티브는 무엇을 의미할까?

"리액티브(reactive)"란 용어는 I/O 이벤트에 반응하는 네트워크 요소, 마우스 이벤트에 반응하는 UI 컨트롤러 등 변화에 반응하는 것을 중점으로
둔 프로그래밍 모델을 말한다. 그런 의미에서 논 블로킹(non-blocking)은 리액티브다. 이유는 블로킹되지 않고 작업이 완료되거나 데이터가 사용
가능해짐 등과 같은 알림에 반응하기 때문이다.

스프링 팀이 "리액티브"와 연관시키는 또 다른 중요한 매커니즘이 있는데 그것은 논 블로킹 백프레셔(back pressure)다. 동기식(synchronous),
명령형 코드, 블로킹 호출은 호출자를 대기하게 하는 자연스러운 형태의 백프레셔 역할을 한다. 논 블로킹 코드에서는 바른 생산자가 목적지(소비자)를
압도하지 않도록 이벤트의 속도를 제어하는 것이 중요해진다.

리액티브 스트림은 백프레셔를 통해 비동기 컴포넌트 사이의 상호 작용을 정의하는 <a href="https://github.com/reactive-streams/reactive-streams-jvm/blob/master/README.md#specification" rel="nofollow" target="_blank">작은 스펙</a>
(자바 9에서 <a href="https://docs.oracle.com/javase/9/docs/api/java/util/concurrent/Flow.html" rel="nofollow" target="_blank">적용된</a>)이다.
예를 들어, 데이터 저장소(<a href="https://www.reactive-streams.org/reactive-streams-1.0.1-javadoc/org/reactivestreams/Publisher.html" rel="nofollow" target="_blank">발행자</a> 역할)는
HTTP 서버(<a href="https://www.reactive-streams.org/reactive-streams-1.0.1-javadoc/org/reactivestreams/Subscriber.html" rel="nofollow" target="_blank">구독자</a> 역할)가
응답에 사용할 수 있는 데이터를 생성할 수 있다. 리액티브 스트림의 주요 목적은 구독자를 통해 발행자가 데이터를 얼마나 빠르게 또는 얼마나 느리게
생산할지 제어하도록 하는 것이다.

> **일반적인 질문: 만일 발행자가 속도를 늦출 수 없다면 어떻게 해야 할까?**<br>
리액티브 스트림의 목적은 오직 매커니즘과 경계를 설정하는 것이다. 발행자가 속도를 늦출 수 없는 경우에는 버퍼 사용, 버림(drop) 또는
실패(fail)할지 결정해야 한다.

<br>

## 1.1.2. 리액티브 API(Reactive API)
리액티브 스트림은 시스템의 상호 정보 교환성(interoperability)에 있어서 중요한 역할을 한다. 라이브러리 및 인프라 구성 요소에는 그렇지만
너무 로우 레벨이기 때문에 애플리케이션 API로서 덜 유용하다. 애플리케이션은 비동기 로직을 구성하기 위하여 더 높고 풍부한 함수형 API를 필요하며,
이는 자바 8 `Stream` API와 유사하지만 컬렉션에 대해서만 필요한 것은 아니다. 이것이 리액티브 라이브러리의 역할이다.

리액터(<a href="https://github.com/reactor/reactor" rel="nofollow" target="_blank">Reactor</a>)는 스프링 웹플럭스가
선택한 리액티브 라이브러리다. 리액터는 ReactiveX의 연산자의 어휘<a href="http://reactivex.io/documentation/operators.html" rel="nofollow" target="_blank">(vocabulary of operators)</a>와
풍부한 연산자 세트를 통해 0..1<a href="https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Mono.html" rel="nofollow" target="_blank">(`Mono`)</a>과
0..N<a href="https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Flux.html" rel="nofollow" target="_blank">(`Flux`)</a>
형태의 데이터를 작업할 수 있는 `Mono`와 `Flux` API 유형을 제공한다. 리액터는 리액티브 스트림 라이브러리이므로 모든 리액터 연산자는
논 블로킹 백프레셔를 지원한다. 리액터는 서버 측 자바에 중점을 두고 있으며 스프링과 긴밀히 협력하여 개발되었다.

웹플럭스는 리액터에 핵심 의존성을 갖지만 리액티브 스트림을 통해 다른 리액티브 라이브러리들과 상호 운용이 가능하다. 일반적으로 웹플럭스 API는 일반적인
발행자를 입력으로 받고 이를 내부적으로 리액터 타입에 맞추어 적용하고, 이를 사용하고, `Flux` 또는 `Mono`를 출력으로 반환한다.

따라서 어떤 발행자(`Publisher`)든 입력으로 전달하여 반환값에 대한 연산을 적용할 수 있지만 다른 리액티브 라이브러리와 사용하려면 반환 형태를 맞추어야 한다.
웹플럭스는 가능할 때마다(예를 들어, 어노테이션이 붙은 컨트롤러) RxJava 또는 다른 리액티브 라이브러리와 쉽게 적용될 수 있다.
자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-libraries" rel="nofollow" target="_blank">리액티브 라이브러리</a>를 참조하라.

> 리액티브 API 외에도, 웹플럭스는 코틀린의 코루틴<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/languages.html#coroutines" rel="nofollow" target="_blank">(Coroutines)</a>
API와 함께 사용되어 보다 명령형 스타일로 프로그래밍할 수 있다. 이후에 등장하는 코틀린 코드 샘플은 코루틴 API와 함께 제공된다.

<br>

## 1.1.3. 프로그래밍 모델(Programming Models)
스프링 웹(`spring-web`) 모듈에는 HTTP 추상화, 지원되는 서버를 위한 리액티브 스트림 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">어댑터</a>,
코덱<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">(codecs)</a>
그리고 서블릿 API와 유사하지만 논 블로킹 계약을 포함하는 핵심 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">
`WebHandler` API</a>를 포함하여 스프링 웹 플럭스의 근본이 되는 리액티브 기반이 포함되어 있다.

이를 바탕으로 스프링 웹플럭스는 두 가지 프로그래밍 모델 중에서 선택할 수 있도록 한다.

- **어노테이션 컨트롤러<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-controller" rel="nofollow" target="_blank">(Annotated Controller)</a>**: 스프링 MVC와 일치하며, `spring-web` 모듈과 동일한 어노테이션을 기반으로 한다.
스프링 MVC와 웹플럭스 컨트롤러는 리액티브(리액터와 RxJava) 반환 타입을 지원하므로 이를 구분하기가 쉽지 않다. 주목할만한 차이점 중 하나는 웹플럭스 또한
리액티브 `@RequestBody` 인수(arguments)를 지원한다는 것이다.

- **함수형 엔드포인트<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-fn" rel="nofllow" target="_blank">(Functional Endpoints)</a>**: 람다 기반의 가벼운 함수형 프로그래밍 모델이다. 애플리케이션이 요청을 라우팅하고 처리하는데 사용할 수 있는
작은 라이브러리 또는 유틸리티 집합이라고 생각할 수 있다. 어노테이션 컨트롤러와의 큰 차이점은 애플리케이션이 어노테이션을 통해 의도를 선언하고 콜백을 받는 것과
다르게 요청을 처음부터 끝까지 처리한다는 점이다.

<br>

## 1.1.4. 적용 가능성(Applicability)
스프링 MVC인가 웹플럭스인가?

자연스러운 질문이지만, 모호한 이분법이다. 실제로는 사용 가능한 옵션 범위를 확장하기 위해 같이 협력한다. 이 둘은 연속성과 일관성을 위해 설계되었으며,
나란히 함께 사용될 수 있고, 서로의 피드백은 서로에게 도움이 된다. 다음 다이어그램은 이 둘의 관계, 공통점이 무엇인지 그리고 고유하게 지원하는 것을 보여준다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-06-05-spring-webflux-overview-1.png"
width="700" alt="the diagram for spring mvc and spring webflux"/>

다음과 같은 특정 사항을 고려하라:

- 제대로 동작하는 스프링 MVC 애플리케이션이라면 변경할 필요가 없다. 명령형 프로그래밍은 코드를 작성하고, 이해하고, 디버깅하는 가장 쉬운 방법이다.
대부분 라이브러리가 블로킹 방식이기 때문에 라이브러리르 선택할 때 많은 선택권을 갖게 된다.

- 논 블로킹 웹 스택을 고려하고 있다면, 스프링 웹플럭스는 다른 웹 스택과 동일한 실행 모델 이점을 제공하며 서버(네티, 톰캣, 제티, 언더토우 그리고
서블릿 3.1+ 컨테이너), 프로그래밍 모델(어노테이션 컨트롤러와 함수형 웹 엔드포인트) 그리고 리액티브 라이브러리(Reactor, RxJava 또는 그 외)에 대한
선택지를 제공한다.

- 자바 8의 람다 또는 코틀린과 함께 사용할 함수형 웹 프레임워크를 찾는다면, 스프링 웹플럭스 함수형 웹 엔드포인트를 사용할 수 있다. 또한 소규모의
애플리케이션이나 더 큰 명료함과 제어를 더 적은 복잡도로 제공하는 마이크로 서비스에 좋은 선택이 될 수 있다.

- 마이크로 서비스 아키텍처에서 스프링 MVC 또는 스프링 웹플럭스 컨트롤러 또는 스프링 웹플럭스 함수형 엔드포인트로 만들어진 애플리케이션을 혼합하여
사용할 수 있다. 두 프레임워크에서 동일하게 어노테이션 기반 프로그래밍 모델을 지원하는 점은 지식을 더 쉽게 재사용할 수 있게 할 뿐만 아니라 작업에 적합한
도구를 선택할 수 있게 한다.

- 애플리케이션을 평가하는 간단한 방법은 애플리케이션의 의존성(dependencies)를 확인하는 것이다. 블로킹 퍼시스턴스(persistence) API 또는
네트워킹 API를 사용하고 있다면 적어도 공통 아키텍처에는 스프링 MVC가 가장 적합하다. 스프링 MVC는 개별 스레드에 리액터(Reactor)와 RxJava를 사용하여 블로킹 호출을 실행할 수 있지만 논 블로킹 웹 스택을 최대한으로 활용하지 못한다.

- 원격 서비스를 호출하는 스프링 MVC 애플리케이션인 경우 리액티브 `WebClient`를 사용해보라. 스프링 MVC 컨트롤러 메서드에서 리액티브 타입(Reactor,
RxJava 또는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-reactive-libraries" rel="nofollow" target="_blank">기타</a>)을
직접 반환할 수 있다. 호출 당 대기 시간이 길거나 호출 간 상호 의존성도가 높을수록 더욱 극적인 이점을 얻을 수 있다.
스프링 MVC 컨트롤러는 다른 리액티브 컴포넌트도 호출할 수 있다.

- 팀의 규모가 크다면, 논 블로킹, 함수형과 선언적 프로그래밍으로의 전환에 따른 학습 곡선(learning curve)이 가파른 점을 명심해야 한다. 전체를 전환하지
않고 시작하는 실용적인 방법은 리액티브 `WebClient`를 사용하는 것이다. 이를 넘어서면 작은 것부터 시작하여 이점을 측정해보자. 광범위한 적용이 필요한 경우,
전환이 불필요할 수 있다. 어떤 이점을 찾아야 할지 확실하지 않다면, 논 블로킹 I/O 작동 방식(예를 들면, 단일 스레드 노드 js에서의 동시성)과 그 효과에 대해서
알아보라.

<br>

## 1.1.5. 서버(Servers)
스프링 웹플럭스는 톰캣, 제티, 서블릿 3.1+ 컨테이너뿐만 아니라 네티(Netty)와 언더토우(Undertow)와 같은 비 서블릿 런타임에서도 지원된다.
모든 서버는 저수준(low-level)의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">공통 API</a>를
적용하여, 여러 서버에서 고급 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-programming-models" rel="nofollow" target="_blank">프로그래밍 모델</a>이
지원될 수 있도록 한다.

스프링 웹플럭스는 서버 시작 또는 중지를 위한 내장형 지원 기능이 없다. 하지만 스프링 구성 및 웹플럭스 인프라 구조<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config" rel="nofollow" target="_blank">(WebFlux infrastructure)</a>에서
애플리케이션을 조립<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-web-handler-api" rel="nofollow" target="_blank">(assemble)</a>하여
몇 줄의 코드로 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-httphandler" rel="nofollow" target="_blank">실행</a>할 수 있다.

스프링 부트에는 이러한 단계를 자동화하는 웹플럭스 스타터(starter)가 있다. 기본적으로 스타터는 네티(netty)를 사용하지만 메이븐(maven) 또는
그래들(gradle) 의존성을 변경하여 톰캣(tomcat), 제티(jetty) 또는 언더토우(undertow)로 쉽게 전환할 수 있다. 스프링 부트는 기본적으로 네티를 설정한다.
이유는 비동기 논 블로킹에서 더 광범위하게 사용되며 클라이언트와 서버가 리소스를 공유할 수 있기 때문이다.

톰캣(tomcat)과 제티(jetty)는 스프링 MVC와 웹플럭스 모두 함께 사용할 수 있다. 그러나 사용되는 방식이 매우 다르다는 것을 명심해야 한다. 스프링 MVC는
서블릿 블로킹 I/O에 의존하며 필요한 경우에는 서블릿 API를 직접 사용할 수 있도록 한다. 스프링 웹플럭스는 서블릿 3.1 논 블로킹 I/O에 의존하며
저수준(low-level) 어댑터 뒷단에서 서블릿 API를 사용하며 이를 직접 노출하지 않는다.

언더토우(undertow)의 경우 스프링 웹플럭스는 서블릿 API 없이 언더토우 API를 직접 사용한다.

<br>

## 1.1.6. 성능(Performance)
성능에는 많은 특성과 의미가 있다. 리액티브와 논 블로킹은 일반적으로 애플리케이션의 실행 속도를 향상시키지 못한다. 어떤 경우에는(예를 들어 `WebClient`를
사용하여 원격 호출을 병렬로 실행하는 경우) 더 빨라질 수도 있다. 전반적으로 논 블로킹 방식으로 일을 처리하려면 더 많은 작업이 필요하며, 이는 필요한
처리 시간을 약간 증가시킬 수 있다.

리액티브와 논 블로킹의 주요 이점은 적은 수의 고정된 스레드와 적은 메모리로 확장할 수 있다는 것이다. 애플리케이션은 예측 가능한 방식으로 확장되기 때문에
더 탄력적으로 동작할 수 있게 한다. 하지만 이러한 이점을 보려면 약간의 지연(느리거나 예측할 수 없는 네트워크 I/O의 혼합을 포함하여을 필요로 한다.
여기서 리액티브 스택의 장점을 볼 수 있으며, 그 차이는 극적으로 나타날 수 있다.

<br>

## 1.1.7. 동시성 모델(Concurrency Model)
스프링 MVC와 스프링 웹플럭스 모두 어노테이션 컨트롤러를 지원하지만 동시성 모델과 블로킹 및 스레드에 대한 기본 가정에는 중요한 차이가 있다.

스프링 MVC(그리고 일반적인 서블릿 애플리케이션)에서는 애플리케이션이 현재 스레드(예를 들어 원격 호출)가 블로킹할 수 있다고 가정한다. 이러한 이유로 서블릿
컨테이너는 요청 처리 중에 잠재적 블로킹을 흡수하기 위해 큰 스레드 풀을 사용한다.

스프링 웹플럭스(그리고 일반적인 논 블로킹 서버)에서는 애플리케이션이 스레드를 블로킹하지 않는 것으로 가정한다. 따라서 논 블로킹 서버는 작고 고정 크기의
스레드 풀(이벤트 루프 작업자)을 사용하여 요청을 처리한다.

> "확장" 및 "작은 수의 스레드"는 모순적으로 들릴 수 있지만 현재 스레드를 절대 블로킹하지 않는 것은(대신 콜백에 의존하는 것은) 받아들일 블로킹 호출이
없기 때문에 여분의 스레드가 필요하지 않음을 의미한다.

### 블로킹 API 호출(Invoking a Blocking API)
블로킹 라이브러리를 사용해야 하는 경우는 어떻게 해야 할까? 리액터(Reactor)와 RxJava는 모두 다른 스레드에서 계속 처리할 수 있도록 `publishOn` 연산자를
제공한다. 그것은 쉬운 대안이 있음을 의미한다. 하지만 블로킹 API는 이 동시성 모델에 적합하지 않다는 것을 명심해야 한다.

### 가변 상태(Mutable State)
리액터(Reactor)와 RxJava에서는 연산자를 통해 로직을 선언한다. 런타임 시, 데이터가 순차적으로 처리되고, 뚜렷하게 처리되는 단계에서 반응형 파이프라인이
형성된다. 이것의 주요 이점은 파이프라인 내의 애플리케이션 코드가 동시에 실행되지 않기 때문에 애플리케이션이 변이 가능한 상태를 보호하지 않아도 된다는 점이다.

### 스레딩 모델(Threading Model)
스프링 웹플럭스로 실행되는 서버에서 어떤 스레드를 보게 될까?

- 순수 스프링 웹플럭스 서버(예를 들어, 데이터 접근 또는 기타 선택적인 의존성 없음)에서는 서버에 대한 하나의 스레드와 요청 처리를 위한 여러 개의 다른
스레드(일반적으로 CPU 코어 수만큼)를 기대할 수 있다. 그러나 서블릿 컨테이너에서는 서블릿(블로킹) I/O와 서블릿 3.1(논 블로킹) I/O를 모두 지원하기 위해
더 많은 수의 스레드가 사용될 수 있다. (예를 들어, 톰캣은 10개)

- 리액티브 `WebClient`는 이벤트 루프 스타일로 동작한다. 따라서 적고 고정된 수의 스레드가 사용된다.
(예를 들어, 리액터 네티 커넥터와 사용되는 `reactor-http-nio-`) 그러나 리액터 네티가 클라이언트와 서버 모두에 사용된다면, 기본적으로 이 둘은 이벤트
루프 자원을 공유한다.

- 리액터와 RxJava는 처리를 다른 스레드 풀로 전환하는데 사용되는 `publishOn` 연산자와 함께 사용하기 위해 스케줄러라고 하는 스레드 풀 추상화를 제공한다.
스케줄러에는 특정 동시성 전략을 제안하는 이름을 가지고 있다. 예를 들면 '병렬(parallel)'은 스레드가 수가 제한된 CPU 작업의 경우, 탄력 있는(elastic)은
스레드 수가 많은 I/O 작업인 경우. 이러한 스레드가 보인다면, 일부 코드가 특정 스레드 풀 스케줄러(`Scheduler`) 전략을 사용하고 있음을 의미한다.

- 데이터 액세스 라이브러리 및 기타 제3자(third-party) 의존성도 자체 스레드를 생성하여 사용할 수 있다.

### 설정(Configuring)
스프링 프레임워크는 서버 시작, 중단시키는 기능을 지원하지 않는다. 서버의 스레딩 모델을 구성하려면, 서버 별 구성 API를 사용하거나 스프링 부트를 사용한다면
각 서버의 스프링 부트 구성 옵션을 확인하라. `WebClient`는
직접 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-client-builder" rel="nofollow" target="_blank">설정</a>할 수 있다.
다른 모든 라이브러리에 대해서는 각각의 문서를 참조하라.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-reactive-core">다음글 "1.2. Reactive Core" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>