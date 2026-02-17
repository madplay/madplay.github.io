---
layout: post
title: "코틀린 코루틴 개념과 실전 활용"
author: madplay
tags: kotlin coroutine suspend dispatcher flow async launch
description: "코루틴의 동작 원리, CoroutineScope, Dispatcher, async/await, 구조화된 동시성, Flow까지 코틀린 코루틴의 핵심 개념과 실전 패턴을 정리한다."
category: Java/Kotlin
date: "2025-02-05 08:18:00"
comments: true
---

# 코틀린 시리즈 목차
- <a href="/post/kotlin-basic-syntax" target="_blank" rel="nofollow">1. 코틀린 기초 문법 가이드</a>
- <a href="/post/kotlin-class-and-type-system" target="_blank" rel="nofollow">2. 코틀린 클래스 설계와 타입 시스템 활용</a>
- <a href="/post/kotlin-null-safety-and-functional" target="_blank" rel="nofollow">3. 코틀린 널 안정성과 컬렉션, 함수형 프로그래밍</a>
- **4. 코틀린 코루틴 개념과 실전 활용**
- <a href="/post/kotlin-error-handling-and-coroutine" target="_blank" rel="nofollow">5. 코틀린 예외 처리와 코루틴 기반 장애 대응</a>

<br>

# 코루틴은 비동기 코드를 동기 코드처럼 작성하게 해준다

스레드 기반의 비동기 처리는 콜백 중첩, 예외 전파, 자원 정리가 복잡하다. 코틀린 코루틴은 이 문제를 `suspend` 함수와 구조화된 동시성으로 해결한다.
이 글에서는 코루틴이 어떻게 동작하는지 개념부터 잡고, 실무에서 바로 쓸 수 있는 패턴까지 정리한다.

<br>

# 코루틴이란 무엇인가

코루틴은 실행을 일시 중단하고 나중에 재개할 수 있는 계산 단위다. 스레드처럼 OS 스케줄러가 아니라 코드 수준에서 제어한다.

스레드는 블로킹 I/O 중에 OS 스케줄러에 의해 대기 상태가 되며 스택 메모리를 점유한다. 반면 코루틴은 `suspend` 지점에서 스레드를 반납하고,
재개될 때 다시 스레드를 가져온다. 이 차이 때문에 수십만 개의 코루틴을 적은 스레드로 처리할 수 있다.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job1 = launch {
        println("코루틴1 시작 thread=${Thread.currentThread().name}")
        delay(500)  // 스레드를 블로킹하지 않고 코루틴만 일시 중단
        println("코루틴1 재개 thread=${Thread.currentThread().name}")
    }
    val job2 = launch {
        println("코루틴2 시작 thread=${Thread.currentThread().name}")
        delay(100)
        println("코루틴2 완료 thread=${Thread.currentThread().name}")  // 코루틴1의 delay 중에 먼저 완료됨
    }
    job1.join()
    job2.join()
}
```

`delay`는 스레드를 블로킹하지 않고 코루틴만 일시 중단한다. 코루틴1이 500ms 대기하는 동안 코루틴2가 같은 스레드에서 실행되어 100ms 만에 완료된다. 같은 스레드에서 여러 코루틴이 번갈아 실행되는 모습이다.

<br>

# suspend 함수: 중단 가능한 함수
`suspend` 키워드를 붙인 함수는 코루틴 안에서만 호출할 수 있다. 함수가 반환하기 전에 중단될 수 있다는 것을 컴파일러에 알리는 표시다.

```kotlin
import kotlinx.coroutines.*

// suspend: 코루틴 안에서만 호출 가능, 중단 지점이 있음을 컴파일러에 알림
suspend fun fetchUserName(userId: Long): String {
    delay(200)
    return "user-$userId"
}

suspend fun fetchUserScore(userId: Long): Int {
    delay(300)
    return 100
}

fun main() = runBlocking {
    val name = fetchUserName(1L)   // 200ms 대기
    val score = fetchUserScore(1L) // 300ms 대기 → 순차 실행이므로 총 500ms
    println("name=$name score=$score")
}
```

두 함수는 순차 실행되므로 총 500ms가 걸린다. 독립적인 호출이라면 `async`로 동시 실행할 수 있다(디스패처에 따라 병렬 실행될 수도 있다).

```kotlin
fun main() = runBlocking {
    val nameDeferred = async { fetchUserName(1L) }   // 200ms, 비동기 시작
    val scoreDeferred = async { fetchUserScore(1L) } // 300ms, 비동기 시작

    val name = nameDeferred.await()
    val score = scoreDeferred.await()
    println("name=$name score=$score")  // 동시 실행이므로 총 300ms (더 긴 쪽 기준)
}
```

`async`로 두 함수를 동시에 시작하고 `await()`로 결과를 받으면 총 소요시간은 더 긴 작업(약 300ms)에 수렴한다.

<br>

# CoroutineScope: 코루틴의 생명주기를 관리한다
코루틴은 반드시 `CoroutineScope` 안에서 시작된다. 스코프는 코루틴의 생명주기를 관리하고, 부모-자식 관계를 통해 취소와 예외를 전파한다.

```kotlin
import kotlinx.coroutines.*

class OrderService(private val scope: CoroutineScope) {
    fun processAsync(orderId: String): Job {
        // launch: 결과 없이 코루틴을 시작, Job 반환
        return scope.launch {
            println("processing orderId=$orderId")
            delay(100)
            println("done orderId=$orderId")
        }
    }
}

fun main() = runBlocking {
    // runBlocking의 this는 CoroutineScope이므로 그대로 전달 가능
    val service = OrderService(this)
    val job = service.processAsync("order-1")
    job.join()
}
```

`runBlocking`은 현재 스레드를 블로킹하며 코루틴 스코프를 제공한다.
`main()`이나 테스트 함수는 일반 함수라서 `suspend` 함수를 직접 호출할 수 없다. `runBlocking`을 쓰면 그 안에서 코루틴을 실행하고,
코루틴이 끝날 때까지 스레드를 블로킹해서 기다린다. 그래서 `main`이나 테스트에서 코루틴 세계로 들어가는 진입점 역할을 한다.

반면 웹 서버는 요청 생명주기를 관리하고, 프레임워크별로 코루틴을 사용할 수 있는 진입점을 제공한다.
예시로 Spring WebFlux는 `suspend` 함수를 지원하며, Spring MVC도 `@RestController`에서 `suspend` 함수를 쓸 수 있다.
이 진입점이 있으므로 `runBlocking`으로 스레드를 블로킹할 필요가 없다. 서비스 계층에서 `runBlocking`을 쓰면 요청 처리 스레드를 블로킹하게 되고,
스레드 풀이 제한된 상태에서 처리량이 떨어진다. 따라서 서비스 코드에서는 `runBlocking`을 쓰지 않는다.

<br>

# launch와 async: 결과가 필요한지로 구분한다
`launch`는 결과가 필요 없는 작업에, `async`는 결과를 반환해야 하는 작업에 쓴다.

```kotlin
import kotlinx.coroutines.*

suspend fun main() = coroutineScope {
    // launch: 결과 불필요, Job 반환
    val logJob = launch {
        delay(100)
        println("audit log saved")
    }

    // async: 결과 필요, Deferred<T> 반환 → await()로 값을 꺼냄
    val nameDeferred = async { fetchUserName(1L) }
    val scoreDeferred = async { fetchUserScore(1L) }

    // 두 async가 동시에 실행되므로 총 소요시간은 더 긴 작업(약 300ms)에 수렴
    val name = nameDeferred.await()
    val score = scoreDeferred.await()
    println("name=$name score=$score")

    logJob.join()
}

suspend fun fetchUserName(userId: Long): String {
    delay(200)
    return "user-$userId"
}

suspend fun fetchUserScore(userId: Long): Int {
    delay(300)
    return 100
}
```

`async` 두 개를 동시에 시작하면 동시 실행으로 진행되어 총 소요시간은 더 긴 작업(약 300ms)에 수렴한다.
`await()`는 결과가 준비될 때까지 코루틴을 일시 중단한다.

<br>

# Dispatcher: 코루틴이 실행될 스레드를 결정한다
`Dispatcher`는 코루틴이 어떤 스레드 또는 스레드 풀에서 실행될지 결정한다.

```kotlin
import kotlinx.coroutines.*

suspend fun loadData(): String = withContext(Dispatchers.IO) {
    // Dispatchers.IO: I/O 대기가 있는 작업 (DB, 네트워크, 파일)
    Thread.sleep(100)
    "data"
}

suspend fun processData(data: String): String = withContext(Dispatchers.Default) {
    // Dispatchers.Default: CPU 집약적인 계산, withContext 블록을 벗어나면 원래 Dispatcher로 복귀
    data.uppercase()
}

fun main() = runBlocking {
    val data = loadData()
    val result = processData(data)
    println("result=$result")
}
```

| Dispatcher               | 용도                                         |
|--------------------------|--------------------------------------------|
| `Dispatchers.IO`         | 네트워크, DB, 파일 I/O                           |
| `Dispatchers.Default`    | CPU 집약 연산 (정렬, 파싱 등)                       |
| `Dispatchers.Main`       | UI 스레드 업데이트 (Android/JavaFX 등 UI 프레임워크 전용) |
| `Dispatchers.Unconfined` | 특정 스레드에 고정하지 않음 (테스트 외 일반적으로 사용 자제)        |

`withContext`는 블록 안에서만 디스패처를 바꾸고 빠져나오면 원래 디스패처로 돌아온다.

<br>

# 구조화된 동시성: 부모가 취소되면 자식도 취소된다
구조화된 동시성이 없다면 `launch`로 시작한 코루틴이 어디서 실행되는지, 언제 끝나는지 추적하기 어렵다. 요청이 취소됐는데 코루틴이 계속 실행되거나,
예외가 발생했는데 일부 코루틴만 종료되는 자원 누수 문제가 생긴다. 코루틴은 반드시 특정 스코프 안에서 시작되고,
부모 스코프가 취소되면 그 안의 모든 자식 코루틴도 함께 취소된다.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val parentJob = launch {
        val child1 = launch {
            delay(1000)
            println("child1 완료")  // 부모가 먼저 취소되면 실행되지 않음
        }
        val child2 = launch {
            delay(500)
            println("child2 완료")  // 부모가 먼저 취소되면 실행되지 않음
        }
        delay(300)
        println("부모 취소")
        cancel()  // 부모 취소 → child1, child2도 함께 취소됨
    }
    parentJob.join()
    println("종료")
}
```

부모가 취소되면 실행 중이던 `child1`, `child2`도 함께 취소된다. 자원 누수 없이 정리된다.

<br>

# coroutineScope와 supervisorScope
`coroutineScope`는 자식 중 하나라도 실패하면 나머지 자식도 모두 취소한다. `supervisorScope`는 자식 하나가 실패해도 나머지 자식에게 영향을 주지 않는다.

`coroutineScope`를 쓰면 자식 하나의 실패가 전체로 전파된다.

```kotlin
import kotlinx.coroutines.*

suspend fun fetchWithCoroutineScope(): Pair<String?, String?> = try {
    coroutineScope {
        val nameDeferred = async {
            delay(100)
            "user-1"
        }
        val scoreDeferred = async {
            delay(50)
            throw IllegalStateException("score service unavailable")
        }
        // scoreDeferred 실패 → coroutineScope 전체 취소 → nameDeferred도 취소됨
        // 실패 원인을 명확히 보기 위해 실패 가능성이 있는 Deferred를 먼저 await
        scoreDeferred.await() to nameDeferred.await()
    }
} catch (e: IllegalStateException) {
    null to null  // 둘 다 결과를 얻지 못함
}
```

`coroutineScope`에서는 자식 하나가 실패하면 전체가 취소된다. 이때 어떤 예외를 먼저 관찰하는지는 `await` 순서에 따라 달라질 수 있다.
예를 들어 형제 코루틴을 먼저 `await`하면 `CancellationException`이 먼저 보일 수 있다.

`supervisorScope`를 쓰면 자식 하나가 실패해도 나머지는 계속 실행된다.

```kotlin
import kotlinx.coroutines.*

suspend fun fetchWithSupervisor(): Pair<String?, String?> = supervisorScope {
    // supervisorScope: 자식 하나가 실패해도 나머지 자식은 계속 실행
    val nameDeferred = async {
        delay(100)
        "user-1"
    }
    val scoreDeferred = async {
        delay(50)
        throw IllegalStateException("score service unavailable")
    }

    // runCatching으로 개별 실패를 처리, 실패 시 null 반환
    // CancellationException은 재시도/복구 대상이 아니라 취소 전파 신호이므로, 잡더라도 즉시 재던져야 함
    val name = runCatching { nameDeferred.await() }.getOrNull()
    val score = runCatching { scoreDeferred.await() }.getOrNull()
    name to score
}

fun main() = runBlocking {
    val (name, score) = fetchWithSupervisor()
    println("name=$name score=$score")  // name=user-1 score=null
}
```

점수 조회가 실패해도 이름 조회 결과는 정상적으로 받을 수 있다. 독립적인 외부 API를 동시에 호출할 때는 `supervisorScope`가 적합하고,
모든 결과가 함께 성공해야 의미 있는 경우에는 `coroutineScope`가 맞다.

<br>

# Job과 취소 처리
`Job`은 코루틴의 핸들이다. 취소, 완료 대기, 상태 확인에 사용한다.

```kotlin
import kotlinx.coroutines.*

suspend fun pollUntilReady(jobId: String): String {
    var attempt = 0
    while (true) {
        delay(500)  // 취소 신호가 오면 이 지점에서 CancellationException 발생
        attempt++
        println("polling jobId=$jobId attempt=$attempt")
        if (attempt >= 3) return "COMPLETED"
    }
}

fun main() = runBlocking {
    val job = launch {
        try {
            val result = pollUntilReady("job-1")
            println("result=$result")
        } catch (e: CancellationException) {
            println("취소됨: 정리 작업 수행")
            throw e  // 취소 신호는 재던져 전파해야 함 (삼키면 정상 완료처럼 보일 수 있음)
        }
    }

    delay(1200)
    job.cancel()
    job.join()
}
```

`CancellationException`은 코루틴 취소를 전달하는 제어 신호다. `catch`에서 잡았다면 정리 작업 후 다시 던져 취소 의미를 보존해야 한다.
삼켜버리면 상위에서는 취소 대신 정상 완료처럼 해석될 수 있다. 정리 과정에서 suspend 호출이 필요하면 `withContext(NonCancellable)` 안에서 수행한다.

<br>

# Flow: 비동기 데이터 스트림
`Flow`는 여러 값을 순차적으로 내보내는 비동기 스트림이다. `suspend` 함수가 단일 값을 반환한다면, `Flow`는 여러 값을 시간 순서대로 내보낸다.

`flow { }`로 만든 `Flow`는 cold stream이다. `collect`가 호출될 때마다 블록이 처음부터 다시 실행되고,
구독자가 없으면 아무것도 실행되지 않는다. 반면 `StateFlow`와 `SharedFlow`는 hot stream이다. `StateFlow`는 최신 상태를 항상 보유하고,
`SharedFlow`는 설정(`replay`, 버퍼)에 따라 여러 구독자에게 이벤트를 브로드캐스트한다.

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// flow { }: cold stream, collect가 호출될 때 실행 시작
fun orderEvents(orderId: String): Flow<String> = flow {
    emit("CREATED")  // 값을 하나씩 내보냄
    delay(100)
    emit("PAID")
    delay(100)
    emit("SHIPPED")
}

fun main() = runBlocking {
    orderEvents("order-1")
        .filter { it != "CREATED" }  // 중간 연산자: 스트림을 변환
        .collect { event ->          // 최종 연산자: 값을 소비, collect 호출 시점에 flow 실행
            println("event=$event")
        }
}
```

`flow { }` 블록 안의 `emit`이 값을 내보내고, `collect`가 값을 소비한다.
`filter`, `map`, `take` 같은 연산자를 체이닝해서 스트림을 변환할 수 있다.

<br>

# StateFlow와 SharedFlow
`StateFlow`는 항상 최신 상태를 가지며 초기값이 필요하다. `SharedFlow`는 여러 구독자에게 값을 브로드캐스트한다.

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class OrderStatusManager {
    // MutableStateFlow: 값 변경 가능, 외부에는 읽기 전용 StateFlow로 노출
    private val _status = MutableStateFlow("CREATED")
    val status: StateFlow<String> = _status.asStateFlow()

    fun update(newStatus: String) {
        _status.value = newStatus  // 값이 바뀌면 구독자에게 즉시 전달
    }
}

fun main() = runBlocking {
    val manager = OrderStatusManager()

    val job = launch {
        // 구독 시작 시 현재 값("CREATED")을 즉시 받음
        manager.status.collect { status ->
            println("status changed: $status")
        }
    }

    delay(100)
    manager.update("PAID")
    manager.update("PAID")  // equals 기준 동일 값이면 재방출되지 않음
    delay(100)
    manager.update("SHIPPED")
    delay(100)

    job.cancel()
}
```

`StateFlow`는 항상 현재 상태를 보유하며, 구독자가 연결되면 최신 값을 받는다. 같은 값을 다시 설정하면(`equals` 기준) 재방출되지 않는다.
`SharedFlow`는 초기값 없이 여러 구독자에게 이벤트를 브로드캐스트할 때 쓴다. `replay=0`이면 새 구독자는 과거 이벤트를 받지 못하고,
`replay=1`이면 최근 1개를 받을 수 있다.

기본 설정(`replay=0`, 추가 버퍼 없음)에서는 구독자가 없을 때 이벤트가 보관되지 않고,
버퍼 오버플로 정책을 `DROP_*`로 설정한 경우에는 이벤트 유실이 발생할 수 있다.
구독 시점에 항상 현재 값이 필요한지, 일회성 이벤트만 전달하면 되는지에 따라 `StateFlow`와 `SharedFlow`를 선택한다.

```kotlin
// SharedFlow: 일회성 이벤트(클릭, 알림 등) 전달에 적합
class EventEmitter {
    private val _events = MutableSharedFlow<String>()
    val events: SharedFlow<String> = _events.asSharedFlow()

    suspend fun emitEvent(event: String) {
        _events.emit(event)
    }
}
```

상태 관리에는 `StateFlow`, 일회성 이벤트 전달에는 `SharedFlow`가 적합하다.

<br>

# 코루틴 컨텍스트와 CoroutineScope 커스터마이징
실제 애플리케이션에서는 디스패처, 예외 핸들러, Job을 조합해서 스코프를 구성한다.

```kotlin
import kotlinx.coroutines.*

class PaymentProcessor {
    // CoroutineExceptionHandler: launch의 미처리 예외를 처리
    // async는 await 시점에 예외가 호출자에게 전달되므로 처리 방식이 다름
    private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
        println("uncaught exception cause=${throwable.message}")
    }

    private val scope = CoroutineScope(
        SupervisorJob() +       // 자식 하나 실패가 형제 코루틴으로 전파되지 않음 (단, 부모 스코프 취소 시 전체 취소)
        Dispatchers.IO +        // I/O 작업에 적합한 스레드 풀 (CPU 연산은 Dispatchers.Default 권장)
        exceptionHandler
    )

    fun processAsync(paymentId: String) {
        scope.launch {
            println("processing paymentId=$paymentId")
            delay(100)
            println("done paymentId=$paymentId")
        }
    }

    fun shutdown() {
        scope.cancel()  // 스코프 취소: 실행 중인 모든 코루틴 취소
    }
}

fun main() = runBlocking {
    val processor = PaymentProcessor()
    processor.processAsync("pay-1")
    processor.processAsync("pay-2")
    delay(300)
    processor.shutdown()
}
```

`SupervisorJob`을 루트 Job으로 쓰면 개별 코루틴이 실패해도 형제 코루틴까지 연쇄 취소되지 않는다.
다만 부모 스코프 자체가 취소되면 자식은 모두 취소된다. 서버 애플리케이션에서 백그라운드 작업을 관리할 때 일반적으로 이 구조를 사용하며,
컴포넌트 종료 시점에 `shutdown()`으로 스코프를 반드시 정리해야 누수를 막을 수 있다.

<br>

# 다음 글에서 다룰 내용
코루틴의 개념과 기본 사용법을 익혔다면, 다음 단계는 실패 상황을 어떻게 다루는지다.
다음 글에서는 예외 분류, 코루틴 타임아웃, 재시도 설계, `runCatching`을 활용한 장애 대응 전략을 정리한다.

- <a href="/post/kotlin-error-handling-and-coroutine" target="_blank">다음글: "코틀린 예외 처리와 코루틴 기반 장애 대응"</a>

<br>

# 참고
- <a href="https://kotlinlang.org/docs/coroutines-basics.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutines basics</a>
- <a href="https://kotlinlang.org/docs/coroutines-and-channels.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutines and channels</a>
- <a href="https://kotlinlang.org/docs/flow.html" target="_blank" rel="nofollow">Kotlin Docs: Asynchronous Flow</a>
- <a href="https://kotlinlang.org/docs/exception-handling.html" target="_blank" rel="nofollow">Kotlin Docs: Coroutine exceptions handling</a>
