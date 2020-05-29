---
layout:   post
title:    "JSON Schema: 기본적인 스키마 선언과 검증 방법"
author:   Kimtaeng
tags: 	  json jsonschema jsonvalidate
description: "JSON 스키마를 이용하여 JSON 데이터가 올바른 형태인지 검증해보자. JSON 스키마를 이용한 기본적인 검증 방법"
category: Knowledge
date: "2020-02-27 01:22:19"
comments: true
---

# 앞선 글에서는
**JSON 스키마**가 무엇인지에 대해서 알아보았다. 이번 글에서는 `JSON` 데이터를 검증하는 스키마를 선언하여 검증하는 방법에 대해서 알아본다.

- <a href="/post/understanding-json-schema">이전 글: "JSON Schema: JSON 스키마란 무엇일까?"</a>

<br><br>

# 숫자를 검증하는 방법
## 숫자 타입 검증
`number`을 `type` 값으로 입력하면, 해당 데이터가 숫자인지 검사할 수 있다.
```json
{
    "type": "number"
}
```

## 정수(integer) 타입 검증
`integer`를 `type` 값으로 입력하면 해당 값이 정수인지 검사한다.
```json
{
  "type": "integer"
}
```
0과 음수 값은 허용되지만 12.34 같은 실수형과 "123" 같은 문자열 표기는 허용되지 않는다.

## 값의 범위(range) 검증
- `minimum`, `maximum`: 숫자의 최솟값, 최댓값
- `exclusiveMinimum`, `exclusiveMaximum`
  - 해당 속성이 `true` 이면, `minimum`으로 명시된 값을 포함하고 최소/최대값을 검사한다.
  - 해당 속성이 `false` 이면 `minimum`으로 명시된 값을 포함하지 않고 최소/최대값을 검사한다.

아래는 0 보다 크고, 255보다 작은 숫자만 허용(255는 포함하지 않는다)하는 예제다.
```json
{
    "type": "number",
    "minimum": 1,
    "maximum": 255,
    "exclusiveMaximum": true
}
```

## 배수(multiples) 검증
`multipleOf` 키워드를 이용하면 해당 숫자의 배수인지 아닌지 판단할 수 있다.
아래 예시는 0, 5, 10, 15와 같은 5의 배수인지를 검사하는 규칙이다.

```json
{
    "type": "number",
    "multipleOf": 5
}
```

<br><br>

# 문자열을 검증하는 방법
## 문자열 타입 검사
기본적으로 문자열 여부를 검사하려면 `type` 속성값을 `string`으로 입력하면 된다.
```json
{
    "type": "string"
}
```

## 문자열 길이 검증
`minLength`와 `maxLength`를 이용하여 문자열의 길이를 검사할 수 있다.

```json
{
    "type": "string",
    "minLength": 3,
    "maxLength": 15
}
```

## 정규 표현식 검증
`pattern` 키워드를 이용하면 문자열 데이터가 명시한 정규 표현식에 일치하는지 검사할 수 있다.
아래 예제는 해당 필드가 "madplay.com" 또는 "kimtaeng.com"인 경우만 허용된다.
```json
{
    "type": "string",
    "pattern": "(madplay|kimtaeng)\\.com"
}
```

## 문자열 포맷 검증
`format` 키워드를 사용하면 해당 문자열이 지정한 포맷을 갖는지 검사할 수 있다.
```json
{
    "type": "string",
    "format": "date"
}
```

포맷별 예시는 아래와 같다.

- 날짜와 시간
  - `date-time`: 1991-02-04T00:31:00+09:00
  - `time`: 00:31:00+09:00
  - `date`: 1991-02-04
- 이메일
  - `email`: kimtaeng@madplay.com
- 호스트 이름
  - `hostname`: kimtaeng-madplay.com
- IP
  - `ipv4`: 123.123.123.123
  - `ipv6`: 2001:0DB8:0000:0000:0000:0000:1428:57ab

## 미디어 타입 검증
`contentEncoding`과 `contentMediaType` 키워드를 이용하여 미디어 타입(MIME type)에 대한 검증도 할 수 있다.
```json
{
  "type": "string",
  "contentEncoding": "base64",
  "contentMediaType": "application/json"
}
```

위 스키마는 "eyJhIjogMX0=", "bnVsbA=="와 같은 base64 인코딩 문자열은 통과된다. 각각 `{\"a\":1}`와 `"null"`로 디코딩된다.

반면에 "2-3-4"와 같은 base64 인코딩이 아닌 문자열이나, "e2E6IDF9"와 같이 디코딩했을 때(`"{a:1}"`) 정상적인 `JSON` 데이터가 아닌 경우는 제외된다.

<br><br>

# 배열(Array)을 검증하는 방법
## 배열 타입 검사
`type` 키워드를 `array`로 명시하면 해당 필드가 배열 형태인지 검사할 수 있다.
```json
{
    "type": "array"
}
```

## 배열의 요소 검사
`items` 키워드를 이용하면 배열의 요소에 대한 검증을 할 수 있다.
아래 스키마 예제는 배열의 요소가 모두 정수이거나, 비어있는 경우만 허용된다.
```json
{
    "type": "array",
    "items": {
        "type": "integer"
    }
}
```

다음과 같이 배열의 타입이 혼합인 경우도 검증할 수 있다. 첫 번째 요소는 정수형 타입이고, 두 번째와 세 번째 요소는 문자열 타입이다.
다만, 세 번째 요소의 경우 최대 길이가 10을 넘지 않는 문자열이어야 한다.

```json
{
    "type": "array",
    "items": [
        {
            "type": "integer"
        },
        {
            "type": "string"
        },
        {
            "type": "string",
            "maxLength": 10
        }
    ],
    "additionalItems": false
}
```

마지막에 선언된 `additionalItems`의 경우 값이 `false` 인 경우 선언된 요소 외에 다른 요소는 허용되지 않는다.
위의 예시 기준으로는 선언된 3개의 요소만 허용된다.

## 배열 내의 중복 요소 검사
`uniqueItems`를 이용하면 배열에 중복되는 요소가 있는지 검사할 수 있다. 값이 `true`이면 중복값을 허용하지 않게 된다.

```json
{
    "type": "array",
    "uniqueItems": true
}
```

위와 같은 스키마를 가지고 아래의 `JSON` 데이터를 검증하면 실패한다. 동일한 요소가 존재하기 때문이다.

```json
[
  {
    "id": 1,
    "author": "madplay"
  },
  {
    "id": 1,
    "author": "madplay"
  }
]
```

## 배열의 길이 검증
문자열과 마찬가지로 배열의 길이(요소 개수)를 검사할 수 있다.
```json
{
    "type": "array",
    "minItems": 5,
    "maxItems": 10
}
```

<br><br>

# 객체(Object)를 검증하는 방법
## 객체 타입 검증
타입을 검사하는 `type` 키워드에 `object` 값을 주면 객체 여부를 검사할 수 있다.
```json
{
    "type": "object"
}
```

## 속성 검증
객체의 속성(property)를 검사할 수 있다. 아래는 문자열 타입의 id, title과 정수형 타입의 type 필드를 허용하는 스키마다.

```json
{
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "title": {
            "type": "string"
        },
        "type": {
            "type": "integer"
        }
    },
    "required": ["id", "title"]
}
```

마지막에 선언된 `required`는 필수 속성 값을 표기한 것이다. 객체의 속성 중에서 id와 title이 없는 경우 유효성 검사에 통과하지 못한다.

## 속성 이름 검증
속성의 이름도 검증할 수 있다. 아래는 객체가 갖는 속성의 이름은 반드시 a, b 또는 c로 시작해야 한다.

```json
{
    "type": "object",
    "propertyNames": {
        "pattern": "^[a-c].+"
    }
}
```

## 속성의 의존성 검증
`dependencies` 키워드를 이용하면 속성 간의 의존성을 설정할 수 있다. 

```json
{
    "type": "object",
    "properties": {
        "customerName": {
            "type": "string"
        },
        "creditCardNumber": {
            "type": "string"
        },
        "billingAddress": {
            "type": "string"
        }
    },
    "dependencies": {
        "creditCardNumber": ["billingAddress"]
    }
}
```

위 예제는 `creditCardNumber`라는 필드는 `billingAddress`에 의존한다는 설정이다. 즉, `billingAddress` 필드 없이 단독으로
`creditCardNumber` 필드만 있으면 허용되지 않는다.

즉, 아래와 같은 경우는 허용되지 않는다.

```json
{
    "customerName": "kimtaeng",
    "creditCardNumber": "12341234"
}
```

아예 둘 다 없는 경우는 가능하다. 아래와 같이 의존성이 있는 속성이 모두 없는 것은 허용된다.

```json
{
    "customerName": "kimtaeng"
}
```

## 스키마 의존성 검증
위에서 살펴본 속성 의존성 검증과 비슷하지만, `properties`를 지정하는 대신에 스키마를 확장해서 제약 조건을 걸 수 있다.
아래는 `title`, `author` 필드를 포함하는 객체를 정의하되, `author` 필드가 있는 경우에는 반드시 `articleNumber` 라는 이름의 정수형 필드가
있어야만 검증에 통과한다.

```json
{
    "type": "object",
    "properties": {
        "title": {
            "type": "string"
        },
        "author": {
            "type": "string"
        }
    },
    "dependencies": {
        "author": {
            "properties": {
                "articleNumber": {
                    "type": "integer"
                }
            },
            "required": [
                "articleNumber"
            ]
        }
    }
}
```

아래와 같은 `JSON` 데이터 구조는 검증을 통과하지 못한다. `author` 필드가 있지만 `articleNumber` 필드가 없기 때문이다.

```json
{
  "title": "MadPlay's MadLife.",
  "author": "kimtaeng"
}
```

아래의 경우도 마찬가지다. `articleNumber` 필드가 있지만, 정수형 타입이 아니기 때문이다.

```json
{
  "title": "MadPlay's MadLife.",
  "author": "kimtaeng",
  "articleNumber": "2"
}
```

반면에 아래와 같이 `author`가 없는 경우는 검증에 통과한다. `articleNumber`의 타입이 정수형이 아니더라도 말이다.
```json
{
  "title": "MadPlay's MadLife.",
  "articleNumber": "2"
}
```

## 속성 개수 검증
객체가 갖고 있는 속성의 최소/최대 개수를 정할 수 있다.
```json
{
    "type": "object",
    "minProperties": 2,
    "maxProperties": 3
}
```

<br>

# 이어서
이번 글에서는 `JSON` 데이터의 유효성 검증을 할 수 있는 **JSON 스키마**의 기본적인 선언 방법에 대해서 알아보았다.
다음 글에서는 조금 더 심화적으로, 스키마의 여러 규칙을 결합하거나 스키마에 조건문을 넣는 방법에 대해서 알아본다.

- <a href="/post/multiple-and-conditional-json-schemas-validation-examples">다음 글: "JSON Schema: 스키마 결합과 조건부 스키마 그리고 반복적인 스키마의 재사용"</a>