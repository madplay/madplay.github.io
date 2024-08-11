---
layout: post
title: "Gradle Build Performance Tuning: From 5 Minutes Down to 2"
author: madplay
tags: gradle build-performance configuration-cache build-scan parallel
description: "Find Gradle build bottlenecks with Build Scan, then cut build time in half using parallel execution and caching strategies."
category: Backend
date: "2024-08-10 21:22:51"
comments: true
lang: en
slug: gradle-build-performance-tuning
permalink: /en/post/gradle-build-performance-tuning
---

# You Know Your Build Is Slow, but You Don't Know Where

You can feel that your build is slow, but it is hard to tell whether the bottleneck is in compilation, testing, or the configuration phase.
Each Gradle performance option addresses a different type of bottleneck, so identifying the root cause comes first.

> The examples in this post target Gradle 8.x. Most settings also work on Gradle 7.x, but Configuration Cache is stable only on Gradle 8.1 and above.

<br>

# Finding Bottlenecks with Build Scan

Improving build performance starts with measurement. Gradle can generate a build profiling report using the `--scan` option.

```bash
./gradlew build --scan
```

After the build finishes, a URL appears in the output. Open this link in a browser to access the Gradle Build Scan dashboard.

## How to Spot Bottlenecks in the Timeline View

The Timeline tab in Build Scan visualizes when each task started and how long it took.
If one bar stretches noticeably longer than the rest, that is your bottleneck. Common patterns include the following.

**A single compilation task consumes more than half the total build time.** Inter-module dependencies likely prevent parallel execution.
Review the module dependency graph and remove unnecessary dependencies to unlock parallelism.

**Test tasks take an unreasonably long time.** Slow integration tests may be bundled into the same task as unit tests.
Splitting `test` and `integrationTest` reduces unnecessary waiting during local builds.

**The Configuration phase takes several seconds or more.** This is the kind of problem that Configuration Cache, covered later in this post, can solve.

<br>

# Reducing Multi-Module Build Time with Parallel Execution

By default, Gradle executes tasks sequentially.
In multi-module projects, tasks from modules that do not depend on each other can run concurrently.

```properties
# gradle.properties
org.gradle.parallel=true
```

This single line tells Gradle to analyze inter-module dependencies and execute independent module tasks in parallel.

## Which Projects Benefit the Most?

The impact of parallel execution depends on the shape of the module dependency graph.
A linear chain like `:app` → `:domain` → `:infrastructure` still requires sequential execution, so the gains are limited.
On the other hand, if `:api`, `:batch`, and `:admin` each depend only on `:domain` in a fan-out structure,
all three modules compile concurrently, reducing build time significantly.

Gradle creates workers equal to the number of CPU cores by default. In environments like CI where resources are shared, you can adjust this with `org.gradle.workers.max`.

<br>

# Configuration Cache

A Gradle build consists of three major phases: Initialization → Configuration → Execution.
During the Configuration phase, Gradle evaluates every `build.gradle.kts` file to construct the task graph.
In projects with dozens of modules, this step alone can take several seconds.

The problem is that Gradle repeats the Configuration phase from scratch on every build, even when the build scripts have not changed.
Configuration Cache solves this by caching the result of the Configuration phase and reusing the cached task graph when scripts remain unchanged.

```properties
# gradle.properties
org.gradle.configuration-cache=true
```

## How Much Faster Does It Get?

If the Configuration phase accounts for 10-20% of total build time, a cache hit eliminates that portion entirely.
The more modules you have, the greater the savings. Projects with fewer than five modules may not see a noticeable difference.

## Handling Incompatible Plugins

Enabling Configuration Cache can trigger compatibility warnings or errors from some plugins.
This happens because accessing APIs like `Task.project` at runtime makes serialization impossible.

When first adopting Configuration Cache, you can use the following option to flag problematic areas as warnings and address them incrementally.

```properties
# gradle.properties
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn
```

You can check plugin compatibility in the Configuration Cache section of the official Gradle documentation.
Most major plugins have achieved compatibility in their latest versions.

## buildSrc and Configuration Cache

As discussed in the <a href="/en/post/gradle-version-catalog" target="_blank">Version Catalog post</a>,
any change to `buildSrc` invalidates the entire build cache.
Configuration Cache behaves the same way: changes to `buildSrc` invalidate the cache.
Moving version management from `buildSrc` to Version Catalog (TOML) mitigates this issue.

<br>

# Build Cache

Build Cache reuses previous task outputs when the inputs (source files, dependencies, compiler options, etc.) are identical.
While Configuration Cache caches the Configuration phase, Build Cache caches individual task results from the Execution phase.

```properties
# gradle.properties
org.gradle.caching=true
```

## Local Cache and Remote Cache

The local Build Cache is stored in `~/.gradle/caches/build-cache-1/`.
It is effective when you switch between branches on the same machine.
After working on a feature branch and switching back to `main`, Gradle can reuse previously cached task results.

## Common Causes of Cache Invalidation

The effectiveness of Build Cache depends on the cache hit rate.
If the hit rate is low, check the following items.

**Absolute path references.** When build scripts or tasks use absolute paths, the paths differ across machines, preventing cache reuse.
Gradle supports path normalization with relative paths, so use project-root-relative paths whenever possible.

**Embedded timestamps.** Injecting build timestamps into source code changes the inputs on every build, invalidating the cache.
Inject build numbers and timestamps only during the final packaging step.

**Non-deterministic tasks.** Tasks that produce different outputs for the same inputs defeat the purpose of caching.
A common example is code generation tools that do not guarantee output ordering.

<br>

# Daemon and JVM Tuning

## Gradle Daemon

The Gradle Daemon keeps the JVM process alive after a build completes, saving JVM startup time for subsequent builds.
In local development environments, the Daemon has been enabled by default since Gradle 3.0, so no additional configuration is needed.

CI environments may be different.
If the CI spins up a fresh container for every build, the Daemon never gets reused, adding only startup overhead.
In such environments, disabling the Daemon can be the better choice.

```properties
# gradle.properties for CI
org.gradle.daemon=false
```

## JVM Memory Settings

Gradle builds run on the JVM, so heap memory settings directly affect build performance.

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC
```

The default heap size is 512MB, which can be insufficient for projects with many modules or heavy annotation processing.
If you encounter `OutOfMemoryError` or notice extended GC pauses, increasing the heap is worth trying.

That said, blindly increasing heap size is not always the answer. Since the Daemon process stays resident, allocating excessive memory can affect other tasks on your local machine.
Check GC time and heap usage in the "Performance" tab of Build Scan, and adjust only when the data confirms an actual memory shortage.

<br>

# Consolidating Everything in gradle.properties

Here is what the settings covered in this post look like when consolidated in the project root's `gradle.properties`.

```properties
# gradle.properties

# Parallel execution
org.gradle.parallel=true

# Configuration Cache
org.gradle.configuration-cache=true

# Build Cache
org.gradle.caching=true

# JVM tuning
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC

# File system watching (default since Gradle 7.0)
org.gradle.vfs.watch=true
```

Committing this file to the project ensures that every team member uses the same build options.
If individuals want different values, they can override them in `~/.gradle/gradle.properties`.

<br>

# Looking Back

What matters more than turning on every option is reading your own project's build profile first.
Parallel execution varies by module structure, Configuration Cache varies by configuration phase cost, and Build Cache varies by how often you run repeated builds.
Running Build Scan once is, I think, the best starting point for any tuning effort.
