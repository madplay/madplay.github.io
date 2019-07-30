---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.11. 웹플럭스 설정"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.11. WebFlux Config"
category: Spring
date: "2019-07-29 23:11:49"
comments: true
---

# 1.11. 웹플럭스 설정(WebFlux Config)
웹플럭스 자바 설정은 어노테이션 컨트롤러 또는 함수형 엔드포인트로 요청을 처리하는데 필요한 컴포넌트를 선언하고, 설정을 사용자 정의(customize)
하기 위한 API를 제공한다. 그러니까, 자바 설정으로 만들어지는 빈에 대해서 이해할 필요가 없다는 것이다. 하지만 이를 이해하고 싶다면,
`WebFluxConfigurationSupport`를 참조하거나 **특수 빈 타입(Special Bean Types)**에 대해서 자세히 읽어보라.

설정 API에서 사용할 수 없는 고급 사용자 정의를 해야 하는 경우 **고급 설정 모드(Advanced Configuration Mode)**를 사용해서
전체 설정을 제어할 수 있다.

<br>

## 1.11.1. 웹플럭스 설정 활성화(Enabling WebFlux Config)

아래 예제와 같이 자바 설정에 `@EnableWebFlux` 어노테이션을 사용할 수 있다.

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig {
}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig
```

앞의 예제는 다수의 스프링 웹플럭스 **기반 빈(infrastructure beans)**을 등록하고 클래스 경로에서 사용할 수 있는
의존성에 적용시킨다. - JSON, XML 및 기타 등

<br>

## 1.11.2. 웹플럭스 설정 API(WebFlux config API)
아래 예제처럼 자바 설정에 `WebFluxConfigurer` 인터페이스를 구현할 수 있다:

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    // Implement configuration methods...
}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    // Implement configuration methods...
}
```

<br>

## 1.11.3. Conversion, formatting
기본적으로 숫자와 날짜 타입을 위해 다양한 포맷터(formatters)를 제공하지만, `@NumberFormat`과 `@DateTimeFormat` 어노테이션으로
사용할 포맷을 사용자 정의할 수 있다.

자바 설정에서 커스텀 포맷터(formatters)와 컨버터(converters)를 등록하려면 아래와 같이 하면 된다:

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        // ...
    }

}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun addFormatters(registry: FormatterRegistry) {
        // ...
    }
}
```

기본적으로 스프링 웹플럭스는 날짜 값을 파싱하고 포맷을 지정할 때, 요청 Locale을 고려한다. 날짜가 "input" 폼(form)의 문자열로
표현했을 때 그렇다. 하지만 "date"와 "time" 필드의 경우 브라우저는 HTML 스펙에 정의된 고정 포맷을 사용한다. 이러한 경우 다음과 같이
사용자 정의할 수 있다.

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setUseIsoFormat(true);
        registrar.registerFormatters(registry);
    }
}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun addFormatters(registry: FormatterRegistry) {
        val registrar = DateTimeFormatterRegistrar()
        registrar.setUseIsoFormat(true)
        registrar.registerFormatters(registry)
    }
}
```

> `FormatterRegistrar` 구현체에 대한 자세한 정보는 **`FormatterRegistrar` SPI**와
`FormattingConversionServiceFactoryBean` 를 참조하라.

<br>

# 1.11.4. 검증(Valiation)
기본적으로 **빈 검증(Bean Validation)**이 클래스 경로(path)에 존재하면(예를 들어, Hibernate Validator) 
`LocalValidatorFactoryBean`이 전역 **검증기(validator)**로 등록되어 `@Valid`와 `@Validated` 어노테이션을
`@Controller` 메서드의 인자로 사용할 수 있다.

자바 설정에서 아래 예제와 같이 전역 `Validator` 인스턴스를 사용자 정의할 수 있다:

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public Validator getValidator(); {
        // ...
    }

}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun getValidator(): Validator {
        // ...
    }

}
```

아래 예제와 같이 `Validator` 구현을 로컬 설정으로 할 수 있다:

Java:
```java
@Controller
public class MyController {

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.addValidators(new FooValidator());
    }

}
```

Kotlin:
```kotlin
@Controller
class MyController {

    @InitBinder
    protected fun initBinder(binder: WebDataBinder) {
        binder.addValidators(FooValidator())
    }
}
```

> `LocalValidatorFactoryBean`을 어딘가에 주입해야 하는 경우 MVC 설정에 선언된 빈과의 충돌을 피하기 위해 빈을 생성하고 `@Primary`을
선언한다.


---

> ### 목차 가이드
> - 다음글 "1.12. HTTP/2" 로 이동
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>