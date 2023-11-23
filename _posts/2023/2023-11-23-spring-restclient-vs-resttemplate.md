---
layout: post
title: "스프링 RestClient 사용법과 RestTemplate 차이점"
author: madplay
tags: spring springboot restclient resttemplate java
description: "스프링 프레임워크 6.1의 RestClient를 기준으로 동기 HTTP 호출 구성, 예외 처리, 테스트 방식과 RestTemplate 대비 차이를 정리한다."
category: Spring
date: "2023-11-23 12:32:00"
comments: true
---

# 모던 동기 HTTP 클라이언트의 등장

스프링 생태계에서 외부 HTTP API를 호출할 때 가장 오래 쓰인 선택지는 `RestTemplate`이었다.
다만 메서드 수가 많고 오버로딩이 복잡해질수록, 호출 코드를 빠르게 읽기 어렵다는 불만도 함께 쌓였다.

`WebClient`는 이런 지점에서 훨씬 현대적인 API를 보여줬다.
메서드 체이닝 기반의 플루언트 스타일 덕분에 요청을 조립하는 흐름이 눈에 잘 들어온다.
하지만 서블릿 기반 애플리케이션에서 단순한 동기 HTTP 호출만 필요할 때는, 리액티브 클라이언트를 끌어오는 선택이 다소 크게 느껴질 수 있다.

`RestClient`는 그 사이를 메우는 도구에 가깝다.
스프링 프레임워크 6.1에서 추가되었고, 동기 호출 모델은 유지하면서도 `WebClient`에 가까운 API를 제공한다.
이미 `RestTemplate`에서 쓰던 메시지 컨버터, 인터셉터, 요청 팩토리 구성도 이어서 활용할 수 있다.

<br>

## RestTemplate의 한계와 변화

`RestTemplate`은 `getForObject`, `getForEntity`, `exchange`처럼 비슷해 보이는 메서드가 많다.
파라미터 조합도 다양해서, 익숙하지 않은 팀원이 코드를 읽을 때 호출 의도를 한 번에 파악하기 어려운 편이다.

<a href="https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-resttemplate" target="_blank" rel="nofollow">
스프링 공식 문서도</a>
`RestTemplate`을 유지보수 중심의 API로 설명한다.
완전히 폐기된 도구는 아니지만, 새 기능이 계속 추가되는 방향은 아니다. 새 코드를 쓰는 입장에서는 동기 호출이 필요하더라도 `RestClient`를 먼저 검토하는 편이 좋겠다.

<br>

# RestClient 활용 방식

인스턴스 생성부터 조회, 생성, 예외 처리까지 한 흐름으로 보면 `RestClient`의 성격이 더 잘 드러난다.

## 인스턴스 생성과 HTTP 라이브러리 교체

가장 단순한 시작점은 정적 팩터리 메서드인 `create()`다. 기본 URL이나 공통 헤더, 인터셉터처럼 재사용할 설정이 있다면 `builder()` 쪽이 다루기 편하다.

> 참고로 스프링 부트 3.2(스프링 프레임워크 6.1) 기준이다.

```java
// 기본 생성
RestClient restClient = RestClient.create();

// 빌더를 통한 커스텀 설정
RestClient customClient = RestClient.builder()
	.baseUrl("https://api.example.com")
	.defaultHeader("Accept", "application/json")
	.build();
```

기존 시스템에 세밀하게 설정된 `RestTemplate` 인스턴스가 있다면,`RestClient.create(restTemplate)`처럼 감싸서 옮겨갈 수도 있다.
전면 교체보다 점진적인 전환이 필요한 경우에 이 방식이 부담이 덜하다.

필요하다면 `requestFactory()`로 HTTP 클라이언트 구현도 바꿀 수 있다.
예를 들어 JDK `HttpClient` 기반 팩토리를 쓰면 별도 라이브러리 의존성을 크게 늘리지 않고 동기 호출 구성을 맞출 수 있다.

```java
RestClient client = RestClient.builder()
	.requestFactory(new JdkClientHttpRequestFactory())
	.build();
```

<br>

## 데이터 조회 및 생성

GET 요청은 `get()`으로 시작하고, URI 템플릿 변수도 바로 바인딩할 수 있다.
상태 코드가 성공(2xx)이고 응답 본문만 필요하면 `body()`에 원하는 타입을 넘기면 된다.

```java
// GET 요청으로 단일 게시글 조회
Article article = restClient.get()
		.uri("/articles/{id}", 1)
		.retrieve()
		.body(Article.class);
```

POST 요청도 같은 흐름으로 읽힌다. 요청 본문에 객체를 넘기면 `RestClient`가 직접 JSON 문자열을 조립하는 것이 아니라,
스프링이 이미 가지고 있는 `HttpMessageConverter` 목록에서 맞는 컨버터를 골라 직렬화를 맡긴다.

예를 들어 `contentType`이 `application/json`이고 클래스패스에 Jackson이 있다면 보통 `MappingJackson2HttpMessageConverter`가 선택된다.
이때 `ObjectMapper`에 등록해 둔 날짜 포맷, 프로퍼티 이름 전략, 커스텀 모듈 같은 설정도 함께 따라간다.
반대로 문자열이면 `StringHttpMessageConverter`, 바이트 배열이면 `ByteArrayHttpMessageConverter`처럼 본문 타입과 `Content-Type`에 따라 다른 컨버터가 동작한다.

그리고 아래와 같이 이미 `RestTemplate`에서 메시지 컨버터를 조정해 쓰고 있었다면, `RestClient.create(restTemplate)`로 옮길 때 이런 규칙도 같이 이어진다고 보면 된다.

```java
// POST 요청으로 새로운 게시글 생성
Article newArticle = new Article(null, "새로운 기사 제목");

ResponseEntity<Void> response = restClient.post()
	.uri("/articles")
	.contentType(MediaType.APPLICATION_JSON)
	.body(newArticle)
	.retrieve()
	.toBodilessEntity();
```

<br>

## 직관적인 예외 처리

`RestTemplate`에서 상태 코드별 정책을 분기하려면 `ResponseErrorHandler`를 주로 사용했다.
`RestClient`는 `retrieve()` 체인 안에서 `onStatus()`를 바로 붙일 수 있어서, 요청과 예외 정책이 한 덩어리로 읽힌다.

```java
String result = restClient.get()
	.uri("/secure-articles")
	.retrieve()
	.onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
		throw new MyCustomException("클라이언트 오류 발생: " + response.getStatusCode());
	})
	.body(String.class);
```

상태 코드별 예외 정책이 호출 코드 옆에 붙어 있으니, 어떤 응답을 비정상으로 볼지 판단하기도 수월하다.

<br>

# 더 유연한 응답 제어와 확장

기본적인 CRUD 호출만 있는 것은 아니다. 상태 코드와 헤더를 더 세밀하게 다루거나, 공통 정책을 요청 전반에 얹어야 할 때도 확장 지점이 있다.

## exchange()를 활용한 세밀한 제어

`retrieve()`는 일반적인 성공/실패 흐름을 다룰 때 충분하다. 반면 응답 상태 코드, 헤더, 본문을 한 번에 보고 직접 분기해야 하는 경우도 있다.
이때는 `exchange()`가 더 낮은 수준의 제어 지점을 제공한다.

```java
Article article = restClient.get()
        .uri("/articles/{id}", 1)
        .exchange((request, response) -> {
                if (response.getStatusCode().is4xxClientError()) {
                        throw new ArticleClientException(response.getStatusCode());
                }
                return convertResponse(response);
        });
```

여기서 `convertResponse(response)`는 팀이 이미 쓰고 있는 직렬화 규칙에 맞춰 구현하는 편 이 낫다.
`exchange()`는 모든 호출에 기본으로 쓰기보다, 정말 응답 전체를 직접 다뤄야 하는 구간에  한정하는 편이 읽기 쉽다.

## exchange() 사용 시 주의할 점

강력한 제어권을 얻는 만큼 책임도 따른다. `exchange()`를 쓰는 순간 `onStatus()`가 자동으로 적용되지 않으므로, 예외 전환과 응답 변환을 코드에서 직접 결정해야 한다.

특히 주의할 점은 응답 스트림의 소비(Consume)다. 응답을 읽지 않고 버리면 **연결 누수(Connection Leak)**가 발생할 수 있다.
기본 `exchange((request, response) -> ...)` 오버로드는 교환 함수가 끝난 뒤 프레임워크가 알아서 응답을 닫아준다.
따라서 본문 변환 로직도 이 함수 안에서 끝내는 편이 안전하다.
만약 응답 스트림을 함수 밖으로 열어 둬야 하는 특수한 경우라면 `exchange(exchangeFunction, false)` 같은 오버로드를 사용하고,
호출 쪽에서 반드시 `response.close()`를 명시적으로 호출해야 한다.

## 인터셉터 활용

모든 요청에 공통 헤더를 넣거나 요청과 응답을 로깅하려면 인터셉터가 유용하다.
`RestTemplate`에서 쓰던 `ClientHttpRequestInterceptor`를 그대로 재사용할 수 있어
점진적인 마이그레이션에도 잘 맞는다.

> 여기서 토큰 값을 코드에 직접 넣는 방식은 예시로만 보자.
> 실제 운영 환경에서는 설정값, 시크릿 저장소 등 교체 가능한 경로로 분리해 두어야 노출 위험과 교체 비용을 함께 줄일 수 있다.

```java
RestClient restClient = RestClient.builder()
	.baseUrl("https://api.example.com")
	.requestInterceptor((request, body, execution) -> {
		request.getHeaders().add("Authorization", "Bearer my-token");
		return execution.execute(request, body);
	})
	.build();
```

<br>

# 테스트 환경 구성

새 HTTP 클라이언트를 도입할 때는 테스트 구성이 함께 따라와야 한다.
`RestClient`도 `@RestClientTest`와 `MockRestServiceServer`를 사용해
외부 서버 없이 호출 계약을 검증할 수 있다.

> `RestClient.Builder`를 주입받아 쓰는 경우에는
> `MockRestServiceServer`의 기대값에 전체 URI를 써야 하는 경우가 있다.
> `baseUrl`을 어떻게 설정했는지와 함께 보는 편이 안전하다.

```java

@RestClientTest(ArticleService.class)
class ArticleServiceTest {

	@Autowired
	private ArticleService articleService;

	@Autowired
	private MockRestServiceServer mockServer;

	@Test
	void getArticleTest() {
		mockServer.expect(requestTo("https://api.example.com/articles/1"))
			.andRespond(withSuccess("{\"id\":1, \"title\":\"테스트 게시글\"}", MediaType.APPLICATION_JSON));

		Article article = articleService.getArticle(1);

		assertThat(article.getTitle()).isEqualTo("테스트 게시글");
	}
}
```

실제 네트워크를 열지 않고도 요청 URI, 헤더, 응답 본문을 검증할 수 있다.
클라이언트 전환이나 예외 처리 정책 변경에도 테스트를 붙이기 좋다.

<br>

# OpenFeign과의 비교

스프링 생태계에서 비교 대상으로 자주 언급되는 도구는 OpenFeign이다.
OpenFeign은 인터페이스와 어노테이션으로 외부 API를 선언적으로 표현하는 데
강점이 있다.
마이크로서비스 간 호출 규약이 비교적 고정적일 때는 유지보수성이 좋다.

반면 `RestClient`는 요청을 코드로 조립하는 방식이다.
엔드포인트 수가 많지 않고, 호출마다 헤더나 예외 처리 정책이 조금씩 달라지는 경우라면 이 편이 더 단순할 수 있다.
반대로 외부 API 표면이 넓고 계약을 인터페이스로 정리해 두는 편이 중요하다면, OpenFeign 같은 선언형 클라이언트가 더 잘 맞을 수 있다.
OpenFeign 자체의 사용 방식 <a href="{{ site.baseurl }}/post/spring-cloud-openfeign">Spring Cloud OpenFeign은 무엇이고 무엇을 봐야 할까</a> 글에서 따로 정리해 두었다.

<br>

# 정리하며

`RestClient`는 `RestTemplate`을 당장 모두 걷어내기 위한 도구라기보다, 새 동기 HTTP 호출 코드를 더 읽기 쉽게 쓰기 위한 선택지에 가깝다.
특히 새 모듈이나 새 연동을 추가하는 시점이라면 먼저 검토해 볼 만하다.

이미 운영 중인 `RestTemplate` 호출이 안정적으로 돌아간다면 무리하게 한 번에 바꿀 필요는 없다.
다만 새 코드를 쓸 때는 `RestClient`를 기본 후보로 두고, 응답 제어 수준이나 테스트 방식까지 함께 비교해 보는 편이 도움이 된다.

결국 새 도구를 들일지 말지는, 성능 수치보다 그 코드를 동료들이 얼마나 자연스럽게 읽고 유지할 수 있는지에 더 가까워진다.
