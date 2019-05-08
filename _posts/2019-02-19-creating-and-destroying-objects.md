---
layout:   post
title:    "[이펙티브 자바 3판] 2장. 객체 생성과 파괴"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "Effective Java 3th Edition: Chapter2. Creating and Destroying Objects"  
category: Java
comments: true
---

<hr/>

> ## 목록

- 아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라
- 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라. 
- 아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라.
- 아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라.
- 아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라.
- 아이템 6. 불필요한 객체 생성을 피하라.
- 아이템 7. 다 쓴 객체 참조를 해체하라.
- 아이템 8. finalize와 cleaner 사용을 피하라.
- 아이템 9. try-finally보다는 try-with-resources를 사용하라.

<br/><br/>

> ## 아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라.
Consider static factory methods instead of constructors

클래스의 인스턴스는 기본적으로 **public 생성자**를 통해서 얻을 수 있다.
하지만 생성자와 별도로 정적 팩터리 메서드(static factory method)를 사용하면 아래와 같은 장점을 얻을 수 있다.

- **첫 번째, 이름을 가질 수 있다.** 즉, 생성자처럼 클래스의 이름과 동일하지 않아도 된다.
예를 들어서 ```BigInteger(int, int, Random)``` 생성자와 정적 팩터리 메서드인 ```BigInteger.probablePrime``` 중에서
어느 쪽이 소수인 BigInteger 인스턴스를 반환한다는 의미를 더 잘 설명하는가? <br/><br/>
또한 하나의 클래스에서 시그니처가 같은 생성자가 여러 개 필요할 것 같은 경우에는 생성자를 정적 팩터리 메서드로 바꿔보자.
여기서 **시그니처란 메서드의 이름과 매개변수의 리스트**를 말한다. 만약 A, B 메서드가 매개변수의 개수와 타입 그리고 순서가
모두 같으면 두 메서드의 시그니처는 같다고 말할 수 있다. 

- **두 번째, 매번 인스턴스를 새로 만들지 않아도 된다.** 인스턴스를 미리 만들어두거나 생성된 인스턴스를 캐싱하여 재활용하는
식으로 불필요한 객체 생성을 줄일 수 있다. 즉, 어느 시점에 어떤 인스턴스가 유효한지 제어할 수 있는 인스턴스
통제(instance-controlled) 클래스로 만들 수 있다.

- **세 번째, 반환 타입의 하위 타입 객체를 반환할 수 있는 능력이 있다.** 
반환할 객체의 클래스를 자유롭게 선택할 수 있는 ‘엄청난 유연성’을 선물한다.
API를 만들 때 이 유연성을 응용하면 구현 클래스를 공개하지 않고도 그 객체를 반환할 수 있어 API를 작게 유지할 수 있다.
API가 작아진 것은 물론 개념적인 무게, 즉 프로그래머가 API를 사용하기 위해 익혀야 하는 개념의 수와 난이도도 낮췄다.

- **네 번째, 입력 매개변수에 따라 매번 다른 클래스의 객체를 반환할 수 있다.**
ㅇㄹ


**첫 번째, 이름을 가질 수 있다.** 즉, 생성자처럼 클래스의 이름과 동일하지 않아도 된다.
예를 들어서 ```BigInteger(int, int, Random)``` 생성자와 정적 팩터리 메서드인 ```BigInteger.probablePrime``` 중에서
어느 쪽이 소수인 BigInteger 인스턴스를 반환한다는 의미를 더 잘 설명하는가? <br/><br/>
또한 하나의 클래스에서 시그니처가 같은 생성자가 여러 개 필요할 것 같은 경우에는 생성자를 정적 팩터리 메서드로 바꿔보자.
여기서 **시그니처란 메서드의 이름과 매개변수의 리스트**를 말한다. 만약 A, B 메서드가 매개변수의 개수와 타입 그리고 순서가
모두 같으면 두 메서드의 시그니처는 같다고 말할 수 있다. 

**두 번째, 매번 인스턴스를 새로 만들지 않아도 된다.** 인스턴스를 미리 만들어두거나 생성된 인스턴스를 캐싱하여 재활용하는
식으로 불필요한 객체 생성을 줄일 수 있다. 즉, 어느 시점에 어떤 인스턴스가 유효한지 제어할 수 있는 인스턴스
통제(instance-controlled) 클래스로 만들 수 있다.

**세 번째, 반환 타입의 하위 타입 객체를 반환할 수 있는 능력이 있다.** 
반환할 객체의 클래스를 자유롭게 선택할 수 있는 ‘엄청난 유연성’을 선물한다.
API를 만들 때 이 유연성을 응용하면 구현 클래스를 공개하지 않고도 그 객체를 반환할 수 있어 API를 작게 유지할 수 있다.
API가 작아진 것은 물론 개념적인 무게, 즉 프로그래머가 API를 사용하기 위해 익혀야 하는 개념의 수와 난이도도 낮췄다.

**네 번째, 입력 매개변수에 따라 매번 다른 클래스의 객체를 반환할 수 있다.**






<br/><br/>

> ## 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라.
Consider a builder when faced with many constructor parameters

생성자가 있다면~

<br/><br/>

> ## 아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라.
Enforce the singleton property with a private constructor or an enum type

<br/><br/>

> ## 아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라.
Enforce noninstantiability with a private constructor

<br/><br/>

> ## 아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라.
Prefer dependency injection to hardwiring resources

<br/><br/>

> ## 아이템 6. 불필요한 객체 생성을 피하라.
Avoid creating unnecessary objects

<br/><br/>

> ## 아이템 7. 다 쓴 객체 참조를 해체하라.
Eliminate obsolete object references

<br/><br/>

> ## 아이템 8. finalize와 cleaner 사용을 피하라.
Avoid finalizers and cleaners

<br/><br/>

> ## 아이템 9. try-finally보다는 try-with-resources를 사용하라.
Prefer try-with-resources to try-finally