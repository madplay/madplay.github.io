---
layout:   post
title:    Sorting a MySQL VARCHAR Column as a Number
author:   madplay
tags: 	  Database MySQL
description: How do you sort a VARCHAR column as a number in MySQL? Convert the string to a number and order it.
category: Database
date: "2019-05-15 01:01:13"
comments: true
slug:     mysql-sort-varchar-as-float
lang:     en
permalink: /en/post/mysql-sort-varchar-as-float
---

# When a Column Is a String
Assume a table has a `varchar` column. For a simple test, use the `player` table below.

```bash
mysql> desc player;
+--------+-------------+------+-----+---------+-------+
| Field  | Type        | Null | Key | Default | Extra |
+--------+-------------+------+-----+---------+-------+
| id     | varchar(10) | NO   | PRI | NULL    |       |
| name   | varchar(20) | YES  |     |         |       |
| record | varchar(5)  | YES  |     |         |       |
| rank   | int(11)     | YES  |     | NULL    |       |
+--------+-------------+------+-----+---------+-------+
```

Now insert the following data.

```bash
mysql> SELECT id, name, record, rank \
    -> FROM player;
+-----+---------+--------+------+
| id  | name    | record | rank |
+-----+---------+--------+------+
| id1 | chulsoo | 10.63  |    1 |
| id2 | younghee| 8.28   |    2 |
| id3 | jjanggu | 1.20   |    4 |
| id4 | gildong | 7.61   |    3 |
+-----+---------+--------+------+
```

First, sort by `rank`, which is an `INT` column, in ascending order (lower rank value means higher rank).

```bash
mysql> SELECT id, name, record, rank \
    -> FROM player \
    -> ORDER BY rank ASC;
+-----+---------+--------+------+
| id  | name    | record | rank |
+-----+---------+--------+------+
| id1 | chulsoo | 10.63  |    1 |
| id2 | younghee| 8.28   |    2 |
| id4 | gildong | 7.61   |    3 |
| id3 | jjanggu | 1.20   |    4 |
+-----+---------+--------+------+
```

The result is correct. Now sort by `record`, a `VARCHAR` column, in descending order.

```bash
mysql> SELECT id, name, record, rank \
    -> FROM player \
    -> ORDER BY record DESC;
+-----+---------+--------+------+
| id  | name    | record | rank |
+-----+---------+--------+------+
| id2 | younghee| 8.28   |    2 |
| id4 | gildong | 7.61   |    3 |
| id1 | chulsoo | 10.63  |    1 |
| id3 | jjanggu | 1.20   |    4 |
+-----+---------+--------+------+
```

The order is wrong. The value "7.61" is placed second even though "10.63" is larger.

<br>

# How to Fix It
Here are two ways to sort a `varchar` column as a number in MySQL.

## Use CAST
Use `CAST` to convert the value explicitly. Combine it with `DECIMAL`.

```bash
mysql> SELECT id, name, record, rank \
    -> FROM player \
    -> ORDER BY CAST(record AS DECIMAL(4, 2)) DESC;
+-----+---------+--------+------+
| id  | name    | record | rank |
+-----+---------+--------+------+
| id1 | chulsoo | 10.63  |    1 |
| id2 | younghee| 8.28   |    2 |
| id4 | gildong | 7.61   |    3 |
| id3 | jjanggu | 1.20   |    4 |
+-----+---------+--------+------+
```

Now the records are sorted correctly.

In `DECIMAL(P, D)`, `P` is the total number of digits (1 to 65), and `D` is the number of decimal places. For example, `DECIMAL(6, 2)` represents values from 9999.99 to -9999.99.

## Use Implicit Conversion
You can also rely on implicit conversion by using the `+` operator on the `varchar` column.

```bash
mysql> SELECT id, name, record, rank \
    -> FROM player \
    -> ORDER BY record+0 DESC;
+-----+---------+--------+------+
| id  | name    | record | rank |
+-----+---------+--------+------+
| id1 | chulsoo | 10.63  |    1 |
| id2 | younghee| 8.28   |    2 |
| id4 | gildong | 7.61   |    3 |
| id3 | jjanggu | 1.20   |    4 |
+-----+---------+--------+------+
```

In the example, `record+0` forces numeric conversion, but `record*1` works the same way.
