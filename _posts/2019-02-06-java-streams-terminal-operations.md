---
layout:   post
title:    "자바 스트림 정리: 3. 스트림 결과 구하기"
author:   Kimtaeng
tags: 	  java stream
description: 원하는 형태로 가공한 스트림에서 결과를 구하는 연산의 종류에는 무엇이 있을까?
category: Java
comments: true
---

# 목차
- <a href="/post/introduction-to-java-streams">자바 스트림 정리: 1. API 소개와 스트림 생성 연산</a>
- <a href="/post/java-streams-intermediate-operations">자바 스트림 정리: 2. 스트림의 중간 연산</a>
- 자바 스트림 정리: 3. 스트림 결과 구하기
- <a href="/post/java-streams-examples">자바 스트림 정리: 4. 자바 스트림 예제</a>
- <a href="/post/mistakes-when-using-java-streams">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>

<br/>

# 스트림 종료 연산
이제 마지막으로 가공한 스트림을 결과로 만들어내는 단말 연산(Terminal Operations)입니다.
다양한 형태로 결과 값을 구할 수 있습니다. 어떤 연산이 있는지 알아봅시다.

<br/>

# 순회(iterate)
`forEach` 메서드를 사용하여 스트림을 순회할 수 있습니다. 

```java
List<Integer> list = List.of(3, 2, 1, 5, 7);
list.stream().forEach(System.out::println);
```

다만 forEach 메서드는 병렬 스트림을 사용했을 때 순서를 보장할 수 없습니다. 따라서 스트림을 순서대로 순회하고 싶은 경우
`forEachOrdered` 메서드를 사용해야 합니다.

```java
List<Integer> list = List.of(3, 1, 2);

// 매 실행마다 출력 결과가 동일하지 않다.
list.parallelStream().forEach(System.out::println);

// 매 실행마다 동일한 출력 결과
list.parallelStream().forEachOrdered(System.out::println);
```

<br/>

# 결과 합치기(reduce)
`reduce` 연산을 이용해 모든 스트림 요소를 처리하여 결과를 구할 수 있습니다.
이 메서드는 아래와 같이 세 가지 형태로 오버로딩(overloading)되어 있습니다.

```java
// 형태1
Optional<T> reduce(BinaryOperator<T> accumulator); 

// 형태2
T reduce(T identity, BinaryOperator<T> accumulator);

//형태3
<U> U reduce(U identity, BiFunction<U, ? super T, U> accumulator,
            BinaryOperator<U> combiner);
```

먼저 인자가 하나만 있는 형태입니다. 인자로는 `BinaryOperator`를 사용하는데
이는 두 개의 같은 타입 요소를 인자로 받아 동일한 타입의 결과를 반환하는 함수형 인터페이스를 사용합니다.

```java
List<Integer> list = List.of(1, 2, 3);
Optional<Integer> result = list.stream().reduce((a, b) -> a + b); // 6
// list.stream().reduce(Integer::sum);
```

다음으로 두 개의 인자를 받는 형태는 항등값과 `BinaryOperator`를 받습니다.
아래와 같이 초기값을 줄 수도 있습니다.

```java
List<Integer> list = List.of(1, 2, 3);
Integer result = list.stream().reduce(1, Integer::sum);

// 7
System.out.println(result);
```

마지막으로 세 개의 인자를 받는 형태입니다. 항등값, `BiFunction`, `BinaryOperator`를 받습니다.
값을 누적하는 연산의 경우 병렬 연산의 결과를 결합해야 하는데, 여기서 세 번째 인자가 그 역할을 합니다.
그러니까 병렬 처리를 하는 경우에 각자 다른 스레드의 결과를 합쳐줍니다.

```java
List<Integer> list = List.of(3, 7, 9);
Integer result = list.parallelStream()
        .reduce(1, Integer::sum, (a, b) -> {
            System.out.println("in combiner");
            return a + b;
        });

System.out.println(result);
// 출력 결과
// in combiner a:8 b:10
// in combiner a:4 b:18
// 22
```

일반 스트림에서는 `combiner`가 수행되지 않으므로 결과값도 다릅니다. 즉 병렬 스트림에서만 동작합니다.
초기값 1에 스트림의 요소 값을 더한 값을 계산합니다. (1+3=4, 1+9=10, 1+7=8) 그리고 다음 과정에서 combiner 연산에서는
여러 스레드에서 나누어 연산한 값을 합칩니다. (8+10=18, 4+18=22)

<br/>

# 계산하기: 최솟값, 총합, 평균 등
스트림 API에서 값을 구하는 연산을 이용하면 간단하게 최솟값 또는 최댓값을 구할 수 있습니다.

```java
// Optional을 리턴한다.
OptionalDouble min = DoubleStream.of(4.1, 3.4, -1.3, 3.9, -5.7).min();
min.ifPresent(System.out::println);

// 5
int max = IntStream.of(2, 4, 5, 3).max().getAsInt();
```
 
요소의 개수를 구할 수 있습니다.

```java
// 결과 4
long count = IntStream.of(2, 4, 1, 3).count()
```

요소의 총합을 구하거나 평균을 구할 수 있습니다.
다만 기본형에 특화된 **IntStream, LongStream, DoubleStream** 에만 기본적으로 메서드가 제공됩니다.

```java
// 결과 7.1
double sum = DoubleStream.of(3.1, 2.6, 1.4).sum();

// // Optional을 반환한다.
OptionalDouble average = IntStream.of(3, 2, 1).average();

// 결과 2.0
average.ifPresent(System.out::println);
```

<br/>

# 결과 모으기(Collect)
스트림을 List, Set 그리고 Map과 같은 다른 형태의 결과로 변환해줍니다.
아래와 같은 클래스가 있다고 가정하고 여러 가지 collect 연산을 진행해봅시다.

```java
class Food {
    public Food(String name, int cal) {
        this.name = name;
        this.cal = cal;
    }

    private String name;
    private int cal;
    
    @Override
    public String toString() {
        return String.format("name: %s, cal: %s", name, cal);
    }

    // getter, setter 생략
}

List<Food> list = new ArrayList<>();
list.add(new Food("burger", 520));
list.add(new Food("chips", 230));
list.add(new Food("coke", 143));
list.add(new Food("soda", 143));
```

<br/>

- **Collectors.toList: 작업 결과를 리스트로 반환**

```java
List<String> nameList = list.stream()
        .map(Food::getName) // name 얻기
        .collect(Collectors.toList()); // list로 수집
```

<br/>

- **숫자값의 합, 평균 등 구하기**

스트림 내 요소들의 합, 평균 등을 구할 수 있습니다.

```java
// name 길이의 합 구하기
Integer summingName = list.stream()
        .collect(Collectors.summingInt(s -> s.getName().length()));
    
// mapToInt 메서드로 칼로리(cal) 합 구하기
int sum = list.stream().mapToInt(Food::getCal).sum();

// 평균 구하기: averagingInt
Double averageInt = list.stream()
        .collect(Collectors.averagingInt(Food::getCal));

// 평균 구하기: averagingDouble
Double averageDouble = list.stream()
        .collect(Collectors.averagingDouble(Food::getCal));
```

위에서 살펴본 값들은 `summarizingInt`와 같은 통계를 얻을 수 있는 메서드를 이용하면
한번에 그 정보를 담을 수 있습니다.

```java
IntSummaryStatistics summaryStatistics = list.stream()
        .collect(Collectors.summarizingInt(Food::getCal));

summaryStatistics.getAverage(); // 평균
summaryStatistics.getCount(); // 개수
summaryStatistics.getMax(); // 최댓값
summaryStatistics.getMin(); // 최솟값
summaryStatistics.getSum(); // 합계
```

<br/>

- **스트림 연산 결과를 하나의 문자열로 만들기**

스트림의 연산 결과를 하나의 문자열로 합칠 수 있습니다. 3개의 오버로딩된 메서드를 제공하며 아래와 같이
여러 가지 방법으로 사용할 수 있습니다.

```java
// without arguments
String defaultJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining());

// burgerchipscokesoda
System.out.println(defaultJoining);
```

**구분자(delimiter)**를 인자로 받아서 처리할 수 있습니다. 이어지는 문자열 사이에 위치하게 됩니다.

```java
// delimiter
String delimiterJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining(","));

// burger,chips,coke,soda
System.out.println(delimiterJoining);
```

**구분자와 prefix, suffix를 같이** 사용할 수 있습니다. 결과의 맨 앞과 맨 뒤에 붙일 문자를 지정합니다.

```java
// delimiter, prefix, suffix
String combineJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining(",", "[", "]"));

// [burger,chips,coke,soda]
System.out.println(combineJoining);
```

<br/>

- **특정 조건으로 그룹 짓기**

스트림 내의 요소들을 주어진 조건에 맞추어 그룹핑(Grouping)할 수 있습니다.

```java
// 칼로리(cal)로 그룹 만들기
Map<Integer, List<Food>> calMap = list.stream()
        .collect(Collectors.groupingBy(Food::getCal));

// { 230=[name: chips, cal: 230],
//   520=[name: burger, cal: 520],
//   143=[name: coke, cal: 143, name: soda, cal: 143]}
System.out.println(calMap);
```

<br/>

- **참, 거짓으로 그룹 짓기**

`partitioningBy`는 인자로 `Predicate` 함수형 인터페이스를 받습니다.
Predicate는 인자를 받아서 참 또는 거짓을 반환하기 때문에 boolean 값으로 그룹핑합니다. 

```java
// 200 칼로리가 넘는 지로 구분
Map<Boolean, List<Food>> partitionMap = list.stream()
        .collect(Collectors.partitioningBy(o -> o.getCal() > 200));

// { false=[name: coke, cal: 143, name: soda, cal: 143],
//   true=[name: burger, cal: 520, name: chips, cal: 230]}
System.out.println(partitionMap);
```

<br/>

- **Map으로 결과 모으기**

음식의 칼로리(cal)를 key, 이름을 value 값으로 맵을 생성해봅시다.
아래와 같이 `Collectors.toMap` 메서드를 사용해서 쉽게 구현할 수 있습니다. 

```java
// Exception 발생!
Map<Integer, String> map = list.stream()
        .collect(Collectors.toMap(
                o -> o.getCal(),
                o -> o.getName()
        ));
System.out.println(map);
```

다만 위 메서드를 수행하면 아래와 같은 오류를 볼 수 있습니다.
`java.lang.IllegalStateException: Duplicate key 143 (attempted merging values coke and soda)`

키에 값이 2개 이상 존재하게 되는 경우 컬렉터는 `IllegalStateException`을 던집니다.
따라서 키가 중복되는 예외 상황을 해결하기 위해 `BinaryOperator` 인자를 추가할 수 있습니다.

```java
// 동일한 키가 있는 경우 새 값으로 대체한다.
Map<Integer, String> map = list.stream()
        .collect(Collectors.toMap(
                o -> o.getCal(),
                o -> o.getName(),
                (oldValue, newValue) -> newValue));

// {230=chips, 520=burger, 143=soda}
System.out.println(map);
```

<br/>

- **collect 후에 연산 추가하기**

`collectingAndThen` 메서드를 이용하면 특정 타입의 형태로 수집(collect)한 이후에
추가 연산을 진행할 수 있습니다.

```java
// 칼로리(cal)가 가장 높은 객체 반환
Food food = list.stream()
        .collect(Collectors.collectingAndThen(
                Collectors.maxBy(Comparator.comparing(Food::getCal)),
                (Optional<Food> o) -> o.orElse(null)));

// name: burger, cal: 520
System.out.println(food);
```

<br/>

- **직접 Collector를 만들기**

그 밖의 로직을 위해서 직접 Collector를 만들어서 사용할 수 있습니다.

```java
// 직접 collector 생
Collector<Food, StringJoiner, String> foodNameCollector = Collector.of(
        () -> new StringJoiner(" | "), // supplier: collector 생성
        (a, b) -> a.add(b.getName()), // accumulator: 두 값을 가지고 계산
        (a, b) -> a.merge(b), // combiner: 계산 결과 수집(합치기)
        StringJoiner::toString); // finisher
        
//만들 컬렉터를 스트림에 적용
String foodNames = list.stream().collect(foodNameCollector);

// burger | chips | coke | soda
System.out.println(foodNames);
```

<br/>

# 조건 체크(Matching)
Predicate 조건식을 인자로 받아서 해당 조건을 만족하는 요소가 있는지 체크할 수 있습니다.

- **하나라도 만족하는가? (anyMatch)**

```java
// 300 칼로리가 넘는 것이 하나라도 있는가?
boolean anyMatch = list.stream()
        .anyMatch(food -> food.getCal() > 300);
```

- **모두 조건을 만족하는가? (allMatch)**

```java
// 모두 100 칼로리가 넘는가?
boolean allMatch = list.stream()
        .allMatch(food -> food.getCal() > 100);
```

- **모두 조건을 만족하지 않는가? (noneMatch)**

```java
// 모두 1000 칼로리가 넘지 않는가?
boolean noneMatch = list.stream()
        .noneMatch(food -> food.getCal() < 1000);
```

<br/>

# 이어서
여러 가지 연산을 적용한 스트림으로부터 원하는 결과를 얻는 방법을 알아보았습니다. 
이어지는 포스팅에서는 스트림 API를 사용하는 여러가지 예제에 대해서 알아봅니다.
 
- <a href="/post/java-streams-examples">자바 스트림 정리: 4. 자바 스트림 예제</a>