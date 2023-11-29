---
layout: post
title: "Spring RestClient Usage and Differences from RestTemplate"
author: madplay
tags: spring springboot restclient resttemplate java
description: "A practical guide to RestClient in Spring Framework 6.1, covering synchronous HTTP configuration, error handling, testing, and how it compares to RestTemplate."
category: Spring
date: "2023-11-23 12:32:00"
comments: true
lang: en
slug: spring-restclient-vs-resttemplate
permalink: /en/post/spring-restclient-vs-resttemplate
---

# A Modern Synchronous HTTP Client

`RestTemplate` has long been the default choice for making external HTTP calls in the Spring ecosystem.
However, as the number of methods and overloads grew, reading call-site code became increasingly painful.

`WebClient` addressed this with a far more modern API.
Its fluent, method-chaining style makes the request assembly flow easy to follow.
But for servlet-based applications that only need simple synchronous HTTP calls, pulling in a reactive client can feel like overkill.

`RestClient` fills that gap.
Introduced in Spring Framework 6.1, it retains the synchronous call model while offering an API close to `WebClient`.
It also reuses the message converters, interceptors, and request factories already configured in `RestTemplate`.

<br>

## Limitations of RestTemplate and the Shift

`RestTemplate` exposes many similar-looking methods like `getForObject`, `getForEntity`, and `exchange`.
The parameter combinations are diverse enough that team members unfamiliar with the API often struggle to grasp the intent of a call at a glance.

<a href="https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-resttemplate" target="_blank" rel="nofollow">
The official Spring documentation</a>
describes `RestTemplate` as a maintenance-mode API.
It is not fully deprecated, but no new features are being added. For new code, `RestClient` is the recommended starting point even when synchronous calls are all you need.

<br>

# Working with RestClient

Walking through instance creation, retrieval, creation, and error handling in sequence reveals the character of `RestClient` more clearly.

## Instance Creation and HTTP Library Swapping

The simplest entry point is the static factory method `create()`. When you need reusable configuration such as a base URL, default headers, or interceptors, `builder()` is more convenient.

> Note: the examples below target Spring Boot 3.2 (Spring Framework 6.1).

```java
// Default creation
RestClient restClient = RestClient.create();

// Custom configuration via builder
RestClient customClient = RestClient.builder()
	.baseUrl("https://api.example.com")
	.defaultHeader("Accept", "application/json")
	.build();
```

If your existing system already has a finely tuned `RestTemplate` instance, you can wrap it with `RestClient.create(restTemplate)` and migrate incrementally.
This approach is less disruptive than a full replacement when a gradual transition is needed.

You can also swap out the underlying HTTP client implementation via `requestFactory()`.
For example, using the JDK `HttpClient`-based factory keeps external library dependencies minimal while configuring synchronous calls.

```java
RestClient client = RestClient.builder()
	.requestFactory(new JdkClientHttpRequestFactory())
	.build();
```

<br>

## Fetching and Creating Data

A GET request starts with `get()`, and URI template variables bind inline.
When the status code is successful (2xx) and you only need the response body, pass the desired type to `body()`.

```java
// GET request to fetch a single article
Article article = restClient.get()
		.uri("/articles/{id}", 1)
		.retrieve()
		.body(Article.class);
```

POST requests follow the same flow. When you pass an object as the request body, `RestClient` does not assemble the JSON string itself.
Instead, Spring selects the appropriate `HttpMessageConverter` from its registered list and delegates serialization.

For instance, if the `contentType` is `application/json` and Jackson is on the classpath, `MappingJackson2HttpMessageConverter` is typically chosen.
Any `ObjectMapper` settings you have registered, such as date formats, property naming strategies, and custom modules, carry over.
Conversely, a plain `String` triggers `StringHttpMessageConverter`, and a byte array triggers `ByteArrayHttpMessageConverter`, each selected based on the body type and `Content-Type`.

If you have already customized message converters on your `RestTemplate`, those rules carry over when migrating via `RestClient.create(restTemplate)`.

```java
// POST request to create a new article
Article newArticle = new Article(null, "New Article Title");

ResponseEntity<Void> response = restClient.post()
	.uri("/articles")
	.contentType(MediaType.APPLICATION_JSON)
	.body(newArticle)
	.retrieve()
	.toBodilessEntity();
```

<br>

## Intuitive Error Handling

With `RestTemplate`, branching on status codes typically required a `ResponseErrorHandler`.
`RestClient` lets you chain `onStatus()` directly after `retrieve()`, keeping the request and its error policy in a single block.

```java
String result = restClient.get()
	.uri("/secure-articles")
	.retrieve()
	.onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
		throw new MyCustomException("Client error: " + response.getStatusCode());
	})
	.body(String.class);
```

Because the status-code error policy sits right next to the call site, it is straightforward to see which responses are treated as abnormal.

<br>

# Flexible Response Control and Extensibility

Basic CRUD calls are not the whole story. There are extension points for fine-grained control over status codes, headers, and cross-cutting policies.

## Fine-Grained Control with exchange()

`retrieve()` is sufficient for typical success/failure flows. However, there are cases where you need to inspect the response status code, headers, and body all at once and branch manually.
`exchange()` provides a lower-level control point for this.

```java
Article article = restClient.get()
        .uri("/articles/{id}", 1)
        .exchange((request, response) -> {
                if (response.getStatusCode().is4xxClientError()) {
                        throw new ArticleClientException(response.getStatusCode());
                }
                return convertResponse(response);
        });
```

Implement `convertResponse(response)` according to your team's existing serialization conventions.
Reserve `exchange()` for sections that genuinely need full response access rather than using it as a default for every call.

## Caveats When Using exchange()

Greater control comes with greater responsibility. The moment you use `exchange()`, `onStatus()` no longer applies automatically, so you must handle exception translation and response conversion explicitly.

Pay particular attention to response stream consumption. Failing to read the response can cause a **connection leak**.
The default `exchange((request, response) -> ...)` overload automatically closes the response after the exchange function completes.
Keep your body conversion logic inside this function for safety.
If you need to keep the response stream open beyond the function scope, use the `exchange(exchangeFunction, false)` overload
and explicitly call `response.close()` on the caller side.

## Interceptors

Interceptors are useful for adding common headers to every request or logging requests and responses.
You can reuse the same `ClientHttpRequestInterceptor` implementations from `RestTemplate`,
which fits well with incremental migration.

> The hardcoded token value below is for illustration only.
> In production, externalize secrets via configuration properties or a secret store to reduce both exposure risk and rotation cost.

```java
RestClient restClient = RestClient.builder()
	.baseUrl("https://api.example.com")
	.requestInterceptor((request, body, execution) -> {
		request.getHeaders().add("Authorization", "Bearer my-token");
		return execution.execute(request, body);
	})
	.build();
```

<br>

# Testing Configuration

Adopting a new HTTP client means your test setup needs to follow.
`RestClient` supports `@RestClientTest` and `MockRestServiceServer`, enabling you to verify call contracts without an external server.

> When injecting `RestClient.Builder`,
> you may need to specify the full URI in `MockRestServiceServer` expectations.
> Check how `baseUrl` is configured alongside your expectations.

```java

@RestClientTest(ArticleService.class)
class ArticleServiceTest {

	@Autowired
	private ArticleService articleService;

	@Autowired
	private MockRestServiceServer mockServer;

	@Test
	void getArticleTest() {
		mockServer.expect(requestTo("https://api.example.com/articles/1"))
			.andRespond(withSuccess("{\"id\":1, \"title\":\"Test Article\"}", MediaType.APPLICATION_JSON));

		Article article = articleService.getArticle(1);

		assertThat(article.getTitle()).isEqualTo("Test Article");
	}
}
```

You can verify request URIs, headers, and response bodies without opening a real network connection.
This makes it easy to attach tests when switching clients or changing error handling policies.

<br>

# Comparison with OpenFeign

OpenFeign is frequently mentioned as an alternative in the Spring ecosystem.
It excels at declaratively representing external APIs through interfaces and annotations.
When inter-service call contracts are relatively stable, it offers strong maintainability.

`RestClient`, on the other hand, assembles requests in code.
When the number of endpoints is small and headers or error handling policies vary slightly per call, this approach can be simpler.
Conversely, if the external API surface is large and codifying contracts as interfaces matters, a declarative client like OpenFeign may be a better fit.
For a deeper look at OpenFeign itself, see the post <a href="/en/post/spring-cloud-openfeign" target="_blank">What Is Spring Cloud OpenFeign and What to Look For</a>.

<br>

# Wrapping Up

`RestClient` is not a tool for ripping out all `RestTemplate` usage overnight. It is a better option for writing new synchronous HTTP call code that is easier to read.
It is especially worth evaluating when adding a new module or a new integration.

If your existing `RestTemplate` calls are running stably in production, there is no need to force a migration all at once.
However, when writing new code, consider `RestClient` as the default candidate and compare response control granularity and testing approaches side by side.

Ultimately, deciding whether to adopt a new tool comes down less to performance benchmarks and more to how naturally your teammates can read and maintain the code.
