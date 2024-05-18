---
layout: post
title: "Four Decisions to Make Before Adding a Cache Layer to Redis"
author: madplay
tags: redis cache eviction cache-aside write-through
description: "Adding Redis as a cache does make things faster. The real question is which pattern to use and what to evict when memory fills up."
category: Data
date: "2024-05-12 21:36:52"
comments: true
series: "Redis 실무 가이드"
lang: en
slug: redis-cache-strategy-and-eviction
permalink: /en/post/redis-cache-strategy-and-eviction
---

# What to Decide Before Introducing a Cache

In the previous post, we looked at why Redis is fast and how to leverage each data structure.
Once you understand the data structures, the natural next question is: "How do I actually operate a cache?"

- <a href="/en/post/redis-core-concepts-and-data-structures" target="_blank">Previous post: Why Redis Is Really Fast, and How to Use Each Data Structure</a>

"The DB is slow, so let's put Redis in front of it" is a common proposal.
But the moment you introduce a cache, you also take on the cost of data consistency and operational complexity.
Caching does improve performance, but without a few upfront design decisions, it can create bugs that are painfully hard to debug.

There are four key decisions to make:
which pattern to use for reads and writes (cache pattern), how long to keep data (TTL strategy),
which keys to remove first when memory is full (eviction policy),
and how to refresh the cache when the source data changes (invalidation approach).

<br>

# Comparing Cache Patterns

Cache patterns differ based on how you coordinate reads and writes between the cache and the database.
Here are the three patterns you encounter most often in practice.

## Cache-Aside (Lazy Loading)

This is the most widely used pattern. The application manages the cache directly.
When a read request comes in, it checks the cache first. On a cache miss, it queries the DB and then loads the result into the cache.

```java
public Article getArticle(Long id) {
    String key = "article:" + id;

    // 1. Check cache first
    Article cached = redisTemplate.opsForValue().get(key);
    if (cached != null) {
        return cached; // Cache hit
    }

    // 2. Cache miss → query DB
    Article article = articleRepository.findById(id)
            .orElseThrow(() -> new ArticleNotFoundException(id));

    // 3. Load query result into cache (TTL 5 min)
    redisTemplate.opsForValue().set(key, article, Duration.ofMinutes(5));
    return article;
}
```

The implementation is straightforward, and only data that is actually requested ends up in the cache.
On the other hand, the first request always results in a cache miss, so response latency can spike temporarily right after a service restart (cold start).

## Write-Through

This pattern updates the cache and the DB simultaneously on every write.
Because every written piece of data stays up to date in the cache, it provides strong consistency.

The downside is increased write latency.
Writing to both the cache and the DB makes the write path longer.
It also loads data into the cache that may never be read, which can hurt memory efficiency.
Consider this pattern when reads far outnumber writes and data consistency is critical.

## Write-Behind (Write-Back)

This pattern writes to the cache first and asynchronously flushes changes to the DB.
It maximizes write performance, but if a failure occurs during the async window, data can be lost.

Batching can reduce the number of DB writes, but the implementation complexity is high and failure scenarios are tricky to handle.
In practice, teams tend to use this pattern only when data loss is acceptable (e.g., view count aggregation).

## Pattern Comparison

| Pattern | Read Performance | Write Performance | Consistency | Implementation Complexity |
|---------|-----------------|-------------------|-------------|--------------------------|
| Cache-Aside | Fast on cache hit | Direct DB write | Latest on cache miss | Low |
| Write-Through | Hit for written data | Slow (dual write) | High | Medium |
| Write-Behind | Hit for written data | Fast (async) | Risk of data loss | High |

For most services, starting with Cache-Aside is a sensible default.
If you need stronger consistency, evaluate Write-Through.
Write-Behind is safest to adopt only after you have clearly defined the acceptable scope of data loss.

<br>

# TTL Design and Cache Invalidation

TTL (Time To Live) is the expiration period of a cache entry. Sometimes TTL alone is enough, but often it is not.

For data like article lists where a slight delay is acceptable, TTL alone works fine.
A 5-minute TTL means users might see stale data for up to 5 minutes, but most users never notice.
For cases where an article edit must be reflected immediately, explicit invalidation is necessary.
Calling `redisTemplate.delete("article:" + id)` in the update API removes the cache entry,
and the next read re-populates fresh data via the Cache-Aside pattern.

One thing to watch out for is the **cache stampede** problem.
When the cache for a popular article expires, hundreds of simultaneous requests can all miss the cache and flood the DB at once.
Mitigation strategies include adding random jitter to the TTL, or using a mutex lock so that only one request queries the DB.

```java
// Example: adding jitter to TTL
int baseTtl = 300; // 5 minutes
int jitter = ThreadLocalRandom.current().nextInt(0, 60); // 0-59 seconds
redisTemplate.opsForValue().set(key, article, Duration.ofSeconds(baseTtl + jitter));
```

<br>

# Choosing an Eviction Policy

Redis uses the `maxmemory` setting to cap the maximum amount of memory it can use.
The `maxmemory-policy` determines which keys to remove when that limit is reached.

Here are the main policies.

| Policy | Behavior | When to Use |
|--------|----------|-------------|
| `noeviction` | Rejects writes when memory is full (returns error) | When data loss is absolutely unacceptable |
| `allkeys-lru` | Evicts the least recently used key across all keys | General-purpose cache (most commonly used) |
| `volatile-lru` | Evicts LRU among keys with a TTL set | When cache keys and persistent data coexist |
| `allkeys-lfu` | Evicts the least frequently used key across all keys | When access frequency varies widely (Redis 4.0+) |
| `volatile-ttl` | Evicts keys with the nearest expiration among TTL keys | When you want to clean up soon-to-expire data first |

If you use Redis purely as a cache, `allkeys-lru` is the safe default.
If TTL-based cache keys and permanent keys coexist, `volatile-lru` can protect the permanent ones.
`allkeys-lfu`, introduced in Redis 4.0, works well when you want to keep frequently accessed hot data around longer.

In production, it is a good practice to monitor memory usage and eviction counts with the `INFO` command.

```bash
redis-cli INFO | grep -E "used_memory_human|maxmemory_human|evicted_keys"
```

<br>

# Applying Redis Cache in Spring Boot

To use Redis as a cache in Spring Boot, add the `spring-boot-starter-data-redis` and `spring-boot-starter-cache` dependencies.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

> Starting with Spring Boot 3.x, the Redis property prefix changed from `spring.redis.*` to `spring.data.redis.*`.
> It is worth double-checking the property keys when migrating.

Configuring a `RedisCacheManager` gives you fine-grained control over TTL and serialization.

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // Default TTL 10 min
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer()) // JSON serialization
                );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
```

Now you can apply method-level caching with `@Cacheable` and `@CacheEvict`.

```java
@Service
public class ArticleService {

    // On repeated calls with the same key, returns from cache without executing the method
    @Cacheable(value = "articles", key = "#id")
    public Article getArticle(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ArticleNotFoundException(id));
    }

    // On data change, removes the cache key → next read loads the latest value from DB
    @CacheEvict(value = "articles", key = "#id")
    @Transactional
    public void updateArticle(Long id, ArticleUpdateRequest request) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ArticleNotFoundException(id));
        article.update(request); // Reflects changes via dirty checking
    }
}
```

A method annotated with `@Cacheable` stores its result in Redis on the first call,
and subsequent calls with the same key return directly from the cache without executing the method.
`@CacheEvict` removes the corresponding cache key when data changes.
This corresponds to the invalidation step of the Cache-Aside pattern described earlier.

<br>

# Looking Back

Caching improves performance, but it comes with the cost of consistency management and operational complexity.
"Adding Redis makes it faster" is true,
but without thinking through which pattern to use, how to set TTL, and which eviction policy to pick,
the cache itself can become a source of incidents.

Once you understand the data structures and have a caching strategy in place,
it opens up the possibility of using Redis not just as a simple cache, but as a versatile data structure server.

<br>

# References

- <a href="https://redis.io/docs/latest/develop/use/client-side-caching/" target="_blank" rel="nofollow">Client-side Caching</a>
- <a href="https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html" target="_blank" rel="nofollow">Redis Cache</a>
