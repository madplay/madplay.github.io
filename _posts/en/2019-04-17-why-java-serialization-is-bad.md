---
layout:   post
title:    "Java Serialization: What to Consider and Why It Is Discouraged"
author:   madplay
tags: 	  java serialization deserialization
description: "What should you watch out for when using Java serialization, and why is it discouraged?"
category: Java
comments: true
slug:     why-java-serialization-is-bad
lang:     en
permalink: /en/post/why-java-serialization-is-bad
---

# Table of Contents
- <a href="/post/java-serialization">Java Serialization: What Is Serialization?</a>
- <a href="/post/java-serialization-advanced">Java Serialization: What Is SerialVersionUID?</a>
- Java Serialization: What to Consider and Why It Is Discouraged

<br>

# Is Java Serialization Always Good?
In Java, serialization is often discouraged. It has a broad attack surface and can be exploited in many ways. Deserializing untrusted data is especially dangerous.

In this post, I cover what to consider when using Java serialization and why it is not recommended.

<br>

# Serialized Data Is Relatively Large
Java serialization is based on class metadata, which makes the payload larger than other formats. Compare a serialized object from the earlier example with a JSON representation.

```java
public void compareFormatSize(String serializedString) {
    byte[] decodedData = Base64.getDecoder().decode(serializedString);
    System.out.println("decodedData size (Byte) : " + decodedData.length);
    ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);

    try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
        Object object = ois.readObject();
        Article article = (Article) object;

        // Jackson converts an object to a string.
        // It requires getter methods to be defined.
        String jsonString = new ObjectMapper().writeValueAsString(article);
        System.out.println("json format : "+ jsonString);
        System.out.println("json string size (Byte) : " + jsonString.getBytes().length);
    } catch (Exception e) {
        // ... Exception Handling
    }
}

// Output
// decodedData size (Byte) : 146
// json format : {"title":"What is serialization","pressName":"Kimtaeng Daily","reporterName":"Kimtaeng"}
// json string size (Byte) : 88
```
 
Even for a simple class, the **JSON** payload is smaller. If your service only handles small traffic, this might not matter. If traffic spikes, it is a concern.

<br>

# Deserialization Filtering
Meanwhile, < Effective Java > mentions Java serialization as follows:
**_"If you cannot avoid serialization and you cannot be sure that deserialized data is safe, use deserialization filtering."_**

In other words, if you cannot replace serialization with JSON or similar formats, use **object deserialization filtering**.

- <a href="/post/prefer-alternatives-to-java-serialization" target="_blank">
Reference: "[Effective Java 3rd Edition] Item 85. Prefer Alternatives to Java Serialization"</a>

Java serialization is dangerous because `readObject` can instantiate any type on the classpath that implements `Serializable`. It can also execute code inside those types.

So, only allow classes that you trust to pass through the filter. Here is an example.

```java
public class ObjectInputFilterExample {
    public static void main(String[] args) throws Exception {
        filterTest(new MadPlayClass());
        filterTest(new KimtaengClass());
    }

    private static void filterTest(Object obj) throws Exception {
        Path tempFile = Files.createTempFile("test-file", "");
        ObjectOutputStream oos = new ObjectOutputStream
                (new FileOutputStream(tempFile.toFile()));

        try (oos) {
            oos.writeObject(obj);
        }

        ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream(tempFile.toFile()));
        ois.setObjectInputFilter(createFilter());
        try (ois) {
            Object o = ois.readObject();
            System.out.println("Class Name: " + o.getClass().getSimpleName());
        }
    }

    private static ObjectInputFilter createFilter() {
        return filterInfo -> {
            Class<?> clazz = filterInfo.serialClass();

            if (MadPlayClass.class.isAssignableFrom(clazz)) {
                // Deserialization is allowed.
                return ObjectInputFilter.Status.ALLOWED;
            }
            System.err.println("Rejected :" + clazz.getSimpleName());
            return ObjectInputFilter.Status.REJECTED;
        };
    }

    // Example class - deserialization is allowed.
    public static class MadPlayClass implements Serializable { }

    // Example class - deserialization is not allowed.
    public static class KimtaengClass implements Serializable { }
}
```

The output looks like this:

```bash
Class Name: MadPlayClass
Rejected :KimtaengClass
Exception in thread "main" java.io.InvalidClassException: filter status: REJECTED
...omitted
```

As shown, only classes allowed by the filter deserialize successfully. Rejected classes throw `InvalidClassException`. If you cannot guarantee data safety, use a whitelist filter to reduce the risk.

<br>

# JSON vs Java Serialization
If JSON works, why use Java serialization at all? Think about **CSV**, a comma-separated format. It is commonly used to exchange data without caring about system-specific details.

From that perspective, Java serialization makes sense for **data exchange between Java systems**. It removes the need to think about types and lets you use objects immediately after deserialization.

In practice, I have seen Java-serialized objects stored in **MySQL** and retrieved later, but these days **JSON** is more common. **MySQL 5.7** supports JSON types, so it is easier to use JSON. If you use a store like MongoDB, the choice is even simpler.

<br>

# Summary
Java serialization has more tradeoffs than it looks at first glance. Because it can be abused, most teams prefer alternatives like JSON that are platform-neutral. If you must use serialization, reduce risk with deserialization filtering.
