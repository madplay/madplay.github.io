---
layout: post
title: "Kafka 토픽 설정값 정리"
author: madplay
tags: kafka topic configuration
description: "Kafka 토픽에서 자주 쓰는 설정값(retention, cleanup.policy, 복제, 메시지 크기)을 예시와 함께 알아보자"
category: Backend
date: "2023-04-04 14:27:53"
comments: true
---

# 토픽 설정값을 알아두면 운영이 편해진다

카프카를 처음 도입할 때는 파티션 수와 복제 개수 정도만 보고 넘어가는 경우가 많다.
그런데 운영 단계로 들어가면 보관 기간, 정리 정책, 메시지 크기 제한 같은 토픽 설정값이 장애 복구 시간과 직접 연결된다.
특히 재처리 요구가 있는 시스템이라면 토픽 설정은 단순한 옵션이 아니라 데이터 복구 전략의 일부다.

> 이 글은 2023년 4월 기준(Kafka 3.4 문서 기준)으로 작성되었습니다.

<br>

# 토픽 설정을 바꾸는 방법
토픽 설정은 생성 시점에도 넣을 수 있고 운영 중에도 변경할 수 있다. 먼저 운영에서 가장 자주 쓰는 CLI 방식부터 보자.

```bash
# 토픽 생성 시 설정
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic order-events \
  --partitions 12 --replication-factor 3 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000

# 기존 토픽 설정 변경
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --add-config retention.ms=259200000

# 현재 설정 조회
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe
```

참고로 여러 값을 한 번에 변경할 때는 `--add-config key=value,key2=value2`처럼 쉼표로 묶어 적용하는 방식을 많이 쓴다.

CLI 외에 애플리케이션 코드에서 제어해야 하는 경우도 있다. 이럴 때는 `AdminClient`를 사용할 수 있다. 다만 스프링 환경에서는 `KafkaAdmin`이나
IaC 도구(예: `Terraform`, `Ansible`, `Pulumi`)를 함께 쓰는 경우도 많다.

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

try (AdminClient adminClient = AdminClient.create(props)) {
    ConfigResource topicResource =
        new ConfigResource(ConfigResource.Type.TOPIC, "order-events");

    Collection<AlterConfigOp> configOps = List.of(
        new AlterConfigOp(new ConfigEntry("retention.ms", "604800000"), AlterConfigOp.OpType.SET),
        new AlterConfigOp(new ConfigEntry("min.insync.replicas", "2"), AlterConfigOp.OpType.SET)
    );

    adminClient.incrementalAlterConfigs(Map.of(topicResource, configOps)).all().get();
}
```

주의할 점은 토픽 레벨 설정이 브로커 기본값을 덮어쓴다는 점이다. 운영 환경마다 기준 없이 개별 토픽을 수정하면, 나중에 원인 분석이 어려워질 수 있다.
설정 변경 전에 어떤 값을 토픽 단위로 오버라이드할지 기준을 먼저 정해두면 이런 혼선을 줄일 수 있다. 아래 표는 그 기준을 잡을 때 참고할 수 있는 예시다.

<br>

# 브로커 기본값과 토픽 오버라이드
실무에서 혼선이 잦은 부분이 "브로커 기본값"과 "토픽별 오버라이드"다. 아래처럼 기준을 두면 운영 문서화에 도움이 된다.

| 항목                    | 브로커 기본값 사용           | 토픽 오버라이드 권장                   |
|-----------------------|----------------------|-------------------------------|
| `retention.ms`        | 모든 도메인 보관 정책이 같은 경우  | 재처리 기간이 토픽마다 다른 경우            |
| `cleanup.policy`      | 이벤트 스트림 위주로 단일 정책일 때 | compact/delete를 토픽 성격별로 분리할 때 |
| `min.insync.replicas` | 모든 토픽의 내구성 요구가 비슷할 때 | 결제/정산 등 핵심 토픽만 더 강하게 보호할 때    |
| `max.message.bytes`   | 페이로드 크기가 전체적으로 균일할 때 | 일부 토픽만 큰 메시지를 처리할 때           |

한 번 정한 오버라이드 기준은 표로 남겨서 운영팀과 개발팀이 같이 관리하는 편이 더 안전하다.

<br>

# 보관 정책: retention 계열
이제 실제 설정값을 보자. 재처리 가능 기간은 보관 정책의 영향을 크게 받는다.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name payment-events \
  --alter --add-config retention.ms=1209600000,retention.bytes=10737418240
```

- `retention.ms`: 메시지 보관 시간
- `retention.bytes`: 파티션별 최대 로그 크기
- `segment.ms`, `segment.bytes`: 로그 세그먼트 롤링 기준

예를 들어 결제 데이터 재처리 요구가 7일이라면 `retention.ms`를 그보다 짧게 두지 않는 편이 좋다.
`retention.ms`와 `retention.bytes`를 동시에 설정하면, 시간/크기 중 **먼저 도달한 조건**으로 세그먼트(Segment)가 정리된다.
그리고 `retention.bytes`, `retention.ms`는 `cleanup.policy=delete`가 적용되는 경로에서 동작한다.

토픽에서 `segment.ms`를 따로 지정하지 않으면 브로커 `log.roll.ms`를 따른다. 브로커 기본값 기준으로는 7일(604800000ms)이다.
retention을 짧게 잡았다면 segment도 함께 줄여 삭제 반영 단위를 맞추는 경우가 많다.
주의할 점은 세그먼트를 지나치게 작게 잡으면 파일 개수가 늘어나고, 인덱스/정리 I/O가 증가할 수 있다는 점이다.
반대로 너무 크게 잡으면 삭제·정리 반영이 늦어질 수 있다.

<br>

# 정리 정책: cleanup.policy
`cleanup.policy`는 토픽 성격을 사실상 좌우한다.
보관 기간을 정했다면, 다음은 어떤 방식으로 정리할지를 결정하면 된다.

```bash
# 일반 이벤트 스트림
--add-config cleanup.policy=delete

# 최신 상태를 키 기준으로 유지하는 토픽
--add-config cleanup.policy=compact

# 둘 다 적용
--add-config cleanup.policy=delete,compact
```

`compact`는 같은 key의 최신 레코드를 남기는 방식이라 상태성 데이터에 맞다.
예를 들어 `userId`별 최신 알림 설정 값을 유지할 때 유용하다.

compact 토픽을 운영할 때는 아래 두 값을 같이 보면 이해가 빠르다.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name user-preferences \
  --alter --add-config cleanup.policy=compact,min.compaction.lag.ms=60000,delete.retention.ms=86400000
```

- `min.compaction.lag.ms`: compact 대상이 되기 전 최소 유지 시간
- `delete.retention.ms`: tombstone 유지 시간(삭제 전파 보장)

특히 `delete.retention.ms`는 늦게 합류한 컨슈머가 tombstone을 읽어 삭제 상태를 맞추는 데 영향을 준다.

```java
public class UserProfileConsumer {

    public void handle(ConsumerRecord<String, String> record) {
        String userId = record.key();
        String requestId = extractRequestId(record.headers());

        log.info("consume user-profile event key={}, partition={}, offset={}, requestId={}",
            userId, record.partition(), record.offset(), requestId);

        if (alreadyProcessed(requestId)) {
            return; // 중복 소비를 허용하고 결과는 한 번만 반영
        }

        applyLatestProfile(record.value());
        markProcessed(requestId);
    }
}
```

주의할 점은 compaction이 즉시 수행되지 않을 수 있다는 점이다. 따라서 컨슈머는 중복 레코드 수신을 전제로 멱등하게 작성하는 편이 안전하다.

<br>

# 복제 정책: replication.factor, min.insync.replicas
토픽 내구성은 복제 설정의 영향이 크다.
정리 정책을 봤다면, 장애 시 데이터 보존과 관련된 복제 설정도 함께 확인하는 편이 좋다.

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic invoice-events \
  --partitions 6 --replication-factor 3

kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name invoice-events \
  --alter --add-config min.insync.replicas=2
```

- `replication.factor`: 복제본 개수
- `min.insync.replicas`: 쓰기 ack를 받기 위한 최소 ISR 개수

프로듀서 `acks=all`과 함께 사용하면 장애 상황에서도 데이터 손실 가능성을 낮출 수 있다. 주의할 점은 값을 너무 높게 잡으면 가용성이 떨어질 수 있다는 점이다.
예를 들어 복제 3에 `min.insync.replicas=3`이면 브로커 1대 장애만으로도 쓰기가 실패할 수 있다.

운영에서 자주 보는 실패 시나리오는 아래와 같다.

```text
조건: replication.factor=3, acks=all
- min.insync.replicas=2, 브로커 1대 장애 -> ISR=2, 쓰기 성공 가능
- min.insync.replicas=3, 브로커 1대 장애 -> ISR=2, 쓰기 실패(NotEnoughReplicas)
```

내구성을 높이려다 가용성이 급격히 떨어질 수 있으니, 비즈니스 중요도별로 토픽을 분리해서 값을 다르게 두는 방식을 많이 사용한다.

<br>

# 메시지 크기와 압축
메시지 크기 제한과 압축은 저장 비용과 네트워크 비용에 직접 영향을 준다.
복제 정책을 정한 뒤에는 전송/저장 비용과 직결되는 크기, 압축 값을 함께 맞추면 된다.

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name image-jobs \
  --alter --add-config max.message.bytes=2097152,compression.type=zstd
```

- `max.message.bytes`: 토픽에서 허용하는 최대 메시지 크기
- `compression.type`: producer, uncompressed, gzip, snappy, lz4, zstd

`max.message.bytes`는 압축이 켜져 있다면 "압축 후 레코드 배치" 크기를 기준으로 제한한다.
프로듀서 `max.request.size`와 브로커 `message.max.bytes`, 토픽 `max.message.bytes`는 함께 맞춰보는 편이 좋다.
실무에서는 보통 프로듀서 한도가 브로커/토픽 한도보다 크지 않게 맞춘다.

메시지를 크게 키우기 전에 먼저 스토리지 분리 전략을 검토해볼 수 있다. 예를 들어 본문은 오브젝트 스토리지에 두고,
카프카에는 메타데이터와 경로만 넣는 방식이 네트워크/복제/디스크 비용 측면에서 유리한 편이다.

<br>

# 재시도/타임아웃/에러 분류를 함께 보는 이유
토픽 값을 잘 잡아도 컨슈머 에러 처리가 부실하면 운영 장애가 반복될 수 있다.
그래서 토픽 설정과 애플리케이션 처리 정책을 따로 떼어 보지 않는 편이 좋다.

```java
public class OrderEventConsumer {

    public void consume(ConsumerRecord<String, OrderEvent> record) {
        String orderId = record.key();
        String traceId = extractTraceId(record.headers());

        try {
            processWithTimeout(record.value(), Duration.ofSeconds(2));
        } catch (TimeoutException e) {
            // 일시 오류: 재시도 가능
            log.warn("transient error(timeout) key={}, partition={}, offset={}, traceId={}",
                orderId, record.partition(), record.offset(), traceId);
            throw e;
        } catch (InvalidOrderStateException e) {
            // 영구 오류: 재시도해도 동일 실패
            log.error("permanent error key={}, partition={}, offset={}, traceId={}",
                orderId, record.partition(), record.offset(), traceId, e);
            sendToDeadLetter(record);
        }
    }
}
```

일시 오류(네트워크 타임아웃, 외부 API 지연)와 영구 오류(스키마 불일치, 비즈니스 검증 실패)를 구분하지 않으면, 불필요한 재시도로 지연과 비용이 커진다.
토픽 보관 기간(`retention.ms`)은 이 재시도 정책과 맞물린다. 재시도 대기와 재처리 윈도우를 포함해도 데이터가 남아 있어야 복구가 수월하다.

<br>

# 운영 시작값 예시
아래 값은 정답이 아니라, 운영 초기에 기준선을 잡기 위한 예시다.
앞에서 본 설정값을 적용할 때는 아래처럼 시작해볼 수 있다.

```text
- 이벤트 토픽: cleanup.policy=delete, retention.ms=604800000(7일)
- 상태 토픽: cleanup.policy=compact, delete.retention.ms 기본값 유지 후 관찰
- 복제: replication.factor=3, min.insync.replicas=2, producer acks=all
- 압축: compression.type=zstd (버전/호환성 확인 필요)
- 파티션: 예상 TPS와 컨슈머 병렬도 기준으로 시작 후 확장
```

핵심은 "토픽 설정값만" 보지 않는 것이다. 재시도, 멱등 처리, 장애시 로그 컨텍스트(key, partition, offset, traceId)까지 같이 맞춰두면
실제 복구 시간을 줄이는 데 도움이 된다.

<br>

# 운영 체크리스트
설정 변경 전후에는 아래 항목을 확인해두는 편이 안전하다.
실제 운영 반영 단계에서는 아래 순서로 점검하면 놓치는 항목을 줄일 수 있다.

```bash
# 1) 변경 전 현재값 백업
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe > order-events-config-before.txt

# 2) 변경 적용
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --add-config retention.ms=604800000

# 3) 변경 반영 확인
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --describe

# 롤백 시) 브로커 기본값/클러스터 기본 동적 설정으로 복귀
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name order-events \
  --alter --delete-config retention.ms
```

`--delete-config`는 일반 변경 단계보다는 롤백 시점이나 기본 정책으로 되돌릴 때 주로 사용한다.
롤백은 "이전 값을 다시 설정"하거나 "토픽 오버라이드를 제거해 기본값을 따르게 하는 방식"으로 진행할 수 있다.
그래서 변경 전 설정 스냅샷을 남기는 습관이 중요하다.

<br>

# 참고
- <a href="https://kafka.apache.org/34/documentation.html#topicconfigs" target="_blank" rel="nofollow">Apache Kafka 3.4 - Topic Configs</a>
- <a href="https://kafka.apache.org/34/documentation.html#basic_ops_modify_topic_configs" target="_blank" rel="nofollow">Apache Kafka 3.4 - Modifying Topic Configurations</a>
- <a href="https://kafka.apache.org/34/javadoc/org/apache/kafka/clients/admin/AdminClient.html" target="_blank" rel="nofollow">Apache Kafka 3.4 AdminClient Javadoc</a>
