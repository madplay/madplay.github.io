---
layout: post
title: "Why Is My MySQL Query Slow Even With an Index?"
author: madplay
tags: mysql sql index performance
description: "Composite index ordering, function application, type casting, and covering indexes all determine whether MySQL actually benefits from your index."
category: Data
date: "2022-03-24 20:11:00"
comments: true
lang: en
slug: why-mysql-query-is-slow-even-with-index
permalink: /en/post/why-mysql-query-is-slow-even-with-index
---

# Having an Index Is Not Enough

When debugging slow queries, a common question is: "There is an index on this column, so why is it slow?"
In MySQL, the existence of an index and its effective utilization are two very different things.
In practice, even with an index in place, the engine may scan a large number of rows, perform a separate sort, or skip the index entirely.

The right way to evaluate an index is not just checking whether it exists, but examining **what conditions it filters on, what order it sorts by, and where it can stop reading**.
Without this lens, adding more indexes often fails to deliver the expected improvement.

<br>

# Query Patterns and Index Order Go Hand in Hand

Comparing cases where a composite index aligns with the query pattern against cases where it does not makes it clear why "having an index" alone is insufficient.

## A Composite Index Must Match From Left to Right

Suppose an API that serves the latest articles for a specific news outlet frequently runs the following query.

> This post is based on MySQL 8.0.

```sql
SELECT id,
       office_id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
  AND office_id = 10
ORDER BY published_at DESC LIMIT 20;
```

A composite index like the one below is a natural fit for this query.

```sql
CREATE INDEX idx_article_status_office_published_at
    ON article (status, office_id, published_at DESC);
```

This index works well because the equality conditions from the `WHERE` clause come first, followed by the sort column.
If you reverse the order and place `published_at` at the front while pushing `status` and `office_id` to the back,
the index can no longer handle both filtering and sorting in a single pass.

A common misconception is that "more columns in a composite index is always better." What actually matters is not the column count but **which lookup path the index enables from left to right**.
In systems with heavy list queries, such as a news service, this distinction has a significant impact.
An index that matches the filter but requires a separate sort and an index that satisfies both filtering and sorting produce a noticeable difference, even on the same `LIMIT 20` query.

<br>

## Different Query Patterns on the Same Table Need Different Indexes

Even a single table like `article` serves multiple query patterns. The main page needs the latest articles,
the outlet page needs per-`office_id` listings, and the admin panel queries by status and scheduled publish time.
Trying to cover all of these with one index inevitably leaks cost somewhere.

For example, these two queries hit the same `article` table but have different requirements.

```sql
SELECT id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC LIMIT 20;

SELECT id,
       title,
       reserved_at
FROM article
WHERE status = 'RESERVED'
  AND reserved_at <= NOW()
ORDER BY reserved_at ASC LIMIT 50;
```

The first retrieves published articles in reverse chronological order. The second fetches articles due for scheduled publication.
Both query the article table, but because their filter conditions and sort orders differ, they may each benefit from a different index.
This is why index design works better when driven by **query patterns** rather than table structure.

<br>

# Conditions That Silently Break Index Utilization

Functions, type casting, and string searches may look simple on the surface, but they can obscure the lookup path and prevent effective index use.

## Functions and Type Casting Degrade Index Efficiency

Sometimes a query looks straightforward, yet index efficiency drops sharply. The most common culprits are applying a function to a column or triggering an implicit type conversion during comparison.

```sql
SELECT id,
       title
FROM article
WHERE
    DATE (published_at) = '2022-03-24';
```

This query is easy to read, but on a standard column index, it can force a `DATE()` computation on every row instead of performing a range scan on `published_at` directly.
For the same condition, rewriting it as a range comparison is typically more efficient.

```sql
SELECT id,
       title
FROM article
WHERE published_at >= '2022-03-24 00:00:00'
  AND published_at < '2022-03-25 00:00:00';
```

Type casting behaves similarly. When a conversion is applied to the column side during comparison,
or when a type mismatch makes the condition unpredictable for the optimizer, the execution plan may diverge from expectations.
This is exactly why type consistency deserves attention when investigating query performance.

For instance, comparing a string column against a numeric value, or joining two columns of different types, can cause index utilization to break even when the condition appears trivial.
On the other hand, passing a string like `"10"` to an integer column in a simple comparison often works fine because MySQL interprets the constant as a number.
Rather than generalizing with "passing strings is always slow," it is safer to check the actual execution plan for column-side conversions and verify that comparison types are consistent.

The following examples illustrate comparing a string column to a number and joining columns with mismatched types.

```sql
SELECT id,
       office_code
FROM article
WHERE office_code = 10;

SELECT a.id,
       o.name
FROM article a
         INNER JOIN office o ON o.legacy_code = a.office_id;
```

In these cases, the query text looks simple, but index utilization can vary depending on which side the type conversion occurs.

MySQL 8.0 supports functional indexes, so applying a function in a condition is not always something to avoid.
However, when working only with standard column indexes, rewriting conditions as range comparisons remains easier to understand and more predictable.

<br>

## LIKE Searches Depend on Wildcard Position

With string searches, indexes often perform worse than expected. The situation changes especially when a leading wildcard is present.

```sql
SELECT id,
       title
FROM article
WHERE title LIKE '%속보%';
```

This pattern makes the starting point of the string unknown, so a standard B-Tree index cannot perform an efficient range scan.
In contrast, a prefix search like `title LIKE '속보%'` is relatively index-friendly.
Before trying to handle an article title search with a simple index, first determine whether you need a prefix search or a full-text search.

<br>

# The Index Is Used, But the Query Is Still Slow

The fact that an index is used does not guarantee that the scan range is sufficiently narrow.
When selectivity is low or the index does not cover the query, the engine may start from the index but still end up following a large number of rows.

## Why a Query Can Be Slow Despite Using an Index

The phrase "the query uses the index" requires some nuance. The optimizer choosing an index and the query reading only a few rows are not the same thing.
If the condition has low selectivity, the engine may start with the index but still traverse many rows.

For example, a condition like `status = 'PUBLISHED'` where the vast majority of rows share the same value may not filter effectively, even with an index in place.
In this case, a composite index reflecting the actual query pattern, such as `(status, office_id, published_at)`, is more effective than a single-column index.

**Another factor is whether the index is covering.** If the columns needed for a list query are not fully included in the index,
the engine must look up the matching candidates in the index and then go back to the table data to fetch the remaining values.
This cost becomes harder to ignore as data volume grows. When designing indexes, evaluate not only "can it find the rows" but also "how many additional lookups are required."

<br>

## Consider Table Statistics and Optimizer Decisions

When the execution plan does not match expectations despite an index being present, look beyond the index structure at table statistics and optimizer decisions.
The MySQL documentation recommends using `EXPLAIN` to verify the actual execution path and running `ANALYZE TABLE` to refresh statistics when an index does not behave as expected.

For example, if the data distribution for `office_id` is heavily skewed, the same index may end up reading a large number of rows for certain values.

```sql
EXPLAIN
SELECT
    id,
    title,
    published_at
FROM
    article
WHERE
    office_id = 10
ORDER BY
    published_at DESC
LIMIT 20;

ANALYZE TABLE article;
```

Instead of immediately concluding "why is the index not being used," it is better to first check which index the optimizer chose and how large the `rows` estimate is.
Even when an index is used, a wide starting range can make the query slow. If table statistics are stale, the optimizer may make a different choice than expected.

<br>

# Wrapping Up

An index is less of a "just add it and things get faster" device and more of **a pre-organized lookup path for frequently used access patterns**.
Without first clarifying what conditions you filter on and what order you sort by, adding indexes often amounts to little more than a comfort measure.

When an indexed query is slow, the root cause is usually not the absence of an index
but a mismatch between the query pattern and the index lookup path.
Composite index ordering, function application, type casting, and covering index status all tie back to this same principle.

When adding an index, evaluate not only what it finds but also what order it reads in and where it can stop.
With this framework in place, it becomes much easier to justify why each index exists, even as the number of indexes grows.

<br>

# References

- <a href="https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: Optimization and Indexes</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/multiple-column-indexes.html" target="_blank" rel="nofollow">MySQL
  8.0 Reference Manual: Multiple-Column Indexes</a>
