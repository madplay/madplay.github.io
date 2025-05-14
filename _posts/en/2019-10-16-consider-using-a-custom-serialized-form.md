---
layout:   post
title:    "[Effective Java 3rd Edition] Item 87. Consider Using a Custom Serialized Form"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 85. Consider using a custom serialized form"
category: Java
lang: en
slug: consider-using-a-custom-serialized-form
permalink: /en/consider-using-a-custom-serialized-form/
date: "2019-10-16 02:08:22"
comments: true
---

# Why Consider Custom Serialization?
If a class implements `Serializable` and uses default serialization, it becomes coupled to current implementation details.
That means you may not be able to abandon the default serialized form later.
So you should decide after evaluating flexibility, performance, and correctness.

<br/>

# Ideal Serialized Form
Default serialization captures not only object fields but also every reachable object and connection from that object graph.
An **ideal serialized form** should represent only logical state, independent of physical representation.
If physical and logical representations are the same, default serialization can be reasonable.
For example, a class for person name is usually fine.

```java
public class Name implements Serializable {
    /**
     * Family name. Must not be null.
     * @serial
     */
    private final Stirng lastName;

    /**
     * Given name. Must not be null.
     * @serial
     */
    private final String firstName;

    /**
     * Middle name. Null when absent.
     * @serial
     */
    private final String middleName;

    ... // remaining code omitted
}
```

The logical composition is exactly three strings: family name, given name, and middle name.
Instance fields reflect that composition directly.

Even when default serialization seems suitable, you often need `readObject` for invariants and security.
In `Name`, `readObject` should ensure `lastName` and `firstName` are never null.

<br/>

# When Default Serialized Form Is Not Appropriate
If physical and logical representations differ significantly, default serialization is usually a bad choice.

```java
public final class StringList implements Serializable {
    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {
        String data;
        Entry next;
        Entry previous;
    }
    // ... omitted
}
```

Logically, this class represents a sequence of strings.
Physically, it is a doubly linked list.
Default serialization will include node links and internal graph structure.
That causes issues:

- **Public API becomes coupled to internal representation.**
  - If a future version removes linked-list internals, compatibility baggage still remains.
- **Serialized size becomes large.**
  - Node linkage information is internal detail and adds no logical value.
  - It only slows network transfer.
- **Serialization/deserialization becomes slow.**
  - Runtime must traverse graph structure explicitly.
- **Stack overflow risk increases.**
  - Default serialization recursively traverses object graphs.

<br/>

# Reasonable Serialized Form
A reasonable form for this class should contain only logical content: element count and element values.
Exclude physical representation details.

```java
public final class StringList implements Serializable {
    private transient int size = 0;
    private transient Entry head = null;

    // Not serialized this time.
    private static class Entry {
        String data;
        Entry next;
        Entry previous;
    }

    // Adds string to list.
    public final void add(String s) { ... }

    /**
     * Serializes this StringList instance.
     */
    private void writeObject(ObjectOutputStream stream)
            throws IOException {
        stream.defaultWriteObject();
        stream.writeInt(size);

        // Writes all elements in order.
        for (Entry e = head; e != null; e = e.next) {
            s.writeObject(e.data);
        }
    }

    private void readObject(ObjectInputStream stream)
            throws IOException, ClassNotFoundException {
        stream.defaultReadObject();
        int numElements = stream.readInt();

        for (int i = 0; i < numElements; i++) {
            add((String) stream.readObject());
        }
    }
    // ... omitted
}
```

Fields marked `transient` are excluded from default serialized form.
Even if all fields are transient, `writeObject` and `readObject` should still call `defaultWriteObject` and `defaultReadObject`.
The serialization spec requires this for compatibility.
It preserves forward/backward compatibility when non-transient fields are added later.

If a new-version instance is serialized then deserialized with an old version, new fields are ignored.
If old `readObject` does not call `defaultReadObject`, deserialization may throw `StreamCorruptedException`.

<br/>

# Additional Considerations
Regardless of default serialization usage, calling `defaultWriteObject` serializes all non-transient fields.
So mark fields `transient` whenever possible unless they are true logical state.

With default serialization, transient fields are initialized to default values during deserialization.
If you need different values, set them after calling `defaultReadObject` in `readObject`,
or lazily initialize when first used.

<br/>

# Synchronization
Serialization should follow synchronization policy as well.
If an object is thread-safe by synchronizing all methods, `writeObject` should also synchronize.

```java
private synchronized void writeObject(ObjectOutputStream stream)
        throws IOException {
    stream.defaultWriteObject();
}
```

<br/>

# SerialVersionUID
No matter which serialized form you choose, explicitly declare `SerialVersionUID` for serializable classes.
If omitted, runtime generates it automatically with extra computation.

```java
// Arbitrarily chosen long value
private static final long serialVersionUID = 0204L;
```

SUID does not have to be globally unique.
But changing it breaks compatibility with previous class versions.
So do not change SUID unless you intentionally break compatibility.
