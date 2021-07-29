---
layout:   post
title:    "Querydsl: 소개와 사용법"
author:   Kimtaeng
tags: 	  querydsl jpa
description: Querydsl은 무엇이며 왜 필요할까? 그리고 어떻게 사용할까?
category: Knowledge
date: "2021-01-01 20:54:19"
comments: true
---

# Querydsl 소개
Querydsl은 HQL(Hibernate Query Language) 쿼리를 타입에 안전하게 생성 및 관리할 수 있게 해주는 프레임워크" 다.
공식 레퍼런스를 인용한 정의인데, 잘 와닿지 않는다면 "Querydsl은 자바 코드 기반으로 쿼리를 작성하게 해준다"라고 생각해도 좋을 것 같다.

- <a href="https://querydsl.com/static/querydsl/4.4.0/reference/html_single/#intro" target="_blank" rel="nofollow">참고 링크: Querydsl Reference Guide</a>

<br>


# Querydsl은 왜 필요할까?
JPA를 사용한다고 가정해보자. 간단한 쿼리라면 인터페이스에 메서드 명세만 잘 정의해 주면 별다른 문제 없이 사용할 수 있을 것이다.
예를 들면 아래처럼 "제목에 특정 문자열이 포함된 기사를 조회"하는 메서드처럼 말이다.

```java
Article findByTitleContains(String title);
```

조금 더 복잡한 쿼리가 필요한 경우에는 어떨까? 앞서 살펴본 것처럼 단순히 특정 문자열이 제목에 포함된 기사를 조회하는 것이 아니라,
기사를 작성한 사용자의 레벨을 기준으로 조회하는 것이다.

이런 경우에는 JPA 자체 제공 메서드만으로 해결하기 어렵기 때문에 네이티브 쿼리(Native Query)를 고려해볼 수 있다.
다음은 레벨이 특정 기준 이상인 사용자가 작성한 기사들을 조회하는 메서드다.

```java
@Query(value = "SELECT id, title, user_id FROM article WHERE user_id IN (SELECT id FROM user WHERE level > :level)", nativeQuery = true)
List<Article> findByLevel(String level);
```

위에서 정의한 네이티브 쿼리를 다시 살펴보자. 가독성은 감안하더라도 문자열을 이어 붙여가며 직접 작성하기 때문에 오타가 발생하기 아주 좋다.

**그렇다면 이 코드를 Querydsl로 변경하면 어떻게 될까?** 아직 Querydsl을 사용하는 방법에 대해서 알아보지 않았지만 어떤 모습일지 먼저 살펴보자.
다음은 위에서 살펴본 네이티브 쿼리와 동일한 쿼리를 수행하는 Querydsl 예시다. 

```java
public List<Article> findByUserLevel(String level) {
    QArticle article = QArticle.article;
    QUser user = QUser.user;

    return queryFactory.selectFrom(article)
        .where(
            article.userId.in(
                JPAExpressions
                    .select(user.id)
                    .from(user)
                    .where(user.level.gt(level))
            )
        )
        .fetch();
}
```

앞서 살펴본 네이티브 쿼리보다 훨씬 가독성이 좋다. ~~물론 코드의 절대적인 양은 늘었지만...~~

또한 메서드 타입에 맞지 않는 파라미터를 넘기는 경우 친절하게 컴파일 오류를 발생시켜 잠재적인 버그를 방지해준다.
즉, 실행 시점 이전에 잘못된 쿼리 파라미터 타입까지 확인할 수 있는 장점이 있다.

그렇다면 지금부터 Querydsl의 사용법에 대해서 알아보자.

<br>

# Querydsl 관련 설정
> 예제는 2021년 7월 기준으로 다시 작성되었으며 전체 코드는 글 하단의 Github 저장소 링크를 참고해 주세요.

예제에서 사용된 프레임워크/라이브러리의 버전은 아래와 같다.
- Spring Boot: 2.5.0
- Gradle 7.1.1
- Querydsl: 4.4.0
- Lombok: 1.18.18

## gradle 설정
먼저 다음과 같이 `build.gradle` 파일에 선언한다. 프로젝트 구성에 필요한 일부 의존성은 생략하고 Querydsl 설정에 필요한 의존성만 나열하였다.

```groovy
// ... 생략

dependencies {
    // ... 생략
    
    implementation "com.querydsl:querydsl-core:${queryDslVersion}"
    implementation "com.querydsl:querydsl-jpa:${queryDslVersion}"

    /*
     * `NoClassDefFoundError` 관련 대응으로 필요하다.
     * 참고로 javax -> jakarta 로 이름이 변경되었다.
     */
    annotationProcessor(
            "jakarta.persistence:jakarta.persistence-api",
            "jakarta.annotation:jakarta.annotation-api",
            "com.querydsl:querydsl-apt:${queryDslVersion}:jpa")
}

sourceSets {
    main {
        java {
            srcDirs = ["$projectDir/src/main/java", "$projectDir/build/generated"]
        }
    }
}

// ... 생략
```

<br>

## Querydsl Config 설정
다음으로 Querydsl을 사용하기 위한 Config 설정을 진행하면 된다. 여기서 등록한 `jpaQueryFactory` 빈을 `Repository`에서 사용하게 된다.  

```java
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.querydsl.jpa.impl.JPAQueryFactory;

@Configuration
public class QuerydslConfig {
	@PersistenceContext
	private EntityManager entityManager;

	@Bean
	public JPAQueryFactory jpaQueryFactory() {
		return new JPAQueryFactory(entityManager);
	}
}
```

<br>

# Querydsl 사용법
Querydsl을 사용하기 위한 설정은 끝났다. 이제 Querydsl을 어떻게 사용하는지 알아보자.

## Entity 클래스 정의
먼저 엔티티(Entity) 클래스를 정의한다. 각각 `article`과 `user` 테이블에 매핑되는 엔티티다.
```java
@Getter
@Entity
@Table(name = "article")
public class Article {
	@Id
	private Integer id;
	@Column(name = "user_id")
	private Integer userId;
	private String title;
}
```

```java
@Getter
@Entity
@Table(name = "user")
public class User {
	@Id
	private Integer id;
	private String name;
	private String level;
}
```

<br>

## Q클래스 생성
Querydsl은 컴파일 단계에서 엔티티를 기반으로 Q클래스 파일들을 생성한다. 이 클래스를 기반으로 쿼리를 작성하게 된다.

Q클래스를 생성하려면 Gradle 옵션을 통해서 소스 코드를 컴파일시키면 된다. 즉, `build` task의 `build` 옵션을 실행하거나 
단순히 Q클래스만 만들 목적이라면 `other` 태스크의 `compileJava`만 실행시키면 된다.

실행 후에는 아래와 같이 빌드 결과물에 Q클래스들이 생긴다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-01-introduction-to-querydsl-1.jpg"
width="400" alt="q class"/>

<br><br>

## Repository 정의
다음으로 실제 쿼리를 작성하고 수행할 `Repository` 레이어들을 만든다. JPA 인터페이스 메서드와 Querydsl 기반으로 사용할 메서드를 모두 사용할 것이다.

먼저 구현할 Querydsl 메서드의 시그니처를 정의한다. `~RepositoryCustom` 이라는 네이밍을 갖는다.   

```java
/**
 * Querydsl로 작성할 쿼리는 이 곳에 시그니처를 선언하고 `~RepositoryImpl`에서 구현한다.
 */
public interface ArticleRepositoryCustom {
	List<Article> findByLevelUsingQuerydsl(String level);
}
```

다음으로 위에서 정의한 시그니처 기반으로 실제 동작을 정의할 구현체다. QuerydslConfig 클래스에서 등록한 `JPAQueryFactory`를 기반으로
쿼리를 작성하고 수행한다. 메서드 네이밍은 임의로 "~UsingQuerydsl"라는 접미사를 붙였지만, 다른 사람들과 진행하는 프로젝트라면 컨벤션에 맞게 정의하자.

```java
/**
 * Querydsl를 이용한 쿼리를 작성한다.
 */
@Repository
@RequiredArgsConstructor
public class ArticleRepositoryImpl implements ArticleRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	public List<Article> findByLevelUsingQuerydsl(String level) {
		// Q클래스를 이용한다.
		QArticle article = QArticle.article;
		QUser user = QUser.user;

		return queryFactory.selectFrom(article)
			.where(
				article.userId.in(
					JPAExpressions
						.select(user.id)
						.from(user)
						.where(user.level.gt(level))
				)
			)
			.fetch();
	}
}
```

위와 같이 커스텀한 Repository은 네이밍 규약을 잘 지켜야 한다. 별도의 설정을 하지 않았다면, `~Impl` 접미사를 붙여야만 스프링이 찾을 수 있다. 
관련해서는 `spring-data`에 포함된 `RepositoryConfigurationSourceSupport` 클래스와 `AnnotationRepositoryConfigurationSource` 클래스의
내부 코드를 보면 알 수 있다.

마지막으로 JPA 인터페이스 메서드도 같이 사용할 수 있도록 인터페이스를 정의한다. 아래 `findByLevel`은 Querydsl과 비교하기 위해 추가했다.

```java
public interface ArticleRepository extends JpaRepository<Article, Integer>, ArticleRepositoryCustom {
	@Query(value = "SELECT * FROM article WHERE user_id IN (SELECT id FROM user WHERE level > :level)", nativeQuery = true)
	List<Article> findByLevel(String level);
}
```

## 테스트
이제 작성한 코드들을 실행하기 위해서 간단한 테스트 코드를 작성해보자. 

```java
@SpringBootTest
class ExampleApplicationTests {

	@Autowired
	private ArticleRepository articleRepository;

	@Test
	void testGetArticleList() {
		// Native Query
		List<Article> articleList = articleRepository.findByLevel("1");

		System.out.println("--------------------------------------------------");
		
		// Querydsl
		List<Article> articleListByQuerydsl = articleRepository.findByLevelUsingQuerydsl("1");

		Assertions.assertEquals(articleList.size(), articleListByQuerydsl.size());
	}
}
```

Querydsl의 쿼리가 잘 만들어지는지 확인하기 위해서 실행된 쿼리를 출력하는 설정도 추가한다.

```bash
spring.jpa.properties.hibernate.show_sql=true # 실행된 쿼리 출력
spring.jpa.properties.hibernate.format_sql=true # 쿼리를 예쁘게 출력
```

테스트 코드를 실행해보자. 아래와 출력되는 쿼리를 통해 두 개의 쿼리가 결과적으로 같음을 알 수 있다.

```bash
Hibernate: 
    SELECT
        id,
        title,
        user_id 
    FROM
        article 
    WHERE
        user_id IN (
            SELECT
                id 
            FROM
                user 
            WHERE
                level > ?
        )
--------------------------------------------------
Hibernate: 
    select
        article0_.id as id1_0_,
        article0_.title as title2_0_,
        article0_.user_id as user_id3_0_ 
    from
        article article0_ 
    where
        article0_.user_id in (
            select
                user1_.id 
            from
                user user1_ 
            where
                user1_.level>?
        )
```

<br>

## 동적 쿼리
Querydsl의 또 다른 장점으로 "동적 쿼리"를 뽑을 수 있다. 아래와 같이 코드 기반으로 메서드를 정의하여 조건식을 만들 수 있다.
전달되는 파라미터가 없어서 `where` 절에 `null`이 들어가는 경우 해당 조건은 생략된다.

```java
public List<Article> searchArticle(String title, Integer userId) {
    return queryFactory.selectFrom(article)
        .where(titleContains(title), userIdEq(userId))
        .fetch();
}

private BooleanExpression titleContains(String title) {
    return StringUtils.isNotBlank(title) ? article.title.contains(title) : null;
}

private BooleanExpression userIdEq(Integer userId) {
    return userId != null ? article.userId.eq(userId) : null;
}
```

<br>

# 마치며
JPA를 사용하다 보면 기본 기능으로 해결되지 않는 경우에는 네이티브 쿼리를 사용하게 된다. 그런데 예제에서 살펴본 것처럼 네이티브 쿼리는
문자열을 이어 붙이기 떄문에 오타가 발생하기 쉽고 가독성이 떨어지는 단점이 있다.

Querydsl을 사용하면 자동 완성과 같은 IDE의 기능을 사용할 수 있고, 컴파일 시점에 타입이나 문법 오류를 확인할 수 있다.
또한 동적 쿼리도 쉽게 사용할 수 있어서 편리하다. 물론 경우에 따라서 적용 필요성이 다를 수 있기 때문에 프로젝트의 특성에 따라서 적절하게 선택하면 될 것 같다.

<br>

# 예제 소스 코드
이번 글에서 사용한 소스 코드는 모두 아래 저장소에 있습니다.
- github 코드 저장소: <a href="https://github.com/madplay/querydsl-example" target="_blank" rel="nofollow">https://github.com/madplay/querydsl-example</a>