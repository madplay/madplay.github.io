---
layout:   post
title:    "결합도와 응집도는 무엇일까?"
author:   Kimtaeng
tags:     coupling cohesion module
description: "낮은 결합도(Coupling)와 높은 응집도(Cohesion)를 갖도록 설계해야 하는 이유는 무엇일까?"
category: Knowledge
date: "2021-01-04 19:46:49"
comments: true
---

# 시작하기에 앞서
결합도(Coupling)과 응집도(Cohesion)에 대해서 알아보기 전에 **모듈(Module)과 모듈화(Modularization)**에 대해
먼저 알아볼 필요가 있다.

**모듈화란** 소프트웨어를 각 기능별로 나누는 것을 말한다. 그리고 각각의 기능별로 나눠진 모듈화의 결과를
**모듈(Module)**이라고 하며 서브루틴(Subroutine), 소프트웨어 내의 프로그램 또는 작업 단위 등의 의미로 사용된다.
여기서 **좋은 모듈화는 목적에 맞는 기능만으로 모듈을 나누는 것**이다. 각각의 모듈은 주어진 기능만을 독립적으로 수행하며
다른 모듈과 적게 연관돼야 한다.

즉, **독립성이 높은 모듈일수록 좋다.** 독립성이 높으면 해당 모듈을 수정하더라도 다른 모듈에 끼치는 영향이 적으며
오류가 발생하더라도 쉽게 문제를 발견하고 해결할 수 있는 장점을 갖는다.

한편 **모듈의 독립성은 모듈의 결합도(Coupling)과 응집도(Cohesion)로 측정한다.** 결론적으로는 모듈의 독립성을 높이기
위해서는  모듈 간의 상호 의존 정도를 나타내는 결합도를 낮추고 모듈이 독립적으로 자체 기능만을 수행하도록
응집도를 높여야 한다.

어떻게 하면 모듈의 독립성을 높일 수 있는지 결합도와 응집도를 예제와 함께 알아보자.

> 소프트웨어 공학에서 모듈의 독립성을 높이는 방법에는 모듈의 크기 축소도 포함됩니다.
> 다만, 모듈의 독립성을 측정하는 요소에는 포함되지 않아 본문에서는 제외했습니다.

<br><br>

# 결합도(Coupling)란?
결합도는 서로 다른 모듈 간에 상호 의존하는 정도 또는 연관된 관계를 의미한다. 간단하게 자바(Java)의 클래스로 예를 들면,
결합도가 높은 클래스는 다른 클래스와 연관된 정도가 높다. 따라서 해당 클래스를 변경하면 연관된 클래스도 변경해야 하며,
다른 코드에서 클래스를 재사용하기도 어렵다.

결합도는 아래와 같이 결합 정도에 따라 6개 단계로 구분된다.

## 자료 결합도(Data Coupling)
**가장 낮은 결합도를 갖는다. 가장 좋은 형태다.** 모듈끼리 단순히 파라미터 등을 통해 데이터를 주고받는 경우다.

여기서 주고받는 데이터는 모듈의 기능 수행에 있어서 로직을 제어하거나 하지 않는 순수한 자료형 요소이다. 또한 한 모듈을
변경하더라도 다른 모듈에는 영향을 끼치지 않는 결합 상태이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-1.jpg"
width="500" alt="data coupling"/>

<br>

자료 결합도(Data Coupling)의 코드 예제를 살펴보자. 아래와 같이 모듈의 단위를 메서드로 정의했을 때, 다른 메서드에
단순 데이터 타입을 전달한다.

```java
public void foo() {
	int result = makeSquare(5);
}

/**
 * 단순 데이터를 전달한다.
 */
public int makeSquare(int x) {
	return x*x;
}
```

## 스탬프 결합도(Stamp Coupling)
두 모듈이 동일한 자료 구조를 참조하는 형태의 결합도이다. 즉, 모듈 간의 인터페이스로 배열 또는 오브젝트 등이 전달되는
경우를 말한다. 자료 구조의 형태가 변경되면 그것을 참조하는 모든 모듈에 영향을 주며 변경되는 필드를 실제로 참조하지
않는 모듈에도 영향을 준다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-2.jpg"
width="650" alt="stamp coupling"/>

<br>

스탬프 결합도의 코드 예제를 살펴보자. 앞서 살펴본 자료 결합도(Data Coupling)와 다른 점은 단순 데이터 타입이 아닌
오브젝트 형태의 자료 구조를 전달한다는 점이다. 자료 구조의 형태, 자바를 예로 들면 클래스의 필드가 변경되는 경우
이를 참조하는 모듈에도 변경이 필요할 수 있다.

```java
public void foo() {
	// 이름과 메일주소를 생성자로 초기화한다.
    Person p = new Person("김매드", "abc@abc.com");
	sendEmail(p);
}

public void sendEmail(Person person) {
	// 메일 발송 로직
}
```

## 제어 결합도(Control Coupling)
어떤 모듈이 다른 모듈 내부의 논리적인 흐름을 제어하는 요소를 전달하는 경우를 말한다.
예를 들면, 파라미터로 전달되는 값에 따라서 모듈 내부 로직의 처리가 달라지는 Flag 값 등으로 결합되는 형태다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-3.jpg"
width="500" alt="control coupling"/>

<br>

제어 결합도의 예시를 코드로 살펴보면 다음과 같다. 

```java
public void foo() {
    printCharge(true);	
}

public void printCharge(boolean isMember) {
    if (isMember) {
    	printMemberCharge();
    } else {
	    printNormalCharge();
    }
}
```

## 외부 결합도(External Coupling)
모듈이 외부에 있는 다른 모듈 또는 데이터를 참조할 때의 결합 형태를 말한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-4.jpg"
width="600" alt="external coupling"/>

<br>

외부 결합도는 모듈이 외부의 데이터, 통신 프로토콜 등을 공유할 때 발생한다. 데이터를 참조 또는 공유하는 결합 형태가
이어서 살펴볼 공통 결합과 비슷하기 때문에 외부 결합도에 대한 설명이 생략되는 경우도 있지만 다른 점은 참조하는 데이터가
외부에 위치하는 것이다.

<br>

## 공통 결합도(Common Coupling)
여러 모듈이 하나의 데이터 영역을 참조하여 사용하는 형태다. 전역 변수(global variable)를 예로 들 수 있다.
전역 변수의 변경이 여러 모듈에 영향을 끼칠 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-5.jpg"
width="600" alt="common coupling"/>

<br>

공통 결합도의 코드 예제는 아래와 같은 형태다. 전역으로 선언된 변수를 서로 다른 모듈에서 참조하는 경우다.
자바 언어를 예로 들었을 때, 클래스 변수와 인스턴스 변수를 사용하여 조작하는 경우다.

```java
class Example {
	// 클래스 변수, 다른 클래스에서 호출 가능
	static int a = 5;
	// 인스턴스 변수, 같은 클래스에서 호출 가능
	int b = 2;
}

public void methodA() {
	// a 또는 b 값 참조
}

public void methodB() {
	// a 또는 b 값 참조
}
```

## 내용 결합도(Content Coupling)
**가장 높은 결합도를 갖는다. 가장 좋지 않은 결합 형태다.** 어떤 모듈이 사용하려는 다른 모듈의 내부 기능과 데이터를
직접 참조하는 경우다.

다른 모듈의 로컬 데이터에 접근하는 경우처럼 사용하고자 하는 모듈의 내용(코드)을 알고 있어야 한다.
모듈이 변경이 발생하는 경우 이를 참조하는 모듈의 변경이 반드시 필요하게 되므로 가장 좋지 않은 결합이다.

<br><br>

# 응집도(Cohesion)란?
결합도에 대응되는 응집도에 대해서 알아보자. 응집도는 한 모듈 내부의 처리 요소들이 서로 관련되어 있는 정도를 말한다.
즉, 모듈이 독립적인 기능을 수행하는지 또는 하나의 기능을 중심으로 책임이 잘 뭉쳐있는지를 나타내며 모듈이 
**높은 응집도를 가질수록 좋다.**

응집도는 아래와 같이 응집된 정도에 따라 7개로 구분된다.

## 기능적 응집도(Functional Cohesion)
**응집도가 가장 높으며, 가장 좋은 형태이다.** 모듈 내의 모든 요소들이 하나의 기능을 수행하기 위해 구성된 경우를 말한다.

예를 들면, 코사인(cosine)과 같은 삼각함수를 계산하는 기능을 모아둔 함수 등이다.

<br>

## 순차적 응집도(Sequential Cohesion)
한 요소의 출력이 다른 요소의 입력으로 사용되는 형태이다. 어떤 모듈이 특정 파일을 읽고 처리하는 기능을 하는 등과 같다.
코드로 예제를 살펴보면 아래와 같은 형태다.

```java
public void someMethod() {
    String content = readFile();
    writeFile(content);
}
```

## 통신적 응집도(Communicational Cohesion)
모든 요소들이 동일한 입력 또는 출력 데이터를 사용하여 서로 다른 기능을 수행하는 경우다.
앞서 살펴본 순차적 응집도와 다르게 처리 순서가 중요하지 않다.

<br>

## 절차적 응집도(Procedural Cohesion)
모듈내에서 여러 개의 기능 요소가 순차적으로 수행되지만 다음 기능 요소로 데이터가 아닌 흐름 제어 요소가 전달되는 경우

예를 들면, 파일을 읽을 때 접근 허가를 확인한 후에 파일을 읽는 형태 등이다.

<br>

## 일시적 응집도(Temporal Cohesion)
각 기능 요소들이 순서에 상관없이 특정 시점에 반드시 수행되는 경우다. 

예를 들면, 프로그램이 구동될 때 초기화 시키는 모듈이나 예외 상황이 발생했을 때 오류 로그를 개발자에게 전송하는 기능 등
순서에 상관없는 경우를 말한다.

<br>

## 논리적 응집도(Logical Cohesion)
유사한 성격을 갖거나 특정 형태로 분류되는 처리 요소들로 모듈을 구성하며 논리적으로 비슷한 기능을 수행하지만
서로의 관계는 밀접하지 않은 형태다. 코드를 예제로 들면 다음과 같다.

```java
public void someMethod(int val) {
	switch (val) {
        case 0:
	        // do something
        	break;
        case 1:
        	// do something
        	break;
        default:
        	break;
	}	
}
```

## 우연적 응집도(Coincidental Cohesion)
**가장 좋지 않은 응집도다.** 모듈 내부의 각 구성 요소들이 아무런 관련 없이 구성된 형태다.
앞서 살펴본 논리적 응집도와 비슷하지만, 유사한 성격이나 형태가 없으며 모듈 수정이 사이드 이펙트를 발생시킬 가능성이
매우 높다.

<br><br>

# 마치며
같은 목적을 가진 기능끼리 하나의 모듈에 모아두는 것은 높은 응집도를 갖기 때문에 소프트웨어 디자인 측면에서 좋다.
(물론, 모듈의 독립성을 높이기 위해서는 모듈의 크기 축소도 필요하다.) 비슷한 기능을 수행하기 때문에 **기능에 변화가
발생할 때 유지보수가 용이하며 해당 모듈을 재사용**할 수도 있기 때문이다.

이러한 맥락에서 다른 모듈간의 결합도는 낮은 것이 좋다. 모듈 간의 의존하는 정도가 높은 경우, 즉 결합도가 높으면
특정 모듈을 수정하는 행위가 직접 수정하지 않은 다른 모듈에 영향을 끼쳐 사이드 이펙트(side effect)가 발생하기 쉽다.

**결론적으로 결합도는 낮고 응집도가 높은 모듈로 설계하는 것이 좋다.**