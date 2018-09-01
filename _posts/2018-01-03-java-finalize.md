---
layout:   post
title:    자바 소멸자 finallize
author:   Kimtaeng
tags: 	  Java 소멸자 자바기초
subtitle: 자바에서 메모리 할당된 객체를 해제하려면?
category: Java
comments: true
---

<hr/>

> ## finalize 메서드란 

자바의 모든 클래스는 최상위 클래스인 Object 클래스의 여러 메서드를 포함하고 있는데요.<br/>
객체 소멸자라고 말하는 finalize 메서드도 그 메서드들 중 하나입니다.<br/>
리소스 누수(leak)를 방지하기 위해 자바 가상 머신(Java Virtual Machine)이 실행하는 가비지 컬렉션이 수행될 때<br/>
더 이상 사용하지 않는 자원에 대한 정리 작업을 진행하기 위해 호출되는 종료자 메서드입니다.<br/>

<br/><br/>

> ## vs C++ 소멸자

자바는 메모리 관리를 자바 가상 머신(JVM)이 직접 진행합니다. 그렇기 때문에 개발자는 이러한 동적 할당의 해제에 대해서 크게 관여하지 않아도 됩니다.<br/>
하지만 C, C++ 언어의 경우는 다릅니다. 개발자가 명시적으로 할당 해제를 하지 않으면 메모리 누수가 발생합니다.
아래 예제 코드로 C++의 동적 할당과 해제를 살펴봅시다.<br/>

<pre class="line-numbers"><code class="language-cpp" data-start="1">#include &lt;iostream&gt;
#include &lt;string&gt;

using namespace std;

class ObjA {
private:
    int id;
public:
    ObjA(int id) {
        this->id = id;
        cout << "Call ObjA Constructor" << endl;
    }
    ~ObjA() {
        cout << "Call ObjA Destructor" << endl;
    }
};

class ObjB : public ObjA {
private:
    int id;
    string name;
public:
    ObjB(int id, string name) : ObjA(id) {
        this->name = name;
        cout << "Call ObjB Constructor" << endl;
    }
    ~ObjB() {
        cout << "Call ObjB Destructor" << endl;
    }
};

int main(void)
{
    /* 힙 영역에 생성되는 객체 */
    ObjB *obj = new ObjB(3, "madplay");
    delete obj; /* 개발자의 명시적인 동적할당 해제 */

    /* 물론 다음과 같이 객체를 생성한다면 스택 영역에 생기기 때문에 자동 해제됩니다. */
    ObjB autoDeleteObj(3, "madplay");

    return 0;
}
</code></pre>

위 코드 작성은 Mac OSX 환경에서 진행했고 gcc를 통해서 컴파일 한 후 실행하였습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-03-java-finalize-1.jpg" width="600" height="180" alt="GCC 결과"/>

여기서 C++의 객체 생성과 소멸의 특징이 있습니다. 반드시 소멸자가 호출된다는 점입니다.

위 코드를 자바 언어로 바꿔보면 다음과 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class ObjA {
    private int id;

    public ObjA(int id) {
        this.id = id;
        System.out.println("Call ObjA Constructor");
    }

    public void finalize() {
        System.out.println("Call ObjA Destructor");
    }
}

class ObjB extends ObjA {
    private String name;

    public ObjB(int id, String name) {
        super(id);
        this.name = name;
        System.out.println("Call ObjB Constructor");
    }

    public void finalize() {
        System.out.println("Call ObjB Destructor");
        super.finalize();
    }
}

public class Test {
    public static void main(String[] args) {
        ObjB obj = new ObjB(3, "madplay");
        obj.finalize();
    }
}

</code></pre>

자바는 자동으로 상위 클래스의 종료자가 호출되지 않기 때문에 super.finalize(); 코드를 통해서
명시적으로 상위 클래스의 종료자를 호출해야 합니다.

위의 코드를 실행해보면 종료자를 멀리해야 하는 이유를 알 수 있는데요. < Effective Java > 서적에서는 finalize 메서드 사용에 대해서 다음과 같이 언급하고 있습니다.


<div class="post_caption">"종료자는 사용하면 안 된다. 예측이 불가능하고 대체로 위험하고 일반적으로 필요하지 않다."</div>



자바의 finalize 메서드는 위에서 살펴본 것처럼 실행을 보장하지 않습니다.
이러한 특성을 가진 종료자 메서드에서 스트림을 닫는 행위를 하면 치명적일 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class TestObject {
    /* Stream 변수, 메서드 선언 생략 */

    protected void finalize() throws Throwable {
        try {
            if ( fileStream != null) fileStream.close();
        } finally {
            super.finalize();
        }
    }
}
</code></pre>

<br/><br/>

> ## 자바의 자원 반환, null 처리?

앞서 말한 것처럼 개발자가 신중하게 메모리 반환 시점을 결정하기 어렵습니다.
가비지 컬렉션 실행을 요청하는 메서드가 있지만 반드시 실행을 보장하는 것은 아닙니다.

```java
/* 반드시 가비지 컬렉션이 동작하지는 않는다. */
System.gc();
```

자바의 메모리 관련 자료를 찾아보면 객체를 사용하고 나서 쓸모가 없어진 경우<br/>
null을 할당하는 방법을 추천합니다. 그렇게 하면 어떻게 될까요?<br/>

사용 유무에 따른 차이를 살펴보기 위해서 Garbage Collection 로그를 살펴봅시다.<br/>
이클립스로 예를 들면 VM Options에 -verbose:gc를 추가하면 됩니다.

< 사용된 메서드 설명 ><br/>
Runtime.getRuntime().maxMemory() : JVM이 사용하려고 시도한 가장 큰 메모리 양<br/>
Runtime.getRuntime().totalMemory() : JVM의 모든 메모리 양을 바이트 단위로 반환<br/>

<pre class="line-numbers"><code class="language-java" data-start="1">public class Test {
    private static final int MegaBytes = 10241024;

    public void resourceAllocate() {

        long maxMemory = Runtime.getRuntime().maxMemory() / MegaBytes;
        long totalMemory = Runtime.getRuntime().totalMemory() / MegaBytes;

        System.out.println("totalMemory : " + totalMemory);
        System.out.println("maxMemory : " + maxMemory);
        byte[] testArr1 = new byte[2000000000];

        System.out.println("### Second Allocation ###");
        byte[] testArr2 = new byte[2000000000];

        maxMemory = Runtime.getRuntime().maxMemory() / MegaBytes;
        totalMemory = Runtime.getRuntime().totalMemory() / MegaBytes;

        System.out.println("### Memory Allocation ###");
        System.out.println("totalMemory : " + totalMemory);
        System.out.println("maxMemory : " + maxMemory);
    }

    public static void main(String[] args) {
        new Test().resourceAllocate();
    }
}
</code></pre>


위 코드를 실행하면 다음과 같은 OutOfMemoryError Exception이 발생합니다.
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-03-java-finalize-2.jpg" width="600" height="200" alt="OOM Exception"/>

GC와 Full GC가 일어나도 메모리는 여전히 부족합니다.
resourceAllocate() 메서드가 종료되기 전까지 testArr1의 참조가 존재하기 때문이지요.


그렇다면 위의 코드에서 testArr2를 할당하기 전에 다음과 같이 testArr1을 null로 만들면 어떻게 될까요?

<pre class="line-numbers"><code class="language-java" data-start="1">...
...
byte[] testArr1 = new byte[2000000000];

/* testArr1을 null로 */
testArr1 = null;

System.out.println("### Second Allocation ###");
byte[] testArr2 = new byte[2000000000];

...
</code></pre>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-03-java-finalize-3.jpg" width="600" height="230" alt="testArr1을 null로"/>

Out Of Memory Error 예외가 발생하지 않는 모습을 볼 수 있습니다.
그렇다면 자원 관리를 위해 객체 사용 후에는 매번 null 할당해야 할까요?

간단한 프로그램이라면 모를까 큰 규모의 프로그램에서는 어디서 null 할당을 할지도 고민일 것 같습니다.<br/>
null 할당은 가비지 컬렉션이 일어나기만 한다면 바로 회수되고 이후에 해당 객체를 사용할 수 없는 점이 있습니다.

이러한 상황에서 java.lang.ref 패키지를 통해 조금 더 가비지 컬렉션과 소통할 수 있는 방법이 있습니다.<br/>
자세한 내용은 다음 링크를 참조하면 됩니다. 


<a href="https://madplay.github.io/post/java-garbage-collection-and-java-reference" target="_blank" rel="nofollow">자바 레퍼런스와 가비지 컬렉션(링크)</a>


위의 링크된 포스팅 내용과 가비지 컬렉션 그리고 오늘 살펴본 finalize 메서드와의 관계를 요약해보면

가비지 컬렉션을 실행했지만, 메모리가 충분하다면 계속 참조하겠다. (Soft Reference)<br/>
가비지 컬렉션이 일어나기 전까지만 계속 참조하겠다. (Weak Reference)<br/>
finalize 메서드 호출 이후에도 참조하고 싶다. (Phantom Reference)<br/>

이렇게 정리할 수 있을 것 같습니다.

<br/><br/>

> ## 상속 관계에서의 재정의

위에서 살펴본 finalize 메서드의 문제가 있음에도 이를 오버라이딩 하는 커스텀 클래스가 있고<br/>
이 클래스를 상속하고 finalize 메서드를 재정의하는 하위 클래스가 있다면 하위 클래스 객체가 소멸될 때<br/>
상위 클래스의 명시적 종료자를 반드시 호출하도록 강제하는 방어 기법을 사용하면 좋습니다.<br/>

<pre class="line-numbers"><code class="language-java" data-start="1">class ParentObject {
    protected void finalize() {
        /* Do Something */
    }
}

class TestObject extends ParentObject {
    private final Object finalizerGuardian = new Object() {
        @Override
        protected void finalize() throws Throwable {
            /* Do Something... */
        }
    };
}

public class MadPlay {
    public static void main(String[] args) throws Throwable {
        TestObject obj = new TestObject();
        obj = null;
        System.gc();
    }
}
</code></pre>

익명 클래스를 통해서 Object의 finalize 메서드를 재정의합니다.<br/>
TestObject 객체가 가비지 컬렉션의 대상이 될 때, 멤버의 해제와 finalize 메서드가 호출됩니다.

위와 같은 방법이 아니라면 하위 클래스의 finalize 메서드에서 상위 클래스의 finalize 메서드를 호출하면 됩니다.<br/>
하지만 상위 클래스의 메서드 호출을 잊어버릴 가능성이 있지요.


결론적으로는 finalize 메서드는 실행을 보장하지 않습니다. 사용에 따른 장점이 적습니다.<br/>
만일 사용해야 한다면 상위 클래스의 종료자 호출을 잊으면 안됩니다.