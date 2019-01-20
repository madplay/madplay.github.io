---
layout:   post
title:    자바 제네릭 
author:   Kimtaeng
tags: 	  java generic generic-class generic-interface generic-method
subtitle: 자바의 제네릭(Generic)과 클래스, 인터페이스 그리고 메서드에 적용하는 방법에 대해서 알아봅시다.  
category: Java
comments: true
---

<hr/>

> ## 제네릭

제네릭(Generic) 이란 ```Java 5```에 추가된 스펙입니다. 다양한 타입을 다룰 수 있는 메서드 또는 컬렉션 클래스를
컴파일 타임에 타입 체크(Type Check)할 수가 있어 특정 타입에 얽매이지 않고 개발을 할 수 있도록 도움을 줍니다.
쉽게 말하면 특정 클래스 내부에서 사용할 타입을 인스턴스를 생성할 시점에 확정 짓는 것이라고 말할 수 있겠네요. 
 
여러 방면으로 많은 도움을 주지만 개인적으로는 자바를 공부할 때 어렵다는 느낌을 주는... 그 중에서도 손에 꼽는 내용인 것 같습니다.
그래서 이번 글에서는 자바의 제네릭과 클래스, 메서드 등에서 사용하는 방법 그리고 장점에 대해서 정리합니다.

<br/><br/>

> ## 제네릭 클래스

제네릭 클래스를 선언하는 방법은 기존의 클래스나 인터페이스를 선언하는 방법과 매우 유사합니다.
다른 점이라면 ```타입 매개변수 T```를 선언한다는 것인데요. 코드로 확인해보면 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class MadPlay&lt;T> {
    private T val; // 멤버 변수 val의 타입은 T 이다.

    public T getVal() {
        // T 타입의 값 val을 반환한다.
        return val;
    }

    public void setVal(T val) {
        // T 타입의 값을 멤버 변수 val에 대입한다.
        this.val = val;
    }
}
</code></pre>

생각보다 간단합니다. 이어서 제네릭 클래스의 레퍼런스 변수를 선언할 때는 아래와 같이 타입 매개변수에
구체적인 타입을 명시하면 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    MadPlay&lt;String> stringObject;
    MadPlay&lt;Integer> integerObject;
}
</code></pre>

이제 **구체화(Specialization)**를 해야합니다. 이는 제네릭 타입을 가진 제네릭 클래스에 구체적인 타입을 대입하여
구체적인 행위를 할 수 있는 객체를 생성하는 과정을 말합니다. 그렇다면, 제네릭 클래스를 이용하여 객체를 생성해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    MadPlay&lt;String> stringObject = new MadPlay&lt;>();
    stringObject.setVal("Hello, MadPlay!");

    // Hello, MadPlay! 출력
    System.out.println(stringObject.getVal());

    MadPlay&lt;Integer> integerObject = new MadPlay&lt;>();
    integerObject.setVal(29);
    
    // 29 출력
    System.out.println(integerObject.getVal());
}
</code></pre>

위 코드에서 String 타입으로 구체화된 객체 stringObject의 모습을 그림으로 보면 아래와 같습니다.


<img class="post_image" src="{{ site.baseurl }}/img/post/2018-12-13-java-generic-1.png" width="600" height="400" alt="generic class with string"/>

<br/><br/>

> ## 제네릭 인터페이스

인터페이스에도 제네릭을 적용할 수 있습니다. 제네릭 인터페이스를 선언하고 이를 구현하는 제네릭 클래스는
아래와 같이 작성할 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">interface MadLife&lt;T> {
    void addElement(T t, int index);
    T getElement(int index);
}

class MadPlay&lt;T> implements MadLife&lt;T> {
    private T[] array;

    public MadPlay() {
        array = (T[]) new Object[10];
    }

    @Override public void addElement(T element, int index) {
        array[index] = element;
    }

    @Override public T getElement(int index) {
        return array[index];
    }
}

public class GenericTest {
    public static void main(String[] args) {
        MadPlay&lt;String> strObject = new MadPlay<>();
        strObject.addElement("Hello", 0);
        strObject.getElement(0);
        
        // 컴파일 시점 오류! String으로 이미 구체화된 상태이므로
        strObject.addElement(1, 1);
    }
}
</code></pre>

참고로 우리가 ```String``` 정렬을 할 때 사용하는 ```compareTo```와 같은 메서드는 ```Comparable``` 인터페이스의 추상 메서드인데요.
이 Comparable 인터페이스의 코드를 보면 아래와 같이 제네릭으로 구현되어 있습니다. 따라서 이를 ```implements``` 하는 타입은
값 비교를 통한 정렬을 간편하게 사용할 수 있지요.

<pre class="line-numbers"><code class="language-java" data-start="1">public interface Comparable&lt;T> {
    // ... 생략
    public int compareTo(T o);
}
</code></pre>

<br/><br/>

> ## 제네릭 메서드

메서드 단위에만 제네릭을 적용할 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class MadPlay {
    public static &lt;T> void arrayToStack(T[] arr, Stack&lt;T> stack) {
        // 만일 위 2개의 타입이 다르면 컴파일 오류
        for (T element : arr) {
            stack.push(element);
        }
        // 사실 아래 방법을ㅎ
        stack.addAll(Arrays.asList(arr));
    }
}

public class GenericTest {
    public static void main(String[] args) {
        String[] array = new String[10];
        Stack&lt;String> stack = new Stack&lt;>();

        // 타입 매개변수 T를 String 으로 유추
        MadPlay.arrayToStack(array, stack);
    }
}
</code></pre>

<br/><br/>

> ## 제네릭 사용시 주의할 점은?

제네릭은 클래스와 인터페이스만 적용되기 때문에 자바 **기본 타입(Primitive Type)은 사용할 수 없습니다.**
<a href="https://madplay.github.io/post/java-data-type" target="_blank" rel="nofollow">(관련 링크 : 자바의 데이터 타입)</a> 


<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    List&lt;int> intList = new List&lt;>(); // 기본 타입 int는 사용 불가
    List&lt;Integer> integerList = new List&lt;>(); // Okay!
}
</code></pre>

또한 제네릭 타입을 사용하여 객체를 생성하는 것은 불가능합니다. 즉, 제네릭 타입의 객체는 생성이 불가능합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    // Type parameter 'T' cannot be instantiated directly
    T t = new T();
    return t;
}
</code></pre>

그리고 제네릭에서는 배열에 대한 제한을 두고 있습니다. 제네릭 클래스 또는 인터페이스 타입의 배열을 선언할 수 없습니다.
하지만 제네릭 타입의 배열 선언은 허용됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    // generic array creation
    // (자바 8이전) Cannot create a generic array of MadPlay&lt;Integer&gt;
    MadPlay&lt;Integer&gt;[] arr1 = new MadPlay&lt;&gt;[10];
    
    MadPlay&lt;Integer&gt;[] arr2 = new MadPlay[10]; // Okay!
}
</code></pre>

<br/><br/>

> ## 제네릭이 왜 좋을까?

우선 **컴파일 타임에 타입을 체크**하기 때문에 객체 자체의 타입 안전성을 높일 수 있습니다.
개발자가 의도하지 않은 타입의 객체가 저장되는 것을 방지할 수 있고 저장한 객체를 다시 가져올 때 기존 타입과
다른 타입으로 캐스팅되어 발생하는 오류(ClassCastException)를 줄일 수 있습니다.

**형 변환(Type Casting)의 번거로움**을 줄일 수 있습니다. 아래의 코드를 볼까요?
제네릭없이 최상위 객체 Object를 사용한다면 아래와 같이 코드를 작성할 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class MadPlay {
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
</code></pre>

하지만 여기서 제네릭을 사용하면 타입 캐스팅을 하지 않아도 됩니다. 변환하여 사용할 객체의 타입을 사전에 명시하므로서
타입 캐스팅의 수고를 줄일 수 있습니다. 

<pre class="line-numbers"><code class="language-java" data-start="1">class GenericMadPlay&lt;T> {
    private T obj;

    public GenericMadPlay(T obj) { this.obj = obj; }
    public T getObj() { return obj; }
}

class GenericTester {
    public void executeMethod() {
        GenericMadPlay&lt;String> genericInstance1 = new GenericMadPlay&lt;>("Hello");
        GenericMadPlay&lt;Integer> genericInstance2 = new GenericMadPlay&lt;>(123);
        GenericMadPlay&lt;Character> genericInstance3 = new GenericMadPlay&lt;>('a');

        String genericObj1 = genericInstance1.getObj();
        Integer genericObj2 = genericInstance2.getObj();
        Character genericObj3 = genericInstance3.getObj();
    }
}
</code></pre>

타입을 지정하지 않으면 최상위 Object 객체 타입으로 정의되므로 다양한 종류의 타입을 다뤄야하는 메서드의 매개변수에
Object 타입을 사용하고(첫 번째 예제 코드에서의 생성자) 그로 인한 타입 캐스팅이 불가피했지만
두 번째 코드를 보면 알 수 있듯이 제네릭을 사용하면 원하는 타입을 사전에 지정하기만 하면 됩니다.

끝으로 이번 글에서 타입 매개변수의 이름을 ```T```로 지정했으나, 사실 아무 이름이나 가능합니다.
```MadPlay<Kimtaeng>``` 이런식도 가능하지요. 하지만 아래와 같이 **컨벤션(Convention)**이 있습니다. 다른 개발자가 보았을 때
조금 더 쉽게 이해할 수 있도록 지키는 것이 좋을 것 같습니다.

- E(Element) : 요소, 예를 들어 ```List<E>```
- K(Key) : 키, 예를 들어 ```Map<K, V>```
- N(Number) : 숫자
- T(Type) : 타입 
- V(Value) : 리턴 값 또는 매핑된 값
- S, U, V : 2번째, 3번째 그리고 4번째에 선언된 타입