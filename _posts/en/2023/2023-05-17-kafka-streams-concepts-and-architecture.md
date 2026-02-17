---
layout: post
title: "Kafka Streams Concepts and Architecture"
author: madplay
tags: kafka streams topology task state-store
description: "Compares direct Consumer/Producer API composition with Kafka Streams and explains core architectural concepts such as Topology, Task, and State Store through code."
category: Backend
lang: en
slug: kafka-streams-concepts-and-architecture
permalink: /en/post/kafka-streams-concepts-and-architecture
date: "2023-05-17 15:07:22"
comments: true
---

# Kafka Streams Series
- **1. Kafka Streams Concepts and Architecture**
- <a href="/en/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream and KTable</a>
- <a href="/en/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams Windows and Joins</a>
- <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams Error Handling and Recovery Strategies</a>

<br>

# What is Kafka Streams?

In services that use Kafka, the pattern "read messages from topic A, transform them, and write them to topic B" is very common.
If you have implemented that pattern by composing a Consumer and a Producer directly, you have probably seen the extra work involved in offset management, state storage, recovery, and thread management.

Kafka Streams is the client library that Kafka provides for this kind of stream processing. Stream processing means transforming or aggregating continuously arriving data in real time.
It does not require a separate cluster or infrastructure. Adding a dependency to a regular Java application is enough.

<br>

# Adding the Kafka Streams Dependency

Once the dependency is in Maven or Gradle, the application can start using Kafka Streams immediately.
For Kafka 3.4.x, the dependency looks like this.

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

In Spring Boot, `spring-kafka` can include `kafka-streams` as a transitive dependency depending on the version, but if the application uses the Streams API directly, declaring `kafka-streams` explicitly is the safer choice.

<br>

# How It Differs from Using the Consumer and Producer APIs Directly

The clearest way to understand Kafka Streams is to compare it with the "direct Consumer + Producer composition" approach.

The following example reads order events from one topic, filters out only orders whose amount is at least 10,000 won, and sends them to another topic.
The first version uses the Consumer and Producer APIs directly.

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

The same logic written with the Kafka Streams DSL looks like this.

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

The code is shorter, but the more important difference is **what the developer manages directly**.

With the Consumer and Producer APIs, the developer must implement offset commits, thread management, restart logic after failure, and storage management for stateful processing.
Kafka Streams handles those concerns inside the library. `APPLICATION_ID_CONFIG` also plays the role of a consumer group ID, and offset commits and rebalancing happen automatically.

Does that mean Kafka Streams is always the better choice? Not necessarily. Each approach has its trade-offs.

## Direct Consumer/Producer API Use

- Works well when the logic is simple, such as read -> light transform -> write.
- Fits patterns that write to multiple Kafka clusters at the same time or interact directly with external systems such as databases or REST APIs.
- As logic becomes more complex, the code grows quickly because state management, recovery, and guarantees such as exactly-once semantics must be implemented explicitly.

## Kafka Streams

- The library handles state management, exactly-once processing, partition-based parallelism, and recovery.
- Operations such as aggregation, join, and windowing can be expressed declaratively in the DSL.
- The primary input and output model is Kafka topics. External system calls are possible through `foreach` or the Processor API, but they require careful design in terms of guarantees, performance, and complexity.
- It runs as a regular Java application, so operations stay simple because no separate processing cluster is required.

In short, when the main flow is "read from Kafka, transform or aggregate or join, and write back to Kafka," Kafka Streams is usually the better fit. When the main job is external integration or basic message forwarding, direct use of the Consumer and Producer APIs can stay simpler.

<br>

# Topology: The Processor Graph

The core structure of Kafka Streams is the **Topology**.
A topology is a directed acyclic graph where nodes are processors and edges represent data flow.
It connects three kinds of processors in order.

- **Source Processor**: Reads records from an input topic and forwards them downstream.
- **Stream Processor**: Performs the actual transformation, filtering, or aggregation. One or more can be chained together.
- **Sink Processor**: Writes the result to an output topic.

When the earlier `StreamsBuilder` code is built, Kafka Streams constructs this topology internally.
Calling `describe()` on the `Topology` returned by `builder.build()` shows the actual structure.

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

Understanding topology structure makes debugging much easier because it shows which processor forwards data where and which State Store each processor uses.

<br>

# Partition-Based Parallelism and Tasks

The unit of parallelism in Kafka Streams is the **Task**.
The number of tasks is determined by the number of partitions in the input topic, and each task owns its own instance of the topology.

For example, if the input topic `order-events` has four partitions, Kafka Streams creates four tasks.
With a single input topic, tasks map one-to-one to partitions. When multiple input topics are co-partitioned, one task processes the same partition number across several source topics. In either case, tasks do not share data.
Each task runs the full processor chain in the topology independently.

The `num.stream.threads` setting controls how many threads execute those tasks.

```java
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 2);
```

If the application uses two threads, each thread handles two tasks. Rebalancing can still make the distribution uneven for a period of time.
If multiple instances with the same `APPLICATION_ID` run at the same time, Kafka distributes tasks across instances through the consumer group protocol.
With two instances and two threads per instance, four tasks are assigned across four threads.

Once the task-to-partition mapping is decided, it stays fixed until the next rebalance. That stable mapping lets each task keep its own State Store safely.

<br>

# State Store and Changelog Topics

Filtering or simple transformation does not require state, but aggregations such as `count` and `sum`, or joins, must remember previous data.
Kafka Streams provides a **State Store** for that purpose. By default, it is a local RocksDB-based disk store, and each task owns its own State Store instance.

What happens if the instance running the task fails?
Kafka Streams writes every State Store change into an internal topic called a **changelog topic**. When the task is reassigned to a new instance, Kafka Streams rebuilds the State Store by reading the changelog topic.
Operational settings for State Store recovery appear in <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">Kafka Streams Error Handling and Recovery Strategies</a>.

A simple example that uses a State Store appears in the next post of this series together with KTable.

<br>

# The First Application: WordCount

The "Hello World" example of Kafka Streams is WordCount.
It splits input text into words, aggregates the count of each word, and writes the result to an output topic.
The aggregation result is expressed as a `KTable` that keeps the latest count for each word.

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

        // Read text lines from the input topic
        KStream<String, String> textLines = builder.stream("text-input");

        KTable<String, Long> wordCounts = textLines
            .flatMapValues(line ->
                Arrays.asList(line.toLowerCase().split("\\W+")))  // Split into words
            .groupBy((key, word) -> word)  // Regroup by word
            .count();

        // Write the aggregation result to the output topic
        wordCounts.toStream().to("word-count-output",
            Produced.with(Serdes.String(), Serdes.Long()));

        KafkaStreams streams = new KafkaStreams(builder.build(), props);

        // Clean up resources when the application shuts down
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));

        streams.start();
    }
}
```

This code works in the following order.

1. Read text lines from the `text-input` topic. (Source Processor)
2. Split each line into words with `flatMapValues`. (Stateless operation)
3. Group by word with `groupBy` and aggregate occurrences with `count()`. (Stateful operation -> uses a State Store)
4. Write the aggregation result to the `word-count-output` topic. (Sink Processor)

`count()` creates a State Store internally and maintains the count for each word.
Whenever a new record arrives, Kafka Streams updates the count for that word and writes the change to the changelog topic as well.

The input and output topics must exist before the application starts.

```bash
# Create the input topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic text-input --partitions 2 --replication-factor 1

# Create the output topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic word-count-output --partitions 2 --replication-factor 1
```

You can type input through the console producer and inspect the result through the console consumer.

```bash
# Input
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic text-input
> hello kafka streams
> kafka streams hello

# Check the output
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

The same word appears multiple times because of how `KTable` works. Each time a word's count changes, Kafka Streams writes a new record to the output topic.
The next post explains KTable behavior in more detail by comparing it with KStream.

<br>

# Streams DSL vs. Processor API

Kafka Streams exposes two API levels.

**Streams DSL** is the higher-level API. It offers declarative operations such as `filter`, `map`, `groupBy`, and `join` over abstractions such as `KStream`, `KTable`, and `GlobalKTable`.
For most stream processing logic, the DSL is expressive enough and easier to maintain because the code stays concise.

**Processor API** is the lower-level API. It lets the developer implement the `Processor` interface directly and control access to State Stores in code.

The same filtering logic written with the Processor API looks like this.

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
        // Clean up resources
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

What is one line of `filter()` in the DSL becomes an extra class plus topology wiring in the Processor API.
In exchange, the Processor API supports finer control that the DSL abstracts away, such as record-level State Store access, scheduling with `punctuate`, and selective forwarding to downstream processors.

The choice depends on the requirement.
If the logic fits the DSL's built-in operations, the DSL is usually better for code size and maintainability.
If the application needs custom state management or conditional routing that is difficult to express in the DSL, the Processor API becomes a good option.
The two APIs can also coexist in the same topology, so the application does not have to choose one exclusively.

<br>

# Up Next

This post covered the core Kafka Streams concepts and architecture, including Topology, Task, and State Store.
The next post explains how KStream and KTable interpret the same topic differently, then walks through stateless and stateful operations and joins with code.

- <a href="/en/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">Next post: Kafka Streams KStream and KTable</a>

<br>

# References
- <a href="https://kafka.apache.org/34/documentation/streams/architecture" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Streams Architecture</a>
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/write-streams" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Writing a Streams Application</a>
- <a href="https://kafka.apache.org/34/documentation/streams/" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Kafka Streams</a>
