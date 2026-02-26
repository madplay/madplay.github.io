---
layout: post
title: "코틀린 예외 처리와 코루틴 기반 장애 대응"
author: madplay
tags: kotlin coroutine exception-handling retry test runCatching
description: "예외 분류, 코루틴 타임아웃, 재시도 설계, 단위 테스트, runCatching, lazy를 활용한 코틀린 실패 처리 전략을 정리한다."
category: Java/Kotlin
date: "2025-02-08 12:04:00"
comments: true
---

# 코틀린 시리즈 목차
- <a href="/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. 코틀린 기초 문법 가이드</a>
- <a href="/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. 코틀린 클래스 설계와 타입 시스템 활용</a>
- <a href="/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. 코틀린 널 안정성과 컬렉션, 함수형 프로그래밍</a>
- <a href="/post/kotlin-coroutines" target="_blank" rel="nofollow">4. 코틀린 코루틴 개념과 실전 활용</a>
- **5. 코틀린 예외 처리와 코루틴 기반 장애 대응**

<br>

# 잘 동작하는 코드보다 실패를 다루는 코드가 오래 간다
서비스는 언제든 실패할 수 있다. 네트워크는 느려지고, 외부 API는 간헐적으로 실패하며, 데이터는 예상과 다르게 들어온다.
이 글에서는 예외 분류, 코루틴 타임아웃, 재시도 설계, 테스트, `runCatching`까지 코틀린 실패 처리의 핵심 패턴을 정리한다.

<br>

# 예외는 잡는 것보다 분류가 먼저다
예외를 한 번에 처리하면 단순해 보이지만 정책이 사라진다.

```kotlin
// sealed class: 하위 타입이 같은 모듈로 제한되어 when 분기를 강제할 수 있음
sealed class FailureType {
    object Temporary : FailureType()  // 일시 오류: 재시도 가능
    object Permanent : FailureType()  // 영구 오류: 즉시 실패 처리
}

// sealed class이지만 Throwable 기반 분기라 else가 필요 (모든 Throwable 하위 타입을 열거할 수 없음)
// FileNotFoundException 등 재시도해도 소용없는 IOException은 Permanent로 세분화할 수 있음
fun classify(throwable: Throwable): FailureType = when (throwable) {
    is java.net.SocketTimeoutException -> FailureType.Temporary
    is java.io.FileNotFoundException   -> FailureType.Permanent
    is java.io.IOException             -> FailureType.Temporary
    else                               -> FailureType.Permanent
}
```

이 분류는 아래 `approveWithRetry`에서 재시도 여부를 결정하는 데 사용된다.
일시 오류만 재시도하고 영구 오류는 빠르게 실패시키는 기준이 있어야 트래픽 폭주를 피할 수 있다.

<br>

# 코루틴 타임아웃은 기본 정책으로 둔다
외부 API 호출에는 타임아웃을 두는 편이 안전하다.

```kotlin
import kotlinx.coroutines.withTimeout

interface PaymentApi {
    suspend fun getStatus(paymentId: String): String
}

suspend fun fetchPaymentStatus(api: PaymentApi, paymentId: String): String {
    return withTimeout(1_500L) {  // 1500ms 초과 시 TimeoutCancellationException 발생
        api.getStatus(paymentId)
    }
}

// 타임아웃을 null로 처리하려면 withTimeoutOrNull 사용
suspend fun fetchPaymentStatusOrNull(api: PaymentApi, paymentId: String): String? {
    return kotlinx.coroutines.withTimeoutOrNull(1_500L) {
        api.getStatus(paymentId)
    }  // 초과 시 예외 대신 null 반환
}
```

`withTimeout`은 시간 초과 시 `TimeoutCancellationException`을 던진다.
이 예외는 `CancellationException`의 하위 타입이므로 코루틴 취소 신호로도 처리된다.
타임아웃을 예외가 아닌 null로 받고 싶다면 `withTimeoutOrNull`을 쓴다. 운영 환경에서는 타임아웃 값을 상수나 설정으로 분리해 조정 가능하게 두는 편이 좋다.
다만 `withTimeout`은 코루틴을 취소하는 방식이므로, 내부 작업이 블로킹 I/O처럼 취소에 비협조적이면 즉시 중단되지 않을 수 있다.
타임아웃이 없으면 느린 호출이 스레드와 커넥션을 붙잡고, 결국 전체 지연으로 번질 수 있다.

<br>

# 재시도는 멱등성과 함께 설계한다
재시도는 강력하지만, 멱등성이 없으면 중복 처리 문제가 생긴다. 앞서 정의한 `classify` 함수를 활용해 일시 오류인 경우에만 재시도한다.

```kotlin
suspend fun approveWithRetry(
    requestId: String,  // 멱등 키: 동일 requestId로 재시도해도 중복 처리 방지 가능
    orderId: String,
    action: suspend () -> String
): String {
    var lastError: Throwable? = null

    repeat(3) { attempt ->  // 총 3번 시도
        try {
            return action()  // 성공 시 즉시 반환
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e  // 코루틴 취소 신호는 재시도하지 않고 즉시 전파
        } catch (t: Exception) {
            val temporary = classify(t) is FailureType.Temporary
            println("approve failed requestId=$requestId orderId=$orderId attempt=${attempt + 1} temporary=$temporary cause=${t.message}")
            if (!temporary) throw t  // 영구 오류는 재시도 없이 즉시 던짐
            lastError = t
        }
    }

    throw lastError ?: IllegalStateException("retry failed requestId=$requestId orderId=$orderId")
}
```

`requestId`를 멱등 키로 사용하면 재시도 중복 요청을 안전하게 처리할 수 있다.
실제 서비스에서는 `delay`로 재시도 간격을 두어 외부 부하를 분산하는 경우가 많다.
또한 코루틴 취소 신호(`CancellationException`)는 재시도 대상에서 제외하고 즉시 전파해야 구조화된 동시성이 유지된다.

<br>

# 테스트는 정책을 고정하는 문서다
실패 정책은 시간이 지나면 흐려지기 쉽다. 테스트로 고정해두는 편이 낫다.
예외 분류는 아래처럼 단위 테스트로 명시해두면 운영 중 정책 변경에 따른 회귀를 빠르게 잡을 수 있다.
타임아웃 기준, 재시도 횟수도 같은 방식으로 테스트로 고정할 수 있다.

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertTrue

class FailureClassifyTest {
    @Test
    fun `SocketTimeoutException은 일시 오류로 분류된다`() {
        val result = classify(java.net.SocketTimeoutException("timeout"))
        assertTrue(result is FailureType.Temporary)  // 재시도 가능 여부를 타입으로 검증
    }

    @Test
    fun `IllegalArgumentException은 영구 오류로 분류된다`() {
        val result = classify(IllegalArgumentException("invalid"))
        assertTrue(result is FailureType.Permanent)  // 재시도 불필요한 오류로 분류 확인
    }

    @Test
    fun `FileNotFoundException은 영구 오류로 분류된다`() {
        val result = classify(java.io.FileNotFoundException("file not found"))
        assertTrue(result is FailureType.Permanent)
    }
}
```

<br>

# require, check, error, Nothing으로 실패 지점을 명시한다
실패 처리에서 중요한 점은 어디서 실패를 의도했는지 코드에 남기는 것이다.

```kotlin
fun validateAmount(amount: Long?) {
    require(amount != null) { "amount is required" }  // 인자 검증: 위반 시 IllegalArgumentException
    check(amount > 0) { "amount must be positive" }   // 상태 검증: 위반 시 IllegalStateException
}

fun failFast(message: String): Nothing {
    error("fatal: $message")  // Nothing: 이 함수는 절대 정상 반환하지 않음을 타입으로 표현
}
```

`require`는 인자 검증, `check`는 상태 검증에 쓰면 의도가 분명하다. `Nothing` 반환 함수는 정상 복귀하지 않는다는 사실을 타입으로 표현한다.

<br>

# use와 runCatching으로 정리와 복구를 분리한다
리소스 정리와 복구 로직을 한 함수에 섞으면 읽기 어려워진다. 코틀린 표준 라이브러리 도구를 활용하면 실패 흐름을 단순하게 유지할 수 있다.

```kotlin
fun readFirstByte(payload: ByteArray): Result<Int> {
    return runCatching {
        ByteArrayInputStream(payload).use { input ->  // use: 블록 종료 시 자동으로 close() 호출
            input.read()
        }
    }.recoverCatching { t ->
        if (t is kotlinx.coroutines.CancellationException) throw t  // 취소 전파 유지
        // 실패 시 복구 시도: -1을 기본값으로 반환
        println("read fail cause=${t.message}")
        -1
    }
}
```

`use`는 자동으로 자원을 해제하고, `runCatching`은 성공/실패 경로를 값으로 다룰 수 있게 해준다.
다만 예외를 모두 값으로 감싸면 스택 트레이스 분석이 어려워질 수 있으니 경계 지점에서만 선택적으로 쓰는 편이 좋다.
코루틴 문맥에서는 `CancellationException`을 일반 실패처럼 삼키지 않도록 별도로 재던져 취소 전파를 유지해야 한다.
이 예제는 `ByteArrayInputStream` 기반의 비-서스펜드 I/O라 `CancellationException`이 흔히 발생하는 형태는 아니지만, 코루틴 코드로 확장될 수 있는 패턴이라 취소 전파 원칙을 함께 보여준다.

<br>

# lazy로 초기화 비용을 분산한다
장애 대응 컴포넌트(메트릭 클라이언트, 서킷 브레이커 등)는 초기화 비용이 크지만 항상 쓰이지는 않는다.
`lazy`를 쓰면 첫 접근 시점으로 초기화를 미룰 수 있어 콜드 스타트 시간을 줄일 수 있다.

```kotlin
class MetricsRegistry {
    // lazy: 첫 접근 시 한 번만 초기화, 이후 캐시된 값 반환, 기본적으로 스레드 안전
    // 단일 스레드 환경에서는 lazy(LazyThreadSafetyMode.NONE)로 동기화 비용 제거 가능
    val client by lazy {
        println("initialize metrics client")
        Any()
    }
}
```

다만 첫 호출 지연이 생기므로, 응답 시간이 중요한 핫패스 경로에서는 애플리케이션 시작 시점에 미리 초기화해두는 편이 낫다.

<br>

# 마무리하며
여러 글에 걸쳐 문법, 타입, 널 안정성, 코루틴을 살펴봤다. 문법이 간결해 배우기 쉽지만, 실무에서는 실패 정책과 운영 기준이 더 중요하다. 예외 분류, 타임아웃, 재시도, 멱등성, 테스트를 먼저 고정해두면, 그 위에 어떤 문법을 쌓아도 서비스 안정성은 흔들리지 않는다.

<br>

# 참고
- <a href="https://kotlinlang.org/docs/exception-handling.html" target="_blank" rel="nofollow">Kotlin Docs: Exception handling</a>
- <a href="https://kotlinlang.org/docs/coroutines-basics.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutines basics</a>
- <a href="https://kotlinlang.org/docs/delegated-properties.html" target="_blank" rel="nofollow">Kotlin Docs: Delegated properties</a>
