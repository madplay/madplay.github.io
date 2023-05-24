---
layout: post
title: "Kafka Streams KStream and KTable"
author: madplay
tags: kafka streams kstream ktable globalktable serdes
description: "Organizes why KStream and KTable interpret the same topic differently, and explains stateless and stateful operations, KStream-KTable joins, and Serdes configuration through code."
category: Backend
lang: en
slug: kafka-streams-kstream-and-ktable
permalink: /en/post/kafka-streams-kstream-and-ktable
date: "2023-05-21 19:35:08"
comments: true
---

# Kafka Streams Series
- <a href="/en/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams Concepts and Architecture</a>
- **2. Kafka Streams KStream and KTable**
- <a href="/en/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams Windows and Joins</a>
- <a href="/en/post/kafka-streams-error-handling-and-recovery" target="_blank" rel="nofollow">4. Kafka Streams Error Handling and Recovery Strategies</a>

<br>

# Events and State, Two Different Views

Consider a service that processes order events in an online store.
An event such as "user A ordered item X" is an independent fact every time it occurs. If the same user places two orders, two events accumulate.
By contrast, information such as "user A is currently GOLD" is the latest state, and each update replaces the previous value.

Kafka Streams expresses these two perspectives as **KStream** and **KTable**.

<br>

# KStream: An Unbounded Event Flow

KStream interprets every record in a topic as an independent event, or INSERT.
Even when multiple records share the same key, later values do not overwrite earlier ones. Every record remains meaningful.

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, String> orderStream = builder.stream("order-events");
```

Assume the following four records enter the `order-events` topic.

```text
key=user-A, value={"item":"X", "amount":15000}
key=user-B, value={"item":"Y", "amount":8000}
key=user-A, value={"item":"Z", "amount":22000}
key=user-B, value={"item":"W", "amount":5000}
```

KStream processes all four as independent events. Two records share the key `user-A`, but one does not replace the other.

<br>

# KTable: The Latest State per Key

KTable treats a new record for the same key as an **UPDATE**.
It keeps only the latest value per key, which makes it structurally similar to a database table.

```java
KTable<String, String> userGradeTable = builder.table("user-grades");
```

If the `user-grades` topic receives the following records in order:

```text
key=user-A, value="SILVER"
key=user-B, value="GOLD"
key=user-A, value="GOLD"
```

The final state of the KTable is `user-A=GOLD`, `user-B=GOLD`. The first value for `user-A`, `SILVER`, is replaced by `GOLD`.

What if the same topic is read as a KStream instead?
KStream processes all three records independently. It does not interpret them as "SILVER changed to GOLD." It treats them as three separate events.

Whether the same data should be viewed as a KStream or a KTable depends on the business meaning.

| Category      | KStream                     | KTable               |
|-------------|-----------------------------|----------------------|
| Record model | INSERT (independent events) | UPDATE (latest state) |
| Same key     | Keep every record           | Keep only the last value |
| State Store  | Not used by default (used in stateful operations) | Used |
| Best for     | Orders, clicks, logs        | User profiles, inventory, configuration values |

<br>

# When to Use KStream and KTable

KStream fits cases where every event must be processed. Data such as orders, click logs, and sensor readings stays meaningful record by record. Because each event is independent, the stream can pass through stateless operations such as filtering, transformation, and branching before the next step.

KTable fits cases where the application manages the latest state. User profiles, product inventory, and exchange rates are typical examples because an update makes the previous value obsolete. KTable keeps the latest value per key in a State Store, which makes it a good fit for reference data that needs real-time lookups.

The combination becomes powerful when the system needs to **attach the latest state to an event**. For example, when an order event arrives as a KStream, the application can attach the user's current grade from a KTable and apply grade-based discounts. With KStream alone, the service would need to query an external system for the grade every time. With KTable alone, it could not process the event flow itself. A KStream-KTable join combines event flow and current state inside Kafka without external calls.

<br>

# GlobalKTable: Replicating All Partitions Locally

KTable is partitioned. Instance A might store only partitions 0 and 1, while instance B stores only partitions 2 and 3.
Because of that, joining KStream and KTable requires the two topics to have the same partition count and to route the same key to the same partition. That constraint is called co-partitioning.

GlobalKTable removes that constraint. Every instance replicates **all partition data** from the topic locally.

```java
GlobalKTable<String, String> productTable = builder.globalTable("products");
```

GlobalKTable supports joins without co-partitioning and lets the application look up any key locally.
The trade-off is that every instance stores the full dataset, so memory and disk usage increase as the topic grows.
It fits reference data such as product catalogs, country codes, and exchange rates.

<br>

# Stateless Operations

Stateless operations produce a result by looking only at the current record. They do not need to remember earlier records, so they do not use a State Store.
These operations mostly appear on KStream, but `filter` and `mapValues` work in the same way on KTable as well.

## `filter`

Passes through only records that match a condition.

```java
KStream<String, OrderEvent> highValueOrders = orderStream
    .filter((key, event) -> event.getAmount() >= 10000);
```

## `map` and `mapValues`

Transforms the key and value of a record. `mapValues` keeps the key unchanged and transforms only the value, so it does not trigger repartitioning.

```java
// Keep the key and transform only the value
KStream<String, String> summaries = orderStream
    .mapValues(event -> event.getItem() + ":" + event.getAmount());

// Transform both key and value (can trigger repartitioning)
KStream<String, Integer> amountByItem = orderStream
    .map((key, event) -> KeyValue.pair(event.getItem(), event.getAmount()));
```

If `map` changes the key and a later step performs a key-based operation such as `groupByKey` or `join`, Kafka Streams creates an internal repartition topic and redistributes the data.
A repartition topic is an intermediate topic that writes records again so Kafka can place them in the correct partition for the new key.
If the key does not need to change, `mapValues` is usually better for performance.

When repartitioning happens, every record is serialized again with the new key, written to the repartition topic, read back, and then forwarded to the next processor.
That adds network I/O and disk I/O, and the repartition topic itself is created with the same partition count as the input topic, which also increases broker disk usage.
If `map`, `selectKey`, or `groupBy` changes the key and a key-based operation such as `groupByKey` or `join` follows, repartitioning can happen. If the key change is unnecessary, using `mapValues` and `groupByKey` is safer.

```java
// Repartition happens: selectKey changes the key before groupByKey
orderStream
    .selectKey((key, event) -> event.getItem())
    .groupByKey()
    .count();

// No repartition: keep the original key
orderStream
    .groupByKey()
    .count();
```

## `flatMapValues`

Expands one record into multiple values. The word split in the WordCount example from the previous post is the classic example.

```java
KStream<String, String> words = textLines
    .flatMapValues(line -> Arrays.asList(line.split("\\W+")));
```

## `branch`

Splits a stream into multiple branches based on conditions.

```java
@SuppressWarnings("unchecked")
KStream<String, OrderEvent>[] branches = orderStream.branch(
    (key, event) -> event.getAmount() >= 50000,  // [0] high-value orders
    (key, event) -> event.getAmount() >= 10000,   // [1] mid-value orders
    (key, event) -> true                           // [2] the rest
);

KStream<String, OrderEvent> premiumOrders = branches[0];
KStream<String, OrderEvent> standardOrders = branches[1];
KStream<String, OrderEvent> budgetOrders = branches[2];
```

`branch` evaluates conditions in order and routes a record to the first matching branch.
If the final condition is `(key, event) -> true`, it catches every record that does not match earlier conditions.
Because `branch` returns an array, its type safety is limited. Kafka 2.8 and later can replace it with `split().branch().defaultBranch()`.

<br>

# Stateful Operations

Stateful operations keep state across multiple records and accumulate results over time.
They store intermediate state in a State Store, which uses RocksDB by default, and record every change in a changelog topic for recovery.

If KStream records are grouped with `groupByKey` or `groupBy`, Kafka Streams returns `KGroupedStream`. Applying aggregations such as `count`, `reduce`, or `aggregate` then returns a KTable.

## `groupByKey` vs. `groupBy`

```java
// When the key stays unchanged (no repartition)
KGroupedStream<String, OrderEvent> groupedByUser = orderStream.groupByKey();

// When the key changes (repartition happens)
KGroupedStream<String, OrderEvent> groupedByItem = orderStream
    .groupBy((key, event) -> event.getItem());
```

`groupByKey` uses the current key. If upstream processing kept the original key, repartitioning does not happen. But if the key was already changed by `selectKey` or `map`, `groupByKey()` also needs an internal repartition.
`groupBy` defines a new key explicitly, so Kafka Streams creates a repartition topic.
When possible, `groupByKey` reduces network cost and processing latency.

## `count`

Counts the number of records per key. The result is returned as a KTable.

```java
KTable<String, Long> orderCountByUser = orderStream
    .groupByKey()
    .count();
```

## `reduce`

Combines two values of the same type into one. The aggregation result type must stay the same as the input record's value type.

```java
// Maximum order amount per user
KTable<String, OrderEvent> maxOrderByUser = orderStream
    .groupByKey()
    .reduce((aggValue, newValue) ->
        aggValue.getAmount() >= newValue.getAmount() ? aggValue : newValue
    );
```

## `aggregate`

`aggregate` is more flexible than `reduce`. It takes an initializer and an aggregator function, and the result type does not need to match the input type.

```java
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.kstream.Materialized;

KTable<String, Long> totalAmountByUser = orderStream
    .groupByKey()
    .aggregate(
        () -> 0L,  // Initial value
        (key, event, currentTotal) -> currentTotal + event.getAmount(),
        Materialized.with(Serdes.String(), Serdes.Long())
    );
```

`Materialized.with(...)` specifies the key and value Serdes for the State Store.
Because the result type differs from the input type (`OrderEvent` -> `Long`), the Serdes must be declared explicitly.

<br>

# KStream-KTable Join

Attaching user grade information from a KTable to order events in a KStream is a common production pattern.
A KStream-KTable join looks up the current KTable value for the same key and combines it with each stream record.

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);

KTable<String, String> userGrades = builder.table(
    "user-grades",
    Consumed.with(Serdes.String(), Serdes.String())
);

// Attach the user's grade to the order event
KStream<String, EnrichedOrder> enrichedOrders = orders.join(
    userGrades,
    (order, grade) -> new EnrichedOrder(
        order.getOrderId(),
        order.getItem(),
        order.getAmount(),
        grade  // Current grade from the KTable
    )
);

enrichedOrders.to("enriched-orders",
    Produced.with(Serdes.String(), enrichedOrderSerde));
```

For this join to work, the keys of `order-events` and `user-grades` must use the same rule, such as `userId`, and the topics must have the same partition count for co-partitioning.

KStream-KTable join uses **inner join** semantics by default. If the KTable does not contain the key, the stream record is excluded from the result.
If every order event must appear in the result, `leftJoin` is the right choice.

```java
KStream<String, EnrichedOrder> enrichedOrders = orders.leftJoin(
    userGrades,
    (order, grade) -> new EnrichedOrder(
        order.getOrderId(),
        order.getItem(),
        order.getAmount(),
        grade != null ? grade : "UNKNOWN"
    )
);
```

In `leftJoin`, `grade` is `null` when the KTable has no matching value.

If co-partitioning is the problem, GlobalKTable is an alternative.
When joining with GlobalKTable, the code specifies the join key explicitly with `KeyValueMapper`, so different partition counts still work.

```java
GlobalKTable<String, String> productTable = builder.globalTable("products");

KStream<String, EnrichedOrder> withProduct = orders.join(
    productTable,
    (orderKey, orderValue) -> orderValue.getItem(),  // Value that matches the key in the products topic
    (order, productInfo) -> new EnrichedOrder(order, productInfo)
);
```

<br>

# Intermediate KTable Updates and `suppress`

When the value of a key changes, KTable sends a change record to downstream processors.
In practice, Kafka Streams' Record Cache (`statestore.cache.max.bytes`, 10 MB by default) merges consecutive updates for the same key and typically forwards only the latest value when the cache flushes, so not every intermediate value always appears downstream.
Even so, depending on the cache flush cycle, a substantial number of intermediate updates can still be emitted.

For example, if `count()` computes word counts, every occurrence updates the count from 1 to 2 to 3 and so on, and intermediate results appear whenever the cache flushes.

That behavior becomes especially noisy in windowed aggregations. If thousands of records arrive within a 5-minute window, even cache compaction can still write many intermediate results to the output topic.
If only the final result matters, `suppress` helps.

```java
import org.apache.kafka.streams.kstream.Suppressed;
import org.apache.kafka.streams.kstream.TimeWindows;
import java.time.Duration;

KTable<Windowed<String>, Long> finalCounts = orders
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeAndGrace(
            Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count()
    .suppress(
        Suppressed.untilWindowCloses(
            Suppressed.BufferConfig.unbounded()));
```

`suppress(untilWindowCloses(unbounded()))` keeps intermediate results in a buffer until the window closes, then emits only one final result.

`unbounded()` means the buffer has no size limit. If key cardinality is high or windows stay open for a long time, buffer memory can grow significantly. If an upper bound is needed, the application can use a bounded buffer with `maxRecords` or `maxBytes`.

```java
Suppressed.BufferConfig
    .maxRecords(10000)
    .shutDownWhenFull()
```

`shutDownWhenFull()` stops the stream when the buffer is full, while `emitEarlyWhenFull()` keeps the stream running by emitting intermediate results early.

<br>

# Mixing the DSL and the Processor API

The previous post compared the Streams DSL and the Processor API. In most cases the DSL is enough, but some pipelines need direct State Store access or conditional routing in the middle of a DSL chain.

Using `process()` makes it possible to insert a Processor API `Processor` into a DSL chain.

```java
import org.apache.kafka.streams.processor.api.Processor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.KeyValueStore;

StoreBuilder<KeyValueStore<String, Long>> storeBuilder =
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("dedup-store"),
        Serdes.String(),
        Serdes.Long()
    );

builder.addStateStore(storeBuilder);

orderStream.process(() -> new Processor<
        String, OrderEvent, String, OrderEvent>() {

    private KeyValueStore<String, Long> store;
    private ProcessorContext<String, OrderEvent> context;

    @Override
    public void init(
            ProcessorContext<String, OrderEvent> ctx) {
        this.context = ctx;
        this.store = ctx.getStateStore("dedup-store");
    }

    @Override
    public void process(
            Record<String, OrderEvent> record) {
        String orderId = record.value().getOrderId();
        if (store.get(orderId) != null) {
            return;
        }
        store.put(orderId, record.timestamp());
        context.forward(record);
    }
}, "dedup-store");
```

This example filters duplicate records by order ID. The State Store remembers order IDs that the application has already processed, and a repeated ID is not forwarded downstream.
The final argument of `process()` must be the name of the State Store that the processor accesses.

<br>

# Serdes Configuration and Serialization

In Kafka Streams, **Serdes** handle serialization and deserialization of record keys and values.
`Serde` is a wrapper that combines a `Serializer` and a `Deserializer`, and Kafka Streams uses it at every input and output boundary.

Kafka Streams provides built-in Serdes such as `Serdes.String()`, `Serdes.Long()`, `Serdes.Integer()`, and `Serdes.ByteArray()`.
For custom formats such as JSON, the application usually needs a custom Serde.

```java
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serializer;

public class JsonSerde<T> implements Serde<T> {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Class<T> targetType;

    public JsonSerde(Class<T> targetType) {
        this.targetType = targetType;
    }

    @Override
    public Serializer<T> serializer() {
        return (topic, data) -> {
            try {
                return objectMapper.writeValueAsBytes(data);
            } catch (Exception e) {
                throw new SerializationException("JSON serialization failed. topic=" + topic, e);
            }
        };
    }

    @Override
    public Deserializer<T> deserializer() {
        return (topic, data) -> {
            try {
                return objectMapper.readValue(data, targetType);
            } catch (Exception e) {
                throw new SerializationException("JSON deserialization failed. topic=" + topic, e);
            }
        };
    }
}
```

When the stream uses this Serde, it passes it to `Consumed`, `Produced`, or `Materialized`.

```java
Serde<OrderEvent> orderEventSerde = new JsonSerde<>(OrderEvent.class);

KStream<String, OrderEvent> orders = builder.stream(
    "order-events",
    Consumed.with(Serdes.String(), orderEventSerde)
);
```

If no Serde is specified, Kafka Streams falls back to `DEFAULT_KEY_SERDE_CLASS_CONFIG` and `DEFAULT_VALUE_SERDE_CLASS_CONFIG` from `StreamsConfig`.
If the default Serdes do not match the actual data type, a `ClassCastException` appears at runtime, so it is safer to declare Serdes explicitly when types differ across operations.

That is especially important for stateful operations such as `aggregate` and `count`, where the result type changes. In those cases, `Materialized.with(...)` must declare the Serdes.
If the application omits them, serialization errors occur while Kafka Streams writes to or reads from the State Store.

<br>

# Up Next

This post covered the differences between KStream and KTable, stateless and stateful operations, joins, and Serdes configuration.
The next post explains windows that group data by time, including Tumbling, Hopping, and Session windows, along with KStream-KStream time joins and the grace period.

- <a href="/en/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">Next post: Kafka Streams Windows and Joins</a>

<br>

# References
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/dsl-api" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams DSL</a>
- <a href="https://kafka.apache.org/34/documentation/streams/concepts" target="_blank" rel="nofollow">Apache Kafka 3.4 - Streams Concepts</a>
