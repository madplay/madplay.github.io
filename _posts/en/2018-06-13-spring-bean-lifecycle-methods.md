---
layout:   post
title:    Spring Bean Lifecycle Methods and Execution Order
author:   Kimtaeng
tags: 	  spring bean lifecycle
description: What are the Bean Lifecycle methods in Spring Framework? And in what order are they executed?
category: Spring
date: "2018-06-13 23:06:22"
comments: true
slug:     spring-bean-lifecycle-methods
lang:     en
permalink: /en/post/spring-bean-lifecycle-methods
---

# Initialization Methods
Spring Framework provides various methods to initialize after creating beans. Learning about initialization methods that execute
after Spring beans (Bean) are created and Dependency Injection (hereinafter DI) is completed.

## @PostConstruct
The usage method is very simple. Just attach the `@PostConstruct` annotation above the method declaration to use for initialization.
For reference, it's a spec specified in Java Specification Request (hereinafter JSR) 250, and its characteristic is that it's not dependent on Spring Framework.

However, to use it, libraries related to the `javax.annotation` package that implements the JSR-250 spec must be included.

```java
import javax.annotation.PostConstruct;

@Component
class TaengPonent {
    @PostConstruct
    public void postConstruct() {
        // ... omitted
    }
}
```

## InitializingBean
Next is a method of implementing the `InitializingBean` interface. Since it's a method of implementing (implements) an interface dependent on Spring Framework,
created beans become dependent on Spring Framework. That is, they cannot be reused outside Spring's IoC container.

```java
class TaengPonent implements InitializingBean {

    @Override
	public void afterPropertiesSet() {
		// ... omitted
	}
}
```

## @Bean(initMethod)
It's a method using the `@Bean` annotation. Put the method name to use for initialization work in the annotation's `initMethod` attribute.

```java
@SpringBootApplication
public class TaengPlication {

    @Bean(initMethod = "initTaengPonent")
    public TaengPonent callInitMethod() {
        return new TaengPonent();
    }
}

class TaengPonent {
    public void initTaengPonent() {
        // ...
    }
}
```

When registering Spring beans using `XML` rather than annotation-based, use it as follows. Use the `init-method` attribute in the `<bean>` tag to
put the method to initialize.

```xml
<bean id="taengPonent" init-method="initTaengPonent"
    class="com.madlife.madplay.component.TaengPonent" />
```

<br><br>

# Destruction Methods
Along with initialization methods we examined earlier, when Application Context closes, that is, when containers containing Spring beans are destroyed,
you can directly define methods that beans will call.

## @PreDestroy
Just add the `@PreDestroy` annotation above the method declaration. Like the `@PostConstruct` method used for initialization,
since it's implemented according to the `JSR-250` spec, libraries related to the `javax.annotation` package are needed.

```java
import javax.annotation.PreDestroy;

@Component
class TaengPonent {
    @PreDestroy
    public void preDestroy() {
        // ... omitted
    }
}
```

## DisposableBean
There's a method of implementing the `DisposableBean` interface provided by Spring Framework and redefining the `destroy` method.
Like the `InitializingBean` interface used for initialization, it becomes dependent on Spring Framework.

```java
class TaengPonent implements DisposableBean {

    @Override
	public void destroy() {
		// ... omitted
	}
}
```

## @Bean(destroyMethod)
The `@Bean` annotation can specify not only initialization methods but also methods used when beans are destroyed. Write the method name to use
in the annotation's `destroyMethod` attribute.

```java
@SpringBootApplication
public class TaengPlication {
    @Bean(destroyMethod = "destoryTaengPonent")
    public TaengPonent initTaengPonent() {
        return new TaengPonent();
    }
}

class TaengPonent {
    public void destoryTaengPonent() {
        // ...
    }
}
```

Like when using the `init-method` attribute, it can also be used when registering beans based on `XML`.

```xml
<bean id="taengPonent" destroy-method="destroyTaengPonent"
    class="com.madlife.madplay.component.TaengPonent" />
```

<br>

# Call Order
Then what's the call order of Spring bean initialization/removal methods we examined earlier?
Testing through simple example code:

```java
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MadplayApplication {

	@Bean(initMethod = "initTaengPonent", destroyMethod = "destoryTaengPonent")
	public TaengPonent initTaengPonent() {
		return new TaengPonent();
	}

	public static void main(String[] args) {
		SpringApplication.run(MadplayApplication.class, args);
	}
}

class TaengPonent implements InitializingBean, DisposableBean {

	@Override
	public void afterPropertiesSet() {
		System.out.println("afterPropertiesSet");
	}

	public void initTaengPonent() {
		System.out.println("initTaengPonent");
	}

	@PostConstruct
	public void postConstruct() {
		System.out.println("postConstruct");
	}

	@Override
	public void destroy() {
		System.out.println("destroy");
	}

	public void destoryTaengPonent() {
		System.out.println("destoryTaengPonent");
	}

	@PreDestroy
	public void preDestroy() {
		System.out.println("preDestroy");
	}
}
```

The output result is as follows.

```bash
postConstruct
afterPropertiesSet
initTaengPonent
preDestroy
destroy
destoryTaengPonent
```


In the case of bean initialization methods, the `@PostConstruct` annotation executes first, and then the
`afterPropertiesSet` method of the **InitializingBean interface** executes. Finally, the `initMethod` attribute of the `@Bean` annotation operates.

And when being destroyed, the `@PreDestroy` annotation performs first, then the `destroy` method of the **DisposableBean interface**
performs, and finally the method specified in the `destroyMethod` attribute of the `@Bean` annotation executes.
