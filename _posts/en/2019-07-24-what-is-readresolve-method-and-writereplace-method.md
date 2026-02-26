---
layout:   post
title:    "Java Serialization: readResolve and writeReplace"
author:   madplay
tags: 	  java readresolve writereplace serialization
description: "What roles do readResolve and writeReplace play in Java serialization?"
category: Java/Kotlin
date: "2019-07-24 01:21:46"
comments: true
slug:     what-is-readresolve-method-and-writereplace-method
lang:     en
permalink: /en/post/what-is-readresolve-method-and-writereplace-method
---

# Is it a real singleton?
The singleton pattern controls the number of instances of a class, typically one. A singleton class returns the same instance every time.

- <a href="/post/singleton-pattern" target="_blank">Reference: Singleton Pattern</a>

```java
/**
 * @author madplay
 */
public final class MySingleton {
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}
}
```

A singleton stops being a singleton the moment it implements `Serializable`. Serialization and deserialization return a new instance, not the original one.

- <a href="/post/java-serialization" target="_blank">Reference: "Java serialization: serialization and deserialization"</a>

Make the singleton serializable and run a serialization test.

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public final class MySingleton implements Serializable { // Serializable
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}
}
```

Now test serialization and deserialization.

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

/**
 * @author madplay
 */
public class SerializationTester {

	public byte[] serialize(Object instance) {
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
			oos.writeObject(instance);
		} catch (Exception e) {
			// ... implementation omitted
		}
		return bos.toByteArray();
	}

	public Object deserialize(byte[] serializedData) {
		ByteArrayInputStream bis = new ByteArrayInputStream(serializedData);
		try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
			return ois.readObject();
		} catch (Exception e) {
			// ... implementation omitted
		}
		return null;
	}

	public static void main(String[] args) {
		MySingleton instance = MySingleton.getINSTANCE();
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize(instance);
		MySingleton result = (MySingleton)serializationTester.deserialize(serializedData);
		System.out.println("instance == result : " + (instance == result));
		System.out.println("instance.equals(result) : " + (instance.equals(result)));
	}
}
```

The output is:

```bash
instance == result : false
instance.equals(result) : false
```

A real singleton returns the same instance, so both comparisons should be `true`. Here they are `false`, which means you get two different instances.

Comparing `hashCode` is not reliable. Different objects can share the same hash code. For example, the strings `hypoplankton` and `unheavenly` have the same `hashCode()` value.

<br>

# What should you do?
Use `readResolve`. Define it to return the existing singleton instance during deserialization.

Even if `readObject` exists, `readResolve` replaces the deserialized instance. The instance created by `readObject` becomes garbage.

- <a href="/post/what-is-readobject-method-and-writeobject-method" target="_blank">
Reference: "Java serialization: writeObject and readObject"</a>

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public final class MySingleton implements Serializable {
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}

    // Define readResolve.
	private Object readResolve() {
        // Preserve the singleton.
		return INSTANCE;
	}
}
```

Run the test again. The results are now `true`.

```bash
instance == result : true
instance.equals(result) : true
```

<br>

# writeReplace
`writeReplace` appears alongside `readResolve`. In Java serialization, `readResolve` controls deserialization, while `writeReplace` controls serialization.

When you write an object to a stream, `writeReplace` allows you to serialize a different object instead of the original.

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public class Gender implements Serializable {
	public final static Gender MALE = new Gender(Detail.DETAIL_MALE);
	public final static Gender FEMALE = new Gender(Detail.DETAIL_FEMALE);

	private Detail detail;

	private Gender(Detail detail) {
		this.detail = detail;
	}

    // Called during serialization.
	private Object writeReplace() {
		if (this.equals(MALE)) {
			return Detail.DETAIL_MALE;
		} else {
			return Detail.DETAIL_FEMALE;
		}
	}

	private static class Detail implements Serializable {
		final static Detail DETAIL_MALE = new Detail(0);
		final static Detail DETAIL_FEMALE = new Detail(1);

		private int value;

		private Detail(int value) {
			this.value = value;
		}

        // Called during deserialization.
		private Object readResolve() {
			if (value == DETAIL_MALE.value) {
				return Gender.MALE;
			} else {
				return Gender.FEMALE;
			}
		}
	}
}
```

Reuse the earlier serialization test code and run it with `Gender`.

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

/**
 * @author madplay
 */
public class SerializationTester {

	// serialize and deserialize are the same as before

	public static void main(String[] args) {
		Gender male = Gender.MALE;
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize(male);
		Gender result = (Gender)serializationTester.deserialize(serializedData);
		System.out.println("male == result : " + (male == result));
		System.out.println("male.equals(result) : " + (male.equals(result)));
	}
}
```

The output is `true`. The key point is not just that the objects are equal. The key point is that `writeReplace` serializes a `Detail` object instead of the original `Gender` object. If you debug the code, you can see `writeReplace` run during serialization, and the stream contains a `Detail` instance in place of `Gender`.
