---
layout:   post
title:    Setting Up a Spring MVC + Maven Project in IntelliJ
author:   Kimtaeng
tags: 	  springmvc maven intellij
description: Create a Maven-based Spring MVC project in IntelliJ IDEA.
category: Spring
date: "2019-02-08 21:15:32"
comments: true
slug:     create-spring-mvc-project-in-intellij
lang:     en
permalink: /en/post/create-spring-mvc-project-in-intellij
---

# Development Environment
> Updated as of February 2020. Depending on timing, details may differ, so verify versions.

- macOS Mojave
- Java 11
- Spring 5.2.4
- Tomcat 9.0.33
- Maven 3.6.1
- IntelliJ IDEA Ultimate 2019.3

<br>

# Create the Project
Let’s create a Spring MVC project in `IntelliJ IDEA` step by step.

## New Project
- Select `New > Project > Maven`.

<img class="post_image" width="700" alt="project creation"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-1.jpg" />

<br>

## Name and Location
- Set the project name and path as you prefer.
- You can skip the artifact details.
  - `GroupId` typically uses the company domain in reverse.
  - `ArtifactId` usually matches the project name.
  - `Version` represents the project version.

<img class="post_image" width="700" alt="project info"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-2.jpg" />

<br>

## Add Framework Support
- Right-click the project and choose `Add Framework Support...`.

<img class="post_image" width="700" alt="add framework"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-3.jpg" />

<br>

- Select `Spring MVC` on the left.
  - If you choose to download, IntelliJ adds related config files automatically.

<img class="post_image" width="700" alt="add spring mvc"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-4.jpg" />

<br><br>

# Project Configuration
After the project is created, update configuration files.

## Update pom.xml
- Add the dependencies below to `pom.xml`.
  - Use `^N` or right-click the editor to open the context menu.
  - Choose `Generate...` and then `Dependency` to search for artifacts.
- Add `spring-webmvc`. Real projects typically require more dependencies.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.madlife.madplay</groupId>
    <artifactId>springMVC</artifactId>
    <version>1.0-SNAPSHOT</version>

    <!-- centralized version properties -->
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

## Update web.xml
- Change the `url-pattern` in `web.xml`.
  - By default it is `*.form`; change it to `/`.
- Add `absolute-ordering`.
  - Without it, Tomcat shows: `More than one fragment with the name [spring_web] was found.`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <!-- required to avoid startup errors -->
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

## Update the Servlet Config
- Update `dispatcher-servlet.xml`.
  - You can rename the file if you want, but update `web.xml` accordingly.
- Add `<mvc:annotation-driven/>` to register required MVC beans.
- Add `<context:component-scan>` and set `base-package`.
- Configure the view resolver. The values below are a good starting point.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mvc="http://www.springframework.org/schema/mvc"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/mvc https://www.springframework.org/schema/mvc/spring-mvc.xsd http://www.springframework.org/schema/context https://www.springframework.org/schema/context/spring-context.xsd">

    <!-- enable annotation-based MVC -->
    <mvc:annotation-driven/>

    <!-- base package -->
    <context:component-scan base-package="com.madlife.madplay"/>

    <!-- view resolver -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
    </bean>
</beans>
```

<br><br>

# Add Server Code
Now add the server-side code.

## Add a Controller
- Under `src/main/java`, create the `com.madlife.madplay` package.
  - This matches the `base-package` in `dispatcher-servlet.xml`.
- Add `HomeController.java`.

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

## Add the View
- Create a `views` directory under `web/WEB-INF`.
  - If you change the path, update `dispatcher-servlet.xml`.
- Add `hello.jsp` to `views`.

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

# Run the Server
Configuration and code are done. Now add Tomcat and run it.

## Add Tomcat
- Click `Run > Edit Configurations...` and add a Tomcat server.

<img class="post_image" width="700" alt="Run/Debug Configurations"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-5.jpg" />

<br>

- Click `Configure...` and set Tomcat 9 in `Application Servers`.
  - Download Tomcat from the official site.
  - <a href="https://tomcat.apache.org/download-90.cgi" target="_blank" rel="nofollow">
    Link: https://tomcat.apache.org/download-90.cgi</a>

<img class="post_image" width="700" alt="Application servers menu"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-6.jpg" />

<br>

- If `artifact` is missing, you will see an error at the bottom.
  - Click `Fix` to add the artifact.
- If it does not appear automatically, go to `Build > Build Artifacts`.

<img class="post_image" width="700" alt="fix and add artifact"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-7.jpg" />

<br>

- Set `Application context` to `/`.
  - This sets the default context path when the server starts.
  - For example, `/main` would make the base path `http://localhost:8080/main`.

<img class="post_image" width="700" alt="set context path"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-8.jpg" />

<br>

## Verify the Server
- Start Tomcat and open `http://localhost:8080`.
  - If the page loads as shown below, the setup is complete.

<img class="post_image" width="700" alt="run tomcat server and check result"
src="{{ site.baseurl }}/img/post/2019-02-08-create-spring-mvc-project-in-intellij-9.jpg" />

The Spring MVC project and baseline configuration are now complete.
