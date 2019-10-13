---
layout:   post
title:    자바 업캐스팅 다운캐스팅
author:   Kimtaeng
tags: 	  java upcasting downcasting
description: 자바에서 업캐스팅(Upcasting)과 다운캐스팅(Downcasting)이란 무엇일까?
category: Java
date: "2018-08-04 22:24:10"
comments: true
---

# 캐스팅이란 무엇일까?
**캐스팅(casting)**이란 타입을 변환하는 것을 말하며 **형변환**이라고도 한다.
자바의 상속 관계에 있는 부모와 자식 클래스 간에는 서로 간의 형변환이 가능하다.

이번 글에서는 자식 클래스가 부모 클래스의 타입으로 캐스팅되는 **업캐스팅**과 반대로 부모 클래스가 자식 클래스의 타입으로
캐스팅되는 **다운캐스팅**에 대해서 알아본다. 시작하기에 앞서 부모 클래스인 상속 관계의 상위 클래스를 **수퍼 클래스**, 
그리고 자식 클래스인 하위 클래스를 **서브 클래스**라고 정의한다.

<br>

# 업캐스팅
자바에서 서브 클래스는 수퍼 클래스의 모든 특성을 상속받는다. 그렇기 때문에 서브 클래스는 수퍼 클래스로 취급될 수 있다.
여기서 **업캐스팅(Upcasting)**이란 서브 클래스의 객체가 수퍼 클래스 타입으로 형변환되는 것을 말한다.

즉, 수퍼 클래스 레퍼런스 변수가 서브 클래스로 객체화된 인스턴스를 가리킬 수 있게 된다.
더 쉽게 풀어서 예시를 들어보면 **사람은 생물이다**라고 생각하면 된다. 여기서 사람은 서브 클래스이고 생물은 수퍼 클래스다.

그렇다면 업캐스팅이 정확히 무엇인지 아래의 예제 코드로 살펴보자.

```java
// 캐스팅 후 멤버에 직접 접근 확인을 위해 private 선언과 getter 메서드는 생략합니다.
class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    String dept;

    public Student(String name) {
        super(name);
    }
}

public class CastingTest {
    public static void main(String[] args) {
        // 레퍼런스 student를 이용하면 name, dept에 접근 가능
        Student student = new Student("MadPlay");

        // 레퍼런스 person을 이용하면 Student 객체의 멤버 중
        // 오직 Person 클래스의 멤버만 접근이 가능합니다.
        Person person = student;
        person.name = "Kimtaeng";
        
        // 아래 문장은 컴파일 타임 오류
        person.dept = "Computer Eng";
    }
}
```

위 코드에서 `person` 레퍼런스 변수는 Student 객체를 가리키고 있으며 `Person 타입`이기 때문에 오로지 자신의 클래스에 속한 멤버만
접근이 허용된다. 따라서 dept 멤버는 Student 타입의 멤버이므로 컴파일 시점에 오류가 발생한다.

이와같이 업캐스팅을 하게되면 객체 내에 있는 모든 멤버에 접근할 수 없다. 오직 수퍼 클래스의 멤버에만 접근이 가능하다.
이는 멤버 필드(field)뿐만 아니라 메서드(method)에도 동일하게 적용된다.

위의 코드에서처럼 업캐스팅 시에는 아래와 같이 명시적인 타입 캐스팅 선언을 하지 않아도 된다.
서브 클래스 Student는 Person 타입이기 때문에도 그렇다.

```java
// 업캐스팅 자동 타입 변환
Person person = student;

// 아래와 같이 명시적으로 타입 캐스팅 선언을 하지 않아도 된다.
Person person = (Person) student;
```

그렇다면 업캐스팅은 왜 사용하는 것일까? 업캐스팅을 사용하는 이유는 **다형성(Polymorphism)**과 관련이 있다.
역시 예제를 통해 이해해보자.

```java
// 이해하기 쉽게 한글로^^;
class 해장국 {
    public void 간맞추기() {
        // 뭐든...
    }
}

class 뼈해장국 extends 해장국 {
    @Override public void 간맞추기() {
        // 뼈해장국에는 들깨가루...
    }
}

class 콩나물해장국 extends 해장국 {
    @Override public void 간맞추기() {
        // 콩나물 해장국에는 고춧가루...
    }
}

class 취객 {
    public void 해장국먹기(해장국 어떤해장국) {
        어떤해장국.간맞추기();
    }
}

public class CastingTest {
    public static void main(String[] args) {
        취객 취객1 = new 취객();
        해장국 해장국한그릇 = new 뼈해장국();
        취객1.해장국먹기(해장국한그릇);
    }
}
```

상속 관계와 업캐스팅에 관해서 더 이해하기 쉬운 예시를 들기위해 한글로 클래스명을 쓰긴 했습니다만...

그런데 만약 이 코드에서 업캐스팅을 사용하지 않고 각각의 해장국 객체의 메서드를 호출한다면 어떻게 될까?
아래의 코드처럼 해장국 한그릇이 뼈해장국인지, 콩나물해장국인지 검사하는 조건문이 추가된 이후에야 각 조건에 맞는 객체의 메서드가 호출될 것이다.

```java
public void 해장국먹기(해장국 어떤해장국) {
    if (뼈해장국 타입?) {
        뼈해장국.간맞추기();
    } else if (콩나물해장국 타입?) {
        콩나물해장국.간맞추기();
    }
    // ...해장국 메뉴가 더 추가된다면?
}
```

이처럼 업캐스팅은 다형성과 관련이 있다. 위 예제에서 해장국 먹기 메서드를 호출할 때는 그 해장국이 뼈해장국이든 콩나물해장국이든
그냥 해장국 한그릇만 넘겨주면 취객은 아무런 걱정없이(타입 검사 없이) 먹으면 된다.

<br>

# 다운캐스팅
**다운캐스팅(Downcasting)**은 자신의 고유한 특성을 잃은 서브 클래스의 객체를 다시 복구 시켜주는 것을 말한다.
그러니까 업캐스팅된 것을 다시 원상태로 돌리는 것을 말한다.

```java
class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    String dept;

    public Student(String name) {
        super(name);
    }
}

public class CastingTest {
    public static void main(String[] args) {
        // 업캐스팅 선행
        Person person = new Student("MadPlay");

        // 다운캐스팅
        Student student = (Student) person;

        // Okay!
        student.name = "Kimtaeng";

        // Okay!
        student.dept = "Computer Eng";
    }
}
```

여기서 업캐스팅과 다른 점은 명시적으로 타입을 지정해야 한다는 점이다. 그리고 업캐스팅이 선행이 되어야 한다.
다운캐스팅을 하면서 형변환할 대상을 지정했지만 무분별한 다운캐스팅은 컴파일 시점에는 오류가 발생하지 않아도 런타임 오류를 발생시킬 가능성이 있다.

예를 들어 아래와 같이 진행하는 경우는 실행중 오류가 발생한다.

```java
Student student = (Student) new Person("MadPlay");
```

따라서 형변환할 타입을 명시함으로서 컴파일 오류는 사라졌지만 실제 코드를 수행하면 `ClassCastException`이 발생하게 된다.
한편 이렇게 혼동되는 객체를 구별하기 위해 도움을 주는 연산자가 있다.

<br>

# instanceof
객체의 타입을 구분하기 위해 `instanceof` 연산자를 사용할 수 있다.

예를 들어 업캐스팅을 했을 때 레퍼런스 변수가 가리키는 객체의 타입이 어떤 것인지 구분하기 어려울 때 유용하다.
아래와 같이 상속 관계를 갖는 클래스들이 있다고 가정해보자.

```java
class Unit {
    // 생략
}

class Zealot extends Unit {
    // 생략
}

class Marine extends Unit {
    // 생략
}

class Zergling extends Unit {
    // 생략
}

public class CastingTest {
    public static void main(String[] args) {
        Unit unit;
        unit = new Unit();
        unit = new Zealot(); // 업캐스팅
        unit = new Marine(); // 업캐스팅
        unit = new Zergling(); // 업캐스팅
    }
}
```

예제로 만든 클래스 Zealot, Marine, Zergling은 모두 Unit 클래스를 상속하고 있다.
따라서 위 코드에서의 업캐스팅 코드는 컴파일 오류없이 정상적으로 수행된다.

한편 unit 레퍼런스 변수가 어떤 객체를 가리키고 있다고 가정할 때 가리키는 객체의 실제 클래스 타입을 구분하려면
어떻게 해야할까? 만일 아래와 같은 메서드가 있다면 파라미터로 어떤 타입의 객체가 넘어오는지 알 수 있을까?

```java
// 적을 공격하라!
public void attackEnemy(Unit unit) {
  // unit이 가리키는 객체가 Unit일 수도 있고
  // Zealot, Marine, Zergling일 수도 있다.
}
```

앞서 언급한 `instanceof` 연산자를 사용하면 객체의 타입을 쉽게 구별할 수 있다.
연산의 결과 타입은 `boolean`이며 아래와 같이 이항연산자처럼 사용하면 된다.

```java
class Unit {
    // 생략
}

class Zealot extends Unit {
    // 생략
}

class Marine extends Unit {
    // 생략
}

class Zergling extends Unit {
    // 생략
}

public class CastingTest {
    public static void main(String[] args) {
        Unit unit1 = new Unit();
        Unit unit2 = new Zealot(); // 업캐스팅
        Unit unit3 = new Marine(); // 업캐스팅
        Unit unit4 = new Zergling(); // 업캐스팅

        if (unit1 instanceof Unit) { // true
            System.out.println("unit1은 Unit 타입이다.");
        }
        if (unit1 instanceof Zealot) { // false
            System.out.println("unit1은 Zealot 타입이다.");
        }
        if (unit2 instanceof Zealot) { // true
            System.out.println("unit2는 Zealot 타입이다.");
        }
        if (unit2 instanceof Zergling) { // false
            System.out.println("unit2는 Zergling 타입이다.");
        }
        if (unit3 instanceof Unit) { // true
            System.out.println("unit3은 Unit 타입이다.");
        }
        if (unit4 instanceof Zergling) { // false
            System.out.println("unit4는 Zergling 타입이다");
        }
    }
}  
```

객체가 실제로 어떤 타입인지 비교할 수 있다. 실행 시점에 발생할 수 있는 형변환 오류를 줄일 수 있는 것이다.
`java.lang.String` 클래스의 `equals` 메서드를 보면 아래와 같이 구현되어 있다.
최상위 Object 객체를 파라미터로 받되, 실제로 자신과 값을 비교할 수 있는 `String` 타입인지 확인한다.

```java
public boolean equals(Object anObject) {
    if (this == anObject) {
        return true;
    }
    if (anObject instanceof String) {
        String anotherString = (String)anObject;
        int n = value.length;
        if (n == anotherString.value.length) {
            char v1[] = value;
            char v2[] = anotherString.value;
            int i = 0;
            while (n-- != 0) {
                if (v1[i] != v2[i])
                    return false;
                i++;
            }
            return true;
        }
    }
    return false;
}
```

사용시 주의할 점은 `instanceof` 연산자는 객체에 대한 클래스(참조형) 타입에만 사용할 수 있다.

```java
// 클래스(참조형) 타입은 가능!
if("Kimtaeng" instanceof String) {
    // String 타입이므 true
}

// 컴파일 오류! primitive type은 안된다.
if(3 instanceof int) {

}
```
