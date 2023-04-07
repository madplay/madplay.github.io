---
layout: post
title: "카프카(Kafka) 파티션은 몇 개가 적당할까? 컨슈머를 늘려도 빨라지지 않는 이유"
author: madplay
tags: kafka topic partition consumer group
description: "카프카 파티션 수를 어떻게 정할까? 처리량, 순서 보장 기준 그리고 증설 시 주의점을 알아보자!"
category: Backend
date: "2023-04-07 20:14:37"
comments: true
---

# 왜 컨슈머를 늘려도 빨라지지 않을까
카프카 파티션과 컨슈머 관계를 초기에 충분히 정리하지 않으면, 인스턴스를 늘려도 처리량이 기대만큼 올라가지 않는 상황을 만나기 쉽다.
택배 분류 라인에서 구역을 나누지 않으면 작업자를 늘려도 정체가 풀리지 않는 것처럼, 카프카도 파티션 구조가 병렬 처리의 기준이 된다.
그래서 토픽, 파티션, 컨슈머 그룹이 어떻게 연결되는지 먼저 잡아두는 편이 운영에 유리하다.

기본 토픽 설정이 궁금하다면 먼저 <a href="/post/kafka-topic-configurations" target="_blank">Kafka 토픽 설정값 정리</a> 글을 함께 보는 것도 도움이 된다.

<br>

# 토픽과 파티션의 역할
> 파티션 내부 순서는 보장되지만, 토픽 전체의 전역 순서는 보장되지 않는다.

토픽(Topic)은 메시지를 분류하는 논리적인 이름이다. 반면 파티션(Partition)은 메시지가 실제로 저장되는 물리적 단위다.
즉, 하나의 토픽은 여러 개 파티션으로 나뉘고, 각 파티션은 `append-only` 로그처럼 동작한다.

`append-only`는 기존 레코드를 중간에서 수정하지 않고, 파일 끝에 새 레코드를 계속 추가한다는 뜻이다.
그래서 레코드는 `offset` 기준으로 순서대로 쌓이고, 컨슈머는 이 `offset`을 기준으로 어디까지 읽었는지 관리한다.
같은 파티션 안에서는 이 순서가 유지되지만, 다른 파티션 사이의 전역 순서는 보장되지 않는다.

```text
topic: order-events
- partition 0: offset 0, 1, 2, 3 ...
- partition 1: offset 0, 1, 2 ...
- partition 2: offset 0, 1 ...
```

중요한 점은 순서 보장 범위다. 카프카가 보장하는 순서는 토픽 전체가 아니라 파티션 내부 순서다.
따라서 "같은 주문(orderId)은 항상 같은 순서로 처리되어야 한다" 같은 요구가 있으면 key 기반 파티셔닝을 같이 설계해야 한다.

<br>

# 컨슈머 그룹과 병렬 처리 구조
같은 컨슈머 그룹 내에서는 한 파티션이 동시에 여러 컨슈머에 할당되지 않는다.
이 규칙 때문에 파티션 수와 컨슈머 수의 관계를 이해해야 처리량 계획을 세울 수 있다.

- 파티션 수가 6, 컨슈머가 3이면: 각 컨슈머가 2개씩 나눠 처리한다.
- 파티션 수가 3, 컨슈머가 6이면: 3개 컨슈머는 유휴 상태가 된다.
- 파티션 수가 6, 컨슈머가 1이면: 병렬성 없이 1개 인스턴스가 모두 처리한다.

```java
@KafkaListener(topics = "order-events", groupId = "order-worker-group")
public void consume(ConsumerRecord<String, OrderEvent> record) {
    log.info("consume event. key={}, partition={}, offset={}, orderId={}",
        record.key(),
        record.partition(),
        record.offset(),
        record.value().getOrderId());

    orderEventService.handle(record.value());
}
```

운영 로그에는 최소한 `key`, `partition`, `offset`, `orderId`를 함께 남겨두는 편이 좋다.
문제가 생겼을 때 특정 메시지의 흐름을 추적할 수 있기 때문이다.

<br>

# 키 기반 파티셔닝과 순서 보장
키를 지정하면 기본 파티셔너는 키 해시값으로 파티션을 결정한다.
같은 키는 같은 파티션으로 들어가므로 해당 키 범위에서는 순서 보장이 가능하다.

```java
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(OrderEvent event) {
        // 같은 orderId를 key로 사용하면 같은 파티션으로 라우팅된다.
        String key = event.getOrderId();
        kafkaTemplate.send("order-events", key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("publish failed. topic=order-events, key={}, orderId={}", key, event.getOrderId(), ex);
                    return;
                }

                RecordMetadata metadata = result.getRecordMetadata();
                log.info("publish success. key={}, partition={}, offset={}",
                    key,
                    metadata.partition(),
                    metadata.offset());
            });
    }
}
```

주의할 점도 있다. 특정 키로 트래픽이 몰리면 hot partition이 생긴다.
이 경우 컨슈머를 늘려도 병목 파티션의 처리 속도가 시스템 상한을 결정하게 된다.

<br>

# 파티션 수 산정 기준
> 참고로 파티션 수는 늘릴 수는 있어도 줄일 수는 없기 때문에, 초기 산정이 이후 운영 비용에 영향을 준다.

파티션 수를 늘리면 병렬 처리가 가능해져 처리량을 올리기 쉽다.
하지만 파티션이 많아질수록 파일 핸들, 메타데이터, 리밸런싱 비용이 함께 증가한다.

여기서 한 가지 전제가 있다. **토픽 파티션 수는 늘릴 수는 있지만, 줄이는 것은 직접 지원되지 않는다.**
그래서 초기 산정 단계에서 여유분을 두되, 과도한 증설은 피하는 편이 좋다.

보통 아래 순서로 계산한다.

1. 목표 처리량(예: 초당 메시지 수)과 메시지 평균 크기를 추정한다.
2. 컨슈머 인스턴스 1개가 안정적으로 처리할 수 있는 TPS를 측정한다.
3. 필요한 병렬성 기준으로 파티션 수를 산정하고, 여유분을 10 ~ 30% 둔다.

예를 들어 컨슈머 1개가 초당 500건을 처리하고 목표가 초당 2,000건이면 최소 4개 파티션이 필요하다.
여기에 배포/장애 여유를 두려면 6개 정도로 시작해서 모니터링으로 조정하는 방식이 일반적이다.
실무에서는 예상치와 실제 트래픽이 어긋나는 경우가 많아, 10 ~ 30% 여유분을 두는 방식이 일반적인 베스트 프랙티스로 쓰인다.
다음으로 실제 증설 전에 확인해야 할 항목을 보자.

<br>

# 파티션 증설 전 체크리스트
> 증설 직후에는 동일 key가 다른 파티션으로 이동할 수 있으므로, 순서 보장 가정을 다시 확인하는 편이 좋다.

파티션을 늘리는 작업은 숫자 조정처럼 보이지만, 실제로는 소비 구조를 바꾸는 작업이다.
그래서 아래 항목을 먼저 점검한 뒤 증설하면 시행착오를 줄이는 데 도움이 된다.

1. 병목 원인이 브로커 I/O인지, 컨슈머 로직인지 확인
2. key 분포가 균등한지 확인(hot key 여부)
3. 순서 보장 범위가 키 단위인지 재검토

```text
증설 전에 자주 보는 오해
- lag가 크다 -> 파티션 늘리면 자동 해결된다 (X)
- 파티션 늘리면 키가 자동으로 균등 분산된다 (X)
- 증설해도 기존 순서 보장이 그대로 유지된다 (X)
```

특히 아래 두 가지를 운영 리스크로 함께 본다.

- key 분포를 보지 않고 늘리면 hot partition이 남아 병목이 계속될 수 있다.
- 파티션 수가 바뀌면 해시 모듈러 기준이 달라져, 동일 key도 다른 파티션으로 라우팅될 수 있다.
  그래서 증설 직후에는 동일 key 순서 보장이 일시적으로 어긋날 가능성을 운영 시나리오에 포함해 두는 편이 유리하다.

<br>

# 파티션을 다시 줄일 수 있을까
앞서 본 것처럼 운영에서 자주 나오는 질문이지만, 토픽 파티션 수를 직접 줄이는 방식은 지원되지 않는다. 다만 아래처럼 증가는 가능하다.

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic order-events --partitions 24
```

줄여야 한다면 새 토픽으로 마이그레이션하는 방식을 사용한다.

1. 목표 파티션 수로 새 토픽 생성
2. 프로듀서/컨슈머를 점진적으로 새 토픽으로 전환
3. 필요 시 Connector 또는 애플리케이션 re-publish로 데이터 이전
4. 검증 후 기존 토픽 종료

이 과정은 운영 절차가 필요한 작업이므로, 다운타임 허용치와 데이터 정합성 기준을 먼저 고려해 두면 이후 전환이 수월하다.

<br>

# 멱등성과 오류 분류를 함께 설계하기
파티션 구조를 잘 잡아도 중복 처리 방지가 없으면 장애 복구 시 데이터 정합성이 깨질 수 있다.
특히 리밸런싱이나 재시도 상황에서는 같은 메시지가 다시 전달될 수 있기 때문이다.

```java
@Transactional
public void handle(OrderEvent event, ConsumerRecord<String, OrderEvent> record) {
    String dedupKey = event.getOrderId() + ":" + event.getEventType();

    try {
        processedEventRepository.save(new ProcessedEvent(dedupKey));
    } catch (DataIntegrityViolationException e) {
        log.info("duplicated event skipped. dedupKey={}, partition={}, offset={}",
            dedupKey, record.partition(), record.offset());
        return;
    }

    try {
        paymentClient.charge(event); // 외부 I/O에는 타임아웃을 두는 편이 좋다.
    } catch (SocketTimeoutException timeoutException) {
        log.warn("transient failure. orderId={}, partition={}, offset={}",
            event.getOrderId(), record.partition(), record.offset(), timeoutException);
        throw timeoutException; // 재시도 경로로 위임
    } catch (Exception permanentException) {
        log.error("permanent failure. orderId={}, partition={}, offset={}",
            event.getOrderId(), record.partition(), record.offset(), permanentException);
        throw permanentException;
    }
}
```

위처럼 일시 오류(타임아웃)와 영구 오류(데이터 문제)를 분리하면 재시도 전략을 더 명확하게 가져갈 수 있다.
리밸런싱 자체는 피할 수 없지만, 멱등성과 에러 분류가 있으면 결과 정합성은 지킬 수 있다.

<br>

# 정리하면
토픽은 메시지의 논리 단위고 파티션은 처리량과 순서 보장의 물리 단위다. 그리고 컨슈머 그룹은 파티션을 나눠 가져가며 병렬 처리를 만든다.

결국 설계 포인트는 세 가지다.

- key 설계로 순서 보장 범위를 명확히 한다.
- 파티션 수는 처리량과 운영 비용의 균형으로 잡는다.
- 중복 전달을 전제로 멱등성과 재시도 전략을 함께 둔다.

컨슈머 처리 시간이 길어져 `max.poll.interval.ms`를 초과하면 원치 않는 리밸런싱이 발생할 수 있으므로, 처리 시간과 poll 간격, 리밸런싱 지표를 함께 점검하면 된다.

<br>

# 참고
- <a href="https://kafka.apache.org/documentation/#intro_topics" target="_blank" rel="nofollow">Apache Kafka Documentation - Topics and Logs</a>
- <a href="https://kafka.apache.org/documentation/#intro_consumers" target="_blank" rel="nofollow">Apache Kafka Documentation - Consumers</a>
- <a href="https://kafka.apache.org/documentation/#basic_ops_modify_topic" target="_blank" rel="nofollow">Apache Kafka Documentation - Modify Topics</a>
