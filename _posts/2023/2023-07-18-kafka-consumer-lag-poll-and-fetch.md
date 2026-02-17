---
layout: post
title: "Kafka 컨슈머는 왜 자꾸 밀릴까?"
author: madplay
tags: kafka consumer poll fetch max-poll-interval lag
description: "lag가 커지고 리밸런싱이 반복될 때, 컨슈머 내부에서는 무엇이 벌어질까? poll과 fetch의 흐름을 알아보자!"
category: Backend
date: "2023-07-18 18:47:29"
comments: true
---

# poll 루프가 병목이 되는 지점

`poll()`은 Kafka 컨슈머가 브로커로부터 레코드를 받아 오는 가장 기본적인 API다.
애플리케이션은 보통 이 메서드를 반복 호출하면서 데이터를 가져오고, 가져온 레코드를 순서대로 처리한다. 이 글에서 말하는 `poll 루프`도 바로 이 반복 흐름을 가리킨다.

문제는 이 반복 흐름이 단순히 데이터를 읽는 일에서 끝나지 않는다는 점이다. `poll()` 호출 주기와 처리 속도는 `lag`의 변화와 컨슈머 그룹의 안정성에도 영향을 줄 수 있다.
그래서 `lag`가 급증했을 때 브로커의 성능만을 의심하는 것만으로는 충분하지 않다.
`poll()` 호출 간격이 길어지거나 fetch 응답 크기가 애플리케이션의 처리 속도와 맞지 않으면, 정상적인 코드에서도 리밸런싱이나 커밋 실패로 이어질 수 있다.
컨슈머 루프는 브로커의 데이터 공급 속도와 애플리케이션의 로직 처리 시간이 맞물리는 지점이기 때문이다.

그렇다고 `lag`가 크다는 사실만으로 곧바로 "컨슈머가 비정상적으로 느리다"고 단정하기는 어렵다.
일시적으로 생산량이 몰려 backlog가 쌓였을 수도 있고, 일부 파티션만 유독 느리게 밀리고 있을 수도 있다.
그래서 `lag`는 절대값 하나보다도 증가 속도, 회복 속도, 파티션별 편차를 함께 보는 편이 해석에 도움이 된다.

<br>

# poll과 fetch의 동작 차이

fetch는 `poll()` 처리 과정에서 내부적으로 수행되는 데이터 수신 단계다.
둘을 같은 뜻으로 쓰기 쉽지만 역할이 다르므로 튜닝 포인트도 분리해서 보는 편이 낫다.

## 애플리케이션이 직접 호출하는 것은 poll이다

애플리케이션은 `poll()`을 호출하지만, 컨슈머는 내부적으로 fetch 결과를 캐시에 미리 쌓아두고 이를 여러 번의 `poll()`에 나누어 반환할 수 있다.
즉, "poll 결과가 500건이라고 해서 브로커에서 500건만 가져왔다"고 단정할 수 없다.
컨슈머의 실제 데이터 수신량은 fetch 관련 설정에 의해 결정되며, `poll()`은 그중 일부를 애플리케이션 스레드로 전달하는 창구 역할을 한다.

```java
while (true) {
    // 내부 버퍼에 레코드가 있으면 즉시 반환, 없으면 fetch 요청 진행
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        handle(record); // 비즈니스 로직 처리
    }
}
```

## Kafka 내부 코드로 보면

이 동작은 Kafka 클라이언트 소스에서도 그대로 확인할 수 있다.
예를 들어 <a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/consumer/KafkaConsumer.java"
target="_blank" rel="nofollow">Apache Kafka 소스의 KafkaConsumer</a>를 보면, `poll()`은 공개 API 진입점 역할을 하고 실제 동작은 내부
`poll(...)` 흐름으로 이어진다.

```java
public ConsumerRecords<K, V> poll(final Duration timeout) {
    return poll(time.timer(timeout), true);
}
```

겉으로는 `poll()` 하나를 호출하는 것처럼 보이지만, 실제로는 이 호출을 기준으로 내부 버퍼 반환과 필요한 fetch 진행, 그룹 상태 반영 같은 흐름이 이어진다.
그래서 `poll()` 반환량과 실제 fetch 응답 크기를 같은 뜻으로 보면 관측이 자주 어긋난다.

같은 파일의 Javadoc에도 _"On each poll, consumer will try to use the last consumed offset as the starting offset and fetch sequentially"_ 라고 설명돼 있다.
즉, `poll()`은 단순 getter가 아니라 현재 위치를 기준으로 다음 데이터를 이어 읽는 진입점에 가깝다.

<br>

# fetch 응답 시점은 어떻게 달라질까

`fetch.min.bytes`와 `fetch.max.wait.ms`는 브로커가 fetch 요청에 응답하는 시점에 영향을 준다.
최소 데이터 크기를 지정하거나, 해당 크기가 모일 때까지 기다릴 수 있는 최대 시간을 설정하여 네트워크 오버헤드를 줄일 수 있다.

```java
// 최소 64KB가 쌓일 때까지 응답을 대기하여 네트워크 효율 제고
props.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, "65536");
// 단, 데이터가 부족하더라도 100ms가 지나면 즉시 응답
props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, "100");
```

데이터가 조금만 있어도 즉시 응답받고 싶다면 기본값인 `fetch.min.bytes=1`을 유지한다.
반대로 처리량(Throughput)이 중요한 대규모 배치 작업이라면 이 값을 높여 네트워크 요청 횟수를 줄이는 것이 브로커와 클라이언트 모두의 CPU 부담을 낮추는 데 도움이 될 수 있다.

<br>

# fetch 크기 제한과 poll 반환량의 관계

fetch 관련 설정들은 서로 계층적인 제약을 형성한다. 파티션별 최대량, 요청 전체 상한, 그리고 애플리케이션에 전달할 레코드 수를 각각 세밀하게 조절해야 한다.

## 브로커가 가져오는 양

```java
// 파티션당 최대 fetch 크기 (2MB)
props.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG, "2097152");
// 한 번의 fetch 요청 전체 상한 (20MB)
props.put(ConsumerConfig.FETCH_MAX_BYTES_CONFIG, "20971520");
// poll 한 번에 반환할 최대 레코드 수 (300개)
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "300");
```

`max.partition.fetch.bytes`와 `fetch.max.bytes`는 브로커에서 한 번에 가져올 수 있는 데이터 상한을 정한다.
예를 들어 `fetch.max.bytes`를 20MB로 두면, 컨슈머는 내부 버퍼에 비교적 큰 fetch 응답을 받아 놓고도 애플리케이션에는 나눠서 전달할 수 있다.

## 애플리케이션에 넘기는 양

`max.poll.records`가 작다고 해서 브로커로부터 수신하는 데이터양 자체가 줄어드는 것은 아니다.
이는 단지 애플리케이션 로직으로 넘어가는 '한 입의 크기'를 줄여 `max.poll.interval.ms` 이내에 처리를 완료할 수 있도록 돕는 장치다.
실제 수신량은 `fetch.max.bytes`에 의해 결정되며, 초과된 데이터는 컨슈머 내부 버퍼에 대기하게 된다.

운영 중 처리 로직이 무거워 `poll()` 간격이 쉽게 늘어난다면, 먼저 `max.poll.records`를 줄여 애플리케이션이 한 번에 받아 처리하는 양을 낮춰 보는 경우가 많다.
다만 이 설정은 fetch 자체를 줄이는 장치가 아니라, 이미 받아 둔 데이터를 애플리케이션에 얼마나 나눠서 넘길지를 조절하는 장치에 가깝다.

<br>

# 하트비트(Heartbeat)와 poll 주기가 보는 것

`session.timeout.ms`와 `max.poll.interval.ms`는 컨슈머의 건강 상태를 체크하는 서로 다른 기준이다.
classic consumer 기준으로 하트비트(Heartbeat)는 백그라운드 스레드에서 전송되지만, 실제 로직이 살아있는지는 `poll()` 호출 주기로 판단한다.

```java
// 하트비트 중단 판단 기준 (10초)
props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "10000");
// poll() 호출 간격 최대 허용치 (5분)
props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, "300000");
```

## 하트비트(Heartbeat)로 확인하는 것

`session.timeout.ms`는 "이 컨슈머가 아직 그룹 멤버로 살아 있는가"를 보는 기준에 가깝다.
하트비트가 끊기면 브로커는 이 컨슈머를 그룹의 활성 멤버로 계속 유지하지 않는다.

## poll 주기로 확인하는 것

`max.poll.interval.ms`는 "애플리케이션이 계속 일을 하고 있는가"를 보는 기준에 가깝다.
예를 들어 `max.poll.interval.ms=5분`인데 한 번 받은 레코드를 처리하는 데 6분이 걸리면, 하트비트가 정상이어도 클라이언트는 스스로 그룹에서 이탈(Leave Group)한다.
이후 뒤늦게 시도하는 오프셋 커밋은 `CommitFailedException`을 발생시킬 수 있다. 이는 이미 파티션 소유권이 다른 멤버로 넘어간 뒤의 커밋 시도를 차단하여 데이터 일관성을 지키기 위한 동작이다.

<br>

# 처리 스레드 분리와 pause/resume 전략

단일 루프 내에서 처리 시간이 긴 작업을 수행하면 그룹 안정성이 떨어지기 쉽다.
KafkaConsumer Javadoc은 처리 로직을 별도 워커 스레드로 넘기고, 컨슈머 스레드는 `poll()`을 지속적으로 호출하는 구조를 하나의 패턴으로 보여 준다.

<a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/consumer/KafkaConsumer.java#L466-L468"
target="_blank" rel="nofollow">Apache Kafka 소스의 KafkaConsumer Javadoc</a>에는
_"The Kafka consumer is NOT thread-safe. All network I/O happens in the thread of the application making the call."_
이라는 설명도 있다. 즉, 컨슈머 인스턴스 자체를 여러 스레드가 함께 건드리기보다, 컨슈머 스레드는 poll 루프를 유지하고 처리만 다른 스레드로 넘기는 쪽이 안전하다.

실제로 같은 소스의 멀티스레드 처리 예시도 아래처럼 `poll()`을 계속 호출하는 루프를 보여 준다.

```java
while (!closed.get()) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(10000));
    // Handle new records
}
```

여기서 강조점은 "다른 스레드에서 오래 처리하더라도, 컨슈머 스레드 자체는 계속 poll 루프를 돌게 만든다"는 것이다.
그래야 이 컨슈머가 그룹의 활성 멤버 상태를 유지하고, 맡고 있던 파티션 소유권도 잃지 않은 채 처리 로직과 소비 루프를 분리할 수 있다.

예를 들어 워커 스레드가 아직 처리 중인데 리밸런스가 먼저 일어나 파티션 소유권이 다른 컨슈머로 넘어갈 수 있다.
이 상태에서 뒤늦게 기존 컨슈머가 커밋을 시도하면 이미 처리한 레코드가 다시 읽히거나, 반대로 처리되지 않은 레코드가 건너뛰어진 것처럼 보일 수 있다.
그래서 별도 스레드 패턴에서는 "누가 아직 이 파티션을 소유하고 있는가", "어디까지 실제 처리됐는가", "어느 시점의 오프셋을 커밋할 수 있는가"를 함께 관리해야 한다.

구현 흐름은 아래처럼 잡을 수 있다.

> **구현 시 주의할 점:** 별도 스레드 사용 시 리밸런스 상황에서 처리 중인 작업을 중단하거나 커밋 경계를 관리하지 않으면 데이터 중복이나 처리 누락이 발생할 수 있다.

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(200));
    for (TopicPartition partition : records.partitions()) {
        // 처리 중인 파티션은 잠시 중단하여 추가 전달을 늦춤
        consumer.pause(Set.of(partition));
        workerPool.submit(() -> {
            try {
                process(records.records(partition));
                completedOffsets.put(partition, lastOffset + 1);
            } finally {
                // 처리 완료 후 다시 재개
                pendingResumePartitions.add(partition);
            }
        });
    }
}
```

이 패턴에서 먼저 볼 점은 다음과 같다.
- 컨슈머 스레드는 짧은 주기로 `poll()`을 호출해 그룹의 활성 멤버 상태를 유지한다.
- `pause()`는 워커가 처리 중인 파티션에 대해 추가 반환과 새 fetch 진행을 늦추는 데 쓰인다.
- `resume()`과 오프셋 커밋은 실제 처리가 끝난 뒤에만 수행해, 커밋이 처리보다 앞서가지 않도록 관리한다.

다만 `pause()`가 이미 내부 버퍼에 들어온 레코드까지 없애 주는 것은 아니다.
그래서 이 패턴만으로 모든 순서 문제나 중복 가능성이 사라지는 것은 아니며, 실제 구현에서는 버퍼 상태와 커밋 시점을 함께 관리해야 한다.

## 리밸런스 시점에는 무엇을 더 봐야 할까

`ConsumerRebalanceListener`는 리밸런스가 일어날 때 파티션이 회수(revoke)되거나 다시 할당(assign)되는 시점을 콜백으로 알려 주는 인터페이스다.
또 여기서 말하는 in-flight 작업은 이미 워커 스레드로 넘겼지만 아직 처리 완료나 커밋 여부가 확정되지 않은 작업을 뜻한다.

실제 구현에서는 이 리스너를 함께 두고, 리밸런스 직전에 어떤 파티션이 회수되는지 먼저 감지하는 편이 안전하다.
이 시점에 아직 끝나지 않은 in-flight 작업을 어떻게 정리할지 결정하고, 이미 처리 완료된 오프셋만 어디까지 커밋할 수 있는지도 따로 판단해야 한다.
그렇지 않으면 파티션 소유권이 넘어간 뒤에 이전 컨슈머가 뒤늦게 커밋하거나 `resume()`을 시도하는 식의 어색한 상태가 생길 수 있다.

<br>

# 병목을 볼 때 먼저 나눠서 볼 것

컨슈머 성능 저하의 원인을 파악하기 위해서는 네트워크 응답, 메시지 크기, 처리 시간, 그룹 유지 상태를 각각 분리하여 관측해야 한다.

| 점검 항목         | 주요 설정                                          | 관측 지표                      |
|---------------|------------------------------------------------|----------------------------|
| 잦은 소량 네트워크 요청 | `fetch.min.bytes`, `fetch.max.wait.ms`         | Fetch Request Rate, 응답 크기  |
| 거대 메시지 처리 지연  | `max.partition.fetch.bytes`, `fetch.max.bytes` | Fetch Size, Deserialize 시간, 처리 지연 |
| 배치 처리 속도 저하   | `max.poll.records`, 로직 처리 시간                   | Poll Interval, 처리 시간, CPU 사용률     |
| 빈번한 그룹 이탈     | `max.poll.interval.ms`, `session.timeout.ms`   | Rebalance Count, 커밋 실패 로그  |

운영 중 `lag`가 커지면 파티션 증설을 먼저 고려하기 쉽지만, fetch 응답이 지나치게 작거나 처리 스레드에서 외부 I/O 대기가 길어지는 등 내부적인 병목이 있는지 먼저 확인하는 편이 효율적일 때가 많다.

<br>

# 관측을 통한 병목 진단

컨슈머의 상태는 코드만으로 파악하기 어렵다. 처리 시간, fetch 응답 크기, 커밋 지연 등을 종합적으로 모니터링해야 한다.

## 로그에서 먼저 볼 것

성공 로그에는 단순히 "성공"만 남기지 말고 처리 시간과 위치 정보를 함께 기록한다.
```java
log.info("consume success. partition={}, offset={}, elapsed={}ms",
    record.partition(), record.offset(), System.currentTimeMillis() - start);
```

## 메트릭으로 구분해 볼 것

특정 파티션만 느리다면 데이터 쏠림(Hot Key)을 의심하고, 모든 파티션이 동시에 느려진다면 외부 API 지연이나 DB 경합, GC 부하를 먼저 검토해야 한다.
`records-lag-max` 지표와 `fetch-size-avg`를 함께 분석하여 데이터 수급 문제인지 처리 로직 문제인지를 명확히 구분하는 것이 튜닝의 시작이다.

이때는 전체 평균보다 파티션별 편차를 먼저 보는 편이 도움이 된다.
모든 파티션이 함께 느려진다면 공통 의존성이나 처리 경로를 의심할 수 있고, 일부 파티션만 유독 밀린다면 hot key나 데이터 편중 가능성을 먼저 점검해볼 수 있다.

<br>

# 참고

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/consumer-configs/"
  target="_blank" rel="nofollow">Apache Kafka Consumer Configs</a>
