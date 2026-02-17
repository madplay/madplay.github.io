---
layout: post
title: "Docker Compose Specification으로 로컬 환경 구성하기"
author: madplay
tags: docker compose specification
description: "Docker Compose Specification 기준으로 로컬 백엔드 환경을 일관되게 구성하는 방법을 정리한다."
category: Infra
date: "2023-05-29 23:10:00"
comments: true
---

# 목차
- <a href="/post/what-is-docker-compose" target="_blank">Docker Compose란 무엇일까?</a>
- Docker Compose Specification으로 로컬 백엔드 환경 구성하기
- <a href="/post/docker-compose-operation-patterns" target="_blank">Docker Compose 운영 패턴과 환경별 설정 전략</a>

<br>

# 스펙 관점으로 설정 읽기

로컬 개발 환경이 사람마다 다르면, 같은 브랜치에서도 재현되지 않는 버그가 자주 생긴다.
이때 Docker Compose를 "도구"로만 보는 것보다 Compose Specification이라는 "계약"으로 이해하면 설정의 의미가 훨씬 명확해진다.

이번 글은 스펙에 있는 핵심 항목을 기준으로, 백엔드 개발에서 바로 쓸 수 있는 `compose.yaml` 구성을 정리한다.

<br>

# 개념 다시 정리하기

기존 도커 기본 글을 읽었더라도, Compose를 쓸 때 헷갈리는 단어는 다시 짚고 넘어가면 이해에 도움이 된다.

- 이미지(Image): 컨테이너를 실행하기 위한 읽기 전용 템플릿이다.
- 컨테이너(Container): 이미지를 실행한 프로세스다. 종료되면 상태가 사라질 수 있다.
- 볼륨(Volume): 컨테이너가 종료되어도 유지되는 데이터 저장소다.
- 네트워크(Network): Compose가 서비스 간 통신을 위해 자동으로 만드는 내부 네트워크다.

아래는 단순한 예시다.

```yaml
services:
  app:
    image: eclipse-temurin:17-jre
    command: ["java", "-version"]
```

`services` 아래에 실행 단위를 나열하는 것이 Compose의 시작점이다. 주의할 점은 이 상태만으로는 애플리케이션 코드나 설정 파일이 없으므로,
실제 서비스 실행에는 `build`, `volumes`, `environment` 같은 추가 항목이 필요하다는 점이다.

<br>

# 실전 compose.yaml 구성 예시
백엔드 프로젝트에서는 보통 앱, DB, 캐시를 같이 띄운다. 아래 예시는 Spring Boot 애플리케이션 + MySQL + Redis 조합이다.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: order-api
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: local
      DB_HOST: mysql
      DB_PORT: "3306"
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started

  mysql:
    image: mysql:8.0
    container_name: order-mysql
    environment:
      MYSQL_DATABASE: order
      MYSQL_USER: order_user
      MYSQL_PASSWORD: order_pw
      MYSQL_ROOT_PASSWORD: root_pw
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -proot_pw"]
      interval: 10s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    container_name: order-redis

volumes:
  mysql-data:
```

이 예시에서 주로 볼 포인트는 세 가지다.

- `depends_on`은 "시작 순서"와 "준비 상태"를 명시한다.
- `healthcheck`는 앱이 의존 서비스를 사용할 수 있는 시점을 판단하는 기준이 된다.
- DB 데이터는 named volume에 두어 컨테이너 재생성 시에도 유지한다.

참고로 `healthcheck` 명령은 해당 컨테이너 내부에서 실행되므로, MySQL 예시의 `127.0.0.1`은 컨테이너 내부 루프백 주소를 의미한다.

주의할 점은 `depends_on`만으로 모든 초기화 완료를 보장하기 어렵다는 점이다.
예를 들어 DB 마이그레이션이 길어지는 경우 앱 단에서도 연결 재시도와 타임아웃을 별도로 둬야 한다.
그리고 예시처럼 `container_name`을 고정하면 개발 중에는 편하지만, 서비스 스케일링(복수 인스턴스 실행)이 필요한 경우 제약이 생길 수 있다.

<br>

# 오류를 일시 문제와 영구 문제로 나누기

Compose 설정만으로는 애플리케이션 레벨의 오류 성격까지 판단할 수 없다.
실무에서는 DB 연결 실패를 일시 오류(재시도 가능), 스키마 불일치나 필수 설정 누락을 영구 오류(즉시 실패)로 분리해 다루는 경우가 많다.

```java
@Slf4j
@Component
public class StartupDependencyChecker {

    public void verify(String requestId, String serviceName) {
        try {
            // DB/Redis ping 같은 짧은 검증 호출
            pingDependency(serviceName);
            log.info("dependency-ready requestId={} serviceName={}", requestId, serviceName);
        } catch (SocketTimeoutException e) {
            // 일시 오류: 네트워크 지연, 초기 부팅 지연
            log.warn("dependency-timeout requestId={} serviceName={} message={}",
                    requestId, serviceName, e.getMessage());
            throw new RetryableDependencyException(e);
        } catch (AuthenticationException | IllegalStateException e) {
            // 영구 오류: 잘못된 계정, 잘못된 설정
            log.error("dependency-invalid-config requestId={} serviceName={} message={}",
                    requestId, serviceName, e.getMessage());
            throw new NonRetryableDependencyException(e);
        }
    }

    private void pingDependency(String serviceName) {
        // 예시 코드
    }
}
```

로그에는 최소한 `requestId`, `serviceName` 같은 컨텍스트를 남겨야 장애 분석 시간이 줄어든다.
Kafka나 메시지 처리 서비스라면 `key`, `partition`, `offset`도 함께 남기면 분석에 유리한 경우가 많다.

<br>

# 환경 변수와 시크릿 운영 기준

로컬 환경에서는 `environment` 또는 `env_file`이 간단하다.
하지만 비밀번호, 토큰 같은 민감한 값은 이미지에 bake-in 하지 않고 실행 시 주입하는 원칙을 유지하는 편이 일반적이다.

```yaml
services:
  app:
    image: myorg/order-api:latest
    env_file:
      - .env.local
    environment:
      REQUEST_TIMEOUT_MS: "1500"
      RETRY_MAX_ATTEMPTS: "3"
```

타임아웃과 재시도 횟수를 환경 변수로 둔 이유는 명확하다.
외부 의존성 지연은 언제든 생길 수 있고, 값 튜닝을 코드 재배포 없이 해야 하기 때문이다.

주의할 점은 재시도를 무조건 늘리기보다 멱등성(idempotency)을 먼저 점검하는 편이 보통 더 낫다는 점이다.
결제 승인이나 포인트 적립처럼 중복 실행이 위험한 작업은 멱등 키를 기준으로 중복 처리를 막아야 한다.

<br>

# Compose 운영 전 체크리스트

Compose는 로컬 개발용에서도 활용 범위가 넓지만, 아래 항목은 기본 점검 목록으로 두는 경우가 많다.

- 서비스별 `healthcheck` 존재 여부
- DB/메시지 처리 코드의 타임아웃 설정 여부
- 재시도 대상이 일시 오류로만 제한되는지
- 로그에 요청 식별자와 메시지 컨텍스트가 남는지
- 볼륨/네트워크 이름 충돌이 없는지

특히 성능 측면에서는 불필요한 bind mount와 과도한 로그 레벨이 개발 머신 I/O 비용을 크게 높일 수 있다.
로컬에서 체감이 느리다면 `docker stats`와 애플리케이션 로그 양부터 점검하는 접근이 비교적 빠를 수 있다.

<br>

다음 글에서는 운영 환경에서 자주 부딪히는 패턴을 중심으로 `profiles`, 다중 파일 오버라이드, 환경 변수 우선순위를 정리한다.

- 다음 글: <a href="/post/docker-compose-operation-patterns" target="_blank">Docker Compose 운영 패턴과 환경별 설정 전략</a>

# 참고
- <a href="https://compose-spec.io/" target="_blank" rel="nofollow">Compose Specification</a>
- <a href="https://docs.docker.com/compose/" target="_blank" rel="nofollow">Docker Docs: Compose</a>
- <a href="https://docs.docker.com/reference/compose-file/services/" target="_blank" rel="nofollow">Docker Docs: Compose file reference - services</a>
