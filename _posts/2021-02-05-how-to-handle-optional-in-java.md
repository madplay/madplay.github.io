---
layout:   post
title:    "자바 Optional: 3. Optional 중간 처리 메서드"
author:   Kimtaeng
tags: 	  java optional
description: 옵서녈(Optional) 객체의 값을 필터링하거나 다른 형태로 변환시키는 방법
category: Java
date: "2021-02-05 20:49:50"
comments: true
---

# 목차
- <a href="/post/what-is-null-in-java">자바 Optional: 1. null은 무엇인가?</a>
- <a href="/post/introduction-to-optional-in-java">자바 Optional: 2. Optional 소개</a>
- 자바 Optional: 3. Optional 중간 처리 메서드
- <a href="/post/how-to-return-value-from-optional-in-java">자바 Optional: 4. Optional 종단 처리 메서드</a>
- <a href="/post/java-optional-advanced">자바 Optional: 5. Optional 톺아보기</a>

<br>

# Optional 중간 처리 메서드
`Optional` 객체를 여러 메서드를 사용하여 값을 필터링하거나 다른 값으로 변환할 수 있다.
마치 `Stream` 클래스처럼 `Optional`도 체이닝을 통해 여러 개의 중간 연산을 처리하고 최종적으로 종단 처리 메서드를 통해
결과를 얻을 수 있다.

## filter 메서드로 필터링
`filter` 메서드를 활용하면 원하는 값을 갖는 `Optional` 객체만 필터링할 수 있다.
매개변수로 `Predicate<T>` 인터페이스를 받으며 메서드는 아래와 같이 구현되있다.

```java
public Optional<T> filter(Predicate<? super T> predicate) {
    Objects.requireNonNull(predicate);
    if (!isPresent()) {
        return this;
    } else {
        return predicate.test(value) ? this : empty();
    }
}
```

아래와 같이 조건에 맞는 `Optional` 객체만 걸러낼 수 있다. 만일 일치하는 값이 없는 경우 빈 `Optional` 객체를 반환한다.

```java
public Optional<Person> filterName(Person person) {
	// 객체의 `name` 필드값이 "Kimtaeng" 인 경우
    return Optional.ofNullable(person)
        .filter(p -> p.getName().equals("Kimtaeng"));
}
```

## map 메서드로 변환
`map` 메서드를 사용하면 원하는 형태로 `Optional` 객체를 변환할 수 있다. 메서드 형태는 다음과 같다.

```java
public <U> Optional<U> map(Function<? super T, ? extends U> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()) {
        return empty();
    } else {
        return Optional.ofNullable(mapper.apply(value));
    }
}
```

`Optional` 객체가 값을 갖고 있으면, `map` 메서드로 넘겨진
함수를 통해 값의 형태를 변경한다. `Optional` 객체가 비어있는 경우 연산을 수행하지 않는다.

```java
// `String` 타입으로 변환한다.
public Optional<String> extractName(Person person) {
    return Optional.ofNullable(person)
        .map(p -> p.getName());

    // 아래와 같이 대체할 수 있다.
	// return Optional.ofNullable(person)
	//      .map(Person::getName);
}
```

## flatMap 메서드로 평준화
`flatMap` 메서드를 사용하면 중첩된 `Optional` 구조를 한 단계 없애고 단일 요소로 만든다.

```java
public <U> Optional<U> flatMap(Function<? super T, ? extends Optional<? extends U>> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()) {
        return empty();
    } else {
        @SuppressWarnings("unchecked")
        Optional<U> r = (Optional<U>) mapper.apply(value);
        return Objects.requireNonNull(r);
    }
}
```

앞서 살펴본 `map`과 차이를 구분하기 어려울 수 있다. 예제로 조금 더 자세히 살펴보자.

우선, 사람을 나타내는 `Person` 클래스가 있다고 가정한다. 지난 글에서 살펴본 예제와 유사하지만, 차이점이라면
`Phone` 클래스 타입의 멤버 필드가 `Optional` 객체로 한 번 감싸있다. `Person` 클래스의 객체에 따라 `Phone` 필드의 값이
없을 수 있기 때문에 `Optional` 클래스를 적용한 것이다.

```java
class Person {
	private Optional<Phone> phone;
	
	// getter, setter 생략
}
```

만일 `Person` 객체에서 `Phone` 정보를 꺼내오고 싶을 때는 어떻게 해야할까? 앞서 살펴본 `map` 메서드를 통해서 변환하면 될 것
같지만 실제로 그렇지 않다.

```java
public Optional<Phone> testMap(Person person) {
	// Optional<Optional<Phone>> 타입이기 때문에 컴파일 오류 발생
	return Optional.ofNullable(person)
	    .map(Person::getPhone);
}
```

`getPhone` 메서드의 반환값이 `Phone` 객체가 아닌 `Optional` 클래스로 감싸진 객체이기 때문이다.
바로 이럴 때, `flatMap` 메서드를 사용하면 된다.

```java
public Optional<Phone> testFlatMap(Person person) {
    return Optional.ofNullable(person)
        .flatMap(Person::getPhone);
}
```

## stream 으로 변환
`Optional` 클래스에는 `stream` 메서드도 있다. 자바9 에서 추가된 기능인데, `Optional` 객체를 `Stream` 객체로 변환할 수 있다.

```java
public Stream<T> stream() {
    if (!isPresent()) {
        return Stream.empty();
    } else {
        return Stream.of(value);
    }
}
```
예제를 통해 어떻게 사용하는지 알아보자. `Stream` 클래스의 `map` 메서드를 통해 조건에 따라 `Optional` 객체로 변환한다.
빈 `Optional` 객체가 반환되는 경우 체이닝이 진행되지 않는 점을 숙지해야 한다.

참고로 예제에서 사용한 `List.of` 메서드는 자바9 에서 추가된 팩터리 메서드다. 수정 불가능한 `Unmodifiable` 리스트를
반환하므로 다른 곳에서 사용할 때 리스트를 수정하지 않도록 주의해야 한다.

```java
public void testOptionalWithStream() {
    // 자바 9에서 추가된 팩터리 메서드
    // Unmodifiable 리스트를 반환하므로 주의
    List.of(4, 3, 2, 5)
        .stream()
        .map(value -> value > 2 ? Optional.of(value) : Optional.empty())
        .flatMap(Optional::stream)
        .forEach(System.out::println);
}
```

조금 더 자세하게 코드를 이해하기 위해 람다식(lambda expression)과 메서드 참조(method reference)를 걷어내보자.
그리고 체이닝 곳곳에서 전달되는 값을 출력해보자.

```java
public void testOptionalWithStream() {
    List.of(4, 3, 2, 5)
        .stream()
        .map(value -> {
            return value > 2 ? Optional.of(value) : Optional.empty();
        })
        .peek(v -> {
            // 넘어오는 값을 출력하기 위함
            System.out.println("peek: " + v);
        })
        .flatMap(new Function<Optional<? extends Object>, Stream<?>>() {
            @Override
            public Stream<?> apply(Optional<?> o) {
                System.out.println("flatMap: " + o);
                return o.stream();
            }
        })
        .forEach(v -> {
            System.out.println("forEach: " + v);
        });
}
```

우선 `map` 에서는 2보다 큰 값인 경우 그대로 반환하지만, 작은 경우는 `Optional.empty()` 값을 반환한다.
실제로 그렇게 동작하는지 확인하기 위해 `peek` 메서드를 사용하여 체이닝 과정을 출력했다.

그리고 `flatMap` 메서드를 거친다. 여기서는 `Optional` 클래스의 `stream` 메서드의 결과를 반환하는데,
인자로 빈 옵셔널 객체인 `Optional.empty()`의 값이 전달되는 경우 `stream` 메서드에서는 내부적으로 `Stream.empty()`를
반환한다. 즉, 체이닝이 끝나게 된다.

마지막으로 스트림의 종단 연산인 `forEach` 메서드를 통해 전달되는 요소들을 표준 출력을 통해 출력한다.
따라서 위 코드의 실행 결과는 아래와 같다.

```bash
peek: Optional[4]
flatMap: Optional[4]
forEach: 4
peek: Optional[3]
flatMap: Optional[3]
forEach: 3
peek: Optional.empty
flatMap: Optional.empty
peek: Optional[5]
flatMap: Optional[5]
forEach: 5
```

## or 메서드로 값이 없을 때 대체값 지정
`or` 메서드는 자바 9에서 추가되었다. 이 메서드는 값이 존재하는 경우 같은 `Optional` 객체를 반환하고, 값이 없는 경우에는
메서드의 인자로 제공되는 `supplier`를 통해 대체할 수 있는 `Optional` 객체를 만들어 반환한다.

```java
public Optional<T> or(Supplier<? extends Optional<? extends T>> supplier) {
    Objects.requireNonNull(supplier);
    if (isPresent()) {
        return this;
    } else {
        @SuppressWarnings("unchecked")
        Optional<T> r = (Optional<T>) supplier.get();
        return Objects.requireNonNull(r);
    }
}
```

아래 예제 코드를 살펴보자. `filter` 메서드의 조건에 부합되지 않기 때문에 값이 없는 빈 `Optional` 객체가 전달된다.
이후 과정에서는 `or` 메서드가 실행되고 인자인 `supplier` 로직에서 만든 다른 `Optional` 객체로 대체되어 반환된다.

```java
Optional.ofNullable("Hi")
    .filter(value -> value.length() > 3) // `filter` 조건에 걸러짐. 빈 Optional 반환
    .or(() -> Optional.of("Hello")) // 값이 없으므로 대체 Optional[Hello] 반환
```

<br>

# 값은 어떻게 꺼내올 수 있을까?
이번글에서는 `Optional` 클래스 객체의 값에 따라 골라내거나 다른 형태로 변환시키는 중간 처리 메서드에 대해서 알아보았다.
이어지는 글에서는 중간 처리 메서드로 이어지는 체이닝(chaining)을 끝내고 `Optional` 객체로부터 값을 꺼내거나 조건부로
결과를 처리하는 방법에 대해서 소개한다.

- <a href="/post/how-to-return-value-from-optional-in-java">다음글: "자바 Optional: 4. Optional 종단 처리 메서드"</a>