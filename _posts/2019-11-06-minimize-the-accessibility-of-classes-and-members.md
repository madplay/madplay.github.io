---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 15. 클래스와 멤버의 접근 권한을 최소화하라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 15. Minimize the accessibility of classes and members" 
category: Java
date: "2019-11-06 22:34:15"
comments: true
---

# 캡슐화
잘 설계된 컴포넌트는 클래스 내부 데이터와 내부 구현 정보를 외부 컴포넌트로부터 얼마나 잘 숨겼는가에 결정된다.
모든 내부 구현을 완벽하게 숨겨, 구현과 API를 깔끔하게 분리하는 것이다.
이를 **정보 은닉(information hiding) 혹은 캡슐화(encapsulation)** 라고 한다.

<br><br>

# 정보 은닉 혹은 캡슐화의 장점
정보 은닉 혹은 캡슐화는 객체의 필드와 메서드를 하나로 묶고 실제 구현 내용 일부를 외부에 감추어 은닉하는 것을 말한다.
즉, 외부에서 변수에 직접 접근할 수 없도록 하고 오직 메서드를 통해서만 값이 변경될 수 있도록 한다.

정보 은닉은 시스템을 구성하는 컴포넌트 사이의 결합도와 의존성을 낮춘다. 구현 코드를 외부에서 변경하지 못하도록 하므로
해당 기능을 변경해야 하는 상황이 발생하는 경우 특정 클래스에만 변경 사항에 영향을 받는다.
즉, 요구 사항 변화에 따른 코드 수정 범위를 최소화할 수 있다.

이를 통해 얻을 수 있는 장점으로는 우선, **개발 속도를 높일 수 있다.** 여러 컴포넌트를 병렬 개발할 수 있기 때문이다.
어떤 컴포넌트가 문제를 일으키는지 찾기 쉽고 다른 컴포넌트에 영향없이 최적화할 수 있기 때문에 **성능 최적화에도 도움을 준다.**
또한 각 컴포넌트를 더 빨리 파악할 수 있고 다른 컴포넌트로 교체하는 부담도 적기 때문에 **관리적인 비용도 줄일 수 있으며 재사용성을 높일 수 있다.**
그리고 시스템이 미완성되었어도 개별 컴포넌트의 동작을 검증할 수 있기 때문에 **큰 시스템의 제작을 조금 더 쉽게** 해준다.

<br><br>

# 접근 지정자의 종류
접근 범위가 좁은 순서대로 접근 지정자를 나열하면 아래와 같다.

- private
  - 멤버를 선언한 톱레벨 클래스에서만 접근할 수 있다.
- package-private
  - 멤버가 소속된 패키지 안의 모든 클래스에서 접근할 수 있다.접근 제한자를 지정하지 않았을 때 적용되는 패키지 접근 수준이다.
  - 단 인터페이스의 멤버는 기본적으로 public이 적용된다.
- protected
  - package-private의 접근 범위를 포함하며, 이 멤버를 선언한 클래스의 하위 클래스에서도 접근할 수 있다.
- public
  - 모든 곳에서 접근할 수 있다.

<br><br>

# 컴포넌트를 설계하는 방법
핵심은 모든 클래스와 멤버의 접근성을 최대한 좁혀야 한다. 항상 **가장 낮은 접근 지정자 수준**을 부여해야 한다.

- 패키지 외부에서 사용할 이유가 없다면 **package-private**으로 선언하자.
  - 그러면 API가 아닌 내부 구현이 되어 언제든 수정할 수 있다.
- 경우에 따라 **private static 중첩 클래스**를 사용해보자.
  - 하나의 클래스에서만 사용하는 package-private 톱레벨 클래스나 인터페이스가 대상이다.
  - 이를 사용하는 클래스 안에 private static으로 중첩시켜 보자.
  - 이렇게 하면 바깥 클래스 하나에서만 접근할 수 있다.
- 클래스의 공개 API를 제외한 **모든 멤버는 private**으로 만들자.
  - 같은 패키지의 다른 클래스가 접근해야 하는 멤버에 한해 package-private으로 풀어준다.
  - 다만, 상위 클래스의 메서드를 재정의할 때는 접근 수준을 상위 클래스보다 좁게 설정할 수 없다.
- 테스트만을 위해 클래스, 인터페이스 그리고 멤버를 공개 API로 만들어서는 안된다.
- public 클래스의 인스턴스 필드는 되도록 **public이 아니어야** 한다.
  - 불변을 보장하기 어렵고 일반적으로 스레드 안전하지 않다.
- public static final 필드는 **기본 타입이나 불변 객체를 참조**해야 한다.
  - 하지만 public static final 배열 필드를 두거나 이를 반환하는 접근자 메서드는 두면 안된다.
  - 다른 객체를 참조하도록 바꿀 수는 없지만 참조된 객체 자체가 수정될 수는 있다.
  - 길이가 0이 아닌 배열은 모두 변경 가능하다.

```java
class Example {
    public static final Integer[] SOME_VALUES = {1, 2, 3};
}

class Test {
    public static void main(String[] args) {
        System.out.println(Example.SOME_VALUES[0]); // 1
        Example.SOME_VALUES[0] = 5;
        System.out.println(Example.SOME_VALUES[0]); // 5
    }
}
```

이런 경우는 public 으로 선언한 배열을 private 접근 지정자로 변경하고 변경 불가능한 public 리스트로 만드는 방법이 있다.

```java
private static final Integer[] SOME_VALUES = {1, 2, 3};
public static final List<Integer> VALUES = Collections.unmodifiableList(Arrays.asList(SOME_VALUES));
```

아니면 배열은 private으로 선언하고 해당 배열을 복사해서 반환하는 public 메서드를 추가할 수도 있다.

```java
private static final Integer[] SOME_VALUES = {1, 2, 3};
public static final Integer[] values() {
    return SOME_VALUES.clone();
}
```