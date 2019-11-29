---
layout:   post
title:    "[이펙티브 자바 3판] 7장. 람다와 스트림"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter7: Lambdas and Streams"
category: Java
date: "2019-06-30 23:37:39"
comments: true
---

# 목차
- <a href="#아이템-42-익명-클래스보다는-람다를-사용하라">아이템 42. 익명 클래스보다는 람다를 사용하라</a>
- <a href="#아이템-43-람다보다는-메서드-참조를-사용하라">아이템 43. 람다보다는 메서드 참조를 사용하라</a>
- <a href="#아이템-44-표준-함수형-인터페이스를-사용하라">아이템 44. 표준 함수형 인터페이스를 사용하라</a>
- <a href="#아이템-45-스트림은-주의해서-사용하라">아이템 45. 스트림은 주의해서 사용하라</a>
- <a href="#아이템-46-스트림에서는-부작용-없는-함수를-사용하라">아이템 46. 스트림에서는 부작용 없는 함수를 사용하라</a>
- <a href="#아이템-47-반환-타입으로는-스트림보다-컬렉션이-낫다">아이템 47. 반환 타입으로는 스트림보다 컬렉션이 낫다</a>
- <a href="#아이템-48-스트림-병렬화는-주의해서-적용하라">아이템 48. 스트림 병렬화는 주의해서 적용하라</a>

<br>

# 아이템 42. 익명 클래스보다는 람다를 사용하라
> Prefer lambdas to anonymous classes

예전에는 자바에서 함수 타입을 표현할 때 추상 메서드 하나만을 담고 있는 인터페이스 또는 추상 클래스를 사용했다.
이러한 인터페이스를 함수 객체(function object)라고 하며, 특정 함수나 동작을 표현하는데 사용했다.

- <a href="/post/prefer-lambdas-to-anonymous-classes" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 42. 익명 클래스보다는 람다를 사용하라</a>

<div class="post_caption">익명 클래스는 함수형 인터페이스가 아닌 타입의 인스턴스를 만들 때만 사용하자.</div>

<br><br>

# 아이템 43. 람다보다는 메서드 참조를 사용하라
> Prefer method references to lambdas

메서드 참조(method refernce)를 사용하면 함수 객체를 람다보다 더 간결하게 만들 수 있다.

```java
// 람다를 사용한 코드
map.merge(key, 1, (count, incr) -> count + incr);

// 메서드 참조를 사용한 코드
map.merge(key, 1, Integer::sum);
```

그렇다고 항상 메서드 참조가 정답은 아니다. 때로는 람다가 메서드 참조보다 명확한 경우가 있다.


```java
class GoshThisClassNameIsHumongous {
    // action 메서드 정의는 생략

    public void withMethodReference() {
        // 메서드 참조
        servie.execute(GoshThisClassNameIsHumongous::action);
    }

    public void withLambda() {
        // 람다
        service.execute(() -> action());
    }
}
```

위 예제처럼 클래스 이름이 매우 길거나 의미하는 바가 명확하지 않은 경우도 마찬가지다.
예를 들어, ```Function.identity()```를 사용하기보다 똑같은 기능의 ```(x -> x)```와 같은
람다를 사용하는 것이 더 짧고 명확하다.

메서드 참조 유형 | 예시 | 같은 기능의 람다
|:--|:--|:--
정적 | ```Integer::parseInt``` | ```str -> Integer.parseInt(str)```
한정적(인스턴스) | ```Instant.now()::isAfter``` | ```Instant then = Instant.now();``` <br/> ```t -> then.isAfter(t)```
비한정적(인스턴스) | ```String::toLowerCase``` | ```str -> str.toLowerCase()```
클래스 생성자 | ```TreeMap<K,V>::new``` | ```() -> new TreeMap<K,V>()```
배열 생성자 | ```Int[]::new``` | ```len -> new int[len]```

<div class="post_caption">메서드 참조는 람다의 간결한 대안책이 될 수 있다.</div>

<br><br>

# 아이템 44. 표준 함수형 인터페이스를 사용하라
> Favor the use of standard functional interfaces

필요에 따라서 함수형 인터페이스를 직접 구현할 수 있겠지만, 대부분 ```java.util.function``` 패키지가 제공하는
표준 함수형 인터페이스로 해결할 수 있다.

- <a href="/post/favor-the-use-of-standard-functional-interfaces" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 44. 표준 함수형 인터페이스를 사용하라</a>

<div class="post_caption">표준 함수형 인터페이스를 사용하는 것이 대부분 가장 좋은 선택이다.</div>

<br><br>

# 아이템 45. 스트림은 주의해서 사용하라
> Use streams judiciously

스트림은 데이터 원소의 유한 또는 무한 시퀀스(sequence)를 뜻한다. 컬렉션, 배열, 파일 등을 통해서 만들 수 있다.

- <a href="/post/introduction-to-java-streams" target="_blank">자바 스트림 정리: 1. API 소개와 스트림 생성 연산</a>

## 스트림 파이프라인
스트림 파이프라인은 스트림의 원소들로 수행하는 연산 단계를 표현한다. 스트림을 생성하는 연산을 시작으로 종단 연산을 통해 끝나며,
그 사이에는 스트림을 변환하거나 계산하는 한 개 이상의 중간 연산이 포함될 수 있다.

또한 스트림 파이프라인은 지연 평가(lazy evaluation) 된다. 평가는 종단 연산이 호출될 때 진행되며, 종단 연산에 사용되지 않는
데이터는 계산에 사용되지 않는다. 이것이 무한 스트림을 다룰 수 있게 해주는 핵심이다. 그러므로 종단 연산을 잊음녀 안된다.

## 가독성
스트림을 남발하게 되면 오히려 읽기 어려운 코드가 된다.

- <a href="/post/mistakes-when-using-java-streams" target="_blank">자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점</a>

```java
public class Anagrams {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> word.chars().sorted()
                    .collect(StringBuilder::new,
                        (sb, c) -> sb.append((char) c),
                        StringBuilder::append).toString()))
                .values().stream()
                .filter(group -> group.size() >= minGroupSize)
                .map(group -> group.size() + ": " + group)
                .forEach(System.out::println);
        }
    }
}
```

모든 반복문과 같은 로직을 스트림으로 바꾸는 것보다 적절히 분리하는 것이 더 좋다. 특정 로직은 도우미(helper) 메서드로  적절하게
분리하는 것이 도움이 된다. 특히 람다에서는 타입 이름을 자주 생략하므로 매개변수의 이름을 잘 지어야 한다.

```java
public class Anagrams {
    public static void main(String[] args) {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> alphabetize(word)))
                .values().stream()
                .filter(group -> group.size() >= minGroupSize)
                .forEach(g -> System.out.println(g.size() + ": " + g));
        }
    }

    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}
```

## 코드 블록 vs 람다 블록
코드 블록에서는 지역변수를 읽고 수정할 수 있으나, **람다에서는 final 혹은 사실상 final인 변수만** 읽을 수 있다.
지역 변수를 수정하는 것은 불가능하다. 그리고 코드 블록에서는 return 문으로 메서드를 빠져나가거나, break, continue 문을 통하여
블록 바깥에 위치한 반복문을 종료하거나 건너뛸 수 있다. 그런데 람다에서는 불가능하다.

## 그럼 언제 스트림을 사용할까?
스트림 파이프라인은 일단 **하나의 값을 다른 값이 매핑하면 원래의 값을 잃는 구조이다.** 따라서 한 데이터가
파이프라인의 여러 단계를 통과할 때, 이 데이터의 각 단계에서의 값들에 동시에 접근하기 어렵다.
스트림을 사용하기 좋은 경우는 아래와 같다.

- 원소들의 시퀀스를 일관되게 변환하는 경우
- 원소들의 시퀀스를 필터링하는 경우
- 원소들의 시퀀스를 하나의 연산을 사용하여 결합하는 경우(더하기, 최솟값 구하기 등)
- 원소들의 시퀀스를 컬렉션에 모으는 경우
- 원소들의 시퀀스에서 특정 조건을 만족하는 원소를 찾는 경우

<div class="post_caption">스트림과 반복 중 선택을 못하겠다면 둘 다 해보고 정해라</div>

<br><br>

# 아이템 46. 스트림에서는 부작용 없는 함수를 사용하라
> Prefer side-effect-free functions in streams

스트림 패러다임의 핵심은 계산을 일련의 변환(transformation)으로 재구성하는 부분이다. 이때 각 변환 단계는 가능한
이전 단계의 결과를 받아서 처리하는 함수여야 한다. 순수 함수란 오직 입력만이 결과에 영향을 주어야 한다.

종종 이러한 스트림 코드를 작성하는 경우가 있다. 스트림 패러다임을 잘 이해하지 못한 것이다.

```java
// tokens 메서드는 자바 9부터 지원한다.
try (Stream<String> words = new Scanner(file).tokens()) {
    words.forEach(word -> {
        freq.merge(word.toLowerCase(), 1L, Long::sum);;
    })
}
```

모든 연산이 forEach에서 일어나는데, 외부 상태를 수정하는 람다를 실행하면서 문제가 있다. forEach는 스트림의 계산 결과를
보고할 때만 사용하는 것이 좋다.

```java
try (Stream<String> words = new Scanner(file).tokens()) {
    freq = words.collect(groupingBy(String::toLowerCase, counting()));
}
```

> 책의 ```Collectors``` 사용 예제는 아래 링크로 대체합니다.

- <a href="/post/java-streams-terminal-operations" target="_blank">자바 스트림 정리: 3. 스트림 결과 구하기</a>

<div class="post_caption">스트림과 더불어 스트림 관련 객체에 건네지는 모든 함수 객체가 부작용이 없어야 한다.</div>

<br><br>

# 아이템 47. 반환 타입으로는 스트림보다 컬렉션이 낫다
> Prefer Collection to Stream as a return type

원소 시퀀스 타입으로 Collection 인터페이스, Iterable 그리고 배열을 사용했다. 그리고 자바 8부터는 스트림도 추가되었다.
그런데 스트림은 반복(iteration)을 지원하지 않기 때문에 스트림과 반복을 알맞게 조합하여 좋은 코드를 만들어야 한다.
Stream 인터페이스는 Iterable 인터페이스가 정의한 추상 메서드를 전부 포함하였고 Iterable 인터페이스가 정의한 방식대로
동작하지만, ```for-each```로 스트림을 반복할 수 없다. 이유는 Stream이 Iterable을 확장(extends)하지 않았기 때문이다.

```
// 스트림을 반복하기 위해서 이런식으로 할 수 있긴 하다.
public static <E> Iterable<E> iterableOf(Stream<E> stream) {
    return stream::iterator;
}

for (ProcessHandle p : iterableOf(ProcessHandle.allProcesses())) {
    // do something
}
```

정리해보면, 아래와 같은 이유로 반환 타입은 컬렉션이 스트림보다 낫다.

- 동작은 하지만 복잡하고 직관성이 떨어진다.
- Collection은 Iterable 하위 타입이고, Stream 메서드도 지원한다.
- 공개 API의 반환 타입에는 컬렉션이나 그 하위 타입을 쓰는게 보통 최선이다.
- Arrays 역시 asList와 Stream.of 메서드로 쉽게 반복문과 Stream을 지원할 수 있다.

<div class="post_caption">스트림보다 컬렉션을 반환하는 것이 낫다.</div>

<br><br>

# 아이템 48. 스트림 병렬화는 주의해서 적용하라
> Use caution when making streams parallel

스트림을 생성하는 데이터 소스가 ```Stream.iterate```이거나 중간 연산으로 limit를 사용하면 파이프라인 병렬화로는
성능 개선을 기대하기 어렵다.

```java
public static void main(String[] args) {
    // java.math.BigInteger.TWO는 자바 9부터 public 접근이 가능하다.
    primes().map(p -> TWO.pow(p.intValueExact()).subtract(ONE))
        .filter(mersenne -> mersenne.isProbablePrime(50))
        .limit(20)
        .forEach(System.out::println);
}

static Stream<BigInteger> primes() {
    return Stream.iterate(TWO, BigInteger::nextProbablePrime);
}
```

위 코드를 성능을 높인다고 ```parallel()```을 사용하게 되면 응답 불가 상황이 발생한다.
스트림 라이브러리가 병렬화 방법을 찾을 수 없기 때문이다.

## 어떤 경우가 병렬화에 좋을까?
스트림의 소스가 ArrayList, HashMap, HashSet, ConcurrentHashMap의 인스턴스이거나 배열, int, long 일 때 효과가 좋다.
이들은 데이터를 원하는 크기에 **정확하고 쉽게 나눌 수 있어 다수의 스레드에 분배하기 좋기 때문**이다.

또한 **참조 지역성(locally of reference)** 뛰어나다는 점이 있다. 이웃한 원소의 참조들이 연속해서 메모리에 저장되어 있다.
참조 지역성이 좋지 않다면, 스레드는 데이터가 주 메모리에서 캐시 메모리로 전송되어 오는 것을 기다리는 시간이 늘어날 것이다.

종단 연산 중에서는 min, max 와 같이 만들어진 모든 원소를 하나로 합치는 축소(reduction) 연산이 좋다.
또한 ```anyMatch```, ```allMatch```, ```noneMatch``` 처럼 조건이 맞는 경우 즉시 반환되는 메서드도 병렬화에 적합하다.
반면에 가변 축소(mutable reduction)을 수행하는 collect 메서드는 병렬화에 적합하지 않다. 합치는 비용이 크기 때문이다.

따라서, 병렬화를 하더라도 성능 향상이 기대에 못미치는 경우가 있기 때문에 잘 숙지하고 사용해야 하며, 정말로 효과가 있는지
테스트를 반드시 병행해야 한다.

<div class="post_caption">스트림을 잘못 병렬화하면 오동작하거나 성능이 느려진다.</div>