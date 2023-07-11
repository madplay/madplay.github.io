---
layout: post
title: "Kafka Message Keys: Is It Really Enough to Just Put One In?"
author: madplay
tags: kafka producer partitioning key partitioner ordering
description: "One message key changes ordering guarantees, parallelism, and even hot partitions."
category: Backend
lang: en
slug: kafka-producer-partitioning-and-message-key
permalink: /en/post/kafka-producer-partitioning-and-message-key
date: "2023-07-06 21:08:34"
comments: true
---

# Why Message Keys Matter

If state events for the same order are scattered across different partitions, downstream consumers struggle to reconstruct the original order even if the system adds more consumer instances.
A message key is not just an identifier. It determines both the scope of ordering guarantees and the unit of parallel processing.
That is why key selection is not only a producer option. It is part of domain design.

<br>

# Why the Same Key Goes to the Same Partition

A message key is different from a primary key in broker storage. It is the value the producer uses when it decides which partition receives a record.
With the default partitioner, it is also the criterion that keeps records with the same key in the same partition.

## The Key Becomes the Partitioning Rule

Kafka guarantees order inside a partition, not across a whole topic.
So the key needs to express "what must be processed in the same order."
If there is no key, or if the producer uses a different key every time, events for the same entity can spread across multiple partitions.

For example, using `orderId` as the key for order events makes the producer choose the partition based on that value.
The code below is the most basic pattern for keeping the events of the same order together.

```java
String topic = "order-events";
String key = orderEvent.getOrderId();
String value = objectMapper.writeValueAsString(orderEvent);

ProducerRecord<String, String> record =
    new ProducerRecord<>(topic, key, value);

producer.send(record);
```

Kafka's ordering guarantee applies only **inside a partition**.
If the producer uses the same `orderId` as the key, every event related to that order is appended to the same partition in append order.

A design that keeps the same key in the same partition also simplifies consumer state management.
For example, if a consumer keeps order state in memory or a local cache, grouping the same `orderId` in one partition makes that state easier to manage.

## Inside the Code

This behavior is not just a conceptual promise. The Kafka client implementation shows it directly.
In <a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/producer/internals/BuiltInPartitioner.java"
target="_blank" rel="nofollow">Apache Kafka's BuiltInPartitioner</a>, the partition calculation for a record with a key looks like this.

```java
if (serializedKey != null) {
    return Utils.toPositive(Utils.murmur2(serializedKey)) % numPartitions;
}
```

Kafka hashes the serialized key bytes with `murmur2` and uses the remainder of division by `numPartitions` as the partition number.
So as long as **the key bytes stay the same and the partition count stays the same**, the default partitioner sends the same key to the same partition.

But the result can change when the partition count changes.
So even when `orderId` is a good key, increasing the partition count later can move the same order to a different partition. That point appears again later in this post.

## Ordering for the Same Key Survives Backlog

This property still matters when backlog accumulates because of a consumer failure or a temporary pause.
If the producer keeps sending the same entity with the same key, **records in that key range are read again in the same append order inside the partition**.

For example, if `orderId` is the key, the events `order created`, `payment completed`, and `shipment started` for the same order accumulate in one partition and are read back in that order.
So even after a consumer outage, bulk replay of backlog is less likely to scramble the state transition order.

**That does not mean Kafka guarantees a global time order for the whole topic.**
The guarantee applies only inside the same partition for the same key.
It also depends on the same key being preserved, the partition count staying fixed, and the consumer processing sequentially.

If recovery and replay frequently break because of ordering problems, the first place to inspect is message key and partition design.
But that is not always the whole cause. Producer retry settings, partition-count changes, and consumer processing strategy also matter.

<br>

# How the Default Partitioner Works

The default partitioner behaves differently depending on whether a key exists.
In Kafka 3.5, if the record has a key, Kafka uses hash-based partitioning.
If it does not, Kafka uses **Sticky Partitioning** to batch records efficiently in one partition for a while.

## When a Key Exists

When the record has a key, Kafka distributes records with a hash-based strategy. That makes identical keys go to the same partition while different keys spread across partitions.
This preserves ordering per entity while still allowing parallel processing across entities.

```java
// Hash-based routing when a key exists
producer.send(new ProducerRecord<>("topic", "key", "value"));

// Sticky Partition strategy when no key exists
producer.send(new ProducerRecord<>("topic", null, "value"));
```

## When a Key Does Not Exist

It is important to remember that keyless records do not rotate evenly across partitions every time in a strict round-robin way.
To improve send efficiency, Kafka temporarily stays on one partition, so an observation at one moment can look like skew.
Kafka can even be configured to ignore keys.

```properties
partitioner.ignore.keys=false (default)
```

If this value is set to `true`, Kafka ignores the key even when one exists.
In systems where ordering matters, it is safer to verify that this setting has not changed unintentionally.

<br>

# How to Choose the Right Key

When choosing a message key, the first question is not how unique the value is.
The better question is **"what must be processed in the same order?"**
If that criterion stays vague, ordering can still break even when every record has a key.

The table below shows typical design choices by domain.
Even for the same event, the right key changes depending on which entity needs ordered processing.

| Candidate Key | Design Intent | Operational Caveat |
|:---------------|:-------------|:-----------------------------|
| **orderId**    | Guarantee order per order | Heavy ordering from one customer can still skew partitions |
| **customerId** | Aggregate data per customer | Heavy users can create hot partitions |
| **storeId**    | Process inventory or settlement per store | Throughput can become unbalanced between large and small stores |
| **random UUID** | Simple load distribution | No ordering guarantee for the same entity |

Key selection also connects to the consumer's state management model.
If records with the same key stay in the same partition, a consumer can keep entity-level state in local cache or memory more easily.
That is why message keys naturally connect to stateful architecture design.

<br>

# Why Hot Partitions Happen

A hot partition is a state where traffic is heavily concentrated on only one partition.
Even if the topic has many partitions, a skewed key distribution still makes the busiest partition the bottleneck of the entire pipeline.

```text
partition 0 -> 9,000 msg/s (Bottleneck)
partition 1 ->   100 msg/s
partition 2 ->   100 msg/s
```

For example, if the key is store ID and one large store generates far more traffic than smaller stores, only the consumer instance that owns that partition can keep falling behind.
In that case, simply adding more consumers has limited effect, and the key design itself may need to change.
Including partition information in success logs helps detect skew early.

```java
log.info("publish success. key={}, partition={}, offset={}",
    record.key(), metadata.partition(), metadata.offset());
```

<br>

# The Impact of Partition Expansion

Increasing the partition count can improve parallelism.
But it can also change which partition receives the same key.
Hash-based distribution uses the total partition count as the divisor, so changing that divisor can move the same key to a different partition.

```text
Before expansion (6 partitions)  : key="A" -> partition 2
After expansion (12 partitions)  : key="A" -> partition 7 (ordering discontinuity)
```

That means the ordering sequence before expansion and the sequence after expansion can become separate ranges.
In domains where causality matters, such as order state transitions, it is often better to drain existing data before expansion or move to a new topic.

<br>

# Why Teams Consider a Custom Partitioner

If the required routing policy cannot be expressed with default hash distribution, a custom partitioner becomes an option.
Typical examples include isolating a certain customer tier such as VIPs, or forcing a specific key range into a specific subset of partitions.
Those are hard to express with only the default rule that "the same key goes to the same partition."

## When It Is Needed

A custom partitioner means the application takes responsibility for the routing logic that the default partitioner handled consistently.
That gives more control over design intent, but it also raises operational complexity quickly.

```java
public class CustomerTierPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        if (key == null) {
            return 0;
        }
        if (key.toString().startsWith("VIP-")) return 0; // Isolate VIP traffic
        return Utils.toPositive(Utils.murmur2(keyBytes)) % (cluster.partitionCountForTopic(topic) - 1) + 1;
    }
}
```

## Why It Requires Caution

With a custom partitioner, every client in every language has to keep the same logic, and the team needs to verify that the logic still works every time partition counts change.
If isolation is the primary goal, splitting the topic itself is often operationally clearer.

The logic for `null` keys also needs an explicit choice.
Sending them all to partition 0, as in the example above, is simple to explain, but it can create another skew problem in production.

In short, a custom partitioner makes sense when the team concludes that the desired routing rule cannot be achieved with better key design alone.
If refining the key or splitting the topic already satisfies the requirement, that approach is usually simpler to operate.

<br>

# Is Key Design Alone Enough?

Choosing a good message key does not solve ordering by itself.
To expect partition-local order, the design also has to consider reorder scenarios during retries, and that is where producer send settings matter.

## What Key Design Does

Key design answers the question, "which events should be grouped together?"
In other words, it decides which events should be processed in the same partition in the same order.

Even if the system successfully groups the same `orderId` in one partition, retries can still let a later batch be appended before an earlier batch.
So the message key decides **where records are grouped**, and producer settings influence **how stable the write order is inside that partition**.

## What Producer Settings Do

```java
/*
 * Enable idempotence.
 * Even if the producer retries because of a timeout or network error before it receives a success response,
 * the broker prevents duplicate record storage by checking the producer ID and sequence number.
 */
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");

/*
 * Limit the number of in-flight requests on one connection to 5 or fewer.
 * If this value exceeds 5, an idempotent producer can no longer preserve ordering and duplicate prevention guarantees,
 * so Kafka restricts it to a safe range.
 */
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5");

/*
 * acks=all makes the leader partition return success only after all replicas in the ISR
 * have acknowledged the write.
 * Latency can increase, but durability improves because the risk of loss is lower during broker failure.
 */
props.put(ProducerConfig.ACKS_CONFIG, "all");
```

To approach the expected ordering guarantee, the design has to view both steps together:
**group the same entity into the same partition** through key selection, and **keep the write order inside that partition as stable as possible** through producer settings.

<br>

# References

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/producer-configs/"
  target="_blank" rel="nofollow">Apache Kafka 3.5 Producer Configs</a>
