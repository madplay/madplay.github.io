---
layout:   post
title:    "What If a Spring Data JPA Field Name Matches a Database Reserved Word?"
author:   Kimtaeng
tags:    spring jpa hibernate
description: "How to handle syntax errors when JPA entity class/field names match database reserved words such as order or group"
category: Spring
date: "2021-06-04 22:37:14"
comments: true
slug:     how-to-escape-a-column-name-with-spring-data-jpa
lang:     en
permalink: /en/post/how-to-escape-a-column-name-with-spring-data-jpa
---

# What Situation Is This?
With `Spring Data JPA`, you define entity classes like this.

```java
@Entity
@Table(name = "article")
public class Article {
	@Id
	private Long id; // id
	private String title; // title
	private String description; // summary
	private String group; // group the article belongs to
}
```

At first glance, nothing looks unusual.
Now insert data using this entity class.
When JPA Repository `save` runs, you can see an error like below.

> To inspect runtime SQL, `hibernate.show_sql` and `hibernate.format_sql` are set to `true`.

```bash
Hibernate: 
    insert 
    into
        Article
        (description, 
    order, title, id) 
values
    (?, ?, ?, ?)
    
...omitted o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1064, SQLState: 42000
...omitted o.h.engine.jdbc.spi.SqlExceptionHelper   : You have an error in your SQL syntax;
check the manual that corresponds to your MySQL server version for the right syntax to use near 'order, title, id) values ('testtest', '1', 'test', 1)' at line 1
```

<br>

# Why Does This Happen?
Because the message contains `your MySQL server version for the right syntax to use near...`,
you might think query logic is wrong. But the cause is simple.

A field declared in the entity class overlaps a reserved database word, `GROUP`.
Other words such as `SELECT`, `FROM`, and `ORDER` can also cause errors, not only in fields but also in class names.

<br>

# How Do You Solve It?
First option: explicitly define column names with `@Column`, quoted as shown below.

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

Another option: set `hibernate.globally_quoted_identifiers`.
When this is `true`, Hibernate automatically wraps table/column names with backticks (`) when SQL runs.
So you can use keywords/reserved words in entity definitions without this issue.

Set it in yml/properties, or in Java config if you configure directly.

```yaml
spring:
  jpa:
    properties:
      hibernate:
        globally_quoted_identifiers: true # add this setting
        show_sql: true # print SQL
        format_sql: true # pretty-print SQL
        generate_statistics: true # show query execution stats
```

```properties
# add this setting
spring.jpa.properties.hibernate.globally_quoted_identifiers=true

# for reference, these settings print executed SQL queries
spring.jpa.properties.hibernate.show_sql=true
spring.jpa.properties.hibernate.format_sql=true

# show query execution statistics
spring.jpa.properties.hibernate.generate_statistics=true
```

```java
LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();

// ... omitted JpaVendorAdapter and Datasource setup

Properties properties = new Properties();
properties.setProperty("hibernate.globally_quoted_identifiers", "true"); // add this setting

properties.setProperty("hibernate.show_sql", "true"); // print SQL
properties.setProperty("hibernate.format_sql", "true"); // pretty-print SQL
properties.setProperty("hibernate.generate_statistics", "true"); // query execution stats
factoryBean.setJpaProperties(properties);
```

After enabling `globally_quoted_identifiers`, query output looks like this.
You can see quotes around both entity and column names.

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

However, if you use native SQL via `@Query`, you still need to quote manually as below.
So even with global configuration, do not miss this exception case.

```java
@Transactional
@Modifying
@Query(value = "INSERT INTO article (id, title, `group`) VALUES (:id, :title, :group)", nativeQuery = true)
void saveArticle(Long id, String title, String group);
```

If this handling feels cumbersome, avoiding reserved words in entity names is also a good option.
