---
layout:   post
title:    "How to Run Code When a Spring Boot Application Starts"
author:   madplay
tags:     springboot commandlinerunner applicationrunner applicationevent
description: "Is there a way to run specific code when a Spring Boot application starts?" 
category: Spring
lang: en
slug: run-code-on-application-startup-in-springboot
permalink: /en/run-code-on-application-startup-in-springboot/
date: "2020-07-04 00:31:55"
comments: true
---

# Can We Run Initialization Code?
Sometimes you want to run specific code immediately after Spring Boot starts.
For example, initialize reference values or notify monitoring systems that startup completed.
Spring Boot provides several ways to execute code at startup.

<br>

# CommandLineRunner
First is `CommandLineRunner`.
The example below declares an anonymous implementation via `@Bean`.
Code runs after application startup.

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
            // etc...
		};
	}
}
```

Expanded form:

```java
@Bean
public CommandLineRunner test(MyRepository myRepository) {
    return new CommandLineRunner() {
        @Override
        public void run(String... args) throws Exception {
            myRepository.sayHello();
            // etc...
        }
    };
}
```

In many projects, this logic is separated into dedicated classes instead of main class.
In that case, use `@Component` on a separate class instead of `@Bean`.

When a class implementing `CommandLineRunner` is registered as a bean,
its overridden `run` method executes after startup completes.

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
Next is `ApplicationRunner`.
Difference from `CommandLineRunner` is parameter type.
It receives `ApplicationArguments` instead of `String`.
Also, `CommandLineRunner` was introduced in 1.0.0,
while `ApplicationRunner` was added in 1.3.0.
Both are old, but `ApplicationRunner` is relatively newer.

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
Finally, use `@EventListener`.
Spring publishes `ApplicationReadyEvent` when the app is ready to serve requests.
So with `@EventListener`, you can run code when startup fully completes.

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

# Can We Use Them Together? In What Order?
Yes, you can use all of them together.
You can control order using `@Order`.

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

Without explicit order, `ApplicationRunner` executes before `CommandLineRunner`.

You can verify this by reading internals of `SpringApplication`.
In `callRunners`, insertion order differs by runner type.
If `@Order` is present, priority is adjusted.

```java
private void callRunners(ApplicationContext context, ApplicationArguments args) {
		List<Object> runners = new ArrayList<>();
		runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
		runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
		AnnotationAwareOrderComparator.sort(runners); // sorted if `@Order` is declared.
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

`ApplicationReadyEvent` runs later than runner-based callbacks.
You can confirm this by debugging `publishEvent` in `ApplicationContext`.
Set breakpoints in `callRunners` and `publishEvent`, then run in debug mode.

You will see exactly when each event and callback executes.
