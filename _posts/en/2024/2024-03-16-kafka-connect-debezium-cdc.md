---
layout: post
title: "Kafka Connect: Building a Debezium CDC Pipeline"
author: madplay
tags: kafka kafka-connect debezium cdc mysql elasticsearch
description: "Moving beyond JDBC polling, this post walks through building a real-time CDC pipeline that streams MySQL change events to Kafka with Debezium and indexes them in Elasticsearch."
category: Backend
date: "2024-03-16 21:18:00"
comments: true
series: "Kafka Connect"
lang: en
slug: kafka-connect-debezium-cdc
permalink: /en/post/kafka-connect-debezium-cdc
---

# Kafka Connect Series
- <a href="/en/post/kafka-connect-architecture" target="_blank">Kafka Connect: Introduction and Architecture</a>
- **Kafka Connect: Building a Debezium CDC Pipeline**
- <a href="/en/post/kafka-connect-operations" target="_blank">Kafka Connect: Monitoring and Incident Response</a>

<br>

# When Polling Falls Short

The <a href="/en/post/kafka-connect-architecture" target="_blank">previous post</a> covered the architecture and internals of Kafka Connect.
It also demonstrated a JDBC Source Connector that periodically polls a table. While the setup is simple and quick to deploy, it comes with structural limitations.

Changes that occur between polling intervals can be missed. If a DELETE follows an INSERT before the next poll, the record is already gone by the time the connector queries the table.
The inability to detect DELETEs at all is an even bigger constraint. Both `incrementing` and `timestamp` modes only track newly added or updated rows,
so deleted rows remain completely invisible.

Debezium takes a fundamentally different approach. Instead of polling the table, it **reads the database transaction log (binlog) directly**
and delivers every change event to Kafka. It captures INSERT, UPDATE, and DELETE without exception, and the concept of a polling interval simply does not exist.

<br>

# What Is Debezium

Debezium is an open-source **CDC (Change Data Capture) platform** sponsored by Red Hat.
Its core role is capturing change events from a database and delivering them to other systems.
It operates as a Source Connector within Kafka Connect.

It supports a wide range of databases including MySQL, PostgreSQL, MongoDB, SQL Server, and Oracle,
providing a dedicated connector that reads the transaction log of each database.
Since it runs on top of Kafka Connect, there is no need for additional infrastructure.
Simply install the Debezium connector plugin on an existing Connect cluster and it is ready to use.

<br>

# How Debezium Works

Debezium **operates as a Kafka Connect Source Connector**.
For MySQL, it detects changes by reading the binlog (Binary Log).
Debezium acts like a slave in the MySQL replication protocol, receiving binlog events
and converting them into structured messages for Kafka topics.

This approach has three key advantages.

- **Low latency.** Changes are written to the binlog immediately upon transaction commit, and Debezium reads them right away to deliver to Kafka. There is no polling interval to wait for.
- **Complete change capture.** INSERT, UPDATE, and DELETE events are all delivered without exception. There is no risk of changes being lost between polls.
- **Minimal DB load.** Unlike polling, which executes periodic queries against the table, Debezium reads the binlog stream and adds no extra query load.

<br>

# MySQL Prerequisites

A few MySQL-side configurations are required before Debezium can read the binlog.

## binlog Configuration

The binlog must be enabled in ROW format. Verify this in `my.cnf` or the MySQL configuration.

```ini
# Debezium only supports ROW format. STATEMENT and MIXED are not supported.
[mysqld]
server-id         = 1
log_bin           = mysql-bin
binlog_format     = ROW
binlog_row_image  = FULL
```

## Creating a Dedicated User

Grant replication-related privileges to the MySQL user that Debezium uses.

```sql
-- Create a dedicated user for Debezium
CREATE USER 'debezium'@'%' IDENTIFIED BY 'dbz_password';

-- Required privileges: binlog read, table lock for snapshots, database listing
GRANT SELECT, RELOAD, SHOW DATABASES,
      REPLICATION SLAVE, REPLICATION CLIENT
  ON *.* TO 'debezium'@'%';

FLUSH PRIVILEGES;
```

> In production, it is safer to restrict access to the Kafka Connect Worker's IP instead of using `'%'`.

<br>

# Debezium MySQL Connector Configuration

Register the Connector via the Kafka Connect REST API.

```bash
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "article-cdc-source",
    "config": {
      // Debezium MySQL Connector class
      "connector.class": "io.debezium.connector.mysql.MySqlConnector",

      // MySQL connection details
      "database.hostname": "mysql-host",
      "database.port": "3306",
      "database.user": "debezium",
      "database.password": "dbz_password",

      // Unique server ID for the MySQL replication protocol
      "database.server.id": "100",

      // Prefix for generated Kafka topics. Results in article.news.articles format.
      "topic.prefix": "article",

      // Tables to capture changes from. Regex is also supported.
      "table.include.list": "news.articles",

      // Number of tasks. MySQL Connector only supports 1.
      "tasks.max": "1",

      // Snapshot mode: determines how existing data is loaded on first run
      // initial = takes a full snapshot at startup, then starts tracking binlog
      "snapshot.mode": "initial",

      // Serialization format for messages stored in Kafka topics
      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  }'
```

Once registered, Debezium operates in two phases.
First, it takes a snapshot of existing data based on the `snapshot.mode` setting. In `initial` mode, it reads the entire current state of the table and loads it into Kafka.
After the snapshot completes, it begins real-time tracking from the last binlog position.

<br>

# Change Event Structure

The key fields in a Debezium message are `before`, `after`, and `op`.
The actual message also includes metadata such as `source` (database name, table name, binlog position) and `ts_ms` (timestamp), but only the core fields are shown here.

**INSERT** (`op: "c"`, create):

```json
{
  "before": null,
  "after": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "tech" },
  "op": "c"
}
```

`before` is null and `after` contains the newly created record.

**UPDATE** (`op: "u"`, update):

```json
{
  "before": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "tech" },
  "after": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "dev" },
  "op": "u"
}
```

`before` holds the state before the change, and `after` holds the state after. You can compare the two to see which fields changed.

**DELETE** (`op: "d"`, delete):

```json
{
  "before": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "dev" },
  "after": null,
  "op": "d"
}
```

`after` is null and `before` retains the state just before deletion.
This is the DELETE that JDBC polling could never capture.

<br>

# Connecting the Elasticsearch Sink

With change events now flowing into the `article.news.articles` topic on the Source side,
registering a Sink Connector to index them in Elasticsearch completes the entire pipeline.

```bash
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "article-es-sink",
    "config": {
      // Elasticsearch Sink Connector provided by Confluent
      "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",

      // Kafka topic to consume from
      "topics": "article.news.articles",

      // Elasticsearch connection URL
      "connection.url": "http://es-host:9200",

      // ES 7 uses the _doc type. This setting is unnecessary in ES 8.
      "type.name": "_doc",

      // Do not use the message key as the ES document ID
      "key.ignore": "true",

      // When not using a schema
      "schema.ignore": "true",

      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  }'
```

Now, whenever an INSERT, UPDATE, or DELETE occurs on the MySQL `articles` table,
Debezium delivers the change event to a Kafka topic, and the Elasticsearch Sink Connector indexes it.
Here is the end-to-end flow.

<img class="post_image" src="{{ site.baseurl }}/img/post/2024-03-16-kafka-connect-debezium-cdc-1.png" width="300" alt="CDC pipeline flow from MySQL through Debezium Source Connector, Kafka topic, and Elasticsearch Sink Connector to Elasticsearch"/>

Combining this with <a href="/en/post/kafka-error-handling-and-dead-letter-topic" target="_blank">connector error handling and Dead Letter Topics</a> prevents the entire pipeline from stalling when deserialization failures or indexing errors occur.

<br>

# JDBC Polling vs Debezium CDC

JDBC polling and Debezium CDC are both Source Connectors, but their underlying mechanisms are fundamentally different.
The right choice depends on the pipeline's real-time requirements and the operational environment.

| Factor | JDBC Polling | Debezium CDC |
|------|----------|-------------|
| Mechanism | Periodic SELECT queries | binlog/WAL stream reading |
| Latency | Depends on polling interval (seconds to minutes) | Near real-time (milliseconds to seconds) |
| DELETE detection | Not possible | Supported |
| Intermediate change loss | Changes between polls can be lost | Captures every change |
| DB load | Executes a query on every poll | Reads binlog, no additional queries |
| Configuration complexity | Low | Moderate (binlog setup, permissions required) |
| DBA coordination | Not required | Required (binlog access privileges) |

For simple data synchronization, JDBC polling is quick to set up.
When real-time delivery and DELETE detection matter, Debezium is the better fit.

<br>

# Things to Verify Before Adoption

## binlog Access Privileges

Debezium uses the MySQL replication protocol, so coordination with the DBA is necessary upfront.
In production, the binlog retention period (`expire_logs_days`) should also be verified.
If a Connector is stopped for an extended period and then restarted, it may fail trying to read binlog entries that have already expired.

## Schema Changes

When a column is added or a type changes on a table, the event structure Debezium produces also changes.
It is best to verify in advance that downstream consumers (such as the Elasticsearch Sink) can handle the new schema.
Using a Schema Registry enables automatic schema compatibility validation.

## Initial Snapshot Load

With `snapshot.mode=initial`, the first run reads the entire table.
For large tables, this can put significant load on MySQL,
so it is advisable to schedule the initial run during off-peak hours.

<br>

# Takeaways

Debezium represents a shift from "periodically looking at the table" to "getting notified whenever a change occurs."

It is particularly valuable in scenarios where real-time data synchronization is critical.
Election counting systems where tallies change every second, or news platforms where breaking stories must appear in search results the moment they hit the database, are prime examples.
In these environments, even a 5-second polling interval may be unacceptable, and no change can afford to be missed.

On the other hand, if a pipeline only needs batch synchronization once or twice a day, JDBC polling is simpler with less operational overhead.
Ultimately, the deciding factors come down to "how fast does it need to be" and "can any changes be missed."

The final post in this series covers how to operate the pipeline we built here in a stable, production-ready manner.

- Next post: <a href="/en/post/kafka-connect-operations" target="_blank">Kafka Connect: Monitoring and Incident Response</a>

<br>

# References

- <a href="https://debezium.io/documentation/reference/stable/connectors/mysql.html" target="_blank" rel="nofollow">Debezium Connector for MySQL</a>
- <a href="https://docs.confluent.io/kafka-connectors/elasticsearch/current/overview.html" target="_blank" rel="nofollow">Elasticsearch Service Sink Connector for Confluent Platform</a>
