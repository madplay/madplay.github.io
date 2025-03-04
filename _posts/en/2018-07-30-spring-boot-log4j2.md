---
layout:   post
title:    Setting Up Log4j2 in Spring Boot
author:   Kimtaeng
tags: 	  springboot log4j2
description: Let's set up Log4j2 for logging in Spring Boot projects
category: Spring
comments: true
slug:     spring-boot-log4j2
lang:     en
permalink: /en/post/spring-boot-log4j2
---

# Let's Set It Up
Integrating log4j2 for logging in Spring Boot projects. First, declare related dependencies in `pom.xml` as follows.

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.4.RELEASE</version>
    <relativePath/>
</parent>

<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <exclusions>
            <exclusion>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-logging</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-log4j2</artifactId>
    </dependency>
</dependencies>
```

If there's no `exclusion` setting, logback set as default in Spring Boot is used.
If you start the project without excluding this part, you can see messages like below.

`Actual binding is of type [ch.qos.logback.classic.util.ContextSelectorStaticBinder]`

After dependency settings, create a `log4j2.xml` file in the `src/main/resources` path.
You can also proceed with property configuration files instead of XML, and in that case, create `log4j2.properties`.

And write in the created XML file as follows.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="info" monitorInterval="30">
    <Properties>
        <Property name="LOG_FORMAT">%d{yyyy-MM-dd HH:mm:ss} %p %m%n</Property>
        <Property name="BASE_DIR">/Users/madplay/Desktop/bootdemo</Property>
    </Properties>

    <Appenders>
        <Console name="Console" target="SYSTEM_OUT" follow="true">
            <PatternLayout pattern="${LOG_FORMAT}"/>
        </Console>
        <RollingFile name="File"
                     fileName="${BASE_DIR}/bootdemo.log"
                     filePattern="${BASE_DIR}/bootdemo.%d{yyyyMMdd}.log">
            <PatternLayout pattern="${LOG_FORMAT}"/>
            <Policies>
                <TimeBasedTriggeringPolicy />
            </Policies>
            <DefaultRolloverStrategy>
                <Delete basePath="${BASE_DIR}">
                    <IfFileName glob="*.log" />
                    <IfLastModified age="30d" />
                </Delete>
            </DefaultRolloverStrategy>
        </RollingFile>
    </Appenders>

    <Loggers>
        <Root level="info">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="File" />
        </Root>
    </Loggers>
</Configuration>
```

I set it to log to both console and files. Log files are created with specific file patterns and are deleted if more than 30 days pass.
Finally, in application code, use Logger as follows.

```java
package com.madplay.bootdemo.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author kimtaeng
 */
@RestController
public class HelloController {
    private static final Logger LOGGER = LogManager.getLogger(HelloController.class);

    @GetMapping(value = "hello")
    public void greet() {
        LOGGER.debug("Hello Debug level log");
        LOGGER.info("Hello Info level log");
        LOGGER.error("Hello Error level log");
        
    }
}
```

Since I set it to log to both Console and File, logs below are left in both places.

```bash
2018-09-15 00:51:38 DEBUG Hello Debug level log
2018-09-15 00:51:38 INFO Hello Info level log
2018-09-15 00:51:38 ERROR Hello Error level log
```

Like this, methods for setting and using `log4j2` are quite simple. Of course, besides outputting to console and files,
you can also add <a href="http://home.apache.org/~rpopma/log4j/2.6/manual/appenders.html" rel="nofollow" target="_blank">
various Appenders (link)</a> and make more detailed settings for each Logger.
