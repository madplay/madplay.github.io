---
layout:   post
title:    자바 상속(Java Inheritance)
author:   Kimtaeng
tags: 	  java inheritance
description: "자바의 상속에 대한 개념과 사용 예제를 살펴보자"
category: Java
comments: true
---

# 상속이란

- 객체지향언어의 특성이자 소프트웨어의 재사용을 가능하게 하는 기술이다. 
- 실생활의 예를 들면 부모 유전자를 자식이 물려받는 유전적인 상속과 유사하다. 
- ```C++``` 언어에서의 상속의 개념과 유사하다.
  - 차이점이라면 자바에서의 상속은 다중 상속(multiple inheritance)이 불가능하다.
- 자바에서는 두 클래스(class) 사이에서의 부모-자식의 상속 관계를 선언한다.
  - 이때, 부모 클래스를 수퍼 클래스(super class), 자식 클래스를 서브 클래스(sub class)라고 한다.
  - 서브 클래스는 자신의 멤버뿐만 아니라 수퍼 클래스의 멤버를 포함하게 된다.

> 기본 클래스? 부모 클래스?<br/>
상속 관계에 있는 두 클래스를 부르는 이름은 프로그래밍 언어마다 조금씩 다르다.
C++에서는 상속을 해주는 클래스를 기본 클래스(base class), 이와 반대로 상속을 받는 클래스를 파생 클래스(derived class)라고
부른다. 또한 C#에서는 각각 부모 클래스(parent class), 자식 클래스(child class)라고 부른다.

<br/>

# 상속의 장점(advantange)

아래의 예제 코드를 통해 상속이 주는 장점을 살펴보자.

```java
class Student {
    void eat() {} // 밥먹기
    void sleep() {} // 잠자기
    void study() {} // 공부하기
}

class StudentDeveloper {
    void eat() {} // 밥먹기
    void sleep() {} // 잠자기
    void study() {} // 공부하기
    void develop() {} // 개발하기
}

class Professor {
    void eat() {} // 밥먹기
    void sleep() {} // 잠자기
    void research() {} // 연구하기
}
```

- 학생(Student)과  학생개발자(StudentDeveloper) 그리고 교수(Professor)가 있다.
- 이들은 공통적으로 밥먹기(eat)와 잠자기(sleep) 라는 공통적인 행위(코드)가 있다.
- 또한 학생과 학생개발자는 공통적으로 공부(study)라는 공통적인 행위(코드)가 존재한다.
- 만일, 밥먹기와 잠자기의 방식이 다르지 않고 동일한 역할을 한다고 가정해보자.
  하나의 행위를 수정하기 위해서 위의 3개 클래스 모두를 수정해야 하는 번거로움이 생긴다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-23-inheritance-in-java-1.jpg"
width="450" height="350" alt="class structure"/>

- 상속을 이용하면 아래와 같이 간결하게 수정할 수 있다.

```java
class Person {
    void eat() {} // 밥먹기
    void sleep() {} // 잠자기
}

class Student extends Person {
    void study() {} // 공부하기
}

class StudentDeveloper extends Student {
    void develop() {} // 개발하기
}
```

- 공통적인 특성을 묶어서 사람(Person) 클래스로 정의했다.
- 그리고 공통 특성이 필요한 클래스들이 이를 상속하여 사용하도록 한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-23-inheritance-in-java-2.jpg"
width="350" height="450" alt="class structure with inheritance"/>

- 이처럼 상속은 클래스 사이의 멤버를 중복 선언하지 않아도 되는 장점이 있다.
- 또한 클래스를 계층적으로 분류할 수 있어 효율적으로 관리할 수 있게 해준다.
- 그러므로 클래스의 재사용과 확장을 통한 소프트웨어의 생산성을 향상시킬 수 있다.

<br/>

# 상속 사용 방법

## 선언 방법

- 자바에서는 ```extends``` 키워드를 사용하여 상속을 선언한다.
- ```class 서브 클래스 extends 수퍼 클래스``` 처럼 작성하면 된다.

## 사용 방법

```java
class Point {
    private int xPos, yPos;

    void setPoint(int xPos, int yPos) {
        this.xPos = x;
        this.yPos = y;
    }

    void showPoint() {
        System.out.println("(" + xPos + "," + yPos + ")");
    }
}

class ColorPoint extends Point {
    private String color;

    void setColor(String color) {
        this.color = color;
    }

    void showColorPoint() {
        showPoint(); // Point 클래스의 showPoint 메서드 호출
        System.out.println("Color : " + color);
    }
}

public class ExampleTest {
    public static void main(String[] args) {
        Point p = new Point();
        p.setPoint(3, 4);
        p.shoWPoint():

        ColorPoint cp = new ColorPoint();
        cp.setPoint(2, 3);
        cp.setColor("Yellow");
        cp.showColorPoint();
    }
}
```

- 서브 클래스는 상속을 통하여 수퍼 클래스의 멤버를 자신의 멤버로 확장한다.
  - 그렇기 때문에 수퍼 클래스의 private 멤버 외의 모든 멤버에 접근할 수 있다.
- 즉, ColorPoint는 Point 클래스를 상속함으로써 자신의 멤버 변수인 문자열 color뿐만 아니라
  Point 클래스의 정수형 xPos, yPox도 갖게 된다.
- 또한 서브 클래스인 ColorPoint의 멤버 메서드 showColorPoint에서는 수퍼 클래스의 showPoint도 호출할 수 있다.
- 하지만 xPos와 yPos는 Point의 private 멤버이므로 Color 클래스의 멤버들이 접근할 수 없다.
  - 따라서 setPoint와 showPoint 메서드를 통해서 간접적으로 접근한다.

## 상속의 종류

- 자바에서는 C++처럼 public 상속, protected 상속 등을 명시하지 않는다.
- 위에서 언급한 것처럼 ```서브 클래스 extends 수퍼 클래스```로만 선언하며 수퍼 클래스 멤버들의 접근 지정자에 따라서
  각각 다르게 서브 클래스에 상속된다.

```java
class Point {
    private int privateVal;
    protected int protectedVal;
    public int publicVal;
    int defaultVal;
}

// 같은 패키지에 있다.
class ColorPoint extends Point {
    void someMethod() {
        privateVal = 1; // Error!
        protectedVal = 2;
        publicVal = 3;
        defaultVal = 4;
    }
}
```

수퍼 클래스 멤버에 접근하는 클래스 종류 | private | default | protected | public
|:--:|:--:|:--:|:--:|:--:
같은 패키지의 클래스 | X | O | O | O
다른 패키지의 클래스 | X | X | X | O
같은 패키지의 서브 클래스 | X | O | O | O
다른 패키지의 서브 클래스 | X | X | O | O

<br/>

# 상속과 생성자

## 수퍼 클래스와 서브 클래스의 생성자

- 수퍼 클래스와 서브 클래스 모두 생성자를 가지고 있다.
- 서브 클래스 객체가 생성될 때, 서브 클래스의 생성자와 수퍼 클래스의 생성자가 모두 실행된다.
- 생성자의 목적은 객체 초기화에 있기 때문에, 서브 클래스의 생성자는 서브 클래스의 멤버나 필요한 초기화를 수행한다.
- 수퍼 클래스의 생성자는 수퍼 클래스의 멤버나 필요한 초기화를 각각 수행한다.
- 수퍼 클래스의 생성자와 서브 클래스의 생성자 중에서 수퍼 클래스의 생성자가 먼저 실행된다.

```java
class Point {
    Point() {
        // 먼저 실행된다.
        System.out.println("Point 생성자 실행");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        // 이후에 실행된다.
        System.out.println("ColorPoint 생성자 실행");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        ColorPoint cp = new ColorPoint();
    }
}
```

- 컴파일러는 ```new``` 문장이 실행되면 ColorPoint 생성자를 호출한다.
- 그러나 ColorPoint는 자신의 코드를 실행하기 전에 먼저 수퍼 클래스의 생성자를 호출한다.
- 서브 클래스의 생성자가 먼저 호출되지만, 결국 수퍼 클래스의 생성자가 먼저 실행된다.
- 어떤 서브 클래스든지 생성자에 대해 컴파일러는 수퍼 클래스의 생성자를 호출한 뒤 자신의 코드를 실행하도록 컴파일 한다.
  - 이는 수퍼 클래스가 먼저 초기화된 후 이를 상속받는 서브 클래스가 초기화되어야 하기 때문이다.

## 서브 클래스의 수퍼 클래스 생성자 호출

- 수퍼 클래스의 생성자가 여러 개 있을 수 잇다. 물론 서브 클래스도 마찬가지다.
- 수퍼 클래스의 생성자를 명시적으로 지정하지 않으면 컴파일러는 묵시적으로 수퍼 클래스의 기본 생성자를 호출되도록 컴파일한다.

```java
class Point {
    Point() {
        // 가장 첫 번째로 실행된다.
        System.out.println("Point 기본 생성자");
    }

    Point(int x) {
        // 실행되지 않는다.
        System.out.println("Point 매개변수 생성자");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        // 두 번째로 실행된다.
        System.out.println("ColorPoint 기본 생성자");
    }
}

class ExampleTest {
    public static void main(String[] args) {
        ColorPoint cp = new ColorPoint();
    }
}
```

- 만일 수퍼 클래스의 기본 생성자가 선언되어 있지 않다면 오류가 발생한다.
- 서브 클래스의 생성자로 매개 변수가 있는 생성자를 호출하게 되는 경우에도 컴파일러는
  묵시적으로 수퍼 클래스의 기본 생성자를 호출한다.
- 명시적으로 수퍼 클래스의 생성자를 선택하려면 아래와 같이 코드를 작성하면 된다.

```java
class Point {
    Point() {
        System.out.println("Point 기본 생성자");
    }

    Point(int x) {
        System.out.println("Point 매개변수 생성자");
    }
}

class ColorPoint extends Point {
    ColorPoint() {
        System.out.println("ColorPoint 기본 생성자");
    }

    ColorPoint(int x) {
        super(x); // 반드시 메서드 시작 위치에 있어야 한다.
        System.out.println("ColorPoint 매개변수 생성자");
    }
}
```

- ```super``` 키워드를 이용하여 명시적으로 수퍼 클래스의 생성자를 호출하는 코드는 서브 클래스의 생성자 첫 라인에 있어야 한다.
  - 그렇지 않으면 오류가 발생한다. _Constructor call must be the first statement in a constructor_
