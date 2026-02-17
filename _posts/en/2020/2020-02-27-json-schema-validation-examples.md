---
layout:   post
title:    "JSON Schema: Basic Schema Definitions and Validation"
author:   madplay
tags: 	  json jsonschema jsonvalidate
description: "Validate JSON data with JSON Schema using fundamental schema declaration and validation patterns."
category: Backend
date: "2020-02-27 01:22:19"
comments: true
lang: en
slug: json-schema-validation-examples
permalink: /en/json-schema-validation-examples/
---

# In the Previous Post
We looked at what **JSON Schema** is. In this post, we cover how to define schemas that validate `JSON` data.

- <a href="/post/understanding-json-schema">Previous post: "JSON Schema: What Is JSON Schema?"</a>

<br><br>

# Validating Numbers
## Number type validation
Set `type` to `number` to validate numeric values.

```json
{
    "type": "number"
}
```

## Integer type validation
Set `type` to `integer` to validate integer values.

```json
{
  "type": "integer"
}
```

`0` and negative values are allowed, but decimals like `12.34` and string values like `"123"` are not.

## Range validation
- `minimum`, `maximum`: lower and upper numeric bounds
- `exclusiveMinimum`, `exclusiveMaximum`
  - If the value is `true`, the minimum/maximum boundary itself is excluded.
  - If the value is `false`, the boundary is included.

The following schema allows numbers greater than 0 and less than 255 (255 excluded).

```json
{
    "type": "number",
    "minimum": 1,
    "maximum": 255,
    "exclusiveMaximum": true
}
```

## Multiples validation
Use `multipleOf` to validate whether a number is a multiple of a given value.
The following schema checks multiples of 5 such as 0, 5, 10, and 15.

```json
{
    "type": "number",
    "multipleOf": 5
}
```

<br><br>

# Validating Strings
## String type validation
To validate a string, set `type` to `string`.

```json
{
    "type": "string"
}
```

## String length validation
Use `minLength` and `maxLength`.

```json
{
    "type": "string",
    "minLength": 3,
    "maxLength": 15
}
```

## Regular expression validation
Use `pattern` to validate against a regex.
The following example allows only `madplay.com` or `kimtaeng.com`.

```json
{
    "type": "string",
    "pattern": "(madplay|kimtaeng)\\.com"
}
```

## String format validation
Use `format` to validate a known string format.

```json
{
    "type": "string",
    "format": "date"
}
```

Examples by format:

- Date and time
  - `date-time`: 1991-02-04T00:31:00+09:00
  - `time`: 00:31:00+09:00
  - `date`: 1991-02-04
- Email
  - `email`: kimtaeng@madplay.com
- Hostname
  - `hostname`: kimtaeng-madplay.com
- IP
  - `ipv4`: 123.123.123.123
  - `ipv6`: 2001:0DB8:0000:0000:0000:0000:1428:57ab

## Media type validation
Use `contentEncoding` and `contentMediaType` to validate MIME-related payloads.

```json
{
  "type": "string",
  "contentEncoding": "base64",
  "contentMediaType": "application/json"
}
```

With this schema, base64 strings such as `"eyJhIjogMX0="` and `"bnVsbA=="` pass.
They decode to `{"a":1}` and `"null"` respectively.

By contrast, non-base64 values like `"2-3-4"`, or decoded content that is not valid `JSON`
(for example `"e2E6IDF9"` -> `"{a:1}"`) fail.

<br><br>

# Validating Arrays
## Array type validation
Set `type` to `array`.

```json
{
    "type": "array"
}
```

## Array item validation
Use `items` to validate elements in the array.
The following schema allows only arrays whose elements are all integers (or empty arrays).

```json
{
    "type": "array",
    "items": {
        "type": "integer"
    }
}
```

You can also validate mixed array types.
In the schema below, the first item is integer, the second and third are strings,
and the third string must be at most 10 characters.

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

If `additionalItems` is `false`, items beyond the declared list are not allowed.
In this example, only the three declared positions are valid.

## Duplicate item validation
Use `uniqueItems` to validate duplicate elements.
If `true`, duplicates are rejected.

```json
{
    "type": "array",
    "uniqueItems": true
}
```

With this schema, the following `JSON` fails because it contains duplicate objects.

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

## Array length validation
Like strings, arrays can enforce minimum and maximum length.

```json
{
    "type": "array",
    "minItems": 5,
    "maxItems": 10
}
```

<br><br>

# Validating Objects
## Object type validation
Set `type` to `object` to validate object values.

```json
{
    "type": "object"
}
```

## Property validation
You can validate object properties.
The following schema allows string `id`, string `title`, and integer `type`.

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

`required` defines mandatory properties.
If `id` or `title` is missing, validation fails.

## Property name validation
Property names can also be validated.
The schema below requires all property names to start with `a`, `b`, or `c`.

```json
{
    "type": "object",
    "propertyNames": {
        "pattern": "^[a-c].+"
    }
}
```

## Property dependency validation
Use `dependencies` to define property dependencies.

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

This means `creditCardNumber` depends on `billingAddress`.
So `creditCardNumber` alone is not allowed.

Example that fails:

```json
{
    "customerName": "kimtaeng",
    "creditCardNumber": "12341234"
}
```

If both dependent fields are absent, it can still pass.

```json
{
    "customerName": "kimtaeng"
}
```

## Schema dependency validation
This is similar to property dependencies, but instead of listing required peer properties,
it attaches an additional schema.
The schema below defines objects with `title` and `author`.
If `author` exists, then integer `articleNumber` must also exist.

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

The following `JSON` fails because `author` exists without `articleNumber`.

```json
{
  "title": "MadPlay's MadLife.",
  "author": "kimtaeng"
}
```

The next case also fails because `articleNumber` is not an integer.

```json
{
  "title": "MadPlay's MadLife.",
  "author": "kimtaeng",
  "articleNumber": "2"
}
```

By contrast, if `author` is missing, validation passes even when `articleNumber` is not integer.

```json
{
  "title": "MadPlay's MadLife.",
  "articleNumber": "2"
}
```

## Property count validation
You can set minimum and maximum property counts.

```json
{
    "type": "object",
    "minProperties": 2,
    "maxProperties": 3
}
```

<br>

# Next
In this post, we covered basic **JSON Schema** declaration patterns for validating `JSON` data.
In the next post, we will go deeper into combining schema rules and adding conditional logic.

- <a href="/post/multiple-and-conditional-json-schemas-validation-examples">Next post: "JSON Schema: Combining Schemas, Conditional Schemas, and Reuse"</a>
