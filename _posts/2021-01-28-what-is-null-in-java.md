---
layout:   post
title:    "자바 Optional: 1. null은 무엇인가?"
author:   Kimtaeng
tags: 	  java null nullpointerexception
description: 자바에서 null은 무엇이며 왜 우리에게 고통을 안겨줄까?
category: Java
date: "2021-01-28 23:51:29"
comments: true
---

# 목차
- 자바 Optional: 1. null은 무엇인가?
- <a href="/post/introduction-to-optional-in-java">자바 Optional: 2. Optional 소개</a>
- <a href="/post/how-to-handle-optional-in-java">자바 Optional: 3. Optional 중간 처리 메서드</a>
- <a href="/post/how-to-return-value-from-optional-in-java">자바 Optional: 4. Optional 종단 처리 메서드</a>
- <a href="/post/java-optional-advanced">자바 Optional: 5. Optional 톺아보기</a>

<br>

# null의 등장
영국의 컴퓨터과학자인 **토니 호어(Tony Hoare)**가 1965년에 알골(ALGOL W)이라는 프로그래밍 언어를 설계하면서
처음 등장했다. 당시에 그는 null 참조라는 개념이 "값이 없는 상황을 가장 단순하게 구현할 수 있는 방법"이라고 생각했다. 

하지만 시간이 흘러 2009년, 한 소프트웨어 컨퍼런스에서 그는 자신이 고안한 null 참조를 "10억 달러짜리 실수"라고 표현하며
사과했다. 단순히 구현하기 쉬웠기 때문에 null 참조를 구상했지만 이로 인해 수많은 오류, 취약성 및 시스템 충돌이 생기고
피해가 막대했기 때문이다.

그렇다면 도대체 null 참조는 어떤 문제를 일으키는 것일까?

<br>

# null에 대해서
자바 언어에서 `null`이 개발자에게 어떤 고통을 주는지 알아보기 전에, `null`이 대체 무엇인지 조금 더 자세히 알아보자.

## null은 자바의 키워드다.
`null`은 접근 지정자인 `private`이나 상수 선언을 위한 `final`과 같이 대소문자를 구분하는 키워드다.
따라서 Null이나 NULL과 같이 선언할 수 없고 오로지 `null`로만 선언할 수 있다.

## null과 참조형
`null`은 참조형 타입의 기본 값이다. 모든 기본형 타입(Primitive type)이 기본(default) 값을 갖는 것처럼
참조형 타입(Reference type)은 기본 값으로 `null`을 갖는다. 기본형 타입인 `boolean` 타입은 false,
정수형 `int`는 0을 갖는 것처럼 말이다.

그렇다고 `null`이 기본형이나 참조형과 같은 어떠한 데이터 타입으로 구분되는 것은 아니다. 모든 참조형 레퍼런스에
할당될 수 있는 특수한 값이다. 심지어 아래와 같이 형 변환도 가능하다. 물론 결과적으로 `null` 을 참조한다.

```java
String str = (String) null;
Integer val = (Integer) null;
```

`null`은 참조형 타입(Reference type)에만 사용할 수 있다. 기본형(Primitive type) 타입의 변수에 할당하게 되면 컴파일
오류가 발생한다.

```java
int value = null; // 컴파일 오류 발생
```

## null과 오토박싱(Auto-boxing)
`Integer`나 `Double`과 같은 래퍼(Wrapper) 클래스 레퍼런스가 `null`을 참조하고 있을 때, 이를 기본형 타입으로
언박싱(unboxing)하는 경우 `NullPointerException`이 발생한다. 컴파일 시점에서 확인할 수 없기 때문에 주의해야 한다.

```java
Integer BoxedValue = null;
int intValue = boxedValue; // NullPointerException 발생
```

이처럼 자동으로 언박싱(unboxing)되는 오토 박싱(Auto-boxing)의 동작을 기대하는 상황에서 오류가 발생하기 쉽다.
아래의 코드도 살펴보자. 기본형 타입인 `int`의 래퍼 클래스인 `Integer`로 키를 사용하는 맵(Map) 예제다.

```java
Map<Integer, Integer> map = new HashMap<>();
int[] numbers = {2, 3, 1, 5};
for (int num : numbers) {
    int count = map.get(num); // `get`의 결과가 null 인 경우 NPE 발생
    map.put(num, count++);
}
```

맵은 `get` 메서드의 결과가 없는 경우 `null`을 반환한다. 그런데 기본형 타입에 `null`을 대입하게 되는 경우
`NullPointerException`가 발생되기 때문에 프로그램이 정상적으로 실행되지 않는다. 

## null 과 static
`null` 을 참조하는 오브젝트의 메서드를 호출하게 되면 `NullPointerException`이 발생한다. 하지만 메서드가 `static`으로
선언되어 있는 경우라면 예외가 발생하지 않고 정상 실행된다.

```java
public class MyClass {
	public static void sayHello() {
		// ...생략
    }
	
    public static void main(String[] args) {
		MyClass myClass = null;
		myClass.sayHello(); // 레퍼런스가 null이지만  NPE가 발생하지 않는다.
    }
}
```

클래스의 정적(static) 멤버는 각각의 인스턴스가 아닌 클래스에 속하기 때문에, 컴파일 타임에 최적화가 된다.
즉, 클래스를 통해 정적 메서드를 호출하는 코드로 변하게 된다. 

아래 `Thread` 클래스를 예로 살펴보자.

```java
Thread t = null;

// NPE가 발생하지 않는다. 
// 컴파일 시점에 Thread.yield(); 로 최적화 된다.
t.yield();  
```

위와 같이 정적 메서드를 사용할 때는 클래스를 통해 호출하도록 하는 것이 혼동을 줄일 수 있다.


## null과 연산자
`null`은 사용할 수 있는 연산자가 제한적이다. null 을 참조하는 레퍼런스나 null에 `instanceof` 연산자를 사용하면
`false`를 반환하지만, `>`, `>=`, `<`, `<=` 와 같이 크고 작음을 비교하는 관계 연산자를 사용하는 경우
`NullPointerException`이 발생한다.

물론 `==`, `!=` 과 같은 관계 연산자는 사용할 수 있다.

<br>

# null 의 문제점
그렇다면 왜 `null`이 문제가 되는 것일까?

`null`은 자바가 추구하는 단순화의 철학과 맞지 않는다. C 언어를 접해봤다면 꽤 어려움을 주는 **포인터**라는 개념을
알고 있을 것이다. 반면에 자바 언어는 개발자로부터 모든 포인터를 숨겼다. 바로 `null`을 제외하고 말이다. 

이렇게 레퍼런스를 존재하지 않는 값을 나타내는 null 참조는, 그 자체로 에러의 근원이다.
`null` 참조를 남발하다가는 `NullPointerException`을 정말 쉽게 만날 수 있다.

예외 상활을 피하기 위해 `null` 체크 코드를 추가하다 보면 깔끔하게 작성된 코드를 기대하기 어려워진다. 
코드의 들여 쓰기가 생기고 코드의 가독성도 떨어질 수 있다.

<br>

# NullPointerException
자바 개발자라면 한 번쯤은 `NullPointerException(이하 NPE)`이 발생하는 상황을 마주쳤을 것이다. 

앞서 살펴본 것처럼 자바에서 `null`은 참조가 없는 경우를 뜻하는데, `null`을 참조하는 레퍼런스로 인스턴스 메서드를
호출하는 등의 코드를 수행하는 경우 `NPE`가 발생한다.

특히나 개발자를 고통받게 하는 이유는 `NPE`가 런타임(Runtime)에 발생하기 때문이다.
그렇기 때문에 프로그램이 실행되기 전인 컴파일 시점에서는 예외의 발생 위험을 알아차리기 어렵다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-12-09-introduction-to-java-optional-1.jpg"
width="400" alt="NullPointerException"/>

<div class="post_caption">그... 그래 반갑다.</div>

실행 로그에 오류가 발생한 코드 라인이 명시되기 때문에, 발생 위치는 파악하기 쉬우나 발생 원인은 직접 확인해야 한다.
자바 14버전의 "JEP 358: Helpful NullPointerExceptions" 스펙에서 `NPE`의 원인을 더 명확하게 확인할 수 있도록
조금이나마 개선되었다.

- <a href="/post/what-is-new-in-java-14" target="_blank">참고 링크: 자바 14 버전에서는 어떤 새로운 기능이 추가됐을까?</a>

<br>

# NPE 발생 예제
어떤 경우에 `NPE`가 발생하는지 살펴보자. 아래 코드와 같이 클래스가 있다고 가정한다.
`Person` 클래스는 `Phone` 클래스 타입의 멤버 필드를, `Phone` 클래스는 `Manufacturer` 클래스 타입의 멤버 필드를,
마지막으로 `Manufacturer` 클래스는 `String` 타입의 멤버 필드를 갖는다.

편의상 클래스의 멤버 필드에 대한 접근자(getter)와 수정자(setter)는 생략했다.

```java
// 사람
public class Person {
	private Phone phone;
}

// 핸드폰
public class Phone {
	private Manufacturer manufacturer;
}

// 제조사
public class Manufacturer {
	private String name;
}
```

그리고 아래와 같은 메서드가 있다. "어떤 사람의 핸드폰 제조사의 이름" 를 반환하는 기능을 한다.
간단한 기능을 하지만 어느 정도 자바 언어로 개발한 경험이 있다면, 이 메서드에 잠재된 `NPE`의 위험성을 느낄 수 있을 것이다.

만일 `Person` 객체에 핸드폰 정보가 없어서 `getPhone` 메서드의 결과가 `null`인 경우에는 어떻게 될까?
바로 `NPE`가 발생할 것이다. `getManufacturer` 메서드는 `Phone` 클래스의 인스턴스 메서드이기 때문에 `null`로 참조된
상태에서 메서드가 호출되는 경우 `NPE`가 발생한다.

또한 인자로 넘겨진 `person` 객체 자체가 `null`인 경우에도 `getPhone` 메서드를 실행하려는 시점에서 `NPE`가 발생한다.

```java
// 핸드폰 제조사의 이름을 반환한다.
public String getPhoneManufacturerName(Person person) {
	// `person` 이 null 이면?
    // 아니면 `getPhone()` 메서드의 결과가 null 이면?
    return person.getPhone().getManufacturer().getName();
}
```

아쉽게도 `NPE`의 무서움은 여기서 끝이 아니다. 위 메서드를 호출하는 곳에도 `NPE`를 발생시킬 수 있다.
`getPhoneManufacturerName` 메서드의 결과가 `null`이라면, 메서드 호출자(callee)에게 `null`을 리턴함과 동시에
잠재적인 `NPE` 발생 위험을 덤(?)으로 같이 주게 된다.

```java
String manufacturerName = getPhoneManufacturerName(person);

// manufacturer 가 null 을 참조하고 있는 경우 NPE가 발생할 수 있다.
String lowerCaseName = manufacturerName.toLowerCase();
```

그러면 어떻게 코드에 잠재된 `NPE`의 위협에서 보호할 수 있을까?

<br>

# NPE를 예방하는 고전적인 방법
글의 주제인 Java 8의 `Optional`에 대해서 알아보기 전에 여태까지 방식으로 `NPE`의 위험으로부터 벗어났는지 알아보자.
보통 아래와 같이 `null` 여부를 체크하는 코드를 추가해서 `NPE`를 회피하도록 했을 것이다.

```java
public String getPhoneManufacturerName(Person person) {
	if (person != null) {
	    Phone phone = person.getPhone();
        if (phone != null) {
        	Manufacturer manufacturer = phone.getManufacturer();
	        if (manufacturer != null) {
	            return manufacturer.getName();
	        }
	    }
	}
	return "Samsung";
}
```

코드의 들여 쓰기가 마음에 들지 않는 경우에는, 아래와 같은 방법을 사용했다.
가독성은 좋아졌지만, 메서드에서 결과를 반환하는 리턴문이 여러 곳에 생겨버렸다.

이렇게 메서드에 출구가 여러 개 생기게 되는 경우에는 유지 보수가 어려워진다.

```java
public String getPhoneManufacturerName(Person person) {
	if (person == null) {
		return "Samsung";
	}

	Phone phone = person.getPhone();

	if (phone == null) {
	    return "Samsung";
	}

	Manufacturer manufacturer = phone.getManufacturer();

	if (manufacturer == null) {
	    return "Samsung";
	}

	return manufacturer.getName();
}
```

다른 방법으로 **널 객체 패턴(Null Object Pattern)**도 있다. 이 패턴의 핵심은 `null`이라는 키워드를 사용하지 않고
이를 대체할 수 있는 객체를 정의하는 것이다.

예제를 통해 살펴보자. 먼저 인터페이스 또는 추상 클래스를 만들고 이를 확장하는 구현체 클래스를 만든다.

```java
interface Messenger {
	void send(String msg);
}

class Kakao implements Messenger {
	@Override
	public void send(String msg) {
		// ... 코드 구현 생략
    } 
}

class Line implements Messenger {
	@Override
	public void send(String msg) {
		// ... 코드 구현 생략
	}
}
```

이제 **널 객체(null object) 역할을 담당할 클래스**를 만들어준다. 일반적인 구현체 클래스와 다른 점은 `NPE`를 방지하기 위한
널 객체 역할이기 때문에 메서드의 구현은 생략하는 것이다. 즉, 아무 일도 하지 않는다.

```java

class NullMessenger implements Messenger {
	@Override
	public void send(String msg) {
		// 아무것도 구현하지 않는다.
	}
}
```

어떤 식으로 적용하는지 살펴보자. 핵심은 아래와 같이 팩토리 메서드를 통해서 객체를 가져오든, DAO를 통해서 DB에서 데이터를
가져오든, 중요한 것은 `null`을 반환하지 않는 것이다. 예제처럼 `null`을 대체할 수 있는 객체를 반환하는 것이다.

```java
class MessengerFactory {
	
	public static Messenger getMessenger(String name) {
		if ( ... ) {
			// 특정 조건에 맞는 Messenger 구현체 클래스의 객체를 반환한다. 
		}
		
		// 결과가 없는 경우 `null`을 반환하지 않고 `NullMessenger`를 반환한다.
		return new NullMessenger();
    }
}

// ... 코드 생략

Messenger messenger = MessengerFactory.getMessenger("KakaoTalk");
messenger.send("Hello");

```

이 패턴의 장점은 무엇일까? 바로 메서드에서 반환되는 값이 `null` 인지 체크할 필요가 없다.
그러니까 `if` 조건문을 덕지덕지 붙여가며 `null` 여부를 체크하는 코드들을 볼 수 없다는 것이다.

조금 더 나아가 아래와 같이 인터페이스에서 싱글톤 기반으로 널 객체(null object)를 다룰 수도 있다.
널 객체 패턴용 클래스를 만들지 않는 방법이다.

```java
interface Messenger {
	void send(String msg);

	Messenger NULL = new Messenger() {
		@Override
		public void send(String msg) {
            // 아무것도 하지 않는다.
		}
	};
}
```

그렇다면 널 객체 패턴(null object pattern)에는 장점만 존재할까? 아쉽게도 아니다.
널 객체 클래스의 존재를 잊는다면, `null`을 검사했던 때보다 더 복잡한 검사를 하게 될지도 모른다.

인터페이스에 새로운 메서드가 추가되는 경우도 마찬가지다. 구현체 클래스와 더불어 널 객체 클래스에도
새롭게 추가되는 메서드를 구현해야 하기 때문에 유지 보수 비용이 늘어난다.

<br>

# 그렇다면 어떻게 해야 할까?
그렇다면 어떻게 `null` 을 대해야 우아하고 안전한 코드를 작성할 수 있을까? 자바 8에서는 `null`을 새롭게 대할 수 있는
방법인 `Optional` 클래스가 추가되었다. 이어지는 글에서는 `Optional` 클래스가 무엇인지 소개한다.

- <a href="/post/introduction-to-optional-in-java">다음글: "자바 Optional: 2. Optional 소개"</a>