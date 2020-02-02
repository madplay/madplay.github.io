---
layout:   post
title:    자바의 final 키워드
author:   Kimtaeng
tags: 	  java final
description: "자바에서 사용하는 final 키워드는 무엇일까? 어떻게 활용할 수 있는지 알아보자"
category: Java
comments: true
---

# final

```final``` 키워드는 클래스, 메서드, 변수에 사용할 수 있는데 의미는 단어 그대로 마지막이라는 뜻이다.
이 키워드를 사용하게 되면 어떻게 동작하는지 알아보자.

<br/>

# final과 클래스

```final``` 키워드를 클래스에 사용하게 되면 다른 클래스가 상속할 수 없게 된다. 이러한 점은 보안적인 측면을 고려한 부분이라고
생각할 수 있다. 대표적으로 ```java.lang.String``` 클래스도 ```final``` 이다.

```java
final class MadPlay {
    // ...
}

class MadClass extends MadPlay { // 컴파일 오류
    // ...
}
```
상속을 할 수 없으니 재정의(Override)는 물론 불가능하다. 시도조차 할 수 없다.
하지만 반대로 ```final``` 클래스는 다른 클래스를 상속할 수 있다.

```java
class MadMan {
    // ...
}

final class MadPlay extends classMan {
    // ...
}
```

<br/>

# final과 메서드

메서드에 ```final``` 키워드를 붙이게 되면 재정의(Overriding)을 할 수 없다.

```java
class MadClass {
    public final void sayHi() {
        // ...
    }
}

public class MadPlay extends MadClass {
    // 컴파일 오류 발생
    // cannot override... overridden method is final    
    public void sayHi() {
        // ...
    }
}
```

<br/>

# final과 변수

```final``` 키워드가 적용된 변수는 상수의 역할을 하게 된다. 값을 변경하려고 하면 컴파일 오류가 발생한다.
즉 초기화는 1회만 가능합니다. 따라서 보통 final 변수는 선언과 동시에 초기화한다.

```java
public class MadPlay {
    final int MAX_ARRAY_SIZE = 5;

    public void someMethod() {
        int[] array = new int[MAX_ARRAY_SIZE];

        // 컴파일 오류
        MAX_ARRAY_SIZE = 10;
    }
}
```

하지만 ```final``` 멤버 변수가 무조건 선언과 동시에 초기화해야 하는 것은 아니다. 아래 코드를 보자.

```java
public class Person {
    private final String name;

    // 단, 기본 생성자를 만드는 경우 아래처럼 초기화가 필요하다.
    public Person() {
        this.name = "kimtaeng";
    }

    public Person(String name) {
        this.name = name;
    }
}
```

생성자를 통해서 ```final```로 선언된 멤버 변수를 초기화 했다. 이처럼 반드시 선언과 동시에 초기화가 필요한 것은 아니다.

<br/>

# 그런데 왜 대부분의 상수는

대부분의 ```final``` 키워드를 이용한 상수 필드를 사용할 때는 아래와 같이 사용한다. 프로젝트 코드 내에서 전체적으로
공유하여 사용할 수 있게 하기 위함이다.

```java
class GradeHelper {
    public static final String MAX_GRADE = "A+";
}
```

그런데 왜 관례적으로 ```public static``` 일까? 우선, ```public```은 전체 공개용을 뜻한다. 다른 클래스, 심지어 다른 패키지의
클래스에서도 접근할 수 있음을 뜻한다. 

```static```은 메모리 할당을 컴파일 시간에 한다. 그러니까 인스턴스가 생성될 때마다 새로운 메모리를 할당하는 것이 아니라
클레스 레벨에서 단 한번만 할당함을 뜻한다. 그렇기 때문에 의미와 용도가 고정적인 값에 사용하면 알맞다.
예를 들어, 최고 학점이 A+인 것처럼 말이다. S 학점이 있는 곳도 있을 수 있으려나...