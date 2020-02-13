---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 8. FINALIZER와 CLEANER 사용을 피하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 8. Avoid finalizers and cleaners" 
category: Java
comments: true
---

# 객체 소멸자

자바에서는 2가지의 객체 소멸자를 제공합니다. 바로 최상위 오브젝트 클래스에 포함된 ```finalize``` 메서드와
**Java 9**에서 추가된 ```java.lang.ref``` 패키지에 포함된 ```Cleaner``` 클래스입니다.

두 가지 모두 JVM(Java Virtual Machine)에서 Garbage Collection이 수행될 때 실행되는 구문입니다.
그런데 ```finalize``` 메서드는 **Java 9에서 Deprecated** 되었는데요. 새롭게 추가된 Cleaner의 경우에도
사용을 권장하지 않습니다. 그 이유를 하나씩 살펴봅시다.

<a href="/post/java-finalize" target="_blank">참고: Finalize 메서드(링크)</a>

<br/>

# 사용을 지양해야 하는 이유

**실행 시점을 보장할 수 없습니다.** 자바에서 꽤 오랫동안 유지되어온 ```finalize``` 메서드와 마찬가지로
```Cleaner``` 의 경우도 사용했을 때 언제 실행될 지 시점을 보장할 수 없습니다. 

**실행 조차 안될 수 있습니다.** 즉시 실행이 안되는 것을 감안한다고 하더라도 프로그램이 비정상 종료된다는 등의 이유로
실행조차 안될 수 있습니다. 그렇기 때문에 특정 시점 또는 반드시 실행되어야 한다는 것을 기대하고 사용해서는 안됩니다.

**역효과를 불러올 수 있습니다.** Unreachable 상태의 객체를 가비지 컬렉션할 때 기본적으로 finalizer가 호출되지만
그렇다고 가비지 컬렉션이 즉시 수행되는 것은 아닙니다. ```finalizer queue```에 삽입되어 순차적으로 수행됩니다.
그렇기 때문에 ```finalize``` 메서드 실행이 느린 경우 인스턴스의 소멸이 느려지는 것이므로 ```OutOfMemory```와 같은 오류를
발생시킬 수 있습니다.

**실행이 느립니다.** ```AutoClosable```을 구현(implements)한 객체를 만들고 ```try-catch-resource```로 자원을 반납하는데
12ns가 소요되는 반면에 finalizer를 사용한 가비지 컬렉션의 수행 시간은 550ns가 소요됩니다.

**보안에 취약합니다.** 위에서 살펴본 것처럼 finalize 메서드의 실행 시간이 오래 걸리도록 만들면 전반적인 시스템 장애를
불러올 수 있습니다. 메서드를 재정의(override)하여 악의적으로 정상 실행을 방해할 수 있기 때문에 ```final``` 키워드를 붙여서
상속하지 못하도록 막아야 합니다.

<br/>

# 그럼 왜 사용할까?

가비지 컬렉터(Garbage Collector)가 회수하지 못하는 **네이티브(native) 자원의 정리**에 사용합니다. 자바 객체가 아니므로
가비지 컬렉터가 관리하는 대상이 아니기 때문입니다. finalizer를 명시적으로 호출함으로 자원을 회수할 수 있습니다.

그리고 이펙티브 자바 서적을 참고하면, finalizer는 개발자가 **객체의 close를 명시적으로 호출하지 않은 경우**에
사용한다고 합니다. 개인적으로 ```finalize```를 직접 호출하는 것과 ```close```를 안하는 것 중 굳이 고르자면 어느 것이 조금 더
나은 방법일지 궁금하기도 합니다.

finalizer 기능이 필요한 경우에는 ```AutoCloseable``` 인터페이스를 구현하여
```try-catch-resource```를 사용하거나 ```close``` 메서드를 구현하여 호출하도록 하면 됩니다. 