---
layout:   post
title:    싱글톤 패턴(Singleton Pattern)
author:   Kimtaeng
tags: 	  DesignPattern
subtitle: 안티 패턴이라고도 하는 싱글톤 패턴을 알아보자.
category: DesignPattern
comments: true
---

<hr/>

> ## 싱글톤 패턴이란?

싱글톤 패턴이란 클래스의 객체 개수를 제한시키는 방법입니다.
보통의 경우 패턴의 이름처럼 단 한 개의 객체만 존재하도록 강제합니다.

그럼 왜 하나만 제한할까요? 정말 간단하게 로그를 남기는 것으로 예로 들어봅시다.
프로그램이 시작되어 종료될 때까지 로그를 남기는 로거를 참조하여 에러나 구동 정보를 기록할텐데
로깅을 하기위해서 참조할 때마다 로거 객체를 생성해서 사용한다면 계속해서 자원을 소모하게 될 겁니다.
자바로 예를 들면, new( ) 를 통해 객체를 생성하는 경우 Heap 메모리 자원이 소모되기 때문이지요.

이러한 경우에는 단 하나만의 로거 객체를 이용해서 같은 객체를 참조하여 사용하는 것이
시스템 자원 소모를 줄이는 방법이 될 수 있습니다.

<br/><br/>

> ## 어떻게 사용할까?

먼저, 외부에서 해당 클래스의 객체를 생성할 수 없도록 제한하기 위해서
생성자는 반드시 private 접근 지정자로 선언되어야 합니다.

또한 어느 영역에서 접근이 가능하도록 정적 메서드로 객체를 참조할 수 있도록 정의합니다.
위와 같은 규칙을 자바 코드로 작성하면 다음과 같은 모습이 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * 싱글톤 패턴의 기본 구조
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public class MadPlay {
	private static MadPlay instance;

    /* 
     * private 접근지정자로 선언된 생성자
     */
	private MadPlay() {}

	public static MadPlay getInstance() {
		if (instance == null) {
			instance = new MadPlay();
		}
		return instance;
	}
}
</code></pre>

<br/><br/>

> ## 반드시 하나의 객체만 생성될까?

위와 같은 생성자 패턴의 기본 구조를 보았을 때, 의문이 생길 수 있습니다.
'어떠한 경우에서도 반드시 하나의 객체만 존재하는 것을 보장할 수 있을까?'

단일 스레드가 아닌 2개 이상의 스레드가 실행되고 있는 상황,
그러니까 멀티 스레딩 환경에서는 객체가 하나만 생성되어야하는 싱글톤 패턴을 적용해도
두 개 이상의 객체가 생성될 수 있습니다.

동시에 최초의 getInstance() 메서드에 접근하는 경우에 그렇습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/* 객체가 생성되기 전, 두 개 이상의 스레드가 동시에 접근하면 어떻게 될까? */
public static MadPlay getInstance() {
    if(instance == null) {
        instance = new MadPlay();
    }
    return instance;
}
</code></pre>

<br/><br/>

> ## 멀티스레딩 환경에서의 문제를 어떻게 해결할까?

관련 서적이나 참고 자료를 찾아보면 여러가지 방법이 있습니다. 하나씩 살펴봅시다.

<b>먼저, 클래스 로딩 시점에 객체를 미리 생성하는 방법입니다.</b><br/>
이러한 방법은 프로그램 시작 시간에 영향을 주고, 메모리를 무조건 차지하는 점이 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * 클래스 로딩 시점에 객체 생성
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public class MadPlay {
	private static MadPlay instance = new MadPlay();

    /*
     * private 접근지정자로 선언된 생성자
     */
	private MadPlay() {}

	public static MadPlay getInstance() {
		return instance;
	}
}
</code></pre>

<br/>

<b>다음은 getInstance() 메서드를 동기화시키는 방법입니다.</b><br/>
메서드 전체에 Lock을 하는 방식이라서 속도가 느립니다. 사실 동기화가 필요한 시점은 이 메서드가 시작되는 시점이기 때문에
객체가 생성되었다면 굳이 이 메서드를 동기화된 상태로 유지할 필요가 없습니다.
유지가 된다면 해당 레퍼런스를 참조하기 위해 메서드를 호출할 때마다 속도 영향이 생깁니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * getInstance() 메서드 동기화
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public class MadPlay {
	private static MadPlay instance;

    /**
     * private 접근지정자로 선언된 생성자
     */
	private MadPlay() {}

    /**
     * 한 스레드가 메서드 사용을 끝내기 전까지 다른 스레드는 대기한다.
     * 즉, 두 개 이상의 스레드가 이 메서드를 동시에 실행시키는 일은 발생하지 않는다.
     */
	public static synchronized MadPlay getInstance() {
		if(instance == null) {
            instance = new MadPlay();
        }
        return instance;
	}
}
</code></pre>

<br/>

<b>또 다른 방법은 DCL(Double-Checking Locking)을 사용하는 방법입니다.</b><br/>
getInstance() 메서드를 동기화하긴 하지만, 해당 영역을 줄이는 방법입니다.
객체가 생성되었는지 확인한 후 생성되지 않았따면 동기화를 진행하는 것입니다.
쉽게 말하면 처음에만 동기화하고 그 이후에는 동기화를 하지 않습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * Double-Checking Locking
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public class MadPlay {
    /* volatile 키워드  */
	private volatile static MadPlay instance;

    /**
     * private 접근지정자로 선언된 생성자
     */
	private MadPlay() {}

    /**
     * 메서드에서 synchronized 키워드는 제거된다.
     */
	public static MadPlay getInstance() {
		if(instance == null) {
            synchronized (MadPlay.class) {
                if(instance == null) {
                    instance = new MadPlay();
                }
            }
        }
        return instance;
	}
}
</code></pre>

동기화 선언 부분 외에 달라진 점이라면 instance 레퍼런스에 volatile 키워드가 사용되었는데,
이는 CPU가 객체 참조시에 캐시된 메모리를 사용하지 않고 직접 메모리에서 값을 가져오도록 보장합니다.
자바의 volatile 키워드에 대한 내용은 추가적으로 포스팅하도록 하겠습니다.
우선, Thread는 보통 Cache Memory를 참조해서 값을 읽어온다는 부분만 짚고 넘어갑시다.

<br/>
<b>마지막으로 많이 생소할 수 있는 enum을 사용하는 방법이 있습니다.</b><br/> 
< Effective Java > 서적에서 나온 방법입니다. enum이 프로그램 내에서 한번만 초기화 되는 점을 이용하였습니다.

위에서 제시한 방법들은 직렬화(Serialize)를 해야하는 경우에 직접 Serializable을 구현(implements) 해야하는 점이 있으나
enum의 경우에는 해당 클래스는 자동으로 Serializable 하면서 반드시 한 번만 객체화되는 것을 보장합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * enum을 사용한 싱글톤
 * @author Kimtaeng
 * created on 2016. 10. 28.
 */
public enum MadPlay {
	INSTANCE;

	public static MadPlay getInstance() {
		return INSTANCE;
	}
}
</code></pre>

<br/>

실제로 위 코드의 컴파일 된 클래스를 터미널에서 javap 명령어를 통해 확인해보면 알 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-06-singleton-pattern-1.jpg" width="700" height="290" alt="TCP/IP와 OSI 7계층"/>

<div class="post_caption">"javap는 클래스 파일의 내부 기본 구조와 JVM의 바이너리 코드만 나오는 역어셈블 방법입니다.<br/>클래스를 원래 소스로 변환하는 역컴파일과는 다릅니다."</div>

<br/><br/>

> ## 정리해보자면

싱글톤의 장점은 서두에 언급한 것처럼 객체의 단일 생성을 통한 자원의 절약입니다.
또한 특정 객체를 공유하는 상황에서 효율적으로 이용할 수 있고요.

단점이라면 우선적으로 일단 자원을 소모하게 되어있고, 해제되는 시점을 알기 어렵습니다.
그리고 전역변수와 다를 것이 없는 문제가 있습니다. 어디서든 호출이 가능하기 때문이지요.

OOP(Object-Oriented Programming)의 컨셉과 맞지 않는 부분도 있습니다.
구조가 변경되는 경우 변경 영역이 많아질 수도 있기 때문입니다.

자바서에는 기본적으로 싱글톤으로 구현된 것도 있습니다.
<a href="https://docs.oracle.com/javase/7/docs/api/java/lang/Runtime.html" target="_blank">java.lang.Runtime</a>,
<a href="https://docs.oracle.com/javase/7/docs/api/java/awt/Desktop.html" target="_blank">java.awt.Desktop</a>

한편, OOP의 개념이 생기면서 객체 자체에 대한 많은 연구와 패턴이 생겨난 것인데,
싱글톤 패턴은 오히려 흔히 사용되면서도 지양해야하는 안티 패턴으로 인식되기도 합니다.
