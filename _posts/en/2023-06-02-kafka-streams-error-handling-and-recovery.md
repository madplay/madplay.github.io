---
layout: post
title: "Kafka Streams Error Handling and Recovery Strategies"
author: madplay
tags: kafka streams exception-handler state-store recovery
description: "Covers the handler architecture that processes deserialization, production, and business-logic errors in Kafka Streams, along with State Store recovery strategies."
category: Backend
lang: en
slug: kafka-streams-error-handling-and-recovery
permalink: /en/post/kafka-streams-error-handling-and-recovery
date: "2023-06-02 21:03:55"
comments: true
---

# Kafka Streams Series
- <a href="/en/post/kafka-streams-concepts-and-architecture" target="_blank" rel="nofollow">1. Kafka Streams Concepts and Architecture</a>
- <a href="/en/post/kafka-streams-kstream-and-ktable" target="_blank" rel="nofollow">2. Kafka Streams KStream and KTable</a>
- <a href="/en/post/kafka-streams-windowing-and-joins" target="_blank" rel="nofollow">3. Kafka Streams Windows and Joins</a>
- **4. Kafka Streams Error Handling and Recovery Strategies**

<br>

# Three Places Where Errors Occur

When a Kafka Streams application runs in production, alerts sometimes report that "the stream stopped unexpectedly."
In many cases, the root cause is a single malformed record that terminates the entire stream thread.
It is similar to deciding in advance whether an assembly line should stop completely when one out-of-spec part appears, or whether the system should remove only that part and continue.

Errors usually occur in three places:
the stage that deserializes records from the input topic, the stage that runs business logic inside the topology, and the stage that writes the result to the output topic.
Kafka Streams provides a dedicated handler for each stage. If the application does not separate which error belongs to which stage, one deserialization failure can stop the entire stream thread.

<br>

# `DeserializationExceptionHandler`

This handler processes exceptions that occur while Kafka Streams reads and deserializes records from an input topic.
Typical cases include schema changes and malformed messages.

Kafka Streams provides two built-in implementations.

| Implementation | Behavior |
|------------------------------------|---------------------------|
| `LogAndFailExceptionHandler` (default) | Logs the exception and stops the stream thread |
| `LogAndContinueExceptionHandler`   | Logs the exception and skips the record |

```java
import org.apache.kafka.streams.StreamsConfig;

props.put(
    StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
    "org.apache.kafka.streams.errors.LogAndContinueExceptionHandler"
);
```

The default, `LogAndFailExceptionHandler`, is safe but can stop the whole stream because of a single bad record.
In production, teams often prefer `LogAndContinueExceptionHandler` or a custom handler.

What if the application wants to send the malformed record to a Dead Letter Topic instead of simply skipping it?

> The example below targets Kafka 3.4. Later versions can change method signatures, so it is better to verify the Javadoc for the version currently in use.

```java
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.streams.errors.DeserializationExceptionHandler;
import org.apache.kafka.streams.processor.ProcessorContext;

import java.util.Map;

public class DltDeserializationExceptionHandler
    implements DeserializationExceptionHandler {

    private KafkaProducer<byte[], byte[]> dltProducer;

    @Override
    public void configure(Map<String, ?> configs) {
        dltProducer =
            new KafkaProducer<>(createDltProducerProps(configs));
    }

    @Override
    public DeserializationHandlerResponse handle(
            ProcessorContext context,
            ConsumerRecord<byte[], byte[]> record,
            Exception exception) {

        String dltTopic =
            record.topic() + "-deserialization-dlt";

        dltProducer.send(
            new ProducerRecord<>(
                dltTopic, record.key(), record.value()),
            (metadata, ex) -> {
                if (ex != null) {
                    log.error(
                        "DLT send failed. srcTopic={},"
                            + " partition={}, offset={}",
                        record.topic(),
                        record.partition(),
                        record.offset(), ex);
                }
            }
        );

        log.warn(
            "deserialization failed, sent to DLT."
                + " topic={}, partition={}, offset={}",
            record.topic(),
            record.partition(),
            record.offset(), exception);

        return DeserializationHandlerResponse.CONTINUE;
    }

    @Override
    public void close() {
        if (dltProducer != null) {
            dltProducer.close();
        }
    }

    private Map<String, Object> createDltProducerProps(
            Map<String, ?> configs) {
        // Extract required settings such as bootstrap.servers and pass them to `Map.of()`
        return Map.of();
    }
}
```

Because `send()` is asynchronous, the DLT write may not be complete when the handler returns `CONTINUE`.
In production, this part also needs `acks`, retry policy for send failures, and failure metrics.

```java
props.put(
    StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
    DltDeserializationExceptionHandler.class.getName()
);
```

Even if the DLT send fails, logs should still record the source topic, partition, and offset of the original record so the failure remains traceable.

<br>

# `ProductionExceptionHandler`

This handler processes exceptions that occur while Kafka Streams writes processed results to the output topic.
Typical cases include a record size that exceeds `max.message.bytes` or a serialization failure during output.

The application implements `ProductionExceptionHandler`.
Its return value is either `CONTINUE` to skip the record or `FAIL` to stop the stream.

```java
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.RecordTooLargeException;
import org.apache.kafka.streams.errors.ProductionExceptionHandler;

import java.util.Map;

public class CustomProductionExceptionHandler
    implements ProductionExceptionHandler {

    @Override
    public void configure(Map<String, ?> configs) {
        // Configure if needed
    }

    @Override
    public ProductionExceptionHandlerResponse handle(
            ProducerRecord<byte[], byte[]> record,
            Exception exception) {

        if (exception instanceof RecordTooLargeException) {
            log.warn(
                "record too large, skipping."
                    + " topic={}, key={}",
                record.topic(),
                record.key() != null ? new String(record.key()) : "null",
                exception);
            return ProductionExceptionHandlerResponse.CONTINUE;
        }

        log.error(
            "production failed. topic={}, key={}",
            record.topic(),
            new String(record.key()), exception);
        return ProductionExceptionHandlerResponse.FAIL;
    }

    @Override
    public void close() {
        // Clean up resources
    }
}
```

```java
props.put(
    StreamsConfig.DEFAULT_PRODUCTION_EXCEPTION_HANDLER_CLASS_CONFIG,
    CustomProductionExceptionHandler.class.getName()
);
```

If the handler returns `CONTINUE`, Kafka Streams skips the failed record without writing it to the output topic, so the application must verify that this level of data loss is acceptable.
In production, a common pattern is to return `CONTINUE` while also writing the failed record to a DLT.

<br>

# `StreamsUncaughtExceptionHandler`

Exceptions that happen outside deserialization and production, in other words inside business logic in the topology, are handled by `StreamsUncaughtExceptionHandler`.

This handler was introduced in Kafka 2.8 in 2021 through KIP-671. When an uncaught exception occurs inside a stream thread, the handler can choose one of three actions.

| Return Value | Behavior |
|-------|------|
| `REPLACE_THREAD` | Replaces the failed stream thread with a new one |
| `SHUTDOWN_CLIENT` | Stops the current `KafkaStreams` instance |
| `SHUTDOWN_APPLICATION` | Propagates shutdown to all instances with the same `application.id` |

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.errors.StreamsUncaughtExceptionHandler;

KafkaStreams streams = new KafkaStreams(topology, props);

streams.setUncaughtExceptionHandler(exception -> {
    if (exception instanceof IllegalStateException) {
        log.error(
            "unrecoverable error, shutting down client",
            exception);
        return StreamsUncaughtExceptionHandler
            .StreamThreadExceptionResponse.SHUTDOWN_CLIENT;
    }

    log.warn("transient error, replacing thread", exception);
    return StreamsUncaughtExceptionHandler
        .StreamThreadExceptionResponse.REPLACE_THREAD;
});

streams.start();
```

`REPLACE_THREAD` is useful when the service wants to keep the stream alive through temporary errors such as an external API timeout.
But if the same exception repeats, Kafka Streams can keep replacing the thread and rebalancing repeatedly, so it is safer to put an upper bound on replacements.

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger replaceCount = new AtomicInteger(0);

streams.setUncaughtExceptionHandler(exception -> {
    if (replaceCount.incrementAndGet() > 3) {
        log.error(
            "thread replacement limit exceeded,"
                + " shutting down",
            exception);
        return StreamsUncaughtExceptionHandler
            .StreamThreadExceptionResponse.SHUTDOWN_CLIENT;
    }

    log.warn(
        "replacing thread. attempt={}",
        replaceCount.get(), exception);
    return StreamsUncaughtExceptionHandler
        .StreamThreadExceptionResponse.REPLACE_THREAD;
});
```

<br>

# Stream State Transitions and Monitoring

`KafkaStreams` instances internally use a state machine. Understanding those state transitions helps interpret what the handlers are doing.

An instance starts at `CREATED`, moves through `REBALANCING`, and reaches `RUNNING`.
If a stream thread is replaced while the instance is running, the instance passes through `REBALANCING` and returns to `RUNNING`. If an unrecoverable error occurs, it transitions to `ERROR`.
Whether shutdown is normal or caused by an error, the instance finally passes through `PENDING_SHUTDOWN` and reaches `NOT_RUNNING`.

Registering `KafkaStreams.StateListener` makes it possible to observe those changes.

```java
streams.setStateListener((newState, oldState) -> {
    log.info(
        "streams state changed. old={}, new={}",
        oldState, newState);

    if (newState == KafkaStreams.State.ERROR) {
        log.error(
            "streams entered ERROR state,"
                + " alerting operations team");
        alertService.notify(
            "Kafka Streams ERROR: " + streams.toString());
    }
});
```

If an error occurs during processing in the `RUNNING` state, the instance transitions to `REBALANCING` or `ERROR`.
When the application chooses `REPLACE_THREAD`, the instance returns to `RUNNING` after rebalancing.
When it chooses `SHUTDOWN_CLIENT`, the instance transitions through `PENDING_SHUTDOWN` to `NOT_RUNNING`, and an external process manager such as systemd or Kubernetes needs to restart it.

<br>

# State Store Recovery and Standby Replicas

When a Kafka Streams instance fails and restarts, it must rebuild the task's State Store from the changelog topic.
If recovery takes too long, processing remains paused until rebalancing finishes.

## Standby Replica

One way to shorten recovery time is a **standby replica**.
If `num.standby.replicas` is 1 or higher, another instance continuously consumes the changelog topic and keeps a replica of the task's State Store.

```java
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
```

For example, if instance A actively processes Task 0 and instance B keeps a standby copy of Task 0, then a failure in instance A causes Kafka Streams to reassign Task 0 to instance B.
Because only the changes since the last synchronization need to catch up, recovery becomes much faster.
The trade-off is additional disk and network cost, so the service needs to balance those resources against State Store size and changelog volume.

## `state.dir`

The local directory that stores the State Store is configured with `state.dir`, which defaults to `/tmp/kafka-streams`.
In production, a persistent disk path is safer. If local files remain after a host restart, Kafka Streams does not always need a full rebuild from the changelog.

```java
props.put(StreamsConfig.STATE_DIR_CONFIG, "/data/kafka-streams");
```

<br>

# Error Handling Configuration Summary

The main handler-related settings can be summarized like this.

```properties
# Deserialization error handler
default.deserialization.exception.handler=\
  org.apache.kafka.streams.errors.LogAndContinueExceptionHandler

# Production error handler
default.production.exception.handler=\
  org.apache.kafka.streams.errors.DefaultProductionExceptionHandler

# State Store recovery
num.standby.replicas=1
state.dir=/data/kafka-streams
```

`StreamsUncaughtExceptionHandler` is not configured in properties. It is registered in code with `KafkaStreams.setUncaughtExceptionHandler()`.

| Error Point | Handler | Configuration Style |
|----------|--------|----------|
| Deserialization | `DeserializationExceptionHandler` | `StreamsConfig` property |
| Business logic | `StreamsUncaughtExceptionHandler` | Registered in code |
| Output production | `ProductionExceptionHandler` | `StreamsConfig` property |

<br>

# References
- <a href="https://kafka.apache.org/34/documentation/streams/developer-guide/config-streams" target="_blank" rel="nofollow">Apache Kafka 3.4 - Configuring a Streams Application</a>
- <a href="https://cwiki.apache.org/confluence/display/KAFKA/KIP-671%3A+Introduce+Kafka+Streams+Specific+Uncaught+Exception+Handler" target="_blank" rel="nofollow">KIP-671: Introduce Kafka Streams Specific Uncaught Exception Handler</a>
