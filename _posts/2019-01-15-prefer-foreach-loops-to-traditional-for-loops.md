---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 58. Prefer for-each loops to traditional for loops" 
category: Java
comments: true
---

# 배열과 컬렉션 순회
보통 배열과 컬렉션의 요소를 탐색할 때 아래와 같이 사용합니다.

```java
// some list
List<String> list = new ArrayList<>();

// 컬렉션을 순회하는 방법 - for loop
for (Iterator<String> iterator = list.iterator(); iterator.hasNext(); ) {
    String element = iterator.next();
    // do something
}

// 컬렉션을 순회하는 방법 - while loop
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String element = iterator.next();
    // do something
}

// 배열을 순회하는 방법
String[] arr = new String[]{"a", "b", "c"};
for (int index = 0; index < arr.length; index++) {
    String element = arr[index];
    // do something
}
```

위 코드를 보면 반복자(iterator)나 인덱스 탐색을 위한 변수들은 코드를 지저분하게 만들 수 있고
실제로 필요한 원소(element)를 얻기 위한 부수적인 코드일 뿐입니다. 혹시라도 잘못된 변수 사용으로 인해
예상치 못한 오류가 발생할 수 있습니다.

<br/>

# for-each
실제로 필요한 것은 컬렉션 또는 배열의 원소(element)이므로 대부분 `for-each`문을 사용하면 좋습니다.
**for-each** 문은 향상된 for 문(enhanced for statement)이라는 정식 명칭을 가지고 있으며
반복자와 인덱스 변수를 사용하지 않아 코드가 깔끔하고 잘못된 변수 사용으로 오류가 발생할 일도 없습니다.

```java
// 기존의 for loop
for (int index = 0; index < arr.length; index++) {
    String element = arr[index];
    // do something
}

// for each
for (String element : arr) {
    // do something
}
```

여기서 콜론(:)은 "안의(in)" 라고 읽습니다. 위 코드는 "arr 배열 안의 각 원소 element" 라고 읽으면 되겠네요.
한편 컬렉션을 중첩하여 2중으로 순회해야 한다면 `for-each` 문의 장점은 더 커집니다.

```java
// 2중 for each
for (Suit suit : suits) {
    for (Rank rank : ranks) {
        deck.add(new Card(suit, rank));
    }
}
```

<br/>

# for-each를 사용할 수 없는 상황
아쉽게도 `for-each` 문장을 사용할 수 없는 상황이 있습니다.

**필터링: Filtering,** 컬렉션을 순회하면서 선택된 엘리먼트를 제거해야 한다면 아래와 같이 반복자(iterator)를 명시적으로
사용해야만 합니다. remove 메서드를 호출해야 하기 때문인데요. 

**foreach** 문장을 사용하여 리스트 자체를 수정하게 되는 경우에는 `ConcurrentModificationException`이 발생할 겁니다.
기본적으로 리스트는 순회중인 상태에서 자기 자신에 대한 삭제와 같은 변경을 할 수 없게 되어 있습니다.
따라서 `Iterator`를 사용해야 합니다.

```java
// some list
List<String> list = new ArrayList<>();
list.add("a"); list.add("b"); list.add("c");

for (Iterator<String> iterator = list.iterator(); iterator.hasNext(); ) {
    String element = iterator.next();
    if(element.equals("a")) {
        iterator.remove();
    }
    // do something
}
```

하지만 `Java 8` 부터는 Collection의 `removeIf` 메서드를 이용하여 컬렉션을 명시적으로 순회하지 않아도 됩니다.

```java
// Lambda
list.removeIf(s -> s.equals("a"));

// 위 코드를 풀어서 표현하면,
list.removeIf(new Predicate<String>() {
    @Override
    public boolean test(String s) {
        return s.equals("a");
    }
});
```

**변형: Transforming,** 그리고 순회하면서 그 원소의 값 일부나 전체를 변경해야 한다면 반복자 혹은 배열의 인덱스를 사용해야 합니다.

```java
// some array
String[] arr = new String[]{"a", "b", "c"};

// index를 사용할 수 밖에 없다.
for (int index = 0; index < arr.length; index++) {
    String s = arr[index];
    if(s.equals("a")) {
        arr[index] = "d";
    }
}
```

**병렬 순회: Parallel iteration,** 마지막으로 여러 개의 컬렉션을 병렬적으로 순회해야 한다면 각각의 반복자와 인덱스 변수를
사용하여 엄격하고 명시적으로 제어해야 합니다. 그렇지 않으면 아래와 같은 문제가 발생할 수 있습니다.

```java
enum Suit {
    CLUB, DIAMOND, HEART, SPADE
}

enum Rank {
    ACE, DEUCE, THREE, FOUR, 
    // ... 생략 
    QUEEN, KING
}

List<Card> deck = new ArrayList<>();
List<Suit> suits = Arrays.asList(Suit.values());
List<Rank> ranks = Arrays.asList(Rank.values());
for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
    for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); ) {
        // next 메서드가 숫자(suit) 하나당 불려야 하는데
        // 카드(Rank) 하나당 불리고 있다.
        deck.add(new Card(i.next(), j.next()));
    }
} 
```

반복자의 `next` 메서드가 Suit를 탐색하는 루프 1회마다 불려야 하는데, Rank를 탐색하는 루프가 수행될 때마다
불리고 있어서 결국 모든 숫자(Suit)를 탐색하게 되어 `NoSuchElementException`이 발생하게 됩니다.

위에서 살펴본 상황에 속하게 될 경우 일반적인 for 문을 사용해야 합니다. `for-each` 문은 컬렉션과 배열은 물론
`Iterable` 인터페이스를 구현한 객체라면 무엇이든 순회할 수 있습니다.