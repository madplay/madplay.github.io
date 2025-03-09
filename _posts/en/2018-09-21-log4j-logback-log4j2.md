---
layout:   post
title:    log4j, logback, and log4j2
author:   Kimtaeng
tags: 	  java log4j logback log4j2
description: Let's learn about log4j, logback, and log4j2, Java's logging frameworks.
category: Java
comments: true
slug:     log4j-logback-log4j2
lang:     en
permalink: /en/post/log4j-logback-log4j2
---

# A Landscape of Java Logging Frameworks
The Java ecosystem offers several logging frameworks. While `commons-logging` and Java Util Logging (JUL) exist, the primary comparison involves `log4j`, `logback`, and `log4j2`.

These frameworks evolved chronologically: `log4j`, followed by `logback`, and most recently, `log4j2`. Both `logback` and `log4j2` build upon the concepts of `log4j`, resulting in similar configuration and usage patterns.

Despite their similarities, migrating between these frameworks necessitates a facade. The Simple Logging Facade for Java (`slf4j`) provides a standardized abstraction layer for various logging implementations. Functioning like a Java interface, **`slf4j` decouples the application's source code from the underlying logging framework, enabling seamless implementation swaps without code modification.**

<br/>

# SLF4J: The Logging Abstraction
`slf4j` provides a generic logging API and is rarely used as a standalone implementation. The following example demonstrates its core concept. First, the API dependency is declared:

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.25</version>
</dependency>
```

The corresponding application logic uses the `slf4j` API:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Kimtaeng
 * Created on 2018. 9. 21.
 */
public class LoggingSample {
    Logger logger = LoggerFactory.getLogger(LoggingSample.class);

    public void someMethod() {
        logger.info("Hello slf4j Logger!");
    }

    public static void main(String[] args) {
        new LoggingSample().someMethod();
    }
}
```

Executing this code without a binding results in a runtime error:

<div class="post_caption">
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".<br/>
SLF4J: Defaulting to no-operation (NOP) logger implementation...omitted<br/>
</div>

This indicates a missing logging implementation. To satisfy this requirement for a simple demonstration, the `slf4j-simple` binding can be added:

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-simple</artifactId>
    <version>1.7.25</version>
</dependency>
```

<div class="post_caption">[main] INFO post.logging.LoggingSample - Hello slf4j Logger!</div>

While this produces output, the `slf4j-simple` implementation lacks robust features and is not intended for production use. Production systems typically pair `slf4j` with a more powerful framework like `logback` or `log4j2`. The facade architecture simplifies switching between these underlying implementations.

<br/>

# Deprecation of log4j
Apache's `log4j` is a legacy logging framework. **Official end-of-life was announced in 2015**, rendering it unsuitable for new projects.

A `log4j` setup requires the following dependency:

```xml
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

Configuration is managed via a `log4j.properties` file:
```properties
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target=System.out
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%d{HH:mm:ss,SSS} %-5p [%c] - %m%n

log4j.rootLogger=info, stdout
```

The logger is invoked directly from the `log4j` package:

```java
import org.apache.log4j.Logger;

/**
 * @author Kimtaeng
 * Created on 2018. 9. 21.
 */
public class LoggingSample {
    Logger logger = Logger.getLogger(LoggingSample.class);

    public void someMethod() {
        logger.info("Hello log4j Logger!");
    }

    public static void main(String[] args) {
        new LoggingSample().someMethod();
    }
}
```

<div class="post_caption">INFO  [post.logging.LoggingSample] - Hello log4j Logger!</div>

While `log4j` provides basic console and file output, its discontinued status makes migration a priority for legacy systems.

<br/>

# Logback: The Successor to log4j
Developed by the original creator of `log4j`, `logback` offers significant performance improvements, advanced filtering, native `slf4j` support, and automatic configuration reloading.

The Maven dependency setup distinguishes between `logback-core` and `logback-classic`. The `core` module contains the essential logging engine, while the `classic` module includes the `slf4j` binding and other extended features.

A typical `logback` setup includes the `logback-classic` dependency:

```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.2.3</version>
</dependency>
```

Configuration is handled through `logback.xml`:

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <root level="debug">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

The application code remains unchanged, continuing to use the `slf4j` API:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Kimtaeng
 * Created on 2018. 9. 21.
 */
public class LoggingSample {
    Logger logger = LoggerFactory.getLogger(LoggingSample.class);

    public void someMethod() {
        logger.info("Hello logback Logger!");
    }

    public static void main(String[] args) {
        new LoggingSample().someMethod();
    }
}
```

<div class="post_caption">[main] INFO  post.logging.LoggingSample - Hello logback Logger!</div>

Logback offers extensive configuration options for defining output formats and applying logger settings to specific packages.

<br/>

# Log4j2: The Modern Contender
`log4j2` is the most recent framework of the three. It incorporates features from `logback`, such as automatic reloading and filtering, while introducing its own architectural enhancements.

The dependency setup for `log4j2` with `slf4j` is more granular:

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.25</version>
</dependency>
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-api</artifactId>
    <version>2.9.0</version>
</dependency>
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.9.0</version>
</dependency>
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j-impl</artifactId>
    <version>2.9.0</version>
</dependency>
```

Configuration resides in `log4j2.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="warn" >
    <Appenders>
        <Console name="STDOUT" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
    </Appenders>
    <Loggers>
        <Root level="info">
            <AppenderRef ref="STDOUT"/>
        </Root>
    </Loggers>
</Configuration>
```

Again, the application code requires no modification due to the `slf4j` facade. Only the log message is altered to demonstrate the switch:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Kimtaeng
 * Created on 2018. 9. 21.
 */
public class LoggingSample {
    Logger logger = LoggerFactory.getLogger(LoggingSample.class);

    public void someMethod() {
        logger.info("Hello log4j2 Logger!");
    }

    public static void main(String[] args) {
        new LoggingSample().someMethod();
    }
}
```

<div class="post_caption">[main] INFO  post.logging.LoggingSample - Hello log4j2 Logger!</div>

The power of the `slf4j` facade is evident here. Switching between `logback` and `log4j2` is a matter of changing dependencies and the configuration file, with no impact on the application's source code.

<br/>

# Recommendation
With `log4j` deprecated, the choice is between `logback` and `log4j2`.

`log4j2` is the recommended framework. It is the most modern, delivers high performance, and, as presented by Apache, **resolves architectural issues present in `logback`**.

According to Apache benchmarks, `log4j2`'s Asynchronous Loggers deliver **orders of magnitude higher throughput** in multi-threaded environments compared to `log4j 1.x` and `logback`. It also introduces support for **lambda expressions** and **custom log levels**.

The latest version of `log4j2` as of September 2018 is 2.11.1, released in July.
