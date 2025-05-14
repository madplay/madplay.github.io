---
layout:   post
title:    "Fixing IntelliJ Error: source release 8 requires target release 1.8"
author:   Kimtaeng
tags: 	  intellij error jdk maven
description: "Fix the IntelliJ error: Error:java: javacTask: source release 8 requires target release 1.8."
category: Knowledge
comments: true
slug:     intellij-error-source-release-8-requires-target-release-1-8
lang:     en
permalink: /en/post/intellij-error-source-release-8-requires-target-release-1-8
---

# What Is This Error?
When running code in IntelliJ IDEA, you may see this message:

<div class="post_caption">Error:java: javacTask: source release 8 requires target release 1.8</div>

It indicates a mismatch between the source level and the target bytecode level.
The fix is straightforward.

<br/>

# Fix
Update IntelliJ settings. On macOS, follow this path and set the module target bytecode.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-1.png" width="700" height="600" alt="intellij settings"/>

<br/>

# Maven Fix
If you use Maven, add compiler settings in `pom.xml` instead of changing IDE settings.

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

<br/>

# Closing Notes
IntelliJ lets you set **Project SDK** and **Language Level** at the project level.
You can also set them per module.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-2.png" width="800" height="400" alt="intellij project settings"/>
<div class="post_caption">Project SDK (left) and per-module SDK/Language Level (right)</div>

Even if the compiler level is set to Java 8, compilation still fails
when the Language Level is lower than the target bytecode level.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-3.png" width="600" height="400" alt="not supported source version"/>

<div class="post_caption">java: try-with-resources is not supported in -source 1.5
(use -source 7 or higher to enable try-with-resources)</div>
