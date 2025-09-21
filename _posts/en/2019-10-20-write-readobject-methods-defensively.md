---
layout:   post
title:    "[Effective Java 3rd Edition] Item 88. Write readObject Methods Defensively"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 88. Write readObject methods defensively"
category: Java
lang: en
slug: write-readobject-methods-defensively
permalink: /en/write-readobject-methods-defensively/
date: "2019-10-20 23:12:56"
comments: true
---

# Immutable Class with Defensive Copies
In _"Item 50. Make defensive copies when needed"_, we used defensive copies of `Date` in constructor/getters to preserve invariants.

- <a href="/post/make-defensive-copies-when-needed" target="_blank">
Reference: "[Effective Java 3rd Edition] Item 50. Make defensive copies when needed"</a>

```java
public final class Period {
    private final Date start;
    private final Date end;

    /**
     * @param  start start time
     * @param  end end time; must be later than start
     * @throws IllegalArgumentException when start is later than end
     * @throws NullPointerException when start or end is null
     */
    public Period(Date start, Date end) {
        this.start = new Date(start.getTime()); // defensive copy against mutability of Date
        this.end = new Date(end.getTime());

        if (this.start.compareTo(this.end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
    }

    public Date start() { return new Date(start.getTime()); }
    public Date end() { return new Date(end.getTime()); }
    public String toString() { return start + " - " + end; }
    // ... omitted
}
```

Because physical and logical representations match, default serialization appears fine.
So adding `Serializable` looks enough.
But invariants can still break, because `readObject` is effectively another public constructor.

Treat `readObject` with the same care as constructors.
Validate inputs and defensively copy mutable components.
Without that, invariant-breaking attacks are possible.

<br/>

# readObject Method
`readObject` is like a constructor whose argument is a byte stream.
Usually that stream comes from normal serialization of valid instances.
But malicious byte streams can create objects impossible through normal construction.

With `Period` simply marked `Serializable`, code like below can break invariants.

```java
public class BogusPeriod {
    // Byte stream impossible from real Period instances,
    // manually edited from a valid serialized Period instance.
    private static final byte[] serializedForm = {
        (byte)0xac, (byte)0xed, 0x00, 0x05, 0x73, 0x72, 0x00, 0x06,
        0x50, 0x65, 0x72, 0x69, 0x6f, 0x64, 0x40, 0x7e, (byte)0xf8,
        ... omitted
    }

    // Bytes with top bit 1 are cast to byte,
    // because Java has no byte literal syntax and byte is signed.

    public static void main(String[] args) {
        Period p = (Period) deserialize(serializedForm);
        System.out.println(p);
    }

    // Builds object from provided serialized form.
    static Object deserialize(byte[] sf) {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(sf)) {
            try (ObjectInputStream objectInputStream = new ObjectInputStream(byteArrayInputStream)) {
                return objectInputStream.readObject();
            }
        } catch (IOException | ClassNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
```

```bash
# end is earlier than start, so Period invariant is broken.
Fri Jan 01 12:00:00 PST 1999 - Sun Jan 01 12:00:00 PST 1984
```

So merely declaring serialization can allow creation of invariant-broken instances.

<br/>

# How to Defend
In `readObject`, call `defaultReadObject`, then validate deserialized state.
If validation fails, throw `InvalidObjectException`.

```java
private void readObject(ObjectInputStream s)
        throws IOException, ClassNotFoundException {

    // Validates invariant.
    if (start.compareTo(end) > 0) {
        throw new InvalidObjectException(start + "after" + end);
    }
}
```

Still not enough.
If an attacker appends references to private `Date` fields at end of stream,
a mutable `Period` can be created.

By reading those appended references during deserialization,
attacker gets internal references and can mutate instance state.

```java
public class MutablePeriod {
    // Period instance
    public final Period period;

    // Start-time field - should not be externally accessible.
    public final Date start;

    // End-time field - should not be externally accessible.
    public final Date end;

    public MutablePeriod() {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream out = new ObjectOutputStream(bos);

            // Serializes valid Period instance.
            out.writeObject(new Period(new Date(), new Date()));

            /*
             * Appends malicious previous-object references to internal Date fields.
             * See Java Serialization Spec section 6.4.
             */
            byte[] ref = { 0x71, 0, 0x7e, 0, 5 }; // reference #5
            bos.write(ref); // start field
            ref[4] = 4; // reference #4
            bos.write(ref); // end field

            ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(bos.toByteArray()));
            period = (Period) in.readObject();
            start = (Date) in.readObject();
            end = (Date) in.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new AssertionError(e);
        }
    }

    public static void main(String[] args) {
        MutablePeriod mp = new MutablePeriod();
        Period p = mp.period;
        Date pEnd = mp.end;

        // Moves time backward.
        pEnd.setYear(78);
        System.out.println(p);

        // Moves into 1960s.
        pEnd.setYear(69);
        System.out.println(p);
    }
}
```

```bash
Wed Nov 22 00:21:29 PST 2017 - Wed Nov 22 00:21:29 PST 1978
Wed Nov 22 00:21:29 PST 2017 - Sat Nov 22 00:21:29 PST 1969
```

Root cause: `Period.readObject` does not make defensive copies.
**During deserialization, every field that should not expose internal references must be defensively copied.**

<br/>

# Do Defensive Copy and Validation Together
To protect `Period`, do defensive copies before validation.
Also do not use `Date.clone`.

```java
private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // defensively copies mutable components.
    start = new Date(start.getTime());
    end = new Date(end.getTime());

    // validates invariant.
    if (start.compareto(end) > 0) {
        throw new InvalidObjectException(start + " after " + end);
    }
}
```

```bash
# Output of MutablePeriod main method
Fri May 31 01:01:06 KST 2019 - Fri May 31 01:01:06 KST 2019
Fri May 31 01:01:06 KST 2019 - Fri May 31 01:01:06 KST 2019
```

Note: `final` fields cannot be defensively reassigned during `readObject`.
So `start` and `end` need to drop `final`.
That tradeoff is better than being vulnerable.

<br/>

# When Is Default readObject Acceptable?
If you can add a public constructor that takes all non-transient fields,
assigns them without extra validation, and remains safe, default `readObject` can be acceptable.
Otherwise define custom `readObject` and perform all validation and defensive copies explicitly.
Best approach is usually **serialization proxy pattern**, which reduces deserialization safety complexity.

For non-final serializable classes, like constructors,
`readObject` should not call overridable methods.
Subclass state may not yet be fully deserialized when those methods run.

<br/>

# Summary
* Write `readObject` with the same discipline as writing a public constructor.
* `readObject` must produce valid instances for any incoming byte stream.
  * Never assume all streams came from legitimate serialized instances.
* Guidelines for safe `readObject`
  * Defensively copy each private object-reference field.
  * Validate all invariants and throw `InvalidObjectException` on violation.
  * If full graph validation is needed after deserialization, use `ObjectInputValidation`.
  * Never call overridable methods.
