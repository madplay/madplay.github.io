---
layout: post
title: "Optimizing Java Images with Dockerfile Best Practices"
author: madplay
tags: docker dockerfile java image
description: "How to reduce Java application image size and build time using Dockerfile best practices."
category: Infra
date: "2023-10-01 23:40:00"
comments: true
lang: en
slug: java-dockerfile-best-practices
permalink: /en/post/java-dockerfile-best-practices
---

# Why Dockerfile Optimization Matters
Image size and build speed directly affect deployment lead time and incident response speed.
Java backends tend to accumulate dependencies, so cache efficiency and build duration vary significantly by Dockerfile layer design.
This shows up immediately in deployment/rollback time and local iterative build cost.

Based on <a href="https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" target="_blank" rel="nofollow">Docker official best practices</a>, this article explains layer design by change frequency and build/runtime separation with code-focused examples.

<br>

# Understand Layer Structure

Docker images are built as a stack of layers.
If frequently changing files are placed in upper layers too early, cache hit rate drops sharply.

```dockerfile
FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY . .
# first dot: current host directory (entire build context)
# second dot: current container working directory (WORKDIR=/app)
RUN ./gradlew clean build
CMD ["java", "-jar", "build/libs/app.jar"]
```

In this pattern, changing one source line can rebuild all layers after `COPY . .`.
To improve build speed, organize Dockerfile by change frequency, not only execution order.
Split copy steps by update frequency.

```dockerfile
FROM gradle:8.3.0-jdk17
WORKDIR /workspace

# 1) First: files that change less often
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle
# Download dependencies first to maximize cache reuse when src changes.
RUN ./gradlew --no-daemon dependencies

# 2) Later: source files that change frequently
COPY src ./src
# Build the final artifact in the last step
RUN ./gradlew --no-daemon bootJar
```

The core idea is simple: copy dependency descriptors first, then source code.
That increases the chance of reusing dependency layers when source changes.

<br>

# Reduce Runtime Image Size with Multi-Stage Builds

Separating build tooling from runtime environment can significantly reduce image size.
This example separates a Gradle build stage and a JRE runtime stage.

```dockerfile
# 1) build stage
FROM gradle:8.3.0-jdk17 AS builder
WORKDIR /workspace

COPY --chown=gradle:gradle build.gradle settings.gradle ./
COPY --chown=gradle:gradle gradle ./gradle
COPY --chown=gradle:gradle gradlew ./gradlew
# Ensure execution permission for gradlew
RUN chmod +x ./gradlew
# Isolate dependency layer
RUN ./gradlew --no-daemon dependencies

COPY --chown=gradle:gradle src ./src
# Build application JAR
RUN ./gradlew --no-daemon bootJar
# Copy to app.jar for fixed runtime artifact naming
RUN JAR_FILE=$(ls build/libs/*.jar | grep -v "plain" | head -n 1) && cp "$JAR_FILE" build/libs/app.jar

# 2) runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN useradd -r -u 1001 appuser
USER appuser

# Copy only builder output to keep runtime image small
COPY --from=builder --chown=appuser:appuser /workspace/build/libs/app.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Summary:

- Keep JDK/Gradle only in the `builder` stage.
- Keep runtime image JRE-only to reduce attack surface and size.
- Avoid root execution with `USER appuser`.

`COPY --chown=gradle:gradle` is used because Gradle official images often assume the `gradle` user and home directory.
Aligning permissions early helps avoid `gradlew` permission and cache-directory access issues.

If multiple artifacts are generated, patterns like `COPY --from=builder /workspace/build/libs/*.jar app.jar` can fail in CI.
Fix artifact naming (for example with `bootJar.archiveFileName`) to reduce variability.

```groovy
bootJar {
    archiveFileName = "app.jar"
}
```

<br>

# Dockerfile Patterns for Better Cache Hit Rate
## Split dependency layers first
If you copy dependency descriptor files first and download dependencies before source copy, cache reuse improves on code changes.

```dockerfile
FROM gradle:8.3.0-jdk17 AS builder
WORKDIR /workspace

# Copy dependency-related files first
COPY --chown=gradle:gradle build.gradle settings.gradle gradlew ./
COPY --chown=gradle:gradle gradle ./gradle
RUN chmod +x ./gradlew
# Download dependencies first (cache layer)
RUN ./gradlew --no-daemon dependencies

# Copy frequently changing source later
COPY --chown=gradle:gradle src ./src
# Build final runnable JAR
RUN ./gradlew --no-daemon bootJar
```

In many teams, pinning major/minor (for example, `gradle:8.3-jdk17`) is enough.
If strict reproducibility is required, pin patch versions too (for example, `8.3.0`).

Patch tag availability differs by image policy.
Verify tag existence on Docker Hub before adoption.

## Reduce build context with `.dockerignore`

Adding `.dockerignore` reduces build-context transfer size.

```gitignore
.git
.gradle
.idea
build
out
*.iml
*.log
```

`.dockerignore` does not remove files from an image after copy.
It excludes them from build context transfer in the first place.
That reduces build I/O because unnecessary files never reach Docker daemon.
Also, excluded files cannot be copied by `COPY`, so validate required file coverage.

## When cache misses are higher than expected

To stabilize dependency caching, copy not only `build.gradle` and `settings.gradle`, but also files that influence dependency resolution, such as `gradle.properties` and `gradle/libs.versions.toml`.

Project structure differs.
The principle is to copy files involved in dependency resolution first.
`./gradlew dependencies` is a useful cache hint, but some plugin/configuration structures can still trigger additional downloads later.
When possible, review BuildKit options such as cache mounts to reduce repeated dependency downloads further.

<br>

# Runtime Stability: Timeout and Shutdown Handling
Even with small images, missing signal handling and timeout policy reduces operational stability.
Explicit JVM options and graceful shutdown windows are practical safeguards.

## ENTRYPOINT/CMD and PID 1

Key terms:

- `PID 1`: first main process inside the container
- `SIGTERM`: normal termination request signal
- `SIGKILL`: forced immediate termination signal (no shutdown logic)

```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Dfile.encoding=UTF-8"
ENV SPRING_LIFECYCLE_TIMEOUT_PER_SHUTDOWN_PHASE=20s

COPY app.jar ./app.jar
# shell form + exec: balance env expansion with PID 1 signal handling
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
```

Operationally, this separation helps:

- `ENTRYPOINT`: fixed executable command
- `CMD`: default arguments (overridable at runtime)

If `sh -c` runs without `exec`, the shell can remain PID 1 and signal handling may differ from expectation.
This example uses shell form because environment variable expansion such as `JAVA_OPTS` is required.
With `exec`, the Java process receives PID 1 signals directly, improving graceful-shutdown behavior.
Forced-stop timing also depends on `docker stop -t`, Compose `stop_grace_period`, and runtime defaults.
Typically, `docker stop` sends `SIGTERM` first and sends `SIGKILL` if the process does not exit within the grace window.

## Local validation for shutdown behavior

```bash
# Start container
docker run --name demo-app -p 8080:8080 myapp:latest
# Send SIGTERM, wait up to 30s, then force stop
docker stop -t 30 demo-app
```

If shutdown-hook logs appear and the app exits within 30 seconds, graceful shutdown path is wired.

## Application timeout/retry baseline

Set external call timeouts in configuration as well.
The keys below (`client.payment.*`) are custom properties, not Spring built-in keys.

```yaml
# application.yml
client:
  payment:
    # Connection establishment timeout to external system
    connect-timeout-ms: 500
    # Response read timeout
    read-timeout-ms: 1500
    # Limit retries to transient failures
    retry-max-attempts: 2
server:
  # Finish in-flight requests when SIGTERM is received
  shutdown: graceful
```

Before increasing retries, verify idempotency design first.
For payment APIs, teams commonly constrain duplicate execution with `requestId` or `idempotencyKey`.

<br>

# Keep Error Classification and Log Context in Code
Even with a strong Dockerfile, incidents continue if application errors are not classified.
This example separates transient and permanent failures during payment processing.

```java
@Slf4j
@Service
public class PaymentService {

    public PaymentResult pay(String requestId, String orderId, String idempotencyKey) {
        try {
            PaymentResponse response = callGateway(orderId, idempotencyKey);
            log.info("payment-success requestId={} orderId={} idempotencyKey={}",
                    requestId, orderId, idempotencyKey);
            return PaymentResult.success(response.transactionId());
        } catch (SocketTimeoutException | ConnectException e) {
            // Transient error: retry candidate
            log.warn("payment-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new RetryablePaymentException(e);
        } catch (IllegalArgumentException | AuthenticationException e) {
            // Permanent error: fail fast
            log.error("payment-non-retryable requestId={} orderId={} message={}",
                    requestId, orderId, e.getMessage());
            throw new NonRetryablePaymentException(e);
        }
    }

    private PaymentResponse callGateway(String orderId, String idempotencyKey) {
        // Example external payment call
        return new PaymentResponse("tx-123");
    }
}
```

Restrict retries to conditions such as network timeout and transient failures.
Retrying permanent failures such as invalid parameters or authentication errors only increases latency and queue buildup.

<br>

# Closing
The core of Dockerfile optimization is not only reducing image size.
It is increasing cache reuse and operational stability together.

You can validate improvements quickly by checking these items.

- Whether dependency files and source files are separated instead of starting with `COPY . .`
- Whether builder/runtime multi-stage separation minimizes runtime image
- Whether `.dockerignore` and non-root execution align context and permission baseline
- Whether shutdown behavior is verified through `docker stop -t` and timeout/retry configuration

# References
- <a href="https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" target="_blank" rel="nofollow">Docker Docs: Building best practices</a>
- <a href="https://docs.docker.com/build/building/multi-stage/" target="_blank" rel="nofollow">Docker Docs: Multi-stage builds</a>
- <a href="https://docs.docker.com/reference/dockerfile/" target="_blank" rel="nofollow">Docker Docs: Dockerfile reference</a>
