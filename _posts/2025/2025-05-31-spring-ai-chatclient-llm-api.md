---
layout: post
title: "Spring AI로 LLM 호출 API 만들기"
author: madplay
tags: spring spring-ai springboot llm chatclient
description: "Spring AI의 ChatClient와 ChatModel 추상화 구조, 의존성 설정, LLM 연결, 간단한 채팅 API 구성까지 한 흐름으로 따라가 본다."
category: Spring
date: "2025-05-31 21:47:00"
comments: true
---

# 스프링에 LLM을 연결하는 가장 스프링다운 방법

OpenAI는 REST API를 제공한다. API 키 하나면 `HttpClient`로 GPT를 호출할 수 있고, 실제로 그렇게 시작하는 프로젝트가 많다.
문제는 그다음이다. JSON 요청 본문을 직접 조립하고, 응답을 파싱하고, 에러 코드별로 분기를 타고, 재시도 로직을 얹다 보면 코드가 순식간에 불어난다.
벤더를 바꾸고 싶어지면 호출부 전체를 뜯어고쳐야 한다.

```java
// Spring AI 없이 OpenAI를 직접 호출하는 보일러플레이트
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
    .header("Authorization", "Bearer " + apiKey)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("""
        {
          "model": "gpt-4o",
          "messages": [{"role": "user", "content": "자바 입문서 추천해줘"}]
        }
        """))
    .build();

HttpResponse<String> response = httpClient.send(request,
    HttpResponse.BodyHandlers.ofString());
// 여기서부터 JSON 파싱, 에러 처리, 재시도 로직...
```

Spring AI는 이 반복을 스프링 방식으로 거둬낸다.
`DataSource`가 JDBC 드라이버를, `RestClient`가 HTTP 라이브러리를 감췄듯, `ChatClient`가 LLM 벤더의 API 차이를 가린다.
의존성과 설정 파일만 바꾸면 OpenAI에서 Anthropic으로, 또는 로컬 Ollama로 전환할 수 있다.
이 글에서는 Spring AI의 핵심 추상화 구조를 먼저 짚고, 간단한 도서 추천 API를 만들면서 실제 사용 흐름을 따라가 본다.

<br>

# Spring AI의 핵심 추상화

## ChatModel과 ChatClient

Spring AI의 구조는 스프링의 HTTP 클라이언트 추상화와 닮아 있다.

`ChatModel`은 LLM 벤더를 감싸는 인터페이스다.
OpenAI, Anthropic, Ollama 같은 각 벤더가 이 인터페이스의 구현체를 제공한다.
`RestTemplate`이 HTTP 라이브러리를 감췄듯, `ChatModel`은 모델 벤더의 API 차이를 가린다.

`ChatClient`는 `ChatModel`을 내부에서 사용하는 플루언트 API다.
`RestTemplate`이 직접 호출 방식이라면 `RestClient`가 메서드 체이닝으로 같은 일을 더 간결하게 표현하듯,
`ChatClient`도 `.prompt().user(...).call().content()` 같은 흐름으로 LLM 호출을 구성한다.

정리하면 이런 관계다.

| HTTP 세계 | LLM 세계 | 역할 |
|---|---|---|
| `RestTemplate` | `ChatModel` | 벤더/프로토콜 추상화 |
| `RestClient` | `ChatClient` | 플루언트 API |

대부분의 애플리케이션 코드에서는 `ChatClient`를 직접 쓰게 된다.
`ChatModel`을 직접 다룰 일은 커스텀 설정이 필요한 경우 정도다.

## Prompt와 메시지 구조

LLM에 보내는 요청은 `Prompt` 객체로 표현된다.
`Prompt`는 메시지 목록을 감싸는 컨테이너이고, 각 메시지는 역할에 따라 타입이 나뉜다.

- `SystemMessage` → 모델의 행동 규칙을 정하는 시스템 프롬프트
- `UserMessage` → 사용자의 입력
- `AssistantMessage` → 모델의 응답 (대화 이력 구성 시 사용)

시스템 프롬프트와 사용자 프롬프트는 역할이 다르다.
시스템 프롬프트는 모델이 어떤 톤으로, 어떤 범위 안에서, 어떤 형식으로 답변해야 하는지를 규정하는 일종의 지시문이다.
"도서 추천 전문가처럼 행동하라", "JSON 형식으로 답변하라" 같은 규칙이 여기에 들어간다.
반면 사용자 프롬프트는 실제 질문이나 요청을 담는다. "SF 장르에서 몰입감 있는 책 한 권 추천해줘"가 사용자 프롬프트에 해당한다.

시스템 프롬프트를 잘 잡아두면 사용자가 어떤 질문을 하든 응답의 형식과 범위가 일관되게 유지된다.
반대로 시스템 프롬프트 없이 사용자 프롬프트만 보내면, 모델이 매번 다른 형식으로 답변하거나 의도하지 않은 범위까지 확장해서 답할 수 있다.

이 역할 구분이 코드 타입으로 표현되니, 메시지를 조립할 때 역할이 섞이는 실수를 컴파일 단계에서 잡을 수 있다.

<br>

# 프로젝트 구성

> 이 글의 예제는 Spring AI 1.0, Spring Boot 3.4 기준이다.

## 의존성과 BOM

Spring AI는 BOM(Bill of Materials)으로 버전을 관리한다.
스프링 부트 프로젝트에 아래 의존성을 추가하면 된다.

> 1.0 이전 마일스톤 버전에서는 `spring-ai-openai-spring-boot-starter`처럼 이름이 달랐으니,
> 기존 프로젝트를 업그레이드한다면 아티팩트명 변경에 주의해야 한다.

```groovy
dependencyManagement {
    imports {
        mavenBom "org.springframework.ai:spring-ai-bom:1.0.0"
    }
}

dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
}
```

OpenAI 대신 Anthropic을 쓰고 싶다면 아티팩트 이름만 바꾸면 된다.
`spring-ai-starter-model-openai` 자리에 `spring-ai-starter-model-anthropic`을 넣으면 `ChatModel` 구현체가 교체된다.
애플리케이션 코드에서 `ChatClient`를 쓰는 부분은 수정할 필요가 없다.

## 설정 파일

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
```

`temperature`는 0.0~2.0 범위의 값을 받으며, 낮을수록 응답이 결정적이고 높을수록 다양해진다.
다만 o1-preview, o1-mini 같은 초기 reasoning 모델은 이 값을 지원하지 않으므로, 모델을 바꿀 때는 지원 여부를 확인하는 편이 좋다.

API 키는 설정 파일에 직접 넣지 않는다. 위 예시처럼 환경 변수로 주입하거나, 시크릿 매니저를 사용하는 편이 안전하다.
로컬 개발 시에는 `.env` 파일에 키를 두고 `.gitignore`에 추가해 두면 실수로 커밋되는 것을 막을 수 있다.

> API 키가 Git 이력에 한 번이라도 들어가면 회수가 어렵다. 키를 발급받자마자 환경 변수나 시크릿 매니저에 등록하고,
> 설정 파일에는 참조만 남기는 습관이 중요하다.

<br>

# 도서 추천 API 만들기

간단한 도서 추천 API를 만들면서 `ChatClient`의 사용 흐름을 따라가 본다.
사용자가 장르와 기분을 보내면, LLM이 어울리는 책을 추천해 주는 구조다.

## 컨트롤러와 ChatClient 조립

먼저 응답을 담을 레코드를 정의한다.

```java
public record BookRecommendation(
    String title,
    String author,
    String reason
) {}
```

컨트롤러는 `ChatClient`를 주입받아 LLM 호출을 구성한다.

```java
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final ChatClient chatClient;

    public BookController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/recommend")
    public BookRecommendation recommend(
            @RequestParam String genre,
            @RequestParam String mood) {
        return chatClient.prompt()
            .user("장르: " + genre + ", 기분: " + mood + "에 어울리는 책 한 권을 추천해줘.")
            .call()
            .entity(BookRecommendation.class);
    }
}
```

`ChatClient.Builder`를 생성자로 주입받는 부분을 보자.
Spring AI의 자동 구성이 `ChatClient.Builder` 빈을 등록해 주므로, 컨트롤러에서는 `build()`만 호출하면 된다.
`.entity(BookRecommendation.class)`는 LLM 응답을 자바 객체로 바로 변환한다.
내부적으로 `BeanOutputConverter`가 JSON 스키마를 LLM에게 전달하고, 돌아온 응답을 역직렬화하는 과정까지 `ChatClient`가 처리한다.

<br>

# 시스템 프롬프트 분리

시스템 프롬프트를 코드에 직접 넣으면 수정할 때마다 재컴파일이 필요하다.
리소스 파일로 분리하면 프롬프트만 따로 관리할 수 있다.

## 리소스 파일로 템플릿 분리

Spring AI는 `{variable}` 형식의 템플릿 문법을 지원한다.
`src/main/resources/prompts/book-recommend-system.txt` 파일을 만들고 아래처럼 작성한다.

```text
당신은 도서 추천 전문가입니다.
사용자가 장르와 기분을 알려주면, 그에 어울리는 책 한 권을 추천합니다.
추천할 때는 반드시 제목, 저자, 추천 이유를 포함합니다.
추천 대상 장르: {genre}
```

## ChatClient 빈에 기본값 등록

`ChatClient` 빈을 직접 등록하면서 시스템 프롬프트를 기본값으로 설정할 수 있다.

```java
@Configuration
public class ChatClientConfig {

    @Bean
    public ChatClient chatClient(
            ChatClient.Builder builder,
            @Value("classpath:prompts/book-recommend-system.txt") Resource systemPrompt) {
        return builder
            .defaultSystem(systemPrompt)
            .build();
    }
}
```

이렇게 구성하면 컨트롤러에서 매번 시스템 프롬프트를 지정할 필요가 없다.
`chatClient.prompt().user(...)` 호출 시 시스템 프롬프트가 자동으로 포함된다.

컨트롤러도 빈으로 등록한 `ChatClient`를 바로 주입받는 방식으로 바뀐다.

```java
public BookController(ChatClient chatClient) {
    this.chatClient = chatClient;
}
```

## 프롬프트 캐싱과 비용 절감

시스템 프롬프트를 고정하면 비용 면에서도 이점이 있다.
OpenAI는 프롬프트의 앞부분이 이전 요청과 동일하면 자동으로 캐싱을 적용하고, Anthropic도 시스템 프롬프트를 캐싱 대상으로 지정할 수 있다.
캐싱이 적용되면 OpenAI는 입력 토큰 비용이 50% 할인되고, Anthropic은 캐시 읽기 시 최대 90%까지 절감된다.
응답 지연시간도 80% 이상 줄어들 수 있다.
다만 벤더마다 최소 토큰 요건(OpenAI 1,024 토큰, Anthropic 1,024~4,096 토큰)이 있으므로, 프롬프트가 길어질수록 캐싱 이점이 커진다.

<br>

# 동작 확인과 트러블슈팅

## curl로 확인

애플리케이션을 실행하고 curl로 요청을 보내본다.

```bash
curl "http://localhost:8080/api/books/recommend?genre=SF&mood=몰입"
```

정상 응답이라면 아래와 같은 JSON이 돌아온다.

```json
{
  "title": "프로젝트 헤일메리",
  "author": "앤디 위어",
  "reason": "과학적 문제 해결 과정에 깊이 몰입할 수 있는 SF 소설이다."
}
```

LLM 응답은 호출할 때마다 달라질 수 있으므로, 실제 결과는 위 예시와 다를 수 있다.

## 흔히 만나는 문제

처음 Spring AI를 연동하면 LLM 자체보다 인프라 설정에서 막히는 경우가 많다.

| 증상 | 원인 | 확인 포인트 |
|---|---|---|
| 401 Unauthorized | API 키 누락 또는 오류 | `echo $OPENAI_API_KEY`로 값이 비어 있지 않은지 확인, 복사 시 앞뒤 공백 혼입 주의 |
| 400 Bad Request | 모델명 오타, API 스펙 불일치 | `gpt-4o`를 `gpt4o`로 쓰는 식의 오타가 가장 흔함. 벤더 공식 문서에서 모델명 확인 |
| 429 Too Many Requests | 요청 속도 제한 초과 | 무료 티어는 분당 요청 수가 낮음. 요청 간격을 두거나 응답을 캐싱 |
| 타임아웃 | LLM 응답 지연 (수 초~십수 초) | `RestClient` 연결/읽기 타임아웃을 여유 있게 설정 |
| JSON 파싱 실패 | LLM이 기대한 형식 외의 응답 반환 | `temperature`를 낮추고, 시스템 프롬프트에서 출력 형식을 명시 |

타임아웃은 일반 REST API와 체감 차이가 크다. 모델이 토큰을 하나씩 생성하는 구조이므로, 긴 응답일수록 대기 시간이 늘어난다.
JSON 파싱 실패는 모델이 JSON 바깥에 설명 텍스트를 붙이거나, 필드 이름을 임의로 바꾸는 경우에 발생한다.

<br>

# 직접 HTTP 호출과 비교

Spring AI를 도입할지 판단하려면, 직접 HTTP 호출 대비 무엇을 얻고 무엇을 잃는지 함께 봐야 한다.

| 비교 항목 | 직접 HTTP 호출 | Spring AI |
|---|---|---|
| 벤더 교체 | 호출부 전체 수정 필요 | 의존성과 설정 파일만 변경 |
| 프롬프트 관리 | 문자열로 코드에 산재 | 리소스 파일 분리, 템플릿 변수 치환 지원 |
| 응답 파싱 | `ObjectMapper`로 직접 파싱, 예외 처리 | `.entity()` 한 줄로 자바 객체 변환 |
| 테스트 | 실제 API 호출 또는 HTTP 목 서버 필요 | `ChatModel` 인터페이스 목(mock) 주입 가능 |
| 벤더 고유 기능 | 제한 없이 사용 가능 | 추상화 바깥으로 내려가야 하는 경우 있음 |
| 디버깅 | 요청/응답을 직접 확인 | 추상화 계층을 한 단계 더 거슬러 올라가야 함 |
| 의존성 | 최소 (`java.net.http`만으로 가능) | Spring AI BOM + 벤더별 스타터 |

벤더를 자주 바꿀 가능성이 있거나, 프롬프트와 응답 파싱을 체계적으로 관리하고 싶다면 Spring AI가 맞는다.
반면 스트리밍 응답을 세밀하게 제어해야 하거나, 벤더 고유 기능을 깊이 쓸 계획이라면 직접 호출이 더 유연할 수 있다.

<br>

# 정리하며

스프링 생태계에 익숙한 개발자라면, LLM 연동도 같은 패턴으로 시작할 수 있다는 점이 Spring AI의 가장 큰 장점이 아닐까 싶다.

이 글에서는 `ChatClient`로 단순 호출을 구성하는 데까지 다뤘지만, Spring AI는 그 너머의 기능도 제공한다.
Advisors를 사용하면 LLM에 요청을 보내기 전에 컨텍스트를 덧붙이거나, 응답을 후처리하는 파이프라인을 구성할 수 있다.
여기에 벡터 스토어를 연동하면 외부 문서를 검색해서 프롬프트에 주입하는 RAG도 `ChatClient` 위에서 자연스럽게 확장된다.

<br>

# 참고

- <a href="https://docs.spring.io/spring-ai/reference/" target="_blank" rel="nofollow">Spring AI Reference Documentation</a>
- <a href="https://github.com/spring-projects/spring-ai" target="_blank" rel="nofollow">Spring AI GitHub Repository</a>
