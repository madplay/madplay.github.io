---
layout: post
title: "Why Redis Is Fast and How to Use Each Data Structure"
author: madplay
tags: redis data-structure cache in-memory
description: "Everyone knows Redis is fast, but when should you reach for Hash, List, Set, or Sorted Set instead of plain String?"
category: Data
date: "2024-05-11 08:23:17"
comments: true
series: "Redis 실무 가이드"
lang: en
slug: redis-core-concepts-and-data-structures
permalink: /en/post/redis-core-concepts-and-data-structures
---

# Why Everyone Uses Redis

You have probably heard that placing a cache like Redis in front of your database can cut response times in half.
When you need to display real-time rankings, running an `ORDER BY` query every time is expensive.
When you store sessions in application server memory, scaling out becomes a headache.
Redis keeps coming up in exactly these situations.

Caching, session storage, distributed locks, real-time leaderboards, message queues: Redis covers a wide range of use cases.
Calling it just "a fast key-value store" undersells the variety of data structures and usage patterns it offers.
This post starts with why Redis is fast, then walks through each data structure with practical examples from an Article domain.

<br>

# Why Redis Is Fast

Redis owes its speed not to a single factor but to several design decisions working together.

**In-memory storage.** Redis keeps all data in memory rather than on disk.
With no disk I/O in the critical path, both reads and writes complete in microsecond range.
Compare this to scenarios where
<a href="/en/post/how-to-analyze-mysql-slow-query" target="_blank">slow queries get bottlenecked on disk I/O</a> in an RDBMS.

**Single-threaded event loop.** Redis processes commands on a single thread.
This eliminates the context switching and lock contention inherent in multi-threaded models.
Instead, it uses I/O multiplexing (epoll, kqueue) to handle thousands of client connections concurrently.

**Simple data structures.** Internally, Redis uses hash tables, skip lists, and compressed lists,
all with low time complexity.
Most basic operations run in O(1) or O(log N), so latency does not spike dramatically as data grows.

There are trade-offs, of course. Keeping all data in memory limits total capacity.
The single-threaded design means a command like `KEYS *` that iterates over every key blocks all other requests.
In production, replacing it with the `SCAN` command is the safer approach.

> Starting with Redis 6.0, I/O processing uses multiple threads, but command execution itself remains single-threaded.
> The statement "Redis is single-threaded" still holds from the command-processing perspective.

<br>

# Practical Uses by Data Structure

Calling Redis a "key-value store" only tells half the story.
Beyond String, it provides Hash, List, Set, Sorted Set, and more, each suited to different access patterns.
The examples below use an Article service as a sample domain.

## String: The Caching Baseline

The simplest and most widely used data structure. It stores a single string value under a single key.
A typical pattern is serializing a database query result to JSON and caching it.

```bash
# Cache an article detail response (TTL 300 seconds)
SET article:1024 '{"id":1024,"title":"Redis Intro","author":"madplay"}' EX 300

# Read from cache
GET article:1024
```

When a TTL is set, the key is automatically deleted upon expiration.
For caching, you almost never store data without a TTL,
so it is good practice to always pair `SET` with `EX` (seconds) or `PX` (milliseconds).

## Hash: Field-Level Access to Objects

A Hash stores multiple field-value pairs under a single key.
You can read or update individual fields without serializing and deserializing the entire object.

```bash
# Store article metadata as a Hash
HSET article:1024:meta title "Redis Intro" viewCount 0 likeCount 0

# Increment only the view count
HINCRBY article:1024:meta viewCount 1

# Retrieve a specific field
HGET article:1024:meta viewCount
```

When an object has a frequently changing field like `viewCount`, Hash is more efficient than serializing the whole thing as a String.
Instead of reading the entire JSON, modifying it, and writing it back, you can atomically update just the field you need.

## List: Fetching the Latest N Items

A List is a doubly linked list where inserts and deletes at both ends are O(1).
It fits scenarios like "recent articles" where order matters and you only need to keep a limited number of entries.

```bash
# Push to the left whenever a new article is created
LPUSH recent:articles 1024
LPUSH recent:articles 1025

# Retrieve the 10 most recent items
LRANGE recent:articles 0 9

# Cap the list at 20 entries (older items removed automatically)
LTRIM recent:articles 0 19
```

Combining `LPUSH` with `LTRIM` gives you a simple fixed-length queue.
Keep in mind that operations accessing the middle of the list (`LINDEX`, `LINSERT`) are O(N),
so if random index-based access is frequent, consider a different data structure.

## Set: Deduplication

A Set is an unordered collection that rejects duplicates.
It is useful for membership checks such as "has this user already liked the article?"

```bash
# User 42 likes article 1024
SADD article:1024:likes user:42

# A duplicate add has no effect
SADD article:1024:likes user:42  # Returns: 0 (already exists)

# Count the total likes
SCARD article:1024:likes

# Check whether a specific user has liked the article
SISMEMBER article:1024:likes user:42
```

Set also supports intersection (`SINTER`), union (`SUNION`), and difference (`SDIFF`),
so finding "users who liked both Article A and Article B" takes just a single command.

## Sorted Set: Score-Based Rankings

A Sorted Set resembles a Set, but each member carries a score that keeps the collection sorted automatically.
It shines wherever you need score-based rankings, such as a real-time popular articles leaderboard.

```bash
# Use view counts as scores
ZADD popular:articles 150 article:1024
ZADD popular:articles 320 article:1025
ZADD popular:articles 89 article:1026

# Increment the view count (increase score by 1)
ZINCRBY popular:articles 1 article:1024

# Top 5 articles (descending by score)
ZRANGE popular:articles 0 4 REV WITHSCORES
```

> `ZREVRANGE` has been deprecated since Redis 6.2. Use `ZRANGE ... REV` for the same result.

Internally, Sorted Set uses a skip list, so inserts and deletes run in O(log N)
and range queries in O(log N + M), where M is the number of returned elements.
That is why ranking queries over millions of entries still complete in milliseconds.

<br>

# What Happens When an In-Memory Store Restarts?

Redis is an in-memory store, so a server restart wipes all data.
To mitigate this, Redis offers two persistence mechanisms.

**RDB (Redis Database) snapshots.** RDB saves a point-in-time snapshot of the entire dataset as a binary file.
Restoration is fast, but any changes after the last snapshot are lost.

**AOF (Append Only File).** AOF logs every write command sequentially to a file.
The data loss window is smaller, but the file grows larger and recovery takes longer than RDB.

| Method | Recovery Speed | Data Safety | File Size |
|--------|---------------|-------------|-----------|
| RDB | Fast | May lose data since last snapshot | Small |
| AOF | Relatively slow | Minimal loss (within 1 second depending on config) | Large |

In production, many teams combine RDB and AOF.
RDB provides fast bulk recovery, while AOF fills in any changes since the last snapshot.
On the other hand, if Redis serves purely as a cache and the source of truth lives in a database,
disabling persistence entirely is also a valid option.

<br>

# Wrapping Up

When you first encounter Redis, the impression of "a fast cache" tends to dominate.
In practice, it is closer to an in-memory data structure server that offers a rich set of collections.
Using only String for simple caching taps into just a fraction of what Redis can do.

Once you understand the data structures, the natural next question becomes "what caching strategy should I adopt?"
The next post covers cache patterns like Cache-Aside and Write-Through, along with criteria for choosing an eviction policy.

- <a href="/en/post/redis-cache-strategy-and-eviction" target="_blank">Next: Four Decisions to Make Before Adding a Cache Layer to Redis</a>

<br>

# References

- <a href="https://redis.io/docs/latest/develop/data-types/" target="_blank" rel="nofollow">Redis Data Types</a>
- <a href="https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/" target="_blank" rel="nofollow">Redis Persistence</a>
