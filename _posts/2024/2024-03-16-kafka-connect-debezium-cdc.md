---
layout: post
title: "Kafka Connect: Debezium CDC 파이프라인 구축"
author: madplay
tags: kafka kafka-connect debezium cdc mysql elasticsearch
description: "JDBC 폴링의 한계를 넘어, Debezium CDC로 MySQL 변경 이벤트를 Kafka에 실시간으로 전달하고 Elasticsearch에 적재하는 파이프라인을 구성한다."
category: Backend
date: "2024-03-16 21:18:00"
comments: true
series: "Kafka Connect"
---

# Kafka Connect 시리즈 목차
- <a href="/post/kafka-connect-architecture" target="_blank">Kafka Connect: 소개와 아키텍처</a>
- **Kafka Connect: Debezium CDC 파이프라인 구축**
- <a href="/post/kafka-connect-operations" target="_blank">Kafka Connect: 모니터링과 장애 대응</a>

<br>

# 폴링으로는 부족한 순간

<a href="/post/kafka-connect-architecture" target="_blank">이전 글</a>에서 Kafka Connect의 아키텍처와 동작 원리를 살펴보았다.
JDBC Source Connector로 테이블을 주기적으로 폴링하는 예시도 다뤘는데, 설정이 단순하고 바로 붙일 수 있는 대신 구조적인 한계가 있다.

폴링 간격 사이에 일어난 변경은 놓칠 수 있다. INSERT 직후 DELETE가 발생하면 폴링 시점에는 해당 레코드가 이미 사라져 있다.
DELETE 자체를 감지하지 못하는 것도 큰 제약이다. `incrementing`이나 `timestamp` 모드는 새로 추가되거나 변경된 행만 추적하므로,
삭제된 행은 아예 보이지 않는다.

Debezium은 이 문제를 다른 방식으로 풀어낸다. 테이블을 폴링하는 대신 **데이터베이스의 트랜잭션 로그(binlog)를 직접 읽어**
모든 변경 이벤트를 Kafka에 전달한다. INSERT, UPDATE, DELETE를 빠짐없이 포착할 수 있고, 폴링 간격이라는 개념 자체가 없다.

<br>

# Debezium이란

Debezium은 Red Hat이 후원하는 오픈소스 **CDC(Change Data Capture) 플랫폼**이다.
데이터베이스의 변경 이벤트를 캡처해서 다른 시스템에 전달하는 것이 핵심 역할이며,
Kafka Connect의 Source Connector 형태로 동작한다.

MySQL, PostgreSQL, MongoDB, SQL Server, Oracle 등 다양한 데이터베이스를 지원하고,
각 데이터베이스의 트랜잭션 로그를 읽는 전용 커넥터를 제공한다.
Kafka Connect 위에서 돌아가므로 별도의 인프라를 추가할 필요 없이,
기존 Connect 클러스터에 Debezium 커넥터 플러그인만 설치하면 바로 사용할 수 있다.

<br>

# Debezium은 어떻게 동작하는가

Debezium은 **Kafka Connect의 Source Connector로 동작**한다.
MySQL의 경우 binlog(Binary Log)를 읽는 방식으로 변경을 감지한다.
Debezium이 MySQL 복제 프로토콜의 슬레이브처럼 동작하면서 binlog 이벤트를 수신하고,
이를 Kafka 토픽에 구조화된 메시지로 변환해서 전달한다.

이 방식의 장점은 크게 세 가지다.

- **지연이 짧다.** 트랜잭션 커밋 즉시 binlog에 기록되고, Debezium이 바로 읽어 Kafka에 전달한다. 폴링 간격을 기다릴 필요가 없다.
- **모든 변경을 포착한다.** INSERT, UPDATE, DELETE가 빠짐없이 전달된다. 폴링 사이에 변경이 유실되는 문제가 없다.
- **DB 부하가 적다.** 테이블을 주기적으로 조회하는 폴링과 달리, binlog 스트림을 읽으므로 추가 쿼리 부하가 없다.

<br>

# MySQL 사전 준비

Debezium이 binlog를 읽으려면 MySQL 쪽에 몇 가지 설정이 필요하다.

## binlog 설정

binlog가 ROW 포맷으로 활성화되어 있어야 한다. `my.cnf` 또는 MySQL 설정에서 확인한다.

```ini
# Debezium은 ROW 포맷만 지원한다. STATEMENT나 MIXED는 사용할 수 없다.
[mysqld]
server-id         = 1
log_bin           = mysql-bin
binlog_format     = ROW
binlog_row_image  = FULL
```

## 전용 사용자 생성

Debezium이 사용할 MySQL 사용자에게 복제 관련 권한을 부여한다.

```sql
-- Debezium 전용 사용자 생성
CREATE USER 'debezium'@'%' IDENTIFIED BY 'dbz_password';

-- 필요한 권한: binlog 읽기, 스냅샷 시 테이블 잠금, DB 목록 조회
GRANT SELECT, RELOAD, SHOW DATABASES,
      REPLICATION SLAVE, REPLICATION CLIENT
  ON *.* TO 'debezium'@'%';

FLUSH PRIVILEGES;
```

> 프로덕션 환경에서는 `'%'` 대신 Kafka Connect Worker의 IP로 접근을 제한하는 편이 안전하다.

<br>

# Debezium MySQL Connector 설정

Kafka Connect REST API로 Connector를 등록한다.

```bash
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "article-cdc-source",
    "config": {
      // Debezium MySQL Connector 클래스
      "connector.class": "io.debezium.connector.mysql.MySqlConnector",

      // MySQL 접속 정보
      "database.hostname": "mysql-host",
      "database.port": "3306",
      "database.user": "debezium",
      "database.password": "dbz_password",

      // MySQL 복제 프로토콜에서 사용할 고유 서버 ID
      "database.server.id": "100",

      // 생성되는 Kafka 토픽의 접두사. article.news.articles 형태가 된다.
      "topic.prefix": "article",

      // 변경을 감지할 테이블 목록. 정규식도 지원한다.
      "table.include.list": "news.articles",

      // Task 수. MySQL Connector는 1만 지원한다.
      "tasks.max": "1",

      // 스냅샷 모드: 최초 실행 시 기존 데이터를 어떻게 가져올지 결정
      // initial = 커넥터 시작 시 전체 스냅샷을 뜬 뒤 binlog 추적 시작
      "snapshot.mode": "initial",

      // Kafka 토픽에 저장할 메시지의 직렬화 포맷
      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  }'
```

등록이 완료되면 Debezium은 두 단계로 동작한다.
먼저 `snapshot.mode`에 따라 기존 데이터의 스냅샷을 뜬다. `initial` 모드에서는 테이블의 현재 상태를 통째로 읽어 Kafka에 적재한다.
스냅샷이 끝나면 binlog의 마지막 위치부터 실시간 추적을 시작한다.

<br>

# 변경 이벤트의 구조

Debezium이 생성하는 메시지에는 `before`, `after`, `op` 필드가 핵심이다.
실제 메시지에는 `source`(DB명, 테이블명, binlog 위치)나 `ts_ms`(타임스탬프) 같은 메타데이터도 포함되지만, 여기서는 핵심 필드만 보여준다.

**INSERT** (`op: "c"`, create):

```json
{
  "before": null,
  "after": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "tech" },
  "op": "c"
}
```

`before`가 null이고 `after`에 새로 생긴 레코드가 담긴다.

**UPDATE** (`op: "u"`, update):

```json
{
  "before": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "tech" },
  "after": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "dev" },
  "op": "u"
}
```

`before`에 변경 전 상태, `after`에 변경 후 상태가 들어온다. 어떤 필드가 바뀌었는지 비교할 수 있다.

**DELETE** (`op: "d"`, delete):

```json
{
  "before": { "id": 1001, "title": "카프카 커넥트 입문", "author": "김기자", "section": "dev" },
  "after": null,
  "op": "d"
}
```

`after`가 null이고 `before`에 삭제 직전의 상태가 남는다.
JDBC 폴링으로는 감지할 수 없었던 DELETE가 여기서 포착된다.

<br>

# Elasticsearch Sink 연결

Source 쪽에서 `article.news.articles` 토픽에 변경 이벤트가 쌓이고 있으므로,
이제 Sink Connector를 등록해서 Elasticsearch에 적재하면 전체 파이프라인이 완성된다.

```bash
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "article-es-sink",
    "config": {
      // Confluent에서 제공하는 Elasticsearch Sink Connector
      "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",

      // 읽어올 Kafka 토픽
      "topics": "article.news.articles",

      // Elasticsearch 접속 URL
      "connection.url": "http://es-host:9200",

      // ES 7에서는 _doc 타입을 사용한다. ES 8에서는 이 설정이 불필요하다.
      "type.name": "_doc",

      // 메시지 키를 ES 문서 ID로 사용하지 않음
      "key.ignore": "true",

      // 스키마를 사용하지 않는 경우
      "schema.ignore": "true",

      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  }'
```

이제 MySQL의 `articles` 테이블에 INSERT, UPDATE, DELETE가 발생하면
Debezium이 변경 이벤트를 Kafka 토픽에 전달하고, Elasticsearch Sink Connector가 이를 인덱싱한다.
전체 흐름을 그림으로 보면 이렇다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2024-03-16-kafka-connect-debezium-cdc-1.png" width="300" alt="MySQL에서 Debezium Source Connector, Kafka 토픽, Elasticsearch Sink Connector를 거쳐 Elasticsearch로 이어지는 CDC 파이프라인 흐름"/>

<a href="/post/kafka-error-handling-and-dead-letter-topic" target="_blank">커넥터의 에러 처리와 Dead Letter Topic 활용법</a>을 함께 설정하면,
역직렬화 실패나 인덱싱 오류가 발생했을 때도 파이프라인 전체가 멈추는 것을 방지할 수 있다.

<br>

# JDBC 폴링 vs Debezium CDC

JDBC 폴링과 Debezium CDC는 같은 Source Connector지만 동작 원리가 근본적으로 다르다.
어떤 방식이 맞는지는 파이프라인의 실시간성 요구와 운영 환경에 따라 달라진다.

| 항목 | JDBC 폴링 | Debezium CDC |
|------|----------|-------------|
| 동작 방식 | 주기적 SELECT 쿼리 | binlog/WAL 스트림 읽기 |
| 지연 시간 | 폴링 간격에 의존 (초~분) | 거의 실시간 (밀리초~초) |
| DELETE 감지 | 불가 | 가능 |
| 중간 변경 유실 | 폴링 사이 변경은 유실 가능 | 모든 변경 포착 |
| DB 부하 | 폴링마다 쿼리 실행 | binlog 읽기, 추가 쿼리 없음 |
| 설정 난이도 | 낮음 | 중간 (binlog 설정, 권한 필요) |
| DBA 협의 | 불필요 | 필요 (binlog 접근 권한) |

단순한 데이터 동기화에는 JDBC 폴링이 빠르게 붙일 수 있고,
실시간성과 DELETE 감지가 중요한 시나리오에서는 Debezium이 적합하다.

<br>

# 도입 전에 확인할 것들

## binlog 접근 권한

Debezium은 MySQL의 복제 프로토콜을 사용하므로, DBA와 사전 협의가 필요하다.
운영 환경에서는 binlog 보존 기간(`expire_logs_days`)도 함께 확인해야 한다.
Connector가 오랫동안 중단된 뒤 재시작하면 이미 만료된 binlog를 읽으려 해서 실패할 수 있다.

## 스키마 변경

테이블에 컬럼이 추가되거나 타입이 바뀌면 Debezium이 생성하는 이벤트 구조도 달라진다.
다운스트림 소비자(Elasticsearch Sink 등)가 새 스키마를 처리할 수 있는지 미리 확인하는 편이 좋다.
Schema Registry를 함께 사용하면 스키마 호환성을 자동으로 검증할 수 있다.

## 초기 스냅샷 부하

`snapshot.mode=initial`로 설정하면 최초 실행 시 테이블 전체를 읽는다.
대용량 테이블이라면 스냅샷 도중 MySQL에 부하가 걸릴 수 있으므로,
트래픽이 적은 시간대에 초기 실행을 계획하는 것을 권한다.

<br>

# 돌아보며

Debezium은 "테이블을 주기적으로 들여다보는" 방식에서 "변경이 일어날 때마다 알려주는" 방식으로의 전환이다.

실시간 데이터 동기화가 핵심인 시나리오에서 특히 유용하다.
선거 개표 시스템처럼 초 단위로 집계가 바뀌는 환경이나, 뉴스 속보가 DB에 등록되자마자 검색 엔진에 반영되어야 하는 경우가 대표적이다.
이런 환경에서 5초짜리 폴링 간격도 허용되지 않을 수 있고, 중간에 유실되는 변경이 있으면 안 된다.

반면 하루에 한두 번 배치로 동기화하면 충분한 파이프라인이라면 JDBC 폴링이 더 단순하고 관리 부담도 적다.
결국 "얼마나 빨라야 하는가"와 "변경을 빠짐없이 잡아야 하는가"가 판단 기준이 아닐까 싶다.

이어지는 시리즈의 마지막 글에서는 이렇게 구성한 파이프라인을 안정적으로 운영하는 방법을 다룬다.

- 다음 글: <a href="/post/kafka-connect-operations" target="_blank">Kafka Connect: 모니터링과 장애 대응</a>

<br>

# 참고

- <a href="https://debezium.io/documentation/reference/stable/connectors/mysql.html" target="_blank" rel="nofollow">Debezium Connector for MySQL</a>
- <a href="https://docs.confluent.io/kafka-connectors/elasticsearch/current/overview.html" target="_blank" rel="nofollow">Elasticsearch Service Sink Connector for Confluent Platform</a>
