---
layout: post
title: "Kafka Producer: How Safe and How Fast?"
author: madplay
tags: kafka producer acks idempotence transaction batch
description: "Walks through the Kafka producer send path, acks settings, batching and compression, the idempotent producer, and transactions with code."
category: Backend
lang: en
slug: kafka-producer-delivery-guarantee-and-tuning
permalink: /en/post/kafka-producer-delivery-guarantee-and-tuning
date: "2023-06-14 16:38:47"
comments: true
---

# Why Producer Settings Matter

If the system only sends access logs, losing one or two messages may not be critical. But events such as order creation or inventory deduction have a much higher cost when they are duplicated or lost.
Depending on domain requirements, the right combination of `acks`, retries, and idempotence changes, and that choice directly affects the trade-off between availability and performance.

<br>

# Producer Internals: `RecordAccumulator` and `Sender`

Calling `KafkaProducer.send()` does not immediately push the record over the network.
Internally, Kafka uses two stages, **RecordAccumulator** and **Sender**, to send data efficiently in batches.

1. When the application thread calls `send()`, the record is serialized, assigned to a partition, and appended to the `RecordAccumulator`.
2. `RecordAccumulator` keeps `ProducerBatch` instances per partition. When a batch condition such as `batch.size` or `linger.ms` is met, the Sender thread takes the batch.
3. The Sender thread sends the batch to the broker and waits for a response according to the `acks` setting.

`send()` is asynchronous and returns `Future<RecordMetadata>`.
If the application wants to inspect the result synchronously, it can call `send().get()`, but throughput can drop sharply, so callback-based asynchronous handling is more common.

```java
producer.send(
    new ProducerRecord<>("order-events", orderId, payload),
    (RecordMetadata metadata, Exception exception) -> {
        if (exception != null) {
            log.error("send failed. topic={}, key={}", "order-events", orderId, exception);
            return;
        }
        log.info("send success. topic={}, partition={}, offset={}",
            metadata.topic(), metadata.partition(), metadata.offset());
    }
);
```

The callback runs on the Sender thread. If it performs blocking work such as database writes or external API calls, the entire send pipeline can slow down.

<br>

# `acks` and `min.insync.replicas`

The `acks` setting defines what the producer considers a successful send.

## `acks=0`

The producer treats the send as successful immediately without waiting for a broker response.
This is the fastest option, but it also has the highest risk of data loss, and the `retries` setting becomes meaningless.
It is used only in narrow cases such as metrics transport where some loss is acceptable.

## `acks=1`

The leader broker responds with success as soon as it writes the message to its local log.
Because the producer does not wait for follower replication, a leader failure before replication can still lose data.

## `acks=all`

The leader behaves in the strictest mode and waits for the required replica acknowledgments.
But the real meaning of success still depends on the topic's current ISR state and its `min.insync.replicas` setting.

A common example is `replication.factor=3` with `min.insync.replicas=2`.
Detailed failure scenarios for that combination appear in <a href="/en/post/kafka-topic-configurations" target="_blank"
rel="nofollow">Kafka Topic Configuration Guide</a>.

<br>

# Optimizing Batch Efficiency and Send Latency

`batch.size` and `linger.ms` determine when data accumulated in `RecordAccumulator` is sent.

- `batch.size` (default 16 KB): send immediately when the batch buffer reaches this size.
- `linger.ms` (default 0 ms): start sending after this amount of time even if the batch is smaller than `batch.size`.

If `linger.ms` is larger than 0, the producer can collect more records before sending, which improves throughput but increases latency for individual messages.
In high-throughput environments, however, records accumulate fast enough that batching happens naturally even with `linger.ms=0`.

```java
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32768);     // 32 KB
props.put(ProducerConfig.LINGER_MS_CONFIG, 10);         // Wait 10 ms
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864); // 64 MB
```

`buffer.memory` is the total memory allocated for batching. If it runs out, `send()` can block for up to `max.block.ms`.

<br>

# Compression Strategy and Resource Efficiency

Batch compression is a practical way to reduce network bandwidth and improve broker disk efficiency at the same time.
Compression happens on the producer and stays in effect until the consumer decompresses the batch, which lowers infrastructure cost across the full pipeline.

| Type | Compression Ratio | CPU Cost | Characteristics |
|------|-------|---------|------|
| `gzip` | High | High | Best when bandwidth reduction matters most |
| `snappy` | Medium | Low | Protects CPU resources |
| `lz4` | Medium | Very low | Fits low-latency workloads |
| `zstd` | Very high | Medium | Balanced general-purpose choice |

Compression becomes more effective as batch size grows, so tuning it together with `linger.ms` is useful.
If the broker keeps `compression.type=producer`, it avoids an extra recompression step and saves CPU.
But when messages are very small and latency-sensitive, the compression overhead itself can dominate.

<br>

# Retry Strategy and Error Classification

When sends fail, Kafka performs automatic retries according to `retries`, but the total retry window is still bounded by `delivery.timeout.ms`.
The Kafka client automatically retries only transient exceptions that extend `RetriableException`, such as `NetworkException`.

```java
producer.send(record, (metadata, exception) -> {
    if (exception instanceof org.apache.kafka.common.errors.RetriableException) {
        log.warn("Automatic retry target due to a transient error");
    } else {
        log.error("Non-retryable exception: immediate fallback required", exception);
    }
});
```

If `max.in.flight.requests.per.connection` is greater than 1 during retries, send order can invert.
To prevent that and preserve sequential writes within one partition, the service should enable idempotence.

<br>

# Idempotent Producer and Duplicate Prevention

The idempotent producer prevents duplicate writes caused by retry scenarios such as network timeouts.
Kafka brokers use the PID, or Producer ID, issued at producer initialization together with the record's sequence number to decide whether the data has already been processed.

For idempotent sends to behave as intended, the following conditions are usually checked together.

- `acks=all`
- `retries` > 0
- `max.in.flight.requests.per.connection` <= 5

This feature only applies within a single producer session and a single partition.
If the producer restarts and receives a new PID, it cannot prevent duplicates across sessions. If broader guarantees are required, a transactional producer is the next step.

<br>

# Atomic Sends with Transactions

A transactional producer groups writes to multiple topics or partitions into one atomic unit so the application can treat the outcome as "all succeed" or "all fail."
This is one of the core pieces of Kafka's Exactly-Once Semantics.

```java
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "tx-id-01");
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("topic-A", key, val));
    producer.send(new ProducerRecord<>("topic-B", key, val));
    producer.commitTransaction();
} catch (org.apache.kafka.common.errors.ProducerFencedException
         | org.apache.kafka.common.errors.OutOfOrderSequenceException
         | org.apache.kafka.common.errors.AuthorizationException e) {
    producer.close();
} catch (org.apache.kafka.common.KafkaException e) {
    producer.abortTransaction();
}
```

Consumers that read transactional messages should use `isolation.level=read_committed` so they see only committed data.
Fatal exceptions can make the current producer unusable, so it is safer not to handle every exception with a blanket `abortTransaction()` pattern.
Because consumers do not see in-flight transactional data until commit, `transaction.timeout.ms` also needs to match business requirements.

<br>

# Recommended Producer Profiles by Operating Style

The table below shows common combinations based on latency tolerance and the importance of the data.

| Setting | Durability First | Throughput First |
|----------------------|------------|--------------------|
| `acks`               | `all`      | `1`                |
| `enable.idempotence` | `true`     | Consider explicit `false` |
| `batch.size`         | Default (16 KB) | 32 KB ~ 64 KB |
| `linger.ms`          | 0 ~ 5 ms   | 10 ms ~ 50 ms |
| `compression.type`   | `zstd`     | `lz4` |

`delivery.timeout.ms` sets the upper bound for the send budget. Once that time is exceeded, Kafka stops retrying and returns an exception to the application, so production incident handling needs enough time in that budget.

Starting with Kafka 3.x, the default for `enable.idempotence` changed to `true`.
In mixed-version environments, it is safer to verify the client version's actual default first.
Also, `acks=1` conflicts with the requirements for idempotence, so it cannot be combined with `enable.idempotence=true`.
If the service intentionally prefers a throughput-first profile, it is clearer to consider disabling idempotence explicitly rather than relying on defaults.

<br>

# References
- <a href="https://kafka.apache.org/34/documentation.html#producerconfigs"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - Producer Configs</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - KafkaProducer Javadoc</a>
- <a href="https://kafka.apache.org/34/documentation.html#semantics"
  target="_blank" rel="nofollow">Apache Kafka 3.4 - Message Delivery Semantics</a>
