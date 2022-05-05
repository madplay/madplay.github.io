---
layout: post
title: "Why MySQL Joins and ORDER BY Get Slow"
author: madplay
tags: mysql sql join orderby paging
description: "MySQL joins and ORDER BY slow down because of intermediate result size, filesort overhead, OFFSET paging, and aggregation queries."
category: Data
date: "2022-04-28 14:00:00"
comments: true
lang: en
slug: why-mysql-joins-and-order-by-are-slow
permalink: /en/post/why-mysql-joins-and-order-by-are-slow
---

# The Intermediate Result Set Matters More Than the Final Output

List APIs look simple on the surface. Join articles with publishers, sort by newest first, return 20 rows, done.
But from MySQL's perspective, the final row count of 20 is less important than
**how many rows it reads, in what order it combines them, and where sorting happens**.

Joins and sorting get expensive because the intermediate result set grows.
Even when the final output is small, a large intermediate set drives up CPU, memory, and temporary disk usage.
When analyzing list API performance, think about the intermediate result size before the return count.

<br>

# Reduce the Scope Early to Keep Costs Down

When analyzing join performance, the key question is not how many tables are involved, but at which point the candidate rows get narrowed down.

## Join Cost Depends on Read Order

Joining articles with publishers is a common pattern.

> This post is based on MySQL 8.0.

```sql
SELECT a.id,
       a.title,
       o.name AS office_name
FROM article a
         INNER JOIN office o ON o.id = a.office_id
WHERE a.status = 'PUBLISHED'
ORDER BY a.published_at DESC LIMIT 20;
```

This query is not inherently expensive. The problem arises when the `WHERE` clause does not narrow the result set enough before joining large tables, or when sorting is required after the join.
As the number of join targets increases and each table contributes more rows, MySQL generates and compares a larger intermediate result set.

In practice, asking **"how much did we reduce before the join?"** is more accurate than saying "joins are slow."
There is a significant cost difference between selecting 20 published articles first and then attaching publisher info, versus joining a broad range first and trimming afterward.

For example, even if the publisher table is small, when the article table is large, how quickly you narrow the article side determines overall performance.
A join is ultimately an operation that combines two tables, but the actual cost depends on how much each side has been narrowed beforehand.

<br>

## List Views Are Often Harder Than Detail Views

During development, detail queries with many joins look more complex. In production, however, list views tend to be more demanding because they handle far more requests and require both sorting and paging.

For example, an article detail query joins around a single row.

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

This query starts with one specific article, so the join scope is already minimal. A list query, on the other hand, must first determine which 20 rows to return.
That is why list performance depends more on **the cost of selecting those 20 rows** than on the join itself.

<br>

# Where Sorting and Paging Get Expensive

Sorting and paging are less visible than joins, but they frequently drive up the cost of list APIs.

## ORDER BY Is Not Free Even With LIMIT

`LIMIT 20` makes it seem like MySQL only reads 20 rows and stops. But if no index matches the sort order, MySQL reads a wide set of candidate rows, sorts them, and then picks the top 20.

```sql
SELECT id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC LIMIT 20;
```

If there is no index on `status`, `published_at` in the right order, sorting cost kicks in immediately. This is why `Using filesort` in the execution plan raises concern.
Not every filesort is a problem, but for high-traffic list APIs, it is worth checking whether an index can handle the sort.

> `filesort` means an additional sorting step is needed. As the sort candidates grow, memory and temporary space usage increase accordingly, making it a signal that is hard to ignore in production.
> For list queries where data volume grows rapidly, a loose sorting strategy early on often comes back as operational cost later.

<br>

## Be Especially Careful When Sorting After a Join

Filtering by publisher name and then sorting articles is a common requirement.

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

This looks fine at first glance, but the filter is on `office` while the sort is on `article.published_at`.
When the join order and index layout do not align, MySQL may produce a larger intermediate result set than expected.

The real issue is not that a join exists, but that the filter and the sort target different tables.
When possible, resolving the publisher identifier to `office_id` in the application layer and applying it directly as a condition on the article table often simplifies things.

<br>

## OFFSET Paging Gets Worse With Depth

Paging is another frequent source of trouble alongside sorting. The following query is common but gets more expensive as the page number increases.

```sql
SELECT id,
       title,
       published_at
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC LIMIT 20
OFFSET 10000;
```

The user receives 20 rows, but MySQL must skip through the first 10,000 sorted results to get there. In high-volume services, allowing deep pagination is why response times spike unexpectedly.
For infinite scroll or "next page" UX patterns, keyset pagination that advances from the last retrieved position is a better alternative to `OFFSET`.

The difference becomes more pronounced on screens that let users page through historical data.
The first few pages feel fine, but a sudden slowdown beyond a certain point almost always traces back to this pattern.

<br>

## When Aggregation Meets Sorting, Revisit the Requirements

Queries that sort after aggregation, such as most-viewed articles or per-publisher view count rankings, are even more expensive.

```sql
SELECT a.office_id,
       SUM(v.view_count) AS total_views
FROM article a
         INNER JOIN article_view v ON v.article_id = a.id
WHERE a.status = 'PUBLISHED'
GROUP BY a.office_id
ORDER BY total_views DESC LIMIT 10;
```

These queries often cannot be solved with indexes alone because the aggregation itself is an inherently expensive operation.
Instead of adding more indexes, consider whether real-time aggregation is truly necessary, or whether a pre-aggregated table or batch refresh is a better fit.

Ranking screens are deceptive: the user-facing output looks simple, so the implementation feels straightforward.
But for the database, rankings are among the hardest workloads because they combine real-time computation, sorting, aggregation, and LIMIT all at once.

<br>

# Join and Sort Problems Are Ultimately Scope Problems

Once you understand why joins and sorting get expensive, it becomes clear that most query performance issues stem from the combination of query requirements and data access patterns, not SQL syntax.
What matters is not "what did you join" but **where you reduced the result set and where the cost expanded**.

When many screens require related data, resist the urge to solve everything with a single joined query.
Building the list criteria first and attaching supplementary data afterward is often simpler and more predictable.

<br>

# Wrap-Up

Joins and ORDER BY get expensive because the intermediate result set grows. Even when the final output is 20 rows, reading a wide range, combining, and sorting beforehand drives up cost quickly.

In systems with many list and ranking screens, checking where the scope narrows and where sorting happens is more practical than scrutinizing the SQL statement itself.
Once that baseline is established, join and sort problems become far less opaque.

<br>

# References

- <a href="https://dev.mysql.com/doc/mysql/8.0/en/nested-loop-joins.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: Nested-Loop Join Algorithms</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/hash-joins.html" target="_blank" rel="nofollow">MySQL 8.0 Reference
  Manual: Hash Join Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/order-by-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: ORDER BY Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html" target="_blank" rel="nofollow">MySQL 8.0
  Reference Manual: LIMIT Query Optimization</a>
