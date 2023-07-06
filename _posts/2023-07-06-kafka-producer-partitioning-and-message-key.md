---
layout: post
title: "Kafka 메시지 키, 그냥 넣으면 끝일까?"
author: madplay
tags: kafka producer partitioning key partitioner ordering
description: "메시지 키 하나가 순서 보장, 병렬 처리, hot partition까지 바꾼다!"
category: Backend
date: "2023-07-06 21:08:34"
comments: true
---

# 메시지 키가 중요한 이유

같은 주문의 상태 이벤트가 서로 다른 파티션으로 흩어지면, 다운스트림은 컨슈머 수를 아무리 늘려도 이벤트의 원래 순서를 다시 맞추기가 매우 어려워진다.
메시지 키(Message Key)는 단순한 식별자가 아니라 순서 보장 범위와 병렬 처리 단위를 함께 정하는 입력값이다.
그래서 어떤 값을 키로 잡느냐는 프로듀서 옵션 선택을 넘어 도메인 설계와도 연결된다.

<br>

# 같은 키는 왜 같은 파티션에 모일까

메시지 키는 브로커 저장소의 Primary Key(기본 키)와는 다르다. 프로듀서가 레코드를 어느 파티션으로 보낼지 정할 때 사용하는 값이고,
기본 파티셔너를 사용할 때는 같은 키를 가진 레코드가 같은 파티션으로 가도록 만드는 기준이 된다.

## 키가 파티션을 고르는 기준이 된다

Kafka가 보장하는 순서는 토픽 전체가 아니라 파티션 내부에 한정된다.
그래서 "무엇을 같은 순서로 처리해야 하는가"를 키로 잘 표현해야 그 범위에서 순서를 기대할 수 있다.
키가 없거나 매번 다른 값을 키로 쓰면 같은 엔터티의 이벤트가 여러 파티션으로 흩어질 수 있다.

예를 들어 주문 이벤트에서 `orderId`를 키로 넣으면, 프로듀서는 이 값을 기준으로 파티션을 고르게 된다.
아래 코드는 같은 주문의 이벤트를 같은 파티션에 모으는 가장 기본적인 형태다.

```java
String topic = "order-events";
String key = orderEvent.getOrderId();
String value = objectMapper.writeValueAsString(orderEvent);

ProducerRecord<String, String> record =
    new ProducerRecord<>(topic, key, value);

producer.send(record);
```

Kafka의 순서 보장은 토픽 전체가 아닌 **파티션 내부(Intra-partition)**로 한정된다.
동일한 `orderId`를 키로 사용하면 해당 주문과 관련된 모든 이벤트가 같은 파티션에 기록된 순서대로 쌓이게 된다.

같은 키를 같은 파티션에 모으는 설계는 컨슈머의 상태 관리와도 자연스럽게 연결된다.
예를 들어 주문 상태를 메모리나 로컬 캐시에 들고 처리하는 컨슈머라면, 같은 `orderId`의 이벤트가 한 파티션에 모여 있어야 상태를 단순하게 유지하기 쉽다.

## 실제 내부 코드로 보면



이 동작은 "그렇게 약속돼 있다" 수준이 아니라, Kafka 클라이언트 내부 구현에도 그대로 드러난다.
<a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/producer/internals/BuiltInPartitioner.java"
target="_blank" rel="nofollow">Apache Kafka 소스의 BuiltInPartitioner</a>를 보면, 키가 있을 때 사용할 파티션 계산 흐름이 아래처럼 나온다.

```java
if (serializedKey != null) {
    return Utils.toPositive(Utils.murmur2(serializedKey)) % numPartitions;
}
```

즉, 직렬화된 키 바이트(`serializedKey`)를 `murmur2`로 해시한 뒤 파티션 수(`numPartitions`)로 나눈 나머지를 파티션 번호로 사용한다.
그래서 **같은 키 바이트와 같은 파티션 수**라는 조건이 유지되면, 기본 파티셔너는 같은 키를 같은 파티션으로 보내게 된다.

다만 이 결과는 파티션 수가 바뀌면 달라질 수 있다. 그래서 `orderId`를 키로 잘 잡았더라도,
나중에 토픽 파티션 수를 늘리면 같은 주문이 예전과 다른 파티션으로 이동할 수 있다. 이 점은 뒤에서 다시 다룬다.

## backlog가 쌓여도 같은 키의 순서는 유지된다

이 특성은 컨슈머 장애나 일시 중단으로 backlog가 쌓였을 때도 의미가 있다.
같은 엔터티가 계속 같은 키로 발행됐다면, **해당 키 범위의 레코드는 같은 파티션 안에서 기록된 순서대로 다시 읽힌다.**

예를 들어 `orderId`를 키로 사용했다면, 같은 주문의 `주문 생성`, `결제 완료`, `배송 시작` 이벤트는 같은 파티션에 쌓이고 그 순서대로 다시 읽힌다.
그래서 컨슈머 장애 후 backlog를 몰아서 다시 처리하더라도 상태 전이 순서가 뒤섞일 위험을 줄일 수 있다.

**다만 이것이 토픽 전체의 시간 순서를 보장한다는 뜻은 아니다.**
보장 범위는 어디까지나 같은 키가 들어간 같은 파티션 내부다. 또한 같은 키 유지, 파티션 수 불변, 컨슈머의 순차 처리 같은 전제가 함께 맞아야 한다.

복구 후 재처리에서 순서 문제 때문에 처리가 자주 꼬인다면, 메시지 키와 파티션 설계를 먼저 점검해볼 수 있다.
다만 원인이 항상 거기에만 있는 것은 아니므로, 프로듀서 재시도 설정, 파티션 수 변경, 컨슈머 처리 방식도 함께 확인해야 한다.

<br>

# 기본 파티셔너가 동작하는 방식

기본 파티셔너는 키가 있느냐 없느냐에 따라 다르게 동작한다.
Kafka 3.5 기준으로는 키가 있으면 해시(Hash) 기반으로 파티션을 고르고,
키가 없으면 배치 효율을 높이기 위해 **Sticky Partitioning(스티키 파티셔닝)** 전략을 사용해 특정 파티션에 레코드를 모아서 보낸다.

## 키가 있을 때

키가 있으면 기본적으로 해시 기반 분산이 적용된다. 그래서 같은 키는 같은 파티션으로, 다른 키는 여러 파티션으로 퍼지게 된다.
이 특성 덕분에 엔터티 단위 순서를 유지하면서도 서로 다른 엔터티는 병렬로 처리할 수 있다.

```java
// 키가 있으면 해시 기반 라우팅
producer.send(new ProducerRecord<>("topic", "key", "value"));

// 키가 없으면 Sticky Partition 전략 적용
producer.send(new ProducerRecord<>("topic", null, "value"));
```

## 키가 없을 때

키가 없는 레코드가 라운드 로빈(Round-robin) 방식으로 매번 다른 파티션에 가지 않는다는 점에 유의해야 한다.
전송 효율을 위해 잠시 한 파티션에 머무르기 때문에 관측 시점에는 데이터가 쏠린 것처럼 보일 수 있다. 설정을 통해 키가 있더라도 이를 무시하고 분산시킬 수 있다.

```properties
partitioner.ignore.keys=false (기본값)
```

이 값이 `true`로 설정되면 키가 존재해도 파티션 결정에 반영되지 않는다.
순서 보장이 중요한 시스템이라면 이 설정이 의도치 않게 변경되지 않았는지 함께 확인하는 편이 안전하다.

<br>

# 어떤 키를 골라야 할까

메시지 키를 고를 때는 값이 얼마나 유일한지보다 **"무엇이 같은 순서로 처리되어야 하는가"**를 먼저 보는 편이 낫다.
이 기준이 흐리면 키를 넣고도 순서가 깨지는 상황을 마주하게 된다.

아래 표는 도메인에 따라 이런 식으로 설계할 수 있다는 예시다.
같은 이벤트라도 어떤 엔터티 단위의 순서를 보장해야 하는지에 따라 전혀 다른 키를 고를 수 있다.

| 후보 키           | 설계 의도        | 운영 시 주의사항                    |
|:---------------|:-------------|:-----------------------------|
| **orderId**    | 주문 단위 순서 보장  | 특정 고객의 대량 주문 시 파티션 편중 가능     |
| **customerId** | 고객 단위 데이터 집계 | 헤비 유저의 트래픽이 Hot Partition 유발 |
| **storeId**    | 매장별 재고/정산 처리 | 대형 매장과 소형 매장 간 처리량 불균형       |
| **랜덤 UUID**    | 단순 부하 분산     | 동일 엔티티에 대한 순서 보장 불가능         |

키 선택은 컨슈머의 상태 관리(State Management) 방식과도 연결된다.
동일 키를 가진 데이터를 같은 파티션으로 모으면 컨슈머가 로컬 캐시나 메모리 안에서 엔티티 단위 상태를 유지하기 쉬워진다.
그래서 메시지 키는 상태 기반 아키텍처 설계와도 자연스럽게 이어진다.

<br>

# hot partition이 생기는 이유

hot partition은 특정 파티션에만 트래픽이 과하게 몰리는 상태다.
파티션 수를 아무리 늘려도 키 분포가 한쪽으로 치우치면, 가장 바쁜 파티션이 결국 전체 파이프라인의 병목이 된다.

```text
partition 0 → 9,000 msg/s (Bottleneck)
partition 1 →   100 msg/s
partition 2 →   100 msg/s
```

예를 들어 매장 ID를 키로 잡았는데 대형 매장의 트래픽이 소형 매장보다 압도적으로 높다면, 해당 파티션을 담당하는 컨슈머 인스턴스만 계속 지연될 수 있다.
이때는 단순히 컨슈머를 늘려도 효과가 제한적이어서 키 설계 자체를 다시 봐야 할 수 있다. 성공 로그에 파티션 정보를 포함하면 이런 편중을 조기에 발견하기 쉽다.

```java
log.info("publish success. key={}, partition={}, offset={}",
    record.key(), metadata.partition(), metadata.offset());
```

<br>

# 파티션 수를 늘리면 무엇이 달라질까

파티션 수를 늘리면 병렬성은 좋아질 수 있다. 하지만 같은 키가 어느 파티션으로 가는지도 함께 바뀔 수 있다.
해시 기반 분산은 파티션 총수를 분모로 사용하므로, 분모가 달라지면 같은 키라도 다른 파티션으로 이동할 수 있다.

```text
증설 전 (6개)  : key="A" → partition 2
증설 후 (12개) : key="A" → partition 7 (순서 단절 발생)
```

그래서 증설 시점을 기준으로 이전 순서 구간과 이후 순서 구간이 나뉘는 현상이 생길 수 있다. 주문 상태 전이처럼 인과 관계가 중요한 도메인에서는
증설 전에 기존 데이터를 완전히 소진하거나, 새 토픽으로 옮기는 전략을 함께 검토하는 편이 낫다.

<br>

# 커스텀 파티셔너를 고민하는 이유

기본 해시 분산만으로는 설명되지 않는 요구가 있다면 커스텀 파티셔너(Custom Partitioner)를 떠올릴 수 있다.
예를 들어 특정 고객군(VIP)을 별도 파티션으로 격리하고 싶거나, 규칙상 특정 키를 정해진 파티션 범위로 보내고 싶은 경우다.
이런 요구는 "같은 키는 같은 파티션으로 보낸다"는 기본 규칙만으로는 표현하기 어려울 때가 있다.

## 언제 필요한가

다만 커스텀 파티셔너는 기본 파티셔너가 해 주던 단순하고 일관된 분산 규칙을 애플리케이션이 직접 책임지는 방식이다.
그래서 설계 의도는 더 세밀하게 반영할 수 있지만, 그만큼 운영 복잡도도 빠르게 높아진다.

```java
public class CustomerTierPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        if (key == null) {
            return 0;
        }
        if (key.toString().startsWith("VIP-")) return 0; // VIP 격리
        return Utils.toPositive(Utils.murmur2(keyBytes)) % (cluster.partitionCountForTopic(topic) - 1) + 1;
    }
}
```

## 왜 신중해야 할까

커스텀 파티셔너를 쓰면 모든 언어의 클라이언트에서 같은 로직을 유지해야 하고, 파티션 증설 시마다 그 로직이 여전히 맞는지도 확인해야 한다.
격리가 목적이라면 토픽 자체를 분리하는 쪽이 관리 측면에서 더 명확할 때도 많다.

또한 null key를 어떻게 다룰지도 명시적으로 정해야 한다. 예제처럼 단순히 `0`번으로 보내면 설명은 쉬워지지만, 실제 운영에서는 특정 파티션 편중을 만들 수 있다.

즉, 커스텀 파티셔너는 "기본 키 설계만으로는 원하는 라우팅 규칙을 만들기 어렵다"는 판단이 섰을 때 검토할 수 있는 선택지다.
반대로 키 설계를 조금 더 다듬거나 토픽을 분리하는 것만으로도 요구를 충족할 수 있다면, 그것이 더 단순하고 운영하기 쉬운 경우가 많다.

<br>

# 키 설계만으로 충분할까

메시지 키를 잘 고르는 것만으로 순서 문제가 끝나는 것은 아니다.
파티션 내부 순서를 기대하려면 재시도 과정에서의 순서 역전까지 같이 봐야 하고, 그 지점은 프로듀서 전송 설정이 영향을 준다.

## 키 설계가 맡는 역할

키 설계는 "같은 엔터티를 어디에 모을 것인가"를 정하는 문제다.
즉, 어떤 이벤트끼리 같은 파티션에서 같은 순서로 처리되게 만들지를 결정하는 단계라고 볼 수 있다.

예를 들어 같은 `orderId`를 같은 파티션에 모으는 데까지는 성공했더라도, 프로듀서가 재시도하는 과정에서 먼저 보낸 배치보다 나중 배치가 먼저 기록되면
같은 파티션 안에서도 기대한 순서가 흔들릴 수 있다. 즉, 메시지 키는 **어디에 모을지**를 정하고, 프로듀서 설정은 **그 안에서 어떤 순서로 기록될 가능성이 높은지**에 영향을 준다.

## 프로듀서 설정이 맡는 역할

```java
/*
 * 멱등성(idempotence)을 활성화한다.
 * 프로듀서가 전송 성공 응답을 받기 전에 타임아웃이나 네트워크 오류로 재시도하더라도,
 * 브로커가 producer ID와 sequence 번호를 기준으로 중복 레코드 저장을 방지한다.
 */
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");

/*
 * 하나의 커넥션에서 동시에 전송 중(in-flight)인 요청 수를 5 이하로 제한한다.
 * 멱등성 프로듀서는 이 값이 5를 초과하면 순서 보장(ordering)과 중복 방지 보장이 깨질 수 있으므로, Kafka는 안전한 범위 안에서만 동작하도록 제한한다.
 */
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5");

/*
 * acks=all은 리더 파티션이 ISR(In-Sync Replicas, 최신 상태를 유지하는 복제본 집합)의 확인을 모두 받은 뒤에만 전송 성공 응답을 반환하게 한다.
 * 지연(latency)은 늘어날 수 있지만, 브로커 장애 상황에서 메시지 유실 가능성을 줄여 내구성(durability)을 높인다.
 */
props.put(ProducerConfig.ACKS_CONFIG, "all");

```

즉, 키 선택으로 **같은 엔티티를 같은 파티션에 모으고**, 전송 설정으로 **파티션 내부의 전송 순서를 최대한 안정적으로 유지**하는
두 단계를 함께 봐야 기대한 순서 보장에 가까워진다.

<br>

# 참고

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/producer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Producer Configs</a>
