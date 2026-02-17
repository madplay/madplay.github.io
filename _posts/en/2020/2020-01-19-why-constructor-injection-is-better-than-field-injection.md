---
layout:   post
title:    "Why Constructor Injection Is Preferred Over Field Injection with @Autowired"
author:   madplay
tags: 	  spring dependencyinjection constructorinjection
description: "Why is constructor injection generally recommended over field injection with @Autowired?"
category: Spring
date: "2020-01-19 19:26:12"
comments: true
lang: en
slug: why-constructor-injection-is-better-than-field-injection
permalink: /en/why-constructor-injection-is-better-than-field-injection/
---

# Ways to Inject Dependencies
> What are the dependency injection options in Spring Framework?

Let’s look at why constructor injection is recommended over field injection or setter injection with `@Autowired`.
Before that, we need to review the three common DI styles in Spring.

### Constructor Injection

This post focuses on this style, and the Spring team recommends it.
Since Spring Framework 4.3, classes can be fully decoupled from DI annotations when they have a single constructor.
For a single constructor, you do not need `@Autowired`.
If there are multiple constructors, annotate the target constructor.

```java
@Component
public class MadExample {

    // bonus: can be final
    private final HelloService helloService;

    // no extra annotation required for a single constructor
    public MadExample(HelloService helloService) {
        this.helloService = helloService;
    }
}
```

### Field Injection

This style is simple: put `@Autowired` on a field.
Because it is easy, it is also very common.

```java
@Component
public class MadExample {

    @Autowired
    private HelloService helloService;
}
```

### Setter Injection

You can also inject via a setter-like method.
The method name does not strictly need to follow `setXXXX`,
but using standard setter naming improves consistency and readability.

```java
@Component
public class MadExample {

    private HelloService helloService;

    @Autowired
    public void setHelloService(HelloService helloService) {
        this.helloService = helloService;
    }
}
```

Many codebases use field injection heavily.
It is convenient, and many examples use it as well.
But IDE warnings (for example in IntelliJ) point to a better default:

> Spring Team recommends: "Always use constructor based dependency injection in your beans.
Always use assertions for mandatory dependencies".

The key message is to prefer constructor injection.
So why is constructor injection better than other options?

<br/><br/>

# Why Prefer Constructor Injection?
> What problems do field injection and setter injection introduce?

`@Autowired` makes dependency wiring easy, but constructor injection provides concrete design and reliability benefits.

## It Prevents Circular Dependency from Hiding

During development, components often depend on each other.
A common failure case is circular dependency: A depends on B and B depends on A.

Consider two service-layer components that reference each other.
To make the behavior explicit, each also calls the other method recursively.
This is intentionally bad design for demonstration.

```java
@Service
public class MadPlayService {

    // circular reference
    @Autowired
    private MadLifeService madLifeService;

    public void sayMadPlay() {
        madLifeService.sayMadLife();
    }
}
```

```java
@Service
public class MadLifeService {
    
    // circular reference
    @Autowired
    private MadPlayService madPlayService;

    public void sayMadLife() {
        madPlayService.sayMadPlay();
    }
}
```

Run with a simple `CommandLineRunner` test:

```java
@SpringBootApplication
public class DemoApplication implements CommandLineRunner {

    @Autowired
    private MadLifeService madLifeService;
    @Autowired
    private MadPlayService madPlayService;

    @Override
    public void run(String... args) {
        madPlayService.sayMadPlay();
        madLifeService.sayMadLife();
    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

With field injection, the app starts without early error, but fails later with runtime recursion:

```bash
java.lang.StackOverflowError: null
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
	at com.example.demo.HelloService.sayHello(HelloService.java:12) ~[classes/:na]
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
	at com.example.demo.HelloService.sayHello(HelloService.java:12) ~[classes/:na]
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
```

Now switch both services to constructor injection:

```java
@Service
public class MadPlayService {
    private final MadLifeService madLifeService;

    public MadPlayService(MadLifeService madLifeService) {
        this.madLifeService = madLifeService;
    }

    // omitted
}
```

```java
@Service
public class MadLifeService {
    private final MadPlayService madPlayService;

    public MadLifeService(MadPlayService madPlayService) {
        this.madPlayService = madPlayService;
    }

    // omitted
}
```

Now startup fails immediately with `BeanCurrentlyInCreationException`.
You detect the cycle early, before runtime logic executes.

```bash
Description:
The dependencies of some of the beans in the application context form a cycle:
┌─────┐
|  madLifeService defined in file [~~~/MadLifeService.class]
↑     ↓
|  madPlayService defined in file [~~~/MadPlayService.class]
└─────┘
```

Why the difference? Injection timing is different.

- **Setter injection**:
  - Spring creates the target bean first.
  - It resolves dependencies after creation.
  - Then it calls the setter to inject.
- **Field injection**:
  - Similar order: bean is created first.
  - Dependencies are injected into annotated fields afterward.
- **Constructor injection**:
  - Dependencies are required at object creation time.
  - Spring must resolve constructor arguments first.
  - If a cycle exists, bean creation fails immediately.

So circular dependency surfaces clearly with constructor injection.
And that is good: circular design is usually a design problem, not something to hide.

<br/>

## It Improves Testability

Constructor injection makes test setup simpler.
Core DI principle: managed classes should not depend on the container itself.
They should be **independently instantiable POJOs (Plain Old Java Objects)**.

You can still test field/setter injection with Mockito (`@Mock`, `@Spy`, etc.),
but constructor injection often keeps tests straightforward:

```java
SomeObject someObject = new SomeObject();
MadComponent madComponent = new MadComponent(someObject);
madComponent.someMadPlay();
```

<br/>

## It Exposes Code Smells Earlier

A component can accumulate too many dependencies.
With field injection and `@Autowired`, there is no immediate structural pressure.
With constructor injection, a long parameter list becomes visible right away,
which encourages refactoring and responsibility split.

```java
@Component
public class MadComponent {
    // rare in healthy code, but possible
    @Autowired
    private FirstComponent firstComponent;
    @Autowired
    private SecondComponent secondComponent;
    @Autowired
    private NumberComponent numberComponent;
    @Autowired
    private SomeComponent someComponent;
    @Autowired
    private StrangeComponent strangeComponent;
}
```

Practices vary by team, but constructor injection has one clear advantage:
dependencies are explicit in the API surface.

<br/>

## It Supports Immutability

With field or setter injection, injected fields cannot be `final`.
That means values can be reassigned after initialization.
With constructor injection, **fields can be `final`**.

```java
@Service
public class MadPlayService {
    private final MadPlayRepository madPlayRepository;

    public MadPlayService(MadPlayRepository madPlayRepository) {
        this.madPlayRepository = madPlayRepository;
    }
}
```

Even if runtime reassignment is uncommon, immutability helps prevent accidental state changes.

<br/>

## It Helps Prevent Errors

Spring reference guidance is clear:
use constructor injection for required dependencies,
and setter injection for optional ones.

When you need non-null guarantees or immutable state,
constructor injection is the safer default.

Field injection example:

```java
@Service
public class MadPlayService {
    @Autowired
    private MadPlayRepository madPlayRepository;

    public void someMethod() {
        // can be reassigned because it is not final
        madPlayRepository = null;
        madPlayRepository.call();
    }
}
```

Because the field is not `final`, reassignment is possible.
The code above causes `NullPointerException` at runtime.

With constructor injection, the same reassignment is blocked at compile time:

```java
@Service
public class MadPlayService {
    private final MadPlayRepository madPlayRepository;

    public MadPlayService(MadPlayRepository madPlayRepository) {
        this.madPlayRepository = madPlayRepository;
    }

    public void someMethod() {
        // cannot assign a value to final variable
        madPlayRepository = null;
    }
}
```

<br/>

# Summary
Constructor injection is preferred over field or setter injection for these reasons:

- **Prevents hidden circular dependency issues.**
  - Circular dependencies fail fast during startup.
- **Makes tests easier to write.**
  - You can instantiate simple POJO-based test objects.
- **Removes design smells earlier.**
  - Large dependency sets become explicit and easier to refactor.
- **Supports immutability.**
  - You can use `final` fields and prevent runtime reassignment.
  - It helps prevent avoidable errors earlier.
