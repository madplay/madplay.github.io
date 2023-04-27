---
layout: post
title: "Why Kafka Consumer Rebalancing Happens"
author: madplay
tags: kafka consumer rebalancing deployment
description: "A production-focused guide to Kafka consumer rebalancing: causes, deployment lag spikes, duplicate processing, and scale-out checkpoints."
category: Backend
date: "2023-04-26 21:03:12"
comments: true
lang: en
slug: kafka-consumer-rebalancing
permalink: /en/post/kafka-consumer-rebalancing
---

# Why Rebalancing Looks Like a Deployment Incident

> Rebalancing is normal behavior, not a failure. It appears as a failure when timing and readiness are poor.

Rebalancing is the normal process of recalculating and redistributing partition assignments in a consumer group.
In production, teams often notice lag spikes during deployment before they notice throughput tuning opportunities.
The reason is simple: assignment release and reassignment create a short processing gap.
That gap appears as a `lag` spike and can look like an outage when unprepared.

<br>

# When Unintended Rebalancing Happens

Rebalancing occurs when group membership changes or when brokers treat a member as unhealthy.

- A new consumer instance joins the group.
- An existing consumer instance terminates or fails.
- Polling is delayed beyond `max.poll.interval.ms`.
- Heartbeats are interrupted and exceed `session.timeout.ms`.

You cannot eliminate rebalancing.
You can design your system so delay and duplicate processing impact stay bounded when it happens.

<br>

# Eager vs Cooperative: Reducing Partition Movement Impact

The default eager strategy releases all assignments first, then redistributes.
It is simple but can move many partitions at once.

The cooperative strategy (`CooperativeStickyAssignor`) moves only required partitions gradually.
In rolling deployments or environments with frequent instance churn, this approach often reduces latency spikes.

## Example `consumer.properties`

```properties
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

Default assignor configuration can differ by Kafka client version.
Verify version-specific defaults first.
Some newer versions include cooperative assignors in default strategy lists, but many teams pin explicit values for operational consistency.

<br>

# Reducing Reassignment with Static Membership

In rolling deployments, instances often go down briefly and return.
If `group.instance.id` is set, brokers can treat the returning instance as the same member and reduce unnecessary reassignment.

```yaml
spring:
  kafka:
    consumer:
      properties:
        group.instance.id: order-worker-${HOSTNAME}
```

The main risk is ID collision.
If two instances start with the same `group.instance.id`, errors occur.
Inject unique values such as hostname or pod name from deployment automation.

In environments where pod names change on every restart (for example, Kubernetes Deployment), `${HOSTNAME}` may change too often.
In such cases, stable identity models (for example, StatefulSet) or a fixed-ID strategy aligned with instance lifecycle are more effective.

> In environments where `${HOSTNAME}` changes every restart, static membership benefits can be smaller than expected.

<br>

# Timeout Design to Reduce Poll Delay

Many rebalancing issues start when processing gets long and poll cadence breaks.
External API calls, slow DB I/O, and large batch operations are common causes.

```java

@KafkaListener(topics = "order-events", groupId = "order-worker-group")
public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
	long startedAt = System.currentTimeMillis();
	OrderEvent event = record.value();

	try {
		paymentService.processWithTimeout(event); // It is safer to use timeouts for external calls.
		ack.acknowledge();

		log.info("consume success. key={}, partition={}, offset={}, orderId={}, elapsedMs={}",
			record.key(),
			record.partition(),
			record.offset(),
			event.getOrderId(),
			System.currentTimeMillis() - startedAt);
	} catch (SocketTimeoutException transientError) {
		log.warn("transient error. key={}, partition={}, offset={}, orderId={}",
			record.key(), record.partition(), record.offset(), event.getOrderId(), transientError);
		throw transientError;
	} catch (Exception permanentError) {
		log.error("permanent error. key={}, partition={}, offset={}, orderId={}",
			record.key(), record.partition(), record.offset(), event.getOrderId(), permanentError);
		throw permanentError;
	}
}
```

`AckMode.MANUAL` or `MANUAL_IMMEDIATE` gives explicit commit control at success points.
Because manual commits are sensitive to coding mistakes, tests should verify both duplicate and missing-processing scenarios.

<br>

# Settings That Reduce Delay in Rolling Deployments

A practical sequence used in production:

1. Measure consumer processing time and set realistic `max.poll.interval.ms`.
2. Tune heartbeat-related values without large deviations from defaults.
3. Avoid replacing too many instances at once during rolling deployment.
4. Add a short drain period before consumer shutdown.

In Spring, you can configure listener behavior to support controlled shutdown.

```yaml
spring:
  kafka:
    listener:
      ack-mode: manual
      missing-topics-fatal: false
```

```java

@PreDestroy
public void onShutdown() {
	log.info("consumer shutting down. drain in progress");
}
```

From a performance standpoint, large partition movement in one step causes the biggest delays.
That is why the combination of cooperative assignor and static membership is frequently used for deployment stabilization.

<br>

# Idempotency with Duplicate Delivery as a Baseline

> Idempotency means repeated processing of the same message yields the same final result as a single processing.

During rebalancing, the same message can be delivered again depending on commit boundaries.
Treat this as a normal scenario, not an exceptional one.

```java

@Transactional
public void processWithIdempotency(OrderEvent event) {
	String idempotencyKey = event.getOrderId() + ":" + event.getEventType();

	try {
		processedEventRepository.save(new ProcessedEvent(idempotencyKey));
	} catch (DataIntegrityViolationException alreadyProcessed) {
		log.info("already processed. idempotencyKey={}", idempotencyKey);
		return;
	}

	paymentGatewayClient.charge(event);
}
```

Allow duplicate delivery but enforce single-effect application. This is the most predictable structure under rebalancing.

<br>

# Operational Steps for Partition Expansion

Partition expansion itself is simple, but operational planning must include rebalancing impact.
A common staged process:

1. Collect baseline before expansion: lag, throughput, average processing time, rebalance count
2. Apply a small increase first during off-peak (for example, +20 to 30%)
3. Monitor reassignment behavior and lag spikes in real time
4. Expand further in phases if stable

```text
Operational observation points
- rebalance duration
- consumer lag(max/avg)
- processing success rate and retry rate
- external I/O timeout ratio
```

Large one-shot expansion increases rebalancing shock, so smaller phases are safer.

<br>

# Partitions Cannot Be Reduced: Rollback and Migration
> Because direct partition reduction is not supported, practical rollback must be designed as topic transition.

Before expansion, define rollback triggers.
For example, start rollback if any condition persists beyond a threshold window:

- Rebalance duration increases significantly over baseline
- Lag stays above threshold for a prolonged period
- Timeout/failure rate exceeds critical threshold

Direct partition reduction is not supported.
Rollback must be designed as either traffic return to an existing topic or migration to a new topic with a smaller partition count.

```text
Direct partition reduction: not supported
Recommended rollback: create a new topic and migrate gradually
```

Idempotency is mandatory during rollback too, because duplicate delivery likelihood increases during transition.

<br>

# Operational Summary
Rebalancing is a recurring event during deployment and failure recovery.
The goal is not to eliminate rebalancing. The goal is to limit its impact when it occurs.

The items below are recommendations that work best when applied together.

- **Minimize partition movement**: Use cooperative assignor plus static membership to reduce unnecessary reassignment.
- **Optimize delay windows**: Keep processing within `max.poll.interval.ms`; tune `max.poll.records` if needed.
- **Absorb duplicate delivery**: Handle duplicates with idempotency boundaries such as DB unique keys.
- **Integrate monitoring**: Track `lag`, rebalance frequency, rebalance duration, and failure rate on one dashboard.

<br>

# References

- <a href="https://kafka.apache.org/documentation/#consumerconfigs" target="_blank" rel="nofollow">Apache Kafka Documentation - Consumer Configs</a>
- <a href="https://kafka.apache.org/documentation/#upgrade_34_notable" target="_blank" rel="nofollow">Apache Kafka Documentation - Upgrade Notes</a>
- <a href="https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html" target="_blank" rel="nofollow">
  Spring for Apache Kafka - Listener Container</a>
