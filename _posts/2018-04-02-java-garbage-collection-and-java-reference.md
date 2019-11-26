---
layout:   post
title:    자바 레퍼런스와 가비지 컬렉션(Java Reference & Garbage Collection)
author:   Kimtaeng
tags: 	  Java Garbage GC Reference
description: 가비지 컬렉션에 이어서 자바 레퍼런스의 객체 참조에 대해서 알아보자.
category: Java
comments: true
---

# 자바 레퍼런스의 객체 참조
우리는 보통 아래 코드와 같이 `new` 연산자를 이용하여 객체를 생성한다. 그리고 이러한 전형적인 객체 참조 방식을 **Strong Reference** 라고 말한다.

```java
/**
 * Test for Java References
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        /* Strong Reference. */
        MadPlay object = new MadPlay();
        object.sayHello();
    }
}

class MadPlay {
    public void sayHello() {
        System.out.println("Hello MadPlay!");
    }
}
```

초기의 Java는 사용자의 코드가 가비지 컬렉션의 수행에 관해서 관여하지 않도록 구현되었다.
하지만 **JDK 1.2부터 java.lang.ref 패키지**를 통해 조금이나마 가비지 컬렉터와 소통할 수 있게 되었다.

이 패키지는 앞서 살펴본 일반적인 객체 참조 방식인 **Strong Reference** 외에도 **Soft Reference**,
**Weak Reference**, **Phantom Reference** 이라는 참조 방식을 클래스로 제공한다.

이를 통해서 개발자는 가비지 컬렉션에 조금 더 관여할 수 있게 되었다.
그리고 위에서 언급한 레퍼런스(Reference) 클래스에 의해 생겨난 객체를 Reference Object 라고 부른다.

- <a href="http://www.pawlan.com/monica/articles/refobjs/" target="_blank" rel="nofollow">링크: Reference Object

<br/>

# 가비지 판단 기준
가비지 컬렉션(Garbage Collection)은 특정 객체가 가비지인지 아닌지 판단하기 위해서 **도달성, 도달능력(Reachability)** 이라는
개념을 적용한다. 객체에 유효한 레퍼런스가 없다면 Unreachable로 구분해버리고 수거해버린다. 레퍼런스가 있다면 Reachable로 구분된다.

객체의 참조가 간단하면 참 좋겠지만 하나의 객체가 여러 가지 다른 객체를 참조하고 그 객체들도 또 다른 객체를 참조할 수 있다.
이 경우에 유효한 참조가 있는지를 파악하려면 **항상 유효한 가장 처음의 참조** 라는 것이 있어야 하는데, 이를 `Root Set` 이라고 한다.

난해한 단어와 이론만으로 이해하려고 하니까 참 어렵다. 조금 더 명확하게 이해하기 위해서는 그림으로 살펴보자.
아래 그림에서는 모든 객체 참조가 Strong Reference 라고 가정한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-1.png"
width="600" alt="바쁘겠다. 가비지 컬렉터"/>


그림도 참 복잡하게 엮어있지만, 우선 여기서 유효한 참조가 있는 Reachable과 가비지 컬렉터의 먹잇감이 되는 Unreachable을 분류하면 어떻게 될까?

<br/>

색을 입혀 구분해보면 다음과 같다. 녹색은 Reachable이고 적색은 Unreachable 이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-2.png"
width="600" alt="Reachable과 Unreachable"/>

<br/>

여기서 또 한 가지, Unreachable 객체가 가비지 컬렉터에 수거되지 않으려고 Reachable 객체를 참조하더라도
정작 자신이 참조를 받지 못한다면 여전히 Unreachable로 분류된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-3.png"
width="600" alt="Unreachable"/>

<br/>

# java.lang.ref 패키지
그렇다면 앞에서 언급한 `java.lang.ref` 패키지가 제공한다는 Weak Reference, Soft Reference, Phantom Reference는 무엇을 말할까?
먼저, Weak Reference를 살펴보자.

```java
import java.lang.ref.WeakReference;

/**
 * Weak Reference Test.
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        WeakReference<MadPlay> wr = new WeakReference<MadPlay>(new MadPlay());
        MadPlay madplay = wr.get();
    }
}

class MadPlay {
    public void show() {
        /* ... */
    }
}
```

<br/>

위의 코드를 그림으로 본다면 다음과 같을 것이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-4.png"
width="500" alt="Weak Reference"/>

<br/>

그런데 이 상태에서 12번 라인의 madplay 레퍼런스에 null을 할당하면 어떻게 될까?

```java
import java.lang.ref.WeakReference;

/**
 * Weak Reference Test.
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        WeakReference<MadPlay> wr = new WeakReference<MadPlay>(new MadPlay());
        MadPlay madplay = wr.get();
        
        /* null을 할당한다. 어떻게 될까? */
        madplay = null;
    }
}

class MadPlay {
    public void show() {
        /* ... */
    }
}
```

위 코드에서 생성된 MadPlay 객체는 오로지 WeakReference로만 참조가 된다. 바로 이때, 이 객체를 **Weakly Reachable Object** 라고 부른다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-5.png"
width="500" alt="assign null to Weak Reference"/>

정리를 해보자면, 가비지 컬렉션은 Reachable 인지 또는 반대로 Unreachable 인지를 판단해서 처리를 진행하였고
개발자가 개입할 수 없었던 부분을 java.lang.ref 패키지를 통해서 조금이나마 간섭할 수 있게 되었다.

그러니까 앞서 살펴본 Weakly Reachable을 비롯하여 Strongly, Softly, Phantomly Reachable로 더욱 세밀하게
구별할 수 있게 된 것이다. 하나의 객체에 대해서 참조의 개수나 형태는 제한이 없기 때문에 하나의 객체는 여러 Reference의 조합으로 참조될 수 있다.
중요한 포인트는 `Root Set` 을 시작으로 객체 참조에 대한 경로를 조사하고, 그 경로에 있는 객체에 대한 도달 능력(Reachability)을 결정한다.

<br/>

# Reachability
그럼 각각의 도달 능력(Reachability)은 무엇을 뜻할까?

- **Strongly Reachable**
  - Root Set과 바로 연결된 것을 말한다.
  - Root Set부터 해당 객체 사이에 어떠한 Reference Object도 없다.

- **Softly Reachable**
  - Strongly Reference가 아닌 것 중에서 Weak, Phantom Reference 없이 Soft Reference만 통과하는 참조가 하나라도 존재하는 객체를 말한다.

- **Weakly Reachable**
  - Strongly, Softly Reachable 객체가 아닌 객체 중에서 Phantom Reference 없이
    Weak Reference만 통과하는 참조가 하나라도 존재하는 객체를 말한다.

- **Phantom Reachable**
  - Strongly, Softly, Weakly Reachable 객체에 모두 해당하지 않는 객체를 말한다.
  - 그러니까 finalize 되었지만 아직 메모리가 회수하지 않은 상태이다.