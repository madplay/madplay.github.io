---
layout: post
title: "Where to Start When Analyzing MySQL Slow Queries"
author: madplay
tags: mysql sql performance slowquery
description: "Beyond execution time, what else matters in a MySQL slow query? Call frequency, rows examined, sorting, and aggregation all deserve a closer look."
category: Data
date: "2022-03-10 14:00:00"
comments: true
lang: en
slug: how-to-analyze-mysql-slow-query
permalink: /en/post/how-to-analyze-mysql-slow-query
---

# Start by breaking down what "slow query" actually means

When an application responds slowly, the first instinct is to blame "a slow query." In practice, though, the problem might be a single query with a long execution time,
or it might be a short query that runs so frequently it creates more load overall. Rather than jumping straight to fixing one SQL statement,
**it helps to first categorize how each query contributes to system load.**

Instead of fixating on a single SQL statement, look at call frequency, rows examined, whether sorting or grouping is involved, and repeated-call patterns within the same request.

<br>

# Narrowing down what to look at first

## Execution time alone is not enough to set priorities

Execution time is usually the first metric people check for slow queries. It matters, but it does not tell the whole story.
A 2-second query that runs a few times a day from an admin dashboard and an 80ms query called dozens of times per second on the main page carry very different operational weight.

Consider a news listing API with a query like this:

> This post is based on MySQL 8.0.

```sql
SELECT
    a.id,
    a.title,
    a.published_at,
    a.office_id
FROM
    article a
WHERE
    a.status = 'PUBLISHED'
ORDER BY
    a.published_at DESC
LIMIT 20;
```

On the surface, this is a simple list query. But if most rows match `status = 'PUBLISHED'` and there is no index aligned with the `published_at` sort order, MySQL may read
a large number of rows, sort them, and return only 20. The result set is 20 rows, but the actual work is far greater.
So rather than focusing on the 20 rows returned, question how wide a range MySQL scans and sorts to produce those 20 rows.
On a service with a high volume of published articles, this gap grows dramatically.

<br>

## The slow query log is a starting point, not a conclusion

In production, candidates typically surface from the slow query log. But appearing in the log does not automatically make a query the top priority.
You need additional context: does this query spike only during certain hours? Is it a temporary surge caused by a batch job? Or is it being called repeatedly from application code?

For example, after fetching 20 articles for the main page, the code might issue separate queries for each article's publisher name and view count:

```sql
SELECT
    name
FROM
    office
WHERE
    id = ?;

SELECT
    article_id,
    view_count
FROM
    article_view
WHERE
    article_id = ?;
```

Each query is short and fast on its own. But if the publisher and view count are fetched separately for all 20 articles, dozens of extra queries pile up per request.
In cases like this, **check whether the call pattern itself is creating the bottleneck** before optimizing individual SQL execution time.
The classic N+1 problem does not only appear with ORMs; it shows up just as easily in hand-written SQL.

The same perspective applies when reading the slow query log. More important than knowing a query took 1 second is understanding how many times the same statement repeated
within a minute, whether it clusters right after a specific API call, or whether it overlaps with a batch window.

<br>

# Look at rows examined and intermediate operations first

## Think about rows examined before rows returned

News listing pages typically display only a handful of recent articles. During development, it feels like the database reads about the same number of rows.
In reality, filter and sort conditions can force a much wider scan.

```sql
SELECT
    a.id,
    a.title,
    a.published_at
FROM
    article a
WHERE
    a.status = 'PUBLISHED'
    AND a.office_id IN (3, 5, 8)
ORDER BY
    a.published_at DESC
LIMIT 20;
```

This query appears to fetch articles from just three publishers. But without an index that covers `status`, `office_id`, and `published_at` together,
MySQL may scan a broad range of candidates, sort them, and then trim to 20. The result set is 20 rows, but rows examined can be in the thousands or tens of thousands.

Internalizing this gap changes how you approach performance issues. You move past "the LIMIT is small, so why is it slow?" to the real question: the scan cost
before the LIMIT is often far larger than the final result set.

<br>

## Sorting and aggregation change the cost structure

Queries whose cost escalates quickly in MySQL generally fall into two categories:
those that read many rows but return only a few, and those that sort or aggregate the rows they read.
Article listings, most-viewed article rankings, and publisher-level publication dashboards frequently exhibit this pattern.

```sql
SELECT
    a.office_id,
    COUNT(*) AS published_count
FROM
    article a
WHERE
    a.published_at >= '2022-03-01 00:00:00'
GROUP BY
    a.office_id
ORDER BY
    published_count DESC
LIMIT 10;
```

This query requires more work than a simple lookup. Consider how many rows the range condition scans, whether sorting follows aggregation, and how large the intermediate
result set grows just to produce the final 10 rows. When you encounter a slow query, **checking rows examined and intermediate operations first** is often more useful
than asking whether the SQL looks complex.

Aggregation queries are deceptive because the output looks trivial: 10 rows of per-publisher article counts. But the database may need to read every article matching the
date range, group them, and sort the groups. That is why slow aggregation screens rarely get fixed by adding a single index.

<br>

# Deciding what to fix first

In practice, fixing every SQL at once is not realistic. Prioritizing by the shape of the bottleneck works better.

## When reducing call count is the highest-ROI move

If a single list page triggers dozens of supplementary lookups, reducing the query count itself often beats making each individual query faster.
When repeated lookups occur within the same request, joining into a single query or batching single-row fetches with an `IN` clause can be a better fit.

The path forward here is relatively straightforward. Count how many SQL statements execute for a single page render, find the keys that trigger repeated lookups,
and consolidate those first. In this scenario, the slow query log is more useful when you look at repetition count and call patterns rather than individual execution time.

<br>

## When rows examined is the primary suspect

If a list query is slow despite a small LIMIT, focus on reducing rows examined before anything else.
Check whether an index exists that satisfies both the filter and sort conditions, and whether the WHERE clause is in a form that enables efficient index traversal.

The MySQL documentation notes that when `ORDER BY` and `LIMIT` appear together, an index matching the sort order can speed things up.
Without such an index, MySQL may read many candidates, sort them, and return only the first few.
So frame the fix around "how far does the scan go before producing those few rows?" rather than "how many rows come back?"

<br>

## Heavy sorting or aggregation requires revisiting the requirements

For admin dashboards and ranking pages where sorting and aggregation combine, adding an index alone rarely solves the problem.
Alongside examining the execution plan, consider whether real-time aggregation is truly necessary or whether a pre-aggregated table or batch refresh can replace it.

The fix usually takes one of two directions. If you can narrow the sort target and aggregation range, start there.
If the requirements genuinely demand scanning a wide range, shifting computation away from query time to a pre-computed structure is often more practical.

<br>

## Time-specific slowdowns call for looking beyond the query

If slowdowns appear only during certain time windows, look past the SQL itself. Check for overlap with batch jobs, bulk data loads, reindexing, or statistics refreshes.
These issues rarely surface from the query text alone; correlating application request flows with operational job schedules tends to be faster.

The MySQL slow query log helps here as well, but enabling logging for queries that skip indexes can cause the log to grow rapidly.
A better approach is to log broadly while reading the log with an eye for which query types cluster during which time windows.

Ultimately, analyzing slow queries is less about isolating a single SQL statement and more about **understanding which requests create which data access patterns.**
With this framing in place, the next steps (index design and execution plan analysis) become significantly easier to navigate.

Categorizing problems this way also clarifies the next move. If call volume is too high, start by reducing query count and consolidating access patterns.
If rows examined is excessive, revisit index and WHERE clause design. If sorting and aggregation dominate the cost, consider whether the query-time computation
can be reduced by adjusting the requirements themselves.

<br>

# Wrapping up

In my experience, the skill that matters most for slow queries is not rewriting SQL but recognizing the shape of the problem.
On high-traffic pages like news article listings, call frequency, rows examined, and repeated-call patterns are often more revealing clues than execution time alone.

Rather than hunting for the right answer from the start, asking "why is this query called so often?" and "why does it read so many rows while returning so few?"
first tends to lead more naturally into index design and execution plan analysis.

<br>

# References

- <a href="https://dev.mysql.com/doc/refman/8.0/en/slow-query-log.html" target="_blank" rel="nofollow">MySQL 8.0 Reference Manual: The Slow Query Log</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html" target="_blank" rel="nofollow">MySQL 8.0 Reference Manual: LIMIT Query Optimization</a>
- <a href="https://dev.mysql.com/doc/refman/8.0/en/using-explain.html" target="_blank" rel="nofollow">MySQL 8.0 Reference Manual: Optimizing Queries with EXPLAIN</a>
