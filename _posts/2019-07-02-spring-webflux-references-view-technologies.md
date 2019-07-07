---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.9. 뷰 기술"
author:   Kimtaeng
tags: 	  spring webflux reactive
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.9. View Technologies"
category: Spring
date: "2019-07-02 23:11:23"
comments: true
---

# 1.9. 뷰 기술(View Technologies)
스프링 웹플럭스에서 뷰 기술의 사용은 플러그인 형태로(pluggable) 사용할 수 있다. 타임리프(Thymeleaf), 프리마커(FreeMarker) 또는 어떤 다른 뷰 기술 중
어떤 것을 사용하기로 결정했는지는 주로 설정 변경의 문제다. (설정 변경이면 된다) 이번 챕터에서는 스프링 웹플럭스의 통합된 뷰 기술에 대해 설명한다.
이미 View Resolution에 대해서 이미 알고 있다는 것을 가정한다.

## 1.9.1. 타임리프(Thymeleaf)
타임리프는 모던 서버사이드 자바 템플릿 엔진으로 더블 클릭으로 브라우저에서 미리 볼 수 있는 자연스러운 HTML 템플릿을 강조한다. 구동중인 서버가 없어도
UI 템플릿(예를 들어, 디자이너가)에 대한 독립적인 작업에 유용하다. 타임리프는 광범위한 기능을 제공하며 활발하게 개발되고 관리된다. 보다 완전한 소개는
Thymeleaf 프로젝트 홈페이지를 참조하라.

스프링 웹플럭스와 타임리프의 통합은 타임리프 프로젝트에 의해 관리된다. 설정은  `SpringResourceTemplateResolver`, `SpringWebFluxTemplateEngine`
그리고 `ThymeleafReactiveViewResolver`와 같은 몇 가지 빈(bean) 선언이 포함된다. 자세한 내용은 **Thymeleaf+Spring**과 웹플럭스 통합 공지문을
참조하라.

## 1.9.2. 프리마커
아파치 프리마커는 HTML에서 이메일 등에 이르는 다른 어떤 종류의 텍스트 출력(output)을 생성하기 위한 템플릿 엔진이다. 스프링 프레임워크는 프리마커 템플릿과
스프링 웹플럭스를 함께 사용하기 위한 통합 기능을 내장하고 있다.

### 뷰 설정(View Configuration)
아래 예제는 프리마커를 뷰 기술로 설정하는 방법이다:

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.freeMarker();
    }

    // Configure FreeMarker...

    @Bean
    public FreeMarkerConfigurer freeMarkerConfigurer() {
        FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
        configurer.setTemplateLoaderPath("classpath:/templates/freemarker");
        return configurer;
    }
}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    override fun configureViewResolvers(registry: ViewResolverRegistry) {
        registry.freeMarker()
    }

    // Configure FreeMarker...

    @Bean
    fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
        setTemplateLoaderPath("classpath:/templates/freemarker")
    }
}
```

템플릿은 위의 예제와 같이 `FreeMarkerConfigurer`에 지정한 디렉토리에 저장해야 한다. 이와 같은 설정을 기반으로 컨트롤러가 뷰 이름 `welcome`을
반환했을 때, 리졸버(resolver)는 `classpath:/templates/freemarker/welcome.ftl` 템플릿을 찾는다.

### 프리마커 설정(FreeMarker Configuration)
`FreeMarkerConfigurer` 빈 속성으로 프리마커 Configuration 객체(스프링이 관리)에 'Settings'와 'SharedVariables' 값을
직접 전달할 수 있다. `freemarkerSettings` 속성은 `java.util.Properties` 객체를, 그리고 `freemarkerVariables` 속성은 `java.util.Map`을
사용한다. 아래 예제는 `FreeMarkerConfigurer`를 사용하는 방법이다.

Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    // ...

    @Bean
    public FreeMarkerConfigurer freeMarkerConfigurer() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("xml_escape", new XmlEscape());

        FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
        configurer.setTemplateLoaderPath("classpath:/templates");
        configurer.setFreemarkerVariables(variables);
        return configurer;
    }
}
```

Kotlin:
```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

    // ...

    @Bean
    fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
        setTemplateLoaderPath("classpath:/templates")
        setFreemarkerVariables(mapOf("xml_escape" to XmlEscape()))
    }
}
```

`Configuration` 객체에 적용되는 설정과 변수는 FreeMarker 문서를 참조하라.

### 폼 핸들링(Form Handling)
스프링은 `<spring:bind/>`요소와 같은 JSP에서 사용하기 위한 태그 라이브러리를 제공한다. 이 엘리먼트는 폼을 지원하는 객체(form-backing objects)의
값을 표시하고, 웹 계층 또는 비즈니스 계층의 `Validator`에서 실패한 유효성 검사 결과를 폼이 보여주게 한다. 스프링은 또한 FreeMarker에서도 동일한 기능을
제공하며 폼 입력(input) 엘리먼트 자체를 직접 만드는 편리한 매크로를 제공한다.

### 매크로 바인딩(The Bind Macros)
프리마커를 위한 매크로의 표준 집합은 `spring-webflux.jar` 파일 내에서 유지 보수되기 때문에 적절히 설정된 애플리케이션에서 언제든 사용할 수 있다.

스프링 템플릿 라이브러리에 정의된 일부 매크로는 내부용(private)이지만, 매크로 정의에는 이러한 범위가 없기 때문에 호출하는 코드와 사용자 템플릿에서는
접근할 수 있다. 다음 섹션에서는 템플릿 내에서 직접 호출해야 하는 매크로만 중점적으로 다룬다. 매크로 코드를 직접 보고싶다면 
`org.springframework.web.reactive.result.view.freemarker` 패키지에 있는 `spring.ftl` 파일을 보라.

바인딩 지원에 대한 추가 정보는 스프링 MVC의 Simple Binding을 참조하라.

### 폼 매크로(Form Macros)
스프링의 프리마커 템플릿용 폼 매크로에 대한 지원 내용은 아래 있는 스프링 MVC 문서를 참조하라.

- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros"
target="_blank" rel="nofollow">입력 매크로(Input Macros)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-input"
target="_blank" rel="nofollow">입력 필드(Input Fields)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-select"
target="_blank" rel="nofollow">선택 필드(Selection Fields)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-html-escaping"
target="_blank" rel="nofollow">HTML 이스케이프(HTML Escaping)</a>


---

> ### 목차 가이드
> - 다음글 "1.10. HTTP Caching" 로 이동
> - <a href="/post/web-on-reactive-stack" target="_blank">전체 목차 페이지로 이동</a>