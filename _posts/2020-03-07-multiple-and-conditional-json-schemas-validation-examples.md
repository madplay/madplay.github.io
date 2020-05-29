---
layout:   post
title:    "JSON Schema: 스키마 결합과 조건부 스키마 그리고 반복적인 스키마의 재사용"
author:   Kimtaeng
tags: 	  json jsonschema jsonvalidate
description: "JSON 스키마를 결합하거나 JSON 스키마에 조건문을 넣을 수 있을까? 그리고 반복적인 스키마를 재사용할 수 있는 방법은?"
category: Knowledge
date: "2020-03-07 23:54:23"
comments: true
---

# 앞선 글에서는
`JSON` 데이터를 검증할 수 있는 **JSON 스키마**의 기본적인 사용 방법을 알아보았다. 이번 글에서는 조금 더 심화적인 "스키마를 결합하거나, 스키마에 조건을
넣는 방법"에 대해서 알아본다.

- <a href="/post/json-schema-validation-examples">이전 글: "JSON Schema: 기본적인 스키마 선언과 검증 방법"</a>

<br><br>

# JSON을 검증하는 기타 방법들
## boolean 타입 검증
필드의 값이 `true` 또는 `false`인 경우만 허용한다.
```json
{
    "type": "boolean"
}
```

## 열거형(enum) 타입을 이용한 값 검증
`enum` 키워드를 사용하면, 해당 필드가 가질 수 있는 값을 제한할 수 있다. 아래는 해당 필드의 값이 "남자" 또는 "여자" 인 경우만 허용한다.
```json
{
    "type": "string",
    "enum": ["남자", "여자"]
}
```

## 상수값을 이용한 검증
`constant` 키워드를 사용하면, 해당 필드가 가질 수 있는 단일값을 정의할 수 있다.

```json
{
    "properties": {
        "title": {
            "const": "MadPlay's MadLife."
        }
    }
}
```

위의 스키마는 객체의 `title` 속성은 반드시 정해진 문자열을 가져야만 검증에 통과할 수 있다.


## null 검증
`type` 키워드의 값이 `null`인 경우 해당 데이터가 `null`이어야 한다.
```json
{
    "type": "null"
}
```

해당 값은 반드시 `null`이어야 한다. 단순 공백("")도 허용되지 않는다.

<br><br>

# 결합 스키마
`JSON Schema`는 아래와 같은 키워드를 이용하여 결합하여 사용할 수 있다. 배열 형태로 조건을 나열할 수 있으며, JSON 스키마를 한 번에 검사할 수 있다.

- `allOf`: 모든 스키마 검증을 통과해야 한다.
- `anyOf`: 하나 이상의 스키마 검증을 통과해야 한다.
- `oneOf`: 오직 하나의 스키마 검증을 통과해야 한다.

## allof: 모든 스키마 검증
아래는 길이가 최대 5글자를 넘지않으며, 문자 'a'로 시작하는 경우만 통과된다. 따라서, "abc", "a12a2" 같은 문자열은 허용된다.
주의할점은 타입에 대한 정의가 없기 때문에 숫자의 경우 그대로 검증을 통과하게 된다.

```json
{
  "allOf": [
    {
      "maxLength": 5
    },
    {
      "pattern": "^a"
    }
  ]
}
```

## anyOf: 하나 이상의 스키마
아래는 객체의 속성값 중에서 `id` 라는 필드는 문자열 또는 숫자인 경우만 검증에 통과하도록 한다.
따라서, `id` 필드가 `null`이거나 `boolean` 형태면 검증에 실패한다.

```json
{
  "properties": {
    "id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        }
      ]
    }
  }
}
```

## oneOf: 오직 하나의 스키마
나열된 조건 중에서 오직 하나의 조건만을 통과해야 한다. 아래의 스키마 조건은 객체의 `id`라는 속성값이 "abc"인 경우는 통과되지 않는다.
최소 길이 조건과 문자 'a'로 시작하는 조건을 모두 충족하게 되기 때문이다.

```json
{
  "properties": {
    "id": {
      "oneOf": [
        {
          "minLength": 2
        },
        {
          "pattern": "^a"
        }
      ]
    }
  }
}
```

<br><br>

# 조건 스키마
또한 `not`, `if-then-else` 키워드를 사용하여 조건을 걸 수도 있다.

## not
앞서 살펴본 검증 조건과 다르게 `not`을 사용하면 `JSON Schema`를 통해 검증되지 않은 데이터만을 찾을 수 있다.
아래 스키마 조건은 모든 문자열을 검증에 실패하게 만드는 조건이다.

```json
{
    "not": {
      "type": "string"
    }
}
```

이런 경우는 없겠으나, 이 조건은 주의해서 사용해야 한다. 특히 아래와 같은 스키마 룰을 만들게 되면 절대 통과할 수는 규칙이 만들어진다.
필드의 데이터 타입은 문자열이나, 모든 문자열을 허용하지 않게 만드는 조건이다.

```json
{
    "type": "string",
    "not": {
      "type": "string"
    }
}
```

## if-then-else
`if`, `then` 그리고 `else`를 사용하여 조건을 걸 수 있다. 이 키워드는 아래와 같은 규칙으로 수행된다.

- `if` 조건이 충족하게 되면, `then`을 실행한다.
- `if` 조건이 충족되지 않으면, `else`를 실행한다.

아래 스키마는 데이터 타입이 문자열이면, 최소 3글자 이상이고 문자 'm'로 시작해야 한다.
반면에 데이터 타입이 문자열이 아닌 경우 값은 0이어야 한다.

```json
{
  "if": {
    "type": "string"
  },
  "then": {
    "minLength": 3,
    "pattern": "^m"
  },
  "else": {
    "const": 0
  }
}
```

위 스키마 조건을 여러 데이터로 검증해보면 아래와 같은 결과를 볼 수 있다.

- `"madplay"`: 통과, 문자열이면서 최소 3글자 이상이며 문자 'm'으로 시작한다.
- `0`: 통과, 문자열은 아니지만 값이 0이다.
- `0.1.1`: 실패, 유효하지 않은 숫자
- `["mad"]`: 실패, 문자열도 아니며 0도 아니다.

<br><br>

# 스키마 재사용성 높이기
## 스키마 참조
`$id` 키워드는 **JSON 스키마**의 고유한 값을 부여하는 특성이다. 아래와 같이 두 가지 목적을 가지고 있다.

첫 번째는 스키마의 고유한 식별자를 선언하는 용도인데, 아래와 같이 스키마 최상단에는 대부분 아래와 같이 스키마를 다운로드 위치를 작성한다.

```json
{
    "$id": "http://foo.bar/custom/email-schema.json",

    "type": "string",
    "format": "email",
    "pattern": "@madplay\\.+"
}
```

두 번째는 `$ref` 키워드로 참조하는 기본 URI 선언하는 것이다. 예를 들어보면 아래와 같다.

```json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
        },
        "email": {
            "$ref": "http://foo.bar/custom/email-schema.json"
        }
    }
}
```

`email` 필드에 대한 스키마 조건을 참조해서 사용한 것이다. `$ref`를 사용하지 않았다면, 아래와 같이 직접 검증 조건이 포함 됐을 것이다.

```json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
        },
        "email": {
            "type": "string",
            "format": "email",
            "pattern": "@madplay\\.+"
        }
    }
}
```

## 공용 스키마 정의
`definitions` 키워드는 `$ref`와 함께 사용하여 유효성 검사를 재사용할 수 있도록 하는 목적을 갖고 있다.
아래는 텍스트형 콘텐츠와 포토형 콘텐츠의 스키마를 `definitions` 키워드로 정의하여 재사용하는 예제다.

> 스크롤이 너무 길어져서 줄내림을 지웠습니다.

```json
{
   "type":"object",
   "properties":{
      "textContents":{
         "type":"array",
         "items":[{ "$ref":"#/definitions/textContents" }]
      },
      "paperContents":{
         "type":"array",
         "items":[{ "$ref":"#/definitions/textContents" }]
      },
      "photoContents":{
         "type":"array",
         "items":[{ "$ref":"#/definitions/photoContent" }]
      }
   },
   "definitions":{
      "textContents":{
         "type":"object",
         "properties":{
            "id":{ "type":"string" },
            "type":{ "type":"string", "const":"text" }
         }
      },
      "photoContent":{
         "type":"object",
         "properties":{
            "id":{ "type":"string" },
            "type":{ "type":"string", "enum":[ "photo1", "photo2" ]},
            "imageUrl":{ "type":"string" }
         },
         "required":[ "imageUrl" ]
      }
   }
}
```

<br>

# 이어서
이번 글에서는 조금 더 복합적인 스키마를 선언하거나 스키마를 재사용할 수 있는 방법에 대해서 알아보았다.
다음 글에서는 **JSON 스키마**를 자바(Java) 코드로 구현하여 사용하는 방법에 대해서 알아본다.

- <a href="/post/how-to-validate-json-schema-in-java">다음 글: "JSON Schema: 자바 코드로 Validator 구현"</a>