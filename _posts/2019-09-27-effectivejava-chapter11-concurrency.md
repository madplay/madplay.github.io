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

<br>

# 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라
> Synchronize access to shared mutable data

여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓸 때는 항상 동기화해야 한다. 그렇지 않으면 의도하지 않은 값을 읽게 될 수 있다.

- <a href="/post/synchronize-access-to-shared-mutable-data" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라</a>

<div class="post_caption">여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓰는 동작은 반드시 동기화하자.</div>

<br><br>

# 아이템 79. 과도한 동기화는 피하라
> Avoid excessive synchronization

동기화를 하지 않으면 문제가 된다. 하지만 과도한 동기화도 적지 않은 문제가 된다. 성능을 떨어뜨리고, 교착 상태에 빠뜨리고, 심지어는 예측할 수 없는
결과를 만들기도 한다.

- <a href="/post/avoid-excessive-synchronization" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 79. 과도한 동기화는 피하라</a>

<div class="post_caption">동기화 메서드나 블록 안에서는 클라이언트에게 제어를 양도해선 안 된다.</div>

<br><br>

# 아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라
> Prefer executors, tasks, and streams to threads

스레드를 직접 다룰 수 있지만 `concurrent` 패키지를 이용하면 간단하게 코드를 작성할 수 있다.

- <a href="/post/prefer-executors-tasks-and-streams-to-threads" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라</a>

<div class="post_caption">스레드를 직접 다루지말고 실행자 프레임워크를 사용하자.</div>

<br><br>

# 아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라
> Prefer concurrency utilities to wait and notify

이제는 `wait`와 `notify` 보다 더 고수준이며 편리한 동시성 유틸리를 사용하자. `java.util.concurrent` 패키지의 고수준 유틸리티는 크게
실행자 프레임워크, 동시성 컬렉션, 동기화 장치로 나눌 수 있다. 

- <a href="/post/prefer-concurrency-utilities-to-wait-and-notify" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라</a>

<div class="post_caption">wait와 notify 메서드가 아닌 동시성 유틸리티를 사용하자.</div>

<br><br>

# 아이템 82. 스레드 안전성 수준을 문서화하라
> Document thread safety

`synchronized`는 문서화와 관련이 없다. 조건부 스레드 안전 클래스는 메서드를 어떤 순서로 호출할 때 외부 동기화가 필요하며, 또 어떤 락을 얻어야 하는지
클라이언트가 알 수 있어야 한다. 무조건적 스레드 안전 클래스를 작성할 때는 비공개 락 객체를 사용해야 한다.

- <a href="/post/document-thread-safety" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 82. 스레드 안전성 수준을 문서화하라</a>

<div class="post_caption">스레드 안전성 정보를 문서화해야 한다.</div>

<br><br>

# 아이템 83. 지연 초기화는 신중히 사용하라
> Use lazy initialization judiciously

결론부터 얘기하면, "필요할 때까지는 하지말라" 이다. 지연 초기화는 양날의 검이다. 
지연 초기화(lazy initialization)는 필드의 초기화 시점을 그 값이 처음 필요해질 때까지 늦추는 기법인데 주로 최적화 용도로 사용된다.

초기화가 이뤄지는 비율에 따라, 초기화에 드는 비용에 따라, 초기화된 각 필드를 얼마나 빈번히 호출하느냐에 따라 지연 초기화가 성능을 더 느리게 할 수도 있다.
그리고 대부분 일반적인 초기화가 지연 초기화가 낫다.

```java
// 일반적인 인스턴스 필드 초기화 방법
private final FieldType field = computeFieldValue();
```

지연 초기화가 초기화 순환성을 깨뜨릴 것 같으면 `synchronized`를 단 접근자를 이용하자.

```java
private FieldType field;

private synchronized FieldType getField() {
    if (field == null)
        field = computeFieldValue();
    return field;
}
```

성능 때문에 정적 필드를 초기화해야 한다면 **지연 초기화 홀더 클래스**를 사용하자.

```java
private static class FieldHolder {
    static final FieldType field = computeFieldValue();
}

private static FieldType getField() { 
    return FieldHolder.field;
}
```

성능 때문에 인스턴스 필드를 지연 초기화해야 한다면 **이중검사(double-check)** 관용구를 사용하자.
중간에 result라는 지역변수를 사용한 이유는 필드가 이미 초기화된 상황에서는 그 필드를 한 번만 읽도록 보장해준다. 필수는 아니지만 성능을 높여준다.

```java
// 반드시 volatile 로 선언
private volatile FieldType field;

private FieldType getField() {
    FieldType result = field;
    if (result != null) // 첫 번째 검사(락 사용 안함)
        return result;

    synchronized(This) {
        if (field == null) // 두 번째 검사(락 사용)
            field = computeFieldValue();
        return field;
    }
}
```

반복해서 초기화해도 상관없는 인스턴스 필드를 지연 초기화할 때가 있는데 이럴 때는 두 번째 검사를 생략하면 된다. (단일검사)

```java
// volatile는 필요하다.
private volatile FieldType field;

private FieldType getField() {
    FieldType result = field;
    if (result == null)
        field = result = computeFieldValue();
    return result;
}
```

더 나아가 필드의 타입이 long과 double을 제외한 다른 기본 타입이면 단일검사의 필드 선언에서 `volatile`을 없앨 수 있다.

<div class="post_caption">지연 초기화가 오히려 성능을 저하시킬 수 있다.</div>

<br><br>

# 아이템 84. 프로그램의 동작을 스레드 스케줄러에 기대지 말라
> Don’t depend on the thread scheduler

## 스레드 스케줄러에 의존하지 말자
여러 스레드가 실행 중이면 운영체제의 스레드 스케줄러가 스케줄링한다. 이러한 스케줄링 정책은 운영체제마다 다를 수 있다.
그렇기 때문에 스케줄러의 동작 방식에 의존하며 안된다. 의존하게 되는 경우 스레드 스케줄러마다 성능이 달라질 수 있어 다른 플랫폼에 이식하기 어려워진다.

## 성능과 이식성이 좋은 프로그램
실행 가능한 스레드의 평균적인 수가 프로세스의 수보다 과도하게 많아서는 안된다. 그래야 스케줄러의 고민이 줄어든다.
실행 준비가 된 스레드들은 맡은 작업을 끝낼 떄 까지 계속 실행되도록 만들어야 한다.

실행 가능한 스레드 수를 적게 유지하려면 각 스레드가 작업을 완료한 후 다음 작업이 생길 때까지 대기하도록 하는 것이다.
스레드는 당장 처리해야 할 작업이 없다면 실행돼서는 안 된다.

실행자 프레임워크를 예로 들면, 스레드 풀의 크기를 적절히 설정하고 작업을 짧게 유지하면 된다. 다만 오히려 너무 짧으면 성능이 저하된다.

## 스레드는 절대 바쁜 대기 상태가 되면 안 된다.
공유 객체의 상태가 바뀔 때까지 쉬지 않고 검사해서는 안 된다는 뜻이다. 바쁜 대기(busy waiting) 상태는 스레드 스케줄러의 변덕에 취약하며
프로세서에 큰 부담을 주어 다른 유용한 작업이 실행될 기회가 박탈된다.

```java
public class SlowCountDownLatch {
    private int count;

    public SlowCountDownLatch(int count) {
        if (count < 0)
            throw new IllegalArgumentException(count + " < 0");
        this.count = count;
    }

    public void await() {
        while (true) {
            synchronized(this) {
                if (count == 0)
                    return;
            }
        }
    }

    public synchronized void countDown() {
        if (count != 0)
            count--;
    }
} 
```

위의 예제 코드를 수행해보면 `concurrent` 패키지에 있는 CountDownLatch 보다 훨씬 더 느린 속도를 볼 수 있다.
이처럼 하나 이상의 스레드가 필요도 없이 실행 가능한 상태인 경우 성능과 이식성이 저하된다.

`Thread.yield`는 동작하지 않는 스레드가 대기 상태가 되는 등 다른 스레드에게 실행을 양보(yield)하는 것을 말한다.
특정 스레드가 다른 스레드보다 CPU 시간을 충분히 얻지 못하여 간신히 수행되는 프로그램을 보더라도 `yield` 메서드를 쓰는 것은 삼가야 한다.

테스트할 수단도 없으며 성능이 좋아지더라도 이식성은 나빠질 수 있다. 차라리 애플리케이션 구조를 바꿔 동시에 실행 가능한 스레드의 개수를 적게 만드는 것이 낫다.
스레드 우선 순위를 조절하는 것도 위험하다. 자바에서 스레드 우선순위는 이식성이 가장 나쁜 특성에 속한다.

<div class="post_caption">프로그램의 동작을 스레드 스케줄러에 기대지 말자.</div>