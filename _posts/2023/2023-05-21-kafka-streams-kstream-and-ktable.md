---
layout: post
title: "Kafka Streams KStream과 KTable"
author: madplay
tags: kafka streams kstream ktable globalktable serdes
description: "KStream과 KTable이 같은 토픽을 다르게 해석하는 이유, Stateless/Stateful 연산, KStream-KTable 조인과 Serdes 설정을 코드 중심으로 정리한다."
category: Backend
date: "2023-05-21 19:35:08"
comments: true
---

# Kafka Streams 시리즈 목차
- <a href="/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams 개념과 아키텍처</a>
- **2. Kafka Streams KStream과 KTable**
- <a href="/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams 윈도우와 조인</a>
- <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams 에러 처리와 복구 전략</a>

<br>

# 이벤트와 상태, 두 가지 관점

온라인 쇼핑몰에서 사용자의 주문 이벤트를 처리한다고 생각해 보자.
"사용자 A가 상품 X를 주문했다"는 이벤트는 발생할 때마다 하나의 독립적인 사실이다. 같은 사용자가 두 번 주문하면 두 개의 이벤트가 쌓인다.
반면 "사용자 A의 현재 등급은 골드다"라는 정보는 등급이 바뀔 때마다 이전 값을 대체하는 최신 상태다.

Kafka Streams는 이 두 가지 관점을 각각 **KStream**과 **KTable**이라는 추상화로 표현한다.

<br>

# KStream: 끝없는 이벤트 흐름

KStream은 토픽의 각 레코드를 독립적인 이벤트(INSERT)로 해석한다.
같은 key를 가진 레코드가 여러 번 들어와도 이전 값을 덮어쓰지 않는다. 모든 레코드가 의미 있는 데이터다.

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, String> orderStream = builder.stream("order-events");
```

`order-events` 토픽에 아래 4개의 레코드가 들어온다고 하자.

```text
key=user-A, value={"item":"X", "amount":15000}
key=user-B, value={"item":"Y", "amount":8000}
key=user-A, value={"item":"Z", "amount":22000}
key=user-B, value={"item":"W", "amount":5000}
```

KStream은 이 4개를 모두 독립 이벤트로 처리한다. key가 `user-A`인 레코드가 2개지만 서로 대체하지 않는다.

<br>

# KTable: key 기준 최신 상태

KTable은 같은 key의 레코드가 들어오면 이전 값을 **UPDATE**한다.
항상 key당 최신 값 하나만 유지하는, 데이터베이스 테이블과 비슷한 구조다.

```java
KTable<String, String> userGradeTable = builder.table("user-grades");
```

`user-grades` 토픽에 아래 레코드가 순서대로 들어오면:

```text
key=user-A, value="SILVER"
key=user-B, value="GOLD"
key=user-A, value="GOLD"
```

KTable의 최종 상태는 `user-A=GOLD`, `user-B=GOLD`이다. `user-A`의 첫 번째 값 `SILVER`는 `GOLD`로 대체됐다.

그렇다면 같은 토픽을 KStream으로 읽으면 어떻게 될까?
KStream은 3개의 레코드를 모두 독립적으로 처리한다. "SILVER가 GOLD로 바뀌었다"는 해석 없이 3건의 이벤트가 각각 흘러간다.

같은 데이터를 KStream으로 볼지 KTable로 볼지는 비즈니스 의미에 따라 결정한다.

| 구분          | KStream         | KTable           |
|-------------|-----------------|------------------|
| 레코드 해석      | INSERT (독립 이벤트) | UPDATE (최신 상태)   |
| 같은 key      | 모두 유지           | 마지막 값만 유지        |
| State Store | 기본적으로 사용하지 않음 (stateful 연산 시 사용) | 사용               |
| 적합한 데이터     | 주문, 클릭, 로그      | 사용자 프로필, 재고, 설정값 |

<br>

# KStream과 KTable은 언제 쓰는가

KStream은 발생하는 이벤트를 빠짐없이 처리해야 할 때 적합하다. 주문, 클릭 로그, 센서 데이터처럼 개별 건 자체가 의미 있는 데이터는 KStream으로 읽는 것이 자연스럽다. 한 건 한 건이 독립적이므로 필터링, 변환, 분기 같은 Stateless 연산을 거쳐 바로 다음 처리로 넘길 수 있다.

KTable은 최신 상태를 관리해야 할 때 적합하다. 사용자 프로필, 상품 재고, 환율처럼 값이 갱신되면 이전 값은 의미가 없어지는 데이터가 대표적이다. State Store에 key 단위로 최신 값을 유지하므로, 실시간 조회가 필요한 참조 데이터를 다루기에 좋다.

둘의 조합은 **이벤트에 최신 상태를 결합**해야 할 때 진가를 발휘한다. 예를 들어, 주문 이벤트(KStream)가 들어올 때마다 해당 사용자의 현재 등급(KTable)을 붙여서 등급별 할인을 적용할 수 있다. KStream 단독이라면 등급 정보를 매번 외부 시스템에 조회해야 하고, KTable 단독이라면 이벤트의 흐름 자체를 처리할 수 없다. KStream-KTable 조인은 이벤트 흐름과 최신 상태를 Kafka 안에서 결합하므로, 외부 호출 없이도 풍부한 실시간 처리가 가능해진다.

<br>

# GlobalKTable: 전체 파티션 데이터를 로컬에

KTable은 파티션 단위로 분할된다. 즉, 인스턴스 A는 파티션 0~1의 데이터만 갖고, 인스턴스 B는 파티션 2~3의 데이터만 갖는다.
이 특성 때문에 KStream과 KTable을 조인하려면 두 토픽의 파티션 수가 같고, 같은 key가 같은 파티션에 있어야 한다. 이를 co-partitioning이라 하며, 조인 대상 토픽들이 같은 파티션 수와 같은 파티셔닝 전략을 사용하는 것을 뜻한다.

GlobalKTable은 이 제약을 없앤다. 모든 인스턴스가 토픽의 **전체 파티션 데이터**를 로컬에 복제한다.

```java
GlobalKTable<String, String> productTable = builder.globalTable("products");
```

GlobalKTable은 co-partitioning 없이 조인이 가능하고, 어떤 key로든 로컬에서 조회할 수 있다.
다만 토픽의 전체 데이터를 각 인스턴스가 모두 갖고 있으므로, 데이터가 많으면 메모리와 디스크 사용량이 커진다.
상품 마스터, 국가 코드, 환율 같은 조회용 참조 데이터에 적합하다.

<br>

# Stateless 연산

Stateless 연산은 현재 레코드만 보고 결과를 내는 연산이다. 이전 레코드의 상태를 기억할 필요가 없으므로 State Store를 사용하지 않는다.
아래 연산들은 주로 KStream에서 사용하지만, `filter`와 `mapValues`는 KTable에서도 동일하게 사용할 수 있다.

## filter

조건에 맞는 레코드만 통과시킨다.

```java
KStream<String, OrderEvent> highValueOrders = orderStream
    .filter((key, event) -> event.getAmount() >= 10000);
```

## map / mapValues

레코드의 key와 value를 변환한다. `mapValues`는 key를 그대로 두고 value만 변환하므로, 재파티셔닝이 발생하지 않는다.

```java
// key는 유지, value만 변환
KStream<String, String> summaries = orderStream
    .mapValues(event -> event.getItem() + ":" + event.getAmount());

// key와 value 모두 변환 (재파티셔닝 발생 가능)
KStream<String, Integer> amountByItem = orderStream
    .map((key, event) -> KeyValue.pair(event.getItem(), event.getAmount()));
```

`map`으로 key를 변경한 뒤 `groupByKey`나 `join` 같은 key 기반 연산이 뒤따르면, Kafka Streams가 내부적으로 repartition 토픽을 생성해서 데이터를 재분배한다. repartition 토픽은 새 key 기준으로 데이터를 올바른 파티션에 다시 배치하는 중간 토픽이다.
key 변경이 불필요하다면 `mapValues`를 사용하는 것이 성능상 유리하다.

repartition이 발생하면 모든 레코드가 새 key 기준으로 직렬화되어 repartition 토픽에 쓰인 뒤, 다시 읽혀서 다음 프로세서로 전달된다.
이 과정에서 네트워크 I/O와 디스크 I/O가 추가로 발생하고, repartition 토픽은 입력 토픽과 같은 파티션 수로 생성되므로 브로커의 디스크 사용량도 늘어난다.
`map`, `selectKey`, `groupBy`로 key를 변경한 뒤 key 기반 연산(`groupByKey`, `join` 등)이 뒤따르면 repartition이 발생할 수 있다. key 변경이 필요 없다면 `mapValues`와 `groupByKey`를 사용하는 것이 안전하다.

```java
// repartition 발생: selectKey로 key를 변경한 뒤 groupByKey
orderStream
    .selectKey((key, event) -> event.getItem())
    .groupByKey()
    .count();

// repartition 없음: groupBy 대신 기존 key를 유지
orderStream
    .groupByKey()
    .count();
```

## flatMapValues

하나의 레코드를 여러 개로 펼친다. 1편에서 본 WordCount의 단어 분리가 대표적인 예다.

```java
KStream<String, String> words = textLines
    .flatMapValues(line -> Arrays.asList(line.split("\\W+")));
```

## branch

조건에 따라 스트림을 여러 갈래로 분기한다.

```java
@SuppressWarnings("unchecked")
KStream<String, OrderEvent>[] branches = orderStream.branch(
    (key, event) -> event.getAmount() >= 50000,  // [0] 고가 주문
    (key, event) -> event.getAmount() >= 10000,   // [1] 중가 주문
    (key, event) -> true                           // [2] 그 외
);

KStream<String, OrderEvent> premiumOrders = branches[0];
KStream<String, OrderEvent> standardOrders = branches[1];
KStream<String, OrderEvent> budgetOrders = branches[2];
```

`branch`의 조건은 순서대로 평가되며, 첫 번째로 일치하는 분기로 라우팅된다.
마지막 조건을 `(key, event) -> true`로 두면 앞의 조건에 걸리지 않은 모든 레코드를 잡아낼 수 있다.
`branch`는 배열 반환 방식이라 타입 안전성이 떨어지는데, Kafka 2.8 이후에는 `split().branch().defaultBranch()`로 대체할 수 있다.

<br>

# Stateful 연산

Stateful 연산은 여러 레코드에 걸쳐 상태를 유지하며 결과를 누적하는 연산이다.
State Store(기본 RocksDB)에 중간 상태를 저장하고, changelog 토픽에 변경 사항을 기록해 장애 복구를 보장한다.

KStream에서 `groupByKey`나 `groupBy`로 레코드를 묶으면 `KGroupedStream`이 되고, 여기에 `count`, `reduce`, `aggregate` 같은 집계를 적용하면 결과가 KTable로 반환된다.

## groupByKey vs groupBy

```java
// key를 변경하지 않을 때 (재파티셔닝 없음)
KGroupedStream<String, OrderEvent> groupedByUser = orderStream.groupByKey();

// key를 변경할 때 (재파티셔닝 발생)
KGroupedStream<String, OrderEvent> groupedByItem = orderStream
    .groupBy((key, event) -> event.getItem());
```

`groupByKey`는 현재 key를 그대로 사용하므로, 원래 key가 유지된 경우에는 재파티셔닝이 발생하지 않는다. 다만 업스트림에서 `selectKey`나 `map`으로 key를 이미 변경한 상태라면 `groupByKey()`도 내부적으로 repartition이 필요하다.
`groupBy`는 새 key를 지정하므로 내부적으로 repartition 토픽이 생긴다.
가능하면 `groupByKey`를 사용하는 것이 네트워크 비용과 처리 지연을 줄일 수 있다.

## count

key별 레코드 수를 센다. 결과는 KTable로 반환된다.

```java
KTable<String, Long> orderCountByUser = orderStream
    .groupByKey()
    .count();
```

## reduce

같은 타입의 두 값을 하나로 합친다. 집계 결과의 타입이 입력 레코드의 value 타입과 같아야 한다.

```java
// 사용자별 최대 주문 금액
KTable<String, OrderEvent> maxOrderByUser = orderStream
    .groupByKey()
    .reduce((aggValue, newValue) ->
        aggValue.getAmount() >= newValue.getAmount() ? aggValue : newValue
    );
```

## aggregate

`reduce`보다 유연한 집계 연산이다. 초기값(initializer)과 집계 함수(aggregator)를 받고, 결과 타입이 입력과 달라도 된다.

```java
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.kstream.Materialized;

KTable<String, Long> totalAmountByUser = orderStream
    .groupByKey()
    .aggregate(
        () -> 0L,  // 초기값
        (key, event, currentTotal) -> currentTotal + event.getAmount(),
        Materialized.with(Serdes.String(), Serdes.Long())
    );
```

`Materialized.with(...)`로 State Store의 key/value Serdes를 지정한다.
결과 타입이 입력과 다르기 때문에(OrderEvent → Long) Serdes를 명시해야 한다.

<br>

# KStream-KTable 조인

주문 이벤트(KStream)에 사용자 등급 정보(KTable)를 붙이는 것은 실무에서 매우 흔한 패턴이다.
KStream-KTable 조인은 스트림의 각 레코드에 대해 같은 key를 가진 KTable의 현재 값을 찾아 결합한다.

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KTable<String, String> userGrades = builder.table(
    "user-grades",
    Consumed.with(Serdes.String(), Serdes.String())
);

// 주문 이벤트에 사용자 등급을 붙인다
KStream<String, EnrichedOrder> enrichedOrders = orders.join(
    userGrades,
    (order, grade) -> new EnrichedOrder(
        order.getOrderId(),
        order.getItem(),
        order.getAmount(),
        grade  // KTable에서 가져온 현재 등급
    )
);

enrichedOrders.to("enriched-orders",
    Produced.with(Serdes.String(), enrichedOrderSerde));
```

이 조인이 동작하려면 `order-events`와 `user-grades` 토픽의 key가 동일한 기준(예: userId)이고, 파티션 수가 같아야 한다(co-partitioning).

KStream-KTable 조인은 **inner join**이 기본이다. 즉, KTable에 해당 key가 없으면 그 스트림 레코드는 결과에 포함되지 않는다.
모든 주문 이벤트를 결과에 포함하고 싶다면 `leftJoin`을 사용한다.

```java
KStream<String, EnrichedOrder> enrichedOrders = orders.leftJoin(
    userGrades,
    (order, grade) -> new EnrichedOrder(
        order.getOrderId(),
        order.getItem(),
        order.getAmount(),
        grade != null ? grade : "UNKNOWN"
    )
);
```

`leftJoin`에서 KTable에 매칭되는 값이 없으면 `grade`가 null로 전달된다.

만약 co-partitioning 제약이 문제가 된다면 GlobalKTable을 사용할 수 있다.
GlobalKTable 조인에서는 `KeyValueMapper`로 조인 key를 직접 지정하므로 파티션 수가 달라도 동작한다.

```java
GlobalKTable<String, String> productTable = builder.globalTable("products");

KStream<String, EnrichedOrder> withProduct = orders.join(
    productTable,
    (orderKey, orderValue) -> orderValue.getItem(),  // products 토픽의 key와 매칭할 값
    (order, productInfo) -> new EnrichedOrder(order, productInfo)
);
```

<br>

# KTable의 중간 갱신과 suppress

KTable은 key의 값이 갱신되면 다운스트림(downstream) 프로세서에 변경 레코드를 내보낸다.
실제로는 Kafka Streams의 Record Cache(`statestore.cache.max.bytes`, 기본 10MB)가 같은 key에 대한 연속 갱신을 병합해서 캐시가 플러시될 때 마지막 값만 전달하므로, 모든 중간 값이 그대로 나가지는 않는다.
그럼에도 캐시 플러시 주기에 따라 상당수의 중간 갱신이 다운스트림으로 전달될 수 있다.

예를 들어 `count()`로 단어 카운트를 구하면, 같은 단어가 들어올 때마다 카운트가 1, 2, 3, ... 으로 갱신되며 캐시 플러시 시점마다 중간 결과가 출력된다.

윈도우 집계에서는 이 중간 갱신이 특히 문제가 된다. 5분 윈도우 안에서 수천 건의 레코드가 들어오면 캐시가 줄여주더라도 상당수의 중간 결과가 출력 토픽에 쓰인다.
최종 결과만 필요하다면 `suppress`를 사용할 수 있다.

```java
import org.apache.kafka.streams.kstream.Suppressed;
import org.apache.kafka.streams.kstream.TimeWindows;
import java.time.Duration;

KTable<Windowed<String>, Long> finalCounts = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeAndGrace(
            Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count()
    .suppress(
        Suppressed.untilWindowCloses(
            Suppressed.BufferConfig.unbounded()));
```

`suppress(untilWindowCloses(unbounded()))`는 윈도우가 닫힐 때까지 중간 결과를 버퍼에 보관하다가, 윈도우가 닫히는 시점에 최종 결과 하나만 내보낸다.

`unbounded()`는 버퍼 크기에 제한을 두지 않는다는 의미다. key 카디널리티가 높거나 윈도우가 길면 버퍼 메모리 사용량이 커질 수 있으므로, 상한이 필요하다면 `maxRecords`나 `maxBytes`로 제한된 버퍼를 사용할 수 있다.

```java
Suppressed.BufferConfig
    .maxRecords(10000)
    .shutDownWhenFull()
```

`shutDownWhenFull()`은 버퍼가 가득 차면 스트림을 종료하고, `emitEarlyWhenFull()`은 버퍼가 차면 중간 결과를 내보내면서 계속 동작한다.

<br>

# DSL과 Processor API 혼합 사용

1편에서 Streams DSL과 Processor API의 차이를 다뤘다. 대부분의 경우 DSL만으로 충분하지만, DSL 체인 중간에 State Store에 직접 접근하거나 조건부 라우팅이 필요한 경우가 있다.

`process()`를 사용하면 DSL 체인 안에서 Processor API의 `Processor`를 끼워 넣을 수 있다.

```java
import org.apache.kafka.streams.processor.api.Processor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.KeyValueStore;

StoreBuilder<KeyValueStore<String, Long>> storeBuilder =
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("dedup-store"),
        Serdes.String(),
        Serdes.Long()
    );

builder.addStateStore(storeBuilder);

orderStream.process(() -> new Processor<
        String, OrderEvent, String, OrderEvent>() {

    private KeyValueStore<String, Long> store;
    private ProcessorContext<String, OrderEvent> context;

    @Override
    public void init(
            ProcessorContext<String, OrderEvent> ctx) {
        this.context = ctx;
        this.store = ctx.getStateStore("dedup-store");
    }

    @Override
    public void process(
            Record<String, OrderEvent> record) {
        String orderId = record.value().getOrderId();
        if (store.get(orderId) != null) {
            return;
        }
        store.put(orderId, record.timestamp());
        context.forward(record);
    }
}, "dedup-store");
```

이 예시는 주문 ID 기준으로 중복 레코드를 걸러내는 패턴이다. State Store에 이미 처리한 주문 ID를 기록해 두고, 같은 ID가 다시 들어오면 다운스트림으로 전달하지 않는다.
`process()`의 마지막 인자로 접근할 State Store 이름을 전달해야 한다.

<br>

# Serdes 설정과 직렬화

Kafka Streams에서 레코드의 key와 value를 직렬화/역직렬화하는 것이 **Serdes**다.
`Serdes`는 `Serializer`와 `Deserializer`를 묶은 래퍼 클래스이며, Kafka Streams의 모든 입출력 지점에서 사용된다.

기본 제공되는 Serdes는 `Serdes.String()`, `Serdes.Long()`, `Serdes.Integer()`, `Serdes.ByteArray()` 등이 있다.
JSON 같은 커스텀 포맷은 직접 Serdes를 만들어야 한다.

```java
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serializer;

public class JsonSerde<T> implements Serde<T> {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Class<T> targetType;

    public JsonSerde(Class<T> targetType) {
        this.targetType = targetType;
    }

    @Override
    public Serializer<T> serializer() {
        return (topic, data) -> {
            try {
                return objectMapper.writeValueAsBytes(data);
            } catch (Exception e) {
                throw new SerializationException("JSON 직렬화 실패. topic=" + topic, e);
            }
        };
    }

    @Override
    public Deserializer<T> deserializer() {
        return (topic, data) -> {
            try {
                return objectMapper.readValue(data, targetType);
            } catch (Exception e) {
                throw new SerializationException("JSON 역직렬화 실패. topic=" + topic, e);
            }
        };
    }
}
```

이 Serdes를 스트림 연산에서 사용할 때는 `Consumed`, `Produced`, `Materialized` 등에 전달한다.

```java
Serde<OrderEvent> orderEventSerde = new JsonSerde<>(OrderEvent.class);

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);
```

Serdes를 지정하지 않으면 `StreamsConfig`에 설정한 `DEFAULT_KEY_SERDE_CLASS_CONFIG`와 `DEFAULT_VALUE_SERDE_CLASS_CONFIG`가 사용된다.
기본 Serdes와 실제 데이터 타입이 맞지 않으면 런타임에 `ClassCastException`이 발생하므로, 타입이 다른 연산에서는 Serdes를 명시적으로 지정하는 것이 안전하다.

특히 `aggregate`나 `count` 같은 stateful 연산에서 결과 타입이 바뀌는 경우 `Materialized.with(...)`로 Serdes를 반드시 지정해야 한다.
이를 빠뜨리면 State Store에 값을 쓰거나 읽을 때 직렬화 오류가 발생한다.

<br>

# 다음 글에서 다룰 내용

이 글에서는 KStream과 KTable의 차이, Stateless/Stateful 연산, 조인, Serdes 설정을 다뤘다.
다음 글에서는 시간 기반으로 데이터를 묶는 윈도우(Tumbling, Hopping, Session)와 KStream-KStream 시간 조인, Grace Period를 다룬다.

- <a href="/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">다음 글: Kafka Streams 윈도우와 조인</a>

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/dsl-api" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams DSL</a>
- <a href="https://kafka.apache.org/34/documentation/streams/concepts" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams Concepts</a>
