---
layout: post
title: "Kafka Topic Configuration Reference"
author: madplay
tags: kafka topic configuration
description: "A practical guide to frequently used Kafka topic configurations (retention, cleanup policy, replication, and message size) with examples."
category: Backend
date: "2023-04-04 14:27:53"
comments: true
lang: en
slug: kafka-topic-configurations
permalink: /en/post/kafka-topic-configurations
---

# Knowing Topic Configurations Makes Operations Easier

When teams first adopt Kafka, they often focus only on partition count and replication factor.
In production, however, topic configurations such as retention period, cleanup policy, and message size limits are directly tied to recovery time.
If your system has reprocessing requirements, topic configuration is not just an option set. It is part of your data recovery strategy.

> This post is written as of April 2023 (based on Kafka 3.4 documentation).

<br>

# How to Change Topic Configurations
Topic configurations can be defined at topic creation time or changed during operation. Start with the CLI flow most teams use in production.

```bash
# Set configs when creating a topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic order-events \
  --partitions 12 --replication-factor 3 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000

# Change configs on an existing topic
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --add-config retention.ms=259200000

# View current configs
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe
```

When changing multiple values at once, teams often use a comma-separated form such as `--add-config key=value,key2=value2`.

If you need to control configurations in application code, you can use `AdminClient`. In Spring environments, teams also combine `KafkaAdmin` with IaC tools such as `Terraform`, `Ansible`, or `Pulumi`.

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

try (AdminClient adminClient = AdminClient.create(props)) {
    ConfigResource topicResource =
        new ConfigResource(ConfigResource.Type.TOPIC, "order-events");

    Collection<AlterConfigOp> configOps = List.of(
        new AlterConfigOp(new ConfigEntry("retention.ms", "604800000"), AlterConfigOp.OpType.SET),
        new AlterConfigOp(new ConfigEntry("min.insync.replicas", "2"), AlterConfigOp.OpType.SET)
    );

    adminClient.incrementalAlterConfigs(Map.of(topicResource, configOps)).all().get();
}
```

One critical point: topic-level settings override broker defaults.
If each topic is modified without a clear standard, root-cause analysis gets harder later.
Define which values should be overridden at the topic level before changes are applied. The table below is a practical reference.

<br>

# Broker Defaults vs Topic Overrides
A common source of confusion is deciding between broker defaults and per-topic overrides. A clear policy helps documentation and operations.

| Item                    | Use Broker Default                   | Prefer Topic Override                             |
|-------------------------|--------------------------------------|---------------------------------------------------|
| `retention.ms`          | Same retention policy across domains | Different reprocessing window per topic           |
| `cleanup.policy`        | One policy for event streams         | Split compact/delete by topic characteristics     |
| `min.insync.replicas`   | Similar durability for all topics    | Stronger guarantees for critical payment topics   |
| `max.message.bytes`     | Uniform payload size                 | Only a subset handles large messages              |

It is safer to keep this policy in a shared table managed by both development and operations.

<br>

# Retention Policy: Retention Settings
Now look at concrete settings. The reprocessing window is heavily influenced by retention policy.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name payment-events \
  --alter --add-config retention.ms=1209600000,retention.bytes=10737418240
```

- `retention.ms`: message retention time
- `retention.bytes`: maximum log size per partition
- `segment.ms`, `segment.bytes`: log segment rolling criteria

If payment data must be reprocessed for seven days, avoid setting `retention.ms` shorter than that.
When `retention.ms` and `retention.bytes` are both set, segment cleanup follows the condition reached first.
Also, `retention.bytes` and `retention.ms` apply on the `cleanup.policy=delete` path.

If `segment.ms` is not specified at topic level, Kafka follows broker `log.roll.ms`.
The broker default is 7 days (604800000ms).
If retention is short, teams often reduce segment size as well so cleanup cadence aligns with retention.
Keep in mind that too-small segments increase file count and index/cleanup I/O.
Too-large segments delay cleanup visibility.

<br>

# Cleanup Policy: cleanup.policy
`cleanup.policy` effectively defines topic behavior.
After retention is decided, choose the cleanup mechanism.

```bash
# General event stream
--add-config cleanup.policy=delete

# Topic that keeps latest state by key
--add-config cleanup.policy=compact

# Apply both
--add-config cleanup.policy=delete,compact
```

`compact` keeps the latest record per key, so it fits stateful data.
For example, it is useful when maintaining the latest notification preferences by `userId`.

For compact topics, these two settings are important to review together.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name user-preferences \
  --alter --add-config cleanup.policy=compact,min.compaction.lag.ms=60000,delete.retention.ms=86400000
```

- `min.compaction.lag.ms`: minimum retention time before compaction eligibility
- `delete.retention.ms`: tombstone retention window (ensures delete propagation)

`delete.retention.ms` especially affects whether late-joining consumers can read tombstones and converge on delete state.

```java
public class UserProfileConsumer {

    public void handle(ConsumerRecord<String, String> record) {
        String userId = record.key();
        String requestId = extractRequestId(record.headers());

        log.info("consume user-profile event key={}, partition={}, offset={}, requestId={}",
            userId, record.partition(), record.offset(), requestId);

        if (alreadyProcessed(requestId)) {
            return; // Allow duplicate consumption but apply the result only once
        }

        applyLatestProfile(record.value());
        markProcessed(requestId);
    }
}
```

Compaction is not always immediate. Build consumers to be idempotent under duplicate records.

<br>

# Replication Policy: replication.factor and min.insync.replicas
Topic durability is strongly affected by replication settings.
After cleanup policy, also verify replication settings for failure scenarios.

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic invoice-events \
  --partitions 6 --replication-factor 3

kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name invoice-events \
  --alter --add-config min.insync.replicas=2
```

- `replication.factor`: number of replicas
- `min.insync.replicas`: minimum ISR count required for write acknowledgments

Combined with producer `acks=all`, these settings reduce data loss risk during failures.
Setting values too high, however, can reduce availability.
For example, with replication 3 and `min.insync.replicas=3`, one broker failure can block writes.

```text
Condition: replication.factor=3, acks=all
- min.insync.replicas=2, 1 broker failure -> ISR=2, writes can succeed
- min.insync.replicas=3, 1 broker failure -> ISR=2, writes fail (NotEnoughReplicas)
```

Teams often split topics by business criticality and apply different values to balance durability and availability.

<br>

# Message Size and Compression
Message size limits and compression directly affect storage and network cost.
After replication, align size and compression settings as part of transport and storage cost control.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name image-jobs \
  --alter --add-config max.message.bytes=2097152,compression.type=zstd
```

- `max.message.bytes`: maximum allowed message size on a topic
- `compression.type`: producer, uncompressed, gzip, snappy, lz4, zstd

With compression enabled, `max.message.bytes` limits the post-compression record batch size.
Align producer `max.request.size`, broker `message.max.bytes`, and topic `max.message.bytes` together.
In practice, producer limits are typically kept less than or equal to broker/topic limits.

Before increasing message size, review storage separation strategies first.
For example, keep payloads in object storage and place only metadata plus paths in Kafka. This is often better for network, replication, and disk cost.

<br>

# Why Retry, Timeout, and Error Classification Must Be Considered Together
Even with strong topic settings, weak consumer error handling can repeatedly cause incidents.
Treat topic configuration and application processing policy as one operational system.

```java
public class OrderEventConsumer {

    public void consume(ConsumerRecord<String, OrderEvent> record) {
        String orderId = record.key();
        String traceId = extractTraceId(record.headers());

        try {
            processWithTimeout(record.value(), Duration.ofSeconds(2));
        } catch (TimeoutException e) {
            // Transient error: retryable
            log.warn("transient error(timeout) key={}, partition={}, offset={}, traceId={}",
                orderId, record.partition(), record.offset(), traceId);
            throw e;
        } catch (InvalidOrderStateException e) {
            // Permanent error: retries lead to same failure
            log.error("permanent error key={}, partition={}, offset={}, traceId={}",
                orderId, record.partition(), record.offset(), traceId, e);
            sendToDeadLetter(record);
        }
    }
}
```

If transient errors (network timeout, external API delay) and permanent errors (schema mismatch, business validation failure) are not separated, unnecessary retries increase latency and cost.
Retention (`retention.ms`) is also tied to this strategy. Recovery is easier only when data remains available through retry wait time and reprocessing windows.

<br>

# Example Initial Values for Production
The values below are not universal answers. They are baseline examples for early operations.

```text
- Event topics: cleanup.policy=delete, retention.ms=604800000 (7 days)
- State topics: cleanup.policy=compact, keep default delete.retention.ms first and observe
- Replication: replication.factor=3, min.insync.replicas=2, producer acks=all
- Compression: compression.type=zstd (requires version/compatibility check)
- Partitions: start from expected TPS and consumer parallelism, then scale
```

The key is not looking at topic settings in isolation.
Align retries, idempotent processing, and incident log context (`key`, `partition`, `offset`, `traceId`) together to reduce real recovery time.

<br>

# Operational Checklist
It is safer to validate the following before and after configuration changes.

```bash
# 1) Backup current values before change
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe > order-events-config-before.txt

# 2) Apply change
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --add-config retention.ms=604800000

# 3) Verify applied values
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe

# Rollback) Return to broker default/cluster dynamic default
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --delete-config retention.ms
```

`--delete-config` is mainly used in rollback or when reverting to baseline policy.
Rollback can be done by either reapplying previous values or removing topic overrides so broker defaults apply.
That is why saving a pre-change snapshot is important.

<br>

# References
- <a href="https://kafka.apache.org/34/documentation.html#topicconfigs" target="_blank" rel="nofollow">Apache Kafka 3.4 - Topic Configs</a>
- <a href="https://kafka.apache.org/34/documentation.html#basic_ops_modify_topic_configs" target="_blank" rel="nofollow">Apache Kafka 3.4 - Modifying Topic Configurations</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/clients/admin/AdminClient.html" target="_blank" rel="nofollow">Apache Kafka 3.4 AdminClient Javadoc</a>
