---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 31. Use bounded wildcards to increase API flexibility"
category: Java
comments: true
---

# 제네릭은 불공변
<a href="/post/prefer-lists-to-arrays" target="_blank">[이펙티브 자바 3판] 아이템 28. 배열보다는 리스트를 사용하라(링크)</a> 에서
살펴본 것처럼 매개변수화 타입은 불공변(invariant) 입니다. 예를 들어 Type1과 Type2가 있을 때, `List<Type1>`은 `List<Type2>`의
하위 타입 또는 상위 타입이라는 관계가 성립될 수 없습니다.

조금 더 풀어보면 `List<Object>`에는 어떠한 객체도 넣을 수 있지만 `List<String>`에는 문자열만 넣을 수 있습니다.
즉 `List<String>`이 `List<Object>`의 기능을 제대로 수행하지 못하므로 하위 타입이라고 말할 수 없습니다.

시작하기 전에 자바의 제네릭이 처음이시다면, 아래 링크를 먼저 보고 오시면 더 좋습니다.

- <a href="/post/java-generic" target="_blank">링크: 자바의 제네릭(Generic)</a>

<br/>

# 생산자(Producer)와 와일드카드
우선 `Stack 클래스`의 public API로 매개변수의 모든 원소를 넣는 메서드를 추가한다고 가정해봅시다.

```java
// 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
public void pushAll(Iterable<E> src) {
    for (E e : src) {
        push(e);
    }
}
```

컴파일은 정상적으로 수행되지만 아래와 같이 `Number` 타입으로 선언된 Stack 객체의 메서드에 `Integer` 타입의 매개변수를 전달하면
컴파일 오류가 발생합니다. Integer는 Number의 하위 타입이니 정상적으로 잘 동작할 것만 같지만 `incompatible types...
Iterable<Integer> cannot be converted to Iterable<Number>`와 같은 오류가 발생합니다.

```java
import java.util.Arrays;

/**
 * 아이템29 소스코드 참고
 */
class Stack<E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    // ... 중간 소스코드 생략

    // 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
    public void pushAll(Iterable<E> src) {
        for (E e : src) {
            push(e);
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Iterable<Integer> integers = Arrays.asList(
                Integer.valueOf(1), Integer.valueOf(2));

        // incompatible types...
        numberStack.pushAll(integers);
    }
}
```

앞서 언급한 것처럼 제네릭의 매개변수화 타입은 불공변이기 때문에 상위-하위 자료형의 관계가 없습니다.
이러한 문제를 해결하려면 한정적 와일드카드(bounded wildcard) 자료형을 사용하면 됩니다.
`Integer 클래스는 Number를 상속한 구현체` 이므로 아래와 같이 매개변수 부분에 선언합니다.

```java
// class Integer extends Number ...
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
```

위의 선언을 해석하면 매개변수는 E의 Iterable이 아니라 `E의 하위 타입의 Iterable` 이라는 뜻입니다.
**Number 클래스를 상속하는** Integer, Long, Double 등의 타입 요소를 가질 수 있게 됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-01-07-use-bounded-wildcards-to-increase-api-flexibility-1.png"
width="600" height="300" alt="producer with wildcard"/>

직접 정의한 Stack 클래스는 `push(E)` 메서드를 통해서만 요소를 추가할 수 있습니다.
따라서 타입 안전성은 확인되지만 elements 배열은 런타임 시에 `E[]`가 아닌 `Object[]`가 됩니다.
역시나 이부분도 런타임 시에 제네릭 타입이 소거되기 때문이지요.

<br/>

# 소비자(Consumer)와 와일드카드
그럼 이번에는 Stack 인스턴스의 모든 원소를 매개변수로 받은 컬렉션으로 모두 옮기는 `popAll` 메서드를 작성해봅시다.

```java
import java.util.Arrays;
import java.util.Collection;
import java.util.EmptyStackException;

// Effect Java 29 소스코드 참고
class Stack<E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public E pop() {
        if (size == 0)
            throw new EmptyStackException();

        // push에서 E 타입만 허용하므로 이 형변환은 안전하다.
        @SuppressWarnings("unchecked") E result =
                (E) elements[--size];

        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }

    // 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
    public void pushAll(Iterable<? extends E> src) {
        for (E e : src) {
            push(e);
        }
    }

    // 모든 원소를 매개변수로 전달받은 컬렉션에 옮긴다.
    public void popAll(Collection<E> dst) {
        while(!isEmpty()) {
            dst.add(pop());
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Collection<Object> objects = Arrays.asList(new Object());

        // incompatible types...
        numberStack.popAll(objects);
    }
}
```

처음 `pushAll` 메서드를 정의했을 때와 유사한 오류가 발생합니다. Collection의 요소 타입과 Stack의 요소 타입이
일치하면 오류는 발생하지 않으나, 위에서 작성한 예제처럼 타입이 일치하지 않으면 컴파일 에러가 발생합니다.

Number 클래스는 최상위 Object 클래스를 상속하지만 역시나 제네릭의 **매개변수화 타입은 불공변**이기 때문에 **상속이란 관계가
무의미합니다.** 동일하게 와일드카드 타입을 사용하면 해결할 수 있는데, `popAll` 메서드의 매개변수 타입은 **E의 컬렉션이 아니라
E의 상위 타입인 Collection** 이라고 선언합니다.

```java
// E의 상위 타입의 Collection이어야 한다.
public void popAll(Collection<? super E> dst) {
    while(!isEmpty()) {
        dst.add(pop());
    }
}
```

모든 타입은 자기 자신의 상위 타입이므로 `Collection<? super Number>`선언은 ` Collection<Number>`을
비롯하여 `Collection<Object>` 타입의 매개변수가 전달되어도 오류가 발생하지 않습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-01-07-use-bounded-wildcards-to-increase-api-flexibility-2.png"
width="600" height="300" alt="consumer with wildcard"/>

<br/>

# PECS
> Producer-Extends-Consumer-Super... 이렇게 한 글자씩 떼서 PECS
예제로 살펴본 것처럼 코드의 유연성을 높이려면 적절한 와일드카드 타입을 사용해야 합니다.
앞에서 생산자(Producer)와 와일드카드, 소비자(Consumer)와 와일드카드를 살펴본 것처럼 상황에 따라서 어떠한 와일드카드 타입을
써야하는지 기억이 나지 않는다면 `PECS`를 기억하면 됩니다.

그러니까 메서드의 매개변수 타입이 생산자를 나타내면 `<? extends T>`를 사용하고
소비자의 역할을 한다면 `<? super T>`를 사용하면 됩니다.

<div class="post_caption">혹시나 생산자와 소비자의 개념이 아직 명확하게 이해가 안되었다면...</div>

글 초반에 살펴본 `pushAll` 메서드를 살펴보면 매개변수 src은 stack이 사용할 인스턴스를 생산하므로 `생산자(Producer)` 역할입니다.
따라서 메서드의 매개변수에는 `extends`가 선언되었고요.

```java
// class Integer extends Number ...
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
```

반대로 `popAll` 메서드의 dst 매개변수는 stack의 원소들을 모두 소비하므로 `소비자(Consumer)` 입니다.
따라서 메서드의 매개변수 영역에는 `super` 가 선언되었고요.

```java
// E의 상위 타입의 Collection이어야 한다.
public void popAll(Collection<? super E> dst) {
    while(!isEmpty()) {
        dst.add(pop());
    }
}
```

<br/>

# Advanced
메서드의 **리턴값에는 와일드카드 타입을 사용하면 안됩니다.** 메서드를 사용하는 클라이언트 코드에서도
메서드 반환 값으로 와일드카드 자료형을 써야하기 때문입니다.

두 개의 Set 컬렉션을 매개변수로 받아서 합치는(union)하는 메서드의 경우에도 아래와 같이 `Producer`의 역할을 하므로 `extends`를
사용하여 처리합니다. 하지만 메서드를 사용하는 main 메서드를 보면 와일드카드 타입을 전혀 신경쓰지 않아도 됩니다.

```java
public class Union {
    public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) {
        Set<E> result = new HashSet<>(s1);
        result.addAll(s2);
        return result;
    }

    public static void main(String[] args) {
        // Set.of 메서드는 java 9 이상부터 지원
        Set<Double> doubleSet = Set.of(1.0, 2.1);
        Set<Integer> integerSet = Set.of(1, 2);
        Set<Number> unionSet = union(doubleSet, integerSet);
    }
}
```

위 코드는 `Java 9` 버전으로 컴파일하였으나 만일 Java 8 이전 버전을 사용한다면 컴파일러가 타입을 올바르게
추론하지 못하므로 명시적으로 타입 인수를 지정해야 정상 컴파일이 됩니다.

```java
public class Union {
    public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) {
        Set<E> result = new HashSet<>(s1);
        result.addAll(s2);
        return result;
    }

    public static void main(String[] args) {
        // java 7 버전으로 컴파일
        Set<Double> doubleSet = new HashSet<>(Arrays.asList(1.0, 2.1));
        Set<Integer> integerSet = new HashSet<>(Arrays.asList(1, 2));
        Set<Number> unionSet = Union.<Number>union(doubleSet, integerSet);
    }
}
```

재귀적 타입 한정(Recursive Type Bound)을 사용한 메서드를 살펴봅시다.

```java
class RecursiveTypeBound {
    public static <E extends Comparable<E>> E max(Collection<E> collection) {
        if (collection.isEmpty()) {
            // Exception Handling
        }

        E result = null;
        for (E e : collection) {
            if (result == null || e.compareTo(result) > 0) {
                result = Objects.requireNonNull(e);
            }
        }
        return result;
    }
}

class Item28Test {
    public static void main(String[] args) {
        List<Integer> integerList = Arrays.asList(1, 3, 2);
        System.out.println(RecursiveTypeBound.max(integerList));
    }
}
```

이 메서드에도 PECS 공식에 맞추어 와일드카드를 적용해봅시다. 먼저 매개변수는 foreach 루프에서 **E 인스턴스를 생산하는** `Producer`
이므로 매개변수 선언 부분은 `Collection<? extends E>`가 되어야 합니다. 한편 `Comparable` 은
**E 인스턴스를 소비하는** 소비자이므로 `super`가 적용됩니다. 따라서 아래와 같이 PECS 공식을 2번 적용한 형태로 변경되어야 합니다.

```java
// 변경 전
public static <E extends Comparable<E>> E max(Collection<E> collection)

// 변경 후(PECS 공식 2번 적용)
public static <E extends Comparable<? super E>> E max(Collection<? extends E> collection)
```

복잡하지만 위와 같은 방식은 `Comparable`을 예로 들었을 때, `Comparable`을 직접 구현하지 않고
직접 구현한 다른 클래스를 확장한 타입을 지원할 때 필요합니다.

예를 들어서 `Java 5` 부터 지원한 `ScheduledFuture` 인터페이스의 구현 코드를 살펴보면 아래와 같습니다. `Delayed`의
하위 인터페이스이며 `Delayed`인터페이스는 `Comparable<Delayed>`를 확장했습니다. 반면에 `ScheduledFuture`
인터페이스는 `Comparable<ScheduledFuture>`를 확장(extends)하지 않았습니다.

```java
// ScheduledFuture interface
public interface ScheduledFuture<V> extends Delayed, Future<V> {
    // ...
}

// Delayed interface
public interface Delayed extends Comparable<Delayed> {
    // ...
}

// Comrable interface
public interface Comparable<T> {
    // ...
}
```

PECS 공식을 적용하지 않은 max 예제 메서드에서는 아래와 같은 코드가 동작하지 않을겁니다.

```java
class RecursiveTypeBound {
    public static <E extends Comparable<E>> E max(Collection<E> collection) {
        // ...
    }
}

class Item28Test {
    public static void main(String[] args) {
        List<ScheduledFuture<?>> scheduledFutureList = ...

        // incompatible types...
        RecursiveTypeBound.max(scheduledFutureList);
    }
}
```

끝으로 타입 매개변수와 와일드카드 사이에 공통되는 부분으로 인해 점검해볼 부분입니다.

```java
class swapTest {
    // 방법1) 비한정적 타입 매개변수
    public static <E> void typeArgSwap(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }

    // 방법2) 비한정적 와일드카드
    public static void wildcardSwap(List<?> list, int i, int j) {
        wildcardSwapHelper(list, i, j);
    }

    // 방법2-1) 와일드카드 형에는 null외에 어떤 값도 넣을 수 없다.
    // 방법1과 메서드 시그니처(이름과 파라미터)가 동일하다.
    private static <E> void wildcardSwapHelper(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }
}
```

바깥에서 호출 가능한 public API라면 간단하게 두 번째 방식을 사용하면 타입 매개변수에 대해 신경쓰지 않아도 되므로
더 편리하지만 리스트의 타입이 와일드카드 형태인 `List<?>`에는 null 외에는 어떤 값도 넣을 수 없는 문제가 있습니다.

- <a href="/post/dont-use-raw-types#원소의-타입을-모른채-쓰고-싶다면" target="_blank">링크: [이펙티브 자바 3판] 아이템 26. 로 타입은 쓰지 말라</a>

따라서 와일드 카드 타입의 실제 타입을 알기 위하여 제네릭 메서드(위 코드에서 wildcardSwapHelper)의 도움이 필요합니다.
이 메서드는 매개변수로 넘어오는 리스트가 `List<E>`에서 꺼낸 값의 타입이 항상 E 임을 알고 있으며 이는 리스트에 넣어도
타입 안전함을 알고 있습니다. 물론 와일드카드 메서드를 지원하기 위하여 추가적인 메서드가 작성되었지만 클라이언트의 입장에서는
**타입 매개변수에 신경쓰지 않는 메서드를** 사용할 수 있게 됩니다.