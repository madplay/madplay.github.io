---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 24. 멤버 클래스는 되도록 static으로 만들라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 24. Favor static member classes over nonstatic" 
category: Java
date: "2019-11-10 01:20:59"
comments: true
---

# 중첩 클래스란
다른 클래스 안에 정의된 클래스를 **중첩 클래스(nested class)**라고 말한다. 중첩 클래스는 자신을 감싸고 있는 바깥쪽의 클래에서만
사용되어야 하며, 그 외의 쓰임새가 있다면 톱레벨 클래스로 만드는 것이 적절하다.

중첩 클래스의 종류는 정적 멤버 클래스, 비정적 멤버 클래스, 익명 클래스, 지역 클래스가 있다.

<br><br>

# 정적 멤버 클래스와 비정적 멤버 클래스
`정적 멤버 클래스`는 다른 클래스 안에 선언되며 바깥 클래스의 private 멤버에도 접근 가능한 것을 제외하면 일반 클래스와 동일하다.
정적 멤버 클래스와 비정적 멤버 클래스는 코드 상에서 static의 유무만 보일 수 있으나 의미상의 차이는 더 크다.

`비정적 멤버 클래스`의 인스턴스는 바깥 클래스의 인스턴스와 암묵적으로 연결된다.
그래서 비정적 멤버 클래스의 인스턴스 메서드에서 정규화된 this를 통해 바깥 인스턴스의 메서드를 호출한다거나 바깥 인스턴스를 참조할 수 있다.
여기서 정규화된 this란, `클래스명.this` 형태로 바깥 클래스의 이름을 명시하는 용법을 말한다.

예제를 통해 이들의 차이를 살펴보자.

```java
class A {
    int a = 10;

    public void run() {
        System.out.println("Run A");
        B.run();
        C c = new C();
        c.run();
    }

    // 정적 멤버 클래스
    public static class B {
        public static void run() {
            System.out.println("Run B");
        }
    }

    // 비정적 멤버 클래스
    public class C {
        public void run() {
            // 정규화된 this를 통해 참조 가능하다.
            // 정규화된 this란 클래스명.this 형태로 이름을 명시하는 용법을 말한다.
            System.out.println("Run C: " + A.this.a);
        }
    }
}
```

```java
public class Example {
    public static void main(String[] args) {
        // 정적 멤버 클래스는 이렇게 외부에서 접근 가능하다.
        A.B.run();
        A a = new A();
        a.run();
        A.C c = a.new C();
        c.run();
    }
}
```

```bash
// 출력 결과
Run B
Run A
Run B
Run C: 10
Run C: 10
```

**멤버 클래스에서 바깥에 위치한 인스턴스에 접근할 필요가 있다면 무조건 static을 추가하여 정적 멤버 클래스로 만드는 것이 좋다.**
static을 생략하면 바깥 인스턴스로의 숨은 외부 참조를 갖게 되는데, 이 참조를 저장하려면 시간과 공간적인 리소스가 소비된다.
더 심각한 문제로 가비지 컬렉션이 바깥 클래스의 인스턴스를 정리하지 못할 수 있다.

<br><br>

# 익명 클래스와 지역 클래스
`익명 클래스`는 이름이 없으며 바깥 클래스의 멤버가 되지도 않는다. 사용되는 시점에 선언과 동시에 인스턴스가 만들어지며
코드 어디에서든 만들 수 있다. 

상수 변수만 멤버로 가질 수 있으며 instanceof 연산자를 통한 타입 검사가 불가능하다.
또한 여러 개의 인터페이스를 구현할 수 없으며 인터페이스 구현과 동시에 다른 클래스를 상속할 수도 없다.

```java
Thread th = new Thread() { // 익명 클래스
    final int value = 5;
    public void run() {
        System.out.println("Hello Thread: " + value);
    }
};
```

`지역 클래스`는 지역 변수를 선언할 수 있는 곳이면 어디서든 선언할 수 있으며 유효 범위(scope)도 지역변수와 같다.
이름이 있으며 반복해서 사용할 수 있다. 또한 비정적 문맥에서만 바깥 인스턴스를 참조할 수 있으며, 정적 멤버는 가질 수 없고 가독성을 위해 짧게 작성되어야 한다.

```java
class Test {
    public void say() {
        class LocalInnerClass { // 지역 클래스
            public void sayHello() {
                System.out.println("Hello!!!");
            }
        }
        LocalInnerClass lic = new LocalInnerClass();
        lic.sayHello();
    }
}
```