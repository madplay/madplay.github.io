---
layout:   post
title:    "How to Get the auto_increment Key Value After Insert in MyBatis"
author:   madplay
tags:     mybatis
description: "How to get the auto_increment key value of inserted data after executing an insert query in MyBatis"
category: Data
lang: en
slug: how-to-get-the-auto-generated-key-of-an-inserted-record-in-mybatis
permalink: /en/how-to-get-the-auto-generated-key-of-an-inserted-record-in-mybatis/
date: "2020-07-23 02:41:21"
comments: true
---

# You Need the Key Value of the Data You Just Inserted
Sometimes you need to use the `auto_increment` key value immediately after an INSERT. You may use it in another table,
or expose the generated sequence number to the user.

MyBatis provides the `useGeneratedKeys` option for this purpose.
With this option, you can get the generated key right after INSERT.

<br>

# How to Use It
The declaration looks like this. Set `useGeneratedKeys` to **true**, and the value defined in `keyProperty` is mapped
to a field in the corresponding class. In the table, `article_id` is the PK and is **AUTO_INCREMENT**.

```xml
<insert id="insertArticle" parameterType="com.example.madplay.model.Article" useGeneratedKeys="true"
        keyProperty="articleId" keyColumn="article_id">
    INSERT INTO article ( title, reg_date ) VALUES ( #{title}, NOW() )
</insert>
```

With this declaration, you can use it on the Java side as follows.

```java
Article article = new Article();
article.setTitle("Title");

myMapper.insert(article);

// The `articleId` value is set in the object parameter used for `insert` execution.
System.out.println("articleId: " + article.getArticleId());
```

In the previous declaration, the parameter type was a Java class, but `Map` is also supported.

```xml
<insert id="insertArticle" parameterType="map" useGeneratedKeys="true"
        keyProperty="articleId" keyColumn="article_id">
    INSERT INTO article ( title, reg_date ) VALUES ( #{title}, NOW() )
</insert>
```

When you use `Map`, the result is also stored in the key defined by `keyProperty`.

```java
Map<String, String> params = new HashMap<>();
params.put("title", "Title");

myMapper.insert(params);

// The `articleId` value is set in the Map parameter used for `insert` execution.
System.out.println("articleId: " + params.get("articleId"));
```
