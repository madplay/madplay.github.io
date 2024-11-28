---
layout: post
title: "Spring Boot 2 to 3 Migration Checklist: Breaking Changes You Must Address"
author: madplay
tags: spring springboot java migration jakarta hibernate
description: "Upgrading to Spring Boot 3 breaks your build immediately. Here are the compile-time breaking changes and how to fix each one."
category: Spring
date: "2024-11-23 22:41:55"
comments: true
lang: en
slug: spring-boot-2-to-3-migration-checklist
permalink: /en/post/spring-boot-2-to-3-migration-checklist
---

# Why You Need to Upgrade, and Why It Hurts

Spring Boot 3 is a major platform shift: Java 17 baseline, Jakarta EE 9+ namespace, and GraalVM native image support,
all rolled into a single release.
Spring Boot 2.7 reached end of OSS support in November 2023. If you want continued security patches, 3.x is the only path forward.
That said, this is a major version with plenty of build-breaking changes, and the gap between deciding to upgrade and actually completing it can be significant.

> This post is based on the Spring Boot 3.4 GA (2024-11-21) release.

<br>

# Breaking Changes That Kill Your Build

## javax to jakarta

The first thing that breaks when upgrading to Spring Boot 3 is the `javax.*` package.
Jakarta EE 9 renamed packages from `javax.*` to `jakarta.*`, and Spring Boot 3 uses this new namespace.
Every `javax` import across your project, including `@Entity`, `HttpServletRequest`, and `@NotNull`, triggers a compile error.

A global find-and-replace in your IDE for patterns like `javax.persistence` to `jakarta.persistence` resolves most cases.
However, packages that belong to Java SE, such as `javax.crypto` and `javax.net.ssl`, remain unchanged.
Only replace Jakarta EE packages: `javax.persistence`, `javax.servlet`, `javax.validation`, `javax.annotation`, and so on.

If a third-party library internally references `javax.*`, you get a `ClassNotFoundException` at runtime.
Inspect your dependency tree (`./gradlew dependencies`) to identify any libraries still using `javax`.

Gradle dependencies change as well. For example, Jakarta-related dependencies that previously looked like this:

```groovy
// Spring Boot 2.x
implementation 'javax.validation:validation-api'
implementation 'javax.persistence:javax.persistence-api'
```

In Spring Boot 3, they switch to the `jakarta` namespace. The Spring Boot BOM manages versions, so you do not need to specify them explicitly.

```groovy
// Spring Boot 3.x
implementation 'jakarta.validation:jakarta.validation-api'
implementation 'jakarta.persistence:jakarta.persistence-api'
```

<br>

## Spring Security Configuration Changes

`WebSecurityConfigurerAdapter` was deprecated in Spring Security 5.7 and fully removed in Spring Boot 3 (Spring Security 6).
The pattern of extending this adapter and overriding `configure` methods no longer works.

```java
// Before (Spring Boot 2.x)
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .antMatchers("/api/articles/**").authenticated()
            .anyRequest().permitAll()
            .and()
            .httpBasic();
    }
}
```

Spring Boot 3 uses a component-based approach where you register a `SecurityFilterChain` as a bean.
The method chaining API also transitions to the lambda DSL.

```java
// After (Spring Boot 3.x)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/articles/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
```

Note the method name changes: `authorizeRequests()` becomes `authorizeHttpRequests()`, and `antMatchers()` becomes `requestMatchers()`.
If you only remove the adapter inheritance without updating the method names, the code compiles but may behave unexpectedly at runtime.

<br>

## Property Key Changes

Spring Boot 3 renames a significant number of configuration property keys.
In particular, `spring.redis.*` to `spring.data.redis.*` affects virtually every project that uses Redis.

Here are the key changes:

| Before (2.x) | After (3.x) |
|---|---|
| `spring.redis.*` | `spring.data.redis.*` |
| `spring.data.cassandra.*` | `spring.cassandra.*` |
| `spring.jpa.hibernate.use-new-id-generator-mappings` | Removed (see Hibernate 6 ID strategy section below) |
| `server.max-http-header-size` | `server.max-http-request-header-size` |
| `spring.security.saml2.relyingparty` | Restructured |

With so many changed keys, manually tracking them down is error-prone.
Adding `spring-boot-properties-migrator` as a runtime dependency detects deprecated properties at startup and logs warnings.

```groovy
// Remove after migration is complete
runtimeOnly 'org.springframework.boot:spring-boot-properties-migrator'
```

This library also auto-maps old properties to new keys, but it is strictly a transitional tool.
Remove it from your dependencies once migration is complete. Beyond the runtime overhead,
leaving it in place can mask problems by silently keeping old properties functional.

<br>

## Trailing Slash Matching Disabled by Default

In Spring Boot 2, `/api/articles` and `/api/articles/` both matched the same controller method.
Spring Boot 3 (Spring Framework 6) disables trailing slash matching by default.
Requests to `/api/articles/` now return a 404.

This is particularly problematic because API gateways and proxies often append trailing slashes automatically.
When you start getting 404s without changing any backend code, the root cause can be difficult to trace.

There are three approaches to handle this.

First, explicitly declare both paths in the controller.

```java
@GetMapping({"/api/articles", "/api/articles/"})
public List<Article> getArticles() {
    // ...
}
```

Second, add a redirect rule at the proxy or gateway level to strip trailing slashes.

Third, use a servlet filter to strip trailing slashes globally.

```java
@Bean
public FilterRegistrationBean<UrlHandlerFilter> trailingSlashFilter() {
    FilterRegistrationBean<UrlHandlerFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(UrlHandlerFilter.trailingSlashHandler("/api/**").redirect());
    registration.addUrlPatterns("/api/*");
    return registration;
}
```

`UrlHandlerFilter` was introduced in Spring Framework 6.2 (Spring Boot 3.2).
If you are on Boot 3.0 or 3.1, you need to implement a custom servlet filter.

Regardless of which approach you choose, verify first whether existing API clients send requests with trailing slashes.

<br>

## HttpMethod Changed from enum to class

Up through Spring Framework 5, `HttpMethod` was a Java enum.
Spring Framework 6 converts it to a regular class.
As an enum, it could not represent WebDAV extension methods like `LOCK` or `COPY`, requiring workarounds.
As a class, you can freely create arbitrary HTTP methods.

Code that uses constants like `HttpMethod.GET` remains compatible in most cases. However, `switch` statements that branch on `HttpMethod` produce compile errors because a non-enum type cannot be used as a `case` label.

```java
// Before (Spring Boot 2.x) - switch works because HttpMethod is an enum
switch (httpMethod) {
    case GET:
        // ...
        break;
    case POST:
        // ...
        break;
}
```

```java
// After (Spring Boot 3.x) - convert to if-else since HttpMethod is now a class
if (httpMethod == HttpMethod.GET) {
    // ...
} else if (httpMethod == HttpMethod.POST) {
    // ...
}
```

If you use `RestTemplate`, also check the `exchange` method signatures.
The type change of `HttpMethod` from enum to class can affect type inference in some overloaded methods.
Note that Spring Framework 6.1 introduced <a href="/en/post/spring-restclient-vs-resttemplate" target="_blank">RestClient</a> as a new synchronous HTTP client,
so the migration is a good opportunity to evaluate switching.

<br>

## Hibernate 6 ID Generation Strategy Changes

The property table above mentioned that `use-new-id-generator-mappings` was removed. This deserves special attention because it can lead to data integrity issues in production.

In Hibernate 5, `@GeneratedValue(strategy = GenerationType.AUTO)` defaulted to the `TABLE` strategy on MySQL.
Setting `use-new-id-generator-mappings=false` switched it to the database native strategy (auto_increment).
In Hibernate 6, this property is gone. Without an explicit `@SequenceGenerator` or `@TableGenerator`,
Hibernate auto-selects the default strategy for the database: `IDENTITY` (auto_increment) for MySQL, `SEQUENCE` for PostgreSQL.

The problem is that changing strategies on tables with existing data can cause ID collisions or large gaps in sequence values.
Before migrating, verify which ID generation strategy each entity currently uses.
Explicitly specifying both `strategy` and `generator` in `@GeneratedValue` is the safest approach.

```java
// If previously using AUTO, explicitly set IDENTITY for safety
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

<br>

## Auto-configuration Registration Changes

In Spring Boot 2, auto-configuration classes were registered in `META-INF/spring.factories`.
Spring Boot 3 removes this mechanism and replaces it with
`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, listing one class per line.

```properties
# Before: META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.article.ArticleAutoConfiguration
```

```
# After: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.article.ArticleAutoConfiguration
```

Even if your application code does not have a `spring.factories` file, internal shared modules or custom starters that depend on it
can silently lose their entire auto-configuration after the upgrade, causing bean-not-found errors.
Teams that maintain shared libraries must check this.

<br>

## @ConstructorBinding Location Changes

When using immutable binding with `@ConfigurationProperties`, Spring Boot 2 required `@ConstructorBinding` at the class level.
In Spring Boot 3, this annotation is unnecessary if the class has a single constructor.
When there are multiple constructors, apply it directly to the constructor used for binding.

```java
// Before (Spring Boot 2.x)
@ConstructorBinding
@ConfigurationProperties(prefix = "article.api")
public class ArticleApiProperties {
    private final String baseUrl;
    private final int timeout;

    public ArticleApiProperties(String baseUrl, int timeout) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }
}
```

```java
// After (Spring Boot 3.x) - annotation unnecessary with a single constructor
@ConfigurationProperties(prefix = "article.api")
public class ArticleApiProperties {
    private final String baseUrl;
    private final int timeout;

    public ArticleApiProperties(String baseUrl, int timeout) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }
}
```

A class-level `@ConstructorBinding` causes a compile error in Spring Boot 3.
Search your entire project for this annotation and clean it up.

<br>

# Migration Order and Checklist

## Step-by-Step Approach

Rather than jumping directly from Spring Boot 2.x to 3.x, a staged approach is safer.

**Step 1: Upgrade to Java 17.**
This is the minimum requirement for Spring Boot 3. Upgrade first and confirm that existing functionality works correctly.
If upgrading from Java 8, also address APIs removed in Java 11, such as JAXB (`javax.xml.bind`), at this stage.

**Step 2: Update to the latest Spring Boot 2.7 patch.**
Many items flagged as deprecated warnings in 2.7 overlap with items removed in 3.x.
Resolving these warnings first reduces the scope of breakage during the 3.x migration.

**Step 3: Upgrade to Spring Boot 3.x.**
Update the Gradle Spring Boot plugin version and `spring-boot-starter-parent` to 3.x,
then work through compile errors including the major changes covered above.

<br>

## Automation Tools and Third-Party Compatibility

For automation, **OpenRewrite** is highly useful. Running the `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0` recipe handles
`javax` to `jakarta` import conversion, property key changes, and deprecated API replacements in a single pass.
Recipes for minor versions like 3.1 and 3.2 are also available, so select the one matching your target version.

Third-party library compatibility matters as well.
Querydsl supports the Jakarta namespace from 5.0.0 onward, and you need to specify the `jakarta` classifier in Gradle.
MapStruct auto-detects the classpath from 1.5.0 and distinguishes between `javax` and `jakarta` automatically.
Lombok addressed compatibility relatively early, but it is still worth checking the release notes to confirm your version is compatible with Spring Boot 3.

<br>

## Checklist

- Upgraded to Java 17 or later
- Resolved deprecated warnings on the latest Spring Boot 2.7 patch
- Converted `javax.*` to `jakarta.*` imports (excluding Java SE packages)
- Migrated Spring Security configuration to the `SecurityFilterChain` bean pattern
- Updated all changed property keys
- Addressed Hibernate 6 ID generation strategy changes (checked for conflicts with existing data)
- Handled trailing slash matching being disabled by default
- Fixed `HttpMethod` switch statements and other enum-dependent code
- Converted auto-configuration registration to the new format (`AutoConfiguration.imports`)
- Removed class-level `@ConstructorBinding` usage
- Verified Jakarta-compatible versions of third-party libraries (Querydsl, MapStruct, Lombok, etc.)
- Added `spring-boot-properties-migrator` to catch missed property changes
- Removed `spring-boot-properties-migrator` after migration is complete

<br>

# Wrapping Up

It is tempting to relax once the build passes, but runtime behavioral changes, like transaction handling or Security filter chain ordering, only surface through testing.
Fixing compile errors is probably about half of the migration effort.

Once you get past this hurdle, though, you gain full access to Java 17 records and sealed classes, improved GC performance, and GraalVM native images.
Technical debt only grows the longer you defer it, so getting it done now might leave you with a noticeably lighter codebase.

<br>

# References

- <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide" target="_blank" rel="nofollow">Spring Boot 3.0 Migration Guide</a>
- <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes" target="_blank" rel="nofollow">Spring Boot 3.0 Release Notes</a>
