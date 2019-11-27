---
layout:   post
title:    "[이펙티브 자바 3판] 5장. 제네릭"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter5: Generics"  
category: Java
date: "2019-05-28 01:33:05"
comments: true
---

# 목차
- <a href="#아이템-26-로-타입은-사용하지-말라">아이템 26. 로 타입은 사용하지 말라</a>
- <a href="#아이템-27-비검사-경고를-제거하라">아이템 27. 비검사 경고를 제거하라</a>
- <a href="#아이템-28-배열보다는-리스트를-사용하라">아이템 28. 배열보다는 리스트를 사용하라</a>
- <a href="#아이템-29-이왕이면-제네릭-타입으로-만들라">아이템 29. 이왕이면 제네릭 타입으로 만들라</a>
- <a href="#아이템-30-이왕이면-제네릭-메서드로-만들라">아이템 30. 이왕이면 제네릭 메서드로 만들라</a>
- <a href="#아이템-31-한정적-와일드카드를-사용해-api-유연성을-높이라">아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라</a>
- <a herf="#아이템-32-제네릭과-가변인수를-함께-쓸-때는-신중하라">아이템 32. 제네릭과 가변인수를 함께 쓸 때는 신중하라</a>
- <a href="#아이템-33-타입-안전-이종-컨테이너를-고려하라">아이템 33. 타입 안전 이종 컨테이너를 고려하라</a>

<br>

# 아이템 26. 로 타입은 사용하지 말라
> Don’t use raw types

로(raw) 타입이란 제네릭 타입에서 타입 매개 변수를 전혀 사용하지 않은 타입을 말한다. 현재로서는 제네릭 이전의 코드와 호환하기 위해서 사용될 뿐,
런타임 시점에 오류를 발생할 소지가 많다.

- <a href="/post/dont-use-raw-types" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 26. 로 타입은 사용하지 말라</a>

<div class="post_caption">로 타입을 사용하지 말자. 오직 하위 버전과 호환하기 위해서 남아있다.</div>

<br><br>

# 아이템 27. 비검사 경고를 제거하라
> Eliminate unchecked warnings

비검사 경고(unchecked warnings)를 제거하면 런타임에 형변환 관련 예외(ClassCastException)가 발생할 일이 없으며
코드의 올바른 동작도 기대할 수 있게 된다.

만일 경고를 제거할 수 없지만 타입이 안전하다고 확신할 수 있다면 `@SuppressWarnings("unchecked")` 어노테이션을 붙여 경고를 숨기자.
리턴 문장을 제외한 개별 지역변수 선언부터 클래스 전체까지 어떤 선언에도 달 수 있지만, 가능한 좁은 범위에 적용해야 한다.
이 때는 경고를 **무시해도 안전한 이유를 주석으로** 같이 남겨두도록 하자.

<div class="post_caption">할 수 있는 한 모든 비검사 경고를 모두 제거하자.</div>

<br><br>

# 아이템 28. 배열보다는 리스트를 사용하라
> Prefer lists to arrays

## 배열 vs 제네릭

**배열은 공변(covariant)이다.** 즉, `Sub` 클래스가 `Super` 라는 클래스의 하위 타입이라면,
배열 `Sub[]`은 배열 `Super[]`의 하위 타입이 된다. 이것을 공변이라고 한다. 하지만 **제네릭 불공변(invariant)이다.**
서로 다른 Type1과 Type2가 있을 때, `List<Type1>`은 `List<Type2>`의 상위 타입도 하위 타입도 아니다.

```java
Object[] objectArray = new Long[1];
objectArray[0] = "들어갈 수 있나?"; // 컴파일은 되지만, 런타임 시에 오류가 발생한다.

List<Object> objectList = new ArrayList<Long>();
objectList.add("타입이 달라서 들어갈 수 없다"); // 컴파일조차 되지 않는다.
```

배열에서는 위와 같은 실수를 실행 중에 알 수 있지만, 리스트는 코드를 실행하기 전에 알 수 있다. 즉, 오류가 발생하기 전에 미리 알 수 있기 때문에
더 안전하다. 또한 **배열은 실체화(reify) 된다.** 그러니까 런타임에도 원소의 타입을 인지하고 확인한다. 위의 예제에서 Long 타입 배열에
문자열을 넣을 때 예외가 발생한 것처럼 말이다. 하지만 **제네릭은 런타임 시에 타입이 소거(erasure) 된다.** 타입 정보를 컴파일 시점에만
인지하는 것인데, 이는 제네릭 지원 전의 레거시 코드와 함께 사용하기 위함이다.

이처럼 배열과 제네릭은 쉽게 친해지지 못한다. 아래와 같이 배열을 선언하면 컴파일 오류가 발생한다.

```java
new List<E>[]; // 제네릭 타입의 배열
new List<String>[]; // 매개변수화 타입
new E[]; // 타입 매개변수
```

## 왜 제네릭 배열을 생성하지 못할까?

타입 안전(type-safe) 하지 않다는 것을 생각할 수 있다. 만일, 제네릭 배열을 생성할 수 있게 되면 어떤 일이 발생할 수 있을까?

```java
// 원래는 1번부터 오류가 발생하지만, 가정해보자
List<String>[] stringLists = new List<String>[1];   // (1) 제네릭 배열이 허용된다고 하자.
List<Integer> intList = List.of(42);                // (2) List.of: java 9 문법
Object[] objects = stringLists;                     // (3)
objects[0] = intList;                               // (4)
String s = stringLists[0].get(0);                   // (5)
```

- (2)에서는 원소가 하나인 리스트를 생성했다.
- (3)에서는 (1)을 Object[]에 할당한다. 배열은 공변이므로 아무런 문제가 없다.
- (4)에서는 (2)에서 생성한 인스턴스를 Object 배열의 첫 번째 원소로 저장한다.
  - 제네릭의 소거 특성으로 인해 런타임 시에 `List<Integer>`는 `List`, `List<Integer>[]`는 `List[]`가 된다.
- (5)가 문제다. (1)에서 `List<String>`만 담겠다고 했으나, 배열에는 현재 `List<Integer>`가 담겨있다.
  - 첫 번째 원소를 꺼내어 String으로 형변환할 때 `ClassCastException`가 발생한다.

이러한 이유를 보았을 때, 제네릭 배열이 생성되지 않도록 사전에 컴파일 오류가 발생되어야 한다.
한편 `E`, `List<E>`, `List<String>`과 같은 타입을 **실체화 불가 타입(non-reifiable type)** 이라고 한다.
제네릭의 소거 특성으로 인해 실체화되지 않아 런타임 시에 컴파일 타임보다 타입 정보를 적게 갖는 타입을 말한다.

<div class="post_caption">배열보다 리스트를 사용하면 컴파일 시점에 오류를 확인할 수 있다.</div>

<br><br>

# 아이템 29. 이왕이면 제네릭 타입으로 만들라
> Favor generic types

클라이언트에서 직접적으로 형변환을 해야 하는 타입보다는 **제네릭 타입이 더 안전하고 사용하기에도 편리하다.** 그러므로 새로운 타입을 설계할 때는
형변환 없이도 사용할 수 있도록 하는 것이 좋다. 그렇게 하기 위해서는 제네릭 타입으로 만들어야 하는 경우가 있다. 기존 타입 중에서 제네릭이었어야
하는 것이 있다면 제네릭 타입으로 변경해보자.

- <a href="/post/java-generic" target="_blank">관련 링크 참고: 자바 제네릭(Java Generic)</a>

다음은 제네릭 클래스로 변경하는 과정이다. 먼저, **(1) 클래스 선언에 타입 매개 변수를 추가한다.**
그리고 **(2) 일반 타입을 타입 매개변수로 바꾸면 된다.** 끝으로 이 과정에서 발생하는 비검사 경고를 해결해준다.

```java
// Object 기반으로 구현된 스택
public class Stack { // (1) Stack<E> 로 변경해준다.
    private Object[] elements; // (2) E[] elements 로 변경해준다.
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        // (2) (E[]) new Object[DEFAULT_INITIAL_CAPACITY]; 로 변경해준다.
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(Object e) { // (2) push(E e) 로 변경한다.
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() { // (2) E pop() 로 변경한다.
        if (size ==0) {
            throw new EmptyStackException();
        }

        // (2) E result = elements[--size]; 로 변경한다.
        Object result = elements[--size];
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

위의 예시는 바로 앞의 아이템 28과 모순된 내용이지만, 제네릭 타입 안에서 리스트를 사용하는 것이 항상 가능하지 않으며
매번 좋은 것도 아니다. 예를 들어, `HashMap`과 같은 제네릭 타입은 성능을 높일 목적으로 배열을 사용하기도 한다.

제네릭 타입은 타입 매개변수에 대부분의 제약을 두지 않지만 기본 타입은 사용할 수 없다. 물론 박싱된 기본 타입을 통해 우회할 수 있다.
한편으로 타입 매개변수에 제약을 두는 제네릭 타입도 있다.

```java
// java.util.concurrent.DelayQueue
class DelayQueue<E extends Delayed> implements BlockingQueue<E>
```

위 코드에서 `<E extends Delayed>`는 Delayed의 하위 타입만 받겠다는 뜻이 된다. 즉, DelayQueue 자신과 이를 사용하는
클라이언트는 DelayQueue의 원소에서 형변환 없이 곧바로 Delayed 클래스의 메서드를 호출할 수 있다. 타입이 보장되기 때문이다.
이러한 타입 매개변수를 **한정적 타입 매개변수(bounded type parameter)** 라고 한다.

<div class="post_caption">직접 형변환하는 것보다 제네릭 타입이 더 안전하고 간편하다.</div>

<br><br>

# 아이템 30. 이왕이면 제네릭 메서드로 만들라
> Favor generic methods

메서드도 제네릭으로 만들 수 있다. 아래는 타입 매개변수 목록은 `<E>`이고 반환 타입은 `Set<E>` 이다.

```java
// 제네릭 메서드
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

## 제네릭 싱글톤 팩터리
제네릭은 런타임에타입 정보가 소거되기 때문에 하나의 객체를 어떤 타입으로든 매개변수화할 수 있다. 하지만 요청한 타입 매개변수에 맞도록
매번 그 객체의 타입을 변경해주는 정적 팩터리를 만들어야 한다. 이를 제네릭 싱글톤 팩터리라고 한다.
대표적으로 `Collections.reverseOrder`와 `Collections.emptySet`이 있다.

## 재귀적 타입 한정
재귀적 타입 한정(recursive type bound)이란 자기 자신이 들어간 표현식을 사용하여 타입 매개변수의 허용 범위를 한정하는 것을 말한다.
주로 타입의 순서를 정하는 Comparable 인터페이스와 함께 쓰인다.

```java
// 재귀적 타입 한정을 이용해 상호 비교할 수 있음을 표현
public static <E extends Comparable<E>> E max(Collection<E> c);
```

위의 타입 한정인 `<E extends Comparable<E>>`는 "모든 타입 E는 자신과 비교할 수 있다" 라고 읽을 수 있다.

<div class="post_caption">명시적으로 형변환해야 하는 메서드보다는 제네릭 메서드가 더 안전하고 사용하기 쉽다.</div>

<br><br>

# 아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라
> Use bounded wildcards to increase API flexibility

매개변수화 타입은 불공변(invariant)이다. 자바에서는 타입의 유연성을 극대화하기 위해 한정적 와일드카드 타입이라는
특별한 매개변수화 타입을 지원한다.

- <a href="/post/use-bounded-wildcards-to-increase-api-flexibility" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 31. 한정적 와일드카드를 사용해 API 유연성을 높이라</a>

<div class="post_caption">조금 복잡하더라도 와일드카드 타입을 적용하면 API가 훨씬 유연해지는 장점이 있다.</div>

<br><br>

# 아이템 32. 제네릭과 가변인수를 함께 쓸 때는 신중하라
> Combine generics and varargs judiciously

가변인수 메서드를 호출하면 가변인수를 담기 위한 배열이 자동으로 생긴다. 제네릭과 가변인수를 혼용해서 사용하면 어떻게 될까?
아이템 28에서 만들 수 없다던 제네릭 배열이 생성되진 않을까? 아래 코드로 살펴보자.

```java
import java.util.ArrayList;
import java.util.List;

public class Example {
    static void dangerous(List<String>... stringLists) {
        List<Integer> intList = List.of(42);
        Object[] objects = stringLists;
        objects[0] = intList; // 힙 오염 발생
        String s = stringLists[0].get(0); // ClassCastException
    }

    public static void main(String[] args) {
        List<String> stringList = new ArrayList<>();
        stringList.add("Hi there");
        dangerous(stringList);
    }
}
```

위의 코드는 컴파일 오류는 발생하지 않지만, 인수를 건네 호출하게 되면 `ClassCastException`이 발생한다.
해당 코드 부분에 보이지는 않지만 컴파일러가 생성한 형변환 코드가 숨어 있기 때문이다. 이처럼 제네릭 가변인수 배열 매개변수에 값을
저장하는 것은 타입 안전성이 깨지므로 안전하지 않다.

하지만 제네릭이나 매개변수화 타입의 varargs 매개변수를 받는 메서드가 실무에서 매우 유용하기 때문에, 위의 예제처럼 제네릭 varargs 매개변수를
받는 메서드를 선언할 수 있도록 했다. 대표적으로 아래와 같이 `Arrays.list(T... a)`, `EnumSet.of(E first, E... set)`과
같은 메서드가 있다.

```java
// Arrays.Java
@SafeVarargs
@SuppressWarnings("varargs")
public static <T> List<T> asList(T... a) {
    return new ArrayList<>(a);
}

// EnumSet.java
@SafeVarargs
public static <E extends Enum<E>> EnumSet<E> of(E first, E... rest) {
    EnumSet<E> result = noneOf(first.getDeclaringClass());
    result.add(first);
    for (E e : rest)
        result.add(e);
    return result;
}
```

## 메서드가 안전한지 어떻게 확신할까?
자바 7부터는 `@SafeVarargs`를 사용하여 제네릭 가변인수 관련 컴파일 경고를 숨길 수 있게 되었다.
물론 재정의할 수 없는 메서드에만 달아야 한다. 자바 8에서는 오직 정적 메서드와 final 인스턴스 메서드에만 붙일 수 있게 변경되었고
자바 9부터는 private 인스턴스 메서드에도 허용되도록 변경되었다.

이처럼 `@SafeVarargs` 어노테이션은 메서드 작성자가 그 메서드가 타입을 안전하다고 보장하는 장치다.
그렇다면 어떻게 메서드가 안전하지 확신할 수 있을까?

먼저, 메서드가 가변인수 메서드가 호출될 때 생성되는 varargs 매개변수 배열에 아무것도 저장하지 않아야 한다. 그리고 그 배열의 참조가 외부로
노출되지 않아야 한다. 그러니까 varargs 매개변수 배열이 순수하게 인수들을 전달하는 목적만 하면 그 메서드는 안전하다고 할 수 있다.

<div class="post_caption">가변인수와 제네릭은 잘 어울리지 않는다.</div>

<br><br>

# 아이템 33. 타입 안전 이종 컨테이너를 고려하라
> Consider typesafe heterogeneous containers

제네릭은 `Set<E>`, `Map<K, V>`과 같은 컬렉션과 `ThreadLocal<T>` 등의 단일원소 컨테이너에도 사용된다.
여기서 매개변수화되는 대상은 원소가 아닌 컨테이너 자신이다. 그렇기 때문에 하나의 컨테이너에서 매개변수화할 수 있는 타입의 수가 제한된다.
> 컨테이너라는 말을 "클래스"로 의미를 두면 이해하기 쉽다.

제한없이 유연하게 사용되어야 하는 경우 컨테이 대신 키를 매개변수화한 다음에 컨테이너에 값을 넣거나 뺄 때 매개변수화한 키를 함께 제공하면 된다.
이러한 설계 방식을 타입 안전 이종 컨테이너 패턴(type safe heterogeneous container pattern)이라고 한다. 한편 컴파일타임 타입 정보와
런타임 타입 정보를 알아내기 위해 메서드들이 주고받는 class 리터럴을 타입 토큰(type token)이라고 한다.

```java
public class Favorites {
    // 제네릭을 중첩해서 썼으므로 class 리터럴이면 뭐든 넣을 수 있다.
    private Map<Class<?>, Object> favorites = new HashMap<>();

    public <T> void putFavorite(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }

    public static void main(String[] args) {
        Favorites f = new Favorites();
        f.putFavorite(String.class, "Java");
        f.putFavorite(Class.class, Favorites.class);

        String favoriteString = f.getFavorite(String.class);
        Class<?> favoriteClass = f.getFavorite(Class.class);

        // 출력 결과: Java Favorites
        System.out.printf("%s %s%n", favoriteString, favoriteClass.getName());
    }
}
```

위 Favorites 클래스는 타입 안전하다. String을 요청했을 때 Integer를 반환하는 등의 예외가 발생하지 않는다.
하지만 이 구현에도 단점은 존재한다. 먼저, 넣을 때 잘못 넣으면 오류가 발생할 수 있습니다.

```java
f.putFavorite((Class)Integer.class, "This is not integer !!!");
Integer notInteger = f.getFavorite(Integer.class); // ClassCastException
```

또한 실체화가 불가능한 타입은 넣을 수 없다. 그러니까, `String`이나 `String[]`은 저장할 수 있지만, `List<String>`은
저장할 수 없다. 우회하기 위한 방법으로는 슈퍼 타입 토큰을 사용할 수 있다. 슈퍼 타입을 토큰으로 사용한다는 뜻이다. 스프링 프레임워크에서는
이를 클래스로 미리 구현해놓았다.

```java
List<String> pets = Arrays.asList("강아지", "고양이");
f.putFavorite(new TypeRef<List<String>>(){}, pets);
List<String> list = f.getFavorite(new TypeRef<List<String>>(){});
```

<div class="post_caption">컨테이너 자체가 아닌 키를 타입 매개변수로 바꾸면 타입 안전 이종 컨테이너를 만들 수 있다.</div>
