---
layout:   post
title:    "Java Serialization: What Is SerialVersionUID?"
author:   madplay
tags: 	  java serialization deserialization suid
description: What is SerialVersionUID, and how does it affect Java serialization?
category: Java
comments: true
slug:     java-serialization-advanced
lang:     en
permalink: /en/post/java-serialization-advanced
---

# Table of Contents
- <a href="/post/java-serialization">Java Serialization: What Is Serialization?</a>
- Java Serialization: What Is SerialVersionUID?
- <a href="/post/why-java-serialization-is-bad">Java Serialization: Trade-offs and pitfalls</a>

<br>

# SerialVersionUID
In the previous post, we covered what Java serialization is, how to serialize a serializable class, and how to deserialize it.
This post goes deeper into **SerialVersionUID (SUID)**.

SUID matters because the serialization process checks that the SUID in the serialized stream matches the SUID of the current class.
If they do not match, deserialization throws `InvalidClassException`.

If you do not declare an SUID, Java generates one automatically.
The serialization spec does not require an explicit SUID and uses a computed hash if none is present.

- <a href="https://docs.oracle.com/javase/10/docs/specs/serialization/class.html"
rel="nofollow" target="_blank">Reference: Oracle Docs</a>

So even without explicitly declaring SUID, the runtime generates one based on the class structure such as name and constructors.
In the earlier examples, we omitted SUID in `Article`, yet the system still created one.

<br>

# Does It Really Generate One?
Let’s verify it. Because SUID is derived from class structure, changing the structure between serialization and deserialization should trigger an error.

First, use the same `Article` class and serialize it.
Then encode the byte array in Base64 and print it.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    public Article(String title, String pressName, String reporterName) {
        this.title = title;
        this.pressName = pressName;
        this.reporterName = reporterName;
    }

    @Override
    public String toString() {
        return String.format("title = %s, pressName = %s, reporterName = %s",
                title, pressName, reporterName);
    }
}

public class Main {
    public String serializeMethod() {
        Article article = new Article("What Is Serialization?", "Kimtaeng Daily", "Kimtaeng");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        // this try-with-resources form is supported since Java 9
        try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(article);
        } catch (Exception e) {
            // ...Exception Handling
        }
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    public static void main(String[] args) {
        Main main = new Main();
        String serializedString = main.serializeMethod();
        System.out.println(serializedString);
    }
}
```

The output is a Base64-encoded ASCII string like this:

```bash
// encoded string
rO0ABXNyAAdBcnRpY2xlXrUf2Yf... omitted
```

Now **add a field** to `Article` and deserialize the previously generated data.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;
    
    // new field
    private String phoneNumber;
    
    // ... omitted
}
```
 
Deserialization now throws an exception:

```bash
java.io.InvalidClassException: Article;
    local class incompatible: stream classdesc serialVersionUID = 6824395829496368166,
    local class serialVersionUID = 1162379196231584967
```

This shows that SUID is generated even when you do not declare it, and that changing the class structure breaks compatibility.

<div class="post_caption">So what should we do? Manage SUID ourselves?</div>

<br/>

# Managing SUID
Java recommends that developers explicitly declare and manage SUID.
Let’s add **SerialVersionUID** to `Article`.

```java
class Article implements Serializable {
    // use a simple value for illustration
    private static final long serialVersionUID = 1L;

    private String title;
    private String pressName;
    private String reporterName;

    // ... omitted
} 
```

After adding SUID, the serialized output looks like this:

```java
// encoded string
rO0ABXNyAAdBcnRpY2xlAAAAAAAAAAECAA... omitted
```

If you add a field and deserialize using the old data, the process succeeds as long as the SUID matches.

From this perspective, you should avoid serializing objects whose classes are likely to change.
Even framework or library classes can change their **SerialVersionUID** across versions, which can cause unexpected errors.

Here are common change scenarios and how they behave:

- **Adding a field**
  - With an explicit SUID, deserialization succeeds.
  - Fields that did not exist in the stream initialize to default values (for example, `null`).
  
- **Removing a field**
  - Deserialization succeeds, but the field value is lost.
  
- **Renaming a field**
  - Deserialization succeeds, but the value does not map to the renamed field.

- **Changing a field type**
  - Deserialization can throw `ClassCastException`.
  - The same applies to changes between primitive types, such as `int` to `double`.
  
- **Changing access modifiers**
  - Access modifier changes do not affect serialization.
  
- **static and transient**
  - If a `static` field becomes non-static, the serialized value is ignored.
  - `transient` fields are excluded from serialization, so removing `transient` still does not restore values.

<br>

# Next
This post covered **SerialVersionUID** and why it should be explicitly managed.
It also showed how structural changes can break deserialization.
The next post discusses the trade-offs and risks of Java serialization.

- <a href="/post/why-java-serialization-is-bad">Next: "Java Serialization: Trade-offs and pitfalls"</a>
