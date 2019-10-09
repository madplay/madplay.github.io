---
layout:   post
title:    자바 제네릭(Java Generic)
author:   Kimtaeng
tags: 	  java generic generic-class generic-interface generic-method
description: 자바 제네릭과 제네릭 클래스, 제네릭 인터페이스 그리고 제네릭 메서드에 대해서 알아봅니다.
category: Java
comments: true
---

# 제네릭
자바에서 제네릭(Generic)은 `Java 5`에 추가된 스펙입니다. 다양한 타입을 다룰 수 있는 메서드 또는 컬렉션 클래스를
컴파일 타임에 타입 체크(Type Check)할 수가 있어 특정 타입에 얽매이지 않고 개발을 할 수 있도록 도움을 줍니다.
쉽게 말하면 특정 클래스 내부에서 사용할 타입을 인스턴스를 생성할 시점에 확정 짓는 것이라고 말할 수 있겠네요. 
 
여러 방면으로 많은 도움을 주지만 개인적으로는 자바를 공부할 때 어렵다는 느낌을 주는... 그 중에서도 손에 꼽는 내용인 것 같습니다.
그래서 이번 글에서는 자바의 제네릭과 제네릭 클래스, 제네릭 메서드 등에서 사용하는 방법 그리고 장점에 대해서 정리합니다.

<br/>

# 제네릭 클래스
제네릭 클래스를 선언하는 방법은 기존의 클래스나 인터페이스를 선언하는 방법과 매우 유사합니다.
다른 점이라면 `타입 매개변수 T`를 선언한다는 것인데요. 코드로 확인해보면 아래와 같습니다.

```java
class MadPlay<T> {
    private T val; // 멤버 변수 val의 타입은 T 이다.

    public T getVal() {
        // T 타입의 값 val을 반환한다.
        return val;
    }

    public void setVal(T val) {
        // T 타입의 값을 멤버 변수 val에 대입한다.
        this.val = val;
    }
}
```

생각보다 간단합니다. 이어서 제네릭 클래스의 레퍼런스 변수를 선언할 때는 아래와 같이 타입 매개변수에
구체적인 타입을 명시하면 됩니다.

```java
public void someMethod() {
    MadPlay<String> stringObject;
    MadPlay<Integer> integerObject;
}
```

이제 **구체화(Specialization)**를 해야합니다. 이는 제네릭 타입을 가진 제네릭 클래스에 구체적인 타입을 대입하여
구체적인 행위를 할 수 있는 객체를 생성하는 과정을 말합니다. 그렇다면, 제네릭 클래스를 이용하여 객체를 생성해봅시다.

```java
public void someMethod() {
    MadPlay<String> stringObject = new MadPlay<>();
    stringObject.setVal("Hello, MadPlay!");

    // Hello, MadPlay! 출력
    System.out.println(stringObject.getVal());

    MadPlay<Integer> integerObject = new MadPlay<>();
    integerObject.setVal(29);
    
    // 29 출력
    System.out.println(integerObject.getVal());
}
```

위 코드에서 String 타입으로 구체화된 객체 stringObject의 모습을 그림으로 보면 아래와 같습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-12-13-java-generic-1.png"
width="600" alt="generic class with string"/>

<br/>

# 제네릭 인터페이스
인터페이스에도 제네릭을 적용할 수 있습니다. 제네릭 인터페이스를 선언하고 이를 구현하는 제네릭 클래스는
아래와 같이 작성할 수 있습니다.

```java
interface MadLife<T> {
    void addElement(T t, int index);
    T getElement(int index);
}

class MadPlay<T> implements MadLife<T> {
    private T[] array;

    public MadPlay() {
        array = (T[]) new Object[10];
    }

    @Override public void addElement(T element, int index) {
        array[index] = element;
    }

    @Override public T getElement(int index) {
        return array[index];
    }
}

public class GenericTest {
    public static void main(String[] args) {
        MadPlay<String> strObject = new MadPlay<>();
        strObject.addElement("Hello", 0);
        strObject.getElement(0);
        
        // 컴파일 시점 오류! String으로 이미 구체화된 상태이므로
        strObject.addElement(1, 1);
    }
}
```

참고로 우리가 `String` 정렬을 할 때 사용하는 `compareTo`와 같은 메서드는 `Comparable` 인터페이스의 추상 메서드인데요.
이 Comparable 인터페이스의 코드를 보면 아래와 같이 제네릭으로 구현되어 있습니다. 따라서 이를 `implements` 하는 타입은
값 비교를 통한 정렬을 간편하게 사용할 수 있지요.

```java
public interface Comparable<T> {
    // ... 생략
    public int compareTo(T o);
}
```

<br/>

# 제네릭 메서드
메서드 단위에만 제네릭을 적용할 수 있습니다.

```java
class MadPlay {
    public static <T> void arrayToStack(T[] arr, Stack<T> stack) {
        // 만일 위 2개의 타입이 다르면 컴파일 오류
        for (T element : arr) {
            stack.push(element);
        }
        // 사실 아래 방법을ㅎ
        stack.addAll(Arrays.asList(arr));
    }
}

public class GenericTest {
    public static void main(String[] args) {
        String[] array = new String[10];
        Stack<String> stack = new Stack<>();

        // 타입 매개변수 T를 String 으로 유추
        MadPlay.arrayToStack(array, stack);
    }
}
```

<br/>

# 이어서

이번 포스팅에서는 자바에서 제공되는 제네릭은 무엇인지 그리고 제네릭을 이용한 제네릭 클래스, 제네릭 인터페이스
그리고 제네릭 메서드를 만드는 방법에 대해서 알아보았습니다.

이어지는 포스팅에서 제네릭을 사용하면 좋은 점과 사용할 때 주의할 점에 대해서 알아보겠습니다.
- <a href="/post/java-generic-advanced" target="_blank">링크: 자바에서 제네릭의 장점과 사용할 때 주의할 점</a> 