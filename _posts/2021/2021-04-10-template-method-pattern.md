---
layout: post
title: "골격은 고정하고 단계만 바꾸는 템플릿 메서드 패턴"
author: madplay
tags: design-pattern java spring
description: "전체 흐름은 고정하고 세부 단계만 바꾸는 것, 템플릿 메서드 패턴의 핵심이다. Spring의 JdbcTemplate도 이 원리 위에 있다."
category: Algorithm/CS
date: "2021-04-10 22:41:08"
comments: true
---

# 반복되는 절차, 달라지는 세부 구현

데이터를 가공하는 작업을 생각해보자.
파일에서 데이터를 읽고, 가공하고, 결과를 출력하는 흐름은 동일한데, 데이터 소스가 CSV일 때와 JSON일 때 읽는 방식만 다르다.
이 차이 때문에 전체 로직을 복사해서 별도 클래스를 만드는 것은 비효율적이다.

템플릿 메서드 패턴은 알고리즘의 골격을 상위 클래스에 정의하고, 달라지는 단계만 서브클래스가 오버라이드하도록 하는 패턴이다.
전체 흐름은 한 곳에서 관리하면서, 세부 구현의 변화에 유연하게 대응할 수 있다.

<br>

# 템플릿 메서드 패턴의 구조

구성 요소는 두 가지다.

- **AbstractClass:** 알고리즘의 골격을 정의하는 템플릿 메서드와, 서브클래스가 구현해야 할 추상 메서드를 포함한다.
- **ConcreteClass:** 추상 메서드를 오버라이드하여 구체적인 동작을 구현한다.

템플릿 메서드는 보통 `final`로 선언하여 서브클래스가 골격 자체를 변경하지 못하게 한다.
변경 가능한 지점은 추상 메서드뿐이므로, 확장의 범위가 명확하게 제한된다.

<br>

# 데이터 프로세서로 구현해보기

데이터 파일을 읽어서 가공한 뒤 출력하는 프로세서를 예시로 구현해보자.

```java
public abstract class DataProcessor {

    // 템플릿 메서드: 전체 흐름을 정의한다
    public final void process() {
        String rawData = readData();
        String processed = transform(rawData);
        output(processed);
    }

    // 서브클래스가 구현해야 할 단계
    protected abstract String readData();
    protected abstract String transform(String data);

    // 공통 단계: 필요하면 오버라이드할 수 있다(훅 메서드)
    protected void output(String data) {
        System.out.println("결과: " + data);
    }
}
```

CSV 데이터를 처리하는 구현체와 JSON 데이터를 처리하는 구현체를 만든다.

```java
class CsvDataProcessor extends DataProcessor {
    @Override
    protected String readData() {
        // CSV 파일을 읽는 로직
        return "name,age\nmadplay,30";
    }

    @Override
    protected String transform(String data) {
        // CSV를 파싱하여 가공
        return data.replace(",", " | ");
    }
}

class JsonDataProcessor extends DataProcessor {
    @Override
    protected String readData() {
        // JSON 파일을 읽는 로직
        return "{\"name\":\"madplay\",\"age\":30}";
    }

    @Override
    protected String transform(String data) {
        // JSON을 파싱하여 가공
        return data.replaceAll("[{}\"]", "");
    }
}
```

사용하는 쪽에서는 구체적인 데이터 형식을 몰라도 된다.

```java
DataProcessor processor = new CsvDataProcessor();
processor.process();
// 결과: name | age
// madplay | 30

processor = new JsonDataProcessor();
processor.process();
// 결과: name:madplay,age:30
```

`process()` 메서드가 `final`이므로 서브클래스에서 전체 흐름을 바꿀 수 없다.
`readData()`와 `transform()`만 오버라이드할 수 있어서, 변경 가능한 범위가 명확하다.

<br>

# 훅 메서드(Hook Method)

위 예시의 `output()` 메서드처럼 기본 구현이 있되, 서브클래스가 필요에 따라 오버라이드할 수 있는 메서드를 훅(hook)이라 한다.
추상 메서드와 달리 오버라이드가 강제가 아니라 선택이다.

```java
public abstract class DataProcessor {

    public final void process() {
        if (validate()) {  // 훅: 기본값은 true
            String rawData = readData();
            String processed = transform(rawData);
            output(processed);
        }
    }

    // 훅 메서드: 기본 구현을 제공하지만 오버라이드 가능
    protected boolean validate() {
        return true;
    }

    // ... 나머지 생략
}
```

훅 메서드를 활용하면 서브클래스가 알고리즘의 특정 지점에 선택적으로 개입할 수 있다.

<br>

# JdbcTemplate은 왜 Template일까

## JdbcTemplate

Spring의 `JdbcTemplate`은 JDBC의 반복적인 절차(커넥션 획득 → Statement 생성 → 쿼리 실행 → 결과 매핑 → 리소스 정리)를 골격으로 감추고,
개발자는 쿼리와 결과 매핑 로직만 제공하면 된다.
엄밀히 말하면 `JdbcTemplate`은 상속이 아닌 콜백(`RowMapper` 등)을 주입받는 방식이라 전략 패턴에 더 가깝다.
하지만 반복되는 절차를 골격으로 고정하고, 변하는 부분만 외부에서 받는다는 설계 의도는 템플릿 메서드 패턴과 맥이 닿아 있다.

```java
List<Article> articles = jdbcTemplate.query(
    "SELECT title, author FROM article WHERE category = ?",
    (rs, rowNum) -> new Article(
        rs.getString("title"),
        rs.getString("author")
    ),
    "Algorithm/CS"
);
```

커넥션 관리와 예외 처리라는 반복적인 보일러플레이트를 템플릿이 대신 처리해준다.

## RestTemplate

`RestTemplate`도 비슷하다. HTTP 요청의 공통 절차(커넥션 설정 → 요청 전송 → 응답 읽기 → 변환)를 골격으로 잡고,
호출하는 쪽에서는 URL과 응답 타입만 지정하면 된다. `JdbcTemplate`과 마찬가지로 콜백 기반이라 순수한 템플릿 메서드 패턴은 아니지만,
반복되는 절차를 골격으로 감추는 설계 철학은 동일하다.

```java
Article article = restTemplate.getForObject(
    "https://api.example.com/articles/{id}",
    Article.class,
    42
);
```

## AbstractController

Spring MVC의 `AbstractController`는 요청 처리의 공통 흐름(요청 검증 → 세션 체크 → 캐시 처리)을 상위 클래스에 두고,
`handleRequestInternal()` 메서드만 서브클래스가 구현하도록 설계되어 있다.
어노테이션 기반 컨트롤러(`@Controller`)가 주류가 된 지금은 직접 쓸 일이 많지 않지만,
Spring 내부 설계에서 템플릿 메서드 패턴이 얼마나 광범위하게 활용되는지 보여주는 예시다.

<br>

# 템플릿 메서드 vs 전략 패턴

템플릿 메서드 패턴과 전략 패턴(Strategy Pattern)은 비슷한 문제를 풀지만 접근 방식이 다르다.

| 기준 | 템플릿 메서드 | 전략 패턴 |
|------|-------------|----------|
| 확장 방식 | 상속 (서브클래스가 단계를 오버라이드) | 구성 (전략 객체를 주입) |
| 골격 변경 | 불가 (final 템플릿 메서드) | 전략 자체를 통째로 교체 가능 |
| 결합도 | 상위-하위 클래스 간 결합 | 인터페이스를 통한 느슨한 결합 |
| 적합한 상황 | 전체 흐름이 고정, 세부 단계만 달라질 때 | 알고리즘 전체를 런타임에 교체할 때 |

전체 흐름이 확실히 고정되어 있고 일부 단계만 달라진다면 템플릿 메서드가 어울린다.
반면 알고리즘 자체를 런타임에 자유롭게 갈아끼워야 한다면 전략 패턴이 더 유연하다.

둘 중 하나가 반드시 우월한 것은 아니다. 상황에 따라 적절한 쪽을 고르면 되고,
실제로 Spring의 `JdbcTemplate`처럼 템플릿 메서드와 전략(콜백)을 함께 쓰는 사례도 있다.

<br>

# 돌아보며

템플릿 메서드 패턴은 알고리즘의 골격을 상위 클래스에 고정하고, 변하는 부분만 서브클래스에 위임하는 구조를 갖는다.
Spring의 `JdbcTemplate`, `RestTemplate`은 순수한 템플릿 메서드 패턴이라기보다 콜백과 결합한 변형에 가깝지만,
반복되는 절차를 골격으로 감추고 변하는 부분만 외부에서 받는다는 핵심 아이디어는 동일하다.

실제로 Spring도 `AbstractController`를 상속하던 방식에서 `@Controller` 어노테이션 방식으로 옮겨갔다.
템플릿 메서드를 도입할 때도 상속 계층이 깊어지기 전에 콜백이나 함수형 인터페이스로 전환할 수 있는지 먼저 따져보는 게 좋지 않을까 싶다.

