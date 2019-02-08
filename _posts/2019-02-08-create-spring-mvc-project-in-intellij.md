---
layout:   post
title:    Intellij에서 Spring MVC + Maven 프로젝트 설정하기
author:   Kimtaeng
tags: 	  springmvc maven intellij
description: Intellij IDEA 환경에서 Maven 기반 Spring MVC 프로젝트를 생성해보자.
category: Spring
date: "2019-02-08 21:15:32"
comments: true
---

# 개발 환경
> 2020년 2월을 기준으로 다시 작성합니다.

- MacOS Mojave
- Java 11
- Spring 5.2.4
- Tomcat 9.0.33
- Maven 3.6.1
- Intellij IDEA Ultimate 2019.3

<br>

# 프로젝트 만들기
이제 각 단계별로 `Intellij IDEA`에서 Spring MVC 프로젝트를 만들어보자.

## 새 프로젝트 만들기
- `New > Project > Maven`을 선택한다.

<img class="post_image" width="700" alt="프로젝트 생성"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-1.jpg" />

<br>

## 이름과 위치 지정
- 프로젝트의 이름과 경로는 입맛에 맞게 변경하면 된다.
- 아티팩트 관련 세부 설정을 생략해도 된다.
  - `GroupId`는 관례적으로 회사 도메인의 역순을 사용한다.
  - `ArtifactId`는 보통 프로젝트 이름을 그대로 사용한다.
  - `Version`은 프로젝트의 버전 정보를 나타낸다.

<img class="post_image" width="700" alt="프로젝트 정보 입력"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-2.jpg" />

<br>

## 프레임워크 지원 추가
- 프로젝트 우클릭한 후 `Add Framework Support...`를 선택한다.

<img class="post_image" width="700" alt="프레임워크 추가"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-3.jpg" />

<br>

- 좌측 목록에서 `Spring MVC`를 선택하면 된다.
  - 다운로드를 선택하여 진행하면 관련 설정 파일이 자동으로 추가되어 간편하다.

<img class="post_image" width="700" alt="스프링 MVC 프레임워크 추가"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-4.jpg" />

<br><br>

# 프로젝트 설정
프로젝트 생성이 완료되었으면 이제 관련 설정을 추가하거나 수정해주면 된다.

## pom.xml 수정
- `pom.xml`에 아래와 같이 라이브러리 사용을 위한 의존성을 추가해야 한다.
  - `^N` 단축키를 사용하거나 pom.xml 본문을 오른쪽 클릭하면 팝업 되는 컨텍스트 메뉴가 나타난다.
  - 메뉴에서 `Generate...`를 클릭한 후 `Dependency`를 선택하면 라이브러리를 검색할 수 있다.
- `spring-webmvc`를 추가하면 되는데, 실제 프로젝트를 진행하다 보면 더 많은 의존성이 추가가 필요하다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.madlife.madplay</groupId>
    <artifactId>springMVC</artifactId>
    <version>1.0-SNAPSHOT</version>

    <!-- 공통적인 버전 정보 같은 경우 이렇게 선언하여 사용하면 수정이 발생할 때 편리하다. -->
    <properties>
        <spring.framework.version>5.2.4.RELEASE</spring.framework.version>
        <java.version>11</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>${spring.framework.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>${java.version}</source>
                    <target>${java.version}</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

<br>

## web.xml 수정
- `web.xml`에 선언되어 있는 `url-pattern`을 수정해야 한다.
  - 기본으로 `*.form`으로 설정되어 있는데 이를 `/`로 변경한다.
- 또한 `web.xml`에 `absolute-ordering` 을 추가해야 한다.
  - 그렇지 않으면 톰캣 구동 시에 아래와 같은 오류가 발생한다.
  - `More than one fragment with the name [spring_web] was found.`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <!-- 이 설정이 없으면 오류가 발생한다. -->
    <absolute-ordering/>

    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/applicationContext.xml</param-value>
    </context-param>

    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>

    <servlet>
        <servlet-name>dispatcher</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>/WEB-INF/dispatcher-servlet.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>dispatcher</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>
</web-app>
```

<br>

## 서블릿 설정 파일 수정
- 서블릿 설정을 위한 `dispatcher-servlet.xml` 파일을 수정해야 한다.
  - 파일 이름은 프로젝트에 따라서 입맛에 맞게 수정하면 된다.
  - 다만 `web.xml`에 선언한 파일 이름도 같이 수정해야 한다.
- `<mvc:annotation-driven/>` 을 추가해 준다.
  - MVC 사용 시에 필요한 몇 개의 빈들을 자동으로 등록해 준다.
  - 예로는 `@RequestMapping`을 이용한 핸들러 매핑 등록 등이 있다.
- `<context:component-scan>` 을 추가하고 `base-package`를 지정한다.
  - 이 설정이 있으면 어노테이션을 기반으로 동작할 수 있게 한다.
  - 추가하지 않으면 빈 등록을 직접 다 해주어야 한다.
- **View Resolver** 관련 설정은 프로젝트 설정마다 다를 텐데, 우선은 아래와 같이 작성하자.
  - 프로젝트를 진행하면서 입맛에 맞게 수정하면 된다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mvc="http://www.springframework.org/schema/mvc"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/mvc https://www.springframework.org/schema/mvc/spring-mvc.xsd http://www.springframework.org/schema/context https://www.springframework.org/schema/context/spring-context.xsd">

    <!-- 어노테이션 기반으로 동작하도록 설정 추가 -->
    <mvc:annotation-driven/>

    <!-- 기본 패키지 경로 설정 -->
    <context:component-scan base-package="com.madlife.madplay"/>

    <!-- View Resolver 설정 -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
    </bean>
</beans>
```

<br><br>

# 서버 구현 코드 추가
프로젝트 관련 설정은 완료됐다. 이제 서버 구현을 위한 코드를 추가해주면 된다.

## 컨트롤러 추가
- `src/main/java` 디렉터리 밑에 `com.madlife.madplay` 패키지를 추가한다.
  - 이 경로는 `dispatcher-servlet.xml`에 선언한 `base-package`의 경로와 같다.
- 그리고 패키지 밑에 `HomeController.java`를 추가해서 서버쪽 코드를 구성하자.

```java
package com.madlife.madplay;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * @author madplay
 */
@Controller
public class HomeController {

	@RequestMapping(value = "/")
	public ModelAndView home() {
		ModelAndView mav = new ModelAndView();
		mav.addObject("message", "Hello, World!");
		mav.setViewName("hello");
		return mav;
	}
}
```

<br>

## 뷰 파일 작성
- `View` 역할을 맡을 페이지를 만들어 주면 된다.
  - `web/WEB-INF` 밑에 `views`라는 디렉터리를 만들어 준다.
  - 만일 경로를 변경한다면, `dispatcher-servlet.xml`에 선언한 경로도 수정해야 한다.
- `views` 디렉터리 안에 `hello.jsp` 파일을 추가해준다.

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Hello World.</title>
</head>
<body>
    <h2>${message}</h2>
</body>
</html>
```

<br>

# 서버 구동하기
프로젝트 설정과 서버 구성을 위한 코드 구현도 완료했다. 이제 톰캣 서버를 추가하여 구동하면 된다.

## 톰캣 추가하기
- `Run > Edit Configurations...` 을 클릭하여 톰캣 서버 설정을 추가한다.

<img class="post_image" width="700" alt="Run/Debug Configurations"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-5.jpg" />

<br>

- `Configure...`를 클릭하여 `Application Servers` 메뉴를 통해 톰캣 9버전으로 지정하면 된다.
  - 톰캣 다운로드는 공식 페이지를 통해 다운로드 받으면 된다.
  - <a href="https://tomcat.apache.org/download-90.cgi" target="_blank" rel="nofollow">
    링크: https://tomcat.apache.org/download-90.cgi</a>

<img class="post_image" width="700" alt="Application servers menu"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-6.jpg" />

<br>

- `artifact`를 추가하지 않았다면, 서버 설정 하단에 오류 메시지가 노출된다.
  - `Fix` 버튼을 눌러서 `artifact` 추가하면 된다.
- 자동으로 추가되지 않거나 보이지 않는 경우 `Build > Build Artifacts`를 통하여 생성하면 된다.

<img class="post_image" width="700" alt="fix and add artifact"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-7.jpg" />

<br>

- `Application context`를 `/`로 수정한다.
  - 서버가 구동 됐을 때 기본 context path를 지정한다.
  - 예를 들면 `/main`으로 지정하면 `http://localhost:8080/main`처럼 기본 path가 설정된다.

<img class="post_image" width="700" alt="set context path"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-8.jpg" />

<br>

## 서버 구동한 후 확인
- 톰캣 서버를 구동한 후 `http://localhost:8080`으로 접속해본다.
  - 아래와 같이 페이지가 정상적으로 서버가 구동된 것이다.

<img class="post_image" width="700" alt="run tomcat server and check result"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-9.jpg" />

인텔리제이를 이용한 **Spring MVC 프로젝트** 만들기와 기본 설정 과정이 완료되었다.