---
layout:   post
title:    "[이펙티브 자바 3판] 9장. 일반적인 프로그래밍 원칙"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter9: General Programming"
category: Java
date: "2019-08-14 22:39:53"
comments: true
---

# 목차
- <a href="#아이템-57-지역변수의-범위를-최소화하라">아이템 57. 지역변수의 범위를 최소화하라</a>
- <a href="#아이템-58-전통적인-for-문보다는-for-each-문을-사용하라">아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라</a>
- <a href="#아이템-59-라이브러리를-익히고-사용하라">아이템 59. 라이브러리를 익히고 사용하라</a>
- <a href="#아이템-60-정확한-답이-필요하다면-float와-double은-피하라">아이템 60. 정확한 답이 필요하다면 float와 double은 피하라</a>
- <a href="#아이템-61-박싱된-기본-타입보다는-기본-타입을-사용하라">아이템 61. 박싱된 기본 타입보다는 기본 타입을 사용하라</a>
- <a href="#아이템-62-다른-타입이-적절하다면-문자열-사용을-피하라">아이템 62. 다른 타입이 적절하다면 문자열 사용을 피하라</a>
- <a href="#아이템-63-문자열-연결은-느리니-주의하라">아이템 63. 문자열 연결은 느리니 주의하라</a>
- <a href="#아이템-64-객체는-인터페이스를-사용해-참조하라">아이템 64. 객체는 인터페이스를 사용해 참조하라</a>
- <a href="#아이템-65-리플렉션보다는-인터페이스를-사용하라">아이템 65. 리플렉션보다는 인터페이스를 사용하라</a>
- <a href="#아이템-66-네이티브-메서드는-신중히-사용하라">아이템 66. 네이티브 메서드는 신중히 사용하라</a>
- <a href="#아이템-67-최적화는-신중히-하라">아이템 67. 최적화는 신중히 하라</a>
- <a href="#아이템-68-일반적으로-통용되는-명명-규칙을-따르라">아이템 68. 일반적으로 통용되는 명명 규칙을 따르라</a>

<br/>

# 아이템 57. 지역변수의 범위를 최소화하라
> Minimize the scope of local variables

## 지역변수는 사용할 때 선언하고 초기화해야 한다.
옛날 방식의 습관으로 코드 블록의 첫 부분에 변수를 선언하는 경우가 많았다. 하지만 자바는 어디에서 선언해도 된다. 그렇기 때문에 처음 사용할 때 선언하면
지역변수의 범위를 줄일 수 있다. 그리고 모든 지역변수는 선언과 함께 초기화해야 초깃값을 헷갈리는 경우가 없다.

아직 지역변수를 초기화할 수 없다면 초기화할 수 있을 때 선언하면 된다. 다만 `try-catch` 문장에서는 예외다. try 블록 밖에서도 변수를 사용해야 한다면
지역변수의 **선언은 try 문장 밖에서** 진행하고 초기화는 **try 문장 안에서** 해야 한다.

## 반복문은 while 보다 for 문을 권장한다.
while 문을 사용하면 반복문 밖으로 불필요한 변수가 선언된다.

```java
Iterator<Element> i = c.iterator(); // 불필요하다.
while (i.hasNext()) {
  doSomething(i.next());
}
```

for 문을 사용하면 반복 변수(loop variable)의 범위가 반복문 내부로 제한된다.
따라서 똑같은 이름의 변수를 여러 반복문에서 사용해도 어떠한 영향이 없다.

```java
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    // e와 i로 무언가 한다.
}
```

지역변수의 범위를 줄일 수 있는 또 다른 방법은 메서드를 작게 유지하고 한 가지 기능에만 집중하면 된다. 여러 가지 기능을 처리하게 되면 다른 기능을 수행하는
코드에서 접근할 가능성이 있다. 메서드를 기능별로 나누면 간단해진다.

<div class="post_caption">지역변수의 범위를 최소화해야 잠재적인 오류를 줄일 수 있다.</div>

<br/>

# 아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라
> Prefer for-each loops to traditional for loops

배열과 컬렉션의 요소를 탐색할 때 보통 `for` 문을 사용했다. 특히 반복자(iterator)나 인덱스 탐색을 위한 루프 변수는
실제로 필요한 원소를 얻기 위한 코드일 뿐이다. 따라서 불필요하며 오히려 잘못 사용한 경우 오류가 발생할 가능성이 높다.

그래서 **향상된 for 문**(enhanced for statement)인 `for-each` 문장을 권장한다.

- <a href="/post/prefer-foreach-loops-to-traditional-for-loops" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 58. 전통적인 for 문보다는 for-each 문을 사용하라</a>

<div class="post_caption">for-each 문은 명료하고 유연하며 버그를 예방해주며 성능 저하도 없다.</div>

<br/>

# 아이템 59. 라이브러리를 익히고 사용하라
> Know and use the libraries

## 표준 라이브러리를 사용하면 좋은 점

- 그 코드를 작성한 전문가의 지식과 경험을 활용할 수 있다.
- 핵심적인 일과 관련없는 시간 소비가 줄어든다.
- 따로 노력하지 않아도 성능이 지속해서 개선된다.
- 기능이 점점 많아진다. 커뮤니티에서의 요구, 논의가 대부분 다음 릴리즈에 기능이 추가된다.
- 많은 사람들에게 익숙한 코드가 되기 때문에 읽기 좋고, 유지보수하기 좋고, 재활용하기 좋다.

## 서드 파티 라이브러리
대부분의 표준 라이브러리는 메이저 릴리즈마다 주목할 만한 많은 기능이 추가된다. 자바 개발자라면 `java.lang`, `java.util`, `java.io`와
그 하위 패키지들에는 익숙해지자. 원하는 기능이 없다면 서드 파티(third-party) 라이브러리를 찾아보자.

<div class="post_caption">직접 작성하는 것보다 라이브러리를 쓰는 것이 좋은 경우가 많다.</div>

<br/>

# 아이템 60. 정확한 답이 필요하다면 float와 double은 피하라
> 60: Avoid float and double if exact answers are required

`float`와 `double`은 과학과 공학 계산용도로 설계되었다. 넓은 범위의 수를 빠르고 정밀한 '근사치'로 계산하도록 설계되었다.
따라서 0.1 또는 10의 음의 거듭 제곱 등을 표현할 수 없기 때문에 금융 관련 계산에는 적합하지 않다.

```java
System.out.println(1.03 - 0.42);
// 예상: 0.61
// 실제: 0.6100000000000001
```

정확한 계산이 필요할 땐 `BigDecimal`, `int` 또는 `long`을 사용하면 된다.

하지만 `BigDecimal`에는 primitive 타입보다 사용하기 불편하고 성능적으로 훨씬 느리다.
이때는 `int` 또는 `long` 타입을 사용해야 하는데, 값의 크기가 제한되고 소수점을 직접 관리해야 하는 점이 있다.

성능 저하를 크게 신경 쓰지 않는다면 `BigDecimal`을 사용하고 숫자가 너무 크지 않다면 `int`나 `long` 타입을 사용하자.
9자리 십진수로 표현할 수 있다면 `int` 타입, 18자리 십진수로 표현할 수 있다면 `long` 타입, 18자리가 넘어가면 `BigDecimal`을 사용하면 된다.

<div class="post_caption">정확한 계산이 필요할 때는 float와 double은 피하자.</div>

<br/>

# 아이템 61. 박싱된 기본 타입보다는 기본 타입을 사용하라
> Prefer primitive types to boxed primitives

자바의 데이터 타입은 `int`, `double`, `boolean` 같은 기본형과 `String`, `List` 같은 참조형으로 분류할 수 있다.
그리고 각각의 기본형에 대응되는 참조 타입이 하나씩 있다. 예를 들면 `Integer`, `Double`, `Boolean` 등이다.

자바에는 오토박싱과 오토언박싱이 지원되기 때문에 기본 타입과 박싱된 기본 타입을 크게 구분하지 않고 사용할 수 있지만 차이가 있다.

첫 번째로 기본 타입은 값만 같지만 박싱된 기본 타입은 값과 식별성(identity) 속성을 갖는다. 즉, 두 인스턴스가 값이 같더라도 다르다고 식별된다.
두 번째로 기본 타입은 항상 유효한 값을 갖지만 박싱된 기본 타입은 `null`을 가질 수 있다. 마지막으로 기본 타입이 박싱된 기본 타입보다 상대적으로
시간, 메모리 사용면에서 더 효율적이다.

## 문제 사례 1 - 잘못 사용된 비교
```java
Comparator<Integer> naturalOrder = (i, j) -> (i < j) ? -1 : (i == j ? 0 : 1);

// 반환되는 값은?
naturalOrder.compare(new Integer(42), new Integer(42));
```

위의 비교자 코드를 보면 박싱된 기본 타입에 `==` 연산자를 사용한다. 즉, 객체 참조의 식별성을 검사하기 때문에 결과는 1이 반환된다.

## 문제 사례 2 - 오류
```java
public class Unbelievable {
  static Integer i;

  public static void main(String[] args) {
    if (i == 42) {
      System.out.println("Hello!");
    }
  }
}
```

위 코드를 실행하면 "Hello!"를 출력하지 않지만 `NullPointerException`을 발생시킨다. 다른 참조 타입과 마찬가지로 초기값이 `null`인 것이 이유다.
**기본 타입과 박싱된 기본 타입을 혼용하는 연산에서는 박싱된 기본 타입의 박싱이 해제**된다. 해결 방법은 i를 `int`로 선언해주면 된다.

## 문제 사례 3 - 성능 저하
```java
private static long sum() {
  Long sum = 0L;
  for (long i = 0; i <= Integer.MAX_VALUE; i++>) {
    sum += i;
  }
  return sum;
}
```

위 코드에서는 박싱과 언박싱이 반복해서 일어나 성능이 느려진다.

## 그렇다면 박싱된 기본 타입은 언제 사용할까?
컬렉션의 원소, 키, 값에 사용한다. 컬렉션에서는 기본 타입을 담을 수 없기 때문에 박싱된 기본 타입을 사용해야 한다. 또한 매개변수화 타입이나
메서드의 타입 매개변수로는 박싱된 기본 타입을 사용해야 한다. 그리고 리플렉션을 통한 메서드 호출을 할 때도 박싱된 기본 타입을 사용한다.

<div class="post_caption">박싱된 기본 타입을 사용해야 한다면 주의를 기울이자.</div>

<br/>

# 아이템 62. 다른 타입이 적절하다면 문자열 사용을 피하라
> Avoid strings where other types are more appropriate

<br/>

# 아이템 63. 문자열 연결은 느리니 주의하라
> Beware the performance of string concatenation

<br/>

# 아이템 64. 객체는 인터페이스를 사용해 참조하라
> Refer to objects by their interfaces

<br/>

# 아이템 65. 리플렉션보다는 인터페이스를 사용하라
> Prefer interfaces to reflection

<br/>

# 아이템 66. 네이티브 메서드는 신중히 사용하라
> Use native methods judiciously

<br/>

# 아이템 67. 최적화는 신중히 하라
> Optimize judiciously

<br/>

# 아이템 68. 일반적으로 통용되는 명명 규칙을 따르라
> Adhere to generally accepted naming conventions