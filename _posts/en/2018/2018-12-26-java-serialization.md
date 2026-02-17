---
layout:   post
title:    "Java Serialization: What Is Serialization?"
author:   madplay
tags: 	  java serialization deserialization
description: What are serialization and deserialization in Java, and how do you use them?
category: Java/Kotlin
comments: true
slug:     java-serialization
lang:     en
permalink: /en/post/java-serialization
---

# Table of Contents
- Java Serialization: What Is Serialization?
- <a href="/post/java-serialization-advanced">Java Serialization: What Is SerialVersionUID?</a>
- <a href="/post/why-java-serialization-is-bad">Java Serialization: Trade-offs and pitfalls</a>

<br>

# What Is Serialization?
Java serialization converts Java objects or data into a byte stream so other Java systems can use them.
In that context, **serialization** is simply a format conversion.
Java serialization is a specific form of serialization with Java-specific constraints.

<br>

# Using Java Serialization
Serialization has a prerequisite: the object must be an instance of a **serializable class**.
To make a class serializable, implement the `java.io.Serializable` interface.

```java
/**
 * Implement java.io.Serializable
 * to make this class serializable.
 */
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    public Article(String title, String pressName, String reporterName) {
        this.title = title;
        this.pressName = pressName;
        this.reporterName = reporterName;
    }
    
    // verify fields during deserialization
    @Override
    public String toString() {
        return String.format("title = %s, pressName = %s, reporterName = %s",
                title, pressName, reporterName);
    }

    // getters omitted
} 
```

You can also inherit from a serializable class instead of implementing the interface directly.
Once the class is ready, you can serialize an instance using `java.io.ObjectOutputStream`.

First, create an instance of the serializable class (`Article`) and write it to an `ObjectOutputStream`.
To verify the result, encode it with Base64 and print it.

```java
// Article is the same as above.
public class SerializeTester {
    public String serializeMethod() {
        Article article = new Article("What Is Serialization?", "Kimtaeng Daily", "Kimtaeng");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        
        // try-with-resources in this form is supported since Java 9
        try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(article);
        } catch (Exception e) {
            // ... omitted
        }
        
        // base64-encode the byte array for readable output
        return Base64.getEncoder().encodeToString(bos.toByteArray());
    }

    public static void main(String[] args) {
        SerializeTester tester = new SerializeTester();
        String data = tester.serializeMethod();
        
        // prints an encoded string like rO0ABXNyAAdBcn...
        System.out.println(data);
    }
}
```

The output is an encoded string that is not human-readable, so Base64 encoding makes it easier to inspect.
Now you can use the serialized data for **deserialization**.

<br>

# During Serialization
If you want to exclude a field from serialization, declare it as `transient`.
When deserialized, that field is not restored.

There are ways to bypass `transient` as well.

- <a href="/post/what-is-readobject-method-and-writeobject-method" target="_blank">
Reference: "Java Serialization: writeObject and readObject"</a>

```java
// exclude the reporter name from serialization
class Article implements Serializable {
    private String title;
    private String pressName;
    private transient String reporterName;

    // rest is the same as above
}
```

A serializable class can contain fields of other classes.
In that case, those classes must also implement `Serializable`.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    // java.time.LocalDateTime implements Serializable
    private LocalDateTime articleTime;
    
    // a custom class; must implement Serializable explicitly
    private DetailInfo detailInfo;
}
```

`java.time.LocalDateTime` implements `Serializable`, but custom classes and many Java classes do not.
If they do not implement `Serializable`, serialization fails.

<br>

# Deserialization
If you serialize an instance of a serializable class, you can recreate it from the serialized data.
Deserialization uses `ObjectInputStream`.

```java
public class SerializeTester {

    // serializeMethod is the same as above.

    public Article deserializeMethod(String serializedString) {
        // decode the Base64 string
        byte[] decodedData = Base64.getDecoder().decode(serializedString);
        ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);
        try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (Article) ois.readObject();
        } catch (Exception e) {
            // ... omitted
        }
        return null;
    }

    public static void main(String[] args) {
        SerializeTester tester = new SerializeTester();
        String data = tester.serializeMethod();
        Article article = tester.deserializeMethod(data);
        
        // title = What Is Serialization?, pressName = Kimtaeng Daily, reporterName = Kimtaeng
        System.out.println(article);
    }
}
```

During deserialization, the class of the serialized object must be on the classpath and imported.

In this example we used the in-memory serialized string, but you can also write the bytes with `FileOutputStream`
and read them back from a file to restore the object.

<br>

# Summary
Serialization does not apply to every class. Only classes that implement `java.io.Serializable` can be serialized,
including classes used as fields within those classes.

The next post explains **SerialVersionUID**.

- <a href="/post/java-serialization-advanced">Next: "Java Serialization: What Is SerialVersionUID?"</a>
