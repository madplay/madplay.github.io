---
layout: post
title: "Docker Compose란 무엇일까?"
author: madplay
tags: docker compose devops
description: "Docker Compose가 무엇인지, 왜 필요한지, 그리고 어떻게 사용하는지 알아보자"
category: Infra
date: "2023-05-27 21:10:00"
comments: true
---

# 목차
- Docker Compose란 무엇일까?
- <a href="/post/docker-compose-spec-local-backend" target="_blank">Docker Compose Specification으로 로컬 백엔드 환경 구성하기</a>
- <a href="/post/docker-compose-operation-patterns" target="_blank">Docker Compose 운영 패턴과 환경별 설정 전략</a>

<br>

# 로컬 환경 재현성 문제부터 보기

**Docker Compose는 여러 컨테이너 애플리케이션을 정의하고 실행하는 도구다.**
주요 포인트는 실행 명령을 길게 나열하는 대신, `compose.yaml`에 서비스 구성을 선언해 같은 환경을 반복 가능하게 만드는 데 있다.
팀 환경에 따라 효과의 크기는 다르지만, 로컬 환경 차이를 줄이고 실행/중지/로그 확인 같은 작업을 하나의 명령 체계로 묶는 데 도움이 될 수 있다.

컨테이너 하나만 실행할 때는 `docker run`으로도 충분하지만, 애플리케이션과 MySQL, Redis를 함께 띄우기 시작하면 옵션과 순서 관리가 빠르게 복잡해진다.
Compose는 이 구성을 파일로 고정해 팀 안에서 같은 로컬 환경을 재현할 수 있게 해준다.

<br>

# Compose 모델의 핵심 구성요소
Compose는 크게 세 가지를 중심으로 동작한다.

- `services`: 실행할 컨테이너 단위다.
- `networks`: 서비스끼리 통신하는 네트워크다.
- `volumes`: 컨테이너가 내려가도 유지할 데이터 저장소다.
- 필요에 따라 `configs`, `secrets` 같은 항목도 함께 사용한다.

아래는 기본적인 구조 예시다.

```yaml
services:
  app:
    image: eclipse-temurin:17-jre

  mysql:
    image: mysql:8.0

volumes:
  mysql-data:
```

구조 자체는 단순하지만, 실제로는 `ports`, `environment`, `depends_on`, `healthcheck`를 같이 써야 안정적으로 동작한다.
특히 데이터베이스는 볼륨을 지정하지 않으면 컨테이너를 재생성할 때 데이터가 사라질 수 있다.

<br>

# compose.yaml 읽는 순서
실무에서 자주 쓰는 항목만 먼저 보면 된다.

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
    depends_on:
      mysql:
        condition: service_healthy

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

volumes:
  mysql-data:
```

이 예시에서 눈여겨볼 조합은 `depends_on + healthcheck`다.
앱 컨테이너를 먼저 띄울 수는 있어도, MySQL이 준비되기 전이면 연결 오류가 발생한다.
따라서 "시작 순서"와 "준비 상태"를 함께 선언하면 초기 기동 안정성에 도움이 되는 경우가 많다.
참고로 `healthcheck` 명령은 대상 컨테이너 내부에서 실행되므로, 예시처럼 `127.0.0.1`을 사용해도 동작한다.

다만 이 조합은 어디까지나 Compose의 시작 제어이고, 앱의 재연결/재시도/타임아웃 로직을 대체하지는 않는다.
또한 예시처럼 `container_name`을 고정하면 서비스 스케일링(복수 인스턴스 실행)에 제약이 생길 수 있다.

<br>

# 자주 쓰는 Docker Compose 명령어
Compose를 처음 사용할 때는 아래 명령어만 익혀도 충분하다.

```bash
# 백그라운드 실행
$ docker compose up -d

# 상태 확인
$ docker compose ps

# 특정 서비스 로그 확인
$ docker compose logs -f app

# 컨테이너 내부 명령 실행
$ docker compose exec mysql mysql -u root -p

# 중지 및 정리
$ docker compose down
```

`docker compose exec mysql mysql -u root -p`는 비밀번호를 대화형으로 입력하는 방식이다.
운영 환경에서는 명령줄 히스토리에 비밀번호가 남을 수 있으므로 `-p비밀번호` 형태는 가능한 피하는 편이 일반적이다.

`down` 명령은 네트워크와 기본 리소스를 같이 정리한다.
다만 볼륨까지 지우려면 `-v` 옵션이 필요하므로, 로컬 DB 데이터를 유지할지 먼저 확인한 뒤 실행하는 편이 일반적이다.
일반적으로 named volume은 유지되지만, bind mount를 사용했거나 DB 초기화 스크립트가 실행되는 구성에서는 데이터 상태가 달라질 수 있다.

<br>

# Compose와 애플리케이션 로직의 경계
Compose 설정이 잘 되어 있어도 애플리케이션 코드에서 준비 상태를 전혀 고려하지 않으면 초기 부팅 오류가 반복된다.
이때는 오류를 일시 오류와 영구 오류로 나누고, 로그 컨텍스트를 남겨야 분석이 빨라진다.

```java
@Slf4j
@Component
public class DatabaseStartupVerifier {

    public void verify(String requestId) {
        try {
            // 짧은 타임아웃으로 DB 준비 상태 확인
            pingWithTimeout(1000);
            log.info("mysql-ready requestId={}", requestId);
        } catch (SocketTimeoutException e) {
            // 일시 오류: DB 기동 지연
            log.warn("mysql-timeout requestId={} message={}", requestId, e.getMessage());
            throw new RetryableDependencyException(e);
        } catch (AuthenticationException e) {
            // 영구 오류: 계정/권한 설정 문제
            log.error("mysql-auth-failed requestId={} message={}", requestId, e.getMessage());
            throw new NonRetryableDependencyException(e);
        }
    }

    private void pingWithTimeout(int timeoutMs) {
        // 예시 코드
    }
}
```

재시도는 필요한 곳에만 제한적으로 적용하는 편이 보통 더 안정적이다. 영구 오류까지 재시도하면 시작 시간만 늘어나고, 장애 신호를 늦게 발견하게 된다.

<br>

# Compose Specification의 역할

Compose를 도구로만 보면 문법이 구현체마다 달라 보일 수 있다.
Compose Specification은 `compose.yaml` 파일 형식을 정의한 공통 명세라고 보면 된다.

즉, Docker Compose CLI 자체를 설명하는 문서가 아니라,
Compose 파일에서 `services`, `networks`, `volumes`, `configs`,`secrets` 같은 키를 어떻게 해석할지에 대한 규약이다.
스펙 기준으로 파일을 작성하면 팀 내 일관성이 좋아지고, 도구를 바꾸더라도 이식 부담이 줄어든다.

<br>

# 정리하면

Docker Compose는 여러 컨테이너를 한 번에 실행하는 단순 편의 기능을 넘어, 로컬 실행 환경을 선언형으로 고정하는 방법에 가깝다.
그래서 먼저 개념과 파일 구조를 이해하고, 다음 단계에서 스펙 기반 실전 구성으로 넘어가는 흐름이 많은 팀에서 무난하게 작동한다.

다음 글에서는 Compose Specification 기준으로 `compose.yaml`을 어떻게 구성하면 좋을지, MySQL/Redis를 포함한 예시로 이어서 정리한다.

- 다음 글: <a href="/post/docker-compose-spec-local-backend" target="_blank">Docker Compose Specification으로 로컬 백엔드 환경 구성하기</a>

# 참고
- <a href="https://docs.docker.com/compose/" target="_blank" rel="nofollow">Docker Docs: Compose</a>
- <a href="https://compose-spec.io/" target="_blank" rel="nofollow">Compose Specification</a>
- <a href="https://docs.docker.com/reference/compose-file/" target="_blank" rel="nofollow">Docker Docs: Compose file reference</a>
