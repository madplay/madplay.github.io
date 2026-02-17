---
layout:   post
title:    "Simplify Object Mapping with MapStruct"
author:   madplay
tags:    java spring mapstruct
description: "Use MapStruct to simplify object mapping between DTOs and Entities (feat. Spring Boot, Lombok)"
category: Spring
date: "2022-01-03 01:21:54"
comments: true
slug:     mapstruct-in-springboot
lang:     en
permalink: /en/post/mapstruct-in-springboot
---

# Introduction to MapStruct
MapStruct makes object mapping convenient. Consider a data query API in Spring.
A request enters through a controller, passes through business and data-access layers, changes shape across layers, and finally returns a response.

A common example is conversion between DTO (Data Transfer Object) and Entity. If you use a builder, mapping often looks like this:
(You can also combine constructors and getters instead of a builder.) This example is simple because it has few fields, but as fields increase, mistakes such as typos become more likely.

```java
ArticleEntity toEntity(Article article) {
    return ArticleEntity.builder()
        .id(article.getId())
        .articleTypeCode(article.getType().getCode())
        .title(article.getTitle())
        .author(article.getWriter())
        .build();
}
```

How can MapStruct make this easier? Let's walk through it.

<br>

# Using MapStruct
> As of March 2022, this example is based on JDK 17, Spring Framework 2.6.6, Lombok 1.18.22, and MapStruct 1.4.2.Final.

This example uses Lombok for convenience. It maps a DTO object to an Entity object.

## Add Dependencies
To use MapStruct, add dependencies in `build.gradle`.
The `lombok-mapstruct-binding` dependency below was added from Lombok 1.18.16 and resolves annotation processing order conflicts when Lombok and MapStruct are used together.

> <a href="https://projectlombok.org/changelog" target="_blank" rel="nofollow">Lombok ChangeLog: v1.18.16 (October 15th, 2020)</a>
> BREAKING CHANGE: mapstruct users should now add a dependency to lombok-mapstruct-binding. This solves compiling modules with lombok (and mapstruct).

```gradle
// build.gradle
dependencies {
    // lombok
    implementation 'org.projectlombok:lombok:1.18.22'
    annotationProcessor 'org.projectlombok:lombok:1.18.22'
    annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0' // from v1.18.16+

    // mapstruct
    implementation 'org.mapstruct:mapstruct:1.4.2.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.4.2.Final'
}
```

## Define DTO and Entity
MapStruct works with accessors (getters) and mutators (setters) by default.
In this example, we avoid setters and use `@Getter` and `@Builder`.

To show custom mapping, some field types and names are intentionally different.

```java
// ArticleEntity.java
@Getter
@Builder
public class ArticleEntity {
	private Integer id;
	private Integer articleTypeCode; // different type
	private String title;
	private String author; // different name
	private String createDate;
}

// Article.java
@Getter
@Builder
public class Article {
	private Integer id;
	private ArticleType type; // different type
	private String title;
	private String writer; // different name
	private String createDate;
}

// ArticleType.java
// enum type used by Article
@RequiredArgsConstructor
@Getter
public enum ArticleType {
	TEXT(0), PHOTO(1), VIDEO(2);

	private final Integer code;
}
```

## Define Mapper
Now define the mapper responsible for object mapping.
The `@Mapper` annotation used here is from `org.mapstruct.Mapper`.
When using IDE auto-import, verify the package because it can be imported from another package such as `ibatis` by mistake.

Also, `componentModel = "spring"` in `@Mapper` registers this mapper as a Spring bean.
This example does not require bean registration, but it is required when you inject and use the mapper as a bean, or when the mapper injects other beans.

When field names differ, use `@Mapping` with source and target field names.
To skip a field during mapping, set `ignore`.

```java
@Mapper(componentModel = "spring")
public interface ArticleMapper {
	ArticleMapper INSTANCE = Mappers.getMapper(ArticleMapper.class);

	@Mappings({
		@Mapping(source = "writer", target = "author"),
		@Mapping(source = "type", target = "articleTypeCode"),
		@Mapping(target = "createDate", ignore = true)
	})
	ArticleEntity toArticleDto(Article article);

	/**
	 * Custom method
	 *
	 * ArticleType -> typeCode(Integer)
	 */
	default Integer toArticleTypeCode(ArticleType type) {
		return type.getCode();
	}
}
```

## Compilation Output
When compiled, the mapper implementation is generated based on the declared builder.

```java
// using `@Builder`
@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "date...",
    comments = "environment..."
)
@Component
public class ArticleMapperImpl implements ArticleMapper {

    @Override
    public ArticleEntity toArticleDto(Article article) {
        if ( article == null ) {
            return null;
        }

        ArticleEntityBuilder articleEntity = ArticleEntity.builder();

        articleEntity.author( article.getWriter() );
        articleEntity.articleTypeCode( toArticleTypeCode( article.getType() ) );
        articleEntity.id( article.getId() );
        articleEntity.title( article.getTitle() );

        return articleEntity.build();
    }
}
```

The generated output changes slightly depending on annotations.

### With `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`
```java
@Component
public class ArticleMapperImpl implements ArticleMapper {

    @Override
    public ArticleEntity toArticleDto(Article article) {
        if ( article == null ) {
            return null;
        }

        ArticleEntity articleEntity = new ArticleEntity();

        articleEntity.setAuthor( article.getWriter() );
        articleEntity.setArticleTypeCode( toArticleTypeCode( article.getType() ) );
        articleEntity.setId( article.getId() );
        articleEntity.setTitle( article.getTitle() );

        return articleEntity;
    }
}
```

### With `@Setter`, `@AllArgsConstructor`
```java
@Component
public class ArticleMapperImpl implements ArticleMapper {

    @Override
    public ArticleEntity toArticleDto(Article article) {
        if ( article == null ) {
            return null;
        }

        String author = null;
        Integer articleTypeCode = null;
        Integer id = null;
        String title = null;

        author = article.getWriter();
        articleTypeCode = toArticleTypeCode( article.getType() );
        id = article.getId();
        title = article.getTitle();

        String createDate = null;

        ArticleEntity articleEntity = new ArticleEntity( id, articleTypeCode, title, author, createDate );

        return articleEntity;
    }
}
```


## Run
To validate results, compare expected values from the test object with mapped values.

```java
@SpringBootTest
public class MapStructTests {
	@Test
	public void testMapStruct() {
		final Article mockArticle = Article.builder()
			.id(1)
			.title("What is MapStruct?")
			.type(ArticleType.TEXT)
			.writer("madplay")
			.createDate("2022-02-04")
			.build();

		final ArticleEntity articleEntity = ArticleMapper.INSTANCE.toArticleDto(mockArticle);

		assertEquals(articleEntity.getId(), mockArticle.getId());
		assertEquals(articleEntity.getTitle(), mockArticle.getTitle());
		assertEquals(articleEntity.getArticleTypeCode(), mockArticle.getType().getCode());
		assertEquals(articleEntity.getAuthor(), mockArticle.getWriter());
		assertNull(articleEntity.getCreateDate());
	}
}
```

This example uses an interface, but an abstract class also works.
With an interface, implement custom methods as default methods as shown above.
With an abstract class, implement them as normal methods.

<br>

# Reference
- <a href="https://mapstruct.org/" target="_blank" rel="nofollow">Reference: MapStruct Official Site</a>
