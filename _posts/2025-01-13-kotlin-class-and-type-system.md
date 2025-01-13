---
layout: post
title: "코틀린 클래스 설계와 타입 시스템 활용"
author: madplay
tags: kotlin class sealed generics interface value-class delegation
description: "생성자 검증, 접근 제어, 인터페이스, sealed class, 제네릭, by 위임, enum/value class를 활용해 안전한 도메인 모델을 만드는 방법을 정리한다."
category: Kotlin
date: "2025-01-13 22:11:00"
comments: true
---

# 코틀린 시리즈 목차
- <a href="/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. 코틀린 기초 문법 가이드</a>
- **2. 코틀린 클래스 설계와 타입 시스템 활용**
- <a href="/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. 코틀린 널 안정성과 컬렉션, 함수형 프로그래밍</a>
- <a href="/post/kotlin-coroutines" target="_blank" rel="nofollow">4. 코틀린 코루틴 개념과 실전 활용</a>
- <a href="/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. 코틀린 예외 처리와 코루틴 기반 장애 대응</a>

<br>

# 객체 설계와 타입 시스템은 함께 봐야 한다
코틀린은 클래스 문법이 간결하고 타입 표현력도 높다. 하지만 규칙 없이 쓰면 도메인 제약이 코드에 남지 않고, 타입이 있어도 런타임에서야 실수가 드러난다.
이 글에서는 생성자 검증, 접근 제어, 인터페이스, sealed class, 제네릭, by 위임, enum/value class를 묶어서 실무 기준으로 정리한다.

<br>

# 생성자에서 불변식을 강제한다
객체가 만들어지는 시점에 유효하지 않은 상태를 막는 것이 가장 비용이 낮다.

```kotlin
class UserAccount(
    val userId: Long,
    email: String
) {
    // trim, lowercase로 정규화 후 저장. 프로퍼티 초기화는 init 블록보다 먼저 실행됨
    val email: String = email.trim().lowercase()

    init {
        // init 블록: 프로퍼티 초기화 후 실행, 여기서 유효하지 않은 값을 걸러냄
        require(userId > 0) { "userId must be positive" }
        require(this.email.contains("@")) { "invalid email" }
    }
}
```

`UserAccount`가 만들어지는 순간 이미 유효성이 보장되므로, 이 객체를 받는 서비스나 레포지토리에서 "이메일이 올바른가"를 다시 확인할 필요가 없다.
검증 로직이 한 곳에 모이고, 잘못된 값이 DB까지 흘러들어가는 경로 자체가 사라진다.

<br>

# data class: 값 중심 객체에 사용한다
`data class`는 `equals`, `hashCode`, `copy`, `toString`을 자동으로 생성해준다. DTO, 응답 모델처럼 값 중심 객체에 잘 맞는다.

```kotlin
// equals, hashCode, copy, toString 자동 생성: 값 비교와 복사가 간편
data class PaymentResult(
    val paymentId: String,
    val approved: Boolean,
    val amount: Long
)
```

반면 JPA 엔티티처럼 식별성과 생명주기가 중요한 객체는 `equals/hashCode` 자동 생성이 의도와 충돌할 수 있다.
이런 경우는 일반 클래스로 명확히 제어하는 편이 안전하다.

<br>

# 접근 제어: 노출 범위를 최소화한다
코틀린은 `public`, `internal`, `private`, `protected`를 제공한다. 라이브러리나 멀티 모듈 프로젝트에서는 `internal`이 특히 유용하다.

```kotlin
// internal: 같은 모듈 안에서만 접근 가능, 외부 모듈에 구현 노출 없음
internal class OrderEventParser {
    fun parse(raw: String): OrderEvent {
        val (orderId, status) = raw.split(":")  // 구조 분해로 간결하게 분리
        return OrderEvent(orderId.toLong(), status)
    }
}

data class OrderEvent(
    val orderId: Long,
    val status: String
)
```

외부에 노출하지 않을 구현을 `internal`로 제한하면 API 표면이 줄고, 리팩터링 여유가 커진다.

<br>

# 프로퍼티 접근자: 무거운 로직은 함수로 분리한다
접근자(`get`, `set`)에 I/O, 네트워크 호출, 락 경합이 필요한 작업을 넣으면 호출 비용이 감춰진다. 이런 작업은 명시적인 함수로 분리한다.

```kotlin
class TokenCache {
    // mutable: 내부 상태 변경이 필요하므로 가변, private으로 외부 노출 차단
    private val store = mutableMapOf<Long, String>()

    fun put(userId: Long, token: String) {
        store[userId] = token
    }

    fun get(userId: Long): String? = store[userId]  // 없으면 null 반환
}
```

<br>

# 인터페이스로 역할을 분리한다
인터페이스 경계를 두면 테스트에서 목 객체를 쉽게 붙일 수 있고, 외부 연동 교체 비용도 낮아진다.

```kotlin
// 구현체가 아닌 역할(계약)만 정의: 실제 결제 연동 코드와 분리됨
interface PaymentGateway {
    fun approve(command: ApproveCommand): GatewayResult
}

data class ApproveCommand(
    val requestId: String,  // 멱등 키: 재시도 중복 방지용
    val orderId: String,
    val amount: Long
)
```

`open`, `override`, `abstract`는 확장이 필요할 때만 열어두고, 확장 지점을 최소화하는 편이 유지보수에 유리하다.
코틀린 클래스는 기본이 `final`이기 때문에 명시적으로 `open`을 붙여야만 상속이 가능하다.

```kotlin
// abstract: 공통 인터페이스 정의, 직접 인스턴스화 불가
abstract class DiscountPolicy {
    abstract fun discount(amount: Long): Long
}

// open 없이도 abstract class는 상속 가능, override 필수
class FixedRateDiscountPolicy(
    private val rate: Double
): DiscountPolicy() {
    override fun discount(amount: Long): Long = (amount * rate).toLong()
}
```

<br>

# sealed class로 결과 타입을 닫아둔다
함수가 성공, 일시 오류, 영구 오류를 반환할 수 있다고 가정하면, 이를 `Boolean`이나 예외로 표현하면 호출부에서 경우의 수를 빠뜨리기 쉽다.
`sealed class`를 쓰면 가능한 결과를 타입으로 고정할 수 있고, `when` 식과 함께 쓰면 분기 누락을 컴파일 단계에서 잡아준다.

"닫아둔다"는 표현은 하위 타입을 같은 파일(코틀린 1.5 이후 같은 패키지) 안으로 제한한다는 의미다.
외부에서 임의로 하위 타입을 추가할 수 없으므로 `when` 분기가 항상 완전하다는 것을 컴파일러가 보장할 수 있다.

```kotlin
// sealed class: 하위 타입이 같은 파일 안으로 제한됨
sealed class GatewayResult {
    data class Approved(val transactionId: String): GatewayResult()
    data class RetryableFailure(val reason: String): GatewayResult()
    data class PermanentFailure(val reason: String): GatewayResult()
}

// when 식: 모든 하위 타입을 처리해야 컴파일됨 (else 불필요)
fun handle(result: GatewayResult): String = when (result) {
    is GatewayResult.Approved         -> "OK:${result.transactionId}"
    is GatewayResult.RetryableFailure -> "RETRY:${result.reason}"
    is GatewayResult.PermanentFailure -> "FAIL:${result.reason}"
}
```

일시 오류/영구 오류 분리가 타입으로 명확하게 드러난다. 도메인 메서드에서도 이 패턴을 쓰면 상위 계층의 재시도 판단이 쉬워진다.

## interface, abstract class, sealed class 비교

세 가지 모두 공통 타입을 정의하는 데 쓰이지만 목적과 제약이 다르다.

|                   | `interface`                 | `abstract class` | `sealed class`     |
|-------------------|-----------------------------|------------------|--------------------|
| 인스턴스화             | 불가                          | 불가               | 불가                 |
| 다중 interface 구현   | 가능                          | 가능               | 가능                 |
| 다중 클래스 상속         | 불가                          | 불가 (단일 상속)       | 불가 (단일 상속)         |
| 상태(필드) 보유         | 불가 (backing field 없음)       | 가능               | 가능                 |
| 하위 타입 제한          | 없음 (어디서든 구현 가능)             | 없음               | 같은 패키지 + 같은 모듈로 제한 |
| `when` exhaustive | 불가 (`sealed interface`는 가능) | 불가               | 가능 (else 불필요)      |
| 주요 용도             | 역할(계약) 정의                   | 공통 구현 공유         | 닫힌 결과 타입 표현        |

`interface`는 역할을 분리할 때, `abstract class`는 공통 구현을 물려줄 때, `sealed class`는 가능한 경우의 수를 타입으로 고정할 때 사용한다.
자바 기준의 설계 판단을 함께 비교해보고 싶다면, 아래 글도 참고해보세요.

- <a href="/post/java-when-to-use-sealed-abstract-interface" target="_blank" rel="nofollow">자바 sealed class vs abstract class vs interface</a>


<br>

# 제네릭과 타입 안전성: out, in, reified
제네릭은 재사용보다 타입 안전성에 먼저 쓴다.

```kotlin
// 타입 파라미터로 이벤트 종류를 고정: 런타임 캐스팅 오류 방지
interface EventPublisher<T> {
    fun publish(event: T)
}

data class OrderPaidEvent(
    val orderId: String,
    val amount: Long
)

// T를 OrderPaidEvent로 고정: 다른 이벤트 타입을 실수로 전달할 수 없음
class OrderPaidPublisher: EventPublisher<OrderPaidEvent> {
    override fun publish(event: OrderPaidEvent) {
        println("publish orderId=${event.orderId} amount=${event.amount}")
    }
}
```

제네릭으로 이벤트 타입을 고정하면 런타임 캐스팅 오류를 줄일 수 있다. `out`은 생산자(producer), `in`은 소비자(consumer) 방향에 맞춰 쓴다.
`reified`는 런타임 타입 체크가 필요할 때 캐스팅 코드를 단순하게 만든다.

```kotlin
interface EventReader<out T> {  // out: T를 반환만 함 (공변, 상위 타입으로 대입 가능)
    fun read(): T
}

interface EventWriter<in T> {   // in: T를 입력으로만 받음 (반공변, 하위 타입으로 대입 가능)
    fun write(event: T)
}

open class DomainEvent(val id: String)
class OrderCreatedEvent(orderId: String): DomainEvent(orderId)

// reified: 런타임에 T의 실제 타입 정보를 사용할 수 있음 (inline 필수)
inline fun <reified T> Any.castOrNull(): T? = this as? T
```

<br>

# 합성 우선 원칙과 by 위임
상속은 부모 클래스의 내부 구현에 의존하게 되어 변경 여파가 크다. 합성은 인터페이스를 통해 외부에서 구현체를 주입받으므로, 구현 교체와 테스트가 쉽다.
코틀린 클래스는 기본이 `final`이라 의도하지 않은 상속을 막고, 합성을 자연스럽게 유도한다.

앞서 정의한 `PaymentGateway`, `GatewayResult`, `EventPublisher`를 조합하면 아래처럼 의존 관계를 명확하게 표현할 수 있다.

```kotlin
// 생성자로 구현체를 받아 조합: gateway와 publisher가 각자 역할만 담당
class PaymentFacade(
    private val gateway: PaymentGateway,
    private val publisher: EventPublisher<OrderPaidEvent>
) {
    fun pay(command: ApproveCommand) {
        when (val result = gateway.approve(command)) {
            is GatewayResult.Approved -> {
                publisher.publish(OrderPaidEvent(command.orderId, command.amount))
            }
            is GatewayResult.RetryableFailure -> {
                println("payment retry requestId=${command.requestId} orderId=${command.orderId} reason=${result.reason}")
            }
            is GatewayResult.PermanentFailure -> {
                println("payment fail requestId=${command.requestId} orderId=${command.orderId} reason=${result.reason}")
            }
        }
    }
}
```

합성은 의존 관계가 명확하고, 테스트할 때 구현체를 목(mock)으로 교체하기 쉽다.

`by` 키워드를 쓰면 인터페이스 위임을 보일러플레이트 없이 선언할 수 있다. 위임 대상의 모든 메서드를 자동으로 넘기고,
필요한 메서드만 `override`해서 부가 동작을 끼워 넣을 수 있다.

```kotlin
interface Masker {
    fun mask(value: String): String
}

class AsteriskMasker: Masker {
    override fun mask(value: String): String = "*".repeat(value.length)
}

// by delegate: Masker의 모든 메서드를 delegate에게 위임, 직접 구현 불필요
class LoggingMasker(
    private val delegate: Masker
): Masker by delegate {
    // 필요한 메서드만 override해서 부가 동작 추가 가능
    override fun mask(value: String): String {
        println("masking value length=${value.length}")
        return delegate.mask(value)
    }
}
```

`lateinit`은 `var` 프로퍼티에만 사용할 수 있고, 초기화 전에 접근하면 `UninitializedPropertyAccessException`이 발생한다.
초기화 여부를 확인하려면 `::appName.isInitialized`를 사용한다. `lazy`는 첫 접근 시점에 한 번만 초기화되며 이후에는 캐시된 값을 반환한다.
기본적으로 스레드 안전하게 동작하지만, 초기화 비용이 크다면 첫 호출 지연이 생기므로 응답 시간이 중요한 경로에서는 미리 초기화해두는 편이 낫다.

```kotlin
class AppContext {
    // lateinit: 선언 시점에 초기화하지 않고 나중에 값을 할당, 접근 전 초기화되지 않으면 예외 발생
    lateinit var appName: String

    val startedAt: Long by lazy {
        System.currentTimeMillis()  // 첫 접근 시점에 한 번만 실행
    }
}
```

<br>

# enum과 value class로 도메인 타입을 구체화한다

아래처럼 상태를 문자열로 관리하면 오타가 생겨도 컴파일러가 잡아주지 않는다.

```kotlin
// 문자열로 상태를 관리하는 경우: 오타나 허용되지 않은 값이 런타임까지 드러나지 않음
val status: String = "APPORVED"  // 오타지만 컴파일 통과
```

`enum class`를 쓰면 허용된 값을 타입으로 고정할 수 있고, `when`과 함께 쓰면 분기 누락도 컴파일 단계에서 잡아준다.
마찬가지로 여러 식별자를 `String`으로 받는 함수는 인자 순서를 바꾸는 실수가 생기기 쉽다.

```kotlin
// 모두 String이라 컴파일러가 순서 오류를 잡아주지 못함
fun process(orderId: String, userId: String, couponId: String)

process(userId, orderId, couponId)  // 순서가 바뀌어도 컴파일 통과
```

`value class`로 각 식별자를 별도 타입으로 감싸면 이런 실수를 컴파일 단계에서 차단할 수 있다.

```kotlin
// enum: 허용된 상태를 타입으로 제한, 문자열 오타 방지
enum class PaymentStatus {
    REQUESTED,
    APPROVED,
    FAILED
}

// value class: 많은 경우 래퍼 객체 없이 처리되지만 문맥(제네릭/nullable 등)에 따라 boxing 가능
@JvmInline
value class OrderId(val value: String)

// String 대신 OrderId를 쓰면 orderId 자리에 다른 String을 실수로 넣을 수 없음
data class PaymentRecord(
    val orderId: OrderId,
    val status: PaymentStatus,
    val amount: Long
)
```

`value class`는 JVM에서 많은 경우 내부 값(`String`)으로 처리되어 타입 안전성을 추가하면서도 오버헤드가 작다. 다만 제네릭, nullable, 인터페이스 경계 등에서는 boxing이 발생할 수 있다.
다만 JPA 매핑이나 Jackson 같은 직렬화 프레임워크에서 추가 설정이 필요할 수 있으니 도입 전에 확인한다.

<br>

# 객체 설계에서 먼저 고정할 기준
생성자 검증, 읽기 전용 컬렉션, 접근 제어, sealed class 결과 타입, 타입 파라미터 고정까지 이 다섯 가지를 먼저 고정하면 코드베이스가 빠르게 안정된다.
다음 글에서는 널 안정성, 컬렉션 연산, 람다와 고차 함수를 묶어서 데이터 처리 코드를 정리한다.

- <a href="/post/kotlin-null-safety-and-functional" target="_blank">다음글: "코틀린 널 안정성과 컬렉션, 함수형 프로그래밍"</a>

<br>

# 참고
- <a href="https://kotlinlang.org/docs/classes.html" target="_blank" rel="nofollow">Kotlin Docs: Classes</a>
- <a href="https://kotlinlang.org/docs/sealed-classes.html" target="_blank" rel="nofollow">Kotlin Docs: Sealed classes and interfaces</a>
- <a href="https://kotlinlang.org/docs/generics.html" target="_blank" rel="nofollow">Kotlin Docs: Generics</a>
- <a href="https://kotlinlang.org/docs/inline-classes.html" target="_blank" rel="nofollow">Kotlin Docs: Inline value classes</a>
