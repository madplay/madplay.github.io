---
layout:   post
title:    "자바의 effectively final"
author:   Kimtaeng
tags: 	  java final effectivelyfinal
description: 자바에서 final로 선언되지 않았지만 초기화된 이후 참조가 변경되지 않아 final처럼 동작하는 "effectively final" 이란 무엇일까?
category: Java
date: "2021-03-09 02:33:18"
comments: true
---

# final은 아니지만 final처럼
자바에서 `final` 키워드가 선언되지 않은 변수지만, 값이 재할당되지 않아 `final` 과 유사하게 동작하는 것을 **effectively final**이라고 한다.
이 개념은 자바 8에서 도입되었는데, 익명 클래스(Anonymous Classes) 또는 람다식(Lambda Expressions)이 사용된 코드에서 쉽게 찾아볼 수 있다.

익명 클래스 또는 람다식에서는 참조하는 외부 지역 변수가 `final`로 선언됐거나 선언된 후 참조가 변경되지 않는 **effectively final**인 경우에만 접근 가능하다.
예를 들어 아래 예제와 같이 참조하는 지역 변수가 내부에서 변경된다면 **"local variables referenced from a lambda expression must be final or effectively final"** 오류 메시지와 함께 컴파일 에러가 발생한다.

```java
// Anonymous Classes
public void someMethod() {
    int count = 0;
    Runnable runnable = new Runnable() {
        @Override
        public void run() {
            // "local variables referenced from an inner class
            // must be final or effectively final"
            count++;
        }
    };
}

// Lambda Expressions
public void someMethod() {
    List<Integer> list = Arrays.asList(1, 2, 3, 4);
    Integer criteria;
    
    for (Integer integer : list) {
        if (integer > 2) {
            criteria = 3;
            // "local variables referenced from a lambda expression
            // must be final or effectively final"
            list.removeIf(o -> o.equals(criteria));
        }
    }
}
```

<br>

# effectively final
그렇다면 정확히 어떤 경우를 **effectively final**이라고 말하는 것일까? 자바 언어 스펙을 살펴보면 다음과 같은 조건을
만족하는 지역 변수(local variables)는 **effectively final**로 간주한다.

- `final`로 선언되지 않았다.
- 초기화를 진행한 후에 다시 할당하지 않았다.
- 전위(prefix) 또는 후위(postfix)에 증감 또는 감소 연산자가 사용되지 않았다.

<a href="https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.12.4" rel="nofollow" target="_blank">
참고: "Java Docs: 4.12.4. final Variables"</a>

객체의 경우에는 객체가 가리키는 참조를 변경하지 않으면 된다. 따라서 아래와 같이 객체의 상태를 변경하더라도 **effectively final**이다.

```java
List<Person> personList = List.of(new Person(2), new Person(3));
for (Person p : personList) {
    p.setId(2);
    personList.removeIf(o -> o.getId() == p.getId());
}
```

<br>

# Lambda Capturing
람다에서는 외부에 정의된 변수를 사용할 때 내부에서 사용할 수 있도록 복사본을 생성한다.
이를 **람다 캡처링(Lambda Capturing)**이라고 하는데 여기서 외부 변수는 지역 변수를 비롯하여 인스턴스 변수와 클래스 변수를 포함한다.

외부 변수를 사용하는 람다식(Capturing Lambda) 예제를 살펴보자. 첫 번째 예제는 외부에 선언된 인스턴스 변수를
참조하고 두 번째 예제는 람다 외부에 선언된 지역 변수를 참조한다.

```java
// Capturing Lambda 예제1: 외부 인스턴스 변수 참조
public class Tester {
	private int count = 0;

	public void someMethod() {
		Runnable runnable = () -> System.out.println("count: " + count);
	}
}
    
// Capturing Lambda 예제2: 외부 지역 변수 참조
public void someMethod() {
    int count = 0;
    Runnable runnable = () -> System.out.println(count);
}
```

이와 반대로 람다 내부에서 접근하는 외부 변수가 없는(Non-Capturing Lambda) 예제는 아래와 같다. 

```java
// Non-Capturing Lambda
Runnable runnable = () -> {
    String msg = "Taengtest";
    System.out.println(msg)
};

// Non-Capturing Lambda
Function<Integer, Integer> func = (param) -> 5 * param;
func.apply(5);
```

<br>

# 왜 복사본을 만들까?
그렇다면 람다식 내부에서 참조하는 외부 변수를 캡처링하는 이유는 무엇일까?
이는 참조하는 외부 변수가 지역 변수일 때 조금 더 명확하게 이해할 수 있다.

**지역 변수는 메모리 영역 중 스택(Stack)에 할당**된다. 스택 영역은 스레드마다 자신만의 고유한 영역을 갖는 특성을 갖는다.
따라서 스레드끼리 공유할 수 없으며 스레드가 종료되는 경우 생성된 스택 영역도 사라지게 된다. 따라서 외부 지역 변수를
그대로 참조하지 못하기 때문에 복사본을 생성하는 것이다.

만약에 복사본을 만들지 않는 경우는 어떻게 될까? 아래 코드는 정상적으로 컴파일 되는 코드지만 기존의 자바 스펙과는 다르게
**외부 지역 변수를 캡처링하지 않는다고 가정**해보자. 

```java
public void test() {
    // local variable
    int count = 0;

    new Thread(() -> {
        try {
        	// `count` 를 복사하지 않는다고 가정
            Thread.sleep(1000);
            System.out.println("count :" + count);
        } catch (InterruptedException e) {
            // Exception Handling
        }
    }).start();
    
    System.out.println("count :" + count);
}
```

위 코드가 정상 동작한다면 어떻게 될까? 예제처럼 람다는 별도의 스레드에서 수행될 수 있다.
또한 앞서 설명한 것처럼 각 스레드마다 고유한 스택 영역을 가지며, 지역 변수는 스택 영역에 할당된다. 

따라서 `test` 메서드를 실행하는 스레드는 람다식을 실행하는 스레드가 끝나기도 전에 스택 영역에서 사라질 수 있다.
즉, 람다 내부에서 메서드에 선언된 지역 변수인 `count`를 참조하지 못하는 경우가 발생할 수 있다.

<br>

# 왜 람다에서 외부 지역 변수의 값을 변경할 수 없을까?
그렇다면 람다 내부에서 외부 지역 변수의 값을 변경하려고 하면 컴파일 오류가 발생하는 이유는 무엇일까?
"복사본을 생성한다면, 값을 변경해도 괜찮지 않을까?"라고 생각할 수도 있다.

**람다식은 앞서 살펴본 것처럼 별도 스레드에서 수행이 가능**하다. 그렇기 때문에 외부 지역 변수를 제어하는 스레드와
람다식을 수행하는 스레드가 서로 다를 수 있다.

또 다른 예제를 살펴보자. 다만 이번 예제 코드는 컴파일 오류가 발생한다.
하지만 외부 지역 변수의 값을 변경하면 안 되는 이유를 이해하기 위해 정상적으로 실행된다고 가정해보자.
아래 코드가 정상적으로 컴파일 되고 실행될 때의 문제는 무엇일까?

```java
public class Tester {

	ExecutorService executor = Executors.newFixedThreadPool(1);

	public void testMultiThreading() {
		// 스레드 A
		boolean doLoop = true;

		executor.execute(() -> {
			// 스레드 B
			while (doLoop) {
				// something to do
			}
		});
		doLoop = false;
	}
}
```

위 예제에서는 두 개의 스레드가 존재하는데, 하나는 지역 변수를 제어하는 스레드이고 다른 하나는 람다식을 실행하는 스레드다.
그리고 앞서 설명한 것처럼 람다에서는 외부 지역 변수를 사용하는 경우 캡처링을 하게 되기 때문에 람다식을 실행하는 스레드에서는
지역 변수 `doLoop`의 값을 참조하기 위해 이를 복사한다. 

문제는 이 부분에서 발생한다. 복사되는 값인 외부 지역 변수가 변경 가능하게 되는 경우 복사된 값이 최신 값임을 보장할 수 없다.
이는 변수의 가시성(visibility)과도 연관이 있는데, **스택 영역은 스레드마다 생성**되기 때문에 스레드 A, B가 갖는 스택 영역은 각자 고유하다.
따라서 한 스레드에서 다른 스레드의 스택에 있는 값의 변경사항을 확인할 수가 없다.

따라서 위와 같은 예제가 정상적으로 컴파일되고 실행된다면 복사된 값을 보장할 수 없으므로 동시성 문제가 발생하여
결과를 예측할 수 없는 상황이 발생한다. 이것이 **람다식에서 참조하는 외부 지역 변수가 값이 변경되지 않아야 하는 이유**다.

<br>

# 그렇다면 인스턴스 변수와 클래스 변수는?
먼저 인스턴스 변수와 클래스 변수가 무엇인지 이들의 정의에 대해서 알아보자.

**인스턴스 변수**는 클래스에 선언된 변수를 말하며 인스턴스 정보를 담고 있는 **힙(heap) 영역**에 할당된다.
그리고 **클래스 변수**는 클래스에 선언된 static 변수를 말하며 인스턴스 생성 없이 바로 생성되며 **메서드(method) 영역**에 선언된다.

그렇기 때문에 할당된 메모리 영역이 지역 변수가 할당되는 스택 영역과 다르게 바로 회수되지 않아 복사하는 과정이 불필요하다.
따라서 아래와 같은 코드는 정상적으로 컴파일 된다.


```java
public class Tester {
    private int instanceVariable = 0;
	private static int staticVariable = 0;

	public void someMethodWithStaticVariable() {
		instanceVariable = 1;
		Runnable runnable = () -> {
			instanceVariable++;
		};
	}

	public void someMethodWithInstanceVariable() {
		staticVariable = 1;
		Runnable runnable = () -> {
			staticVariable++;
		};
	}
}
```

<br>

# 정리하면
람다식 내부에서 외부 지역 변수를 참조하는 경우 `final` 또는 **effectively final**이어야 한다.
이러한 이유는 지역 변수가 메모리 영역중 스택(Stack) 영역에 할당되는 것과 관련이 있다.

스택 영역은 스레드 별로 고유하기 때문에 지역 변수가 할당된 스레드가 종료되면 지역 변수를 더이상 참조하지 못하게 된다.
따라서 별도 스레드에서 실행 가능한 람다에서는 외부 지역 변수를 복사하는 과정을 거치는데, 복사되는 값이 변경 가능하다면
참조하는 변수의 최신값을 보장할 수 없어 멀티 스레드 환경에서 동시성 문제가 발생할 수 있다. 

따라서, 람다 내부에서 외부 지역 변수를 참조할 때는 반드시 `fianl` 또는 **effectively final**이어야 한다.