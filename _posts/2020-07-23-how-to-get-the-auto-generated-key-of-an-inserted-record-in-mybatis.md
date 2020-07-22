---
layout:   post
title:    "MyBatis에서 데이터 insert 후에 auto_increment 키값 가져오기"
author:   Kimtaeng
tags:     mybatis
description: "마이바티스(MyBatis)에서 insert 쿼리를 실행한 후 입력된 데이터의 auto_increment 키값을 가져오는 방법" 
category: MyBatis
date: "2020-07-23 02:41:21"
comments: true
---

# 방금 입력한 데이터의 키값이 필요하다.
INSERT 한 데이터의 `auto_increment` 된 키값을 바로 사용해야 할 때가 있다. 다른 테이블에서 사용해야 할 수도 있고
사용자에게 입력된 순번을 화면을 노출해야 할 수도 있다.

마이바티스(MyBatis)에서는 이러한 기능을 위해 `useGeneratedKeys`라는 옵션을 제공하고 있다.
이 옵션을 사용하면 INSERT를 실행한 후에 바로 키 값을 가져올 수 있다.

<br>

# 사용 방법
선언 방법은 아래와 같다. `useGeneratedKeys` 옵션을 **true**로 설정하고 `keyProperty`에 선언된 값은 데이터와 대응되는
클래스의 필드와 매핑된다. 테이블에는 `article_id` 필드가 PK이며 **AUTO_INCREMENT** 되는 값이다.

```xml
<insert id="insertArticle" parameterType="com.example.madplay.model.Article" useGeneratedKeys="true"
        keyProperty="articleId" keyColumn="article_id">
    INSERT INTO article ( title, reg_date ) VALUES ( #{title}, NOW() )
</insert>
```

위와 같이 선언하면 자바 측 코드에서 다음과 같이 사용할 수 있다.

```java
Article article = new Article();
article.setTitle("타이틀");

myMapper.insert(article);

// `insert` 실행에 사용한 객체 파라미터에 `articleId` 값이 세팅된다.
System.out.println("articleId: " + article.getArticleId());
```

앞선 선언 방법에서는 자바 클래스를 파라미터 타입으로 지정했으나, `Map`도 가능하다.

```xml
<insert id="insertArticle" parameterType="map" useGeneratedKeys="true"
        keyProperty="articleId" keyColumn="article_id">
    INSERT INTO article ( title, reg_date ) VALUES ( #{title}, NOW() )
</insert>
```

`Map`을 사용한 경우에도 `keyProperty`에 선언된 값으로 결과가 담긴다.

```java
Map<String, String> params = new HashMap<>();
params.put("title", "타이틀");

myMapper.insert(params);

// `insert` 실행에 사용한 Map 파라미터에 `articleId` 값이 세팅된다.
System.out.println("articleId: " + params.get("articleId"));
```