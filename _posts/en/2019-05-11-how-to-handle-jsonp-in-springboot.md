---
layout:   post
title:    "Handling JSONP in Spring Boot and Solving CORS Issues"
author:   Kimtaeng
tags: 	  spring springboot jsonp cors
description: "How do you implement JSONP responses in Spring Boot, and how do you solve cross-domain issues?"
category: Spring
date: "2019-05-11 23:52:10"
comments: true
slug:     how-to-handle-jsonp-in-springboot
lang:     en
permalink: /en/post/how-to-handle-jsonp-in-springboot
---

# What Is CORS?
**Cross-Origin Resource Sharing** means requesting resources from a different origin. When a client calls an API server via `ajax`, CORS errors often appear. For example, if the client domain is `madplay.com` and the API server domain is `taeng.com`, the request fails.

The error comes from the **Same-origin policy**, which restricts interactions with resources from a different origin. To avoid the error, the protocol, domain, and port must match (same origin).

Now let’s see how to handle CORS in Spring Boot.

<br>

# Method 1: AbstractJsonpResponseBodyAdvice
First is `JSONP`. It bypasses the same-origin policy and allows data sharing across domains. Spring provides `AbstractJsonpResponseBodyAdvice`, which makes JSONP responses easy.

Combine it with `@ControllerAdvice` like this.

```java
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.AbstractJsonpResponseBodyAdvice;

@ControllerAdvice
public class JsonpAdvice extends AbstractJsonpResponseBodyAdvice {
	public JsonpAdvice() {
		super("callback");
	}
}
```

On the client side, send the `ajax` request as follows. The parameter name you append (here, `callback`) must match the string passed to the superclass constructor.

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
# Output
{title: "How to support JSONP", pressName: "Kimtaeng Daily", reporterName: "Kimtaeng"}

# In the Network tab, you will see a call like this.
http://localhost:8080/hello?callback=myCallback&_=1585478049703
```

However, `AbstractJsonpResponseBodyAdvice` is removed starting in Spring Boot `2.1.0`. In Spring Framework terms, it is removed from `5.1.0`. If you upgrade, you can no longer use it, so follow the CORS guidance below.

<br>

# Method 2: WebMvcConfigurer
Implement `WebMvcConfigurer` to configure global CORS settings.

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // All requests
            .allowedOrigins("Allowed origins go here.");
    }
}
```

<br>

# Method 3: @CrossOrigin
Instead of global configuration, you can allow cross-origin requests per controller. Use `@CrossOrigin`.

```java
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin("Allowed origins go here.")
public class MadController {
    // omitted
}
```

<br>

# Method 4: AbstractMappingJacksonResponseBodyAdvice
As mentioned, `AbstractJsonpResponseBodyAdvice` is removed in Spring Boot 2.1.0 (Spring Framework 5.1.0), and Spring recommends the CORS approaches in methods 2 and 3. However, due to client library constraints and the need to support Internet Explorer 8 and 9, I still had to provide JSONP.

So I used `AbstractMappingJacksonResponseBodyAdvice`, which is available since Spring Framework 4.1.

## Define a response wrapper
Define a wrapper object that can return the API response in `JSONP` format.

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

## Define a custom JsonSerializer
Implement a serializer that takes the wrapper and writes a `JSONP` response.

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
Finally, create `@ControllerAdvice` by extending `AbstractMappingJacksonResponseBodyAdvice`. When the request includes the `callback` parameter, respond in `JSONP` format.

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
		if (StringUtils.isNotBlank(callbackName)) { // commons-lang3 library
			response.getHeaders().setContentType(JSONP_MEDIA_TYPE);
			bodyContainer.setValue(new JsonpWrappingObject(callbackName, bodyContainer.getValue()));
		}
	}
}
```
