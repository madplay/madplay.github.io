---
layout: post
title: "Spring Boot 3.2에 추가된 JdbcClient 살펴보기"
author: madplay
tags: spring-boot jdbcclient jpa persistence
description: "Spring Boot 3.2에서 등장한 dbcClient는 기존 JdbcTemplate의 장황함을 어떻게 해결했을까?"
category: Spring
date: "2024-01-21 21:14:52"
comments: true
---

# JPA만으로 해결하기 까다로운 지점들

자바 생태계에서 데이터를 다룰 때 JPA(Java Persistence API)는 가장 먼저 고려되는 도구다.
객체 중심의 도메인 모델을 데이터베이스와 매핑하고, 단순한 CRUD부터 복잡한 연관관계까지 추상화된 인터페이스로 다룰 수 있기 때문이다.
대부분의 비즈니스 로직은 엔티티의 생명주기 관리만으로도 충분히 구현 가능하다.

하지만 JPA만으로 해결하기 까다로운 지점은 늘 존재한다.
수십 개의 테이블을 조인해야 하는 대규모 통계 쿼리나, 데이터베이스 전용 함수를 대량으로 사용하는 리포트 생성,
혹은 수만 건의 데이터를 한 번에 처리해야 하는 벌크 연산이 그렇다.
Querydsl을 써서 우회할 수는 있지만, 생성되는 쿼리가 직관적이지 않거나 성능 최적화의 여지가 줄어드는 상황을 만나곤 한다.

이런 순간 개발자들은 다시 JDBC(Java Database Connectivity)를 떠올린다.
그동안 스프링에서 이 역할을 맡아온 `JdbcTemplate`은 강력하지만, 파라미터 바인딩과 결과 매핑 코드가 다소 장황하다는 아쉬움이 있었다.
시간이 흘러 2023년 11월, Spring Boot 3.2(Spring Framework 6.1)와 함께 이 간극을 메워줄 새로운 인터페이스가 등장했다.
바로 **`JdbcClient`**다.

<br>

# JdbcClient: 가볍고 직관적인 인터페이스

`JdbcClient`는 기존 `NamedParameterJdbcTemplate`의 기능을 현대적인 **Fluent API** 스타일로 재구성한 도구다.
이미 스프링 생태계에서 익숙한 `WebClient`나 `RestClient`와 동일한 설계 철학을 공유하며,
함수형 스타일의 흐름을 통해 데이터에 접근한다.

가장 큰 특징은 "무엇을 할 것인가"를 메서드 체이닝으로 명확히 드러낸다는 점이다.
수많은 오버로딩 메서드 중 하나를 골라 인자를 채워 넣는 대신, 쿼리 정의부터 결과 추출까지의 단계를 순차적으로 밟아 나간다.

> **기준 버전**
> - Spring Boot 3.2.0+ / Spring Framework 6.1.0+
> - Java 17+ (Record 지원 최적화)

```java
// Spring Boot 3.2의 JdbcClient 사용 예시
public List<ProductDto> findAvailableProducts(Long minPrice) {
    return jdbcClient.sql("SELECT id, name, price FROM products WHERE price >= :minPrice")
        .param("minPrice", minPrice)
        .query(ProductDto.class)
        .list();
}
```

SQL을 정의하고, 파라미터를 이름 기반으로 바인딩하며, 결과를 특정 클래스로 매핑하여 반환하는 흐름이 자연스럽게 이어진다.

<br>

# 내부 동작 원리: 어떻게 동작할까?

`JdbcClient`는 완전히 새로운 로직을 바닥부터 구현한 것이 아니라, 기존 스프링 JDBC의 견고한 인프라를 래핑한 결과물이다.

## 1. NamedParameterJdbcTemplate의 대행자
`JdbcClient`의 기본 구현체인 `DefaultJdbcClient`는 내부적으로 `NamedParameterJdbcTemplate`을 소유하고 있다.
사용자가 호출하는 `.sql()`, `.param()`, `.update()` 등의 메서드는 결국 내부의 템플릿으로 전달되어 실행된다.
이는 기존에 검증된 트랜잭션 관리와 커넥션 풀링 메커니즘을 그대로 계승한다는 의미다.

## 2. 지능적인 결과 매핑
결과를 매핑할 때 `JdbcClient`는 클래스 타입을 분석하여 적절한 `RowMapper`를 자동으로 생성한다.
특히 자바 **Record**를 사용할 경우 `DataClassRowMapper`를, 일반적인 빈(Bean) 구조일 경우 `BeanPropertyRowMapper`를 활용한다.
Java 17 이상에서 컴파일 시 `-parameters` 플래그를 사용하면, 생성자의 인자 이름을 런타임에 읽어 SQL 컬럼명과 자동으로 매칭해준다.

## 3. 트랜잭션 동기화
`JdbcClient`는 스프링의 `DataSourceUtils`를 통해 현재 활성화된 트랜잭션에 참여한다.
따라서 하나의 `@Transactional` 안에서 JPA 엔티티를 수정하고 `JdbcClient`로 쿼리를 날려도,
동일한 데이터베이스 커넥션을 공유하며 원자적(Atomic)인 작업이 보장된다.

<br>

# 실무 활용 예제

`JdbcClient`를 더 효과적으로 사용하기 위한 몇 가지 패턴을 살펴보자.

## 1. 유연한 파라미터 바인딩
개별 파라미터뿐만 아니라 Map이나 DTO 객체를 통째로 넘길 수 있다.

```java
// DTO 객체를 활용한 바인딩
SearchCondition condition = new SearchCondition("ELECTRONICS", 10000L);
jdbcClient.sql("SELECT ... WHERE category = :category AND price > :minPrice")
    .params(condition) // 필드명을 파라미터 이름으로 자동 매칭
    .query(ProductDto.class)
    .list();
```

## 2. 자동 생성 키(PK) 조회
데이터를 삽입한 뒤 데이터베이스가 생성한 ID 값을 가져오는 작업도 간결하다.

```java
GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
jdbcClient.sql("INSERT INTO products(name) VALUES (:name)")
    .param("name", "New Product")
    .update(keyHolder, "id");

Long newId = keyHolder.getKeyAs(Long.class);
```

<br>

# 상황에 맞는 도구 고르기

데이터 접근 기술은 각각의 장단점이 뚜렷하다. 프로젝트의 성격에 맞춰 적절한 도구를 선택하는 것이 중요하다.

| 항목 | JPA / Querydsl | MyBatis | JdbcTemplate | JdbcClient |
| :--- | :--- | :--- | :--- | :--- |
| **추상화 수준** | 높음 (객체 중심) | 중간 (SQL 중심) | 낮음 (JDBC 래퍼) | 낮음 (현대적 래퍼) |
| **생산성** | 우수 (CRUD 자동화) | 양호 (SQL 분리) | 보통 (장황한 코드) | 우수 (Fluent API) |
| **복잡한 쿼리** | 어려움 (추상화 한계) | 우수 (직접 제어) | 우수 (직접 제어) | 우수 (직접 제어) |
| **타입 안정성** | 매우 높음 (컴파일 타임) | 낮음 (런타임 XML) | 낮음 (문자열 SQL) | 낮음 (문자열 SQL) |
| **러닝 커브** | 높음 | 중간 | 낮음 | 매우 낮음 |

`JdbcClient`는 JPA의 추상화보다 SQL의 직접적인 제어권이 필요할 때, MyBatis처럼 무거운 설정 없이 곧바로 꺼내 쓸 수 있는 가장 가벼운 선택지다.

<br>

# 정리하며

Spring Boot 3.2의 `JdbcClient`는 기존의 강력한 기능을 현대적인 방식으로 다시 쓴 도구다.
특히 **개발자 경험(DX, Developer Experience)**, 즉 개발자가 도구를 사용하면서 느끼는 편의성과 생산성을 크게 높여준다.
장황한 반복 코드를 줄이고 로직의 의도를 명확히 드러낼 수 있게 돕기 때문이다.

모든 것을 JPA로 해결하려다 쿼리의 늪에 빠지기보다는,
상황에 맞춰 `JdbcClient`를 적절히 섞어 쓰는 유연함이 필요하다.
중요한 것은 특정 기술에 매몰되지 않고, 변화하는 생태계에 맞춰 가장 효율적인 해결책을 선택하는 일이다.
이 새로운 인터페이스는 백엔드 개발자의 무기고에 아주 훌륭한 추가가 될 것이다.

<br>

# 참고
- <a href="https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html#jdbc-JdbcClient" target="_blank" rel="nofollow">Spring Framework Reference - JdbcClient</a>
- <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.2-Release-Notes" target="_blank" rel="nofollow">Spring Boot 3.2 Release Notes</a>
