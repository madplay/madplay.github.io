---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 50. Make defensive copies when needed" 
category: Java
comments: true
---

# 자바는 안전하다?

네이티브(Native) 메서드를 사용하지 않아서 **C, C++ 언어**에서의 버퍼 오버런, 배열 오버런, 와일드 포인터 같은
메모리 충돌 오류에서 안전합니다. 하지만 우리가 만든 클래스를 사용하는 클라이언트는 어떻게든 불변을 깨뜨린다고
가정하고 방어적인 프로그래밍을 해야 한다.

<br/>

# 불변식을 지키지 못한 클래스

자바에서 제공하는 ```Date``` 클래스는 가변이기 때문에 쉽게 불변식을 깨뜨릴 수 있습니다.

<a href="/post/reasons-why-javas-date-and-calendar-was-bad" target="_blank">
참고링크: Java Date와 Time 클래스를 사용하면 안되는 이유
</a>

<pre class="line-numbers"><code class="language-java" data-start="1">import java.util.Date;

class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        if(start.compareTo(end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
        this.start = start;
        this.end = end;
    }
    public Date start() { return start; }
    public Date end() { return end; }
    // ... 생략
}

class Item50Test {
    public void someMethod() {
        Date start = new Date();
        Date end = new Date();
        Period period = new Period(start, end);

        // deprecated method
        // period의 내부를 수정했다.
        end().setMonth(3);
    }

    public static void main(String[] args) {
        Item50Test main = new Item50Test();
        main.someMethod();
    }
}   
</code></pre>

```Date``` 클래스의 대부분 메서드는 ```Deprecated``` 되었으므로 사용하면 안됩니다.
```Java 8```부터 제공되는 ```LocalDateTime```과 같은 클래스를 사용하는 것을 권장합니다. 

<a href="/post/java8-date-and-time" target="_blank">참고링크: Java 8 날짜와 시간 계산</a>

외부의 공격으로부터 인스턴스의 내부를 보호하려면 생성자에서 받은 가변 매개변수를 **방어적으로 복사**해야 합니다.
위에서 살펴본 코드의 생성자를 아래와 같이 변경해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 그 외 코드는 동일합니다.
public Period(Date start, Date end) {
    this.start = new Date(start.getTime());
    this.end = new Date(end.getTime());

    // 유효성 검사 전에 복사해야 한다. 
    if(start.compareTo(end) > 0) {
        throw new IllegalArgumentException(start + " after " + end);
    }
}
</code></pre>

매개변수의 유효성을 검사하기 전에 복사본을 만들어야 합니다. 멀티 스레드(Multi-Thread) 환경을 가정했을 때
원본 객체의 유효성을 검사한 후에 복사본을 만드는 찰나의 순간에 다른 스레드가 원본 객체를 수정할 가능성이 있기 때문입니다.
이와 같은 공격을 검사시점 / 사용시점(time-of-check / time-of-use) 공격이라 하고 줄여서 ```TOCTOU``` 공격이라고 합니다.

```clone``` 메서드는 매개변수가 final 클래스가 아니어서 상속이 가능한 타입이라면 사용해선 안됩니다.
위의 예제를 예를 들면 생성자에서 매개변수로 넘어온 Date 객체를 ```clone``` 메서드를 통해 복사를 할 수도 있으나
Date 클래스를 상속한 클래스가 재정의하여 하위 클래스의 인스턴스를 반환할 수도 있기 때문입니다.

한편 생성자를 수정하여 매개변수에 대한 공격은 막아냈으나, 아직도 접근자(getter) 메서드가 내부의 가변 정보 Date를 반환하기 때문에
직접적인 공격이 가능합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    Date start = new Date();
    Date end = new Date();
    Period period = new Period(start, end);

    // deprecated method
    // period의 내부를 또 수정했다.
    period.end().setMonth(3);
}  
</code></pre>

이번 공격을 막으려면 단순히 접근자(getter) 메서드가 가변 필드의 방어적 복사본으로 반환하면 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end = new Date(end.getTime());

        if(start.compareTo(end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
    }
    public Date start() { 
        return new Date(start.getTime());
    }
    public Date end() { 
        return new Date(end.getTime());
    }
    // ... 생략
}
</code></pre>

생성자에서와 다르게 접근자 메서드에서는 ```clone``` 메서드를 사용해도 됩니다. Date 객체가 반환될 것임이 확실하기 때문입니다.

<br/>

# 정리해보면

클래스가 클라이언트로부터 받거나 클라이언트로 반환하는 구성요소가 가변이라면 그 요소는 반드시 방어적으로 복사해야 합니다.
하지만 항상 사용 가능한 상황이 아닐 수 있습니다. 방어적 복사는 성능 저하가 있을 수 있고 같은 패키지에 속하는 등의 이유로
클라이언트가 객체의 상태를 변경하지 않는 것이 확실하다면 방어적 복사본을 만들지 않아도 됩니다.

다른 패키지에서 사용한다고 해서 방어적 복사를 항상해야 하는 것도 아닙니다. 메서드 또는 생성자의 매개변수로 넘기는 행위
자체의 의미가 그 객체의 제어권을 넘긴다는 의미이기도 합니다. 물론 메서드를 호출한 클라이언트는 해당 객체를 더 이상 직접
수정해서는 안되겠지요. 호출하는 쪽에서 내부 요소를 수정하지 않는다는 보장이 있다면 방어적 복사를 생략할 수도 있습니다.