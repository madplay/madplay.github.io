---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.11. WebFlux Config"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.11. WebFlux Config"
category: Spring
date: "2019-07-29 23:11:49"
comments: true
---

# 1.11. 웹플럭스 설정(WebFlux Config)
웹플럭스 자바 설정은 어노테이션 컨트롤러 또는 함수형 엔드포인트로 요청을 처리하는데 필요한 컴포넌트를 선언하고, 설정을 사용자 정의(customize)
하기 위한 API를 제공한다. 그러니까, 자바 설정으로 만들어지는 빈에 대해서 이해할 필요가 없다는 것이다. 하지만 이를 이해하고 싶다면,
`WebFluxConfigurationSupport`를 참조하거나 특수 빈 타입<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-special-bean-types" rel="nofollow" target="_blank">(Special Bean Types)</a>에 대해서 자세히 읽어보라.

설정 API에서 사용할 수 없는 고급 사용자 정의를 해야 하는 경우 고급 설정 모드<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-advanced-java" rel="nofollow" target="_blank">(Advanced Configuration Mode)</a>를 사용해서 전체 설정을 제어할 수 있다.

<br>

## 1.11.1. 웹플럭스 설정 활성화(Enabling WebFlux Config)
아래 예제와 같이 자바 설정에 `@EnableWebFlux` 어노테이션을 사용할 수 있다.

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig {
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig
```

앞의 예제는 다수의 스프링 웹플럭스 인프라 기반 빈<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-special-bean-types" rel="nofollow" target="_blank">(infrastructure beans)</a>을
등록하고 클래스 경로에서 사용할 수 있는 의존성에 적용시킨다. - JSON, XML 및 기타 등

<br>

## 1.11.2. 웹플럭스 설정 API(WebFlux config API)
아래 예제처럼 자바 설정에 `WebFluxConfigurer` 인터페이스를 구현할 수 있다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    // Implement configuration methods...
}
```

#### Kotlin:
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

#### Java:
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

#### Kotlin:
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

#### Java:
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

#### Kotlin:
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

> `FormatterRegistrar` 구현체에 대한 자세한 정보는 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#format-FormatterRegistrar-SPI" rel="nofollow" target="_blank">`FormatterRegistrar` SPI</a>와 `FormattingConversionServiceFactoryBean` 를 참조하라.

<br>

# 1.11.4. 검증(Valiation)
기본적으로 빈 검증<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validation-beanvalidation-overview" rel="nofollow" target="_blank">(Bean Validation)</a>이
클래스 경로(path)에 존재하면(예를 들어, Hibernate Validator) `LocalValidatorFactoryBean`이 전역 
검증기<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#validator" rel="nofollow" target="_blank">(validator)</a>로
등록되어 `@Valid`와 `@Validated` 어노테이션을 `@Controller` 메서드의 인자로 사용할 수 있다.

자바 설정에서 아래 예제와 같이 전역 `Validator` 인스턴스를 사용자 정의할 수 있다:

#### Java:
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

#### Kotlin:
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

#### Java:
```java
@Controller
public class MyController {

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.addValidators(new FooValidator());
    }

}
```

#### Kotlin:
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

<br>

## 1.11.5. 콘텐츠 타입 리졸버(Content Type Resolvers)
`@Controller` 인스턴스에서 요청된 미디어 타입을 결정하는 방법을 설정할 수 있다. 기본적으로 `Accept` 헤더만 검사하지만, 쿼리 파라미터 변수
기반으로 검사하도록 설정할 수도 있다.

다음은 요청된 콘텐츠 타입 매핑 방식을 사용자 정의하는 예제다.

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureContentTypeResolver(RequestedContentTypeResolverBuilder builder) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureContentTypeResolver(builder: RequestedContentTypeResolverBuilder) {
        // ...
    }
}
```

## 1.11.6. HTTP 메시지 코덱(HTTP message codecs)
다음 예제는 요청과 응답 본문(body)를 읽고 쓰는 방식을 사용자 정의하는 방법이다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().maxInMemorySize(512 * 1024);
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
        // ...
    }
}
```

`ServerCodecConfigurer`는 기본 reader, writer 셋을 제공하는데 이를 이용해서 더 많은 reader와 writer를 추가하거나 기본 설정을
커스텀하거나 아예 다른 것으로 교체할 수 있다.

Jackson JSON과 XML의 경우 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html" rel="nofollow" target="_blank">`Jackson2ObjectMapperBuilder`</a>를 사용을 고려해볼 수 있다. Jackson의 기본 속성을 아래와 같이
사용자 정의할 수 있다.

- <a href="https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/DeserializationFeature.html#FAIL_ON_UNKNOWN_PROPERTIES" rel="nofollow" target="_blank">`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`</a>를 비활성화한다.
- <a href="https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/MapperFeature.html#DEFAULT_VIEW_INCLUSION" rel="nofollow" target="_blank">`MapperFeature.DEFAULT_VIEW_INCLUSION`</a>를 비활성화한다.

또한 아래와 같은 모듈이 클래스 경로에서 감지되면 자동으로 등록한다.

- <a href="https://github.com/FasterXML/jackson-datatype-joda" rel="nofollow" target="_blank">`jackson-datatype-joda`</a>: Joda-Time 타입을 지원한다.
- <a href="https://github.com/FasterXML/jackson-datatype-jsr310" rel="nofollow" target="_blank">`jackson-datatype-jsr310`</a>: 자바 8의 Date와 Time API 타입을 지원한다.
- <a href="https://github.com/FasterXML/jackson-datatype-jdk8" rel="nofollow" target="_blank">`jackson-datatype-jdk8`</a>: `Optional`과 같은 자바 8의 타입을 지원한다.
- <a href="https://github.com/FasterXML/jackson-module-kotlin" rel="nofollow" target="_blank">`jackson-module-kotlin`</a>: 코틀린 클래스와 데이터 클래스를 지원한다.

<br>

## 1.11.7. 뷰 리졸버(View Resolvers)
다음 예제는 뷰 리졸버 설정 방법이다.

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        // ...
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        // ...
    }
}
```

`ViewResolverRegistry`를 이용해서 스프링 프레임워크와 통합된 뷰(view) 기술을 등록할 수 있다. 다음 예제는 FreeMarker를 사용한다.
(기본적인 FreeMarker 뷰 설정도 필요하다)

#### Java:

```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {


    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.freeMarker();
    }

    // Configure Freemarker...

    @Bean
    public FreeMarkerConfigurer freeMarkerConfigurer() {
        FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
        configurer.setTemplateLoaderPath("classpath:/templates");
        return configurer;
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        registry.freeMarker()
    }

    // Configure Freemarker...

    @Bean
    fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
        setTemplateLoaderPath("classpath:/templates")
    }
}
```

또한 아래와 같이 `ViewResolver` 구현체를 직접 연결할 수도 있다.

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {


    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        ViewResolver resolver = ... ;
        registry.viewResolver(resolver);
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        val resolver: ViewResolver = ...
        registry.viewResolver(resolver
    }
}
```

콘텐츠 협상<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multiple-representations" rel="nofollow" target="_blank">(Content Negotiation)</a>과
뷰 리졸루션을 통한 다른 포맷(HTML이 아닌) 렌더링 지원을 위해, `spring-web` 모듈에 있는 어떤 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">코덱</a>과도
호환되는 `HttpMessageWriterView` 구현체로 하나 이상의 디폴트 뷰를 설정하면 된다. 다음 예제는 그 방법을 보여준다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {


    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.freeMarker();

        Jackson2JsonEncoder encoder = new Jackson2JsonEncoder();
        registry.defaultViews(new HttpMessageWriterView(encoder));
    }

    // ...
}
```

Kotlin
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {


    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        registry.freeMarker()

        val encoder = Jackson2JsonEncoder()
        registry.defaultViews(HttpMessageWriterView(encoder))
    }

    // ...
}
```

스프링 웹플럭스와 통합된 뷰 기술에 대한 자세한 내용은 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-view" rel="nofollow" target="_blank">View Technologies</a>을 참조하라.

<br>

## 1.11.8. 정적 자원(Static Resources)
이 옵션은 정적 자원을 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/core/io/Resource.html" rel="nofollow" target="_blank">`Resource`</a> 기반으로
제공하는 편리한 방법을 제공한다. 다음 예제에서는 `/resources`로 시작하는 요청은 상대 경로는 클래스 경로에서 `/static`에 있는 정적 자원을
찾아서 제공하는데 사용된다. 브라우저 캐시를 최대한으로 사용하고 HTTP 요청을 감소시키기 위해 리소스의 캐시 만료 기간을 1년으로 설정했다.
또한 `Last-Modified` 헤더도 검사되며, (브라우저 캐시가 최신 상태라면) 304 상태 코드를 반환한다. 다음은 그 예제다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/resources/**")
            .addResourceLocations("/public", "classpath:/static/")
            .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS));
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("/public", "classpath:/static/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS))
    }
}
```

또한 자원 핸들러(resource handler)는 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/resource/ResourceResolver.html" rel="nofollow" target="_blank">`ResourceResolver`</a> 구현체와 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/resource/ResourceTransformer.html" rel="nofollow" target="_blank">`ResourceTransformer`</a> 구현체의 체인을 지원하며,
최적화된 자원 제공을 위한 툴체인 생성에 사용된다.

콘텐츠, 고정된 애플리케이션 버전 또는 기타 다른 정보로부터 계산된 MD5 해시에 기반한 버전이 지정된(versioned) 자원 URL을 위해
`VersionResourceResolver`를 사용할 수 있다. `ContentVersionStrategy`(MD5 해시)는 몇몇 주목할만한 예외(예, 모듈 로더와 함께
사용되는 자바스크립트 자원)를 제외하고는 사용하는 것이 좋은 선택이 될 수 있다.

다음은 자바 설정에서 `VersionResourceResolver`를 사용하는 예제다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("/public/")
                .resourceChain(true)
                .addResolver(new VersionResourceResolver().addContentVersionStrategy("/**"));
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("/public/")
                .resourceChain(true)
                .addResolver(VersionResourceResolver().addContentVersionStrategy("/**"))
    }
}
```

`ResourceUrlProvider`를 사용하여 URL을 다시 작성(rewrite)하고 resolver와 transformer의 전체 체이닝을 적용(예를 들어, 버전
입력을 위해)할 수 있다. 웹플럭스 설정은 `ResourceUrlProvider`를 제공하기 때문에 다른 곳에 주입할 수 있다.

스프링 MVC와는 다르게, 현재 웹플럭스에서는 정적 리소스 URL을 명백하게 다시 작성할 수 있는 방법이 없다. 이유는 논 블로킹 리졸버와
트랜스포머(transformer) 체인을 사용할수 있는 뷰 기술이 없기 때문이다. 로컬 자원만 제공하는 경우에는 `ResourceUrlProvider`를
직접(예를 들어, 커스텀 엘리먼트를 통해서) 사용하여 블로킹 하는 것도 방법이다.

`EncodedResourceResolver`(예를 들어, Gzip, Brotil 인코딩)와 `VersionedResourceResolver`를 같이 사용하는 경우
인코딩 전 파일을 기반으로 콘텐츠 버전이 계산되도록 반드시 순서대로 등록해야 한다.

**Webjars**는 `WebJarsResourceResolver`를 통해 지원되는데, 이는 `org.webjars:webjars-locator-core` 라이브러리가
클래스 경로에 있는 경우 자동으로 등록된다.

리졸버는 URL을 다시 작성하여 jar의 버전을 포함하고, 버전없이 들어온 요청 URL과도 매칭할 수 있다.
(예를 들어, `/jquery/jquery.min.js`를 `/jquery/1.2.0/jquery.min.js.`로 매칭한다)

<br>

## 1.11.9. 경로 매칭(Path Matching)
경로 매칭 관련 옵션을 커스터마이징할 수 있다. 개별 옵션에 대한 자세한 내용은 <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/reactive/config/PathMatchConfigurer.html" rel="nofollow" target="_blank">`PathMatchConfigurer`</a> javadoc을 참조하라.
다음 예제는 `PathMatchConfigurer`를 사용하는 방법이다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer
            .setUseCaseSensitiveMatch(true)
            .setUseTrailingSlashMatch(false)
            .addPathPrefix("/api",
                    HandlerTypePredicate.forAnnotation(RestController.class));
    }
}
```

#### Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    @Override
    fun configurePathMatch(configurer: PathMatchConfigurer) {
        configurer
            .setUseCaseSensitiveMatch(true)
            .setUseTrailingSlashMatch(false)
            .addPathPrefix("/api",
                    HandlerTypePredicate.forAnnotation(RestController::class.java))
    }
}
```

> 스프링 웹플럭스는 `RequestPath`라는 인터페이스로 파싱된 path에 의존하는데, 따라서 세미콜론이 제거되고 디코딩된 path segment(path
또는 matrix 변수) 값을 이용한다. 이는 스프링 MVC와 다르게 요청 경로를 디코딩 여부 또는 경로 매칭 목적으로 세미콜론의 제거 여부를 명시하지
않아도 되는 것이다.

또한 스프링 웹플럭스는 스프링 MVC와 다르게 접미사(suffix) 패턴 매칭을 지원하지 않는다. 또한 접미사 패턴에 의존하지 않는 다른 방법을
<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-ann-requestmapping-suffix-pattern-match" rel="nofollow" target="_blank">추천</a>한다.

<br>

## 1.11.10. 고급 설정 모드(Advanced Configuration Mode)
`@EnableWebFlux`는 아래와 같은 역할을 하는 `DelegatingWebFluxConfiguration`를 임포트(import)한다.

- 웹플럭스 애플리케이션을 위한 기본 스프링 설정을 제공한다.
- 설정을 커스텀하기 위한 `WebFluxConfigurer` 구현체를 찾고 위임(delegate)한다.

더 많은 설정을 직접 설정하려면 다음 예제와 같이 `@EnableWebFlux`를 제거하고 `WebFluxConfigurer`를 구현하는 대신에
`DelegatingWebFluxConfiguration`을 직접 확장하면 된다.

#### Java:
```java
@Configuration
public class WebConfig extends DelegatingWebFluxConfiguration {

    // ...
}
```

#### Kotlin:
```kotlin
@Configuration
class WebConfig : DelegatingWebFluxConfiguration {

    // ...
}
```

`WebConfig`에 있던 기존 메서드를 유지하고 사용할 수 있지만, 위 예제처럼 하는 경우 부모 클래스(base class)에서 정의한 빈(bean)을
재정의하고 클래스 경로 내 여러 다른 클래스들로 `WebMvcConfigurer`를 구현할 수 있다.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-http2">다음글 "1.12. HTTP/2" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>