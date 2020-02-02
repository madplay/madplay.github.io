---
layout:   post
title:    자바의 추상 클래스와 추상 메서드
author:   Kimtaeng
tags: 	  java abstract
description: "자바에서 추상 클래스와 추상 메서드를 사용하는 이유는 무엇일까?"
category: Java
comments: true
---

# 추상 클래스는 무엇일까?

우선 추상 클래스는 추상 메서드를 가지고 있는 클래스를 말한다. 그렇다면 추상 메서드는 무엇일까?
추상 메서드는 실질적인 구현없이 몸체, 즉 선언만 있는 메서드를 말한다.

조금 다르게 접근해보자. '동물' 일부를 코드로 정의한다고 가정해보자. 그리고 동물의 종류에는 '강아지'와 '고양이'를 선택했다.
이들의 공통점은 무엇일까? 여러 가지가 있겠지만 소리를 내거나, 사료를 먹는 등이 있다. 그럼 코드로 표현해보자.

```java
class Dog {
    소리내기() {
        System.out.println("멍멍!");
    }
}

class Cat {
    소리내기() {
        System.out.println("야옹!");
    }
}
```

매우 간단하다. 그런데 이 코드를 혼자가 아니라 친구A와 같이 작성하는 경우는 어떨까? 각각 동물 한 마리씩 맡아서 말이다.
그러면 친구 A가 고양이 클래스를 작성하기로 했는데, 내 예상과 다르게 사료를 먹는 메서드의 이름을 다르게 했다.

```java
class Cat {
    야옹() {
        System.out.println("야옹!");
    }
}
```

사실 규모가 작은 프로젝트라면 큰 문제는 되지 않는다. 친구가 작성한 코드에 맞게 내 코드를 수정하면 그만이다.
아니면 반대로 친구가 수정해도 되고... 하지만 더 좋은 방법이 있다. 여기에 추상 클래스를 적용해보는 것이다.

<br/>

## 추상 클래스 사용법

친구와 나는 '동물'의 일부인 '강아지'와 '고양이'를 코드로 작성하고 있다. '동물'을 추상 클래스로 정의하고 '공통적인 행위'를
추상 메서드 로 정의해보자. 아래와 같은 코드가 될 것이다.

```java
abstract class Animal {
    abstract void 소리내기();
}
```

먼저 추상 클래스를 정의하고 이에 필수적인 기능들을 추상 메서드로 정의하면 된다.
그렇게 하면 나와 친구A는 단순히 추상 클래스를 상속해서 필요한 기능들을 구현하고 이를 병합하기만 하면 된다.

```java
class Dog extends Animal {
    @Override
    void 소리내기() {
        System.out.println("멍멍!");
    }
}

class Cat extends Animal {
    @Override
    void 소리내기() {
        System.out.println("야옹!");
    }  
}
```

이처럼 추상 클래스를 정의하면 어떤 기능이 필요한지 쉽게 제시할 수 있다. 특히 어떤 기능을 구현할지 감이 오지 않거나
클래스의 구조나 구성을 명확하게 모르는 경우에 사용하면 편리하다.

또한 메서드의 이름과 같은 규칙을 통일할 수 있기 때문에 통일성과 유지보수 효율을 높일 수 있다.

<br/>

## 추상 클래스 특징

추상 클래스는 자기 자신의 객체를 생성할 수 없다. 객체를 생성하려고 하면 오류가 발생한다.

```java
abstract class MadClass {
    abstract void printMyName();
}

class MadPlay {
    public static void main(String[] args) {
        // Cannot instantiate the type MadClass
        MadClass inst = new MadClass();
    }
}
```

추상 클래스라고 반드시 추상 메서드만 가지고 있을 필요는 없다.

```java
abstract class MadClass {
    abstract void printMyName();

    // 일반 메서드
    public void sayHi() {
        System.out.println("Hi~");
    }
}

class MadMan extends MadClass {
    public void sayHello() {
        System.out.println("Hello~");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        MadMan madMan = new MadMan();
        manMan.sayHi();
    }
}
```

MadClass 라는 추상 클래스를 상속한 ManMan 클래스의 인스턴스는 추상 클래스의 일반 메서드를 호출할 수 있다.
물론 추상 클래스의 목적이 상속과 오버라이딩을 하기 위함이기 때문에 오버라이딩해서 사용하는 것이 프로젝트의 규모가 커졌을 때
헷갈리지 않을 것 같다.