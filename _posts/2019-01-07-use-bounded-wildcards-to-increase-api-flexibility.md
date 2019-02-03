---
layout:   post
title:    "이펙티브 자바 31: 한정적 와일드카드를 사용해 API 유연성을 높이라"
author:   Kimtaeng
tags: 	  java
subtitle: "Effective Java 31: Use bounded wildcards to increase API flexibility" 
category: Java
comments: true
---

<hr/>

> ## 제네릭은 불공변

<a href="https://madplay.github.io/post/prefer-lists-to-arrays" target="_blank" rel="nofollow">
이펙티브 자바 28: 배열보다는 리스트를 사용하라(링크)</a>에서 살펴본 것처럼 매개변수화 타입은 불공변(invariant) 입니다.
예를 들어 Type1과 Type2가 있을 때, ```List<Type1>```은 ```List<Type2>```의 하위 타입 또는 상위 타입이라는 관계가 성립될 수 없습니다.

```List<Object>```에는 어떠한 객체도 넣을 수 있지만 ```List<String>```에는 문자열만 넣는 것을 보면
```List<String>```이 ```List<Object>```의 기능을 제대로 수행하지 못하므로 하위 타입이라고 말할 수 없습니다.

<br/><br/>

> ## 생산자(Producer)와 와일드카드

```Stack 클래스```의 public API로 매개변수의 모든 원소를 넣는 메서드를 추가한다고 가정해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
public void pushAll(Iterable&lt;E> src) {
    for (E e : src) {
        push(e);
    }
}
</code></pre>

컴파일은 정상적으로 수행되지만 아래와 같이 ```Number``` 타입으로 선언된 Stack 객체의 메서드에
```Integer``` 타입의 매개변수를 전달하면 컴파일 오류가 발생합니다. Integer는 Number의 하위 타입이니 정상적으로 잘 동작할 것만 같지만
```incompatible types... Iterable<Integer> cannot be converted to Iterable<Number>```와 같은 오류가 발생합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">import java.util.Arrays;

/**
 * 아이템29 소스코드 참고
 */
class Stack&lt;E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    // ... 중간 소스코드 생략

    // 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
    public void pushAll(Iterable&lt;E> src) {
        for (E e : src) {
            push(e);
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack&lt;Number> numberStack = new Stack&lt;>();
        Iterable&lt;Integer> integers = Arrays.asList(
                Integer.valueOf(1), Integer.valueOf(2));

        // incompatible types...
        numberStack.pushAll(integers);
    }
}
</code></pre>

앞서 언급한 것처럼 제네릭의 매개변수화 타입은 불공변이기 때문에 상위-하위 자료형의 관계가 없습니다.
이러한 문제를 해결하려면 한정적 와일드카드(bounded wildcard) 자료형을 사용하면 됩니다.
```Integer 클래스는 Number를 상속한 구현체``` 이므로 아래와 같이 매개변수 부분에 선언합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// class Integer extends Number ...
public void pushAll(Iterable&lt;? extends E> src) {
    for (E e : src) {
        push(e);
    }
}
</code></pre>

위의 선언을 해석하면 매개변수는 E의 Iterable이 아니라 ```E의 하위 타입의 Iterable``` 이라는 뜻입니다.
**Number 클래스를 상속하는** Integer, Long, Double 등의 타입 요소를 가질 수 있게 됩니다.

직접 정의한 Stack 클래스는 ```push(E)``` 메서드를 통해서만 요소를 추가할 수 있습니다.
따라서 타입 안전성은 확인되지만 elements 배열은 런타임 시에 ```E[]```가 아닌 ```Object[]```가 됩니다.
역시나 이부분도 런타임 시에 제네릭 타입이 소거되기 때문이지요.

<br/><br/>

> ## 소비자(Consumer)와 와일드카드

그럼 이번에는 Stack 인스턴스의 모든 원소를 매개변수로 받은 컬렉션으로 모두 옮기는 ```popAll``` 메서드를 작성해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">import java.util.Arrays;
import java.util.Collection;
import java.util.EmptyStackException;

/**
 * Effect Java 29 소스코드 참고
 */
class Stack&lt;E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public E pop() {
        if (size == 0)
            throw new EmptyStackException();

        // push에서 E 타입만 허용하므로 이 형변환은 안전하다.
        @SuppressWarnings("unchecked") E result =
                (E) elements[--size];

        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }


    // 매개변수의 원소들을 스택에 넣는 메서드를 추가한다.
    public void pushAll(Iterable&lt;? extends E> src) {
        for (E e : src) {
            push(e);
        }
    }

    // 모든 원소를 매개변수로 전달받은 컬렉션에 옮긴다.
    public void popAll(Collection&lt;E> dst) {
        while(!isEmpty()) {
            dst.add(pop());
        }
    }
}

class Item28Test {
    public static void main(String[] args) {
        Stack&lt;Number> numberStack = new Stack&lt;>();
        Collection&lt;Object> objects = Arrays.asList(new Object());
        
        // incompatible types...
        numberStack.popAll(objects);
    }
}
</code></pre>

처음 ```pushAll``` 메서드를 정의했을 때와 유사한 오류가 발생합니다. Collection의 요소 타입과 Stack의 요소 타입이
일치하면 오류는 발생하지 않으나, 위에서 작성한 예제처럼 타입이 일치하지 않으면 컴파일 에러가 발생합니다.

Number 클래스는 최상위 Object 클래스를 상속하지만 역시나 제네릭의 **매개변수화 타입은 불공변**이기 때문에 **상속이란 관계가
무의미**합니다. 동일하게 와일드카드 타입을 사용하면 해결할 수 있는데, ```popAll``` 메서드의 매개변수 타입은
**E의 컬렉션**이 아니라 **E의 상위 타입인 Collection**이라고 선언합니다.


<pre class="line-numbers"><code class="language-java" data-start="1">// E의 상위 타입의 Collection이어야 한다.
public void popAll(Collection&lt;? super E> dst) {
    while(!isEmpty()) {
        dst.add(pop());
    }
}
</code></pre>

모든 타입은 자기 자신의 상위 타입이므로 ```Collection<? super Number>```선언은 ``` Collection<Number>```을 비롯하여
```Collection<Object>``` 타입의 매개변수도 받을 수 있습니다.