---
layout:   post
title:    log4j, logback 그리고 log4j2
author:   Kimtaeng
tags: 	  java log4j logback log4j2
description: 자바의 로깅 프레임워크인 log4j, logback 그리고 log4j2에 대해서 알아보자.
category: Java
comments: true
---

# Java의 여러가지 Logger들
Java 진영에는 여러가지 로깅 관련 프레임워크가 있습니다. 흔히 접하기 어려운 commons logging과 JUL(Java Uitl Logging)도 있고요.
이번에 비교할 대상인 log4j, logback 그리고 log4j2가 있습니다.

간단하게 시간 순서대로 비교하면 `log4j, logback, log4j2` 순서로 등장했습니다.
그러니까 log4j2가 상대적으로 최근에 등장한 로깅 프레임워크지요. logback과 log4j2는 log4j를 기반으로 하고 있어서
설정하는 방법이나 사용 방법이 유사합니다.

비슷하긴 하지만 다른 로깅 프레임워크로 전환할 때를 생각한다면 slf4j 라는 녀석의 도움이 필요합니다.
`slf4j`는 Java 진영의 로깅 프레임워크들의 추상체(facade) 역할을 하는데요.
자바로 따지면 인터페이스와 비슷한 역할을 하며 사용중인 **로깅 프레임워크가 변경되더라도
소스 코드 자체의 변경을 막을 수 있습니다.**

<br/>

# Logger 추상체 slf4j
slf4j는 말그대로 로깅에 대한 추상체를 제공하는 것이며 그 자체를 사용하는 편은 적습니다.
간단하게 예제를 살펴보면 아래와 같습니다. 먼저 아래와 같이 dependency를 추가해야 겠지요?

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.25</version>
</dependency>
```

실행을 위한 자바 코드도 작성하고요.

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

실행하면 아래와 같은 오류를 확인할 수 있습니다.

<div class="post_caption">
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".<br/>
SLF4J: Defaulting to no-operation (NOP) logger implementation...생략<br/>
</div>

구현체가 없다는 뜻이지요. 앞서 언급했지만 slf4j 자체를 로거로 사용하는 경우를 본 적이 거의 없는 것 같습니다만
그래도 궁금함을 해결해보고자... `slf4j-simple` 이라는 dependency를 추가해서 사용해봅시다.

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-simple</artifactId>
    <version>1.7.25</version>
</dependency>
```

<div class="post_caption">[main] INFO post.logging.LoggingSample - Hello slf4j Logger!</div>

위와 같이 로그가 찍히는 것을 알 수 있습니다. 하지만 기능이 너무 단순하여 실제로는 사용할 필요가 없긴합니다.
대부분 logback이나 log4j2와 같은 프레임워크와 같이 사용하지요. slf4j가 인터페이스의 역할을 해주기 때문에
로깅 구현체가 바뀌더라도 생각보다 어렵지않게 변경할 수 있습니다.

<br/>

# 이제 안녕 log4j
Apache의 log4j는 꽤 오래된 로깅 프레임워크입니다. **2015년에 개발팀의 log4j 개발 중단** 발표가 있었고요.
이제는 새 프로젝트에 적용하려면 다른 로깅 프레임워크를 사용해야 합니다.

log4j를 사용하려면 아래와 같이 dependency 추가가 필요합니다.

```xml
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

설정에 필요한 log4j.properties 파일도 필요하고요.
```properties
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target=System.out
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%d{HH:mm:ss,SSS} %-5p [%c] - %m%n

log4j.rootLogger=info, stdout
```

아래와 같이 실행하여 로그를 출력할 자바 코드도 작성해줍니다.

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

사용은 간단하지요? 콘솔로 출력하는 stdout 외에도 파일 출력도 제공합니다.
하지만 역시나 2015년에 개발이 중단되었기 때문에 기존 시스템이 아니라면 사용할 이유가 없습니다.
사실 오랫동안 개발되어온 시스템이어도 바꿀 수 있는 기회가 있다면 바꾸는 것이 좋겠지요.

<br/>

# log4j를 잇는다. logback
log4j를 구현한 개발자가 logback을 개발했습니다. log4j와 유사하면서도 향상된 성능과 필터링 옵션을 제공하며
slf4j도 지원합니다. 그리고 참 편리한 자동 리로드도 가능합니다.

Maven으로 관리하는 프로젝트에서 logback 관련 dependency를 추가하려고 하면 `logback-core`와
`logback-classic`을 확인할 수 있는데요. core의 경우 로깅 프레임워크로서의 핵심 기능이 포함되어 있습니다.
classic의 경우는 핵심 기능에 slf4j에 대한 지원과 같은 추가 기능을 제공합니다.

사용하려면 아래와 같이 dependency 추가하면 됩니다.

```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.2.3</version>
</dependency>
```

설정은 xml로 진행해봅시다. logback.xml을 생성하고 아래와 같이 간단하게 작성합니다.

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

그리고 실행할 자바 코드도 작성합니다.

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

출력할 로그 포맷이나 특정 패키지에 적용하는 방법 등 찾아보면 다양한 logback 설정 방법이 있습니다.

<br/>

# 가장 최신이다. log4j2
log4j2는 앞서 살펴본 log4j와 logback과 비교했을 때 가장 최근에 등장했습니다.
logback과 동일하게 자동 리로드 기능과 필터링 기능을 제공합니다.

설정은 아래와 같이 진행하면 됩니다. 먼저 dependency를 선언해야 하고요.

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

log4j2에 대한 설정은 다음과 같이 진행하면 됩니다. log4j2.xml을 생성하고 아래와 같이 작성합니다.

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

자바 코드는 아래와 같습니다. 변경을 구분하기 위해서 로그로 출력될 메시지만 바꿨을뿐
Logger에 대한 설정은 logback에서의 설정과 변경된 것이 없습니다. 패키지 import도 동일하고요. 

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

앞서 언급한 것처럼 slf4j가 있기때문에 logback과 log4j2를 비교적 간단하게 전환할 수 있습니다.
dependency 선언만 변경했을뿐 실제 어플리케이션 코드를 수정한 부분은 없습니다.

<br/>

# 그럼 뭐가 좋을까?
log4j는 개발이 중단되었으므로 비교 대상에서 제외한다면 logback과 log4j2가 남았는데요.
과연 어느 로깅 프레임워크가 더 좋을까? 라는 질문의 글을 많이 본 것 같습니다.

단순하게 비교만 해본다면 가장 최신(최신이라고 항상 좋은 것은 아니지만)이자 빠르며 
**logback의 아키텍처에서 발생하는 문제점을 수정한** 이라고 Apache가 소개하는 log4j2를 권장할 것 같습니다.

Apache에 따르면 멀티 스레드 환경에서의 비동기 로거(Async Logger)의 경우
**log4j 1.x 및 logback보다 몇 배나 되는 처리량**을 보인다고 합니다.
그리고 **람다 표현식**과 **사용자 정의 로그 레벨**도 지원하고요.

2018년 9월을 기준으로 log4j2의 최신 버전은 7월에 Release된 2.11.1 입니다.