---
layout:   post
title:    Java String replaceAll Method $(Dollar Sign) Issue
author:   madplay
tags: 	  Java String Replacement
description: Issues you may encounter when using String replaceAll method in Java
category: Java/Kotlin
comments: true
slug:     java-string-replace-problem-with-dollar-sign
lang:     en
permalink: /en/post/java-string-replace-problem-with-dollar-sign
---

# Replacing Patterns Within Specific Strings in Java

In Java language, you can simply replace specific strings within strings as shown below.
For reference, in Java version 1.5 and above, String's replace method, which was limited to single characters,
was changed to also apply to string sequences.

```java
public class MadLife {
    private static final String SOURCE_STRING = "boy";
    private static final String REPLACEMENT_STRING = "girl";
    public void runCode() {
        String sourceStr = String.format("I am a %s", SOURCE_STRING);
        sourceStr = sourceStr.replace(SOURCE_STRING, REPLACEMENT_STRING);
        System.out.print(sourceStr); // I am a girl
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```

There's also a replaceAll method besides the replace method, and the difference between the two methods is as follows.
```java
/* String sequence */
public String replace(CharSequence target, CharSequence replacement)

/* Regular expressions can be input */
public String replaceAll(String regex, String replacement) 
```

Comparing the differences between the two methods:
```java
public class MadLife {
    public void runCode() {
        String sourceStr = "abc";
        String replaceResult = sourceStr.replace("a.b?", "DEF");
        String replaceAllResult = sourceStr.replaceAll("a.b?", "DEF");

        System.out.println("replaceResult : " + replaceResult);
        System.out.println("replaceAllResult : " + replaceAllResult);
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```


The execution result of the above code is as follows.
```
replaceResult : abc
replaceAllResult : DEFc
```

In the case of replace, the first parameter is recognized as a simple string, but in the second replaceAll case, the first parameter is recognized as a regular expression, not a simple string.
<a href="https://regex101.com/" rel="nofollow" target="_blank">Regular Expression Test (Link)</a>

<br/>


# Issues You May Encounter When Using replaceAll Method

On the other hand, if you use the replaceAll method as shown in the code below, you may encounter error logs.
```java
public class MadLife {
    private static final String SOURCE_STRING = "<MONEY>";
    private static final String REPLACEMENT_STRING = "$25";
    public void runCode() {
        String sourceStr = String.format("I have %s", SOURCE_STRING);
        sourceStr = sourceStr.replaceAll(SOURCE_STRING, REPLACEMENT_STRING);
        System.out.print(sourceStr); // expect "I have $25"
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```
```java
Exception in thread "main" java.lang.IndexOutOfBoundsException: No group 2
	at java.util.regex.Matcher.start(Matcher.java:374)
	at java.util.regex.Matcher.appendReplacement(Matcher.java:831)
	at java.util.regex.Matcher.replaceAll(Matcher.java:906)
	at java.lang.String.replaceAll(String.java:2162)
```

The cause of the error is the dollar sign. Java API Docs explains it as follows.

<div class="post_caption">Note that backslashes (\) and dollar signs ($) in the replacement string may cause the results
to be different than if it were being treated as a literal replacement string; see Matcher.replaceAll.
Use Matcher.quoteReplacement(java.lang.String) to suppress the special meaning of these characters, if desired.</div>

<br/>

The solution is to change sourceStr, the second parameter of the replaceAll method, once with the ```quoteReplacement``` method
and then put it in.

```java
// static method
java.util.regex.Matcher.quoteReplacement(REPLACEMENT_STRING);
```

The entire source code is changed as follows.

```java
// static import
import static java.util.regex.Matcher.quoteReplacement;

public class MadLife {
    private static final String SOURCE_STRING = "<MONEY>";
    private static final String REPLACEMENT_STRING = "$25";
    public void runCode() {
        String sourceStr = String.format("I have %s", SOURCE_STRING);
        sourceStr = sourceStr.replaceAll(SOURCE_STRING, quoteReplacement(REPLACEMENT_STRING));
        System.out.print(sourceStr); // "I have $25"
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```

If you definitely need a dollar sign, you can also use it as follows.
```java
import static java.util.regex.Matcher.quoteReplacement;

public class MadLife {
    public void runCode() {
        String sourceStr1 = "Hello#";
        // Okay
        sourceStr1 = sourceStr1.replaceAll("#", "\\$");
        System.out.println("sourceStr 1 : " + sourceStr1);

        String sourceStr2 = "Hello#";
        // Okay
        sourceStr2 = sourceStr2.replaceAll("#", quoteReplacement("$"));
        System.out.println("sourceStr 2 : " + sourceStr2);

        String sourceStr3 = "Hello#";
        // StringIndexOutOfBoundsException
        sourceStr3 = sourceStr3.replaceAll("#", "$");
        System.out.println("sourceStr 3 : " + sourceStr3);
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```
