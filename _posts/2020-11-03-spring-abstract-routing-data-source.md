---
layout:   post
title:    "스프링에서 여러 개의 DataSource를 등록하고 사용할 수 있을까?"
author:   Kimtaeng
tags:     abstractroutingdatasource
description: "스프링의 AbstractRoutingDataSource를 사용하여 다중 DataSource를 등록하고 상황에 맞게 변경하여 사용해보자." 
category: Spring
date: "2020-11-03 02:52:11"
comments: true
---

# 왜 필요할까
운영 중인 애플리케이션이 단순히 하나의 데이터베이스와 연결한다면 상관없지만 여러 대의 데이터베이스와 연결하여 데이터를 가져와야 하는 경우가
생길 수 있다. 예를 들면 이중화가 되어 있는 환경에서 평상시에는 Replica에 접근하다가, 데이터 복제에 이슈가 발생한 경우에 Master와 연결하도록
변경하는 등 운영 중에 연결할 데이터베이스를 변경하게 될 수 있다.

이렇게 특정 상황에 맞게 DataSource를 동적으로 변경하는 기능은 스프링 jdbc에 포함되어 있는 `AbstractRoutingDataSource`를
사용하면 쉽게 구현할 수 있다. 이어지는 예제를 통해 사용법을 확인해보자.

<br>

# gradle 프로젝트 구성
먼저 `gradle` 프로젝트를 생성할 것이다. `maven` 으로 해도 상관없다.
예제를 실행하는데 필수적인 요소가 아닌 내용은 생략했다.

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
이제 DataSource에 대한 config를 작성하기 전에 `AbstractRoutingDataSource`를 먼저 정의해야 한다.
이를 상속하는 클래스를 만들고 어떤 방식으로 데이터베이스를 선택할지 결정할 `determineCurrentLookupKey` 메서드를 재정의한다.

이번 예제에서는 2대의 데이터베이스(Master/Replica)와 연결한다고 가정한다. 결정하는 방법은 간단히 호출한 URI 패턴이 `/master`로 시작하는지
아닌지로 결정한다. 여기서 반환하는 것은 DataSource 관련 설정에서 지정할 키값이다.


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

예제에서는 RequestURI를 사용했지만, Session, ThreadLocal 등을 이용하는 방법도 있다. 애플리케이션이 구동중에 동적으로 설정값을
변경할 수 있는 **Spring Cloud Config**와 연계할 수도 있다.

- <a href="/post/introduction-to-spring-cloud-config">참고 링크: Spring Cloud Config: 소개와 예제</a>

<br>

# DataBase Config
이제 데이터베이스에 대한 설정 클래스를 작성한다. 구상하는 시스템에 따라서 등록하는 `DataSource`가 다를 수 있다.
`AbstractRoutingDataSource`를 사용하는 것이 예제의 목적이므로 간단하게 서로 다른 DataSource를 반환하는 메서드를 만들어서
테스트해 볼 것이다.

```java
@Configuration
@MapperScan(value = "com.example.madplay.mapper")
public class DatabaseConfig {

	@Bean(name = "dbDataSource")
	public DataSource RouterDataSource() {
		Map<Object, Object> targetSources = new HashMap<>();
        // `AbstractRoutingDataSource` 에서 반환하는 키 값과 동일하다.
        targetSources.put("master", getMasterDataSource());
		targetSources.put("replica", getReplicaDataSource());

        MyRoutingDataSource dataSource = new MyRoutingDataSource();
		dataSource.setTargetDataSources(targetSources);
		return dataSource;
	}

    private DataSource getMasterDataSource() {
		com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
		// ... driver, username, password 생략
		dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/masterDB?autoReconnect=true&useSSL=false");
		return dataSource;
	}

	private DataSource getReplicaDataSource() {
		com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
		// ... driver, username, password 생략
		dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/replicaDB?autoReconnect=true&useSSL=false");
		return dataSource;
	}
}
```

<br>

# Mapper 구성
마이바티스의 매퍼(mapper) 클래스를 정의해보자. 아래와 같이 별도 XML 파일을 만들어서 쿼리문을 작성해도 되고, 아니면 간단하게 매퍼 클래스에
어노테이션으로 쿼리를 선언해도 된다.

쿼리문에 사용한 컬럼과 테이블 명은 테스트를 위해 임의로 생성했다. 두 개의 다른 데이터베이스 masterDB, replicaDB 같은 테이블과 컬럼으로
생성했으며 masterDB에는 db_name 필드가 'master' 라는 값으로, replicaDB에는 db_name 필드가 'replica' 라는 값으로 들어가있다.

## 방법1. 별도 XML에 쿼리 작성

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

이렇게 별도 XML으로 분리한 경우 xml 파일이 선언된 곳을 스프링이 찾을 수 있도록 `application.properties`에 아래와 같이 선언해야 한다.
구성하는 프로젝트의 구조에 따라 맞춰서 사용하면 된다.

```properties
mybatis.mapper-locations=classpath:mapper/*.xml
```

## 방법2. 어노테이션으로 쿼리 작성
어노테이션을 사용하여 매퍼 클래스에 바로 작성하는 경우 아래와 같이 하면 된다.

```java
@Mapper
public interface MyMapper {
	@Select("SELECT db_name FROM my_table")
	String selectDbName();
}
```

<br>

# 테스트해보기
마지막으로 `AbstractRoutingDataSource`가 잘 동작하는지 테스트할 컨트롤러를 작성해보자.
단순히 입력한 URL에 따라 결과를 출력한다.

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

이제 정상적으로 동작하는지 확인하는지 직접 호출해보자. 아래와 같이 호출한 URL에 따라 데이터베이스와의 연결이 달라지는 것을 확인할 수 있다.

```bash
$ curl "http://localhost:8080/master"
DB: master

$ curl "http://localhost:8080/replica"
DB: replica
```
