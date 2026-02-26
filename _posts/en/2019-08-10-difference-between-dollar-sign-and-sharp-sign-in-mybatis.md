---
layout:   post
title:    "What Is the Difference Between #{} and ${} in MyBatis?"
author:   madplay
tags: 	  mybatis
description: "When writing SQL in MyBatis XML mappers, what is the difference between #{} and ${}?"
category: Data
date: "2019-08-10 22:38:11"
comments: true
slug:     difference-between-dollar-sign-and-sharp-sign-in-mybatis
lang:     en
permalink: /en/post/difference-between-dollar-sign-and-sharp-sign-in-mybatis
---

# Different parameter syntax?
In MyBatis mapper XML files, you often see `$` and `#` symbols. When you bind parameters in XML SQL, you use `${}` or `#{}`.

They serve different purposes, so you must use them deliberately.

<br/>

# When you use #{}
Write a query using `#{}` first.

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user
    WHERE
        id = #{id}
</select>
```

When MyBatis executes a query with `#{}`, it parses the SQL and inserts a `?` placeholder.

```sql
SELECT
    name AS name, email AS email
FROM
    user
WHERE
    id = ?
```

MyBatis uses `PreparedStatement` for `#{}` and binds the parameter into the `?`. The parsed query is **reused and cached**, which is efficient.

MyBatis also adds single quotes automatically, so you do not need to write `'#{id}'` in SQL. Because of this behavior, you cannot build dynamic table names like this:

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user_#{tableId}
    WHERE
        id = #{id}
</select>
```

This fails with `SQLSyntaxErrorException` because the value of `tableId` is wrapped in quotes.

<br/>

# When you use ${}
With `${}`, MyBatis inserts the value directly into the SQL. That means the SQL is re-parsed on every parameter change, which has a performance cost.

Because MyBatis does not add quotes, `${}` works for dynamic table or column names.

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user_${id}
    WHERE
        id = #{id}
</select>
```

The downside is that `${}` is vulnerable to SQL injection.

<br/>

# SQL Injection
Depending on the context, you should favor `#{}` for safety. Consider this query:

```xml
<select id="selectUserFromTable" parameterType="Map" resultType="...">
    SELECT
        *
    FROM
        user
    WHERE
        id = '${id}' AND password = '${password}'
</select>
```

If `id` is `admin' -- `, the parsed SQL looks like this:

```sql
SELECT
    *
FROM
    user
WHERE
    id = 'admin' -- 'AND password = ''
```

The password condition disappears, and the attacker can access the admin record with only an ID. This is why `${}` is more vulnerable to SQL injection than `#{}`.
