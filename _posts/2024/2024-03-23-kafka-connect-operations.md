---
layout: post
title: "Kafka Connect: 모니터링과 장애 대응"
author: madplay
tags: kafka kafka-connect monitoring troubleshooting operations
description: "Connector가 FAILED에 빠졌을 때 어디부터 확인해야 할까?"
category: Backend
date: "2024-03-23 22:06:00"
comments: true
series: "Kafka Connect"
---

# Kafka Connect 시리즈 목차
- <a href="/post/kafka-connect-architecture" target="_blank">Kafka Connect: 소개와 아키텍처</a>
- <a href="/post/kafka-connect-debezium-cdc" target="_blank">Kafka Connect: Debezium CDC 파이프라인 구축</a>
- **Kafka Connect: 모니터링과 장애 대응**

<br>

# 만드는 것과 운영하는 것은 다른 문제

<a href="/post/kafka-connect-debezium-cdc" target="_blank">이전 글</a>에서 Debezium으로 CDC 파이프라인을 구성해 보았다.
파이프라인을 만드는 것까지는 설정 파일 몇 개로 끝난다.
하지만 그 파이프라인이 프로덕션에서 매일 돌아가려면 이야기가 달라진다.
Connector가 갑자기 FAILED 상태로 빠지거나, Task가 재배치되면서 지연이 생기거나,
스키마가 바뀌면서 역직렬화가 깨지는 상황은 언제든 찾아온다.

<br>

# Connector와 Task 상태 관리

## 상태 확인

Distributed 모드에서는 REST API로 Connector와 Task의 상태를 확인할 수 있다.

```bash
# 전체 Connector 목록 조회
curl http://localhost:8083/connectors
```

```json
["article-cdc-source", "article-es-sink"]
```

개별 Connector의 상태를 보려면 `/status` 엔드포인트를 사용한다.

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
      "state": "RUNNING",       // RUNNING, PAUSED, FAILED, UNASSIGNED 등
      "worker_id": "localhost:8083"
    }
  ]
}
```

`state`가 `RUNNING`이면 정상이다. `FAILED`라면 Task가 예외를 던지고 멈춘 것이고,
`UNASSIGNED`라면 리밸런싱 중이거나 Worker가 부족한 상태다.

## 재시작

FAILED 상태의 Task는 수동으로 재시작할 수 있다.

```bash
# 특정 Task 재시작 (task id = 0)
curl -X POST http://localhost:8083/connectors/article-cdc-source/tasks/0/restart

# Connector 전체 재시작 (모든 Task 포함)
curl -X POST http://localhost:8083/connectors/article-cdc-source/restart
```

일시적인 네트워크 문제나 DB 연결 끊김이 원인이었다면 재시작으로 복구되는 경우가 많다.
반복적으로 FAILED에 빠진다면 로그를 확인해서 근본 원인을 찾아야 한다.

<br>

# REST API 주요 엔드포인트

Distributed 모드에서 Connector를 관리하는 수단은 REST API뿐이다.
앞에서 목록 조회, 상태 확인, 재시작을 다뤘는데, 실제 운영에서는 그 외의 엔드포인트도 자주 쓰인다.

## 설정 변경

Connector를 삭제하고 다시 등록할 필요 없이 설정만 바꿀 수 있다.

```bash
# Connector 설정 변경: PUT 요청으로 전체 config를 덮어쓴다
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

설정이 변경되면 Connector가 자동으로 재시작된다.
`table.include.list`에 테이블을 추가하는 것처럼 운영 중에 파이프라인 범위를 넓히는 경우에 유용하다.

## 일시 정지와 재개

배포나 점검 중에 파이프라인을 잠시 멈추고 싶을 때 사용한다.

```bash
# 일시 정지: Task가 멈추지만 Connector 설정은 유지된다
curl -X PUT http://localhost:8083/connectors/article-cdc-source/pause

# 재개: 정지했던 지점부터 다시 처리한다
curl -X PUT http://localhost:8083/connectors/article-cdc-source/resume
```

`pause`는 Connector를 삭제하는 것과 다르다. 오프셋 정보가 보존되므로 `resume` 시 멈춘 지점부터 이어서 처리한다.
DB 마이그레이션이나 Elasticsearch 인덱스 재구성처럼 싱크 쪽 작업이 필요할 때 파이프라인을 안전하게 멈추는 방법이다.

## 삭제

더 이상 필요 없는 Connector는 DELETE로 제거한다.

```bash
curl -X DELETE http://localhost:8083/connectors/article-cdc-source
```

삭제하면 관련 Task도 함께 종료되고, Kafka 내부 토픽에서 해당 Connector의 설정이 제거된다.
다만 오프셋 정보는 `connect-offsets` 토픽에 남아 있으므로, 같은 이름으로 다시 등록하면 마지막 오프셋부터 이어서 처리한다.

## 설치된 플러그인 목록

Worker에 어떤 Connector 플러그인이 설치되어 있는지 확인할 수 있다.

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

새 Connector를 등록하기 전에 해당 플러그인이 Worker에 설치되어 있는지 먼저 확인하는 습관이 좋다.

## 엔드포인트 정리

| 메서드    | 경로                                      | 역할              |
|--------|-----------------------------------------|-----------------|
| GET    | `/connectors`                           | 전체 Connector 목록 |
| POST   | `/connectors`                           | Connector 등록    |
| GET    | `/connectors/{name}/status`             | 상태 확인           |
| PUT    | `/connectors/{name}/config`             | 설정 변경           |
| PUT    | `/connectors/{name}/pause`              | 일시 정지           |
| PUT    | `/connectors/{name}/resume`             | 재개              |
| POST   | `/connectors/{name}/restart`            | 재시작             |
| POST   | `/connectors/{name}/tasks/{id}/restart` | 특정 Task 재시작     |
| DELETE | `/connectors/{name}`                    | 삭제              |
| GET    | `/connector-plugins`                    | 설치된 플러그인 목록     |

<br>

# 모니터링: 무엇을 봐야 하는가

Kafka Connect는 JMX(Java Management Extensions)를 통해 메트릭을 노출한다.
Prometheus + Grafana 같은 스택으로 수집해서 대시보드를 구성하는 것이 일반적이다.

## Source Connector 핵심 메트릭

| 메트릭 | 의미 | 주의 신호 |
|--------|------|----------|
| `source-record-poll-rate` | 초당 폴링한 레코드 수 | 갑자기 0으로 떨어지면 소스 연결 끊김 의심 |
| `source-record-write-rate` | 초당 Kafka에 쓴 레코드 수 | poll-rate와 차이가 크면 병목 |
| `poll-batch-avg-time-ms` | 폴링 한 번의 평균 소요 시간 | 지속적으로 증가하면 소스 DB 부하 의심 |

## Sink Connector 핵심 메트릭

| 메트릭 | 의미 | 주의 신호 |
|--------|------|----------|
| `sink-record-read-rate` | 초당 Kafka에서 읽은 레코드 수 | 0이면 컨슈머 문제 의심 |
| `sink-record-send-rate` | 초당 싱크 시스템에 쓴 레코드 수 | read-rate와 차이가 크면 싱크 병목 |
| `offset-commit-failure-percentage` | 오프셋 커밋 실패 비율 | 0이 아니면 즉시 확인 |

JMX를 활성화하려면 Kafka Connect Worker 실행 시 환경 변수를 설정한다.

```bash
# JMX 포트를 9999로 열어 메트릭을 노출한다
export KAFKA_JMX_OPTS="-Dcom.sun.management.jmxremote.port=9999 \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -Dcom.sun.management.jmxremote.ssl=false"
```

> 인증 없이 JMX를 열면 보안 위험이 있다. 프로덕션에서는 인증을 켜거나 내부 네트워크에서만 접근 가능하도록 제한해야 한다.

<br>

# Dead Letter Topic으로 에러 격리

Sink Connector가 메시지를 처리하다 실패하면 기본적으로 Task 전체가 멈춘다(`errors.tolerance`의 기본값이 `none`).
하나의 잘못된 메시지 때문에 파이프라인 전체가 중단되는 것이다.

이 동작이 무조건 나쁜 것은 아니다. **메시지 순서와 정합성이 절대적으로 보장되어야 하는 파이프라인이라면 오히려 멈추는 편이 안전하다.**
하나를 건너뛰었을 때 뒤따르는 메시지의 의미가 달라지는 경우(e.g., 계좌 잔액 변경처럼 이전 상태에 의존하는 이벤트)에는
실패 즉시 멈추고 원인을 해결한 뒤 재시작하는 쪽이 데이터 정합성을 지킬 수 있다.

반면 검색 인덱싱처럼 일시적인 누락이 허용되고 나중에 재처리할 수 있는 파이프라인이라면,
Dead Letter Topic(DLT)을 설정해서 실패한 메시지만 별도 토픽으로 빼내고 나머지는 계속 처리하는 쪽이 낫다.

```json
{
  // 에러 발생 시 Dead Letter Topic에 메시지를 보낸다
  "errors.tolerance": "all",

  // 실패한 메시지가 쌓일 토픽 이름
  "errors.deadletterqueue.topic.name": "article-es-sink-dlq",

  // DLT 토픽의 복제 팩터
  "errors.deadletterqueue.topic.replication.factor": "3",

  // 에러 원인을 메시지 헤더에 포함한다
  "errors.deadletterqueue.context.headers.enable": "true"
}
```

이 설정을 Sink Connector의 config에 추가하면 된다.
DLT에 쌓인 메시지는 나중에 원인을 분석하고 재처리하거나 버릴 수 있다.

주의할 점이 있다. `errors.tolerance`를 `all`로 설정하면 실패한 메시지를 건너뛰므로,
원본 토픽과 싱크 시스템 사이에 **메시지 순서가 어긋나거나 누락이 생길 수 있다.**
예를 들어 기사 A의 UPDATE 이벤트가 DLT로 빠지면 Elasticsearch에는 이전 상태가 남게 된다.
DLT를 쓴다면 DLT 토픽을 주기적으로 모니터링하고, 쌓인 메시지를 확인하는 프로세스를 함께 갖춰야 한다.
<a href="/post/kafka-error-handling-and-dead-letter-topic" target="_blank">에러 처리와 Dead Letter Topic 설계</a>에서 더 자세한 패턴을 다뤘다.

<br>

# 흔한 장애 시나리오

## Connector가 FAILED 상태에 빠졌다

가장 흔한 원인은 소스/싱크 연결 끊김(DB 재시작, ES 무응답)이다.
테이블명 오타나 권한 부족 같은 설정 실수로 등록하자마자 실패하는 경우도 흔하다.

```bash
# 상태 확인 후 trace 필드에서 에러 원인을 볼 수 있다
curl http://localhost:8083/connectors/article-cdc-source/status | jq '.tasks[0].trace'
```

에러 원인을 확인하고, 연결이 복구되었다면 Task를 재시작한다.
같은 에러로 반복 실패한다면 Worker 로그(`connect.log` 또는 stdout)에서 전체 스택 트레이스를 확인해야 한다.

## Task 재배치가 반복된다

Worker가 불안정하면(힙 부족, GC 과다, 네트워크 이슈) 지속적으로 리밸런싱이 발생한다.
리밸런싱 중에는 모든 Task가 잠시 멈추므로 데이터 지연이 생긴다.

Worker 로그에서 `Rebalance` 키워드를 검색하면 리밸런싱 빈도와 원인을 추적할 수 있다.
`session.timeout.ms`와 `heartbeat.interval.ms` 설정을 조정하면 불필요한 리밸런싱을 줄일 수 있지만,
다만 너무 길게 잡으면 실제 장애를 알아채는 데 시간이 걸린다.

## 스키마 변경으로 역직렬화가 깨졌다

소스 테이블에 컬럼이 추가되거나 타입이 바뀌면 Converter가 실패할 수 있다.
Task가 FAILED에 빠지면서 로그에 `SerializationException`이나 `DataException`이 남는 것이 전형적인 증상이다.

Schema Registry를 사용 중이라면 호환성 레벨(BACKWARD, FORWARD)을 확인하고,
기존 스키마와 맞지 않는 변경이라면 새 Connector를 따로 등록하는 쪽이 안전하다.

<br>

# Worker 스케일 아웃

파이프라인이 늘어나서 기존 Worker로 감당이 안 되면 Worker를 추가한다.
Distributed 모드에서는 같은 `group.id`로 Worker를 띄우면 자동으로 클러스터에 합류하고,
기존 Task가 새 Worker로 재배치된다.

```bash
# 새 Worker 실행: 기존 Worker와 같은 group.id를 사용한다
connect-distributed.sh worker-new.properties
```

Worker 추가 시 리밸런싱이 발생하면서 잠깐 Task가 멈출 수 있다.
트래픽이 적은 시간대에 진행하는 것을 권한다.

<br>

# 마치며

세 편에 걸쳐 Kafka Connect의 전반적인 내용을 가볍게 다뤘다.
1편에서는 Kafka Connect가 무엇이고 어떤 구조로 돌아가는지를 짚었고,
2편에서는 JDBC 폴링의 한계를 넘어 Debezium으로 CDC 파이프라인을 구성하는 과정을 다뤘다.
그리고 이번 마지막 글에서는 그 파이프라인이 프로덕션에서 안정적으로 돌아가기 위해 챙겨야 할 운영 포인트를 정리했다.

결국 Kafka Connect 운영의 핵심은 **상태를 관찰하고, 실패에 대응하고, 빠르게 복구하는 것**에 있다.
REST API로 Connector 상태를 주기적으로 확인하고, JMX 메트릭으로 병목을 감지하는 것이 기본이다.
에러가 발생했을 때 파이프라인을 멈출지, Dead Letter Topic으로 격리하고 계속 처리할지는
파이프라인의 정합성 요구 수준에 따라 달라진다. 이런 판단 기준을 미리 세워두면
대부분의 운영 상황에 대응할 수 있지 않을까 싶다.

<br>

# 참고

- <a href="https://kafka.apache.org/documentation/#connect_monitoring" target="_blank" rel="nofollow">Apache Kafka Connect Monitoring</a>
- <a href="https://docs.confluent.io/platform/current/connect/monitoring.html" target="_blank" rel="nofollow">Monitoring Kafka Connect and Connectors</a>
