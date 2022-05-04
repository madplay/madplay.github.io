---
layout: post
title: "Spring Cloud OpenFeign은 무엇이고 무엇을 봐야 할까"
author: madplay
tags: spring springcloud openfeign feign msa
description: "Spring Cloud OpenFeign은 무엇이고 도입할 때는 어떤 점을 알아야 할까? 동기식 호출, 타임아웃, 재시도 등 사례 중심으로 알아보자!"
category: Spring
date: "2022-05-04 22:14:02"
comments: true
---

# 선언형 HTTP 클라이언트가 드러내는 경계

마이크로서비스를 조금만 운영해 보면 HTTP 호출 코드가 생각보다 빨리 번진다.
홈 화면 서비스가 기사 목록을 부르고, 추천 서비스가 사용자 선호도를 조회하고, 알림 서비스가 다시 주요 기사를 가져오는 식으로 호출 경로가 늘어나기 시작하면,
어디서 타임아웃을 걸고 어디서 예외를 해석하는지조차 금방 제각각이 된다.

**Spring Cloud OpenFeign은 이런 상황에서 "HTTP 호출을 인터페이스로 선언하고 스프링 방식으로 관리하자"는 목적을 가진 도구다.**
스프링 기반 서비스에서 반복되는 동기식 HTTP 호출을 정리할 때는 편리하지만, 비동기나 리액티브 처리까지 해결해 주는 도구는 아니다.
그래서 도입 자체보다도 **"어떤 종류의 호출을 여기에 맡길 것인가"**를 먼저 구분하는 편이 더 중요하다.

> 이 글은 2022년 5월 4일 시점의 Spring Cloud `2021.0.2`, Spring Boot `2.6.7` 조합을 기준으로 설명한다.

<br>

# 호출 코드가 늘어날수록 왜 더 힘들어질까

서비스 간 HTTP 호출은 처음 한두 개만 만들 때는 단순해 보인다.
`RestTemplate`이나 HTTP 클라이언트 하나를 만들고 URL을 조합해서 호출하면 되기 때문이다.
문제는 운영을 시작하고 나서부터다.

예를 들어 처음에는 아래 정도의 코드로 끝날 수 있다.

```java
public ArticleResponse getArticle(Long articleId) {
	return restTemplate.getForObject(
		"http://news-service/news/articles/{articleId}",
		ArticleResponse.class,
		articleId
	);
}
```

하지만 실제 서비스는 이렇게 단순하게 머물지 않는다.
보통은 아래 같은 조건이 곧바로 따라온다.

- 인증 헤더를 붙여야 한다
- 호출 대상마다 타임아웃을 다르게 두고 싶어진다
- 어떤 404는 비즈니스적으로 정상으로 해석해야 한다
- 어떤 500은 바로 장애로 올려야 한다
- 서비스 디스커버리를 붙이면 인스턴스 선택 문제도 생긴다

그러다 보면 같은 HTTP 호출인데도 팀마다 방식이 달라진다.
어떤 팀은 예외를 잡아 `null`을 반환하고, 어떤 팀은 공통 래퍼를 두고,
어떤 팀은 타임아웃을 1초로 두고, 어떤 팀은 아예 설정하지 않는다.
호출 코드 자체보다 더 큰 문제는 **이런 차이가 나중에 장애 분석을 어렵게 만든다는 점**이다.

예를 들어 기사 정보를 조회하는 호출이 서비스마다 아래처럼 흩어져 있다고 가정해 보자.

```java
public ArticleResponse getArticleFromHomeService(Long articleId) {
	return restTemplate.getForObject(
		"http://news-service/news/articles/{articleId}",
		ArticleResponse.class,
		articleId
	);
}

public ArticleResponse getArticleFromSearchService(Long articleId) {
	try {
		return restTemplate.getForObject(
			"http://news-service/news/articles/{articleId}",
			ArticleResponse.class,
			articleId
		);
	} catch (HttpClientErrorException.NotFound e) {
		return null;
	}
}

public ArticleLookupResult getArticleFromDigestService(Long articleId) {
	HttpHeaders headers = new HttpHeaders();
	headers.setBearerAuth(tokenProvider.getToken());

	RequestEntity<Void> request = RequestEntity
		.get(URI.create("http://news-service/news/articles/" + articleId))
		.headers(headers)
		.build();

	try {
		ResponseEntity<ArticleResponse> response = customRestTemplate.exchange(
			request,
			ArticleResponse.class
		);
		return ArticleLookupResult.success(response.getBody());
	} catch (ResourceAccessException e) {
		return ArticleLookupResult.timeout();
	} catch (HttpServerErrorException e) {
		throw new ExternalServiceException("news-service failed", e);
	}
}
```

겉으로는 모두 "기사 정보 조회"지만, 실제로는 어떤 서비스는 `null`을 반환하고,
어떤 서비스는 타임아웃을 별도 결과로 바꾸고, 어떤 서비스는 예외를 다시 던진다.
이 정도만 되어도 장애가 났을 때 "어느 서비스가 어떤 규칙으로 실패를 해석했는가"를 먼저 추적해야 한다.

Spring Cloud OpenFeign이 필요한 이유는 단순히 코드 줄 수를 줄이기 위해서가 아니다.
**호출 대상을 인터페이스로 드러내고, 설정 지점을 클라이언트 단위로 모으고, 로깅이나 인터셉터,
인코더/디코더 같은 공통 요소를 한곳으로 끌어모으기 위해서다.**

<br>

# 인터페이스 뒤에서 실제로 벌어지는 일

OpenFeign은 선언형 HTTP 클라이언트다.
"선언형"이라는 말이 조금 추상적으로 들릴 수 있는데, 여기서는
**"HTTP 호출 로직을 직접 작성하는 대신 인터페이스와 애노테이션으로 계약을 선언한다"**는 뜻으로 이해하면 된다.

스프링 없이 순수 Feign만 사용해도 비슷한 개념은 가능하지만, Spring Cloud OpenFeign은 여기에 스프링 생태계 통합을 더한다.
즉, 스프링 MVC 애노테이션을 사용해 요청을 선언하고, 스프링 빈으로 주입받고, `HttpMessageConverters`를 활용해
직렬화/역직렬화를 처리하고, Spring Cloud LoadBalancer와 연결해 서비스 이름 기반 호출까지 붙일 수 있다.

예를 들어 아래처럼 인터페이스를 선언할 수 있다.

```java

@FeignClient(name = "news-service")
public interface NewsClient {

	@GetMapping("/news/articles/{articleId}")
	ArticleResponse getArticle(@PathVariable Long articleId);
}
```

그리고 서비스에서는 구현체를 직접 만들지 않고 주입받아 사용한다.

```java

@Service
public class HomeService {

	private final NewsClient newsClient;

	public HomeService(NewsClient newsClient) {
		this.newsClient = newsClient;
	}

	public HeadlineArticle loadArticle(Long articleId) {
		ArticleResponse response = newsClient.getArticle(articleId);
		return new HeadlineArticle(response.getId(), response.getTitle());
	}
}
```

겉으로 보면 단순히 인터페이스 호출처럼 보이지만,
내부에서는 요청 메타데이터를 만들고, 인코더와 디코더를 적용하고, 필요하다면 서비스 이름으로 대상 인스턴스를 고른 뒤 HTTP 요청을 보낸다.
즉, OpenFeign은 "메서드 호출처럼 보이는 원격 호출"을 만드는 도구이지, **원격 호출의 본질을 없애는 도구는 아니다.**

이 차이를 놓치면 나중에 문제가 생긴다.
메서드 호출처럼 보여도 실제로는 네트워크 호출이므로 지연, 타임아웃, 부분 실패, 재시도, 중복 호출 시 결과가 달라지지 않아야 하는 문제 같은 분산 시스템 이슈를 그대로 안고 간다.

<br>

# 편해지는 경우와 불편해지는 경우

OpenFeign은 특히 스프링 MVC 기반 서비스에서 잘 맞는다.
컨트롤러나 서비스 계층이 대부분 동기식으로 동작하고, 다른 서비스의 REST API를 자주 호출하며, 호출 대상별 설정이 필요한 경우라면 생산성이 꽤 좋아진다.

예를 들어 이런 경우다.

- 홈 화면 서비스가 뉴스, 추천, 사용자 선호도 서비스를 자주 호출한다
- 서비스마다 타임아웃이나 인증 헤더 정책이 다르다
- 서비스 이름 기반 호출과 로드밸런싱이 필요하다
- 클라이언트별 로깅, 인터셉터, 에러 디코더를 분리해서 관리하고 싶다

반대로 모든 HTTP 호출에 OpenFeign이 잘 맞는 것은 아니다.
외부 API를 한두 군데만 간단히 호출하는 정도라면, 별도 인터페이스와 클라이언트 설정을 다 갖추는 것이 오히려 무거울 수 있다.
또 리액티브 체인(Reactive Chain)이 중요한 환경에서는 더 그렇다.

여기서 가장 흔한 오해가 나온다.
"선언형으로 작성하니 더 현대적이고, 그러니 `WebClient`보다도 더 좋은 선택 아닐까?"라는 생각인데, 그건 다른 문제를 한데 묶어서 보는 것이다.
선언형 인터페이스와 논블로킹 I/O는 같은 축이 아니다.
2022년 5월 기준 Spring Cloud OpenFeign 공식 문서는 리액티브 클라이언트, 예를 들어 `WebClient` 같은 모델을 지원하지 않는다고 설명한다.
즉 **OpenFeign은 동기식 호출 코드를 더 정리된 형태로 만드는 데 강하지, 리액티브 호출 모델로 바꿔 주는 도구는 아니다.**

<br>

# 처음 붙일 때의 기본 구조

```groovy
plugins {
    id 'org.springframework.boot' version '2.6.7'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    id 'java'
}

ext {
    set('springCloudVersion', "2021.0.2")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-loadbalancer'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

여기서 하나 주의할 점이 있다.
`@FeignClient(name = "...")`처럼 서비스 이름으로 호출하려면 `spring-cloud-starter-loadbalancer`를 함께 두는 편이 안전하다.
공식 문서에서도 LoadBalancer 연동은 지원하지만 optional dependency로 안내한다.
그래서 예제를 따라 하면서 서비스 이름 기반 호출을 기대한다면 이 의존성을 빼먹지 않는 편이 낫다.

애플리케이션에서는 `@EnableFeignClients`로 Feign 인터페이스 스캔을 활성화한다.

```java

@SpringBootApplication
@EnableFeignClients
public class NewsApplication {

	public static void main(String[] args) {
		SpringApplication.run(NewsApplication.class, args);
	}
}
```

여기서 `@FeignClient(name = "news-service")`의 `name`은 단순 별칭이 아니다.
Spring Cloud 환경에서는 이 이름이 클라이언트 식별자이자 로드밸런서 이름으로 쓰인다.
서비스 디스커버리를 사용한다면 이 이름으로 인스턴스를 찾고, 그렇지 않다면 정적 URL을 별도로 지정해야 한다.

예를 들어 디스커버리 없이 직접 URL을 고정하는 식으로도 쓸 수 있다.

```java

@FeignClient(name = "breaking-news-client", url = "${clients.breaking-news.url}")
public interface BreakingNewsClient {

	@GetMapping("/articles/{articleId}")
	ArticleResponse getArticle(@PathVariable Long articleId);
}
```

이런 구조의 장점은 **호출 대상을 코드에서 명확히 드러낸다는 점**이다.
서비스 클래스 안에서 문자열 URL을 조합하는 대신, "우리 애플리케이션이 어떤 외부 계약에 의존하는가"가 인터페이스 단위로 보인다.
규모가 커질수록 이 차이는 생각보다 크다.

<br>

# 실제 운영에서 문제가 되는 부분

OpenFeign을 처음 쓰면 인터페이스 선언 자체에만 눈이 간다.
하지만 실제로 장애를 만드는 지점은 대부분 인터페이스 선언 이후다.
예를 들어 아래 같은 결정은 성능과 안정성에 직접 영향을 준다.

- 어떤 타임아웃을 둘 것인가
- 어떤 에러를 어떻게 해석할 것인가
- 재시도를 어디까지 허용할 것인가
- 호출 모델이 동기식이라는 점을 어떻게 다룰 것인가

## 타임아웃을 어떻게 둘 것인가

원격 호출은 성공 경로보다 실패 경로가 더 중요하다.
상대 서비스가 느리거나 네트워크가 불안정할 때, 호출 스레드가 얼마나 오래 묶일지를 먼저 정해야 한다.

```yaml
feign:
  client:
    config:
      news-service:
        connectTimeout: 1000
        readTimeout: 2000
        loggerLevel: basic
```

`connectTimeout`은 연결을 맺는 데 걸리는 시간을 제어하고,
`readTimeout`은 연결 이후 응답을 기다리는 시간을 제어한다.
둘은 비슷해 보이지만 실제로 다루는 구간이 다르다.
연결 자체가 안 되는 경우와, 연결은 됐지만 상대 서비스가 너무 늦게 응답하는 경우는 운영에서 원인도 다르고 대응도 다르기 때문이다.

실무에서는 "기본값이 있으니 일단 두고 보자"는 판단이 나오기 쉽지만, 이 부분은 한 번 더 점검해 보는 편이 좋다.
**타임아웃이 길면 호출 스레드가 오래 붙잡혀 스레드 풀이 마르고,
짧으면 정상 트래픽까지 불필요하게 실패시킬 수 있다.**
그래서 타임아웃은 단순한 기능 옵션이 아니라 장애 전파 범위를 제한하는 설계값으로 보는 편이 맞다.

## 재시도를 어떻게 볼 것인가

처음에는 "재시도가 기본값이겠지?" 정도로 생각하기 쉽다.
그런데 **Spring Cloud OpenFeign은 기본으로 `Retryer.NEVER_RETRY`를 사용한다.** 즉, 순수 Feign의 기본 동작을 그대로 기대하면 안 된다.

이 차이는 생각보다 중요하다.
재시도가 없으면 일시적 네트워크 흔들림에도 바로 실패할 수 있고, 반대로 무작정 재시도를 붙이면 중복 요청이나 장애 증폭이 생길 수 있다.
결국 중요한 것은 무작정 재시도를 켜는 것이 아니라,
**해당 호출이 같은 요청을 여러 번 보내도 결과가 달라지지 않는지, 어떤 예외를 재시도 대상으로 삼을지**를 타임아웃과 함께 설계하는 것이다.

## 서버와 클라이언트를 한 인터페이스로 묶고 싶어질 때

처음 OpenFeign을 도입할 때 자주 나오는 아이디어가 있다.
"어차피 서버도 같은 스프링 MVC 애노테이션을 쓰는데, 인터페이스 하나를 서버와 클라이언트가 같이 쓰면 되지 않을까?"라는 방식이다.

```java
public interface NewsArticleApi {
	@GetMapping("/articles/{id}")
	ArticleResponse getArticle(@PathVariable Long id);
}

@RestController
public class NewsArticleController implements NewsArticleApi {
}

@FeignClient(name = "news-service")
public interface NewsArticleClient extends NewsArticleApi {
}
```

하지만 이 방식은 장기적으로 결합도를 높인다.
서버 쪽 표현 방식의 변화가 클라이언트 컴파일 경계까지 바로 전파되고, 문서나 DTO, 요청 매핑 전략이 분리되지 않기 때문이다.

공식 문서도 인터페이스 상속은 지원하지만 서버와 클라이언트 간 계약 공유 방식은 권장하지 않는다.
API 규격(계약)을 맞추는 일과 자바 인터페이스 파일을 직접 공유하는 일은 구분해야 한다.
똑같은 파일을 나눠 쓰면 서버 쪽 코드의 작은 변화가 클라이언트의 빌드 오류로 곧장 이어져 관리가 까다로워질 수 있기 때문이다.

## 메서드 호출처럼 보여서 더 위험한 경우

OpenFeign 코드가 깔끔해지는 순간 오히려 더 위험해질 때가 있다.
원격 호출이 너무 평범한 로컬 메서드 호출처럼 보여서, 개발자가 네트워크 비용과 실패 가능성을 잊어버리기 때문이다.

```java
for(Long articleId :articleIds){
ArticleResponse article = newsClient.getArticle(articleId);
    articles.

add(article);
}
```

코드만 보면 단순한 컬렉션 조회처럼 보이지만, **실제로는 원격 호출이 N번 발생한다.**
이런 구조는 지연 시간이 누적되기 쉽고, 상대 서비스 장애 시 폭발적인 호출 증가(Call amplification)를 만들어 낼 수 있다.
호출이 쉬워질수록 **"얼마나 많이, 어떤 경로로, 어떤 타임아웃으로" 호출되는지를 더 의식적으로 제어**해야 한다.

<br>

# RestTemplate, WebClient와의 경계

OpenFeign을 이해할 때는 다른 선택지와의 경계를 같이 보는 편이 낫다.
앞에서 잠깐 짚은 내용을 여기서 분리해서 보면, OpenFeign이 "무엇을 편하게 만드는가"와 "무엇까지 대신하지는 않는가"가 더 선명해진다.

## RestTemplate보다 나아지는 지점

`RestTemplate`은 호출을 코드로 직접 구성하는 방식에 가깝다.
유연하지만, 호출 대상이 많아질수록 중복 코드와 공통 설정 누수가 생기기 쉽다.
반면 OpenFeign은 **인터페이스 단위로 계약을 먼저 두고 구현을 런타임에 생성**한다.

즉, "기본 HTTP 클라이언트"라기보다 "스프링 환경에서 서비스 간 호출을 구조화하는 레이어"에 더 가깝다.
호출 대상이 여러 개이고 팀이 커질수록 이 차이가 의미를 갖는다.

## WebClient와 같은 자리에 두면 헷갈리는 이유

`WebClient`는 선언형 인터페이스 도구가 아니라 리액티브 HTTP 클라이언트다. 즉 비교 축이 다르다.
OpenFeign은 호출 선언 방식을 단순화하는 데 강하고, `WebClient`는 논블로킹 I/O와 리액티브 체인(Reactive Chain) 구성에 강하다.

그래서 "둘 중 최신 것은 무엇인가"라는 질문보다는
**"우리 서비스가 동기식 호출 정리가 필요한가, 아니면 논블로킹 처리 모델이 필요한가"**라고 묻는 편이 정확하다.
선언형 인터페이스가 필요하다고 해서 자동으로 리액티브 선택이 되는 것은 아니고,
논블로킹 I/O가 필요하다고 해서 OpenFeign 같은 선언형 클라이언트가 답이 되는 것도 아니다.

<br>

# 어떤 기준으로 판단할까

정리해 보면 OpenFeign을 검토할 때는 선언형 클라이언트 자체보다,
우리 서비스의 호출이 대부분 동기식인지, 클라이언트별 타임아웃·인증·에러 해석을 따로 관리해야 하는지,
서비스 디스커버리나 로드밸런서와 자연스럽게 연결해야 하는지부터 먼저 보는 편이 도움이 된다.

반대로 호출 수가 많지 않고, 동기식 모델도 아니고, 서비스 간 계약을 인터페이스로 구조화할 필요도 크지 않다면
다른 선택지가 더 단순할 수도 있다. OpenFeign은 호출을 감추는 도구라기보다, 호출을 더 잘 드러내고 관리하기 위한 도구에 가깝다.

<br>

# 마치며

OpenFeign은 반복적인 URL 조합과 `RestTemplate` 보일러플레이트 코드를 줄이는 데 분명 도움이 된다.
하지만 서비스가 커지고 트래픽이 몰리기 시작하면 인터페이스 뒤에 숨어버린 원격 호출의 비용이 곳곳에서 문제를 만들 수 있다.

아직 본격적으로 실무에 적용해본 적은 없지만, 나중에 깊게 적용해 볼 기회가 있다면 우리 서비스에 적절한지를 먼저 잘 판단해 보고 도입해야겠다.

<br>

# 참고

- <a href="https://docs.spring.io/spring-cloud/docs/2021.0.2/reference/htmlsingle/"
  target="_blank" rel="nofollow">Spring Cloud 2021.0.2 Reference Documentation</a>
- <a href="https://docs.spring.io/spring-cloud-openfeign/docs/3.1.2/reference/html/"
  target="_blank" rel="nofollow">Spring Cloud OpenFeign 3.1.2 Reference Documentation</a>
