---
layout: post
title: "Kafka Consumer Reprocessing Strategies"
author: madplay
tags: kafka consumer retry dlt
description: "A code-focused guide to common Kafka consumer reprocessing patterns and how to choose among them."
category: Backend
date: "2023-01-05 21:40:00"
comments: true
lang: en
slug: kafka-consumer-reprocessing-methods
permalink: /en/post/kafka-consumer-reprocessing-methods
---

# Designing Reliable Kafka Consumer Reprocessing

Systems using message brokers must account for failures at the consumer level.
Transient issues like network latency, DB lock contention, and malformed data can all cause processing failures.
System reliability is defined by how you handle these failures: whether you log and drop the message or implement a
robust retry mechanism.

Because Kafka manages topic offsets, unconstrained retries can significantly degrade throughput or trigger disruptive
consumer group rebalances.
A well-defined reprocessing strategy, tailored to your service requirements, is essential.

<br>

# Failure Classification Criteria

Before implementing a retry, determine if the error is recoverable.
In production, we typically classify failures into two categories:

- **Transient Errors**: Resolvable issues such as network timeouts, connection pool exhaustion, or DB lock contention.
- **Permanent Errors**: Logic or data issues that will fail regardless of retries, such as NPEs, schema mismatches, or
  permission errors.

<br>

This distinction prevents resource waste on non-recoverable errors.
Encapsulating this logic in a dedicated classifier is a recommended pattern:

```java
public enum FailureType {
	TRANSIENT,
	PERMANENT
}

/**
 * Classifies whether reprocessing is possible based on the thrown exception.
 */
public final class OrderEventFailureClassifier {
	public FailureType classify(Exception e) {
		// Classify temporary network issues and lock contention as retryable.
		if (e instanceof java.net.SocketTimeoutException ||
			e instanceof org.springframework.dao.CannotAcquireLockException) {
			return FailureType.TRANSIENT;
		}
		// Treat other issues such as business logic errors as permanent failures.
		return FailureType.PERMANENT;
	}
}
```

> This classification approach aligns
> with <a href="https://www.uber.com/blog/reliable-reprocessing/" target="_blank" rel="nofollow">principles used by Uber
> Engineering when designing large-scale Kafka reprocessing systems</a>.

When logging failures, always include business identifiers (`orderId`, etc.) with `topic`, `partition`, `offset`, and
`key` for later traceability.

<br>

# Method 1: Short Retries Inside the Consumer

The simplest option is a short-interval retry inside the listener using a `for` loop or a retry library.
This is efficient for handling temporary failures in external systems.

Register `OrderEventFailureClassifier` as a bean and inject it into the consumer.

```java

@Component
public class OrderEventConsumer {

	private final PaymentService paymentService;
	private final OrderEventFailureClassifier classifier;

	public OrderEventConsumer(PaymentService paymentService, OrderEventFailureClassifier classifier) {
		this.paymentService = paymentService;
		this.classifier = classifier;
	}

	@KafkaListener(topics = "order-events", groupId = "order-payment-group")
	public void consume(ConsumerRecord<String, OrderEvent> record) {
		OrderEvent event = record.value();

		for (int attempt = 1; attempt <= 3; attempt++) {
			try {
				paymentService.process(event); // Idempotency must be guaranteed.
				return;
			} catch (Exception ex) {
				FailureType type = classifier.classify(ex);
				log.warn("Attempt failed. attempt={}, orderId={}, type={}", attempt, event.getOrderId(), type);

				if (type == FailureType.PERMANENT || attempt == 3) {
					throw ex; // Delegate to the error handler on final failure.
				}

				backoff(attempt);
			}
		}
	}

	// Exponential backoff: increase wait time by retry attempt.
	private void backoff(int attempt) {
		try {
			Thread.sleep(1000L * attempt);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}
}
```

This approach is simple, but the consumer thread is occupied during retry wait time.
If the wait becomes too long, it can exceed `max.poll.interval.ms`, and the broker can mark the consumer as unhealthy
and trigger rebalancing.

<br>

# Method 2: Asynchronous Reprocessing with Retry Topic and DLT

For failures that do not recover immediately, send the message to a separate topic and process it later.
This keeps main traffic throughput stable while isolating error cases.

With Spring Kafka, `@RetryableTopic` makes this straightforward.

```java

@RetryableTopic(
	attempts = "4",          // 1 initial attempt + 3 retries = 4 total attempts
	backoff = @Backoff(delay = 1000, multiplier = 2.0),
	include = {java.net.SocketTimeoutException.class}, // Retry only this exception type
	dltTopicSuffix = "-dlt"
)
@KafkaListener(topics = "order-events")
public void handleOrder(OrderEvent event) {
	paymentService.process(event);
}

@DltHandler
public void handleDlt(OrderEvent event, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
	log.error("Message moved to DLT. topic={}, orderId={}", topic, event.getOrderId());
}
```

`attempts` includes the first processing attempt. With `attempts = "4"`, processing runs once initially and then retries
three times.
Only exceptions listed in `include` are treated as retryable. Other exceptions move directly to DLT without retry.

This configuration creates internal retry topics with the `-retry` suffix for delayed processing.
If all retries fail, the message moves to `-dlt` (Dead Letter Topic), where operators analyze failure cases.

<br>

# Why Idempotency and Timeouts Are Mandatory

In any reprocessing strategy, **idempotency** is non-negotiable.
Even if a message is delivered twice, the effect must be applied once. In practice, teams commonly use DB unique keys or
distributed Redis locks to detect already-processed requests.

```java

@Transactional
public void process(OrderEvent event) {
	String idempotencyKey = event.getOrderId() + ":" + event.getEventType();

	try {
		/*
		 * Use a DB unique constraint to block duplicate processing.
		 * A race condition can occur between existsById and save,
		 * so if save throws DataIntegrityViolationException,
		 * treat the event as already processed and continue.
		 */
		processedRepository.save(new ProcessedEvent(idempotencyKey));
	} catch (DataIntegrityViolationException e) {
		log.info("Already processed event. idempotencyKey={}", idempotencyKey);
		return;
	}

	paymentClient.call(event);
}
```

Also, external calls without timeouts can block consumer threads indefinitely.
Idempotency and timeout configuration are not optional tuning points. They are baseline requirements.

<br>

# Choosing the Right Strategy

There is no universal answer for every case. Combine patterns based on operational capacity and business requirements.

1. **If fast recovery is critical**: apply short in-consumer retries first (1 to 3 retries).
2. **If throughput is critical**: move retry logic to separate retry topics for non-blocking handling.
3. **If data correction is required**: accumulate failures in DLT and run manual replay in operations.

For DLT replay, two common approaches are used. First, reset the DLT consumer group offset to a target point with
`kafka-consumer-groups.sh`.

```bash
# Reset DLT consumer group offset to earliest for full reprocessing
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group order-payment-group \
  --topic order-events-dlt \
  --reset-offsets --to-earliest --execute
```

Second, read messages from DLT and republish them to the original topic using Spring Kafka `KafkaTemplate`.
This option provides more flexibility, such as replaying specific messages only or republishing corrected data.

```java

@KafkaListener(topics = "order-events-dlt", groupId = "order-dlt-replayer")
public void replayFromDlt(ConsumerRecord<String, OrderEvent> record) {
	OrderEvent correctedEvent = correctIfNeeded(record.value());
	kafkaTemplate.send("order-events", record.key(), correctedEvent);
	log.info("Replayed from DLT. orderId={}", correctedEvent.getOrderId());
}
```

A senior-level design focus is not "retry everything." Define failure semantics clearly and place safeguards at each
stage.

<br>

# References

- <a href="https://docs.spring.io/spring-kafka/reference/retrytopic.html" target="_blank" rel="nofollow">Spring for
  Apache Kafka: Non-Blocking Retries and Dead Letter Topics</a>
