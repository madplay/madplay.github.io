---
layout: post
title: "자바 21 LTS 출시! 무엇이 바뀌었을까?"
author: Kimtaeng
tags: java jdk21 openjdk
description: "자바 21 LTS 에서는 어떤 변화들이 있을까?"
category: Java
date: "2023-09-20 09:00:00"
comments: true
---

# 자바 21 LTS 개요: 17 이후 무엇이 달라졌나

자바 21은 **Virtual Threads** 정식 도입, `switch` 패턴 매칭과 `record` 패턴 확정,
Sequenced Collections(JEP 431) 추가처럼 코드 작성 방식에 직접 영향을 주는 변화가 많다.
여기에 Generational ZGC(JEP 439) 등도 있기에 성능적인 부분도 살펴볼 만하다.

특히 이번 릴리즈의 중심에는 **Virtual Threads(JEP 444)**가 있다. 단순히 스레드를 더 많이 만드는 기능이 아니라,
요청당 스레드 모델을 다시 현실적인 선택지로 끌어올렸다는 점에서 파급이 크다.
이로인해 비동기 체인 중심 구조를 유지할지, 가상 스레드 기반 동기 코드로 일부 전환할지를 고민이 되겠다.

참고로 이전 LTS 버전인 자바 17에서의 변경사항은 아래 글에서 확인할 수 있다.

- <a href="/post/what-is-new-java-17" target="_blank">자바 17의 새로운 기능들, 3년 만에 LTS 버전 릴리즈!</a>

<br><br>

# 핵심 JEP로 보는 JDK 21 변화

JDK 21에서 주목할 만한 JEP를 중심으로, 실무에서 참고할 만한 변화들을 정리해본다.

## JEP 444: Virtual Threads

> 높은 처리량의 동시성 애플리케이션을 더 단순한 스레드당 요청 모델로 작성하고 유지하는 방향을 지향한다.

가상 스레드는 “스레드를 많이 만든다”가 핵심이 아니라, 블로킹 I/O를 다루는 비용을 낮춘다는 데 의미가 있다. 그래서 보통 병목이 스레드 풀에서 DB 커넥션이나 외부 API로 옮겨간다.

아래는 가상 스레드를 생성해서 실행하고, `join()`으로 완료를 기다리는 가장 기본적인 형태다.

```java
public class VirtualThreadExample {

	public static void main(String[] args) throws InterruptedException {
		// 각 작업을 가상 스레드로 시작한다.
		Thread paymentTask = Thread.startVirtualThread(() -> callPayment("ORDER-100"));
		Thread stockTask = Thread.startVirtualThread(() -> reserveStock("ORDER-100"));

		// 메인 흐름이 먼저 끝나지 않도록 작업 완료까지 대기한다.
		paymentTask.join();
		stockTask.join();
	}

	private static void callPayment(String orderId) {
		System.out.println("callPayment: " + orderId);
	}

	private static void reserveStock(String orderId) {
		System.out.println("reserveStock: " + orderId);
	}
}
```

핵심은 생성한 가상 스레드를 끝까지 기다리는 것이다. `join()`을 생략하면 작업 완료 전에 메서드가 종료될 수 있다.

여러 작업을 한 번에 실행해야 한다면 `ExecutorService` 방식도 사용할 수 있다.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadExecutorExample {

	public static void main(String[] args) throws Exception {
		// 작업마다 가상 스레드를 할당하는 Executor를 만든다.
		try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
			var userTask = executor.submit(() -> fetchUser("USER-1"));
			var orderTask = executor.submit(() -> fetchOrder("ORDER-100"));

			// Future#get()으로 결과를 수집하면서 예외도 함께 확인한다.
			System.out.println(userTask.get());
			System.out.println(orderTask.get());
		}
	}

	private static String fetchUser(String userId) {
		return "user=" + userId;
	}

	private static String fetchOrder(String orderId) {
		return "order=" + orderId;
	}
}
```

기존 플랫폼 스레드와 코드 차이를 비교하면 가상 스레드 적용 포인트가 더 명확해진다.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadComparisonExample {

	public static void main(String[] args) {
		runWithPlatformThreads();
		runWithVirtualThreads();
	}

	private static void runWithPlatformThreads() {
		// 고정 크기 풀: 동시에 처리 가능한 작업 수가 풀 크기에 제한된다.
		try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
			for (int i = 0; i < 5; i++) {
				int taskId = i;
				executor.submit(() -> simulateBlockingCall("platform", taskId));
			}
		}
	}

	private static void runWithVirtualThreads() {
		// 작업마다 가상 스레드를 사용해 대기성 작업을 더 가볍게 처리한다.
		try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
			for (int i = 0; i < 5; i++) {
				int taskId = i;
				executor.submit(() -> simulateBlockingCall("virtual", taskId));
			}
		}
	}

	private static void simulateBlockingCall(String type, int taskId) {
		System.out.println(type + " task-" + taskId + " start");
		try {
			Thread.sleep(300);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
		System.out.println(type + " task-" + taskId + " end");
	}
}
```

<br>

## JEP 441: Pattern Matching for switch

> `switch` 문의 분기 로직을 더 간결하고 안전하게 작성하는 데 초점을 둔다.

`switch` 문을 문법적으로 편하게 만드는 수준에서 끝나지 않는다. 타입별 분기를 더 안전하게 만들고, 누락을 컴파일 단계에서 더 빨리 잡아낸다.

17 버전에서도 `sealed class`나 `record`를 쓸 수 있었지만, 21 버전에서는 분기 로직까지 붙어서 모델링 강도가 훨씬 높아진다.
즉, “타입 설계 미흡”이 코드 스타일 이슈가 아니라 장애 예방 이슈로 넘어온다.

<br>

## JEP 440: Record Patterns

> 레코드 값을 선언적으로 분해하고 패턴 매칭과 결합해, 중첩 데이터 처리 코드 단순화를 목표로 한다.

`JEP 441`과 같이 쓰면 효과가 더 크겠다. 레코드 분해와 분기가 자연스럽게 붙기 때문에 DTO/도메인 가공 코드가 짧아진다.

```java
sealed interface Payment permits CardPayment, BankTransfer {
}

record CardPayment(String company, String maskedNumber) implements Payment {
}

record BankTransfer(String bankCode, String accountToken) implements Payment {
}

public String auditLog(Payment payment) {
	return switch (payment) {
		case CardPayment(String company, var ignored) -> "CARD(" + company + ")";
		case BankTransfer(String bankCode, var ignored) -> "BANK(" + bankCode + ")";
	};
}
```

주의할 점은 코드 길이가 아니라 모델 변경 파급이다. 타입이 한번 퍼지면 나중에 되돌리는 비용이 급격히 커진다.

실무에서는 아래 기준이 있으면 훨씬 안정적이겠다.

- 외부 API 응답 모델과 내부 도메인 모델을 바로 일치시키지 않는다.
- `sealed` 계층에 새 타입을 추가할 때 로그/메트릭 키 변경까지 같이 리뷰한다.
- 분기 로직이 길어지기 시작하면 `switch`를 유지하지 말고 도메인 메서드로 이동한다.

<br>

## JEP 431: Sequenced Collections

> 순서가 있는 컬렉션에 대해 first/last 접근과 역순 뷰를 일관된 API로 제공하려는 의도를 담고 있다.

컬렉션 앞/뒤 접근이 표준화된 변화다. 크지 않아 보여도 유지보수에서 은근히 효과가 있다.

```java
import java.util.ArrayList;
import java.util.List;

List<String> orderIds = new ArrayList<>(List.of("O-100", "O-101", "O-102"));
String newest = orderIds.getLast();
List<String> newestFirst = orderIds.reversed();
```

`reversed()`가 복사본이 아니라 view라는 점은 꼭 기억해야 한다. **원본이 바뀌면 결과도 같이 바뀐다.**

또 하나 좋은 변화는 "자료구조 교체 비용”이 내려갔다는 점이다. 예전에는 `List`, `Deque`, `LinkedHashMap` 사이를 오갈 때 메서드 차이 때문에
보일러플레이트가 늘어났는데, JDK 21 버전에서는 앞/뒤 접근 규약이 맞춰져서 리팩터링 부담이 줄어든다.

<br>

## JEP 439: Generational ZGC

> ZGC에 세대 구분(young/old)을 도입해, 수명이 짧은 객체를 더 효율적으로 수집하고 성능 효율을 높이도록 설계됐다.

지연시간, 서비스 응답시간이 중요한 서비스라면 관심을 가져야 하는 변경이다.
다만 경험상 업그레이드 시에는 JDK 교체와 GC 교체를 한 번에 하지 않는 편이 안전했다. 둘을 같이 바꾸었다가 문제 확인이 어려웠던 적이 많다.

Generational ZGC의 핵심은 객체를 **young/old 세대**로 나눠 수집하고 관리한다는 점이다.
자주 발생하는 Young 영역 수집을 통해 메모리를 더 효율적으로 회수할 수 있다. 기존 비세대별 ZGC보다 CPU 오버헤드가 줄어들고 처리량(Throughput)이 향상된다.

## JEP 451: Prepare to Disallow the Dynamic Loading of Agents

> 실행 중 동적 에이전트 로딩을 기본적으로 제한하는 방향으로 전환해, JVM 무결성과 보안성 강화를 목표로 한다.

실행 중인 JVM에 에이전트(Agent)를 동적으로 로드하는 관행을 점진적으로 제한하기 위한 변화다.
Java 21에서는 즉시 차단이 아니라, 동적 로드 시 경고를 통해 "앞으로 기본 정책이 더 엄격해질 수 있다"는 신호를 준다.

이 변화는 운영 방식 자체를 건드린다. 장애가 났을 때 "일단 attach해서 진단"에 의존하면, 이후 JDK 버전에서 대응 옵션이 줄어들 수 있다.
그래서 APM/보안/프로파일링 도구는 가능한 한 시작 시점 고정 방식으로 전환해 두는 편이 안전하다.

## JEP 452: Key Encapsulation Mechanism API

> KEM(키 캡슐화 메커니즘)을 표준 API로 제공해, 안전한 키 합의/전달을 자바 암호화 API에서 일관되게 다루는 쪽으로 방향을 잡았다.

JEP 452는 KEM(Key Encapsulation Mechanism) 표준 API를 JDK에 도입한 변화다.
쉽게 말해 "대칭키를 안전하게 합의/전달"하는 절차를 공통 인터페이스로 제공해, 암호화 구현의 이식성과 일관성을 높여준다.

직접 비즈니스 로직이 크게 바뀌는 경우는 많지 않지만, 보안 라이브러리/프로토콜 계층에는 의미가 크다.

<br><br>

# 프리뷰·인큐베이터 JEP

이번 릴리즈에는 **JEP 453(Structured Concurrency), JEP 446(Scoped Values), JEP 442(FFM API),
JEP 430(String Templates) 같은 프리뷰와 JEP 448(Vector API) 인큐베이터**가 함께 포함돼 있다.

기능 자체는 충분히 매력적이지만 차기 버전에서 API나 동작이 바뀔 수 있으므로, 기본 아키텍처에 바로 고정하면 업그레이드 때 비용이 크게 증가한다.

## JEP 453: Structured Concurrency (Preview)

> 관련된 동시 작업을 하나의 구조화된 단위로 다루게 해서, 취소·예외·완료 처리를 더 단순하고 신뢰성 있게 만들도록 한다.

간단히 말하면, 관련된 병렬 작업을 "한 덩어리"로 다루게 해주는 기능이다.
가상 스레드와 같이 쓰면 “한 요청 안의 하위 작업”을 묶어서 다루기 편해진다. 성공/실패/취소 전파가 명확해서 코드 품질에도 도움이 된다.

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    // 하위 작업을 병렬로 실행한다.
    var payment = scope.fork(() -> paymentClient.get(orderId));
    var shipping = scope.fork(() -> shippingClient.get(orderId));
    var coupon = scope.fork(() -> couponClient.get(orderId));

    // 전체 완료까지 대기하고, 실패가 있으면 예외를 전파한다.
    scope.join();
    scope.throwIfFailed();

    // 모든 결과를 모아 단일 응답으로 합친다.
    return new OrderView(payment.get(), shipping.get(), coupon.get());
}
```

## JEP 446: Scoped Values (Preview)

> 스레드 간에 공유되는 가변 상태 대신, 제한된 실행 범위에서 불변 컨텍스트를 안전하게 전달하도록 유도한다.

요청 컨텍스트를 `ThreadLocal`보다 명시적으로 전달하는 방식이다. 특히 요청 컨텍스트 전달을 안전하게 할 수 있다는 점이 매력적이다.

```java
class ScopedValueExample {
    static final ScopedValue<String> TENANT_ID = ScopedValue.newInstance();

    void handleRequests() {
        // 네이버 테넌트 요청 범위
        ScopedValue.where(TENANT_ID, "naver_team").run(() -> {
            serviceA();
            serviceB();
        });

        // 카카오 테넌트 요청 범위
        ScopedValue.where(TENANT_ID, "kakao_team").run(() -> {
            serviceA();
            serviceB();
        });
    }

    void serviceA() {
        // 현재 실행 범위에 바인딩된 tenant를 읽는다.
        System.out.println("tenant = " + TENANT_ID.get());
    }

    void serviceB() {
        System.out.println("audit tenant = " + TENANT_ID.get());
    }
}
```

## JEP 442: Foreign Function & Memory API (Third Preview)

> JNI의 복잡성과 취약성을 줄이고, 네이티브 함수 호출과 외부 메모리 접근을 더 안전하고 직관적인 표준 API로 바꾸는 데 중점을 둔다.

JNI를 덜 쓰고도 네이티브 함수 호출과 메모리 접근을 할 수 있게 해주는 API다. JNI 대체 후보로 계속 발전 중인 API다.
네이티브 호출과 메모리 접근을 더 현대적으로 작성할 수 있다는 장점이 있다.
반대로 말하면 네이티브 연동 계층 자체가 바뀌는 것이므로, 프로덕션 적용은 성능보다 회귀 테스트와 배포 안정성을 우선으로 봐야 한다.

```java
Linker linker = Linker.nativeLinker();
SymbolLookup stdlib = linker.defaultLookup();

// C 표준 라이브러리의 abs(int)를 호출할 핸들을 만든다.
MethodHandle abs = linker.downcallHandle(
    stdlib.find("abs").orElseThrow(),
    FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT)
);

// 네이티브 함수를 직접 호출한다.
int v = (int) abs.invokeExact(-42); // 42
```

## JEP 430: String Templates (Preview)

> 문자열 리터럴에 값 보간과 템플릿 처리를 도입해, 가독성을 높이고 템플릿 검증 지점을 표준화하려는 시도다.

문자열 보간을 더 읽기 좋고 덜 실수하게 쓰는 문법이다. 문자열 조합 가독성은 확실히 좋아진다. SQL, JSON, 로그 템플릿을 다루는 코드에서 관심이 큰 이유다.
하지만 보안 문제(SQL injection, 로그 위변조)는 문법이 해결해주지 않는다. 그래도 기존의 자바 String을 많이 개선한다.

```java
String orderId = "O-100";
int amount = 12000;

// 문자열 템플릿으로 변수 보간을 명시적으로 표현한다.
String log = STR."orderId=\{orderId}, amount=\{amount}";
System.out.println(log);
```

## JEP 445: Unnamed Classes and Instance Main Methods (Preview)

> 초기 실습 코드에서 보일러플레이트를 줄여, 자바 프로그램 진입 코드 작성을 더 빠르게 가능하게 한다.

학습용/샘플용 코드에서 시작 코드를 확 줄여주는 기능이다. 학습 및 샘플 용도 코드에는 유용하다. 작성 진입 장벽을 많이 낮춰준다.
다만 일반적인 서버 애플리케이션 구조와는 거리가 있어서, 실무 운영 코드 관점에서는 우선순위가 낮을 수 있겠다.

```java
// 클래스 선언 없이 바로 실행 진입점을 작성한다.
void main() {
    System.out.println("Hello, Java 21!");
}
```

## JEP 443: Unnamed Patterns and Variables (Preview)

> 사용하지 않는 패턴/변수를 명시적으로 버릴 수 있게 해서, 패턴 매칭 코드 의도를 더 분명하게 드러내는 방향을 지향한다.

한 줄로 말하면, "안 쓰는 값"을 `_`로 분명하게 표현하는 문법이다. 의도적으로 쓰지 않는 값을 `_`로 표현할 수 있어 코드는 짧아진다.
Python, Kotlin 등에서 이미 많이 쓰인다.

```java
record User(String name, int age) {}

String group(Object obj) {
    return switch (obj) {
        // name은 쓰지 않으므로 _로 버린다.
        case User(_, int age) when age >= 20 -> "adult";
        case User(_, _) -> "minor";
        default -> "unknown";
    };
}
```

## JEP 448: Vector API (Sixth Incubator)
> 자바에서 벡터 연산을 표현할 수 있는 인큐베이터 API를 제공해, 지원되는 CPU에서는 런타임이 이를 최적의 벡터 명령으로 매핑하고,
> 지원이 부족한 환경에서도 기능적으로 올바르게 동작하게 한다.

쉽게 말하면, 숫자 계산을 "하나씩" 하지 않고 "여러 개를 한 번에" 처리하게 도와주는 API다.
그래서 신호처리, 수학 연산, ML 전처리처럼 계산량이 많은 구간에서는 속도 이득이 날 수 있다고 한다.

```java
var species = FloatVector.SPECIES_PREFERRED;
float[] a = ...;
float[] b = ...;
float[] out = new float[a.length];

// species 길이만큼 SIMD 연산을 수행한다.
for (int i = 0; i < species.loopBound(a.length); i += species.length()) {
    var va = FloatVector.fromArray(species, a, i);
    var vb = FloatVector.fromArray(species, b, i);
    va.mul(vb).intoArray(out, i);
}
```

<br><br>

# 마치며

이번에도 기대되는 포인트가 많다. 개인적으로는 동시성(JEP 444), 문법/모델링(JEP 441, JEP 440) 측면에서의 변화가 기대된다.
특히 가상 스레드는 서버 코드 구조를 단순하게 가져갈 수 있는 선택지를 다시 열어주었고, 패턴 매칭과 레코드 패턴은 분기 코드의 의도를 더 또렷하게 만든다.

끝으로 이 글은 아래 OpenJDK JDK 21 공식 릴리즈 페이지를 기준으로 정리했다. 더 자세한 릴리즈 정보와 포함된 JEP 목록은 공식 문서를 참조하는 편이 좋다.

- <a href="https://openjdk.org/projects/jdk/21/" target="_blank" rel="nofollow">OpenJDK JDK 21</a>
