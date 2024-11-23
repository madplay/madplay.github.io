---
layout: post
title: "Spring Boot 2에서 3으로 마이그레이션할 때 꼭 확인할 변경점"
author: madplay
tags: spring springboot java migration jakarta hibernate
description: "Spring Boot 3으로 올리면 빌드부터 깨진다. 컴파일 에러를 일으키는 변경점과 수정 방법을 확인해 보자."
category: Spring
date: "2024-11-23 22:41:55"
comments: true
---

# 버전을 올려야 하는 이유, 그러나 쉽지만은 않은 길

Spring Boot 3은 Java 17 기반, Jakarta EE 9+ 네임스페이스, GraalVM 네이티브 이미지 지원 등
그동안 미뤄 왔던 플랫폼 전환을 한꺼번에 반영한 메이저 업그레이드다.
Spring Boot 2.7은 2023년 11월에 OSS 지원이 종료됐고, 보안 패치를 계속 받으려면 3.x로 올려야 한다.
다만 메이저 버전답게 빌드를 깨뜨리는 변경점이 적지 않아서, 올리겠다고 마음먹는 것과 실제로 올리는 것 사이에 꽤 간극이 있다.

> 이 글은 Spring Boot 3.4 GA(2024-11-21) 시점을 기준으로 작성했다.

<br>

# 빌드를 깨뜨리는 변경점들

## javax에서 jakarta로

Spring Boot 3으로 올릴 때 가장 먼저 빌드를 깨뜨리는 건 `javax.*` 패키지다.
Jakarta EE 9에서 패키지 이름이 `javax.*` → `jakarta.*`로 바뀌었고, Spring Boot 3은 이 새 네임스페이스를 사용한다.
`@Entity`, `HttpServletRequest`, `@NotNull` 등 프로젝트 곳곳의 `javax` 임포트가 전부 컴파일 에러를 일으킨다.

IDE 전역 치환으로 `javax.persistence` → `jakarta.persistence` 같은 패턴을 일괄 변경하면 대부분 해결된다.
다만 `javax.crypto`나 `javax.net.ssl`처럼 Java SE에 속하는 패키지는 바뀌지 않으므로,
`javax.persistence`, `javax.servlet`, `javax.validation`, `javax.annotation` 등 Jakarta EE 쪽만 골라서 바꿔야 한다.

서드파티 라이브러리가 내부적으로 `javax.*`를 참조하고 있으면 런타임에 `ClassNotFoundException`이 터진다.
의존성 트리(`./gradlew dependencies`)로 아직 `javax`를 쓰는 라이브러리가 있는지 점검해야 한다.

Gradle 의존성도 바뀐다. 기사(Article) 도메인을 예로 들면, 기존에 이렇게 선언하던 Jakarta 관련 의존성이

```groovy
// Spring Boot 2.x
implementation 'javax.validation:validation-api'
implementation 'javax.persistence:javax.persistence-api'
```

Spring Boot 3에서는 `jakarta` 네임스페이스로 교체된다. Spring Boot의 BOM이 버전을 관리하므로 직접 버전을 명시할 필요는 없다.

```groovy
// Spring Boot 3.x
implementation 'jakarta.validation:jakarta.validation-api'
implementation 'jakarta.persistence:jakarta.persistence-api'
```

<br>

## Spring Security 설정 방식 변경

Spring Security 5.7부터 `WebSecurityConfigurerAdapter`가 deprecated 되었고, Spring Boot 3(Spring Security 6)에서는 완전히 제거됐다.
기존에 이 어댑터를 상속받아 `configure` 메서드를 오버라이드하던 방식은 더 이상 쓸 수 없다.

```java
// Before (Spring Boot 2.x)
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .antMatchers("/api/articles/**").authenticated()
            .anyRequest().permitAll()
            .and()
            .httpBasic();
    }
}
```

Spring Boot 3에서는 `SecurityFilterChain`을 빈으로 등록하는 컴포넌트 기반 방식으로 바뀐다.
메서드 체이닝 API도 람다 DSL로 전환됐다.

```java
// After (Spring Boot 3.x)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/articles/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
```

`authorizeRequests()` → `authorizeHttpRequests()`, `antMatchers()` → `requestMatchers()`로 메서드 이름도 함께 바뀐 점에 주의해야 한다.
단순히 어댑터 상속만 제거하고 메서드 이름을 그대로 두면 컴파일은 통과해도 런타임에 예상과 다르게 동작할 수 있다.

<br>

## 프로퍼티 키 변경

Spring Boot 3에서 상당수의 설정 프로퍼티 키가 변경됐다.
특히 `spring.redis.*` → `spring.data.redis.*`는 Redis를 쓰는 프로젝트라면 거의 확실히 걸린다.

주요 변경 목록을 정리하면 다음과 같다.

| 변경 전 (2.x) | 변경 후 (3.x) |
|---|---|
| `spring.redis.*` | `spring.data.redis.*` |
| `spring.data.cassandra.*` | `spring.cassandra.*` |
| `spring.jpa.hibernate.use-new-id-generator-mappings` | 제거됨 (아래 Hibernate 6 ID 전략 섹션 참고) |
| `server.max-http-header-size` | `server.max-http-request-header-size` |
| `spring.security.saml2.relyingparty` | 구조 변경 |

변경된 키가 꽤 많아서 수동으로 하나씩 찾기엔 빠뜨리기 쉽다.
`spring-boot-properties-migrator`를 런타임 의존성으로 추가하면, 애플리케이션 시작 시 사용 중인 구(舊) 프로퍼티를 감지해서 경고 로그를 남겨 준다.

```groovy
// 마이그레이션 완료 후 반드시 제거할 것
runtimeOnly 'org.springframework.boot:spring-boot-properties-migrator'
```

이 라이브러리는 구 프로퍼티를 새 키로 자동 매핑해 주기도 하지만, 어디까지나 마이그레이션 과도기용이다.
작업이 끝나면 의존성에서 제거하는 것을 잊으면 안 된다. 런타임 오버헤드가 남는 건 물론이고,
의도와 다르게 구 프로퍼티가 계속 동작하면서 문제가 감춰질 수 있다.

<br>

## URL 후행 슬래시 매칭 기본값 변경

Spring Boot 2에서는 `/api/articles`와 `/api/articles/`가 같은 컨트롤러 메서드에 매칭됐다.
Spring Boot 3(Spring Framework 6)에서는 후행 슬래시 매칭이 기본적으로 비활성화됐다.
`/api/articles/`로 요청하면 404가 돌아오는 것이다.

실무에서 이 변경이 곤란한 이유는, API 게이트웨이나 프록시가 URL 끝에 슬래시를 자동으로 붙이는 경우가 종종 있기 때문이다.
백엔드 코드를 손대지 않았는데 갑자기 404가 쏟아지면 원인을 파악하기가 꽤 까다롭다.

대응 방법은 크게 세 가지다.

첫째, 컨트롤러에서 두 경로를 명시적으로 선언한다.

```java
@GetMapping({"/api/articles", "/api/articles/"})
public List<Article> getArticles() {
    // ...
}
```

둘째, 프록시나 게이트웨이 레벨에서 후행 슬래시를 제거하는 리다이렉트 규칙을 추가한다.

셋째, 서블릿 필터로 후행 슬래시를 일괄 제거한다.

```java
@Bean
public FilterRegistrationBean<UrlHandlerFilter> trailingSlashFilter() {
    FilterRegistrationBean<UrlHandlerFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(UrlHandlerFilter.trailingSlashHandler("/api/**").redirect());
    registration.addUrlPatterns("/api/*");
    return registration;
}
```

`UrlHandlerFilter`는 Spring Framework 6.2(Spring Boot 3.2)에서 추가됐다.
Boot 3.0이나 3.1을 쓰고 있다면 직접 서블릿 필터를 구현해야 한다.

어떤 방법을 택하든, 기존 API 클라이언트가 슬래시를 붙여서 호출하는지 여부를 먼저 확인하는 것이 좋다.

<br>

## HttpMethod가 enum에서 class로 변경

Spring Framework 5까지 `HttpMethod`는 Java enum이었다.
Spring Framework 6에서는 일반 class로 바뀌었다.
enum이었을 때는 WebDAV의 `LOCK`, `COPY` 같은 확장 메서드를 표현할 수 없어서 우회가 필요했는데,
class로 변경되면서 임의의 HTTP 메서드를 자유롭게 만들 수 있게 됐다.

기존에 `HttpMethod.GET` 같은 상수를 그대로 쓰는 코드는 대부분 호환되지만, `switch` 문에서 `HttpMethod`를 분기 처리하던 코드는 컴파일 에러가 난다.
enum이 아니므로 `switch`의 `case` 레이블에 쓸 수 없기 때문이다.

```java
// Before (Spring Boot 2.x) - enum이므로 switch 가능
switch (httpMethod) {
    case GET:
        // ...
        break;
    case POST:
        // ...
        break;
}
```

```java
// After (Spring Boot 3.x) - class이므로 if-else로 전환
if (httpMethod == HttpMethod.GET) {
    // ...
} else if (httpMethod == HttpMethod.POST) {
    // ...
}
```

`RestTemplate`을 쓰고 있다면 `exchange` 메서드의 시그니처 변경도 확인해야 한다.
`HttpMethod`가 class로 바뀌면서 일부 오버로딩된 메서드의 타입 추론이 달라질 수 있다.
참고로 Spring Framework 6.1부터는 <a href="/post/spring-restclient-vs-resttemplate" target="_blank">RestClient</a>가 새 동기 HTTP 클라이언트로 추가됐으므로,
마이그레이션을 기회 삼아 전환을 검토해 보는 것도 방법이다.

<br>

## Hibernate 6 ID 생성 전략 변경

앞서 프로퍼티 테이블에서 `use-new-id-generator-mappings`가 제거됐다고 언급했는데, 실무에서 데이터 정합성 문제로 이어질 수 있어 따로 짚어 둔다.

Hibernate 5에서는 `@GeneratedValue(strategy = GenerationType.AUTO)`를 쓰면 MySQL 기준으로 `TABLE` 전략이 기본이었고,
`use-new-id-generator-mappings=false`로 설정하면 데이터베이스 네이티브 전략(auto_increment)을 쓸 수 있었다.
Hibernate 6에서는 이 프로퍼티가 사라지고, `@SequenceGenerator`나 `@TableGenerator`를 명시하지 않으면
데이터베이스에 맞는 기본 전략을 자동 선택한다. MySQL이면 `IDENTITY`(auto_increment), PostgreSQL이면 `SEQUENCE`를 사용한다.

문제는 기존 데이터가 있는 테이블에서 전략이 바뀌면 ID 값이 충돌하거나 시퀀스 값이 크게 뛸 수 있다는 점이다.
마이그레이션 전에 현재 사용 중인 ID 생성 전략을 확인하고,
필요하면 `@GeneratedValue`의 `strategy`와 `generator`를 명시적으로 지정해 두는 것이 안전하다.

```java
// 기존에 AUTO를 쓰고 있었다면, 명시적으로 IDENTITY를 지정하는 편이 안전하다
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

<br>

## Auto-configuration 등록 방식 변경

Spring Boot 2에서는 `META-INF/spring.factories`에 자동 구성 클래스를 등록했다.
Spring Boot 3에서는 이 방식이 제거되고,
`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 파일에 한 줄에 하나씩 클래스를 나열하는 방식으로 바뀌었다.

```properties
# Before: META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.article.ArticleAutoConfiguration
```

```
# After: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.article.ArticleAutoConfiguration
```

애플리케이션 코드에는 `spring.factories`가 없더라도, 사내 공통 모듈이나 자체 스타터가 이 파일에 의존하고 있으면
업그레이드 후 자동 구성이 통째로 빠지면서 빈을 찾지 못하는 에러가 터진다.
공통 라이브러리를 운영하는 팀이라면 반드시 확인해야 하는 항목이다.

<br>

## @ConstructorBinding 위치 변경

`@ConfigurationProperties`와 함께 불변 바인딩을 쓸 때, Spring Boot 2에서는 클래스 레벨에 `@ConstructorBinding`을 붙였다.
Spring Boot 3에서는 생성자가 하나뿐이면 이 어노테이션이 필요 없고,
생성자가 둘 이상일 때만 바인딩에 쓸 생성자에 직접 붙여야 한다.

```java
// Before (Spring Boot 2.x)
@ConstructorBinding
@ConfigurationProperties(prefix = "article.api")
public class ArticleApiProperties {
    private final String baseUrl;
    private final int timeout;

    public ArticleApiProperties(String baseUrl, int timeout) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }
}
```

```java
// After (Spring Boot 3.x) - 생성자가 하나면 어노테이션 불필요
@ConfigurationProperties(prefix = "article.api")
public class ArticleApiProperties {
    private final String baseUrl;
    private final int timeout;

    public ArticleApiProperties(String baseUrl, int timeout) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }
}
```

클래스 레벨에 `@ConstructorBinding`이 남아 있으면 컴파일 에러가 나므로,
프로젝트 전체에서 이 어노테이션을 검색해서 정리해야 한다.

<br>

# 마이그레이션 순서와 점검 체크리스트

## 단계별 진행 순서

한 번에 Spring Boot 2.x에서 3.x로 뛰어오르기보다는 단계를 나눠서 진행하는 편이 안전하다.

**1단계: Java 17로 업그레이드한다.**
Spring Boot 3의 최소 요구사항이므로 먼저 전환하고, 기존 기능이 정상 동작하는지 확인한다.
Java 8에서 올리는 경우, Java 11에서 제거된 JAXB(`javax.xml.bind`) 등의 API를 이 단계에서 함께 정리해야 한다.

**2단계: Spring Boot 2.7 최신 패치로 올린다.**
2.7에서 deprecated 경고로 표시되는 항목들이 3.x에서 제거된 항목과 상당 부분 겹친다.
경고를 먼저 해소하면 3.x 전환 시 깨지는 범위가 줄어든다.

**3단계: Spring Boot 3.x로 올린다.**
Gradle의 Spring Boot 플러그인 버전과 `spring-boot-starter-parent`를 3.x로 변경하고,
앞서 다룬 주요 변경점을 포함해 컴파일 에러를 잡아 나간다.

<br>

## 자동화 도구와 서드파티 호환성

자동화 도구로는 **OpenRewrite**가 유용하다. `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0` 레시피를 실행하면
`javax` → `jakarta` 임포트 변환, 프로퍼티 키 변경, deprecated API 교체를 한 번에 처리해 준다.
3.1, 3.2 등 마이너 버전별 레시피도 따로 제공되므로, 목표 버전에 맞는 레시피를 선택하면 된다.

서드파티 라이브러리 호환성도 챙겨야 한다.
Querydsl은 5.0.0부터 Jakarta 네임스페이스를 지원하며, Gradle에서 `jakarta` classifier를 지정해야 한다.
MapStruct는 1.5.0부터 classpath를 자동 감지해서 `javax`와 `jakarta`를 구분한다.
Lombok은 비교적 일찍 대응이 끝났지만, 사용 중인 버전이 Spring Boot 3과 호환되는지 릴리스 노트를 확인해 두는 편이 좋다.

<br>

## 점검 체크리스트

- Java 17 이상으로 업그레이드했는가
- Spring Boot 2.7 최신 패치에서 deprecated 경고를 해소했는가
- `javax.*` → `jakarta.*` 임포트를 전환했는가 (Java SE 패키지 제외)
- Spring Security 설정을 `SecurityFilterChain` 빈 방식으로 전환했는가
- 변경된 프로퍼티 키를 모두 수정했는가
- Hibernate 6 ID 생성 전략 변경에 대응했는가 (기존 데이터와 충돌 여부 확인)
- 후행 슬래시 매칭 비활성화에 대응했는가
- `HttpMethod` switch 문 등 enum 의존 코드를 수정했는가
- Auto-configuration 등록 파일을 새 형식(`AutoConfiguration.imports`)으로 전환했는가
- `@ConstructorBinding` 클래스 레벨 사용을 제거했는가
- 서드파티 라이브러리(Querydsl, MapStruct, Lombok 등)의 Jakarta 호환 버전을 확인했는가
- `spring-boot-properties-migrator`를 추가해 누락된 프로퍼티 변경을 점검했는가
- 마이그레이션 완료 후 `spring-boot-properties-migrator`를 제거했는가

<br>

# 마무리

빌드가 통과하면 안심하기 쉽지만, 트랜잭션 동작이나 Security 필터 체인 순서처럼 런타임에 조용히 달라지는 부분은 결국 테스트가 잡아줘야 한다.
컴파일 에러를 고치는 건 마이그레이션의 절반 정도가 아닐까 싶다.

그래도 이 고비를 넘기고 나면 Java 17의 레코드와 sealed class, 개선된 GC 성능, GraalVM 네이티브 이미지 같은 것들을 마음껏 쓸 수 있다.
미루면 미룰수록 쌓이는 게 기술 부채인 만큼, 한 번 치르고 나면 한결 가벼워진 코드베이스를 만날 수 있지 않을까!

<br>

# 참고

- <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide" target="_blank" rel="nofollow">Spring Boot 3.0 Migration Guide</a>
- <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes" target="_blank" rel="nofollow">Spring Boot 3.0 Release Notes</a>
