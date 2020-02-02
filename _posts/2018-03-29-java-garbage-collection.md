---
layout:   post
title:    자바 가비지 컬렉션(Java Garbage Collection)
author:   Kimtaeng
tags: 	  Java Garbage GC
description: Java에서의 가비지와 가비지 컬렉션에 대해서 알아보자.
category: Java
comments: true
---

# 가비지(Garbage)란 무엇일까?

가비지란 무효영역(無效嶺域) 이라고도 하며, 더 이상 사용되지 않는 메모리를 뜻합니다.
자바의 new 연산자 이용하여 시스템으로부터 메모리를 할당받아 사용되어지다가 더 이상 사용되지 않는
객체(Object)나 배열(Array) 메모리가 가비지에 해당되지요.

여기서, "더이상 사용되지 않는다." 라는 뜻은 객체나 배열을 가리키는 레퍼런스가 하나도 없음을 의미합니다.

<br/>

# 가비지의 발생 사례

아래와 같이 단순한 코드에서도 가비지가 발생할 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * Garbage & Garbage Collection in Java
 *
 * @author Kimtaeng
 * Created on 2018. 3. 29.
 */
public class MadPlay {
    public static void main(String[] args) {
        MadMan madMan1 = new MadMan("Kim");
        MadMan madMan2 = new MadMan("Taeng");

        /* madMan2가 가리키던 객체는 가비지가 된다. */
        madMan2 = madMan1;
        
        /*
         * 이하 코드 생략,
         * name이 Taeng인 MadMan객체를 가리키는
         * 코드는 존재하지 않음
         */ 
    }
}

class MadMan {
    private String name;

    public MadMan(String name) {
        this.name = name;
    }
}
</code></pre>

manMan2 레퍼런스가 "Taeng" 이라는 이름을 가진 MadMan 객체를 가리키고 있었으나
위 예시 코드 13번 라인에서의 ```madMan2 = madMan1;``` 코드로 인하여 그 이후부터 madMan1 레퍼런스가 기리키는
"Kim" 이라는 name 필드를 가진 객체를 가리키게 됩니다. 그로 인하여 처음에 madMan2 레퍼런스가
가리키던 객체는 어떠한 레퍼런스 변수도 참조하지 않게 되어 더 이상 접근할 수 없습니다. 이것이 바로 가비지입니다.

아래와 같은 상황에서도 가비지는 발생할 수 있습니다. 
 
<pre class="line-numbers"><code class="language-java" data-start="1">/**
  * Garbage & Garbage Collection in Java
  * Example 2
  *
  * @author Kimtaeng
  * Created on 2018. 3. 29.
  */
 public class MadPlay {
     public static void main(String[] args) {
         String testVar1 = new String("MadPlay");
         String testVar2 = new String("MadLife");
         String testVar3 = new String("Kimtaeng");
         String testVar4 = null;
 
         testVar1 = null;
         testVar4 = testVar3;
         testVar3 = null;
     }
 }
</code></pre>

```testVar1 = null;``` 문장으로 인해 MadPlay 라는 String 객체의 레퍼런스 변수는 존재하지 않습니다.
즉, 가비지가 되었습니다. 한편으로 16번 라인의 레퍼런스 변수 testVar3가 객체를 가리키지 않도록 null로 초기화하였으나,
바로 위의 15번 라인에서 testVar4가 가리키게 함으로서 "Kimtaeng" 라는 String 객체는 가비지가 되지 않습니다.
<br/>
마지막으로 "MadLife" 객체는 프로그램의 실행이 종료될 때까지 레퍼런스 변수 testVar2가 가리키고 있으므로 가비지가 되지 않습니다.

<br/>

# 가비지 컬렉션은 무엇일까?

가비지를 회수하여 사용할 수 있는 메모리 공간을 늘리는 작업을 <b>가비지 컬렉션</b> 이라고 합니다.
그리고 이러한 일을 수행하는 것을 <b>가비지 컬렉터<b/>라고 하고요.

자바 가상 기계(Java Virtual Machine)는 가비지 컬렉터 역할을 수행하는 가비지 컬렉션 스레드(Garbage Collection Thread)를
두고 있습니다. 가비지가 많아지면 상대적으로 프로그램에 할당할 수 있는 가용 메모리가 줄어들기 때문이지요.
심지어 최악의 상황에서는 더 이상 메모리를 할당할 수 없는 상황도 올 수 있고요.

사실 요즈음 시대의 인프라에서는 더 이상 할당을 할 수 없는 상황은 거의 일어나지 않습니다.
그래서 메모리가 부족해서 가비지 컬렉터가 작동되는 모습을 보는 것이 어려울 수 있습니다.

가장 중요한 것은 JVM의 내부적인 알고리즘의 판단에 의해서 가비지 컬렉션이 수행되기 때문에 언제 가비지 컬렉션이
일어나는지 알기 어렵습니다. 차 키를 받아서 주차도 해주고 시동도 꺼주는 발렛파킹 서비스를 생각하면 좋을 것 같습니다.

<br/>

# 가비지 컬렉션은 무엇일까?

JVM의 판단에 의해서 실행된다지만 가비지 컬렉션이 실행되기를 희망하는(?) 방법도 있습니다.
System 또는 Runtime 객체의 gc() 메서드를 호출하면 가비지 컬렉션을 요청할 수 있습니다.

```java
System.gc(); 
또는
Runtime.getRuntime().gc();
```

위 코드는 말 그대로 희망적인 "요청" 입니다. 위 문장을 실행하자마자 가비지 컬렉터가 동작하는 것은 아닙니다.
단지, 가비지 컬렉션이 필요하다고 요청하는 것 밖에 되지 않지요. 가비지 컬렉션은 앞서 말한 것처럼 자바 가상 기계(JVM)가 판단하기 때문입니다.

<br/>

# 과연???

C++ 언어의 new 및 delete 연산자와 다르게 Java에서는 객체를 생성하는 new 연산자만 제공합니다.
C++의 경우는 객체를 생성할 때 생성자를 호출하고 객체를 메모리에서 해제할 때는 소멸자를 호출하는데,
자바에서는 객체를 메모리에서 해제하는 역할을 가비지 컬렉터가 직접 한다는 것이지요.

그렇다고 소멸자의 개념이 없는 것도 아닙니다. ```java.lang.Object``` 클래스를 살펴보면 finalize() 메서드가 존재합니다.
가비지 컬렉터는 내부적으로 이 메서드를 호출하여 객체를 메모리에서 해제시킵니다.

<a href="/post/java-finalize" target="_blank">자바 Finalize 메서드(링크)</a>

메모리 관리를 자바 가상 기계가 알아서 해준다는 것. 편리함에 단점도 있는 법이겠지요? 