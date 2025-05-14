---
layout:   post
title:    "Spring Cloud Config: Introduction and Example"
author:   Kimtaeng
tags: 	  spring springcloud
description: "How can you refresh Spring configuration changes without rebuild and redeploy, and externalize configuration files?"
category: Spring
date: "2020-01-31 01:38:12"
comments: true
lang: en
slug: introduction-to-spring-cloud-config
permalink: /en/introduction-to-spring-cloud-config/
---

# Table of Contents
- Spring Cloud Config: Introduction and Example
- <a href="/post/spring-cloud-bus-example">Spring Cloud Config: Spring Cloud Bus Example</a>
- <a href="/post/spring-cloud-config-using-git-webhook-to-auto-refresh">Spring Cloud Config: Auto Refresh with Git Webhook</a>
- <a href="/post/changes-in-spring-cloud-config-from-spring-boot-2-4">Spring Cloud Config: Changes in Spring Boot 2.4</a>

<br>

# Why Spring Cloud Config?
Assume you run an A/B test that changes ad exposure probability.
You may start at 5% and later change to 10%.
If the value is in application config, each change normally requires rebuild and redeploy.

Spring Cloud Config solves this by externalizing configuration in distributed environments.
You can manage dev/test/prod settings centrally through a dedicated config server.
Running applications fetch config from that server and refresh when needed.
So when config changes, you update the config server side instead of rebuilding every client.

> **Added in January 2021**: Starting with Spring Boot 2.4,
> `bootstrap.yml` used in this article is no longer the recommended approach.
> See the fourth article in the table of contents:
> <a href="/post/changes-in-spring-cloud-config-from-spring-boot-2-4">"Changes in Spring Boot 2.4"</a>.

<br/>

# Architecture Overview
The image below shows the basic Spring Cloud Config flow.

A client requests config from Config Server.
The server reads the latest settings from a Git repository.
The client then receives those settings from the server.

If config files are updated and pushed to Git,
you can call the client’s `actuator/refresh` endpoint to apply updates.
In this basic setup, you must call each client separately,
and only called clients refresh.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-1.png"
width="800" alt="spring cloud config architecture"/>

<br/>

Now let’s implement it.
> All sample code is available on GitHub (links at the bottom).

<br/><br/>

# Spring Cloud Config Server
Build Config Server first.
Later, clients must start while this server is already running.

## Create Project
Create a Spring Boot project, or use
<a href="https://start.spring.io" target="_blank" rel="nofollow">https://start.spring.io</a>.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-2.png"
alt="config server with spring initializr"/>

<br/>

Or copy dependencies into `pom.xml`:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.2.4.RELEASE</version>
    <relativePath/>
</parent>

<properties>
    <java.version>1.8</java.version>
    <spring-cloud.version>Hoxton.SR1</spring-cloud.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-config-server</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Configure Config Server
Add `@EnableConfigServer` in your application class:

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConfigServerApplication.class, args);
	}
}
```

Then update `application.yml`.
Port `8088` is for Config Server, and `uri` points to the config repository.

```yaml
server:
  port: 8088
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/madplay/spring-cloud-config-repository
```

Config Server setup is done.
Next, prepare the config repository.

<br/><br/>

# Spring Cloud Config Repository
This step is simple: create config files.

## Create Config Files
Create a project and add files at root like below.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-3.png"
width="700" alt="config files"/>

Typical naming: `{application}-{profile}.yml`.
In this example, `{application}` is `config`.
Remember this value because clients also use it.

Store these files in a **Git Repository**.
The repository URL must match the URL in server `application.yml`.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-4.png"
width="450" alt="config repository"/>

<br/>

## Test Config Files
Before building clients, run Config Server and verify it responds correctly.
Server uses port 8088, so test:

```bash
# you can test dev, test, real profiles
$ curl -X GET "http://localhost:8088/config/dev"
```

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-5.png"
width="700" alt="dev config result"/>

Config Server endpoints include:

```bash
GET /{application}/{profile}[/{label}]
GET /{application}-{profile}.yml
GET /{label}/{application}-{profile}.yml
GET /{application}-{profile}.properties
GET /{label}/{application}-{profile}.properties
```

- `{application}`: application name
- `{profile}`: active profile
- `{label}`: optional Git branch (default: `master`)

If you prefer fewer files, you can place multiple profiles in one file:

```yaml
spring.profiles: dev
taeng:
  profile: I'm dev taeng
  comment: Hello! dev taeng

---
spring.profiles: test
taeng:
  profile: I'm dev taeng
  comment: Hello! test taeng

---
spring.profiles: real
taeng:
  profile: I'm real taeng
  comment: Hello! real taeng
```

Tradeoff: one file gets longer, but repository file count decreases.

<br/><br/>

# Spring Cloud Config Client
Now configure the client.

## Create Project
You can use
<a href="https://start.spring.io" target="_blank" rel="nofollow">https://start.spring.io</a>.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-30-introduction-to-spring-cloud-config-6.png"
alt="config client with spring initializr"/>

<br/>

Or use this `pom.xml` setup:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.2.4.RELEASE</version>
    <relativePath/>
</parent>

<properties>
    <java.version>1.8</java.version>
    <spring-cloud.version>Hoxton.SR1</spring-cloud.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Configure Config Client
Configure `bootstrap.yml` like below.
`bootstrap.yml` loads earlier than `application.yml`,
so config is fetched from Config Server before application startup.

```yaml
server:
  port: 8089
spring:
  profiles: # can be set here or at runtime
    active: dev
  application:
    name: config
  cloud:
    config:
      uri: http://localhost:8088
management:
  endpoints:
    web:
      exposure:
        include: refresh
```

## Implement Service Layer
Create two services for testing.
Both read values from Config Server,
but one supports runtime refresh without rebuild/redeploy.

```java
/**
 * @author madplay
 */
@Service
public class StaticConfigService {

	@Value("${taeng.profile}")
	private String profile;
	@Value("${taeng.comment}")
	private String comment;

	public Map<String, String> getConfig() {
		Map<String, String> map = new HashMap<>();
		map.put("profile", profile);
		map.put("comment", comment);
		return map;
	}
}
```

The key difference is `@RefreshScope`.
It enables runtime refresh after config repository changes.

```java
/**
 * @author madplay
 */
@Service
@RefreshScope // this is the difference
public class DynamicConfigService {

	@Value("${taeng.profile}")
	private String profile;
	@Value("${taeng.comment}")
	private String comment;

	public Map<String, String> getConfig() {
		Map<String, String> map = new HashMap<>();
		map.put("profile", profile);
		map.put("comment", comment);
		return map;
	}
}
```

## Implement Controller
Add a controller to test both services.

```java
/**
 * @author madplay
 */
@RestController
public class ConfigController {

	private final StaticConfigService configStaticService;
	private final DynamicConfigService configDynamicService;

	@Autowired // single constructor, annotation can be omitted
	public ConfigController(StaticConfigService configStaticService, DynamicConfigService configDynamicService) {
		this.configStaticService = configStaticService;
		this.configDynamicService = configDynamicService;
	}

	@GetMapping(value = "/static")
	public Object getConfigFromStatic() {
		return configStaticService.getConfig();
	}

	@GetMapping(value = "/dynamic")
	public Object getConfigFromDynamic() {
		return configDynamicService.getConfig();
	}
}
```

## Run Config Client
Run the client.
Because profile is set in `bootstrap.yml`, no extra option is required.
If needed, pass profile at runtime, for example `-Dspring.profiles.active=dev`.

Startup logs are important.
They show where config values are loaded from.
Confirm logs like:

```bash
Fetching config from server at : http://localhost:8088
Located environment: name=config, profiles=[dev], label=null, version=760804e4ac41eee7a8d7cb14f42588b3ad7252fc, state=null
Located property source: [BootstrapPropertySource {name='bootstrapProperties-configClient'},
    BootstrapPropertySource {name='bootstrapProperties-https://github.com/madplay/spring-cloud-config-repository/config-dev.yml'}]
```

<br/><br/>

# Test It
Ensure both Config Server and client are running.

## Check Client Responses
Call both endpoints.
Initially, they return the same values.

- `$ curl -X GET "http://localhost:8089/static"`
- `$ curl -X GET "http://localhost:8089/dynamic"`

```bash
# result
{
    "profile": "I'm dev taeng",
    "comment":"Hello! dev taeng"
}
```

Because client runs with `dev`, it reads `dev` config.

## Change Configuration Dynamically
Now modify the Git repository file `config-dev.yml`:

```yaml
taeng:
  profile: I'm dev taeng
  comment: Hello! updated dev taeng!!!
```

Then trigger refresh:

```bash
$ curl -X POST "http://localhost:8089/actuator/refresh"
```

Check `/static` and `/dynamic` again.
As expected, only `dynamic` reflects the updated value.

```bash
# result
{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated dev taeng!!!"
}
```

<br/><br/>

# Closing
Even with this small example, **Spring Cloud Config** externalizes configuration cleanly
and supports runtime updates without rebuild/redeploy.

However, manually calling refresh on every client can become operational overhead.
With many clients, this is not scalable.
Spring provides **Spring Cloud Bus** to solve that.
The next post covers that flow.

- <a href="/post/spring-cloud-bus-example">Next: "Spring Cloud Config: Spring Cloud Bus Example" (link)</a>

<br/><br/>

# Example Source Code
All source used in this post:

- config server & config client
  - <a href="https://github.com/madplay/spring-cloud-config-example" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-example</a>
- config repository
  - <a href="https://github.com/madplay/spring-cloud-config-repository" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-repository</a>
