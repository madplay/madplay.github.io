---
layout: post
title: "Kafka 컨슈머 재처리 방법들"
author: madplay
tags: kafka consumer retry dlt
description: "Kafka 컨슈머에서 실패 메시지를 재처리하는 대표적인 방법과 선택 기준을 코드 중심으로 정리한다."
category: Backend
date: "2023-01-05 21:40:00"
comments: true
---

# Kafka 재처리 설계가 필요한 이유
메시지 브로커를 사용하는 시스템에서 "한 번에 성공"하는 케이스만 고려하는 것은 위험하다.
네트워크 지연, 일시적인 DB 락 경합, 혹은 잘못된 데이터 포맷 등 다양한 이유로 컨슈머는 실패할 수 있다.
실패한 메시지를 단순히 로그만 남기고 버릴지, 아니면 성공할 때까지 다시 시도할지에 따라 시스템의 신뢰도가 결정된다.

Kafka는 토픽의 오프셋을 관리하며 동작하므로, 무작정 재시도하면 전체 처리량(Throughput)이 급감하거나 컨슈머 그룹의 리밸런싱이 발생할 수 있다.
따라서 서비스 성격에 맞는 명확한 재처리 전략을 미리 세워두는 것이 중요하다.

<br>

# 실패 유형을 구분하는 기준
재처리를 시작하기 전, 발생한 에러가 다시 시도했을 때 성공 가능성이 있는지를 먼저 판단해야 한다.
실무에서는 보통 이를 두 가지 유형으로 분류한다.

- **Transient(일시적 오류)**: 네트워크 타임아웃, 커넥션 풀 부족, DB 락 경합 등 잠깐의 시간이 지나면 해결될 가능성이 있는 오류다.
- **Permanent(영구적 오류)**: NPE(NullPointerException), 잘못된 메시지 스키마, 권한 부족 등 데이터 자체나 로직의 문제로 다시 시도해도 실패할 오류다.

<br>

이 분류가 선행되어야 불필요한 재시도로 리소스를 낭비하지 않는다.
아래와 같이 실패 유형을 분류하는 로직을 별도로 관리하는 것이 좋다.

```java
public enum FailureType {
    TRANSIENT,
    PERMANENT
}

/**
 * 발생한 예외에 따라 재처리 가능 여부를 분류한다.
 */
public final class OrderEventFailureClassifier {
    public FailureType classify(Exception e) {
        // 일시적인 네트워크 이슈나 락 경합은 재시도 대상으로 분류
        if (e instanceof java.net.SocketTimeoutException ||
            e instanceof org.springframework.dao.CannotAcquireLockException) {
            return FailureType.TRANSIENT;
        }
        // 그 외 비즈니스 로직 오류 등은 영구 실패로 간주
        return FailureType.PERMANENT;
    }
}
```

> 이 분류 방식은 <a href="https://www.uber.com/blog/reliable-reprocessing/" target="_blank" rel="nofollow">Uber 엔지니어링팀이 대규모 Kafka 재처리 시스템을 설계할 때 사용한 원칙</a>과도 일치한다.

실패 로그를 남길 때는 `topic`, `partition`, `offset`, `key`와 함께 비즈니스 식별자(`orderId` 등)를 반드시 포함해야 추후 추적이 가능하다.

<br>

# 방법 1. 컨슈머 내부에서의 짧은 재시도
가장 단순한 방법은 리스너 내부에서 `for` 루프나 라이브러리를 이용해 짧은 간격으로 재시도하는 것이다.
외부 시스템의 일시적인 순간 장애를 극복하기에 가장 효율적이다.

앞서 정의한 `OrderEventFailureClassifier`를 Bean으로 등록하고, 컨슈머에 주입해서 사용한다.

```java
@Component
public class OrderEventConsumer {

    private final PaymentService paymentService;
    private final OrderEventFailureClassifier classifier;

    public OrderEventConsumer(PaymentService paymentService, OrderEventFailureClassifier classifier) {
        this.paymentService = paymentService;
        this.classifier = classifier;
    }

    @KafkaListener(topics = "order-events", groupId = "order-payment-group")
    public void consume(ConsumerRecord<String, OrderEvent> record) {
        OrderEvent event = record.value();

        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                paymentService.process(event); // 멱등성이 보장되어야 함
                return;
            } catch (Exception ex) {
                FailureType type = classifier.classify(ex);
                log.warn("Attempt failed. attempt={}, orderId={}, type={}", attempt, event.getOrderId(), type);

                if (type == FailureType.PERMANENT || attempt == 3) {
                    throw ex; // 최종 실패 시 에러 핸들러로 위임
                }

                backoff(attempt);
            }
        }
    }

    // 재시도 횟수에 비례해 대기 시간을 늘리는 Exponential Backoff
    private void backoff(int attempt) {
        try {
            Thread.sleep(1000L * attempt);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

이 방식은 구현이 간단하지만, 재시도 시간 동안 컨슈머 스레드가 점유된다는 점을 주의해야 한다.
대기 시간이 길어지면 `max.poll.interval.ms` 설정을 초과하여 브로커가 해당 컨슈머를 비정상으로 판단하고 리밸런싱을 트리거할 수 있다.

<br>

# 방법 2. Retry Topic과 DLT를 활용한 비동기 재처리
즉시 해결되지 않는 문제는 별도의 토픽으로 메시지를 보내서 나중에 처리하는 것이 좋다.
이를 통해 메인 트래픽의 처리 속도를 유지하면서 에러 케이스만 따로 관리할 수 있다.

Spring Kafka를 사용한다면 `@RetryableTopic` 어노테이션으로 이를 쉽게 구현할 수 있다.

```java
@RetryableTopic(
    attempts = "4",          // 최초 시도 1회 + 재시도 3회, 총 4번 처리 시도
    backoff = @Backoff(delay = 1000, multiplier = 2.0),
    include = {java.net.SocketTimeoutException.class}, // 이 예외만 재시도 대상으로 간주
    dltTopicSuffix = "-dlt"
)
@KafkaListener(topics = "order-events")
public void handleOrder(OrderEvent event) {
    paymentService.process(event);
}

@DltHandler
public void handleDlt(OrderEvent event, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    log.error("Message moved to DLT. topic={}, orderId={}", topic, event.getOrderId());
}
```

`attempts`는 최초 처리 시도를 포함한 전체 횟수다. `attempts = "4"`로 설정하면 최초 1회 + 재시도 3회가 된다.
`include`에 명시한 예외만 재시도 대상으로 간주하고, 그 외 예외가 발생하면 재시도 없이 바로 DLT로 이동한다.

이 설정은 내부적으로 `-retry` 접미사가 붙은 토픽들을 자동 생성하여 메시지를 지연 처리한다.
모든 재시도가 실패하면 최종적으로 `-dlt`(Dead Letter Topic)로 이동하며, 운영자는 이곳에 쌓인 메시지를 분석하여 문제를 파악한다.

<br>

# 멱등성과 타임아웃의 중요성
재처리를 논할 때 절대 빠질 수 없는 것이 **멱등성(Idempotency)**이다.
메시지가 두 번 전달되어도 결과는 한 번만 반영되어야 한다. 보통 DB의 Unique Key나 Redis의 분산 락을 활용해 이미 처리된 요청인지 확인한다.

```java
@Transactional
public void process(OrderEvent event) {
	String idempotencyKey = event.getOrderId() + ":" + event.getEventType();

	try {
		/*
		 * DB Unique 제약 조건을 활용해 중복 처리를 원천 차단한다.
		 * existsById 체크와 save 사이에 Race Condition이 발생할 수 있으므로,
		 * save 시 DataIntegrityViolationException이 발생하면 이미 처리된 이벤트로 간주하고 넘어간다.
		 */
		processedRepository.save(new ProcessedEvent(idempotencyKey));
	} catch (DataIntegrityViolationException e) {
		log.info("Already processed event. idempotencyKey={}", idempotencyKey);
		return;
	}

	paymentClient.call(event);
}
```

또한 외부 호출 시 타임아웃을 설정하지 않으면 컨슈머 스레드가 무한정 대기하게 된다.
멱등성과 타임아웃은 재처리 전략의 선택 사항이 아닌, 기본값으로 가져가야 하는 필수 요소다.

<br>

# 어떤 전략을 선택해야 하는가
모든 상황에 맞는 완벽한 정답은 없다. 팀의 운영 리소스와 비즈니스 요구사항에 따라 조합해야 한다.

1.  **즉각적인 복구가 필요한 경우**: 컨슈머 내부 짧은 재시도(1~3회)를 우선 적용한다.
2.  **처리량이 중요한 경우**: 재시도 로직을 별도의 Retry Topic으로 분리하여 Non-blocking으로 처리한다.
3.  **데이터 정정이 필요한 경우**: DLT에 쌓아두고 운영 환경에서 수동 리플레이(Manual Replay)를 수행한다.

DLT에 쌓인 메시지를 재처리할 때는 크게 두 가지 방법을 사용한다. 첫 번째는 `kafka-consumer-groups.sh`로 DLT 컨슈머 그룹의 오프셋을 원하는 시점으로 초기화하는 방법이다.

```bash
# DLT 컨슈머 그룹의 오프셋을 맨 처음으로 되돌려 전체 재처리
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events-dlt \
  --reset-offsets --to-earliest --execute
```

두 번째는 Spring Kafka의 `KafkaTemplate`으로 DLT에 쌓인 메시지를 읽어 원본 토픽으로 재발행하는 방법이다.
이 경우 특정 메시지만 선별해서 재처리하거나, 데이터를 보정한 뒤 발행할 수 있어 더 유연하다.

```java
@KafkaListener(topics = "order-events-dlt", groupId = "order-dlt-replayer")
public void replayFromDlt(ConsumerRecord<String, OrderEvent> record) {
    OrderEvent correctedEvent = correctIfNeeded(record.value());
    kafkaTemplate.send("order-events", record.key(), correctedEvent);
    log.info("Replayed from DLT. orderId={}", correctedEvent.getOrderId());
}
```

결국 "무조건적인 재시도"보다는 실패의 성격을 명확히 정의하고, 각 단계별로 안전장치를 두는 것이 시니어 엔지니어가 갖춰야 할 설계 역량이다.

<br>

# 참고
- <a href="https://docs.spring.io/spring-kafka/reference/retrytopic.html" target="_blank" rel="nofollow">Spring for Apache Kafka: Non-Blocking Retries and Dead Letter Topics</a>
