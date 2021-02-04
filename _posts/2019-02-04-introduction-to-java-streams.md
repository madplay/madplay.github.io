---
layout:   post
title:    "자바 스트림 정리: 1. API 소개와 스트림 생성 연산"
author:   Kimtaeng
tags: 	  java stream
description: Java 8에서 도입된 스트림(Stream)은 무엇일까? 자바 스트림 API 소개와 스트림을 생성하는 방법에 대해 알아보자.
category: Java
comments: true
---

# 목차
- 자바 스트림 정리: 1. API 소개와 스트림 생성 연산
- <a href="/post/java-streams-intermediate-operations">자바 스트림 정리: 2. 스트림의 중간 연산</a>
- <a href="/post/java-streams-terminal-operations">자바 스트림 정리: 3. 스트림 결과 구하기</a>
- <a href="/post/java-streams-examples">자바 스트림 정리: 4. 자바 스트림 예제</a>
- <a href="/post/mistakes-when-using-java-streams">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>

<br/>

# 스트림이란?
스트림(Stream)은 **자바 8**에서 추가된 기능으로 함수형 인터페이스인 **람다(lambda)**를 활용할 수 있는 기술입니다. 
예전에는 배열이나 컬렉션을 반복문을 순회하면서 요소를 하나씩 꺼내 여러가지 코드를(예를 들어 if 조건문 등) 섞어서 작성했다면
스트림과 람다를 이용하여 코드의 양을 대폭 줄이고 조금 더 간결하게 코드를 작성할 수 있습니다.

또한 스트림을 이용하면 멀티 스레드 환경에 필요한 코드를 작성하지 않고도 **데이터를 병렬로 처리**할 수 있습니다.
그러니까 스레드를 이용하여 많은 데이터들을 빠르게 처리할 수 있지요. 기존의 반복문을 사용한다면 synchronized와 같은
병렬성을 위한 동기화 코드를 관리해야 합니다.

스트림은 크게 3가지 단계로 동작합니다.
컬렉션이나 배열 등으로부터 **스트림을 생성**하는 작업(Stream Source), 스트림을 필터링하거나 **요소를 알맞게 변환**하는 
중간 연산(Intermediate Operations), 마지막으로 최종적인 **결과를 도출**하는 단말 연산(Terminal Operations)으로 나뉩니다.

<br/>

# 컬렉션(Collection)으로 생성
기본적으로 컬렉션 구현 클래스의 `stream` 메서드를 이용하여 스트림을 생성할 수 있습니다.

```java
// of 메서드는 자바 9부터 지원
List<String> list = List.of("mad", "play");
Stream<String> stream = list.stream();
```

<br/>

# 배열(Array)로 생성
`Arrays.stream` 메서드를 사용하여 배열로 스트림을 생성할 수 있습니다.

```java
String[] arr = new String[]{"mad", "play"};
Stream<String> stream = Arrays.stream(arr);

// 0번 인덱스만 선택(closed range)
Stream<String> specificStream = Arrays.stream(arr, 0, 1);

// "mad" 출력
specificStream.forEach(System.out::println);
```

<br/>

# 병렬 스트림 생성
위의 컬렉션과 배열을 생성할 때 사용한 `stream` 메서드 대신에 `parallelStream` 메서드를 호출하면 병렬 스트림을
생성할 수 있습니다. 각각의 스레드에서 작업을 처리할 수 있도록 스트림 요소를 여러 **청크(chunk)**로 분할합니다.

```java
List<String> list = List.of("mad", "play", "...");
Stream<String> stream = list.parallelStream();
```

<br/>

# 기본 타입에 특화된 스트림 생성
오토 박싱과 언박싱의 비효율적인 측면을 줄이기 위해 기본 타입에 특화된 스트림을 사용할 수 있습니다.
자바에서는 기본적으로 `IntStream`, `LongStream`, `DoubleStream`이 제공됩니다. 

```java
// 0, 1, 2
IntStream intStream = IntStream.range(0, 3);

// 0, 1, 2, 3
IntStream closedIntStream = IntStream.rangeClosed(0, 3);

// 0, 1, 2
LongStream longStream = LongStream.range(0, 3);

// 0.0, 0.3
DoubleStream doubleStream = DoubleStream.of(0, 3);
```

난수와 같이 랜덤하게 스트림을 생성할 수 있습니다. 다만 무한대로 생성되므로 `limit`와 같은 제한 메서드를 사용하여
무한 스트림이 생성되지 않도록 해야 합니다.

```java
// 난수로 스트림 생성, 3개 제한
IntStream intStream = new Random().ints().limit(3);

// 난수로 스트림 생성, 3개 제한
DoubleStream doubles = new Random().doubles(3);
```

<br/>

# 파일(Files)로 생성
`java.nio.Files` 클래스를 이용하여 스트림을 생성할 수 있습니다. `list` 메서드은 path 스트림을,
`lines` 메서드는 파일 내의 각 라인을 문자열 스트림으로 생성합니다.

```java
Path path = Paths.get("~");
Stream<Path> list = Files.list(path);

Path filePath = Paths.get("~.txt");
Stream<String> lines = Files.lines(path);
```

<br/>

# BufferedReader의 lines()로 생성
`java.io.BufferedReader` 클래스의 `lines` 메서드로도 문자열 스트림을 생성할 수 있습니다.

```java
// try-catch-resources
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    Stream<String> stream = br.lines();
    // do something
} catch (Exception e) {
    // exception handling
}
```

<br/>

# Pattern으로 스트림 생성
```java
Stream<String> stream = Pattern.compile(",")
    .splitAsStream("mad,play");
stream.forEach(System.out::println);
// mad
// play
```

<br/>

# Stream.builder() 로 생성
`Stream.builder` 메서드를 이용하여 스트림을 생성할 수 있습니다. 메서드 체이닝의 마지막으로 `build` 메서드를
호출하면 스트림을 얻을 수 있습니다.

```java
// 참고) Stream.builder 메서드 명세
// public static<T> Builder<T> builder() {
//     return new Streams.StreamBuilderImpl<>();
// }

Stream<String> stream = Stream.<String>builder()
    .add("mad").add("play").build();
```

<br/>

# Stream.iterate() 로 생성
`iterate` 메서드를 이용하면 초기값과 람다를 인수로 받아 스트림을 생성할 수 있습니다.
요청할 때마다 값을 생산할 수 있으며 무한 스트림을 만들기 때문에 `limit` 메서드로 크기를 제한해야 합니다.

```java
// 0, 1, 2
Stream<Integer> stream = Stream.iterate(0, x -> x + 1).limit(3);
```

<br/>

# Stream.generate() 로 생성
`generate` 메서드는 위에서 살펴본 **iterate** 메서드와 다르게 생산된 각 값을 연속적으로 생산하지 않으며
인자가 없고 리턴값만 있는 `Supplier<T>`를 인수로 받습니다. 역시나 무한 스트림을 만들기 때문에 크기 제한이 필요합니다.

```java
// 1, 1, 1
Stream<Integer> stream = Stream.generate(() -> 1).limit(3);

// 난수 3개 저장
Stream<Double> randomStream = Stream.generate(Math::random).limit(3);
```

<br/>

# Stream.concat() 으로 스트림을 연결하여 생성
`Stream.concat` 메서드를 사용하면 두 개의 스트림을 연결하여 새로운 스트림을 생성할 수 있습니다.

```java
List<String> list1 = List.of("mad", "play");
List<String> list2 = List.of("mad", "life");
Stream<String> stream = Stream.concat(list1.stream(), list2.stream());
// mad, play, mad, life
```

<br/>

# 비어있는 스트림 생성
`Stream.empty()` 메서드로 비어있는 스트림을 생성할 수 있습니다. 요소가 존재하지 않을 때 `null`과 같이
유효성 검사에서 사용할 수 있습니다.

```java
// 빈 스트림 생성
Stream<Object> empty = Stream.empty();
```

<br/>

# 이어서
여러 가지 방법으로 스트림을 생성하는 방법에 대해 알아보았습니다.
이어지는 포스팅에서는 만들어진 스트림을 알맞은 형태로 가공하거나 필요한 값들만 필터링할 수 있는
중간 연산(Intermediate Operations)에 대해서 알아봅니다.

- <a href="/post/java-streams-intermediate-operations">자바 스트림 정리: 2. 스트림의 중간 연산</a>