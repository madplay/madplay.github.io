---
layout:   post
title:    Java Data Types
author:   madplay
tags: 	  java datatype
description: What data types does Java provide?
category: Java
comments: true
slug:     java-data-type
lang:     en
permalink: /en/post/java-data-type
---

# Java Data Types
In Java, the value range and representation depend on the variable type. Variable types fall into primitive and reference categories. Primitive variables store actual values, while reference variables store the address of an object.

Here are the details.

| Type | Range | Size (Bytes) |
| :---: | :---: | :---: |
| boolean | true, false | 1 |
| char | /u0000 ~ /uffff <br/>(0~2^-1, 0 ~ 65535) | 2 |
| byte | -128 ~ 126 | 1 |
| short	| -32768 ~ 32767 <br/> (-2^15 ~ 2^15 -1) | 2 |
| int | -2147483648 ~ 2147483647 <br/> ( -2^31 ~ 2^31 -1) | 4
| long | -9223372036854775808 ~ 9223372036854775807 <br/> (-2^63 ~ 2^63 -1) | 8
| float | 1.4E-45 ~ 3.4028235E38 | 4 |
| double | 4.9E-324 ~ 1.7976931348623157E308 | 8 |

Reference types include every type except primitives and store object addresses.<br/>
Create and initialize objects with the `new` keyword.<br/>
		
For example:

```java
ClassName referenceName = new ClassName(); 
/* MadPlay instance = new MadPlay(); */		
```

<br/>

# String Class Characteristics
The `String` class is a reference type but supports a literal form such as `String str = "madplay";`.
Since `String` is a reference type, `String str = new String("madplay");` also works, but it uses a different memory location.

- <a href="/en/post/java-string-literal-vs-string-object" target="_blank">
Reference Link: What is the difference between Java String literals and String objects?</a>

Java defines eight primitive data types, but reference types are unlimited because developers can define their own.
