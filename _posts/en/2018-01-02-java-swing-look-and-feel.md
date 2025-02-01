---
layout:   post
title:    Java Swing LookAndFeel
author:   Kimtaeng
tags: 	  java swing lookandfeel
description: Customize Swing UI with LookAndFeel.
category: Java
comments: true
slug:     java-swing-look-and-feel
lang:     en
permalink: /en/post/java-swing-look-and-feel
---

# What Is Swing in Java?
Swing is the Java library for building GUIs.
Since `JDK 1.2`, it supports Java's "Write Once, Run Everywhere (WORE)" goal.

To render consistently across environments, Swing reduces system dependency and draws components in Java. That uniform rendering also hides the native look of each system.

<br/><br/>

# What Is LookAndFeel?
LookAndFeel addresses the loss of native appearance caused by uniform rendering.
LookAndFeel changes the UI appearance of the entire program.

Here is a simple Swing UI with a Button and Label:

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-1.jpeg"
width="280" alt="Swing Default"/>

<br/>

<div class="post_caption">"Apply LookAndFeel to the UI above."</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-2.jpeg" 
width="280" alt="LookAndFeel Applied"/>

<br/>

The components are small, so the change is subtle. The next example uses a blog post ranking search program built for a Naver blog.

Here is the default Swing style. When functionality is the priority, Swing is still usable.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-3.jpeg"
width="700" alt="MadSearch Default"/>

<br/>

<div class="post_caption">"Nimbus Style"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-4.jpeg"
width="700" alt="MadSearch Nimbus"/>

<br/>

<div class="post_caption">"Liquid Style"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-5.jpeg"
width="700" alt="MadSearch Liquid"/>

<br/>

<div class="post_caption">"Windows Style"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-6.jpeg"
width="700" alt="MadSearch Windows"/>

<br/>

LookAndFeel changes only the UI design, but the overall feel shifts more than expected.

<br/>

# How to Use LookAndFeel

Usage is straightforward: `UIManager.setLookAndFeel("class name or path")`.
Exception handling is required because `ClassNotFoundException` can occur if the path is invalid.

```java
try {
    UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
} catch (Exception e) {
    /*
        ClassNotFoundException
        InstantiationException
        IllegalAccessException
        UnsupportedLookAndFeelException
     */
}
```

In the past, portal searches listed many LookAndFeel themes, but most links have disappeared.
The official Java guide still lists several themes.

- <a href="https://docs.oracle.com/javase/tutorial/uiswing/lookandfeel/index.html" rel="nofollow" target="_blank">
Link: Java Documentation</a>
