---
layout:   post
title:    "스프링에서 빈을 생성할 때 패키지 이름까지 식별자로 포함할 수 있을까?"
author:   Kimtaeng
tags: 	  spring bean
description: "같은 이름이지만 다른 패키지에 있는 클래스를 스프링 빈으로 등록할 수 있을까? 패키지 이름까지 스프링 빈의 이름으로 포함시키는 방법은?"
category: Spring
date: "2020-01-22 23:11:10"
comments: true
---

# 이런 경우는 어떻게 할까?

아래와 같이 패키지 구조가 되어있다고 가정해보자. 서로 다른 패키지에 있지만 ```HelloService``` 라는 동일한 이름을 가진 클래스 2개가 있다.

```bash
com
└── madplay
    ├── abc
    │   └── HelloService.java
    └── def
        └── HelloService.java
    ├── HelloController.java
```

두 개의 클래스에는 동일하게 빈 등록을 위한 ```@Service``` 어노테이션이 선언되어 있다.

```java
@Service
public class HelloService {
    // ...생략
}
```

그리고 ```applicationContext.xml```에는 등록할 빈을 자동으로 찾을 수 있도록 ```component-scan```이 설정되어 있다.
따라서 두 개의 클래스 모두 ```@Service``` 어노테이션에 의해 빈으로 등록된다.

```xml
<beans>
    <context:component-scan base-package="com.madplay">
</beans>
```

그런데 기본적으로 스프링 프레임워크는 기본적으로 빈의 이름을 기반으로 id를 결정한다.
예를 들어 클래스 이름이 HelloService 라면 id는 helloService 으로 결정된다.

따라서 다른 패키지에 있더라도 동일한 이름을 가진 클래스(빈 등록할 컴포넌트)가 중복으로 존재하기 때문에
애플리케이션 구동 시에 ```ConflictingBeanDefinitionException```와 같은 오류 메시지를 만날 수 있다.

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

# 그러면 어떻게 해야할까?

먼저 빈 등록시에 고유 이름을 부여하는 방법이 있다. ```@Service("madplay")``` 처럼 어노테이션에 고유하게 식별할 수 있도록
특정 이름(아이디)을 지정해주면 된다.

```java
package com.madplay.abc

@Service("abc.HelloService")
public class HelloService {
    // ...생략
}
```

```java
package com.madplay.def

@Service("def.HelloService")
public class HelloService {
    // ...생략
}
```

<br/><br/>

# 또 다른 방법은 없을까?

스프링의 빈 이름을 짓는 기본 전략을 이용하고 싶지 않다면 ```BeanNameGenerator``` 를 직접 구현하면 된다.
아래는 ```@Service``` 어노테이션을 가진 클래스에만 적용되도록 작성한 코드이다.

```java
/**
 * 패키지 이름이 다른데, 클래스 이름이 똑같다.
 * 그런데 두 개의 클래스 모두 빈 등록을 해야 할 때는 어떻게 해야 할까?
 * 
 * BeanNameGenerator를 구현하는 방법이 있다.
 * 특정 어노테이션을 가진 클래스만 패키지 이름까지 포함하여
 * 빈 등록 시에 이름을 구분할 수 있도록 한다.
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
        // 패키지를 포함한 전체 이름을 반환한다.
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

적용은 어떻게 할까? 스프링 MVC 프로젝트라면 아래와 같이 ```applicationContext.xml``` 에 포함해주면 된다.

```xml
<context:component-scan base-package="com.madplay" name-generator="com.madplay.MadBeanNameGenerator"/>
```

자바 코드를 이용하여 ```@Service``` 어노테이션을 구분하지 않고 ```component-scan```의 filter를 이용하여 필요한 요소들만 필터링할 수 있다.

```xml
<context:component-scan base-package="com.madplay" name-generator="com.madplay.MadBeanNameGenerator">
    <!-- @Service 어노테이션만 포함한다. include-filter가 먼저 선언되어야 함 -->
    <context:include-filter type="annotation" expression="org.springframework.stereotype.Service"/>
    <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
</context:component-scan>
```

프로젝트가 **스프링 부트 기반인 경우에는** 아래와 같이 애플리케이션이 실행되는 main 메서드 내의 코드를 수정해주면 된다.

```java
@SpringBootApplication
public class MadApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		final SpringApplicationBuilder builder = new SpringApplicationBuilder(MadApplication.class);

		// beanNameGenerator 를 등록한다.
		builder.beanNameGenerator(new MadBeanNameGenerator());
		builder.run(args);
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(MadApplication.class);
	}
}
```