---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 80. Prefer executors, tasks, and streams to threads"
category: Java
date: "2019-10-03 00:52:12"
comments: true
---

# 실행자 프레임워크
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

<br/>

# ThreadPool 종류
`Executors.newCachedThreadPool`은 가벼운 프로그램을 실행하는 서버에 적합하다. 요청받은 태스크를 큐에 쌓지 않고 바로 처리하며 사용 가능한
스레드가 없다면 즉시 스레드를 새로 생성항 처리한다. 서버가 무겁다면 CPU 이용률이 100%로 치닫고 새로운 태스크가 도착할 때마다 다른 스레드를 생성하며
상황이 더 악화될 것이다.

따라서 무거운 프로덕션 서버에는 `Executors.newFixedThreadPool`을 선택하여 스레드 개수를 고정하는 것이 좋다.

<br/>

# 스레드를 직접 다루지 말자
작업 큐를 직접 만들거나 스레드를 직접 다루는 것도 일반적으로 삼가야 한다. 스레드를 직접 다루지말고 실행자 프레임워크를 이용하자.
그러면 작업 단위와 실행 매커니즘을 분리할 수 있는다. 작업 단위는 `Runnable`과 `Callable`로 나눌 수 있다.
Callable은 Runnable과 비슷하지만 값을 반환하고 임의의 예외를 던질 수 있다.

자바 7부터 실행자 프레임워크는 **포크-조인(fork-join) 태스크를 지원**하도록 확장됐다. ForkJoinTask의 인스턴스는 작은 하위 태스크로 나뉠 수 있고
ForkJoinPool을 구성하는 스레드들이 이 태스크들을 처리하며, 일을 먼저 끝낸 스레드가 다른 스레드의 남은 태스크를 가져와 대신 처리할 수도 있다.

이렇게 하여 최대한의 CPU 활용을 뽑아내어 높은 처리량과 낮은 지연시간을 달성한다. 병렬 스트림도 이러한 ForkJoinPool을 이용하여 구현되어 있다.