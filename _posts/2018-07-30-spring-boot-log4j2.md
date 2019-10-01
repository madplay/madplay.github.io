---
layout:   post
title:    Spring Boot에서 Log4j2 설정하기
author:   Kimtaeng
tags: 	  springboot log4j2
description: 스프링 부트(Spring Boot) 프로젝트에서 로깅을 위해 Log4j2를 설정해보자 
category: Spring
comments: true
---

# 설정해보자
스프링 부트 프로젝트에 로깅을 위해 log4j2를 연동해보자. 먼저, `pom.xml`에 아래와 같이 관련 dependency를 선언해주자.

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

`exclusion`을 설정한 부분이 없는 경우에는 스프링 부트에서 기본 설정으로 되어있는 logback을 사용하게 됩니다.
이부분을 제외하고 프로젝트를 시작해보면 아래와 같은 메시지를 볼 수 있습니다.

`Actual binding is of type [ch.qos.logback.classic.util.ContextSelectorStaticBinder]`

의존성 설정 이후에는 `src/main/resources` 경로에 `log4j2.xml` 파일을 생성합니다.
XML이 아닌 프로퍼티 설정 파일로도 진행할 수 있는데 그 경우에는 `log4j2.properties`을 생성하면 됩니다.

그리고 생성한 XML 파일에 아래와 같이 작성합니다.

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

콘솔과 파일에 모두 로그를 남기게 설정하였습니다. 특정 파일 패턴으로 로그 파일이 생성되며 30일이상 지나는 경우 삭제됩니다.
마지막으로 애플리케이션 코드에서는 아래와 같이 Logger를 사용하면 됩니다.

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

Console과 File에 모두 로그가 남도록 설정했기 때문에 아래의 로그가 양쪽에 남게 됩니다.

```bash
2018-09-15 00:51:38 DEBUG Hello Debug level log
2018-09-15 00:51:38 INFO Hello Info level log
2018-09-15 00:51:38 ERROR Hello Error level log
```

이처럼 `log4j2`를 설정하고 이용하는 방법은 생각보다 꽤 간단합니다. 물론 콘솔과 파일에 출력하는 것 외에
<a href="http://home.apache.org/~rpopma/log4j/2.6/manual/appenders.html" rel="nofollow" target="_blank">
다양한 Appender(링크)</a>들을 추가할 수도 있고 각 Logger에 대해서 보다 세부적인 설정을 할 수 있습니다.