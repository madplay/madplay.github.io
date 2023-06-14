---
layout: post
title: "Kafka 프로듀서, 얼마나 안전하고 얼마나 빠를까?"
author: madplay
tags: kafka producer acks idempotence transaction batch
description: "Kafka 프로듀서의 메시지 전송 과정부터 acks 설정, 배치와 압축, 멱등 프로듀서, 트랜잭션까지 코드와 함께 살펴보자!"
category: Backend
date: "2023-06-14 16:38:47"
comments: true
---

# 왜 프로듀서 설정이 중요할까

단순한 접속 로그 전송이라면 메시지 한두 건의 유실이 치명적이지 않을 수 있다. 하지만 주문 생성이나 재고 차감 이벤트는 중복이나 유실 비용이 매우 크다.
도메인의 요구사항에 따라 `acks`, 재시도, 멱등성 설정의 조합이 달라지며, 이는 시스템의 가용성과 성능 사이의 트레이드오프에 영향을 준다.

<br>

# 프로듀서 내부 구조: RecordAccumulator와 Sender

`KafkaProducer.send()`를 호출한다고 해서 레코드가 네트워크를 통해 즉시 전송되지는 않는다.
내부적으로 **RecordAccumulator**와 **Sender**라는 두 단계를 거쳐 효율적인 배치 전송을 수행한다.

1. 애플리케이션 스레드에서 `send()`를 호출하면 레코드는 직렬화(Serializer)와 파티션 결정(Partitioner)을 거쳐 `RecordAccumulator`에 추가된다.
2. `RecordAccumulator`는 파티션별로 `ProducerBatch`를 관리하며, 배치 조건(`batch.size` 또는 `linger.ms`)이 충족되면 Sender 스레드가 해당 데이터를 가져간다.
3. Sender 스레드는 배치를 브로커에 전송하고 `acks` 설정에 따라 응답을 대기한다.

`send()`는 비동기로 동작하며 `Future<RecordMetadata>`를 반환한다.
동기적으로 응답을 확인하려면 `send().get()`을 호출할 수 있지만 처리량이 급격히 하락할 수 있으므로, 콜백(Callback)을 활용한 비동기 응답 처리를 더 자주
보게 된다.

```java
producer.send(
    new ProducerRecord<>("order-events", orderId, payload),
    (RecordMetadata metadata, Exception exception) -> {
        if (exception != null) {
            log.error("send failed. topic={}, key={}", "order-events", orderId, exception);
            return;
        }
        log.info("send success. topic={}, partition={}, offset={}",
            metadata.topic(), metadata.partition(), metadata.offset());
    }
);
```

콜백은 Sender 스레드에서 실행되므로 내부에서 DB 쓰기나 외부 API 호출 같은 블로킹 작업을 수행하면 전체 전송 파이프라인에 지연이 발생할 수 있다.

<br>

# acks 설정과 min.insync.replicas

`acks` 설정은 프로듀서가 메시지 전송 성공을 판단하는 기준을 정의한다.

## acks=0

브로커의 응답을 기다리지 않고 전송 즉시 성공으로 간주한다. 속도는 가장 빠르지만 데이터 유실 가능성이 가장 높으며, `retries` 설정도 무의미해진다.
일부 유실을 허용하는 메트릭 전송 등에 제한적으로 사용된다.

## acks=1

리더 브로커가 로컬 로그에 메시지를 기록하면 즉시 성공 응답을 보낸다. 팔로워 복제를 확인하지 않으므로 복제 전 리더 장애가 발생하면 데이터가 유실될 위험이 있다.

## acks=all

리더가 가장 엄격한 확인 응답을 요구하는 쪽으로 동작한다. 다만 실제 쓰기 성공 여부는 현재 ISR 상태와 토픽의 `min.insync.replicas` 설정을 함께 봐야 해석할 수 있다.

자주 예시로 드는 조합은 `replication.factor=3`과 `min.insync.replicas=2`다.
상세한 장애 시나리오는 <a href="/post/kafka-topic-configurations" target="_blank"
rel="nofollow">Kafka 토픽 설정값 정리</a>에서 확인할 수 있다.

<br>

# 배치 효율과 전송 지연 최적화

`RecordAccumulator`에서 배치가 전송되는 시점은 `batch.size`와 `linger.ms` 설정에 의해 결정된다.

- `batch.size`(기본 16KB): 배치 버퍼 크기가 이 값에 도달하면 즉시 전송한다.
- `linger.ms`(기본 0ms): 설정한 시간이 지나면 배치 크기와 상관없이 전송을 시작한다.

`linger.ms`를 0보다 크게 설정하면 전송 전 데이터를 더 모을 수 있어 전체 처리량은 늘어나지만 개별 메시지의 지연 시간은 증가한다.
반면 처리량이 매우 높은 환경에서는 0ms여도 버퍼에 데이터가 쌓이는 속도가 빨라 자연스럽게 배치 전송이 이루어진다.

```java
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32768);     // 32KB
props.put(ProducerConfig.LINGER_MS_CONFIG, 10);          // 10ms 대기
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864); // 64MB
```

`buffer.memory`는 배치를 위해 할당된 전체 메모리 공간이다. 이 공간이 부족해지면 `send()` 호출은 `max.block.ms` 동안 대기 상태에 빠질 수 있다.

<br>

# 압축 전략과 자원 효율

배치 단위 압축은 네트워크 대역폭 절감과 브로커의 디스크 효율을 동시에 높이는 전략이다.
압축은 프로듀서에서 수행되어 컨슈머에서 해제될 때까지 유지되므로 전 구간의 인프라 비용을 줄여준다.

| 타입 | 압축률 | CPU 사용량 | 특징 |
|------|-------|---------|------|
| `gzip` | 높음 | 높음 | 대역폭 절감 최우선 |
| `snappy` | 중간 | 낮음 | CPU 자원 보호 |
| `lz4` | 중간 | 매우 낮음 | 저지연 환경 적합 |
| `zstd` | 매우 높음 | 중간 | 균형 잡힌 범용적 선택 |

압축 효율은 배치 크기가 클수록 향상되므로 `linger.ms`와 연계하여 조정하는 것이 효과적이다.
브로커 설정을 `compression.type=producer`로 유지하면 브로커에서 별도의 재압축 과정을 거치지 않아 CPU 낭비를 방지할 수 있다. 단, 메시지
크기가 매우 작고 지연에 민감한 도메인에서는 압축 자체의 오버헤드가 더 크게 작용할 수 있으므로 주의가 필요하다.

<br>

# 에러 분류에 따른 재시도 전략

전송 실패 시 `retries` 설정에 따라 자동 재시도가 수행되지만, 전체 시도 기간은 `delivery.timeout.ms`에 의해 제한된다.
Kafka 클라이언트는 `RetriableException`을 상속받는 일시적 예외(`NetworkException` 등)에 대해서만 자동 재시도를 수행한다.

```java
producer.send(record, (metadata, exception) -> {
    if (exception instanceof org.apache.kafka.common.errors.RetriableException) {
        log.warn("일시적 오류로 인한 자동 재시도 대상");
    } else {
        log.error("비재시도 예외: 즉시 폴백 처리 필요", exception);
    }
});
```

재시도 과정에서 `max.in.flight.requests.per.connection`이 1보다 크면 전송 순서가 역전될 수 있다.
이를 방지하고 단일 파티션 내에서의 순차 기록을 보장하려면 멱등 프로듀서 설정을 활성화해야 한다.

<br>

# 멱등 프로듀서와 중복 방지 원리

멱등 프로듀서(Idempotent Producer)는 네트워크 타임아웃 등으로 인한 중복 기록을 방지한다.
프로듀서가 초기화 시 발급받은 PID(Producer ID)와 레코드의 Sequence Number를 조합하여 브로커가 이미 처리된 데이터인지 판단한다.

멱등 전송이 의도한 대로 동작하려면 보통 아래 조건을 함께 확인한다.
- `acks=all`
- `retries` > 0
- `max.in.flight.requests.per.connection` <= 5

이 기능은 단일 프로듀서 세션과 단일 파티션 내에서만 유효하다. 프로듀서가 재시작되어 PID가 새로 발급되면 세션 간 중복까지는 막지 못하므로,
더 넓은 범위의 보장이 필요하다면 트랜잭션 프로듀서를 고려해야 한다.

<br>

# 트랜잭션을 통한 원자적 전송

트랜잭션 프로듀서는 여러 토픽이나 파티션에 대한 쓰기 작업을 하나의 원자적 단위로 묶어 '전부 성공' 또는 '전부 실패'에 가깝게 다룰 수 있게 해준다.
Kafka의 Exactly-Once Semantics(EOS)를 구성하는 핵심 기능 중 하나다.

```java
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "tx-id-01");
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("topic-A", key, val));
    producer.send(new ProducerRecord<>("topic-B", key, val));
    producer.commitTransaction();
} catch (org.apache.kafka.common.errors.ProducerFencedException
         | org.apache.kafka.common.errors.OutOfOrderSequenceException
         | org.apache.kafka.common.errors.AuthorizationException e) {
    producer.close();
} catch (org.apache.kafka.common.KafkaException e) {
    producer.abortTransaction();
}
```

트랜잭션 메시지를 읽는 컨슈머는 `isolation.level=read_committed` 설정을 통해 커밋된 데이터만 노출되도록 제어해야 한다.
또한 치명적 예외에서는 현재 프로듀서를 더 이상 재사용할 수 없으므로, 단순히 모든 예외를 `abortTransaction()`으로 처리하는 패턴은 피하는 편이 안전하다.
진행 중인 트랜잭션의 데이터는 커밋 전까지 컨슈머에게 전달되지 않으므로 비즈니스 요구에 맞는 `transaction.timeout.ms` 조정이 수반되어야 한다.

<br>

# 운영 환경별 프로듀서 권장 조합

서비스의 지연 허용 범위와 데이터 중요도에 따른 일반적인 설정 조합이다.

| 설정 항목                | 데이터 내구성 우선 | 처리량(Throughput) 우선 |
|----------------------|------------|--------------------|
| `acks`               | `all`      | `1`                |
| `enable.idempotence` | `true`     | 명시적 `false` 검토     |
| `batch.size`         | 기본값 (16KB) | 32KB ~ 64KB        |
| `linger.ms`          | 0 ~ 5ms    | 10ms ~ 50ms        |
| `compression.type`   | `zstd`     | `lz4`              |

`delivery.timeout.ms` 값은 전송 예산의 상한선이다. 이 값이 초과되면 자동 재시도가 중단되고 애플리케이션에 예외가 전달되므로,
장애 대응 시나리오에 맞춰 충분한 시간을 확보해야 한다.

참고로 Kafka 3.x부터는 `enable.idempotence` 값의 기본값이 `true`로 바뀌었다.
그래서 버전이 섞인 운영 환경이라면 현재 클라이언트 버전에서의 기본값을 먼저 확인하는 편이 안전하다.
그리고 `acks=1` 로 설정할 경우 멱등성 보장 조건과 충돌하므로, `enable.idempotence` 를 `true` 로 함께 설정할 수 없다.
처리량을 우선하는 조합을 의도한다면, 현재 버전의 기본값과 관계없이 멱등성 비활성화를 명시적으로 검토하는 편이 오해를 줄인다.

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation.html#producerconfigs"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - Producer Configs</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - KafkaProducer Javadoc</a>
- <a href="https://kafka.apache.org/34/documentation.html#semantics"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - Message Delivery Semantics</a>
