---
layout: post
title: "How Many Kafka Partitions Do You Need? Why More Consumers Do Not Always Increase Throughput"
author: madplay
tags: kafka topic partition consumer group
description: "How to size Kafka partitions: throughput targets, ordering guarantees, and scaling pitfalls in production."
category: Backend
date: "2023-04-07 20:14:37"
comments: true
lang: en
slug: kafka-partition-and-consumer
permalink: /en/post/kafka-partition-and-consumer
---

# Why Throughput Does Not Always Improve When You Add Consumers
If the relationship between Kafka partitions and consumers is not defined early, adding instances often fails to deliver expected throughput.
Kafka parallelism is defined by partition structure, just as adding workers does not remove bottlenecks if a sorting line is not split into lanes.
Start by defining how topics, partitions, and consumer groups connect.

If you want baseline topic configuration first, see <a href="/en/post/kafka-topic-configurations" target="_blank">Kafka Topic Configuration Reference</a>.

<br>

# Role of Topics and Partitions
> Kafka guarantees ordering inside a partition, not global ordering across the entire topic.

A topic is a logical category of messages. A partition is the physical unit where messages are stored.
One topic is divided into multiple partitions, and each partition behaves like an `append-only` log.

`append-only` means records are not updated in the middle. New records are only appended at the end.
Records accumulate by `offset`, and consumers track how far they have read by offset.
Ordering is preserved within a single partition, but not globally across partitions.

```text
topic: order-events
- partition 0: offset 0, 1, 2, 3 ...
- partition 1: offset 0, 1, 2 ...
- partition 2: offset 0, 1 ...
```

Design around the ordering scope.
If your requirement is "the same orderId must always be processed in order," you need key-based partitioning.

<br>

# Consumer Groups and Parallel Processing
Within one consumer group, a partition is not assigned to multiple consumers at the same time.
This rule defines throughput planning.

- 6 partitions, 3 consumers: each consumer processes 2 partitions.
- 3 partitions, 6 consumers: 3 consumers remain idle.
- 6 partitions, 1 consumer: no parallelism; one instance handles all.

```java
@KafkaListener(topics = "order-events", groupId = "order-worker-group")
public void consume(ConsumerRecord<String, OrderEvent> record) {
    log.info("consume event. key={}, partition={}, offset={}, orderId={}",
        record.key(),
        record.partition(),
        record.offset(),
        record.value().getOrderId());

    orderEventService.handle(record.value());
}
```

In operational logs, keep at least `key`, `partition`, `offset`, and `orderId`.
They are essential for tracing a problematic message flow.

<br>

# Key-Based Partitioning and Ordering
When a key is provided, the default partitioner chooses a partition from the key hash.
The same key goes to the same partition, so ordering is preserved in that key range.

```java
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(OrderEvent event) {
        // Using orderId as key routes events to the same partition.
        String key = event.getOrderId();
        kafkaTemplate.send("order-events", key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("publish failed. topic=order-events, key={}, orderId={}", key, event.getOrderId(), ex);
                    return;
                }

                RecordMetadata metadata = result.getRecordMetadata();
                log.info("publish success. key={}, partition={}, offset={}",
                    key,
                    metadata.partition(),
                    metadata.offset());
            });
    }
}
```

There is a tradeoff.
If traffic is concentrated on specific keys, hot partitions emerge.
In that case, adding consumers does not help because the hottest partition defines the upper bound.

<br>

# Partition Sizing Criteria
> Partitions can be increased, but they cannot be directly reduced. Early sizing affects long-term operational cost.

More partitions improve parallelism and can increase throughput.
More partitions also increase file handles, metadata overhead, and rebalance cost.

A key constraint is that partition count can be increased but not directly decreased.
Leave headroom in the initial estimate, but avoid aggressive overprovisioning.

Typical sizing flow:

1. Estimate target throughput (for example, messages per second) and average message size.
2. Measure stable TPS per consumer instance.
3. Calculate partition count from required parallelism and add 10 to 30 percent headroom.

If one consumer handles 500 messages per second and the target is 2,000, you need at least 4 partitions.
To add deployment and failure headroom, starting with around 6 partitions and tuning with monitoring is common.

<br>

# Checklist Before Partition Expansion
> Right after expansion, identical keys can move to different partitions. Revalidate ordering assumptions.

Increasing partition count is not just changing a number. It changes the consumption topology.

1. Check whether the bottleneck is broker I/O or consumer logic.
2. Check whether key distribution is balanced (hot key detection).
3. Revalidate that ordering guarantees are defined at key scope.

```text
Common misconceptions before expansion
- Lag is high -> increasing partitions automatically fixes it (X)
- More partitions automatically balance keys (X)
- Existing ordering guarantees remain unchanged after expansion (X)
```

Two common operational risks:

- Expanding without key-distribution analysis leaves hot partitions in place.
- Changing partition count changes hash modulo behavior, so the same key can be routed to another partition.
  Include temporary ordering inconsistencies in your post-expansion operational scenario.

<br>

# Can You Reduce Partitions Again?
This is a frequent question in production.
Direct reduction of topic partition count is not supported.
You can increase it as shown below.

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic order-events --partitions 24
```

If reduction is required, migrate to a new topic.

1. Create a new topic with the target partition count.
2. Gradually switch producers and consumers to the new topic.
3. Move data if needed through a Connector or application-level republish.
4. Decommission the old topic after validation.

This is an operational procedure.
Define downtime tolerance and data consistency criteria first.

<br>

# Design Idempotency and Error Classification Together
Even with a good partition design, lack of duplicate protection can break consistency during incident recovery.
Rebalancing and retries can deliver the same message again.

```java
@Transactional
public void handle(OrderEvent event, ConsumerRecord<String, OrderEvent> record) {
    String dedupKey = event.getOrderId() + ":" + event.getEventType();

    try {
        processedEventRepository.save(new ProcessedEvent(dedupKey));
    } catch (DataIntegrityViolationException e) {
        log.info("duplicated event skipped. dedupKey={}, partition={}, offset={}",
            dedupKey, record.partition(), record.offset());
        return;
    }

    try {
        paymentClient.charge(event); // It is safer to set a timeout for external I/O.
    } catch (SocketTimeoutException timeoutException) {
        log.warn("transient failure. orderId={}, partition={}, offset={}",
            event.getOrderId(), record.partition(), record.offset(), timeoutException);
        throw timeoutException; // Delegate to retry path
    } catch (Exception permanentException) {
        log.error("permanent failure. orderId={}, partition={}, offset={}",
            event.getOrderId(), record.partition(), record.offset(), permanentException);
        throw permanentException;
    }
}
```

Separating transient failures (timeouts) from permanent failures (data issues) makes retry strategy explicit.
Rebalancing is unavoidable, but idempotency and clear error classification preserve outcome consistency.

<br>

# Summary
A topic is the logical unit of messages, a partition is the physical unit of throughput and ordering, and a consumer group creates parallelism by sharing partitions.

Three design points matter most.

- Clarify ordering scope through key design.
- Size partitions as a balance between throughput and operational cost.
- Assume duplicate delivery and implement idempotency with retry policy.

If consumer processing time exceeds `max.poll.interval.ms`, unwanted rebalancing can occur.
Review processing time, poll interval, and rebalance metrics together.

<br>

# References
- <a href="https://kafka.apache.org/documentation/#intro_topics" target="_blank" rel="nofollow">Apache Kafka Documentation - Topics and Logs</a>
- <a href="https://kafka.apache.org/documentation/#intro_consumers" target="_blank" rel="nofollow">Apache Kafka Documentation - Consumers</a>
- <a href="https://kafka.apache.org/documentation/#basic_ops_modify_topic" target="_blank" rel="nofollow">Apache Kafka Documentation - Modify Topics</a>
