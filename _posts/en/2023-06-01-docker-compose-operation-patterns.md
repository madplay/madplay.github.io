---
layout: post
title: "Docker Compose Operational Patterns and Environment-Specific Configuration Strategy"
author: madplay
tags: docker compose profiles env
description: "Frequently used Docker Compose patterns and operational cautions from a production perspective."
category: Infra
date: "2023-06-01 22:20:00"
comments: true
lang: en
slug: docker-compose-operation-patterns
permalink: /en/post/docker-compose-operation-patterns
---

# Table of Contents
- <a href="/en/post/what-is-docker-compose" target="_blank">What Is Docker Compose?</a>
- <a href="/en/post/docker-compose-spec-local-backend" target="_blank">Building a Local Backend Environment with the Docker Compose Specification</a>
- Docker Compose Operational Patterns and Environment-Specific Configuration Strategy

<br>

# Where Things Often Break in Operations
Many Compose issues are not syntax errors.
They happen when operational standards are undefined.
A typical case is "works locally but behaves differently in team environments," or "the same file produces different results depending on run options."

This post focuses on reproducibility and maintainability patterns from an operational perspective, not just basic file syntax.

<br>

# Split Execution Scope with `profiles`
Running all services all the time wastes resources and makes root-cause tracing harder.
Use `profiles` to separate targets for development, testing, and operational helper services.

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: order
      MYSQL_ROOT_PASSWORD: root_pw
    profiles: ["local"]

  redis:
    image: redis:7
    profiles: ["local"]

  adminer:
    image: adminer
    ports:
      - "18080:8080"
    profiles: ["debug"]
```

```bash
# Activate only local profile
$ docker compose --profile local up -d

# Activate local + debug profiles
$ docker compose --profile local --profile debug up -d
```

In operations, teams often keep the default service set minimal and place debugging tools into separate profiles.

<br>

# Multi-File Override Strategy
If all environment branches are placed in one `compose.yaml`, complexity grows quickly.
A common approach is common base file plus environment-specific override files.

```bash
# Common + local override
$ docker compose -f compose.yaml -f compose.local.yaml up -d

# Common + CI override
$ docker compose -f compose.yaml -f compose.ci.yaml up -d
```

Example of local-only overrides for ports and volumes:

```yaml
# compose.local.yaml
services:
  app:
    ports:
      - "8080:8080"
    volumes:
      - ./:/workspace
```

File merge order is critical.
Later files override earlier settings.
Fix file order in team scripts to reduce operational mistakes.

<br>

# Clarify Environment Variable Precedence
Value conflicts in Compose often happen around environment variables.
Mixing `.env`, `env_file`, `environment`, and shell variables makes value origin hard to trace.

```yaml
services:
  app:
    env_file:
      - .env.app
    environment:
      APP_LOG_LEVEL: info
      DB_HOST: mysql
      REQUEST_TIMEOUT_MS: "1500"
```

Define team rules first.

- Values that vary by deployment environment: inject at runtime
- Shared service defaults: `env_file`
- Must-fixed values: `environment`

For security operations, sensitive values are generally injected at runtime, not embedded in image builds.

<br>

# Boundary Between Compose and Application Responsibility
`depends_on` and `healthcheck` help startup control, but they do not replace application-level failure handling.
In production, separate transient and permanent failures and restrict retry targets accordingly.

```java
@Slf4j
@Service
public class OrderSyncService {

    public void sync(String requestId, String orderId) {
        try {
            callExternal(orderId);
            log.info("order-sync-success requestId={} orderId={}", requestId, orderId);
        } catch (SocketTimeoutException | ConnectException e) {
            // Transient error: candidate for limited retries
            log.warn("order-sync-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new RetryableOperationException(e);
        } catch (IllegalArgumentException | AuthenticationException e) {
            // Permanent error: fail fast
            log.error("order-sync-non-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new NonRetryableOperationException(e);
        }
    }

    private void callExternal(String orderId) {
        // Example implementation
    }
}
```

Keep identifiers such as `requestId` and `orderId` in logs.
In message-driven systems, teams also record `key`, `partition`, and `offset` for traceability.

<br>

# Pre-Run Operational Checklist
Common Compose operational checks:

- Whether each profile starts only required services
- Whether `-f` merge order matches team scripts
- Whether variable sources (`.env`, `env_file`, `environment`) conflict
- Whether retries are limited to transient failures
- Whether volume strategy (named volume/bind mount) matches data retention policy

In practice, simplifying execution flow and documenting checkpoints usually improves stability more than adding settings.

<br>

# Summary
The core of Compose operations is not using many features.
It is separating execution scope, clarifying configuration precedence, and separating Compose concerns from application logic.
When this baseline is in place, teams reduce environment mismatch and operational mistakes.

<br>

# References
- <a href="https://docs.docker.com/compose/profiles/" target="_blank" rel="nofollow">Docker Docs: Using profiles with Compose</a>
- <a href="https://docs.docker.com/compose/how-tos/multiple-compose-files/" target="_blank" rel="nofollow">Docker Docs: Use multiple Compose files</a>
- <a href="https://docs.docker.com/compose/environment-variables/" target="_blank" rel="nofollow">Docker Docs: Environment variables in Compose</a>
