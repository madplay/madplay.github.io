---
layout: post
title: "MySQL에서 조인과 ORDER BY는 왜 느려질까?"
author: madplay
tags: mysql sql join orderby paging
description: "MySQL에서 조인과 ORDER BY는 왜 느려질까? 중간 결과 크기와 filesort, OFFSET 페이징, 집계 쿼리 관점에서 짚어본다."
category: Data
date: "2022-04-28 14:00:00"
comments: true
---

# 조회 조건보다 중간 결과가 더 큰 문제일 때가 많다

목록 조회 API는 대개 단순해 보인다. 기사와 언론사 정보를 조인하고, 최신순으로 정렬한 뒤, 20건만 내려주면 끝처럼 보인다.
하지만 MySQL 입장에서는 최종 결과가 20건이라는 사실보다 그 20건을 만들기 위해
**얼마나 많은 행을 읽고, 어떤 순서로 결합하고, 정렬을 어디서 수행해야 하는지**가 더 중요하다.

조인과 정렬이 비싸지는 이유도 중간 결과가 커지기 때문이다. 최종 출력이 작아도 중간 결과가 커지면 CPU와 메모리, 디스크 임시 공간 사용량이 빠르게 늘어나므로,
목록 API 성능을 볼 때는 반환 개수보다 먼저 중간 결과의 크기를 상상해 보는 편이 도움이 된다.

<br>

# 범위를 먼저 줄여야 비용이 덜 커진다

조인 문제를 볼 때는 테이블 수보다 먼저, 어떤 시점에 후보를 줄일 수 있는지를 보는 편이 더 정확하다.

## 조인은 읽는 순서에 따라 부담이 달라진다

아래처럼 기사와 언론사를 조인하는 쿼리는 흔하다.

> 이 글은 MySQL 8.0 버전을 기준으로 한다.

```sql
SELECT a.id,
       a.title,
       o.name AS office_name
FROM article a
         INNER JOIN office o ON o.id = a.office_id
WHERE a.status = 'PUBLISHED'
ORDER BY a.published_at DESC LIMIT 20;
```

이 쿼리가 늘 비싼 것은 아니다. 문제는 `WHERE` 절로 충분히 줄이지 못한 상태에서 큰 테이블끼리 결합하거나, 조인 뒤에 다시 정렬이 필요한 경우다.
특히 조인 대상이 늘어나고 각 테이블에서 가져오는 행 수가 커질수록, MySQL은 더 많은 중간 결과를 만들고 비교해야 한다.

실무에서는 "조인이 많아서 느리다"는 말보다 **조인 전에 얼마나 줄였는가**를 먼저 묻는 편이 더 정확하다.
발행된 기사 20건만 먼저 안정적으로 고른 뒤 그 결과에 언론사 정보를 붙이는 구조와, 넓은 범위를 먼저 조인한 뒤 뒤에서 잘라내는 구조는 비용 차이가 크다.

예를 들어 언론사 테이블은 작더라도 기사 테이블이 매우 크다면, 기사 쪽 범위를 얼마나 빨리 줄이느냐가 전체 성능을 좌우한다.
조인은 결국 두 테이블을 이어 붙이는 연산이지만, 그 전에 어느 쪽 후보를 얼마나 좁혔는지가 실제 부담을 결정한다.

<br>

## 상세 화면보다 목록 화면이 더 까다로울 때가 많다

개발 단계에서는 조인이 많은 상세 조회 쿼리가 더 복잡해 보이지만, 운영 환경에서는 호출 횟수가 훨씬 많고 정렬과 페이징이 동반되는 목록 화면이 더 까다로운 경우가 많다.

예를 들어 기사 상세는 아래처럼 한 건을 중심으로 조인할 수 있다.

```sql
SELECT a.id,
       a.title,
       a.body,
       o.name AS office_name,
       v.view_count
FROM article a
         INNER JOIN office o ON o.id = a.office_id
         LEFT JOIN article_view v ON v.article_id = a.id
WHERE a.id = 10001;
```

이 쿼리는 조인이 있어도 기준이 되는 기사 한 건이 먼저 정해진다. 반면 목록은 어떤 20건을 가져올지부터 정해야 한다.
그래서 목록 성능을 볼 때는 조인 자체보다 **어떤 20건을 어떤 비용으로 고르는가**가 먼저다.

<br>

# 정렬과 페이징에서 비용이 커지는 지점

정렬과 페이징은 조인보다 눈에 덜 띄어도, 목록 API에서 비용을 키우는 경우가 많다.

## ORDER BY는 LIMIT가 있어도 공짜가 아니다

`LIMIT 20`이 붙어 있으면 20건만 보고 끝날 것처럼 느껴진다. 하지만 정렬 기준에 맞는 인덱스가 없으면 MySQL은 후보 행을 넓게 읽은 뒤 정렬해서
상위 20건을 골라야 할 수 있다.

```sql
SELECT id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC LIMIT 20;
```

이 쿼리에서 `status`, `published_at` 순서의 인덱스가 잘 맞지 않으면 정렬 비용이 바로 붙는다. 흔히 실행 계획에서 `Using filesort`가 보이면 불안해지는 이유도 이 지점과 연결된다.
모든 filesort가 곧 문제라는 뜻은 아니지만, 호출 빈도가 높은 목록 API라면 인덱스로 정렬까지 해결할 수 있는지 먼저 검토해 볼 만하다.

> 여기서 `filesort`는 추가 정렬 단계가 필요하다는 뜻으로, 정렬 후보가 커질수록 메모리와 임시 공간 사용량이 함께 늘어나기 때문에 운영 환경에서는 지나치기 어려운 신호가 된다.
> 데이터 양이 빠르게 늘어나는 목록 조회에서는 정렬 전략을 초기에 대충 잡아두면 뒤에서 운영 비용으로 돌아오는 경우가 많다.

<br>

## 조인 뒤 정렬하는 구조는 특히 조심해야 한다

아래처럼 언론사 이름으로 필터링한 뒤 기사 목록을 정렬하는 요구도 자주 나온다.

```sql
SELECT a.id,
       a.title,
       a.published_at,
       o.name
FROM article a
         INNER JOIN office o ON o.id = a.office_id
WHERE o.name = 'madplay news'
ORDER BY a.published_at DESC LIMIT 20;
```

겉보기에는 문제 없어 보이지만, 필터가 `office`에서 걸리고 정렬은 `article`의 `published_at`으로 수행된다.
이때 조인 순서와 인덱스 구성이 어긋나면 원하는 결과를 만들기 위해 생각보다 넓은 중간 결과를 만들 수 있다.

그래서 이런 쿼리는 단순히 조인이 있다는 이유보다, 필터와 정렬의 기준이 서로 다른 테이블에 걸쳐 있다는 점을 먼저 봐야 한다.
가능하다면 언론사 식별자는 애플리케이션에서 미리 `office_id`로 바꿔서 기사 테이블 조건으로 직접 거는 편이 더 단순해질 때가 많다.

<br>

## OFFSET 페이징은 뒤로 갈수록 손해가 커진다

정렬과 함께 자주 문제가 되는 부분이 페이징이다. 아래 쿼리는 익숙하지만 페이지가 뒤로 갈수록 비용이 커질 수 있다.

```sql
SELECT id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC LIMIT 20
OFFSET 10000;
```

사용자는 20건만 받지만, MySQL은 앞의 10000건을 건너뛰기 위해 그만큼의 정렬 결과를 지나가야 한다. 데이터가 많은 서비스에서 깊은 페이지까지 열어두면
응답 시간이 갑자기 튀는 이유가 여기에 있다. 그래서 무한 스크롤이나 "다음 페이지" 중심 UX에서는 `OFFSET`보다 마지막 조회 지점을 기준으로 이동하는
키셋 페이징을 검토하는 편이 낫다.

과거 데이터까지 계속 뒤로 넘겨보는 화면에서는 이 차이가 더 크게 나타날 수 있다.
처음 몇 페이지는 괜찮다가, 어느 시점부터 급격히 느려지는 현상은 대개 이런 구조와 연결돼 있다.

<br>

## 집계와 정렬이 함께 오면 요구사항도 같이 돌아봐야 한다

많이 본 기사나 언론사별 조회 수 랭킹처럼 집계 후 정렬하는 쿼리는 더 비싸기 쉽다.

```sql
SELECT a.office_id,
       SUM(v.view_count) AS total_views
FROM article a
         INNER JOIN article_view v ON v.article_id = a.id
WHERE a.status = 'PUBLISHED'
GROUP BY a.office_id
ORDER BY total_views DESC LIMIT 10;
```

이런 종류는 인덱스만으로 해결되지 않는 경우가 많다. 집계 자체가 필요한 연산이기 때문이다. 그래서 단순히 인덱스를 더하기보다, 실시간 집계가 꼭 필요한지,
사전 집계 테이블이나 배치 갱신이 더 맞는지까지 같이 검토해야 한다.

특히 랭킹 화면은 사용자가 보는 결과가 단순해서 금방 구현할 수 있을 것처럼 느껴진다. 하지만 데이터베이스에는 가장 까다로운 요구 중 하나가 되기 쉽다.
실시간성, 정렬, 집계, LIMIT가 동시에 붙기 때문이다.

<br>

# 조인과 정렬 문제는 결국 범위를 줄이는 문제다

조인과 정렬이 비싸지는 이유를 이해하면, 많은 쿼리의 문제는 SQL 문법보다 조회 요구사항과 데이터 접근 방식의 조합에서 생긴다는 점이 보인다.
결국 중요한 것은 "무엇을 조인했는가"보다 **어디서 결과를 줄였고 어디서 비용이 커졌는가**다.

관련 데이터가 함께 보이는 화면이 많다고 해서 모든 조회를 조인 하나로 해결하려고 하기보다,
목록 기준을 먼저 만들고 필요한 정보를 뒤에 붙이는 편이 더 단순하고 예측 가능할 때가 많다.

<br>

# 정리하며

조인과 ORDER BY가 비싸지는 이유는 결국 중간 결과가 커지기 때문이다. 최종 결과가 20건이어도 그 앞에서 넓은 범위를 읽고 결합하고 정렬하면 비용은 빠르게 커진다.

목록과 랭킹 화면이 많은 시스템에서는 SQL 문장 자체보다 범위를 어디서 줄였는지, 정렬을 어디서 처리하는지를 먼저 보는 편이 더 현실적이다.
그 기준이 잡히면 조인과 정렬 문제도 훨씬 덜 막연하게 다가온다.

<br>

# 참조

- <a href="https://dev.mysql.com/doc/mysql/8.0/en/nested-loop-joins.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: Nested-Loop Join Algorithms</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/hash-joins.html" target="_blank" rel="nofollow">MySQL 8.0 Reference
  Manual: Hash Join Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/order-by-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: ORDER BY Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: LIMIT Query Optimization</a>
