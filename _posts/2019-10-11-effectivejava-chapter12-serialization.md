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

<br><br>

# 아이템 86. Serializable을 구현할지는 신중히 결정하라
> Implement Serializable with great caution

직렬화 가능한 클래스를 만드는 방법은 간단하다. `Serializable`을 구현하기만 하면 된다. 하지만 그로 인해 필요한 대가는 상당하다.
구현한 순간부터 많은 위험성을 갖게 되고 확장성을 잃게 된다.

- <a href="/post/implement-serializable-with-great-caution" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 86. Serializable을 구현할지는 신중히 결정하라</a>

<div class="post_caption">Serializable 선언은 간단한만큼 대가가 따른다.</div>

<br><br>

# 아이템 87. 커스텀 직렬화 형태를 고려해보라
> Consider using a custom serialized form

이상적인 직렬화 형태는 물리적인 모습과 독립된 논리적인 모습만을 표현해야 한다. 클래스가 `Serializable`을 구현하고
기본 직렬화 형태를 사용한다면 현재의 구현에 종속적이게 된다.

- <a href="/post/consider-using-a-custom-serialized-form" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 87. 커스텀 직렬화 형태를 고려해보라</a>

<div class="post_caption">객체를 적절히 설명하는 커스텀 직렬화 형태를 고민해보자.</div>

<br><br>

# 아이템 88. readObject 메서드는 방어적으로 작성하라
> Write readObject methods defensively

`readObject` 메서드는 또 다른 `public` 생성자와 같다. 그렇기 때문에 생성자와 같은 수준으로 다뤄야 한다.
인수의 유효성 검사와 매개변수를 방어적으로 복사하는 일이 필요하다.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 88. readObject 메서드는 방어적으로 작성하라</a>

<div class="post_caption">readObject 메서드를 작성할 때는 주의하자.</div>

<br><br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

싱글턴이라고 생각한 설계가 `Serializable`을 구현한 순간 어긋날 수 있다. 기본 직렬화를 사용하지 않든, 명시적으로 `readObject` 메서드를
제공하든, 인스턴스의 개수를 제한할 수 없게 된다. 이때는 **열거 타입(enum)**을 사용하면 안전하게 불변식을 지킬 수 있다.

- <a href="/post/for-instance-control-prefer-enum-types-to-readresolve" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라</a>

<div class="post_caption">불변식을 지키기 위해 인스턴스를 통제할 때는 열거 타입을 사용하자.</div>

<br><br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances

`Serializable`을 구현하게 되면 생성자 이외의 인스턴스 생성 방법이 생기게 된다. 그러니까 버그와 보안 문제가 생길 가능성이 커진다는 것이다.
하지만 직렬화 프록시 패턴을 사용하면 위험성을 크게 줄일 수 있다.

- <a href="/post/consider-serialization-proxies-instead-of-serialized-instances" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라</a>

<div class="post_caption">직렬화 프록시 패턴을 사용하면 안전하게 불변식을 직렬화할 수 있다.</div>