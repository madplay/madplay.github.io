---
layout:   post
title:    "자바 스트림 정리: 4. 자바 스트림 예제"
author:   Kimtaeng
tags: 	  java stream
description: 자바 스트림 API를 사용하는 여러가지 예제들을 알아보자.
category: Java
comments: true
---

# 목차
- <a href="/post/introduction-to-java-streams">자바 스트림 정리: 1. API 소개와 스트림 생성 연산</a>
- <a href="/post/java-streams-intermediate-operations">자바 스트림 정리: 2. 스트림의 중간 연산</a>
- <a href="/post/java-streams-terminal-operations">자바 스트림 정리: 3. 스트림 결과 구하기</a>
- 자바 스트림 정리: 4. 자바 스트림 예제
- <a href="/post/mistakes-when-using-java-streams">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>

<br/>

# 스트림 API 예제
이번 포스팅에서는 스트림 API를 사용하는 여러 가지 예제들을 살펴봅니다.
예제에서 사용하는 `Person` 클래스는 아래와 같이 미리 작성되있음을 가정합니다.

```java
class Person {
    private String name;
    private int age;
    private String phoneNumber;

    public Person(String name, int age, String phoneNumber) {
        this.name = name;
        this.age = age;
        this.phoneNumber = phoneNumber;
    }
    
    // getter, setter 생략
}
```

<br/>

# `List<V> to Map<K, V>`
List 형태를 Map 형태로 바꿔봅시다. `List<V>` 형태와 같이 특정 오브젝트 타입의 리스트를
오브젝트의 한 필드를 키로 하는 `Map<K, V>` 형태로 변경합니다.

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("짱구", 23, "010-1234-1234"));
personList.add(new Person("유리", 24, "010-2341-2341"));
personList.add(new Person("철수", 29, "010-3412-3412"));
personList.add(new Person("맹구", 25, null));

// Function.identity는 t -> t, 항상 입력된 인자(자신)를 반환합니다.
Map<String, Person> personMap = personList.stream()
        .collect(Collectors.toMap(Person::getName, Function.identity()));
```

처음 스트림 API를 접했을 때 위와 같은 축약형 코드가 난해했던 경험이 있는데요.
아래와 같이 람다표현식이나 메서드 참조를 모두 풀어서 이해한 적도 있던 것 같습니다. 

```java
Map<String, Person> personMap = personList.stream()
        .collect(Collectors.toMap(new Function<Person, String>() {
            @Override
            public String apply(Person person) {
                return person.getName();
            }
        }, new Function<Person, Person>() {
            @Override
            public Person apply(Person person) {
                return person;
            }
        }));
```

추가적으로 filter 메서드를 사용하면 특정 조건에 일치한 형태만 골라낼 수 있습니다.

```java
Map<String, Person> personMap = personList.stream()
        .filter(person -> person.getAge() > 24) // 25살 이상만 골라낸다.
        .collect(Collectors.toMap(Person::getName, Function.identity()));
```

한편 `Collectors.toMap` 메서드를 수행할 때 하나의 키에 매핑되는 값이 2개 이상인 경우 
`IllegalStateException` 예외가 발생합니다. 이럴 때는 `BinaryOperator`를 사용하여 아래와 같이 저장할 값을 선택할 수 있습니다.

```java
Map<Integer, Person> personMap = personList.stream()
        .collect(Collectors.toMap(
                o -> o.getAge(),
                Function.identity(),
                (oldValue, newValue) -> newValue)); // 중복되는 경우 새 값으로 넣는다.
```

아니면 중복 키(duplicatekey)를 허용할 수도 있는데요. `Collectors.groupingBy` 메서드를 사용하여 조금 다른 형태로
중복키를 허용한 리스트 형태로 담을 수도 있습니다.

```java
// List 형태로 담는다.
Map<Integer, List<Person>> duplicatedMap = personList.stream()
        .collect(Collectors.groupingBy(Person::getAge));
```

<br/>

# 스트림 내에서 null 제외하기
위에서 살펴본 `filter` 메서드를 적절하게 사용하면 스트림 내의 null 값을 제외시킬 수 있습니다.

```java
Stream<String> stream = Stream.of("철수", "훈이", null, "유리", null);
List<String> filteredList = stream.filter(Objects::nonNull)
        .collect(Collectors.toList());        
```

<br/>

# 조건에 일치한 요소 찾기
`filter` 메서드와 `findFirst` 메서드로 조건에 일치한 가장 첫 요소를 찾을 수 있습니다. 

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("짱구", 23, "010-1234-1234"));
personList.add(new Person("유리", 24, "010-2341-2341"));
personList.add(new Person("맹구", 23, "010-3412-3412"));

// 짱구
Person person = personList.stream()
        .filter(p -> p.getAge() == 23)
        .findFirst().get();
```

`findFirst` 메서드 대신에 `findAny` 메서드도 가능합니다.
단, 일반 스트림에서는 동일한 요소(짱구)가 결과로 나오지만 병렬 스트림에서는 매 실해마다 다를 수 있습니다.
**순서에 상관없이 조건에 충족한 요소**를 찾고 싶을 때 `findAny` 메서드가 효과적일 수 있습니다.

```java
// 짱구 또는 맹구
Person person = personList.parallelStream()
        .filter(p -> p.getAge() == 23)
        .findAny().get();
```

<br/>

# 스트림 정렬하기
스트림을 주어진 조건으로 정렬할 수 있습니다. 예를 들어 나이(age) 값을 기준으로 오름차순 정렬을 한다면,

```java
List<Person> personList = new ArrayList<>();
personList.add(new Person("짱구", 25, "010-1234-1234"));
personList.add(new Person("유리", 24, "010-2341-2341"));
personList.add(new Person("맹구", 23, "010-3412-3412"));
personList.add(new Person("훈이", 26, "010-4123-4123"));

// 맹구, 유리, 짱구, 훈이
personList.stream()
        .sorted(Comparator.comparing(Person::getAge))
        .forEach(p -> System.out.println(p.getName()));
```

`Comparator.comparing` 메서드에 `reversed` 메서드를 추가하면 역순으로도 정렬할 수 있습니다.
내부를 살펴보면 자바8 버전에서 추가된 `Collections.reverseOrder`를 사용하여 역순으로 정렬합니다.

```java
// 훈이, 짱구, 유리, 맹구
personList.stream()
        .sorted(Comparator.comparing(Person::getAge).reversed())
        .forEach(p -> System.out.println(p.getName()));
```

<br/>

# reduce로 결과 구하기
`reduce` 메서드로 스트림을 하나의 결과로 연산할 수 있습니다.
예를 들어 아래와 같이 숫자로 구성된 리스트 내의 요소를 모두 더해 합계(sum)를 구할 수 있습니다.

```java
List<Integer> list = List.of(5, 4, 2, 1, 6, 7, 8, 3);
        
// 36
Integer result = list.stream()
        .reduce(0, (value1, value2) -> value1 + value2);
```

박싱 비용을 줄이기 위한 `IntStream`처럼 기본형에 특화된 스트림으로도 처리할 수 있습니다.
`primitive type`인 int 형태로 반환됩니다. 

```java
// 36
int intResult = list.stream()
        // 또는 .mapToInt(x -> x).sum();
        .mapToInt(Integer::intValue).sum();
```

아래와 같이 "Swift 라는 문자열보다 길고 리스트 중에서 가장 긴 문자열" 이라는
특정 조건을 만족한 것만 추출할 수도 있습니다.

```java
List<String> list = List.of("Java", "C++", "Python", "Ruby");

// Python
String result = list.stream()
        .reduce("Swift", (val1, val2) ->
                val1.length() >= val2.length() ? val1 : val2);
```

<br/>

# 단일 컬렉션 만들기
2차원 배열과 같은 요소를 `flatmap` 메서드를 사용하여 중첩 구조를 제거하고 단일 컬렉션으로 만들 수 있습니다.

```java
String[][] names = new String[][]{
        {"짱구", "철수"}, {"훈이", "맹구"}
};

// 리스트로
List<String> list = Arrays.stream(names)
        .flatMap(Stream::of)
        .collect(Collectors.toList());
        
// 1차원 배열로
String[] flattedNames = Arrays.stream(names)
        .flatMap(Stream::of).toArray(String[]::new);
```

<br/>

# 이어서
스트림 API를 이용한 여러가지 예제에 대해서 알아보았습니다. 
이어지는 포스팅에서는 스트림 API를 사용하면서 주의할 점에 대해서 알아봅니다. 
 
- <a href="/post/mistakes-when-using-java-streams">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>