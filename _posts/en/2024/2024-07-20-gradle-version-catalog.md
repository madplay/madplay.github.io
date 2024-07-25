---
layout: post
title: "Managing Dependencies in One Place with Gradle Version Catalog"
author: madplay
tags: gradle version-catalog toml dependency-management kotlin
description: "Covers the TOML structure of Gradle Version Catalog, type-safe accessor usage, and migration strategies for existing projects."
category: Backend
date: "2024-07-20 23:14:21"
comments: true
lang: en
slug: gradle-version-catalog
permalink: /en/post/gradle-version-catalog
---

# The Version Problem in Multi-Module Projects

When a project has only three or four modules, hardcoding version strings directly in each `build.gradle.kts` is manageable.
Once the module count exceeds ten, things get painful fast.
Upgrading Spring Boot from 3.3 to 3.4 means hunting through every module to find where each version string lives.
Gradle's Version Catalog addresses this by consolidating all version strings into a single file.

If you are familiar with <a href="/en/post/what-is-gradle" target="_blank">Gradle fundamentals</a>,
you might think of `ext` blocks or `buildSrc`. The `ext` block declares variables in the root `build.gradle.kts` and lets submodules reference them,
but it is string-based, so IDE autocompletion does not work and typos slip through to runtime instead of compile time.
`buildSrc` provides type safety, but every dependency addition requires editing a Kotlin file,
and any change triggers a full recompilation of `buildSrc`, invalidating the build cache.

Version Catalog declares versions in a single TOML file, and Gradle auto-generates type-safe accessors from it.
It combines the convenience of `ext` with the type safety of `buildSrc`.

<br>

# What Is a Version Catalog?

A Version Catalog is a Gradle feature that lets you declare all libraries, plugins, and version information in one file.
Gradle then auto-generates type-safe accessors based on those declarations.

The core idea is to make version information exist in exactly one place.
Individual `build.gradle.kts` files no longer contain version strings. Instead, they use generated accessors like `libs.spring.boot.starter.web`.
When you need to bump a version, you edit the catalog file once and every module picks up the change.

Compared to previous approaches, the separation is clear.
The `ext` block lives inside `build.gradle.kts`, and `buildSrc` wraps versions in Kotlin code.
Version Catalog uses TOML, a standalone declarative file format.
Because the build script and version information are physically separated, version changes do not affect build logic.

<br>

# Structure of libs.versions.toml

The default Version Catalog file is `gradle/libs.versions.toml` at the project root.
TOML is a configuration file format built on key-value pairs and sections, with simpler syntax than YAML or JSON.
Gradle automatically recognizes a TOML file at this path, so no additional configuration is needed.
The file has four sections.

> The code in this post targets Gradle 8.x with Kotlin DSL. Version Catalog was introduced as an experimental feature in Gradle 7.0 and stabilized in 7.4.

```toml
[versions]
spring-boot = "3.4.1"
kotlin = "2.1.0"
jackson = "2.18.2"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test", version.ref = "spring-boot" }
jackson-module-kotlin = { module = "com.fasterxml.jackson.module:jackson-module-kotlin", version.ref = "jackson" }
kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib", version.ref = "kotlin" }

[bundles]
spring-web = ["spring-boot-starter-web", "jackson-module-kotlin", "kotlin-stdlib"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
```

`[versions]` declares reusable version strings. `[libraries]` maps library coordinates (group:artifact) to versions.
`[bundles]` groups multiple libraries so you can add them as a single dependency. `[plugins]` manages Gradle plugin versions.

## Library Declaration Formats

Besides the `module` + `version.ref` format shown above, two other notations are available.

Specifying the version directly on `module` is concise when a library has its own independent version.

```toml
guava = { module = "com.google.guava:guava", version = "33.4.0-jre" }
```

You can also split `group`, `name`, and `version.ref` into separate fields, but this makes lines longer and is rarely used in practice.

```toml
jackson-module-kotlin = { group = "com.fasterxml.jackson.module", name = "jackson-module-kotlin", version.ref = "jackson" }
```

<br>

# Using the Catalog in build.gradle.kts

Declarations in the TOML file are accessed through a catalog object named `libs`.
Type `libs.` in the IDE and the autocompletion list appears, eliminating typo risks when adding dependencies.

```kotlin
plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
}

dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.kotlin.stdlib)
    testImplementation(libs.spring.boot.starter.test)
}
```

In the `plugins` block, use the `alias()` function to reference catalog plugins.
In the `dependencies` block, append the name declared in the TOML file after `libs.`.

## How Hyphens and Dots Map to Accessor Names

Hyphens (`-`) and dots (`.`) in TOML library keys are both converted to dots (`.`) in Kotlin accessors.
For example, declaring `spring-boot-starter-web` in TOML gives you `libs.spring.boot.starter.web` in code.
Underscores (`_`) are preserved as-is, so use hyphens or dots to create hierarchy and underscores to keep words together.

```text
TOML Key                         → Kotlin Accessor
spring-boot-starter-web          → libs.spring.boot.starter.web
jackson-module-kotlin            → libs.jackson.module.kotlin
kotlin_stdlib                    → libs.kotlinStdlib
```

<br>

# What Changes When You Bundle Dependencies?

Bundles group frequently co-used libraries under a single name.
The `spring-web` bundle declared earlier in the TOML file is used like this in `build.gradle.kts`:

```kotlin
dependencies {
    implementation(libs.bundles.spring.web)
}
```

This single line adds all three libraries: `spring-boot-starter-web`, `jackson-module-kotlin`, and `kotlin-stdlib`.
No more repeating the same dependency set across every module.

Bundles do have limitations, though. If you need to apply `exclude` to a specific library within a bundle, you have to unpack it and declare each dependency individually.
Use bundles when "these libraries always go together" is unambiguous.
For fine-grained dependency control, individual declarations are a better fit.

<br>

# Managing Plugin Versions Through the Catalog

When plugin versions are scattered across `build.gradle.kts` files, you run into the same problem as with library versions.
Declaring plugin IDs and versions in the `[plugins]` section lets you reference them with `alias()` in the `plugins` block.

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
```

As covered in <a href="/en/post/the-structure-of-the-gradle-project" target="_blank">Gradle project structure</a>,
the `pluginManagement` block in `settings.gradle.kts` specifies plugin repositories.
Combined with the Version Catalog `[plugins]` section, both plugin repositories and versions are managed centrally.

One caveat: catalog accessors are not available in the `plugins` block of `settings.gradle.kts`.
The catalog is created after `settings.gradle.kts` finishes evaluation.
If you need to apply a plugin in `settings.gradle.kts`, you must specify the version directly.

<br>

# Migrating an Existing Project to Version Catalog

When adopting Version Catalog in a project already in production, an incremental approach is the safest path.

## Step-by-Step Migration Strategy

The first step is to create `gradle/libs.versions.toml` and transfer the library and plugin versions currently used in the project.
Do not modify any `build.gradle.kts` files at this point. Verify that the build succeeds with only the TOML file added.

The second step is to replace hardcoded version strings in `build.gradle.kts` with catalog accessors.
Migrate one module at a time and run the build after each change. Changing all modules at once makes it hard to pinpoint the root cause when something breaks.

The third step is to remove `ext` blocks or `buildSrc` version constants that are no longer needed.
Following this order lets you narrow down the cause quickly if a build breaks along the way.

## How Does It Relate to buildSrc?

As mentioned at the beginning, `buildSrc` is type-safe but carries the cost of full recompilation and cache invalidation on every change.
Version Catalog is purpose-built for version declarations: you only edit a TOML file, and the impact on the build cache is minimal.

The two are not mutually exclusive. You can manage build logic with convention plugins in `buildSrc` while extracting version information into a TOML file.
If all you need is version management, Version Catalog alone is sufficient. If you also need build logic reuse, combining it with `buildSrc` works well.

<br>

# Caveats and Limitations

Version Catalog has a few constraints worth noting.

It is not available in Gradle versions below 7.0. If your Gradle Wrapper version is outdated, you need to upgrade first.

When a TOML syntax error occurs, Gradle's error messages can be somewhat vague.
Missing quotes or using spaces instead of commas are common culprits.

When creating additional catalogs, avoid the name `libs`. It is already reserved for the default catalog.

Version Catalog works alongside frameworks like Spring Boot that use a BOM (Bill of Materials).
For libraries managed by the BOM, omit the `version` in TOML and declare only the coordinates.

```toml
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
```

<br>

# Wrapping Up

Dependency version management in the Gradle ecosystem has evolved from `ext` blocks to `buildSrc` to Version Catalog.
`ext` is simple but lacks type safety. `buildSrc` is type-safe but carries significant build cache costs.
Version Catalog solves both problems with a single TOML file while keeping the adoption cost low.

For new projects, creating `gradle/libs.versions.toml` from day one is a good practice.
For existing projects, migrating one module at a time gives the team room to adapt to the new workflow.
What ultimately matters is the principle of "version information exists in exactly one place," and Version Catalog is arguably the lowest-cost way to achieve it.
