---
layout:   post
title:    자바의 인터페이스(Java Interface)
author:   Kimtaeng
tags: 	  java interface
description: 자바에서 인터페이스는 무엇일까? 그리고 자바에서는 어떻게 다중 상속을 구현할 수 있을까?
category: Java
comments: true
---

# 인터페이스는 무엇일까?

인터페이스의 사전적 의미로는 "여러 개의 구성 요소 또는 시스템이 상호작용할 수 있게 하는 조건, 규약" 이다.
자바에서 인터페이스는 다중 상속(Multiple Inheritance)를 구현하게 해주는 기능이다.

사실 인터페이스의 용도는 추상 클래스(abstract class)와 비슷하다. 협업하기에 아주 좋은 기능을 한다.
목적은 아래 링크를 통해 참고하면 좋을 것 같다.

- <a href="/post/abstract-classes-and-methods-in-java" target="_blank">참고 링크 : 추상 클래스와 추상 메서드</a>

물론 인터페이스와 추상 클래스의 차이는 있다. 밑에 이어지는 내용을 통해 확인해보자.

<br/>

# 사용 방법

선언은 ```interface``` 키워드를 앞에 붙이고 뒤에 인터페이스의 이름을 써주면 된다. 클래스의 선언과 비슷하다.

```java
interface MadInterface {
    // ...
}
```

인터페이스는 반드시 추상 메서드와 상수만을 가질 수 있다. 이부분이 추상 클래스와 다른 점이다.
추상 클래스는 추상 메서드 외에 멤버 변수나 일반 메서드를 가질 수 있지만 인터페이스는 그렇지 않다.

```java
interface MadInterface {
    
    // 오류가 발생한다. interface abstract methods cannot have body
    public void someMethod() {

    }
}
```

한편 인터페이스의 모든 멤버 변수는 ```public static final```이며 생략할 수 있다. 모든 메서드는 ```public abstract```이며
역시나 생략할 수 있다. IDE마다 다르겠으나 인텔리제이 기준으로 아래처럼 불필요한 키워드 생략을 권고하고 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-02-what-is-the-purpose-of-interfaces-in-java-1.jpg"
width="500" height="350" alt="interface's method and variable"/>

수정하면 아래와 같다. 그런데 주의할 점은 생략한다고 해서 ```default``` 접근 지정자가 되는 것은 아니다.
**인터페이스 외부에서 제어할 수 있도록 public 접근 지정자만 허용된다.**

```java
interface MadInterface {
    String SAY_HI = "Hi!";
    void someThing();
}
```

<br/>

# 인터페이스의 특징

클래스는 오직 하나의 수퍼 클래스만 가질 수 있었으나 인터페이스는 여러 개를 가질 수 있다. 그렇기 때문에 다중 상속의 구현을 도와준다.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface {
    void yourMethod();
}

class MadPlay implements MyInterface, YourInterface {

    @Override
    public void myMethod() {
        // do something
    }

    @Override
    public void yourMethod() {
        // do something
    }
}
```

인터페이스와 클래스 사이에서는 상속(inheritance)이라는 표현보다 구현(implementation)이라는 표현을 사용한다.
따라서 사용할 때도 클래스 끼리의 확장(extends)가 아닌 구현(implements)이라는 키워드를 사용한다.

인터페이스는 생성자를 가지지 않으며, **인터페이스가 가지는 메서드는 모두 public 접근 지정자이다.**
인터페이스를 구현하는 클래스의 경우 인터페이스의 모든 메서드를 구현해야 한다. 그렇지 않을 경우에는 추상 클래스로 선언되어야 한다.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface {
    void yourMethod();

}

abstract class MadPlay implements MyInterface, YourInterface {
    // 인터페이스의 메서드를 꼭 구현하지 않아도 된다.
}
```

또한 인터페이스는 다른 인터페이스를 확장(extends)할 수 있다.

```java
interface MyInterface {
    void myMethod();
}

interface YourInterface extends MyInterface {
    void yourMethod();
}

class MadPlay implements YourInterface {

    @Override
    public void myMethod() {

    }

    @Override
    public void yourMethod() {

    }
}
```

하지만 인터페이스는 메서드 구현을 하지 못하기 때문에 직접적으로 오버라이딩할 수 없다. 위의 예제를 예로 든다면,
```YourInterface```를 구현한 ```MadPlay``` 클래스는 구현한 인터페이스가 확장한 인터페이스의 모든 메서드를 재정의해야 한다.
그렇지 않으면 역시나 추상 클래스가 되어야 한다.