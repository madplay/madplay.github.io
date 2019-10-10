---
layout:   post
title:    자바에서 제네릭의 장점과 사용할 때 주의할 점
author:   Kimtaeng
tags: 	  java generic generic-class generic-interface generic-method
description: 자바에서 제네릭을 사용하면 좋은 점은 무엇일까? 그리고 주의할 점은?
category: Java
comments: true
---

# 제네릭은 무엇일까?
지난 글에서는 자바에서 제네릭은 무엇인지, 클래스와 인터페이스 그리고 메서드에는 어떻게 제네릭을 적용하는 지에 대해서 알아보았습니다.
- <a href="/post/java-generic" target="_blank">링크: 자바 제네릭(Java Generic)</a>

이번 글에서는 자바에서 제네릭이 왜 좋은지, 사용할 때 주의할 점은 없는 지 살펴봅니다.

<br/>

# 제네릭이 왜 좋을까?
우선 **컴파일 타임에 타입을 체크**하기 때문에 객체 자체의 타입 안전성을 높일 수 있습니다.
개발자가 의도하지 않은 타입의 객체가 저장되는 것을 방지할 수 있고 저장한 객체를 다시 가져올 때 기존 타입과
다른 타입으로 캐스팅되어 발생하는 오류(ClassCastException)를 줄일 수 있습니다.

**형 변환(Type Casting)의 번거로움**을 줄일 수 있습니다. 아래의 코드를 볼까요?
제네릭없이 최상위 객체 Object를 사용한다면 아래와 같이 코드를 작성할 수 있습니다.

```java
class MadPlay {
    private Object obj;

    public MadPlay(Object obj) { this.obj = obj; }
    public Object getObj() { return obj; }
}

class GenericTester {
    public void executeMethod() {
        MadPlay instance1 = new MadPlay(new String("Hello"));
        MadPlay instance2 = new MadPlay(new Integer(123));
        MadPlay instance3 = new MadPlay(new Character('a'));

        String obj1 = (String) instance1.getObj();
        Integer obj2 = (Integer) instance2.getObj();
        Character obj3 = (Character) instance3.getObj();
    }
}
```

하지만 여기서 제네릭을 사용하면 타입 캐스팅을 하지 않아도 됩니다. 변환하여 사용할 객체의 타입을 사전에 명시하므로서
타입 캐스팅의 수고를 줄일 수 있습니다. 

```java
class GenericMadPlay<T> {
    private T obj;

    public GenericMadPlay(T obj) { this.obj = obj; }
    public T getObj() { return obj; }
}

class GenericTester {
    public void executeMethod() {
        GenericMadPlay<String> genericInstance1 = new GenericMadPlay<>("Hello");
        GenericMadPlay<Integer> genericInstance2 = new GenericMadPlay<>(123);
        GenericMadPlay<Character> genericInstance3 = new GenericMadPlay<>('a');

        String genericObj1 = genericInstance1.getObj();
        Integer genericObj2 = genericInstance2.getObj();
        Character genericObj3 = genericInstance3.getObj();
    }
}
```

타입을 지정하지 않으면 최상위 Object 객체 타입으로 정의되므로 다양한 종류의 타입을 다뤄야하는 메서드의 매개변수에
Object 타입을 사용하고(첫 번째 예제 코드에서의 생성자) 그로 인한 타입 캐스팅이 불가피했지만
두 번째 코드를 보면 알 수 있듯이 제네릭을 사용하면 원하는 타입을 사전에 지정하기만 하면 됩니다.

끝으로 이번 글에서 타입 매개변수의 이름을 `T`로 지정했으나, 사실 아무 이름이나 가능합니다.
`MadPlay<Kimtaeng>` 이런식도 가능하지요. 하지만 아래와 같이 **컨벤션(Convention)**이 있습니다. 다른 개발자가 보았을 때
조금 더 쉽게 이해할 수 있도록 지키는 것이 좋을 것 같습니다.

- E(Element) : 요소, 예를 들어 `List<E>`
- K(Key) : 키, 예를 들어 `Map<K, V>`
- N(Number) : 숫자
- T(Type) : 타입 
- V(Value) : 리턴 값 또는 매핑된 값
- S, U, V : 2번째, 3번째 그리고 4번째에 선언된 타입

<br/>

# 제네릭 사용시 주의할 점은?
제네릭은 클래스와 인터페이스만 적용되기 때문에 자바 **기본 타입(Primitive Type)은 사용할 수 없습니다.**
<a href="/post/java-data-type" target="_blank">(관련 링크 : 자바의 데이터 타입)</a> 


```java
public void someMethod() {
    List<int> intList = new List<>(); // 기본 타입 int는 사용 불가
    List<Integer> integerList = new List<>(); // Okay!
}
```

또한 제네릭 타입을 사용하여 객체를 생성하는 것은 불가능합니다. 즉, 제네릭 타입의 객체는 생성이 불가능합니다.

```java
public void someMethod() {
    // Type parameter 'T' cannot be instantiated directly
    T t = new T();
    return t;
}
```

그리고 제네릭에서는 배열에 대한 제한을 두고 있습니다. 제네릭 클래스 또는 인터페이스 타입의 배열을 선언할 수 없습니다.
하지만 제네릭 타입의 배열 선언은 허용됩니다.

```java
public void someMethod() {
    // generic array creation
    // (자바 8이전) Cannot create a generic array of MadPlay<Integer>
    MadPlay<Integer>[] arr1 = new MadPlay<>[10];
    
    MadPlay<Integer>[] arr2 = new MadPlay[10]; // Okay!
}
```