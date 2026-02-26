---
layout:   post
title:    "Java Serialization: writeObject and readObject"
author:   madplay
tags: 	  java readobject writeobject serialization
description: "What roles do writeObject and readObject play in Java serialization, and why are they private?"
category: Java/Kotlin
date: "2019-07-07 00:36:21"
comments: true
slug:     what-is-readobject-method-and-writeobject-method
lang:     en
permalink: /en/post/what-is-readobject-method-and-writeobject-method
---

# What is Java serialization?
Java serialization exchanges data between Java-based systems. A class becomes **serializable** when it implements `Serializable`. All fields are serialized except those marked with `transient` or `static`.

- <a href="/post/java-serialization" target="_blank">Reference: "Java serialization: serialization and deserialization"</a>

<br><br>

# Serialization example
Before diving into `writeObject` and `readObject`, run a simple serialization and deserialization example. The serializable `Article` class includes a `transient` field that is excluded by default.

```java
/**
 * Serializable class
 * @author madplay
 */
public class Article implements Serializable {
	private transient Integer id; // Exclude from serialization.
	private String title;
	private String pressName;
	private String reporterName;

	public Article(Integer id, String title, String pressName, String reporterName) {
		this.id = id;
		this.title = title;
		this.pressName = pressName;
		this.reporterName = reporterName;
	}

    /**
     * Override for inspecting fields.
     */
	@Override
	public String toString() {
		return String.format("id = %s, title = %s, pressName = %s, reporterName = %s",
			id, title, pressName, reporterName);
	}
}
```

Because `Article` implements `Serializable`, it is serializable. Define a `main` method, run the code, and check the output.

```java
/**
 * Serialization and deserialization test
 * @author madplay
 */
public class SerializationTester {

	public byte[] serialize() {
		Article article = new Article(1, "Serialization Test", "Kimtaeng Daily", "Kimtaeng");

		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
			oos.writeObject(article);
		} catch (Exception e) {
			// ... implementation omitted
		}
		return bos.toByteArray();
	}

	public Article deserialize(byte[] serializedData) {
		ByteArrayInputStream bis = new ByteArrayInputStream(serializedData);
		try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
			Object object = ois.readObject();
			return (Article)object;
		} catch (Exception e) {
			// ... implementation omitted
		}
		return null;
	}

	public static void main(String[] args) {
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize();
		Article article = serializationTester.deserialize(serializedData);
		System.out.println(article); // Print result
	}
}
```

The output is:

```bash
id = null, title = Serialization Test, pressName = Kimtaeng Daily, reporterName = Kimtaeng
```

The `id` field is `transient`, so it does not appear after deserialization.

<br><br>

# writeObject, readObject
When you need extra handling during serialization or deserialization, define `writeObject` and `readObject` in the class. The class must still implement `Serializable`. Java calls `writeObject` during serialization and `readObject` during deserialization.

Modify the serializable `Article` class as shown below. Exception handling uses a simple `try-catch` for brevity.

```java
/**
 * Serializable class
 * @author madplay
 */
public class Article implements Serializable {
	private transient Integer id; // Exclude from serialization.
	private String title;
	private String pressName;
	private String reporterName;

    /**
    * Called automatically during serialization.
    * Must be private.
    */
    private void writeObject(ObjectOutputStream oos) {
        try {
            oos.defaultWriteObject();
            oos.writeObject(this.id); // Field with transient keyword
            oos.writeObject(this.title);
            oos.writeObject(this.pressName);
            oos.writeObject(this.reporterName);
            System.out.println("writeObject method called");
        } catch (IOException e) {
            // ... implementation omitted
        }
    }

    /**
    * Called automatically during deserialization.
    * Must be private.
    */
    private void readObject(ObjectInputStream ois) {
        try {
            ois.defaultReadObject();
            this.id = (Integer)ois.readObject();
            this.title = (String)ois.readObject();
            this.pressName = (String)ois.readObject();
            this.reporterName = (String)ois.readObject();
            System.out.println("readObject method called");
        } catch (IOException | ClassNotFoundException e) {
            // ... implementation omitted
        }
    }

    // ... the rest stays the same.
}
```

The access modifier for `writeObject` and `readObject` must be `private`. If you use a different modifier, Java does not call them automatically.

`writeObject` must call `ObjectOutputStream.defaultWriteObject()` first, then write each serialized field. This example also writes a `transient` field explicitly.

Likewise, `readObject` must call `ObjectInputStream.defaultReadObject()` first, then read the fields in the same order they were written and assign them to the instance.

Run the code again:

```bash
writeObject method called
readObject method called
id = 1, title = Serialization Test, pressName = Kimtaeng Daily, reporterName = Kimtaeng
```

The console output shows that both methods run. Notice that the `transient` field now appears because `writeObject` writes it explicitly.

Use this technique when you need custom steps during serialization.

<br>

# A closer look
Now look at the details.

## Why private?
`writeObject` and `readObject` must be `private`. Otherwise Java does not call them. Declaring them `private` also prevents subclasses from **overriding** them.

Because only the class can call them, the class maintains its integrity. Superclasses and subclasses can keep independent serialization mechanisms. Java invokes these methods via **reflection**, so access modifiers do not block the call.

## Rules for default serialization
When you use `writeObject`, call `defaultWriteObject` first. For `readObject`, call `defaultReadObject` first. This ensures that default serialization runs.

## Another constructor
`readObject` behaves like another `public` constructor. Treat it carefully because it effectively creates an instance from a byte stream.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
Reference: [Effective Java 3rd Edition] Item 88. Write readObject defensively</a>
