---
layout: post
title: "Docker Compose 운영 패턴과 환경별 설정 전략"
author: madplay
tags: docker compose profiles env
description: "Docker Compose를 운영 관점에서 사용할 때 자주 쓰는 패턴과 주의사항을 정리한다."
category: Infra
date: "2023-06-01 22:20:00"
comments: true
---

# 목차
- <a href="/post/what-is-docker-compose" target="_blank">Docker Compose란 무엇일까?</a>
- <a href="/post/docker-compose-spec-local-backend" target="_blank">Docker Compose Specification으로 로컬 백엔드 환경 구성하기</a>
- Docker Compose 운영 패턴과 환경별 설정 전략

<br>

# 운영에서 자주 깨지는 지점
Compose를 도입한 뒤에 자주 생기는 문제는 문법 자체보다 "어떤 기준으로 운영할지"가 정리되지 않은 상태에서 발생한다.
로컬에서는 동작하는데 팀 환경에서는 다르게 실행되거나, 동일한 파일인데 실행 옵션에 따라 결과가 달라지는 상황이 대표적이다.

이번 글에서는 Compose 파일 문법 설명을 넘어, 운영 관점에서 재현성과 유지보수성을 높이는 패턴을 정리한다.

<br>

# profiles로 실행 범위 분리하기
모든 서비스를 항상 실행하면 리소스 낭비가 커지고, 장애 원인도 추적하기 어려워질 수 있다.
`profiles`를 사용하면 개발, 테스트, 운영 보조 서비스의 실행 대상을 나눌 수 있다.

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: order
      MYSQL_ROOT_PASSWORD: root_pw
    profiles: ["local"]

  redis:
    image: redis:7
    profiles: ["local"]

  adminer:
    image: adminer
    ports:
      - "18080:8080"
    profiles: ["debug"]
```

```bash
# local 프로파일만 활성화
$ docker compose --profile local up -d

# local + debug 프로파일 활성화
$ docker compose --profile local --profile debug up -d
```

운영 관점에서는 서비스 기본 집합을 작게 유지하고, 디버깅 도구는 별도 프로파일로 분리하는 방식이 자주 사용된다.

<br>

# 다중 파일 오버라이드 전략
하나의 `compose.yaml`에 모든 환경 분기를 넣으면 파일이 빠르게 복잡해질 수 있다.
이때는 공통 파일 + 환경별 오버라이드 파일을 나누는 방식이 상대적으로 관리하기 쉽다.

```bash
# 공통 + 로컬 오버라이드
$ docker compose -f compose.yaml -f compose.local.yaml up -d

# 공통 + CI 오버라이드
$ docker compose -f compose.yaml -f compose.ci.yaml up -d
```

예시로 로컬 전용 볼륨/포트를 오버라이드할 수 있다.

```yaml
# compose.local.yaml
services:
  app:
    ports:
      - "8080:8080"
    volumes:
      - ./:/workspace
```

주의할 점은 파일 병합 순서다. 뒤에 오는 파일이 앞선 설정을 덮어쓰므로, 실행 스크립트에서 파일 순서를 고정하는 편이 운영 실수를 줄이는 데 유리하다.

<br>

# 환경 변수 우선순위 정리
Compose에서 값 충돌이 자주 발생하는 구간은 환경 변수다.
특히 `.env`, `env_file`, `environment`, 셸 환경 변수를 혼용하면 "왜 이 값이 들어갔는지" 추적이 어려워진다.

```yaml
services:
  app:
    env_file:
      - .env.app
    environment:
      APP_LOG_LEVEL: info
      DB_HOST: mysql
      REQUEST_TIMEOUT_MS: "1500"
```

일반적으로는 팀 규칙을 먼저 정해 두는 편이 좋다.

- 배포 환경에서 바뀌는 값: 실행 시 주입
- 서비스 공통 기본값: `env_file`
- 반드시 고정해야 하는 값: `environment`

민감한 값은 이미지 빌드 단계에 포함하지 않고, 실행 시 주입하는 방식이 보안 운영에서 더 일반적이다.

<br>

# Compose와 애플리케이션 책임 경계
`depends_on`과 `healthcheck`는 시작 제어에는 유용하지만, 애플리케이션의 장애 대응 로직을 대체하지는 않는다.
운영 중에는 일시 오류와 영구 오류를 분리하고 재시도 대상을 제한하는 정책이 함께 필요하다.

```java
@Slf4j
@Service
public class OrderSyncService {

    public void sync(String requestId, String orderId) {
        try {
            callExternal(orderId);
            log.info("order-sync-success requestId={} orderId={}", requestId, orderId);
        } catch (SocketTimeoutException | ConnectException e) {
            // 일시 오류: 제한적 재시도 후보
            log.warn("order-sync-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new RetryableOperationException(e);
        } catch (IllegalArgumentException | AuthenticationException e) {
            // 영구 오류: 즉시 실패 처리
            log.error("order-sync-non-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new NonRetryableOperationException(e);
        }
    }

    private void callExternal(String orderId) {
        // 예시 코드
    }
}
```

로그에는 최소한 `requestId`, `orderId` 같은 식별자를 남기는 편이 분석에 유리하다.
메시지 기반 시스템이라면 `key`, `partition`, `offset`도 함께 남겨두는 경우가 많다.

<br>

# 실행 전 운영 체크리스트
Compose 운영에서 자주 쓰는 점검 항목은 다음과 같다.

- 프로파일별로 필요한 서비스만 기동되는지
- 파일 병합 순서(`-f`)가 팀 스크립트와 동일한지
- 환경 변수 소스(`.env`, `env_file`, `environment`)가 충돌하지 않는지
- 재시도 대상이 일시 오류로 제한되는지
- 볼륨 전략(named volume/bind mount)이 데이터 유지 정책과 일치하는지

실무에서는 설정을 늘리기보다, 실행 흐름을 단순화하고 점검 포인트를 문서화하는 쪽이 운영 안정성에 도움이 되는 경우가 많다.

<br>

# 정리하면
Compose 실전 운영의 핵심은 새로운 기능을 많이 쓰는 것보다, 실행 대상을 분리하고 설정 우선순위를 명확히 하며 앱 로직과의 경계를 분리하는 데 있다.
이 기준이 정리되면 환경 차이로 인한 재현 불일치와 운영 실수를 줄이는 데 도움이 될 수 있다.

<br>

# 참고
- <a href="https://docs.docker.com/compose/profiles/" target="_blank" rel="nofollow">Docker Docs: Using profiles with Compose</a>
- <a href="https://docs.docker.com/compose/how-tos/multiple-compose-files/" target="_blank" rel="nofollow">Docker Docs: Use multiple Compose files</a>
- <a href="https://docs.docker.com/compose/environment-variables/" target="_blank" rel="nofollow">Docker Docs: Environment variables in Compose</a>
