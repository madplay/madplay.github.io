---
layout:   post
title:    How to Autowire a Static Field
author:   madplay
tags: 	  spring framework
description: Inject a bean into a static field in the Spring Framework.
category: Spring
comments: true
slug:     spring-framework-static-field-injection
lang:     en
permalink: /en/post/spring-framework-static-field-injection
---

# Walk Through the Code
Let’s inject a bean into a static field with `@Autowired` in Spring.
Assume the following code exists.

```java
@Component
class Something {
    public void sayHi() {
        System.out.println("Hi");
    }
}

class Someone {
    // want to use it...
    @Autowired
    public static SomeObject someObject;

    public static void say() {
        someObject.sayHi();
    }
}

// config omitted
public class InjectionTest {

    @Test
    public void method() {
        // NullPointerException
        Someone.say();
    }
}
```

Running this throws `NullPointerException`.
`Something` is created after the `Someone` class is loaded, so the bean does not exist at class-load time.

More importantly, `@Autowired` works only for classes managed by Spring.
`Someone` is not a Spring bean, so Spring never injects it.
Even if it were managed, the Spring context is not ready at class-load time, so static injection still fails.

<br>

# Fix
First, make the class Spring-managed.

```java
@Component
class Someone {
    // ...
}
```

Then assign the injected instance during construction.
You can use a constructor or a setter, or use `@PostConstruct`.

```java
@Component
class Someone {
    public static SomeObject someObject;

    // Option 1) setter
    @Autowired
    public void setSomeObject(SomeObject someObject) {
        this.someObject = someObject;
    }
    
    // Option 2) constructor
    @Autowired
    private Someone(SomeObject someObject) {
        this.someObject = someObject;
    }

    public static void say() {
        someObject.sayHi();
    }
}
```

```java
@Component
class Someone {
    @Autowired
    private SomeObject beanObject;
    public static SomeObject someObject;
    
    @PostConstruct
    private void initialize() {
        this.someObject = beanObject;
    }

    public static void say() {
        someObject.sayHi();
    }
}
```
