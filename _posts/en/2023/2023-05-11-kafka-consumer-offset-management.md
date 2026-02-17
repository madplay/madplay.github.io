---
layout: post
title: "Kafka Consumer Offsets and Commit Strategies"
author: madplay
tags: kafka consumer offset commit auto-commit manual-commit
description: "Covers the internal structure of the __consumer_offsets topic, compares automatic and manual commit strategies, and reviews offset reset scenarios and consumer lag monitoring."
category: Backend
lang: en
slug: kafka-consumer-offset-management
permalink: /en/post/kafka-consumer-offset-management
date: "2023-05-11 20:11:45"
comments: true
---

# Offsets and the Consumer's Read Position

Without a bookmark that marks the last page you read, you would need to scan a book from the beginning every time you reopen it.
A Kafka consumer offset plays exactly that role. It records position information that says, "this consumer group has read this far in this partition of this topic."

If offset management is weak, messages can be processed twice or missed entirely.
This post looks at how Kafka stores offsets internally, how behavior changes with each commit strategy, and which tools help when a production system needs to reset offsets.

<br>

# The `__consumer_offsets` Topic

Offsets committed by Kafka consumers are stored in the internal topic named `__consumer_offsets`.
Kafka brokers create and manage this topic automatically, and by default it has 50 partitions.

The partition that stores a specific consumer group's offsets is determined by the following formula.

```text
partitionId = Math.abs(groupId.hashCode()) % offsetsTopicPartitionCount
```

The remainder of the consumer group's `groupId` hash divided by the partition count of `__consumer_offsets` (50 by default) determines the target partition.
The leader broker of that partition becomes the **Group Coordinator** for the consumer group. The group coordinator manages group membership and offset storage.

The key of a message stored in `__consumer_offsets` is the `[groupId, topic, partition]` combination, and the value contains the committed offset and metadata.

```text
Key:   [order-payment-group, order-events, 0]
Value: {offset: 12345, metadata: "", commitTimestamp: 1683705600000}
```

This topic uses `cleanup.policy=compact`, so Kafka keeps only the latest record for the same key.
That is why committing offsets millions of times does not make `__consumer_offsets` grow without bound.

Then when does a consumer decide to commit offsets?

<br>

# Automatic Commit vs. Manual Commit

Kafka consumers usually choose between automatic and manual offset commits.

## Automatic Commit

If `enable.auto.commit=true` is configured, which is the default, the consumer commits offsets automatically every `auto.commit.interval.ms` milliseconds (5 seconds by default) when it calls `poll()`.

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
        processOrder(record); // The commit can happen before this processing finishes
    }
}
```

The main risk of automatic commit is timing. At the moment `poll()` runs, Kafka automatically commits the result of the previous `poll()`. If record processing is still in progress, unprocessed messages can be marked as "read."
Conversely, if processing finishes but the consumer crashes before the next `poll()`, the same message is delivered again.

Automatic commit is convenient for pipelines such as log collection or statistical aggregation where occasional message loss is not critical.
In Spring Kafka, many services keep Kafka's own automatic commit disabled and use `AckMode.BATCH`, which is the default, instead. That part appears again later in this post.

## Manual Commit

In a plain Kafka client without Spring, manual commit is the usual choice when the application needs to control the commit point based on processing success.
After setting `enable.auto.commit=false`, the code calls `commitSync()` or `commitAsync()`.

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-payment-group");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
// ... omitted other settings

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("order-events"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        processOrder(record);
    }
    consumer.commitSync(); // Synchronous commit after processing all records
}
```

The main advantage of manual commit is that the code can guarantee "commit only after processing finishes."

<br>

# Synchronous Commit and Asynchronous Commit

Manual commit again splits into synchronous (`commitSync`) and asynchronous (`commitAsync`) variants.

`commitSync()` blocks until the broker returns the commit response. If the commit fails, it throws an exception, so the application can add retry logic.
The downside is that the consumer thread waits for the broker response, which can reduce throughput.

```java
try {
    consumer.commitSync();
} catch (CommitFailedException e) {
    log.error("commit failed. group={}", groupId, e);
}
```

`commitAsync()` does not wait for the broker response and immediately moves to the next step.
If a callback is registered, the application receives commit success or failure asynchronously.

```java
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) {
        log.warn("async commit failed. offsets={}", offsets, exception);
    }
});
```

There is one important detail about asynchronous commits: retry order can invert. If the request that commits offset 100 fails and retries while the commit for offset 200 succeeds first, that is fine. But if the retry for offset 100 succeeds afterward, the committed offset moves backward from 200 to 100.
For that reason, production systems often log failures for `commitAsync()` and then call `commitSync()` once during shutdown.

```java
try {
    while (true) {
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
        for (ConsumerRecord<String, String> record : records) {
            processOrder(record);
        }
        consumer.commitAsync(); // Use asynchronous commits during normal operation
    }
} finally {
    consumer.commitSync(); // Finalize the last offset with a synchronous commit on shutdown
    consumer.close();
}
```

<br>

# `AckMode` in Spring Kafka

When an application uses Spring Kafka, it rarely calls `commitSync()` or `commitAsync()` directly.
`KafkaMessageListenerContainer` manages commits according to `ContainerProperties.AckMode`.
In that setup, the usual approach is to disable Kafka client auto-commit and let the Spring container control commits.

Spring Kafka 3.0 provides the following main `AckMode` values.

- **RECORD**: Commits after the listener processes each record.
- **BATCH**: Commits once after all records fetched by `poll()` are processed. This is the default.
- **MANUAL**: When the listener calls `Acknowledgment.acknowledge()`, the container collects the marked offsets and commits them at an appropriate point.
- **MANUAL_IMMEDIATE**: Commits immediately when `acknowledge()` is called.

Other options such as `TIME`, `COUNT`, and `COUNT_TIME` also exist, but the four above cover most services.

The following code uses `MANUAL_IMMEDIATE`.

```java
@KafkaListener(topics = "order-events", groupId = "order-payment-group")
public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
    try {
        paymentService.process(record.value());
        ack.acknowledge(); // Commit immediately when AckMode is MANUAL_IMMEDIATE
    } catch (Exception e) {
        log.error("processing failed. key={}, partition={}, offset={}",
            record.key(), record.partition(), record.offset(), e);
        throw e; // Delegate to the error handler
    }
}
```

Immediate per-record commits increase broker load because commit requests become much more frequent.
In high-throughput services, teams often keep `BATCH` as the default and apply `MANUAL_IMMEDIATE` only to topics that require precise commit timing per message, such as payments or settlements.

<br>

# Offset Reset Scenarios

Production systems often need to reset offsets. The following scenarios appear frequently.

## When a New Consumer Group Subscribes to a Topic for the First Time

Because no committed offset exists yet, the starting position depends on `auto.offset.reset`.

```properties
# Read from the beginning of the topic
auto.offset.reset=earliest

# Read only messages produced after subscription time (default)
auto.offset.reset=latest
```

`earliest` fits cases where the application must process all historical data. `latest` fits cases where it only needs real-time messages.
This setting only applies when no committed offset exists. If a committed offset exists, the consumer resumes from that point.

## When a Committed Offset Expires

Offsets stored in `__consumer_offsets` also expire. If a consumer group remains inactive for the period defined by the broker setting `offsets.retention.minutes` (7 days by default since Kafka 2.0), Kafka deletes those offsets.
If the consumer reconnects after that deletion, `auto.offset.reset` applies again.

## Manual Reset from the CLI

When a team needs to move offsets backward for disaster recovery or data replay, it can use `kafka-consumer-groups.sh`.

```bash
# Reset to the beginning of the topic
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --to-earliest --execute

# Reset to after a specific date and time
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --to-datetime 2023-05-01T00:00:00.000 --execute

# Move 10 records forward from the current offset (skip ahead)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events \
  --reset-offsets --shift-by 10 --execute
```

Without the `--execute` flag, the command runs in dry-run mode and shows the result without changing anything.
In production, it is safer to run a dry-run first, verify the impact, and then execute the reset.

An offset reset is only possible when the consumer group is **inactive**, which means the number of active consumers is 0.
If a consumer is still running, Kafka returns an error.

<br>

# Commit Failures and Duplicate Processing

Commits can fail. Temporary network failures, group coordinator changes, rebalancing, and session expiration are common causes.
What happens after a commit failure?

Suppose the consumer processes up to offset 50 and attempts to commit, but that commit fails. If the consumer restarts in that state, it reads again from the last successful commit point, for example offset 30.
That means Kafka redelivers the messages from offsets 31 through 50.

```text
Last successful commit: offset 30
Actual processing done: offset 50
Restart after commit failure -> redeliver from offset 31
```

If the system is not idempotent, messages 31 through 50 are processed twice in that situation.
Kafka provides at-least-once delivery by default, so the consumer side must guarantee idempotency to prevent duplicates.

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

An idempotency key usually combines business identifiers such as order ID and event type.
Using a unique constraint in the database also helps prevent race conditions where the same message is processed concurrently.

<br>

# Offset Monitoring and Consumer Lag

Consumer lag is the gap between the latest message produced and the last message read by the consumer. More precisely, it is "the difference between the partition's log-end offset and the last offset committed by the consumer."
If lag keeps growing, consumer throughput is not keeping up with producer throughput.

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --describe
```

In this command's output, the `LAG` column shows lag for each partition.

```text
GROUP                 TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
order-payment-group   order-events   0          12340           12345           5
order-payment-group   order-events   1          8920            8920            0
order-payment-group   order-events   2          15670           15890           220
```

Partition 2 has a lag of 220, much higher than the others.
In that situation, it is worth checking whether the consumer instance that owns that partition has a bottleneck in its processing logic or frequent timeouts in external calls.

When monitoring lag, **trend** matters more than a single number.
If lag spikes briefly and then drops quickly, the system is usually healthy. If lag keeps increasing, the team should consider scaling the consumer group or optimizing the processing path.

If simple scripts are no longer enough, tools such as Burrow can monitor lag more systematically. Burrow is a Kafka consumer lag monitoring tool originally developed at LinkedIn, and it evaluates lag trends to classify the state as healthy, warning, or error.

<br>

# Common Offset-Related Settings in Production

The following settings are frequently reviewed in production.

```properties
# Enable or disable automatic commit (false for manual commit)
enable.auto.commit=false

# Automatic commit interval (when automatic commit is enabled)
auto.commit.interval.ms=5000

# Start position when no committed offset exists
auto.offset.reset=latest

# Consumer session timeout (heartbeat failure triggers rebalancing)
session.timeout.ms=45000

# Heartbeat interval (recommended to stay below one-third of session.timeout.ms)
heartbeat.interval.ms=15000

# Maximum interval between poll() calls (rebalancing happens when exceeded)
max.poll.interval.ms=300000

# Maximum number of records returned by a single poll()
max.poll.records=500
```

`max.poll.interval.ms` and `max.poll.records` directly affect offset commits.
If the consumer fetches too many records at once and processing exceeds `max.poll.interval.ms`, the broker marks the consumer as failed and triggers rebalancing.
Once rebalancing happens, uncommitted offsets are lost and duplicate processing follows.

The common response is to reduce `max.poll.records` to limit the amount of work per poll, or to put timeouts on external calls so processing finishes within `max.poll.interval.ms`.

<br>

# References
- <a href="https://kafka.apache.org/34/documentation/#consumerconfigs" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation - Consumer Configs</a>
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#committing-offsets" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Committing Offsets</a>
