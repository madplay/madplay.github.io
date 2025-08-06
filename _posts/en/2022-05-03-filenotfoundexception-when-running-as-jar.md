---
layout:   post
title:    "FileNotFoundException When Running as a JAR"
author:   Kimtaeng
tags:    java jar filenotfoundexception
description: "Cases where FileNotFoundException occurs when running a Java application as a JAR"
category: Java
date: "2022-05-03 01:21:55"
comments: true
slug:     filenotfoundexception-when-running-as-jar
lang:     en
permalink: /en/post/filenotfoundexception-when-running-as-jar
---

File I/O logic that works in local IDE environments such as IntelliJ or Eclipse can fail in a packaged JAR with
`FileNotFoundException`.

You can fix it by changing the code as follows.

### Before
```java
File file = new ClassPathResource("file path").getFile()
```

### After
```java
InputStream inputStream = new ClassPathResource("file path").getInputStream()
File file = File.createTempFile("file name", "extension");

// Copy the stream content into the file.
// `copyInputStreamToFile` is included in commons-io.
FileUtils.copyInputStreamToFile(inputStream, file);

// Or use NIO.
Files.copy(inputStream, file.toPath());

// Add this option when the target file already exists.
Files.copy(inputStream, file.toPath(), StandardCopyOption.REPLACE_EXISTING);
```

The root cause is an execution-environment difference. You can confirm this quickly by printing the path from
`ClassPathResource`, an implementation of Java's `Resource` interface.

```java
// Running in local environment
ClassPathResource classPathResource = new ClassPathResource("file path");

// The output differs between IDE execution and JAR execution.
System.out.println("URL: " + classPathResource.getURL());
```

In local execution, the URL starts with `file:`. In JAR execution, it returns a URL with `jar:`.
