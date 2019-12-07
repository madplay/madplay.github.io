---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 76. 가능한 한 실패 원자적으로 만들라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 76. Strive for failure atomicity" 
category: Java
comments: true
---

# 실패 원자적
호출된 메서드가 실패하더라도 해당 객체는 메서드 호출 전 상태를 유지하는 특성 **실패 원자적(failure-atomic)**이라고 한다.

<br><br>

# 메서드를 실패 원자적으로 만드는 방법
### 불변 객체로 설계한다.
불변 객체는 생성 시점에 고정되어 절대 변하지 않기 때문에 기존 객체가 불안정한 상태에 빠지는 일은 없다.

<br>

### 로직을 수행하기 전에 매개변수의 유효성을 검사한다.
객체의 내부 상태를 변경하기 잠재적 예외의 가능성 대부분을 걸러낸다.

```java
public Object pop() {
    if (size == 0)
        throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // 다 쓴 참조 해제
    return result;
}
```

### 실패할 가능성이 있는 모든 코드를, 객체의 상태를 바꾸는 코드보다 앞에 배치한다.
로직을 수행하기 전에 인수의 유효성을 검사하기 어려울 때 사용할 수 있다. `TreeMap`을 예로 들면 잘못된 타입의 원소를 추가할 때
트리를 변경하기 앞서 해당 원소가 들어갈 위치를 찾는 과정에서 `ClassCastException`을 던진다.

<br>

### 객체의 임시 복사본에서 작업을 수행한 후에 성공적으로 완료되면 원래 객체와 교체한다.
데이터를 임시 자료 구조에 저장해 작업하는 것이 더 빠를 때 적용하기 좋은 방법이다. `List` 클래스의 `compare` 메서드가 그렇다.
정렬하기 전에 원소들을 배열에 옮겨 담고 그다음에 정렬을 수행한다.

```java
default void sort(Comparator<? super E> c) {
    Object[] a = this.toArray();
    Arrays.sort(a, (Comparator) c);
    ListIterator<E> i = this.listIterator();
    for (Object e : a) {
        i.next();
        i.set((E) e);
    }
}
```

### 작업 도중에 발생하는 실패를 가로채는 복구 코드를 작성하여 작업 전 상태로 되돌린다.
주로 디스크 기반의 내구성(durability)를 보장해야 하는 자료구조에 쓰이는데, 자주 사용되는 방법은 아니다.

<br>

# 실패 원자성을 무조건 지켜야 할까?
예를 들어 `ConcurrentModificationException`을 잡아냈더라도 그 객체가 여전히 사용할 수 있는 상태라고 가정해서는 안 된다.
**따라서 권장되는 부분이긴 하지만 항상 실패 원자성을 지킬 수 있는 것은 아니다.**

실패 원자적으로 만들 수 있어도 항상 그래야 하는 것도 아니다. 이를 달성하기 위한 비용이 크거나 복잡도가 아주 큰 연산이 있을 수 있기 때문이다.
이 규칙을 지키지 못한다면 실패 시의 객체 상태를 API 설명에 명시해야 한다.

따라서 `Error`는 복구할 수 없으므로 AssertionError에 대해서는 실패 원자적으로는 만들려는 시도도 필요가 없다.