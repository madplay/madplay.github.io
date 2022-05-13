---
layout: post
title: "How to Read MySQL EXPLAIN Query Plans"
author: madplay
tags: mysql sql explain optimizer
description: "A practical guide to reading MySQL EXPLAIN output and identifying the fields that actually matter for query tuning."
category: Data
date: "2022-05-12 23:01:20"
comments: true
lang: en
slug: how-to-read-mysql-explain
permalink: /en/post/how-to-read-mysql-explain
---

# A Query Plan Is a Clue, Not a Verdict

MySQL performance tuning conversations inevitably lead to `EXPLAIN`. And for good reason: query plans reveal which tables the engine reads first, which indexes it picks, and how many rows it expects to scan.

That said, there is a common misconception. People tend to treat the query plan as a definitive diagnosis the moment they read it.

A query plan only shows the optimizer's decisions and estimates.
Rather than jumping to "good" or "bad," it is more productive to treat the output as **a set of clues showing where the engine reads many rows and where extra work kicks in**.
Reading a query plan well is not about memorizing a table of values. It is about visualizing the access path the query actually takes.

> This article is based on MySQL 8.0.

<br>

# Where to Start

`EXPLAIN` returns many columns. Trying to interpret all of them at once makes it easy to lose the big picture. In practice, starting with these five key fields is the most efficient approach.

| Field        | What it means                              | What to look for                                                   |
|:-------------|:-------------------------------------------|:-------------------------------------------------------------------|
| **type**     | How the engine accesses data               | Is it scanning more broadly than expected? (watch for ALL, index)  |
| **key**      | The index actually chosen                  | Did it pick the expected index, or fail to pick one at all?        |
| **rows**     | Estimated number of rows to read           | Is the scan range disproportionately large relative to the filter? |
| **filtered** | Percentage of rows passed to the next step | Is the engine reading many rows only to discard most of them?      |
| **Extra**    | Additional operations (sort, temp table)   | Check for Using filesort, Using temporary, and similar overhead    |

<br>

## Example: Analyzing an Article Listing Query

One of the most common scenarios is a listing query with ORDER BY and LIMIT, like fetching the latest published articles.

```sql
EXPLAIN
SELECT a.id, a.title, a.published_at, a.office_id
FROM article a
WHERE a.status = 'PUBLISHED'
  AND a.office_id = 10
ORDER BY a.published_at DESC LIMIT 20;
```

Assume this query produces the following plan.

```text
type: ref
key: idx_article_status_office_published_at
rows: 1,280
filtered: 100.00
Extra: Using where
```

Reading through the output: `type: ref` means the engine performs an efficient index lookup via an equality condition. `key` confirms it chose the exact composite index we designed.
`rows: 1,280` is the optimizer's estimate that it needs to examine roughly 1,280 candidate rows to return 20 results.

If `Extra` shows `Using filesort`, that signals the index does not cover the sort column (`published_at`), forcing a separate sort operation. In that case, revisiting the index column order is the next step.

<br>

# Key Fields in Detail

Now let's look at the possible values for each field and how to interpret them in practice.

## 1. type: Access Method Efficiency

`type` describes how the engine retrieves rows from the table. The higher a value appears in the list below (system, const), the better the performance. The lower (ALL), the worse.

| Value            | Description                                                          | Performance |
|:-----------------|:---------------------------------------------------------------------|:------------|
| **system/const** | Directly finds a single row using PK or Unique Key                   | Best        |
| **eq_ref**       | Join key is PK or Unique Key (1:1 relationship)                      | Excellent   |
| **ref**          | Equality comparison (`=`) on a non-unique index                      | Excellent   |
| **range**        | Index range scan (`<`, `>`, `BETWEEN`, `IN`, etc.)                   | Fair        |
| **index**        | Full index scan (slightly faster than full table scan)               | Poor        |
| **ALL**          | Full table scan (no usable index)                                    | Worst       |

> `index` and `ALL` are red flags. But `range` is not automatically safe either.
> Even with an index, an overly broad range (e.g., scanning a full year of logs) can be slower than `ALL`. Always evaluate `rows` alongside `type`.

<br>

## 2. key: Scan Range Matters More Than Index Usage

When an index name appears in the `key` field, the engine is using an index. But what matters more than index usage itself is **how effectively that index narrows the scan range**.

A single-column index on a low-selectivity column (e.g., a status field where most rows are 'PUBLISHED') only sets a starting point.
In practice, the engine may still scan tens of thousands of rows.
Building a **composite index** that combines filter columns like `status` and `office_id` reduces the absolute volume of data the engine reads. That is the core of performance tuning.

<br>

## 3. rows & filtered: The Gap Between Estimates and Reality

| Field        | Meaning                                     | Checkpoint                                                      |
|:-------------|:--------------------------------------------|:----------------------------------------------------------------|
| **rows**     | Estimated number of rows to examine         | If this is far larger than expected, reconsider the index design |
| **filtered** | Estimated percentage of rows surviving filter | Closer to 100% means less wasted reads                          |

> `rows` is a **statistics-based estimate**. When table statistics are stale or data is heavily skewed, the estimate can differ from reality by orders of magnitude.
> If `rows` looks small but the query is still slow, run `ANALYZE TABLE` to refresh statistics, or compare against actual execution time.

<br>

## 4. Extra: Where the Hidden Costs Live

`Extra` provides the most useful clues for finding performance bottlenecks.

| Value               | Description                                                    | Notes                                       |
|:--------------------|:---------------------------------------------------------------|:--------------------------------------------|
| **Using index**     | Query completed using only the index (Covering Index)          | Best case for performance                   |
| **Using where**     | Engine filters rows after receiving them from storage engine   | Check efficiency relative to `rows`         |
| **Using temporary** | Engine creates a temporary table to process the query          | Performance drops sharply with disk spill   |
| **Using filesort**  | Engine performs a separate sort because no index covers it     | Consider adding the sort column to an index |

> If `Using temporary` or `Using filesort` appears in a listing query, it is almost always a tuning target.
> In join queries especially, a post-join sort can cause costs to grow exponentially.

<br>

# What Query Plans Cannot Tell You

Query plans are powerful, but they are limited to the perspective of a single SQL statement. Real bottlenecks often live outside the query itself.

1. **Call frequency:** A query that takes 0.1 seconds per execution can bring down the entire system if it runs 1,000 times per second.
2. **Data distribution:** When a specific user (e.g., a power user) has disproportionately more data, queries slow down only for that user. A standard query plan does not surface this.
3. **Locking:** Even with a perfect query plan, a query can stall if another transaction holds a lock on the required rows.

<br>

# Wrapping Up

`EXPLAIN` may look like an exercise in reading a complex table, but it is really about **tracing the path a query takes to find data**.
The reason we check `key`, `rows`, and `Extra` is ultimately to verify that the path is narrow and predictable.

Use the query plan to set direction, but always circle back to actual request patterns and data access behavior.
Maintaining this approach helps you leverage query plans as a powerful tuning tool without over-relying on them.

<br>

# References

- <a href="https://dev.mysql.com/doc/refman/8.0/en/using-explain.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: Optimizing Queries with EXPLAIN</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/explain.html" target="_blank" rel="nofollow">MySQL 8.0 Reference
  Manual: EXPLAIN Statement</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/order-by-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: ORDER BY Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: LIMIT Query Optimization</a>
