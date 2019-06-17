---
layout:   post
title:    "스프링 웹플럭스 레퍼런스: 1. 스프링 웹플럭스(Spring Webflux)"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "Spring Webflux References: 1. Spring Webflux"
category: Spring
date: "2019-06-05 00:01:24"
comments: true
---

# 1. 스프링 웹플럭스(Spring Webflux)
스프링 프레임워크의 기존 웹 프레임워크인 스프링 웹 MVC는 서블릿(Servlet) API와 서블릿 컨테이너를 위한 목적으로 개발되었다. 
한편 리액티브 스택 웹 프레임워크인 스프링 웹 플럭스는 5.0 버전에 추가되었다. 이는 완전한 논 블로킹이며 리액티브 스트림 배압(Backpressure)을 지원하고
네티, 언더토우 그리고 서블릿 3.1 버전 이상 컨테이너와 같은 서버 등에서 실행된다.

두 프레임워크 모두 소스 모듈(스프링 웹 MVC와 스프링 웹플럭스)의 이름을 잘 반영하고 있으며 스프링 프레임워크에 나란히 존재한다.
각 모듈은 선택적이다. 애플리케이션은 하나 또는 다른 모듈을 사용하거나 경우에 따라서 둘 다 사용할 수 있다. (예를 들면 리액티브 `WebClient`가 있는
스프링 MVC 컨트롤러)

## 1.1. 개요(Overview)
스프링 웹플럭스는 왜 만들어졌을까?

이 의문에 대한 답의 일부는 적은 수의 스레드로 동시성을 처리하고 더 적은 하드웨어 리소스로 확장하기 위해 논 블로킹 웹 스택이 필요하다는 것이다.
서블릿 3.1은 논 블로킹 I/O를 위한 API를 제공했다. 하지만 이를 사용하면 Filter, Servlet과 같은 동기(synchronous)식과 `getParameter`,
`getPart` 등의 블로킹(blocking) 방식같은 다른 서블릿 API와의 어울리지 못한다. 이것이 논 블로킹 실행환경에서 기반 역할을 하는 새로운 공통 API가
탄생하게된 동기다. 이점은 비동기, 논 블로킹이 잘 확립된 서버(예를 들면 Netty) 때문에 중요하다.

또다른 탄생 배경은 함수형 프로그래밍(functional programming)이다. 자바 5에 어노테이션을 추가한 것처럼(어노테이션이 붙은 Rest 컨트롤러, 단위 테스트)
자바 8에서 추가된 람다 표현식은 자바의 기능적인 API를 위한 기회를 만들었다. 람다 표현식은 비동기 로직을 서술적으로 작성할 수 있게 하는 논 블로킹
애플리케이션과 연속형 API(예를 들면 `CompletableFuture`, `ReactiveX`)에게 도움이 된다. 프로그래밍 모델 레벨에서 자바 8은 스프링 웹플럭스가
어노테이션 컨트롤러와 함께 기능적인 웹 엔드포인트를 제공하도록 했다.

### 1.1.1. "리액티브" 정의(Define "Reactive")
앞서 "논 블로킹(non-blocking)"과 "기능적(functional)"에 대해서 간단히 다뤘다. 그런데 리액티브는 무엇을 의미할까?

"리액티브(reactive)"란 용어는 I/O 이벤트에 반응하는 네트워크 요소, 마우스 이벤트에 반응하는 UI 컨트롤러 등 변화에 반응하는 것을 중점으로 둔
프로그래밍 모델을 말한다. 그런 의미에서 논 블로킹(non-blocking)은 리액티브다. 이유는 블로킹되지 않고 작업이 완료되거나 데이터가 사용 가능해짐 등과 같은
알림에 반응하기 때문이다.

스프링 팀이 "리액티브"와 연관시키는 또 다른 중요한 매커니즘이 있는데 그것은 논 블로킹 백프레셔(back pressure)다. 동기식(synchronous), 명령형 코드,
블로킹 호출은 호출자를 대기하게 하는 자연스러운 형태의 백프레셔 역할을 한다. 논 블로킹 코드에서는 바른 생산자가 목적지(소비자)를 압도하지 않도록
이벤트의 속도를 제어하는 것이 중요해진다.

리액티브 스트림은 백프레셔를 통해 비동기 컴포넌트 사이의 상호 작용을 정의하는 작은 스펙(자바 9에서 채택된)이다. 예를 들어, 데이터 저장소(발행자 역할)는
HTTP 서버(구독자 역할)가 응답에 사용할 수 있는 데이터를 생성할 수 있다. 리액티브 스트림의 주요 목적은 구독자를 통해 발행자가 데이터를 얼마나 빠르게 또는
얼마나 느리게 생산할지 제어하도록 하는 것이다.

> **일반적인 질문: 만일 발행자가 속도를 늦출 수 없다면 어떻게 해야 할까?**<br>
리액티브 스트림의 목적은 오직 매커니즘과 경계를 설정하는 것이다. 발행자가 속도를 늦출 수 없는 경우에는 버퍼 사용, 버림(drop) 또는 실패(fail)할지
결정해야 한다.

### 1.1.2. 리액티브 API(Reactive API)
리액티브 스트림은 시스템의 상호 정보 교환성(interoperability)에 있어서 중요한 역할을 한다. 라이브러리 및 인프라 구성 요소에는 그렇지만
너무 로우 레벨이기 때문에 애플리케이션 API로서 덜 유용하다. 애플리케이션은 비동기 로직을 구성하기 위하여 더 높고 풍부한 함수형 API를 필요하며,
이는 자바 8 스트림 API와 유사하지만 컬렉션에 대해서만 필요한 것은 아니다. 이것이 리액티브 라이브러리의 역할이다.

리액터(Reactor)는 스프링 웹플럭스가 선택한 리액티브 라이브러리다. 리액터는 ReactiveX의 풍부한 연산자 세트를 통해 0..1(`Mono`)과 0..N(`Flux`) 형태의
데이터를 작업할 수 있는 `Mono`와 `Flux` API 유형을 제공한다. 리액터는 리액티브 스트림 라이브러리이므로 모든 리액터 연산자는 논 블로킹 백프레셔를 지원한다.
리액터는 서버측 자바에 중점을 두고 있으며 스프링과 긴밀히 협력하여 개발되었다.

웹플럭스는 리액터에 핵심 의존성을 갖지만 리액티브 스트림을 통해 다른 리액티브 라이브러리들과 상호 운용이 가능하다. 일반적으로 웹플럭스 API는 일반적인
발행자를 입력으로 받고 이를 내부적으로 리액터 타입에 맞추어 적용하고, 이를 사용하고, `Flux` 또는 `Mono`를 출력으로 반환한다.

따라서 어떤 발행자(`Publisher`)든 입력으로 전달하여 반환값에 대한 연산을 적용할 수 있지만 다른 리액티브 라이브러리와 사용하려면 반환 형태를 맞추어야 한다.
웹플럭스는 가능할때마다(예를 들어, 어노테이션이 붙은 컨트롤러) RxJava 또는 다른 리액티브 라이브러리와 쉽게 적용될 수 있다.
자세한 내용은 리액티브 라이브러리를 참조하라.

> 리액티브 API 외에도, 웹플럭스는 코틀린의 코루틴 API와 함께 사용되어 보다 명령형 스타일로 프로그래밍할 수 있다. 이후에 등장하는 코틀린 코드 샘플은
코루틴 API와 함께 제공된다.

### 1.1.3. 프로그래밍 모델(Programming Models)
스프링 웹(`spring-web`) 모듈에는 HTTP 추상화, 지원되는 서버를 위한 리액티브 스트림 어댑터, 코덱 그리고 서블릿 API와 유사하지만 논 블로킹 계약을 포함하는
핵심 웹 핸들러(`WebHandler`) API를 포함하여 스프링 웹 플럭스의 근본이 되는 리액티브 기반이 포함되어 있다.

이를 바탕으로 스프링 웹플럭스는 두 가지 프로그래밍 모델 중에서 선택할 수 있도록 한다.

- **어노테이션 컨트롤러(Annotated Controller)**: 스프링 MVC와 일치하며, `spring-web` 모듈과 동일한 어노테이션을 기반으로 한다.
스프링 MVC와 웹플럭스 컨트롤러는 리액티브(리액터와 RxJava) 반환 타입을 지원하므로 이를 구분하기가 쉽지 않다. 주목할만한 차이점 중 하나는 웹플럭스 또한
리액티브 `@RequestBody` 인수(arguments)를 지원한다는 것이다.

- **함수형 엔드포인트(Functional Endpoints)**: 람다 기반의 가벼운 함수형 프로그래밍 모델이다. 애플리케이션이 요청을 라우팅하고 처리하는데 사용할 수 있는
작은 라이브러리 또는 유틸리티 집합이라고 생각할 수 있다. 어노테이션 컨트롤러와의 큰 차이점은 애플리케이션이 어노테이션을 통해 의도를 선언하고 콜백을 받는 것과
다르게 요청을 처음부터 끝까지 처리한다는 점이다.

### 1.1.4. 적용 가능성(Applicability)
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

- 원격 서비스를 호출하는 스프링 MVC 애플리케이션인 경우 리액티브 `WebClient`를 사용해보라. 스프링 MVC 컨트롤러 메서드에서 리액티브 타입(Reactor,
RxJava 또는 기타)을 직접 반환할 수 있다. 호출 당 대기 시간이 길거나 호출 간 상호 의존성도가 높을수록 더욱 극적인 이점을 얻을 수 있다.
스프링 MVC 컨트롤러는 다른 리액티브 컴포넌트도 호출할 수 있다.

- 팀의 규모가 크다면, 논 블로킹, 함수형과 선언적 프로그래밍으로의 전환에 따른 학습 곡선(learning curve)이 가파른 점을 명심해야 한다. 전체를 전환하지
않고 시작하는 실용적인 방법은 리액티브 `WebClient`를 사용하는 것이다. 이를 넘어서면 작은 것부터 시작하여 이점을 측정해보자. 광범위한 적용이 필요한 경우,
전환이 불필요할 수 있다. 어떤 이점을 찾아야할지 확실하지 않다면, 논 블로킹 I/O 작동 방식(예를 들면, 단일 스레드 노드 js에서의 동시성)과 그 효과에 대해서
알아보라.

### 1.1.5. 서버(Servers)
스프링 웹플럭스는 톰캣, 제티, 서블릿 3.1+ 컨테이너뿐만 아니라 네티(Netty)와 언더토우(Undertow)와 같은 비 서블릿 런타임에서도 지원된다.
모든 서버는 저수준의 공통 API를 적용하여, 여러 서버에서 고급 프로그래밍 모델이 지원될 수 있도록 한다.

스프링 웹플럭스는 서버 시작 또는 중지를 위한 내장형 지원 기능이 없다. 하지만 스프링 구성 및 웹플럭스 인프라 구조(infrastructure)에서 애플리케이션을
조립하여 몇 줄의 코드로 실행할 수 있다.

스프링 부트에는 이러한 단계를 자동화하는 웹플럭스 스타터(starter)가 있다. 기본적으로 스타터는 네티(netty)를 사용하지만 메이븐(maven) 또는
그래들(gradle) 의존성을 변경하여 톰캣(tomcat), 제티(jetty) 또는 언더토우(undertow)로 쉽게 전환할 수 있다. 스프링 부트는 기본적으로 네티를 설정한다.
이유는 비동기 논 블로킹에서 더 광범위하게 사용되며 클라이언트와 서버가 리소스를 공유할 수 있기 때문이다.

톰캣(tomcat)과 제티(jetty)는 스프링 MVC와 웹플럭스 모두 함께 사용할 수 있다. 그러나 사용되는 방식이 매우 다르다는 것을 명심해야 한다. 스프링 MVC는
서블릿 블로킹 I/O에 의존하며 필요한 경우에는 서블릿 API를 직접 사용할 수 있도록 한다. 스프링 웹플럭스는 서블릿 3.1 논 블로킹 I/O에 의존하며
저수준(low-level) 어댑터 뒷단에서 서블릿 API를 사용하며 이를 직접 노출하지 않는다.

언더토우(undertow)의 경우 스프링 웹플럭스는 서블릿 API없이 언더토우 API를 직접 사용한다.

### 1.1.6. 성능(Performance)
성능에는 많은 특성과 의미가 있다. 리액티브와 논 블로킹은 일반적으로 애플리케이션의 실행 속도를 향상시키지 못한다. 어떤 경우에는(예를 들어 `WebClient`를
사용하여 원격 호출을 병렬로 실행하는 경우) 더 빨라질 수도 있다. 전반적으로 논 블로킹 방식으로 일을 처리하려면 더 많은 작업이 필요하며, 이는 필요한
처리 시간을 약간 증가시킬 수 있다.

리액티브와 논 블로킹의 주요 이점은 적은 수의 고정된 스레드와 적은 메모리로 확장할 수 있다는 것이다. 애플리케이션은 예측 가능한 방식으로 확장되기 때문에
더 탄력적으로 동작할 수 있게 한다. 하지만 이러한 이점을 보려면 약간의 지연(느리거나 예측할 수 없는 네트워크 I/O의 혼합을 포함하여을 필요로 한다.
여기서 리액티브 스택의 장점을 볼 수 있으며, 그 차이는 극적으로 나타날 수 있다.

### 1.1.7. 동시성 모델(Concurrency Model)
스프링 MVC와 스프링 웹플럭스 모두 어노테이션 컨트롤러를 지원하지만 동시성 모델과 블로킹 및 스레드에 대한 기본 가정에는 중요한 차이가 있다.

스프링 MVC(그리고 일반적인 서블릿 애플리케이션)에서는 애플리케이션이 현재 스레드(예를 들어 원격 호출)가 블로킹할 수 있다고 가정한다. 이러한 이유로 서블릿
컨테이너는 요청 처리 중에 잠재적 블로킹을 흡수하기 위해 큰 스레드 풀을 사용한다.

스프링 웹플럭스(그리고 일반적인 논 블로킹 서버)에서는 애플리케이션이 스레드를 블로킹하지 않는 것으로 가정한다. 따라서 논 블로킹 서버는 작고 고정 크기의
스레드 풀(이벤트 루프 작업자)을 사용하여 요청을 처리한다.

> "확장" 및 "작은 수의 스레드"는 모순적으로 들릴 수 있지만 현재 스레드를 절대 블로킹하지 않는 것은(대신 콜백에 의존하는 것은) 받아들일 블로킹 호출이
없기 때문에 여분의 스레드가 필요하지 않음을 의미한다.

#### 블로킹 API 호출(Invoking a Blocking API)
블로킹 라이브러리를 사용해야 하는 경우는 어떻게 해야할까? 리액터(Reactor)와 RxJava는 모두 다른 스레드에서 계속 처리할 수 있도록 `publishOn` 연산자를
제공한다. 그것은 쉬운 대안이 있음을 의미한다. 하지만 블로킹 API는 이 동시성 모델에 적합하지 않다는 것을 명심해야 한다.

#### 가변 상태(Mutable State)
리액터(Reactor)와 RxJava 에서는 연산자를 통해 로직을 선언한다. 런타임시, 데이터가 순차적으로 처리되고, 뚜렷하게 처리되는 단계에서 반응형 파이프 라인이
형성된다. 이것의 주요 이점은 파이프 라인 내의 애플리케이션 코드가 동시에 실행되지 않기 때문에 애플리케이션이 변이 가능한 상태를 보호하지 않아도 된다는 점이다.

#### 스레딩 모델(Threading Model)
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

#### 설정(Configuring)
스프링 프레임워크는 서버 시작, 중단시키는 기능을 지원하지 않는다. 서버의 스레딩 모델을 구성하려면, 서버 별 구성 API를 사용하거나 스프링 부트를 사용한다면
각 서버의 스프링 부트 구성 옵션을 확인하라. `WebClient`는 직접 설정할 수 있다. 다른 모든 라이브러리에 대해서는 각각의 문서를 참조하라.

## 1.2. 리액티브 코어(Reactive Core)
`spring-web` 모듈은 리액티브 웹 애플리케이션에 대한 다음과 같은 기본 지원이 포함한다.

- 서버 요청 처리에는 두 가지 수준의 지원이 있다.
  - HttpHandler: Reactor Netty, Undertow, Tomcat, Jetty 및 모든 Servlet 3.1+ 컨테이너용 어댑터와 함께 동작하는 HTTP 요청 핸들링을 위한
  논 블로킹 I/O 및 리액티브 스트림 기반의 기본 핸들러다.
  - WebHandler API: 약간 더 높은 수준의 요청 처리를 위한 범용적인 웹 API다. 어노테이션 컨트롤러 및 함수형 엔드포인트와 같은 구체적인 프로그래밍
  모델 위에 위치한다.

- 클라이언트 측의 경우, 리액터 네티 및 리액티브 `Jetty HttpClient`용 어댑터와 함께 논 블로킹 I/O 및 리액티브 스트림 백프레셔로 HTTP 요청을 수행하는
기본 `ClientHttpConnector` 계약이 있다. 애플리케이션에서 사용되는 고수준의 `WebClient`는 이 기본 계약을 기반으로 한다.

- 클라이언트와 서버의 경우 HTTP 요청 및 응답 컨텐츠를 직렬화(serialization)와 역직렬화(deserialization)하기 위해 코덱을 사용한다.

### 1.2.1. HttpHandler
`HttpHandler`는 요청과 응답을 처리하는 단일 메서드를 가진 간단한 계약이다. 의도적으로 최소한으로 만들어졌으며, 유일한 목적은 다른 HTTP 서버 API에 대한
최소한의 추상화이다.

다음 표는 지원되는 서버 API를 설명한다.

서버 이름 | 사용된 서버 API | 리액티브 스트림 지원
|--|--|--|
Netty | Netty API | Reactor Netty
Undertow | Undertow API | spring-web: undertow to 리액티브 스트림 브릿지
Tomcat | 서블릿 3.1 논 블로킹 I/O; byte[]에 대응하여 ByteBuffer를 읽고 쓰는 Tomcat API | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지
Jetty | 서블릿 3.1 논 블로킹 I/O; byte[]에 대응하여 ByteBuffer를 읽고 쓰는 Jetty API | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지
Servlet 3.1+ 컨테이너 | 서블릿 3.1 논 블로킹 I/O | spring-web: 서블릿 3.1 논 블로킹 I/O to 리액티브 스트림 브릿지

다음 표는 서버 의존성에 대해 설명한다(지원되는 버전도 참조할 것):

서버 이름 | 그룹 ID | 아티팩트 이름
|--|--|--|
Reactor Netty | io.projectreactor.netty | reactor-netty
Underrtow | io.undertow | undertow-core
Tomcat | org.apache.tomcat.embed | tomcat-embed-core
Jetty | org.eclipse.jetty | jetty-server, jetty-servlet

아래 코드 스니펫은 각 서버 API로 `HttpHandler` 어댑터를 사용하는 것을 보여준다.

#### 리액터 네티(Reactor Netty)
Java:
```java
HttpHandler handler = ...
ReactorHttpHandlerAdapter adapter = new ReactorHttpHandlerAdapter(handler);
HttpServer.create().host(host).port(port).handle(adapter).bind().block();
```

Kotlin:
```kotlin
val handler: HttpHandler = ...
val adapter = ReactorHttpHandlerAdapter(handler)
HttpServer.create().host(host).port(port).handle(adapter).bind().block()
```

#### 언더토우(Undertow)
Java:
```java
HttpHandler handler = ...
UndertowHttpHandlerAdapter adapter = new UndertowHttpHandlerAdapter(handler);
Undertow server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build();
server.start();
```

Kotlin:
```kotlin
val handler: HttpHandler = ...
val adapter = UndertowHttpHandlerAdapter(handler)
val server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build()
server.start()
```

#### 톰캣(Tomcat)
Java:
```java
HttpHandler handler = ...
Servlet servlet = new TomcatHttpHandlerAdapter(handler);

Tomcat server = new Tomcat();
File base = new File(System.getProperty("java.io.tmpdir"));
Context rootContext = server.addContext("", base.getAbsolutePath());
Tomcat.addServlet(rootContext, "main", servlet);
rootContext.addServletMappingDecoded("/", "main");
server.setHost(host);
server.setPort(port);
server.start();
```

Kotlin:
```kotlin
val handler: HttpHandler = ...
val servlet = TomcatHttpHandlerAdapter(handler)

val server = Tomcat()
val base = File(System.getProperty("java.io.tmpdir"))
val rootContext = server.addContext("", base.absolutePath)
Tomcat.addServlet(rootContext, "main", servlet)
rootContext.addServletMappingDecoded("/", "main")
server.host = host
server.setPort(port)
server.start()
```

#### 제티(Jetty)
Java:
```java
HttpHandler handler = ...
Servlet servlet = new JettyHttpHandlerAdapter(handler);

Server server = new Server();
ServletContextHandler contextHandler = new ServletContextHandler(server, "");
contextHandler.addServlet(new ServletHolder(servlet), "/");
contextHandler.start();

ServerConnector connector = new ServerConnector(server);
connector.setHost(host);
connector.setPort(port);
server.addConnector(connector);
server.start();
```

Kotlin:
```kotlin
val handler: HttpHandler = ...
val servlet = JettyHttpHandlerAdapter(handler)

val server = Server()
val contextHandler = ServletContextHandler(server, "")
contextHandler.addServlet(ServletHolder(servlet), "/")
contextHandler.start();

val connector = ServerConnector(server)
connector.host = host
connector.port = port
server.addConnector(connector)
server.start()
```

#### 서블릿 3.1+ 컨테이너
서블릿 3.1+ 컨테이너에 WAR로 배포하기 위해 `AbstractReactiveWebInitializer`를 확장하여 WAR에 포함해야 한다. 이 클래스는 `ServletHttpHandlerAdapter`로 `HttpHandler`를 래핑하고 이를 서블릿으로 등록한다.

### 1.2.2. WebHandler API
`org.springframework.web.server` 패키지는 HttpHandler를 기반으로 다중 WebExceptionHandler와 WebFilter 그리고 단일 WebHandler
컴포넌트의 체인을 통해 요청을 처리하기 위한 범용 웹 API 제공한다. 체인은 컴포넌트가 자동 감지되는 스프링 애플리케이션 컨텍스트에 지정하거나
빌더에 컴포넌트를 등록하여 WebHttpHandlerBuilder와 함께 사용할 수 있다.

`HttpHandler`의 목적은 서로 다른 HTTP 서버에서의 사용을 추상화하는 것이지만, `WebHandler` API는 아래와 같이 웹 애플리케이션에서 일반적으로
사용되는 보다 더 광범위한 기능을 제공하는 것을 목표로 한다.

- 속성이 있는 사용자 세션(User session with attributes)
- 요청 속성(Request attributes)
- 요청에 대한 리졸브된 Locale 또는 Principal(Resolved Locale or Principal for the request)
- 구문 분석과 캐시된 폼 데이터에 대한 액세스(Access to parsed and cached form data)
- 멀티파트 데이텅츼 추상화(Abstractions for multipart data)
- 기타 등등.. (and more..)

#### 특별한 빈 타입들(Special bean types)
아래 표는 `WebHttpHandlerBuilder`가 스프링 애플리케이션 컨텍스트에서 자동 감지하거나, 직접 등록할 수 있는 컴포넌트 목록이다.

| 빈 이름 | 빈 타입 | 개수 | 설명
|--|--|--|--|
`<any>` | `WebExceptionHandler` | 0..N | `WebFilter` 인스턴스 체인과 대상 `WebHandler`에서 예외에 대한 처리를 제공한다. 자세한 내용은 예외를 참조
`<any>` | `WebFilter` | 0..N | 타겟 `WebHandler` 전후에 인터셉터 스타일의 처리를 제공한다. 자세한 내용은 필터 참조
`webHandler` | `WebHandler` | 1 | 요청을 처리한다.
`webSessionManager` | `WebSessionManager` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출된 `WebSession` 인스턴스 관리자. 디폴트는 `DefaultWebSessionManager`
`serverCodecConfigurer` | `ServerCodecConfigurer` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출된 폼 데이터와 멀티파트 데이터를 구문 분석하기 위해 `HttpMessageReader`에 액세스. 기본적으로 `ServerCodecConfigurer.create()`
`localeContextResolver` | `LocaleContextResolver` | 0..1 | `ServerWebExchange`의 메서드를 통해 노출되는 `LocaleContext`에 대한 리졸버
`forwardedHeaderTransformer` | `ForwardedHeaderTransformer` | 0..1 | 포워드 타입 헤더를 추출 및 제거 또는 제거만 한다. 디폴트는 사용하지 않음

#### 폼 데이터(Form Data)
`ServerWebExchange`는 아래와 같은 폼 데이터 액세스 메서드를 제공한다.

Java:
```java
Mono<MultiValueMap<String, String>> getFormData();
```

Kotlin:
```kotlin
suspend fun getFormData(): MultiValueMap<String, String>
```

`DefaultServerWebExchange`는 설정된 `HttpMessageReader`를 사용하여 폼 데이터(application/x-www-form-urlencoded)를 MultiValueMap
으로 파싱한다. 기본적으로 `FormHttpMessageReader`는 `ServerCodecConfigurer` 빈에서 사용하도록 설정된다. (웹 핸들러 API 참조)

#### 멀티파트 데이터(Multipart Data)
웹 MVC.

`ServerWebExchange`는 아래와 같은 멀티파트 데이터 액세스 메서드를 제공한다.

Java:
```java
Mono<MultiValueMap<String, Part>> getMultipartData();
```

Kotlin:
```kotlin
suspend fun getMultipartData(): MultiValueMap<String, Part>
```

`DefaultServerWebExchange`는 설정된 `HttpMessageReader <MultiValueMap<String, Part>>`를 사용하여 multipart/form-data 컨텐츠를
`MultiValueMap`으로 파싱한다. 현재로서는 **Synchronoss NIO Multipart**가 유일하게 지원되는 써드파티 라이브러리며, 멀티파트 요청을 논 블로킹으로
파싱하는 유일한 라이브러리다. `ServerCodecConfigurer` 빈을 통해 활성화된다. (웹 핸들러 API 참조)

멀티파트 데이터를 스트리밍 방식으로 파싱하려면 `HttpMessageReader<Party>`에서 반환된 `Flux<Part>`를 대신 사용할 수 있다. 예를 들어, 어노테이션
컨트롤러에서 `@RequestPart`를 사용하면 이름 별로 개별 파트에 대한 `Map`과 같은 액세스를 의미한다. 따라서, 멀티파트 데이터를 전체적으로 파싱해야 한다.
반면에 `@RequestBody`를 사용하여 `MultiValueMap`으로 모으지 않고 `Flux<Part>`로 컨텐츠를 디코딩할 수 있다.

#### 전달된 헤더(Forwarded Headers)
요청이 프록시(예를 들면 로드 밸런서)를 통과하면 호스트, 포트 그리고 체계(scheme)가 변경될 수 있다. 따라서 클라이언트 관점에서 올바른 호스트, 포트 그리고
체계가 가리키는 링크를 만드는 것은 쉽지 않다.

RFC 7239는 원래 요청에 대한 정보를 제공하는데 사용할 수 있는 Forwarded HTTP 헤더를 정의한다. `X-Forwarded-Host`, `X-Forwarded-Port`,
`X-Forwarded-Proto`, `X-Forwarded-Ssl` 그리고 `X-Forwarded-Prefix` 를 포함한 다른 비표준 헤더도 있다.

`ForwardedHeaderTransformer`는 ForwardedHeader를 기반으로 요청의 호스트, 포트 그리고 체계(scheme)를 수정한 후에 해당 헤더를 제거하는
컴포넌트다. 이름이 forwardedHeaderTransformer인 빈으로 선언하면 감지되어 사용된다.

애플리케이션은 헤더가 프록시에 의해 추가되었는지 또는 악의적인 클라이언트에 의해 의도적으로 추가되었는지 알 수 없으므로 전달된 헤더(forwarded headers)의
보안 고려사항이 있다. 이것이 신뢰의 경계에 있는 프록시를 구성하여 외부에서 들어오는 신뢰할 수 없는 트래픽을 제거하도록 설정해야 하는 이유다.
`removeOnly=true`옵션으로 `ForwardedHeaderTransformer`를 구성할 수도 있다. 이 경우 헤더는 제거하지만 사용하지 않는다.

> 5.1 버전에서는 `ForwardedHeaderFilter`가 deprecated 되었고 `ForwardedHeaderTransformer`로 대체되었다. 그렇기 때문에 전달된
헤더(forwarded headers)는 exchange의 생성되기 전에 더 일찍 처리될 수 있다. 필터가 설정된 경우라면 필터 목록에서 제거되고 대신
`ForwardedHeaderTransformer`가 사용된다.


### 1.2.3. 필터
`WebHandler` API에서 `WebFilter`를 사용하여 인터셉터 스타일의 로직을 `WebHandler`의 전후에 체이닝 방식으로 적용할 수 있다.
**Webflux Config**를 사용하는 경우, `WebFilter`를 등록하는 것은 스프링 빈을 등록하는 것만큼 간단하며 빈 선언에 `@Order`를 사용하거나
`Ordered` 인터페이스를 구현하여 우선 순위를 표시할 수 있다.

#### CORS
스프링 웹플럭스는 컨트롤러의 어노테이션을 통해 CORS 설정을 세부적으로 지원한다. 그러나 스프링 시큐리티(Spring Security)와 함께 사용하는 경우
내장 `CorsFilter`를 사용하는 것을 권장한다. 이 필터는 스프링 시큐리티의 필터 체인보다 먼저 적용되어야 한다.

더 자세한 내용은 CORS와 webflux-cors를 참조하라.

### 1.2.4. 예외
`WebHandler` API에서 `WebExceptionHandler`를 사용하여 WebFilter 인스턴스와 타겟 WebHandler의 예외를 처리할 수 있다. WebFlux Config를
사용하는 경우, `WebExceptionHandler`를 등록하는 것은 스프링 빈을 등록하는 것만큼 간단하며 빈 선언에 `@Order`를 사용하거나 `Ordered` 인터페이스를
구현하여 우선 순위를 표시할 수 있다.

아래 표는 사용 가능한 `WebExceptionHandler` 구현체에 대한 설명이다.

| 예외 핸들러 | 설명 
|--|--|
`ResponseStatusExceptionHandler` | 예외의 HTTP 상태 코드에 대한 응답을 설정하여 `ResponseStatusException` 유형의 예외를 처리한다.
`WebFluxResponseStatusExceptionHandler` | 예외 유형에 상관없이 `@ResponseStatus`의 상태 코드를 결정할 수 있는 `ResponseStatusExceptionHandler`의 확장 버전이다. 이 핸들러는 **Webflux Config**에 선언한다.

### 1.2.5. 코덱(Codecs)
`spring-web`과 `spring-core` 모듈은 리액티브 스트림 백프레셔와 논 블로킹 I/O를 통하여 고수준 객체와 바이트 컨텐츠를 직렬화(serialization)하고
역직렬화(deserialization)하는 기능을 지원한다. 다음은 지원하는 기능에 대한 설명이다.

- `Encoder`와 `Decoder`는 HTTP와 무관하게 컨텐츠를 인코딩하고 디코딩하는 저수준(low level) 기능이다.
- `HttpMessageReader`와 `HttpMessageWriter`는 HTTP 메시지 컨텐츠를 인코딩하고 디코딩하기 위해 사용된다.
- 인코더는 `EncoderHttpMessageWriter`로 래핑되어 웹 애플리케이션에서 사용할 수 있도록 조정할 수 있고, 디코더는 `DecoderHttpMessageReader`로
래핑될 수 있다.

- **DataBuffer**는 다른 바이트 버퍼 표현(예를 들면 Netty ByteBuf, java.nio.ByteBuffer 등)을 추상화하며 모든 코덱은 여기서 동작한다. 관련하여
자세한 내용은 **스프링 코어**의 **데이터 버퍼 및 코덱(Data Buffers and Codecs)**를 참고하라.

`spring-core` 모듈은 `byte[]`, `ByteBuffer`, `Resource`, `String` 인코더 및 디코더 구현체를 제공한다.
`spring-web` 모듈은 Jackson JSON, Jackson Smile, JAXB2, Protocol Buffer 그리고 기타 다른 인코더와 디코더와 함께 폼 데이터,
멀티파트 컨텐츠, 서버 전송 이벤트 및 기타 처리를 위한 웹 전용 HTTP 메시지 reader/writer 구현체를 제공한다.

`ClientCodecConfigurer`와 `ServerCodecConfigurer`는 일반적으로 애플리케이션에서 사용할 코덱을 설정하고 사용자 맞춤설정(customize)을 위해
사용된다. 이부분은 **HTTP 메시지 코덱** 설정에 대한 섹션을 참조하라.

#### 잭슨(Jackson) JSON
잭슨(Jackson) 라이브러리가 있으면, JSON과 이진 JSON(Smile)이 모두 지원된다.

`Jackson2Decoder`는 아래와 같이 동작한다:

- Jackson의 비동기, 논 블로킹 파서는 바이트 청크 스트림을 각각 JSON 객체를 나타내는 `TokenBuffer`로 수집하기 위해 사용된다.
- 각 `TokenBuffer`는 Jackson의 `ObjectMapper`로 전달되어 더 높은 수준의 객체를 만든다.
- 단일값 퍼블리셔(Mono)로 디코딩할 때는, 하나의 `TokenBuffer`가 존재한다.
- 다중값 퍼블리셔(Flux)로 디코딩할 때는, 각 `TokenBuffer`는 완전히 포맷팅된 객체가 될 정도의 충분한 바이트가 수신되는 즉시 `ObjectMapper`로
전달된다. 입력 컨텐츠는 JSON 배열이거나, 컨텐츠 유형이 `application/stream+json`인 경우 **라인 구분된 JSON(line-delimited JSON)**일 수 있다.

`Jackson2Encoder`는 아래와 같이 동작한다:

- 단일값 퍼블리셔(Mono)의 경우, 간단히 `ObectMapper`로 직렬화(serialization)한다.
- `application/json`을 사용하는 다중값 퍼블리셔의 경우, 기본적으로 `Flux#collectToList()`로 값을 모은 후에 그 결과를 직렬화한다.
- `application/stream+json` 또는 `application/stream+x-jackson-smile`과 같은 스트리밍 미디어 타입의 다중값 퍼블리셔의 경우
라인 구분된 JSON(line-delimited JSON) 포맷을 이용하여 각 값을 개별적으로 인코딩, 쓰기 그리고 플러싱한다.
- SSE(Server-Sent Events)의 경우 `Jackson2Encoder`가 이벤트마다 호출되며 출력(output)은 지연없이 전달되도록 플러싱된다.

> 기본적으로 `Jackson2Encoder`와 `Jackson2Decoder` 모두 문자열(String) 타입의 요소를 지원하지 않는다. 대신에 기본 가정은 문자열 또는 문자열
시퀀스가 직렬화된 JSON 컨텐츠를 나타내며 `CharSequenceEncoder`에 의해 렌더링된다는 것이다. `Flux<String>`에서 JSON 배열을 렌더링해야 하는 경우,
`Flux#collectToList()`를 사용하고 `Mono<List<String>>`을 인코딩하라.

#### 폼 데이터(Form Data)
`FormHttpMessageReader`와 `FormHttpMessageWriter`는 `application/x-www-form-urlencoded` 컨텐츠의 디코딩과 인코딩을 지원한다.

여러 곳에서 폼 컨텐츠에 접근해야 하는 서버 측에서는 `ServerWebExchange`가 제공하는 `getFormData()` 메서드로 파싱한다.
`FormHttpMessageReader` 통해 내용을 파싱한 후 반복적인 액세스를 위해 결과를 캐싱한다. `WebHandler` API 섹션의 폼 데이터(Form Data)를 참조하라.

`getFormData()` 메서드가 호출되면, 더 이상 요청 본문에서 원래의 원본 컨텐츠는 읽을 수 없다. 이러한 이유로 애플리케이션은 요청 본문에서 원본 컨텐츠를
읽는 것 대신에 `ServerWebExchange`를 통해 캐싱된 폼 데이터에 접근하도록 한다.

#### 멀티파트(Multipart)
`MultipartHttpMessageReader`와 `MultipartHttpMessageWriter`는 `multipart/form-data` 컨텐츠의 디코딩과 인코딩을 지원한다. 결과적으로
`MultipartHttpMessageReader`는 `Flux<Part>`로의 파싱 작업은 `HttpMessageReader`에게 위임한 후에 결과를 `MultiValueMap`에 수집한다.
현재는 Synchronoss NIO Multipart가 실제 파싱에 사용된다.

여러 곳에서 멀티파트 컨텐츠에 접근해야 하는 서버 측에서는 `ServerWebExchange`가 제공하는 `getMultipartData()` 메서드로 파싱한다.
`MultipartHttpMessageReader`를 통해 내용을 파싱한 후 반복적인 액세스를 위해 결과를 캐싱한다. `WebHandler` API 섹션의 멀티파트
데이터(Multipart Data)를 참조하라.

`getMultipartData()` 메서드가 호출되면, 더 이상 요청 본문에서 원래의 원본 컨텐츠는 읽을 수 없다. 이로 인해 애플리케이션은 반복적인 맵과 같은 액세스에
대해서 `getMultipartData()` 메서드를 지속적으로 사용해야 하며, `Flux<Part>`로의 일회성 접근에는 `SynchronossPartHttpMessageReader`를
사용한다.

#### 제한(Limits)
입력 스트림의 일부 또는 전부를 버퍼링하는 `Decoder`와 `HttpMessageReader` 구현체는 메모리에서 버퍼링할 최대 바이트 사이즈를 지정할 수 있다.
입력 버퍼링이 발생하는 경우가 있다. 예를 들면 `@RequestBody byte[]`, `x-www-form-urlencoded` 등의 데이터를 다루는 컨트롤러 메서드처럼
입력이 합쳐져 단일 객체로 표현되는 경우가 있다. 또한, 구분된 텍스트(delimited text), JSON 객체의 스트림 등과 같은 입력 스트림을 분리할 때
스트리밍에서에서 버퍼링이 발생할 수 있다. 이러한 스트리밍 경우, 버퍼 바이트 사이즈 제한은 스트림에서 하나의 객체와 연결된 바이트 수에 적용된다.

버퍼 사이즈를 설정하기 위해서, 지정된 `Decoder` 또는 `HttpMessageReader`의 `maxInMemorySize` 설정이 가능한지 확인하고, Javadoc에 기본값에
대한 세부 사항이 있는지 확인할 수 있다. 서버 측에서 `ServerCodecConfigurer`은 모든 코덱을 설정할 수 있는 단일 위치를 제공한다. 관련 내용은
**HTTP 메시지 코덱**을 참조하라. 클라이언트 쪽에서는 모든 코덱에 대한 제한을 `WebClient.Builder`에서 변경할 수 있다.

`maxInMemorySize` 속성은 멀티파트 파싱에 적용되는 non-file 파트의 크기를 제한한다. 파일 파트의 경우 파트가 디스크에 기록되는 임계값을 결정한다.
디스크에 기록된 파일 파트의 경우 파트 당 디스크 공간의 양을 제한하는 `maxDiskUsagePerPart` 속성이 추가적으로 있다. 또한 `maxParts` 속성은
멀티파트 요청의 전체 사이즈를 제한한다. 웹플럭스에서 이 세가지 속성을 모두 설정하려면 미리 설정된 `MultipartHttpMessageReader` 인스턴스를
`ServerCodecConfigurer`에 설정해야 한다.

#### 스트리밍(Streaming)
`text/event-stream`, `application/stream+json`과 같은 HTTP 응답으로 스트리밍 할 때는 연결이 끊어진 클라이언트를 보다 빨리 감지할 수 있도록
주기적으로 데이터를 보내야한다. 이러한 전송은 코멘트만 있거나, 빈 SSE(Server Sent Events) 또는 심장박동(heartbeat) 역할을 하는 다른 어떠한
"동작없음(no-op)" 데이터일 수 있다.

#### 데이터 버퍼(Data Buffer)
`DataBuffer`는 웹플럭스의 바이트 버퍼를 나타낸다. 스프링 코어의 **데이터 버퍼와 코덱** 섹션에서 더 자세히 확인할 수 있다. 중요한 점은 네티(Netty)와
같은 일부 서버에서 바이트 버퍼가 풀링되고 참조 카운트되며 메모리 누수(leak)를 방지하기 위해 소비될 때 해제되어야 한다는 것이다.

데이터 버퍼를 직접 소비하거나 생산하지 않는 한, 더 높은 수준의 개체로 변환하거나 사용자 지정 코덱을 만들어 사용하거나 또는 코덱을 사용하여
고수준 객체들로/로부터 변환하는 작업을 하지 않는 이상, 웹플럭스 애플리케이션은 일반적으로 이러한 이슈에 대해서 걱정할 필요가 없다. 이러한 경우에 대해서는
**데이터 버퍼와 코덱**, 특히 **데이터 버퍼 사용**에 대한 섹션을 참조하라.

### 1.2.6. 로깅(Logging)
스프링 웹플럭스의 **DEBUG** 레벨 로깅은 가볍고, 최소화되며, 인간 친화적으로 설계되었다. 특정 문제를 디버깅할 때만 유용한 다른 정보에 비해
계속해서 가치가 있는 정보에 중점을 둔다.

**TRACE** 레벨 로깅은 일반적으로 DEBUG와 동일한 원칙을 따르지만(예를 들어, firehose가 되어선 안된다.) 어떠한 디버깅에도 사용될 수 있다.
또한 일부 로그 메시지는 TRACE와 DEBUG 레벨에서 서로 다른 수준의 세부 정보를 표시할 수 있다.

좋은 로깅은 사용 경험에서 비롯된다. 명시된 목표를 충족하지 못하는 것이 발견되면 제보하라.

#### 로그 아이디(Log Id)
웹플럭스에서는 단일 요청을 여러 스레드에서 실행할 수 있기 때문에, 특정 요청에 대한 로그 메시지의 연관성을 찾는데 스레드 ID는 유용하지 못하다.
이것이 웹플럭스 로그 메시지 앞에 기본적으로 요청별 ID가 접두사로 붙는 이유다.

서버 측에서 로그 ID는 `ServerWebExchange` 속성(LOG_ID_ATTRIBUTE)으로 저장되며 `ServerWebExchange#getLogPrefix()` 메서드를 통해
해당 ID를 기반으로 한 완전히 포맷팅된 접두사를 얻을 수 있다.. 클라이언트 측에서 로그 ID는 `ClientRequest` 속성(LOG_ID_ATTRIBUTE)로 저장되며
`ClientRequest#logPrefix()` 메서드를 통해 완전히 포맷팅된 접두사를 얻을 수 있다.

#### 민감한 데이터(Sensitive Data)
DEBUG와 TRACE 로깅은 민감한 정보를 기록할 수 있다. 그렇기 때문에 폼 파라미터와 헤더는 기본적으로 마스킹되어야 하고, 전체 로깅은 명시적으로 활성화돼야
한다.

다음 예제는 서버 측 요청에 대한 로깅 설정 방법이다:

Java:
```java
@Configuration
@EnableWebFlux
class MyConfig implements WebFluxConfigurer {

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().enableLoggingRequestDetails(true);
    }
}
```

Kotlin
```kotlin
@Configuration
@EnableWebFlux
class MyConfig : WebFluxConfigurer {

    override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
        configurer.defaultCodecs().enableLoggingRequestDetails(true)
    }
}
```

다음 예제는 클라이언트 측 요청에 대한 로깅 설정 방법이다:

Java:
```java
Consumer<ClientCodecConfigurer> consumer = configurer ->
        configurer.defaultCodecs().enableLoggingRequestDetails(true);

WebClient webClient = WebClient.builder()
        .exchangeStrategies(strategies -> strategies.codecs(consumer))
        .build();
```

Kotlin:
```kotlin
val consumer: (ClientCodecConfigurer) -> Unit  = { configurer -> configurer.defaultCodecs().enableLoggingRequestDetails(true) }

val webClient = WebClient.builder()
        .exchangeStrategies({ strategies -> strategies.codecs(consumer) })
        .build()
```

#### 사용자 지정 코덱(Custom codecs)
애플리케이션은 추가적인 미디어 유형을 지원하거나 기본 코덱에서 지원하지 않는 특정 동작을 지원하기 위해 사용자 지정 코덱을 등록할 수 있다.

개발자가 설정할 수 있는 일부 옵션은 기본 코덱에 적용된다. 사용자 지정 코덱은 버퍼링 제한 또는 민감한 데이터 로깅과 같은 설정을 필요로할 수 있다.

아래 예제는 클라이언트측 요청에 대한 설정 방법이다.

Java:
```java
WebClient webClient = WebClient.builder()
        .codecs(configurer -> {
                CustomDecoder decoder = new CustomDecoder();
                configurer.customCodecs().registerWithDefaultConfig(decoder);
        })
        .build();
```

Kotlin:
```kotlin
val webClient = WebClient.builder()
        .codecs({ configurer ->
                val decoder = CustomDecoder()
                configurer.customCodecs().registerWithDefaultConfig(decoder)
         })
        .build()
```

## 1.3. 디스패처 핸들러(Dispatcher Handler)
스프링 MVC와 유사하게 스프링 웹플럭스는 프론트 컨트롤러 패턴을 중심으로 설계되었으며 중앙의 WebHandler인 `DispatcherHandler`는 요청 처리를 위한
공유 알고리즘을 제공하며, 실제 작업은 설정 가능한 위임 컴포넌트에 의해 수행된다. 이 모델은 유연하고 다양한 작업 흐름을 지원한다.

`DispatcherHandler`는 스프링 설정에서 필요한 위임 컴포넌트를 탐색한다. 또한 스프링 빈 자체로 설계되었으며 실행되는 컨텍스트에 접근하기 위해
`ApplicationContextAware`를 구현한다. `DispatcherHandler`의 빈 이름이 webHandler로 선언되면, `WebHttpHandlerBuilder`에 의해 발견되어
사용되며 `WebHandler` API에서 설명한 것처럼 요청 처리 체인을 구성한다.

웹플럭스 애플리케이션의 스프링 설정에는 일반적으로 아래 내용이 포함된다.

- 빈 이름이 webHandler로 선언된 `DispatcherHandler`
- `WebFilter`와 `WebExceptionHandler` 빈
- `DispatcherHandler` 스페셜 빈
- 기타 등등

다음 예제와 같이 `WebHttpHandlerBuilder`에 처리 체인이 만들기 위한 설정이 제공된다.

Java:
```java
ApplicationContext context = ...
HttpHandler handler = WebHttpHandlerBuilder.applicationContext(context).build();
```

```kotlin
val context: ApplicationContext = ...
val handler = WebHttpHandlerBuilder.applicationContext(context).build()
```

위 결과 HttpHandler는 서버 어댑터와 함께 사용할 수 있다.

### 1.3.1. 특별한 빈 타입들(Special bean types)
`DispatcherHandler`는 요청을 처리하고 적절한 응답을 제공하기 위해 특별한(special) 빈에 작업을 위임한다. "특별한 빈" 은 웹플럭스 프레임워크의
스펙을 구현한 스프링이 관리하는 객체 인스턴스를 의미한다. 보통 기본적으로 제공되지만, 속성값을 변경하거나 확장 또는 다른 빈으로 대체하는 일도 가능하다.

아래 표는 `DispatcherHandler`에 의해 발견되는 특별한 빈 목록을 보여준다. 낮은 레벨(low-level)에서는 이 빈들 외에도 다른 빈들도 있다.
(WebHandler API의 **Special bean types** 참고)

| 빈 타입 | 설명 |
|-------|---------|
| `HandlerMapping` | 요청을 핸들러에 매핑한다. 매핑은 몇 가지 기준을 기반으로 하며, `HandlerMapping` 구현에 따라 달라진다. 어노테이션 컨트롤러, 단순 URL 패턴 매핑, 기타 등등 <br><br> `@RequestMapping` 어노테이션이 있는 메서드에 대한 주요 `HandlerMapping` 구현은   `RequestMappingHandlerMapping`, 함수형 엔드 포인트 라우팅에 대해서는 `RouterFunctionMapping`, URL 경로 패턴 및 WebHandler 인스턴스의 명시적 등록을 위한 `SimpleUrlHandlerMapping` 다.
| `HandlerAdapter` | 핸들러가 실제로 호출되는 방식에 관계없이 `DispatcherHandler`가 요청에 매핑된 핸들러를 실행하도록 도와준다. 예를 들어, 어노테이션 컨트롤러를 호출하려면 어노테이션 리졸빙(resolving)이 필요하다. `HandlerAdaptor`의 주요 목적은 이러한 세부 사항으로부터 `DispatcherHandler`를 가리는 것이다.
| `HandlerResultHandler`| 핸들러 실행 결과를 처리하고 응답을 완료한다. **Result Handling**을 참조하라.
