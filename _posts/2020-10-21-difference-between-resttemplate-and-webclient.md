---
layout:   post
title:    "RestTemplate과 WebClient"
author:   Kimtaeng
tags:     resttemplate webclient
description: "RestTemplate 는 Deprecated 될 예정이다. WebClient 를 사용하자." 
category: Spring
date: "2020-10-21 02:11:43"
comments: true
---

# RestTemplate 은 Deprecated 될 것이다.
스프링 프레임워크에서 제공하는 `RestTemplate` 클래스를 살펴보면 아래와 같은 코멘트를 확인할 수 있다.
> NOTE: As of 5.0 this class is in maintenance mode,
with only minor requests for changes and bugs to be accepted going forward.
Please, consider using the org.springframework.web.reactive.client.WebClient
which has a more modern API and supports sync, async, and streaming scenarios.

간단히 요약하면 `RestTemplate` 보다는 더 현대적인 `WebClient`를 사용하라는 뜻이다. 아마 향후 버전에서 **Deprecated** 되지 않을까 싶다.

<br>

# RestTemplate과 WebClient 예제
Blocking I/O 기반의 동기식(Synchronous) API인 `RestTemplate`과 Non-Blocking I/O 기반의 비동기식(Asynchronous) API인
`WebClient`가 어떤 차이를 갖는지 예제를 통해 살펴보자.

## RestTemplate
먼저 `RestTemplate`을 사용하는 예제를 살펴보자. 우선 호출을 받을 컨트롤러를 선언한다. 아래는 **PathVariable**로 넘어온 초만큼
기다렸다가 **"Done!"** 문자열을 반환하는 컨트롤러다.

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

이를 실행할 코드도 작성한다. 간단하게 스프링 부트 애플리케이션이 구동될 때 실행되는 `ApplicationRunner`를 통해서 테스트를 진행할 것이다.
API 호출 후 응답이 올 때까지 기다리는 시간을 측정하기 위해 스프링 프레임워크에서 제공하는 `StopWatch` API를 사용했다.

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

실행 결과는 어떻게 될까? 로그가 출력된 시간을 보면 알 수 있듯이 처음 "start!" 가 찍힌 시간 부터 15초 후에 결과가 출력되었다.
즉, `RestTemplate`은 **Blocking I/O** 기반이기 때문에 모든 요청을 끝마칠 때까지 기다린다.

```bash
2020-10-21 00:22:18.774 main ... : start!
2020-10-21 00:22:23.948 main ... : resultFor5Sec: Done!
2020-10-21 00:22:33.960 main ... : resultFor10Sec: Done!
2020-10-21 00:22:33.961 main ... : result: 15.18629589
```

<br>

## WebClient (with WebFlux)
다음으로 `WebClient`를 이용하여 비동기 호출을 해보자. **Non-Blocking I/O** 기반이기 때문에 비동기적으로 Http 호출을 할 수 있다.
앞서 선언한 `DelayController` 코드는 동일하게 사용하며 이번에도 동일하게 `ApplicationRunner`를 이용하여 테스트한다.

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


결과는 어떻게 될까? 앞서 살펴본 `RestTemplate`과 다르다. 앞선 호출을 기다리지 않고 비동기적으로 호출이 이뤄지기 때문에 5초, 10초가
소요되는 API 호출을 동시에 진행한다.

또 `WebClient` 실행 결과에서 살펴볼 것이 있다. 바로 스레드 이름이다. 논블로킹(Non-Blocking) 처리를 하기 위한 워커 스레드가 출력되는
것을 확인할 수 있다. `RestTemplate` 에서는 모두 main 스레드였다. 게다가 두 개의 호출을 각각 다른 워커 스레드가 실행한 것도 알 수 있다.

```bash
2020-10-21 00:32:22.255  main ... : start!
2020-10-21 00:32:27.843  ctor-http-nio-2 ... : resultFor5Sec: Done!
2020-10-21 00:32:27.844  ctor-http-nio-2 ... : result(5Sec): 5.589219641
2020-10-21 00:32:32.809  ctor-http-nio-3 ... : resultFor10Sec: Done!
2020-10-21 00:32:32.810  ctor-http-nio-3 ... : result(10Sec): 10.554501304
```

<br>

# 기존 코드를 옮길 필요는 없다.
스프링 프레임워크 5 버전을 사용하기 위해 `RestTemplate` 코드를 모두 `WebClient`로 변경할 필요는 없다.

하지만 향후 대응을 위해 새롭게 작성하는 코드는 `WebClient`로 작성하는 것이 좋다. `RestTemplate`처럼 `WebClient`를 동기 호출을 하도록
할 수 있지만 반대로 `RestTemplate`을 `WebClient`처럼  비동기적인 호출을 하도록 할 수 없기 때문이다.
즉, `RestTemplate`을 사용한다면 호출 이후 응답(response)이 올 때까지 기다리는 동기 로직이 계속될 수 밖에 없다.

참고로 비동기로 동작하는 애플리케이션에서 블로킹(Blocking) API를 호출하는 경우 에러가 발생한다. 예를 들면 Reactor의 `Mono`의 경우
Non-Blocking Thread 인 상태에서 `block()` 과 같은 메서드를 호출하게 되는 경우 `IllegalStateException` 예외를 던진다.

끝으로 예제에서 사용한 `ApplicationRunner`와 `StopWatch`에 대한 내용은 아래 글을 참고하시면 됩니다.

- <a href="/post/run-code-on-application-startup-in-springboot" target="_blank">
참고 링크: 스프링 부트 애플리케이션이 구동될 때 코드를 실행하는 방법</a>
- <a href="/post/measure-elapsed-time-in-java" target="_blank">참고 링크: 자바에서 코드 실행 시간을 측정하는 방법</a>