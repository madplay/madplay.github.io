---
layout: post
title: "What Is Docker Compose?"
author: madplay
tags: docker compose devops
description: "What Docker Compose is, why it matters, and how to use it in local development."
category: Infra
date: "2023-05-27 21:10:00"
comments: true
lang: en
slug: what-is-docker-compose
permalink: /en/post/what-is-docker-compose
---

# Table of Contents
- What Is Docker Compose?
- <a href="/en/post/docker-compose-spec-local-backend" target="_blank">Building a Local Backend Environment with the Docker Compose Specification</a>
- <a href="/en/post/docker-compose-operation-patterns" target="_blank">Docker Compose Operational Patterns and Environment-Specific Configuration Strategy</a>

<br>

# Start with the Reproducibility Problem in Local Environments

**Docker Compose is a tool for defining and running multi-container applications.**
Instead of long runtime commands, you declare service configuration in `compose.yaml` and reproduce the same environment repeatedly.
The impact varies by team, but Compose usually helps reduce local environment drift and unifies start/stop/log workflows under one command system.

When running a single container, `docker run` is often enough.
Once the application, MySQL, and Redis must run together, option and startup-order management gets complex quickly.
Compose fixes this configuration in a file and allows teams to reproduce the same local environment.

<br>

# Core Components of the Compose Model
Compose centers on three major components.

- `services`: runnable container units
- `networks`: communication network among services
- `volumes`: persistent storage that survives container restart
- `configs` and `secrets` are also used when required

A basic structure:

```yaml
services:
  app:
    image: eclipse-temurin:17-jre

  mysql:
    image: mysql:8.0

volumes:
  mysql-data:
```

The structure is simple, but stable startup usually requires `ports`, `environment`, `depends_on`, and `healthcheck`.
For databases in particular, data can disappear on container recreation if volume mapping is missing.

<br>

# How to Read `compose.yaml`
Start from the fields most frequently used in production.

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
    depends_on:
      mysql:
        condition: service_healthy

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

volumes:
  mysql-data:
```

The key combination is `depends_on + healthcheck`.
The app container can start first, but if MySQL is not ready, connection failures occur.
Declaring both startup order and readiness often improves boot stability.
`healthcheck` runs inside the target container, so `127.0.0.1` works in this context.

This combination only controls Compose startup behavior.
It does not replace reconnect, retry, and timeout logic in the application.
Also, fixing `container_name` can limit service scaling (multiple instances).

<br>

# Common Docker Compose Commands
These commands cover most early usage.

```bash
# Run in background
$ docker compose up -d

# Check status
$ docker compose ps

# Follow logs of a specific service
$ docker compose logs -f app

# Run command inside a container
$ docker compose exec mysql mysql -u root -p

# Stop and clean up
$ docker compose down
```

`docker compose exec mysql mysql -u root -p` prompts password interactively.
In production, avoid `-ppassword` style because credentials can remain in shell history.

`down` cleans up the project network and related resources.
To remove volumes as well, add `-v`.
Confirm first whether local DB data should be preserved.
Named volumes are generally preserved, but data state can still vary based on bind mounts or DB initialization scripts.

<br>

# Boundary Between Compose and Application Logic
Even with correct Compose settings, startup failures repeat if the application ignores dependency readiness.
A practical approach is to separate transient from permanent errors and keep clear log context.

```java
@Slf4j
@Component
public class DatabaseStartupVerifier {

    public void verify(String requestId) {
        try {
            // Check DB readiness with a short timeout
            pingWithTimeout(1000);
            log.info("mysql-ready requestId={}", requestId);
        } catch (SocketTimeoutException e) {
            // Transient error: delayed DB startup
            log.warn("mysql-timeout requestId={} message={}", requestId, e.getMessage());
            throw new RetryableDependencyException(e);
        } catch (AuthenticationException e) {
            // Permanent error: account or permission configuration issue
            log.error("mysql-auth-failed requestId={} message={}", requestId, e.getMessage());
            throw new NonRetryableDependencyException(e);
        }
    }

    private void pingWithTimeout(int timeoutMs) {
        // Example implementation
    }
}
```

Apply retries only where needed.
Retrying permanent errors increases startup time and delays incident signals.

<br>

# Role of the Compose Specification

If Compose is treated only as a tool, syntax differences by implementation can look confusing.
The Compose Specification is the common contract that defines the `compose.yaml` format.

It does not just describe Docker Compose CLI behavior.
It defines how keys such as `services`, `networks`, `volumes`, `configs`, and `secrets` are interpreted.
Using the spec as the baseline improves team consistency and reduces migration cost when tooling changes.

<br>

# Summary

Docker Compose is more than a convenience command for running multiple containers.
It is a declarative way to freeze local execution environments.
A practical path is to first understand concepts and file structure, then move to specification-based production-like composition.

The next post continues with a Compose Specification-based `compose.yaml` for MySQL and Redis local backend setup.

- Next post: <a href="/en/post/docker-compose-spec-local-backend" target="_blank">Building a Local Backend Environment with the Docker Compose Specification</a>

# References
- <a href="https://docs.docker.com/compose/" target="_blank" rel="nofollow">Docker Docs: Compose</a>
- <a href="https://compose-spec.io/" target="_blank" rel="nofollow">Compose Specification</a>
- <a href="https://docs.docker.com/reference/compose-file/" target="_blank" rel="nofollow">Docker Docs: Compose file reference</a>
