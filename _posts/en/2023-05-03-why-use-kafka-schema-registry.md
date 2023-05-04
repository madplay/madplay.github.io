---
layout: post
title: "What Is Kafka Schema Registry and Why Does It Matter?"
author: madplay
tags: kafka schema-registry avro compatibility
description: "What Kafka Schema Registry is, why teams need it, and what to check in production adoption."
category: Backend
date: "2023-05-03 19:46:05"
comments: true
lang: en
slug: why-use-kafka-schema-registry
permalink: /en/post/why-use-kafka-schema-registry
---

# What Is Schema Registry?
Schema Registry is a centralized store for registering and managing event schemas.
Producers send schema IDs with messages instead of embedding full schemas every time.
Consumers use the schema ID to fetch the schema and deserialize.
In practice, Schema Registry is both a storage mechanism and an operational control point that enforces compatibility policy across teams.

It helps validate schema evolution such as field addition and type changes before deployment, reducing runtime failures.
It is also useful when producer and consumer deployments are not synchronized, because policy-based compatibility governs change rollout.
The tradeoff is one more operational component: availability management, access control policy, and client-version alignment become required concerns.

<br>

# Why Schema Changes Become Deployment Issues
Without Schema Registry, deserialization failures frequently occur when producer and consumer deployment timing diverges.
For example, a producer adds a new field, but a consumer still reads with the old schema.
If schema changes are not managed with the same discipline as code changes, reprocessing cost can increase sharply.

Define where schemas are registered and which compatibility policy governs change before rollout begins.

<br>

# Problems Schema Registry Solves
Schema Registry centrally manages Avro, JSON Schema, and Protobuf schemas and validates compatibility.
Producers serialize using schema IDs rather than attaching full schema definitions to each message.
Consumers look up schemas by ID and deserialize.

```text
Producer -> Schema Registry(register/lookup schema) -> Kafka Topic
Consumer -> Kafka Topic(receive message with schema ID) -> Schema Registry(lookup schema)
```

This model gives two major benefits.

- Teams can enforce schema-change rules consistently.
- Deserialization failures can be reduced before production deployment.

<br>

# How to Choose Compatibility Mode
The first design decision is compatibility mode.
As of May 2023, teams commonly choose `BACKWARD` or `FULL_TRANSITIVE`.

- `BACKWARD`: new schema must read old data.
- `FORWARD`: old schema must read new data.
- `FULL`: both backward and forward compatibility must hold.
- `*_TRANSITIVE`: compare with all historical versions, not only the latest.

## Query Subject Compatibility
```bash
curl -s http://localhost:8081/config/order-events-value
```

## Change Compatibility
```bash
curl -X PUT \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{"compatibility":"BACKWARD"}' \
  http://localhost:8081/config/order-events-value
```

You can use different policies per subject.
Without a documented baseline, policy fragmentation occurs across teams.
Fix a domain-level default policy in documentation.

<br>

# Avro Schema Change Pattern
Below is a safe change example for an order-event schema.
Keep existing fields and add defaults for new fields.

```json
{
  "type": "record",
  "name": "OrderEvent",
  "namespace": "com.example.events",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "createdAt", "type": "long"},
    {"name": "source", "type": ["null", "string"], "default": null}
  ]
}
```

Deleting existing fields or adding required fields without defaults often fails compatibility validation.
Put this check in CI during build to reduce production mistakes.

<br>

# Serialization/Deserialization Configuration Checkpoints
Correct serializer/deserializer setup is mandatory for schema usage.
Below is a Spring Boot-based example.

```yaml
spring:
  kafka:
    properties:
      schema.registry.url: http://localhost:8081
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
      properties:
        acks: all
        enable.idempotence: true
        delivery.timeout.ms: 120000
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: io.confluent.kafka.serializers.KafkaAvroDeserializer
        specific.avro.reader: true
```

`enable.idempotence=true` helps reduce duplicate delivery risk during network retries.
Also review `delivery.timeout.ms` against service latency budgets instead of relying on defaults.

<br>

# Deployment Order and Error-Handling Design
A common schema-evolution incident is producer-first rollout where older consumers cannot read new fields.
Use this baseline order:

1. Register a compatible schema in Registry first.
2. Deploy consumers that can read the new schema.
3. Deploy producers after that.

Deserialization failures can occur before listener logic runs.
Handle them in container-level error handling.
This example routes deserialization errors to DLT and retries transient errors with bounded attempts.

```java
@Bean
public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
        kafkaTemplate,
        (record, ex) -> new TopicPartition(record.topic() + ".dlt", record.partition())
    );

    DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2));
    errorHandler.addNotRetryableExceptions(
        org.apache.kafka.common.errors.SerializationException.class,
        org.springframework.kafka.support.serializer.DeserializationException.class
    );
    return errorHandler;
}
```

```java
@KafkaListener(topics = "order-events-avro", groupId = "order-event-consumer")
public void consume(ConsumerRecord<String, OrderEvent> record) {
    OrderEvent event = record.value();

    log.info("consume start. key={}, partition={}, offset={}, orderId={}",
        record.key(), record.partition(), record.offset(), event.getOrderId());

    orderEventService.handle(event); // Business logic

    log.info("consume success. key={}, partition={}, offset={}, orderId={}",
        record.key(), record.partition(), record.offset(), event.getOrderId());
}
```

Deserialization failures are typically permanent errors, so DLT routing is often more efficient than unbounded retry.
Transient failures such as external API timeouts should use bounded retry and backoff.
From a performance perspective, monitor schema-lookup cache behavior, deserialization cost, and record-size growth together.

<br>

# Closing
With Schema Registry, schema changes stop depending on individual style and become team-managed operational rules.
To reduce rollout confusion, review these items together.

- Define domain-level default compatibility policy.
- Follow registration-first and consumer-first rollout order.
- Separate deserialization failures from transient failures and split processing paths.
- Observe DLT volume, retry rate, and latency metrics together.

This turns schema evolution from deployment risk into an operationally manageable process.

<br>

# References
- <a href="https://docs.confluent.io/platform/current/schema-registry/index.html" target="_blank" rel="nofollow">Confluent Schema Registry Documentation</a>
- <a href="https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html" target="_blank" rel="nofollow">Confluent Schema Evolution and Compatibility</a>
- <a href="https://avro.apache.org/docs/current/specification/" target="_blank" rel="nofollow">Apache Avro Specification</a>
