---
layout:   post
title:    "What Is New in Java 17: First LTS Release in 3 Years"
author:   madplay
tags:    java jdk17 openjdk
description: "A new Java LTS release after 3 years. What features were added in JDK 17?"
category: Java/Kotlin
date: "2021-10-02 00:24:31"
comments: true
slug:     what-is-new-java-17
lang:     en
permalink: /en/post/what-is-new-java-17
---

# Java 17: LTS Released After 3 Years
Last September, a new Java LTS (Long-Term-Support) version was released after three years.
I summarized notable release notes for Java 14 last year, and now we are already at Java 17.

- <a href="/post/what-is-new-in-java-14" target="_blank">Reference: What features were added in Java 14?</a>

Java follows the release plan below (source: Wikipedia).
Java 17 is the first new LTS since Java 11 in 2018.
The next LTS is Java 21, scheduled for 2023.
For complete Java version history, see <a href="https://www.oracle.com/java/technologies/java-se-support-roadmap.html" target="_blank" rel="nofollow">Oracle Java roadmap</a> or
<a href="https://en.wikipedia.org/wiki/Java_version_history" target="_blank" rel="nofollow">Wikipedia Java version history</a>.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-10-02-what-is-new-java-17.jpg" width="600" alt="java version history"/>

<br><br>

# JDK 17 Release Notes
> This summary focuses on code-related changes based on JEP (JDK Enhancement Proposal).
> The full release list is in <a href="https://openjdk.java.net/projects/jdk/17/" target="_blank" rel="nofollow">OpenJDK JDK17</a>.

## JEP 356: Enhanced Pseudo-Random Number Generators
A new `RandomGenerator` API was added by extending and refactoring legacy random APIs (`java.util.Random`).
You can inspect available Java 17 algorithms with the following code.

```java
RandomGeneratorFactory.all()
	.map(factory -> String.format("%s: %s", factory.group(), factory.name()))
	.sorted()
	.forEach(System.out::println);
```

```bash
LXM: L128X1024MixRandom
LXM: L128X128MixRandom
LXM: L128X256MixRandom
LXM: L32X64MixRandom
LXM: L64X1024MixRandom
LXM: L64X128MixRandom
LXM: L64X128StarStarRandom
LXM: L64X256MixRandom
Legacy: Random
Legacy: SecureRandom
Legacy: SplittableRandom
Xoroshiro: Xoroshiro128PlusPlus
Xoshiro: Xoshiro256PlusPlus
```

<br>

## JEP 382: New macOS Rendering Pipeline
This follows Apple's move from OpenGL to Metal rendering APIs.
The purpose is readiness for future macOS versions where OpenGL APIs may be removed.
It is not directly related to application code, but rendering in IDEs such as IntelliJ on macOS can improve.

<br>

## JEP 398: Deprecate the Applet API for Removal
`Applet` API was already marked `@Deprecated` since Java 9.
In this version, `forRemoval` is also set.
It may disappear in the next release.

```java
@Deprecated(since = "9", forRemoval = true)
@SuppressWarnings("removal")
public class Applet extends Panel {
	// ...
}
```

<br>

## JEP 403: Strongly Encapsulate JDK Internals
JDK strongly encapsulates all internal elements except critical internal APIs.
Reflection code like below no longer works.

```java
var ks = java.security.KeyStore.getInstance("jceks");
var f = ks.getClass().getDeclaredField("keyStoreSpi");
f.setAccessible(true);
```

<br>

## JEP 406: Pattern Matching for switch (Preview)
> This has existed since Java 14 and is still a preview feature.
> You need runtime options to execute it. (In IntelliJ, change Language Level.)

As in the example below, casting with `instanceof` becomes simpler.

```java
// AS-IS: old instanceof usage, explicit casting required.
if (o instanceof String) {
    String s = (String) str;
    // ... code that uses variable s
}

// TO-BE: no explicit cast, bind to variable 's'.
if (o instanceof String s) {
    // ... code that uses variable s
}
```

Handling `null` also gets simpler.

```java
// before
static void someMethod(String s) {
    if (s == null) {
        System.out.println("null!");
        return;
    }

    switch (s) {
        case "kim", "taeng" -> System.out.println("Hello~");
        default -> System.out.println("Wow!");
    }
}

// after
static void someMethod(String s) {
    switch (s) {
        case null -> System.out.println("null!");
        case "kim", "taeng" -> System.out.println("Hello~");
        default -> System.out.println("Wow!");
    }
}
```

You can also apply pattern matching directly in `switch`.
In the example below, parameter `o` matches `Long l`, so that branch executes.

```java
Object o = 123L;
String formatted = switch (o) {
    case Integer i -> String.format("int %d", i);
    case Long l -> String.format("long %d", l);
    case Double d -> String.format("double %f", d);
    case String s -> String.format("String %s", s);
    default -> o.toString();
};
```

<br>

## JEP 407: Remove RMI Activation
Some RMI features (`java.rmi.activation` package) were removed.

<br>

## JEP 409: Sealed Classes
Java reuses code through inheritance, but unrestricted inheritance can reduce readability.
So Java introduces a way to constrain inheritance.
As you can see in JEP specs, this is a new paradigm and relatively complex.
It was introduced as preview across multiple releases.

- <a href="https://openjdk.java.net/jeps/360" target="_blank" rel="nofollow">Proposed as Preview in JDK 15 (JEP 360)</a>
- <a href="https://openjdk.java.net/jeps/397" target="_blank" rel="nofollow">Revised as Second Preview in JDK 16 (JEP 397)</a>

The core idea is: "Limit which classes/interfaces can extend or implement this type."

Previously, Java already had one way to block inheritance: `final`.

```java
class Person {
}

// `Developer` cannot be extended.
final class Developer extends Person {
}

// `Designer` cannot be extended.
final class Designer extends Person {
}
```

Sealed classes are different.
They allow extension for specific subclasses and seal others.


```java
// `Person` can be extended only by permitted subclasses.
sealed class Person
    permits Developer, Designer {
}

// `Developer` is unsealed.
non-sealed class Developer extends Person {

}

// unsealed `Developer` can be extended again.
sealed class Student extends Developer 
    permits HighSchoolStudent, MiddleSchoolStudent {
    // this class can be extended only by `HighSchoolStudent` and `MiddleSchoolStudent`.
}

// permitted subclasses must choose one: final, sealed, or non-sealed.
final class HighSchoolStudent extends Student {

}

non-sealed class MiddleSchoolStudent extends Student {

}
```

Rules for sealed classes include:

- A sealed class and its permitted subclasses must belong to the same module or package.
- Every permitted subclass must extend the sealed class. Otherwise compilation fails.
- Every permitted subclass must declare whether to continue the sealing started by its superclass.
    - Use `final` to disallow further extension.
    - Use `non-sealed` to allow extension by other classes.
    - Or declare itself as `sealed`.

<br>

## JEP 410: Remove the Experimental AOT and JIT Compiler
AOT (Ahead-Of-Time) and JIT (Just-In-Time) experimental compiler modules were removed.
Targets are `jdk.aot`, `jdk.internal.vm.compiler`, and `jdk.internal.vm.compiler.management`.

<br>

## JEP 411: Deprecate the Security Manager for Removal
`java.lang.SecurityManager` and some related classes were marked with `@Deprecated(forRemoval=true)`.

<br><br>

# Others
From the previous post (<a href="/post/what-is-new-in-java-14" target="_blank">What features were added in Java 14?</a>),
some preview items became official.

## JEP 359: Records
`record` was finalized in Java 16 and became a permanent feature.

```java
record RecordPoint(int x, int y) {
    // cannot be inherited (final class)

    // each field is private final, immutable
    // x = 5;

    // what about serialize? add `@JsonProperty` on fields.

    // can contain static fields and methods
    static int MAX_LENGTH = 25;

    public static int getMaxLength() {
        return MAX_LENGTH;
    }
}

// usage? instantiate with `new`, same as class.
RecordPoint recordPoint = new RecordPoint(2, 3);

// getters are generated automatically.
recordPoint.x();
```

<br>

## JEP 378: Text Blocks
This became official in Java 15.
No more long string concatenation with `+` and `\n`.

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
    // indent was added in Java 12; it indents each line head by n spaces.
    System.out.println(html);
}
```

You can also map variables like below.

```java
String textBlock = """
        {
            "title": %s,
            "author": %s,
            "id": %d
        }
        """.formatted("hi", "taeng", 2);

System.out.println(textBlock);
```

Output:

```bash
{
  "title": hi,
  "author": taeng,
  "id": 2
}
```

<br><br>

# Closing
This LTS release raises strong expectations.
Personally, I like that Java keeps adding ways to write more concise code, such as pattern matching and records.
Text blocks in particular seem to resolve readability and maintainability pain points, as discussed in
<a href="/post/sql-management-when-using-spring-jdbc" target="_blank">"Managing SQL When Using Spring JDBC"</a>.

As noted last year, new technologies now appear and evolve faster than the pace of individual learning.
