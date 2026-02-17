---
layout: post
title: "Kafka Streams 윈도우와 조인"
author: madplay
tags: kafka streams window tumbling hopping session join grace-period
description: "Tumbling, Hopping, Session 세 가지 윈도우 타입의 동작 원리와 KStream-KStream 시간 기반 조인, Grace Period, State Store retention 관리를 다룬다."
category: Backend
date: "2023-05-28 21:48:33"
comments: true
---

# Kafka Streams 시리즈 목차
- <a href="/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams 개념과 아키텍처</a>
- <a href="/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream과 KTable</a>
- **3. Kafka Streams 윈도우와 조인**
- <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams 에러 처리와 복구 전략</a>

<br>

# 시간 구간으로 데이터를 자르는 이유

"최근 5분간 들어온 주문 건수는 몇 건일까?"
이 질문에 답하려면 단순 집계로는 부족하다. 끝없이 흘러오는 이벤트를 시간 구간으로 잘라서 그 구간 안의 데이터만 집계해야 한다.
이 시간 구간을 **윈도우(Window)**라고 부르며, Kafka Streams는 여러 윈도우 타입을 제공한다.
실무에서 자주 쓰는 Tumbling, Hopping, Session 세 가지 윈도우의 동작 원리부터 KStream-KStream 시간 기반 조인까지 순서대로 정리한다.

<br>

# Tumbling Window: 겹치지 않는 고정 구간

Tumbling Window는 고정 크기의 윈도우가 시간축 위에 빈틈 없이 이어지는 구조다.
윈도우끼리 겹치지 않으므로, 각 레코드는 정확히 하나의 윈도우에만 속한다.

5분 단위로 사용자별 주문 건수를 세는 예시를 보자.

```java
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;
import java.time.Duration;

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KTable<Windowed<String>, Long> orderCountPerWindow = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count();
```

`TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5))`는 5분 크기의 Tumbling Window를 만든다. `NoGrace`는 윈도우가 닫힌 뒤 늦게 도착하는 레코드를 허용하지 않겠다는 의미인데, 이 부분은 뒤에서 Grace Period를 설명할 때 다시 다룬다.

윈도우는 epoch(1970년 1월 1일 00:00:00 UTC) 기준으로 정렬된다.
5분 윈도우라면 `[00:00, 00:05)`, `[00:05, 00:10)`, `[00:10, 00:15)` ... 이런 식이다.

```text
시간축:  00:00    00:05    00:10    00:15
         |--------|--------|--------|
         Window 1  Window 2  Window 3

레코드 A (00:02) → Window 1
레코드 B (00:07) → Window 2
레코드 C (00:04) → Window 1
레코드 D (00:10) → Window 3
```

결과인 `KTable<Windowed<String>, Long>`의 key는 `Windowed<String>` 타입이다.
여기서 `Windowed`는 원래 key(userId)와 윈도우의 시작/종료 시간을 함께 담고 있다.

```java
orderCountPerWindow.toStream()
    .foreach((windowedKey, count) -> {
        String userId = windowedKey.key();
        long windowStart = windowedKey.window().start();
        long windowEnd = windowedKey.window().end();
        log.info("userId={}, window=[{}, {}), count={}",
            userId, windowStart, windowEnd, count);
    });
```

Tumbling Window는 대시보드용 분 단위/시간 단위 집계, 배치성 정산, 트래픽 모니터링 등에서 자주 사용된다.

<br>

# Hopping Window: 겹치는 슬라이딩 구간

Hopping Window는 윈도우 크기(size)와 이동 간격(advance)을 별도로 지정한다.
size > advance이면 윈도우끼리 겹치고, 하나의 레코드가 여러 윈도우에 속할 수 있다.

10분 크기의 윈도우를 2분마다 생성하는 예시다.

```java
KTable<Windowed<String>, Long> hoppingCount = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(10))
            .advanceBy(Duration.ofMinutes(2))
    )
    .count();
```

```text
시간축:  00:00    00:02    00:04    00:06    00:08    00:10    00:12
         |------- Window 1 (00:00~00:10) --------|
                  |------- Window 2 (00:02~00:12) --------|
                           |------- Window 3 (00:04~00:14) --------|

레코드 A (00:03) → Window 1, Window 2
레코드 B (00:05) → Window 1, Window 2, Window 3
```

레코드 B는 3개의 윈도우에 동시에 포함된다. 윈도우가 겹치는 만큼 State Store의 크기와 처리량이 증가한다.

Hopping Window는 "최근 N분" 같은 슬라이딩 평균이나 이동 합계를 구할 때 유용하다.
다만 겹침이 심할수록 같은 레코드가 여러 윈도우에 중복 집계되므로, advance 간격을 너무 짧게 잡으면 State Store 부담이 커질 수 있다.

<br>

# Session Window: 활동 기반 동적 구간

Session Window는 고정 크기가 아니라, **비활동 간격(inactivity gap)** 기준으로 윈도우를 동적으로 만든다.
레코드가 연속해서 들어오면 하나의 세션이 계속 확장되고, 비활동 간격만큼 레코드가 없으면 세션이 닫힌다.

```java
import org.apache.kafka.streams.kstream.SessionWindows;

KTable<Windowed<String>, Long> sessionCounts = orders
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(5)))
    .count();
```

5분의 비활동 간격을 설정했다고 하자. 사용자의 이벤트 타임라인을 보면:

```text
사용자 A:
  00:01  이벤트 1 → Session 1 [00:01, 00:03]
  00:03  이벤트 2 → Session 1
  (5분 이상 간격)
  00:12  이벤트 3 → Session 2 [00:12, 00:14]
  00:14  이벤트 4 → Session 2

사용자 B:
  00:02  이벤트 1 → Session 1 [00:02, 00:08]
  00:04  이벤트 2 → Session 1
  00:06  이벤트 3 → Session 1
  00:08  이벤트 4 → Session 1 (모두 5분 이내이므로 하나로 합쳐짐)
```

사용자 B는 모든 이벤트가 5분 이내 간격이므로 하나의 세션으로 합쳐진다.

Session Window의 동작에서 특이한 점이 있다. 새 레코드가 도착할 때 기존 세션과 겹치면 두 세션이 **병합(merge)**된다.
병합 과정에서 기존 집계 결과를 해제하고 다시 합산하는 연산이 필요하므로, `aggregate`를 사용할 때는 `Merger` 함수를 추가로 제공해야 한다.

```java
KTable<Windowed<String>, Long> sessionTotalAmount = orders
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(5)))
    .aggregate(
        () -> 0L,
        (key, event, currentTotal) -> currentTotal + event.getAmount(),
        (key, leftTotal, rightTotal) -> leftTotal + rightTotal,  // 세션 병합 시
        Materialized.with(Serdes.String(), Serdes.Long())
    );
```

세 번째 인자인 `Merger`는 두 세션이 병합될 때 호출된다. 여기서는 단순히 두 세션의 합산값을 더한다.

Session Window는 사용자 세션 분석, 웹사이트 방문 세션 트래킹, 장비 활동 감지 등에 적합하다.

<br>

# 윈도우 조인: KStream-KStream 시간 기반 조인

2편에서 다룬 KStream-KTable 조인은 "이벤트에 현재 상태를 붙이는" 패턴이었다.
KStream-KStream 조인은 **두 이벤트 스트림을 시간 윈도우 안에서 결합**하는 패턴이다.

대표적인 예시가 주문과 결제다. 주문 이벤트가 발생하고, 일정 시간 내에 결제 이벤트가 들어오면 두 이벤트를 결합한다.

```java
KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KStream<String, PaymentEvent> payments = builder.stream(
    "payment-events",
    Consumed.with(Serdes.String(), paymentEventSerde)
);

KStream<String, OrderWithPayment> matched = orders.join(
    payments,
    (order, payment) -> new OrderWithPayment(
        order.getOrderId(),
        order.getAmount(),
        payment.getPaymentMethod(),
        payment.getPaidAt()
    ),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30)),
    StreamJoined.with(Serdes.String(), orderEventSerde, paymentEventSerde)
);

matched.to("matched-orders",
    Produced.with(Serdes.String(), orderWithPaymentSerde));
```

`JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30))`는 양방향 30분 윈도우를 만든다.
즉, 주문 이벤트 시각 기준으로 앞뒤 30분 이내에 같은 key의 결제 이벤트가 있으면 조인된다.

```text
주문 타임스탬프: T
결제가 조인되려면: T - 30분 ≤ 결제 타임스탬프 ≤ T + 30분
```

비대칭 윈도우도 가능하다. "주문 이후 1시간 내 결제만 조인"하려면 `before`와 `after`를 다르게 설정한다.

```java
JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofHours(1))
    .before(Duration.ZERO)   // 주문 이전의 결제는 무시
    .after(Duration.ofHours(1))  // 주문 이후 1시간 내 결제만 매칭
```

KStream-KStream 조인은 **inner join**이 기본이다. 양쪽 모두 매칭되는 레코드가 있어야 결과가 나온다.
결제가 없는 주문도 결과에 포함하고 싶다면 `leftJoin`을 사용한다.

```java
KStream<String, OrderWithPayment> withPaymentOrNull = orders.leftJoin(
    payments,
    (order, payment) -> {
        if (payment == null) {
            return new OrderWithPayment(order, null); // 결제 미완료
        }
        return new OrderWithPayment(order, payment);
    },
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30)),
    StreamJoined.with(Serdes.String(), orderEventSerde, paymentEventSerde)
);
```

KStream-KStream 조인은 양쪽 스트림의 레코드를 윈도우 기간 동안 State Store에 보관해야 하므로, 윈도우가 클수록 State Store 사용량이 늘어난다.

<br>

# Grace Period와 늦게 도착하는 이벤트

분산 시스템에서 이벤트가 항상 순서대로 도착하지는 않는다. 네트워크 지연, 프로듀서 재시도, 파티션 간 시간 차이 등으로 인해 이벤트 타임스탬프 기준으로 "늦게" 도착하는 레코드가 생길 수 있다.

Grace Period는 윈도우가 닫힌 뒤에도 일정 시간 동안 늦은 레코드를 받아들이겠다는 설정이다.

```java
// 5분 윈도우 + 1분 grace period
KTable<Windowed<String>, Long> withGrace = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1))
    )
    .count();
```

이 설정에서 `[00:00, 00:05)` 윈도우는 stream time이 00:06(윈도우 종료 + grace 1분)을 초과할 때까지 열려 있다.
00:06 이전에 도착한 타임스탬프 00:03의 레코드는 해당 윈도우에 포함되고, 00:06 이후에 도착하면 버려진다.

여기서 **stream time**이라는 개념을 이해해야 한다. stream time은 Kafka Streams가 관찰한 레코드 중 가장 큰 타임스탬프다.
벽시계(wall-clock time)가 아니라 데이터에 기반한 시간이므로, 입력이 멈추면 stream time도 멈춘다.

```text
stream time 진행:

레코드 도착순서:
  ts=00:02 → stream time = 00:02
  ts=00:07 → stream time = 00:07  (윈도우 [00:00, 00:05) 닫힘 시작)
  ts=00:04 → 늦은 레코드, grace 기간 내라면 [00:00, 00:05)에 포함
  ts=00:08 → stream time = 00:08  (grace 1분 초과, 이후 00:04 같은 레코드는 버려짐)
```

Grace Period를 0으로 설정하면(`ofSizeWithNoGrace`) 윈도우가 닫히는 즉시 늦은 레코드를 거부한다.
데이터 정확도가 중요한 경우 grace를 길게 두되, 그만큼 State Store 유지 기간이 길어진다는 트레이드오프가 있다.

<br>

# 윈도우 연산의 State Store와 retention

윈도우 연산은 각 윈도우 구간의 집계 상태를 State Store에 저장한다.
시간이 지나면 오래된 윈도우의 데이터는 더 이상 필요하지 않으므로, 적절한 시점에 정리해야 State Store가 무한히 커지지 않는다.

Kafka Streams는 윈도우 State Store에 **retention** 설정을 제공한다.
`Materialized`에서 `withRetention`을 지정하면 해당 기간이 지난 윈도우 데이터를 자동으로 삭제한다.

```java
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.state.WindowBytesStoreSupplier;
import org.apache.kafka.streams.state.Stores;

KTable<Windowed<String>, Long> windowedCount = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count(
        Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("order-window-store")
            .withRetention(Duration.ofHours(1))
    );
```

`withRetention(Duration.ofHours(1))`은 1시간보다 오래된 윈도우 데이터를 State Store에서 제거한다.
retention은 윈도우 크기 + grace period보다 크거나 같아야 한다. 그렇지 않으면 아직 열려 있는 윈도우의 데이터가 삭제될 수 있어 예외가 발생한다.
이 retention 값은 내부 changelog 토픽의 `retention.ms`에도 반영되므로, 장애 복구 시 State Store를 재구축하는 데 걸리는 시간에도 영향을 준다.

운영에서 State Store 크기가 과도하게 커지는 경우, 아래 항목을 점검해 볼 수 있다.

```text
점검 항목:
  - 윈도우 크기가 실제 필요보다 크지 않은가
  - grace period가 과도하게 길지 않은가
  - retention이 불필요하게 긴 것은 아닌가
  - 입력 토픽의 key 카디널리티가 너무 높지 않은가
    (유니크 key가 많을수록 State Store 커짐)
```

State Store의 디스크 경로(`state.dir`)를 운영 환경에 맞게 설정하거나, standby replica로 복원 시간을 단축하는 방법은 <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">Kafka Streams 에러 처리와 복구 전략</a>에서 다룬다.

<br>

# 윈도우 연산 선택 가이드

각 윈도우 타입의 특성을 비교하면 다음과 같다.

| 윈도우 타입   | 크기             | 겹침                  | 레코드 소속       | 적합한 경우           |
|----------|----------------|---------------------|--------------|------------------|
| Tumbling | 고정             | 없음                  | 정확히 1개 윈도우   | 분/시간/일 단위 정기 집계  |
| Hopping  | 고정             | 있음 (size > advance) | 여러 윈도우에 중복   | 이동 평균, 슬라이딩 통계   |
| Session  | 동적 (비활동 간격 기반) | 없음 (같은 key 내)       | 활동 기간에 따라 변동 | 사용자 세션, 활동 기반 분석 |

어떤 윈도우를 선택하느냐에 따라 State Store 크기, 출력 레코드 수, 늦은 이벤트 처리 방식이 달라진다.
Hopping Window의 advance 간격이 좁으면 출력 레코드가 급격히 늘어나고, Session Window는 세션 병합으로 인해 집계 연산이 복잡해질 수 있다.
운영 환경에 적용하기 전에 예상 입력량과 key 카디널리티를 기준으로 State Store 크기를 미리 추정해 보는 것이 안전하다.

<br>

# 다음 글에서 다룰 내용

이 글에서는 윈도우 타입별 동작 원리와 KStream-KStream 시간 기반 조인, Grace Period를 다뤘다.
다음 글에서는 역직렬화 실패, 프로듀서 예외, 스레드 비정상 종료 등 Kafka Streams 운영 중 발생하는 에러를 체계적으로 처리하고 복구하는 전략을 다룬다.

- <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">다음 글: Kafka Streams 에러 처리와 복구 전략</a>

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/dsl-api#windowing" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams DSL: Windowing</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/streams/kstream/TimeWindows.html" target="_blank" rel="nofollow">Apache Kafka 3.4 Javadoc - TimeWindows</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/streams/kstream/JoinWindows.html" target="_blank" rel="nofollow">Apache Kafka 3.4 Javadoc - JoinWindows</a>
