---
layout:   post
title:    "How to Fix ClassNotFoundException: JAXBException When Running a Spring Boot Project on Java 9"
author:   Kimtaeng
tags: 	  java9 springboot exception
description: You upgraded to Java 9 and now your Spring Boot project fails at startup. How do you fix it?
category: Spring
lang: en
slug: java9-jaxb-exception-in-springboot
permalink: /en/java9-jaxb-exception-in-springboot/
date: "2020-01-13 21:38:20"
comments: true
---

# After Upgrading to Java 9...

When developing a Spring Boot project on Java 8, there was no issue. After upgrading to Java 9, the application failed at startup with errors like the following.
The key lines were java.lang.NoClassDefFoundError: javax/xml/bind/JAXBException... and java.lang.ClassNotFoundException: javax.xml.bind.JAXBException...

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

I also tried Java 11, but the error remained. Still, the message was clear:
`java.lang.ClassNotFoundException`. The class (JAXB in this case) was not found.

<br/>

# What Is the Cause?

After checking related references, JAXB APIs are considered Java EE APIs and are no longer included from Java 9.
Also, they were fully removed from the JDK starting with Java 11.

- <a href="https://stackoverflow.com/a/43574427/9212562" rel="nofollow" target="_blank">
Reference: Stack Overflow community</a>

<br/>

# How to Fix It?

Since the cause is clear, the fix is straightforward. ~~Use Java 8.~~ Add JAXB-related libraries to the project.

```xml
// maven example
<dependency>
    <groupId>javax.xml.bind</groupId>
    <artifactId>jaxb-api</artifactId>
    <version>2.3.0</version>
</dependency>
```

```gradle
// gradle example
compile group: 'javax.xml.bind', name: 'jaxb-api', version: '2.3.0'
```
