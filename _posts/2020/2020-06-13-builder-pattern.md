---
layout: post
title: "매개변수가 많아질 때, 빌더 패턴"
author: madplay
tags: design-pattern java
description: "생성자에 매개변수가 많아질수록 코드는 읽기 어려워진다. 빌더 패턴이 이 문제를 어떻게 풀어낼까?"
category: Algorithm/CS
date: "2020-06-13 08:27:15"
comments: true
---

# 생성자가 길어질 때 생기는 문제

매개변수가 4개, 5개로 늘어난 생성자를 본 적이 있을 것이다.
어떤 값이 어떤 필드에 매핑되는지 읽는 것만으로도 피곤해지고, 매개변수 순서를 잘못 넣어도 컴파일 타임에 잡히지 않는 경우가 생긴다.

```java
// 어떤 값이 어떤 필드인지 호출만 보고 파악하기 어렵다
Article article = new Article("디자인 패턴", "madplay", "Algorithm/CS",
    "빌더 패턴을 다룬다", true, LocalDateTime.now());
```

이를 해결하기 위한 전통적인 방법으로 텔레스코핑 생성자 패턴이 있다.
매개변수 조합별로 생성자를 오버로딩하는 방식인데, 매개변수가 늘어날수록 생성자 수가 함께 늘어나서 관리가 어려워진다.

자바빈즈(JavaBeans) 패턴처럼 setter를 쓰는 방법도 있지만,
객체가 완전히 생성되기 전까지 일관성이 깨질 수 있고, 불변 객체를 만들 수 없다는 단점이 있다.

빌더 패턴은 이 두 가지 문제를 동시에 해결한다. 메서드 체이닝으로 가독성을 확보하면서도, `build()` 호출 시점에 불변 객체를 생성할 수 있다.

<br>

# 빌더 패턴의 구조

빌더 패턴(Builder Pattern)은 복잡한 객체의 생성 과정을 단계별로 분리하여, 같은 생성 절차에서 서로 다른 표현의 객체를 만들 수 있게 하는 패턴이다.

실무에서 자주 쓰이는 형태는 Effective Java에서 소개된 방식이다.
대상 클래스 안에 정적 내부 클래스(static inner class)로 Builder를 정의하고, 메서드 체이닝으로 필드를 설정한 뒤 `build()`로 객체를 생성한다.

<br>

# Article 객체로 직접 만들어보기

블로그 글(Article)을 표현하는 객체를 빌더 패턴으로 만들어보자.

```java
public class Article {
    private final String title;
    private final String author;
    private final String category;
    private final String description;
    private final boolean published;

    private Article(Builder builder) {
        this.title = builder.title;
        this.author = builder.author;
        this.category = builder.category;
        this.description = builder.description;
        this.published = builder.published;
    }

    public static class Builder {
        // 필수 매개변수
        private final String title;
        private final String author;

        // 선택 매개변수 (기본값 설정)
        private String category = "";
        private String description = "";
        private boolean published = false;

        public Builder(String title, String author) {
            this.title = title;
            this.author = author;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder published(boolean published) {
            this.published = published;
            return this;
        }

        public Article build() {
            if (title == null || title.isBlank()) {
                throw new IllegalStateException("title은 필수입니다.");
            }
            return new Article(this);
        }
    }
}
```

사용하는 쪽에서는 어떤 필드에 어떤 값을 넣는지 명확하게 드러난다.

```java
Article article = new Article.Builder("디자인 패턴", "madplay")
    .category("Algorithm/CS")
    .description("빌더 패턴을 다룬다")
    .published(true)
    .build();
```

Article의 생성자가 `private`이므로 Builder를 거치지 않고는 객체를 만들 수 없다.
필드가 모두 `final`이라 한번 생성된 Article은 변경할 수 없는 불변 객체가 된다.

<br>

# 이미 쓰고 있는 빌더들

## StringBuilder

가장 익숙한 예시는 `StringBuilder`다.
`append()` 메서드가 자기 자신을 반환하면서 체이닝을 가능하게 한다.

```java
String result = new StringBuilder()
    .append("Factory")
    .append(" Method")
    .append(" Pattern")
    .toString();
```

엄밀히 말하면 GoF 빌더 패턴의 정의와는 차이가 있지만, 단계적으로 객체를 구성한다는 본질은 동일하다.

## Stream.Builder

Java 8에서 도입된 `Stream.Builder`도 같은 원리를 따른다.

```java
Stream<String> stream = Stream.<String>builder()
    .add("singleton")
    .add("strategy")
    .add("observer")
    .build();
```

<br>

# URI 조립부터 응답 구성까지

## UriComponentsBuilder

Spring에서 URI를 조립할 때 자주 쓰는 `UriComponentsBuilder`가 빌더 패턴의 대표적인 활용 사례다.

```java
String uri = UriComponentsBuilder.fromUriString("https://api.example.com")
    .path("/articles")
    .queryParam("category", "design-pattern")
    .queryParam("page", 1)
    .build()
    .toUriString();
// https://api.example.com/articles?category=design-pattern&page=1
```

쿼리 파라미터 인코딩, 경로 변수 치환 등의 복잡한 로직을 빌더 내부에 감추고 있어서,
호출하는 쪽에서는 조립 순서만 신경 쓰면 된다.

## ResponseEntity.BodyBuilder

`ResponseEntity`를 만들 때도 빌더 패턴이 활용된다.

```java
return ResponseEntity.ok()
    .header("X-Custom-Header", "value")
    .body(articleList);
```

상태 코드, 헤더, 바디를 단계적으로 설정할 수 있어서 응답 구성이 명확해진다.

<br>

# Lombok @Builder의 편의성과 한계

Lombok의 `@Builder` 어노테이션을 붙이면 빌더 코드를 자동으로 생성해준다.
보일러플레이트를 줄여주므로 실무에서 널리 쓰이고 있다.

```java
@Builder
public class Article {
    private String title;
    private String author;
    private String category;
}
```

다만 몇 가지 한계가 있다.

- **필수 매개변수를 강제할 수 없다.** Lombok의 `@Builder`는 모든 필드를 선택적으로 처리한다. `title`이 반드시 있어야 하는 경우에도 `title` 없이 `build()`를 호출할 수 있어서, 런타임에 가서야 문제를 발견하게 된다.
- **빌드 시점의 유효성 검증이 빠져 있다.** 직접 Builder를 구현하면 `build()` 메서드에서 필드 간 관계를 검증할 수 있지만, Lombok이 생성하는 `build()`에는 이런 로직을 끼워 넣기 어렵다.
- **상속 구조에서 제약이 있다.** 부모 클래스의 필드를 자식 Builder에서 설정하려면 `@SuperBuilder`를 써야 하는데, 모든 상황에서 매끄럽게 동작하지는 않는다.

단순한 DTO나 설정 객체라면 `@Builder`로 충분하다.
하지만 필수 필드 강제나 빌드 시점 검증이 필요하다면 직접 Builder를 구현하는 편이 안전하다고 생각한다.

<br>

# 마치며

빌더 패턴은 매개변수가 많은 객체를 읽기 쉽고 안전하게 생성하는 데 집중한다.
JDK의 `StringBuilder`, Spring의 `UriComponentsBuilder`처럼 이미 익숙하게 사용하고 있는 API에도 빌더 패턴의 원리가 녹아 있다.

생성자에 매개변수가 4개를 넘는 순간, 코드 리뷰에서 빌더 도입이 거론되곤 한다.
당장은 괜찮아 보여도 필드가 하나둘 추가되면 순서 실수가 생기기 마련이다.
빌더를 미리 도입해두면 그 실수를 컴파일 타임이 아닌 가독성 단계에서 먼저 잡아낼 수 있다.

