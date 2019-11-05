---
layout:   post
title:    자바 map 메서드와 flatMap 메서드의 차이
author:   Kimtaeng
tags: 	  java java8 map flatmap
description: 자바 8에서 추가된 map 메서드와 flatMap 메서드의 차이는 무엇일까? 
category: Java
comments: true
---

# 들어가기 앞서
이번 포스팅은 스트림 클래스를 기준으로 **map 메서드와 flatMap 메서드의 차이**를 소개합니다. 따라서 자바 8에서 새롭게 추가된 스트림에 대한 지식이 
조금 필요할 수 있습니다. 혹시나 자바의 스트림이 처음이시라면, 아래의 스트림 관련 포스팅을 먼저 보고 오시면 더 좋습니다.

- <a href="/post/introduction-to-java-streams" target="_blank">참고 링크: 자바 스트림 정리: 1. 소개와 스트림 생성</a>

<br/>

# map 메서드 살펴보기
`map` 메서드를 사용하면 단일 스트림 안의 요소를 원하는 특정 형태로 변환할 수 있습니다. 
아래 코드로 살펴봅시다. Person 이라는 클래스의 객체가 담긴 리스트에서 문자열인 name 필드만
`Set` 자료구조에 담은 후 출력하는 코드입니다.

```java
// import 생략

class Person {
    private String name;
    private Integer age;

    // constructor, getter, setter 생략
}

public class MapMethodTest {
    public static void main(String[] args) {
        List<Person> personList = Arrays.asList(new Person("Kimtaeng", 30),
                new Person("Madplay", 29));

        Set<String> names = personList.stream()
                .map(Person::getName)
                .collect(Collectors.toSet());

        // Kimtaeng, Madplay 출력
        names.forEach(System.out::println);
    }
}
```

위 코드에서 `stream`과 동시에 **람다식(Lambda Expression)**과 **메서드 참조(Method References)**가 사용되었는데요.
하나씩 적용해보면 아래와 같습니다. 코드가 조금씩 간결해지는 것을 볼 수 있습니다.

```java
// 리스트 생성
List<Person> personList = Arrays.asList(new Person("Kimtaeng", 30),
        new Person("Madplay", 29));

// 초기 형태
personList.stream().map(new Function<Person, String>() {
    @Override
    public String apply(Person person) {
        return person.getName();
    }
}).collect(Collectors.toSet());

// 람다식 적용
personList.stream().map(person -> person.getName())
    .collect(Collectors.toSet());
    
// 메서드 참조 적용
personList.stream().map(Person::getName)
    .collect(Collectors.toSet());
```

<br/>

# flatMap 메서드 살펴보기
`flatMap` 메서드는 스트림의 형태가 배열과 같을 때, 모든 원소를 단일 원소 스트림으로 반환할 수 있습니다.
아래 코드로 살펴봅시다. 2차원 배열에서 문자열의 길이가 3 보다 큰 문자열을 출력하는 코드입니다.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"},
        {"kim", "mad"}, {"taeng", "play"}};
        
Set<String> namesWithFlatMap = Arrays.stream(namesArray)
        .flatMap(innerArray -> Arrays.stream(innerArray))
        .filter(name -> name.length() > 3)
        .collect(Collectors.toSet());
        
// play, taeng 출력
namesWithFlatMap.forEach(System.out::println);
```

`flatMap`의 결과로 단일 원소 스트림을 반환하기 때문에 `filter` 메서드를 바로 체이닝하여 사용할 수 있습니다.
초기에 생성된 스트림이 배열인 경우에 매우 유용합니다. 

<br/>

# 어떻게 다른지 비교해보자!
이제 조금 더 자세히 `map`메서드와 `flatMap` 메서드가 어떻게 다른지 살펴봅시다.
먼저 바로 위에서 살펴본 `flatMap` 메서드 예제 코드를 다시 살펴봅시다.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"},
        {"kim", "mad"}, {"taeng", "play"}};

Set<String> namesWithFlatMap = Arrays.stream(namesArray)
        .flatMap(innerArray -> Arrays.stream(innerArray))
        .filter(name -> name.length() > 3)
        .collect(Collectors.toSet());
```

위의 예제를 `flatMap` 메서드를 사용하지 않는 방법으로 구성해봅시다.
`flatMap` 메서드가 없더라도 배열 형태의 스트림을 다룰 수 있습니다. 다만 조금 더 복잡해질 뿐이지요.

```java
// 2차원 배열 선언 생략
Set<String> namesWithMap = Arrays.stream(namesArray)
        .map(innerArray -> Arrays.stream(innerArray)
                .filter(name -> name.length() > 3)
                .collect(Collectors.toSet()))
        .collect(HashSet::new, Set::addAll, Set::addAll);
```

이번 예제에서 사용한  `map` 메서드의 결과를 `collect` 하는 코드가 조금 생소할 수 있는데요.
메서드 정의를 보면 아래와 같습니다.

```java
<R> R collect(Supplier<R> supplier,
              BiConsumer<R, ? super T> accumulator,
              BiConsumer<R, R> combiner);
```

`supplier`는 새로운 결과 컨테이너를 만듭니다. 여기서는 HashSet 이고요. 두 번째 인자인 `accumulator`는
결과에 추가 요소를 통합하기 위한 역할을 하며, 마지막 인자 `combiner`는 계산 결과를 결합하는 역할을 담당합니다.

한편 **Collector를 직접 정의**하게 되는 경우 `Collector.of` 메서드를 이용하게 되는데요. 
이때는 `combiner`의 형태가 `BinaryOperator` 입니다. 아래와 같이 작성할 수 있습니다.

```java
// 예제에서 사용한 자료구조는 Set 입니다. 
// 따라서 중복이 허용되지 않습니다.
// Map 등을 이용하는 경우, 중복되는 값이 있을 때 oldValue, newValue 중 선택해서 넣으면 됩니다.
Set<String> namesWithMap = Arrays.stream(namesArray)
    .map(names -> Arrays.stream(names)
            .filter(name -> name.length() > 3)
            .collect(Collectors.toSet()))
    .collect(Collector.of(HashSet::new, Set::addAll, (oldValue, newValue) -> oldValue));
```

<br/>

# 다른 예제로 또 비교해보자!
다른 예제를 가지고 **map메서드와 flatMap메서드의 차이**를 비교해봅시다. 2차원으로 이루어진 문자열 배열에서 특정 문자만 출력하는 코드입니다.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"}};

// flatMap
Arrays.stream(namesArray)
        .flatMap(inner -> Arrays.stream(inner))
        .filter(name -> name.equals("taeng"))
        .forEach(System.out::println);

// map
Arrays.stream(namesArray)
        .map(inner -> Arrays.stream(inner))
        .forEach(names -> names.filter(name -> name.equals("taeng"))
            .forEach(System.out::println));
```

단순히 출력하는 코드만으로 비교해보면 차이는 조금 더 명확해집니다. `flatMap`은 결과를 스트림으로 반환하기 때문에
`flatMap`의 결과를 가지고 바로 `forEach` 메서드를 체이닝하여 모든 요소를 출력할 수 있습니다.

반면에 `map`의 경우에는 단일 요소로 리턴되기 때문에 `map`의 결과를 가지고 `forEach`메서드로 루프를 진행한 후
그 내부에서 다시 한 번 `forEach` 메서드를 체이닝하여 사용해야 합니다. 이후는 동일하게 메서드 참조 형태로 표준 출력합니다.

마지막으로 조금 더 간단한 로직으로 비교해봅시다. 단순히 2차원 배열의 모든 요소를 출력하는 코드입니다.

```java
String[][] namesArray = new String[][]{
        {"kim", "taeng"}, {"mad", "play"}};

// flatMap
Arrays.stream(namesArray)
    .flatMap(inner -> Arrays.stream(inner))
    .forEach(System.out::println);

// map
Arrays.stream(namesArray)
    .map(inner -> Arrays.stream(inner))
    .forEach(names -> names.forEach(System.out::println));
```

<br/>

# 마치며
지금까지 자바 8에서 추가된 **map 메서드와 flatMap 메서드**를 살펴보았는데요. `Stream` 클래스를 기준으로 설명했지만
`Optional` 클래스에도 map과 flatMap 메서드가 있습니다. 역할도 동일하고요. 

```java
// Stream
<R> Stream<R> map(Function<? super T, ? extends R> mapper);
<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper);

// Optional
public<U> Optional<U> map(Function<? super T, ? extends U> mapper)
public<U> Optional<U> flatMap(Function<? super T, Optional<U>> mapper)
```

포스팅 예제를 기준으로 보았을 때, `map` 메서드는 스트림의 스트림을 반환하는 반면에
`flatMap` 메서드는 스트림을 반환한다고 보면 됩니다. 특히 스트림의 형태가 배열인 경우 또는 입력된 값을
또 다시 스트림의 형태로 반환하고자 할 때는 `flatMap`이 유용합니다.