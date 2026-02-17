---
layout: post
title: "코틀린 기초 문법 가이드"
author: madplay
tags: kotlin basic var-val function control-flow
description: "var/val, 함수, 제어식, 문자열 템플릿, 반복문, 예외 처리까지 백엔드 코드에서 자주 쓰는 코틀린 기초 문법을 정리한다."
category: Java/Kotlin
date: "2025-01-05 23:59:00"
comments: true
---

# 코틀린 시리즈 목차
- **1. 코틀린 기초 문법 가이드**
- <a href="/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. 코틀린 클래스 설계와 타입 시스템 활용</a>
- <a href="/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. 코틀린 널 안정성과 컬렉션, 함수형 프로그래밍</a>
- <a href="/post/kotlin-coroutines" target="_blank" rel="nofollow">4. 코틀린 코루틴 개념과 실전 활용</a>
- <a href="/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. 코틀린 예외 처리와 코루틴 기반 장애 대응</a>

<br>

# 코틀린 문법, 어디까지 알아야 실무에 바로 쓸 수 있을까
코틀린을 시작할 때 가장 큰 고민은 문법을 얼마나 자세히 봐야 하는지다. 문법을 처음부터 끝까지 외우는 방식은 오래 걸리고,
막상 서비스 코드에서는 자주 쓰는 패턴이 반복된다. 그래서 이 글에서는 변수 선언, 함수, 제어식, 문자열 템플릿처럼 기본 문법을 백엔드 코드에서
바로 쓰는 기준으로 정리한다.

<br>

# var와 val: 변경 가능성을 선언 시점에 결정한다
`var`와 `val`은 단순한 문법 선택이 아니다. 상태 변경을 어디까지 허용할지 결정하는 설계 선택이다.

```kotlin
// val: 생성 후 변경되지 않는 요청 객체
data class CreateUserRequest(
    val email: String,
    val nickname: String
)

class UserTokenIssuer(
    private val tokenSecret: String  // val: 한 번 주입되면 바뀌지 않음
) {
    fun issue(userId: Long): String {
        val issuedAt = System.currentTimeMillis()  // val: 한 번만 계산
        return "$userId:$issuedAt:$tokenSecret"
    }
}
```

요청 객체나 계산 중간값은 기본적으로 `val`로 두는 편이 안전하다. 변경 가능성이 줄어들면 동시성 환경에서 예측 가능성이 올라가고, 디버깅 포인트도 줄어든다.

반대로 루프 카운터, 누적 통계처럼 명확히 상태를 바꿔야 하는 경우에만 `var`를 쓴다.

```kotlin
fun countProcessedEvents(events: List<String>): Int {
    var processedCount = 0  // var: 반복마다 누적되어야 하므로 가변
    for (event in events) {
        if (event.isNotBlank()) {
            processedCount++
        }
    }
    return processedCount
}
```

여기서도 범위를 최소화하는 편이 좋다. `var`는 가능하면 가장 좁은 스코프에 둔다.

<br>

# 함수: 기본값, 이름 있는 인자, 단일 식 함수
코틀린 함수는 반환 타입 추론이 편리하지만, 공개 API 성격의 함수는 타입을 명시하는 편이 읽기 쉽다.

```kotlin
class PaymentService {
    // 블록 본문: 계산 과정이 있어 단계가 보임
    fun calculateVat(amount: Long): Long {
        return (amount * 0.1).toLong()
    }

    // 식 본문(=): 단순 변환은 한 줄로
    fun normalizeEmail(raw: String): String = raw.trim().lowercase()
}
```

짧은 변환은 식 본문(`=`)으로, 분기나 검증이 들어가면 블록 본문으로 나누면 된다. 이 기준만 지켜도 코드 리뷰에서 함수 스타일 충돌이 줄어든다.
주의할 점은 함수가 한 번에 너무 많은 결정을 하지 않도록 나누는 것이다. 특히 검증, 변환, 저장, 로깅이 한 함수에 섞이면 테스트가 어려워진다.

<br>

# if와 when: 문(statement)과 식(expression), 두 가지로 모두 쓸 수 있다
코틀린의 `if`, `when`은 Java처럼 문(statement)으로도 쓸 수 있고, 값을 반환하는 식(expression)으로도 쓸 수 있다.
식으로 쓰면 중간 변수를 줄이고 분기 누락을 컴파일 단계에서 잡아준다.

```kotlin
enum class OrderStatus { PENDING, PAID, CANCELLED }

// when을 식으로 사용: enum의 모든 케이스를 반드시 처리해야 컴파일됨
fun describeStatus(status: OrderStatus): String = when (status) {
    OrderStatus.PENDING    -> "결제 대기"
    OrderStatus.PAID       -> "결제 완료"
    OrderStatus.CANCELLED  -> "취소됨"
}

// if를 식으로 사용: 별도 변수 없이 바로 반환
fun discountRate(userLevel: Int): Double = if (userLevel >= 5) 0.2 else 0.1
```

`when`을 식으로 쓰면 반환값이 강제되어 `else`를 빠뜨리거나 분기를 누락하는 실수를 컴파일 단계에서 잡아준다. `if` 역시 값을 반환하므로
단순 삼항 분기는 변수 없이 바로 쓸 수 있다.

<br>

# 문자열 템플릿: 연결 연산자 없이 값을 삽입한다
문자열 템플릿은 `$변수` 또는 `${식}` 형태로 문자열 안에 값을 직접 삽입한다. 메시지 생성, API 응답 포맷, 로깅 등 문자열이 필요한 곳 어디서든 쓸 수 있다.

```kotlin
data class User(val id: Long, val name: String, val grade: String)

fun greet(user: User): String {
    return "안녕하세요, ${user.name}님! 현재 등급은 ${user.grade}입니다."  // ${식}: 프로퍼티 접근
}

fun summarize(user: User, orderCount: Int): String {
    val suffix = if (orderCount >= 10) "우수 고객" else "일반 고객"
    return "[userId=${user.id}] $suffix (주문 횟수: $orderCount)"  // $변수: 단순 값 삽입
}
```

`$변수`로 단순 값을, `${식}`으로 프로퍼티 접근이나 조건식을 직접 삽입할 수 있다. 연결 연산자(`+`)를 쓰지 않아도 되므로 가독성이 높아진다.

<br>

# 반복과 범위: for, while, 컬렉션 연산
반복문은 여전히 필요하지만, 단순 필터링과 매핑은 컬렉션 연산이 더 읽기 쉽다.

코틀린의 `for`는 범위(`..`, `until`, `downTo`, `step`)와 함께 쓸 수 있다.

```kotlin
// 1부터 5까지 (양 끝 포함)
for (i in 1..5) print("$i ")           // 1 2 3 4 5

// 1부터 4까지 (끝 미포함)
for (i in 1 until 5) print("$i ")      // 1 2 3 4

// 5부터 1까지 역순으로, 2씩 감소
for (i in 5 downTo 1 step 2) print("$i ")  // 5 3 1

// 컬렉션 인덱스와 값을 함께 순회
val items = listOf("a", "b", "c")
for ((index, value) in items.withIndex()) {
    println("$index: $value")
}
```

`while`은 종료 조건을 직접 제어해야 할 때 쓴다.

```kotlin
var retryCount = 0
while (retryCount < 3) {
    println("재시도 $retryCount")
    retryCount++
}
```

단순 필터링과 변환은 컬렉션 연산이 더 읽기 쉽다.

```kotlin
data class OrderEvent(val orderId: Long, val status: String)

fun extractPaidOrderIds(events: List<OrderEvent>): List<Long> {
    return events
        .asSequence()           // 중간 컬렉션 생성 없이 지연 평가
        .filter { it.status == "PAID" }
        .map { it.orderId }
        .toList()               // 최종 연산 시점에 한 번만 순회
}
```

데이터가 많을 때는 `asSequence()`로 중간 컬렉션 할당을 줄일 수 있다. 할당과 GC 압박이 줄어 성능이 안정적이다.
다만 작은 리스트에 무조건 `Sequence`를 쓰는 것은 오히려 오버헤드가 될 수 있다. 데이터 크기와 호출 빈도를 기준으로 선택한다.

<br>

# in, is, as?, object, companion object
기초 문법을 넘어서려면 키워드를 "외우는 것"보다 "어디서 쓰는지"를 붙여보는 편이 빠르다. 코틀린 백엔드 코드에서 자주 등장하는 키워드를 한 번에 정리해보자.

```kotlin
sealed interface Principal
data class AdminPrincipal(val adminId: Long): Principal
data class UserPrincipal(val userId: Long): Principal

class AuthContext private constructor(
    private val allowedRoles: Set<String>
) {
    companion object {
        // companion object: 팩토리 메서드를 클래스 이름으로 호출 가능 (AuthContext.of(...))
        fun of(vararg roles: String): AuthContext = AuthContext(roles.toSet())
    }

    // in: 컬렉션 포함 여부 검사
    fun canAccess(role: String): Boolean = role in allowedRoles
}

fun extractUserId(principal: Principal): Long? {
    return when (principal) {
        is UserPrincipal  -> principal.userId   // is: 타입 검사 + 스마트 캐스트
        is AdminPrincipal -> principal.adminId
    }
}

fun parseCount(raw: Any): Int? {
    val asString = raw as? String ?: return null  // as?: 실패 시 null 반환 (ClassCastException 없음)
    return asString.toIntOrNull()
}
```

`in`은 포함 여부, `is`는 타입 검사, `as?`는 안전한 캐스팅에 사용한다. 그리고 `object`는 싱글턴이 필요할 때,
`companion object`는 팩토리 메서드나 상수 정의에 잘 맞는다.

<br>

# break, continue, 레이블 return: 반복 흐름을 세밀하게 제어한다
루프 자체를 피할 수 있으면 컬렉션 연산이 좋지만, 스트리밍 처리나 폴링처럼 상태 기반 반복이 필요한 경우도 많다.

```kotlin
fun pollMessages(maxRetry: Int): Boolean {
    var retry = 0
    while (retry < maxRetry) {
        val received = receiveFromQueue()
        if (received == null) {
            retry++
            continue  // 메시지 없음: 다음 반복으로 건너뜀
        }
        if (received == "STOP") break  // 종료 신호: 루프 탈출
        return true
    }
    return false
}

fun receiveFromQueue(): String? = null
```

`continue`는 다음 반복으로, `break`는 루프 종료에 쓴다.
고차 함수 안에서 조기 종료가 필요하면 아래처럼 레이블(`return@label`)을 사용하면 의도가 분명해진다.

```kotlin
fun hasNegative(values: List<Int>): Boolean {
    values.forEach loop@{ value ->
        if (value < 0) return@loop  // 레이블 return: forEach 람다만 빠져나옴 (함수 전체 종료 아님)
    }
    return values.any { it < 0 }
}
```

<br>

# try-catch-finally: 예외를 잡고, 분류하고, 정리한다
예외 처리도 키워드 역할을 분리하면 읽기 쉬워진다. `try`는 정상 경로, `catch`는 오류 분류, `finally`는 정리 작업에만 집중한다.

```kotlin
fun readRequiredEnv(name: String): String {
    try {
        val value = System.getenv(name)
        if (value.isNullOrBlank()) {
            throw IllegalStateException("missing env: $name")  // 정상 경로에서 조건 위반 시 명시적으로 던짐
        }
        return value
    } catch (t: Throwable) {
        val retryable = t is java.io.IOException  // is: 예외 타입으로 재시도 가능 여부 판단
        println("env read failed key=$name retryable=$retryable cause=${t.message}")
        throw t  // 예외를 잡아 로깅 후 다시 던짐
    } finally {
        println("env lookup finished key=$name")  // finally: 성공/실패 관계없이 항상 실행
    }
}
```

`finally`에서 무거운 I/O를 하면 실패 경로가 더 느려질 수 있다. 정리 작업만 두고, 로직은 별도 함수로 분리하는 편이 안전하다.

<br>

# 기초 문법을 끝냈다면 다음으로 볼 것
기초 문법을 모두 외우기보다, 읽기 쉬운 함수와 안전한 상태 관리에 집중하면 생산성이 빠르게 올라간다.
다음 글에서는 클래스, 생성자 검증, 인터페이스, sealed class, 제네릭, enum/value class를 묶어서 코틀린 타입 시스템을 어떻게 설계하면 좋은지 정리한다.

- <a href="/post/kotlin-class-and-type-system" target="_blank">다음글: "코틀린 클래스 설계와 타입 시스템 활용"</a>

<br>

# 참고
- <a href="https://kotlinlang.org/docs/basic-syntax.html" target="_blank" rel="nofollow">Kotlin Docs: Basic syntax</a>
- <a href="https://kotlinlang.org/docs/control-flow.html" target="_blank" rel="nofollow">Kotlin Docs: Control flow</a>
