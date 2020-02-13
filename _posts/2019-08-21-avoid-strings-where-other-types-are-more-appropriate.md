---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 62. 다른 타입이 적절하다면 문자열 사용을 피하라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 62. Avoid strings where other types are more appropriate" 
category: Java
date: "2019-08-21 00:32:45"
comments: true
---

# 문자열의 혼용
문자열(String)은 텍스트를 표현하게 설계되었지만 의도하지 않은 용도로 사용되기도 한다. 

<br/><br/>

# 문자열을 쓰지 않아야할 사례
## 문자열은 다른 값 타입을 대신하기에 적합하지 않다.
데이터가 수치형이라면 `int`, `float` 등을 사용하고 예/아니오 형태라면 `enum`, `boolean`을 사용하면 좋다.
다룰 데이터가 정말로 문자열인 경우에만 사용하는 것이 좋다. 적절한 타입이 없다면 새로 하나 정의하는 것도 좋다.

<br/>

## 문자열은 열거 타입을 대신하기에 적합하지 않다.
문자열로 상수를 열거할 때는 `enum` 타입이 월등히 낫다. 

<br/>

## 문자열은 혼한 타입을 대신하기에 적합하지 않다.
혼합 타입을 대신하기에도 적합하지 않다.

```java
String compoundKey = className + "#" + i.next();
```

위의 코드에서 만일 className에 구분 문자(#)이 포함되면 파싱 과정에서 오류가 발생할 것이다. 또 느리고, 귀찮으며 오류 가능성도 커진다.
또한 `String`이 제공하는 기능에 의존해야 하는 단점이 존재한다. 이럴 때는 `private` 정적 멤버 클래스로 새로 만드는 것이 낫다.

<br/>

## 문자열은 권한을 표현하기에 적합하지 않다.
권한(capacity)를 문자열로 표현하는 경우가 종종 있다. 문자열로 키를 사용하는 예제이다.

```java
public class ThreadLocal {
    private ThreadLocal() { } // 객체 생성 불가

    // 현재 스레드의 값을 키로 구분해 저장한다.
    public static void set(String key, Object value);

    // 키가 가리키는 현재 스레드의 값을 반환한다.
    public static Object get(String key);
}
```

이 방법의 문제는 스레드를 구분하는 문자열 키가 전역 이름공간(global namespace)에서 공유된다는 것이다.
의도대로 동작하려면 각 클라이언트가 고유한 키를 제공해야 한다. 그렇지 않으면 의도와 다르게 같은 변수를 공유하게 된다.

따라서 문자열로 권한을 구분하는 것이 아니라 별도의 타입을 만들어야 한다.

```java
public class ThreadLocal {
    private ThreadLocal() { } // 객체 생성 불가

    public static class Key { // 권한
        Key() { }
    }

    public static Key getKey() {
        return new Key();
    }

    public static void set(Key key, Object value);
    public static Object get(Key key);
}
```

앞선 문자열 기반 API의 문제를 해결해주지만 개선할 부분이 아직 있다. `set`과 `get` 메서드는 static 메서드일 필요없이
`Key` 클래스의 인스턴스 메서드로 변경한다. 이렇게 되면 `Key`는 더이상 스레드 지역변수를 구분하는 용도가 아니라 그 자체가 스레드 지역변수가 된다.
클래스의 이름 자체도 `ThreadLocal`로 변경해본다.

```java
public final class ThreadLocal {
    public ThreadLocal();
    public void set(OBject value);
    public Object get();
}
```

마지막으로 **타입 안전성을 위해 Object를 제네릭으로 변경**한다. `Object`는 실제 타입으로 타입 캐스팅해야 하기 때문이다.

```java
public final class ThreadLocal<T> {
    public ThreadLocal();
    public void set(T value);
    public T get();
}
```

이제 결과적으로 `java.lang.ThreadLocal`과 비슷해졌다. 이렇게 문자열 기반 API의 문제는 별도의 타입을 만들어 해결하면 된다.