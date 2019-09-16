---
layout:   post
title:    Spring Boot에서 Log4j2 설정하기
author:   Kimtaeng
tags: 	  springboot log4j2 
subtitle: Spring Boot 프로젝트에서 로깅을 위해 Log4j2를 설정해보자 
category: Spring
comments: true
---

<hr/>

# 설정해보자

먼저, ```pom.xml```에 아래와 같이 dependency를 설정해줍니다.

<pre class="line-numbers"><code class="language-xml" data-start="1">&lt;parent&gt;
    &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
    &lt;artifactId&gt;spring-boot-starter-parent&lt;/artifactId&gt;
    &lt;version&gt;2.0.4.RELEASE&lt;/version&gt;
    &lt;relativePath/&gt;
&lt;/parent&gt;

&lt;properties&gt;
    &lt;project.build.sourceEncoding&gt;UTF-8&lt;/project.build.sourceEncoding&gt;
    &lt;project.reporting.outputEncoding&gt;UTF-8&lt;/project.reporting.outputEncoding&gt;
    &lt;java.version&gt;1.8&lt;/java.version&gt;
&lt;/properties&gt;

&lt;dependencies&gt;
    &lt;dependency&gt;
        &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
        &lt;artifactId&gt;spring-boot-starter-web&lt;/artifactId&gt;
        &lt;exclusions&gt;
            &lt;exclusion&gt;
                &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
                &lt;artifactId&gt;spring-boot-starter-logging&lt;/artifactId&gt;
            &lt;/exclusion&gt;
        &lt;/exclusions&gt;
    &lt;/dependency&gt;
    &lt;dependency&gt;
        &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
        &lt;artifactId&gt;spring-boot-starter-log4j2&lt;/artifactId&gt;
    &lt;/dependency&gt;
&lt;/dependencies&gt;
</code></pre>

```exclusion```을 설정한 부분이 없는 경우에는 스프링 부트에서 기본 설정으로 되어있는 logback을 사용하게 됩니다.
이부분을 제외하고 프로젝트를 시작해보면 아래와 같은 메시지를 볼 수 있습니다.

```Actual binding is of type [ch.qos.logback.classic.util.ContextSelectorStaticBinder]```

의존성 설정 이후에는 ```src/main/resources``` 경로에 ```log4j2.xml``` 파일을 생성합니다.
XML이 아닌 프로퍼티 설정 파일로도 진행할 수 있는데 그 경우에는 ```log4j2.properties```을 생성하면 됩니다.

그리고 생성한 XML 파일에 아래와 같이 작성합니다.

<pre class="line-numbers"><code class="language-xml" data-start="1">&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
&lt;Configuration status=&quot;info&quot; monitorInterval=&quot;30&quot;&gt;
    &lt;Properties&gt;
        &lt;Property name=&quot;LOG_FORMAT&quot;&gt;%d{yyyy-MM-dd HH:mm:ss} %p %m%n&lt;/Property&gt;
        &lt;Property name=&quot;BASE_DIR&quot;&gt;/Users/madplay/Desktop/bootdemo&lt;/Property&gt;
    &lt;/Properties&gt;

    &lt;Appenders&gt;
        &lt;Console name=&quot;Console&quot; target=&quot;SYSTEM_OUT&quot; follow=&quot;true&quot;&gt;
            &lt;PatternLayout pattern=&quot;${LOG_FORMAT}&quot;/&gt;
        &lt;/Console&gt;
        &lt;RollingFile name=&quot;File&quot;
                     fileName=&quot;${BASE_DIR}/bootdemo.log&quot;
                     filePattern=&quot;${BASE_DIR}/bootdemo.%d{yyyyMMdd}.log&quot;&gt;
            &lt;PatternLayout pattern=&quot;${LOG_FORMAT}&quot;/&gt;
            &lt;Policies&gt;
                &lt;TimeBasedTriggeringPolicy /&gt;
            &lt;/Policies&gt;
            &lt;DefaultRolloverStrategy&gt;
                &lt;Delete basePath=&quot;${BASE_DIR}&quot;&gt;
                    &lt;IfFileName glob=&quot;*.log&quot; /&gt;
                    &lt;IfLastModified age=&quot;30d&quot; /&gt;
                &lt;/Delete&gt;
            &lt;/DefaultRolloverStrategy&gt;
        &lt;/RollingFile&gt;
    &lt;/Appenders&gt;

    &lt;Loggers&gt;
        &lt;Root level=&quot;info&quot;&gt;
            &lt;AppenderRef ref=&quot;Console&quot;/&gt;
            &lt;AppenderRef ref=&quot;File&quot; /&gt;
        &lt;/Root&gt;
    &lt;/Loggers&gt;
&lt;/Configuration&gt;
</code></pre>

콘솔과 파일에 모두 로그를 남기게 설정하였습니다. 특정 파일 패턴으로 로그 파일이 생성되며 30일이상 지나는 경우 삭제됩니다.
마지막으로 애플리케이션 코드에서는 아래와 같이 Logger를 사용하면 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">package com.madplay.bootdemo.controller;

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
</code></pre>

Console과 File에 모두 로그가 남도록 설정했기 때문에 아래의 로그가 양쪽에 남게 됩니다.

```
2018-09-15 00:51:38 DEBUG Hello Debug level log
2018-09-15 00:51:38 INFO Hello Info level log
2018-09-15 00:51:38 ERROR Hello Error level log
```

이처럼 ```log4j2```를 설정하고 이용하는 방법은 생각보다 꽤 간단합니다. 물론 콘솔과 파일에 출력하는 것 외에
<a href="http://home.apache.org/~rpopma/log4j/2.6/manual/appenders.html" target="_blank">다양한 Appender(링크)</a>들을
추가할 수도 있고 각 Logger에 대해서 보다 세부적인 설정을 할 수 있습니다.