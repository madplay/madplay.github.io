---
layout:   post
title:    "[이펙티브 자바 3판] 7장. 람다와 스트림"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter7: Lambdas and Streams"
category: Java
date: "2019-06-30 23:37:39"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-42-익명-클래스보다는-람다를-사용하라">아이템 42. 익명 클래스보다는 람다를 사용하라</a>
- <a href="#아이템-43-람다보다는-메서드-참조를-사용하라">아이템 43. 람다보다는 메서드 참조를 사용하라</a>
- <a href="#아이템-44-표준-함수형-인터페이스를-사용하라">아이템 44. 표준 함수형 인터페이스를 사용하라</a>
- <a href="#아이템-45-스트림은-주의해서-사용하라">아이템 45. 스트림은 주의해서 사용하라</a>
- <a href="#아이템-46-스트림에서는-부작용-없는-함수를-사용하라">아이템 46. 스트림에서는 부작용 없는 함수를 사용하라</a>
- <a href="#아이템-47-반환-타입으로는-스트림보다-컬렉션이-낫다">아이템 47. 반환 타입으로는 스트림보다 컬렉션이 낫다</a>
- <a href="#아이템-48-스트림-병렬화는-주의해서-적용하라">아이템 48. 스트림 병렬화는 주의해서 적용하라</a>

<br/>

# 아이템 42. 익명 클래스보다는 람다를 사용하라
> Prefer lambdas to anonymous classes

예전에는 자바에서 함수 타입을 표현할 때 추상 메서드 하나만을 담고 있는 인터페이스 또는 추상 클래스를 사용했다.
이러한 인터페이스를 함수 객체(function object)라고 하며, 특정 함수나 동작을 표현하는데 사용했다.

- <a href="post/prefer-lambdas-to-anonymous-classes">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 42. 익명 클래스보다는 람다를 사용하라</a>

<div class="post_caption">익명 클래스는 함수형 인터페이스가 아닌 타입의 인스턴스를 만들 때만 사용하자.</div>

<br/>

# 아이템 43. 람다보다는 메서드 참조를 사용하라
> Prefer method references to lambdas

메서드 참조(method refernce)를 사용하면 함수 객체를 람다보다 더 간결하게 만들 수 있다.

```java
// 람다를 사용한 코드
map.merge(key, 1, (count, incr) -> count + incr);

// 메서드 참조를 사용한 코드
map.merge(key, 1, Integer::sum);
```

그렇다고 항상 메서드 참조가 정답은 아니다. 때로는 람다가 메서드 참조보다 명확한 경우가 있다.


```java
class GoshThisClassNameIsHumongous {
    // action 메서드 정의는 생략

    public void withMethodReference() {
        // 메서드 참조
        servie.execute(GoshThisClassNameIsHumongous::action);
    }

    public void withLambda() {
        // 람다
        service.execute(() -> action());
    }
}
```

위 예제처럼 클래스 이름이 매우 길거나 의미하는 바가 명확하지 않은 경우도 마찬가지다.
예를 들어, ```Function.identity()```를 사용하기보다 똑같은 기능의 ```(x -> x)```와 같은
람다를 사용하는 것이 더 짧고 명확하다.

메서드 참조 유형 | 예시 | 같은 기능의 람다
|:--|:--|:--
정적 | Integer::parseInt | str -> Integer.parseInt(str)
한정적(인스턴스) | Instant.now()::isAfter | Instant then = Instant.now(); <br/>t -> then.isAfter(t)
비한정적(인스턴스) | String::toLowerCase | str -> str.toLowerCase()
클래스 생성자 | TreeMap<K,V>::new | () -> new TreeMap<K,V>()
배열 생성자 | Int[]::new | len -> new int[len]

<div class="post_caption">메서드 참조는 람다의 간결한 대안책이 될 수 있다.</div>

<br/>

# 아이템 44. 표준 함수형 인터페이스를 사용하라
> Favor the use of standard functional interfaces

<br/>

# 아이템 45. 스트림은 주의해서 사용하라
> Use streams judiciously

<br/>

# 아이템 46. 스트림에서는 부작용 없는 함수를 사용하라
> Prefer side-effect-free functions in streams

<br/>

# 아이템 47. 반환 타입으로는 스트림보다 컬렉션이 낫다
> Prefer Collection to Stream as a return type

<br/>

# 아이템 48. 스트림 병렬화는 주의해서 적용하라
> Use caution when making streams parallel