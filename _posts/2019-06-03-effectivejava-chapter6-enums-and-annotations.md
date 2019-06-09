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

<pre class="line-numbers"><code class="language-java" data-start="1">public enum Ensemble {
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

과거에는 아래와 같이 정수 열거 패턴을 비트 필드 표현에 사용했다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class Text {
    public static final int STYLE_BOLD          = 1 << 0;  // 1
    public static final int STYLE_ITALIC        = 1 << 1;  // 2
    public static final int STYLE_UNDERLINE     = 1 << 2;  // 4
    public static final int STYLE_STRIKETHROUGH = 1 << 3; // 8

    // 매개변수 styles는 0개 이상의 STYLE_ 상수를 비트별 OR한 값이다.
    public void applyStyles(int styles) { ... }
}
</code></pre>

다음과 같이 비트별 OR를 이용하여 여러 상수를 하나의 집합으로 모을 수 있었는데 이를 비트 필드(bit field)라고 한다.

<pre class="line-numbers"><code class="language-java" data-start="1">// Text.STYLE_BOLD | Text.STYLE_ITALIC ===> 결과값은 3
text.applyStyles(STYLE_BOLD | STYLE_ITALIC);
</code></pre>

비트별 연산을 이용해 합집합과 교집합 같은 집합 연산을 효율적으로 할 수 있으나, 정수 열거 상수의 단점을 그대로 가지고 있으며
오히려 해석하기가 더 어렵다. 또한 비트 필드에 포함된 모든 의미상의 원소를 순회하기도 까다롭고 최대 몇 비트가 필요한지 미리 예측한 후
타입을 선택해야 한다. 비트를 늘릴 수 없기 때문이다.

이러한 불편함은 **EnumSet을 사용하는 것으로 해결할 수 있다.** Set 인터페이스를 구현하며 타입 안전하고 다른 어떤 Set 구현체와도
함께 사용할 수 있다. EnumSet의 내부는 비트 벡터로 구현되었기 때문에 원소가 64개 이하라면, EnumSet 전체를 long 변수 하나로 표현한다.
```removeAll```과 ```retainAll```과 메서드는 비트 필드를 쓸 때와 동일하게 비트를 효율적으로 처리할 수 있는 산술 연산을 사용하여 구현했다.
그러면서도 비트를 직접 다룰 때의 발생할 수 있는 오류에서 자유롭다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class Text {
    public enum Style { BOLD, ITALIC, INDERLINE, STRIKETHROUGH }

    // 깔끔하고 안전하다. 어떤 Set을 넘겨도 되나, EnumSet이 가장 좋다.
    // 보통 인터페이스를 전달 받는 것이 좋은 습관이다.
    public void applyStyles(Set&lt;Style> styles) { ... }
}
</code></pre>

EnumSet의 **유일한 단점은 불변 EnumSet을 만들 수 없다는 것이다.** 자바 11버전까지 추가가 안되었으나,
구글의 구아바(Guava) 라이브러리의 ```Collections.unmodifiableSet```을 사용하면 불변 상태로 만들 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">// Guava 라이브러리 사용
Set immutableEnumSet = Collections.unmodifiableSet(EnumSet.of(Text.Style.BOLD, Text.Style.ITALIC));
immutableEnumSet.add(Text.Style.INDERLINE); // java.lang.UnsupportedOperationException
</code></pre>

하지만 내부에서 EnumSet을 사용하여 구현했기 때문에 성능 면에서는 손해를 볼 수 밖에 없다.

<div class="post_caption">비트 필드를 사용할 이유는 없다. EnumSet을 사용하자.</div>

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
