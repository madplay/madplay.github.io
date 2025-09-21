---
layout:   post
title:    "JSON Schema: Combining Schemas, Conditional Schemas, and Reuse"
author:   madplay
tags: 	  json jsonschema jsonvalidate
description: "How to combine JSON schemas, apply conditional logic, and reuse repeated schema fragments."
category: Backend
date: "2020-03-07 23:54:23"
comments: true
lang: en
slug: multiple-and-conditional-json-schemas-validation-examples
permalink: /en/multiple-and-conditional-json-schemas-validation-examples/
---

# In the Previous Post
In the previous article, we covered the basics of **JSON Schema** for validating `JSON` data.
In this article, we move to advanced usage: combining schemas and applying conditional logic.

- <a href="/post/json-schema-validation-examples">Previous post: "JSON Schema: Basic Schema Definitions and Validation"</a>

<br><br>

# Additional Ways to Validate JSON
## Validating boolean values
Only `true` or `false` is allowed.

```json
{
    "type": "boolean"
}
```

## Validating values with enum
With the `enum` keyword, you can limit allowed values for a field.
The schema below allows only "male" or "female".

```json
{
    "type": "string",
    "enum": ["male", "female"]
}
```

## Validating with a constant value
With the `const` keyword, you can require a field to have a single fixed value.

```json
{
    "properties": {
        "title": {
            "const": "MadPlay's MadLife."
        }
    }
}
```

With this schema, the `title` property must match the predefined string.

## Validating null
If `type` is `null`, the data must be `null`.

```json
{
    "type": "null"
}
```

The value must be exactly `null`. Even an empty string (`""`) is not accepted.

<br><br>

# Composite Schemas
`JSON Schema` supports composition with the following keywords.
You can list conditions as arrays and evaluate multiple schema rules together.

- `allOf`: all schema validations must pass.
- `anyOf`: one or more schema validations must pass.
- `oneOf`: exactly one schema validation must pass.

## allOf: all schemas must pass
The following schema accepts values that are at most 5 characters and start with `a`.
So strings like `"abc"` and `"a12a2"` pass.
Because no type is declared, numeric values can also pass.

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

## anyOf: one or more schemas
The schema below validates `id` when it is either a string or a number.
If `id` is `null` or `boolean`, validation fails.

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

## oneOf: exactly one schema
Only one condition in the list may pass.
In this schema, the value `"abc"` for `id` fails because it matches both conditions
(minimum length and starts with `a`).

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

# Conditional Schemas
You can also apply conditions with `not` and `if-then-else`.

## not
Unlike the previous rules, `not` allows only data that does **not** match the given schema.
The schema below fails every string value.

```json
{
    "not": {
      "type": "string"
    }
}
```

This pattern is uncommon, but use it carefully.
For example, the rule below can never pass:

```json
{
    "type": "string",
    "not": {
      "type": "string"
    }
}
```

It requires the field to be a string and also rejects all strings.

## if-then-else
You can define branch logic with `if`, `then`, and `else`.
The rule is straightforward:

- If `if` matches, apply `then`.
- If `if` does not match, apply `else`.

In the following schema, if the data is a string,
it must have at least 3 characters and start with `m`.
If it is not a string, the value must be `0`.

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

Examples:

- `"madplay"`: pass, string, length >= 3, starts with `m`.
- `0`: pass, not a string but equals 0.
- `0.1.1`: fail, invalid number.
- `["mad"]`: fail, neither string nor 0.

<br><br>

# Improving Schema Reusability
## Referencing schemas
`$id` gives a **JSON schema** a unique identity.
It serves two common purposes.

The first is to declare a unique identifier, often as a download location at the top level:

```json
{
    "$id": "http://foo.bar/custom/email-schema.json",

    "type": "string",
    "format": "email",
    "pattern": "@madplay\\.+"
}
```

The second is to define a base URI that `$ref` can target:

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

Here, the `email` field reuses a referenced schema.
Without `$ref`, the field would embed the full rule directly:

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

## Defining shared schemas
The `definitions` keyword is commonly used with `$ref` for reusable validation blocks.
The example below defines text content and photo content schemas once and reuses them.

> Line breaks were reduced to keep the snippet shorter.

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

# Next
In this post, we covered more advanced schema composition and schema reuse patterns.
In the next post, we will implement a **JSON Schema** validator in Java code.

- <a href="/post/how-to-validate-json-schema-in-java">Next post: "JSON Schema: Implementing a Validator in Java"</a>
