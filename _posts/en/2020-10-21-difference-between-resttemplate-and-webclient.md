---
layout:   post
title:    "RestTemplate and WebClient"
author:   Kimtaeng
tags:     resttemplate webclient
description: "RestTemplate is expected to be deprecated. Use WebClient." 
category: Spring
lang: en
slug: difference-between-resttemplate-and-webclient
permalink: /en/difference-between-resttemplate-and-webclient/
date: "2020-10-21 02:11:43"
comments: true
---

# RestTemplate Is in Maintenance Mode
In Spring Framework docs for `RestTemplate`, you can see this note:
> NOTE: As of 5.0 this class is in maintenance mode,
with only minor requests for changes and bugs to be accepted going forward.
Please, consider using the org.springframework.web.reactive.client.WebClient
which has a more modern API and supports sync, async, and streaming scenarios.

In short, prefer modern `WebClient` over `RestTemplate`.
It is reasonable to expect deprecation in future versions.

<br>

# RestTemplate vs WebClient Examples
Let's compare `RestTemplate` (blocking, synchronous API) and `WebClient` (non-blocking, asynchronous API).

## RestTemplate
First, define a controller endpoint for testing.
It waits for the seconds in `PathVariable` and returns `Done!`.

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DelayController {

	@GetMapping("/delay/{sec}")
	public String delay(@PathVariable String sec) throws InterruptedException {
		Thread.sleep(Integer.parseInt(sec) * 1000);
		return "Done!";
	}
}
```

Then run calls in `ApplicationRunner` and measure elapsed time with Spring `StopWatch`.

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class RestTemplateRunner implements ApplicationRunner {

	private final RestTemplateBuilder restTemplateBuilder;

	@Override
	public void run(ApplicationArguments args) {
		RestTemplate restTemplate = restTemplateBuilder.build();

		StopWatch stopWatch = new StopWatch();
		log.info("start!");
		stopWatch.start();

		String resultFor5Sec = restTemplate.getForObject("http://localhost:8080/delay/5", String.class);
		log.info("resultFor5Sec: {}", resultFor5Sec);

		String resultFor10Sec = restTemplate.getForObject("http://localhost:8080/delay/10", String.class);
		log.info("resultFor10Sec: {}", resultFor10Sec);

		stopWatch.stop();
		log.info("result: {}", stopWatch.getTotalTimeSeconds());
	}
}
```

As logs show, result prints after about 15 seconds from `start!`.
Because `RestTemplate` is blocking I/O, it waits for each call completion.

```bash
2020-10-21 00:22:18.774 main ... : start!
2020-10-21 00:22:23.948 main ... : resultFor5Sec: Done!
2020-10-21 00:22:33.960 main ... : resultFor10Sec: Done!
2020-10-21 00:22:33.961 main ... : result: 15.18629589
```

<br>

## WebClient (with WebFlux)
Now do asynchronous calls with `WebClient`.
Because it is non-blocking I/O, HTTP calls run asynchronously.
Use the same `DelayController` and test again with `ApplicationRunner`.

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class WebClientRunner implements ApplicationRunner {

	private final WebClient.Builder webClientBuilder;

	@Override
	public void run(ApplicationArguments args) {
		WebClient webClient = webClientBuilder.build();

		StopWatch stopWatch = new StopWatch();
		log.info("start!");
		stopWatch.start();

		Mono<String> resultFor5Sec = webClient.get()
			.uri("http://localhost:8080/delay/5", String.class)
			.retrieve()
			.bodyToMono(String.class);

		resultFor5Sec.subscribe(result -> {
			log.info("resultFor5Sec: {}", result);
			if(stopWatch.isRunning()) {
				stopWatch.stop();
			}

			log.info("result(5Sec): {}", stopWatch.getTotalTimeSeconds());
			stopWatch.start();
		});

		Mono<String> resultFor10Sec = webClient.get()
			.uri("http://localhost:8080/delay/10", String.class)
			.retrieve()
			.bodyToMono(String.class);


		resultFor10Sec.subscribe(result -> {
			log.info("resultFor10Sec: {}", result);
			if(stopWatch.isRunning()) {
				stopWatch.stop();
			}

			log.info("result(10Sec): {}", stopWatch.getTotalTimeSeconds());
			stopWatch.start();
		});
	}
}

```

This is different from `RestTemplate`.
Calls are asynchronous and do not wait for previous calls.
So 5-second and 10-second endpoints run concurrently.

Also note thread names in logs.
Worker threads for non-blocking processing appear.
In `RestTemplate`, everything ran on main thread.
And two calls were handled by different worker threads.

```bash
2020-10-21 00:32:22.255  main ... : start!
2020-10-21 00:32:27.843  ctor-http-nio-2 ... : resultFor5Sec: Done!
2020-10-21 00:32:27.844  ctor-http-nio-2 ... : result(5Sec): 5.589219641
2020-10-21 00:32:32.809  ctor-http-nio-3 ... : resultFor10Sec: Done!
2020-10-21 00:32:32.810  ctor-http-nio-3 ... : result(10Sec): 10.554501304
```

<br>

# No Need to Rewrite Existing Code Immediately
You do not need to migrate all existing `RestTemplate` code to `WebClient` just to use Spring Framework 5.

But for forward compatibility, new code should prefer `WebClient`.
You can still call `WebClient` synchronously if needed,
but you cannot make `RestTemplate` behave like true `WebClient` asynchronous API.
With `RestTemplate`, synchronous waiting after each call remains unavoidable.

Also note: in asynchronous applications, calling blocking APIs can cause errors.
For example, in Reactor `Mono`, calling methods like `block()` from non-blocking threads can throw `IllegalStateException`.

For details on `ApplicationRunner` and `StopWatch` used in this example:

- <a href="/post/run-code-on-application-startup-in-springboot" target="_blank">
Reference: How to run code when Spring Boot starts</a>
- <a href="/post/measure-elapsed-time-in-java" target="_blank">Reference: How to measure execution time in Java</a>
