---
layout:   post
title:    "Spring Cloud Config: Spring Boot 2.4 버전에서의 변경사항"
author:   Kimtaeng
tags: 	  spring springcloud
description: "스프링 부트 2.4 버전에서 적용된 Spring Cloud Config 관련 변경사항"
category: Spring
date: "2021-01-11 01:35:15"
comments: true
---

# 목차
- <a href="/post/introduction-to-spring-cloud-config">Spring Cloud Config: 소개와 예제</a>
- <a href="/post/spring-cloud-bus-example">Spring Cloud Config: Spring Cloud Bus 예제</a>
- <a href="/post/spring-cloud-config-using-git-webhook-to-auto-refresh">Spring Cloud Config: Git Webhook을 이용한 자동 갱신</a>
- Spring Cloud Config: Spring Boot 2.4 버전에서의 변경사항

<br>

# Spring Boot 2.4
> 스프링 부트 2.4 버전에서 Spring Cloud Config Client 관련 설정이 조금 변경되었다.

더 이상 `bootstrap.yml`(또는 properties 파일)을 사용하지 않는다. 이 파일은 스프링 부트 애플리케이션이 구동될 때 `application.yml`보다
먼저 로드되어, Cloud config 서버에서 정의된 설정값들을 읽기 위해 사용했었다.

스프링 부트 2.4 버전에서는 `spring.config.import` 속성을 통해 설정값을 가져오게 변경되었다.
이제 `application.yml`에 아래와 같이 정의하면 된다.

```yaml
spring:
  config:
    import: "optional:configserver:"
```

위와 같이 선언하면, 기본적으로 `http://localhost:8888`에 위치한 Cloud config 서버 연결을 시도한다.
`optional:` 접두사를 제거하면 Cloud config 서버에 연결할 수 없게 되는 경우 클라이언트는 구동되지 않는다.

서버 URL을 변경하려면 아래와 같이 선언하면 된다.
`spring.cloud.config.uri`에도 설정할 수 있으나, `import` 속성에 설정된 값이 더 우선시된다.

```yaml
spring:
  config:
    import: "optional:configserver:http://myconfigserver.com/"
```

아래와 같이 `name`과 `profile`을 지정할 수도 있다. 예를 들어, config의 이름이 "my-config", profile이 "dev"라면 아래와 같이 선언하면 된다.

```yaml
spring:
  config:
    import: "optional:configserver:http://myconfigserver.com/"
  cloud:
    config:
      name: my-config
      profile: dev
```
<br>

# 기타 참고: Spring Cloud와 Spring Boot의 버전 매핑
아래 표를 참고하여 Spring Cloud와 Boot의 버전을 맞추어 구성하면 된다.

| Spring Cloud 버전 | Spring Boot 버전 |
| -- | -- |
<a href="https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2020.0-Release-Notes" target="_blank" rel="nofollow">2020.0.x</a> (일명 Ilford) | 2.4.x
<a href="https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-Hoxton-Release-Notes" target="_blank" rel="nofollow">Hoxton</a> | 2.2.x, 2.3.x (SR5로 시작하는 버전과)
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Greenwich-Release-Notes" target="_blank" rel="nofollow">Greenwich</a> | 2.1.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Finchley-Release-Notes" target="_blank" rel="nofollow">Finchley</a> | 2.0.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes" target="_blank" rel="nofollow">Edgware</a> | 1.5.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Dalston-Release-Notes" target="_blank" rel="nofollow">Dalston</a> | 1.5.x

<br>

# 기타 참고: actuator 관련 변경사항
이번 글을 정리하면서 기존 코드를 테스트해보니, Spring Cloud Bus 관련 `actuator` 엔드 포인트가 변경된 것 같다.
`bus-env`는 `busenv`로 변경되었고, `bus-refresh`는 `busrefresh`로 변경되었다.

아래 커밋에서 변경된 것 같다.

- <a href="https://github.com/spring-cloud/spring-cloud-bus/commit/aa817ea36c2807130e8c376f62bf95fe92a7ef3a#diff-fa153554fcd4f4975d24decc84fe5412878285e1e9f761cf506671b2d42b7ca4"
target="_blank" rel="nofollow">github 참고: spring-cloud/spring-cloud-bus</a>