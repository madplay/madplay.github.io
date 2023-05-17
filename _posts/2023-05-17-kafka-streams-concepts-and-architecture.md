---
layout: post
title: "Kafka Streams 개념과 아키텍처"
author: madplay
tags: kafka streams topology task state-store
description: "Consumer/Producer API 직접 조합과 Kafka Streams의 차이를 비교하고, Topology, Task, State Store 등 핵심 아키텍처를 코드로 풀어본다."
category: Backend
date: "2023-05-17 15:07:22"
comments: true
---

# Kafka Streams 시리즈 목차
- **1. Kafka Streams 개념과 아키텍처**
- <a href="/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream과 KTable</a>
- <a href="/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams 윈도우와 조인</a>
- <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams 에러 처리와 복구 전략</a>

<br>

# Kafka Streams란

Kafka를 사용하는 서비스에서 "토픽 A의 메시지를 읽고, 변환해서, 토픽 B로 보낸다"는 패턴은 매우 흔하다.
이 작업을 Consumer와 Producer를 직접 조합해서 구현해 본 경험이 있다면, 오프셋 관리, 상태 저장, 장애 복구, 스레드 관리를 직접 짜야 하는 번거로움을 느꼈을 것이다.

Kafka Streams는 이런 스트림 처리를 위해 Kafka가 자체적으로 제공하는 클라이언트 라이브러리다. 스트림 처리란 끝없이 들어오는 데이터를 실시간으로 변환하거나 집계하는 처리 방식을 말한다.
별도의 클러스터나 인프라 없이, 일반 Java 애플리케이션에 의존성을 추가하는 것만으로 사용할 수 있다.

<br>

# Kafka Streams 의존성 추가

Maven이나 Gradle에 의존성을 추가하면 바로 사용할 수 있다.
Kafka 3.4.x 기준 의존성은 다음과 같다.

```xml
<!-- Maven -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams</artifactId>
    <version>3.4.0</version>
</dependency>
```

```groovy
// Gradle
implementation 'org.apache.kafka:kafka-streams:3.4.0'
```

참고로, Spring Boot 환경에서는 `spring-kafka`가 `kafka-streams`를 전이 의존성으로 포함하는 경우가 있지만, 버전에 따라 다를 수 있으므로 Streams API를 사용한다면 `kafka-streams` 의존성을 명시적으로 추가하는 편이 안전하다.

<br>

# Consumer/Producer API 직접 사용과 무엇이 다른가

Kafka Streams를 이해하려면 먼저 "Consumer + Producer를 직접 조합하는 방식"과 비교해 보는 것이 효과적이다.

아래는 토픽에서 주문 이벤트를 읽고, 금액이 10,000원 이상인 것만 필터링해서 다른 토픽에 보내는 코드다.
먼저 Consumer/Producer를 직접 쓰는 버전이다.

```java
Properties consumerProps = new Properties();
consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "order-filter-group");
consumerProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
    StringDeserializer.class.getName());
consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
    StringDeserializer.class.getName());

Properties producerProps = new Properties();
producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProps);
KafkaProducer<String, String> producer = new KafkaProducer<>(producerProps);
consumer.subscribe(List.of("order-events"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        OrderEvent event = parseJson(record.value());
        if (event.getAmount() >= 10000) {
            producer.send(new ProducerRecord<>("high-value-orders", record.key(), record.value()));
        }
    }
    consumer.commitSync();
}
```

같은 로직을 Kafka Streams DSL로 작성하면 이렇게 된다.

```java
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-filter-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

StreamsBuilder builder = new StreamsBuilder();

builder.<String, String>stream("order-events")
    .filter((key, value) -> {
        OrderEvent event = parseJson(value);
        return event.getAmount() >= 10000;
    })
    .to("high-value-orders");

KafkaStreams streams = new KafkaStreams(builder.build(), props);
streams.start();
```

코드 양이 줄어든 것도 눈에 띄지만, 더 중요한 차이는 **직접 관리해야 하는 것의 범위**다.

Consumer/Producer API를 직접 사용하면 오프셋 커밋, 스레드 관리, 장애 시 재시작 로직, 상태를 유지해야 할 경우 별도 저장소 관리까지 개발자가 직접 구현해야 한다.
Kafka Streams는 이것들을 라이브러리 내부에서 처리한다. `APPLICATION_ID_CONFIG`가 컨슈머 그룹 ID 역할을 겸하고, 오프셋 커밋과 리밸런싱 처리가 자동으로 이루어진다.

그렇다면 Kafka Streams가 항상 더 나은 선택일까? 그렇지 않다. 두 방식의 장단점을 비교해 보자.

## Consumer/Producer API 직접 사용

- 로직이 단순한 경우(읽고 → 약간 변환 → 쓰기) 가볍게 구현할 수 있다.
- 여러 Kafka 클러스터에 동시에 쓰거나, Kafka 외의 외부 시스템(DB, REST API 등)과 직접 상호작용하는 패턴에 적합하다.
- 상태 관리, 장애 복구, Exactly-once(메시지가 정확히 한 번만 처리되는 것을 보장하는 의미론) 같은 보장을 직접 구현해야 하므로 로직이 복잡해질수록 코드량이 빠르게 늘어난다.

## Kafka Streams

- 상태 관리(State Store), Exactly-once 처리, 파티션 기반 병렬화, 장애 복구를 라이브러리가 처리한다.
- 집계(aggregation), 조인(join), 윈도우(windowing) 같은 연산을 DSL로 선언적으로 표현할 수 있다.
- 핵심 입출력은 Kafka 토픽 중심이며, `foreach`나 Processor API를 통해 외부 시스템 호출도 가능하지만 처리 보장/성능/복잡도 측면에서 신중해야 한다.
- 별도 클러스터 없이 일반 Java 애플리케이션으로 배포할 수 있어 운영 인프라가 단순하다.

정리하면, "Kafka 토픽에서 읽고, 변환/집계/조인한 뒤, Kafka 토픽에 쓴다"는 패턴이 주 흐름이라면 Kafka Streams가 유리하고, 외부 시스템 연동이 주된 목적이거나 단순한 메시지 전달이라면 Consumer/Producer API 직접 사용이 더 간단할 수 있다.

<br>

# Topology: 프로세서 그래프

Kafka Streams의 핵심 구조는 **Topology(토폴로지)**다.
토폴로지는 데이터가 흘러가는 방향 그래프(DAG)로, 각 노드가 프로세서(Processor), 간선이 데이터 흐름을 나타낸다.
세 종류의 프로세서가 순서대로 연결된다.

- **Source Processor**: 입력 토픽에서 레코드를 읽어 하위 프로세서로 전달한다.
- **Stream Processor**: 실제 데이터 변환, 필터링, 집계 등을 수행한다. 하나 이상 연결할 수 있다.
- **Sink Processor**: 처리 결과를 출력 토픽에 기록한다.

앞서 작성한 `StreamsBuilder` 코드가 빌드되면 내부적으로 이 토폴로지가 만들어진다.
`builder.build()`의 결과인 `Topology` 객체에서 `describe()`를 호출하면 실제 구조를 텍스트로 확인할 수 있다.

```java
Topology topology = builder.build();
System.out.println(topology.describe());
```

```text
Topologies:
   Sub-topology: 0
    Source: KSTREAM-SOURCE-0000000000 (topics: [order-events])
      --> KSTREAM-FILTER-0000000001
    Processor: KSTREAM-FILTER-0000000001 (stores: [])
      --> KSTREAM-SINK-0000000002
      <-- KSTREAM-SOURCE-0000000000
    Sink: KSTREAM-SINK-0000000002 (topic: high-value-orders)
      <-- KSTREAM-FILTER-0000000001
```

토폴로지의 구조를 이해하면 디버깅이 훨씬 수월해진다. 어떤 프로세서에서 데이터가 어디로 흘러가는지, 어떤 State Store에 접근하는지를 한눈에 파악할 수 있기 때문이다.

<br>

# 파티션 기반 병렬 처리와 Task

Kafka Streams의 병렬 처리 단위는 **Task(태스크)**다.
입력 토픽의 파티션 수에 따라 태스크 수가 결정되고, 각 태스크는 토폴로지의 독립적인 인스턴스를 갖는다.

예를 들어 입력 토픽 `order-events`의 파티션이 4개라면 태스크도 4개가 생긴다.
단일 입력 토픽에서는 태스크와 파티션이 1:1로 대응되지만, 다중 입력 토픽이 co-partitioning되어 있으면 하나의 태스크가 여러 소스 토픽의 같은 파티션 번호 세트를 처리한다. 어느 경우든 태스크 간에 데이터가 공유되지 않는다.
태스크마다 토폴로지의 전체 프로세서 체인(Source, Filter, Sink 등)이 독립적으로 동작한다.

이 4개의 태스크가 몇 개의 스레드에서 실행되는지는 `num.stream.threads` 설정으로 제어한다.

```java
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 2);
```

스레드가 2개이면 각 스레드가 태스크 2개씩을 담당한다. 다만 리밸런싱 상황에 따라 스레드별 태스크 수가 정확히 균등하지 않을 수도 있다.
같은 `APPLICATION_ID`를 가진 인스턴스를 여러 개 띄우면, Kafka의 컨슈머 그룹 프로토콜에 따라 태스크가 인스턴스 간에 분배된다.
인스턴스 2개 × 스레드 2개 = 스레드 4개이므로, 태스크 4개가 각 스레드에 하나씩 할당된다.

태스크와 파티션의 매핑은 한 번 정해지면 리밸런싱이 발생하기 전까지 변하지 않는다. 이 고정 매핑 덕분에 각 태스크는 자신만의 State Store를 안전하게 유지할 수 있다.

<br>

# State Store와 changelog 토픽

필터링이나 단순 변환은 상태가 필요 없지만, 집계(count, sum)나 조인은 이전 데이터를 기억해야 한다.
Kafka Streams는 이를 위해 **State Store(상태 저장소)**를 제공한다. 기본적으로 RocksDB 기반의 로컬 디스크 저장소이며, 각 태스크가 자신만의 State Store 인스턴스를 갖는다.

만약 태스크가 실행되던 인스턴스가 장애로 내려가면 어떻게 될까?
Kafka Streams는 State Store의 변경 사항을 **changelog 토픽**이라는 내부 토픽에 함께 기록해 둔다. 새로운 인스턴스에 태스크가 재할당되면 changelog 토픽을 다시 읽어 State Store를 복원한다.
State Store 복구와 관련된 운영 설정은 <a href="/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">Kafka Streams 에러 처리와 복구 전략</a>에서 다룬다.

State Store를 사용하는 간단한 예시는 시리즈 다음 글에서 KTable과 함께 다룬다.

<br>

# 첫 애플리케이션: WordCount

Kafka Streams의 "Hello World" 격인 WordCount 예제를 만들어 보자.
입력 토픽의 텍스트를 단어별로 쪼개서 각 단어의 출현 횟수를 집계하고, 결과를 출력 토픽에 기록한다.
집계 결과는 단어별 최신 카운트를 유지하는 `KTable`로 표현된다.

```java
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.Produced;

import java.util.Arrays;
import java.util.Properties;

public class WordCountApp {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "wordcount-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();

        // 입력 토픽에서 텍스트 라인을 읽는다
        KStream<String, String> textLines = builder.stream("text-input");

        KTable<String, Long> wordCounts = textLines
            .flatMapValues(line ->
                Arrays.asList(line.toLowerCase().split("\\W+")))  // 단어 단위로 분리
            .groupBy((key, word) -> word)  // 단어를 key로 재그룹화
            .count();

        // 집계 결과를 출력 토픽에 기록
        wordCounts.toStream().to("word-count-output",
            Produced.with(Serdes.String(), Serdes.Long()));

        KafkaStreams streams = new KafkaStreams(builder.build(), props);

        // 애플리케이션 종료 시 리소스 정리
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));

        streams.start();
    }
}
```

이 코드에서 일어나는 일을 단계별로 살펴보면 다음과 같다.

1. `text-input` 토픽에서 텍스트 라인을 읽는다. (Source Processor)
2. `flatMapValues`로 각 라인을 단어 단위로 분리한다. (Stateless 연산)
3. `groupBy`로 단어를 key로 묶고, `count()`로 출현 횟수를 집계한다. (Stateful 연산 → State Store 사용)
4. 집계 결과를 `word-count-output` 토픽에 쓴다. (Sink Processor)

`count()`는 내부적으로 State Store를 생성하고, 단어별 카운트를 유지한다.
새로운 레코드가 들어올 때마다 해당 단어의 카운트를 갱신하고, changelog 토픽에도 기록한다.

실행하기 전에 입력/출력 토픽을 먼저 생성해야 한다.

```bash
# 입력 토픽 생성
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic text-input --partitions 2 --replication-factor 1

# 출력 토픽 생성
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic word-count-output --partitions 2 --replication-factor 1
```

콘솔 프로듀서로 텍스트를 입력하고, 콘솔 컨슈머로 결과를 확인할 수 있다.

```bash
# 입력
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic text-input
> hello kafka streams
> kafka streams hello

# 출력 확인
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic word-count-output \
  --from-beginning \
  --property print.key=true \
  --property key.deserializer=org.apache.kafka.common.serialization.StringDeserializer \
  --property value.deserializer=org.apache.kafka.common.serialization.LongDeserializer
```

```text
hello    1
kafka    1
streams  1
kafka    2
streams  2
hello    2
```

같은 단어가 여러 번 출력되는 것은 KTable의 특성 때문이다. 단어의 카운트가 갱신될 때마다 새로운 레코드가 출력 토픽에 기록된다.
KTable의 동작 방식은 시리즈 2편에서 KStream과 비교하며 자세히 설명한다.

<br>

# Streams DSL vs Processor API

Kafka Streams는 두 가지 API 레벨을 제공한다.

**Streams DSL**은 `KStream`, `KTable`, `GlobalKTable` 같은 추상화 위에 `filter`, `map`, `groupBy`, `join` 등의 선언적 연산을 제공하는 고수준 API다.
대부분의 스트림 처리 로직은 DSL만으로 충분히 표현할 수 있고, 코드가 간결해서 유지보수가 편하다.

**Processor API**는 `Processor` 인터페이스를 직접 구현하고, State Store에 대한 접근을 코드로 제어하는 저수준 API다.

같은 필터링 로직을 Processor API로 작성하면 다음과 같다.

```java
import org.apache.kafka.streams.processor.api.Processor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;

public class HighValueOrderProcessor
    implements Processor<String, String, String, String> {

    private ProcessorContext<String, String> context;

    @Override
    public void init(ProcessorContext<String, String> context) {
        this.context = context;
    }

    @Override
    public void process(Record<String, String> record) {
        OrderEvent event = parseJson(record.value());
        if (event.getAmount() >= 10000) {
            context.forward(record);
        }
    }

    @Override
    public void close() {
        // 리소스 정리
    }
}
```

```java
Topology topology = new Topology();
topology.addSource("source", "order-events")
    .addProcessor("filter", HighValueOrderProcessor::new, "source")
    .addSink("sink", "high-value-orders", "filter");

KafkaStreams streams = new KafkaStreams(topology, props);
streams.start();
```

DSL의 `filter()` 한 줄이 Processor API에서는 클래스 하나와 토폴로지 연결 코드로 늘어난다.
대신 Processor API는 레코드 단위로 State Store 접근, 스케줄링(`punctuate`), 하위 프로세서 선택적 전달 등 DSL이 추상화해 버린 세밀한 제어가 가능하다.

어떤 것을 선택할지는 요구사항에 달려 있다.
DSL의 내장 연산으로 표현할 수 있는 로직이라면 DSL을 사용하는 것이 코드량과 유지보수 측면에서 유리하다.
DSL로 표현하기 어려운 커스텀 상태 관리나 조건부 라우팅이 필요한 경우에 Processor API를 고려하면 된다.
두 API를 하나의 토폴로지에서 섞어 쓸 수도 있으므로, 반드시 하나만 선택해야 하는 것은 아니다.

<br>

# 다음 글에서 다룰 내용

이 글에서는 Kafka Streams의 기본 개념과 Topology, Task, State Store 등 핵심 아키텍처를 다뤘다.
다음 글에서는 KStream과 KTable이 같은 토픽을 어떻게 다르게 해석하는지, 그리고 Stateless/Stateful 연산과 조인을 코드와 함께 다룬다.

- <a href="/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">다음 글: Kafka Streams KStream과 KTable</a>

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation/streams/architecture" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Streams Architecture</a>
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/write-streams" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Writing a Streams Application</a>
- <a href="https://kafka.apache.org/34/documentation/streams/" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Kafka Streams</a>
