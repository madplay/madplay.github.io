---
layout:   post
title:    "Can Spring Include Package Names in Bean Identifiers?"
author:   madplay
tags: 	  spring bean
description: "Can classes with the same name in different packages be registered as Spring beans? How can package names be included in bean names?"
category: Spring
lang: en
slug: two-spring-service-beans-with-same-class-name
permalink: /en/two-spring-service-beans-with-same-class-name/
date: "2020-01-22 23:11:10"
comments: true
---

# What Should We Do in This Case?

Assume the package structure below.
There are two classes with the same name, `HelloService`, in different packages.

```bash
com
└── madplay
    ├── abc
    │   └── HelloService.java
    └── def
        └── HelloService.java
    ├── HelloController.java
```

Both classes declare `@Service` for bean registration.

```java
@Service
public class HelloService {
    // ...omitted
}
```

And `applicationContext.xml` includes `component-scan` to discover beans automatically.
So both classes are registered as beans through `@Service`.

```xml
<beans>
    <context:component-scan base-package="com.madplay">
</beans>
```

By default, Spring determines bean id from bean name.
If class name is `HelloService`, id becomes `helloService`.

So even in different packages, classes with the same name generate duplicate bean names.
At startup, you may see errors like `ConflictingBeanDefinitionException`.

```bash
Caused by: 
org.springframework.context.annotation.ConflictingBeanDefinitionException: 
    Annotation-specified bean name 'helloService' for bean class [com.madplay.def.HelloService] conflicts with existing,
    non-compatible bean definition of same name and class [com.madplay.abc.HelloService]
	at org.springframework.context.annotation.ClassPathBeanDefinitionScanner.checkCandidate(ClassPathBeanDefinitionScanner.java:349)
	at org.springframework.context.annotation.ClassPathBeanDefinitionScanner.doScan(ClassPathBeanDefinitionScanner.java:287)
	at org.springframework.context.annotation.ComponentScanBeanDefinitionParser.parse(ComponentScanBeanDefinitionParser.java:90)
    ...
```

<br/><br/>

# How Can We Solve It?

One method is assigning unique bean names explicitly.
For example, set identifiable names in annotation like `@Service("madplay")`.

```java
package com.madplay.abc

@Service("abc.HelloService")
public class HelloService {
    // ...omitted
}
```

```java
package com.madplay.def

@Service("def.HelloService")
public class HelloService {
    // ...omitted
}
```

<br/><br/>

# Is There Another Way?

If you do not want default Spring bean naming strategy, implement `BeanNameGenerator` directly.
The code below applies only to classes with `@Service`.

```java
/**
 * Package names are different, but class names are the same.
 * What if both classes need to be registered as beans?
 *
 * One approach is implementing BeanNameGenerator.
 * For classes with specific annotations, include package names
 * so bean names are distinguishable at registration time.
 *
 * @author madplay
 */
public class MadBeanNameGenerator implements BeanNameGenerator {
    private final AnnotationBeanNameGenerator defaultNameGenerator = new AnnotationBeanNameGenerator();

    @Override
    public String generateBeanName(BeanDefinition definition, BeanDefinitionRegistry registry) {
        String beanName;

        if (isService(definition)) {
            beanName = getFullName((AnnotatedBeanDefinition) definition);
        } else {
            beanName = defaultNameGenerator.generateBeanName(definition, registry);
        }
        return beanName;
    }

    private String getFullName(final AnnotatedBeanDefinition definition) {
        // Return fully qualified name including package.
        return definition.getMetadata().getClassName();
    }

    private boolean isService(final BeanDefinition definition) {
        if (definition instanceof AnnotatedBeanDefinition) {
            final Set<String> annotationTypes = ((AnnotatedBeanDefinition) definition).getMetadata()
                    .getAnnotationTypes();

            return annotationTypes.stream()
                    .filter(type -> type.equals(Service.class.getName()))
                    .findAny()
                    .isPresent();
        }
        return false;
    }
}
```

How do we apply it?
In Spring MVC projects, configure `applicationContext.xml` as below.

```xml
<context:component-scan base-package="com.madplay" name-generator="com.madplay.MadBeanNameGenerator"/>
```

With Java configuration, you can also filter component scan targets instead of checking `@Service` in code.

```xml
<context:component-scan base-package="com.madplay" name-generator="com.madplay.MadBeanNameGenerator">
    <!-- Include only @Service annotations. include-filter must come first. -->
    <context:include-filter type="annotation" expression="org.springframework.stereotype.Service"/>
    <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
</context:component-scan>
```

If project is **Spring Boot-based**, update the main application startup code like below.

```java
@SpringBootApplication
public class MadApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		final SpringApplicationBuilder builder = new SpringApplicationBuilder(MadApplication.class);

		// Register beanNameGenerator.
		builder.beanNameGenerator(new MadBeanNameGenerator());
		builder.run(args);
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(MadApplication.class);
	}
}
```
