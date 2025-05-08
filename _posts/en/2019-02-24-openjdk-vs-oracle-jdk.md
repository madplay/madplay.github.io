---
layout:   post
title:    "Java Licensing? OpenJDK vs Oracle JDK"
author:   Kimtaeng
tags: 	  java openjdk oraclejdk
description: Oracle's Java licensing changes and the differences between OpenJDK and Oracle JDK.
category: Java
comments: true
slug:     openjdk-vs-oracle-jdk
lang:     en
permalink: /en/post/openjdk-vs-oracle-jdk
---

# Java SE Subscription
On June 21, 2018, Oracle announced **Java SE Subscription**, a paid subscription model.
It includes licensing and technical support for desktop, server, and cloud use.
<a href="https://www.oracle.com/technetwork/java/javaseproducts/overview/index.html" target="_blank" rel="nofollow">
(Link: Oracle Java SE Subscription)</a>

For desktop use, the price is $2.50 per user per month.
In return you get licensing, upgrades, and support.

<br/>

# JDK Licensing?
First, recall that the JDK (Java Development Kit) is required to compile Java code.
The JVM runs Java programs, but the JDK is needed to produce bytecode.

Two JDK distributions appear in licensing discussions:
**Oracle JDK**, which is commercial, and **OpenJDK**, which is open source.
Oracle JDK is built from OpenJDK source.
Most features are identical, but some differences remain, such as font libraries.
Those differences have shrunk with newer versions.
<a href="https://stackoverflow.com/questions/22358071/differences-between-oracle-jdk-and-openjdk"
 target="_blank" rel="nofollow">Link: Stack Overflow - Differences between Oracle JDK and OpenJDK</a>

<div class="post_caption">In Oracle JDK 8, font files appear under jre/lib/fonts.</div> 

OpenJDK specifications are defined through the **Java Community Process (JCP)**.
<a href="https://ko.wikipedia.org/wiki/%EC%9E%90%EB%B0%94_%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0_%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4" target="_blank" rel="nofollow">
(Link: Wikipedia - Java Community Process)</a>

In other words, OpenJDK implements **Java Specification Requests (JSR)** defined by JCP.
Vendors like Oracle, Red Hat, and Azul build their own JVM distributions from that source.
They must pass **TCK (Technology Compatibility Kit)** certification.

<br/>

# So What Should You Do?
This is the real question.
I used Java at school and at home, and wondered whether I should switch to OpenJDK.
The download page said Java was free.
<a href="https://www.java.com/ko/download/faq/whatis_java.xml" target="_blank" rel="nofollow">
(Link: Oracle - What is Java?)</a>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-02-24-openjdk-vs-oracle-jdk-1.png" width="650" height="300" alt="whatisjava"/>
<div class="post_caption">Free, right?</div>

<br/>

It turns out Oracle JDK was never fully free.
It is free for personal use, but requires a paid license for commercial use.
This is common in other software as well.
Java the language is free, but the **JDK** has licensing constraints.

That said, you probably do not need to panic.
But support windows matter. For example, Oracle JDK 1.8 patches for personal use end in December 2020.
<a href="https://www.oracle.com/technetwork/java/java-se-support-roadmap.html" target="_blank" rel="nofollow">
(Link: Oracle - Java Support Roadmap)</a>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-02-24-openjdk-vs-oracle-jdk-2.png" width="650" height="300" alt="whatisjava"/>

Personal, non-commercial development should be fine.
But if you develop professionally, there is little reason to stick to Oracle JDK.
OpenJDK is already at 11 and beyond (and by 2019, even 13).
It is worth trying.
