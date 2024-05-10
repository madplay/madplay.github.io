---
layout: post
title: "Redis가 빠른 진짜 이유와 자료구조별 활용법"
author: madplay
tags: redis data-structure cache in-memory
description: "Redis가 빠르다는 건 알겠는데, String 외에 어떤 자료구조를 언제 꺼내 쓸 수 있을까?"
category: Data
date: "2024-05-11 08:23:17"
comments: true
series: "Redis 실무 가이드"
---

# 왜 다들 Redis를 쓸까

DB 앞에 Redis 같은 캐시를 하나 두면 응답 시간이 절반으로 줄어든다는 이야기를 들어본 적이 있을 것이다.
실시간 랭킹을 보여줘야 하는데 매번 `ORDER BY` 쿼리를 날리기엔 부담이 크고,
세션 스토어를 애플리케이션 서버 메모리에 두자니 인스턴스가 늘어날 때 문제가 된다.
이런 상황에서 Redis가 자주 언급된다.

캐시, 세션 스토어, 분산 락, 실시간 랭킹, 메시지 큐까지. Redis가 쓰이는 범위는 넓다.
단순히 "빠른 Key-Value 저장소"라고만 보기엔, 제공하는 자료구조와 활용 패턴이 꽤 다양하다.
이 글에서는 Redis가 빠른 이유를 먼저 짚고, 자료구조별로 실무에서 어떻게 쓸 수 있는지 기사(Article) 도메인을 예시로 살펴본다.

<br>

# Redis가 빠른 이유

Redis의 속도는 하나의 요인이 아니라 여러 설계 결정이 겹쳐서 나온 결과다.

**인메모리 저장.** 데이터를 디스크가 아닌 메모리에 보관한다.
디스크 I/O가 빠져있으므로 읽기/쓰기 모두 마이크로초 단위로 처리된다.
RDBMS에서 [슬로우 쿼리가 디스크 I/O에 묶이는 상황](/post/how-to-analyze-mysql-slow-query)과 비교하면 차이가 크다.

**싱글 스레드 이벤트 루프.** Redis는 명령어 처리를 단일 스레드에서 수행한다.
멀티 스레드 모델에서 발생하는 컨텍스트 스위칭과 락 경합이 없다.
대신 I/O 멀티플렉싱(epoll, kqueue)으로 수천 개의 클라이언트 연결을 동시에 처리한다.

**단순한 자료구조.** 내부적으로 해시 테이블, 스킵 리스트, 압축 리스트 등 시간 복잡도가 낮은 구조를 사용한다.
대부분의 기본 연산이 O(1) 또는 O(log N)이어서 데이터 양이 늘어도 지연이 급격히 증가하지 않는다.

물론 트레이드오프도 있다. 메모리에 모든 데이터를 올려야 하므로 용량에 한계가 있고,
싱글 스레드 특성 때문에 `KEYS *`처럼 모든 키를 순회하는 명령은 전체 요청을 블로킹한다.
운영 환경에서는 `SCAN` 명령으로 대체하는 편이 안전하다.

> Redis 6.0부터 I/O 처리에 멀티 스레드를 도입했지만, 명령어 실행 자체는 여전히 싱글 스레드다.
> "Redis는 싱글 스레드"라는 문장은 명령어 처리 관점에서는 여전히 유효하다.

<br>

# 자료구조별 실무 활용

Redis를 "Key-Value 저장소"라고만 부르면 절반만 설명하는 셈이다.
String 외에도 Hash, List, Set, Sorted Set 등 다양한 자료구조를 제공하며, 각각 어울리는 사용 패턴이 다르다.
아래에서는 기사(Article) 서비스를 예시 도메인으로 삼아 각 자료구조의 활용법을 살펴본다.

## String: 캐시의 기본

가장 단순하면서도 가장 많이 쓰이는 자료구조다. 키 하나에 문자열 값 하나를 저장한다.
DB 조회 결과를 JSON 직렬화해서 캐싱하는 패턴이 대표적이다.

```bash
# 기사 상세 조회 결과를 캐싱 (TTL 300초)
SET article:1024 '{"id":1024,"title":"Redis 입문","author":"madplay"}' EX 300

# 캐시에서 조회
GET article:1024
```

TTL을 설정하면 만료 시 자동으로 키가 삭제된다.
캐시 용도에서는 TTL 없이 데이터를 넣는 일이 거의 없으므로,
`SET` 명령에 `EX`(초 단위) 또는 `PX`(밀리초 단위)를 함께 지정하는 습관을 들이는 것이 좋다.

## Hash: 객체의 필드별 접근

Hash는 하나의 키 아래에 여러 필드-값 쌍을 저장한다.
객체 전체를 직렬화하지 않고도 특정 필드만 읽거나 수정할 수 있다.

```bash
# 기사의 메타 정보를 Hash로 저장
HSET article:1024:meta title "Redis 입문" viewCount 0 likeCount 0

# 조회수만 1 증가
HINCRBY article:1024:meta viewCount 1

# 특정 필드만 조회
HGET article:1024:meta viewCount
```

`viewCount`처럼 자주 변경되는 필드가 있는 객체라면, String으로 전체를 직렬화하는 것보다 Hash가 효율적이다.
매번 전체 JSON을 읽고 수정하고 다시 쓸 필요 없이, 필요한 필드만 원자적으로 갱신할 수 있다.

## List: 최근 N건 조회

List는 양방향 연결 리스트 구조로, 양쪽 끝에서 삽입과 삭제가 O(1)이다.
"최근 기사 목록"처럼 순서가 중요하고, 제한된 개수만 유지해야 하는 경우에 적합하다.

```bash
# 새 기사가 등록될 때마다 왼쪽에 추가
LPUSH recent:articles 1024
LPUSH recent:articles 1025

# 최근 10건 조회
LRANGE recent:articles 0 9

# 리스트 길이를 20으로 제한 (오래된 항목 자동 제거)
LTRIM recent:articles 0 19
```

`LPUSH`와 `LTRIM`을 함께 쓰면 고정 길이 큐를 간단히 구현할 수 있다.
다만 리스트 중간 요소에 접근하는 연산(`LINDEX`, `LINSERT`)은 O(N)이므로,
인덱스 기반 랜덤 접근이 빈번하다면 다른 자료구조를 고려하는 편이 낫다.

## Set: 중복 제거

Set은 순서가 없고 중복을 허용하지 않는 집합이다.
"이 사용자가 이미 좋아요를 눌렀는가?" 같은 멤버십 확인에 유용하다.

```bash
# 사용자 42가 기사 1024에 좋아요
SADD article:1024:likes user:42

# 같은 사용자가 다시 눌러도 중복 추가되지 않음
SADD article:1024:likes user:42  # 반환값: 0 (이미 존재)

# 좋아요 수 확인
SCARD article:1024:likes

# 특정 사용자의 좋아요 여부 확인
SISMEMBER article:1024:likes user:42
```

교집합(`SINTER`), 합집합(`SUNION`), 차집합(`SDIFF`) 연산도 지원하므로,
"기사 A와 B 모두에 좋아요를 누른 사용자"를 구하는 것도 한 줄이면 된다.

## Sorted Set: 스코어 기반 랭킹

Sorted Set은 Set과 비슷하지만 각 멤버에 스코어(score)가 붙어 있어 자동으로 정렬된다.
실시간 인기 기사 순위처럼 스코어 기반 랭킹이 필요한 곳에서 빛을 발한다.

```bash
# 기사별 조회수를 스코어로 사용
ZADD popular:articles 150 article:1024
ZADD popular:articles 320 article:1025
ZADD popular:articles 89 article:1026

# 조회수 증가 (스코어를 1 올림)
ZINCRBY popular:articles 1 article:1024

# 상위 5개 기사 (스코어 내림차순)
ZRANGE popular:articles 0 4 REV WITHSCORES
```

> `ZREVRANGE`는 Redis 6.2부터 deprecated되었다. `ZRANGE ... REV`로 동일한 결과를 얻을 수 있다.

내부적으로 스킵 리스트를 사용하므로 삽입과 삭제는 O(log N), 범위 조회는 O(log N + M)(M은 반환 원소 수)이다.
수백만 건의 데이터에서도 랭킹 조회가 밀리초 단위로 가능한 이유다.

<br>

# 인메모리인데 데이터가 날아가면?

Redis는 인메모리 저장소이므로, 서버가 재시작되면 데이터가 사라진다.
이를 보완하기 위해 두 가지 영속성 메커니즘을 제공한다.

**RDB(Redis Database) 스냅샷.** 특정 시점의 전체 데이터를 바이너리 파일로 저장한다.
복원 속도가 빠르지만, 마지막 스냅샷 이후의 변경분은 유실될 수 있다.

**AOF(Append Only File).** 모든 쓰기 명령을 로그 파일에 순차적으로 기록한다.
데이터 유실 범위가 작지만, 파일 크기가 커지고 복원 시간이 RDB보다 길다.

| 방식 | 복구 속도 | 데이터 안전성 | 파일 크기 |
|------|----------|-------------|----------|
| RDB | 빠름 | 마지막 스냅샷 이후 유실 가능 | 작음 |
| AOF | 상대적으로 느림 | 유실 범위 작음 (설정에 따라 1초 이내) | 큼 |

실무에서는 RDB와 AOF를 병행하는 구성을 많이 사용한다.
RDB로 빠르게 복원하고, AOF로 마지막 스냅샷 이후의 데이터를 보완하는 방식이다.
반면 캐시 전용으로 사용한다면, 원본 데이터가 DB에 있으므로 영속성을 아예 끄는 것도 선택지가 될 수 있다.

<br>

# 돌아보며

Redis를 처음 접하면 "빠른 캐시"라는 인상이 강하지만,
실제로는 다양한 자료구조를 제공하는 인메모리 데이터 구조 서버에 가깝다고 생각한다.
String으로 단순 캐싱만 하는 것은 Redis가 가진 능력의 일부만 쓰는 셈이다.

자료구조를 이해하고 나면 자연스럽게 "캐시를 어떤 전략으로 운영할 것인가"라는 질문이 따라온다.
다음 글에서는 Cache-Aside, Write-Through 같은 캐시 패턴과 eviction 정책 선택 기준을 다룬다.

- <a href="/post/redis-cache-strategy-and-eviction">다음 글: Redis에 캐시를 얹기 전에 결정할 네 가지</a>

<br>

# 참고

- <a href="https://redis.io/docs/latest/develop/data-types/" target="_blank" rel="nofollow">Redis Data Types</a>
- <a href="https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/" target="_blank" rel="nofollow">Redis Persistence</a>
