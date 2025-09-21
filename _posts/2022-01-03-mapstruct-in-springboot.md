---
layout:   post
title:    "MapStruct 라이브러리로 객체 매핑을 간편하게!"
author:   madplay
tags:    java spring mapstruct
description: "MapStruct 라이브러리를 사용하여 DTO, Entity와 같이 객체 간의 매핑을 간편하게! (feat. SpringBoot, Lombok)"
category: Spring
date: "2022-01-03 01:21:54"
comments: true
---

# MapStruct 소개
MapStruct 라이브러리는 객체 간의 매핑을 편리하게 해준다. 스프링 프레임워크에서 데이터 조회 API를 개발할 때를 생각해보자.
컨트롤러를 통해서 들어온 요청이 여러 비즈니스 로직과 데이터 접근 로직을 거치면서 여러 계층 간의 데이터 변경을 한 후에 최종적으로 응답을 반환한다.   

DTO(Data Transfer Object)와 Entity 간의 변환을 예로 들 수 있다. 보통 빌더를 사용했다면 아래와 같은 형태로 객체 간의 매핑을 했을 것이다.
(물론 빌더를 사용하지 않고 생성자와 getter 조합으로 하기도 한다) 아래의 경우는 필드가 적어서 비교적 단순하지만, 개수가 늘어난다면 오타와 같은 실수가 발생할 확률이 크다.

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

MapStruct 라이브러리를 사용하면 어떻게 코드를 편리하게 변경할 수 있을까? 지금부터 사용 방법을 알아보자.

<br>

# MapStruct 사용해보기
> 2022년 3월 기준으로 JDK 17, Spring Framework 2.6.6, Lombok 1.18.22, MapStruct 1.4.2.Final 버전을 기반으로 합니다.

예제에서는 편의를 위해 롬복(Lombok) 라이브러리를 사용했다. 단순히 DTO 객체를 Entity 객체로 매핑하는 예제다.

## 의존성 추가
MapStruct 라이브러리를 사용하려면 의존성 추가가 필요하다. `build.gradle` 파일에 아래와 같이 선언하자.
아래 목록에 보이는 `lombok-mapstruct-binding` 의존성은 Lombok 1.18.16 버전부터 추가되었는데,
Lombok과 MapStruct 라이브러리를 같이 사용할 때 발생하는 순서 충돌 문제를 해결해준다.

> <a href="https://projectlombok.org/changelog" target="_blank" rel="nofollow">Lombok ChangeLog: v1.18.16 (October 15th, 2020)</a>
> BREAKING CHANGE: mapstruct users should now add a dependency to lombok-mapstruct-binding. This solves compiling modules with lombok (and mapstruct).

```gradle
// build.gradle
dependencies {
    // lombok
    implementation 'org.projectlombok:lombok:1.18.22'
    annotationProcessor 'org.projectlombok:lombok:1.18.22'
    annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0' // v1.18.16+ 부터

    // mapstruct
    implementation 'org.mapstruct:mapstruct:1.4.2.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.4.2.Final'
}
```

## DTO, Entity 정의
Mapstruct 라이브러리는 기본적으로 접근자(getter)와 수정자(setter)를 기반으로 동작하지만,
이번 예제에서는 setter 사용을 지양하는 차원에서 `@Getter`, `@Builder` 어노테이션을 사용한다.

또한 커스텀하게 매핑하는 방법을 살펴보기 위해서 임의로 몇몇 필드의 타입이나 이름을 각각 다르게 설정했다.

```java
// ArticleEntity.java
@Getter
@Builder
public class ArticleEntity {
	private Integer id;
	private Integer articleTypeCode; // 타입이 다르다.
	private String title;
	private String author; // 이름이 다르다.
	private String createDate;
}

// Article.java
@Getter
@Builder
public class Article {
	private Integer id;
	private ArticleType type; // 타입이 다르다.
	private String title;
	private String writer; // 이름이 다르다.
	private String createDate;
}

// ArticleType.java
// Article 클래스에서 사용하는 enum 타입
@RequiredArgsConstructor
@Getter
public enum ArticleType {
	TEXT(0), PHOTO(1), VIDEO(2);

	private final Integer code;
}
```

## Mapper 정의
이제 객체간 매핑 기능을 담당할 매퍼를 정의한다. 예제에서 사용한 `@Mapper` 어노테이션의 패키지 경로는 `org.mapstruct.Mapper`다.
IDE 힌트 기능을 사용하다가 간혹 `ibatis` 등의 패키지 경로로 선언될 수 있으므로 주의하자.

한편 `@Mapper` 어노테이션의 `componentModel = "spring"` 선언은 해당 매퍼를 스프링 빈(bean)으로 등록하기 위한 설정이다. 
이번 예제에서 이 선언은 필요 없지만, 매퍼를 빈으로 등록해서 사용하거나, 매퍼 내부에서 다른 빈을 주입받아서 사용할 때는 필수적이다.

필드 이름이 다른 경우 예제와 같이 `@Mapping` 어노테이션을 통해 source와 target에 각각 필드 이름을 지정하면 되고,
매핑 과정에서 무시하고 싶은 필드의 경우 `ignore` 옵션을 설정하면 된다.

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
	 * 커스텀 메서드
	 *
	 * ArticleType -> typeCode(Integer)
	 */
	default Integer toArticleTypeCode(ArticleType type) {
		return type.getCode();
	}
}
```

## 컴파일 결과
정의한 매퍼가 컴파일 되었을 때 어떤 모습인지 살펴보면 아래와 같이 선언한 빌더를 기반으로 컴파일 된 것을 확인할 수 있다.

```java
// `@Builder` 사용
@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "날짜...",
    comments = "사용 환경..."
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

테스트한 결과 선언된 어노테이션에 따라서 컴파일 결과가 조금씩 달랐다.

### 어노테이션 `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor` 선언
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

### 어노테이션 `@Setter`, `@AllArgsConstructor` 선언
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


## 실행
결과 검증은 테스트에 사용한 객체와 매핑 결과로 반환된 객체의 기댓값을 비교하면 된다.

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

예제에서는 인터페이스(interface)를 사용하여 선언했지만, 추상 클래스(abstract class)도 가능하다.
인터페이스를 사용한 경우 예제처럼 커스텀 메서드를 default 메서드로 구현해야 하며, 추상 클래스를 사용한 경우 일반 메서드로 구현하면 된다.

<br>

# 참고
- <a href="https://mapstruct.org/" target="_blank" rel="nofollow">참고 링크: MapStruct 공식사이트</a>
