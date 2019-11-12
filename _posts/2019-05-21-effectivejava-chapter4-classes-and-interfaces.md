---
layout:   post
title:    "[이펙티브 자바 3판] 4장. 클래스와 인터페이스"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter4: Classes and Interfaces"  
category: Java
date: "2019-05-21 02:12:22"
comments: true
---

# 목차
- <a href="#아이템-15-클래스와-멤버의-접근-권한을-최소화하라">아이템 15. 클래스와 멤버의 접근 권한을 최소화하라</a>
- <a href="#아이템-16-public-클래스에서는-public-필드가-아닌-접근자-메서드를-사용하라">아이템 16. public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라</a>
- <a href="#아이템-17-변경-가능성을-최소화하라">아이템 17. 변경 가능성을 최소화하라</a>
- <a href="#아이템-18-상속보다는-컴포지션을-사용하라">아이템 18. 상속보다는 컴포지션을 사용하라</a>
- <a href="#아이템-19-상속을-고려해-설계하고-문서화하라-그러지-않았다면-상속을-금지하라">아이템 19. 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라</a>
- <a href="#아이템-20-추상-클래스보다는-인터페이스를-우선하라">아이템 20. 추상 클래스보다는 인터페이스를 우선하라</a>
- <a href="#아이템-21-인터페이스는-구현하는-쪽을-생각해-설계하라">아이템 21. 인터페이스는 구현하는 쪽을 생각해 설계하라</a>
- <a href="#아이템-22-인터페이스는-타입을-정의하는-용도로만-사용하라">아이템 22. 인터페이스는 타입을 정의하는 용도로만 사용하라</a>
- <a href="#아이템-23-태그-달린-클래스보다는-클래스-계층구조를-활용하라">아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라</a>
- <a href="#아이템-24-멤버-클래스는-되도록-static으로-만들라">아이템 24. 멤버 클래스는 되도록 static으로 만들라</a>
- <a href="#아이템-25-톱레벨-클래스는-한-파일에-하나만-담으라">아이템 25. 톱레벨 클래스는 한 파일에 하나만 담으라</a>

<br>

# 아이템 15. 클래스와 멤버의 접근 권한을 최소화하라
> Minimize the accessibility of classes and members

컴포넌트를 잘 설계하는 방법의 핵심은 모든 클래스와 멤베의 접근성ㅇ르 최대한 좁히는 것에 있다.
항상 가장 낮은 접근 지정자 수준을 적용해야 한다.

- <a href="/post/minimize-the-accessibility-of-classes-and-members" target="_blank">더 상세한 내용은 링크 참고:
[이펙티브 자바 3판] 아이템 15. 클래스와 멤버의 접근 권한을 최소화하라</a>

<div class="post_caption">프로그램 요소의 접근성은 가능한 한 최소한으로 하라.</div>

<br><br>

# 아이템 16. public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라
> In public classes, use accessor methods, not public fields

아래와 같은 클래스는 캡슐화의 이점이 없다. 데이터 필드에 직접적으로 접근할 수 있기 때문이다.

```java
class Point {
    public double x;
    public double y;
}
```

public 클래스의 멤버 필드가 public 으로 선언되었다면 클라이언트가 이를 사용할 소지가 있어 마음대로 변경하기 어려워진다.
예를 들어, `java.awt.package` 패키지의 Point와 Dimension 클래스가 그렇다.

클래스의 멤버 변수는 private으로 바꾸고 public 접근자(getter)를 추가해서 사용하자.

```java
class Point {
    private double x;
    private double y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() { return x; }
    public double getY() { return y; }

    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }
}
```

package-private 클래스 또는 private 중첩 클래스라면 public 으로 두어도 문제가 없다. 오히려 코드 작성 면에서 getter를
사용하는 것보다 더 깔끔할 수 있다. 내부에서만 동작하기 때문이다.

```java
public class Example {
    private static class InnerNested {
        public String memberField;
    }

    public void somePrint() {
        InnerNested instance = new InnerNested();
        System.out.println(instance.memberField);
    }
}
```

<div class="post_caption">public 클래스는 절대 가변 필드를 public 접근 지정자로 두어서는 안된다.</div>  

<br><br>

# 아이템 17. 변경 가능성을 최소화하라
> Minimize mutability

불변 클래스란 인스턴스의 내부 값을 수정할 수 없는 클래스를 말한다. 객체가 소멸되기 전까지 절대로 달라지지 않는다.
불변 클래스는 가변 클래스보다 설계하고 구현하고 사용하기 쉬우며 오류가 발생한 소지도 적고 훨씬 안전하다.

## 불변 클래스를 만드는 규칙
- 객체의 상태를 변경하는 메서드(변경자)를 제공하지 않는다.
- 클래스를 확장할 수 없도록 한다.
  - 하위 클래스에서 객체의 상태를 변하게 하는 것을 막는다. 대표적으로 클래스를 final로 선언하면 된다.
- 모든 필드를 final로 선언한다.
  - 개발자의 의도를 명확하게 드러내는 방법이다.
- 모든 필드를 private으로 선언한다.
  - 필드가 참조하는 가변 객체를 직접 접근하는 일을 막는다.
- 자신 외에는 내부의 가변 컴포넌트에 접근할 수 없도록 한다.

클래스를 final로 선언하여 상속을 막을 수 있지만 모든 생성자를 private 또는 package-private으로 만들고
public 정적 팩터리를 만드는 더 유연한 방법도 있다. 아래는 생성자 대신 정적 팩터리를 사용한 불변 클래스이다.

```java
public class Complex {
    private final double re;
    private final double im;

    // 생성자는 private이다.
    private Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    // 정적 팩터리 메서드
    public static Complex valueOf(double re, double im) {
        return new Complex(re, im);
    }
	// 그 외 생략
}
```


## 불변 클래스와 불변 객체의 특징
불변 클래스의 객체는 근본적으로 **스레드 안전하기 때문에 안심하고 공유할 수 있다.** 따라서 불변 클래스라면 한번 만든 인스턴스를 최대한 재활용하면 좋다.
불변 객체는 그 자체로 **실패 원자성을 제공한다.**

> 실패 원자성(failure atomicity)이란?<br/>
> 메서드에서 예외가 발생한 후에도 그 객체는 여전히 메서드 호출 전과 똑같은 유효한 상태여야 한다.

```java
public class BigInteger extends Number implements Comparable<BigInteger> {
    final int signum;
    final int[] mag;
    ...
    public BigInteger negate() {
        return new BigInteger(this.mag, -this.signum);
    }
    ...
}
```

한편 **불변 클래스의 단점도 있다.** 값이 다르다면 반드시 독립된 객체로 만들어야 한다.
예를 들어 백만 비트짜리 BigInteger에서 비트 하나를 바꾸기 위해서 새로운 인스턴스를 만들어야 한다.
그리고 객체를 완성하기 까지의 단계가 많고, 그 중간 단계에서 만들어지는 객체들이 모두 버려지는 성능 문제가 있을 수 있다.

해결 방법으로는 흔히 쓰일 다단계 연산을 기본적으로 제공하는 것이다. **가변 동반 클래스(Companion class)** 라고 한다.
불변 클래스인 String을 예로 들자면, StringBuilder와 StringBuffer가 있다.


## 정리하면?
- 클래스는 꼭 필요한 경우가 아니라면 불변이어야 한다.
- 불변으로 만들 수 없는 클래스라도 변경할 수 있는 부분을 최소한으로 줄여야 한다.
- 다른 합당한 이유가 없다면 클래스의 모든 필드는 private final 이어야 한다.
- 생성자는 불변식 설정이 모두 완료된, 초기화가 완벽히 끝난 상태의 객체를 생성해야 한다.
- 확실한 이유가 없다면 생성자와 정적 팩터리 외에는 그 어떤 초기화 메서드도 public으로 제공해서는 안 된다.

<div class="post_caption">클래스는 꼭 필요한 경우가 아니라면 불변으로 설계해야 한다.</div>

<br><br>

# 아이템 18. 상속보다는 컴포지션을 사용하라
> Favor composition over inheritance

상속은 잘못 사용하면 오류를 내기 쉽다. 그렇기 때문에 **코드를 재사용할 수 있는 좋은 수단이지만 항상 최선은 아니다.**

여기서의 상속은 클래스가 다른 클래스를 확장하는 구현 상속을 말한다. 즉, 클래스가 인터페이스를 구현(implements)하거나
인터페이스가 다른 인터페이스를 확장(extends)하는 인터페이스 상속과는 무관하다.

- <a href="/post/favor-composition-over-inheritance" target="_blank">더 상세한 내용은 링크 참고:
[이펙티브 자바 3판] 아이템 18. 상속보다는 컴포지션을 사용하라</a>

<div class="post_caption">상속은 상위 클래스와 하위 클래스가 순수한 is-a 관계일 때만 사용하자.</div>

<br><br>

# 아이템 19. 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라
> Design and document for inheritance or else prohibit it

## 문서화
상속용 클래스는 재정의할 수 있는 메서드들을 내부적으로 어떻게 이용하는지(자기 사용) 문서로 남겨야 한다.
재정의 가능한 메서드를 호출할 수 있는 모든 상황을 문서로 남겨야 한다. 여기서 **재정의 가능이란** public과
protected 메서드 중에서 final이 아닌 모든 메서드를 말한다.

## 상속을 고려한 설계를 할 때 주의할 점
- 클래스 설계 시에 어떤 protected 메서드나 필드를 제공해야 하는지 심사숙고해야 한다.
  - 유지 보수 측면에서는 protected 메서드와 필드를 최소화하는 것이 좋으나, 아예 없는 경우 상속의 의미가 없다.
  - 상속용 클래스를 테스트하는 방법은 직접 하위 클래스를 만드는 것이다. 꼭 필요한 protected 멤버를 빼먹었다면, 하위 클래스를
    만들 때 그 빈자리가 확연히 드러나기 때문이다.
  - 하위 클스를 여러 개 만들 때까지 전혀 사용되지 않는 protected 멤버는 사실상 private이었어야 할 가능성이 높다.
- 상속용 클래스의 생성자는 직접적 또는 간접적으로 재정의 가능 메서드를 호출해서는 안 된다.
  - 상위 클래스의 생성자가 하위 클래스의 생성자보다 먼저 호출되므로 하위 클래스에서 재정의한 메서드가 하위 클래스의 생성자보다
  먼저 호출되기 때문이다.
  - 단, private, final, static 메서드는 재정의가 불가능하니 생성자에서 호출해도 된다.

## 상속을 금지하는 방법
클래스를 상속용으로 설계하는 것은 엄청난 노력이 필요하고 제약도 많은 것을 명심해야 한다. 상속용으로 설계되지 않은 클래스는
상속을 금지하는 것이 좋다. **상속을 금지하는 방법** 으로는 클래스를 final로 선언하거나, 모든 생성자를 private이나
package-private으로 선언하고 public 정적 팩터리를 만들어주는 방법이 있다.

<div class="post_caption">상속용 클래스 설계는 쉽지 않다. 클래스 내부에서 스스로를 어떻게 사용하는지 모두 문서로 남겨야 하며,
문서화한 것은 반드시 따라야한다.</div>

<br><br>

# 아이템 20. 추상 클래스보다는 인터페이스를 우선하라
> Prefer interfaces to abstract classes

자바가 제공하는 다중 구현 매커니즘은 추상 클래스와 인터페이스다. 자바 8부터는 인터페이스에 디폴트 메서드(default method)가
추가되어 두 매커니즘 모두 인스턴스 메서드를 구현 형태로 가질 수 있다. 이로써 조금 더 자유로운 확장이 가능해졌다.
디폴트 메서드를 사용하면 인터페이스를 구현한 클래스에서 반드시 재정의를 하지 않아도 되기 때문이다.

```java
public interface SomeThings {
    void walk();
    void sleep();
    default void eat() {
        System.out.println("I am eating the food");
    }
}
```

## 추상 클래스와 인터페이스의 차이는?
그래도 둘의 차이는 분명하다. 추상 클래스가 정의한 타입을 구현한 클래스는 반드시 추상 클래스의 하위 클래스가 되어야 한다는
점이다. 단일 상속만 지원하는 자바에서 추상 클래스를 상속한 채 새로운 타입을 정의하기는 어렵다. 반면에 인터페이스를 올바르게
구현한(정의해야 하는 메서드를 모두 선언하는 등의 규약을 잘 지킨) 클래스는 어떤 클래스를 상속했든 같은 타입으로 취급된다.

인터페이스는 추상 클래스에 비해 자유롭다. 기존 클래스 위에 추상 클래스를 상속시키는 것은 어렵다. 두 클래스가 같은 추상 클래스를
확장해야 한다면, 그 추상 클래스는 계층구조상 두 클래스의 공통 조상이어야 한다. 하지만 기존 클래스에 인터페이스를 구현시킬 때는
정의해야 하는 메서드를 선언하기만 하면 된다.

- <a href="/post/abstract-classes-and-methods-in-java" target="_blank">
더 상세한 내용은 링크 참고: 자바의 추상 클래스와 추상 메서드</a>

## 인터페이스는 믹스인(mixin) 정의에 알맞다.
믹스인은 대상 타입의 주된 기능에 선택적 기능을 혼합(mixed in)하는 것을 말한다.

```java
package java.io;

public class File implements Serializable, Comparable<File> {
    ...
}
```

여기서 File 클래스가 Comparable을 구현(implements)했다는 것은 File 클래스의 인스턴스끼리는 순서를 정할 수 있다는 것을
뜻한다. 추상 클래는 기존 클래스에 덧씌우기 어렵고 여러 부모 클래스를 가질 수 없는 클래스의 계층 구조에는 믹스인을
사용하기 합리적인 위치가 없다.

## 인터페이스는 계층구조가 없는 타임 프레임워크를 만들 수 있다.
```java
public interface Singer { // 가수
    AudioClip sing(Song s);
}

public interface Songwriter { // 작곡가
    Song compose(int chartPosition);
}

// 그렇다면, 노래도 부르고 작곡도 하는 싱어송라이터는?
public interface SingerSongWriter extends Singer, Songwriter {
    AudioClip strum();
    void actSensitive();
}
```

## 인터페이스 + 추상 골격 구현 클래스
인터페이스와 추상 골격 구현 클래스를 함께 제공하여 인터페이스와 추상 클래스의 장점을 모두 갖는 방법도 있다.
인터페이스로는 타입을 정의하고 필요한 경우 디폴트 메서드도 정의한다. 그리고 골격 구현 클래스에는 나머지 메서드들까지 구현한다.
주로 이런 구조는 템플릿 메서드 패턴(Template Method Pattern)에 많이 이용된다.

관례상으로 인터페이스 이름이 XXX라면, 골격 구현 클래스의 이름은 AbstractXXX로 짓는다. 예를 들어 AbstractSet, AbstractList,
AbstractMap 등이 핵심 컬렉션 인터페이스의 골격 구현 클래스이다.

<div class="post_caption">일반적으로 다중 구현용 타입으로는 인터페이스가 가장 적합하다.</div>

<br><br>

# 아이템 21. 인터페이스는 구현하는 쪽을 생각해 설계하라
> Design interfaces for posterity

인터페이스에 새로운 메서드를 추가하는 것은 어려운 일이다. 이미 구현한 객체에 오류가 발생할 소지가 있기 때문이다.
자바 8에서 디폴트 메서드가 추가되었지만 모든 상황에서의 불변식을 해치지 않는 디폴트 메서드를 작성하기는 쉽지 않다.

예제를 통해 기존 구현체와 잘 어우러지지 않는 경우를 살펴보자.
아래는 자바8의 Collection 인터페이스에 추가된 디폴트 메서드 `removeIf`이다.

```java
default boolean removeIf(Predicate<? super E> filter) {
    Objects.requireNonNull(filter);
    boolean removed = false;
    final Iterator<E> each = iterator();
    while (each.hasNext()) {
        if (filter.test(each.next())) {
            each.remove();
            removed = true;
        }
    }
    return removed;
}
```

Collection 구현체 중 아파치 라이브러리의 `SynchronizedCollection`에서는 이 메서드를 재정의하고 있지 않다.
기존 컬렉션 대신 클라이언트가 제공한 객체로 락(Lock)을 거는 기능들을 추가로 제공하지만 `removeIf` 메서드를 재정의하고
있지 않기 때문에 이 메서드 수행과 관련해서는 스레드 공유 상황에서 오류가 발생할 수 있다.

이처럼 디폴트 메서드가 컴파일에 성공하더라도 기존 구현체에 런타임 오류를 일으킬 수 있다. 기존 인터페이스에 디폴트 메서드로
새 메서드를 추가하는 일은 꼭 필요한 경우가 아니라면 피해야 한다. 그리고 디폴트 메서드가 인터페이스로부터 메서드를 제거하거나
기존 메서드의 시그니처를 수정하는 용도가 아님을 명심해야 한다.

<div class="post_caption">인터페이스를 설계할 때는 세심한 주의와 많은 테스트가 필요하다.</div>

<br><br>

# 아이템 22. 인터페이스는 타입을 정의하는 용도로만 사용하라
> Use interfaces only to define types

인터페이스는 자신을 구현(implements)한 클래스의 인스턴스를 참조할 수 있는 타입 역할을 한다.
그러니까, 인터페이스를 구현한다는 것은 인스턴스로 무엇을 할 수 있는지 클라이언트에게 말하는 것이다.
인터페이스의 이처럼 명확한 용도를 가지고 있으며 이를 지켜야 한다.

잘못 사용된 경우도 있다. 한 가지 예로 상수 인터페이스가 있다. 메서드 없이 상수를 뜻하는 static final 필드로만 구성된
인터페이스를 말한다. 모습은 아래와 같다.

```java
public interface PhysicalConstants {
    // 아보가드로 수 (1/몰)
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    // 볼츠만 상수 (J/K)
    static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;
    // 전자 질량(kg)
    static final double ELECTRON_MASS = 9.109_383_56e-31;
}
```

위와 같은 구현은 인터페이스를 잘못 사용한 예시다. 상수는 클래스의 내부에서 사용하는 것인데,
인터페이스로 구현했기 때문에 내부 구현을 API로 노출한 셈이다.

상수를 공개할 목적이라면 다른 방안을 고려해보자. **클래스나 인터페이스 자체에 추가하는 방법도 있다.** 예를 들어, Integer와
Double 클래스의 `MIN_VALUE`와 `MAX_VALUE` 상수가 있다. 또 다른 방법으로 **열거(enum) 타입으로** 표기할 수도 있고,
아래와 같이 인스턴스화할 수 없는 **유틸리티 클래스** 를 구현하여 제공하는 것도 좋다.

```java
public class PhysicalConstants {
    private PhysicalConstants() {
        // 인스턴스화 하지 못하도록 한다.
        throw new AssertionError("Cannot instantiate !!!");
    }
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    static final double BOLTZMANN_NUMBER = 1.380_648_52e-23;
    static final double ELECTRON_NUMBER = 9.109_383_56e-31;
}
```

<div class="post_caption">인터페이스는 타입을 정의하는 용도로만 사용하자</div>

<br><br>

# 아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라
> Prefer class hierarchies to tagged classes

**태그 달린 클래스**란 어떤 기능을 갖고 있는지 나타내는 필드가 있는 클래스를 말한다. 여러 구현과 쓸데없는 코드가 많기 때문에
가독성도 좋지 않으며 상대적으로 상대적으로 메모리도 더 차지한다.

- <a href="/post/prefer-class-hierarchies-to-tagged-classes" target="_blank">더 상세한 내용은 링크 참고:
[이펙티브 자바 3판] 아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라</a>

<div class="post_caption">태그 달린 클래스를 쓰는 상황은 거의 없다.</div>

<br><br>

# 아이템 24. 멤버 클래스는 되도록 static으로 만들라
> Favor static member classes over nonstatic

중첩 클래스의 종류에는 4가지가 있다. 정적 멤버 클래스, 비정적 멤버 클래스, 익명 클래스 그리고 지역 클래스다.

- <a href="/post/favor-static-member-classes-over-nonstatic" target="_blank">더 상세한 내용은 링크 참고:
[이펙티브 자바 3판] 아이템 24. 멤버 클래스는 되도록 static으로 만들라</a>

<div class="post_caption">중첩 클래스에는 네 가지가 있으며, 각각의 쓰임이 다르다.</div>

<br><br>

# 아이템 25. 톱레벨 클래스는 한 파일에 하나만 담으라
> Limit source files to a single top-level class

하나의 소스 파일에 톱레벨 클래스를 여러 개 선언하더라도 자바 컴파일러는 오류를 발생시키지 않는다. 하지만 A라는 파일에 클래스 2개가 정의되어 있는데,
B라는 다른 파일에도 같은 이름으로 2개의 클래스가 정의되어 있으면 문제가 얘기가 다르다. 컴파일에 실패하거나 컴파일 순서에 따라서 동작이 다를 수 있다.

해결책은 간단하다. **단순히 톱레벨 클래스들을 서로 다른 파일에 분리해서 작성해주면 된다.** 꼭 하나의 파일에 담고 싶다면,
정적 멤버 클래스를 사용하는 방법을 고민해보자. 가독성도 좋고 private으로 선언한 경우에는 접근 범위도 최소로 관리할 수 있기 때문이다.

<div class="post_caption">소스 파일 하나에는 반드시 하나의 톱레벨 클래스 또는 인터페이스만 두자.</div>
