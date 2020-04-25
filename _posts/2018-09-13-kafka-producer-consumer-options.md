---
layout:   post
title:    Java Kafka Producer, Consumer configs 설정
author:   Kimtaeng
tags: 	  java kafka 
description: Kafka Producer와 Kakfa Consumer의 configs를 설정해보자. 
category: Java
comments: true
---

# 앞선 글에서는
주키퍼(zookeeper)를 설치하고 카프카 토픽(kafka topic)을 생성하는 과정을 한 후에
자바 Kafka API를 이용하여 Kafka Producer와 Kafka Consumer를 구현해보았습니다.

- <a href="/post/java-kafka-example" target="_blank">이전 글: Java Kafka Producer, Consumer 예제 구현</a> 

이번 글에서는 프로듀서와 컨슈머를 사용할 때 설정하는 옵션들에 대해서 알아봅니다.

<br><br>

# Kafka Producer configs 설정
- **bootstrap.servers**
  - 연결할 서버 정보입니다. `host1:port1,host2:port2`와 같이 여러개를 나열할 수 있습니다.
  - 초기 커넥션 연결시에 사용하기 때문에, 모든 서버 리스트를 포함할 필요는 없습니다.
  실제 메시지 전송시에는 새로운 커넥션을 맺은 다음에 전송하기 때문이지요.
- **key.serializer, value.serializer**
  - 메시지를 serialize 할 때 사용할 클래스를 지정하면 됩니다.
  - `ByteArraySerializer`, `StringSerializer` 등등 `Serializer`를 implements한 클래스들이 있습니다.
- **partitioner.class**
  - 어떤 파티션에 메시지를 전송할지 결정하는 클래스입니다.
  - 기본값은 `DefaultPartitioner`이며 메시지 키의 해시값을 기반으로 전송할 파티션을 결정합니다.
- **acks**
  - 프로듀서가 전송한 메시지를 카프카가 잘 받은 걸로 처리할 기준을 말합니다.
  - `0, 1, all` 값으로 세팅할 수 있으며 각각 메시지 손실률과 전송 속도에 대해 차이가 있습니다.
  - | 설정값 | 손실률 | 속도 | 설명 |
    |--------|--------|--------|--------|
    | acks = 0 | 높음 | 빠름 | 프로듀서는 서버의 확인을 기다리지 않고<br/> 메시지 전송이 끝나면 성공으로 간주합니다. |
    | acks = 1 | 보통 | 보통 | 카프카의 leader가 메시지를 잘 받았는지만 확인합니다. |
    | acks = all | 낮음 | 느림 | 카프카의 leader와 follower까지 모두 받았는지를 확인합니다. |
  - 기본값은 `acks=1` 옵션입니다.
- **buffer.memory**
  - 프로듀서가 서버로 전송 대기중인 레코드를 버퍼링하는데 사용할 수 있는 메모리 양입니다.
  - 레코드가 서버에 전달될 수 있는 것보다더 빨리 전송되면 `max.block.ms`동안 레코드를 보내지 않습니다.
  - 기본값은 33554432, 약 `33MB`입니다.
- **retries**
  - 프로듀서가 에러가 났을때 다시 시도할 횟수를 말합니다.
  - 0보다 큰 숫자로 설정하면 그 숫자만큼 오류 발생시에 재시도합니다.
- **max.request.size**
  - 요청의 최대 바이트 크기를 말합니다. 대용량 요청을 보내지 않도록 제한할 수 있습니다.
  - 카프카 서버에도 별도로 설정할 수 있으므로 서로 값이 다를 수 있습니다.
- **connections.max.idle.ms**
  - 지정한 시간 이후에는 idle 상태의 연결을 닫습니다.
- **max.block.ms**
  - 버퍼가 가득 찼거나 메타데이터를 사용할 수 없을 때 차단할 시간을 정할 수 있습니다.
- **request.timeout.ms**
  - 클라이언트가 요청 응답을 기다리는 최대 시간을 정할 수 있습니다.
  - 정해진 시간 전에 응답을 받지 못하면 다시 요청을 보내거나 재시도 횟수를 넘어서면 요청이 실패합니다.
- **retry.backoff.ms**
  - 실패한 요청에 대해 프로듀서가 재시도하기 전에 대기할 시간을 말합니다.
- **producer.type**
  - 메시지를 동기(sync), 비동기(async)로 보낼지 선택할 수 있습니다.
  - 비동기를 사용하는 경우 메시지를 일정 시간동안 쌓은 후 전송하므로 처리 효율을 향상시킬 수 있습니다.

<br><br>

# Kafka Consumer configs 설정
- **group.id**
  - 컨슈머 그룹을 식별하는 고유 아이디입니다. 메시지를 전송할 때 지정하는 topic 이름과 다릅니다.
  - Zookeeper에서는 각 그룹의 메시지 offset을 관리하는데 그룹 id가 같으면 offset값 또한 공유됩니다.
- **bootstrap.servers**
  - 프로듀서와 동일합니다. 연결할 정보를 말합니다.
- **fetch.min.bytes**
  - 한번에 가져올 수 있는 최소한의 데이터 크기를 말합니다.
  - 기본값인 1의 경우에는 즉시 가져오는 것을 뜻하며 1보다 크거나 데이터가 설정한 값보다 작은 경우에는
  요청을 처리하지 않고 대기합니다.
- **auto.offset.reset**
  - 카프카의 초기 offset이 없거나 데이터가 삭제하여 현재 존재하지 않는 경우에 아래의 설정을 따릅니다.
    - earliest : 가장 빠른 오프셋으로 자동 재설정합니다.
    - latest : 최신 오프셋으로 자동 재설정합니다.
    - none : 이전 오프셋이 발견되지 않으면 컨슈머 그룹에 예외를 던집니다.
    - anything else : 컨슈머에게 예외을 던집니다.
  - 기본값은 `latest`로 설정되어 있습니다.
- **session.timeout.ms**
  - 컨슈머의 실패를 감지하는데 쓰이는 타임아웃입니다.
  - 브로커와의 세션 타임아웃 시간인데, 타임아웃이 발생하면 컨슈머는 종료되거나 장애로 인식되고
  브로커는 해당 컨슈머를 그룹에서 제외하고 리밸런싱을 시도합니다.
  - 참고로 컨슈머는 브로커에게 자기가 살아있음을 나타내기 위해 신호(heartbeat)를 보냅니다.
- **heartbeat.interval.ms**
  - 살아있음을 알리는 신호(heartbeat)의 예상 시간을 설정할 수 있습니다.
  - 새로운 컨슈머가 그룹에 속해지거나 제외될 때 재조정을 위해 유용하게 사용될 수 있습니다.
  - `session.timeout.ms` 값보다 낮게 설정해야 합니다.
- **max.poll.interval.ms**
  - 살아있다고 신호를 보내지만 실제로 메시지를 소비하지 않는 경우, poll이 호출되지 않으면
  컨슈머는 실패된 것으로 간주됩니다.
  - 컨슈머 그룹은 다른 구성원에게 파티션을 재할당하기 위해 재조정됩니다.

<br><br>

# 그 외의 더 자세한 Kafka configs 설정 방법

- <a href="https://kafka.apache.org/documentation/#producerconfigs" rel="nofollow" target="_blank">
Kafka Apache - Producer Configs</a>
- <a href="https://kafka.apache.org/documentation/#consumerconfigs" rel="nofollow" target="_blank">
Kafka Apache - Consumer Configs</a>