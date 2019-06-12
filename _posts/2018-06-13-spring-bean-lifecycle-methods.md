---
layout:   post
title:    스프링 빈 생명주기(Bean Lifecycle) 메서드와 실행 순서
author:   Kimtaeng
tags: 	  spring bean lifecycle
description: 스프링 프레임워크에서 빈의 생명주기(Bean Lifecycle) 메서드에는 어떤 것들이 있을까? 또 어떤 순서로 실행될까?
category: Spring
date: "2018-06-13 23:06:22"
comments: true
---

# 초기화 메서드
스프링 프레임워크에서는 빈을 생성한 후에 초기화할 수 있는 여러가지 방법을 제공한다. 스프링 빈(Bean)이 생성되고
의존성 주입(Dependency Injection, 이하 DI)까지 완료된 후에 실행되는 초기화(initialization) 메서드를 알아보자.

## @PostConstruct
사용 방법이 매우 간편하다. 초기화에 사용할 메서드 선언부 위에 `@PostConstruct` 어노테이션을 붙여주면 된다.
참고로 자바 스펙 요구서(Java Specification Request, 이하 JSR) 250에 명시된 스펙으로서 스프링 프레임워크에 의존적이지 않다는 점이
특징이다.

다만 사용하기 위해서는 JSR-250 스펙을 구현한 `javax.annotation` 패키지 관련 라이브러리가 포함되어 있어야 한다.

```java
import javax.annotation.PostConstruct;

@Component
class TaengPonent {
    @PostConstruct
    public void postConstruct() {
        // ... 생략
    }
}
```

## InitializingBean
다음은 `InitializingBean` 인터페이스를 구현하는 방법이다. 스프링 프레임워크에 종속되는 인터페이스를 구현(implements)하는 방법이어서
생성된 빈이 스프링 프레임워크에 종속된다. 즉, 스프링의 IoC 컨테이너 외부에서 재사용할 수 없다.

```java
class TaengPonent implements InitializingBean {

    @Override
	public void afterPropertiesSet() {
		// ... 생략
	}
}
```

## @Bean(initMethod)
`@Bean` 어노테이션을 이용하는 방법이다. 어노테이션의 `initMethod` 속성에 초기화 작업에 사용할 메서드 이름을 넣으면 된다.

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

어노테이션 기반이 아닌 `XML`을 이용하여 스프링 빈을 등록할 때는 아래와 같이 사용한다. `<bean>` 태그에 `init-method` 속성을 이용하여
초기화할 메서드를 넣어주면 된다.

```xml
<bean id="taengPonent" init-method="initTaengPonent"
    class="com.madlife.madplay.component.TaengPonent" />
```

<br><br>

# 소멸 메서드
앞서 살펴본 초기화 메서드와 더불어 애플리케이션 컨텍스트가 닫힐 때, 그러니까 스프링 빈이 담긴 컨테이너가 파괴될 때 빈이 호출할 메서드를
직접 정의할 수 있다.

## @PreDestroy
메서드 선언부 위에 `@PreDestroy` 어노테이션을 추가하면 된다. 초기화에 사용되는 `@PostConstruct` 메서드와 마찬가지로
`JSR-250` 스펙에 따라 구현됐기 때문에 `javax.annotation` 패키지 관련 라이브러리가 필요하다.

```java
import javax.annotation.PreDestroy;

@Component
class TaengPonent {
    @PreDestroy
    public void preDestroy() {
        // ... 생략
    }
}
```

## DisposableBean
스프링 프레임워크에서 제공하는 `DisposableBean` 인터페이스를 구현한 후 `destroy` 메서드를 재정의하는 방법이 있다.
초기화에 사용하는 `InitializingBean` 인터페이스와 마찬가지로 스프링 프레임워크에 의존적이게 된다.

```java
class TaengPonent implements DisposableBean {

    @Override
	public void destroy() {
		// ... 생략
	}
}
```

## @Bean(destroyMethod)
`@Bean` 어노테이션은 초기화 메서드뿐만 아니라 빈이 소멸할 때 사용되는 메서드도 지정할 수 있다. 어노테이션의 `destroyMethod` 속성에
사용할 메서드 이름을 적어주면 된다.

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

`init-method` 속성을 사용할 때처럼 `XML` 기반으로 빈을 등록할 때도 사용할 수 있다. 

```xml
<bean id="taengPonent" destroy-method="destroyTaengPonent"
    class="com.madlife.madplay.component.TaengPonent" />
```

<br>

# 호출 순서
그렇다면 앞서 살펴본 스프링 빈의 초기화/제거 메서드의 호출 순서는 어떻게 될까?
간단한 예제 코드를 통해 테스트해보자.

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

출력 결과는 아래와 같다.

```bash
postConstruct
afterPropertiesSet
initTaengPonent
preDestroy
destroy
destoryTaengPonent
```


빈 초기화 메서드의 경우 `@PostConstruct` 어노테이션이 가장 먼저 실행되고 그다음으로 **InitializingBean 인터페이스**의
`afterPropertiesSet` 메서드가 실행된다. 마지막으로 `@Bean` 어노테이션의 `initMethod` 속성이 동작한다.

그리고 소멸될 때는 `@PreDestroy` 어노테이션이 가장 먼저 수행되고, 다음으로 **DisposableBean 인터페이스**의
`destroy` 메서드가 수행되며 마지막으로 `@Bean` 어노테이션의 `destroyMethod` 속성에 명시된 메서드가 실행된다.