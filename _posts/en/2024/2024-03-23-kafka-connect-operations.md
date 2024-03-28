---
layout: post
title: "Kafka Connect: Monitoring and Incident Response"
author: madplay
tags: kafka kafka-connect monitoring troubleshooting operations
description: "Where do you start when a Connector falls into FAILED state?"
category: Backend
date: "2024-03-23 22:06:00"
comments: true
series: "Kafka Connect"
lang: en
slug: kafka-connect-operations
permalink: /en/post/kafka-connect-operations
---

# Kafka Connect Series

- <a href="/en/post/kafka-connect-architecture" target="_blank">Kafka Connect: Introduction and Architecture</a>
- <a href="/en/post/kafka-connect-debezium-cdc" target="_blank">Kafka Connect: Building a Debezium CDC Pipeline</a>
- **Kafka Connect: Monitoring and Incident Response**

<br>

# Building It and Running It Are Two Different Problems

In the <a href="/en/post/kafka-connect-debezium-cdc" target="_blank">previous post</a>, we built a CDC pipeline with Debezium.
Getting the pipeline up and running takes no more than a few config files.
Keeping it running in production every day, however, is a different story.
Connectors can suddenly drop into FAILED state, Tasks get reassigned and introduce lag,
or schema changes break deserialization at the worst possible time.

<br>

# Managing Connector and Task State

## Checking Status

In distributed mode, you can check Connector and Task status through the REST API.

```bash
# List all Connectors
curl http://localhost:8083/connectors
```

```json
["article-cdc-source", "article-es-sink"]
```

To inspect the status of a specific Connector, use the `/status` endpoint.

```bash
curl http://localhost:8083/connectors/article-cdc-source/status
```

```json
{
  "name": "article-cdc-source",
  "connector": {
    "state": "RUNNING",
    "worker_id": "localhost:8083"
  },
  "tasks": [
    {
      "id": 0,
      "state": "RUNNING",       // RUNNING, PAUSED, FAILED, UNASSIGNED, etc.
      "worker_id": "localhost:8083"
    }
  ]
}
```

`RUNNING` means everything is healthy. `FAILED` indicates a Task threw an exception and stopped.
`UNASSIGNED` means a rebalance is in progress or there are not enough Workers.

## Restarting

You can manually restart a Task that has entered FAILED state.

```bash
# Restart a specific Task (task id = 0)
curl -X POST http://localhost:8083/connectors/article-cdc-source/tasks/0/restart

# Restart an entire Connector (including all Tasks)
curl -X POST http://localhost:8083/connectors/article-cdc-source/restart
```

If the root cause was a transient network issue or a dropped DB connection, a restart often resolves the problem.
If the Connector keeps falling back into FAILED, check the logs to identify the underlying cause.

<br>

# Key REST API Endpoints

In distributed mode, the REST API is the sole interface for managing Connectors.
We already covered listing, status checks, and restarts. In practice, several other endpoints see frequent use as well.

## Updating Configuration

You can modify a Connector's configuration without deleting and re-registering it.

```bash
# Update Connector config: PUT overwrites the entire config
curl -X PUT http://localhost:8083/connectors/article-cdc-source/config \
  -H "Content-Type: application/json" \
  -d '{
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "database.hostname": "mysql-host",
    "database.port": "3306",
    "database.user": "debezium",
    "database.password": "new_password",
    "database.server.id": "100",
    "topic.prefix": "article",
    "table.include.list": "news.articles,news.article_tags"
  }'
```

The Connector restarts automatically after a config update.
This is particularly useful for expanding pipeline scope on the fly, such as adding tables to `table.include.list`.

## Pause and Resume

Use these when you need to temporarily halt a pipeline during a deployment or maintenance window.

```bash
# Pause: Tasks stop, but the Connector config is preserved
curl -X PUT http://localhost:8083/connectors/article-cdc-source/pause

# Resume: Processing picks up from where it left off
curl -X PUT http://localhost:8083/connectors/article-cdc-source/resume
```

Pausing differs from deleting a Connector. Offset information is preserved, so resuming picks up exactly where it stopped.
This is a safe way to freeze the pipeline when you need to perform work on the sink side, such as a DB migration or an Elasticsearch index rebuild.

## Deletion

Remove a Connector that is no longer needed with a DELETE request.

```bash
curl -X DELETE http://localhost:8083/connectors/article-cdc-source
```

Deleting a Connector also terminates its associated Tasks and removes its configuration from the internal Kafka topics.
Note that offset information remains in the `connect-offsets` topic. If you re-register a Connector with the same name, it resumes from the last committed offset.

## Listing Installed Plugins

You can check which Connector plugins are installed on a Worker.

```bash
curl http://localhost:8083/connector-plugins
```

```json
[
  { "class": "io.debezium.connector.mysql.MySqlConnector", "type": "source" },
  { "class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector", "type": "sink" },
  { "class": "org.apache.kafka.connect.file.FileStreamSourceConnector", "type": "source" }
]
```

It is good practice to verify that the required plugin is installed on the Worker before registering a new Connector.

## Endpoint Summary

| Method | Path                                    | Purpose                  |
|--------|-----------------------------------------|--------------------------|
| GET    | `/connectors`                           | List all Connectors      |
| POST   | `/connectors`                           | Register a Connector     |
| GET    | `/connectors/{name}/status`             | Check status             |
| PUT    | `/connectors/{name}/config`             | Update configuration     |
| PUT    | `/connectors/{name}/pause`              | Pause                    |
| PUT    | `/connectors/{name}/resume`             | Resume                   |
| POST   | `/connectors/{name}/restart`            | Restart                  |
| POST   | `/connectors/{name}/tasks/{id}/restart` | Restart a specific Task  |
| DELETE | `/connectors/{name}`                    | Delete                   |
| GET    | `/connector-plugins`                    | List installed plugins   |

<br>

# Monitoring: What to Watch

Kafka Connect exposes metrics through JMX (Java Management Extensions).
The standard approach is to collect them with a stack like Prometheus + Grafana and build dashboards.

## Key Source Connector Metrics

| Metric | Meaning | Warning Signal |
|--------|---------|----------------|
| `source-record-poll-rate` | Records polled per second | A sudden drop to 0 suggests a source connection failure |
| `source-record-write-rate` | Records written to Kafka per second | A large gap from poll-rate indicates a bottleneck |
| `poll-batch-avg-time-ms` | Average time per poll batch | A sustained increase points to source DB load |

## Key Sink Connector Metrics

| Metric | Meaning | Warning Signal |
|--------|---------|----------------|
| `sink-record-read-rate` | Records read from Kafka per second | 0 suggests a consumer-side issue |
| `sink-record-send-rate` | Records written to the sink system per second | A large gap from read-rate indicates a sink bottleneck |
| `offset-commit-failure-percentage` | Offset commit failure rate | Any non-zero value requires immediate investigation |

To enable JMX, set the environment variable when starting the Kafka Connect Worker.

```bash
# Open JMX on port 9999 to expose metrics
export KAFKA_JMX_OPTS="-Dcom.sun.management.jmxremote.port=9999 \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -Dcom.sun.management.jmxremote.ssl=false"
```

> Opening JMX without authentication poses a security risk. In production, either enable authentication or restrict access to an internal network.

<br>

# Isolating Errors with Dead Letter Topics

When a Sink Connector fails to process a message, the default behavior is to halt the entire Task (the default value of `errors.tolerance` is `none`).
A single malformed message brings the whole pipeline to a stop.

This is not necessarily a bad thing. **If the pipeline demands strict message ordering and consistency, stopping is actually the safer choice.**
When skipping one message changes the meaning of subsequent messages (e.g., account balance updates that depend on prior state),
it is better to stop immediately, fix the root cause, and restart to preserve data integrity.

On the other hand, for pipelines where temporary gaps are acceptable and reprocessing is possible, such as search indexing,
configuring a Dead Letter Topic (DLT) to route failed messages to a separate topic while continuing to process the rest is the better approach.

```json
{
  // Route messages to the Dead Letter Topic on error
  "errors.tolerance": "all",

  // Topic name for failed messages
  "errors.deadletterqueue.topic.name": "article-es-sink-dlq",

  // Replication factor for the DLT topic
  "errors.deadletterqueue.topic.replication.factor": "3",

  // Include error context in message headers
  "errors.deadletterqueue.context.headers.enable": "true"
}
```

Add these settings to the Sink Connector's config.
Messages that land in the DLT can be analyzed later and either reprocessed or discarded.

One caveat: setting `errors.tolerance` to `all` causes failed messages to be skipped,
which means **message ordering may be disrupted and gaps can appear** between the source topic and the sink system.
For example, if an UPDATE event for article A gets routed to the DLT, Elasticsearch retains the stale version.
If you adopt DLT, you need a process in place to regularly monitor the DLT topic and review accumulated messages.
See <a href="/en/post/kafka-error-handling-and-dead-letter-topic" target="_blank">Error Handling and Dead Letter Topic Design</a> for more detailed patterns.

<br>

# Common Failure Scenarios

## Connector Enters FAILED State

The most common cause is a lost connection to the source or sink (DB restart, ES unresponsive).
Configuration mistakes such as table name typos or insufficient permissions also frequently cause failures right after registration.

```bash
# Check status and inspect the trace field for the error cause
curl http://localhost:8083/connectors/article-cdc-source/status | jq '.tasks[0].trace'
```

Identify the error cause, and if connectivity has been restored, restart the Task.
If the same error recurs, examine the full stack trace in the Worker logs (`connect.log` or stdout).

## Repeated Task Rebalancing

When a Worker becomes unstable (insufficient heap, excessive GC, network issues), rebalancing triggers repeatedly.
During a rebalance, all Tasks pause briefly, resulting in data lag.

Search for the `Rebalance` keyword in the Worker logs to track rebalancing frequency and root cause.
Tuning `session.timeout.ms` and `heartbeat.interval.ms` can reduce unnecessary rebalancing,
but setting them too high delays detection of actual failures.

## Schema Changes Break Deserialization

When a column is added or a type changes in the source table, the Converter can fail.
The typical symptom is a Task entering FAILED state with `SerializationException` or `DataException` in the logs.

If you are using Schema Registry, check the compatibility level (BACKWARD, FORWARD).
If the change is incompatible with the existing schema, registering a separate Connector is the safer path.

<br>

# Scaling Out Workers

When the pipeline count grows beyond what existing Workers can handle, add more Workers.
In distributed mode, starting a Worker with the same `group.id` causes it to join the cluster automatically,
and existing Tasks get redistributed to the new Worker.

```bash
# Start a new Worker: use the same group.id as existing Workers
connect-distributed.sh worker-new.properties
```

Adding a Worker triggers a rebalance, which briefly pauses Tasks.
It is advisable to perform this during low-traffic hours.

<br>

# Wrapping Up

Over three posts, we covered the essentials of Kafka Connect.
Part 1 explored what Kafka Connect is and how its architecture works.
Part 2 walked through building a CDC pipeline with Debezium, moving beyond the limitations of JDBC polling.
This final post covered the operational considerations for keeping that pipeline stable in production.

At its core, operating Kafka Connect comes down to **observing state, responding to failures, and recovering quickly.**
The baseline is periodically checking Connector status via the REST API and detecting bottlenecks through JMX metrics.
Whether to halt the pipeline on error or isolate failures with a Dead Letter Topic and keep processing
depends on the consistency requirements of each pipeline. Having these decision criteria established in advance
should prepare you for most operational situations.

<br>

# References

- <a href="https://kafka.apache.org/documentation/#connect_monitoring" target="_blank" rel="nofollow">Apache Kafka Connect Monitoring</a>
- <a href="https://docs.confluent.io/platform/current/connect/monitoring.html" target="_blank" rel="nofollow">Monitoring Kafka Connect and Connectors</a>
