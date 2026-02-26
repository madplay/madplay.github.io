---
layout: post
title: "코틀린 스코프 함수 비교: let, run, with, apply, also"
author: madplay
tags: kotlin scope-function let run with apply also null-safety
description: "let, run, with, apply, also의 수신 객체 참조 방식과 반환값 차이를 실무 예시로 비교하고, 언제 어떤 함수를 선택해야 하는지 기준을 정리한다."
category: Java/Kotlin
date: "2025-02-14 07:44:00"
comments: true
---

# 코틀린 스코프 함수, 왜 5개나 있을까

코틀린 표준 라이브러리에는 `let`, `run`, `with`, `apply`, `also`라는 스코프 함수 5개가 있다.
기능이 비슷해 보여서 아무거나 골라 쓰는 경우가 많지만, 수신 객체를 참조하는 방식과 반환값이 서로 달라 잘못 고르면 의도를 숨기는 코드가 된다.

이 글에서는 5가지 스코프 함수의 차이를 명확하게 정리하고, 어떤 상황에 어떤 함수를 선택해야 하는지 실무 예시와 함께 살펴본다.

<br>

# 핵심 차이 비교

5가지 함수는 두 가지 축으로 나뉜다.

- **수신 객체 참조 방식**: `this`(람다 수신자, 멤버 접근 시 생략 가능) vs `it`(람다 인자, `it` 또는 파라미터명으로 참조)
- **반환값**: 람다의 결과 vs 수신 객체 자신

| 함수      | 확장 함수 여부 | 수신 객체 참조 |  반환값  | 대표 용도               |
|---------|:--------:|:--------:|:-----:|---------------------|
| `let`   |    O     |   `it`   | 람다 결과 | null-safe 변환, 범위 제한 |
| `run`   |    O*    |  `this`  | 람다 결과 | 객체 초기화 + 결과 계산      |
| `with`  |    X     |  `this`  | 람다 결과 | 이미 있는 객체에 여러 연산 수행  |
| `apply` |    O     |  `this`  | 수신 객체 | 객체 설정/구성            |
| `also`  |    O     |   `it`   | 수신 객체 | 부수효과(로깅, 검증)        |

표의 `run` O*: 수신 객체가 있는 확장 함수 `T.run { }`와, 수신 객체가 없는 비확장 형태 `run { }` 두 가지가 있다.

`apply`와 `also`는 수신 객체를 반환하므로 체이닝에 적합하다.
`let`, `run`, `with`는 람다 결과를 반환하므로 변환이나 계산 결과가 필요할 때 쓴다.
스코프 함수는 모두 `inline` 함수라 람다 객체 할당 없이 인라인되며, 여기서는 주로 확장 함수 형태(`T.run`)를 기준으로 설명한다.

<br>

# let: null-safe 변환과 범위 제한

`let`은 수신 객체를 `it`으로 받아 람다 결과를 반환하는 확장 함수다.
`?.let`으로 null-safe 체인을 구성하거나, 특정 값을 좁은 스코프 안에서만 쓰고 싶을 때 사용한다.

```kotlin
data class RawSignupRequest(
    val email: String?,
    val nickname: String?,
    val referralCode: String?
)

// null-safe 변환: email이 null이 아닐 때만 블록 실행, 결과(String)를 반환
// takeIf: 조건을 만족하면 수신 객체를, 아니면 null을 반환 (let과 자주 조합됨)
// takeIf 내부의 it은 raw.trim().lowercase() 결과(수신 객체)를 가리킨다
fun extractEmail(request: RawSignupRequest): String? {
    return request.email?.let { raw ->
        raw.trim().lowercase().takeIf { it.contains("@") }
    }
}
```

`?.let` 이전의 null 체크를 블록 안으로 밀어넣어, 이후 코드에서 null 분기를 반복하지 않아도 된다.

```kotlin
// 범위 제한: buildKey()의 결과를 key 변수 없이 블록 안에서만 사용 (람다 반환값은 사용하지 않음)
fun storeIfAbsent(cache: MutableMap<String, String>, userId: Long, value: String) {
    buildKey(userId).let { key ->
        if (!cache.containsKey(key)) {
            cache[key] = value
        }
    }
}

fun buildKey(userId: Long): String = "user:$userId"
```

`it`은 명시적 이름이므로, 블록이 길어질 때 `let { raw -> ... }`처럼 파라미터 이름을 직접 붙이는 편이 읽기 쉽다.

<br>

## let을 피해야 할 때

중첩 `let`은 `it`이 무엇을 가리키는지 추적하기 어렵게 만든다.

```kotlin
// 피해야 할 패턴: 중첩 let으로 it의 대상이 불명확
fun bad(a: String?, b: String?): String? {
    return a?.let {
        b?.let {
            it + "combined" // 이 it은 b를 가리키지만 한눈에 알기 어려움
        }
    }
}

// 개선: 파라미터 이름을 명시하거나, 조기 반환으로 중첩 제거
fun good(a: String?, b: String?): String? {
    val trimmedA = a?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    val trimmedB = b?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    return trimmedA + trimmedB
}
```

<br>

# run: 수신 객체 멤버에 바로 접근하고 결과를 반환한다

`run`은 수신 객체를 `this`로 참조하고 람다 결과를 반환하는 확장 함수다.
`let`과 역할이 비슷하지만, `this`를 쓰므로 수신 객체의 멤버에 직접 접근할 때 더 자연스럽다.

```kotlin
data class ReportConfig(
    val title: String,
    val maxRows: Int,
    val includeHeader: Boolean
)

// run: 객체를 받아 여러 속성을 읽고 결과(String)를 반환
fun summarize(config: ReportConfig): String {
    return config.run {
        // this = config, 멤버에 직접 접근
        val headerMark = if (includeHeader) "[H]" else ""
        "$headerMark $title (max: $maxRows rows)"
    }
}
```

null-safe 체인에서 `?.run`으로 쓸 수도 있다.

```kotlin
// null-safe run: config가 null이 아닐 때만 블록 실행
fun buildTitle(config: ReportConfig?): String {
    return config?.run { "$title (${maxRows}행)" } ?: "기본 리포트"
}
```

비확장 `run`은 수신 객체 없이 표현식이 필요한 곳에서 여러 문장을 실행하고 결과를 반환할 때 쓴다.

```kotlin
// 비확장 run: 로컬 변수 스코프를 만들고 마지막 식을 반환
val hexRegex = run {
    val digits = "0-9"
    val hexDigits = "A-Fa-f"
    Regex("[$digits$hexDigits]+")
}
```

<br>

## let vs run 선택 기준

| 상황                            | 선택                     |
|-------------------------------|------------------------|
| 수신 객체를 변수명으로 구분해야 할 때         | `let`                  |
| 수신 객체 멤버에 `this.` 없이 바로 접근할 때 | `run`                  |
| null-safe 체인에서 결과를 반환할 때      | 둘 다 가능, `it` 필요 여부로 결정 |

<br>

# with: 이미 있는 객체에 여러 연산을 수행한다

`with`는 확장 함수가 아닌 일반 함수다. 객체를 첫 번째 인자로 받아 람다 결과를 반환한다.
`?.with`처럼 null-safe 체인에는 쓸 수 없다는 점이 `run`과의 핵심 차이다.
null-safe 상황에서는 `obj?.let { with(it) { ... } }`처럼 `let`과 조합해 같은 효과를 낼 수 있다.

```kotlin
data class UserProfile(
    val nickname: String,
    val timezone: String,
    val grade: String
)

// with: 이미 있는 profile 객체로부터 여러 속성을 읽어 결과를 만듦
fun describeProfile(profile: UserProfile): String {
    return with(profile) {
        // this = profile, 마지막 식이 반환값
        val gradeLabel = when (grade) {
            "VIP"  -> "VIP 등급"
            "GOLD" -> "골드 등급"
            else   -> "일반 등급"
        }
        "[$gradeLabel] $nickname (${timezone})"
    }
}
```

이미 널이 아님이 보장된 객체에 여러 속성을 읽고 결과를 조합할 때, `with`를 쓰면 반복적인 `profile.` 접근이 사라진다.

<br>

## run vs with 선택 기준

| 상황                                | 선택     |
|-----------------------------------|--------|
| null-safe 체인이 필요할 때               | `run`  |
| 이미 null이 아님이 보장된 객체에 여러 연산을 적용할 때 | `with` |
| 확장 함수 형태(`obj.run { }`)를 선호할 때    | `run`  |
| 일반 함수 형태(`with(obj) { }`)를 선호할 때  | `with` |

<br>

# apply: 객체를 설정하고 자기 자신을 반환한다

`apply`는 수신 객체를 `this`로 참조하고, 람다 실행 후 수신 객체 자신을 반환하는 확장 함수다.
객체를 생성한 직후 프로퍼티를 설정하는 객체 구성에 가장 잘 맞는다.

```kotlin
// apply에서 재할당이 필요한 프로퍼티는 var가 필요하다
data class NotificationPayload(
    var title: String = "",
    var body: String = "",
    var targetUserId: Long = 0L,
    var priority: String = "NORMAL"
)

fun buildPushPayload(userId: Long, message: String, isUrgent: Boolean): NotificationPayload {
    return NotificationPayload().apply {
        // this = NotificationPayload 인스턴스
        targetUserId = userId
        title        = if (isUrgent) "[긴급]" else "[알림]"
        body         = message
        priority     = if (isUrgent) "HIGH" else "NORMAL"
    }
}
```

`apply`는 수신 객체를 반환하므로, 이후 체이닝으로 `also`나 다른 처리를 이어 붙일 수 있다.

```kotlin
fun buildAndLogPayload(userId: Long, message: String): NotificationPayload {
    return buildPushPayload(userId, message, isUrgent = false)
        .also { payload ->
            // also: payload를 변경하지 않고 로깅 후 그대로 반환
            println("push payload built userId=${payload.targetUserId} priority=${payload.priority}")
        }
}
```

<br>

## apply 주의 사항

`apply` 블록 안에서는 `this`가 수신 객체를 가리킨다. 블록이 길어질수록 어떤 `this`인지 추적하기 어려워지므로,
설정 작업에만 집중하고 복잡한 분기나 외부 함수 호출은 블록 바깥으로 꺼내는 편이 낫다.
수신 객체가 중첩되는 경우에는 `this@Outer`처럼 라벨 참조를 써서 대상을 명확히 한다.

```kotlin
// 피해야 할 패턴: apply 안에서 복잡한 분기와 외부 서비스 호출 혼재
fun badApply(userId: Long): NotificationPayload {
    return NotificationPayload().apply {
        targetUserId = userId
        val userGrade = fetchUserGrade(userId)   // apply 안에서 외부 호출
        priority = if (userGrade == "VIP") "HIGH" else "NORMAL"
        title = buildTitle(userGrade)            // 또 다른 외부 호출
    }
}

// 개선: 의존하는 값을 먼저 계산하고 apply는 설정에만 집중
fun goodApply(userId: Long): NotificationPayload {
    val userGrade = fetchUserGrade(userId)
    val priority  = if (userGrade == "VIP") "HIGH" else "NORMAL"
    val title     = buildTitle(userGrade)

    return NotificationPayload().apply {
        this.targetUserId = userId
        this.priority     = priority
        this.title        = title
    }
}

fun fetchUserGrade(userId: Long): String = "NORMAL"
fun buildTitle(grade: String): String    = "[$grade] 알림"
```

<br>

# also: 부수효과를 분리하고 객체를 그대로 반환한다

`also`는 수신 객체를 `it`으로 참조하고, 람다 실행 후 수신 객체 자신을 반환하는 확장 함수다.
객체를 변경하지 않고 로깅, 검증, 디버깅 같은 부수효과만 수행하는 용도로 주로 권장된다.
기술적으로는 `also` 블록 안에서도 객체를 변경할 수 있지만, 의도 전달을 위해 관찰/로깅 용도로 제한하는 편이 좋다.

```kotlin
data class PaymentResult(
    val transactionId: String,
    val amount: Long,
    val status: String
)

fun processPayment(orderId: Long, amount: Long): PaymentResult {
    return executePayment(orderId, amount)
        .also { result ->
            // also: result를 변경하지 않고 감사 로그만 남김
            println("payment processed orderId=$orderId transactionId=${result.transactionId} status=${result.status}")
        }
        .also { result ->
            // 검증도 별도 also로 분리해 목적을 명확히 함
            check(result.status != "FAILED") { "payment failed transactionId=${result.transactionId}" }
        }
}

fun executePayment(orderId: Long, amount: Long): PaymentResult {
    return PaymentResult(
        transactionId = "txn-$orderId",
        amount        = amount,
        status        = "SUCCESS"
    )
}
```

체인 중간에 `also`를 끼워 넣으면 메인 흐름을 끊지 않고 감사 로그나 검증을 삽입할 수 있다.

<br>

## apply vs also 선택 기준

| 상황                            | 선택      |
|-------------------------------|---------|
| 수신 객체의 프로퍼티를 설정할 때            | `apply` |
| 수신 객체를 변경하지 않고 관찰하거나 로깅할 때    | `also`  |
| 수신 객체 멤버에 `this.` 없이 접근해야 할 때 | `apply` |
| 수신 객체를 `it`으로 명시적으로 참조해야 할 때  | `also`  |

<br>

# 실무 체이닝 패턴: 5가지를 조합한다

실무에서는 하나의 흐름에 여러 스코프 함수를 조합해 쓰는 경우가 많다.

```kotlin
data class OrderSummary(
    var orderId: Long   = 0L,
    var userId: Long    = 0L,
    var totalAmount: Long = 0L,
    var label: String   = ""
)

data class RawOrder(
    val orderId: Long,
    val userId: Long?,
    val items: List<Long>
)

fun buildOrderSummary(raw: RawOrder, priceMap: Map<Long, Long>): OrderSummary? {
    // let: userId가 null이면 전체 흐름 종료
    val userId = raw.userId?.let { id ->
        id.takeIf { it > 0 }
    } ?: return null

    return OrderSummary().apply {
        // apply: 값 설정에만 집중
        orderId     = raw.orderId
        this.userId = userId
        totalAmount = raw.items.sumOf { itemId -> priceMap[itemId] ?: 0L }
        label       = "주문 #${raw.orderId}"
    }.also { summary ->
        // also: 생성 후 로깅 (객체 변경 없음)
        println("order summary built orderId=${summary.orderId} total=${summary.totalAmount}")
    }
}
```

체이닝할 때 지켜야 할 규칙은 하나다: **2~3단계를 넘으면 별도 함수로 분리한다.** `this`와 `it`이 무엇을 가리키는지 추적하기 어려워지기 때문이다.

<br>

# null-safe 체인에서의 선택

null 처리와 스코프 함수를 조합할 때 자주 쓰는 패턴을 정리한다.

```kotlin
data class MemberInfo(val name: String, val phoneNumber: String?)

// null이면 전체 흐름을 일찍 끊는 패턴: ?: return
fun normalizePhone(member: MemberInfo): String? {
    val raw = member.phoneNumber ?: return null

    return raw
        .let { it.replace("-", "").replace(" ", "") }   // 변환: 결과를 다음 단계로 전달
        .run { if (length in 10..11) this else null }    // 검증: 조건 불만족 시 null 반환
}

// with는 null-safe 체인에 쓸 수 없으므로 non-null이 보장된 시점에 사용
fun formatMemberLabel(member: MemberInfo): String {
    val phone = normalizePhone(member) ?: "번호 없음"
    return with(member) {
        "$name ($phone)"
    }
}
```

`with`가 null-safe 체인(`?.with`)을 지원하지 않는다는 점은 한 번 익혀두면 실수를 줄일 수 있다.

<br>

# 5가지 함수 선택 흐름

```
수신 객체를 반환해야 하는가?
├─ YES
│   ├─ 객체 프로퍼티를 설정하는가?  → apply  (this, 수신 객체 반환)
│   └─ 부수효과만 수행하는가?        → also   (it,   수신 객체 반환)
│
└─ NO (람다 결과를 반환)
    ├─ null-safe 체인이 필요한가?
    │   ├─ YES, it으로 참조하고 싶다 → let    (it,   람다 결과 반환)
    │   └─ YES, this로 참조하고 싶다 → run    (this, 람다 결과 반환)
    ├─ non-null이 보장된 객체에 여러 연산을 적용하는가?
    │   ├─ 확장 함수 형태를 선호한다 → run    (this, 람다 결과 반환)
    │   └─ 객체를 인자로 전달하는 형태를 선호한다 → with (this, 람다 결과 반환)
```

<br>

# 마무리: 함수 선택 기준 한 줄 요약

| 함수      | 선택 기준                                    |
|---------|------------------------------------------|
| `let`   | null-safe 변환이 필요하거나, `it`으로 이름을 명시해야 할 때 |
| `run`   | 수신 객체 멤버에 바로 접근하면서 결과를 반환할 때             |
| `with`  | non-null이 보장된 객체에 여러 속성을 읽고 결과를 만들 때     |
| `apply` | 객체 생성 직후 프로퍼티를 설정하고 객체 자신을 반환할 때         |
| `also`  | 체인 중간에 로깅·검증을 삽입하고 객체를 그대로 흘려보낼 때        |

스코프 함수는 코드를 짧게 만들기 위한 도구가 아니다.
null 분기, 설정, 부수효과를 역할별로 분리해 의도를 명확하게 드러내는 것이 핵심이다.
선택 기준이 명확하면, 리뷰어가 코드를 처음 볼 때도 의도를 더 빠르게 파악할 수 있다.

<br>

# 참고
- <a href="https://kotlinlang.org/docs/scope-functions.html" target="_blank" rel="nofollow">Kotlin Docs: Scope functions</a>
