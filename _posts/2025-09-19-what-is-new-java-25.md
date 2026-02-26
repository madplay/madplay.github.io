---
layout: post
title: "JDK 25 LTS 릴리즈 노트 정리: 주요 변경사항 한눈에 보기"
author: madplay
tags: java jdk25 openjdk
description: "다섯 번째 LTS 자바 버전인 JDK 25 버전의 주요 변경사항을 공식 릴리즈 기준으로 살펴보자!"
category: Java/Kotlin
date: "2025-09-19 21:32:10"
comments: true
---

# 자바 25 LTS 개요

자바 25는 자바 21(2023년 9월) 이후 2년 만에 나온 LTS다. 그리고 8, 11, 17, 21 버전에 이은 다섯 번째 LTS다.
OpenJDK 공식 발표 기준으로 2025년 9월 16일(UTC)에 출시됐다.

이번 글은 공식 릴리즈에 포함된 항목을 중심으로 JEP를 하나씩 소개한다.
참고로 이전 LTS(자바 21) 내용은 아래 글에서 확인할 수 있다.

- <a href="/post/what-is-new-java-21" target="_blank">자바 21 LTS 출시! 무엇이 바뀌었을까?</a>

<br><br>

# JDK 25 Standard JEP

## JEP 503: Remove the 32-bit x86 Port

> 32-bit x86 포트를 제거해 유지 대상 플랫폼을 정리한 항목이다.

32-bit x86 포트를 제거한다. 기능 추가 항목은 아니지만, 오래된 배포 타겟이나 에이전트 호환성에는 직접 영향이 갈 수 있다.

## JEP 506: Scoped Values

> 실행 범위 기반으로 불변 컨텍스트를 전달하는 기능을 정식으로 제공한다.

`ThreadLocal` 대안인 Scoped Values를 정식 기능으로 제공한다.  
호출 체인과 하위 스레드에 불변 컨텍스트를 전달할 때 더 예측 가능한 수명 범위를 제공한다.

```java
class ScopedValueExample {
	static final ScopedValue<String> TENANT_ID = ScopedValue.newInstance();

	void handle() {
		ScopedValue.where(TENANT_ID, "naver_team").run(this::service);
	}

	void service() {
		System.out.println(TENANT_ID.get());
	}
}
```

## JEP 510: Key Derivation Function API

> KDF를 표준 자바 API로 제공해 키 파생 처리를 일관되게 다루게 한다.

KDF(키 파생 함수)를 표준 자바 API로 제공한다.  
보안 라이브러리 구현마다 달랐던 키 파생 처리를 공통 인터페이스로 다루기 쉬워진다.

```java
import javax.crypto.KDF;

KDF kdf = KDF.getInstance("HKDF-SHA256");
```

## JEP 511: Module Import Declarations

> 문법으로 모듈 단위 import를 지원한다.

`import module ...;` 선언을 도입해 모듈 단위 import를 지원한다.  
import 구문을 단순화하고, 소스 파일이 의존하는 모듈 경계를 더 명확히 드러내는 문법 변화다.

```java
// Before

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
```

```java
// After

import module java.base;
```

## JEP 512: Compact Source Files and Instance Main Methods

> 작은 프로그램에서 보일러플레이트를 줄이는 소스 파일 작성 방식을 정식 기능으로 제공한다.

작은 프로그램에서 보일러플레이트를 줄이는 작성 방식을 정식으로 제공한다.  
아래 예시처럼 간단하게 샘플 코드를 작성할 수 있다.

```java
void main() {
	System.out.println("Hello, Java 25!");
}
```

## JEP 513: Flexible Constructor Bodies

> 생성자에서 초기 검증·계산 로직을 더 자연스럽게 배치할 수 있도록 제약을 완화한 변경이다.

생성자 본문에서 `super(...)`/`this(...)` 호출 전에 전처리 로직을 더 유연하게 작성할 수 있게 했다.  
검증/계산/정규화 같은 생성 전 단계 코드를 자연스럽게 배치할 수 있다.

```java
class PositiveValue {
	PositiveValue(int value) {
		if (value <= 0) {
			throw new IllegalArgumentException();
		}
		this.value = value;
	}

	private final int value;
}
```

## JEP 514: Ahead-of-Time Command-Line Ergonomics

> AOT 사용 시 커맨드라인 설정 경험을 개선하는 항목이다.

AOT 사용 시 커맨드라인 설정/사용성을 개선한다. 설정 복잡도를 낮춰 실제 빌드/실행 파이프라인에 적용하기 쉽게 만드는 데 초점이 있다.
기존에는 옵션 조합이 길고 이해하기 어려워 실험 자체가 부담이었는데, 이번 항목은 그 진입 비용을 줄이는 것이다.
즉, "AOT 성능 자체"보다 "AOT를 시도하기 쉬운 운영 형태"를 만드는 변화에 가깝다.

## JEP 515: Ahead-of-Time Method Profiling

> AOT 최적화를 위한 메서드 프로파일링 지원을 추가한다.

AOT 최적화 품질 향상을 위한 메서드 프로파일링 지원을 도입한다. 실행 프로파일 기반으로 더 나은 사전 최적화를 가능하게 하려는 변화다.
핵심은 실제 실행 패턴을 AOT 단계에 반영해, 자주 호출되는 경로를 더 현실적으로 최적화하려는 것이다.
따라서 JEP 514가 "사용성" 쪽이라면, JEP 515는 "최적화 정확도" 쪽에 무게가 있는 항목이라고 보면 된다.

## JEP 518: JFR Cooperative Sampling

> JFR 샘플링 전략을 개선해 오버헤드와 관측 품질의 균형을 맞춘다.

JFR 샘플링 방식을 개선해 관측 오버헤드와 데이터 품질 균형을 맞춘다. 프로파일링 비용 때문에 운영 환경 적용이 어려웠던 지점을 줄이려는 항목이다.

## JEP 519: Compact Object Headers

> HotSpot 객체 헤더를 더 압축된 형태로 다루어 메모리 효율 개선을 노린다.

핵심은 객체마다 붙는 헤더 오버헤드를 줄여, 같은 힙 크기에서 더 많은 객체를 담을 수 있게 한다는 점이다.  
특히 작은 객체가 많이 생성되는 워크로드에서는 메모리 사용량 감소와 캐시 지역성 개선 효과를 기대할 수 있다.  
코드 수정 없이 JVM 옵션으로 켜서 실험할 수 있으므로, 업그레이드 시 힙 점유율/GC 빈도 변화를 함께 비교해보는 식으로 접근하면 되겠다.

```bash
java -XX:+UseCompactObjectHeaders -jar app.jar
```

## JEP 520: JFR Method Timing & Tracing

> JFR에 메서드 타이밍과 트레이싱 관측 기능을 추가한다.

JFR에 메서드 타이밍/트레이싱 관측 기능을 추가한다. 서비스 실행 흐름을 더 세밀하게 관측하고 병목 구간을 파악할 수 있도록 하는 변화다.

```bash
jcmd <pid> JFR.start name=trace settings=profile filename=trace.jfr
```

## JEP 521: Generational Shenandoah

> 세대별 Shenandoah GC를 제품 기능으로 제공한다.

핵심은 객체를 young/old 세대로 나눠 수집한다는 점이다.
짧게 사는 객체를 young 세대에서 우선 회수해 불필요한 전체 스캔 부담을 줄이고, 긴 수명의 객체는 old 세대로 분리해 관리한다.  
자바 25에서는 이 구성이 실험 옵션이 아니라 제품 기능으로 올라오면서 운영 환경에서 검토하기 쉬워졌다.

```bash
java -XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational -jar app.jar
```

# JDK 25 Preview·Incubator JEP

## JEP 470: PEM Encodings of Cryptographic Objects (Preview)

> 암호화 객체의 PEM 인코딩/디코딩을 자바 표준 API로 다루게 하려는 프리뷰 기능이다.

암호화 키/인증서 객체를 PEM 형식으로 다루는 표준 API를 프리뷰로 제공한다.  
텍스트 기반 PEM 처리 로직을 직접 작성하던 코드를 표준 방식으로 옮겨가게 하려는 변화다.

## JEP 502: Stable Values (Preview)

> 한 번 안전하게 초기화된 값을 안정적으로 공유하는 모델을 제공하는 프리뷰 기능이다.

지연 초기화 후 값이 안정적으로 유지되는 모델을 프리뷰로 소개한다.  
동시성 환경에서 "한 번 계산하고 안전하게 재사용"하는 패턴을 더 명확히 표현하려는 흐름이다.

```java
import java.util.concurrent.atomic.AtomicInteger;

import jdk.incubator.concurrent.StableValue;

class StableValueExample {
	private static final AtomicInteger INIT_COUNT = new AtomicInteger();

	// 필요할 때 한 번만 계산하고, 이후에는 같은 값을 재사용한다.
	private static final StableValue<String> TOKEN =
			StableValue.supplier(() -> "token-" + INIT_COUNT.incrementAndGet());

	public static void main(String[] args) {
		// 첫 호출에서만 supplier가 실행되어 token-1이 만들어진다.
		System.out.println(TOKEN.get()); // token-1
		// 이후 호출은 초기화 로직을 다시 실행하지 않고 같은 값을 재사용한다.
		System.out.println(TOKEN.get()); // token-1
		System.out.println(TOKEN.get()); // token-1
	}
}
```

핵심은 `get()` 호출 횟수와 상관없이 초기화 로직이 한 번만 실행된다는 점이다.  
멀티스레드 환경에서도 지연 초기화 + 재사용 패턴을 코드로 명확하게 표현할 수 있다.

## JEP 505: Structured Concurrency (Fifth Preview)

> 관련된 동시 작업을 구조적으로 묶어, 완료/실패/취소를 일관되게 관리하도록 돕는 프리뷰 기능이다.

관련된 병렬 작업을 하나의 구조로 묶어서 성공/실패/취소를 함께 다루는 모델을 계속 다듬는다.  
가상 스레드와 같이 쓰는 동시성 코드의 가독성과 예외 처리 일관성을 높이는 방향이다.

```java
import java.util.concurrent.StructuredTaskScope;

class OrderService {
    Result loadOrder(String orderId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 관련 작업을 동시에 시작한다.
            var payment = scope.fork(() -> paymentClient.get(orderId));
            var shipping = scope.fork(() -> shippingClient.get(orderId));

            // 모든 작업이 끝날 때까지 기다린다.
            scope.join();
            // 하나라도 실패하면 예외를 전파한다.
            scope.throwIfFailed();

            // 성공한 결과를 모아 반환한다.
            return new Result(payment.get(), shipping.get());
        }
    }
}
```

## JEP 507: Primitive Types in Patterns, instanceof, and switch (Third Preview)

> 패턴 매칭을 참조 타입 중심에서 원시 타입까지 확장해, 숫자 분기 코드를 더 직접적으로 표현하게 하려는 프리뷰다.

지금까지는 `switch`/`instanceof` 분기에서 원시 타입을 다룰 때 우회 코드가 자주 필요했다.  
이 JEP는 `int`, `long`, `double` 같은 원시 타입을 패턴 매칭에 더 자연스럽게 녹이는 방향으로 API와 문법을 정리한다.

```java
static String classify(Object value) {
    return switch (value) {
        case int i when i < 0 -> "negative int";
        case int i -> "non-negative int";
        case long l -> "long";
        case double d -> "double";
        default -> "other";
    };
}
```

## JEP 508: Vector API (Tenth Incubator)

> SIMD를 활용하는 벡터 연산 API를 인큐베이터 단계로 계속 고도화하는 항목이다.

벡터 연산 API를 인큐베이터로 계속 발전시키며 SIMD 활용 경로를 확장한다.  
수치 연산/전처리 같은 계산 집약 구간에서 성능 이득을 노릴 때 참고할 수 있는 API다.

```java
import jdk.incubator.vector.FloatVector;

var species = FloatVector.SPECIES_PREFERRED;
float[] a = ...;
float[] b = ...;
float[] out = new float[a.length];

for (int i = 0; i < species.loopBound(a.length); i += species.length()) {
    var va = FloatVector.fromArray(species, a, i);
    var vb = FloatVector.fromArray(species, b, i);
    va.mul(vb).intoArray(out, i);
}
```

## JEP 509: JFR CPU-Time Profiling (Experimental)

> JFR에서 CPU 사용 시간 기준 프로파일링을 실험적으로 지원한다.

JFR에 CPU time 관점의 프로파일링 기능을 실험적으로 추가한다.  
벽시계 시간뿐 아니라 실제 CPU 사용 시간을 더 직접적으로 분석하려는 목적이다.

```bash
jcmd <pid> JFR.start name=cpu settings=profile filename=cpu.jfr
```

<br><br>

# 마치며

자바 25는 LTS답게 언어, 런타임, 보안 등 여러 영역의 변화를 함께 담고 있다.
끝으로 이 글은 역시나 공식 릴리즈 페이지를 기준으로 정리했다.

- <a href="https://openjdk.org/projects/jdk/25/" target="_blank" rel="nofollow">OpenJDK JDK 25</a>
- <a href="https://openjdk.org/projects/jdk/25/jeps-since-jdk-21" target="_blank" rel="nofollow">JEPs in JDK 25
  integrated since JDK 21</a>
