---
layout: post
title: "자바 record는 무엇이고 언제 써야 할까?"
author: madplay
tags: java record dto immutable pattern-matching
description: "자바 record의 동작 원리와 제약사항을 코드로 확인하고, DTO나 값 객체로 쓸 때의 판단 기준을 정리한다."
category: Java/Kotlin
date: "2024-06-08 07:42:14"
comments: true
---

# 매번 반복하는 boilerplate, 정말 필요한가

DTO 하나 만들려면 필드 선언, 생성자, getter, `equals`, `hashCode`, `toString`을 전부 작성해야 한다.
클래스 하나에 수십 줄이 잡히고, 필드가 하나 늘어날 때마다 같은 작업을 반복한다.

기사 요약 정보를 담는 간단한 클래스를 예로 들어보자.

```java
public class ArticleSummary {
    private final String articleId;
    private final int viewCount;
    private final LocalDateTime publishedAt;

    public ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
        this.articleId = articleId;
        this.viewCount = viewCount;
        this.publishedAt = publishedAt;
    }

    public String getArticleId() {
        return articleId;
    }

    public int getViewCount() {
        return viewCount;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ArticleSummary)) return false;
        ArticleSummary that = (ArticleSummary) o;
        return viewCount == that.viewCount
                && Objects.equals(articleId, that.articleId)
                && Objects.equals(publishedAt, that.publishedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(articleId, viewCount, publishedAt);
    }

    @Override
    public String toString() {
        return "ArticleSummary[articleId=" + articleId
                + ", viewCount=" + viewCount
                + ", publishedAt=" + publishedAt + "]";
    }
}
```

필드 세 개짜리 클래스인데 벌써 40줄이 넘는다. Lombok의 `@Value`나 IDE 자동 생성으로 줄일 수는 있지만, 결국 언어 밖에서 우회하는 방식이다.
Java 16부터 이 문제를 언어 차원에서 해결하는 `record`가 정식 기능으로 들어왔다.

> record는 <a href="/post/what-is-new-in-java-14" target="_blank">Java 14(JEP 359)에서 preview로 등장</a>했고,
> Java 16(JEP 395)에서 정식 기능이 됐다.

<br>

# record의 기본 문법

## 자동으로 만들어지는 것들

위의 `ArticleSummary`를 record로 바꾸면 이렇게 된다.

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
}
```

이 한 줄로 컴파일러가 다음을 자동 생성한다.

- `private final` 필드 세 개
- 모든 필드를 받는 canonical constructor
- 각 필드와 이름이 같은 accessor 메서드 — `articleId()`, `viewCount()`, `publishedAt()`
- 필드 값 기반의 `equals`와 `hashCode`
- 필드 값을 보여주는 `toString`

getter 이름이 `getArticleId()`가 아니라 `articleId()`라는 점이 기존 자바빈 규약과 다르다.

```java
ArticleSummary article = new ArticleSummary("ART-001", 1024, LocalDateTime.now());

// accessor
String id = article.articleId();
int views = article.viewCount();

// equals: 같은 필드 값이면 같은 객체로 판단
ArticleSummary another = new ArticleSummary("ART-001", 1024, article.publishedAt());
assert article.equals(another);

// toString
System.out.println(article);
// ArticleSummary[articleId=ART-001, viewCount=1024, publishedAt=2024-06-08T14:00]
```

## 일반 클래스와 비교

앞에서 본 일반 클래스 `ArticleSummary`가 약 45줄이었다. record는 중괄호 포함 2줄이다.
필드 개수가 늘어날수록 차이는 더 벌어진다.
코드가 줄어든다는 것보다 중요한 점은, "이 클래스는 데이터를 담는 것이 전부"라는 의도가 선언 자체에 드러난다는 것이다.

<br>

# record의 제약사항

## 상속할 수 없다

모든 record는 암묵적으로 `java.lang.Record`를 상속한다. 자바는 다중 상속을 허용하지 않으므로 다른 클래스를 `extends`할 수 없다.
다만 인터페이스 구현은 자유롭다.

```java
public interface Printable {
    String toPrintFormat();
}

public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt)
        implements Printable {

    @Override
    public String toPrintFormat() {
        return articleId + " / 조회수 " + viewCount;
    }
}
```

## 필드를 바꿀 수 없다

record의 모든 필드는 `final`이다. setter가 없고, 값을 바꿔야 한다면 새 인스턴스를 만들어야 한다.

```java
// 조회수를 변경하려면 새 record를 생성
ArticleSummary updated = new ArticleSummary(article.articleId(), 2048, article.publishedAt());
```

이 특성 덕분에 record는 태생적으로 <a href="/post/minimize-mutability" target="_blank">불변 객체</a>다.
멀티스레드 환경에서 동기화 없이 안전하게 공유할 수 있고, 방어적 복사도 필요 없다.
다만 컴포넌트 자체가 가변 객체(`List`, `Map` 등)라면 참조를 통한 변경은 막지 못하므로, 진정한 불변을 원하면 컴포넌트 타입도 불변이어야 한다.

## 추가 인스턴스 필드를 선언할 수 없다

record 본문에 인스턴스 필드를 추가로 선언할 수 없다. 모든 상태는 헤더의 컴포넌트로만 정의된다.
`static` 필드와 `static` 메서드, 인스턴스 메서드는 자유롭게 추가할 수 있다.

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    // static 필드는 가능
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // 인스턴스 메서드도 가능
    public String formattedDate() {
        return publishedAt.format(DATE_FMT);
    }
}
```

<br>

# compact constructor로 유효성을 검증한다

record에는 compact constructor라는 특별한 문법이 있다. 파라미터 목록과 `this.field = param` 할당을 생략하고,
검증이나 정규화 로직만 작성하면 된다. 할당은 컴파일러가 compact constructor 끝에서 자동으로 처리한다.

```java
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    public ArticleSummary {
        if (articleId == null || articleId.isBlank()) {
            throw new IllegalArgumentException("articleId는 비어 있을 수 없다");
        }
        if (viewCount < 0) {
            throw new IllegalArgumentException("조회수는 0 이상이어야 한다: " + viewCount);
        }
        // 값 정규화: 앞뒤 공백 제거
        articleId = articleId.strip();
    }
}
```

compact constructor 안에서 파라미터에 새 값을 할당하면 정규화된 값이 필드에 저장된다.
canonical constructor를 직접 작성할 수도 있지만, 단순 검증이나 정규화라면 compact constructor 쪽이 간결하다.

```java
// canonical constructor를 직접 작성하는 경우
public record ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {

    public ArticleSummary(String articleId, int viewCount, LocalDateTime publishedAt) {
        if (articleId == null || articleId.isBlank()) {
            throw new IllegalArgumentException("articleId는 비어 있을 수 없다");
        }
        this.articleId = articleId.strip();
        this.viewCount = viewCount;
        this.publishedAt = publishedAt;
    }
}
```

compact constructor는 `this.field = param` 할당이 없으므로 코드가 짧고, 검증 로직에만 집중할 수 있다.

<br>

# sealed class와 record를 조합하면

record 하나만으로는 표현력에 한계가 있다. 뉴스 도메인에서 발생하는 이벤트를 생각해보자.
기사가 발행되고, 보관 처리되고, 삭제되는 세 가지 상황은 각각 다른 데이터를 담지만, 모두 "기사 이벤트"라는 공통 타입에 속한다.

`sealed interface`로 하위 타입을 고정하고, 각 이벤트를 record로 선언하면 간결하면서도 타입 안전한 구조가 만들어진다.

```java
public sealed interface ArticleEvent
        permits ArticleEvent.Published, ArticleEvent.Archived, ArticleEvent.Deleted {

    String articleId();

    record Published(String articleId, String title, LocalDateTime publishedAt)
            implements ArticleEvent {
    }

    record Archived(String articleId, String reason, LocalDateTime archivedAt)
            implements ArticleEvent {
    }

    record Deleted(String articleId, String deletedBy, LocalDateTime deletedAt)
            implements ArticleEvent {
    }
}
```

Java 21의 switch 패턴 매칭과 함께 쓰면, 새 이벤트 타입이 추가될 때 처리 누락을 컴파일 오류로 잡아준다.

```java
String describe(ArticleEvent event) {
    return switch (event) {
        case ArticleEvent.Published p ->
                "기사 발행: " + p.articleId() + ", " + p.title();
        case ArticleEvent.Archived a ->
                "기사 보관: " + a.articleId() + ", 사유: " + a.reason();
        case ArticleEvent.Deleted d ->
                "기사 삭제: " + d.articleId() + ", 삭제자: " + d.deletedBy();
    };
}
```

`sealed`이므로 `default` 분기가 필요 없다. 나중에 `Restored` 같은 이벤트가 추가되면 `permits`와 `switch`를 모두 수정해야 하고,
하나라도 빠뜨리면 컴파일러가 알려준다. <a href="/post/java-when-to-use-sealed-abstract-interface" target="_blank">sealed class의 선택 기준</a>이
궁금하다면 별도 글에서 더 자세히 다뤘다.

<br>

# 실무에서 record를 쓰는 자리

## DTO와 API 응답 매핑

record는 Spring의 `@RequestBody`, `@ResponseBody`와 잘 맞는다. Jackson 2.12부터 record를 기본 지원하므로 별도 설정 없이 JSON 직렬화/역직렬화가 된다.

```java
public record ArticleResponse(String articleId, String title, String status) {
}

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @GetMapping("/{articleId}")
    public ArticleResponse getArticle(@PathVariable String articleId) {
        // 서비스에서 조회한 결과를 record로 반환
        return new ArticleResponse(articleId, "Kafka Connect 입문", "PUBLISHED");
    }

    @PostMapping
    public ArticleResponse createArticle(@RequestBody ArticleRequest request) {
        // request도 record로 받을 수 있다
        return new ArticleResponse(request.articleId(), request.title(), "DRAFT");
    }
}

public record ArticleRequest(String articleId, String title) {
}
```

record는 불변이고 필드가 명시적이라서 API 계약을 코드에서 바로 확인할 수 있다.
필드를 추가하거나 빼면 생성자 호출부가 바로 깨지기 때문에, 변경 영향을 컴파일 단계에서 파악할 수 있다는 점도 실무에서 유용하다.

## 불변 값 객체

태그(Tag)처럼 "값 자체가 의미"인 객체에도 record가 잘 어울린다.
두 태그가 같은지 판단할 때 참조가 아니라 필드 값으로 비교하는 것이 자연스럽고, record의 자동 `equals`가 이를 보장한다.

```java
public record Tag(String name, String slug) {

    public Tag {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("slug는 필수다");
        }
    }
}
```

<br>

# record가 맞지 않는 경우

## JPA Entity

JPA 엔티티에는 record를 사용할 수 없다. JPA 명세가 요구하는 조건과 record의 특성이 충돌한다.

- **기본 생성자:** JPA는 `no-arg constructor`가 필요하지만, record에는 기본 생성자가 없다.
- **프록시 상속:** 지연 로딩을 위해 엔티티 클래스를 상속한 프록시를 만드는데, record는 `final`이라 상속할 수 없다.
- **mutable setter:** 필드 변경이 필요한 더티 체킹 메커니즘과 record의 불변 필드가 맞지 않는다.

다만 JPA와 아예 못 쓰는 것은 아니다. JPQL이나 네이티브 쿼리의 **프로젝션 DTO**로는 활용할 수 있다.

```java
// 프로젝션 DTO로 record 사용
public record ArticleSummaryDto(String articleId, int viewCount) {
}

// JPQL에서 DTO 프로젝션
@Query("SELECT new com.example.ArticleSummaryDto(a.articleId, a.viewCount) FROM Article a WHERE a.status = :status")
List<ArticleSummaryDto> findSummariesByStatus(@Param("status") String status);
```

## mutable state가 필요한 경우

빌더 패턴으로 객체를 단계적으로 조립하거나, 도메인 객체의 상태가 비즈니스 흐름에 따라 변해야 하는 경우에는 record가 맞지 않는다.
기사 엔티티의 상태를 `DRAFT` → `PUBLISHED` → `ARCHIVED`로 바꿔야 한다면,
매번 새 인스턴스를 만드는 방식도 가능하지만, 상태 전이가 잦은 도메인 객체라면 일반 클래스 쪽이 다루기 편한 경우가 많다.

<br>

# 정리하며

record를 쓸지 말지 고민될 때 한 가지 질문을 던져보면 된다. **"이 클래스는 데이터를 운반하는 것이 전부인가?"**

그렇다면 record가 적합하다. 생성자, getter, `equals`, `hashCode`, `toString`을 직접 작성하거나 Lombok에 맡기는 대신
언어가 제공하는 간결한 선언으로 의도를 명확히 드러낼 수 있다. 반대로 상태를 바꿔야 하거나, 상속 계층이 필요하거나, JPA 엔티티처럼
프레임워크의 제약이 있다면 일반 클래스를 쓰는 편이 맞다고 생각한다.
