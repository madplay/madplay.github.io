---
layout:   post
title:    "Spring Data JPA를 사용할 때 필드 이름이 데이터베이스의 예약어와 같아서 문법 오류가 발생한다면?"
author:   Kimtaeng
tags: 	  spring jpa hibernate
description: "JPA의 엔티티 클래스 또는 필드 이름이 order, group과 같은 데이터베이스의 예약어와 동일하여 문법 오류가 발생하는 경우에는 어떻게 해야 할까?"
category: Spring
date: "2021-06-04 22:37:14"
comments: true
---

# 어떤 상황일까?
`Spring Data JPA`를 사용할 때는 아래와 같이 엔티티 클래스를 정의하게 된다.

```java
@Entity
@Table(name = "article")
public class Article {
	@Id
	private Long id; // 아이디
	private String title; // 제목
	private String description; // 요약문
	private String group; // 기사가 속한 그룹
}
```

겉으로 보기에는 특이한 점은 보이지 않는다. 그렇다면 위의 엔티티 클래스를 기반으로 데이터를 추가해보자.
데이터를 추가하는 JPA Repository의 `save` 메서드를 실행시키면 아래와 같은 오류를 볼 수 있다.

> 실행되는 쿼리를 확인하기 위해 `hibernate.show_sql`과 `hibernate.format_sql` 옵션을 `true`로 설정했다.

```bash
Hibernate: 
    insert 
    into
        Article
        (description, 
    order, title, id) 
values
    (?, ?, ?, ?)
    
...생략 o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1064, SQLState: 42000
...생략 o.h.engine.jdbc.spi.SqlExceptionHelper   : You have an error in your SQL syntax;
check the manual that corresponds to your MySQL server version for the right syntax to use near 'order, title, id) values ('testtest', '1', 'test', 1)' at line 1
```

<br>

# 왜 오류가 발생할까?
흔히 문법 오류 상황에서 발생하는 `your MySQL server version for the right syntax to use near...` 문장이기 때문에 쿼리가 잘못된 것으로
생각하고 로직을 확인할 수도 있으나, 사실 오류가 발생하는 원인은 단순하다.

엔티티 클래스에 선언된 필드가 데이터베이스의 예약어 `GROUP`과 중복되기 때문이다.
이 밖에도 `SELECT`, `FROM`, `ORDER` 등도 엔티티 클래스의 필드뿐만 아니라 클래스 이름 자체에서도 오류를 일으킬 수 있다.

<br>

# 그렇다면 어떻게 해결해야 할까?
먼저 `@Column` 어노테이션을 통해 컬럼 이름을 직접 지정하는 방법이 있다. 아래와 같이 따옴표로 감싸서 지정하면 된다.

```java
@Entity
@Table(name = "article")
public class Article {
	@Id
	private Long id;
	private String title;
	private String description;
	
	@Column(name = "\"group\"")
	private String group;
}
```

다른 방법은 `hibernate.globally_quoted_identifiers` 설정을 하는 방법이다. 이 값을 `true`로 지정하면 SQL 문이 실행될 때,
틸드(`)로 테이블과 컬럼을 자동으로 감싸준다. 따라서 데이터베이스의 키워드 또는 예약어를 엔티티 클래스에 사용하더라도 이슈가 없다.

아래와 같이 yml 또는 properties 파일에 설정하거나 자바 설정을 하는 경우 직접 코드에 추가하면 된다.

```yaml
spring:
  jpa:
    properties:
      hibernate:
        globally_quoted_identifiers: true # 이 설정을 추가해준다.
        show_sql: true # 쿼리를 출력해준다.
        format_sql: true # 쿼리를 예쁘게 출력해준다.
        generate_statistics: true # 쿼리 수행 통계를 확인할 수 있다.
```

```properties
# 이 설정을 추가해준다.
spring.jpa.properties.hibernate.globally_quoted_identifiers=true

# 참고로 아래 설정은 실행된 SQL 쿼리를 출력해준다.
spring.jpa.properties.hibernate.show_sql=true
spring.jpa.properties.hibernate.format_sql=true

# 쿼리 수행 통계를 확인할 수 있다.
spring.jpa.properties.hibernate.generate_statistics=true
```

```java
LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();

// ... JpaVendorAdapter, Datasource 관련 코드는 생략

Properties properties = new Properties();
properties.setProperty("hibernate.globally_quoted_identifiers", "true"); // 이 설정을 추가해준다.

properties.setProperty("hibernate.show_sql", "true"); // 쿼리 출력
properties.setProperty("hibernate.format_sql", "true"); // 쿼리를 예쁘게 출력
properties.setProperty("hibernate.generate_statistics", "true"); // 쿼리 수행 통계
factoryBean.setJpaProperties(properties);
```

`globally_quoted_identifiers` 이 옵션을 활성화한 후에 쿼리 실행 결과를 확인해보면 아래와 같다. 엔티티 클래스의 이름뿐만 아니라
컬럼도 따옴표로 감싸져서 실행되는 것을 알 수 있다.

```bash
Hibernate: 
    insert 
    into
        `
        Article` (
            `description`, `
        group`, `title`, `id`
    ) 
values
    (?, ?, ?, ?)
```

다만, `@Query` 어노테이션을 기반으로 네이티브 쿼리(Native Query)를 사용할 때는 아래와 같이 따옴표로 직접 감싸줘야 한다.
따라서 전역으로 설정을 했더라도 직접 챙겨야 하는 예외 상황을 놓치지 말자.

```java
@Transactional
@Modifying
@Query(value = "INSERT INTO article (id, title, `group`) VALUES (:id, :title, :group)", nativeQuery = true)
void saveArticle(Long id, String title, String group);
```

이러한 처리가 번거롭다고 느껴진다면, 데이터베이스의 예약어나 키워드를 엔티티 클래스에 사용하지 않는 것도 좋은 방법일 수 있다.