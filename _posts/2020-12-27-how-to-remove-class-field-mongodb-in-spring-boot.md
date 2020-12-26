---
layout:   post
title:    "Spring Boot에서 MongoDB에 _class 필드를 저장하지 않는 방법"
author:   Kimtaeng
tags: 	  spring mongotemplate reactivemongotemplate
description: "스프링 부트에서 몽고 DB에 데이터를 저장할 때 _class 필드를 저장하지 않도록 설정하는 방법은?"
category: Spring
date: "2020-12-27 02:01:25"
comments: true
---

# 이게 무슨 필드야?
스프링 부트(Spring Boot)에서 spring-data-mongodb를 사용하여 MongoDB와 연동할 때, 데이터를 저장하려고 하면 `_class`라는
필드가 자동으로 삽입된다.

```bash
> db.article.find()
{
  "_class": "com.madplay.model.Article",
  "_id": "ObjectId("153e830031fv4af2bd16e"),
  "title": "Hello, MadPlay!"
}
```

스프링 부트에 별다른 설정을 하지 않았다면, 객체를 Mongo DB에 저장할 때 자동으로 클래스의 패키지 정보가
함께 저장되는 것을 볼 수 있다. 그렇다면 `_class` 필드의 용도는 무엇일까?

MongoDB의 컬렉션에는 다양한 유형의 인스턴스를 문서로 포함할 수 있는데, 저장된 객체를 찾을 때는 해당 필드의 값들을
올바르게 읽는 것이 중요하다. 따라서 문서(Document)를 저장할 때 함께 타입 정보를 저장하는 매커니즘을 사용하며,
이러한 역할에 도움을 주는 것이 바로 `_class` 필드다.

<br>

# _class 필드를 저장하지 않을 수 없을까?
MongoDB를 리액티브(reactive)로 사용하는 `spring-boot-starter-data-mongodb-reactive` 의존성을 기반으로 아래와 같이 설정하면 된다.
다른 부분은 각자 프로젝트에 맞게 설정하면 되지만, 핵심은 `DefaultMongoTypeMapper`를 설정하는 부분이다.
이 설정을 변경하면 `_class` 필드를 저장하지 않도록 설정할 수 있다.

```java
@Configuration
@EnableReactiveMongoRepositories(basePackages = "com.madplay.taengtest",
        reactiveMongoTemplateRef = "simpleReactiveMongoTemplate")
public class MongoConfiguration {

	private final MongoMappingContext mongoMappingContext;

	public MongoConfiguration(MongoMappingContext mongoMappingContext) {
		this.mongoMappingContext = mongoMappingContext;
	}

    @Bean
    public ReactiveMongoDatabaseFactory reactiveMongoDatabaseFactory(MongoClient mongoClient) {
        return new SimpleReactiveMongoDatabaseFactory(mongoClient, "taeng");
    }

    @Bean
    public MappingMongoConverter reactiveMappingMongoConverter() {
        MappingMongoConverter converter = new MappingMongoConverter(ReactiveMongoTemplate.NO_OP_REF_RESOLVER,
            mongoMappingContext);

		// 핵심은 이 부분으로, '_class' 필드를 제거하는 설정이다.
        converter.setTypeMapper(new DefaultMongoTypeMapper(null));
        return converter;
    }

    @Bean
    public ReactiveMongoTemplate simpleReactiveMongoTemplate(ReactiveMongoDatabaseFactory reactiveMongoDatabaseFactory, 
        MappingMongoConverter reactiveMappingMongoConverter) {
        return new ReactiveMongoTemplate(reactiveMongoDatabaseFactory, reactiveMappingMongoConverter);
    }
}
```


<br>

# _class 필드의 값을 다른 값으로 지정할 수는 없을까?
`_class` 필드는 기본적으로 엔티티 클래스의 패키지를 포함한 전체 경로를 사용한다. 물론 기본값을 사용하지 않고 다른 이름을
부여할 수도 있다. 방법은 아래와 같이 `@TypeAlias` 어노테이션을 사용하면 된다.

```java
// _class 필드에 `taeng` 으로 저장된다.
@TypeAlias("taeng")
class Person {
	// 생략
}
```