---
layout: post
title: "Kafka exactly-once, 정말 한 번만 처리될까?"
author: madplay
tags: kafka semantics exactly-once idempotence transaction consumer
description: "at-most-once, at-least-once, exactly-once의 차이와 한계를 살펴보고, Kafka에서 중복과 유실이 발생하는 지점을 정리한다."
category: Backend
date: "2023-06-24 19:24:11"
comments: true
---

# Kafka 메시지 전달 보장: at-most-once, at-least-once, exactly-once

주문과 결제 이벤트를 분리해 처리하다 보면, 브로커에는 한 번만 저장된 것처럼 보이는데 실제 결과는 두 번 반영되는 순간을 만나기 쉽다.
프로듀서의 성공 기준과 컨슈머의 커밋 시점이 서로 다른 층위에 있기 때문에 발생하는 문제다. 장애 시점과 재시도 전략에 따라
유실이나 중복이 필연적으로 발생할 수밖에 없는 구조를 먼저 이해해야 한다.

<br>

# 전달 보장 유형과 실패 지점

메시지 전달 보장(delivery semantics)은 장애 발생 시 메시지가 몇 번이나 유입될 수 있는지를 정의한다.
Kafka 공식 문서는 이 문제를 프로듀서의 기록 내구성과 컨슈머의 처리 오프셋 관리로 나누어 설명한다.


- at-most-once   : 유실은 가능하지만 중복은 허용하지 않음
- at-least-once  : 유실은 줄이지만 중복은 가능함
- exactly-once   : 한 번만 처리된 결과를 목표로 함

이 분류는 "누가 언제 실패하느냐"에 따라 갈린다. 프로듀서가 응답을 받기 전에 종료되는지, 컨슈머가 비즈니스 로직 처리 후 오프셋 커밋 전에 종료되는지에 따라 결과가 달라진다.

**메시지 처리 흐름**

| 단계    | 구분                      | 설명                                   |
|:------|:------------------------|:-------------------------------------|
| **1** | **Producer Send**       | 메시지를 브로커로 발송 (프로듀서 전송)               |
| **2** | **Broker Append**       | 브로커의 로컬 로그에 안전하게 기록 (브로커 저장)         |
| **3** | **Consumer Poll**       | 브로커로부터 데이터를 읽어옴 (컨슈머 수신)             |
| **4** | **Business Processing** | DB 저장, 알림 등 실제 업무 로직 수행 (비즈니스 로직 처리) |
| **5** | **Offset Commit**       | 처리가 완료된 위치를 확정 (오프셋 커밋)              |

**장애 지점별 데이터 보장 영향**

- **2단계 이전 장애**: 브로커 기록 전이므로 메시지가 **유실**될 수 있다.
- **4단계 이후 ~ 5단계 이전 장애**: 처리는 끝났으나 커밋이 안 된 상태로, 재시작 시 **중복 처리**될 수 있다.
- **4~5단계 원자성 결여**: 처리와 커밋이 동시에 성공하거나 실패하지 않으면 **Exactly-once**를 보장할 수 없다.

"브로커에 한 번 기록됨"과 "애플리케이션에 한 번 반영됨"은 엄연히 다른 단계다. Kafka의 기록 성공이 비즈니스 처리의 성공을 담보하지 않는다는 점이 운영 설계의 출발점이다.

<br>

# 도메인 특성에 따른 보장 수준 선택

모든 시스템에 exactly-once를 강제할 필요는 없다. 로그 수집이나 메트릭 적재처럼 일부 중복을 허용할 수 있다면 at-least-once가 구현과 운영 비용 측면에서 유리하다.

| 시나리오             | 권장 시맨틱스                           | 주요 설정 및 전략                 |
|------------------|-----------------------------------|----------------------------|
| 접근 로그, 메트릭       | at-most-once 또는 느슨한 at-least-once | `acks=0` 또는 단순 소비          |
| 알림, 캐시 갱신        | at-least-once                     | `acks=all`, 처리 후 커밋, 멱등 소비 |
| 주문, 결제 이벤트 변환    | Kafka 내부 exactly-once             | 트랜잭션 + `read_committed`    |
| Kafka → 외부 DB 반영 | at-least-once + 멱등 저장             | 처리 후 커밋, DB unique key 활용  |

중요한 것은 "완벽한 보장"이 아니라 "장애 시 어떤 비용을 감수할 것인가"이다. 중복 제거가 쉬운 시스템은 at-least-once로 충분하며,
외부 부작용이 큰 시스템은 Kafka 트랜잭션과 별개로 비즈니스 레벨의 멱등성을 최우선으로 고려해야 한다.

<br>

# 프로듀서 내구성과 멱등성

프로듀서 단계에서는 `acks`, `retries`, `enable.idempotence`가 내구성의 방향을 크게 좌우한다.
브로커에 메시지를 안전하게 기록하더라도 네트워크 타임아웃으로 인한 재시도 과정에서 중복이 발생할 수 있으므로, 내구성과 중복 방지는 항상 함께 검토해야 한다.

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

`acks=0`은 응답을 기다리지 않아 지연은 낮지만 유실 가능성이 가장 크다.
`acks=all`은 ISR 전체의 확인을 기다려 내구성을 높이지만 `min.insync.replicas` 설정에 따라 실제 의미가 달라진다.

멱등 프로듀서(idempotent producer)는 재시도 시 브로커가 메시지 시퀀스를 확인하여 중복 저장을 막는다.
Kafka 3.0부터는 `enable.idempotence`가 기본적으로 활성화되지만, 이는 **동일 프로듀서 세션의 동일 파티션** 범위로 제한된다는 점에 주의해야 한다.

<br>

# 컨슈머 커밋 시점의 영향

컨슈머가 오프셋을 커밋하는 시점은 메시지 유실과 중복 가능성에 직접 연결된다. 오프셋은 그룹의 읽기 위치를 나타내므로 처리 전 커밋은 유실 위험을, 처리 후 커밋은 중복 위험을 동반한다.

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        processPayment(record); // 비즈니스 처리
    }
    consumer.commitSync(); // 처리 완료 후 수동 커밋
}
```

위와 같은 처리 후 커밋 방식은 대표적인 at-least-once 구조다.
`processPayment()`가 성공했으나 `commitSync()` 직전에 프로세스가 죽으면 동일한 레코드가 다시 읽힌다.
이런 처리 후 커밋 패턴은 Kafka 소비 애플리케이션에서 흔히 채택되는 at-least-once 구조다.

<br>

# 트랜잭션을 활용한 원자적 처리

exactly-once는 프로듀서의 멱등성만으로는 부족하다. 컨슈머의 읽기 위치와 출력 토픽의 기록 결과가 하나의 원자적 범위에 포함되어야 한다.
Kafka는 트랜잭션 프로듀서와 오프셋 커밋 기능을 결합하여 이를 지원한다.

```java
// 아래 예제는 흐름 설명을 위한 단순화된 예제다.
producerProps.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "payment-tx-01");
consumerProps.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");

producer.initTransactions();
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    producer.beginTransaction();
    try {
        for (ConsumerRecord<String, String> record : records) {
            String result = transform(record.value());
            producer.send(new ProducerRecord<>("output-topic", record.key(), result));
        }
        // 출력 토픽 기록과 오프셋 커밋을 동일한 트랜잭션으로 묶음
        producer.sendOffsetsToTransaction(currentOffsets, consumer.groupMetadata());
        producer.commitTransaction();
    } catch (Exception e) {
        producer.abortTransaction();
    }
}
```

전송 결과와 오프셋 커밋을 동일한 원자적 범위로 묶어 실패 시 동시 롤백을 보장하는 구조다.
한쪽만 성공하고 다른 쪽은 실패하는 '부분 성공' 상태를 방지하여 시스템 일관성을 유지한다. 여기서 `transactional.id`는 재시작한 프로듀서가 이전의 미완료
트랜잭션을 식별하고 정리하는 기준이 되므로 인스턴스마다 고유하게 관리해야 한다.

실제 코드에서는 `ProducerFencedException` 같은 치명적 예외를 별도로 분기해 현재 프로듀서를 종료해야 할 수 있으므로,
모든 예외를 하나로 묶어 `abortTransaction()`만 호출하는 패턴을 운영 코드에 그대로 적용하는 것은 피하는 편이 안전하다.

<br>

# read_committed 컨슈머의 동작 특성

트랜잭션을 활용할 때 컨슈머가 `read_committed`를 설정하지 않으면 중단된(abort) 트랜잭션의 데이터까지 읽게 되어 exactly-once가 깨진다.

```java
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
```

`read_committed` 설정은 읽기 시점에도 영향을 준다. 아직 완료되지 않은 트랜잭션 뒤에 있는 레코드는 마지막 안정 오프셋(LSO)까지만 반환되므로,
파티션에 데이터가 쌓여 있어도 poll 결과에는 즉시 나타나지 않을 수 있다.

Kafka 내부의 exactly-once 메커니즘이 외부 저장소(RDB, NoSQL 등)까지 자동 확장되지는 않는다.
컨슈머가 DB에 기록하는 구조라면 결과 저장소 자체에 유니크 키를 두어 비즈니스 레벨의 멱등성을 확보하거나,
Kafka 트랜잭션 내에서 상태를 관리하는 정교한 설계가 병행되어야 한다.

<br>

# 참고

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/producer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Producer Configs</a>
- <a href="https://kafka.apache.org/35/configuration/consumer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Consumer Configs</a>
