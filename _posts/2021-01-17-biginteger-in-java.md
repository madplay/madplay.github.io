---
layout:   post
title:    "자바 BigInteger: 매우 큰 정수 표현"
author:   Kimtaeng
tags:    java biginteger
description: 자바에서 매우 큰 정수를 표현하려면 어떻게 해야 할까?  
category: Java
date: "2021-01-17 02:11:31"
comments: true
---

# 매우 큰 정수 표현
가끔 알고리즘 문제를 풀다 보면 Small Input, Large Input과 같은 식으로 입력 또는 출력값의 범위가 나뉘어 있는 것을 볼 수 있다.
대부분 자바에서 제공하는 기본형 데이터 타입으로 해결할 수 있겠지만 그렇지 않은 경우도 많다.

예를 들면, 기본적으로 정수를 표현하는 `int` 타입은 $${ -2 }^{ 31 }$$ ~ $${ 2 }^{ 31 } - 1$$ 범위의 정수만을 표현할 수 있다.
물론 이보다 더 큰 값을 담을 수 있는 `long` 타입이 있지만, $${ -2 }^{ 63 }-1$$ 까지밖에 담지 못하는 제한이 있다.

- <a href="/post/java-data-type">참고 링크: 자바의 데이터 타입</a>

사실 `long` 타입은 억, 조 단위를 넘어선 경 단위이기 때문에 일반적인 상황에서는 이 정도 단위도 매우 크다.
하지만 상한, 하한이 없는 거의 무한에 가까운 수를 표현해야 할 때도 있는데, 이때는 `BigInteger` 클래스를 사용하면 된다.

<br>

# 선언 방법
`BigInteger` 클래스는 `java.math` 패키지 안에 있으며 클래스에 선언된 Javadoc 코멘트처럼 불변한 임의의
정밀한 정수("Immutable arbitrary-precision integers")다. `BigInteger` 인스턴스는 보통 문자열을 기반으로 생성하지만,
아래와 같이 인스턴스를 생성하기 위한 다양한 생성자와 정적 팩토리 메서드를 제공한다.

```java
// 16진법
BigInteger bigIntWithRadix = new BigInteger("64", 16);

// 정수로 생성
BigInteger bigIntWithValue = BigInteger.valueOf(100);

// 문자열
BigInteger bigIntWithString = new BigInteger("100");
```

<br>

# 사칙연산
## 더하기(add)
`add` 메서드를 사용하면 `BigInteger` 인스턴스끼리 더하기 연산을 할 수 있다. 예제에서 사용하는 `BigInteger.TEN`은 `BigInteger` 클래스에서 제공하는
전역에서 접근 가능한 상수다. `ONE`, `NEGATIVE_ONE` 그리고 자바 9부터 사용 가능한 `TWO` 등이 있다.

```java
BigInteger value = new BigInteger("10");

// 20
BigInteger result = value.add(BigInteger.TEN);
```

## 빼기(subtract)
`subtracct` 메서드를 사용하여 빼기 연산을 할 수 있다.

```java
BigInteger value = BigInteger.TEN;

// 8
BigInteger result = value.subtract(BigInteger.TWO);
```

## 곱하기(multiply)
곱하기 연산은 `multiply` 메서드를 사용하면 된다.

```java
BigInteger value = BigInteger.valueOf(3);

// 6
BigInteger result = value.multiply(BigInteger.TWO);
```

## 나누기(divide)
`divide` 연산을 사용하면 `BigInteger` 인스턴스끼리 나눗셈 연산을 할 수 있다.

```java
BigInteger value = BigInteger.TEN;
	
// 5
BigInteger result = value.divide(BigInteger.TWO);
```

<br>

# 비트 연산
`BigInteger` 클래스는 다루는 데이터가 크고 불변 객체인 만큼 `long` 타입과 비교했을 때 성능이 좋지 않다.
따라서 이를 보완하기 위해 비트 단위로 연산할 수 있는 몇 가지 메서드를 제공한다.

- <a href="/post/effectivejava-chapter4-classes-and-interfaces#불변-클래스와-불변-객체의-특징">참고 링크: "이펙티브 자바: 아이템 17. 변경 가능성을 최소화하라"</a>


## 비트 길이(bitLength)
`bitLength` 메서드를 이용하면 `BigInteger`가 표현하는 값을 2진수로 표현했을 때 필요한 bit 개수를 구할 수 있다.

```java
BigInteger value = BigInteger.TEN;

// 4
value.bitCount()


// 참고로 2진수로 변환은 아래와 같이 하면 된다.
// 결과 값은 1010    
value.toString(2);
```

## 비트 확인(testBit)
`testBit` 메서드를 사용하면 지정한 위치의 비트가 1 또는 0인지 확인할 수 있다. 파라미터로 정수를 받는데, 
`BigInteger`가 표현하는 값을 2진수 비트로 나열했을 때 오른쪽 끝에서부터 n+1 번째 비트를 검사한다.

```java
BigInteger value = BigInteger.TEN;

// false
value.testBit(0);
```

## 쉬프트 연산(shiftLeft, shiftRight)
아래와 같이 비트 단위 쉬프트(shift) 연산도 할 수 있다. 예제에서는 비트 이동을 확인하기 위해 `toString` 메서드에
radix(진법) 파라미터를 2로 지정하여 2진법 비트로 출력했다.


```java
BigInteger value = BigInteger.TEN;

// value: 1010
value.toString(2)

// shiftLeft: 10100
value.shiftLeft(1).toString(2)

// shiftRight: 101
value.shiftRight(1).toString(2)
```

# 그 밖의 메서드
## 나머지(reminder)
`reminder` 메서드를 사용하면 나눗셈 결과의 나머지를 구할 수 있다.

```java
BigInteger value = new BigInteger("3");

// 1
value.remainder(BigInteger.TWO);
```


## 값 비교(compareTo)
`compareTo` 메서드로 `BigInteger` 클래스의 인스턴스끼리 값을 비교할 수 있다. 파라미터로 전달되는 값보다 크면 1,
같으면 0 그리고 작은 경우 -1을 반환한다.

```java
BigInteger value = BigInteger.TEN;

// 1
value.compareTo(BigInteger.TWO);

// 0
value.compareTo(BigInteger.TEN);

// -1
BigInteger.TWO.compareTo(value);
```


## 최대, 최소(max, min)
`max`, `min` 메서드를 사용하면 파라미터로 전달되는 값과 비교하여 최대, 최솟값을 구할 수 있다.

```java
BigInteger value = BigInteger.TEN;

// 10
value.max(BigInteger.TWO);

// 2 
value.min(BigInteger.TWO);
```