---
layout:   post
title:    "Can Spring Register and Use Multiple DataSources?"
author:   Kimtaeng
tags:     abstractroutingdatasource
description: "Let's register multiple DataSources with Spring AbstractRoutingDataSource and switch them by context." 
category: Spring
lang: en
slug: spring-abstract-routing-data-source
permalink: /en/spring-abstract-routing-data-source/
date: "2020-11-03 02:52:11"
comments: true
---

# Why Is This Needed?
If your application connects to one database only, this is simple.
But production systems often need multiple databases.
For example, in replicated environments you may read from replica by default,
and switch to master when replication issues occur.

This kind of dynamic DataSource routing can be implemented with Spring JDBC `AbstractRoutingDataSource`.
Let's review a concrete example.

<br>

# Gradle Project Setup
We'll use a `gradle` project here, but `maven` is fine too.
Non-essential parts are omitted.

```gradle
plugins {
    id 'org.springframework.boot' version '2.3.4.RELEASE'
    id 'io.spring.dependency-management' version '1.0.10.RELEASE'
    id 'java'
}

sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter:2.4.0'
    implementation 'org.springframework.boot:spring-boot-starter-web:2.4.0'
    implementation 'org.springframework.boot:spring-boot-starter-data-jdbc:2.4.0'
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:1.3.1'
    compile 'mysql:mysql-connector-java:5.1.42'
}
```

<br>

# AbstractRoutingDataSource
Before writing DataSource config, define a class extending `AbstractRoutingDataSource`.
Override `determineCurrentLookupKey` to decide which database key to use.

In this example, assume two databases (Master/Replica).
For simplicity, use URI pattern: if request URI starts with `/master`, use master, otherwise replica.
Return value is the key used in DataSource target mapping.

```java
public class MyRoutingDataSource extends AbstractRoutingDataSource {
	@Override
	protected Object determineCurrentLookupKey() {
        HttpServletRequest request = ((ServletRequestAttributes)RequestContextHolder.getRequestAttributes()).getRequest();
        if (request.getRequestURI().startsWith("/master")) {
            return "master";
        } else {
            return "replica";
        }	
	}
}
```

This example uses RequestURI, but Session/ThreadLocal-based approaches are also possible.
You can also combine this with **Spring Cloud Config** for dynamic runtime configuration.

- <a href="/post/introduction-to-spring-cloud-config">Reference: Spring Cloud Config introduction and example</a>

<br>

# Database Config
Now write database config class.
Depending on your architecture, registered `DataSource`s differ.
Because focus here is `AbstractRoutingDataSource`, we use simple methods returning different DataSources.

```java
@Configuration
@MapperScan(value = "com.example.madplay.mapper")
public class DatabaseConfig {

	@Bean(name = "dbDataSource")
	public DataSource RouterDataSource() {
		Map<Object, Object> targetSources = new HashMap<>();
        // Must match key values returned in `AbstractRoutingDataSource`.
        targetSources.put("master", getMasterDataSource());
		targetSources.put("replica", getReplicaDataSource());

        MyRoutingDataSource dataSource = new MyRoutingDataSource();
		dataSource.setTargetDataSources(targetSources);
		return dataSource;
	}

    private DataSource getMasterDataSource() {
		com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
		// ... driver, username, password omitted
		dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/masterDB?autoReconnect=true&useSSL=false");
		return dataSource;
	}

	private DataSource getReplicaDataSource() {
		com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
		// ... driver, username, password omitted
		dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/replicaDB?autoReconnect=true&useSSL=false");
		return dataSource;
	}
}
```

<br>

# Mapper Setup
Let's define MyBatis mapper.
You can write SQL in separate XML files or directly with annotations.

In this example, table/column names are simplified for testing.
Both `masterDB` and `replicaDB` have same table/column schema.
`masterDB` stores `db_name = master`, and `replicaDB` stores `db_name = replica`.

## Option 1. SQL in separate XML

```xml
<mapper namespace="com.example.madplay.mapper.MyMapper">
    <select id="selectDbName" resultType="String">
        SELECT
            db_name
        FROM
            my_table
    </select>
</mapper>
```

If you use separate XML files, configure location in `application.properties`.
Adjust path based on your project layout.

```properties
mybatis.mapper-locations=classpath:mapper/*.xml
```

## Option 2. SQL with annotations
Write SQL directly in mapper interface:

```java
@Mapper
public interface MyMapper {
	@Select("SELECT db_name FROM my_table")
	String selectDbName();
}
```

<br>

# Test It
Finally, write a controller to test routing behavior.
It returns selected DB name based on request URL.

```java
@RestController
public class MyController {
	private final MyMapper myMapper;

	public MyController(MyMapper myMapper) {
		this.myMapper = myMapper;
	}

	@GetMapping("/master")
	public String master() {
		return String.format("DB: %s", myMapper.selectDbName());
	}

	@GetMapping("/replica")
	public String replica() {
		return String.format("DB: %s", myMapper.selectDbName());
	}
}
```

Now call endpoints and verify routing behavior.
As shown below, database connection changes based on requested URL.

```bash
$ curl "http://localhost:8080/master"
DB: master

$ curl "http://localhost:8080/replica"
DB: replica
```
