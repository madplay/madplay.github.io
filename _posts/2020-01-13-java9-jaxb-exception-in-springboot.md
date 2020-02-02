---
layout:   post
title:    "Java 9로 스프링 부트 프로젝트를 실행할 때 ClassNotFoundException: JAXBException 오류 해결하기"
author:   Kimtaeng
tags: 	  java9 springboot exception
description: Java 9로 업그레이드 했더니, 스프링 부트 프로젝트를 실행시 오류가 발생한다. 어떻게 해야 할까?
category: Spring
date: "2020-01-13 21:38:20"
comments: true
---

# 자바 9로 업그레이드 했는데...

Java 8을 사용하여 스프링 부트 프로젝트를 개발할 때는 문제가 없는데, Java 9로 업그레이드를 한 후에는 실행시 아래와 같은 오류가 발생했다.
핵심만 뽑아본다면 java.lang.NoClassDefFoundError: javax/xml/bind/JAXBException... 그리고 java.lang.ClassNotFoundException: javax.xml.bind.JAXBException...

```bash
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'org.springframework.boot.context.properties.ConfigurationPropertiesBindingPostProcessor': Invocation of init method failed; nested exception is java.lang.NoClassDefFoundError: javax/xml/bind/JAXBException
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1553)
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:539)
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:475)
        at org.springframework.beans.factory.support.AbstractBeanFactory$1.getObject(AbstractBeanFactory.java:302)
        at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:228)
        at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:298)
        at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:198)
        at org.springframework.context.support.PostProcessorRegistrationDelegate.registerBeanPostProcessors(PostProcessorRegistrationDelegate.java:199)
        at org.springframework.context.support.AbstractApplicationContext.registerBeanPostProcessors(AbstractApplicationContext.java:618)
        at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:467)
        at org.springframework.boot.context.embedded.EmbeddedWebApplicationContext.refresh(EmbeddedWebApplicationContext.java:120)
        at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:691)
        at org.springframework.boot.SpringApplication.run(SpringApplication.java:320)
        at org.springframework.boot.SpringApplication.run(SpringApplication.java:952)
        at org.springframework.boot.SpringApplication.run(SpringApplication.java:941)
        at com.apress.isf.spring.HelloWorldController.main(HelloWorldController.java:20)
Caused by: java.lang.NoClassDefFoundError: javax/xml/bind/JAXBException
        at java.base/java.lang.Class.forName0(Native Method)
        at java.base/java.lang.Class.forName(Class.java:398)
        at org.jboss.logging.Logger.getMessageLogger(Logger.java:2248)
        at org.jboss.logging.Logger.getMessageLogger(Logger.java:2214)
        at org.hibernate.validator.internal.util.logging.LoggerFactory.make(LoggerFactory.java:29)
        at org.hibernate.validator.internal.util.Version.<clinit>(Version.java:27)
        at org.hibernate.validator.internal.engine.ConfigurationImpl.<clinit>(ConfigurationImpl.java:65)
        at org.hibernate.validator.HibernateValidator.createGenericConfiguration(HibernateValidator.java:41)
        at javax.validation.Validation$GenericBootstrapImpl.configure(Validation.java:276)
        at org.springframework.validation.beanvalidation.LocalValidatorFactoryBean.afterPropertiesSet(LocalValidatorFactoryBean.java:223)
        at org.springframework.boot.context.properties.ConfigurationPropertiesBindingPostProcessor$Jsr303ValidatorFactory.run(ConfigurationPropertiesBindingPostProcessor.java:343)
        at org.springframework.boot.context.properties.ConfigurationPropertiesBindingPostProcessor.afterPropertiesSet(ConfigurationPropertiesBindingPostProcessor.java:175)
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.invokeInitMethods(AbstractAutowireCapableBeanFactory.java:1612)
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1549)
        ... 15 more
Caused by: java.lang.ClassNotFoundException: javax.xml.bind.JAXBException
        at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(BuiltinClassLoader.java:583)
        at java.base/jdk.internal.loader.ClassLoaders$AppClassLoader.loadClass(ClassLoaders.java:178)
        at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:521)
        ... 29 more
```

더 높은 자바 11로 변경해서 실행해보았으나 오류는 사라지지 않았다. 그래도 오류 메시지는 명확하다.
```java.lang.ClassNotFoundException```이다. 어떤 클래스를(여기서는 JAXB) 찾을 수 없는 것이다.

<br/>

# 원인은 무엇일까?

관련해서 찾아보니, JAXB API는 Java EE(Enterprise Edition) API로 간주되며 자바 9버전부터는 더 이상 포함되지 않는다.
게다가 자바 11부터는 JDK에서 완전히 삭제되었다고 한다.

- <a href="https://stackoverflow.com/a/43574427/9212562" rel="nofollow" target="_blank">
관련 참고: 스택오버플로우(Stackoverflow) 커뮤니티</a>

<br/>

# 어떻게 해결할까?

원인이 확실한 만큼 해결책도 확실하다. ~~자바 8을 사용하면 된다.~~ 프로젝트에 JAXB 관련 라이브러리를 포함해주면 된다.

```xml
// maven 예시
<dependency>
    <groupId>javax.xml.bind</groupId>
    <artifactId>jaxb-api</artifactId>
    <version>2.3.0</version>
</dependency>
```

```gradle
// gradle 예시
compile group: 'javax.xml.bind', name: 'jaxb-api', version: '2.3.0'
```