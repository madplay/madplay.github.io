---
layout:   post
title:    "[이펙티브 자바 3판] 11장. 동시성"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter11: Concurrency"
category: Java
date: "2019-09-27 23:25:42"
comments: true
---

# 목차
- <a href="#아이템-78-공유-중인-가변-데이터는-동기화해-사용하라">아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라</a>
- <a href="#아이템-79-과도한-동기화는-피하라">아이템 79. 과도한 동기화는 피하라</a>
- <a href="#아이템-80-스레드보다는-실행자-태스크-스트림을-애용하라">아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라</a>
- <a href="#아이템-81-wait와-notify보다는-동시성-유틸리티를-애용하라">아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라</a>
- <a href="#아이템-82-스레드-안전성-수준을-문서화하라">아이템 82. 스레드 안전성 수준을 문서화하라</a>
- <a href="#아이템-83-지연-초기화는-신중히-사용하라">아이템 83. 지연 초기화는 신중히 사용하라</a>
- <a href="#아이템-84-프로그램의-동작을-스레드-스케줄러에-기대지-말라">아이템 84. 프로그램의 동작을 스레드 스케줄러에 기대지 말라</a>

<br/>

# 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라
> Synchronize access to shared mutable data

여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓸 때는 항상 동기화해야 한다. 그렇지 않으면 의도하지 않은 값을 읽게 될 수 있다.

- <a href="/post/synchronize-access-to-shared-mutable-data" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라</a>

<div class="post_caption">여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓰는 동작은 반드시 동기화하자.</div>

<br/>

# 아이템 79. 과도한 동기화는 피하라
> Avoid excessive synchronization

동기화를 하지 않으면 문제가 된다. 하지만 과도한 동기화도 적지 않은 문제가 된다. 성능을 떨어뜨리고, 교착 상태에 빠뜨리고, 심지어는 예측할 수 없는
결과를 만들기도 한다.

- <a href="/post/avoid-excessive-synchronization" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 79. 과도한 동기화는 피하라</a>

<div class="post_caption">동기화 메서드나 블록 안에서는 클라이언트에게 제어를 양도해선 안 된다.</div>

<br/>

# 아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라
> Prefer executors, tasks, and streams to threads

## 실행자 프레임워크
`java.util.concurrent` 패키지에는 인터페이스 기반의 유연한 태스크 실행 기능을 담은 실행자 프레임워크(Executor Framework)가 있다.
과거에는 단순한 작업 큐(work queue)를 만들기 위해서 수많은 코드를 작성해야 했는데, 이제는 아래와 같이 간단하게 작업 큐를 생성할 수 있다.

```java
// 큐를 생성한다.
ExecutorService exec = Executors.newSingleThreadExecutor();

// 태스크 실행
exec.execute(runnable);

// 실행자 종료
exec.shutdown();
```

실행자 프레임워크는 아래와 같은 주요 기능을 가지고 있다.

- 특정 태스크가 완료되기를 기다릴 수 있다. `submit().get()`

```java
ExecutorService exec = Executors.newSingleThreadExecutor();
exec.submit(()  -> s.removeObserver(this)).get(); // 끝날 때까지 기다린다.
```
- 태스크 모음 중에서 어느 하나(`invokeAny`) 혹은 모든 태스크(`invokeAll`)가 완료되는 것을 기다릴 수 있다.

```java
List<Future<String>> futures = exec.invokeAll(tasks);
System.out.println("All Tasks done");

exec.invokeAny(tasks);
System.out.println("Any Task done");
```

- 실행자 서비스가 종료하기를 기다린다. `awaitTermination`

```java
Future<String> future = exec.submit(task);
exec.awaitTermination(10, TimeUnit.SECONDS);
```

- 완료된 태스크들의 결과를 차례로 받는다. `ExecutorCompletionService`

```java
final int MAX_SIZE = 3;
ExecutorService executorService = Executors.newFixedThreadPool(MAX_SIZE);
ExecutorCompletionService<String> executorCompletionService = new ExecutorCompletionService<>(executorService);

List<Future<String>> futures = new ArrayList<>();
futures.add(executorCompletionService.submit(() -> "madplay"));
futures.add(executorCompletionService.submit(() -> "kimtaeng"));
futures.add(executorCompletionService.submit(() -> "hello"));

for (int loopCount = 0; loopCount < MAX_SIZE; loopCount++) {
    try {
        String result = executorCompletionService.take().get();
        System.out.println(result);
    } catch (InterruptedException e) {
        //
    } catch (ExecutionException e) {
        //
    }
}
executorService.shutdown();
```

- 태스크를 특정 시간에 혹은 주기적으로 실행하게 한다. `ScheduledThreadPoolExecutor`

```java
ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(1);

executor.scheduleAtFixedRate(() -> {
    System.out.println(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .format(LocalDateTime.now()));
}, 0, 2, TimeUnit.SECONDS);

// 2019-09-30 23:11:22
// 2019-09-30 23:11:24
// 2019-09-30 23:11:26
// 2019-09-30 23:11:28
// ...
```

## ThreadPool 종류
`Executors.newCachedThreadPool`은 가벼운 프로그램을 실행하는 서버에 적합하다. 요청받은 태스크를 큐에 쌓지 않고 바로 처리하며 사용 가능한
스레드가 없다면 즉시 스레드를 새로 생성항 처리한다. 서버가 무겁다면 CPU 이용률이 100%로 치닫고 새로운 태스크가 도착할 때마다 다른 스레드를 생성하며
상황이 더 악화될 것이다.

따라서 무거운 프로덕션 서버에는 `Executors.newFixedThreadPool`을 선택하여 스레드 개수를 고정하는 것이 좋다.

## 스레드를 직접 다루지 말자
작업 큐를 직접 만들거나 스레드를 직접 다루는 것도 일반적으로 삼가야 한다. 스레드를 직접 다루지말고 실행자 프레임워크를 이용하자.
그러면 작업 단위와 실행 매커니즘을 분리할 수 있는다. 작업 단위는 `Runnable`과 `Callable`로 나눌 수 있다.
Callable은 Runnable과 비슷하지만 값을 반환하고 임의의 예외를 던질 수 있다.

자바 7부터 실행자 프레임워크는 **포크-조인(fork-join) 태스크를 지원**하도록 확장됐다. ForkJoinTask의 인스턴스는 작은 하위 태스크로 나뉠 수 있고
ForkJoinPool을 구성하는 스레드들이 이 태스크들을 처리하며, 일을 먼저 끝낸 스레드가 다른 스레드의 남은 태스크를 가져와 대신 처리할 수도 있다.
이렇게 하여 최대한의 CPU 활용을 뽑아내어 높은 처리량과 낮은 지연시간을 달성한다. 병렬 스트림도 이러한 ForkJoinPool을 이용하여 구현되어 있다.

<div class="post_caption">스레드를 직접 다루지말고 실행자 프레임워크를 사용하자.</div>

<br/>

# 아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라
> Prefer concurrency utilities to wait and notify

이제는 `wait`와 `notify` 보다 더 고수준이며 편리한 동시성 유틸리를 사용하자. `java.util.concurrent` 패키지의 고수준 유틸리티는 크게
실행자 프레임워크, 동시성 컬렉션, 동기화 장치로 나눌 수 있다. 실행자 프레임워크는 앞선 '아이템 80'의 설명으로 대체한다.

## 동시성 컬렉션
`List`, `Queue`, `Map` 같은 표준 컬렉션 인터페이스에 동시성을 추가한 것이다. 높은 동시성을 위해 동기화를 내부에서 수행한다.
동시성을 무력화하는 것이 불가능하며, 외부에서 락(Lock)을 걸면 오히려 속도가 더 느려진다.

## 상태 의존적 메서드
동시성 컬렉션의 동시성을 무력화하지 못하기 때문에 여러 메서드를 원자적으로 묶어 호출하는 것도 못한다. 그래서 여러 동작을 하나의 원자적 동작으로
묶는 **상태 의존적 메서드**가 추가되었다. 몇몇 메서드는 매우 유용하여 일반 컬렉션 인터페이스의 디폴트 메서드 형태로 추가되었다.

예를 들면 `putIfAbsent`는 Map의 디폴트 메서드인데 인자로 넘겨진 key가 없을 때 value를 추가한다. 기존 값이 있으면 그 값을 반환하고
없는 경우에는 null을 반환한다. String의 `intern` 메서드를 아래와 같이 흉내를 낼 수 있다.

```java
private static final ConcurrentMap<String, String> map =
        new ConcurrentHashMap<>();

public static String intern(String s) {
    String result = map.get(s);
    if (result == null) {
        result = map.putIfAbsent(s, s);
        if (result == null) {
            result = s;
        }
    }
    return result;
}
```

동기화한 컬렉션보다 동시성 컬렉션을 사용해야 한다. 예를 들어 Collections의 `synchronizedMap`보다는 `ConcurrentHashMap`을 사용하는 것이
훨씬 좋다. 동기화된 맵을 동시성 맵으로 교체하는 것 하나만으로 성능이 개선될 수 있다.

## 동기화 장치
스레드가 다른 스레드를 기다릴 수 있게 하여 서로의 작업을 조율할 수 있도록 해준다. 대표적인 동기화 장치로는 `CountDownLatch`와 `Semaphore`가 있으며
`CyclicBarrier`와 `Exchanger`도 있다. 가장 강력한 동기화 장치로는 `Phaser`가 있다.

`CountDownLatch`는 하나 이상의 스레드가 또 다른 하나 이상의 스레드 작업이 끝날 때까지 기다린다. 생성자 인자로 받는 정수값은 래치의 `countdown`
메서드를 몇 번 호출해야 대기하고 있는 스레드들을 깨우는지 결정한다.

예를 들어 어떤 동작들을 동시에 시작해 모두 완료하기까지의 시간을 재는 코드를 아래와 같이 작성할 수 있다.

```java
public class CountDownLatchTest {
    public static void main(String[] args) {

        ExecutorService executorService = Executors.newFixedThreadPool(5);
        try {
            long result = time(executorService, 3,
                    () -> System.out.println("hello"));
            System.out.println(result);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            executorService.shutdown();
        }
    }

    public static long time(Executor executor, int concurrency,
                            Runnable action) throws InterruptedException {
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);

        for (int i = 0; i < concurrency; i++) {
            executor.execute(() -> {
                // 타이머에게 준비가 됐음을 알린다.
                ready.countDown();
                try {
                    // 모든 작업자 스레드가 준비될 때까지 기다린다.
                    start.await();
                    action.run();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    // 타이머에게 작업을 마쳤음을 알린다.
                    done.countDown();
                }
            });
        }

        ready.await(); // 모든 작업자가 준비될 때까지 기다린다.
        long startNanos = System.nanoTime();
        start.countDown(); // 작업자들을 깨운다.
        done.await(); // 모든 작업자가 일을 끝마치기를 기다린다.
        return System.nanoTime() - startNanos;
    }
}
```

위 코드에서 executor는 concurrency 매개변수로 지정한 값만큼의 스레드를 생성할 수 있어야 한다. 그렇지 않으면 메서드 수행이 끝나지 않는데 이를
스레드 기아 교착 상태라고 한다. 또, 시간을 잴 때는 시스템 시간과 무관한 `System.nanoTime`을 사용하는 것이 더 정확하다.

## wait와 notify 메서드
새로운 코드라면 `wait`, `notify`가 아닌 동시성 유틸리티를 사용해야 한다. 하지만 사용할 수밖에 없는 상황이라면 반드시 동기화 영역 안에서
사용해야 하며, 항상 반복문 안에서 사용해야 한다.

```java
synchronized (obj) {
    while (조건이 충족되지 않았다) {
        obj.wait(); // 락을 놓고, 깨어나면 다시 잡는다.
    }

    ... // 조건이 충족됐을 때의 동작을 수행한다.
}
```
반복문은 `wait` 호출 전후로 조건이 만족하는지를 검사하는 역할을 한다. 대기 전에 조건을 검사하여 조건이 충족되었다면 `wait`를 건너뛰게 한 것은
**응답 불가** 상태를 예방하는 조치다. 만약 조건이 이미 충족되었는데 스레드가 `notify` 또는 `notifyAll` 메서드로 먼저 호출한 후 대기 상태로 빠지면,
그 스레드를 다시 깨우지 못할 수 있다.

한편, 대기 후에 조건을 검사하여 조건을 충족하지 않았을 때 다시 대기하게 하는 것은 잘못된 값을 계산하는 **안전 실패**를 막기 위한 조치다.
그런데 조건이 만족되지 않아도 스레드가 깨어날 수 있는 상황이 있다.

- `notify`를 호출하여 대기 중인 스레드가 깨어나는 사이에 다른 스레드가 락을 거는 경우
- 조건이 만족되지 않았지만 실수 혹은 악의적으로 `notify`를 호출하는 경우
- 대기 중인 스레드 중 일부만 조건을 충족해도 `notifyAll`로 모든 스레드를 깨우는 경우
- 대기 중인 스레드가 드물게 `notify` 없이 깨어나는 경우. 허위 각성(spurious wakeup)이라고 한다.

일반적으로 `notify`보다는 `notifyAll`을 사용하는 것이 안전하며, `wait`는 항상 `while`문 내부에서 호출하도록 해야 한다.

<div class="post_caption">wait와 notify 메서드가 아닌 동시성 유틸리티를 사용하자.</div>

<br/>

# 아이템 82. 스레드 안전성 수준을 문서화하라
> Document thread safety

`synchronized`는 문서화와 관련이 없다. 조건부 스레드 안전 클래스는 메서드를 어떤 순서로 호출할 때 외부 동기화가 필요하며, 또 어떤 락을 얻어야 하는지
클라이언트가 알 수 있어야 한다. 무조건적 스레드 안전 클래스를 작성할 때는 비공개 락 객체를 사용해야 한다.

- <a href="/post/document-thread-safety" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 82. 스레드 안전성 수준을 문서화하라</a>

<div class="post_caption">스레드 안전성 정보를 문서화해야 한다.</div>

<br/>

# 아이템 83. 지연 초기화는 신중히 사용하라
> Use lazy initialization judiciously

<br/>

# 아이템 84. 프로그램의 동작을 스레드 스케줄러에 기대지 말라
> Don’t depend on the thread scheduler