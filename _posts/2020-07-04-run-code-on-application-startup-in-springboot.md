---
layout:   post
title:    "스프링 부트 애플리케이션이 구동될 때 코드를 실행하는 방법"
author:   Kimtaeng
tags:     springboot commandlinerunner applicationrunner applicationevent
description: "스프링 부트(Spring Boot) 애플리케이션이 시작될 때 특정 코드를 실행시킬 수 있는 방법이 있을까?" 
category: Spring
date: "2020-07-04 00:31:55"
comments: true
---

# 초기화 코드를 실행할 수 있을까?
스프링 부트 애플리케이션이 정상적으로 구동되자마자 특정 코드를 실행하고 싶을 때가 있을 것이다. 예를 들면 특정 참조 값들을 초기화한다거나
모니터링 프로그램에 정상 구동 되었음을 알려야 할 수도 있다. 스프링 부트는 애플리케이션 구동 시점에 코드를 실행시킬 수 있는 몇 가지 방법을 제공한다.

<br>

# CommandLineRunner
먼저 살펴볼 것은 `CommandLineRunner`다. 아래와 같이 `@Bean` 어노테이션을 활용하여 `CommandLineRunner` 인터페이스를 익명 클래스로
선언한 것이다. 애플리케이션이 구동된 후에 코드가 실행된다.

```java
@SpringBootApplication
public class JavaExampleApplication {

	public static void main(String[] args) {
		SpringApplication.run(JavaExampleApplication.class, args);
	}
	
	@Bean
	public CommandLineRunner test(MyRepository myRepository) {
		return args -> {
			myRepository.sayHello();
            // 이것저것...
		};
	}
}
```

위의 `test` 메서드를 풀어서 작성하면 아래와 같다.

```java
@Bean
public CommandLineRunner test(MyRepository myRepository) {
    return new CommandLineRunner() {
        @Override
        public void run(String... args) throws Exception {
            myRepository.sayHello();
            // 이것저것...
        }
    };
}
```

대부분 `SpringApplication`의 `main` 메서드의 클래스와 같은 곳에 두지 않고 별도 클래스로 분리해서 사용하는 경우가 많을 텐데,
그럴 때는 앞선 예제처럼 `@Bean` 어노테이션을 사용하지 않고 아래와 같이 별도 클래스로 분리한 후 `@Component` 어노테이션을 사용하면 된다.

`CommandLineRunner` 인터페이스를 구현한 클래스를 빈으로 등록한 경우, 애플리케이션 구동 작업을 마치고 나서 재정의(override) 된
`run` 메서드를 실행하게 된다.

```java
@Component
public class MyCommandLineRunner implements CommandLineRunner {
	@Override
	public void run(String... args) throws Exception {
		System.out.println("CommandLineRunner!");
	}
}
```

# ApplicationRunner
다음으로 살펴볼 것은 `ApplicationRunner` 인터페이스다. 앞서 살펴본 `CommandLineRunner` 인터페이스와 다른 점은 파라미터가 다르다.
`String`이 아닌 `ApplicationArguments` 인터페이스를 받는다. 추가적으로 `CommandLineRunner`는 1.0.0 버전에서 등장했고,
`ApplicationRunner`는 1.3.0 버전에서 추가됐다. 둘 다 오래되긴 했지만 상대적으로 `ApplicationRunner`가 최신이다.

```java
@Component
public class MyApplicationRunner implements ApplicationRunner {
	@Override
	public void run(ApplicationArguments args) throws Exception {
		System.out.println("ApplicationRunner!");
	}
}
```

<br>

# ApplicationReadyEvent
마지막으로 살펴볼 것은 `@EventListener`를 사용하는 방법이다. 스프링 프레임워크는 애플리케이션이 구동되어 서비스 요청을 받을 준비가 되었을 때
`ApplicationReadyEvent` 이벤트를 발생한다. 따라서 `@EventListener`를 같이 사용하면 구동이 완료됐을 때 코드를 실행할 수 있다.

```java
@SpringBootApplication
public class JavaExampleApplication {

	public static void main(String[] args) {
		SpringApplication.run(JavaExampleApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void init() {
		System.out.println("EventListener!");

	}
}
```

<br>

# 다 같이 사용할 수 있을까? 순서는?
물론 다 같이 사용할 수 있고 아래와 같이 `@Order` 어노테이션을 사용하면 실행 순서를 조정할 수 있다.

```java
@Order(1)
@Component
public class MyCommandLineRunner implements CommandLineRunner {
	@Override
	public void run(String... args) throws Exception {
		System.out.println("CommandLineRunner!");
	}
}

@Order(2)
@Component
public class MyApplicationRunner implements ApplicationRunner {
	@Override
	public void run(ApplicationArguments args) throws Exception {
		System.out.println("ApplicationRunner!");
	}
}
```

순서를 지정하지 않은 경우 `ApplicationRunner`가 `CommandLineRunner` 보다 먼저 실행된다.

먼저 실행되는 이유는 `SpringApplication` 클래스의 내부를 살펴보면 알 수 있다. `callRunners`라는 메서드에서
실행 대상을 담는 순서에 차이가 있기 때문에 그렇다. 물론 `@Order`를 지정했다면 우선순위가 조정된다.

```java
private void callRunners(ApplicationContext context, ApplicationArguments args) {
		List<Object> runners = new ArrayList<>();
		runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
		runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
		AnnotationAwareOrderComparator.sort(runners); // `@Order` 를 선언했다면 정렬된다.
		for (Object runner : new LinkedHashSet<>(runners)) {
			if (runner instanceof ApplicationRunner) {
				callRunner((ApplicationRunner) runner, args);
			}
			if (runner instanceof CommandLineRunner) {
				callRunner((CommandLineRunner) runner, args);
			}
		}
	}
```

그리고 `ApplicationReadyEvent`는 Runner 시리즈보다 늦게 실행된다. 이는 `ApplicationContext` 클래스 내부의 `publishEvent`
메서드를 디버깅해보면 알 수 있다. 바로 위에서 살펴본 `callRunners` 메서드와 `publishEvent` 메서드에 브레이크 포인트를 설정해보자.

그리고 스프링 부트 애플리케이션을 구동하면, 디버깅 모드에서 발생한 이벤트와 코드가 실행되는 시점을 알 수 있을 것이다.



