---
layout: post
title: "Redis에 캐시를 얹기 전에 결정할 네 가지"
author: madplay
tags: redis cache eviction cache-aside write-through
description: "Redis에 캐시를 붙이면 빨라지는 건 맞다. 문제는 어떤 패턴으로, 메모리가 차면 뭘 먼저 지우느냐다."
category: Data
date: "2024-05-12 21:36:52"
comments: true
series: "Redis 실무 가이드"
---

# 캐시를 도입하기 전에 결정해야 할 것들

이전 글에서 Redis가 빠른 이유와 자료구조별 활용법을 살펴보았다.
자료구조를 이해하고 나면 자연스럽게 "캐시를 어떻게 운영할 것인가"라는 질문이 따라온다.

- <a href="/post/redis-core-concepts-and-data-structures">이전 글: Redis가 빠른 진짜 이유와 자료구조별 활용법</a>

"DB가 느리니까 Redis를 앞에 두자"는 흔한 제안이다.
하지만 캐시를 도입하는 순간, 데이터 일관성과 운영 복잡도라는 비용이 함께 따라온다.
캐시가 성능을 올려주는 것은 사실이지만, 설계 단계에서 몇 가지를 미리 결정해 두지 않으면
오히려 디버깅이 어려운 장애를 만들어 낼 수 있다.

결정해야 할 항목은 크게 네 가지다.
어떤 패턴으로 캐시를 읽고 쓸 것인지(캐시 패턴), 데이터를 얼마나 오래 보관할 것인지(TTL 전략),
메모리가 가득 찼을 때 어떤 키를 먼저 제거할 것인지(eviction 정책),
원본 데이터가 바뀌었을 때 캐시를 어떻게 갱신할 것인지(무효화 방식)다.

<br>

# 캐시 패턴 비교

캐시 패턴은 "읽기와 쓰기를 캐시와 DB 사이에서 어떻게 조율하느냐"에 따라 나뉜다.
실무에서 가장 많이 마주치는 세 가지 패턴을 살펴본다.

## Cache-Aside (Lazy Loading)

가장 널리 쓰이는 패턴이다. 애플리케이션이 캐시를 직접 관리한다.
읽기 요청이 들어오면 먼저 캐시를 확인하고, 캐시 미스가 발생하면 DB에서 조회한 뒤 결과를 캐시에 적재한다.

```java
public Article getArticle(Long id) {
    String key = "article:" + id;

    // 1. 캐시에서 먼저 조회
    Article cached = redisTemplate.opsForValue().get(key);
    if (cached != null) {
        return cached; // 캐시 히트
    }

    // 2. 캐시 미스 → DB 조회
    Article article = articleRepository.findById(id)
            .orElseThrow(() -> new ArticleNotFoundException(id));

    // 3. 조회 결과를 캐시에 적재 (TTL 5분)
    redisTemplate.opsForValue().set(key, article, Duration.ofMinutes(5));
    return article;
}
```

구현이 단순하고, 실제로 요청된 데이터만 캐시에 올라간다는 것이 장점이다.
반면 첫 요청은 항상 캐시 미스이므로, 서비스 재시작 직후(cold start) 응답 지연이 일시적으로 높아질 수 있다.

## Write-Through

데이터를 쓸 때 캐시와 DB를 동시에 갱신하는 패턴이다.
쓰기를 거친 데이터는 캐시에 최신 상태로 남아 있으므로 일관성이 높다.

단점은 쓰기 지연이 늘어난다는 점이다.
캐시와 DB 두 곳에 모두 써야 하므로 쓰기 경로가 길어진다.
또한 한 번도 읽히지 않을 데이터까지 캐시에 올라가기 때문에 메모리 효율이 떨어질 수 있다.
읽기가 쓰기보다 압도적으로 많고, 데이터 정합성이 중요한 경우에 고려할 만하다.

## Write-Behind (Write-Back)

캐시에 먼저 쓰고, DB 반영은 비동기로 처리하는 패턴이다.
쓰기 성능을 극대화할 수 있지만, 비동기 구간에서 장애가 발생하면 데이터가 유실될 위험이 있다.

배치 처리로 DB 쓰기 횟수를 줄일 수 있다는 장점이 있으나, 구현 복잡도가 높고 장애 시나리오 대응이 까다롭다.
실무에서는 데이터 유실이 허용되는 경우(예: 조회수 집계)에 제한적으로 사용하는 편이다.

## 패턴별 비교

| 패턴 | 읽기 성능 | 쓰기 성능 | 일관성 | 구현 복잡도 |
|------|----------|----------|--------|-----------|
| Cache-Aside | 캐시 히트 시 빠름 | DB 직접 쓰기 | 캐시 미스 시 최신 보장 | 낮음 |
| Write-Through | 쓰기를 거친 데이터는 히트 | 느림 (이중 쓰기) | 높음 | 중간 |
| Write-Behind | 쓰기를 거친 데이터는 히트 | 빠름 (비동기) | 유실 위험 | 높음 |

대부분의 서비스에서는 Cache-Aside로 시작하는 것이 합리적이다.
일관성 요구가 높으면 Write-Through를 검토하고,
Write-Behind는 유실 허용 범위를 명확히 정의한 뒤에 도입하는 것이 안전하다.

<br>

# TTL 설계와 캐시 무효화

TTL(Time To Live)은 캐시의 유효 기간이다. TTL만 설정하면 되는 경우도 있지만, 그렇지 않은 경우도 많다.

기사 목록처럼 약간의 지연이 허용되는 데이터는 TTL만으로 충분하다.
5분 TTL을 걸면 최대 5분간 이전 데이터가 보일 수 있지만, 대부분의 사용자는 이를 인지하지 못한다.
반면 기사 수정 후 즉시 반영되어야 하는 경우에는 명시적 무효화가 필요하다.
수정 API에서 `redisTemplate.delete("article:" + id)`를 호출해 캐시를 제거하면,
다음 조회 시 Cache-Aside 패턴에 의해 최신 데이터가 다시 적재된다.

주의할 점은 **캐시 스탬피드(stampede)** 문제다.
인기 기사의 캐시가 만료되는 순간, 동시에 수백 개의 요청이 캐시 미스를 일으키면 모든 요청이 DB로 몰린다.
대응 방법으로는 TTL에 랜덤 지터(jitter)를 추가하거나, 뮤텍스 락으로 하나의 요청만 DB를 조회하게 하는 방식이 있다.

```java
// TTL에 지터를 추가하는 예시
int baseTtl = 300; // 5분
int jitter = ThreadLocalRandom.current().nextInt(0, 60); // 0~59초
redisTemplate.opsForValue().set(key, article, Duration.ofSeconds(baseTtl + jitter));
```

<br>

# eviction 정책 선택

Redis는 `maxmemory` 설정으로 사용할 수 있는 최대 메모리를 제한한다.
이 한도에 도달했을 때 어떤 키를 제거할 것인지를 결정하는 것이 `maxmemory-policy`다.

주요 정책은 다음과 같다.

| 정책 | 동작 | 적합한 상황 |
|------|------|-----------|
| `noeviction` | 메모리 가득 차면 쓰기 거부 (에러 반환) | 데이터 유실이 절대 불가한 경우 |
| `allkeys-lru` | 모든 키 중 가장 오래 사용되지 않은 키 제거 | 범용 캐시 (가장 많이 사용) |
| `volatile-lru` | TTL이 설정된 키 중 LRU 제거 | 캐시와 영구 데이터가 혼재된 경우 |
| `allkeys-lfu` | 모든 키 중 사용 빈도가 가장 낮은 키 제거 | 접근 빈도 편차가 큰 경우 (Redis 4.0+) |
| `volatile-ttl` | TTL이 설정된 키 중 만료가 가장 임박한 키 제거 | 곧 사라질 데이터를 먼저 정리하고 싶은 경우 |

캐시 전용으로 Redis를 사용한다면 `allkeys-lru`가 무난한 선택이다.
TTL이 있는 캐시 키와 영구 보관해야 하는 키가 공존한다면 `volatile-lru`로 보호할 수 있다.
`allkeys-lfu`는 Redis 4.0에서 추가된 정책으로, 자주 조회되는 인기 데이터를 오래 유지하고 싶을 때 효과적이다.

운영 중에는 `INFO` 명령으로 메모리 사용량과 eviction 발생 횟수를 모니터링하는 것이 좋다.

```bash
redis-cli INFO | grep -E "used_memory_human|maxmemory_human|evicted_keys"
```

<br>

# Spring Boot에서 Redis 캐시 적용하기

Spring Boot에서 Redis를 캐시로 사용하려면 `spring-boot-starter-data-redis`와 `spring-boot-starter-cache` 의존성을 추가한다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

> Spring Boot 3.x부터 Redis 관련 프로퍼티 접두사가 `spring.redis.*`에서 `spring.data.redis.*`로 변경되었다.
> 마이그레이션 시 프로퍼티 키를 확인하는 것이 좋다.

`RedisCacheManager`를 설정하면 TTL과 직렬화 방식을 세밀하게 제어할 수 있다.

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // 기본 TTL 10분
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer()) // JSON 직렬화
                );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
```

이제 `@Cacheable`과 `@CacheEvict`를 사용해 메서드 단위로 캐싱을 적용할 수 있다.

```java
@Service
public class ArticleService {

    // 동일 키로 재호출 시 메서드를 실행하지 않고 캐시에서 반환
    @Cacheable(value = "articles", key = "#id")
    public Article getArticle(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ArticleNotFoundException(id));
    }

    // 데이터 변경 시 해당 캐시 키를 제거 → 다음 조회에서 DB 최신 값 적재
    @CacheEvict(value = "articles", key = "#id")
    @Transactional
    public void updateArticle(Long id, ArticleUpdateRequest request) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ArticleNotFoundException(id));
        article.update(request); // dirty checking으로 변경 반영
    }
}
```

`@Cacheable`이 붙은 메서드는 첫 호출 시 결과를 Redis에 저장하고,
이후 동일한 키로 호출하면 메서드를 실행하지 않고 캐시에서 바로 반환한다.
`@CacheEvict`는 데이터가 변경될 때 해당 캐시 키를 제거한다.
앞서 설명한 Cache-Aside 패턴의 무효화 부분에 해당한다.

<br>

# 돌아보며

캐시는 성능을 올려주지만, 일관성 관리와 운영 복잡도라는 비용을 수반한다.
"Redis를 붙이면 빨라진다"는 사실이지만,
어떤 패턴을 쓸지, TTL을 어떻게 잡을지, eviction 정책은 무엇으로 할지를 고민하지 않으면
캐시가 오히려 장애의 원인이 될 수 있다.

자료구조를 이해하고 캐시 전략까지 잡으면,
Redis를 단순 캐시가 아닌 데이터 구조 서버로 활용하는 폭이 넓어지지 않을까 싶다.

<br>

# 참고

- <a href="https://redis.io/docs/latest/develop/use/client-side-caching/" target="_blank" rel="nofollow">Client-side Caching</a>
- <a href="https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html" target="_blank" rel="nofollow">Redis Cache</a>
