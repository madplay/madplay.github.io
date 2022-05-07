---
layout: post
title: "What Is Spring Cloud OpenFeign and What Should You Watch Out For"
author: madplay
tags: spring springcloud openfeign feign msa
description: "What is Spring Cloud OpenFeign, and what do you need to know before adopting it? A practical walkthrough covering synchronous calls, timeouts, retries, and more."
category: Spring
date: "2022-05-04 22:14:02"
comments: true
lang: en
slug: spring-cloud-openfeign
permalink: /en/post/spring-cloud-openfeign
---

# The Boundaries a Declarative HTTP Client Reveals

Once you run microservices for even a short while, HTTP call code proliferates faster than you expect.
The home-screen service fetches article lists, the recommendation service queries user preferences, the notification service pulls top stories,
and before long the call graph sprawls to the point where timeout policies and error-handling conventions diverge across teams.

**Spring Cloud OpenFeign exists to address this: declare HTTP calls as interfaces and manage them the Spring way.**
It is convenient for organizing repetitive synchronous HTTP calls in Spring-based services, but it does not solve async or reactive processing.
So before adopting it, the more important question is **"which category of calls should we delegate to it?"**

> This post is based on Spring Cloud `2021.0.2` with Spring Boot `2.6.7`, as of May 4, 2022.

<br>

# Why More Calls Mean More Pain

Inter-service HTTP calls look simple when you only have one or two.
You spin up a `RestTemplate` or an HTTP client, compose a URL, and fire the request.
The trouble starts once you hit production.

For instance, you might start with something as simple as this:

```java
public ArticleResponse getArticle(Long articleId) {
	return restTemplate.getForObject(
		"http://news-service/news/articles/{articleId}",
		ArticleResponse.class,
		articleId
	);
}
```

But real services never stay this simple.
The following requirements show up almost immediately:

- Auth headers need to be attached
- Each call target needs a different timeout
- Some 404 responses are semantically valid
- Some 500 responses must escalate as incidents right away
- Once service discovery enters the picture, instance selection becomes another concern

Before long, different teams handle the same HTTP call differently.
One team catches exceptions and returns `null`, another wraps calls in a shared utility,
one sets a 1-second timeout, and another sets no timeout at all.
The bigger problem is not the call code itself; **these inconsistencies make incident analysis significantly harder down the line.**

Suppose the "fetch article" call is scattered across services like this:

```java
public ArticleResponse getArticleFromHomeService(Long articleId) {
	return restTemplate.getForObject(
		"http://news-service/news/articles/{articleId}",
		ArticleResponse.class,
		articleId
	);
}

public ArticleResponse getArticleFromSearchService(Long articleId) {
	try {
		return restTemplate.getForObject(
			"http://news-service/news/articles/{articleId}",
			ArticleResponse.class,
			articleId
		);
	} catch (HttpClientErrorException.NotFound e) {
		return null;
	}
}

public ArticleLookupResult getArticleFromDigestService(Long articleId) {
	HttpHeaders headers = new HttpHeaders();
	headers.setBearerAuth(tokenProvider.getToken());

	RequestEntity<Void> request = RequestEntity
		.get(URI.create("http://news-service/news/articles/" + articleId))
		.headers(headers)
		.build();

	try {
		ResponseEntity<ArticleResponse> response = customRestTemplate.exchange(
			request,
			ArticleResponse.class
		);
		return ArticleLookupResult.success(response.getBody());
	} catch (ResourceAccessException e) {
		return ArticleLookupResult.timeout();
	} catch (HttpServerErrorException e) {
		throw new ExternalServiceException("news-service failed", e);
	}
}
```

All three are "fetch article," yet one returns `null`,
another converts a timeout into a dedicated result object, and the third re-throws an exception.
Even at this scale, incident response starts with "which service interpreted the failure how?"

The reason Spring Cloud OpenFeign matters is not just line-count reduction.
**It surfaces call targets as interfaces, consolidates configuration per client, and centralizes cross-cutting concerns
like logging, interceptors, and encoders/decoders into a single place.**

<br>

# What Actually Happens Behind the Interface

OpenFeign is a declarative HTTP client.
"Declarative" can sound abstract, so think of it as:
**"Instead of writing HTTP call logic yourself, you declare a contract using interfaces and annotations."**

Plain Feign without Spring supports a similar concept, but Spring Cloud OpenFeign adds Spring ecosystem integration on top.
You declare requests with Spring MVC annotations, inject clients as Spring beans, leverage `HttpMessageConverters` for
serialization/deserialization, and hook into Spring Cloud LoadBalancer for service-name-based routing.

For example, you can declare an interface like this:

```java

@FeignClient(name = "news-service")
public interface NewsClient {

	@GetMapping("/news/articles/{articleId}")
	ArticleResponse getArticle(@PathVariable Long articleId);
}
```

Then inject it in a service without writing any implementation:

```java

@Service
public class HomeService {

	private final NewsClient newsClient;

	public HomeService(NewsClient newsClient) {
		this.newsClient = newsClient;
	}

	public HeadlineArticle loadArticle(Long articleId) {
		ArticleResponse response = newsClient.getArticle(articleId);
		return new HeadlineArticle(response.getId(), response.getTitle());
	}
}
```

On the surface it looks like a plain interface call,
but under the hood OpenFeign builds request metadata, applies encoders and decoders, optionally resolves a target instance by service name, and sends the HTTP request.
In other words, OpenFeign creates "remote calls that look like method calls." **It does not eliminate the nature of a remote call.**

Missing this distinction causes problems later.
Even though it looks like a local method call, it is still a network call, and you carry every distributed-systems concern with it:
latency, timeouts, partial failures, retries, and idempotency.

<br>

# When It Helps and When It Doesn't

OpenFeign fits especially well in Spring MVC-based services.
If the controller and service layers are mostly synchronous, frequently call REST APIs on other services,
and need per-target configuration, productivity improves noticeably.

Typical scenarios include:

- A home-screen service calls news, recommendation, and user-preference services frequently
- Each target service has different timeout and auth-header policies
- Service-name-based routing and load balancing are required
- Per-client logging, interceptors, and error decoders need to be managed separately

On the other hand, OpenFeign is not the right fit for every HTTP call.
If you only make a handful of calls to an external API, the overhead of defining a dedicated interface and client configuration may not be worth it.
The same applies in reactive-chain-heavy environments.

This is where the most common misconception arises.
"It's declarative, so it must be more modern, and therefore a better choice than `WebClient`, right?" That conflates two orthogonal concerns.
Declarative interfaces and non-blocking I/O are not on the same axis.
As of May 2022, the official Spring Cloud OpenFeign documentation explicitly states that reactive clients such as `WebClient` are not supported.
**OpenFeign excels at making synchronous call code more structured; it does not transform your call model into a reactive one.**

<br>

# Basic Setup for Getting Started

```groovy
plugins {
    id 'org.springframework.boot' version '2.6.7'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    id 'java'
}

ext {
    set('springCloudVersion', "2021.0.2")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-loadbalancer'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

One thing to watch here:
if you plan to call services by name via `@FeignClient(name = "...")`, include `spring-cloud-starter-loadbalancer` as well.
The official documentation supports LoadBalancer integration but lists it as an optional dependency.
If you follow examples expecting service-name-based calls, do not skip this dependency.

Enable Feign interface scanning in the application with `@EnableFeignClients`:

```java

@SpringBootApplication
@EnableFeignClients
public class NewsApplication {

	public static void main(String[] args) {
		SpringApplication.run(NewsApplication.class, args);
	}
}
```

The `name` in `@FeignClient(name = "news-service")` is not just an alias.
In a Spring Cloud environment, it serves as both the client identifier and the load-balancer name.
With service discovery, this name resolves to instances; without it, you must specify a static URL separately.

For example, you can pin a URL directly without discovery:

```java

@FeignClient(name = "breaking-news-client", url = "${clients.breaking-news.url}")
public interface BreakingNewsClient {

	@GetMapping("/articles/{articleId}")
	ArticleResponse getArticle(@PathVariable Long articleId);
}
```

The advantage of this structure is that **call targets are explicitly visible in the code.**
Instead of assembling string URLs inside service classes, you can see "which external contracts does our application depend on?" at the interface level.
As the system grows, this difference matters more than you might expect.

<br>

# Where Real Production Issues Arise

When first adopting OpenFeign, developers tend to focus on the interface declarations alone.
But the decisions that actually cause incidents come after the interface is defined:

- What timeouts to set
- How to interpret different errors
- How far to allow retries
- How to handle the fact that the call model is synchronous

## How to Set Timeouts

With remote calls, failure paths matter more than success paths.
When the target service is slow or the network is flaky, you need to decide upfront how long a calling thread can remain blocked.

```yaml
feign:
  client:
    config:
      news-service:
        connectTimeout: 1000
        readTimeout: 2000
        loggerLevel: basic
```

`connectTimeout` controls the time allowed to establish a connection,
and `readTimeout` controls the time allowed to wait for a response after connection.
They look similar, but they govern different phases.
A connection that never establishes and a connection that establishes but produces a painfully slow response have different root causes and different operational responses.

In practice, the temptation is to leave defaults and revisit later, but this is worth a closer look.
**If the timeout is too long, calling threads get tied up and the thread pool drains.
If it is too short, legitimate traffic gets unnecessarily rejected.**
Timeouts are not merely a configuration knob; they are a design parameter that bounds the blast radius of failures.

## How to Think About Retries

It is easy to assume "retries are enabled by default."
However, **Spring Cloud OpenFeign defaults to `Retryer.NEVER_RETRY`.** Do not expect the plain Feign default behavior.

This distinction matters more than it seems.
Without retries, a transient network blip causes an immediate failure. With indiscriminate retries, you risk duplicate requests and failure amplification.
The key is not to blindly enable retries but to
**design them alongside timeouts: is the call idempotent? Which exceptions qualify for retry?**

## When You Want to Share One Interface Between Server and Client

A common idea when first introducing OpenFeign:
"The server uses the same Spring MVC annotations anyway, so why not share a single interface between server and client?"

```java
public interface NewsArticleApi {
	@GetMapping("/articles/{id}")
	ArticleResponse getArticle(@PathVariable Long id);
}

@RestController
public class NewsArticleController implements NewsArticleApi {
}

@FeignClient(name = "news-service")
public interface NewsArticleClient extends NewsArticleApi {
}
```

This approach increases coupling over time.
Changes to the server's representation propagate directly to the client's compilation boundary, and documentation, DTOs, and request-mapping strategies cannot evolve independently.

The official documentation supports interface inheritance but does not recommend sharing contracts between server and client.
Aligning on an API contract and sharing a Java interface file are two different things.
When both sides depend on the same file, even a minor server-side change can break the client build.

## When Method-Call Syntax Makes Things More Dangerous

The cleaner OpenFeign code gets, the more dangerous it can become.
Remote calls look so much like ordinary local method calls that developers forget about network cost and failure probability.

```java
for(Long articleId :articleIds){
ArticleResponse article = newsClient.getArticle(articleId);
    articles.

add(article);
}
```

The code looks like a simple collection traversal, but **it actually fires N remote calls.**
This pattern accumulates latency and can trigger call amplification if the target service degrades.
The easier calls become, **the more deliberately you need to control "how many, through which path, with what timeout."**

<br>

# Boundaries with RestTemplate and WebClient

To understand OpenFeign properly, it helps to look at how it compares with other options.
Building on the brief mentions earlier, separating the comparison here clarifies both "what OpenFeign makes easier" and "what it does not replace."

## Where It Improves Over RestTemplate

`RestTemplate` is a code-it-yourself approach to making calls.
It is flexible, but as the number of call targets grows, duplicated code and configuration drift become inevitable.
OpenFeign, by contrast, **defines contracts at the interface level and generates implementations at runtime.**

Think of it less as a "basic HTTP client" and more as a "layer for structuring inter-service calls in a Spring environment."
The more call targets you have and the larger the team, the more this difference pays off.

## Why Putting It Side by Side with WebClient Causes Confusion

`WebClient` is not a declarative-interface tool; it is a reactive HTTP client. The comparison axis is different.
OpenFeign excels at simplifying call declarations; `WebClient` excels at non-blocking I/O and reactive-chain composition.

So instead of asking "which one is more modern,"
**ask "does our service need better-organized synchronous calls, or does it need a non-blocking processing model?"**
Wanting declarative interfaces does not automatically mean choosing reactive,
and needing non-blocking I/O does not make a declarative client like OpenFeign the answer.

<br>

# Decision Criteria

In summary, when evaluating OpenFeign, look beyond the declarative client itself.
First check whether most of your calls are synchronous, whether you need per-client timeout, auth, and error-handling policies,
and whether you need seamless integration with service discovery and load balancing.

Conversely, if you have few calls, do not use a synchronous model, and do not need to structure inter-service contracts as interfaces,
a simpler option may serve you better. OpenFeign is less a tool that hides calls and more a tool that surfaces and manages them.

<br>

# Closing Thoughts

OpenFeign certainly helps reduce repetitive URL assembly and `RestTemplate` boilerplate.
But as the service scales and traffic spikes, the cost of remote calls hidden behind interfaces can surface as problems in unexpected places.

I have not yet had the chance to apply it deeply in production, but when the opportunity arises,
I think it is important to first assess whether it truly fits the service before committing to it.

<br>

# References

- <a href="https://docs.spring.io/spring-cloud/docs/2021.0.2/reference/htmlsingle/"
  target="_blank" rel="nofollow">Spring Cloud 2021.0.2 Reference Documentation</a>
- <a href="https://docs.spring.io/spring-cloud-openfeign/docs/3.1.2/reference/html/"
  target="_blank" rel="nofollow">Spring Cloud OpenFeign 3.1.2 Reference Documentation</a>
