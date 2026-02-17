---
layout:   post
title:    "How to Avoid Storing _class Field in MongoDB from Spring Boot"
author:   madplay
tags:    spring mongotemplate reactivemongotemplate
description: "How to configure Spring Boot so MongoDB documents do not store the _class field"
category: Spring
date: "2020-12-27 02:01:25"
comments: true
slug:     how-to-remove-class-field-mongodb-in-spring-boot
lang:     en
permalink: /en/post/how-to-remove-class-field-mongodb-in-spring-boot
---

# What is this field?
When Spring Boot integrates with MongoDB via `spring-data-mongodb`, saving data automatically inserts field `_class`.
Without extra configuration, object saving includes class package information as below.

```bash
> db.article.find()
{
  "_class": "com.madplay.model.Article",
  "_id": "ObjectId("153e830031fv4af2bd16e"),
  "title": "Hello, MadPlay!"
}
```

**Then what is `_class` for?**
MongoDB collections can store various instance types as documents.
To reconstruct fetched documents into complete objects, type information must be read correctly.
So Spring stores type metadata during save, and `_class` acts as that hint.

<br>

# Can we avoid storing _class?
Yes. With reactive MongoDB dependency `spring-boot-starter-data-mongodb-reactive`, configure as below.
Other parts vary by project, but the key is `DefaultMongoTypeMapper`.
With this setting, `_class` is not stored.

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

		// this line is the key: removes '_class' field
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

# Can _class value be changed instead?
By default, `_class` stores the full entity class path including package.
You can assign a different value instead of this default.
Use `@TypeAlias` as below.

```java
// _class field is stored as `taeng`
@TypeAlias("taeng")
class Person {
	// omitted
}
```
