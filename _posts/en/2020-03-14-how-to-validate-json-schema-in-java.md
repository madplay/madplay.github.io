---
layout:   post
title:    "JSON Schema: Implementing a Validator in Java"
author:   madplay
tags: 	  json jsonschema jsonvalidate
description: "Let's implement a JSON Schema validator in Java code."
category: Java
lang: en
slug: how-to-validate-json-schema-in-java
permalink: /en/how-to-validate-json-schema-in-java/
date: "2020-03-14 21:03:09"
comments: true
---

# In the Previous Posts
So far, we covered JSON Schema fundamentals, schema declarations for validating `JSON`,
schema composition, conditional schemas, and schema reuse.
In this post, we implement a JSON Schema validator in Java.

- <a href="/post/multiple-and-conditional-json-schemas-validation-examples">
Previous: "JSON Schema: schema composition, conditional schema, and schema reuse"</a>

<br><br>

# Validator Library
There are many <a href="https://json-schema.org/implementations.html)" target="_blank" rel="nofollow">JSON Schema implementations</a>.
In Java ecosystem, `json-schema-validator` has high adoption.
So this example uses that library for `JSON` validation.

- <a href="https://github.com/java-json-tools/json-schema-validator" target="_blank" rel="nofollow">
Reference: json-schema-validator (GitHub)</a>

<br><br>

# Define JSON Schema
Let's define a simple schema for this example.
Refer to comments for each part. (`JSON` conceptually does not allow comments, but shown here for explanation.)
If you need deeper schema rules, refer to previous posts.

Save as `sample_schema.json` directly under project `resources`.

```json
{
  "type": "object", // top-level type is object
  "properties": { // has properties
    "contents": {
      "type": "array", // property `contents` is array
      "items": [ // item definitions
        {
          "type": "object", // object type
          "$ref": "#/definitions/photo" // follows `photo` definition
        },
        {
          "type": "object",
          "$ref": "#/definitions/photo"
        },
        {
          "type": "object",
          "$ref": "#/definitions/text" // follows `text` definition
        }
      ]
    }
  },
  "required": [ // `contents` is required
    "contents"
  ],
  "definitions": { // reusable type definitions
    "text": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [ "text" ]
        }
      },
      "required": [
        "id"
      ]
    },
    "photo": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
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

# Write the Code
This example uses a Maven project, but the same approach works with Gradle.

## Add Maven Dependency
Add dependency in `pom.xml`.
Latest version in the original example is `2.2.13`.

```xml
<dependency>
    <groupId>com.github.java-json-tools</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>2.2.13</version>
</dependency>
```

<br>

## Read Schema File
This method reads schema file and joins lines into a single string.
Exception-handling details are omitted.

```java
private String getJsonSchemaFromFile() {
    try {
        Path path = Paths.get(ClassLoader.getSystemResource("sample_schema.json").toURI());
        return Files.readAllLines(path).stream().collect(Collectors.joining());
    } catch (IOException | URISyntaxException e) {
        // exception handling
    }
    return "";
}
```

<br>

## JsonNode Conversion Methods
Most `json-schema-validator` APIs take `jackson.databind.JsonNode`.
So we need conversion methods from `String` schema and target objects into `JsonNode`.

```java
// Reuse mapper as instance field instead of recreating each time.
final ObjectMapper mapper = new ObjectMapper();

/**
 * Converts schema string to JsonNode.
 */
private JsonNode convertCardRuleToJsonNode(String cardRule) {
    try {
        return mapper.readTree(cardRule);
    } catch (Exception e) {
        // exception handling
    }
    return null;
}

/**
 * Converts object to JsonNode.
 */
private JsonNode convertObjToJsonNode(Object object) {
    try {
        return mapper.valueToTree(object);
    } catch (Exception e) {
        // exception handling
    }
    return null;
}
```

## Define Class
You can prepare test `JSON` files directly,
but here we define POJO and convert to JSON format via methods above.
Declare class as abstraction for `text` and `photo` in schema.

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

    // getters/setters omitted
}
```

Then create test data method:

```java
private HashMap<String, Object> getTestData() {
    List<Content> contents = List.of(
            new Content("1", "Title1", "text"),
            new Content("2", "Title2", "text"),
            new Content("3", "Title3", "text")
    );

    return new HashMap<>() {
        {
            put("contents", contents);
        }
    };
}
```

## Validation Code
Now write validation logic.
Library usage is relatively simple.

```java
public void validate() {
    // create JsonNode from schema string
    JsonNode schemaNode = convertCardRuleToJsonNode(getJsonSchemaFromFile());

    // initialize validator factory
    JsonSchemaFactory factory = JsonSchemaFactory.byDefault();

    // validation result holder
    ProcessingReport report = null;
    try {
        // create schema object
        JsonSchema schema = factory.getJsonSchema(schemaNode);

        // convert test data to JsonNode
        JsonNode data = convertObjToJsonNode(getTestData());

        // validate
        report = schema.validate(data);
    } catch (Exception e) {
        // exception handling
    }
}
```

## Check Validation Result
Validation returns `ProcessingReport`.
You can check success via `isSuccess`.
Since `toString` is overridden, printing report directly yields formatted messages like below.

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

# Closing
We implemented JSON Schema validation in Java using `json-schema-validator`.

Usage is straightforward, but the library does not support every latest JSON Schema draft feature.
For example, it may not recognize newer keywords such as `const` in some contexts.
Current release plans for major updates appear limited.

- <a href="https://github.com/madplay/json-schema-validator">Reference: full source used in this example (GitHub)</a>
