---
layout:   post
title:    "JSON Schema: 자바 코드로 Validator 구현"
author:   Kimtaeng
tags: 	  json jsonschema jsonvalidate
description: "JSON 스키마를 검증하는 validator를 자바 코드로 구현해보자."
category: Java
date: "2020-03-14 21:03:09"
comments: true
---

# 앞선 글에서는
지금까지 **JSON 스키마**에 대한 소개와 `JSON`을 검증할 수 있는 스키마 선언 방법, 스키마를 결합하거나 조건부 스키마를 선언하는 방법
그리고 반복적인 스키마에 대한 재사용 방법에 대해서 알아보았다. 이번 글에서는 **JSON 스키마**를 검증할 수 있는 Validator를 자바 코드로 구현하는
방법에 대해서 알아본다.

- <a href="/post/multiple-and-conditional-json-schemas-validation-examples">
이전 글: "JSON Schema: 스키마 결합과 조건부 스키마 그리고 반복적인 스키마의 재사용"</a>

<br><br>

# validator 라이브러리
**JSON 스키마**를 구현한 <a href="https://json-schema.org/implementations.html)" target="_blank" rel="nofollow">라이브러리(링크)</a>
가 꽤 있다. 하지만 자바 진영에서는 `json-schema-validator`가 단순 별(star) 개수가 제일 많다. 따라서, 이번 예제에서는 이 라이브러리를 이용하여
`JSON` 데이터를 검증해 볼 것이다.

- <a href="https://github.com/java-json-tools/json-schema-validator" target="_blank" rel="nofollow">
참고 링크: json-schema-validator(github)</a>

<br><br>

# JSON 스키마 선언
코드에서 사용할 간단한 **JSON 스키마**를 선언해보자. 스키마에 대한 설명은 주석을 참고하면 된다. (`JSON`의 컨셉은 원래 주석을 사용하지 않지만...)
스키마에 대해 더 자세한 규칙을 알고 싶다면, 이전 글들을 참고하면 된다.

파일명은 `sample_schema.json`으로 지정하고 프로젝트의 `resources` 디렉토리 바로 아래에 두면 된다.

```json
{
  "type": "object", // 가장 최상위 타입은 객체(object)다.
  "properties": { // 속성이 있는데,
    "contents": {
      "type": "array", // `contents` 라는 속성은 배열(array)이다.
      "items": [ // `contents`의 아이템들의 정의는,
        {
          "type": "object", // 객체 타입이며
          "$ref": "#/definitions/photo" // `photo` 정의를 따른다.
        },
        {
          "type": "object", // 객체 타입이며
          "$ref": "#/definitions/photo" // `photo` 정의를 따른다.
        },
        {
          "type": "object", // 객체 타입이며
          "$ref": "#/definitions/text" // `text` 정의를 따른다.
        }
      ]
    }
  },
  "required": [ // `contents` 속성은 반드시 필요하다.
    "contents"
  ],
  "definitions": { // 별도로 정의한 타입들. 스키마를 재사용할 수 있는 기능
    "text": { // `text`는
      "type": "object", // 타입은 객체이며
      "properties": {
        "id": { // `id` 라는 문자열 속성을 갖는다.
          "type": "string"
        },
        "type": { // `type` 이라는 문자열 속성을 갖는데, 값은 `text`만 허용한다.
          "type": "string",
          "enum": [ "text" ]
        }
      },
      "required": [ // 필수 속성은 `id` 다.
        "id"
      ]
    },
    "photo": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "type": { // `type` 이라는 문자열 속성을 갖는데,
          "type": "string",
          "enum": [ // 값은 `photo` 또는 `video`만 가능하다.
            "photo", "video"
          ]
        },
        "title": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ]
    }
  }
}
```

<br>

# 코드 작성하기
이번 예제는 메이븐(maven) 프로젝로 진행하여 라이브러리를 다운받아 사용할 것이다. 그렇기 때문에 그래들(gradle) 기반 프로젝트로 진행해도 문제없다.

## Maven 의존성 추가
우선, 라이브러리를 사용하기 위해서 의존성(dependency)을 추가해야 한다. 아래와 같이 `pom.xml`에 선언을 추가한다.
최신 버전은 `2.2.13`이고 1월 9일에 릴리즈되었다.

```xml
<dependency>
    <groupId>com.github.java-json-tools</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>2.2.13</version>
</dependency>
```

<br>

## 스키마 파일을 읽어오는 코드
위에서 선언한 `JSON` 데이터를 검증할 규칙(Rule)인 **JSON 스키마** 파일을 불러오는 코드다. `java.nio` 패키지의 코드를 사용했고,
읽어온 파일 내용을 스트림을 이용하여 문자열로 합쳤다. 관련 예외 처리 부분은 생략한다.

```java
private String getJsonSchemaFromFile() {
    try {
        Path path = Paths.get(ClassLoader.getSystemResource("sample_schema.json").toURI());
        return Files.readAllLines(path).stream().collect(Collectors.joining());
    } catch (IOException | URISyntaxException e) {
        // 관련 예외처리
    }
    return "";
}
```

<br>

## JsonNode 관련 메서드 선언
`json-schema-validator`의 메서드는 대부분 `jackson.databind`의 `JsonNode` 객체를 파라미터로 받아서 실행한다.
따라서 읽어온 `String` 타입의 **JSON 스키마** 파일이나 유효성 검사할 객체를 `JsonNode`로 변환하는 코드가 필요하다.

```java
// mapper는 클래스의 인스턴스 필드로 선언해서 매번 생성하지 않고 재사용한다.
final ObjectMapper mapper = new ObjectMapper();

/**
 * 파라미터로 받은 스키마 문자열을 JsonNode로 변환한다.
 */
private JsonNode convertCardRuleToJsonNode(String cardRule) {
    try {
        return mapper.readTree(cardRule);
    } catch (Exception e) {
        // 관련 예외처리
    }
    return null;
}

/**
 * 파라미터로 받은 객체를 JsonNode로 변환한다.
 */
private JsonNode convertObjToJsonNode(Object object) {
    try {
        return mapper.valueToTree(object);
    } catch (Exception e) {
        // 관련 예외처리
    }
    return null;
}
```

## 클래스 선언
`JSON` 데이터를 파일로 준비할 수도 있겠지만, POJO(Plain Old Java Object)를 선언하고 앞서 선언한 메서드를 이용하여 `JSON` 포맷의 문자열로 변환하여
사용할 것이다. 따라서 아래와 같은 클래스를 선언한다. 위에서 살펴본 **JSON 스키마**의 `text`와 `photo`를 추상화할 수 있는 개념으로 말이다.

```java
class Content {
    private String id;
    private String title;
    private String type;

    public Content(String id, String title, String type) {
        this.id = id;
        this.title = title;
        this.type = type;
    }

    // getter, setter 생략
}
```

그리고 이 클래스를 기반으로 테스트 데이터를 생성하는 메서드를 작성한다.

```java
private HashMap<String, Object> getTestData() {
    List<Content> contents = List.of(
            new Content("1", "제목1", "text"),
            new Content("2", "제목2", "text"),
            new Content("3", "제목3", "text")
    );

    return new HashMap<>() {
        {
            put("contents", contents);
        }
    };
}
```

## validate 코드
이제 `JSON` 데이터가 **JSON 스키마**에 적합한 데이터인지 검증하는 코드를 작성하면 된다.
라이브러리를 사용하는 코드는 생각보다 많지 않다.

```java
public void validate() {
    // 문자열 스키마를 기반으로 JsonNode 생성
    JsonNode schemaNode = convertCardRuleToJsonNode(getJsonSchemaFromFile());

    // 스키마 validator 초기화
    JsonSchemaFactory factory = JsonSchemaFactory.byDefault();

    // 검증 결과가 담긴다.
    ProcessingReport report = null;
    try {
        // 스키마 객체 생성
        JsonSchema schema = factory.getJsonSchema(schemaNode);

        // 테스트 데이터를 JsonNode 타입으로 변환한다.
        JsonNode data = convertObjToJsonNode(getTestData());

        // 검증
        report = schema.validate(data);
    } catch (Exception e) {
        // 관련 예외 처리
    }
}
```
## 검증 결과 확인하기
**JSON 스키마** 유효성 검증(validate)을 한 결과는 `ProcessingReport` 타입의 객체로 반환된다. `isSuccess`라는 인스턴스 메서드로 성공 여부를
확인할 수 있으며, `toString` 메서드를 내부적으로 오버라이딩(overriding) 하고 있기 때문에 인스턴스 자체를 그대로 출력하면 아래와 같이 포맷팅된 문자열로
유효성을 검증한 결과가 출력된다.

```bash
com.github.fge.jsonschema.core.report.ListProcessingReport: failure
--- BEGIN MESSAGES ---
error: instance value ("text") not found in enum (possible values: ["photo","video"])
    level: "error"
    schema: {"loadingURI":"#","pointer":"/definitions/photo/properties/type"}
    instance: {"pointer":"/contents/0/type"}
    domain: "validation"
    keyword: "enum"
    value: "text"
    enum: ["photo","video"]
---  END MESSAGES  ---
```

<br>

# 마치며
지금까지 `json-schema-validator` 라이브러리를 이용하여 **JSON 스키마** 검증을 자바 코드로 구현해보았다. 

사용법은 간단하지만 아쉽게도 **JSON 스키마**의 최신 드래프트(draft)에 대해서 모두 지원되지 않는다. 예를 들면 `enum`처럼 열거형이 아닌 한정된 값인
`const`는 키워드로 인식하지 못한다. 릴리즈 계획이 없나 살펴보니, 아쉽게도 현재로서는 없는 것 같다. 오픈소스 컨트리뷰터를 찾는 중인듯하다.

- <a href="https://github.com/madplay/json-schema-validator">참고 링크: 예제로 사용한 전체 소스 코드(github)</a>