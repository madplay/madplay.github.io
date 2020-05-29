---
layout:   post
title:    "JSON Schema: JSON 스키마란 무엇일까?"
author:   Kimtaeng
tags: 	  json jsonschema
description: "JSON 데이터를 검증할 수 있는 방법이 없을까? XML 스키마인 XSD처럼 JSON 데이터를 검증하는 방법은?"
category: Knowledge
date: "2020-02-19 21:32:51"
comments: true
---

# JSON 스키마(Schema)란?
Key와 Value의 쌍으로 구성된 `JSON` 데이터가 정해진 규칙에 따라 구성되어 있는지 유효성 검사를 할 수 있는 방법이다. `XML` 포맷을 검증할 수 있는
`XSD`와 `DTD`를 떠올리면 된다. 다시 말해 **JSON 스키마**는 `JSON` 형태의 데이터가 정해진 규약에 맞게 구성되어 있는지 검사하는 규칙이다.

예를 들어, 외부 서비스에 `JSON` 데이터 형태의 API를 제공한다고 가정해보자. 데이터를 받는 입장에서 또는 데이터를 주는 입장에서도 올바른 데이터가
오고 가는지 확인이 필요할 수 있다. 특히나 `JSON` 데이터를 파라미터로 하는 호출이 있다면, 검증 과정이 필요할지 모른다. 

물론 API 애플리케이션의 코드 구현으로 유효성 검사를 할 수 있겠으나, 데이터의 크기가 클수록 검사할 조건들은 너무나도 많아지게 될 것이다.
이러한 까다로운 문제를 `JSON Schema`와 함께 조금 다르게 접근해보자.

- <a href="http://json-schema.org/" target="_blank" rel="nofollow">참조 링크: http://json-schema.org</a>

<br><br>

# JSON 스키마의 메타데이터 키워드
우선 스키마의 기본 정보를 나타내는 메타데이터(metadata) 키워드를 살펴보자. 유효성 검사에는 사용되지 않지만 `JSON Schema`에 대한 설명과 동작 방식에 대한
설명을 추가할 수 있다. 모든 필드가 필수 요소는 아니지만 다른 사용자의 기본적인 이해에 도움이 될 수 있다.

- `title`: 스키마에 대한 이름
- `description`: 스키마에 대한 설명
- `example`: 스키마 검증에 통과하는 예시를 나열한다. 배열 형태다.
- `$comment`: 특정 스키마에 주석을 남길 때 사용한다.

```json
{
    "title": "어떤어떤 스키마",
    "description": "이 스키마는 이렇게 저렇게 하는 용도입니다.",
    "example": ["mad", "play"],

    "$comment": "음... 그냥 남겨 봅니다 :)",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "name": {
            "$comment": "음, 이게 과연 좋은 건지 모르겠어요 :(",
            "type": "string",
            "pattern": "^a"
        }
    }
}
```

<br><br>

# JSON 스키마의 검증 조건 키워드
우선 **JSON 스키마(Schema)**는 대상이 되는 데이터와 동일하게 `JSON` 포맷으로 되어 있다. 그리고 데이터의 유효성을 검사하기 위한 여러 가지 검증용
키워드가 있다. 이 키워드들을 조합해서 `JSON` 데이터를 검증하는데 사용한다. 대표적인 키워드를 살펴보면 아래와 같다.

- `type`: 필드의 유효한 데이터 타입을 명시 
- `required`: 반드시 포함되어야 하는 속성을 배열 형태로 표현 
- `properties`: 객체(object) 타입인 경우 속성을 표기
- `minLength`: 문자열의 최소 길이
- `maxLength`: 문자열의 최대 길이
- `minItems`: 배열 요소의 최소 개수
- `maxItems`: 배열 요소의 최대 개수
- `pattern`: 정규 표현식과 일치한 문자열 

<br>

## JSON 스키마의 데이터 타입
**JSON 스키마**는 앞서 언급한 것처럼 `JSON` 포맷이다. 모든 `JSON` 타입과 숫자(number) 유형의 하위 타입인 정수(integer) 타입을 추가로 지원한다.

데이터 타입 | 설명 | 예시
|:--:|:--|:--
`number` | 모든 숫자 형태 | `-2`, `1.2`, `4.32`
`integer` | 정수 형태 | `0`, `-123`, `123`
`string` | 문자열/텍스트 형태로 표현 | `"kim"`, `"taeng"`
`array` | 연속된 요소들 | `[ "a", 2, null ]`
`object` | 키/값 형태로 구성된 문자열 | `{ "nickname": "madplay" }`
`boolean` | 문자열의 최소 길이 | `true` 또는 `false`
`null` | 값이 없는 경우 | `null`

<br>

# 이어서
이번 글에서는 **JSON 스키마**가 무엇인지, 기본적인 특성에 대해서 알아보았다.
이어지는 글에서는 앞서 살펴본 검증 키워드를 기반으로 `JSON` 데이터를 검증하는 스키마를 선언 방법에 대해서 알아본다.

- <a href="/post/json-schema-validation-examples">다음 글: "JSON Schema: 기본적인 스키마 선언과 검증 방법"</a>