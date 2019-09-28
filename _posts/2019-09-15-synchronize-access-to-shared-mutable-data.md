---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 78. Synchronize access to shared mutable data" 
category: Java
date: "2019-09-15 22:19:29"
comments: true
---

# synchronized 키워드
메서드나 블록을 한 스레드가 수행하도록 보장하려면 `synchronized` 키워드를 사용하면 된다. 동기화를 제대로 사용하면 어떤 메서드도 객체의 상태가
일관되지 않은 순간을 볼 수 없다. 동기화된 메서드나 블록에 들어간 스레드가 같은 락의 보호하에 수행된 모든 이전 수정의 최종 결과를 같게 한다.
싱글 스레드 기반 프로그램이라면 동기화를 고려하지 않아도 되지만 멀티 스레드 기반이라면 객체를 공유할 때 동기화를 고민해야 한다.

<br/>

# 원자적(atomic)
자바 언어의 명세상으로 long과 double 를 제외한 변수를 읽고 쓰는 것은 원자적이다. 즉, 동기화 없이 여러 스레드가 같은 변수를 수정하더라도 항상 어떤 스레드가
정상적으로 저장한 값을 읽어오는 것을 보장한다는 것이다.

하지만 **스레드가 필드를 읽을 때 항상 '수정이 완전히 반영된' 값을 얻는다 보장**하지만,
**한 스레드가 저장한 값이 다른 스레드에게 '보이는가'는 보장하지 않는다.** 따라서 원자적 데이터를 쓸 때도 동기화해야 한다.

<br/>

# 잘못된 코드 예시: 동기화가 없다.
동기화가 잘못 되었을 때는 어떤 일이 발생하는지 코드로 살펴보자. 아래 코드는 얼마나 오랫동안 실행될까? 

```java
public class StopThread {
    private static boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

스레드가 `start` 되고 1초 동안의 sleep이 끝나면 boolean 변수의 값이 true가 되어 루프를 빠져나올 것으로 예상된다. 하지만 실제로 코드를 수행해보면
프로그램은 종료되지 않는다. 동기화를 하지 않았기 때문에 메인 스레드가 수정한 boolean 변수의 값이 백그라운드 스레드에게 언제 변경된 값으로 보일지 모른다.
또한 동기화 코드가 없다면 JVM에서 아래와 같은 최적화를 할 수도 있다.

```java
// 원래 코드
while (!stopRequested)
    i++;

// 최적화한 코드
if (!stopRequested)
    while (true)
        i++;
```

이는 JVM이 실제로 적용하는 **끌어올리기(hoisting, 호이스팅)**라는 최적화 기법이 사용된 것이다. 결과적으로 응답 불가(liveness failure) 상태가 되어
더 이상 진행되는 코드가 없다. 다시 기존 코드로 돌아와서 생각해보면, 공유하는 변수를 다룰 때 동기화하는 코드를 넣으면 된다.

```java
public class StopThread {
    private static boolean stopRequested;

    private static synchronized void requestStop() {
        stopRequested = true;
    }

    private static synchronized boolean stopRequested() {
        return stopRequested;
    }

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested())
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        requestStop();
    }
}
```

이처럼 동기화는 읽기와 쓰기에 대해 모두 필요하다. 위 코드처럼 공유 필드에 대한 읽기/쓰기 메서드 모두를 동기화 처리하면 문제는 해결된다.

<br/>

# volatile
배타적 수행과는 상관이 없지만 항상 가장 최근에 저장된 값을 읽어온다. 이론적으로는 CPU 캐시가 아닌 컴퓨터의 메인 메모리로부터 값을 읽어온다.
그렇기 때문에 읽기/쓰기 모두가 메인 메모리에서 수행된다.

```java
public class stopThread {
    private static volatile boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

위 코드처럼 `volatile`을 사용하면 동기화를 생략해도 된다. 다만 주의해서 사용해야 한다.
아래와 같은 예제에서 문제점을 찾아볼 수 있다.

```java
private static volatile int nextSerialNumber = 0;

public static int generateSerialNumber() {
    return nextSerialNumber++;
}
```

코드상으로 증가 연산자(++)는 하나지만 실제로는 volatile 필드에 두 번 접근한다. 먼저 값을 읽고, 그 다음에 1을 증가한 후 새로운 값을 저장하는 것이다.
따라서 두 번째 스레드가 첫 번째 스레드의 연산 사이에 들어와 공유 필드를 읽게 되면, 첫 번째 스레드와 같은 값을 보게될 것이다.

이처럼 잘못된 결과를 계산해내는 오류를 **안전 실패(safety failure)**라고 한다. 이 문제는 메서드에 `synchronized`를 붙이고 `volatile` 키워드를
공유 필드에서 제거하면 해결된다.

<br/>

# atomic 패키지
`java.util.concurrent.atomic` 패키지에는 락 없이도 thread-safe한 클래스를 제공한다. `volatile`은 동기화의 효과 중 통신 쪽만 지원하지만
이 패키지는 원자성(배타적 실행)까지 지원한다. 게다가 성능도 동기화 버전보다 우수하다.

```java
private static final AtomicLong nextSerialNum = new AtomicLong();

public static long generateSerialNumber() {
    return nextSerialNum.getAndIncrement();
}
```

<br/>

# 결론적으로는
가변 데이터를 공유하지 않는 것이 동기화 문제를 피하는 가장 좋은 방법이다. 즉, 가변 데이터는 단일 스레드에서만 사용하자.
한 스레드가 데이터를 수정한 후에 다른 스레드에 공유할 때는 해당 객체에서 공유하는 부분만 동기화해도 된다. 다른 스레드에 이런 객체를 건네는 행위를
**안전 발행(safe publication)**이라고 한다. 클래스 초기화 과정에서 객체를 정적 필드, volatile 필드, final 필드 혹은 보통의 락을 통해
접근하는 필드 그리고 동시성 컬렉션에 저장하면 안전하게 발행할 수 있다.
