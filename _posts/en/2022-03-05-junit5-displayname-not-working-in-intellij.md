---
layout:   post
title:    "Fixing JUnit5 @DisplayName Not Working in IntelliJ"
author:   Kimtaeng
tags:    intelliJ junit5
description: "How to fix cases where IntelliJ IDEA does not display labels declared with JUnit5 @DisplayName"
category: Knowledge
date: "2022-03-05 21:33:51"
comments: true
slug:     junit5-displayname-not-working-in-intellij
lang:     en
permalink: /en/post/junit5-displayname-not-working-in-intellij
---

# `@DisplayName` Annotation
In JUnit5, `@DisplayName` lets you add names or descriptions to a test class and each test method.

```java
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("It can be declared on a class.")
class FooClass {
	@Test
	@DisplayName("It can be declared on a method.")
	void barMethod() {
		System.out.println("barMethod");
	}
}
```

When you run this code, the names declared in `@DisplayName` appear as shown below. This makes tests easier to identify.
~~Of course, you can also use Korean method names...~~

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_normal-execution-result.png" width="650" alt="normal-execution-result"/>

<br>

# What If It Does Not Work?
Even with `@DisplayName`, it may not appear in the test results as shown below.
This happens because tests run with IntelliJ's default test runner setting, `Gradle`.
You can also infer this from the logs printed during test execution.

> The default changed starting from version 2019.2. See the note at the end for details.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_not-showing-display-name.png" width="700" alt="not-showing-display-name"/>

<br>

# How to Fix It
> The screenshot is based on IntelliJ 2021.2, but this option is similar in other versions.

The fix is simple. Open `Preferences` → `Build, Execution, Deployment` → `Build Tools` → `Gradle`, then change
`Run tests using` to IntelliJ IDEA as shown below. In short, switch the default test runner.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_set-gradle-options.png" width="800" alt="set-gradle-options"/>

Additionally, for faster local build and run performance, you can also change `Build and run using` from Gradle to IntelliJ IDEA.

<br>

# Why Did It Change?
The official guide for IntelliJ IDEA 2019.2 explains this change as follows.

<div class="post_comments">
IntelliJ IDEA uses Gradle as a default test runner.
As an outcome, you get the same test results on the continuous integration (CI) server.
Also, tests that are run in the command line will always work in the IDE.
</div>

_"IntelliJ IDEA uses Gradle as the default test runner. As a result, you get the same test results on a CI server.
Also, tests that run on the command line always work in the IDE."_

This default appears to prevent a common issue where code works in a local environment but fails during deployment.

- <a href="https://www.jetbrains.com/help/idea/2019.2/work-with-tests-in-gradle.html#configure_gradle_test_runner" target="_blank" rel="nofollow">
IntelliJ IDEA 2019.2 Guide</a>
