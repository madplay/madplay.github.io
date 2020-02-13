---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 44. 표준 함수형 인터페이스를 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 44. Favor the use of standard functional interfaces" 
category: Java
date: "2019-07-13 23:51:29"
comments: true
---

# 자바에 람다를 지원하면서

템플릿 메서드 패턴의 매력은 크게 줄었다. 이를 대체하는 요즘 스타일은 같은 효과의 함수 객체를 받는 정적 팩터리나
생성자를 제공하는 것이다. 그러니까 함수 객체를 매개변수로 받는 생성자와 메서드를 더 많이 만들어야 한다.
이때는 함수형 매개변수 타입을 올바르게 선택해야 한다.

이게 무슨 뜻인가 하면... ```LinkedHashMap```을 예시로 생각해보자. 이 클래스의 ```removeEldestEntry``` 메서드를
재정의하면 캐시로 사용할 수 있다.

```java
public class CacheExample {
    public static void main(String[] args) {
        // 익명 클래스에는 <> 처럼 제네릭 타입 생략을 할 수 없다.
        LinkedHashMap<String, Integer> map = new LinkedHashMap<String, Integer>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > 3;
            }
        };

        map.put("a", 1); map.put("b", 2);
        map.put("c", 3); map.put("d", 4);

        // 결과는 {b=2, c=3, d=4}
        System.out.println(map);
    }
}
```

잘 동작한다. 하지만 오늘날 람다를 이용하여 다시 구현한다면, 함수 객체를 받는 정적 팩터리나 생성자를 제공했을 것이다.
재정의한 ```removeEldestEntry```는 ```size``` 메서드를 호출하는데, 이는 인스턴스 메서드라 가능하다.
하지만 팩터리나 생성자를 호출할 때는 Map의 인스턴스가 존재하지 않아 Map 자신도 함수 객체에 넘겨주어야 한다.
이를 함수형 인터페이스로 선언하면 아래와 같다.

```java
@FunctionInterface interface EldestEntryRemovalFunction<K, V> {
    boolean remove(Map<K,V> map, Map.Entry<K, V> eldest);
}
```

람다 표현식으로 구현이 가능한 인터페이스는 오직 추상 메서드가 1개인 인터페이스만 가능하다.
이 맥락에서 **추상 메서드가 1개인 인터페이스를 함수형 인터페이스라고 한다.**

<br/>

# 표준 함수형 인터페이스

필요한 용도에 맞는게 있다면, 직접 구현하는 것보다 표준 함수형 인터페이스를 사용하는 것이 좋다. 관리할 대상도 줄어들고
제공되는 많은 유용한 디폴트 메서드가 부담을 줄여준다. 그리고 ```java.util.function``` 패키지 하위에 동일한 역할을
할 수 있는 것들이 이미 있다. 총 43개나 된다. 그중에서 6개의 기본 인터페이스를 살펴보자.

인터페이스 | 함수 시그니처 | 의미 | 예시
|:--|:--|:--|:--
```UnaryOperator<T>``` | ```T apply(T t)``` | 반환값과 인수의 타입이 같은 함수, 인수는 1개 | ```String::toLowerCase```
```BinaryOperator<T>``` | ```T apply(T t1, T t2)``` | 반환값과 인수의 타입이 같은 함수, 인수는 2개 | ```BigInteger::add```
```Predicate<T>``` | ```boolean test(T t)``` | 한 개의 인수를 받아서 boolean을 반환하는 함수 | ```Collection::isEmpty```
```Function<T,R>``` | ```R apply(T t)``` | 인수와 반환 타입이 다른 함수 | ```Arrays::asList```
```Supplier<T>``` | ```T get()``` | 인수를 받지 않고 값을 반환, 제공하는 함수 | ```Instant::now```
```Consumer<T>``` | ```void accept(T t)``` | 한 개의 인수를 받고 반환값이 없는 함수 | ```System.out::println```

표준 함수형 인터페이스 사용핧 때도 주의할 점이 있다. 대부분 표준 함수형 인터페이스는 기본 타입만 지원한다.
그렇다고 박싱된 기본 타입을 넣어 사용하면 안 된다. 동작은 하겠지만 계산이 많아지는 경우 성능이 매우 느려질 수 있다.
물론 필요한 용도에 맞는 게 없다면 직접 구현하면 된다.

<br/>

# 직접 작성해야 하는 경우가 있을까?

```Comparator<T>``` 인터페이스는 구조적으로 ```ToIntBiFunction<T,U>```와 동일하다. 인자 두 개를 받아서(Bi),
정수형을 반환하는(ToInt), 인수와 반환 타입이 다른 함수(Function)이다.

```java
// Comparator
@FunctionInterface
public interface Comparator<T> {
    int compare(T o1, T o2);
}

// ToIntBiFunction
@FunctionalInterface
public interface ToIntBiFunction<T, U> {
    int applyAsInt(T t, U u);
}
```

```Comparator```가 먼저 등장하긴 했지만, 그래도 표준형 함수형 인터페이스인 ```ToIntBiFunction```을 사용하지 않았을 것이다.
이유는 다음과 같다. 첫 번째로 네이밍이 훌륭하다. 지금의 이름이 API에서 자주 사용되는 그 용도를 잘 설명해주고 있다.
두 번째로 구현하는 쪽에서 반드시 지켜야 할 규약을 담고 있다. 마지막 세 번째로 유용한 디폴트 메서드를 가득 담고 있다.
따라서, 이처럼 3가지 중 하나 이상의 이유가 있다면 직접 함수형 인터페이스를 구현할지 고민해도 좋다.

<br/>

# @FunctionInterface

이 어노테이션이 달린 인터페이스가 **람다용으로 설계된 것임을 알려준다.**
또한 해당 인터페이스가 오직 하나의 추상 메서드만을 가지고 있어야 한다는 것을 알려준다. 그렇지 않으면 컴파일조차 되지 않는다.
따라서 누군가 실수로 메서드를 추가하지 못하게 막아준다.
그렇기 때문에 직접 만든 함수형 인터페이스에는 항상 ```@FunctionalInterface``` 어노테이션을 붙여주자.

<br/>

## 함수형 인터페이스를 사용할 때 주의점

서로 다른 함수형 인터페이스를 같은 위치의 인수로 받는 메서드들을 다중정의해서는 안 된다. 클라이언트에게 모호함을 주며
문제가 발생할 소지가 많다.

```java
public interface ExecutorService extends Executor {
    // Callable<T>와 Runnable을 각각 인수로 하여 다중정의했다.
    // submit 메서드를 사용할 때마다 형변환이 필요해진다.
    <T> Future<T> submit(Callback<T> task);
    Future<?> submit(Runnable task);
}
```