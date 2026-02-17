---
layout: post
title: "Kafka Exactly-Once: Is It Really Processed Only Once?"
author: madplay
tags: kafka semantics exactly-once idempotence transaction consumer
description: "Examines the differences and limits of at-most-once, at-least-once, and exactly-once, and organizes where duplicates and data loss occur in Kafka."
category: Backend
lang: en
slug: kafka-message-delivery-guarantees
permalink: /en/post/kafka-message-delivery-guarantees
date: "2023-06-24 19:24:11"
comments: true
---

# Kafka Delivery Guarantees: at-most-once, at-least-once, exactly-once

When a system processes orders and payments as separate events, it is easy to encounter situations where the broker appears to store a record once but the actual result is applied twice.
That happens because the producer's success criteria and the consumer's commit point live at different layers.
Before tuning anything, it is necessary to understand the structure in which data loss or duplication can happen naturally depending on failure timing and retry strategy.

<br>

# Delivery Semantics and Failure Points

Delivery semantics define how many times a message can flow through the system when failures occur.
Kafka's official documentation explains the topic by separating producer durability from consumer offset management.

- at-most-once   : allows loss but does not allow duplicates
- at-least-once  : reduces loss but allows duplicates
- exactly-once   : aims for a result that is applied only once

The difference depends on who fails and when. The result changes depending on whether the producer exits before receiving a response, or whether the consumer exits after business processing but before offset commit.

**Message Processing Flow**

| Step | Category | Description |
|:------|:------------------------|:-------------------------------------|
| **1** | **Producer Send**       | Send the message to the broker |
| **2** | **Broker Append**       | Persist the message safely in the broker's local log |
| **3** | **Consumer Poll**       | Read data from the broker |
| **4** | **Business Processing** | Execute real business logic such as DB writes and notifications |
| **5** | **Offset Commit**       | Confirm the processed position |

**Impact by Failure Point**

- **Failure before step 2**: the broker has not appended the message yet, so the message can be **lost**.
- **Failure after step 4 and before step 5**: business processing finished but the offset was not committed, so the message can be **processed again** after restart.
- **No atomicity across steps 4 and 5**: if processing and commit do not succeed or fail together, the system cannot guarantee **exactly-once**.

"Recorded once in the broker" and "applied once in the application" are different stages.
The fact that Kafka stored a message successfully does not guarantee that business processing succeeded, and that distinction is the starting point of production design.

<br>

# Choosing the Right Guarantee for the Domain

Not every system needs exactly-once. If a use case can tolerate some duplication, such as log collection or metric ingestion, at-least-once is often the more practical choice in terms of implementation and operations cost.

| Scenario | Recommended Semantics | Main Settings and Strategy |
|------------------|-----------------------------------|----------------------------|
| Access logs, metrics | at-most-once or relaxed at-least-once | `acks=0` or simple consumption |
| Notifications, cache updates | at-least-once | `acks=all`, commit after processing, idempotent consumption |
| Order and payment event transformation | Kafka-internal exactly-once | transactions + `read_committed` |
| Kafka -> external DB write | at-least-once + idempotent persistence | commit after processing, DB unique key |

What matters is not "perfect guarantees" but "which cost the system accepts during failure."
If duplicate removal is easy, at-least-once is often enough. If external side effects are expensive, business-level idempotency matters more than Kafka transactions alone.

<br>

# Producer Durability and Idempotence

On the producer side, `acks`, `retries`, and `enable.idempotence` largely determine durability.
Even if the broker stores the message safely, retries caused by network timeouts can still create duplicates, so durability and duplicate prevention need to be reviewed together.

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

`acks=0` reduces latency because the producer does not wait for a response, but it carries the highest risk of loss.
`acks=all` increases durability by waiting for ISR confirmation, but its actual meaning still depends on `min.insync.replicas`.

The idempotent producer prevents duplicate appends by letting the broker verify message sequence during retries.
Since Kafka 3.0, `enable.idempotence` is enabled by default, but that guarantee is limited to **the same producer session and the same partition**.

<br>

# The Impact of Consumer Commit Timing

The point at which a consumer commits offsets is directly connected to the risk of loss and duplication. Offsets mark the group's read position, so committing before processing risks loss, while committing after processing risks duplicates.

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        processPayment(record); // Business processing
    }
    consumer.commitSync(); // Manual commit after processing completes
}
```

This commit-after-processing pattern is the typical at-least-once structure.
If `processPayment()` succeeds but the process dies right before `commitSync()`, the same record is read again.
That is why this pattern is common and practical, but it still requires idempotent business logic.

<br>

# Atomic Processing with Transactions

Exactly-once requires more than producer idempotence. The consumer's read position and the write result in the output topic must be part of the same atomic scope.
Kafka supports this by combining a transactional producer with offset commits inside the transaction.

```java
// The example below is simplified to explain the flow.
producerProps.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "payment-tx-01");
consumerProps.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");

producer.initTransactions();
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    producer.beginTransaction();
    try {
        for (ConsumerRecord<String, String> record : records) {
            String result = transform(record.value());
            producer.send(new ProducerRecord<>("output-topic", record.key(), result));
        }
        // Bind output-topic writes and offset commits to the same transaction
        producer.sendOffsetsToTransaction(currentOffsets, consumer.groupMetadata());
        producer.commitTransaction();
    } catch (Exception e) {
        producer.abortTransaction();
    }
}
```

This structure binds output writes and offset commits to the same atomic scope so that failures roll both back together.
That avoids the partial-success state where one side succeeds and the other fails.
Here, `transactional.id` identifies unfinished transactions from earlier producer instances after restart, so each instance needs its own stable identifier.

In production code, fatal exceptions such as `ProducerFencedException` usually need separate handling that closes the current producer.
For that reason, it is safer not to copy a pattern that catches every exception and only calls `abortTransaction()`.

<br>

# How `read_committed` Consumers Behave

When the system uses transactions, exactly-once breaks if consumers do not set `read_committed`, because they can still read data from aborted transactions.

```java
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
```

`read_committed` also affects read timing. Records behind an unfinished transaction are returned only up to the Last Stable Offset (LSO), so even when data exists in the partition, it may not appear in `poll()` results immediately.

Kafka's internal exactly-once mechanism does not automatically extend to external stores such as RDBMS or NoSQL systems.
If the consumer writes to a database, the result store itself still needs business-level idempotency, for example with a unique key, or a more careful design that manages state inside Kafka transactions.

<br>

# References

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/producer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Producer Configs</a>
- <a href="https://kafka.apache.org/35/configuration/consumer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Consumer Configs</a>
