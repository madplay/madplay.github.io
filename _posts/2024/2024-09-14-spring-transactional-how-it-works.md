---
layout: post
title: "Spring @Transactional은 내부에서 어떻게 동작할까?"
author: madplay
tags: spring transactional aop proxy transaction
description: "Spring @Transactional의 프록시 기반 동작 원리부터 self-invocation 함정, 전파 속성, 롤백 규칙까지 내부 메커니즘을 뜯어본다."
category: Spring
date: "2024-09-14 20:41:23"
comments: true
---

# 메서드 위에 붙인 애너테이션 한 줄이 하는 일

`@Transactional`을 메서드 위에 붙이면 트랜잭션이 알아서 시작되고, 예외가 나면 롤백되고, 정상이면 커밋된다.
너무 편리해서 내부에서 무슨 일이 벌어지는지 신경 쓰지 않게 되기 쉽다.
그런데 같은 클래스 안에서 `@Transactional` 메서드를 호출했는데 트랜잭션이 안 걸리거나,
checked exception을 던졌는데 롤백이 안 되는 상황을 마주하면 내부 동작을 모르고는 원인을 찾기 어렵다.

Spring의 `@Transactional`은 프록시 객체를 통해 동작한다.
프록시가 어떻게 생성되고, 메서드 호출 시 어떤 흐름을 타는지,
그리고 이 구조 때문에 생기는 함정들을 하나씩 짚어 볼 필요가 있다.

<br>

# 프록시가 트랜잭션을 감싸는 구조

> 이 글의 코드는 Spring Boot 3.x, Spring Framework 6.x 기준이다.

`@Transactional`이 붙은 클래스나 메서드가 있으면, Spring은 해당 빈을 등록할 때 원본 객체 대신 **프록시 객체**를 컨테이너에 넣는다.
외부에서 이 빈의 메서드를 호출하면 프록시가 먼저 호출을 가로채고, 트랜잭션을 시작한 뒤 원본 메서드를 실행하고, 결과에 따라 커밋이나 롤백을 수행한다.

```text
호출자 → 프록시 객체 → TransactionInterceptor → 원본 객체의 메서드
                         │
                         ├─ 트랜잭션 시작
                         ├─ 원본 메서드 실행
                         └─ 커밋 or 롤백
```

이 프록시를 만드는 방식은 두 가지다.

**CGLIB 프록시**는 대상 클래스의 서브클래스를 런타임에 생성한다.
Spring Boot는 기본적으로 CGLIB를 사용하므로, 인터페이스 없이 구체 클래스에 직접 `@Transactional`을 붙여도 프록시가 만들어진다.
단, 클래스가 `final`이면 서브클래스를 만들 수 없어서 프록시 생성에 실패한다.

**JDK 동적 프록시**는 대상 클래스가 구현한 인터페이스를 기반으로 프록시를 생성한다.
인터페이스에 선언된 메서드만 프록시가 가로챌 수 있고, 인터페이스에 없는 메서드는 트랜잭션이 적용되지 않는다.
Spring Boot 2.0 이전에는 이 방식이 기본값이었지만, 지금은 CGLIB가 기본이다.

디자인 패턴에서 말하는 프록시 패턴이 바로 이 지점에서 실제로 작동하는 셈이다.

<br>

# 프록시를 통과한 뒤 벌어지는 일

프록시가 메서드 호출을 가로채면 실제 트랜잭션 처리는 `TransactionInterceptor`가 담당한다.
이 인터셉터는 Spring AOP의 `MethodInterceptor`를 구현하고 있으며, 내부적으로 `TransactionManager`를 호출해 트랜잭션을 제어한다.

기사 서비스를 예로 들면 이렇다.

```java
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final IndexService indexService;

    public ArticleService(ArticleRepository articleRepository, IndexService indexService) {
        this.articleRepository = articleRepository;
        this.indexService = indexService;
    }

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        indexService.index(article);
    }
}
```

`publishArticle()`이 호출되면 내부적으로 다음 순서를 밟는다.

1. `TransactionInterceptor`가 `@Transactional` 속성을 읽는다 (전파 수준, 격리 수준, readOnly, 롤백 규칙 등).
2. `PlatformTransactionManager.getTransaction()`을 호출해 트랜잭션을 시작한다.
3. 원본 `publishArticle()` 메서드를 실행한다.
4. 예외 없이 끝나면 `commit()`, 롤백 대상 예외가 발생하면 `rollback()`을 호출한다.

> 이 흐름에서 핵심은 **프록시를 통해 호출이 들어와야만** 인터셉터가 동작한다는 점이다.
> 프록시를 거치지 않으면 트랜잭션은 시작조차 되지 않는다.

<br>

# self-invocation 함정

`@Transactional`을 쓰면서 가장 흔하게 겪는 문제가 같은 클래스 내부에서의 메서드 호출이다.

```java
@Service
public class ArticleService {

    public void processArticle(ArticleRequest request) {
        // 같은 클래스의 @Transactional 메서드를 직접 호출
        publishArticle(request);
    }

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        indexService.index(article);
    }
}
```

외부에서 `articleService.publishArticle()`을 호출하면 프록시를 경유하므로 트랜잭션이 정상 적용된다.
그런데 같은 클래스의 `processArticle()`에서 `this.publishArticle()`을 호출하면, 이 호출은 프록시가 아닌 **원본 객체의 메서드**를 직접 호출한다.
`TransactionInterceptor`를 거치지 않으므로 `@Transactional`이 붙어 있어도 트랜잭션이 시작되지 않는다.

```text
외부 → 프록시.processArticle() → 원본.processArticle() → 원본.publishArticle()
                                                        ↑
                                            프록시를 경유하지 않음 → 트랜잭션 미적용
```

## self-invocation은 어떻게 해결할까?

가장 깔끔한 방법은 트랜잭션이 필요한 로직을 별도 클래스로 분리하는 것이다.
`ArticleService`가 `ArticleTransactionService`를 주입받아 호출하면 프록시를 경유하게 된다.

```java
@Service
public class ArticleService {

    private final ArticleTransactionService transactionService;

    public ArticleService(ArticleTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public void processArticle(ArticleRequest request) {
        transactionService.publishArticle(request);
    }
}

@Service
public class ArticleTransactionService {

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        // ...
    }
}
```

`ApplicationContext`에서 자기 자신을 꺼내 호출하는 방법도 있지만, 순환 참조처럼 보여 코드 가독성이 떨어진다.
<a href="/post/why-constructor-injection-is-better-than-field-injection" target="_blank">생성자 주입을 권장하는 이유</a>에서
다룬 것처럼 의존성 구조를 명확하게 유지하려면 클래스 분리가 더 나은 선택이다.

<br>

# 전파 속성이 트랜잭션 경계를 결정한다

`@Transactional`의 `propagation` 속성은 이미 트랜잭션이 진행 중일 때 새 트랜잭션을 어떻게 처리할지 결정한다.
기본값은 `REQUIRED`이고, 실무에서 자주 쓰이는 전파 속성을 정리하면 다음과 같다.

| 전파 속성 | 동작 | 비고 |
|----------|------|------|
| `REQUIRED` (기본값) | 기존 트랜잭션이 있으면 참여, 없으면 새로 시작 | 대부분의 서비스 메서드에 적합 |
| `REQUIRES_NEW` | 항상 새 트랜잭션을 시작, 기존 트랜잭션은 일시 중단 | 외부 트랜잭션 롤백과 무관하게 독립 커밋 |
| `MANDATORY` | 기존 트랜잭션이 반드시 있어야 함, 없으면 예외 발생 | 트랜잭션 없이 호출되면 안 되는 메서드에 방어용 |
| `NESTED` | 세이브포인트 기반 중첩 트랜잭션, 중첩 롤백이 외부에 영향 없음 | `JpaTransactionManager` 미지원, `DataSourceTransactionManager`에서만 동작 |

## REQUIRED 중첩 — 예외를 잡아도 롤백되는 이유

`REQUIRED`가 기본값이므로, `@Transactional` 메서드가 다른 `@Transactional` 메서드를 호출하면 둘은 같은 물리 트랜잭션을 공유한다.
여기서 자주 겪는 함정이 있다.

```java
@Service
public class ArticleService {

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);

        try {
            indexService.index(article);  // REQUIRED — 같은 트랜잭션에 참여
        } catch (Exception e) {
            log.warn("인덱싱 실패, 무시하고 진행", e);
        }
    }
}

@Service
public class IndexService {

    @Transactional  // 기본값 REQUIRED
    public void index(Article article) {
        // 예외 발생 시 트랜잭션을 rollback-only로 마킹
        throw new RuntimeException("Elasticsearch 연결 실패");
    }
}
```

`indexService.index()`에서 예외가 발생하면 Spring은 현재 트랜잭션을 **rollback-only**로 표시한다.
외부의 `publishArticle()`이 예외를 `catch`해서 정상 흐름으로 돌아가더라도, 트랜잭션 커밋 시점에 rollback-only 상태를 감지하고
`UnexpectedRollbackException`을 던진다. 기사 저장도 함께 롤백된다.

같은 트랜잭션에 참여한 이상 내부 메서드가 롤백을 요청하면 전체가 롤백되는 것이다.
이를 피하려면 내부 메서드를 `REQUIRES_NEW`로 선언해 별도 트랜잭션으로 분리하거나,
예외가 트랜잭션 경계를 넘기 전에 트랜잭션 참여자 안에서 처리해야 한다.

## REQUIRES_NEW — 감사 로그처럼 반드시 남겨야 하는 기록

메인 비즈니스 로직의 성공/실패와 관계없이 반드시 기록을 남겨야 하는 경우에 쓰인다.

```java
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final AuditLogService auditLogService;

    // 생성자 생략

    @Transactional
    public void publishArticle(ArticleRequest request) {
        Article article = Article.create(request);
        articleRepository.save(article);
        auditLogService.log(article);  // REQUIRES_NEW로 독립 트랜잭션
    }
}

@Service
public class AuditLogService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Article article) {
        // 기사 발행 트랜잭션이 롤백되더라도 이 로그는 커밋된다
    }
}
```

다만 `REQUIRES_NEW`는 새 커넥션을 점유하므로 커넥션 풀 고갈에 주의해야 한다.
트래픽이 몰리는 구간에서 무분별하게 사용하면 커넥션 풀이 바닥나 connection timeout이 발생할 수 있다.

`MANDATORY`와 `NESTED`는 실무에서 자주 쓰이지 않지만, 위 표의 동작을 알아 두면 트랜잭션 경계를 설계할 때 선택지가 넓어진다.

<br>

# 롤백 규칙의 기본값이 직관적이지 않다

Spring의 기본 롤백 규칙은 **unchecked exception(RuntimeException과 Error)에서만 롤백**한다.
checked exception은 롤백하지 않고 커밋한다. 이 동작이 직관적이지 않아 실수가 잦다.

```java
@Transactional
public void publishArticle(ArticleRequest request) throws ExternalApiException {
    Article article = Article.create(request);
    articleRepository.save(article);
    externalNotifier.notify(article);  // checked exception을 던질 수 있는 외부 API 호출
}
```

`externalNotifier.notify()`가 `ExternalApiException`(checked exception)을 던지면,
기사는 이미 저장된 상태인데 트랜잭션은 롤백되지 않고 커밋된다. 알림 실패인데 기사가 발행되는 셈이다.

해결 방법은 `rollbackFor`를 명시하는 것이다.

```java
@Transactional(rollbackFor = Exception.class)
public void publishArticle(ArticleRequest request) throws ExternalApiException {
    // checked exception이 발생해도 롤백된다
}
```

팀에서 checked exception을 사용하는 경우가 많다면, `rollbackFor = Exception.class`를 기본으로 두는 편이 사고를 줄인다.
혹은 커스텀 예외를 RuntimeException 기반으로 설계해 기본 롤백 규칙에 맡기는 방법도 있다.

<br>

# readOnly는 단순한 힌트가 아니다

`@Transactional(readOnly = true)`는 "이 메서드에서는 데이터를 변경하지 않는다"는 선언이다.
단순한 힌트처럼 보이지만 실제로 몇 가지 최적화가 적용된다.

Hibernate를 사용하는 경우, readOnly 트랜잭션에서는 영속성 컨텍스트가 **더티 체킹(dirty checking)을 생략**한다.
엔티티의 스냅샷을 저장하지 않으므로 메모리 사용량이 줄고, 플러시 시점에 변경 감지를 건너뛰므로 성능이 향상된다.

```java
@Transactional(readOnly = true)
public ArticleDetail getArticleDetail(Long articleId) {
    return articleRepository.findById(articleId)
            .map(ArticleDetail::from)
            .orElseThrow(() -> new ArticleNotFoundException(articleId));
}
```

MySQL이나 PostgreSQL에서는 JDBC 드라이버가 읽기 전용 커넥션 힌트를 데이터베이스에 전달한다.
데이터베이스에 따라 읽기 전용 커넥션을 레플리카로 라우팅하는 설정과 조합하면,
쓰기 트래픽과 읽기 트래픽을 분산하는 효과도 얻을 수 있다.

다만 readOnly 트랜잭션 안에서 `save()`나 `delete()`를 호출하면 데이터베이스에 따라 동작이 달라진다.
일부는 묵묵히 무시하고, 일부는 예외를 던진다. readOnly를 선언했으면 실제로 변경 연산을 넣지 않는 것이 원칙이다.

## 조회 메서드에도 @Transactional을 붙여야 할까?

조회 전용 메서드에 `@Transactional(readOnly = true)`를 명시적으로 붙이는 편이 좋다.
트랜잭션 없이 조회하면 각 쿼리가 독립적인 트랜잭션으로 실행되므로,
하나의 조회 로직에서 여러 쿼리를 날릴 때 데이터 일관성이 깨질 수 있다.
readOnly를 붙이면 하나의 트랜잭션 안에서 일관된 스냅샷을 읽게 되고, 앞서 언급한 최적화도 함께 적용된다.

<br>

# 테스트에서 @Transactional이 만드는 착각

Spring의 테스트 프레임워크는 `@Transactional`이 붙은 테스트 메서드가 끝나면 자동으로 롤백한다.
데이터 정리를 신경 쓰지 않아도 돼서 편리하지만, 이 동작이 오히려 버그를 숨기는 경우가 있다.

## 트랜잭션 경계가 사라진다

```java
@SpringBootTest
@Transactional
class ArticleServiceTest {

    @Test
    void publishArticle_saves_article() {
        ArticleRequest request = new ArticleRequest("kafka-connect", "Kafka Connect 입문");
        articleService.publishArticle(request);

        Article saved = articleRepository.findBySlug("kafka-connect");
        assertThat(saved).isNotNull();
    }
}
```

이 테스트는 통과하지만, 테스트 전체가 하나의 트랜잭션 안에서 실행된다는 점이 문제다.
`publishArticle()` 내부에서 선언한 트랜잭션 경계가 실질적으로 무시된다.

프로덕션에서는 `publishArticle()`이 끝나면 트랜잭션이 커밋되고 영속성 컨텍스트가 닫힌다.
그런데 테스트에서는 테스트 메서드의 트랜잭션이 바깥을 감싸고 있으므로, `publishArticle()`의 트랜잭션은 바깥 트랜잭션에 참여만 할 뿐 독립적으로 커밋되지 않는다.
`REQUIRES_NEW`가 붙어 있어도 테스트 환경에서는 다르게 동작할 수 있어서, 전파 속성 관련 버그를 테스트에서 잡지 못하는 상황이 생긴다.

## 지연 로딩 버그를 숨긴다

```java
@SpringBootTest
@Transactional
class ArticleServiceTest {

    @Test
    void getArticleDetail_returns_tags() {
        Article article = articleRepository.findById(1L).orElseThrow();

        // article.getTags()는 LAZY 로딩
        // 테스트에서는 영속성 컨텍스트가 열려 있어 정상 동작
        assertThat(article.getTags()).hasSize(3);
    }
}
```

테스트 메서드에 `@Transactional`이 붙어 있으면 영속성 컨텍스트가 테스트 끝까지 열려 있다.
`LAZY`로 선언된 연관 엔티티를 아무 때나 접근해도 프록시가 쿼리를 날려 데이터를 가져온다.

프로덕션에서는 서비스 메서드의 트랜잭션이 끝나면 영속성 컨텍스트가 닫힌다.
그 뒤에 `getTags()`를 호출하면 `LazyInitializationException`이 발생한다.
테스트에서는 멀쩡했는데 프로덕션에서 터지는 전형적인 패턴이다.

## 테스트에서 @Transactional을 빼면

통합 테스트에서 `@Transactional`을 빼면 데이터 정리를 직접 해야 하는 번거로움이 생긴다.
대신 프로덕션과 동일한 트랜잭션 경계에서 테스트가 돌아가므로, 위에서 언급한 함정들을 사전에 발견할 수 있다.

데이터 정리 방법은 몇 가지가 있다.
`@AfterEach`에서 `deleteAll()`을 호출하거나, `@Sql` 스크립트로 테이블을 초기화하거나,
테스트 컨테이너의 데이터베이스를 매 테스트마다 초기화하는 방식이다.

```java
@SpringBootTest
class ArticleServiceTest {

    @AfterEach
    void cleanup() {
        articleRepository.deleteAllInBatch();
    }

    @Test
    void publishArticle_saves_article() {
        ArticleRequest request = new ArticleRequest("kafka-connect", "Kafka Connect 입문");
        articleService.publishArticle(request);

        Article saved = articleRepository.findBySlug("kafka-connect");
        assertThat(saved).isNotNull();
    }
}
```

모든 테스트에서 `@Transactional`을 빼야 한다는 뜻은 아니다.
단위 테스트나 간단한 리포지토리 테스트에서는 자동 롤백이 여전히 편리하다.
다만 서비스 계층의 통합 테스트에서 트랜잭션 경계나 지연 로딩 동작을 검증해야 한다면, `@Transactional`을 빼고 프로덕션과 같은 조건에서 테스트하는 편이 안전하다.

<br>

# 정리하며

`@Transactional`은 프록시를 통해 동작하고, 프록시를 거치지 않으면 트랜잭션이 적용되지 않는다.
이 한 문장이 self-invocation 문제, 전파 속성의 동작 방식, 테스트에서의 함정을 관통하는 핵심이라고 생각한다.

checked exception에서 롤백되지 않는 기본 규칙은 한 번 겪으면 잊기 어려운 실수를 만들고,
readOnly의 최적화 효과는 알고 쓰느냐 모르고 쓰느냐에 따라 쿼리 성능에 차이가 생길 수 있다.
애너테이션 한 줄이 감추고 있는 메커니즘을 이해해 두면, 트랜잭션 관련 문제를 만났을 때 원인을 좁히는 데 도움이 되지 않을까 싶다.
