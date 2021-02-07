---
layout:   post
title:    "자바 Optional: 4. Optional 종단 처리 메서드"
author:   Kimtaeng
tags: 	  java optional
description: 옵셔널(optional) 객체의 중간 처리 과정을 끝내고 값을 꺼내오거나 조건부 처리하는 방법
category: Java
date: "2021-02-05 23:49:11"
comments: true
---

# 목차
- <a href="/post/what-is-null-in-java">자바 Optional: 1. null은 무엇인가?</a>
- <a href="/post/introduction-to-optional-in-java">자바 Optional: 2. Optional 소개</a>
- <a href="/post/how-to-handle-optional-in-java">자바 Optional: 3. Optional 중간 처리 메서드</a>
- 자바 Optional: 4. Optional 종단 처리 메서드
- <a href="/post/java-optional-advanced">자바 Optional: 5. Optional 톺아보기</a>

<br>

# Optional 종단 처리 메서드
중간 연산을 통해 값을 필터링하거나 변환하는 체이닝 진행했다면, 체이닝을 끝내는 종단 연산 메서드를 통해 값을 꺼내거나
로직의 흐름을 바꾸는 등의 처리를 할 수 있다.

### get 메서드로 값 가져오기
`get` 메서드는 `Optional` 객체에서 값을 꺼낼 수 있는 가장 간단한 메서드다. 하지만 간단한만큼 주의할 점도 있다.
만일 래핑된 값이 없는 경우에는 `NoSuchElementException`이 발생한다.

```java
public T get() {
    if (value == null) {
        throw new NoSuchElementException("No value present");
    }
    return value;
}
```

따라서 `Optional` 객체에 반드시 값이 있는 것으로 판단되는 경우에만 `get` 메서드를 사용해야 한다.

```java
// "str" 반환
Optional.ofNullable("str").get();

// `NoSuchElementException` 발생
Optional.ofNullable(null).get();
```

## orElse 메서드로 기본값 설정하기
`orElse` 메서드를 사용하여 비어있는 `Optional` 객체에 기본값을 설정할 수 있다. 메서드를 살펴보면 아래와 같다.

```java
public T orElse(T other) {
    return value != null ? value : other;
}
```

`Optional` 객체에 값이 래핑되어 있다면 그 값을 반환하고, 그렇지 않은 경우에는 설정한 기본값을 반환한다.

```java
String str = null;

// "hi" 반환
Optional.ofNullable(str).orElse("hi");
```

## orElseGet 메서드로 기본값 설정하기
앞서 살펴본 `orElse` 메서드와 유사하지만, `orElseGet` 메서드는 인자로 `Supplier`를 받는다.

```java
public T orElseGet(Supplier<? extends T> supplier) {
    return value != null ? value : supplier.get();
}
```

```java
String str = null;

// "hi" 반환
Optional.ofNullable(str).orElseGet(() -> "hi");
```

> orElse 메서드와 orElseGet 메서드의 차이

`orElseGet` 메서드는 `orElse` 메서드의 게으른(lazy) 버전이라고 볼 수 있다. `orElseGet` 메서드의 경우 `Optional`에
값이 없을 때만 실행되지만 `orElse` 메서드는 값이 없든 아니든 항상 무조건 실행된다.

```java
User user = new User();

System.out.println("userByOrElse");
User orElse = Optional.ofNullable(user)
    .orElse(makeDefaultUser());

System.out.println("---------------");

System.out.println("userByOrElseGet");
User userByOrElseGet = Optional.ofNullable(user)
    .orElseGet(() -> makeDefaultUser());
```

위 코드의 실행 결과는 아래와 같다.

```bash
userByOrElse
makeDefaultUser method called!
---------------
userByOrElseGet
```

실행 결과처럼 `orElse`의 경우 `Optional` 객체에 값이 있어도 반드시 실행된다. 그렇기 때문에 `orElse`의 인자로
메서드를 사용할 때는 메서드 안에서 불필요한 로직이 수행되지 않도록 주의해야 한다.

예를 들어 `API`를 호출한다거나 데이터베이스에 접근하는 것과 같은 로직을 메서드에 작성하고 `orElse`의 인자로
사용한다면, 의도치않은 트래픽이나 데이터 수정이 발생할 수 있다. 이럴 때는 `orElseGet` 메서드를 사용하면 된다.

## orElseThrow 메서드로 예외 던지기
`orElseThrow` 메서드는 `orElse`, `orElseGet` 메서드처럼 기본값을 설정하는
것이 아니라 `Optional` 객체에 래핑되 값이 없는 경우 예외를 발생시킨다.

```java
public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X {
    if (value != null) {
        return value;
    } else {
        throw exceptionSupplier.get();
    }
}
```


값이 없을 때 `NoSuchElementException`를 발생시키는 `get` 메서드와 유사하지만, `orElseThrow` 메서드는 예외를 직접 선택할 수 있다.

```java
Optional.ofNullable(user)
    .orElseThrow(IllegalArgumentException::new);

// 아래 코드와 동일하다.
Optional.ofNullable(user)
    .orElseThrow(() -> {
        return new IllegalArgumentException();
    });
```

자바 10에서는 메서드의 인자가 필요없는 형태로 오버로딩(overloading)된 `orElseThrow` 메서드가 추가됐다.
매개변수로 전달되는 예외가 없는 경우 `NoSuchElementException`가 기본값으로 설정된다.

```java
public T orElseThrow() {
    if (value == null) {
        throw new NoSuchElementException("No value present");
    }
    return value;
}
```

## ifPresent 메서드와 ifPresentOrElse 메서드로 조건부 처리
`ifPresent` 메서드는 값이 존재하는 경우 인수로 넘겨준 `Consumer`를 실행한다. 값이 없는 경우에는 아무 동작도 하지 않는다.

```java
public void ifPresent(Consumer<? super T> action) {
    if (value != null) {
        action.accept(value);
    }
}
```

사용은 아래와 같이 할 수 있다. 예제 코드를 살펴보자.

```java
Optional.of("value").ifPresent(v -> {
    System.out.println(v); // 실행됨
});
```

`ifPresentOrElse` 메서드는 자바 9에서 새롭게 추가됐다. 앞서 살펴본 `ifPresent` 메서드와 다르게 매개변수를 하나 더 받는다.

```java
public void ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction) {
    if (value != null) {
        action.accept(value);
    } else {
        emptyAction.run();
    }
}
```

첫 번째 매개변수는 `Optional` 객체에 값이 있을 때 실행되는 `Consumer`를 받고, 두 번째 매개변수로는 `Optional` 객체가
비었을 때 실행되는 `Runnable`을 받는다.

```java
Optional.of("value").ifPresentOrElse(v -> {
    System.out.println(v); // 실행됨
}, () -> {
	System.out.println("emitAction!"); // 실행되지 않음
});

Optional.ofNullable(null).ifPresentOrElse(v -> {
    System.out.println(v); // 실행되지 않음
}, () -> {
    System.out.println("emitAction!"); // 실행됨
});
```

## isPresent 메서드와 isEmpty 메서드로 값 존재여부 체크
`isPresent` 메서드는 값이 `Optional` 객체에 값이 존재하면 `true`, 값이 없는 경우 `false`를 반환한다.

```java
public boolean isPresent() {
    return value != null;
}
```

`isEmpty` 메서드는 자바 11에서 추가되었는데, `isPresent` 메서드와 반대 역할을 한다.

```java
public boolean isEmpty() {
    return value == null;
}
```

<br>

# 내가 잘 사용하고 있는 걸까?
지금까지 `Optional` 클래스 객체를 생성하고, 조건에 따라 필터링하거나 형태를 바꾸는 방법 그리고 최종적으로 중간 처리를
끝내고 `Optional` 객체로부터 값을 꺼내오거나 조건부 처리하는 방법에 대해서 알아보았다.

그렇다면 이제 등장 의도에 맞게 잘 사용하기만 하면 된다. 이어지는 글에서는 `Optional` 클래스를 의도에 맞게 잘 사용하는
방법에 대해서 소개한다.

- <a href="/post/java-optional-advanced">다음글: "자바 Optional: 5. Optional 톺아보기"</a>