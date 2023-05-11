---
layout: post
title: "Kafka 컨슈머 오프셋과 커밋 전략"
author: madplay
tags: kafka consumer offset commit auto-commit manual-commit
description: "__consumer_offsets 토픽의 내부 구조, 자동/수동 커밋 전략 비교, 오프셋 리셋 시나리오와 Consumer Lag 모니터링까지 오프셋 관리 전반을 다룬다."
category: Backend
date: "2023-05-11 20:11:45"
comments: true
---

# 오프셋과 컨슈머의 읽기 위치

독서 중에 몇 페이지까지 읽었는지 표시하는 책갈피가 없다면, 다시 펼칠 때마다 처음부터 훑어봐야 한다.
Kafka 컨슈머의 오프셋(offset)이 바로 이 책갈피 역할을 한다. "이 컨슈머 그룹은 이 토픽의 이 파티션에서 여기까지 읽었다"는 위치 정보를 기록해 두는 것이다.

오프셋 관리가 허술하면 메시지가 중복 처리되거나 아예 누락될 수 있다.
이번 글에서는 오프셋이 내부적으로 어떻게 저장되고, 커밋 전략에 따라 동작이 어떻게 달라지며, 운영 중 오프셋을 리셋해야 하는 상황에서 어떤 도구를 쓸 수 있는지 살펴본다.

<br>

# __consumer_offsets 토픽

Kafka 컨슈머가 커밋한 오프셋은 `__consumer_offsets`라는 내부 토픽에 저장된다.
이 토픽은 Kafka 브로커가 자동으로 생성하고 관리하며, 기본적으로 50개의 파티션을 갖는다.

특정 컨슈머 그룹의 오프셋이 어떤 파티션에 저장되는지는 다음 공식으로 결정된다.

```text
partitionId = Math.abs(groupId.hashCode()) % offsetsTopicPartitionCount
```

`groupId`의 해시값을 `__consumer_offsets`의 파티션 수(기본 50)로 나눈 나머지가 해당 그룹의 오프셋이 저장될 파티션이다.
이 파티션의 리더 브로커가 해당 그룹의 **그룹 코디네이터(Group Coordinator)** 역할을 맡는다. 그룹 코디네이터는 컨슈머 그룹의 멤버 관리와 오프셋 저장을 담당하는 브로커다.

`__consumer_offsets`에 저장되는 메시지의 key는 `[groupId, topic, partition]` 조합이고, value는 커밋된 오프셋 값과 메타데이터다.

```text
Key:   [order-payment-group, order-events, 0]
Value: {offset: 12345, metadata: "", commitTimestamp: 1683705600000}
```

이 토픽에는 `cleanup.policy=compact`가 적용되어 있어서, 같은 key의 레코드 중 가장 최신 값만 유지된다.
그래서 컨슈머가 커밋을 수백만 번 해도 `__consumer_offsets`의 크기가 무한히 커지지 않는다.

그렇다면 컨슈머가 오프셋을 커밋하는 시점은 어떻게 결정될까?

<br>

# 자동 커밋 vs 수동 커밋

Kafka 컨슈머의 오프셋 커밋 방식은 크게 자동(auto)과 수동(manual)으로 나뉜다.

## 자동 커밋

`enable.auto.commit=true`(기본값)로 설정하면 컨슈머가 `poll()`을 호출할 때 `auto.commit.interval.ms`(기본 5초) 간격으로 자동 커밋한다.

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-payment-group");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "5000");
props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
    StringDeserializer.class.getName());
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
    StringDeserializer.class.getName());

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("order-events"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        processOrder(record); // 이 처리가 끝나기 전에 커밋될 수 있다
    }
}
```

자동 커밋의 위험은 타이밍에 있다. `poll()` 호출 시점에 이전 `poll()`의 결과가 자동 커밋되는데, 만약 레코드 처리가 아직 끝나지 않은 상태에서 커밋이 일어나면 **처리되지 않은 메시지가 "읽음" 처리**될 수 있다.
반대로, 처리는 끝났지만 다음 `poll()` 전에 컨슈머가 장애로 내려가면 같은 메시지가 다시 전달된다.

자동 커밋은 메시지 손실이 크게 문제되지 않는 로그 수집이나 통계 집계 같은 파이프라인에서 간편하게 사용할 수 있다.
Spring Kafka 환경이라면 Kafka 자체 자동 커밋 대신 `AckMode.BATCH`(기본값)를 그대로 쓰는 경우가 많은데, 이 부분은 뒤에서 다시 다룬다.

## 수동 커밋

Spring을 사용하지 않는 순수 Kafka Client 환경에서 메시지 처리 성공 여부에 따라 커밋 시점을 직접 제어하고 싶다면 수동 커밋을 사용한다.
`enable.auto.commit=false`로 설정한 뒤, `commitSync()` 또는 `commitAsync()`를 호출한다.

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-payment-group");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
// ... 나머지 설정 생략

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("order-events"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        processOrder(record);
    }
    consumer.commitSync(); // 모든 레코드 처리 후 동기 커밋
}
```

수동 커밋은 "처리가 끝난 뒤에만 커밋한다"는 보장을 코드 레벨에서 할 수 있다는 것이 가장 큰 장점이다.

<br>

# 동기 커밋과 비동기 커밋

수동 커밋은 다시 동기(`commitSync`)와 비동기(`commitAsync`)로 나뉜다.

`commitSync()`는 브로커의 커밋 응답을 받을 때까지 블로킹한다. 커밋이 실패하면 예외가 발생하므로 재시도 로직을 넣을 수 있다.
하지만 응답을 기다리는 동안 컨슈머 스레드가 멈추므로 처리량이 떨어질 수 있다.

```java
try {
    consumer.commitSync();
} catch (CommitFailedException e) {
    log.error("commit failed. group={}", groupId, e);
}
```

`commitAsync()`는 브로커 응답을 기다리지 않고 바로 다음 처리로 넘어간다.
콜백을 등록하면 커밋 성공/실패를 비동기로 통보받을 수 있다.

```java
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) {
        log.warn("async commit failed. offsets={}", offsets, exception);
    }
});
```

비동기 커밋에서 주의할 점은 재시도의 순서 역전이다. 오프셋 100을 커밋하는 요청이 실패해서 재시도하는 사이에, 오프셋 200 커밋이 먼저 성공하면 문제가 없다. 하지만 이후 오프셋 100 커밋 재시도가 성공하면 커밋된 오프셋이 200에서 100으로 되돌아가 버린다.
이런 이유로 `commitAsync()`에서는 단순 재시도보다는 실패를 로그로 남기고, 컨슈머 종료 시점에 `commitSync()`를 한 번 호출하는 패턴이 실무에서 자주 사용된다.

```java
try {
    while (true) {
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
        for (ConsumerRecord<String, String> record : records) {
            processOrder(record);
        }
        consumer.commitAsync(); // 평상시에는 비동기 커밋
    }
} finally {
    consumer.commitSync(); // 종료 시 동기 커밋으로 마지막 오프셋 확정
    consumer.close();
}
```

<br>

# Spring Kafka의 AckMode

Spring Kafka를 사용한다면 `commitSync()`나 `commitAsync()`를 직접 호출하는 경우는 드물다.
Spring Kafka의 `KafkaMessageListenerContainer`가 `ContainerProperties.AckMode` 설정에 따라 커밋을 대신 관리하기 때문이다.
이때 Kafka 클라이언트의 자동 커밋(`enable.auto.commit`)은 꺼두고, 커밋 제어를 Spring 컨테이너에 맡기는 것이 일반적이다.

Spring Kafka 3.0 기준으로 제공되는 주요 AckMode는 다음과 같다.

- **RECORD**: 리스너가 레코드 하나를 처리할 때마다 커밋한다.
- **BATCH**: `poll()`로 가져온 모든 레코드를 처리한 뒤 한 번에 커밋한다. 기본값이다.
- **MANUAL**: 리스너에서 `Acknowledgment.acknowledge()`를 호출하면, 컨테이너가 표시된 오프셋을 모아 적절한 시점에 커밋한다.
- **MANUAL_IMMEDIATE**: `acknowledge()`를 호출하는 즉시 커밋한다.

이 외에 `TIME`, `COUNT`, `COUNT_TIME`도 있지만, 대부분의 서비스에서는 위 4가지로 충분하다.

`MANUAL_IMMEDIATE`를 사용한 코드 예시를 보자.

```java
@KafkaListener(topics = "order-events", groupId = "order-payment-group")
public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
    try {
        paymentService.process(record.value());
        ack.acknowledge(); // MANUAL_IMMEDIATE일 경우 즉시 커밋
    } catch (Exception e) {
        log.error("processing failed. key={}, partition={}, offset={}",
            record.key(), record.partition(), record.offset(), e);
        throw e; // 에러 핸들러로 위임
    }
}
```

레코드 단위로 즉시 커밋하면 커밋 요청 빈도가 높아져 브로커 부하가 늘어난다.
처리량이 높은 서비스에서는 `BATCH` 모드를 기본으로 사용하고, 결제나 정산처럼 메시지 단위의 정확한 커밋이 필요한 토픽에만 `MANUAL_IMMEDIATE`를 적용하는 식으로 나누는 경우가 많다.

<br>

# 오프셋 리셋 시나리오

운영 중에 오프셋을 리셋해야 하는 상황이 종종 발생한다. 대표적인 경우를 몇 가지 살펴보면,

## 새 컨슈머 그룹이 토픽을 처음 구독할 때

아직 커밋된 오프셋이 없으므로 `auto.offset.reset` 설정에 따라 시작 위치가 결정된다.

```properties
# earliest: 토픽의 맨 처음부터 읽음
auto.offset.reset=earliest

# latest: 구독 시점 이후로 발행된 메시지부터 읽음 (기본값)
auto.offset.reset=latest
```

`earliest`는 과거 데이터를 모두 처리해야 하는 경우에, `latest`는 실시간 메시지만 처리하면 되는 경우에 적합하다.
이 설정은 커밋된 오프셋이 없을 때만 적용된다. 이미 커밋된 오프셋이 있으면 해당 위치부터 이어서 읽는다.

## 커밋된 오프셋이 만료됐을 때

`__consumer_offsets`에 저장된 오프셋에도 만료 시간이 있다. `offsets.retention.minutes` 브로커 설정(기본 7일, Kafka 2.0 이후)에 따라, 해당 기간 동안 컨슈머 그룹이 활동하지 않으면 오프셋이 삭제된다.
오프셋이 삭제된 상태에서 컨슈머가 다시 연결하면, `auto.offset.reset`이 다시 적용된다.

## CLI로 수동 리셋

장애 복구나 데이터 재처리를 위해 오프셋을 특정 위치로 되돌려야 할 때는 `kafka-consumer-groups.sh`를 사용한다.

```bash
# 토픽의 맨 처음으로 리셋
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --to-earliest --execute

# 특정 날짜/시간 이후로 리셋
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --to-datetime 2023-05-01T00:00:00.000 --execute

# 현재 오프셋에서 10개 앞으로 이동 (건너뛰기)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --shift-by 10 --execute
```

`--execute` 플래그를 빼면 dry-run 모드로 동작하여, 실제 리셋 없이 결과만 미리 볼 수 있다.
운영 환경에서는 반드시 dry-run을 먼저 실행해서 영향 범위를 확인한 뒤 적용하는 것이 안전하다.

오프셋 리셋은 해당 컨슈머 그룹이 **비활성 상태(active consumer가 0)**일 때만 가능하다.
컨슈머가 실행 중인 상태에서 리셋을 시도하면 에러가 발생한다.

<br>

# 커밋 실패와 중복 처리

커밋은 실패할 수 있다. 네트워크 일시 장애, 그룹 코디네이터 변경, 리밸런싱(컨슈머 그룹 내 파티션 할당을 재조정하는 과정), 세션 만료 등이 원인이다.
커밋이 실패하면 어떤 일이 벌어질까?

오프셋 50까지 처리하고 커밋했는데 이 커밋이 실패한 상태에서 컨슈머가 재시작되면, 마지막 성공한 커밋 지점(예: 오프셋 30)부터 다시 읽게 된다.
즉 오프셋 31~50의 메시지가 다시 전달된다.

```text
마지막 성공 커밋: offset 30
실제 처리 완료:   offset 50
커밋 실패 후 재시작 → offset 31부터 재전달
```

이 상황에서 멱등성이 보장되지 않으면 31~50번 메시지가 이중으로 처리된다.
Kafka는 "최소 한 번(at-least-once)" 전달을 기본으로 하므로, 컨슈머 쪽에서 멱등성을 보장해야 중복 처리를 방지할 수 있다.

```java
@Transactional
public void processOrder(OrderEvent event) {
    String idempotencyKey = event.getOrderId() + ":" + event.getEventType();

    if (processedEventRepository.existsById(idempotencyKey)) {
        log.info("already processed. idempotencyKey={}", idempotencyKey);
        return;
    }

    processedEventRepository.save(new ProcessedEvent(idempotencyKey));
    orderService.execute(event);
}
```

멱등성 키는 비즈니스 식별자(주문 ID, 이벤트 타입 등)를 조합해서 만든다.
DB의 unique 제약 조건을 활용하면 동시에 같은 메시지가 처리되는 race condition도 방어할 수 있다.

<br>

# 오프셋 모니터링과 Consumer Lag

Consumer Lag은 프로듀서가 발행한 최신 메시지와 컨슈머가 마지막으로 읽은 메시지 사이의 차이, 즉 "파티션의 최신 오프셋(log-end-offset)과 컨슈머가 마지막으로 커밋한 오프셋의 차이"다.
lag이 계속 증가한다면 컨슈머의 처리 속도가 프로듀서의 발행 속도를 따라가지 못하고 있다는 뜻이다.

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --describe
```

이 명령의 출력에서 `LAG` 컬럼이 각 파티션별 lag을 보여준다.

```text
GROUP                 TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
order-payment-group   order-events   0          12340           12345           5
order-payment-group   order-events   1          8920            8920            0
order-payment-group   order-events   2          15670           15890           220
```

파티션 2의 lag이 220으로 다른 파티션에 비해 높다.
이런 경우 해당 파티션을 담당하는 컨슈머 인스턴스의 처리 로직에 병목이 있는지, 외부 호출 타임아웃이 잦은지 확인해 볼 필요가 있다.

lag 모니터링은 단순 수치보다 **추세(trend)**가 더 중요하다.
순간적으로 lag이 발생하더라도 빠르게 줄어들면 정상이지만, lag이 지속적으로 증가하면 컨슈머 증설이나 처리 로직 최적화를 검토해야 한다.

만약 lag을 단순히 스크립트로 수집하는 수준을 넘어 체계적으로 모니터링하고 싶다면, Burrow 같은 도구를 활용할 수도 있다. Burrow는 LinkedIn에서 개발한 Kafka Consumer Lag 모니터링 전용 도구로, lag의 추세를 분석해 "정상", "경고", "에러" 상태를 자동으로 판단해 준다.

<br>

# 운영 시 오프셋 관련 설정 정리

오프셋과 관련해서 운영 환경에서 자주 확인하는 설정을 모아 본다.

```properties
# 자동 커밋 사용 여부 (수동 커밋 시 false)
enable.auto.commit=false

# 자동 커밋 간격 (자동 커밋 사용 시)
auto.commit.interval.ms=5000

# 커밋된 오프셋이 없을 때 시작 위치
auto.offset.reset=latest

# 컨슈머 세션 타임아웃 (하트비트 실패 시 리밸런싱 트리거)
session.timeout.ms=45000

# 하트비트 전송 간격 (session.timeout.ms의 1/3 이하 권장)
heartbeat.interval.ms=15000

# poll() 호출 간격 최대치 (초과 시 리밸런싱)
max.poll.interval.ms=300000

# 한 번의 poll()로 가져오는 최대 레코드 수
max.poll.records=500
```

`max.poll.interval.ms`와 `max.poll.records`는 오프셋 커밋과 직접 관련된다.
한 번에 너무 많은 레코드를 가져와서 처리 시간이 `max.poll.interval.ms`를 초과하면, 브로커가 해당 컨슈머를 비정상으로 판단해 리밸런싱이 발생한다.
리밸런싱이 발생하면 아직 커밋되지 않은 오프셋이 사라지므로 중복 처리로 이어진다.

`max.poll.records`를 줄여 한 번에 처리하는 양을 조절하거나, 처리 로직의 외부 호출에 타임아웃을 두어 `max.poll.interval.ms` 안에 처리가 끝나도록 맞추는 것이 일반적인 대응 방법이다.

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation/#consumerconfigs" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Consumer Configs</a>
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#committing-offsets" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Committing Offsets</a>
