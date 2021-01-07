---
layout:   post
title:    "Querydsl: fetch join으로 JPA의 N+1 문제 해결하기"
author:   Kimtaeng
tags: 	  querydsl fetchjoin
description: Querydsl의 fetchJoin을 사용하여 JPA의 N+1 문제를 회피해보자  
category: Knowledge
date: "2021-01-07 20:54:19"
comments: true
---

# N+1 문제?
JPA에서 연관 관계가 있는 엔티티를 조회할 때, 조회된 데이터의 개수만큼 연관 관계에 대한 추가적인 조회 쿼리가 발생하는 이슈를 말한다.
실제로 어떤 경우인지 예시로 확인해보자.

## 엔티티 설정
예시에서는 `FetchType.EAGER` 설정을 하여 `Eager` 전략으로 연관 관계 엔티티를 즉시 로딩하도록 설정했다.

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

테이블에 데이터는 아래와 같이 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-07-avoid-n+1-problem-in-jpa-using-querydsl-fetchjoin-1.jpg"
width="600" alt="데이터 예시"/>

## 데이터 조회
위와 같은 엔티티 구조와 데이터 예시 상황에서 전체 사용자를 조회하면 쿼리가 어떻게 실행될까?
우선 쿼리가 어떻게 실행되는지 확인하기 위해서 몇 가지 설정을 추가해 준다. 그리고 `findAll` 쿼리를 실행해보자.

```bash
spring.jpa.properties.hibernate.show_sql=true # 쿼리를 출력
spring.jpa.properties.hibernate.format_sql=true # 출력되는 쿼리의 포맷을 예쁘게
spring.jpa.properties.hibernate.generate_statistics=true # 쿼리 통계 출력
```

쿼리 실행 결과는 아래와 같다.

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

실행된 쿼리 로그를 살펴보자. 쿼리 통계를 보면 알 수 있듯이 `User` 테이블의 Row 3개를 조회하는데, 총 7번의 쿼리가 실행되었다.
연관 관계에 있는 엔티티를 조회하기 위해 추가적인 쿼리가 실행된 것이다.

## Lazy 로딩을 사용하면 괜찮을까?
예시에서 사용한 `@OneToMany` 어노테이션의 데이터 조회 전략을 `FetchType.EAGER`로 설정한 것이 문제는 아니다.
`Lazy`로 설정하더라도 연관 관계가 있는 레퍼런스를 참조하는 경우에 추가적인 조회 쿼리가 실행된다.

그렇기 때문에 데이터 로딩 전략으로 인해 해결되는 문제는 아니다. 참고로 `Lazy`로 조회한 후 엔티티를 참조하려는 경우 `lazyinitializationexception`이
발생할 수 있다. 이 예외는 JPA에서 관리하는 세션 밖에서 데이터를 참조했기 때문에 발생하는데, 아래와 같이 `@Transactional` 어노테이션을 사용하여 해결할 수 있다.

```java
@Transactional
public List<User> getAllUserList() {
    List<User> userList = userRepository.findAll();	
	
    // @Transactional 선언이 없으면 `lazyinitializationexception` 발생
    List<ArticleList> articleList = userList.get(0).getArticleList();
}
```


<br>

# 그럼 어떻게 해결할까?
해결 방법으로는 `BatchSize`, `EntityGraph` 등이 있으나, 이번 글의 주제에 맞게 Querydsl의 fetch join을 사용하는 예시를 소개한다.
Querydsl을 프로젝트에 세팅하는 방법은 아래를 참고하면 된다.

- 참고 링크: <a href="/post/introduction-to-querydsl#querydsl-관련-설정">Querydsl: 소개와 사용법</a>

핵심은 `fetchJoin` 메서드이다. 조인하는 대상 데이터를 즉시 로딩해서 가져온다. 다만 이 과정에서 중복 데이터가 발생할 수 있기 때문에 `distinct` 메서드를 추가했다.

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

쿼리 실행 결과를 보면 여러 번의 쿼리가 실행되지 않고 연관 관계가 있는 데이터까지 조인해서 데이터를 가져온 것을 확인할 수 있다.
이처럼 Querydsl의 fetch join을 사용하면 JPA의 N+1 문제를 회피할 수 있다.