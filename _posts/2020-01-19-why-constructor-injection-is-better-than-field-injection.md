---
layout:   post
title:    "생성자 주입을 @Autowired를 사용하는 필드 주입보다 권장하는 하는 이유"
author:   Kimtaeng
tags: 	  spring dependencyinjection constructorinjection
description: "@Autowired를 사용하는 의존성 주입보다 생성자 주입(Constructor Injection)을 더 권장하는 이유는 무엇일까?"
category: Spring
date: "2020-01-19 19:26:12"
comments: true
---

# 의존성을 주입하는 방법
> 스프링 프레임워크에서 의존성을 주입하는 방법은 무엇이 있을까?

```@Autowired``` 를 사용하는 필드 주입이나 수정자 주입 방법보다 생성자 주입을 더 권장하는 이유를 알아보자. 하지만 그전에 스프링 프레임워크에서
사용하는 의존성 주입 방법에 대해서 알아볼 필요가 있다. 우선 등록된 빈을 사용하기 위한 스프링 프레임워크의 DI(Dependency Injection) 방법은 3가지다.

### 생성자 주입(Constructor Injection)

이번 포스팅의 주제이자 스프링 팀에서도 권장하는 방식이다. 스프링 프레임워크 4.3 버전부터는 의존성 주입으로부터 클래스를 완벽하게 분리할 수 있다.
단일 생성자인 경우에는 ```@Autowired``` 어노테이션 조차 붙이지 않아도 되지만 생성자가 2개 이상인 경우에는 생성자에 어노테이션을 붙여주어야 한다.

```java
@Component
public class MadExample {

    // final로 선언할 수 있는 보너스
    private final HelloService helloService;

    // 단일 생성자인 경우는 추가적인 어노테이션이 필요 없다.
    public MadExample(HelloService helloService) {
        this.helloService = helloService;
    }
}
```

### 필드 주입(Field Injection)

사용법이 매우 간단하다. 필드에 ```@Autowired``` 어노테이션을 붙여주면 자동으로 의존성이 주입된다.
편리하기 때문에 가장 많이 접할 수 있는 방법인 것 같다.

```java
@Component
public class MadExample {

    @Autowired
    private HelloService helloService;
}
```

### 수정자 주입(Setter Injection)

수정자(Setter)를 이용한 주입 방법도 있다. 꼭 setter 메서드일 필요는 없다. 메서드 이름이 수정자 네이밍 패턴(setXXXX)이 아니어도
동일한 기능을 하면 된다. 그래도 일관성과 명확한 코드를 만들기 위해서 정확한 이름을 사용하는 것을 추천한다.

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

대부분 코드에서 ```@Autowired``` 어노테이션을 필드에 붙여 사용하는 필드 인젝션 코드를 많이 본 것 같다. 개인적으로도 사용하기 편리하기 때문에
예제 코드를 만들 때 자주 사용한 것 같다. 실무에서도 그랬던 것 같고... 그런데 어느새부터 인텔리제이의 경고 메시지가 신경 쓰인다.

> Spring Team recommends: "Always use constructor based dependency injection in your beans.
Always use assertions for mandatory dependencies".

핵심은 생성자 주입 방법을 사용하라는 것이다. 그렇다면 **다른 주입 방법보다 생성자 주입을 권장하는 이유는 무엇일까?**

<br/><br/>

# 왜 생성자 주입 방법을 권장할까?
> 필드 주입이나 수정자 주입 방법에는 무슨 문제가 있을까?

그렇다면 왜 생성자 주입 방법을 더 권장하는 이유는 무엇일까? ```@Autowired``` 어노테이션만으로 간단하게 의존성을 주입할 수 있는데 말이다.
필드 주입이나 수정자 주입 방법과 다르게 생성자 주입 방법이 주는 장점에 대해서 살펴보자.

## 순환 참조를 방지할 수 있다.

개발을 하다 보면 여러 컴포넌트 간에 의존성이 생긴다. 그중에서도 A가 B를 참조하고, B가 다시 A를 참조하는 순환 참조도 발생할 수 있는데
아래 코드를 통해 어떤 경우인지 살펴보자.

우선 두 개의 서비스 레이어 컴포넌트를 정의한다. 그리고 서로 참조하게 한다. 조금 더 극단적인 상황(?)을 만들기 위해서 순환 참조하는 구조에 더불어
서로의 메서드를 순환 호출하도록 한다. 그러니까 빈이 생성된 후에 비즈니스 로직으로 인하여 서로의 메서드를 순환 참조하는 형태이다.
실제로는 이러한 형태가 되어서는 안되며, 직접적으로 서로를 계속해서 호출하는 코드는 더더욱 안된다. "순환 참조가 되면 이럴 수도 있구나~"라고 생각하자.

```java
@Service
public class MadPlayService {

    // 순환 참조
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
    
    // 순환 참조
    @Autowired
    private MadPlayService madPlayService;

    public void sayMadLife() {
        madPlayService.sayMadPlay();
    }
}
```

그리고 실행해보자. 간단하게 테스트하기 위해서 스프링 부트의 ```CommandLineRunner```를 사용했다.

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

실행 결과는 어떻게 될까? 사실 애플리케이션이 구동조차 안되어 메서드가 호출 안 되는 것을 기대했지만 아무런 오류 없이 정상적으로 구동되었다.
물론 run 메서드의 내용이 수행되면서 아래와 같은 오류와 함께 종료되었다.

```bash
java.lang.StackOverflowError: null
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
	at com.example.demo.HelloService.sayHello(HelloService.java:12) ~[classes/:na]
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
	at com.example.demo.HelloService.sayHello(HelloService.java:12) ~[classes/:na]
	at com.example.demo.GreetService.sayGreet(GreetService.java:12) ~[classes/:na]
```

문제는 애플리케이션이 아무런 오류나 경고없이 구동된다는 것이다. 실제 코드가 호출되기 전까지 문제를 발견할 수 없다.
그렇다면 생성자 주입을 사용한 경우는 어떻게 될까? 코드를 바꿔보자.

```java
@Service
public class MadPlayService {
    private final MadLifeService madLifeService;

    public MadPlayService(MadLifeService madLifeService) {
        this.madLifeService = madLifeService;
    }

    // 생략
}
```

```java
@Service
public class MadLifeService {
    private final MadPlayService madPlayService;

    public MadLifeService(MadPlayService madPlayService) {
        this.madPlayService = madPlayService;
    }

    // 생략
}
```

실행 결과는? ```BeanCurrentlyInCreationException```이 발생하며 애플리케이션이 구동조차 되지 않는다.
따라서 발생할 수 있는 오류를 사전에 알 수 있다.

```bash
Description:
The dependencies of some of the beans in the application context form a cycle:
┌─────┐
|  madLifeService defined in file [~~~/MadLifeService.class]
↑     ↓
|  madPlayService defined in file [~~~/MadPlayService.class]
└─────┘
```

실행 결과에 차이가 발생하는 이유는 무엇일까? 생성자 주입 방법은 필드 주입이나 수정자 주입과는 **빈을 주입하는 순서가 다르다.**

먼저 **수정자 주입(Setter Injection)을 살펴보면** 우선 주입(inject) 받으려는 빈의 생성자를 호출하여 빈을 찾거나 빈 팩터리에 등록한다.
그 후에 생성자 인자에 사용하는 빈을 찾거나 만든다. 그 이후에 주입하려는 빈 객체의 수정자를 호출하여 주입한다.

다음으로 **필드 주입(Field Injection)을 알아보자.** 수정자 주입 방법과 동일하게 먼저 빈을 생성한 후에 어노테이션이 붙은 필드에 해당하는 빈을 찾아서
주입하는 방법이다. 그러니까, 먼저 빈을 생성한 후에 필드에 대해서 주입한다.

마지막으로 **생성자 주입(Constructor Injection)은** 생성자로 객체를 생성하는 시점에 필요한 빈을 주입한다. 조금 더 자세히 살펴보면,
먼저 생성자의 인자에 사용되는 빈을 찾거나 빈 팩터리에서 만든다. 그 후에 찾은 인자 빈으로 주입하려는 빈의 생성자를 호출한다.
즉, 먼저 빈을 생성하지 않는다. 수정자 주입과 필드 주입과 다른 방식이다.

그렇기 때문에 **순환 참조는 생성자 주입에서만 문제가 된다.** 객체 생성 시점에 빈을 주입하기 때문에 서로 참조하는 객체가 생성되지 않은 상태에서
그 빈을 참조하기 때문에 오류가 발생한다.

그렇다면 순환 참조 오류를 피하기 위해서 수정자 또는 필드 주입을 사용해야 할까? 오히려 그렇지 않다.
순환 참조가 있는 객체 설계는 잘못된 설계이기 때문에 **오히려 생성자 주입을 사용하여 순환 참조되는 설계를 사전에 막아야 한다.**

<br/>

## 테스트에 용이하다.

생성자 주입을 사용하게 되면 테스트 코드를 조금 더 편리하게 작성할 수 있다. 이부분은 테스트 코드 작성을 좋아한다면 조금 더 빠르게 체감할 수 있다.
DI의 핵심은 관리되는 클래스가 DI 컨테이너에 의존성이 없어야 한다는 것이다. 즉, **독립적으로 인스턴스화가 가능한 POJO(Plain Old Java Ojbect)** 여야
한다는 것이다. DI 컨테이너를 사용하지 않고서도 단위 테스트에서 인스턴스화할 수 있어야 한다.

이 부분은 생성자 주입을 사용하면 테스트 방법이 없다기보다는 조금 더 편리하다고 생각하면 좋을 것 같다. Mockito(```@Mock```과 ```@spy``` 같은)를
적절히 섞어서 테스트를 할 수 있지만 물론 아래처럼 생성자 주입을 사용한 경우 매우 간단한 코드를 만들 수 있다.

```java
SomeObject someObject = new SomeObject();
MadComponent madComponent = new MadComponent(someObject);
madComponent.someMadPlay();
```

<br/>

## 코드 속 나쁜 냄새를 없앤다.

한 개의 컴포넌트가 수많은 의존성을 갖는 역할을 할 수 있다. ```@Autowired```를 사용한 예시를 봐보자.
어떠한 제한도 없다. 생성자 주입을 사용하게 되는 경우 생성자의 인자가 많아짐에 따라 복잡한 코드가 됨을 쉽게 알 수 있고
리팩토링하여 역할을 분리하는 등과 같은 **코드의 품질을 높이는 활동의 필요성을 더 쉽게 알 수 있다.**

```java
@Component
public class MadComponent {
    // 물론 이런 경우는 거의 드물겠지만...
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

어떻게 보면 개발하고 있는 프로젝트나 소속된 팀에 따라서 다를 수 있을 것 같다. 생성자 주입을 사용한다고 하더라도 인자가 수십 개가 되는 코드를 보고
그대로 둘 수도 있으니 말이다. 생성자 주입의 경우 **의존성이 명시적으로 드러나는 장점이 있다.** 고 하지만 사람마다 체감하는 정도는 다를 수 있을 것 같다.

<br/>

## 불변성(Immutability)

아쉽게도 필드 주입과 수정자 주입은 해당 필드를 final로 선언할 수 없다. 따라서 초기화 후에 빈 객체가 변경될 수 있지만 생성자 주입의 경우는 다르다.
**필드를 final로 선언할 수 있다.** 물론 런타임 환경에서 객체를 변경하는 경우가 있을까 싶지만 이로 인해 발생할 수 있는 오류를 사전에 미리 방지할 수 있다.

```java
@Service
public class MadPlayService {
    private final MadPlayRepository madPlayRepository;

    public MadPlayService(MadPlayRepository madPlayRepository) {
        this.madPlayRepository = madPlayRepository;
    }
}
```

<br/>

## 오류를 방지할 수 있다.

스프링 레퍼런스에는 강제화되는 의존성의 경우는 생성자 주입 형태를 사용하고 선택적인 경우에는 수정자 주입 형태를 사용하는 것을 권장한다.
이 맥락에서 **불변 객체나 null이 아님을 보장할 때는** 반드시 생성자 주입을 사용해야 한다. 앞서 제시한 불변성이 주는 혜택을 예제와 함께 살펴보자.

```java
@Service
public class MadPlayService {
    @Autowired
    private MadPlayRepository madPlayRepository;

    public void someMethod() {
        // final이 아니기 때문에 값을 변경할 수 있다.
        madPlayRepository = null;
        madPlayRepository.call();
    }
}
```

필드 주입을 사용했기 때문에 선언된 필드는 ```final```이 아니다. 따라서 런타임 시점에 변경할 수 있다.
위 코드에서는 ```null```을 참조하도록 변경했기 때문에 이어지는 코드에서 ```NullPointerException```이 발생할 것이다.
하지만 생성자 주입을 사용한다면 이와 같은 상황을 컴파일 시점에 방지할 수 있다.

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

# 정리하면

정리해보자. 아래와 같은 이유로 필드 주입이나 수정자 주입보다 생성자 주입의 사용이 권장된다.

- **순환 참조를 방지할 수 있다.**
  - 순환 참조가 발생하는 경우 애플리케이션이 구동되지 않는다.
- **테스트 코드 작성이 편리하다.**
  - 단순 POJO를 이용한 테스트 코드를 만들 수 있다.
- **나쁜 냄새를 없앤다.**
  - 조금 더 품질 좋은 코드를 만들 수 있다.
- **immutable 하다.**
  - 실행 중에 객체가 변하는 것을 막을 수 있다.
  - 오류를 사전에 방지할 수 있다.