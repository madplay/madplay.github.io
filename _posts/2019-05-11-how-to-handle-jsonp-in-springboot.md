---
layout:   post
title:    "스프링 부트에서 JSONP를 다루는 방법, CORS 이슈 해결하기"
author:   Kimtaeng
tags: 	  spring springboot jsonp cors
description: "스프링 부트에서 JSONP 응답을 어떻게 구현할 수 있을까? 그리고 크로스 도메인 이슈를 해결하는 방법은?"
category: Spring
date: "2019-05-11 23:52:10"
comments: true
---

# CORS 란?
**Cross Origin Resource Sharing**의 약자로 출처(origin)이 다른 서버로 자원을 요청하는 것을 말한다.
클라이언트에서 API 서버로부터 데이터를 가져오기 위해 `ajax` 등을 사용하다 보면 종종 CORS 오류가 발생하는 것을 볼 수 있다.
예를 들어 클라이언트의 도메인은 `madplay.com`인데 API 서버의 도메인이 `taeng.com`인 경우 오류가 발생한다.

오류는 **동일 출처 정책(Same-origin policy)**으로 인해 발생한다. 요청한 데이터가 다른 출저에서 가져온 자원과 상호작용하는 것을 제한하는
보안 정책이다. 따라서 오류가 발생하지 않으려면 프로토콜과 도메인 그리고 포트 번호가 일치한 `Same-origin`이 되어야 한다.

그럼 스프링 부트(Spring Boot)에서는 CORS 이슈를 어떻게 해결할 수 있는지 알아보자.

<br>

# 방법 1: AbstractJsonpResponseBodyAdvice
먼저 `JSONP`를 사용하는 방법이다. Same-origin 정책을 우회하여 서로 다른 도메인끼리 데이터를 공유할 수 있도록 하는 방법이다.
스프링 프레임워크에서 제공하는 `AbstractJsonpResponseBodyAdvice` 클래스를 사용하면 정말 간단하게 JSONP로 요청을 응답할 수 있다.

아래와 같이 `@ControllerAdvice` 어노테이션과 조합하여 구현하면 된다.

```java
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.AbstractJsonpResponseBodyAdvice;

@ControllerAdvice
public class JsonpAdvice extends AbstractJsonpResponseBodyAdvice {
	public JsonpAdvice() {
		super("callback");
	}}
}
```

그리고 클라이언트에서 `ajax` 요청은 아래와 같이 진행하면 된다. 호출할 때 붙이는 파라미터의 이름(예제에서는 callback)은 수퍼 클래스의
생성자를 호출할 때 전달되는 문자열과 동일해야 한다.

```js
$.ajax({
	url: 'http://localhost:8080/hello?callback=?',
	dataType:'jsonp',
    jsonpCallback: 'myCallback',
	success: function(res) {
		console.log(res);
	}
});
```

```bash
# 결과 출력
{title: "JSONP를 어떻게 지원할까", pressName: "김탱일보", reporterName: "김탱"}

# 네트워크 탭으로 확인해보면 아래와 같은 호출이 남는다.
http://localhost:8080/hello?callback=myCallback&_=1585478049703
```

그런데 `AbstractJsonpResponseBodyAdvice`는 스프링 부트 `2.1.0` 버전부터 제거되었기 때문에 버전을 올린다면 더 이상 사용할 수 없다.
스프링 프레임워크 기준으로는 `5.1.0` 버전부터 사용할 수 없다. 따라서 `CORS` 가이드에 맞추어 다른 방법을 사용해보자.

<br>

# 방법 2: WebMvcConfigurer
`WebMvcConfigurer`를 구현(implements) 하여 전역(global)으로 설정할 수 있다.

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 요청을 뜻한다.
            .allowedOrigins("허용할 Origin들을 넣어준다.");
    }
}
```

<br>

# 방법 3: @CrossOrigin
앞서 살펴본 전역 설정이 아닌 특정 컨트롤러에만 Cross Origin 요청을 허용하도록 할 수 있다.
`@CrossOrigin` 어노테이션을 사용하면 된다.

```java
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin("허용할 Origin들을 넣어준다.")
public class MadController {
    // 생략
}
```

<br>

# 방법 4: AbstractMappingJacksonResponseBodyAdvice
앞서 살펴본 것처럼 방법 1의 `AbstractJsonpResponseBodyAdvice` 클래스는 스프링 부트 2.1.0 버전(스프링 프레임워크 5.1.0)에서
제거되었고 방법 2, 3번과 같이 `CORS` 관련 라이브러리 사용을 권장한다. 하지만 업무를 진행하면서 클라이언트에서 사용하는 라이브러리 이슈와
더불어 인터넷 익스플로러(IE) 8, 9 버전 대응이 필요하여 `JSONP` 기능을 제공해야만 했다.

따라서 스프링 프레임워크 `4.1` 버전부터 제공하는 `AbstractMappingJacksonResponseBodyAdvice` 클래스를 이용하는 방법을 사용했다.

## 응답 객체 정의
API 응답에 사용할 객체를 `JSONP`로 반환할 수 있도록 래핑(wrapping) 객체를 정의한다.

```java
@JsonSerialize(using = JsonpWrapperSerializer.class)
public class JsonpWrapper {
	private String callbackName;
	private Object data;

	public JsonpWrapper(String callbackName, Object data) {
		this.callbackName = callbackName;
		this.data = data;
	}

	public String getCallbackName() {
		return callbackName;
	}

	public Object getData() {
		return data;
	}
}
```

## 커스텀 JsonSerializer 정의
앞서 정의한 래핑 객체를 받아서 `JSONP` 형태로 응답을 내려주기 위한 Serializer를 구현한다. 

```java
public class JsonpWrapperSerializer extends JsonSerializer<JsonpWrapper> {
	
	@Override
	public void serialize(JsonpWrapper wrapper, JsonGenerator jsonGenerator,
		SerializerProvider serializerProvider) throws Exception {

		if (wrapper != null) {
			jsonGenerator.writeRaw("/**/");
			jsonGenerator.writeRaw(wrapper.getCallbackName());
			jsonGenerator.writeRaw("(");
			jsonGenerator.writeObject(wrapper.getData());
			jsonGenerator.writeRaw(");");
		}
	}
}
```

## AbstractMappingJacksonResponseBodyAdvice
마지막으로 `AbstractMappingJacksonResponseBodyAdvice`를 상속하여 `@ControllerAdvice`를 만들면 된다.
요청한 파라미터에 `callback`이 포함된 경우 `JSONP` 형태로 응답을 내리도록 한다.

```java
@ControllerAdvice
public class JsonpAdvice extends AbstractMappingJacksonResponseBodyAdvice {
	private static final MediaType JSONP_MEDIA_TYPE = new MediaType("application", "javascript");
	private static final String JSONP_CALLBACK_NAME = "callback";

	@Override
	protected void beforeBodyWriteInternal(MappingJacksonValue bodyContainer, MediaType contentType,
		MethodParameter returnType, ServerHttpRequest request, ServerHttpResponse response) {

		HttpServletRequest servletRequest = ((ServletServerHttpRequest)request).getServletRequest();
		String callbackName = servletRequest.getParameter(JSONP_CALLBACK_NAME);
		if (StringUtils.isNotBlank(callbackName)) { // commons-lang3 라이브러리
			response.getHeaders().setContentType(JSONP_MEDIA_TYPE);
			bodyContainer.setValue(new JsonpWrappingObject(callbackName, bodyContainer.getValue()));
		}
	}
}
```