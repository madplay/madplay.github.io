---
layout: post
title: "카프카 스키마 레지스트리란? 그리고 왜 필요할까?"
author: madplay
tags: kafka schema-registry avro compatibility
description: "카프카 스키마 레지스트리가 무엇이고 왜 필요할까? 그리고 사용할 때 체크할 부분들!"
category: Backend
date: "2023-05-03 19:46:05"
comments: true
---

# 스키마 레지스트리란?
스키마 레지스트리(Schema Registry)는 이벤트 스키마를 중앙에서 등록하고 관리하는 저장소다.
프로듀서는 메시지에 스키마 자체를 매번 담지 않고 스키마 ID를 함께 보내고, 컨슈머는 이 ID로 스키마를 조회해 역직렬화한다.
결국 스키마 레지스트리는 저장소 역할과 함께, 팀이 같은 호환성 정책으로 변경을 검증하게 만드는 운영 기준점이 된다.

스키마 레지스트리를 쓰면 필드 추가나 타입 변경 같은 스키마 진화를 배포 전에 검증할 수 있어 런타임 오류를 줄이는 데 도움이 된다.
또한 생산자와 소비자가 같은 시점에 배포되지 않더라도 호환성 정책을 기준으로 변경을 관리할 수 있어, 팀 간 배포 속도가 다른 환경에서 특히 유용하다.
반면 운영 요소가 하나 더 늘어나기 때문에 레지스트리 가용성 관리, 권한 정책, 클라이언트 설정 버전 일치 같은 관리 포인트가 추가된다는 점은 감안해야 한다.

<br>

# 스키마 변경이 배포 이슈가 되는 이유
카프카 스키마 레지스트리를 도입하지 않으면, 생산자와 소비자 배포 시점이 엇갈릴 때 역직렬화 오류를 자주 만나게 된다.
예를 들어 프로듀서가 새 필드를 추가해 배포했는데 컨슈머가 구버전 스키마를 기준으로 메시지를 읽으면 소비가 실패할 수 있다.
스키마 변경을 코드 변경처럼 관리하지 않으면 특정 시점에 재처리 비용이 크게 늘어날 수 있다.

그래서 카프카 운영에서는 "스키마를 어디에 등록하고 어떤 호환 정책으로 바꿀지"를 먼저 정하는 편이 좋다.

<br>

# 스키마 레지스트리가 해결하는 문제
Schema Registry는 Avro/JSON Schema/Protobuf 스키마를 중앙에서 관리하고 호환성을 검사한다.
프로듀서는 메시지와 함께 스키마 전체를 매번 보내지 않고, 스키마 ID를 사용해 직렬화한다.
컨슈머는 스키마 ID를 조회해 역직렬화한다.

```text
Producer -> Schema Registry(스키마 등록/조회) -> Kafka Topic
Consumer -> Kafka Topic(스키마 ID 포함 메시지 수신) -> Schema Registry(스키마 조회)
```

이 구조의 장점은 두 가지다.

- 팀 단위로 스키마 변경 규칙을 강제할 수 있다.
- 런타임 역직렬화 실패를 배포 전에 줄일 수 있다.

<br>

# 호환성 모드 선택 기준
스키마를 관리할 때 가장 먼저 정해야 하는 것은 compatibility 모드다.
2023년 5월 기준으로 많이 쓰는 선택은 `BACKWARD` 또는 `FULL_TRANSITIVE`다.

- `BACKWARD`: 새 스키마로 과거 데이터를 읽을 수 있어야 한다.
- `FORWARD`: 과거 스키마로 새 데이터를 읽을 수 있어야 한다.
- `FULL`: backward + forward를 동시에 만족해야 한다.
- `*_TRANSITIVE`: 최신 스키마와의 비교가 아니라 모든 과거 버전과 비교한다.

## Subject 호환성 조회
```bash
curl -s http://localhost:8081/config/order-events-value
```

## 호환성 변경 예시
```bash
curl -X PUT \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{"compatibility":"BACKWARD"}' \
  http://localhost:8081/config/order-events-value
```

운영에서 subject 단위로 다르게 가져갈 수도 있지만, 기준이 없으면 팀마다 정책이 갈라진다.
도메인별 기본 정책을 문서로 고정해두는 편이 유지보수에 유리하다.

<br>

# Avro 스키마 변경 패턴
아래는 주문 이벤트 스키마의 안전한 변경 예시다.
기존 필드는 유지하고, 새 필드는 기본값(default)을 둔다.

```json
{
  "type": "record",
  "name": "OrderEvent",
  "namespace": "com.example.events",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "createdAt", "type": "long"},
    {"name": "source", "type": ["null", "string"], "default": null}
  ]
}
```

반대로 기존 필드를 삭제하거나 required 필드를 기본값 없이 추가하면 호환성 검증에서 실패할 가능성이 크다.
이 부분은 빌드 단계에서 검증되도록 CI에 넣어두면 운영 실수를 줄이는 데 도움이 된다.

<br>

# 직렬화/역직렬화 설정 체크포인트
스키마를 제대로 적용하려면 직렬화기/역직렬화기 설정이 맞아야 한다.
아래는 스프링 부트 기반 설정 예시다.

```yaml
spring:
  kafka:
    properties:
      schema.registry.url: http://localhost:8081
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
      properties:
        acks: all
        enable.idempotence: true
        delivery.timeout.ms: 120000
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: io.confluent.kafka.serializers.KafkaAvroDeserializer
        specific.avro.reader: true
```

`enable.idempotence=true`는 네트워크 재시도 상황에서 중복 전송 가능성을 낮추는 데 도움이 된다.
또한 `delivery.timeout.ms`를 기본값 그대로 두지 말고 서비스 지연 허용치에 맞춰 점검하는 편이 좋다.

<br>

# 배포 순서와 에러 핸들링 설계
스키마 진화에서 자주 보는 장애는 "생산자 먼저 배포했는데 구버전 컨슈머가 새 필드를 못 읽는" 케이스다.
그래서 아래 순서를 기본으로 둔다.

1. 호환 가능한 스키마를 Registry에 먼저 등록한다.
2. 새 스키마를 읽을 수 있는 컨슈머를 먼저 배포한다.
3. 그 다음 생산자를 배포한다.

역직렬화 오류는 리스너 진입 전에 발생할 수 있으므로, 컨테이너 에러 핸들러에서 분리해 두는 편이 운영에 유리하다.
아래 예시는 역직렬화 오류를 DLT로 보내고, 일시 오류는 제한 횟수만 재시도하는 구성이다.

```java
@Bean
public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
        kafkaTemplate,
        (record, ex) -> new TopicPartition(record.topic() + ".dlt", record.partition())
    );

    DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2));
    errorHandler.addNotRetryableExceptions(
        org.apache.kafka.common.errors.SerializationException.class,
        org.springframework.kafka.support.serializer.DeserializationException.class
    );
    return errorHandler;
}
```

```java
@KafkaListener(topics = "order-events-avro", groupId = "order-event-consumer")
public void consume(ConsumerRecord<String, OrderEvent> record) {
    OrderEvent event = record.value();

    log.info("consume start. key={}, partition={}, offset={}, orderId={}",
        record.key(), record.partition(), record.offset(), event.getOrderId());

    orderEventService.handle(event); // 비즈니스 처리

    log.info("consume success. key={}, partition={}, offset={}, orderId={}",
        record.key(), record.partition(), record.offset(), event.getOrderId());
}
```

역직렬화 오류는 영구 오류에 가깝기 때문에 무한 재시도보다 DLT 분기가 운영 효율이 높은 편이다.
반대로 외부 API 타임아웃 같은 일시 오류는 재시도 횟수와 백오프를 두는 편이 안정적이다.
성능 관점에서는 스키마 조회 캐시, 컨슈머 역직렬화 비용, 레코드 크기 증가를 같이 확인해야 한다.

<br>

# 마치며
스키마 레지스트리를 도입하면 스키마 변경을 개인의 성향에 의존하지 않고, 팀이 합의한 규칙으로 일관되게 관리할 수 있다.
운영에서는 아래 항목을 함께 점검하면 변경 과정에서 생기는 혼선을 줄일 수 있다.

- 도메인별 compatibility 기본 정책을 먼저 정한다.
- 스키마 등록과 컨슈머 선배포 순서를 지킨다.
- 역직렬화 오류와 일시 오류를 분리해 처리 경로를 나눈다.
- DLT 적재량, 재시도율, 지연 지표를 함께 관찰한다.

이렇게 하면 스키마 진화는 배포 리스크가 아니라 운영 가능한 변경 절차로 다룰 수 있다.

<br>

# 참고
- <a href="https://docs.confluent.io/platform/current/schema-registry/index.html" target="_blank" rel="nofollow">Confluent Schema Registry Documentation</a>
- <a href="https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html" target="_blank" rel="nofollow">Confluent Schema Evolution and Compatibility</a>
- <a href="https://avro.apache.org/docs/current/specification/" target="_blank" rel="nofollow">Apache Avro Specification</a>
