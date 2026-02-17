---
layout: post
title: "Kafka 에러 처리와 Dead Letter Topic 설계"
author: madplay
tags: kafka spring-kafka error-handling dead-letter-topic dlt
description: "Spring Kafka의 에러 핸들러 구조와 ErrorHandlingDeserializer, DeadLetterPublishingRecoverer의 내부 동작을 다루고, DLT 토픽 설계와 재처리 전략을 살펴본다."
category: Backend
date: "2023-05-06 14:22:37"
comments: true
---

# Dead Letter Topic과 에러 처리

택배가 배달 불가 판정을 받으면 발송인에게 반송되거나 별도 보관소로 옮겨진다.
Kafka 컨슈머도 비슷하다. 메시지 처리에 실패했을 때, 해당 메시지를 그냥 버릴 수도 있고 별도의 토픽으로 격리해 나중에 다시 살펴볼 수도 있다.
이 "별도 토픽"을 Dead Letter Topic(이하 DLT)이라고 부른다.

<a href="/post/kafka-consumer-reprocessing-methods" target="_blank">Kafka 컨슈머 재처리 방법들</a>에서
`@RetryableTopic`과 `@DltHandler`로 실패 메시지를 DLT에 보내는 흐름을 살펴봤다.
그런데 Spring Kafka가 내부적으로 에러를 분류하고 재시도를 제어하는 구조는 어떻게 돼 있을까?
그리고 DLT 토픽을 실제 서비스에서 운영하려면 네이밍, 파티션 수, 보관 기간을 어떻게 잡아야 할까?

<br>

# 에러의 두 갈래: 역직렬화 vs 비즈니스 로직

Kafka 컨슈머에서 발생하는 에러는 크게 두 단계로 나뉜다.

첫 번째는 **역직렬화(Deserialization) 단계**다. 브로커에서 가져온 바이트 배열을 객체로 변환하는 과정에서 스키마 불일치, 잘못된 포맷, 인코딩 오류 등이 발생할 수 있다.
이 단계의 오류는 리스너 메서드가 호출되기 전에 터지기 때문에, 리스너 내부의 `try-catch`로는 잡을 수 없다.

두 번째는 **비즈니스 로직 단계**다. 역직렬화는 성공했지만 후속 처리 과정에서 DB 커넥션 실패, 외부 API 타임아웃, 유효성 검증 실패 등이 발생하는 경우다.
이 단계의 오류는 리스너 메서드 내부에서 예외로 전파된다.

그렇다면 Spring Kafka는 이 두 종류의 에러를 어떻게 구분해서 처리할까?

<br>

# Spring Kafka 에러 핸들러 구조

Spring Kafka 3.0 기준으로, 에러 처리의 진입점은 `CommonErrorHandler` 인터페이스다.
이전 버전에서 사용하던 `ErrorHandler`와 `BatchErrorHandler`는 deprecated 되었고, `CommonErrorHandler`가 이 둘을 통합한다.

`CommonErrorHandler`의 기본 구현체가 `DefaultErrorHandler`다. 클래스 계층은 다음과 같다.

```text
Object
  └─ KafkaExceptionLogLevelAware
       └─ ExceptionClassifier
            └─ FailedBatchProcessor
                 └─ DefaultErrorHandler  (implements CommonErrorHandler)
```

`DefaultErrorHandler`는 메시지 처리가 실패하면 해당 오프셋으로 seek하여 같은 메시지를 다시 가져오게 만든다.
재시도 횟수와 간격은 `BackOff` 객체로 제어한다. `BackOff`는 "몇 초 간격으로, 최대 몇 회까지 재시도할지"를 정의하는 Spring의 유틸리티 인터페이스다.
최종 실패 시에는 `ConsumerRecordRecoverer`에게 후속 처리를 위임한다.

```java
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        // 최종 실패 시 DLT로 발행하는 recoverer
        DeadLetterPublishingRecoverer recoverer =
            new DeadLetterPublishingRecoverer(kafkaTemplate);

        // 1초 간격으로 최대 3회 재시도, 이후 recoverer로 위임
        FixedBackOff backOff = new FixedBackOff(1000L, 3L);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
```

`FixedBackOff(1000L, 3L)`에서 두 번째 인자는 최대 재시도 횟수다. 최초 처리 1회 + 재시도 3회, 총 4회 시도한 뒤에도 실패하면 `DeadLetterPublishingRecoverer`가 해당 레코드를 DLT로 발행한다.

여기서 주의할 점이 있다. `DefaultErrorHandler`의 재시도는 컨슈머 스레드 안에서 동기적으로 동작한다.
재시도 간격이 길어지면 `max.poll.interval.ms`를 초과해 리밸런싱이 발생할 수 있으므로, 짧은 간격의 소수 재시도에 적합하다.

<br>

# ErrorHandlingDeserializer로 역직렬화 오류 격리

앞서 역직렬화 오류는 리스너가 호출되기 전에 발생한다고 했다. 이 문제를 해결하는 것이 `ErrorHandlingDeserializer`다.

`ErrorHandlingDeserializer`는 실제 역직렬화를 내부의 delegate deserializer에게 위임한다.
delegate가 예외를 던지면 `ErrorHandlingDeserializer`는 이를 잡아서 `DeserializationException`으로 감싸고, 레코드의 헤더에 에러 정보를 담아 리스너 컨테이너로 전달한다.
리스너 컨테이너는 이 헤더를 보고 `CommonErrorHandler`에게 처리를 위임하므로, 역직렬화 오류도 `DefaultErrorHandler` → `DeadLetterPublishingRecoverer` 경로로 흘러갈 수 있게 된다.

```yaml
spring:
  kafka:
    consumer:
      key-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.key.delegate.class: org.apache.kafka.common.serialization.StringDeserializer
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
        spring.json.trusted.packages: "com.example.order.event"
```

`ErrorHandlingDeserializer`를 설정하지 않으면, 역직렬화 예외가 발생할 때 컨슈머가 해당 오프셋에서 무한 반복하는 "poison pill" 현상이 생길 수 있다.
poison pill이란 깨진 메시지가 오프셋을 점유해서, 그 뒤에 대기 중인 정상 메시지까지 처리를 막아버리는 현상이다.
메시지 자체가 깨졌으니 아무리 다시 읽어도 같은 예외가 반복된다.

`ErrorHandlingDeserializer`를 적용하면 깨진 메시지를 DLT로 보내고 다음 오프셋으로 넘어갈 수 있으므로, JSON이나 Avro 기반 역직렬화를 사용하는 환경에서는 기본으로 설정해 두는 것이 안전하다.

<br>

# DeadLetterPublishingRecoverer의 동작과 헤더

`DeadLetterPublishingRecoverer`는 최종 실패한 레코드를 DLT로 발행할 때, 원본 레코드의 key와 value를 그대로 유지하면서 여러 개의 헤더를 추가한다.

```text
kafka_dlt-exception-fqcn     : 예외 클래스의 FQCN
kafka_dlt-exception-message   : 예외 메시지
kafka_dlt-exception-stacktrace: 스택 트레이스
kafka_dlt-original-topic      : 원본 토픽 이름
kafka_dlt-original-partition  : 원본 파티션 번호
kafka_dlt-original-offset     : 원본 오프셋
kafka_dlt-original-timestamp  : 원본 타임스탬프
```

이 헤더들 덕분에 DLT에 쌓인 메시지를 분석할 때 "어떤 토픽의 몇 번 파티션, 몇 번 오프셋에서 어떤 예외로 실패했는지"를 추적할 수 있다.

기본적으로 DLT 토픽 이름은 원본 토픽 이름에 `-dlt` 접미사가 붙는다. 예를 들어 원본 토픽이 `order-events`라면 DLT는 `order-events-dlt`가 된다.
이 네이밍 규칙은 `DeadLetterPublishingRecoverer`의 생성자에 `BiFunction<ConsumerRecord<?, ?>, Exception, TopicPartition>`을 전달해 변경할 수 있다.

```java
DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
    kafkaTemplate,
    (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition())
);
```

위 코드는 접미사를 `.DLT`로 바꾸고, 원본 레코드의 파티션 번호를 그대로 사용한다.
파티션 번호를 유지하면 원본 토픽의 순서 보장 단위가 DLT에서도 동일하게 유지되므로, 재처리 시 순서가 중요한 경우에 유용하다.

<br>

# 예외 분류: 재시도 대상과 즉시 DLT 대상

모든 예외를 동일하게 재시도하는 것은 비효율적이다. `NullPointerException`이나 `JsonParseException`처럼 다시 시도해도 결과가 바뀌지 않는 예외는 재시도 없이 바로 DLT로 보내는 것이 낫다.

`DefaultErrorHandler`는 `ExceptionClassifier`를 상속하므로, `addNotRetryableExceptions` 메서드로 재시도하지 않을 예외를 등록할 수 있다.

```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(kafkaTemplate);

    DefaultErrorHandler handler = new DefaultErrorHandler(
        recoverer, new FixedBackOff(1000L, 3L)
    );

    // 아래 예외는 재시도 없이 즉시 DLT로 이동
    handler.addNotRetryableExceptions(
        com.fasterxml.jackson.core.JsonParseException.class,
        org.springframework.messaging.converter.MessageConversionException.class
    );

    return handler;
}
```

이렇게 등록된 예외가 발생하면 `DefaultErrorHandler`는 `BackOff`를 무시하고 바로 `DeadLetterPublishingRecoverer`를 호출한다.
반대로 `addRetryableExceptions`를 사용하면 화이트리스트 방식으로 재시도 대상만 명시할 수도 있다.

어떤 방식을 쓸지는 서비스 특성에 따라 다르다. 예외 종류가 다양하고 대부분 재시도할 필요가 없다면 화이트리스트가 관리하기 편하고, 대부분 재시도 대상이고 일부만 제외해야 한다면 블랙리스트가 적합하다.

<br>

# DLT 토픽 설계 체크포인트

DLT를 단순히 "실패 메시지를 담는 쓰레기통"으로 만들면, 나중에 재처리가 필요할 때 분석과 복구가 어려워진다. 운영을 고려한 설계 포인트를 몇 가지 짚어 본다.

## 토픽 네이밍

일관된 네이밍 규칙이 있어야 모니터링 도구에서 DLT만 모아 볼 수 있다.
`-dlt` 접미사가 Spring Kafka의 기본값이므로 특별한 이유가 없으면 이 규칙을 유지하는 편이 혼란이 적다.

## 파티션 수

DLT의 파티션 수를 원본 토픽과 동일하게 맞추면, 앞서 본 것처럼 `DeadLetterPublishingRecoverer`에서 원본 파티션 번호를 그대로 쓸 수 있다.
다만 DLT는 원본 토픽 대비 유입량이 훨씬 적으므로, 파티션을 과도하게 많이 두면 리소스 낭비가 될 수 있다.
원본 토픽의 파티션이 수십 개 이상이라면 DLT는 더 작은 수로 설정하되, 파티션 매핑 함수에서 `record.partition() % dltPartitionCount`처럼 모듈러 연산을 사용하는 방법도 있다.

## Retention 설정

DLT 메시지는 분석과 재처리를 위해 원본 토픽보다 긴 보관 기간을 두는 경우가 많다.
예를 들어 원본 토픽이 7일이라면 DLT는 30일로 설정해서, 장애 원인을 파악하고 수정 배포한 뒤에도 재처리할 여유를 확보한다.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events-dlt \
  --alter --add-config retention.ms=2592000000
```

2592000000밀리초는 30일이다.

## 모니터링

DLT에 메시지가 쌓이기 시작한다는 것은 컨슈머의 에러 처리 경로가 동작했다는 의미다.
DLT 토픽의 lag이나 레코드 증가율을 모니터링하면, 장애 초기에 빠르게 인지할 수 있다.

```bash
# DLT 토픽의 현재 오프셋과 lag 확인
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-dlt-monitor-group \
  --describe
```

<br>

# DLT 재처리 파이프라인

DLT에 쌓인 메시지를 어떻게 다시 처리할지는 서비스마다 다르지만, 대표적인 방법은 두 가지다.

## 오프셋 리셋으로 전체 재처리

DLT 전용 컨슈머 그룹의 오프셋을 리셋하면, DLT에 쌓인 메시지를 처음부터 다시 읽을 수 있다.
코드 수정이 필요 없어 긴급 상황에서 빠르게 실행할 수 있지만, 모든 메시지를 다시 처리하므로 멱등성이 보장되어야 한다.

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-dlt-replayer \
  --topic order-events-dlt \
  --reset-offsets --to-earliest --execute
```

## 선별 재처리 컨슈머

특정 조건의 메시지만 골라서 보정한 뒤 원본 토픽으로 재발행하는 전용 컨슈머를 만드는 방법이다. 데이터를 수정하거나 특정 시간대의 메시지만 재처리해야 할 때 유용하다.

아래 예시는 비즈니스 로직 실패로 DLT에 들어온 메시지를 전제한다. 역직렬화 실패로 들어온 레코드는 value가 원시 바이트이므로, 별도의 `ConsumerRecord<String, byte[]>` 컨슈머로 분리하거나 헤더의 예외 정보(`DLT_EXCEPTION_FQCN`)를 기준으로 분기 처리하는 것이 안전하다.

```java
@Component
public class DltReplayConsumer {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public DltReplayConsumer(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
        topics = "order-events-dlt",
        groupId = "order-dlt-selective-replayer"
    )
    public void replay(
        ConsumerRecord<String, OrderEvent> record,
        @Header(KafkaHeaders.DLT_ORIGINAL_TOPIC) String originalTopic
    ) {
        OrderEvent event = record.value();

        if (!isReplayTarget(event)) {
            log.info("skip replay. orderId={}", event.getOrderId());
            return;
        }

        OrderEvent corrected = correctIfNeeded(event);
        kafkaTemplate.send(originalTopic, record.key(), corrected);
        log.info("replayed to original topic. orderId={}, originalTopic={}",
            corrected.getOrderId(), originalTopic);
    }

    private boolean isReplayTarget(OrderEvent event) {
        // 재처리 대상 판별 로직: 특정 에러 코드, 시간 범위 등
        return event.getErrorCode() != null
            && event.getErrorCode().startsWith("TIMEOUT");
    }

    private OrderEvent correctIfNeeded(OrderEvent event) {
        // 데이터 보정이 필요한 경우 여기서 처리
        return event;
    }
}
```

`@Header(KafkaHeaders.DLT_ORIGINAL_TOPIC)`으로 원본 토픽 이름을 꺼내서, 보정한 메시지를 정확히 원래 토픽으로 보낸다.
재발행 시 원본 key를 유지해야 같은 파티션으로 라우팅되므로, `record.key()`를 그대로 사용하는 것이 중요하다.

이 방식은 유연하지만, 재처리 컨슈머 자체가 실패하면 "DLT의 DLT"가 필요해지는 상황이 생길 수 있다.
따라서 재처리 컨슈머의 에러 핸들링은 단순하게 유지하고, 실패 시 로그와 알림으로 수동 개입하는 방향이 운영 부담이 적다.

<br>

# 참고
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#error-handlers" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Error Handlers</a>
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#dead-letters" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Publishing Dead-letter Records</a>
- <a href="https://kafka.apache.org/34/documentation/" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation</a>
