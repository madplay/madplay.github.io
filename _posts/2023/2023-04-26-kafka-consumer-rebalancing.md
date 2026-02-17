---
layout: post
title: "카프카 컨슈머 리밸런싱은 왜 발생할까?"
author: madplay
tags: kafka consumer rebalancing deployment
description: "카프카 컨슈머 리밸런싱이 발생하는 이유부터 배포 중 lag 급증, 중복 처리, 증설 시 운영 체크포인트까지 실무 기준으로 정리한다."
category: Backend
date: "2023-04-26 21:03:12"
comments: true
---

# 리밸런싱이 배포 장애처럼 보이는 이유

> 리밸런싱은 장애가 아니라 정상 동작이지만, 타이밍과 준비 상태에 따라 장애처럼 관측될 수 있다.

리밸런싱은 컨슈머 그룹의 파티션 할당을 다시 계산해 재배치하는 정상 동작이다. 카프카 컨슈머를 운영하다 보면 처리량 튜닝보다
배포 시점의 `lag` 급증이 먼저 눈에 띄는 경우가 많다. 이는 기존 할당을 해제하고 새 할당을 적용하는 과정에서 일시적인 처리 중단 구간이 발생하기 때문이다.
이 짧은 순간의 지연이 `lag` 스파이크로 이어지기에, 사전 준비 없이 맞이하면 실제 장애처럼 보이기 쉽다.

<br>

# 의도치 않은 리밸런싱은 언제 발생할까

리밸런싱은 컨슈머 그룹 구성원이 바뀌거나, 브로커가 구성원 상태를 비정상으로 판단할 때 발생한다.

- 새 컨슈머 인스턴스가 그룹에 참여할 때
- 기존 컨슈머 인스턴스가 종료되거나 장애가 날 때
- `max.poll.interval.ms`를 넘겨서 poll이 지연될 때
- 네트워크 이슈로 heartbeat가 끊겨 `session.timeout.ms`를 넘길 때

리밸런싱 자체를 없앨 수는 없다. 대신 리밸런싱이 일어났을 때 처리 지연과 중복 처리를 줄이는 방향으로 설계해야 한다.

<br>

# Eager vs Cooperative: 파티션 이동 충격 줄이기

기본 eager 방식은 리밸런싱 시점에 기존 할당을 먼저 모두 해제하고 다시 나눈다.
파티션 이동 폭이 큰 대신 동작이 단순하다.

반면 cooperative 방식(`CooperativeStickyAssignor`)은 필요한 파티션만 점진적으로 이동한다.
롤링 배포나 순간적인 인스턴스 증감이 잦은 환경에서는 이 방식이 지연 완화에 유리한 편이다.

## consumer.properties 설정 예시

```properties
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

Kafka 클라이언트 버전에 따라 기본 assignor 구성이 다를 수 있으므로, 사용하는 버전 기준으로 기본값을 먼저 확인하는 편이 좋다.
최신 버전에서는 기본 전략에 cooperative assignor가 포함되는 경우도 있지만, 운영 일관성을 위해 명시적으로 고정해서 쓰는 팀도 많다.

<br>

# Static Membership으로 재할당 줄이기

롤링 배포에서 인스턴스가 잠깐 내려갔다가 같은 인스턴스가 다시 올라오는 경우가 많다.
이때 `group.instance.id`를 지정하면 브로커가 "같은 구성원"으로 인식해 불필요한 재할당을 줄일 수 있다.

```yaml
spring:
  kafka:
    consumer:
      properties:
        group.instance.id: order-worker-${HOSTNAME}
```

주의할 점은 ID 충돌이다. 같은 `group.instance.id`를 가진 인스턴스가 동시에 두 개 올라오면 오히려 오류가 발생한다.
배포 자동화에서 hostname이나 pod name처럼 유일한 값을 넣는 것이 안전하다.
다만 Kubernetes Deployment처럼 재시작마다 pod 이름이 바뀌는 환경에서는 `${HOSTNAME}`이 자주 달라질 수 있다.
이 경우에는 StatefulSet처럼 stable identity를 보장하거나, 인스턴스 생명주기에 맞는 고정 ID 전략을 먼저 정하는 편이 효과적이다.

> `${HOSTNAME}` 값이 재시작마다 바뀌는 환경에서는 static membership의 효과가 기대보다 작아질 수 있다.

<br>

# Poll 지연을 줄이는 타임아웃 설계

리밸런싱 이슈의 상당수는 처리 로직이 길어져 poll 간격이 깨지면서 시작된다.
외부 API 호출, 느린 DB I/O, 대량 배치 처리 같은 구간이 원인인 경우가 많다.

```java

@KafkaListener(topics = "order-events", groupId = "order-worker-group")
public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
	long startedAt = System.currentTimeMillis();
	OrderEvent event = record.value();

	try {
		paymentService.processWithTimeout(event); // 외부 호출에는 타임아웃을 두는 편이 좋다.
		ack.acknowledge();

		log.info("consume success. key={}, partition={}, offset={}, orderId={}, elapsedMs={}",
			record.key(),
			record.partition(),
			record.offset(),
			event.getOrderId(),
			System.currentTimeMillis() - startedAt);
	} catch (SocketTimeoutException transientError) {
		log.warn("transient error. key={}, partition={}, offset={}, orderId={}",
			record.key(), record.partition(), record.offset(), event.getOrderId(), transientError);
		throw transientError;
	} catch (Exception permanentError) {
		log.error("permanent error. key={}, partition={}, offset={}, orderId={}",
			record.key(), record.partition(), record.offset(), event.getOrderId(), permanentError);
		throw permanentError;
	}
}
```

`AckMode.MANUAL` 또는 `MANUAL_IMMEDIATE`를 사용하면 처리 성공 시점에 커밋할 수 있어 제어가 쉽다.
다만 수동 커밋은 코드 실수의 영향이 크므로, 테스트에서 중복 처리와 누락 케이스를 같이 확인해야 한다.

<br>

# 롤링 배포에서 지연 줄이는 설정

운영에서 자주 쓰는 순서는 아래와 같다.

1. 컨슈머 처리 시간을 측정해 `max.poll.interval.ms`를 현실적인 값으로 맞춘다.
2. heartbeat 관련 값을 기본값에서 크게 벗어나지 않게 조정한다.
3. 롤링 배포 시 인스턴스를 한 번에 많이 교체하지 않는다.
4. 종료 시점에 짧은 drain 시간을 주고 컨슈머를 종료한다.

스프링에서는 컨테이너가 정상 종료를 기다리게 설정할 수 있다.

```yaml
spring:
  kafka:
    listener:
      ack-mode: manual
      missing-topics-fatal: false
```

```java

@PreDestroy
public void onShutdown() {
	log.info("consumer shutting down. drain in progress");
}
```

성능 관점에서는 "한 번에 많은 파티션 이동"이 가장 큰 지연 요인이다.
그래서 cooperative assignor + static membership 조합이 배포 안정화에 자주 사용된다.

<br>

# 중복 전달을 전제로 한 멱등성

> 멱등성(Idempotency)은 같은 메시지가 여러 번 처리되어도 결과가 한 번 처리한 것과 같게 유지되는 성질이다.

리밸런싱 중에는 커밋 경계에 따라 같은 메시지가 다시 전달될 수 있다.
이를 예외 상황으로 보기보다 정상 시나리오로 보고 멱등성을 기본값으로 두는 편이 안전하다.

```java

@Transactional
public void processWithIdempotency(OrderEvent event) {
	String idempotencyKey = event.getOrderId() + ":" + event.getEventType();

	try {
		processedEventRepository.save(new ProcessedEvent(idempotencyKey));
	} catch (DataIntegrityViolationException alreadyProcessed) {
		log.info("already processed. idempotencyKey={}", idempotencyKey);
		return;
	}

	paymentGatewayClient.charge(event);
}
```

중복 수신을 허용하되 결과를 한 번만 반영하는 구조가, 리밸런싱 상황에서 가장 예측 가능하다.

<br>

# 파티션 증설 단계별 운영 방법

파티션 증설 자체는 단순 명령으로 끝나지만, 리밸런싱 영향까지 포함하면 운영 절차가 필요하다.
실무에서는 아래 순서로 진행하는 경우가 많다.

1. 증설 전 baseline 수집: lag, 처리량, 평균 처리 시간, rebalance 횟수
2. 비피크 시간대에 소폭 증설(예: +20 ~ 30%) 먼저 적용
3. 컨슈머 그룹 재할당/lag 스파이크를 실시간 모니터링
4. 문제 없으면 단계적으로 추가 증설

```text
운영 중 관찰 포인트
- rebalance duration
- consumer lag(max/avg)
- 처리 성공률, 재시도율
- 외부 I/O 타임아웃 비율
```

증설 폭을 한 번에 크게 가져가면 리밸런싱 충격이 커질 수 있으므로, 작은 단위로 나누는 편이 안전하다.

<br>

# 파티션은 줄일 수 없다: 롤백과 마이그레이션
> 파티션 감소는 직접 지원되지 않으므로, 롤백은 "새 토픽 전환" 관점으로 준비하는 편이 현실적이다.

증설 후 지표가 악화될 때는 "언제 되돌릴지" 기준을 미리 정해두는 편이 좋다.
예를 들어 아래 조건 중 하나라도 일정 시간 이상 유지되면 롤백 절차를 시작할 수 있다.

- rebalance 시간이 평소 대비 크게 증가
- lag가 기준치 이상으로 장시간 유지
- 타임아웃/실패율이 임계치를 초과

여기서 주의할 점은 파티션 수를 직접 줄일 수 없다는 것이다.
즉, 롤백은 "기존 토픽으로 트래픽 복귀" 또는 "더 작은 파티션 수의 신규 토픽으로 마이그레이션"으로 설계해야 한다.


```text
파티션 감소 직접 지원: 불가
권장 롤백 방식: 새 토픽 생성 후 점진 전환
```

롤백에서도 멱등성은 필수다. 전환 구간에서는 중복 전달 가능성이 높아지기 때문이다.

<br>

# 운영 요약
리밸런싱은 배포와 장애 복구 구간에서 반복적으로 발생하는 이벤트다.
그래서 목표는 "리밸런싱을 없애기"보다 "발생해도 영향이 제한되도록 만들기"에 가깝다.

아래 항목은 반드시 순서대로 적용해야 하는 체크리스트라기보다, 운영에서 같이 맞춰보면 효과가 큰 권장 항목들이다.
아래의 네 가지 항목을 함께 보면 설정 변경이 실제 안정화로 이어졌는지 판단하기 쉽다.

- **파티션 이동 폭 최소화**: cooperative assignor와 static membership 조합으로 불필요한 재할당을 줄인다.
- **지연 구간 최적화**: 처리 로직이 `max.poll.interval.ms` 안에서 끝나는지 확인하고, 필요하면 `max.poll.records`를 조정해 poll 주기를 가볍게 가져간다.
- **중복 전달 흡수**: 리밸런싱 과정에서 발생할 수 있는 중복 메시지를 멱등성 경계(DB unique key 등)로 처리한다.
- **통합 모니터링**: `lag`을 비롯한 리밸런싱 발생 횟수, 한 번의 소요 시간, 실패율을 같은 대시보드에서 함께 관찰한다.

<br>

# 참고

- <a href="https://kafka.apache.org/documentation/#consumerconfigs" target="_blank" rel="nofollow">Apache Kafka
  Documentation - Consumer Configs</a>
- <a href="https://kafka.apache.org/documentation/#upgrade_34_notable" target="_blank" rel="nofollow">Apache Kafka
  Documentation - Upgrade Notes</a>
- <a href="https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html" target="_blank" rel="nofollow">
  Spring for Apache Kafka - Listener Container</a>
