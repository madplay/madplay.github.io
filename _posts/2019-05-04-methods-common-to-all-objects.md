---
layout:   post
title:    "[이펙티브 자바 3판] 3장. 모든 객체의 공통 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter3: Methods Common to All Objects"  
category: Java
comments: true
---

<hr/>

# 목록

- <a href="#아이템-10-equals는-일반-규약을-지켜-재정의하라">아이템 10. equals는 일반 규약을 지켜 재정의하라</a>
- <a href="#아이템-11-equals를-재정의하려거든-hashCode도-재정의하라">아이템 11. equals를 재정의하려거든 hashCode도 재정의하라</a> 
- <a href="#아이템-12-toString을-항상-재정의하라">아이템 12. toString을 항상 재정의하라</a>
- <a href="#아이템-13-clone-재정의는-주의해서-진행하라">아이템 13. clone 재정의는 주의해서 진행하라</a>
- <a href="#아이템-14-Comparable을-구현할지-고려하라">아이템 14. Comparable을 구현할지 고려하라</a>

<br/>

# 아이템 10. equals는 일반 규약을 지켜 재정의하라
> Obey the general contract when overriding equals

먼저, 결론은 재정의하지 않고 아래의 기본 ```equals``` 메서드를 사용한다.

<pre class="line-numbers"><code class="language-java" data-start="1">public boolean equals(Object obj) {
    return (this == obj);
}
</code></pre>

특히 아래와 같은 상황에서는 재정의하지 않는 것이 최선일 수 있다.

첫 번째로, **값을 표현하는 것이 아니라 동작하는 개체를 표현하는 클래스인 경우**를 생각할 수 있다.
Object의 equals 메서드로도 충분한 경우인데 예를 들어 Thread 클래스가 있다. 인스턴스가 가지는 값보다
동작하는 개체임을 나타내는 것이 더 중요하다.

두 번째로 **논리적 동치성(logical equality)을 검사할 필요가 없는 경우**에도 재정의하지 않는 것이 좋다.
예를 들어서 두 개의 랜덤(Random) 객체가 같은 난수열을 만드는지 확인하는 것은 의미가 없다.
마지막으로 **private이나 패키지 전용 클래스라서 클래스의 equals 메서드가 절대 호출되지 않아야하는 경우**에 해당한다.
이런 경우에는 equals 메서드를 반드시 오버라이드(override)해서 호출되지 않도록 막아야 한다.

- <a href="/post/obey-the-general-contract-when-overriding-equals">더 상세한 내용은 링크 참고: 
[이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a>


# 아이템 11. equals를 재정의하려거든 hashCode도 재정의하라
Always override hashCode when you override equals

# 아이템 12. toString을 항상 재정의하라
Always override toString

# 아이템 13. clone 재정의는 주의해서 진행하라
Override clone judiciously

# 아이템 14. Comparable을 구현할지 고려하라
Consider implementing Comparable