---
layout:   post
title:    "[이펙티브 자바 3판] 12장. 직렬화"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter12: Serialization"
category: Java
date: "2019-10-11 00:32:29"
comments: true
---

# 목차
- <a href="#아이템-85-자바-직렬화의-대안을-찾으라">아이템 85. 자바 직렬화의 대안을 찾으라</a>
- <a href="#아이템-86-serializable을-구현할지는-신중히-결정하라">아이템 86. Serializable을 구현할지는 신중히 결정하라</a>
- <a href="#아이템-87-커스텀-직렬화-형태를-고려해보라">아이템 87. 커스텀 직렬화 형태를 고려해보라</a>
- <a href="#아이템-88-readobject-메서드는-방어적으로-작성하라">아이템 88. readObject 메서드는 방어적으로 작성하라</a>
- <a href="#아이템-89-인스턴스-수를-통제해야-한다면-readresolve보다는-열거-타입을-사용하라">
아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라</a>
- <a href="#아이템-90-직렬화된-인스턴스-대신-직렬화-프록시-사용을-검토하라">
아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라</a>

<br>

# 아이템 85. 자바 직렬화의 대안을 찾으라
> Prefer alternatives to Java serialization

직렬화는 공격 소지가 많아 위험하다. 이러한 직렬화의 위험을 피하는 가장 좋은 방법은 "아무 것도 역직렬화하지 않는 것이다."
꼭 이용해야 한다면 객체 역직렬화 필터링 등을 사용해보자.

- <a href="/post/prefer-alternatives-to-java-serialization" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 85. 자바 직렬화의 대안을 찾으라</a>

<div class="post_caption">자바 직렬화 대신에 JSON과 같은 대안을 선택하자.</div>

<br>

# 아이템 86. Serializable을 구현할지는 신중히 결정하라
> Implement Serializable with great caution

직렬화 가능한 클래스를 만드는 방법은 간단하다. `Serializable`을 구현하기만 하면 된다. 하지만 그로 인해 필요한 대가는 상당하다.
구현한 순간부터 많은 위험성을 갖게 되고 확장성을 잃게 된다.

- <a href="/post/implement-serializable-with-great-caution" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 86. Serializable을 구현할지는 신중히 결정하라</a>

<div class="post_caption">Serializable 선언은 간단한만큼 대가가 따른다.</div>

<br>

# 아이템 87. 커스텀 직렬화 형태를 고려해보라
> Consider using a custom serialized form

이상적인 직렬화 형태는 물리적인 모습과 독립된 논리적인 모습만을 표현해야 한다. 클래스가 `Serializable`을 구현하고
기본 직렬화 형태를 사용한다면 현재의 구현에 종속적이게 된다.

- <a href="/post/consider-using-a-custom-serialized-form" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 87. 커스텀 직렬화 형태를 고려해보라</a>

<div class="post_caption">객체를 적절히 설명하는 커스텀 직렬화 형태를 고민해보자.</div>

<br>

# 아이템 88. readObject 메서드는 방어적으로 작성하라
> Write readObject methods defensively

`readObject` 메서드는 또 다른 `public` 생성자와 같다. 그렇기 때문에 생성자와 같은 수준으로 다뤄야 한다.
인수의 유효성 검사와 매개변수를 방어적으로 복사하는 일이 필요하다.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 88. readObject 메서드는 방어적으로 작성하라</a>

<div class="post_caption">readObject 메서드를 작성할 때는 주의하자.</div>

<br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

앞선 아이템 3에서는 아래와 같은 싱글턴 패턴 예제를 보았다.

```java
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }

    ...
}
```

하지만 이 클래스는 `Serializable`을 구현하게 되는 순간 싱글턴이 아니게 된다. 기본 직렬화를 쓰지 않거나 명시적인 `readObject` 메서드를
제공하더라도 소용이 없다. 어떤 `ReadObject` 메서드를 사용하더라도 초기화될 때 만들어진 인스턴스와 다른 인스턴스를 반환하게 된다.

이때 `readResolve` 메서드를 이용하면 `readObject` 메서드가 만든 인스턴스를 다른 것으로 대체할 수 있다. 이때 `readObject` 가
만들어낸 인스턴스는 가비지 컬렉션의 대상이 된다.

```java
private Object readResolve() {
    // 기존에 생성된 인스턴스를 반환한다.
    return INSTANCE;
}
```

한편 여기서 살펴본 `Elvis` 인스턴스의 직렬화 형태는 아무런 실 데이터를 가질 필요가 없으니 모든 인스턴스 필드는 `transient` 로 선언해야
한다. 그러니까 `readResolve` 메서드를 인스턴스의 통제 목적으로 이용한다면 모든 필드는 `transient`로 선언해야 한다.

만일 그렇지 않으면 역직렬화(Deserialization) 과정에서 역직렬화된 인스턴스를 가져올 수 있다. 즉, 싱글턴이 깨지게 된다.

하지만 `enum`을 사용하면 모든 것이 해결된다. 자바가 선언한 상수 외에 다른 객체가 없음을 보장해주기 때문이다.
물론 `AccessibleObject.setAccessible` 메서드와 같은 리플렉션을 사용했을 때는 예외다.

```java
public enum Elvis {
    INSTANCE;
    
    ...필요한 데이터들
}
```

인스턴스 통제를 위해 `readResolve` 메서드를 사용하는 것이 중요할 때도 있다. 직렬화 가능 인스턴스 통제 클래스를 작성해야 할 때,
컴파일 타임에는 어떤 인스턴스들이 있는지 모를 수 있다. 이 때는 열거 타입으로 표현하는 것이 불가능하기 때문에 `readResolve` 메서드를
사용할 수 밖에 없다.

<div class="post_caption">불변식을 지키기 위해 인스턴스를 통제할 때는 열거 타입을 사용하자.</div>

<br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances

`Serializable`을 구현하게 되면 생성자 이외의 인스턴스 생성 방법이 생기게 된다. 그러니까 버그와 보안 문제가 생길 가능성이 커진다는 것이다.
하지만 직렬화 프록시 패턴을 사용하면 위험성을 크게 줄일 수 있다.

- <a href="/post/consider-serialization-proxies-instead-of-serialized-instances" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라</a>

<div class="post_caption">직렬화 프록시 패턴을 사용하면 안전하게 불변식을 직렬화할 수 있다.</div>