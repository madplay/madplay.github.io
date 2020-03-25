---
layout:   post
title:    static 변수에 autowired 설정하려면 어떻게 해야 할까?
author:   Kimtaeng
tags: 	  spring framework
description: 스프링 프레임워크에서 정적 필드(static field)에 빈을 주입(injection) 해보자.
category: Spring
comments: true
---

# 코드를 통해 알아보자.
스프링 프레임워크에서 정적(static) 멤버 필드에 `@autowired` 어노테이션으로 빈을 주입하는 방법을 알아보자.
먼저 아래와 같은 코드가 있다고 가정해보자.

```java
@Component
class Something {
    public void sayHi() {
        System.out.println("Hi");
    }
}

class Someone {
    // 사용하고 싶다...
    @Autowired
    public static SomeObject someObject;

    public static void say() {
        someObject.sayHi();
    }
}

// 설정 생략
public class InjectionTest {

    @Test
    public void method() {
        // NullPointerException 발생
        Someone.say();
    }
}
```

위 코드를 실행하면 `NullPointerException`이 발생한다.
이유는 `Someone 클래스`에서 `@Autowired` 되었을 것이라고 예상한 `Something 객체`가 Someone 클래스가 로드된 이후에 생성되기 때문에
Someone 클래스가 로드된 당시에는 Something 객체는 존재하지 않는다. 

그리고 핵심은 `@Autowired`는 스프링 프레임워크에 의해서 관리되어야 빈 주입을 해줄 수 있지만 현재 `Someone` 클래스는 그렇지 않다.
물론 관리 대상이라고 하더라도 클래스 로더에 의해 인스턴스화될 때 스프링 컨텍스트는 아직 로드되지 않아 정상적인 주입이 불가능하다.

<br>

# 해결하기
위에서 살펴본 것처럼 우선적으로 스프링 프레임워크가 관리할 수 있도록 설정해보자.

```java
@Component
class Someone {
    // ...
}
```

그리고 Someone 클래스의 객체가 생성될 때 주입받을 객체를 가져와 할당하면 된다.
클래스의 생성자(Constructor) 또는 수정자(Setter) 메서드를 이용할 수 있고 `@PostConstruct` 어노테이션을 사용할 수도 있다.

```java
@Component
class Someone {
    public static SomeObject someObject;

    // 방법1) setter 메서드를 사용한다.
    @Autowired
    public void setSomeObject(SomeObject someObject) {
        this.someObject = someObject;
    }
    
    // 방법2) 생성자를 이용한다.
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