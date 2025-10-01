---
layout:   post
title:    "Querydsl: Avoid JPA N+1 with fetch join"
author:   Kimtaeng
tags:    querydsl fetchjoin
description: Use Querydsl fetchJoin to avoid the N+1 problem in JPA
category: Knowledge
date: "2021-01-07 20:54:19"
comments: true
slug:     avoid-n+1-problem-in-jpa-using-querydsl-fetchjoin
lang:     en
permalink: /en/post/avoid-n+1-problem-in-jpa-using-querydsl-fetchjoin
---

# N+1 Problem?
In JPA, when loading entities with relationships, additional queries can run for each loaded row.
Let's check this with an example.

## Entity setup
In this example, related entities use `FetchType.EAGER` so they load eagerly.

```java
@Entity
public class User {
	@Id
	private Integer id;
	private String name;
	private String level;

	@OneToMany(fetch = FetchType.EAGER)
	@JoinColumn(name = "user_id", referencedColumnName = "id")
	private List<Article> articleList;

	@ManyToOne
	@JoinColumn(name = "team_id", referencedColumnName = "id")
	private Team team;
}

@Entity
public class Article {
	@Id
	private Integer id;
	@Column(name = "user_id")
	private Integer userId;
	private String title;
}

@Entity
public class Team {
	@Id
	private Integer id;
}
```

Sample table data:

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-07-avoid-n+1-problem-in-jpa-using-querydsl-fetchjoin-1.jpg"
width="600" alt="data example"/>

## Querying data
With the entity structure and data above, what happens when querying all users?
First, enable SQL logging.
Then run `findAll`.

```bash
spring.jpa.properties.hibernate.show_sql=true # print SQL
spring.jpa.properties.hibernate.format_sql=true # pretty SQL formatting
spring.jpa.properties.hibernate.generate_statistics=true # print query statistics
```

Query result:

```bash
Hibernate: 
    select
        user0_.`id` as id1_2_,
        user0_.`level` as level2_2_,
        user0_.`name` as name3_2_,
        user0_.`team_id` as team_id4_2_ 
    from
        `user` user0_
Hibernate: 
    select
        team0_.`id` as id1_1_0_ 
    from
        `team` team0_ 
    where
        team0_.`id`=?
Hibernate: 
    select
        team0_.`id` as id1_1_0_ 
    from
        `team` team0_ 
    where
        team0_.`id`=?
Hibernate: 
    select
        team0_.`id` as id1_1_0_ 
    from
        `team` team0_ 
    where
        team0_.`id`=?
Hibernate: 
    select
        articlelis0_.`user_id` as user_id3_0_0_,
        articlelis0_.`id` as id1_0_0_,
        articlelis0_.`id` as id1_0_1_,
        articlelis0_.`title` as title2_0_1_,
        articlelis0_.`user_id` as user_id3_0_1_ 
    from
        `article` articlelis0_ 
    where
        articlelis0_.`user_id`=?
Hibernate: 
    select
        articlelis0_.`user_id` as user_id3_0_0_,
        articlelis0_.`id` as id1_0_0_,
        articlelis0_.`id` as id1_0_1_,
        articlelis0_.`title` as title2_0_1_,
        articlelis0_.`user_id` as user_id3_0_1_ 
    from
        `article` articlelis0_ 
    where
        articlelis0_.`user_id`=?
Hibernate: 
    select
        articlelis0_.`user_id` as user_id3_0_0_,
        articlelis0_.`id` as id1_0_0_,
        articlelis0_.`id` as id1_0_1_,
        articlelis0_.`title` as title2_0_1_,
        articlelis0_.`user_id` as user_id3_0_1_ 
    from
        `article` articlelis0_ 
    where
        articlelis0_.`user_id`=?

769887 nanoseconds spent acquiring 1 JDBC connections;
0 nanoseconds spent releasing 0 JDBC connections;
23142915 nanoseconds spent preparing 7 JDBC statements;
10451025 nanoseconds spent executing 7 JDBC statements;
0 nanoseconds spent executing 0 JDBC batches;
0 nanoseconds spent performing 0 L2C puts;
0 nanoseconds spent performing 0 L2C hits;
0 nanoseconds spent performing 0 L2C misses;
0 nanoseconds spent executing 0 flushes (flushing a total of 0 entities and 0 collections);
10855 nanoseconds spent executing 1 partial-flushes (flushing a total of 0 entities and 0 collections)
```

As statistics show, querying 3 rows from `User` executes 7 queries total.
Additional queries run for associated entities.

## Does Lazy loading solve it?
The issue is not caused by `FetchType.EAGER` in `@OneToMany` alone.
Even with `Lazy`, additional queries run when association references are accessed.

So loading strategy itself does not eliminate the issue.
Also, accessing lazy-loaded entities can throw `lazyinitializationexception`.
This happens when data is referenced outside a JPA-managed session.
You can address it with `@Transactional` as below.

```java
@Transactional
public List<User> getAllUserList() {
    List<User> userList = userRepository.findAll();	
	
    // without @Transactional, `lazyinitializationexception` occurs
    List<ArticleList> articleList = userList.get(0).getArticleList();
}
```


<br>

# Then how to solve it?
Approaches include `BatchSize` and `EntityGraph`.
This post focuses on Querydsl fetch join.
For Querydsl setup, see below.

- Reference: <a href="/post/introduction-to-querydsl#querydsl-관련-설정">Querydsl: Introduction and Usage</a>

Core point is `fetchJoin`.
It eagerly loads joined targets.
Because duplicates can occur during this process, `distinct` is added.

```java
public List<User> findAllByQuerydsl() {
	QUser user = QUser.user;
	QArticle article = QArticle.article;
	QTeam team = QTeam.team;

	return queryFactory.select(user)
	.from(user)
	.leftJoin(user.articleList, article)
	.fetchJoin()
	.leftJoin(user.team, team)
	.fetchJoin()
	.distinct()
	.fetch();
}
```


```java
Hibernate: 
    select
        distinct user0_.`id` as id1_2_0_,
        articlelis1_.`id` as id1_0_1_,
        team2_.`id` as id1_1_2_,
        user0_.`level` as level2_2_0_,
        user0_.`name` as name3_2_0_,
        user0_.`team_id` as team_id4_2_0_,
        articlelis1_.`title` as title2_0_1_,
        articlelis1_.`user_id` as user_id3_0_1_,
        articlelis1_.`user_id` as user_id3_0_0__,
        articlelis1_.`id` as id1_0_0__ 
    from
        `user` user0_ 
    left outer join
        `article` articlelis1_ 
            on user0_.`id`=articlelis1_.`user_id` 
    left outer join
        `team` team2_ 
            on user0_.`team_id`=team2_.`id`
    
20364 nanoseconds spent acquiring 1 JDBC connections;
0 nanoseconds spent releasing 0 JDBC connections;
184222 nanoseconds spent preparing 1 JDBC statements;
838233 nanoseconds spent executing 1 JDBC statements;
0 nanoseconds spent executing 0 JDBC batches;
0 nanoseconds spent performing 0 L2C puts;
0 nanoseconds spent performing 0 L2C hits;
0 nanoseconds spent performing 0 L2C misses;
0 nanoseconds spent executing 0 flushes (flushing a total of 0 entities and 0 collections);
0 nanoseconds spent executing 0 partial-flushes (flushing a total of 0 entities and 0 collections)
```

The result shows associated data is loaded through join in one query instead of multiple queries.
Using Querydsl fetch join avoids the JPA N+1 problem.
