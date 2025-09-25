---
layout:   post
title:    "Spring Cloud Config: Changes in Spring Boot 2.4"
author:   Kimtaeng
tags:    spring springcloud
description: "Spring Cloud Config-related changes introduced in Spring Boot 2.4"
category: Spring
date: "2021-01-11 01:35:15"
comments: true
slug:     changes-in-spring-cloud-config-from-spring-boot-2-4
lang:     en
permalink: /en/post/changes-in-spring-cloud-config-from-spring-boot-2-4
---

# Table of Contents
- <a href="/post/introduction-to-spring-cloud-config">Spring Cloud Config: Introduction and Example</a>
- <a href="/post/spring-cloud-bus-example">Spring Cloud Config: Spring Cloud Bus Example</a>
- <a href="/post/spring-cloud-config-using-git-webhook-to-auto-refresh">Spring Cloud Config: Auto Refresh with Git Webhook</a>
- Spring Cloud Config: Changes in Spring Boot 2.4

<br>

# Spring Boot 2.4
> Spring Boot 2.4 introduces a small change in Spring Cloud Config Client settings.

`bootstrap.yml` (or bootstrap properties) is no longer used.
Previously, this file loaded before `application.yml` at startup and was used to read properties defined in the Cloud Config server.

In Spring Boot 2.4, configuration loading changes to `spring.config.import`.
Now define it in `application.yml` as below.

```yaml
spring:
  config:
    import: "optional:configserver:"
```

With this declaration, the client tries to connect to the Cloud Config server at `http://localhost:8888` by default.
If you remove prefix `optional:`, the client does not start when it cannot connect to the Cloud Config server.

To change server URL, set it like below.
You can also use `spring.cloud.config.uri`, but the value set in `import` has higher priority.

```yaml
spring:
  config:
    import: "optional:configserver:http://myconfigserver.com/"
```

You can also set `name` and `profile` like this.
For example, if config name is "my-config" and profile is "dev", configure as below.

```yaml
spring:
  config:
    import: "optional:configserver:http://myconfigserver.com/"
  cloud:
    config:
      name: my-config
      profile: dev
```
<br>

# Additional Reference: Spring Cloud and Spring Boot Version Mapping
Match Spring Cloud and Boot versions based on the table below.

| Spring Cloud Version | Spring Boot Version |
| -- | -- |
<a href="https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2020.0-Release-Notes" target="_blank" rel="nofollow">2020.0.x</a> (aka Ilford) | 2.4.x
<a href="https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-Hoxton-Release-Notes" target="_blank" rel="nofollow">Hoxton</a> | 2.2.x, 2.3.x (and versions starting from SR5)
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Greenwich-Release-Notes" target="_blank" rel="nofollow">Greenwich</a> | 2.1.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Finchley-Release-Notes" target="_blank" rel="nofollow">Finchley</a> | 2.0.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes" target="_blank" rel="nofollow">Edgware</a> | 1.5.x
<a href="https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Dalston-Release-Notes" target="_blank" rel="nofollow">Dalston</a> | 1.5.x

<br>

# Additional Reference: actuator Changes
While testing existing code for this post, Spring Cloud Bus `actuator` endpoints appear changed.
`bus-env` changes to `busenv`, and `bus-refresh` changes to `busrefresh`.

This commit appears to include the change.

- <a href="https://github.com/spring-cloud/spring-cloud-bus/commit/aa817ea36c2807130e8c376f62bf95fe92a7ef3a#diff-fa153554fcd4f4975d24decc84fe5412878285e1e9f761cf506671b2d42b7ca4"
target="_blank" rel="nofollow">GitHub reference: spring-cloud/spring-cloud-bus</a>
