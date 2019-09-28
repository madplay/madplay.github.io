---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 79. 과도한 동기화는 피하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 79. Avoid excessive synchronization"
category: Java
date: "2019-09-29 00:23:49"
comments: true
---

# 무엇이든 과하면 좋지 않다.
충분하지 못한 동기화도 문제이지만 과도한 동기화도 문제다. 성능을 떨어뜨리고 교착상태(Deadlock)에 빠질 수 있으며 심지어 응답 불가나 잘못된 결과를 계산해내는
안전 실패(safety failure)를 일으킬 수 있다.

응답 불가와 안전 실패를 피하려면 동기화 메서드와 동기화 블록 안에서는 제어를 절대로 클라이언트에 양도하면 안 된다.
동기화된 블록 안에서는 재정의 가능한 메서드를 호출해서는 안 되며, 클라이언트가 넘겨준 함수 객체를 호출해서도 안 된다.
무슨 일을 할지 모르기 때문에 예외를 발생시키거나, 교착상태를 만들거나, 데이터를 훼손할 수 있다. 이러한 메서드를 외계인 메서드(alien method)라고 한다.

<br/>

# 외계인 메서드
외계인 메서드 예시를 만들어 보자. 어떤 집합(Set)을 감싼 래퍼 클래스이고 집합에 원소가 추가되면 알림을 받는 관찰자 패턴을 사용한 예제 코드이다.

```java
public class ObservableSet<E> extends ForwardingSet<E> {
    public ObservableSet(Set<E> set) {
        super(set);
    }

    private final List<SetObserver<E>> observers = new ArrayList<>();

    public void addObserver(SetObserver<E> observer) {
        synchronized(observers) {
            observers.add(observer);
        }
    }

    public boolean removeObserver(SetObserver<E> observer) {
        synchronized(observers) {
            return observers.remove(observer);
        }
    }

    private void notifyElementAdded(E element) {
        synchronized(observers) {
            for (SetObserver<E> observer : observers)
                observer.added(this, element);
        }
    }

    @Override
    public boolean add(E element) {
        boolean added = super.add(element);
        if (added)
            notifyElementAdded(element);
        return added;
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        boolean result = false;
        for (E element : c)
            result |= add(element); // notifyElementAdded 호출
        return result;
    }
}
```

```java
@FunctionalInterface
public interface SetObserver<E> {
    // ObservableSet에 원소가 추가되면 호출된다.
    void added(ObservableSet<E> set, E element);
}
```

`addObserver`와 `removeObserver` 메서드를 호출해 관찰자를 추가하거나 제거한다.
이제 이 외계인 메서드를 통해 잘못된 코드 예제들을 살펴본다.

<br/>

# 외계인 메서드 예제: 예외 발생
아래 코드에서 `s.removeObserver` 메서드에 익명 클래스를 사용한 이유가 있다. 함수 객체 자신을 넘겨야 하기 때문인데, 람다는 자기 자신을 참조할 수단이
없기 때문에 익명 클래스를 사용했다. 

```java
public static void main(String[] args) {
    ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());
    set.addObserver(new SetObserver<>() {
        public void added(ObservableSet<Integer> s, Integer e) {
            System.out.println(e);
            if (e == 23)
                s.removeObserver(this);
        }
    });

    for (int i = 0; i < 100; i++)
        set.add(i;)
}
```

`ConcurrentModificationException`가 발생한다. 0부터 23까지 출력한 후 자신을 remove 한 후에 종료할 것 같으나 실제로 실행해보면 0~23까지
출력한 후 예외가 발생한다. 이유는 added 메서드 호출이 일어난 시점이 notifyElementAdded가 Observer들의 리스트를 순회하는 도중이기 때문이다.

added 메서드에서 ObservableSet.removeObserver 메서드를 호출하고, 또 여기서 observers.remove 메서드를 호출하는데 여기서 문제가 발생한다.
순회하고 있는 리스트에서 원소를 제거하려고 하는 것이다. notifyElementAdded 메서드에서 수행하는 순회는 동기화 블록 안에 있어 동시 수정이 일어나지 않지만
정작 자신이 콜백을 거쳐 되돌아와 수정하는 것을 막지 못한다.

<br/>

# 외계인 메서드 예제: 쓸데없는 백그라운드 스레드
다른 예제를 살펴보자. 실행자 서비스(ExecutorService)를 사용하여 다른 스레드가 Observer를 제거하도록 한다.

```java
public static void main(String[] args) {
    ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());

    set.addObserver(new SetObserver<>() {
        public void added(ObservableSet<Integer> s, Integer e) {
            System.out.println(e);
            if (e == 23) {
                ExecutorService exec = Executors.newSingleThreadExecutor();
                try {
                    // 여기서 lock이 발생한다. (메인 스레드는 작업을 기리고 있음)
                    // 특정 태스크가 완료되기를 기다린다. (submit의 get 메서드)
                    exec.submit(() -> s.removeObserver(this)).get();
                } catch (ExecutionException | InterruptedException ex) {
                    throw new AssertionError(ex);
                } finally {
                    exec.shutdown();
                }
            }
        }
    })

    for (int i = 0; i < 100; i++) {
        set.add(i);
    }
}
```

코드를 실행하면 예외는 발생하지 않지만 교착상태(Deadlock)에 빠진다. 백그라운드 스레드가 s.removeObserver 메서드를 호출하면 Observer를 잠그려
시도하지만 락을 얻을 수 없다. 메인 스레드가 이미 락을 잡고 있기 때문이다.

외계인 메서드 예제를 정의한 코드를 보면 removeObserver 메서드에는 synchronized 키워드가 있기 때문에 실행 시 락이 걸린다. 동시에 메인 스레드는
백그라운 스레드가 Observer를 제거하기만 기다리는 중이다. 따라서 교착상태에 빠진다.

<br/>

# 예외/교착상태 해결방법
외계인 메서드 호출을 동기화 블록 바깥으로 옮기면 된다.

```java
private void notifyElementAdded(E element) {
    List<SetObserver<E>> snapshot = null;
    synchronized (observers) {
        snapshot = new ArrayList<>(observers);
    }
    for (SetObserver<E> observer : snapshot) {
        observer.added(this, element);
    }
}
```

조금 더 나은 방법으로는 자바의 동시성 컬렉션을 사용하는 것이다. synchronized 키워드를 이용한 명시적인 동기화를 하지 않아도 된다.

```java
private final List<SetObserver<E>> observers = new CopyOnWriteArrayList<>();

public void addObserver(SetObserver<E> observer) {
    observers.add(observer);
}

public boolean removeObserver(SetObserver<E> observer) {
    return observers.remove(observer);
}

private void notifyElementAdded(E element) {
    for (SetObserver<E> observer : observers)
        observer.added(this, element);
}
```

`CopyOnWriteArrayList`는 ArrayList를 구현한 클래스로 내부를 변경하는 작업은 항상 깨끗한 복사본을 만들어 수행하도록 구현돼있다.
내부의 배열은 수정되지 않아 순회할 때 락이 필요 없어 매우 빠르다. 다른 용도로 사용된다면 매번 복사해서 느리지만, 수정할 일이 적고 순회만 빈번하게
일어난다면 Observer 리스트 용도로는 최적이다.

<br/>

# 성능을 고려한다면
과도한 동기화는 병렬로 실행할 기회를 잃고, 모든 코어가 메모리를 일관되게 보기 위한 지연시간이 진짜 비용이다.
또한 JVM의 코드 최적화를 제한하는 것도 고려해야 한다.

따라서 가변 클래스를 작성할 때는 두 가지 선택을 할 수 있다. 첫 번째는 동기화를 하지 않고, 그 클래스를 사용해야 하는 클래스가 외부에서 동기화하는 것이다.
예를 들면, Vector와 Hashtable을 제외한 `java.util` 패키지가 있다. 두 번째는 동기화를 내부에서 수행해 thread-safe 한 클래스로 만드는 것이다.
다만 클라이언트가 외부에서 객체 전체에 락을 거는 것보다 동시성을 개선할 수 있을 때 선택해야 한다. 예로는 `java.util.concurrent` 패키지가 있다.

또 다른 사례로 `StringBuffer`가 있다. 거의 단일 스레드에서 쓰이지만 내부적으로 동기화를 수행한다. 성능 이슈로 뒤늦게 `StringBuilder`가 등장했다.

- <a href="/post/difference-between-string-stringbuilder-and-stringbuffer-in-java" target="_blank">
참고 링크: "자바 String, StringBuilder 그리고 StringBuffer 차이 비교"</a>

`java.util.Random`도 마찬가지다. 동기화하지 않는 버전인 `ThreadLocalRandom`으로 대체되었다. 선택하기 어렵다면 동기화하지 말고,
대신 문서에 _"스레드 안전하지 않다"_ 고 명시하자.

<br/>

# 정리하면
동기화 영역에서의 작업을 최소한으로 줄이는 것이 중요하다. 오래 걸리는 작업이라면 동기화 영역 밖으로 옮기는 방법을 찾아보는 것이 좋다.
한편 여러 스레드가 호출할 가능성이 있는 메서드가 정적 필드를 수정한다면 그 필드를 사용하기 전에 반드시 동기화해야 한다.

가변 클래스를 설계할 때는 스스로 동기화해야 할지 고민해야 한다. 과도한 동기화를 피하는 것이 중요하다.
합당한 이유가 있는 경우에만 내부에서 동기화하고 동기화 여부를 문서에 남기자.