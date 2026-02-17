---
layout: post
title: "자바 sealed class vs abstract class vs interface: 언제 무엇을 써야 할까"
author: madplay
tags: java sealed-class abstract-class interface type-system class-hierarchy java17
description: "자바에서 sealed class, abstract class, interface가 각각 언제 왜 필요한지, 실무 예시와 함께 구체적으로 비교한다."
category: Java/Kotlin
date: "2023-02-07 08:55:00"
comments: true
---

# 세 가지를 왜 구분해야 하는가

자바에서 공통 타입을 만드는 방법은 `interface`, `abstract class`, `sealed class` 세 가지다. 문법만 보면 비슷해 보이지만 설계 목적이 다르다.
용도를 구분하지 않으면 `abstract class`로 만들어야 할 것을 `interface`로 만들거나, `sealed class`가 필요한 자리에 `interface`를 쓰게 된다.
그 결과 `switch` 분기에서 실수가 생기고, 컴파일러가 잡아줄 수 있는 오류를 런타임으로 미루게 된다.

`sealed class`는 Java 17(JEP 409)에서 정식 도입됐다. Preview는 Java 15(JEP 360)부터 있었다.
`switch` 패턴 매칭(Java 21, JEP 441)과 함께 쓰면 exhaustiveness를 컴파일 단계에서 검증할 수 있다.

이 글에서는 세 가지를 실무 코드에 가까운 예시와 함께 각각의 특성과 제약을 설명하고, 언제 어떤 것을 선택해야 하는지 비교한다.

<br>

# interface: 역할(계약)을 정의한다

## 기본 특성

인터페이스는 구현체가 "무엇을 할 수 있는지"를 선언하는 계약이다. Java 8부터 `default` 메서드로 기본 구현을 포함할 수 있지만,
인스턴스 필드는 가질 수 없다. 상수(`static final`)만 선언 가능하다.

```java
public interface Notifiable {
	// 추상 메서드: 구현체가 반드시 구현해야 함
	String getRecipientId();

	void notify(String message);

	// 기본 구현: override하지 않으면 이 구현이 사용됨 (Java 8+)
	default void notifyWithPrefix(String prefix, String message) {
		notify("[" + prefix + "] " + message);
	}
}
```

## 다중 구현으로 역할을 조합한다

인터페이스의 가장 큰 장점은 하나의 클래스가 여러 인터페이스를 동시에 구현할 수 있다는 것이다.

```java
public interface Auditable {
	long getCreatedAt();

	String auditLog();
}

public interface Cacheable {
	String getCacheKey();

	boolean isCacheExpired(long nowMs);
}

// Notifiable, Auditable, Cacheable 세 역할을 하나의 클래스에서 동시에 수행
public class UserSession implements Notifiable, Auditable, Cacheable {
	private final String recipientId;
	private final long createdAt;
	private final long ttlMs;  // 세션 유효 기간(밀리초)

	public UserSession(String recipientId, long createdAt, long ttlMs) {
		this.recipientId = recipientId;
		this.createdAt = createdAt;
		this.ttlMs = ttlMs;
	}

	@Override
	public String getRecipientId() {
		return recipientId;
	}

	@Override
	public void notify(String message) {
		System.out.println("push to " + recipientId + ": " + message);
	}

	@Override
	public long getCreatedAt() {
		return createdAt;
	}

	@Override
	public String auditLog() {
		return "session created at " + createdAt + " for " + recipientId;
	}

	@Override
	public String getCacheKey() {
		return "session:" + recipientId;
	}

	// 현재 시각과 생성 시각의 차이가 TTL을 초과하면 만료로 판단
	@Override
	public boolean isCacheExpired(long nowMs) {
		return (nowMs - createdAt) > ttlMs;
	}
}
```

## 인스턴스 필드가 없다는 제약

인터페이스는 인스턴스 상태를 직접 저장하지 않는다. `default` 메서드는 공통 계산 로직을 제공할 수 있지만, 상태 저장은 구현체가 담당해야 한다.

```java
public interface Describable {
	String getName();
	String getCode();

	// 인터페이스는 상태 저장 없이 계산 로직만 제공
	default String displayName() {
		return "[" + getCode() + "] " + getName();
	}
}

public class ProductCategory implements Describable {
	private final String name;
	private final String code;

	public ProductCategory(String name, String code) {
		this.name = name;
		this.code = code;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getCode() {
		return code;
	}
}
```

## 테스트에서 인터페이스가 주는 이점

인터페이스 경계가 있으면 외부 시스템(결제, 메시지 큐 등)을 테스트용 구현체로 교체하기 쉽다.

```java
// sealed interface로 결과 타입을 고정: 성공/실패 외의 경우를 추가하려면 permits 수정 필요
public sealed interface ChargeResult permits ChargeResult.Success, ChargeResult.Failure {
	record Success(String transactionId) implements ChargeResult {
	}

	record Failure(String reason) implements ChargeResult {
	}
}

public interface PaymentGateway {
	ChargeResult charge(String orderId, long amount);
}

// 실제 환경에서 사용하는 구현체: 외부 결제 API와 통신
public class TossPaymentGateway implements PaymentGateway {
	@Override
	public ChargeResult charge(String orderId, long amount) {
		// 실제 외부 API 호출 (생략)
		return new ChargeResult.Success("txn-" + orderId);
	}
}

// 테스트에서 사용하는 가짜 구현체: 외부 API 호출 없이 항상 성공을 반환
public class FakePaymentGateway implements PaymentGateway {
	@Override
	public ChargeResult charge(String orderId, long amount) {
		return new ChargeResult.Success("fake-txn-" + orderId);
	}
}
```

<br>

# abstract class: 공통 구현을 공유한다

## 기본 특성

추상 클래스는 **인스턴스 필드를 가질 수 있고**, 공통 구현을 하위 클래스와 나눌 수 있다.
직접 인스턴스화는 할 수 없으며, 반드시 하위 클래스를 통해서만 사용한다.

```java
public abstract class BaseRepository<T> {
	protected final String tableName;  // 하위 클래스가 공유하는 테이블 이름

	protected BaseRepository(String tableName) {
		this.tableName = tableName;
	}

	// 공통 구현: 하위 클래스가 override하지 않으면 이 구현이 사용됨
	public List<T> findAll() {
		System.out.println("SELECT * FROM " + tableName);
		return Collections.emptyList();
	}

	// 추상 메서드: 조회 방식이 구현체마다 다르므로 하위 클래스에 위임
	public abstract Optional<T> findById(long id);

	// 템플릿 메서드: 검증 → 저장 순서를 고정하고, 세부 구현은 하위 클래스에 위임
	public T save(T entity) {
		validate(entity);
		return persist(entity);
	}

	protected abstract void validate(T entity);

	protected abstract T persist(T entity);
}
```

## 공통 상태와 로직을 공유한다

여러 구현체가 공유해야 할 상태나 로직이 있을 때 추상 클래스가 효과적이다. 핵심은 "공통 흐름은 추상 클래스에, 차이점은 하위 클래스에" 두는 것이다.

```java
public abstract class DiscountPolicy {
	protected final long minAmount;

	protected DiscountPolicy(long minAmount) {
		this.minAmount = minAmount;
	}

	// 공통 흐름: 최소 금액 검증은 상위 클래스에서 고정
	public final long apply(long amount) {
		if (amount < minAmount) {
			return amount;
		}
		return calculate(amount);
	}

	protected abstract long calculate(long amount);
}

public class FixedDiscountPolicy extends DiscountPolicy {
	private final long discountAmount;

	public FixedDiscountPolicy(long minAmount, long discountAmount) {
		super(minAmount);
		this.discountAmount = discountAmount;
	}

	@Override
	protected long calculate(long amount) {
		return Math.max(0, amount - discountAmount);
	}
}
```

## 인터페이스와 함께 쓰는 패턴

추상 클래스가 인터페이스를 구현하면서 공통 로직을 담고, 하위 클래스는 차이점만 구현하는 패턴이 자주 쓰인다.

```java
public interface EventHandler<T> {
	boolean canHandle(Object event);

	void handle(T event);
}

// 추상 클래스가 공통 처리(로깅 등)를 담당
public abstract class BaseEventHandler<T> implements EventHandler<T> {
	private final String handlerName;

	protected BaseEventHandler(String handlerName) {
		this.handlerName = handlerName;
	}

	// final: 하위 클래스가 처리 흐름(로깅 → doHandle) 자체를 변경하지 못하도록 봉쇄
	@Override
	public final void handle(T event) {
		System.out.println(handlerName + " 처리 시작");
		doHandle(event);
		System.out.println(handlerName + " 처리 완료");
	}

	// 하위 클래스가 실제 처리 로직만 구현: 로깅 등 공통 흐름은 관여하지 않음
	protected abstract void doHandle(T event);
}

// record: 컴팩트한 불변 데이터 객체, equals/hashCode/toString 자동 생성 (Java 16+, 14/15는 preview)
public record OrderCreatedEvent(String orderId, long amount) {
}

public class OrderCreatedHandler extends BaseEventHandler<OrderCreatedEvent> {
	public OrderCreatedHandler() {
		super("주문생성핸들러");
	}

	// instanceof 패턴 매칭(Java 16+): 타입 확인과 동시에 변수 바인딩
	@Override
	public boolean canHandle(Object event) {
		return event instanceof OrderCreatedEvent;
	}

	@Override
	protected void doHandle(OrderCreatedEvent event) {
		System.out.printf("주문 처리: orderId=%s amount=%d%n", event.orderId(), event.amount());
	}
}
```

<br>

# sealed class/interface: 가능한 경우의 수를 타입으로 고정한다

## 기본 특성 (Java 17+)

`sealed class`/`sealed interface`는 **하위 타입의 범위를 컴파일러가 알고 있는** 타입이다. 보통 `permits`로 허용할 하위 타입을 명시적으로 열거하며,
외부에서 임의로 추가할 수 없다 (같은 파일 내 직접 하위 타입인 경우 `permits` 생략 가능). 하위 타입은 반드시 `final`, `sealed`, `non-sealed`
중 하나를 선언해야 한다.

```java
// permits로 허용할 하위 타입을 명시 (sealed class: 하위 타입은 extends로 연결)
public sealed class ApiResponse permits ApiResponse.Ok, ApiResponse.Error {
	public static final class Ok extends ApiResponse {
		public final String body;
		public Ok(String body) { this.body = body; }
	}
	public static final class Error extends ApiResponse {
		public final int statusCode;
		public final String message;
		public Error(int statusCode, String message) {
			this.statusCode = statusCode;
			this.message = message;
		}
	}
}
```

## switch 패턴 매칭: default 생략 가능 (Java 21+)

`sealed` 타입과 `switch` 패턴 매칭을 함께 쓰면, 새로운 하위 타입이 추가될 때 처리 누락을 컴파일 오류로 잡아준다. 다만 이는 non-null 값
기준이며, `null`은 필요 시 `case null`로 별도 처리해야 한다.

```java
// Java 21+: switch 패턴 매칭, sealed class이므로 default 불필요
String describe(ApiResponse response) {
	return switch (response) {
		case ApiResponse.Ok ok -> "성공: " + ok.body;
		case ApiResponse.Error error -> "오류 " + error.statusCode + ": " + error.message;
		// default 불필요: sealed이므로 모든 경우가 열거됨
	};
}
```

만약 `ApiResponse`에 `Redirect` 케이스가 추가된다면 `describe` 메서드에서 컴파일 오류가 발생한다. 처리 누락이 런타임이 아닌 컴파일
단계에서 드러난다.

## permits와 하위 타입 제약

`permits`에 나열된 하위 타입은 반드시 세 가지 중 하나를 선언해야 한다.

| 선언           | 의미                       |
|--------------|--------------------------|
| `final`      | 더 이상 확장 불가 (리프 노드)       |
| `sealed`     | 하위 타입을 다시 `permits`로 제한  |
| `non-sealed` | 봉인을 해제하여 외부에서 자유롭게 확장 가능 |

permitted 서브타입은 sealed 타입과 **같은 패키지**(unnamed module) 또는 **같은 모듈**(named module)에 있어야 한다.

```java
// sealed interface: record는 interface만 구현 가능 (record는 extends 불가)
public sealed interface PaymentEvent
	permits PaymentEvent.Approved, PaymentEvent.Failed, PaymentEvent.Pending {

	record Approved(String transactionId, long amount) implements PaymentEvent {
	}

	record Failed(String reason, boolean retryable) implements PaymentEvent {
	}

	// 데이터 없이 상태만 표현: 빈 바디로 선언
	record Pending() implements PaymentEvent {
	}
}

// Java 21+: 각 case가 타입 패턴으로 매칭되며, sealed이므로 default 없이 exhaustive
String describeEvent(PaymentEvent event) {
	return switch (event) {
		case PaymentEvent.Approved a -> "승인 완료: txn=" + a.transactionId();
		case PaymentEvent.Failed f -> "실패 (재시도=" + f.retryable() + "): " + f.reason();
		case PaymentEvent.Pending p -> "대기 중";
	};
}
```

sealed interface와 record를 함께 쓰면 생성자·`equals`·`hashCode`·`toString`이 자동 생성되어 같은 패턴을 더 간결하게 표현할 수 있다.

<br>

# 세 가지 비교하기

## 특성 비교표

|                     | `interface`                           | `abstract class`         | `sealed class`                                       |
|---------------------|---------------------------------------|--------------------------|------------------------------------------------------|
| 인스턴스화               | 불가                                    | 불가                       | 조건부 (`abstract sealed`는 불가, concrete sealed는 가능)     |
| 인스턴스 필드 보유          | 불가 (상수만 가능)                           | 가능                       | 가능                                                   |
| 다중 구현/상속            | 다중 구현 가능                              | 단일 상속                    | 단일 상속 (sealed interface는 다중 구현 가능)                   |
| 생성자                 | 없음                                    | 가능                       | 가능                                                   |
| 하위 타입 제한            | 없음 (어디서든 구현 가능)                       | 없음                       | 보통 `permits`에 명시한 타입으로 제한 (같은 파일 내 직접 하위 타입이면 생략 가능) |
| `switch` exhaustive | 불가 (`sealed interface`는 가능, Java 21+) | 불가                       | 가능 (default 불필요, Java 21+)                           |
| 기본 구현 제공            | 가능 (`default`, 인스턴스 필드 없이)            | 가능 (인스턴스 필드 포함)          | 가능                                                   |
| 주요 용도               | 역할(계약) 분리, 다중 역할 조합                   | 공통 상태와 구현 공유, 템플릿 메서드 패턴 | 닫힌 결과 타입 표현, 상태 머신                                   |

<br>

## 같은 도메인으로 비교하기

결제 처리 결과를 세 가지 방식으로 표현할 때 차이가 명확해진다.

**interface를 쓰는 경우:** 외부에서 하위 타입을 추가할 수 있고, `switch`가 exhaustive하지 않다.

```java
public interface PaymentResult {
	boolean isSuccess();

	String describe();
}

public class ApprovedResult implements PaymentResult {
	private final String transactionId;

	public ApprovedResult(String transactionId) {
		this.transactionId = transactionId;
	}

	@Override
	public boolean isSuccess() {
		return true;
	}

	@Override
	public String describe() {
		return "승인: " + transactionId;
	}
}

public class FailedResult implements PaymentResult {
	private final String reason;

	public FailedResult(String reason) {
		this.reason = reason;
	}

	@Override
	public boolean isSuccess() {
		return false;
	}

	@Override
	public String describe() {
		return "실패: " + reason;
	}
}

// interface는 하위 타입이 열려있어 switch exhaustiveness 불가: 조건 분기로 처리
// 새로운 구현체가 추가되어도 이 코드에서 컴파일 오류가 발생하지 않음
String process(PaymentResult result) {
	if (result.isSuccess())
		return "완료";
	return "오류";  // 새 구현체의 처리 누락을 컴파일러가 잡아주지 못함
}
```

**abstract class를 쓰는 경우:** 공통 상태(transactionFee)를 공유하지만 여전히 `switch`가 exhaustive하지 않다.

```java
public abstract class PaymentResultBase {
	public final String requestId;
	public final long transactionFee;  // 공통 상태

	protected PaymentResultBase(String requestId, long transactionFee) {
		this.requestId = requestId;
		this.transactionFee = transactionFee;
	}

	public abstract boolean isSuccess();

	public abstract String describe();

	public String summary() {
		return "requestId=" + requestId + " fee=" + transactionFee + " success=" + isSuccess();
	}
}

public class ApprovedResultBase extends PaymentResultBase {
	public final String transactionId;

	public ApprovedResultBase(String requestId, long transactionFee, String transactionId) {
		super(requestId, transactionFee);
		this.transactionId = transactionId;
	}

	@Override
	public boolean isSuccess() {
		return true;
	}

	@Override
	public String describe() {
		return "승인: " + transactionId;
	}
}

public class FailedResultBase extends PaymentResultBase {
	public final String reason;

	public FailedResultBase(String requestId, long transactionFee, String reason) {
		super(requestId, transactionFee);
		this.reason = reason;
	}

	@Override
	public boolean isSuccess() {
		return false;
	}

	@Override
	public String describe() {
		return "실패: " + reason;
	}
}
```

**sealed type를 쓰는 경우:** 하위 타입이 고정되고, `switch`가 exhaustive하다 (Java 21+).

```java
// sealed interface + record 조합: 하위 타입 제한과 간결한 데이터 선언을 동시에 달성
public sealed interface PaymentOutcome
	permits PaymentOutcome.Approved, PaymentOutcome.Failed, PaymentOutcome.Pending {

	record Approved(String requestId, String transactionId, long transactionFee)
		implements PaymentOutcome {
	}

	record Failed(String requestId, String reason, boolean retryable)
		implements PaymentOutcome {
	}

	record Pending(String requestId)
		implements PaymentOutcome {
	}
}

// sealed이므로 default 없이 exhaustive: Pending 케이스가 빠지면 컴파일 오류 발생
String handleOutcome(PaymentOutcome outcome) {
	return switch (outcome) {
		case PaymentOutcome.Approved a -> "승인: " + a.transactionId() + " (수수료: " + a.transactionFee() + ")";
		case PaymentOutcome.Failed f -> "실패 (재시도=" + f.retryable() + "): " + f.reason();
		case PaymentOutcome.Pending p -> "처리 중: " + p.requestId();
	};
}
```

<br>

# 선택 기준 정리

세 가지 중 하나를 고를 때 아래 기준을 참고할 수 있다.

## 결과/상태/이벤트 타입 (Java 17+)

함수가 반환하는 결과, 도메인 상태, 이벤트처럼 "가능한 경우의 수가 고정된" 타입이라면 `sealed type`을 검토해볼 만하다. Java 21+의 `switch` 패턴 매칭과 함께 쓰면 처리 누락을 컴파일 단계에서 잡아주기 때문에 결과 타입 표현에 유리한 편이다.

공통 상태나 구현을 공유해야 하면 `sealed class`, record와 함께 쓰거나 하나의 클래스가 여러 sealed 타입을 구현해야 하면 `sealed interface`를 고려할 수 있다.

```
결과/상태/이벤트 타입 → sealed type(`sealed class`/`sealed interface`) (Java 17+)
```

## 공통 상태·구현이 필요할 때

여러 하위 타입이 같은 필드나 로직을 공유해야 하고, 외부에서 하위 타입 추가를 열어두어야 한다면 `abstract class`를 고려할 수 있다. 템플릿 메서드 패턴처럼 공통 흐름을 정의하고 세부 구현을 위임할 때
유용한 편이다.

```
공통 필드/구현 공유 + 확장 가능성 → abstract class
```

## 역할 분리와 다중 구현이 목적이라면

구현 세부사항 없이 "무엇을 할 수 있는지"만 정의하거나, 하나의 클래스가 여러 역할을 동시에 수행해야 한다면 `interface`를 고려할 수 있다. 테스트에서 목(mock) 구현체로 교체할 경계를 만드는 데도
효과적인 편이다.

```
역할(계약) 정의, 다중 역할 조합, 테스트 경계 → interface
```

세 가지를 함께 사용하는 패턴도 흔한 편이다. `interface`로 역할을 정의하고, `abstract class`가 공통 구현을 담은 뒤, 결과 타입은 `sealed type`으로
표현하는 방식이다. 아래는 핵심만 남긴 최소 예시다.

```java
// interface: OrderProcessor라는 역할만 선언, 구현 세부사항 없음
public interface OrderProcessor {
	ProcessResult process(String orderId);
}

// sealed interface: 처리 결과를 Done/Rejected 두 가지로 고정 (Java 17+)
public sealed interface ProcessResult
	permits ProcessResult.Done, ProcessResult.Rejected {
	record Done(long confirmedAt) implements ProcessResult {
	}   // confirmedAt: 처리 완료 시각(epoch ms)

	record Rejected(String reason) implements ProcessResult {
	}
}

// abstract class: 공통 흐름을 담당, 하위 클래스는 doProcess만 구현
public abstract class BaseOrderProcessor implements OrderProcessor {
	@Override
	public final ProcessResult process(String orderId) {
		System.out.println("orderId=" + orderId + " 처리 시작");
		return doProcess(orderId);
	}

	protected abstract ProcessResult doProcess(String orderId);
}

public class StandardOrderProcessor extends BaseOrderProcessor {
	@Override
	protected ProcessResult doProcess(String orderId) {
		return new ProcessResult.Done(System.currentTimeMillis());
	}
}
```

<br>

# 참고

- <a href="https://openjdk.org/jeps/409" target="_blank" rel="nofollow">JEP 409: Sealed Classes (Java 17)</a>
- <a href="https://openjdk.org/jeps/441" target="_blank" rel="nofollow">JEP 441: Pattern Matching for switch (Java
  21)</a>
- <a href="https://docs.oracle.com/en/java/javase/17/language/sealed-classes-and-interfaces.html" target="_blank" rel="nofollow">
  Java 17 Docs: Sealed Classes and Interfaces</a>
- <a href="https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html" target="_blank" rel="nofollow">Java Docs:
  Abstract Methods and Classes</a>
