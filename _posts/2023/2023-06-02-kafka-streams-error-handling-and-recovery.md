---
layout: post
title: "Kafka Streams 에러 처리와 복구 전략"
author: madplay
tags: kafka streams exception-handler state-store recovery
description: "Kafka Streams에서 역직렬화, 프로덕션, 비즈니스 로직 에러를 단계별로 처리하는 핸들러 구조와 State Store 복구 전략을 다룬다."
category: Backend
date: "2023-06-02 21:03:55"
comments: true
---

# Kafka Streams 시리즈 목차
- <a href="/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams 개념과 아키텍처</a>
- <a href="/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream과 KTable</a>
- <a href="/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams 윈도우와 조인</a>
- **4. Kafka Streams 에러 처리와 복구 전략**

<br>

# 에러가 발생하는 세 가지 지점

Kafka Streams 애플리케이션을 운영하다 보면 "스트림이 갑자기 멈췄다"는 알림을 받을 때가 있다.
원인을 추적해 보면 잘못된 메시지 하나가 전체 스트림 스레드를 종료시킨 경우가 대부분이다.
마치 공장 컨베이어 벨트 위에 규격 외 부품이 하나 올라왔을 때, 벨트 전체를 멈출지 그 부품만 빼낼지를 미리 정해두는 것과 비슷하다.

에러가 발생할 수 있는 지점은 크게 세 곳이다.
입력 토픽에서 레코드를 역직렬화하는 단계, 토폴로지 내부에서 비즈니스 로직을 실행하는 단계, 처리 결과를 출력 토픽에 쓰는 단계다.
각 지점마다 전용 핸들러가 존재한다. 어떤 에러를 어디서 처리해야 하는지 구분하지 않으면, 한 레코드의 역직렬화 실패가 전체 스트림 스레드를 멈추는 상황이 발생할 수 있다.

<br>

# DeserializationExceptionHandler

입력 토픽에서 레코드를 읽어 역직렬화할 때 발생하는 예외를 처리한다.
스키마가 변경되었거나, 잘못된 포맷의 메시지가 토픽에 들어온 경우가 대표적이다.

Kafka Streams는 두 가지 내장 구현을 제공한다.

| 구현                                 | 동작                        |
|------------------------------------|---------------------------|
| `LogAndFailExceptionHandler` (기본값) | 예외를 로그에 남기고 스트림 스레드를 종료한다 |
| `LogAndContinueExceptionHandler`   | 예외를 로그에 남기고 해당 레코드를 건너뛴다  |

```java
import org.apache.kafka.streams.StreamsConfig;

props.put(
    StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
    "org.apache.kafka.streams.errors.LogAndContinueExceptionHandler"
);
```

기본값인 `LogAndFailExceptionHandler`는 안전하지만, 잘못된 레코드 하나 때문에 전체 스트림이 멈출 수 있다.
운영 환경에서는 `LogAndContinueExceptionHandler`를 사용하거나, 커스텀 핸들러를 구현하는 경우가 많다.

만약 잘못된 레코드를 단순히 건너뛰는 것이 아니라 Dead Letter Topic(DLT)으로 보내서 나중에 분석하고 싶다면 어떻게 해야 할까?

> 참고로 아래 예제는 Kafka 3.4 기준으로 작성했다. 이후 버전에서는 메서드 시그니처가 달라질 수 있으므로 사용 중인 버전의 Javadoc을 확인하는 것이 좋다.

```java
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.streams.errors.DeserializationExceptionHandler;
import org.apache.kafka.streams.processor.ProcessorContext;

import java.util.Map;

public class DltDeserializationExceptionHandler
    implements DeserializationExceptionHandler {

    private KafkaProducer<byte[], byte[]> dltProducer;

    @Override
    public void configure(Map<String, ?> configs) {
        dltProducer =
            new KafkaProducer<>(createDltProducerProps(configs));
    }

    @Override
    public DeserializationHandlerResponse handle(
            ProcessorContext context,
            ConsumerRecord<byte[], byte[]> record,
            Exception exception) {

        String dltTopic =
            record.topic() + "-deserialization-dlt";

        dltProducer.send(
            new ProducerRecord<>(
                dltTopic, record.key(), record.value()),
            (metadata, ex) -> {
                if (ex != null) {
                    log.error(
                        "DLT send failed. srcTopic={},"
                            + " partition={}, offset={}",
                        record.topic(),
                        record.partition(),
                        record.offset(), ex);
                }
            }
        );

        log.warn(
            "deserialization failed, sent to DLT."
                + " topic={}, partition={}, offset={}",
            record.topic(),
            record.partition(),
            record.offset(), exception);

        return DeserializationHandlerResponse.CONTINUE;
    }

    @Override
    public void close() {
        if (dltProducer != null) {
            dltProducer.close();
        }
    }

    private Map<String, Object> createDltProducerProps(
            Map<String, ?> configs) {
        // bootstrap.servers 등 필수 설정 추출해서 `Map.of()`에 전달
        return Map.of();
    }
}
```

`send()`가 비동기이므로 `CONTINUE`를 반환하는 시점에 DLT 전송이 완료되지 않았을 수 있다. 운영 환경에서는 `acks` 설정, 전송 실패 시 재시도 정책, 실패 메트릭 수집 등을 함께 고려해야 한다.

```java
props.put(
    StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
    DltDeserializationExceptionHandler.class.getName()
);
```

DLT 전송이 실패하더라도 원본 레코드의 토픽, 파티션, 오프셋을 로그에 남겨야 추적이 가능하다.

<br>

# ProductionExceptionHandler

토폴로지가 처리한 결과를 출력 토픽에 쓸 때 발생하는 예외를 처리한다.
레코드 크기가 `max.message.bytes`를 초과하거나, 직렬화 오류가 발생하는 경우가 해당된다.

`ProductionExceptionHandler` 인터페이스를 구현하면 된다. 반환값은 `CONTINUE`(건너뛰기) 또는 `FAIL`(스트림 종료)이다.

```java
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.RecordTooLargeException;
import org.apache.kafka.streams.errors.ProductionExceptionHandler;

import java.util.Map;

public class CustomProductionExceptionHandler
    implements ProductionExceptionHandler {

    @Override
    public void configure(Map<String, ?> configs) {
        // 필요 시 설정
    }

    @Override
    public ProductionExceptionHandlerResponse handle(
            ProducerRecord<byte[], byte[]> record,
            Exception exception) {

        if (exception instanceof RecordTooLargeException) {
            log.warn(
                "record too large, skipping."
                    + " topic={}, key={}",
                record.topic(),
                record.key() != null ? new String(record.key()) : "null",
                exception);
            return ProductionExceptionHandlerResponse.CONTINUE;
        }

        log.error(
            "production failed. topic={}, key={}",
            record.topic(),
            new String(record.key()), exception);
        return ProductionExceptionHandlerResponse.FAIL;
    }

    @Override
    public void close() {
        // 리소스 정리
    }
}
```

```java
props.put(
    StreamsConfig.DEFAULT_PRODUCTION_EXCEPTION_HANDLER_CLASS_CONFIG,
    CustomProductionExceptionHandler.class.getName()
);
```

`CONTINUE`를 반환하면 해당 레코드는 출력되지 않고 넘어가므로, 데이터 유실이 허용되는지 확인해야 한다.
운영에서는 `CONTINUE`를 반환하면서 DLT에 기록하는 패턴을 함께 적용하는 경우가 많다.

<br>

# StreamsUncaughtExceptionHandler

역직렬화와 프로덕션 이외의 지점, 즉 토폴로지 내부의 비즈니스 로직에서 발생하는 예외는 `StreamsUncaughtExceptionHandler`가 담당한다.

Kafka 2.8(2021년, KIP-671)에서 도입된 이 핸들러는 스트림 스레드에서 잡히지 않은 예외가 발생했을 때 세 가지 대응 중 하나를 선택할 수 있다.

| 반환값 | 동작 |
|-------|------|
| `REPLACE_THREAD` | 실패한 스트림 스레드를 새 스레드로 교체한다 |
| `SHUTDOWN_CLIENT` | 해당 `KafkaStreams` 인스턴스를 종료한다 |
| `SHUTDOWN_APPLICATION` | 같은 `application.id`의 모든 인스턴스에 종료를 전파한다 |

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.errors.StreamsUncaughtExceptionHandler;

KafkaStreams streams = new KafkaStreams(topology, props);

streams.setUncaughtExceptionHandler(exception -> {
    if (exception instanceof IllegalStateException) {
        log.error(
            "unrecoverable error, shutting down client",
            exception);
        return StreamsUncaughtExceptionHandler
            .StreamThreadExceptionResponse.SHUTDOWN_CLIENT;
    }

    log.warn("transient error, replacing thread", exception);
    return StreamsUncaughtExceptionHandler
        .StreamThreadExceptionResponse.REPLACE_THREAD;
});

streams.start();
```

`REPLACE_THREAD`는 일시적인 오류(외부 API 타임아웃 등)에서 스트림을 유지하고 싶을 때 유용하다.
다만 같은 예외가 반복되면 스레드가 계속 교체되면서 리밸런싱이 반복될 수 있으므로, 재시도 횟수에 상한을 두는 것이 안전하다.

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger replaceCount = new AtomicInteger(0);

streams.setUncaughtExceptionHandler(exception -> {
    if (replaceCount.incrementAndGet() > 3) {
        log.error(
            "thread replacement limit exceeded,"
                + " shutting down",
            exception);
        return StreamsUncaughtExceptionHandler
            .StreamThreadExceptionResponse.SHUTDOWN_CLIENT;
    }

    log.warn(
        "replacing thread. attempt={}",
        replaceCount.get(), exception);
    return StreamsUncaughtExceptionHandler
        .StreamThreadExceptionResponse.REPLACE_THREAD;
});
```

<br>

# 스트림 상태 전이와 모니터링

`KafkaStreams` 인스턴스는 내부적으로 상태 머신을 갖고 있다. 에러 핸들러의 동작을 이해하려면 이 상태 전이를 알아야 한다.

인스턴스는 `CREATED`에서 시작해 `REBALANCING`을 거쳐 `RUNNING`에 도달한다.
`RUNNING` 상태에서 스트림 스레드가 교체되면 `REBALANCING`을 거쳐 다시 `RUNNING`으로 돌아오고, 복구 불가능한 에러가 발생하면 `ERROR` 상태로 전이된다.
정상 종료든 에러든 최종적으로는 `PENDING_SHUTDOWN`을 거쳐 `NOT_RUNNING`에 도달한다.

`KafkaStreams.StateListener`를 등록하면 상태 변경을 감지할 수 있다.

```java
streams.setStateListener((newState, oldState) -> {
    log.info(
        "streams state changed. old={}, new={}",
        oldState, newState);

    if (newState == KafkaStreams.State.ERROR) {
        log.error(
            "streams entered ERROR state,"
                + " alerting operations team");
        alertService.notify(
            "Kafka Streams ERROR: " + streams.toString());
    }
});
```

`RUNNING` 상태에서 처리 도중 에러가 발생하면 `REBALANCING`이나 `ERROR`로 전이된다.
`REPLACE_THREAD`를 선택한 경우 `REBALANCING`을 거쳐 다시 `RUNNING`으로 돌아온다.
`SHUTDOWN_CLIENT`를 선택하면 `PENDING_SHUTDOWN` → `NOT_RUNNING`으로 전이되며, 외부 프로세스 매니저(systemd, Kubernetes 등)가 재시작을 담당해야 한다.

<br>

# State Store 복구와 standby replica

Kafka Streams 인스턴스가 장애로 내려간 뒤 재시작되면, 태스크의 State Store를 changelog 토픽에서 복원해야 한다.
이 복원 시간이 길면 리밸런싱 완료까지 처리가 중단된다.

## standby replica

복원 시간을 줄이는 방법 중 하나가 **standby replica**다.
`num.standby.replicas`를 1 이상으로 두면, 다른 인스턴스가 해당 태스크의 State Store 복제본을 changelog 토픽에서 지속적으로 소비하며 유지한다.

```java
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
```

예를 들어 인스턴스 A가 Task 0을 active로 처리하고 있을 때, 인스턴스 B는 Task 0의 standby를 유지한다.
인스턴스 A에 장애가 발생하면 Task 0이 인스턴스 B로 재할당되고, 마지막 동기화 시점 이후의 변경분만 catch-up하면 되므로 복원 시간이 크게 줄어든다.
다만 추가 디스크와 네트워크 대역폭을 사용하므로, State Store 크기와 changelog 유입량에 따라 리소스 균형을 고려해야 한다.

## state.dir 설정

State Store가 저장되는 로컬 디렉터리는 `state.dir`(기본 `/tmp/kafka-streams`)로 설정한다.
운영 환경에서는 영속적인 디스크 경로를 지정하는 것이 안전하다. 호스트가 재시작되더라도 로컬 파일이 남아 있으면 changelog에서 전체 복원을 하지 않아도 되기 때문이다.

```java
props.put(StreamsConfig.STATE_DIR_CONFIG, "/data/kafka-streams");
```

<br>

# 에러 처리 설정 요약

세 가지 핸들러와 관련 설정을 한곳에 모아 보면 다음과 같다.

```properties
# 역직렬화 에러 핸들러
default.deserialization.exception.handler=\
  org.apache.kafka.streams.errors.LogAndContinueExceptionHandler

# 프로덕션 에러 핸들러
default.production.exception.handler=\
  org.apache.kafka.streams.errors.DefaultProductionExceptionHandler

# State Store 복구
num.standby.replicas=1
state.dir=/data/kafka-streams
```

`StreamsUncaughtExceptionHandler`는 설정 파일이 아닌 코드에서 `KafkaStreams.setUncaughtExceptionHandler()`로 등록한다.

| 에러 지점 | 핸들러 | 설정 방식 |
|----------|--------|----------|
| 역직렬화 | `DeserializationExceptionHandler` | `StreamsConfig` 속성 |
| 비즈니스 로직 | `StreamsUncaughtExceptionHandler` | 코드에서 등록 |
| 출력 전송 | `ProductionExceptionHandler` | `StreamsConfig` 속성 |

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/config-streams" target="_blank" rel="nofollow">Apache Kafka 3.4 - Configuring a Streams Application</a>
- <a href="https://cwiki.apache.org/confluence/display/KAFKA/KIP-671%3A+Introduce+Kafka+Streams+Specific+Uncaught+Exception+Handler" target="_blank" rel="nofollow">KIP-671: Introduce Kafka Streams Specific Uncaught Exception Handler</a>
