---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 85. 자바 직렬화의 대안을 찾으라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 85. Prefer alternatives to Java serialization"
category: Java
date: "2019-10-12 01:21:59"
comments: true
---

# 자바 직렬화는 위험하다.
우선 결론부터 말하자면 "직렬화는 위험하다." 직렬화의 위험성을 회피하는 가장 좋은 방법은 아무것도 역직렬화하지 않는 것이다.

<br><br>

# 왜 위험할까?
직렬화가 위험한 이유는 공격 범위가 너무 넓은 것이다. 게다가 지속적으로 더 넓어져 방어하기도 어렵다.
OutputInputStream의 `readObject` 메서드를 호출하면서 객체 그래프가 역직렬화(deserialization)되기 때문이다.

바이트 스트림을 역직렬화하는 과정에서 `readObject` 메서드는 그 타입들 안의 모든 코드를 수행할 수 있다.
즉, 그 타입들의 코드 전체가 악의적인 공격 범위에 들어갈 수 있다는 뜻이 된다.

한편 역직렬화 과정에서 호출되어 잠재적인 위험한 동작을 수행하는 메서드를 **가젯(gadget)** 이라고 한다.
하나의 가젯이 또는 여러 개의 가젯이 마음대로 코드를 수행하게 할 수 있다.
따라서 아주 신중하게 제작된 바이트 스트림만 역직렬화해야 한다.

<br><br>

# 역직렬화 폭탄
역직렬화에 시간이 오래 걸리는 짧은 스트림을 역직렬화 폭탄(deserialization bomb)이라고 한다.
HashSet과 문자열을 이용해 역직렬화 폭탄을 테스트 해보자.

```java
static byte[] bomb() {
    Set<Object> root = new HashSet<>();
    Set<Object> s1 = root;
    Set<Object> s2 = new HashSet<>();

    for (int i=0; i < 100; i++) {
        Set<Object> t1 = new HashSet<>();
        Set<Object> t2 = new HashSet<>();

        t1.add("foo"); // t1을 t2과 다르게 만든다.
        s1.add(t1); s1.add(t2);

        s2.add(t1); s2.add(t2);
        s1 = t1; s2 = t2;
    }
    return serialize(root);
}
```

`serialize` 메서드가 수행되기 전의 인스턴스의 참조 형태를 보면 아래와 같은 형태다.
이 깊이가 100단계까지 만들어진다. 즉, 이를 역직렬화하려면 hashCode 메서드를 $${ 2 }^{ 100 }$$ 번 넘게 호출해야 한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-10-12-prefer-alternatives-to-java-serialization-1.png"
width="400" alt="serialization bomb"/>

<br><br>

# Cross-Platform Structured-Data Representation
자바 직렬화는 크로스-플랫폼 구조화된 데이터 표현 방법으로 대체해야 한다. 예로는 JSON, protocol buffer 등이 있다.
프로토콜 버퍼는 이진 표현이라 효율이 훨씬 높으며 JSON은 텍스트 기반이라 사람이 읽을 수 있는 장점이 있다.

<br><br>

# 직렬화를 대체 할 수 없다면
오래된 시스템으로 자바 직렬화를 사용할 수밖에 없다면 **반드시 신뢰할 수 있는 데이터만 역직렬화**해야 한다.

직렬화를 피할 수 없고 역직렬화한 데이터가 안전하지 확실할 수 없다면 **객체 역직렬화 필터링**을 사용하면 된다.
자바 9에 추가되었고, 이전 버전에서도 사용할 수 있도록 이식되었다. 데이터 스트림이 역직렬화되기 전에 필터를 수행하여
특정 클래스만 수용하거나 제외하도록 할 수 있다.

- <a href="/post/why-java-serialization-is-bad#역직렬화-필터링" target="_blank">
참고 링크: "자바 직렬화: 사용할 때 고민하고 주의할 점"</a>

이처럼 직렬화는 위험 요소가 많다. 시간과 노력을 쓰더라도 JSON 등으로 마이그레이션하는 것을 추천한다.