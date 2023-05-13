---
layout: post
title: "Kafka Error Handling and Dead Letter Topic Design"
author: madplay
tags: kafka spring-kafka error-handling dead-letter-topic dlt
description: "Covers Spring Kafka's error handler architecture, the internal behavior of ErrorHandlingDeserializer and DeadLetterPublishingRecoverer, and DLT topic design and replay strategies."
category: Backend
lang: en
slug: kafka-error-handling-and-dead-letter-topic
permalink: /en/post/kafka-error-handling-and-dead-letter-topic
date: "2023-05-06 14:22:37"
comments: true
---

# Dead Letter Topic and Error Handling

When a parcel cannot be delivered, it either returns to the sender or moves to a separate holding area.
Kafka consumers work in a similar way. When message processing fails, the consumer can either drop the message or isolate it in a separate topic for later inspection.
That "separate topic" is called a Dead Letter Topic (DLT).

<a href="/en/post/kafka-consumer-reprocessing-methods" target="_blank">Kafka Consumer Replay Methods</a>
looked at the flow that sends failed messages to a DLT with `@RetryableTopic` and `@DltHandler`.
But how does Spring Kafka classify errors and control retries internally?
And when a service operates DLT topics in production, how should it choose naming, partition count, and retention?

<br>

# Two Error Paths: Deserialization vs. Business Logic

Errors in a Kafka consumer usually fall into two stages.

The first is the **deserialization** stage. Schema mismatches, malformed formats, and encoding errors can occur while converting the byte array fetched from the broker into an object.
Because this failure happens before the listener method runs, a `try-catch` inside the listener cannot handle it.

The second is the **business logic** stage. Deserialization succeeds, but a later step fails because of a DB connection failure, an external API timeout, or a validation error.
At this stage, the exception propagates from inside the listener method.

So how does Spring Kafka distinguish and handle these two error types?

<br>

# Spring Kafka Error Handler Architecture

In Spring Kafka 3.0, the entry point for error handling is the `CommonErrorHandler` interface.
The older `ErrorHandler` and `BatchErrorHandler` are deprecated, and `CommonErrorHandler` unifies both.

The default implementation of `CommonErrorHandler` is `DefaultErrorHandler`. Its class hierarchy looks like this.

```text
Object
  └─ KafkaExceptionLogLevelAware
       └─ ExceptionClassifier
            └─ FailedBatchProcessor
                 └─ DefaultErrorHandler  (implements CommonErrorHandler)
```

When message processing fails, `DefaultErrorHandler` seeks to the failed offset so the consumer reads the same message again.
A `BackOff` object controls retry count and interval. `BackOff` is a Spring utility interface that defines "how many times to retry, and at what interval."
After the final failure, it delegates follow-up handling to a `ConsumerRecordRecoverer`.

```java
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        // A recoverer that publishes to the DLT after the final failure
        DeadLetterPublishingRecoverer recoverer =
            new DeadLetterPublishingRecoverer(kafkaTemplate);

        // Retry up to 3 times at 1-second intervals, then delegate to the recoverer
        FixedBackOff backOff = new FixedBackOff(1000L, 3L);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
```

In `FixedBackOff(1000L, 3L)`, the second argument is the maximum retry count. The listener gets one initial attempt plus three retries. If all four attempts fail, `DeadLetterPublishingRecoverer` publishes the record to the DLT.

One detail matters here. `DefaultErrorHandler` retries synchronously inside the consumer thread.
If the retry interval grows too long, it can exceed `max.poll.interval.ms` and trigger rebalancing, so this approach fits a small number of short retries.

<br>

# Isolating Deserialization Failures with ErrorHandlingDeserializer

As explained earlier, deserialization failures happen before the listener runs. `ErrorHandlingDeserializer` exists to solve that problem.

`ErrorHandlingDeserializer` delegates the actual deserialization work to an internal delegate deserializer.
If the delegate throws an exception, `ErrorHandlingDeserializer` catches it, wraps it in a `DeserializationException`, and passes error metadata to the listener container through record headers.
The listener container inspects those headers and delegates handling to `CommonErrorHandler`, which means deserialization failures can also follow the `DefaultErrorHandler` -> `DeadLetterPublishingRecoverer` path.

```yaml
spring:
  kafka:
    consumer:
      key-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.key.delegate.class: org.apache.kafka.common.serialization.StringDeserializer
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
        spring.json.trusted.packages: "com.example.order.event"
```

Without `ErrorHandlingDeserializer`, a deserialization exception can make the consumer loop forever on the same offset, which creates the classic "poison pill" problem.
A poison pill is a broken message that blocks its offset and prevents the consumer from processing the valid messages behind it.
Because the message itself is malformed, reading it again produces the same exception every time.

With `ErrorHandlingDeserializer`, the consumer can send the broken message to the DLT and move to the next offset. In environments that use JSON- or Avro-based deserialization, enabling it by default is usually the safer choice.

<br>

# How DeadLetterPublishingRecoverer Works and Which Headers It Adds

When `DeadLetterPublishingRecoverer` publishes a failed record to the DLT, it preserves the original key and value and adds several headers.

```text
kafka_dlt-exception-fqcn     : Fully qualified class name of the exception
kafka_dlt-exception-message   : Exception message
kafka_dlt-exception-stacktrace: Stack trace
kafka_dlt-original-topic      : Original topic name
kafka_dlt-original-partition  : Original partition number
kafka_dlt-original-offset     : Original offset
kafka_dlt-original-timestamp  : Original timestamp
```

These headers make it possible to trace "which topic, which partition, which offset, and which exception caused the failure" when analyzing messages accumulated in the DLT.

By default, the DLT topic name is the original topic name plus the `-dlt` suffix. If the original topic is `order-events`, the DLT becomes `order-events-dlt`.
You can change this naming rule by passing `BiFunction<ConsumerRecord<?, ?>, Exception, TopicPartition>` to the `DeadLetterPublishingRecoverer` constructor.

```java
DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
    kafkaTemplate,
    (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition())
);
```

This code changes the suffix to `.DLT` and keeps the original record's partition number.
Keeping the partition number preserves the same ordering boundary on the DLT, which helps when replay logic depends on ordering.

<br>

# Exception Classification: Retry Candidates vs. Immediate DLT Candidates

Retrying every exception the same way is inefficient. Exceptions such as `NullPointerException` or `JsonParseException` do not change when retried, so sending them directly to the DLT is usually better.

`DefaultErrorHandler` extends `ExceptionClassifier`, so it can register non-retryable exceptions through `addNotRetryableExceptions`.

```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(kafkaTemplate);

    DefaultErrorHandler handler = new DefaultErrorHandler(
        recoverer, new FixedBackOff(1000L, 3L)
    );

    // Move these exceptions to the DLT immediately without retries
    handler.addNotRetryableExceptions(
        com.fasterxml.jackson.core.JsonParseException.class,
        org.springframework.messaging.converter.MessageConversionException.class
    );

    return handler;
}
```

When one of these exceptions occurs, `DefaultErrorHandler` ignores the `BackOff` and calls `DeadLetterPublishingRecoverer` immediately.
Conversely, `addRetryableExceptions` supports a whitelist approach that declares only the retryable exceptions.

Which approach works better depends on service characteristics. If many exception types exist and most do not deserve retries, a whitelist is easier to manage. If most exceptions are retryable and only a few must be excluded, a blacklist fits better.

<br>

# DLT Topic Design Checkpoints

If a DLT becomes nothing more than a "trash can for failed messages," later analysis and replay become difficult. The following design points matter in production.

## Topic Naming

A consistent naming rule makes it easy to monitor only DLT topics.
Because `-dlt` is Spring Kafka's default suffix, keeping it usually causes the least confusion unless there is a strong reason to change it.

## Partition Count

If the DLT uses the same partition count as the source topic, `DeadLetterPublishingRecoverer` can reuse the original partition number exactly as shown earlier.
But DLT traffic is usually much lower than source-topic traffic, so too many partitions can waste resources.
If the source topic has dozens of partitions, a smaller DLT partition count can make sense. In that case, the partition mapping function can use a modulo operation such as `record.partition() % dltPartitionCount`.

## Retention

DLT messages often need longer retention than source-topic messages because teams use them for analysis and replay.
For example, if the source topic keeps data for 7 days, the DLT might keep it for 30 days so the team still has time to identify the failure, ship the fix, and replay the data.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events-dlt \
  --alter --add-config retention.ms=2592000000
```

2592000000 milliseconds is 30 days.

## Monitoring

If messages start accumulating in the DLT, the consumer's error-handling path is active.
Monitoring DLT lag or the record growth rate helps detect incidents early.

```bash
# Check the current offsets and lag of the DLT topic
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-dlt-monitor-group \
  --describe
```

<br>

# DLT Replay Pipeline

How a service reprocesses messages accumulated in the DLT varies, but two approaches are common.

## Full Replay with Offset Reset

If you reset the offsets of a dedicated DLT consumer group, the group reads the messages in the DLT from the beginning again.
This approach works quickly in an emergency because it does not require code changes, but it reprocesses every message, so idempotency must be guaranteed.

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-dlt-replayer \
  --topic order-events-dlt \
  --reset-offsets --to-earliest --execute
```

## Selective Replay Consumer

Another option is to create a dedicated consumer that selects only specific messages, corrects them if necessary, and republishes them to the original topic. This is useful when the replay must modify the data or target only messages from a specific time range.

The following example assumes the message entered the DLT because business logic failed. If the record entered the DLT because deserialization failed, its value is raw bytes. In that case, it is safer to separate it into a `ConsumerRecord<String, byte[]>` consumer or branch on header exception metadata such as `DLT_EXCEPTION_FQCN`.

```java
@Component
public class DltReplayConsumer {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public DltReplayConsumer(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
        topics = "order-events-dlt",
        groupId = "order-dlt-selective-replayer"
    )
    public void replay(
        ConsumerRecord<String, OrderEvent> record,
        @Header(KafkaHeaders.DLT_ORIGINAL_TOPIC) String originalTopic
    ) {
        OrderEvent event = record.value();

        if (!isReplayTarget(event)) {
            log.info("skip replay. orderId={}", event.getOrderId());
            return;
        }

        OrderEvent corrected = correctIfNeeded(event);
        kafkaTemplate.send(originalTopic, record.key(), corrected);
        log.info("replayed to original topic. orderId={}, originalTopic={}",
            corrected.getOrderId(), originalTopic);
    }

    private boolean isReplayTarget(OrderEvent event) {
        // Replay target selection logic: specific error code, time range, and so on
        return event.getErrorCode() != null
            && event.getErrorCode().startsWith("TIMEOUT");
    }

    private OrderEvent correctIfNeeded(OrderEvent event) {
        // Handle data correction here when needed
        return event;
    }
}
```

`@Header(KafkaHeaders.DLT_ORIGINAL_TOPIC)` retrieves the original topic name so the corrected message goes back to the exact source topic.
It is also important to preserve the original key during republishing. Using `record.key()` keeps partition routing consistent.

This approach is flexible, but if the replay consumer itself fails, the system can end up needing a "DLT of the DLT."
For that reason, production systems often keep replay-consumer error handling simple and rely on logs and alerts for manual intervention when replay fails.

<br>

# References
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#error-handlers" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Error Handlers</a>
- <a href="https://docs.spring.io/spring-kafka/docs/3.0.0/reference/html/#dead-letters" target="_blank" rel="nofollow">Spring for Apache Kafka 3.0 - Publishing Dead-letter Records</a>
- <a href="https://kafka.apache.org/34/documentation/" target="_blank" rel="nofollow">Apache Kafka 3.4 Documentation</a>
