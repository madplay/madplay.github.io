---
layout:   post
title:    "JSON Schema: What Is JSON Schema?"
author:   madplay
tags: 	  json jsonschema
description: "Is there a way to validate JSON data? Like XSD for XML, how can you validate JSON?"
category: Backend
lang: en
slug: understanding-json-schema
permalink: /en/understanding-json-schema/
date: "2020-02-19 21:32:51"
comments: true
---

# What Is JSON Schema?
It is a way to validate whether `JSON` data, made of key-value pairs, follows predefined rules.
You can think of it like `XSD` and `DTD` for validating `XML` format.
In other words, **JSON Schema** is a rule set for verifying that `JSON` data follows a defined contract.

For example, assume you provide an API that exchanges `JSON` data with an external service.
Both the sender and receiver may need to verify that valid data is exchanged.
This is especially relevant when calls accept `JSON` payloads as parameters.

You can implement validation logic directly in application code,
but as data size grows, validation conditions grow quickly as well.
`JSON Schema` offers a different way to approach this problem.

- <a href="http://json-schema.org/" target="_blank" rel="nofollow">Reference: http://json-schema.org</a>

<br><br>

# Metadata Keywords in JSON Schema
First, look at metadata keywords that describe basic schema information.
They are not used directly for validation, but they explain the `JSON Schema` and how it is intended to work.
Not every field is required, but these fields help others understand the schema.

- `title`: schema name
- `description`: schema description
- `example`: examples that pass schema validation (array)
- `$comment`: comments for a specific schema

```json
{
    "title": "Some Schema",
    "description": "This schema is used for this and that.",
    "example": ["mad", "play"],

    "$comment": "Hmm... just leaving this here :)",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "name": {
            "$comment": "Not sure whether this is a good idea :(",
            "type": "string",
            "pattern": "^a"
        }
    }
}
```

<br><br>

# Validation Keywords in JSON Schema
A **JSON Schema** itself is also written in `JSON` format, just like target data.
It provides multiple validation keywords for checking data validity.
You combine these keywords to validate `JSON` data.
Representative keywords are:

- `type`: valid data type for a field
- `required`: properties that must be present (array)
- `properties`: properties for object-type data
- `minLength`: minimum string length
- `maxLength`: maximum string length
- `minItems`: minimum number of array items
- `maxItems`: maximum number of array items
- `pattern`: string matching a regular expression

<br>

## Data Types in JSON Schema
As described above, **JSON Schema** is in `JSON` format.
It supports all `JSON` types and additionally supports `integer`, a subtype of numeric (`number`) type.

Data Type | Description | Example
|:--:|:--|:--
`number` | Any numeric value | `-2`, `1.2`, `4.32`
`integer` | Integer value | `0`, `-123`, `123`
`string` | Text/string value | `"kim"`, `"taeng"`
`array` | Sequential elements | `[ "a", 2, null ]`
`object` | Key/value structured data | `{ "nickname": "madplay" }`
`boolean` | Boolean value | `true` or `false`
`null` | No value | `null`

<br>

# Next
In this post, we looked at what **JSON Schema** is and covered its basic characteristics.
In the next post, we look at how to declare schemas for validating `JSON` data using the validation keywords introduced above.

- <a href="/post/json-schema-validation-examples">Next post: "JSON Schema: Basic Schema Declaration and Validation Methods"</a>
