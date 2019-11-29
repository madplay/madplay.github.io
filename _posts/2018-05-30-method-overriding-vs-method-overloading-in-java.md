---
layout:   post
title:    자바 오버라이딩과 오버로딩
author:   Kimtaeng
tags: 	  java overriding overloading
description: 자바에서 메서드 오버라이딩(Overriding)과 메서드 오버로딩(Overloading)은 어떤 차이가 있을까?
category: Java
comments: true
---

# 메서드 오버라이딩이란?
**메서드 재정의**라고 부른다. 수퍼 클래스와 서브 클래스, 즉 상속 관계에서 사용할 수 있다. 서브 클래스에서 수퍼 클래스에 선언된 메서드를 중복 작성하여
수퍼 클래스에 작성된 메서드를 무시하고 서브 클래스에서 중복 작성한 메서드를 실행시키는 것을 말한다.

자바에서는 동적 바인딩을 통해 오버라이딩된 메서드가 항상 실행되도록 보장한다.
> **동적 바인딩(Dynamic Binding)**이란 실행할 메서드를 컴파일 시간에 결정하지 않고 실행 시간에 결정하는 것을 말한다.

한편 오버라이딩을 할 때는 접근 지정자를 수퍼 클래스보다 좁은 범위로 변경할 수 없으며 인스턴스를 static 또는 static을 인스턴스로 변경할 수 없다.

<br/><br/>

# 메서드 오버라이딩 예제
코드를 통해 오버라이딩이 어떤 것인지 알아보자. 예제에서 사용한 `@Override` 어노테이션은 실수를 방지하기 위해서 관례적으로 적어주면 좋다.

```java
class Uint {
    public void sayName() {
        System.out.println("Unit!");
    }
}

class Zergling extends Unit {
    @Override
    public void sayName() {
        System.out.println("Zergling!");
    }
}

class Marine extends Unit {
    @Override
    public void sayName() {
        System.out.println("Marine!");
    }
}

class Zealot extends Unit {
    @Override
    public void sayName() {
        System.out.println("Zealot!");
    }
}

public class MadPlay {
    static void something(Unit unit) {
        unit.sayName();
    }

    public static void main(String[] args) {
        something(new Unit());
        something(new Zergling());
        something(new Marine());
        something(new Zealot());
    }
}
```

```bash
# 출력 결과
Unit!
Zergling!
Marine!
Zealot!
```

Unit 클래스에는 sayName 이라는 메서드가 있으며, 이 클래스를 상속하는 Zergling, Marine, Zealot 이라는 이름의 서브 클래스가 존재한다. 
그리고 각 서브 클래스에서 sayName 메서드를 서로 다르게 오버라이딩했다.

이처럼 오버라이딩은 상속을 통해 '하나의 인터페이스에 서로 다른 내용 구현' 이라는 **객체 지향의 다형성을 실현**하는 도구가 된다.

<br/><br/>

# 메서드 오버라이딩과 super 키워드
메서드가 오버라이딩되어 있는 경우 동적 바인딩(Dynamic Binding)에 의해 항상 서브 클래스의 오버라이딩된 메서드를 호출한다고 했으나,
`super` 키워드를 사용하면 정적 바인딩(Static Binding)을 통해 수퍼 클래스의 멤버에 접근할 수 있다.

상속에서 `super` 키워드를 사용할 때와 다르게 반드시 메서드 첫 라인에 위치하지 않아도 된다.

- <a href="https://madplay.github.io/post/inheritance-in-java#서브-클래스의-수퍼-클래스-생성자-호출" target="_blank">
참고 링크: 자바 상속(Java Inheritance)</a>

```java
class Unit {
    String weapon;
    public void sayName() {
        System.out.println("Unit!");
    }
}

class Zergling extends Unit {
    @Override
    public void sayName() {
        super.sayName(); // 정적 바인딩
        System.out.println("Zergling!");
    }
}

public class MadPlay {
    static void something(Unit unit) {
        unit.move();
    }

    public static void main(String[] args) {
        something(new Zergling());
    }
}
```

```bash
# 출력 결과
Unit!
Zergling!
```

<br/><br/>

# 메서드 오버로딩이란?
메서드 **중복 정의**라고 부른다. 한 개의 클래스 또는 상속 관계에 있는 클래스에 서로 매개 변수의 타입이나 개수가 다른 여러 개의 메서드가 같은 이름으로
작성되는 것을 말한다. 동적 바인딩인 오버라이딩과 다르게 **오버로딩은 정적 바인딩**이다.
> **정적 바인딩(Static Binding)**이란 실행할 메서드를 컴파일 시간에 결정하는 것을 말한다.

오버로딩은 메서드의 인자의 개수 또는 자료형이 달라야 한다. **리턴 타입이 다르고 매개 변수가 같은 경우는 성립되지 않는다.**

<br/><br/>

# 메서드 오버로딩 예제
코드를 통해 오버로딩을 확인해보자.

```java
public class MadPlay {
    public void show(String name, String nickName) {
        System.out.println("name: " + name);
        System.out.println("nickName: " + nickName);
    }

    public void show(String name) {
        System.out.println("name: " + name);
    }

    public static void main(String[] args) {
        MadPlay instance = new MadPlay();
        instance.show("kimtaeng", "madplay");
        instance.show("kimtaeng");
    }
}
```

```bash
name: kimtaeng
nickName: madplay
name: kimtaeng
```

위 코드를 보면 `MadPlay` 클래스에는 이름과 이메일을 인자로 받는 메서드와 이름만을 인자로 받는 메서드가 오버로딩되어 있다.
그렇기 때문에 인자 값을 어떻게 주느냐에 따라서 컴파일러는 어떤 메서드를 호출할지 결정하게 된다.

<br/><br/>

# 정리하면
**오버라이딩**을 할 때는 수퍼 클래스에서 선언한 접근 지정자보다 더 좁은 범위로 지정할 수 없다. 메서드에 선언된 static을 제거하거나 오버라이딩하는
과정에서 static을 선언할 수 없다. 그러니까 인스턴스를 static로, static을 인스턴스 형태로 변경할 수 없다.

한편 매개 변수는 같고 리턴 타입이 다른 경우는 **오버로딩**이 성립되지 않는다.

| 구분 | 메서드 오버라이딩 | 메서드 오버로딩 |
|:---:|:---:|:---:|
| 선&nbsp;&nbsp;언 | 서브 클래스에서 수퍼 클래스에 있는<br> 메서드와 동일한 이름으로 메서드를 재작성 | 한 클래스나 상속 관계에서 동일한 이름의 메서드를 중복 작성 |
| 관&nbsp;&nbsp;계 | 상속 관계 | 동일한 클래스 내 혹은 상속 관계 |
| 목&nbsp;&nbsp;적 | 수퍼 클래스에 구현된 메서드를 무시하고<br> 서브 클래스에서 새로운 기능의 메서드를 재정의하고자 함 | 이름이 같은 여러 개의 메서드를 중복 선언하여 사용의 편리성 향상 |
| 조&nbsp;&nbsp;건 | 메서드의 이름 및 리턴 타입, 인자의 타입 및 개수 등이 모두 동일해야 함 | 메서드 이름은 반드시 동일하며 메서드의 인자 개수나 타입이 달라야 함 |
| 바&nbsp;인&nbsp;딩 | 실행 시간에 오버라이딩된 메서드를 찾아 호출하는 동적 바인딩 | 컴파일 시간에 중복된 메서드 중 호출되는 메서드를 결정하는 정적 바인딩 |