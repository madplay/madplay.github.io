---
layout: post
title: "코틀린 널 안정성과 컬렉션, 함수형 프로그래밍"
author: madplay
tags: kotlin null-safety collection lambda higher-order-function sequence fold
description: "널 안정성, 스코프 함수, 컬렉션 연산, 람다, 고차 함수, inline 키워드까지 코틀린 데이터 처리의 핵심 패턴을 정리한다."
category: Kotlin
date: "2025-01-27 10:00:00"
comments: true
---

# 코틀린 시리즈 목차
- <a href="/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. 코틀린 기초 문법 가이드</a>
- <a href="/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. 코틀린 클래스 설계와 타입 시스템 활용</a>
- **3. 코틀린 널 안정성과 컬렉션, 함수형 프로그래밍**
- <a href="/post/kotlin-coroutines" target="_blank" rel="nofollow">4. 코틀린 코루틴 개념과 실전 활용</a>
- <a href="/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. 코틀린 예외 처리와 코루틴 기반 장애 대응</a>

<br>

# 안전성과 간결함, 코틀린은 둘 다 언어 수준에서 지원한다

코틀린의 널 안정성, 컬렉션 연산, 람다와 고차 함수는 각각 독립적으로 보이지만 실무 코드에서는 항상 같이 쓰인다.
null을 안전하게 처리한 값을 컬렉션 연산으로 변환하고, 반복되는 흐름을 고차 함수로 추상화하는 방식이 자연스럽게 이어진다.
이 글에서는 세 가지를 묶어서 백엔드 서비스 코드에 바로 적용할 수 있는 기준으로 정리한다.

<br>

# 널 가능 타입과 안전한 호출
코틀린에서 `String?`는 널이 될 수 있고, `String`은 널이 될 수 없다.

```kotlin
fun normalizeNickname(nickname: String?): String {
    // ?. : null이면 다음 호출을 건너뜀, takeIf: 조건 불만족 시 null 반환, ?: 기본값 제공
    return nickname?.trim()?.takeIf { it.isNotEmpty() } ?: "anonymous"
}
```

`?.`와 `?:`를 조합하면 방어 코드가 간결해진다. 반대로 `!!`는 널이면 즉시 예외를 던지므로 정말 확신 가능한 지점에서만 써야 한다.
조기 반환 패턴은 깊어지는 널 체크를 단순하게 정리해준다.

```kotlin
data class PaymentCommand(
    val requestId: String,
    val userId: Long?,
    val amount: Long?
)

fun validate(command: PaymentCommand): Boolean {
    val userId = command.userId ?: return false  // null이면 즉시 false 반환, 이후 중첩 없이 진행
    val amount = command.amount ?: return false

    return userId > 0 && amount > 0
}
```

구조 분해는 필드 이름이 문맥을 충분히 제공하는 경우에만 쓴다. 의미가 모호해지면 객체 이름으로 직접 접근하는 편이 낫다.

<br>

# 스코프 함수: let, run, with, apply, also
스코프 함수는 코드 길이를 줄이기보다 null 분기와 부수효과를 분리할 때 효과가 있다.

`apply`는 수신 객체를 `this`로 참조하며, 설정 후 객체 자신을 반환한다.

```kotlin
// apply로 프로퍼티를 설정하려면 var가 필요하다
data class UserProfile(
    var nickname: String = "anonymous",
    var timezone: String = "UTC"
)

fun buildProfile(rawNickname: String?, rawTimezone: String?): UserProfile {
    return UserProfile().apply {
        // apply 블록 안에서 this는 UserProfile 인스턴스
        nickname = rawNickname?.trim()?.takeIf { it.isNotEmpty() } ?: nickname
        timezone = rawTimezone?.trim()?.takeUnless { it.isEmpty() } ?: timezone
    }
}
```

`also`는 수신 객체를 `it`으로 참조하며, 부수효과(로깅, 검증) 후 객체 자신을 반환한다.

```kotlin
fun buildProfileWithLog(rawNickname: String?, rawTimezone: String?): UserProfile {
    return buildProfile(rawNickname, rawTimezone).also {
        // also 블록: 객체를 변경하지 않고 로깅만 수행
        println("profile built nickname=${it.nickname} timezone=${it.timezone}")
    }
}
```

`with`는 이미 생성된 객체에 여러 연산을 수행하고 결과를 반환할 때 쓴다.

```kotlin
fun describeProfile(profile: UserProfile): String {
    return with(profile) {
        // with 블록 안에서 this는 profile, 마지막 식이 반환값
        "nickname=$nickname timezone=$timezone"
    }
}
```

`let`은 null-safe 체인에서 값을 변환할 때 쓴다. `run`은 `let`과 비슷하지만 수신 객체를 `this`로 참조한다.

```kotlin
fun normalizePhone(phone: String?): String? {
    return phone
        ?.let { it.replace("-", "") }               // null이 아닐 때만 변환
        ?.run { if (length >= 10) this else null }  // 길이 조건 충족 시 반환
}
```

한 체인에 스코프 함수를 너무 많이 섞으면 `this`와 `it`이 무엇을 가리키는지 추적하기 어려우니 2~3단계에서 끊는 편이 좋다.

참고로 5가지 함수의 차이는 아래 글에서 더 자세히 비교했다.
- <a href="/post/kotlin-scope-functions" target="_blank" rel="nofollow">참고: 코틀린 스코프 함수 비교</a>

<br>

# 컬렉션 연산과 Sequence
컬렉션 연산은 읽기 쉽지만 중간 리스트를 여러 번 만들 수 있다. 대량 데이터에서는 `Sequence`가 중간 할당을 줄여 GC 부담을 낮춘다.

```kotlin
data class OrderRow(val orderId: Long, val paid: Boolean, val amount: Long)

fun sumPaidAmount(rows: List<OrderRow>): Long {
    return rows
        .asSequence()       // 지연 평가 시작: 중간 컬렉션 생성 없이 파이프라인으로 처리
        .filter { it.paid }
        .map { it.amount }
        .sum()              // 최종 연산 시점에 한 번만 순회
}
```

단, 작은 데이터에서는 단순 `List` 연산이 더 빠를 수 있으니 데이터 크기와 호출 빈도를 기준으로 선택한다.
컬렉션은 읽기 전용 인터페이스를 기본으로 쓴다. `Set`을 쓰면 포함 여부 확인이 평균 O(1)이어서 `List`의 선형 탐색보다 효율적이다.

<br>

# mapNotNull, associateBy, groupBy로 조회 비용을 줄인다
컬렉션을 단순 순회하는 것과 키 기반 조회용 구조로 바꾸는 것은 비용이 다르다. 조회가 반복된다면 미리 인덱스를 만드는 편이 유리하다.

```kotlin
data class ProductRow(
    val productId: Long,
    val category: String?,
    val price: Long
)

fun indexProducts(rows: List<ProductRow>): Map<Long, ProductRow> {
    return rows.associateBy { it.productId }  // 키 충돌 시 마지막 값이 남음
}

fun categoryCount(rows: List<ProductRow>): Map<String, Int> {
    return rows
        .mapNotNull { it.category }  // null인 category 제거
        .groupingBy { it }
        .eachCount()                 // 각 카테고리 등장 횟수 집계
}
```

`associateBy`는 키 충돌 시 마지막 값이 남는다는 점을 알고 써야 한다. 중복 데이터가 의미 있는 도메인이라면 `groupBy`가 더 맞다.

<br>

# 람다와 멤버 참조
람다는 동작을 전달할 때 쓰고, 멤버 참조는 이미 있는 함수를 전달할 때 쓴다.

```kotlin
data class User(val id: Long, val name: String)

// 멤버 참조: User::name 은 { user -> user.name } 람다와 동일하지만 더 간결
val names = listOf(User(1, "kim"), User(2, "lee"))
    .map(User::name)
```

짧은 변환은 멤버 참조가 더 읽기 쉽다. 복잡한 분기가 들어가면 람다 블록이 낫다. 하나의 함수 안에서만 쓰는 보조 로직은 지역 함수가 깔끔하다.

```kotlin
fun calculateDiscountedAmount(amount: Long, grade: String): Long {
    // 지역 함수: 이 함수 안에서만 쓰이는 보조 로직을 외부에 노출하지 않음
    fun discountRate(targetGrade: String): Double = when (targetGrade) {
        "VIP" -> 0.2
        "GOLD" -> 0.1
        else -> 0.0
    }

    return (amount * (1 - discountRate(grade))).toLong()
}
```

<br>

# 고차 함수로 공통 정책을 모은다
고차 함수는 함수를 인자로 받거나 반환하는 함수다. 로깅, 측정, 재시도처럼 여러 서비스 메서드에 반복되는 흐름이 있을 때,
고차 함수로 공통 부분을 한 곳에 모으고 달라지는 비즈니스 로직만 람다로 전달할 수 있다.

아래처럼 서비스 메서드마다 같은 로그 코드가 반복된다면 변경 시 빠뜨리거나 형식이 달라지는 문제가 생긴다.

```kotlin
// 반복되는 패턴: 모든 서비스 메서드에 동일한 로그 코드가 복사됨
fun approvePayment(requestId: String): String {
    val start = System.currentTimeMillis()  // 로그마다 직접 시간 측정
    return try {
        val result = "approved"  // 실제 비즈니스 로직은 이 한 줄뿐
        println("action=approve requestId=$requestId result=success elapsedMs=${System.currentTimeMillis() - start}")
        result
    } catch (t: Throwable) {
        println("action=approve requestId=$requestId result=failure cause=${t.message}")
        throw t
    }
}
```

고차 함수로 공통 부분을 분리하면 서비스 메서드는 비즈니스 로직만 담게 된다.

```kotlin
// 고차 함수: block을 인자로 받아 실행 전후에 공통 로직(로깅)을 끼워 넣음
fun <T> withLogging(
    requestId: String,
    action: String,
    block: () -> T
): T {
    val start = System.currentTimeMillis()
    return try {
        block().also {
            val elapsed = System.currentTimeMillis() - start
            println("action=$action requestId=$requestId result=success elapsedMs=$elapsed")
        }
    } catch (t: Throwable) {
        val elapsed = System.currentTimeMillis() - start
        println("action=$action requestId=$requestId result=failure elapsedMs=$elapsed cause=${t.message}")
        throw t  // 예외를 잡아 로깅 후 다시 던져 호출부에 전파
    }
}

// 호출부: 비즈니스 로직만 람다로 전달, 로깅/측정은 withLogging이 처리
fun approvePayment(requestId: String): String {
    return withLogging(requestId, "approve") {
        "approved"  // 람다 안에는 핵심 로직만 남음
    }
}
```

로깅 형식을 바꾸거나 측정 방식을 수정할 때 `withLogging` 한 곳만 고치면 된다.

<br>

# inline, noinline, crossinline을 성능 포인트로 이해한다
고차 함수에서는 호출 형태에 따라 람다 객체/호출 비용이 생길 수 있고, 호출이 매우 잦은 경로에서는 이 비용이 누적될 수 있다.
`inline` 키워드를 붙이면 컴파일러가 함수 본문과 람다를 호출 지점에 직접 삽입해 이런 오버헤드를 줄일 수 있다.

```kotlin
// inline: 호출 지점에 함수 본문이 복사되어 람다 호출 오버헤드를 줄일 수 있음
inline fun <T> measureMillis(action: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = action()
    return result to (System.currentTimeMillis() - start)
}
```

`inline` 함수의 람다 안에서는 `return`을 쓰면 람다를 감싼 외부 함수까지 종료시킬 수 있다. 이를 non-local return이라 한다.

```kotlin
inline fun runAction(block: () -> Unit) {
    block()
}

fun example() {
    runAction {
        return  // non-local return: example() 함수 자체가 종료됨
    }
    println("이 줄은 실행되지 않음")
}
```

람다가 다른 스레드나 다른 람다 안에서 나중에 호출되는 경우 non-local return을 허용하면 이미 종료된 외부 함수로 제어가 넘어가는 문제가 생긴다.
`crossinline`은 람다가 다른 실행 컨텍스트(중첩 람다, 객체 표현식, 비동기 콜백 등)에서 호출될 수 있을 때 non-local return을 금지한다.

```kotlin
inline fun repeatUntil(
    max: Int,
    crossinline action: (Int) -> Boolean  // non-local return 금지: action이 별도 실행 컨텍스트에서 호출될 수 있는 경우 사용
): Boolean {
    for (attempt in 1..max) {
        if (action(attempt)) return true
    }
    return false
}
```

`noinline`은 인라인 함수의 특정 람다 파라미터만 인라인을 적용하지 않을 때 쓴다. 람다를 변수에 저장하거나 다른 함수에 전달해야 할 때 필요하다.

```kotlin
inline fun useLogger(
    noinline logger: (String) -> Unit,  // 인라인 제외: 변수로 저장하거나 다른 함수에 전달 가능
    action: () -> Unit
) {
    logger("start")
    action()
    logger("end")
}
```

`inline`을 무조건 붙이기보다 호출 빈도가 높고 함수 본문이 작을 때 효과적이다. 코드가 크면 바이트코드 증가로 오히려 성능이 나빠질 수 있다.

<br>

# fold, reduce, typealias로 의도를 명확하게 만든다
누적 상태가 복잡해지면 `fold`가 `sumOf`보다 의도를 더 잘 드러낸다.

```kotlin
typealias AmountByUser = Map<Long, Long>  // 타입에 도메인 이름을 부여해 가독성 향상

data class CheckoutEvent(
    val userId: Long,
    val amount: Long
)

fun accumulate(events: List<CheckoutEvent>): AmountByUser {
    // fold: 초기값(빈 맵)에서 시작해 각 이벤트를 누적
    return events.fold(mutableMapOf<Long, Long>()) { acc, event ->
        acc[event.userId] = (acc[event.userId] ?: 0L) + event.amount
        acc
    }
}

fun maxAmount(events: List<CheckoutEvent>): Long? {
    // maxOrNull: 빈 컬렉션에서 예외 없이 null 반환 (reduce는 빈 컬렉션에서 예외 발생)
    return events.maxOfOrNull { it.amount }
}
```

`fold`는 초기값을 지정하므로 빈 컬렉션에서도 안전하다. `reduce`는 초기값 없이 첫 번째 원소부터 시작하므로 빈 컬렉션에서 예외가 발생한다.
최댓값처럼 단순한 집계는 `maxOfOrNull`이 더 안전하고 의도가 명확하다. `typealias`는 타입에 도메인 이름을 붙여 가독성을 높인다.

<br>

# 널 안정성, 컬렉션, 함수형을 같이 지킬 기준
null 분기를 조기에 제거하고, 컬렉션 연산을 의도 중심으로 작성하며,
반복되는 흐름을 고차 함수로 추상화하는 세 가지를 같이 지키면 서비스 코드의 복잡도가 뚜렷하게 줄어든다.
다음 글에서는 코루틴의 동작 원리, CoroutineScope, Dispatcher, async/await, Flow를 중심으로 코틀린 코루틴 개념과 실전 활용을 정리한다.

- <a href="/post/kotlin-coroutines" target="_blank">다음글: "코틀린 코루틴 개념과 실전 활용"</a>

<br>

# 참고
- <a href="https://kotlinlang.org/docs/null-safety.html" target="_blank" rel="nofollow">Kotlin Docs: Null safety</a>
- <a href="https://kotlinlang.org/docs/collection-operations.html" target="_blank" rel="nofollow">Kotlin Docs: Collection operations overview</a>
- <a href="https://kotlinlang.org/docs/lambdas.html" target="_blank" rel="nofollow">Kotlin Docs: Lambdas</a>
- <a href="https://kotlinlang.org/docs/sequences.html" target="_blank" rel="nofollow">Kotlin Docs: Sequences</a>
