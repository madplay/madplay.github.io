---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.9. View Technologies"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.9. View Technologies"
category: Spring
date: "2019-07-02 23:11:23"
comments: true
---

# 1.9. 뷰 기술(View Technologies)
스프링 웹플럭스에서 뷰 기술의 사용은 플러그인 형태로(pluggable) 사용할 수 있다. 타임리프(Thymeleaf), 프리마커(FreeMarker) 또는 어떤 다른 뷰 기술 중
어떤 것을 사용하기로 결정했는지는 주로 설정 변경의 문제다. (설정 변경이면 된다) 이번 챕터에서는 스프링 웹플럭스의 통합된 뷰 기술에 대해 설명한다.
이미 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-viewresolution" rel="nofollow" target="_blank">View Resolution</a>에 대해서 이미 알고 있다는 것을 가정한다.

<br>

## 1.9.1. 타임리프(Thymeleaf)
타임리프는 모던 서버사이드 자바 템플릿 엔진으로 더블 클릭으로 브라우저에서 미리 볼 수 있는 자연스러운 HTML 템플릿을 강조한다. 구동중인 서버가 없어도
UI 템플릿(예를 들어, 디자이너가)에 대한 독립적인 작업에 유용하다. 타임리프는 광범위한 기능을 제공하며 활발하게 개발되고 관리된다. 보다 완전한 소개는
<a href="https://www.thymeleaf.org/" rel="nofollow" target="_blank">Thymeleaf</a> 프로젝트 홈페이지를 참조하라.

스프링 웹플럭스와 타임리프의 통합은 타임리프 프로젝트에 의해 관리된다. 설정은 `SpringResourceTemplateResolver`,
`SpringWebFluxTemplateEngine` 그리고 `ThymeleafReactiveViewResolver`와 같은 몇 가지 빈(bean) 선언이 포함된다.
자세한 내용은 <a href="https://www.thymeleaf.org/documentation.html" rel="nofollow" target="_blank">Thymeleaf+Spring</a>과
웹플럭스 통합 <a href="http://forum.thymeleaf.org/Thymeleaf-3-0-8-JUST-PUBLISHED-td4030687.html" rel="nofollow" target="_blank">공지문</a>을 참조하라.

<br>

## 1.9.2. 프리마커
<a href="https://freemarker.apache.org/" rel="nofollow" target="_blank">아파치 프리마커(Apache FreeMarker)</a>는
HTML에서 이메일 등에 이르는 다른 어떤 종류의 텍스트 출력(output)을 생성하기 위한 템플릿 엔진이다. 스프링 프레임워크는 프리마커 템플릿과
스프링 웹플럭스를 함께 사용하기 위한 통합 기능을 내장하고 있다.

<br>

### 뷰 설정(View Configuration)
아래 예제는 프리마커를 뷰 기술로 설정하는 방법이다:

#### Java:
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

#### Kotlin:
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

<br>

### 프리마커 설정(FreeMarker Configuration)
`FreeMarkerConfigurer` 빈 속성으로 프리마커 Configuration 객체(스프링이 관리)에 'Settings'와 'SharedVariables' 값을
직접 전달할 수 있다. `freemarkerSettings` 속성은 `java.util.Properties` 객체를, 그리고 `freemarkerVariables` 속성은 `java.util.Map`을
사용한다. 아래 예제는 `FreeMarkerConfigurer`를 사용하는 방법이다.

#### Java:
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

#### Kotlin:
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

<br>

### 폼 핸들링(Form Handling)
스프링은 `<spring:bind/>`요소와 같은 JSP에서 사용하기 위한 태그 라이브러리를 제공한다. 이 엘리먼트는 폼을 지원하는 객체(form-backing objects)의
값을 표시하고, 웹 계층 또는 비즈니스 계층의 `Validator`에서 실패한 유효성 검사 결과를 폼이 보여주게 한다. 스프링은 또한 FreeMarker에서도 동일한 기능을
제공하며 폼 입력(input) 엘리먼트 자체를 직접 만드는 편리한 매크로를 제공한다.

<br>

### 매크로 바인딩(The Bind Macros)
프리마커를 위한 매크로의 표준 집합은 `spring-webflux.jar` 파일 내에서 유지 보수되기 때문에 적절히 설정된 애플리케이션에서 언제든 사용할 수 있다.

스프링 템플릿 라이브러리에 정의된 일부 매크로는 내부용(private)이지만, 매크로 정의에는 이러한 범위가 없기 때문에 호출하는 코드와 사용자 템플릿에서는
접근할 수 있다. 다음 섹션에서는 템플릿 내에서 직접 호출해야 하는 매크로만 중점적으로 다룬다. 매크로 코드를 직접 보고싶다면 
`org.springframework.web.reactive.result.view.freemarker` 패키지에 있는 `spring.ftl` 파일을 보라.

바인딩 지원에 대한 추가 정보는 스프링 MVC의 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-view-simple-binding" rel="nofollow" target="_blank">Simple Binding</a>을 참조하라.

<br>

### 폼 매크로(Form Macros)
스프링의 프리마커 템플릿용 폼 매크로에 대한 지원 내용은 아래 있는 스프링 MVC 문서를 참조하라.

- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros" target="_blank" rel="nofollow">입력 매크로(Input Macros)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-input" target="_blank" rel="nofollow">입력 필드(Input Fields)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-select" target="_blank" rel="nofollow">선택 필드(Selection Fields)</a>
- <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-views-form-macros-html-escaping" target="_blank" rel="nofollow">HTML 이스케이프(HTML Escaping)</a>

<br>

## 1.9.3. 스크립트 뷰(Script Views)
스프링 프레임워크는 <a href="https://www.jcp.org/en/jsr/detail?id=223" rel="nofollow" target="_blank">JSR-223</a>
자바스크립트 엔진에서 실행할 수 있는 템플릿 라이브러리와 스프링 웹플럭스를 함께 사용하기 위한 내장형 통합 기능을 제공한다.
다음 표는 여러 스크립트 엔진 테스트를 거친 템플릿 라이브러리리를 보여준다:

| 스크립트 라이브러리<br>(Scripting Library) | 스크립트 엔진<br>(Scripting Engine)
| :--: | :--: |
<a href="https://handlebarsjs.com/" target="_blank" rel="nofollow">Handlebars</a> | <a href="https://openjdk.java.net/projects/nashorn/" target="_blank" rel="nofollow">Nashorn</a>
<a href="https://mustache.github.io/" target="_blank" rel="nofollow">Mustache</a> | <a href="https://openjdk.java.net/projects/nashorn/" target="_blank" rel="nofollow">Nashorn</a>
<a href="https://reactjs.org/" target="_blank" rel="nofollow">React</a> | <a href="https://openjdk.java.net/projects/nashorn/" target="_blank" rel="nofollow">Nashorn</a>
<a href="https://www.embeddedjs.com/" target="_blank" rel="nofollow">EJS</a> | <a href="https://openjdk.java.net/projects/nashorn/" target="_blank" rel="nofollow">Nashorn</a>
<a href="https://www.stuartellis.name/articles/erb/" target="_blank" rel="nofollow">ERB</a> | <a href="https://www.jruby.org/" target="_Blank" rel="nofollow">JRuby</a>
<a href="https://docs.python.org/2/library/string.html#template-strings" target="_blank" rel="nofollow">String templates</a> | <a href="https://www.jython.org/" target="_blank" rel="nofollow">Jython</a>
<a href="https://github.com/sdeleuze/kotlin-script-templating" target="_blank" rel="nofollow">Kotlin Script templating</a> | <a href="https://kotlinlang.org/" target="_blank" rel="nofollow">Kotlin</a>

> 다른 스크립트 엔진을 통합하는 기본 규칙은 `ScriptEngine`과 `Invocable` 인터페이스를 구현해야 한다는 것이다.

<br>

### 요구사항(Requirements)
스크립트 엔진이 클래스패스(classath)에 있어야 하며, 각 엔진마다 요구사항이 조금씩 다르다.

- <a href="https://openjdk.java.net/projects/nashorn/" rel="nofollow" target="_blank">Nashorn</a> 자바스크립트 엔진은 자바 8 이상의 버전을 요구한다. 가장 최근의 업데이트 릴리즈를 사용할 것을 적극 권장한다.
- Ruby을 사용하기 위해서는 <a href="https://www.jruby.org/" rel="nofollow" target="_blank">JRuby</a> 의존성을 추가해야 한다.
- 파이썬을 사용하기 위해서는 <a href="https://www.jython.org/" rel="nofollow" target="_blank">Jython</a> 의존성을 추가해야 한다.
- 코틀린 스크립트를 사용하기 위해서는 `org.jetbrains.kotlin:kotlin-script-util` 의존성과
`org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory` 라인을 포함하는
`META-INF/services/javax.script.ScriptEngineFactory` 파일이 필요하다. 자세한 내용은
<a href="https://github.com/sdeleuze/kotlin-script-templating" target="_blank" rel="nofoloow">이 예제</a>를 참조하라.

스크립트 템플릿 라이브러리가 필요하다. 자바스크립트를 사용하는 방법 중 하나는 <a href="https://www.webjars.org/" target="_blank" rel="nofollow">WebJars</a>를 사용하는 것이다.

<br>

### 스크립트 템플릿
`ScriptTemplateConfigurer` 빈(bean)을 선언하여 사용할 스크립트 엔진, 로드할 스크립트 파일, 템플릿을 렌더링하기 위해 호출할 함수 등을 지정할 수 있다.
다음 예제는 Mustache 템플릿과 Nashorn 자바스크립트 엔진을 사용한다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.scriptTemplate();
    }

    @Bean
    public ScriptTemplateConfigurer configurer() {
        ScriptTemplateConfigurer configurer = new ScriptTemplateConfigurer();
        configurer.setEngineName("nashorn");
        configurer.setScripts("mustache.js");
        configurer.setRenderObject("Mustache");
        configurer.setRenderFunction("render");
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
        registry.scriptTemplate()
    }

    @Bean
    fun configurer() = ScriptTemplateConfigurer().apply {
        engineName = "nashorn"
        setScripts("mustache.js")
        renderObject = "Mustache"
        renderFunction = "render"
    }
}
```

`render` 함수는 아래의 파라미터와 함께 호출된다.

- `String template`: 템플릿 내용(content)
- `Map model`: 뷰 모델
- `RenderingContext renderingContext`: <a href="https://docs.spring.io/spring-framework/docs/5.2.7.RELEASE/javadoc-api/org/springframework/web/servlet/view/script/RenderingContext.html" rel="nofollow" target="_blank">`RenderingContext`</a>는 애플리케이션 컨텍스트, 로케일(locale), 템플릿 로더 그리고 URL(5.0 버전부터)에 대한 접근을 제공한다.

`Mustache.render()`는 기본적으로 이 시그니처와 호환되기 때문에 직접 호출할 수 있다.

템플릿 기술에 약간의 커스터마이징이 필요한 경우, 커스텀 렌더(render) 함수를 구현하는 스크립트를 제공할 수 있다.
예를 들어 <a href="https://handlebarsjs.com/" target="_blank" rel="nofollow">Handlebars</a>는 사용하기 전에 템플릿을 컴파일해야하며
서버사이드 스크립트 엔진에서 사용할 수 없는 브라우저 기능을 사용하려면 <a href="https://en.wikipedia.org/wiki/Polyfill" target="_blank" rel="nofollow">polyfill</a>을 필요로 한다. 다음 예제는 커스텀 렌더 함수를 설정하는 방법이다:

#### Java:
```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.scriptTemplate();
    }

    @Bean
    public ScriptTemplateConfigurer configurer() {
        ScriptTemplateConfigurer configurer = new ScriptTemplateConfigurer();
        configurer.setEngineName("nashorn");
        configurer.setScripts("polyfill.js", "handlebars.js", "render.js");
        configurer.setRenderFunction("render");
        configurer.setSharedEngine(false);
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
        registry.scriptTemplate()
    }

    @Bean
    fun configurer() = ScriptTemplateConfigurer().apply {
        engineName = "nashorn"
        setScripts("polyfill.js", "handlebars.js", "render.js")
        renderFunction = "render"
        isSharedEngine = false
    }
}
```

> `sharedEngine` 속성을 `false`로 설정한 이유는 thread-safe하지 않은 템플릿 라이브러리가 있기 때문이다. Nashorn 위에서 실행되는 Handlebars,
React는 동시성이 고려되지 않았다. 이러한 경우에는 자바 SE 8 update 60이 필요하다. 
<a href="https://bugs.openjdk.java.net/browse/JDK-8076099" target="_blank" rel="nofollow">이 버그</a> 때문인데,
일반적으로 버그가 아니더라도 최신 Java SE 패치 릴리즈를 사용하는 것이 좋다.

`polyfill.js`는 아래 코드에서처럼 단순히 Handlebars가 올바르게 실행하는데 필요한 `window` 객체만 정의한다.

```js
var window = {};
```

이 `render.js` 구현체는 템플릿을 사용하기 전에 컴파일한다. 프로덕션 환경이라면 캐시된 템플릿 또는 사전 컴파일된 템플릿을 저장해놓고 재사용해야 한다.
이는 스크립트 사이드에서 진행되며, 필요하다면 커스터마이징도 가능하다.(예를 들어, 템플릿 엔진 설정 관리 스크립트). 다음 예제는 템플릿을 컴파일하는 방법이다:


```js
function render(template, model) {
    var compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(model);
}
```

더 자세한 설정 예시는 스프링 프레임워크 유닛 테스트, <a href="https://github.com/spring-projects/spring-framework/tree/master/spring-webflux/src/test/java/org/springframework/web/reactive/result/view/script"
target="_blank" rel="nofollow">자바(java)</a> 그리고 <a href="https://github.com/spring-projects/spring-framework/tree/master/spring-webflux/src/test/resources/org/springframework/web/reactive/result/view/script"
target="_blank" rel="nofollow">리소스(resources)</a>를 참조하라

<br>

## 1.9.4. JSON과 XML(JSON and XML)
컨텐츠 협상<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-multiple-representations" rel="nofollow" target="_blank">(Content Negotiation)</a>을
위해 클라이언트가 요청한 컨텐츠 유형(content type)에 따라 HTML 템플릿으로 모델을 렌더링하거나 다른 형식(예를 들어 JSON 또는 XML)으로
렌더링하는 것이 좋다. 스프링 웹플럭스는 이를 위해 `HttpMessageWriterView`를 제공하는데, `Jackson2JsonEncoder`,
`Jackson2SmileEncoder` 또는 `Jaxb2XmlEncoder`와 같이 `spring-web`에서 사용 가능한 코덱<a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-codecs" rel="nofollow" target="_blank">(Codec)</a>을
플러그인같이 사용할 수 있다.

다른 뷰 기술과 다르게 `HttpMessageWriterView`는 기본 뷰 로 <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-view-resolvers" rel="nofollow" target="_blank">설정</a>되기
때문에 `ViewResolver`가 필요하지 않다. `HttpMessageWriter`나 `Encoder` 인스턴스를 래핑하여 하나 이상의 기본 뷰를 설정할 수 있다.
런타임에 콘텐츠 유형(content type)과 일치하는 뷰가 사용된다.

대부분의 경우 모델은 여러 속성을 갖는다. 직렬화하려면 렌더링에 사용할 모델 속성 이름을 `HttpMessageWriterView`에 설정한다.
모델에 속성이 하나만 있는 경우에는 그 속성을 사용한다.

---

> ### 목차 가이드
> - <a href="/post/spring-webflux-references-http-caching">다음글 "1.10. HTTP Caching" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>