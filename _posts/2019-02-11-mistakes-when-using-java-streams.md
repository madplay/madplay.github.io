---
layout:   post
title:    "자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점"
author:   Kimtaeng
tags: 	  java stream
description: 자바 스트림 API를 사용할 때 실수할 수 있는 부분과 고민해볼 점은 무엇이 있을까?
category: Java
comments: true
---

# 목차
- <a href="/post/introduction-to-java-streams">자바 스트림 정리: 1. API 소개와 스트림 생성 연산</a>
- <a href="/post/java-streams-intermediate-operations">자바 스트림 정리: 2. 스트림의 중간 연산</a>
- <a href="/post/java-streams-terminal-operations">자바 스트림 정리: 3. 스트림 결과 구하기</a>
- <a href="/post/java-streams-examples">자바 스트림 정리: 4. 자바 스트림 예제</a>
- 자바 스트림 정리: 5. 스트림을 사용할 때 주의할 점

<br/>

# 무조건 스트림이 좋을까?
지금까지 스트림을 생성하는 방법과 필요에 맞게 가공하는 중간 연산(Intermediate Operations) 그리고
원하는 결과를 구하는 단말 연산(Terminal Operations)에 대해서 알아보았고 스트림을 활용하는 여러 가지 예제도 살펴보았습니다.

이전보다 더 간결한 코드를 얻게 되었고 비교적 최신 기술을 적용했기 때문에 스트림 API를 활용하는 것이 더 좋아 보일 수 있습니다.
하지만 경우에 따라서 다를 수 있고 오히려 성능이 더 좋지 않을 수 있습니다. 

이번 포스팅에서는 스트림 API를 사용할 때 주의할 부분과 적용할 때 고민해보면 좋을 포인트를 정리해봅시다.

<br/>

# 스트림 재사용
흔하게 접할 수 있는 실수 하나는 스트림을 재사용하는 것입니다. 스트림을 컬렉션처럼 사용했다가 적지않게 겪은 것 같습니다.

```java
// 문자열 스트림 생성
Stream<String> langNames = Stream.of("Java", "C++", "Python", "Ruby");

// 스트림 내 모든 요소 출력
langNames.forEach(System.out::println);

// "Java" 만 제외한 스트림을 다시 생성... Exception이 발생한다.
Stream<String> filtered = langNames.filter(lang -> !lang.equals("Java"));
filtered.forEach(System.out::println);
```

위 코드를 실행하면 `IllegalStateException`이 발생합니다.

<div class="post_caption">java.lang.IllegalStateException: stream has already been operated upon or closed</div>

스트림은 오직 한 번만 소비될 수 있기 때문에 사용한 이후에 다시 사용하는 경우 에러를 발생시킬 수 있습니다.

<br/>

# 스트림은 무조건 좋다
기존의 배열이나 컬렉션을 반복하는 `for-loop` 문장을 스트림의 `foreach`로 변경하는 경우도 많습니다.
하지만 성능을 비교해보면 무조건적으로 스트림이라고 성능적으로 빠른 것은 아닙니다.

10만개의 랜덤값이 들어있는 배열에서 가장 큰 값을 찾는 코드가 있습니다. 첫 번째는 기본 `for-loop`를 이용하여 찾고
두 번째 방법으로 `Stream`을 이용해서, 마지막으로 병렬 수행이 가능한 `Parallel Stream`으로 수행했을 때의
수행 속도 차이를 비교해봅시다.

```java
// new Random().nextInt로 초기화된 배열로 가정
int[] intArray;

// Case 1: for-loop
int maxValue1 = Integer.MIN_VALUE;
for (int i = 0; i < intArray.length; i++) {
    if (intArray[i] > maxValue) {
        maxValue1 = intArray[i];
    }
}

// Case 2: Stream
int maxValue2 = Arrays.stream(intArray)
    .reduce(Integer.MIN_VALUE, Math::max);

// Case 3: Parallel Stream
int maxValue3 = Arrays.stream(intArray).parallel()
    .reduce(Integer.MIN_VALUE, Math::max);    
```

측정 시간은 각 Case에 수행 전과 후에 `System.nanoTime()`로 측정했으며, `TimeUnit` 클래스를 사용하여 밀리초 단위로 변환했습니다.

```java
// nanoseconds to milliseconds
TimeUnit.MILLISECONDS.convert((endTime - startTime), TimeUnit.NANOSECONDS)
```

출력 결과는 어떻게 나올까요? 기본 for-loop를 사용했을 때 가장 빠릅니다. 

```bash
for-loop: 8ms
Stream: 123ms
Parallel Stream: 15ms
```

관련 참고자료를 인용하면, 단순 `for-loop`의 경우 오버헤드가 없는 단순한 인덱스 기반 메모리 접근이기 때문에
`Stream`을 사용했을 때보다 더 빠르다고 합니다. ("It is an index-based memory access with no overhead whatsoever.")

또, 컴파일러의 관점에서 오랫동안 유지해온 for-loop의 경우 최적화를 할 수 있으나 반대로 비교적 최근에 도입된 스트림의 경우 
for-loop와 같은 정교한 최적화를 수행하지 않습니다.

따라서 모든 for-loop를 Stream을 이용해 변경하는 것은 어떻게보면 오히려 성능을 더 떨어뜨릴 수 있습니다. 

<br/>

# 가독성
소제목은 '가독성(readability)' 이지만 스트림을 사용하면서 주의해야 한다기보다는 조금 고민해볼만한 부분이라고 할 수 있습니다.
특히 다른 사람들과 같이 개발을 진행할 때 말이지요. 코드 리뷰를 하다보면 "코드가 라인 수가 줄어들었고 가독성이 좋아졌다." 라고
하지만 이는 어떻게 보면 팀원 모두가 스트림 API 사용에 익숙해야 하는 조건이 필요합니다.

개인적으로도 Java 8 버전 이상의 코드 스타일이 익숙하지 않아서 리뷰에 어려움이 있었던 적이...

문자열이 들어있는 배열에서 특정 문자열을 찾고 출력하는 코드는 아래와 같이 두 가지 방법으로 작성할 수 있습니다.

```java
// array
String[] languages = {"Java", "C", "Python", "Ruby", "C++", "Kotlin"};
        
// for-loop
String result = "";
for (String language : languages) {
    if (language.equals("Java")) {
        result = language;
        break;
    }
}
if(result != null && result != "") {
    System.out.println(result);
}

// Stream
Arrays.stream(languages)
        .filter(lang -> lang.equals("Java"))
        .findFirst().ifPresent(System.out::println);
```

자바8의 스트림을 이용하여 여러 if 조건문과 결과를 담는 부수적인 변수 할당도 사라졌습니다.
짧고 간결한 코드가 되는 것에는 전적으로 공감할 수 있습니다. 메서드의 네이밍도 명확하기 때문에 이해하기도 쉽습니다.
물론 이부분은 앞서 말한 것처럼 스트림 API에 익숙해야하며 개인차이가 있을 수도 있습니다.

<br/>

# 무한 스트림
기존에 생성된 배열이나 컬렉션을 통해서 스트림을 생성하는 경우에는 이슈가 없을 수 있으나, 특정 조건에 따라서
스트림을 생성하는 경우에는 무한 스트림(Infinite Streams)이 생성될 수 있습니다. 심지어 요소 개수에 제한을 걸었음에도 불구하고요.

```java
Stream.iterate(0, i -> (i + 1) % 2)
        .distinct()
        .limit(10)
        .forEach(System.out::println);
System.out.println("코드 실행 종료");
```

위 코드의 각 라인을 설명하면 아래와 같습니다.

- `iterate`: 2로 나머지 연산을 했으므로 0과 1을 반복적으로 생성합니다.
- `distinct`: 각각 단일 0과 1을 유지합니다.
- `limit`: 10개의 스트림 크기 제한이 생깁니다.
- `forEach`: 생성된 스트림 요소를 모두 출력합니다.

위 코드에서  `distinct` 연산자는 스트림을 생성하는 `iterate` 메서드에서 0과 1만 생성된다는 것을 알지 못합니다.
따라서 요소의 개수를 10개로 제한하는 `limit` 연산에 도달할 수 없습니다.

그러므로 이어지는 `forEach`를 이용한 요소 출력도 진행되지 않으며, 모든 코드가 종료된 것을 출력하는 문장도
수행되지 않습니다. 코드는 종료되지 않고 계속 리소스를 차지하게 됩니다.

물론 `distinct`와 `limit`의 순서를 바꾸면 정상적으로 수행됩니다.
생성될 스트림의 요소에 개수 제한을 걸고 그 이후에 중복을 제거하면 되지요.

```java
Stream.iterate(0, i -> (i + 1) % 2)
        .limit(10)
        .distinct()
        .forEach(System.out::println);
System.out.println("코드 실행 종료");

// 0
// 1
// 코드 실행 종료
```

<br/>

# 변수 접근
스트림을 이용하면서 람다(lambda) 또는 메서드 참조(method references)를 사용하는 경우에는 지역 변수(local variables)에
접근할 수 없습니다.

```java
int sumForLambda = 0;
for (int i = 0; i < 5; i++) {
    // it works!
    sumForLambda += i;
}

int sumForloop = 0;
IntStream.range(0, 5).forEach(i -> {
    // compile error
    sumForloop += i;
}); 
```

그리고 스트림의 파이프라인에서 연결된 각 단계의 값들에 접근할 수 없습니다.
`peek` 메서드로 연산 사이의 결과를 확인하고 싶지만 불가능합니다.

```java
Arrays.stream(array)
        .filter(first -> first % 2 == 0)
        .filter(second -> second > 3)
        .peek(value -> {
            // compile error, can't access second filter's variable
            int printValue = value + second;
            System.out.println(printValue);
        })
        .sum();
```

참고로 `peek` 메서드의 경우 스트림의 결과를 구하는 단말 연산(Terminal Operations)이 실행되지 않으면
메서드 자체가 실행되지 않습니다. 위의 예제에서는 `sum` 메서드가 단말 연산으로 실행되었습니다.

<br/>

# 스트림의 동작 순서
스트림을 사용할 때는 동작 방식을 이해할 필요가 있습니다. 아래와 같이 3개의 요소를 가진 배열로 스트림 연산을 수행하는
코드가 있습니다. 그리고 연결된 각 메서드마다 출력문으로 메서드가 실행되었는지 확인합니다.

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .filter(word -> {
            System.out.println("Call filter method: " + word);
            return word.length() > 3;
        })
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.substring(0, 3);
        }).findFirst();
```

결과는 어떻게 나올까요? 3개의 요소에 대해서 메서드를 수행하므로 각각 3번의 호출이 이뤄질 것 같지만,
출력 결과는 그렇지 않습니다.

```java
Call filter method: c
Call filter method: python
Call map method: python
```

위 결과를 통해서 스트림의 동작 방식을 유추할 수 있는데요. 
스트림 내의 모든 요소가 중간 연산인 `filter` 메서드를 수행하는 것이 아니라 요소 하나씩 모든 파이프라인을 수행합니다.

따라서 조금 더 자세히 살펴보면 아래와 같이 단계적으로 수행됩니다.

- 배열의 첫 번째 요소 "c"
  - filter 메서드가 실행되지만 length가 3보다 크지 않으므로 다음으로 진행되지는 않음
  - "Call filter method: c" 출력
- 배열의 두 번째 요소 "python"
  - filter 메서드가 실행되며 length가 3보다 크므로 다음으로 진행됨
  - "Call filter method: python" 출력
  - map 메서드에서 substring 메서드를 수행합니다.
  - "Call map method: python" 출력
  - 마지막 연산인 `findFirst`가 수행됩니다. 
- 조건에 맞는 하나의 결과를 찾았기 때문에 다음 요소인 "java"에 대해 연산을 수행하지 않습니다. 
  - 최종 결과는 "pyth" 입니다.  

<br/>

# 성능 개선
이러한 특성을 잘 이용하면 스트림의 성능을 조금 더 개선할 수 있습니다. 아래와 같이 배열의 모든 문자열 요소를
대문자로 변환하는 코드가 있습니다. 그리고 수행된 결과에서 2개를 생략하여 리스트로 만듭니다.

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.toUpperCase();
        })
        .skip(2)
        .collect(Collectors.toList());

// Call map method: c
// Call map method: python
// Call map method: java
```

`map` 메서드가 총 3번 호출되는 것을 알 수 있습니다. 여기서 메서드의 실행 순서를 변경하면 어떻게 될까요?

```java
Arrays.stream(new String[]{"c", "python", "java"})
        .skip(2)
        .map(word -> {
            System.out.println("Call map method: " + word);
            return word.toUpperCase();
        })
        .collect(Collectors.toList());

// Call map method: java
```

물론 `filter` 메서드와 같은 특정 조건을 추가해서 사용할 때는 `skip` 메서드의 위치에 따라서 결과가
달라질 수 있으므로 주의해야 합니다.

```java
List<String> list = Arrays.stream(new String[]{"abc", "abcd", "abcde", "abcdef"})
        .filter(word -> word.length() > 3)
        .map(word -> word.toUpperCase())
        .skip(2)
        .collect(Collectors.toList());
        
// ABCDEF 
list.forEach(System.out::println);

List<String> list2 = Arrays.stream(new String[]{"abc", "abcd", "abcde", "abcdef"})
        .skip(2)
        .filter(word -> word.length() > 3)
        .map(word -> word.toUpperCase())
        .collect(Collectors.toList());
        
// ABCDE
// ABCDEF 
list2.forEach(System.out::println);
```

<br/>

# 참고 자료
- <a href="https://jaxenter.com/java-performance-tutorial-how-fast-are-the-java-8-streams-118830.html" 
rel="nofollow" target="_blank">How fast are the Java 8 streams? - Angelika Langer</a>
- <a href="https://blog.jooq.org/2014/06/13/java-8-friday-10-subtle-mistakes-when-using-the-streams-api/"
rel="nofollow" target="_blank">10 Subtle Mistakes When Using the Streams API</a>