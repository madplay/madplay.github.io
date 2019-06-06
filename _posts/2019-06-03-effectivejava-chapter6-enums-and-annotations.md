---
layout:   post
title:    "[이펙티브 자바 3판] 6장. 열거 타입과 애너테이션"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter6: Enums and Annotations"
category: Java
date: "2019-06-03 00:02:55"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-34-int-상수-대신-열거-타입을-사용하라">아이템 34. int 상수 대신 열거 타입을 사용하라</a>
- <a href="#아이템-35-ordinal-메서드-대신-인스턴스-필드를-사용하라">아이템 35. ordinal 메서드 대신 인스턴스 필드를 사용하라</a>
- <a href="#아이템-36-비트-필드-대신-enumset을-사용하라">아이템 36. 비트 필드 대신 EnumSet을 사용하라</a>
- <a href="#아이템-37-ordinal-인덱싱-대신-enummap을-사용하라">아이템 37. ordinal 인덱싱 대신 EnumMap을 사용하라</a>
- <a href="#아이템-38-확장할-수-있는-열거-타입이-필요하면-인터페이스를-사용하라">아이템 38. 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라</a>
- <a href="#아이템-39-명명-패턴보다-애너테이션을-사용하라">아이템 39. 명명 패턴보다 애너테이션을 사용하라</a>
- <a href="#아이템-40-override-애너테이션을-일관되게-사용하라">아이템 40. @Override 애너테이션을 일관되게 사용하라</a>
- <a href="#아이템-41-정의하려는-것이-타입이라면-마커-인터페이스를-사용하라">아이템 41. 정의하려는 것이 타입이라면 마커 인터페이스를 사용하라</a>

<br/>

# 아이템 34. int 상수 대신 열거 타입을 사용하라
> Use enums instead of int constants

enum 타입이 등장하기 전에는 정수 열거 패턴(int enum pattern)을 사용했었다.

<pre class="line-numbers"><code class="language-java" data-start="1">public static final int APPLE_FUJI = 0;
public static final int APPLE_PIPPIN = 1;

public static final int ORANGE_NEVEL = 0;
public static final int ORANGE_TEMPLE = 1;
</code></pre>

단점이 많다. 타입에 안전하지 않으며 코드도 계속 길어지게 된다. 오렌지를 건네야 하는 메서드에 사과를 보낸 후 동등 연산자 ```==```로 비교해도 어떠한
경고 메시지가 출력되지 않는다.

- <a href="/post/use-enums-instead-of-int-constants">더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 34. INT 상수 대신 열거 타입을 사용하라</a>

<div class="post_caption">열거 타입은 확실히 정수 상수보다 뛰어나다.</div>

<br/>

# 아이템 35. ordinal 메서드 대신 인스턴스 필드를 사용하라
> Use instance fields instead of ordinals

해당 상수가 열거 타입에서 몇 번째인지 반환하는 ```ordinal``` 메서드를 제공한다. 예를 들어 가장 첫 번째 상수는 0을 반환한다.
열거 타입 상수와 연결된 정숫값이 필요한 경우 ordinal 메서드를 이용하고 싶은 유혹에 빠질 수 있는데, 위험한 선택일 수 있다.
아래 코드를 통해 확인해보자. 합주단의 종류를 연주자가 1명인 솔로(solo)부터 10명인 디텍트(detect)까지 정의한 enum이다.

<pre class="line-numbers"><code class="language-java" data-start="1">public enum Ensemble {
    SOLO, DUET, TRIO, QUARTET, QUINTET,
    SEXTET, SEPTET, OCTET, NONET, DECTET;

    public int numberOfMusicians() { return ordinal() + 1; }   
}
</code></pre>

상수의 선언을 바꾸는 순간 바로 오동작을 할 수 있으며, 이미 사용 중인 정수와 값이 같은 상수는 추가할 수도 없다.
**해결책은 간단하다.** 열거 타입 상수에 연결된 값은 ordinal 메서드로 얻지 말고, **인스턴스 필드에 저장해서 사용하면 된다.**

<pre class="line-numbers"><code class="language-java" data-start="1">
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5),
    SEXTET(6), SEPTET(7), OCTET(8), NONET(9), DECTET(10),
    DOUBLE_QUARTET(8), TRIPLE_QUARTET(12);

    private final int int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
</code></pre>

<div class="post_caption">열거 타입 상수에 연결된 값은 인스턴스 필드에 저장하자.</div>

<br/>

# 아이템 36. 비트 필드 대신 EnumSet을 사용하라
> Use EnumSet instead of bit fields

<br/>

# 아이템 37. ordinal 인덱싱 대신 EnumMap을 사용하라
> Use EnumMap instead of ordinal indexing

<br/>

# 아이템 38. 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라
> Emulate extensible enums with interfaces

<br/>

# 아이템 39. 명명 패턴보다 애너테이션을 사용하라
> Prefer annotations to naming patterns

<br/>

# 아이템 40. @Override 애너테이션을 일관되게 사용하라
> Consistently use the Override annotation

<br/>

# 아이템 41. 정의하려는 것이 타입이라면 마커 인터페이스를 사용하라
> Use marker interfaces to define types
