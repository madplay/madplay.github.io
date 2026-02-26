---
layout:   post
title:    "What’s New in Java 14?"
author:   madplay
tags:    java jdk14 openjdk
description: "A practical overview of new features and notable changes introduced in JDK 14." 
category: Java/Kotlin
date: "2020-06-19 23:51:22"
comments: true
lang: en
slug: what-is-new-in-java-14
permalink: /en/what-is-new-in-java-14/
---

# Java 14 Is Already Here
Two months have passed since Java 14 was released.
Based on the six-month release cadence announced in 2018,
Java 15 was expected later in 2020.

Java 14 includes many meaningful improvements.
In production, stability often matters more than immediate adoption,
but these features are worth understanding early.

### Before We Start
Since Oracle announced its commercial model in 2018,
`OpenJDK` adoption has grown significantly.
Most companies are likely to run on an OpenJDK distribution.

Because **OpenJDK** has multiple vendors,
there are multiple distributions built from the same standards.
JCP (Java Community Process) defines JSR standards,
and vendors provide implementations.

Examples include **Zulu, RedHat OpenJDK, Amazon Corretto**.
In this post, the examples used **AdoptOpenJDK**,
built by the OpenJDK community with support from organizations such as IBM and RedHat.

> As of June 19, it appeared to be joining the Eclipse Foundation.
> <a href="https://blog.adoptopenjdk.net/2020/06/adoptopenjdk-to-join-the-eclipse-foundation/" target="_blank"
rel="nofollow">https://blog.adoptopenjdk.net/2020/06/adoptopenjdk-to-join-the-eclipse-foundation/</a>

Installation is simple with `brew`.

```bash
# install latest OpenJDK by default
$ brew cask install adoptopenjdk

# or install a specific version
$ brew tap AdoptOpenJDK/openjdk
$ brew cask install adoptopenjdk14
```

Oracle collects OpenJDK enhancement proposals through **JEP (JDK Enhancement Proposal)**.
Related terms are **JCP (Java Community Process)** and **JSR (Java Specification Requests)**.

This post is based on the code-related items in the
<a href="https://openjdk.java.net/projects/jdk/14/" target="_blank" rel="nofollow">OpenJDK 14 JEP feature list</a>.

<br><br>

# JEP 305: Pattern Matching for instanceof (Preview)
The `instanceof` operator became more expressive.
Historically, you wrote:

```java
// explicit cast required
if (obj instanceof String) {
    String text = (String) obj;
}
```

With pattern matching, you can bind a local variable directly in the `if` block:

```java
// no extra cast line; variable is bound in-place
if (obj instanceof String s) {
    System.out.println(s);
    if (s.length() > 2) {
        // ...
    }
}

// additional conditions can be combined
if (obj instanceof String s && s.length() > 2) {
    // okay!
}
```

Because `s` is scoped like a local variable,
it is not accessible in the `else` block.

```java
if (obj instanceof String s) {

} else {
    // s is not visible here
}
```

<br><br>

# JEP 343: Packaging Tool (Incubator)
A new packaging tool, `jpackage`, was introduced.
It can build platform packages such as Linux `deb/rpm`,
macOS `pkg/dmg`, and Windows `msi/exe`.

Simple flow:

```bash
$ javac HelloWorld.java
```

After compilation, create a jar:

```bash
$ jar -cvf HelloWorld.jar HelloWorld.class
```

Then package it with `jpackage`:

```bash
$ jpackage --name hello_taeng --input test --main-jar HelloWorld.jar --main-class HelloWorld
```

On macOS, this produces a `dmg` package.

<br><br>

# JEP 345: NUMA-Aware Memory Allocation for G1
`G1` GC performance improved for **NUMA (Non-Uniform Memory Access)** systems,
which mainly benefits large multi-processor machines.

<br><br>

# JEP 358: Helpful NullPointerExceptions
Older Java versions reported `NullPointerException` mostly with line numbers,
so developers had to infer root cause manually.
Java 14 improved this message quality.

```java
private void runJEP358Test() {
    // what if b() returns null?
    a().b().c();
}
```

Previously:

```bash
# previous versions looked like this
Exception in thread "main" java.lang.NullPointerException
    at MadPlay.runJEP358Test(MadPlay.java:43)
    at MadPlay.main(MadPlay.java:117)
```

With `-XX:+ShowCodeDetailsInExceptionMessages` in Java 14:

```bash
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "MadPlay.c()" 
because the return value of "MadPlay.b()" is null
    at MadPlay.runJEP358Test(MadPlay.java:43)
    at MadPlay.main(MadPlay.java:1317)
```

<br><br>

# JEP 359: Records (Preview)
`record` was introduced for compact data carriers.
A typical class looked like this:

```java
class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // getter, setter omitted
    // toString, hashCode, equals also omitted
}
```

With records:

```java
record Point(int x, int y) {
    // cannot be extended (similar to final class)

    // fields are private final; reassignment is not allowed
    x = 5; // error

    // static fields and methods are allowed
    static int LENGTH = 25;

    public static int getDefaultLength() {
        return LENGTH;
    }
}
```

Characteristics:
- non-inheritable
- immutable component fields (`private final`)
- static members allowed

Usage is straightforward:

```java
Point point = new Point(2, 3);

// accessor generated automatically
point.x();
```

You still instantiate with `new`, and accessors are generated automatically.

<br><br>

# JEP 361: Switch Expressions (Standard)
`switch` gained expression support.
Traditional style:

```java
switch (type) {
    case TYPE_1:
    case TYPE_2:
    case TYPE_4:
        System.out.println("Type 1, 2, 4");
        break;
    case TYPE_3:
    case TYPE_5:
        System.out.println("Type 3, 5");
}
```

Expression style:

```java
switch (type) {
    case TYPE_1, TYPE_2, TYPE_4 -> System.out.println("Type 1, 2, 4");
    case TYPE_3, TYPE_5 -> System.out.println("Type 3, 5"); 
}
```

You can assign the switch result:

```java
Object retObj = switch (type) {
    case TYPE_1, TYPE_2 -> "2";
    case TYPE_3 -> 3;
    default -> "";
};
```

Using a `void` method directly as a result still fails:

```java
int ret = switch (type) {
    case TYPE_1, TYPE_2 -> System.out.println("Hello"); // compile error
    case TYPE_3 -> 3;
    default -> "":
}
```

If you need block logic and a value, use `yield`:

```java
int returnFrom = switch (type) {
    case TYPE_1 -> 3;
    default -> {
        System.out.println("return default value");
        yield 2; // use `yield`
    }
}
```

<br><br>

# JEP 363: Remove the Concurrent Mark Sweep (CMS) Garbage Collector
The `CMS` collector was deprecated in Java 9 and removed in Java 14.

<br><br>

# JEP 368: Text Blocks (Second Preview)
Long string literals with repeated `+` and `\n` were hard to maintain.
Text blocks make this cleaner.
(First introduced in Java 13 preview.)

```java
private void runJEP368() {
    String html = """
            {
                "list": [
                    {
                        "title": "hello, taeng",
                        "author": "taeng"
                    },
                    {
                        "title": "hello, news",
                        "author": "taeng"
                    }
                ]
            }
            """.indent(2);
    // indent was added in Java 12 and shifts each line by n spaces.
    System.out.println(html);
}
```

You can combine text blocks with placeholders for dynamic output:

```java
// placeholder in textBlocks
String textBlock = """
            {
                "title": "%s"
            }
        """.indent(1);
System.out.println(String.format(textBlock, "Hello Madplay"));
```

```bash
# one leading space is added
 {
   "title": "Hello Madplay"
 }
```

As a preview feature, you can also use `String.formatted`:

```java
String textBlock = """
        {
            "title": "%s",
            "author": "%s",
            "id": %d
        }
        """.formatted("hi", "taeng", 2);

System.out.println(textBlock);
```

```bash
{
  "title": "hello World!",
  "author": "taeng",
  "id": 2
}
```

<br>

# Closing
The release notes contain many changes.
New Java versions are arriving faster than many teams can fully absorb.
In production environments, stability constraints often delay adoption,
but learning these changes early helps with future upgrades.
