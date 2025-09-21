---
layout:   post
title:    Java Kafka Producer and Consumer configs Settings
author:   madplay
tags: 	  java kafka
description: Let's set configs for Kafka Producer and Kafka Consumer.
category: Java
comments: true
slug:     kafka-producer-consumer-options
lang:     en
permalink: /en/post/kafka-producer-consumer-options
---

# In the Previous Post
After installing zookeeper and going through the process of creating kafka topics,
implementing Kafka Producer and Kafka Consumer using Java Kafka API.

- <a href="/en/post/java-kafka-example" target="_blank">Previous Post: Java Kafka Producer and Consumer Example Implementation</a>

In this post, learning about options set when using producers and consumers.

<br><br>

# Kafka Producer configs Settings
- **bootstrap.servers**
  - Server information to connect to. You can list multiple like `host1:port1,host2:port2`.
  - Since it's used for initial connection, you don't need to include all server lists.
  Because when actually sending messages, new connections are made and then sent.
- **key.serializer, value.serializer**
  - Specify classes to use when serializing messages.
  - There are classes that implement `Serializer` like `ByteArraySerializer`, `StringSerializer`, etc.
- **partitioner.class**
  - Class that decides which partition to send messages to.
  - Default is `DefaultPartitioner`, which decides partitions to send to based on message key hash values.
- **acks**
  - Criteria for Kafka to process that it received messages sent by producers well.
  - Can be set to `0, 1, all` values, and each differs in message loss rate and transmission speed.
  - | Setting Value | Loss Rate | Speed | Description |
    |--------|--------|--------|--------|
    | acks = 0 | High | Fast | Producer doesn't wait for server confirmation<br/> and considers transmission successful when message sending ends. |
    | acks = 1 | Medium | Medium | Only checks if Kafka's leader received messages well. |
    | acks = all | Low | Slow | Checks if both Kafka's leader and follower received them. |
  - Default is the `acks=1` option.
- **buffer.memory**
  - Amount of memory that can be used for buffering records waiting to be sent to servers by producers.
  - If records are sent faster than they can be delivered to servers, records are not sent for `max.block.ms`.
  - Default is 33554432, about `33MB`.
- **retries**
  - Number of times producers retry when errors occur.
  - If set to a number greater than 0, it retries that many times when errors occur.
- **max.request.size**
  - Maximum byte size of requests. Can limit to prevent sending large requests.
  - Can also be set separately on Kafka servers, so values may differ.
- **connections.max.idle.ms**
  - Closes idle connections after the specified time.
- **max.block.ms**
  - Can set blocking time when buffers are full or metadata is unavailable.
- **request.timeout.ms**
  - Can set maximum time clients wait for request responses.
  - If responses aren't received before the set time, requests are resent or fail if retry count is exceeded.
- **retry.backoff.ms**
  - Time producers wait before retrying failed requests.
- **producer.type**
  - Can choose whether to send messages synchronously (sync) or asynchronously (async).
  - When using async, messages are accumulated for a certain time and then sent, so processing efficiency can be improved.

<br><br>

# Kafka Consumer configs Settings
- **group.id**
  - Unique ID that identifies consumer groups. It's different from topic names specified when sending messages.
  - Zookeeper manages message offsets for each group, and if group ids are the same, offset values are also shared.
- **bootstrap.servers**
  - Same as producer. Refers to connection information.
- **fetch.min.bytes**
  - Minimum data size that can be fetched at once.
  - In the case of default value 1, it means fetching immediately, and if it's larger than 1 or data is smaller than the set value,
  it waits without processing requests.
- **auto.offset.reset**
  - When Kafka has no initial offset or data doesn't exist currently because it was deleted, follows the settings below.
    - earliest : Automatically resets to the earliest offset.
    - latest : Automatically resets to the latest offset.
    - none : Throws exceptions to consumer groups if previous offsets aren't found.
    - anything else : Throws exceptions to consumers.
  - Default is set to `latest`.
- **session.timeout.ms**
  - Timeout used to detect consumer failures.
  - It's session timeout time with brokers, and when timeout occurs, consumers are terminated or recognized as failures, and
  brokers exclude that consumer from the group and attempt rebalancing.
  - For reference, consumers send signals (heartbeat) to brokers to show they're alive.
- **heartbeat.interval.ms**
  - Can set expected time of signals (heartbeat) that indicate being alive.
  - Can be usefully used for readjustment when new consumers join or are excluded from groups.
  - Must be set lower than `session.timeout.ms` value.
- **max.poll.interval.ms**
  - When signals are sent indicating being alive but messages aren't actually consumed, if poll isn't called,
  consumers are considered failed.
  - Consumer groups readjust to reassign partitions to other members.

<br><br>

# Other More Detailed Kafka configs Setting Methods

- <a href="https://kafka.apache.org/documentation/#producerconfigs" rel="nofollow" target="_blank">
Kafka Apache - Producer Configs</a>
- <a href="https://kafka.apache.org/documentation/#consumerconfigs" rel="nofollow" target="_blank">
Kafka Apache - Consumer Configs</a>
