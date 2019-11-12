---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 23. 태그 달린 클래스보다는 클래스 계층구조를 활용하라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 23. Prefer class hierarchies to tagged classes" 
category: Java
comments: true
---

# 태그 달린 클래스
두 가지 이상의 기능을 갖고 있으며, 그 중에서 어떠한 기능을 갖고 있는지 나타내는 태그(tag) 필드가 있는 클래스를 태그 달린 클래스라고 말한다.
이 클래스는 아래와 같은 형태를 가지고 있다.

```java
class Figure {
    enum Shape { RECTANGLE, CIRCLE };

    final Shape shape; // 태그 필드 - 현재 모양을 나타낸다.

    // 다음 필드들은 모양이 사각형(RECTANGLE)일 때만 쓰인다.
    double length;
    double width;

    // 다음 필드느 모양이 원(CIRCLE)일 때만 쓰인다.
    double radius;

    // 원용 생성자
    Figure(double radius) {
        shape = Shape.CIRCLE;
        this.radius = radius;
    }

    // 사각형용 생성자
    Figure(double length, double width) {
        shape = Shape.RECTANGLE;
        this.length = length;
        this.width = width;
    }

    double area() {
        switch(shape) {
            case RECTANGLE:
                return length * width;
            case CIRCLE:
                return Math.PI * (radius * radius);
            default:
                throw new AssertionError(shape);
        }
    }
}
```

이와 같은 태그 달린 클래스는 안 좋다. 그 이유는 많다.

- 열거(enum) 타입 선언, 태그 필드, switch 문장 등 쓸데없는 코드가 많다.
- 여러 구현이 하나의 클래스에 혼합돼 있어서 가독성도 좋지 않다.
- 다른 의미를 위한 코드가 함께 있으니 상대적으로 메모리도 더 차지한다.
- 필드를 final로 선언하려면 해당 의미에 사용되지 않는 필드까지 생성자에서 초기화해야 한다.
  - 쓰지 않는 필드를 초기화하는 코드가 생긴다.
- 또 다른 의미를 추가하려면 코드를 수정해야 한다. 특히 switch 문장에도
- 인스턴스의 타입만으로는 현재 나타내는 의미를 파악하기 어렵다.

<br><br>

# 개선하기
태그 달린 클래스 형태를 클래스 계층 구조로 바꿔보자.

```java
abstract class Figure {
    abstract double area();
}

class Circle extends Figure {
    final double radius;
    Circle(double radius) { this.radius = radius; }
    @Override double area() { return Math.PI * (radius * radius); }
}

class Rectangle extends Figure {
    final double length;
    final double width;
    Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    }
    @Override double area() { return length * width; }
}
```

**간결하고 명확해졌으며, 쓸데없는 코드들이 모두 사라졌다.**
각 의미를 독립된 클래스에 담았기 때문에 관련 없던 데이터 필드는 모두 제거 되었다.
게다가 실수로 빼먹은 switch 구문의 case 문장 때문에 런타임 오류가 발생할 이유도 없다.

타입 사이의 자연스러운 계층 관계를 반영할 수 있어서 유연성은 물론 컴파일 타임에서의 타입 검사 능력도 높여준다.
또한 클래스 계층 구조라면, 아래와 같이 정사각형(Square)가 추가될 때도 간단하게 반영할 수 있다.

```java
class Square extends Rectangle {
    Square(double side) {
        super(side, side);
    }
}
```