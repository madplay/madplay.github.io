---
layout:   post
title:    "[Effective Java 3rd Edition] Item 90. Consider Serialization Proxies Instead of Serialized Instances"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 90. Consider serialization proxies instead of serialized instances"
category: Java
lang: en
slug: consider-serialization-proxies-instead-of-serialized-instances
permalink: /en/consider-serialization-proxies-instead-of-serialized-instances/
date: "2019-10-26 01:31:34"
comments: true
---

# Once You Implement Serializable
A new object-construction path appears besides constructors.
That increases risk of bugs and security issues.
Using **serialization proxy pattern** reduces that risk significantly.

<br>

# Serialization Proxy Pattern
Design a nested class representing only logical state of outer class and declare it `private static`.
That nested class is the serialization proxy.

Proxy class should have one constructor that takes outer instance and copies required data.
No consistency check or defensive copy is usually needed there.
Both outer class and proxy should implement `Serializable`.

```java
class Period implements Serializable {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    private static class SerializationProxy implements Serializable {
        private static final long serialVersionUID = 2123123123;
        private final Date start;
        private final Date end;

        public SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        /**
         * Called on deserialize.
         * Creates object.
         */
        private Object readResolve() {
            return new Period(start, end);
        }
    }


    /**
     * Prevents direct serialized-instance creation of outer class.
     * Called during serialization and returns proxy.
     */
    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    /**
     * If readObject/writeObject exist, serialization process calls them via
     * ObjectInputStream/ObjectOutputStream.
     * Custom logic can be placed there.
     */
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        // This blocks direct deserialization into Period.
        throw new InvalidObjectException("Proxy required.");
    }
}
```

<br>

# Advantages of Serialization Proxy Pattern
As shown above, member fields can remain `final`, so true immutability is possible.
It also works correctly even when deserialized instance type differs from original serialized class implementation.

A representative case is `EnumSet`.
It exposes static factories rather than public constructors.
When element count is <=64 it uses `RegularEnumSet`, otherwise `JumboEnumSet`.

What if you serialize an `EnumSet` with 64 elements, then add 5 elements and deserialize?
Deserialization can choose `JumboEnumSet`.
This works because `EnumSet` uses serialization proxy pattern.

```java
private static class SerializationProxy <E extends Enum<E>>
        implements java.io.Serializable
{
    /**
     * The element type of this enum set.
     *
     * @serial
     */
    private final Class<E> elementType;

    /**
     * The elements contained in this enum set.
     *
     * @serial
     */
    private final Enum<?>[] elements;

    SerializationProxy(EnumSet<E> set) {
        elementType = set.elementType;
        elements = set.toArray(ZERO_LENGTH_ENUM_ARRAY);
    }

    // instead of cast to E, we should perhaps use elementType.cast()
    // to avoid injection of forged stream, but it will slow the implementation
    @SuppressWarnings("unchecked")
    private Object readResolve() {
        EnumSet<E> result = EnumSet.noneOf(elementType);
        for (Enum<?> e : elements)
            result.add((E)e);
        return result;
    }

    private static final long serialVersionUID = 362491234563181265L;
}

Object writeReplace() {
    return new SerializationProxy<>(this);
}

// readObject method for the serialization proxy pattern
// See Effective Java, Second Ed., Item 78.
private void readObject(java.io.ObjectInputStream stream)
    throws java.io.InvalidObjectException {
    throw new java.io.InvalidObjectException("Proxy required");
}
```

<br>

# Limitations of Serialization Proxy Pattern
It cannot be applied to classes designed for open inheritance by clients.
It is also hard to apply to object graphs with cycles.
If `readResolve` in proxy tries to call methods requiring fully built cyclic graph,
exceptions may occur because real object is not fully reconstructed yet.
It can also be slower than direct defensive-copy approaches.

<br>

# Testing Serialization Proxy Pattern
Below is a runnable test example to inspect behavior.
Copy the full code and debug execution.

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidObjectException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Base64;
import java.util.Date;

class Period implements Serializable {
    // Advantage: can keep fields final.
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    private static class SerializationProxy implements Serializable {
        private static final long serialVersionUID = 2123123123;
        private final Date start;
        private final Date end;

        public SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        /**
         * Called on deserialize.
         * Creates object.
         */
        private Object readResolve() {
            return new Period(start, end);
        }
    }


    /**
     * Prevents direct serialized-instance creation of outer class.
     * Called during serialization and returns proxy.
     */
    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    /**
     * If readObject/writeObject exist, serialization process calls them via
     * ObjectInputStream/ObjectOutputStream.
     * Custom logic can be placed there.
     */
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        // Blocks direct Period deserialization.
        throw new InvalidObjectException("Proxy required.");
    }
}

/**
 * Test code for serialization proxy
 *
 * @author madplay
 */
public class SerializationTest {
    public String serializeMethod() {
        Period period = new Period(new Date(), new Date());

        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(period);
            // base64 encode to print byte data safely
            return Base64.getEncoder().encodeToString(bos.toByteArray());
        } catch (Exception e) {
            System.err.println(e);
        }
        return null;
    }


    public Period deserializeMethod(String serializedString) {
        // decode because previous serialization used Base64
        byte[] decodedData = Base64.getDecoder().decode(serializedString);
        try (ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            Object object = ois.readObject();
            return (Period) object;
        } catch (Exception e) {
            System.err.println(e);
        }
        return null;
    }

    public static void main(String[] args) {
        // serialization proxy test
        SerializationTest main = new SerializationTest();
        String serializedString = main.serializeMethod();
        Period period = main.deserializeMethod(serializedString);
    }
}
```
