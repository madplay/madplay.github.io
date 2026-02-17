---
layout: post
title: "Kafka Streams Windows and Joins"
author: madplay
tags: kafka streams window tumbling hopping session join grace-period
description: "Covers how Tumbling, Hopping, and Session windows work, along with KStream-KStream time-based joins, Grace Period, and State Store retention management."
category: Backend
lang: en
slug: kafka-streams-windowing-and-joins
permalink: /en/post/kafka-streams-windowing-and-joins
date: "2023-05-28 21:48:33"
comments: true
---

# Kafka Streams Series
- <a href="/en/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams Concepts and Architecture</a>
- <a href="/en/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream and KTable</a>
- **3. Kafka Streams Windows and Joins**
- <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams Error Handling and Recovery Strategies</a>

<br>

# Why Stream Data Needs Time Windows

"How many orders arrived in the last five minutes?"
That question requires more than a simple aggregate. The system needs to cut an unbounded event stream into time ranges and aggregate only the data inside each range.
That time range is called a **window**, and Kafka Streams provides several window types.
This post covers the mechanics of the three window types used most often in production, Tumbling, Hopping, and Session windows, and then moves to time-based KStream-KStream joins.

<br>

# Tumbling Window: Fixed, Non-Overlapping Intervals

Tumbling Window is a sequence of fixed-size windows aligned on the time axis without gaps or overlap.
Because windows do not overlap, each record belongs to exactly one window.

The following example counts orders per user in 5-minute windows.

```java
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;
import java.time.Duration;

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KTable<Windowed<String>, Long> orderCountPerWindow = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count();
```

`TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5))` creates a 5-minute tumbling window. `NoGrace` means late-arriving records are not accepted after the window closes. The next section on Grace Period covers that point in more detail.

Windows are aligned from the epoch, 1970-01-01 00:00:00 UTC.
With a 5-minute window, the sequence is `[00:00, 00:05)`, `[00:05, 00:10)`, `[00:10, 00:15)`, and so on.

```text
Time axis:  00:00    00:05    00:10    00:15
            |--------|--------|--------|
            Window 1  Window 2  Window 3

Record A (00:02) -> Window 1
Record B (00:07) -> Window 2
Record C (00:04) -> Window 1
Record D (00:10) -> Window 3
```

The key of the result, `KTable<Windowed<String>, Long>`, is `Windowed<String>`.
`Windowed` contains the original key, such as `userId`, and the start and end times of the window.

```java
orderCountPerWindow.toStream()
    .foreach((windowedKey, count) -> {
        String userId = windowedKey.key();
        long windowStart = windowedKey.window().start();
        long windowEnd = windowedKey.window().end();
        log.info("userId={}, window=[{}, {}), count={}",
            userId, windowStart, windowEnd, count);
    });
```

Tumbling windows are common in dashboard aggregates by minute or hour, settlement-style batch calculations, and traffic monitoring.

<br>

# Hopping Window: Overlapping Sliding Intervals

Hopping Window defines window size and advance interval separately.
When `size > advance`, windows overlap and a single record can belong to multiple windows.

The following example creates a 10-minute window every 2 minutes.

```java
KTable<Windowed<String>, Long> hoppingCount = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(10))
            .advanceBy(Duration.ofMinutes(2))
    )
    .count();
```

```text
Time axis:  00:00    00:02    00:04    00:06    00:08    00:10    00:12
            |------- Window 1 (00:00~00:10) --------|
                     |------- Window 2 (00:02~00:12) --------|
                              |------- Window 3 (00:04~00:14) --------|

Record A (00:03) -> Window 1, Window 2
Record B (00:05) -> Window 1, Window 2, Window 3
```

Record B belongs to three windows at the same time. As overlap grows, State Store size and processing cost also grow.

Hopping windows fit moving averages and rolling sums over "the last N minutes."
But the heavier the overlap, the more often the same record is counted in multiple windows. If the advance interval is too short, State Store pressure can grow quickly.

<br>

# Session Window: Dynamic Intervals Based on Activity

Session Window does not use a fixed size. Instead, it creates windows dynamically around an **inactivity gap**.
As long as records continue to arrive, the same session extends. If no record arrives during the inactivity gap, the session closes.

```java
import org.apache.kafka.streams.kstream.SessionWindows;

KTable<Windowed<String>, Long> sessionCounts = orders
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(5)))
    .count();
```

Assume the inactivity gap is 5 minutes. The user event timeline looks like this.

```text
User A:
  00:01  Event 1 -> Session 1 [00:01, 00:03]
  00:03  Event 2 -> Session 1
  (gap longer than 5 minutes)
  00:12  Event 3 -> Session 2 [00:12, 00:14]
  00:14  Event 4 -> Session 2

User B:
  00:02  Event 1 -> Session 1 [00:02, 00:08]
  00:04  Event 2 -> Session 1
  00:06  Event 3 -> Session 1
  00:08  Event 4 -> Session 1 (all events are merged because they stay within 5 minutes)
```

For user B, every event arrives within 5 minutes of the next, so all of them are merged into one session.

Session Window has one distinctive behavior. If a new record overlaps with an existing session, Kafka Streams **merges** the two sessions.
Because merging requires Kafka Streams to withdraw previous aggregates and combine them again, `aggregate` also needs a `Merger` function.

```java
KTable<Windowed<String>, Long> sessionTotalAmount = orders
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(5)))
    .aggregate(
        () -> 0L,
        (key, event, currentTotal) -> currentTotal + event.getAmount(),
        (key, leftTotal, rightTotal) -> leftTotal + rightTotal,  // Invoked when sessions merge
        Materialized.with(Serdes.String(), Serdes.Long())
    );
```

The third argument, `Merger`, is called when two sessions merge. In this example, it adds the totals from both sessions.

Session windows fit user session analysis, website visit tracking, and activity-based device detection.

<br>

# Window Join: Time-Based KStream-KStream Join

The previous post covered KStream-KTable join as a pattern that attaches current state to an event.
KStream-KStream join is a pattern that **combines two event streams inside a time window**.

A typical example is orders and payments. If an order event occurs and a payment event arrives within a defined time range, the system joins the two.

```java
KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KStream<String, PaymentEvent> payments = builder.stream(
    "payment-events",
    Consumed.with(Serdes.String(), paymentEventSerde)
);

KStream<String, OrderWithPayment> matched = orders.join(
    payments,
    (order, payment) -> new OrderWithPayment(
        order.getOrderId(),
        order.getAmount(),
        payment.getPaymentMethod(),
        payment.getPaidAt()
    ),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30)),
    StreamJoined.with(Serdes.String(), orderEventSerde, paymentEventSerde)
);

matched.to("matched-orders",
    Produced.with(Serdes.String(), orderWithPaymentSerde));
```

`JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30))` creates a symmetric 30-minute window.
That means a payment joins an order when the payment timestamp is within 30 minutes before or after the order timestamp.

```text
Order timestamp: T
To join, payment timestamp must satisfy: T - 30 minutes <= payment timestamp <= T + 30 minutes
```

Asymmetric windows are also possible. To join only payments that occur within one hour after the order, configure `before` and `after` differently.

```java
JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofHours(1))
    .before(Duration.ZERO)   // Ignore payments before the order
    .after(Duration.ofHours(1))  // Match only payments within 1 hour after the order
```

KStream-KStream join uses **inner join** semantics by default. A result appears only when both streams contain matching records.
If orders without payments still need to appear in the output, `leftJoin` is the right choice.

```java
KStream<String, OrderWithPayment> withPaymentOrNull = orders.leftJoin(
    payments,
    (order, payment) -> {
        if (payment == null) {
            return new OrderWithPayment(order, null); // Payment not completed
        }
        return new OrderWithPayment(order, payment);
    },
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(30)),
    StreamJoined.with(Serdes.String(), orderEventSerde, paymentEventSerde)
);
```

KStream-KStream join keeps records from both streams in a State Store during the window period, so a larger window directly increases State Store usage.

<br>

# Grace Period and Late Arriving Events

In distributed systems, events do not always arrive in order. Network delay, producer retries, and clock skew across partitions can all produce records that arrive "late" relative to event timestamps.

Grace Period configures how long Kafka Streams keeps accepting those late records after a window closes.

```java
// 5-minute window + 1-minute grace period
KTable<Windowed<String>, Long> withGrace = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1))
    )
    .count();
```

With this configuration, the `[00:00, 00:05)` window remains open until stream time exceeds 00:06, which is the window end plus one minute of grace.
A record with timestamp 00:03 that arrives before 00:06 still belongs to that window. The same record arriving after 00:06 is dropped.

That behavior requires one more concept: **stream time**. Stream time is the largest timestamp that Kafka Streams has observed so far.
It is not wall-clock time. It is derived from the data itself, so if input stops, stream time also stops.

```text
Stream time progress:

Record arrival order:
  ts=00:02 -> stream time = 00:02
  ts=00:07 -> stream time = 00:07  (window [00:00, 00:05) starts closing)
  ts=00:04 -> late record, included in [00:00, 00:05) if still within the grace period
  ts=00:08 -> stream time = 00:08  (grace period exceeded, records like ts=00:04 are now dropped)
```

If Grace Period is zero, as with `ofSizeWithNoGrace`, Kafka Streams rejects late records as soon as the window closes.
If data correctness matters, a longer grace period is safer, but the trade-off is a longer State Store retention window.

<br>

# State Store and Retention in Windowed Operations

Windowed operations store aggregation state for each window in a State Store.
As time passes, old windows are no longer useful, so the application needs cleanup to prevent the State Store from growing without bound.

Kafka Streams exposes **retention** for window State Stores.
With `Materialized.withRetention`, the application can delete window data automatically after a chosen period.

```java
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.state.WindowBytesStoreSupplier;
import org.apache.kafka.streams.state.Stores;

KTable<Windowed<String>, Long> windowedCount = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count(
        Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("order-window-store")
            .withRetention(Duration.ofHours(1))
    );
```

`withRetention(Duration.ofHours(1))` removes window data older than one hour from the State Store.
Retention must be greater than or equal to window size plus grace period. Otherwise, data from still-open windows can be deleted and Kafka Streams throws an exception.
This retention value also affects the internal changelog topic's `retention.ms`, so it influences how long recovery takes when Kafka Streams rebuilds the State Store after a failure.

When the State Store becomes too large in production, the following checklist is useful.

```text
Checklist:
  - Is the window size larger than the actual requirement?
  - Is the grace period longer than necessary?
  - Is retention longer than necessary?
  - Is key cardinality too high in the input topic?
    (More unique keys make the State Store larger)
```

The next post, <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">Kafka Streams Error Handling and Recovery Strategies</a>, covers operational topics such as `state.dir` placement and using standby replicas to shorten recovery time.

<br>

# How to Choose a Window Type

The characteristics of each window type can be compared as follows.

| Window Type | Size | Overlap | Record Membership | Best Fit |
|----------|------|---------|-------------------|----------|
| Tumbling | Fixed | None | Exactly one window | Periodic aggregates by minute, hour, or day |
| Hopping  | Fixed | Yes (`size > advance`) | Duplicated across multiple windows | Moving averages, sliding statistics |
| Session  | Dynamic (based on inactivity gap) | None (per key) | Changes with activity duration | User sessions, activity-based analysis |

The window choice changes State Store size, the number of output records, and the way the application handles late events.
If the advance interval of a hopping window is too small, output record count rises quickly. Session windows can also make aggregation logic more complex because sessions can merge.
Before production rollout, it is safer to estimate State Store size in advance using expected input volume and key cardinality.

<br>

# Up Next

This post covered how each window type works, along with time-based KStream-KStream joins and Grace Period.
The next post moves to practical recovery topics such as deserialization failures, producer exceptions, and unexpected thread shutdowns in Kafka Streams.

- <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">Next post: Kafka Streams Error Handling and Recovery Strategies</a>

<br>

# References
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/dsl-api#windowing" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams DSL: Windowing</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/streams/kstream/TimeWindows.html" target="_blank" rel="nofollow">Apache Kafka 3.4 Javadoc - TimeWindows</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/streams/kstream/JoinWindows.html" target="_blank" rel="nofollow">Apache Kafka 3.4 Javadoc - JoinWindows</a>
