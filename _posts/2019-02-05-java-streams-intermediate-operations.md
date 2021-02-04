---
layout:   post
title:    "자바 스트림 정리: 2. 스트림의 중간 연산"
author:   Kimtaeng
tags: 	  java stream
description: 자바에서 스트림(Stream) 내의 요소를 원하는 형태에 알맞게 가공하는 중간 연산(intermediate operations)은 어떤 것들이 있을까? 
category: Java
comments: true
---

# 목차
- <a href="/post/introduction-to-java-streams">자바 스트림 정리: 1. API 소개와 스트림 생성 연산</a>
- 자바 스트림 정리: 2. 스트림의 중간 연산
- <a href="/post/java-streams-terminal-operations">자바 스트림 정리: 3. 스트림 결과 구하기</a>
- <a href="/post/java-streams-examples">자바 스트림 정리: 4. 자바 스트림 예제</a>
- <a href="/post/mistakes-when-using-java-streams">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>

<br/>

# 중간 연산
이제 생성된 스트림을 필터링하거나 원하는 형태에 알맞게 가공하는 연산에 대해서 알아볼 차례입니다.
중간 연산의 특징은 반환 값으로 다른 스트림을 반환하기 때문에 이어서 호출하는 메서드 체이닝이 가능합니다.
그리고 모든 중간 연산을 합친 다음에 합쳐진 연산을 마지막으로 한 번에 처리합니다. 예제 코드로 살펴봅시다.

```java
List<String> list = List.of("a", "ab", "abc", "abcd");

List<String> result = list.stream()
        .filter(x -> { // 중간 연산 1
            System.out.println(x + " in filter method");
            return x.length() >= 1;
        }).map(x -> { // 중간 연산 2
            System.out.println(x + " in map method");
            return x.toUpperCase();
        }).limit(2) // 중간 연산 3
        .collect(Collectors.toList()); // 나중에 살펴볼 단말 연산

System.out.println(result);
// a in filter method
// a in map method
// ab in filter method
// ab in map method
// [A, AB]
```

위의 코드에서 `filter` 조건으로 설정한 문자열의 길이가 1과 같거나 큰 기준에 해당하는 문자열이 4개가 있음에도
`limit` 연산의 조건으로 처음 2개만 선택됩니다. 그리고 `filter와 map` 연산은 마치 한 과정처럼 합쳐서 진행되었고요.

이제 중간 연산(Intermediate Operations)에는 어떠한 것들이 있는지 알아봅시다.

<br/>

# filter 메서드로 필터링
`filter` 메서드로 스트림 내 요소들을 조건에 맞게 필터링할 수 있습니다. 메서드의 인자인 `Predicate<T>` 인터페이스는
`test` 라는 추상 메서드를 정의하는데, 이는 제네릭 형식의 객체를 인수로 받아 boolean 값을 반환합니다.

```java
List<String> list = List.of("kim", "taeng");
list.stream().filter(s -> s.length() == 5);
// "taeng"

// without lambda expression
list.stream().filter(new Predicate<String>() {
    @Override
    public boolean test(String s) {
        return s.length() == 5;
    }
});
```

<br/>

# map 메서드로 특정 형태로 변환
`map` 메서드를 사용하여 스트림 내 요소를 원하는 특정 형태로 변환할 수 있습니다.

```java
List<String> list = List.of("mad", "play");
list.stream().map(s -> s.toLowerCase());
// "MAD", "PLAY"

// without lambda expression
list.stream().map(new Function<String, String>() {
    @Override
    public String apply(String s) {
        return s.toLowerCase();
    }
});
```

<br/>

# 기본 타입에 특화된 스트림으로 변환
박싱(Boxing) 비용을 피할 수 있도록 기본 데이터 타입에 특화된 스트림으로 변환할 수 있습니다.
`mapToInt`, `mapToLong`, `mapToDouble` 메서드를 사용하면 각각 `IntStream`, `LongStream`,
`DoubleStream` 으로 변환할 수 있습니다.

```java
// IntStream 예
List<String> list = List.of("0", "1");
IntStream intStream = list.stream()
        .mapToInt(value -> Integer.parseInt(value));
intStream.forEach(System.out::println);
// 숫자 0, 1 출력

// without lambda expression
list.stream().mapToInt(new ToIntFunction<String>() {
    @Override
    public int applyAsInt(String value) {
        return Integer.parseInt(value);
    }
});
```

<br/>

# flatmap 메서드로 단일 스트림 변환
`flatmap` 메서드는 중첩된 구조를 한 단계 없애고 단일 원소 스트림으로 만들어줍니다.

```java
List<String> list1 = List.of("mad", "play");
List<String> list2 = List.of("kim", "taeng");
List<List<String>> combinedList = List.of(list1, list2);

List<String> streamByList = combinedList.stream()
        .flatMap(list -> list.stream())
        .collect(Collectors.toList());

// mad, play, kim, taeng
System.out.println(streamByList);

// 2차원 배열
String[][] arrs = new String[][]{
        {"mad", "play"}, {"kim", "taeng"}
};

List<String> streamByArr = Arrays.stream(arrs)
        .flatMap(arr -> Arrays.stream(arr))
        .collect(Collectors.toList());
        
// mad, play, kim, taeng
System.out.println(streamByArr);
```

<br/>

# distinct 메서드로 중복 제거
`distinct` 메서드는 스트림 내의 요소의 중복을 제거합니다. 기본형 타입의 경우 값(value)으로 비교하지만
객체의 경우 `Object.equals` 메서드로 비교합니다.

```java
// 예시를 위한 클래스 정의
class Foo {
    private String bar;
    public Foo(String bar) {
        this.bar = bar;
    }
    
    public String toString() {
        return "bar: " + bar;
    }
}

public void someMethod() {
    IntStream stream = Arrays.stream(
            new int[]{1, 2, 2, 3, 3});

    // 1, 2, 3
    stream.distinct()
            .forEach(System.out::println);

    Foo foo1 = new Foo("123");
    Foo foo2 = new Foo("123");
    List<Foo> list = List.of(foo1, foo2, foo1);
    
    // bar: 123
    // bar: 123
    list.stream().distinct()
        .forEach(System.out::println);
}
```

<br/>

# sorted 메서드로 정렬하기
`sorted` 메서드를 이용하여 스트림 내 요소를 정렬할 수 있습니다.

```java
// 1, 2, 3
List.of(1, 2, 3).stream()
    .sorted();

// 3, 2, 1
List.of(1, 2, 3).stream()
    .sorted(Comparator.reverseOrder());
```

다만 `IntStream`, `DoubleStream`, `LongStream`과 같은 기본형 특화 스트림의 경우
`sorted` 메서드에 인자를 넘길 수 없습니다. 따라서 `boxed` 메서드를 이용해 객체 스트림으로 변환 후 사용해야 합니다. 

```java
// 2, 1, 0
IntStream.range(0, 3)
        .boxed() // boxing
        .sorted(Comparator.reverseOrder());
```

<br/>

# peek 메서드로 각각의 요소에 연산 수행하기
`peek` 메서드는 스트림 내의 각각의 요소를 대상으로 특정 연산을 수행하게 합니다.
원본 스트림에서 요소를 소모하지 않기 때문에 중간 연산 사이의 결과를 확인할 때 유용합니다.
주의할 점은 `peek` 연산은 단말 연산이 수행되지 않으면 실행조차 되지 않습니다.

```java
List<Integer> otherList = new ArrayList<>();
List.of(1, 2, 3).stream()
        .limit(2)
        .peek(i -> {
            // 실제로는 사용하면 안된다.
            otherList.add(i);
        })
        .forEach(System.out::println);

// 1, 2
System.out.println(otherList);

// 단말 연산인 forEach가 없으면 otherList는 비어있다.  
```

<br/>

# limit 메서드로 개수 제한하기
`limit` 메서드를 사용하면 스트림 내의 요소 개수를 제한할 수 있습니다.

```java
List<String> list = List.of("a", "b", "c").stream()
        .limit(2).collect(Collectors.toList());

// a, b
System.out.println(list);
```

<br/>

# skip 메서드로 특정 요소 생략하기
`skip` 메서드를 사용하면 스트림 내의 첫 번째 요소부터 인자로 전달된 개수 만큼의 요소를 제외한
나머지 요소로 구성된 새로운 스트림을 리턴합니다.

```java
List<String> list = Arrays.stream(new String[]{"a", "b", "c"})
        .skip(2).collect(Collectors.toList());

// c
System.out.println(list);
```

<br/>

# boxed 메서드로 객체 스트림으로 변환하기
`IntStream`, `LongStream`, `DoubleStream`과 같은 기본 타입에 특화된 스트림을
일반 스트림으로 변환할 수 있습니다.

```java
IntStream intStream = IntStream.range(0, 3);

// 객체 타입의 일반 스트림으로 변환
Stream<Integer> boxedStream = intStream.boxed();
```

<br/>

# 이어서
스트림 내 요소를 알맞게 변환하거나 특정 조건에 맞게 요소를 필터링 하는 방법에 대해서 알아보았습니다.
이어지는 포스팅에서는 가공한 스트림을 통해 결과 값을 구할 수 있는 단말 연산(Terminal Operations)에 대해서 알아봅니다.
 
- <a href="/post/java-streams-terminal-operations">자바 스트림 정리: 3. 스트림 결과 구하기</a>