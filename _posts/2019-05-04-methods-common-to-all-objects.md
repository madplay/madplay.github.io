---
layout:   post
title:    "[이펙티브 자바 3판] 3장. 모든 객체의 공통 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter3: Methods Common to All Objects"  
category: Java
comments: true
---

# 목차
- <a href="#아이템-10-equals는-일반-규약을-지켜-재정의하라">아이템 10. equals는 일반 규약을 지켜 재정의하라</a>
- <a href="#아이템-11-equals를-재정의하려거든-hashcode도-재정의하라">아이템 11. equals를 재정의하려거든 hashCode도 재정의하라</a> 
- <a href="#아이템-12-tostring을-항상-재정의하라">아이템 12. toString을 항상 재정의하라</a>
- <a href="#아이템-13-clone-재정의는-주의해서-진행하라">아이템 13. clone 재정의는 주의해서 진행하라</a>
- <a href="#아이템-14-comparable을-구현할지-고려하라">아이템 14. Comparable을 구현할지 고려하라</a>

<br>

# 아이템 10. equals는 일반 규약을 지켜 재정의하라
> Obey the general contract when overriding equals

먼저, 결론은 재정의하지 않고 아래의 기본 `equals` 메서드를 사용한다.

```java
public boolean equals(Object obj) {
    return (this == obj);
}
```

특히 아래와 같은 상황에서는 재정의하지 않는 것이 최선일 수 있다.

첫 번째로, **값을 표현하는 것이 아니라 동작하는 개체를 표현하는 클래스인 경우**를 생각할 수 있다.
Object의 equals 메서드로도 충분한 경우인데 예를 들어 Thread 클래스가 있다. 인스턴스가 가지는 값보다
동작하는 개체임을 나타내는 것이 더 중요하다.

두 번째로 **논리적 동치성(logical equality)을 검사할 필요가 없는 경우**에도 재정의하지 않는 것이 좋다.
예를 들어서 두 개의 랜덤(Random) 객체가 같은 난수열을 만드는지 확인하는 것은 의미가 없다.
마지막으로 **private이나 패키지 전용 클래스라서 클래스의 equals 메서드가 절대 호출되지 않아야하는 경우**에 해당한다.
이런 경우에는 equals 메서드를 반드시 오버라이드(override)해서 호출되지 않도록 막아야 한다.

- <a href="/post/obey-the-general-contract-when-overriding-equals" target="_blank">더 상세한 내용은 링크 참고: 
[이펙티브 자바 3판] 아이템 10. equals는 일반 규약을 지켜 재정의하라</a>

<div class="post_caption">꼭 필요한 경우가 아니면 equals를 재정의하지 말자.</div>

<br><br>

# 아이템 11. equals를 재정의하려거든 hashCode도 재정의하라
> Always override hashCode when you override equals

`equals` 메서드를 재정의했지만 `hashCode`를 재정의하지 않은 경우 컬렉션의 원소로 사용될 때 이슈가 있을 수 있다.
따라서 `hashCode` 규약에 따라서 올바르게 재정의해야 한다.

- <a href="/post/always-override-hashcode-when-you-override-equals" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 11. equals를 재정의하려거든 hashCode도 재정의하라</a>

<div class="post_caption">equals를 재정의할 때는 hashCode도 반드시 재정의해야 한다.</div>

<br><br>

# 아이템 12. toString을 항상 재정의하라
> Always override toString

`toString` 메서드는 간결하고 읽기 쉬운 형태의 유익한 정보를 반환해야 한다. 
이를 잘 구현한 클래스는 사용하기 좋고 디버깅을 쉽게 해준다.

### 좋은 toString 재정의 방법
- 객체가 가진 주요 정보 모두를 반환해야 한다.
- 주석으로 `toString`이 반환하는 포맷을 명시하든 아니든 의도를 명확하게 해야 한다.
- `toString`이 반환한 값에 포함된 정보를 얻어올 수 있는 API를 제공하자.
  - 없다면 이 정보가 필요한 개발자는 `toString`의 반환값을 파싱할 수 밖에 없다.

### toString 재정의가 필요 없는 경우
- 대부분의 정적 유틸리티 클래스
- 대부분의 열거(enum) 타입
- 수퍼 클래스에서 이미 적절하게 재정의한 경우

### 실무에서는 ToStringBuilder을 추천
`apache-commons-lang3` 라이브러리를 사용하면 간편하게 `toString` 포맷을 이용할 수 있습니다. 

```java
public String toString() {
    /*
     * 두 번째 인자를 변경하여 포맷을 바꿀 수 있다.
     * ToStringStyle.JSON_STYLE 등
     */
    return ToStringBuilder.reflectionToString(this, ToStringStyle.MULTI_LINE_STYLE);
}
```

<div class="post_caption">toString은 해당 객체에 관해 명확하고 유용한 정보를 반환해야 한다.</div>

<br/>

# 아이템 13. clone 재정의는 주의해서 진행하라
> Override clone judiciously

`Cloneable`은 복제해도 되는 클래스임을 명시하는 용도의 믹스인 인터페이스(mixin interface)이다.
하지만 의도한 목적에 조금 어긋난다. `clone` 메서드가 선언된 곳이 Cloneable이 아닌 `Object` 클래스이고
그마저도 protected 접근 지정자이다. `Cloneable` 인터페이스는 메서드도 하나 없지만,
Object 클래스의 clone의 동작 방식을 결정한다.

```java
package java.lang;

public interface Cloneable {
    // 아무 것도 없음
}
```

`Cloneable`을 구현한 클래의 인스턴스에서 clone 메서드를 호출하면, 객체의 필드들을 모두 복사한 객체를 반환하고
구현하지 않은 클래스의 인스턴스에서 호출하면 예외를 던진다.

### '복사'의 일반적인 의도
- `x.clone() != x` 필수로 참이어야 한다.
- `x.clone().getClass() == x.getClass()` 필수는 아니다.
- `x.clonde().equals(x)` 필수는 아니다.

clone 메서드를 조작하는 경우 하위 클래스에서 의도하지 않은 결과를 받을 수 있음으로 주의해야 한다.
클래스 B가 클래스 A를 상속한다고 할 때, 하위 클래스인 B의 clone 메서드는 B 타입 객체를 반환해야 한다.
그런데 클래스 A의 clone이 자신의 생성자로 생성한 객체를 반환한다면, 클래스 B의 clone도 A 타입 객체를 반환할 수 밖에 없다.
그렇기 때문에 `super.clone`을 연쇄적으로 호출하도록 구현하면, 의도와 알맞는 객체를 만들 수 있다.

### clone 보다는 복사 생성자와 복자 팩터리를 사용하자.
`Cloneable`을 복잡하게 사용할 필요가 없으니 다른 방식으로 하는 것도 좋다. 
복사 생성자와 복사 팩터리를 사용하면 clone 방식의 단점에서 자유롭다. 

```java
// 복사 생성자
public MadPlay(MadPlay madPlay) { 
    // ...
};

// 복사 팩터리
public static MadPlay newInstance(MadPlay madPlay) {
    // ...
};
```

<div class="post_caption">배열을 제외하고 복제 기능은 생성자와 팩터리를 이용하는 게 최고다</div>

<br><br>

# 아이템 14. Comparable을 구현할지 고려하라
> Consider implementing Comparable

Comparable 인터페이스의 메서드는 `CompareTo` 뿐이다. Comparable 인터페이스를 구현(implements)했다는 것은
그 클래스의 인스턴들에는 자연적인 순서가 있음을 뜻한다. Object 클래스의 `equals`와 비슷하지만 단순 동치성 비교와
순서도 비교할 수 있으며 제네릭하다.

<br>

## compareTo 메서드의 일반 규약
- 이 객체와 주어진 객체의 순서 비교
  - 이 객체가 주어진 객체보다 작으면 음의 정수를 반환한다.
  - 이 객체가 주어진 객체와 같으면 0을 반환한다.
  - 이 객체가 주어진 객체보다 크면 양의 정수를 반환한다.
  - 이 객체와 비교할 수 없는 타입의 객체면 ClassCastException 예외를 던진다.
  
아래 설명에서의 sgn(표현식) 표기는 수학에서 말하는 부호 함수(signum function)이며,
표현식의 값이 음수, 0, 양수일때 -1, 0, 1을 반환하도록 정의했다.

- 대칭성: Comparable을 구현한 클래스는 모든 x, y에 대해 sng(x.compareTo(y)) == -sgn(y.compareTo(x)) 이다.
- 추이성: Comparable을 구현한 클래스는 x.compareTo(y) > 0 && y.compareTo(z)이면, x.compareTo(z) > 0 이다.
- 반사성: Comparable을 구현한 클래스는 모든 z에 대해 x.compareTo(y) == 0이면, sgn(x.compareTo(z)) == sgn(y.compareTo(z)) 이다.
- 동치성: 필수는 아니지만 좋기면 좋다. (x.compareTo(y) == 0) == (x.equals(y)) 여야 한다.
  - Comparable을 구현했지만 이 사항을 지키지 않은 모든 클래스는 그 내용을 명시하면 좋다.

<br>

## compareTo 메서드 작성법
`equals`와 비슷하지만 몇 가지 차이점이 있다.

- 인자의 타입을 확인한다거나 형변환할 필요가 없다. 제네릭 인터페이스이기 때문이다.
  - 타입이 잘못됐다면 컴파일 시점에 오류가 발생한다. null을 입력한 경우 NullPointerException 예외를 던져야 한다.
- 각 필드가 동치인지를 비교하는 게 아니라 그 순서를 비교한다.
- 객체 참조 필드를 비교하려면 compareTo 메서드를 재귀적으로 호출한다.
- Comparable을 구현하지 않은 필나 표준이 아닌 순서로 비교해야 한다면 비교자(Comparator)를 대신 사용한다.
  - 직접 만들거나 자바에서 제공하는 것을 골라서 사용한다.
- 자바 7부터는 기본 정수 타입을 비교할 때 관계 연산자 <와 > 을 사용하지 않고 compare를 사용하라.
- 핵심적인 피륻부터 비교한다. 비교 결과가 바로 나온다면, 즉 순서가 바로 결정되면 거기서 결과를 곧바로 반환하자.

<br>

## Comparator 인터페이스
자바 8부터는 Comparator 인터페이스가 많은 비교자 생성 메서드를 갖게 되었다. 간결하게 사용할 수 있지만 약간의 성능 저하도 있다.

```java
private static final Comparator<User> COMPARATOR =
    comparingInt((User user) -> user.age)
        .thenComparingInt(user -> user.id);

public int compareTo(User user) {
    return COMPARATOR.compare(this, user);
}
```

<div class="post_caption">순서를 고려해야 하는 값 클래스를 작성한다면 Comparable 인터페이스를 구현하자.</div>