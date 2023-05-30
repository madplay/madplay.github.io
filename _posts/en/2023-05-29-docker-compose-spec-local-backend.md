---
layout: post
title: "Building a Local Environment with the Docker Compose Specification"
author: madplay
tags: docker compose specification
description: "How to build a consistent local backend environment based on the Docker Compose Specification."
category: Infra
date: "2023-05-29 23:10:00"
comments: true
lang: en
slug: docker-compose-spec-local-backend
permalink: /en/post/docker-compose-spec-local-backend
---

# Table of Contents
- <a href="/en/post/what-is-docker-compose" target="_blank">What Is Docker Compose?</a>
- Building a Local Backend Environment with the Docker Compose Specification
- <a href="/en/post/docker-compose-operation-patterns" target="_blank">Docker Compose Operational Patterns and Environment-Specific Configuration Strategy</a>

<br>

# Read Configuration from the Specification Perspective

When local development environments differ by person, non-reproducible bugs appear even on the same branch.
If you treat Docker Compose as a contract (Compose Specification) instead of only a tool, configuration intent becomes much clearer.

This post summarizes a `compose.yaml` structure that backend teams can use immediately, based on key specification elements.

<br>

# Revisit Core Concepts

Even if you already know basic Docker concepts, a quick refresh helps when working with Compose.

- Image: a read-only template for running containers.
- Container: a running process from an image; state can disappear when it stops.
- Volume: persistent storage that survives container termination.
- Network: internal network Compose creates for service-to-service communication.

A minimal example:

```yaml
services:
  app:
    image: eclipse-temurin:17-jre
    command: ["java", "-version"]
```

Compose starts from listing execution units under `services`.
This alone is not enough for real applications.
You usually need additional fields such as `build`, `volumes`, and `environment`.

<br>

# Practical `compose.yaml` Example
Backend projects usually run app, DB, and cache together.
The example below uses Spring Boot + MySQL + Redis.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: order-api
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: local
      DB_HOST: mysql
      DB_PORT: "3306"
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started

  mysql:
    image: mysql:8.0
    container_name: order-mysql
    environment:
      MYSQL_DATABASE: order
      MYSQL_USER: order_user
      MYSQL_PASSWORD: order_pw
      MYSQL_ROOT_PASSWORD: root_pw
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -proot_pw"]
      interval: 10s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    container_name: order-redis

volumes:
  mysql-data:
```

Three key points in this example:

- `depends_on` defines startup order and readiness conditions.
- `healthcheck` is the readiness signal for dependency availability.
- DB data is kept in named volumes so it survives container recreation.

`healthcheck` commands run inside the target container.
In the MySQL example, `127.0.0.1` refers to the loopback inside that container.

`depends_on` alone does not guarantee full initialization completion.
If DB migration takes long, the application still needs reconnect retry and timeout logic.
Also, fixed `container_name` values are convenient in development but limit scaling to multiple instances.

<br>

# Separate Transient vs Permanent Errors

Compose settings alone cannot classify application-level failures.
In production, teams often treat DB connection failures as transient (retryable) and schema/config issues as permanent (fail-fast).

```java
@Slf4j
@Component
public class StartupDependencyChecker {

    public void verify(String requestId, String serviceName) {
        try {
            // Short validation call such as DB/Redis ping
            pingDependency(serviceName);
            log.info("dependency-ready requestId={} serviceName={}", requestId, serviceName);
        } catch (SocketTimeoutException e) {
            // Transient error: network delay or startup delay
            log.warn("dependency-timeout requestId={} serviceName={} message={}",
                    requestId, serviceName, e.getMessage());
            throw new RetryableDependencyException(e);
        } catch (AuthenticationException | IllegalStateException e) {
            // Permanent error: invalid credentials or misconfiguration
            log.error("dependency-invalid-config requestId={} serviceName={} message={}",
                    requestId, serviceName, e.getMessage());
            throw new NonRetryableDependencyException(e);
        }
    }

    private void pingDependency(String serviceName) {
        // Example implementation
    }
}
```

Keep context such as `requestId` and `serviceName` in logs.
For message-driven services, adding `key`, `partition`, and `offset` often improves incident analysis.

<br>

# Environment Variables and Secret Handling Baseline

For local environments, `environment` or `env_file` is simple.
For sensitive values such as passwords or tokens, keep the principle of runtime injection instead of baking secrets into images.

```yaml
services:
  app:
    image: myorg/order-api:latest
    env_file:
      - .env.local
    environment:
      REQUEST_TIMEOUT_MS: "1500"
      RETRY_MAX_ATTEMPTS: "3"
```

There is a clear reason to externalize timeout and retry values.
External dependency latency can happen anytime, and tuning should not require code redeployment.

Before increasing retries, verify idempotency first.
For operations such as payment authorization or point accrual, use idempotency keys to block duplicate execution.

<br>

# Pre-Operation Checklist for Compose

Compose has broad utility even for local development. The checks below are common baselines.

- Whether each service has a `healthcheck`
- Whether DB/message processing code has timeout settings
- Whether retry targets are limited to transient errors
- Whether logs include request identifiers and message context
- Whether volume/network names conflict

From a performance perspective, unnecessary bind mounts and overly verbose log levels can increase local I/O cost.
If local execution feels slow, checking `docker stats` and application log volume is often the fastest starting point.

<br>

The next post focuses on production patterns: `profiles`, multi-file overrides, and environment variable precedence.

- Next post: <a href="/en/post/docker-compose-operation-patterns" target="_blank">Docker Compose Operational Patterns and Environment-Specific Configuration Strategy</a>

# References
- <a href="https://compose-spec.io/" target="_blank" rel="nofollow">Compose Specification</a>
- <a href="https://docs.docker.com/compose/" target="_blank" rel="nofollow">Docker Docs: Compose</a>
- <a href="https://docs.docker.com/reference/compose-file/services/" target="_blank" rel="nofollow">Docker Docs: Compose file reference - services</a>
