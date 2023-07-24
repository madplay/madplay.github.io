---
layout: post
title: "Why Does a Kafka Consumer Keep Falling Behind?"
author: madplay
tags: kafka consumer poll fetch max-poll-interval lag
description: "When lag grows and rebalancing repeats, what is actually happening inside the consumer? This post follows the flow of poll and fetch."
category: Backend
lang: en
slug: kafka-consumer-lag-poll-and-fetch
permalink: /en/post/kafka-consumer-lag-poll-and-fetch
date: "2023-07-18 18:47:29"
comments: true
---

# Where the `poll` Loop Becomes a Bottleneck

`poll()` is the basic API a Kafka consumer uses to receive records from the broker.
Applications usually call this method repeatedly, fetch data, and process the returned records in order. The phrase `poll loop` in this post refers to that repeated cycle.

The important detail is that this loop does more than simply read data.
The `poll()` interval and processing speed can both affect lag growth and the stability of the consumer group.
That is why it is not enough to suspect broker performance only when lag spikes.
If the `poll()` interval becomes too long or the fetch response size does not match the application's processing speed, even otherwise healthy code can trigger rebalancing or commit failures.
The consumer loop is the point where broker-side supply rate and application-side processing time meet.

At the same time, a large lag value alone does not immediately mean that "the consumer is abnormally slow."
Producer traffic may have spiked temporarily, or only a subset of partitions may be falling behind.
So lag is easier to interpret when the team looks at its growth rate, recovery rate, and per-partition skew together instead of only one absolute value.

<br>

# The Difference Between `poll` and `fetch`

Fetch is the internal data-receive step that happens during `poll()`.
The two words are often used interchangeably, but they play different roles, so their tuning points also need to be separated.

## The Application Calls `poll()`

The application calls `poll()`, but the consumer can cache fetch results internally and return them across multiple `poll()` calls.
In other words, a `poll()` result of 500 records does not necessarily mean the broker delivered only 500 records.
Actual receive volume depends on fetch-related settings, and `poll()` is the interface that passes part of that data to the application thread.

```java
while (true) {
    // If the internal buffer has records, return immediately. Otherwise continue with a fetch request.
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> record : records) {
        handle(record); // Business logic
    }
}
```

## Inside the Kafka Source Code

Kafka client source code shows the same behavior directly.
For example, in <a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/consumer/KafkaConsumer.java"
target="_blank" rel="nofollow">Apache Kafka's `KafkaConsumer` source</a>, `poll()` is the public API entry point, and the actual work continues into the internal `poll(...)` flow.

```java
public ConsumerRecords<K, V> poll(final Duration timeout) {
    return poll(time.timer(timeout), true);
}
```

It looks like a single `poll()` call from the outside, but inside that call Kafka can return buffered records, trigger fetches when needed, and apply group-state changes.
That is why a `poll()` return size and a fetch response size do not mean the same thing.

The Javadoc in the same file also says, _"On each poll, consumer will try to use the last consumed offset as the starting offset and fetch sequentially"_.
So `poll()` is not a simple getter. It is the entry point that continues reading from the current position.

<br>

# What Changes the Fetch Response Timing

`fetch.min.bytes` and `fetch.max.wait.ms` influence when the broker returns a fetch response.
They let the application trade response immediacy for better network efficiency by setting a minimum amount of accumulated data and a maximum wait time.

```java
// Wait until at least 64 KB is accumulated to improve network efficiency
props.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, "65536");
// But still respond immediately once 100 ms passes
props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, "100");
```

If the system wants a response as soon as any data exists, it can keep the default `fetch.min.bytes=1`.
If throughput matters more, as in large batch-style processing, increasing this value can reduce request count and lower CPU cost on both the broker and the client.

<br>

# The Relationship Between Fetch Size Limits and `poll()` Return Size

Fetch-related settings form layered constraints.
The system needs to tune per-partition limits, whole-request limits, and the number of records handed to the application separately.

## How Much the Broker Returns

```java
// Maximum fetch size per partition (2 MB)
props.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG, "2097152");
// Total upper bound for one fetch request (20 MB)
props.put(ConsumerConfig.FETCH_MAX_BYTES_CONFIG, "20971520");
// Maximum records returned by a single poll (300)
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "300");
```

`max.partition.fetch.bytes` and `fetch.max.bytes` limit how much the consumer can receive from the broker in one round.
For example, if `fetch.max.bytes` is 20 MB, the consumer can hold a relatively large response in its internal buffer and still pass it to the application in smaller chunks.

## How Much Is Handed to the Application

A smaller `max.poll.records` does not reduce how much data the consumer receives from the broker.
It only reduces the size of the "bite" passed to application logic so the application can finish processing within `max.poll.interval.ms`.
Actual receive volume is still controlled by `fetch.max.bytes`, and excess data stays in the internal buffer.

If production logic is heavy and the `poll()` interval grows too easily, a common first step is to reduce `max.poll.records`.
But that setting is not a fetch throttle. It is closer to a pacing control for how already-buffered records are handed to the application.

<br>

# What Heartbeats and the `poll` Interval Actually Check

`session.timeout.ms` and `max.poll.interval.ms` check two different kinds of health.
With the classic consumer, heartbeats are sent from a background thread, but Kafka uses the `poll()` cadence to decide whether the application is still making progress.

```java
// Threshold for heartbeat loss (10 seconds)
props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "10000");
// Maximum allowed interval between poll() calls (5 minutes)
props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, "300000");
```

## What Heartbeats Check

`session.timeout.ms` is close to asking, "is this consumer still alive as a group member?"
If heartbeats stop, the broker no longer keeps the consumer as an active member of the group.

## What the `poll` Interval Checks

`max.poll.interval.ms` is closer to asking, "is the application still doing its work?"
For example, if `max.poll.interval.ms=5 minutes` but processing one batch takes 6 minutes, the client leaves the group even if heartbeats remain healthy.
Any later offset commit can then throw `CommitFailedException`.
That behavior blocks commits after partition ownership has already moved to another member and protects data consistency.

<br>

# Separating Processing Threads and the `pause`/`resume` Strategy

If long-running work happens inside one loop, group stability often suffers.
The `KafkaConsumer` Javadoc presents a common pattern: move processing logic to separate worker threads while the consumer thread keeps calling `poll()`.

<a href="https://github.com/apache/kafka/blob/3.5.0/clients/src/main/java/org/apache/kafka/clients/consumer/KafkaConsumer.java#L466-L468"
target="_blank" rel="nofollow">The `KafkaConsumer` Javadoc</a> explains:
_"The Kafka consumer is NOT thread-safe. All network I/O happens in the thread of the application making the call."_
So instead of sharing one consumer instance across multiple threads, the safer pattern is to keep the consumer thread dedicated to the poll loop and hand only processing to worker threads.

The same source file's multithreaded example also keeps calling `poll()` continuously.

```java
while (!closed.get()) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(10000));
    // Handle new records
}
```

The point is that even if other threads spend a long time processing, the consumer thread itself keeps running the poll loop.
That keeps the consumer active in the group and preserves partition ownership while separating business processing from consumption.

For example, worker threads may still be processing while rebalancing already transfers partition ownership to another consumer.
If the old consumer then tries to commit late, already-processed records can be delivered again, or unprocessed records can look as if they were skipped.
That is why a multithreaded pattern also needs to manage three things together: who still owns the partition, how far processing has actually completed, and which offset is safe to commit.

The implementation flow can look like this.

> **Implementation caution:** When separate threads are used, failing to stop in-flight work or manage commit boundaries during rebalancing can create duplicates or dropped work.

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(200));
    for (TopicPartition partition : records.partitions()) {
        // Pause a partition that is still being processed so additional delivery is delayed
        consumer.pause(Set.of(partition));
        workerPool.submit(() -> {
            try {
                process(records.records(partition));
                completedOffsets.put(partition, lastOffset + 1);
            } finally {
                // Resume after processing completes
                pendingResumePartitions.add(partition);
            }
        });
    }
}
```

The key points in this pattern are:

- The consumer thread keeps calling `poll()` at a short interval to remain an active group member.
- `pause()` slows additional delivery and new fetch progress for partitions already under worker processing.
- `resume()` and offset commits happen only after real processing completes, so the commit does not get ahead of processing.

But `pause()` does not erase records that are already in the internal buffer.
So this pattern alone does not remove every ordering issue or duplicate risk. Real implementations still need to manage buffer state and commit timing together.

## What Else to Check During Rebalancing

`ConsumerRebalanceListener` is the interface that tells the application when partitions are about to be revoked or newly assigned.
The phrase in-flight work here means records that have already been handed to worker threads but whose processing and commit status are not yet settled.

In real code, it is safer to use this listener and detect which partitions are being revoked before the rebalance completes.
At that point, the application needs to decide how to clean up unfinished work and how far it can commit offsets for the records that actually finished processing.
Otherwise, the old consumer can end up trying to commit or `resume()` after ownership has already moved away.

<br>

# Finding the Bottleneck: What to Check First

To understand why consumer performance drops, it helps to observe network response, message size, processing time, and group-health signals separately.

| Checkpoint | Main Settings | Observation Metrics |
|---------------|------------------------------------------------|----------------------------|
| Too many small network requests | `fetch.min.bytes`, `fetch.max.wait.ms` | Fetch request rate, response size |
| Large-message processing delay | `max.partition.fetch.bytes`, `fetch.max.bytes` | Fetch size, deserialization time, processing latency |
| Slow batch processing | `max.poll.records`, application processing time | Poll interval, processing time, CPU usage |
| Frequent group departures | `max.poll.interval.ms`, `session.timeout.ms` | Rebalance count, commit failure logs |

When lag grows in production, teams often think about adding partitions first.
But it is often more effective to first check whether internal bottlenecks exist, such as fetch responses that are too small or long external I/O waits inside processing threads.

<br>

# Diagnosing Bottlenecks Through Observation

The state of a consumer is difficult to understand from code alone.
Monitoring needs to combine processing time, fetch response size, and commit delay.

## What to Look for in Logs First

Success logs should include more than a generic success message. They should include processing time and position information.

```java
log.info("consume success. partition={}, offset={}, elapsed={}ms",
    record.partition(), record.offset(), System.currentTimeMillis() - start);
```

## What to Separate in Metrics

If only a specific partition is slow, hot-key skew is a good first suspicion.
If every partition slows down at the same time, it is better to first inspect shared dependencies such as an external API, database contention, or GC pressure.
Analyzing `records-lag-max` together with `fetch-size-avg` is often the starting point for distinguishing a data-supply problem from a processing-path problem.

In that analysis, per-partition variance is usually more useful than a global average.
If every partition slows together, the likely issue is a shared dependency or a common processing path.
If only a few partitions fall behind, hot keys or uneven data distribution are more likely.

<br>

# References

- <a href="https://kafka.apache.org/blog/2023/06/15/apache-kafka-3.5.0-release-announcement/"
  target="_blank" rel="nofollow">Apache Kafka 3.5.0 Release Announcement</a>
- <a href="https://kafka.apache.org/35/configuration/consumer-configs/"
  target="_blank" rel="nofollow">Apache Kafka Consumer Configs</a>
