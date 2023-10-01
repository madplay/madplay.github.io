---
layout: post
title: "Dockerfile Best Practices로 Java 이미지 최적화하기"
author: madplay
tags: docker dockerfile java image
description: "Dockerfile Best Practices를 기준으로 Java 애플리케이션 이미지 크기와 빌드 시간을 줄이는 방법을 정리한다."
category: Infra
date: "2023-10-01 23:40:00"
comments: true
---

# Dockerfile 최적화는 왜 필요할까
이미지 크기와 빌드 속도는 배포 시간과 운영 대응 속도에 바로 영향을 준다.
Java 백엔드는 의존성 규모가 커지기 쉬워, Dockerfile 레이어 구성에 따라 캐시 효율과 빌드 시간이 크게 달라진다.
이 차이는 배포/롤백 시간과 로컬 반복 빌드 비용으로 바로 드러난다.

이 글에서는 <a href="https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" target="_blank" rel="nofollow">Docker 공식 Best Practices</a>를 바탕으로, 변경 빈도 기준 레이어 설계와 빌드/런타임 분리 패턴을 코드 중심으로 정리한다. 하나씩 알아보자.

<br>

# 레이어 구조 이해하기

Docker 이미지는 레이어의 합으로 만들어진다. 따라서 변경 가능성이 큰 파일을 위쪽 레이어에 두면 캐시 적중률이 크게 떨어진다.

```dockerfile
FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY . .
# 첫 번째 점: 호스트의 현재 디렉터리(빌드 컨텍스트 전체)
# 두 번째 점: 컨테이너의 현재 작업 디렉터리(WORKDIR=/app)
RUN ./gradlew clean build
CMD ["java", "-jar", "build/libs/app.jar"]
```

위 패턴은 소스 코드 한 줄만 바뀌어도 `COPY . .` 이후 레이어가 다시 빌드된다.
빌드 속도를 개선하려면 Dockerfile을 "실행 순서"보다 "변경 빈도" 기준으로 재배치하는 편이 효과적이다.
그래서 보통은 아래처럼 `COPY . .`를 한 번에 쓰지 않고, 변경 빈도에 따라 나눠 복사한다.

```dockerfile
FROM gradle:8.3.0-jdk17
WORKDIR /workspace

# 1) 먼저: 자주 안 바뀌는 파일
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle
# 의존성만 먼저 받아두면, src 변경 시 이 레이어 캐시가 재사용될 가능성이 커진다.
RUN ./gradlew --no-daemon dependencies

# 2) 나중: 자주 바뀌는 소스 코드
COPY src ./src
# 실제 산출물 생성은 마지막 단계에서 수행
RUN ./gradlew --no-daemon bootJar
```

핵심은 간단하다. "의존성 파일 먼저, 소스 코드 나중" 순서로 레이어를 나누면 코드 수정 시 의존성 레이어 캐시를 재사용할 가능성이 커진다.

<br>

# 멀티 스테이지 빌드로 런타임 이미지 줄이기

빌드 도구와 실행 환경을 분리하면 이미지 크기를 크게 줄일 수 있다. 아래 예시는 Gradle 빌드 스테이지와 JRE 런타임 스테이지를 분리한 구성이다.

```dockerfile
# 1) build stage
FROM gradle:8.3.0-jdk17 AS builder
WORKDIR /workspace

COPY --chown=gradle:gradle build.gradle settings.gradle ./
COPY --chown=gradle:gradle gradle ./gradle
COPY --chown=gradle:gradle gradlew ./gradlew
# gradlew 스크립트 실행 권한 보장
RUN chmod +x ./gradlew
# 의존성 레이어 분리
RUN ./gradlew --no-daemon dependencies

COPY --chown=gradle:gradle src ./src
# 애플리케이션 JAR 생성
RUN ./gradlew --no-daemon bootJar
# 런타임 스테이지에서 고정 이름을 사용하도록 app.jar로 복사
RUN JAR_FILE=$(ls build/libs/*.jar | grep -v "plain" | head -n 1) && cp "$JAR_FILE" build/libs/app.jar

# 2) runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN useradd -r -u 1001 appuser
USER appuser

# 빌더 산출물만 복사해서 런타임 이미지를 작게 유지
COPY --from=builder --chown=appuser:appuser /workspace/build/libs/app.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

정리하면 다음과 같다.

- 빌드에 필요한 JDK/Gradle은 `builder` 스테이지에만 남긴다.
- 실행 이미지는 JRE만 포함해 공격 표면과 용량을 줄인다.
- `USER appuser`로 root 실행을 피한다.

`COPY --chown=gradle:gradle`를 사용한 이유는 Gradle 공식 이미지가 `gradle` 사용자/홈 디렉터리 전제를 갖는 경우가 많기 때문이다.
권한을 미리 맞춰두면 `gradlew` 실행 권한이나 캐시 디렉터리 접근 문제를 줄이는 데 도움이 된다.

주의할 점은 빌드 산출물이 여러 개 생기는 구성에서는 `COPY --from=builder /workspace/build/libs/*.jar app.jar` 같은 패턴이 실패할 수 있다는 점이다.
CI 환경에서는 artifact 이름을 고정하거나 `bootJar.archiveFileName`을 명시하면 운영 변동성을 줄이는 데 도움이 될 수 있다.
예를 들어 Gradle에서는 아래처럼 산출물 이름을 고정하는 방식이 자주 사용된다.

```groovy
bootJar {
    archiveFileName = "app.jar"
}
```

<br>

# 캐시 적중률을 높이는 Dockerfile 패턴
## 의존성 레이어 먼저 분리하기
아래처럼 의존성 정의 파일을 먼저 복사하고 의존성 다운로드를 먼저 수행하면, 코드 변경 시에도 캐시를 재사용할 가능성이 커진다.

```dockerfile
FROM gradle:8.3.0-jdk17 AS builder
WORKDIR /workspace

# 의존성 관련 파일 먼저 복사
COPY --chown=gradle:gradle build.gradle settings.gradle gradlew ./
COPY --chown=gradle:gradle gradle ./gradle
RUN chmod +x ./gradlew
# 의존성 먼저 다운로드(캐시 레이어)
RUN ./gradlew --no-daemon dependencies

# 자주 바뀌는 소스는 나중에 복사
COPY --chown=gradle:gradle src ./src
# 최종 실행 JAR 빌드
RUN ./gradlew --no-daemon bootJar
```

`gradle:8.3-jdk17`처럼 메이저/마이너만 고정해도 충분한 경우가 많지만,
팀에서 빌드 재현성을 더 중요하게 본다면 `8.3.0`처럼 패치 버전까지 고정하는 방식을 고려할 수 있다.

다만 패치 태그는 이미지마다 제공 정책이 달라질 수 있으므로, 실제 적용 전 Docker Hub에서 태그 존재 여부를 먼저 확인하는 편이 안전하다.

## `.dockerignore`로 빌드 컨텍스트 줄이기

여기에 `.dockerignore`를 함께 두면 전송 컨텍스트를 줄일 수 있다.

```gitignore
.git
.gradle
.idea
build
out
*.iml
*.log
```

여기서 중요한 점은 `.dockerignore`가 "이미지 안에서 삭제"가 아니라, 애초에 빌드 컨텍스트 전송 대상에서 제외한다는 것이다.
즉, 불필요한 파일이 Docker daemon으로 넘어가지 않아 빌드 I/O 비용을 줄일 수 있다.
또한 컨텍스트에서 제외된 파일은 `COPY` 대상에도 포함되지 않으므로, 필요한 파일이 빠지지 않게 목록을 점검하는 편이 안전하다.

## 캐시가 기대만큼 안 먹는 경우

의존성 캐시를 더 안정적으로 쓰려면 `build.gradle`, `settings.gradle`뿐 아니라
`gradle.properties`, `gradle/libs.versions.toml`(버전 카탈로그)처럼 의존성에 영향을 주는 파일도 함께 먼저 복사하는 편이 유리하다.

프로젝트마다 파일 구조가 다르므로, 핵심은 "의존성 결정에 관여하는 파일을 먼저 복사"하는 것이다.
또한 `./gradlew dependencies`는 유용한 캐시 힌트지만, 프로젝트 설정이나 플러그인 구성에 따라 다음 단계에서 다시 내려받는 경우도 있다.
가능하다면 Docker의 개선된 빌드 엔진인 BuildKit의 cache mount 같은 옵션을 함께 검토하면 의존성 재다운로드 비용을 더 줄일 수 있다.

<br>

# 런타임 안정성을 위한 타임아웃과 종료 처리
이미지가 작아도 종료 시그널 처리와 타임아웃이 없다면 운영 안정성이 떨어진다.
아래처럼 JVM 옵션과 graceful shutdown 시간을 명시해 두면 운영 안정성에 도움이 될 수 있다.

## ENTRYPOINT/CMD와 PID 1

용어를 먼저 짚고 가면 이해가 쉽다.

- `PID 1`: 컨테이너 안에서 가장 먼저 실행된 메인 프로세스
- `SIGTERM`: 정상 종료를 요청하는 시그널
- `SIGKILL`: 즉시 강제 종료하는 시그널(처리 로직 실행 없이 종료)

```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Dfile.encoding=UTF-8"
ENV SPRING_LIFECYCLE_TIMEOUT_PER_SHUTDOWN_PHASE=20s

COPY app.jar ./app.jar
# shell form + exec: 환경변수 확장과 PID 1 시그널 처리 균형
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
```

실무에서는 `ENTRYPOINT`와 `CMD`를 아래처럼 구분하면 운영 커맨드가 단순해진다.

- `ENTRYPOINT`: 컨테이너의 고정 실행 명령
- `CMD`: 기본 인자(실행 시 override 가능)

`sh -c`를 사용할 때 `exec` 없이 실행하면 셸이 PID 1로 남아 종료 시그널 전달이 기대와 다를 수 있다.
이 예시에서 shell form을 사용한 이유는 `JAVA_OPTS` 같은 환경 변수 확장이 필요하기 때문이다.
`exec`를 사용하면 자바 프로세스가 PID 1을 직접 받아 graceful shutdown이 동작할 가능성이 커진다.
강제 종료까지의 대기 시간은 기본값뿐 아니라 `docker stop -t`, Compose의 `stop_grace_period` 같은 설정에 따라 달라질 수 있다.
일반적으로 `docker stop`은 먼저 `SIGTERM`을 보내 정상 종료를 기다리고, 유예 시간 내 종료되지 않으면 `SIGKILL`로 강제 종료한다.

## 종료 처리 로컬 검증

로컬에서는 아래처럼 종료 처리를 바로 검증해볼 수 있다.

```bash
# 컨테이너 실행
docker run --name demo-app -p 8080:8080 myapp:latest
# SIGTERM 전달 후 최대 30초 대기, 이후 강제 종료
docker stop -t 30 demo-app
```

애플리케이션 로그에 shutdown 훅 로그가 남고, 30초 안에 정상 종료되면 graceful shutdown 경로가 연결된 것이다.

## 애플리케이션 타임아웃/재시도 기준

설정 파일에서는 외부 요청 타임아웃도 같이 둔다.
아래 키(`client.payment.*`)는 Spring 기본 키가 아니라, 팀에서 정의한 커스텀 프로퍼티 예시다.

```yaml
# application.yml
client:
  payment:
    # 외부 시스템 연결 수립 타임아웃
    connect-timeout-ms: 500
    # 응답 대기 타임아웃
    read-timeout-ms: 1500
    # 일시 오류에만 제한적으로 재시도
    retry-max-attempts: 2
server:
  # SIGTERM 수신 시 요청을 마무리하고 종료
  shutdown: graceful
```

주의할 점은 재시도를 늘리기 전에 멱등성 보장 설계를 먼저 검토하는 편이 낫다는 점이다.
예를 들어 결제 API 호출은 `requestId` 또는 `idempotencyKey`를 기준으로 중복 실행을 제한하는 방식이 자주 사용된다.

<br>

# 오류 분류와 로그 컨텍스트를 코드에 남기기
Dockerfile만 잘 써도 장애를 줄일 수 있지만, 애플리케이션 코드에서 오류를 구분하지 않으면 결국 운영 이슈로 이어진다.
다음 예시는 주문 결제 요청 시 일시 오류와 영구 오류를 구분하는 방식이다.

```java
@Slf4j
@Service
public class PaymentService {

    public PaymentResult pay(String requestId, String orderId, String idempotencyKey) {
        try {
            PaymentResponse response = callGateway(orderId, idempotencyKey);
            log.info("payment-success requestId={} orderId={} idempotencyKey={}",
                    requestId, orderId, idempotencyKey);
            return PaymentResult.success(response.transactionId());
        } catch (SocketTimeoutException | ConnectException e) {
            // 일시 오류: 재시도 후보
            log.warn("payment-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new RetryablePaymentException(e);
        } catch (IllegalArgumentException | AuthenticationException e) {
            // 영구 오류: 즉시 실패 처리
            log.error("payment-non-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new NonRetryablePaymentException(e);
        }
    }

    private PaymentResponse callGateway(String orderId, String idempotencyKey) {
        // 외부 결제 호출 예시
        return new PaymentResponse("tx-123");
    }
}
```

재시도 정책은 "네트워크 타임아웃/일시 장애" 같은 조건으로 제한하는 편이 보통 운영 안정성에 유리하다.
유효하지 않은 파라미터, 인증 실패처럼 영구 오류를 재시도하면 지연만 늘고 큐 적체를 만든다.

<br>

# 마무리
Dockerfile 최적화의 핵심은 이미지 크기뿐 아니라 캐시 재사용률과 운영 안정성을 함께 높이는 데 있다.

마지막으로 아래 항목만 점검해도 개선 효과를 빠르게 확인할 수 있다.

- `COPY . .`를 먼저 두지 않고, 의존성 파일과 소스 파일을 분리했는지
- builder/runtime 멀티 스테이지로 실행 이미지를 최소화했는지
- `.dockerignore`와 non-root 실행으로 컨텍스트/권한 기준을 맞췄는지
- `docker stop -t`와 타임아웃/재시도 설정으로 종료 안정성을 검증했는지

# 참고
- <a href="https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" target="_blank" rel="nofollow">Docker Docs: Building best practices</a>
- <a href="https://docs.docker.com/build/building/multi-stage/" target="_blank" rel="nofollow">Docker Docs: Multi-stage builds</a>
- <a href="https://docs.docker.com/reference/dockerfile/" target="_blank" rel="nofollow">Docker Docs: Dockerfile reference</a>
