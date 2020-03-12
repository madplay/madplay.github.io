---
layout:   post
title:    자바의 String 객체와 String 리터럴
author:   Kimtaeng
tags: 	  Java String Literal Object
description: 자바에서 문자열을 선언하는 방법은 두 가지가 있다. String과 new String()은 어떤 차이가 있을까?
category: Java
comments: true
---

# 문자열을 생성해보자. new String("Hello"); vs "Hello";
Java에서 문자열(String)을 선언하는 방법은 아래와 같다.

```java
String str1 = new String("madplay");
String str2 = "madplay";
```

첫 번째는 **생성자인 new 연산자를 이용한 문자열 생성** 방식, 두 번째는 **문자열 리터럴 생성** 방식인데,
겉으로 보았을 때의 문법 차이도 있지만 실제 메모리에 할당되는 영역에도 차이가 있다.

`new` 연산자를 통해 문자열 객체를 생성하는 경우 메모리의 `Heap` 영역에 할당되고
두 번째 방법인 리터럴을 이용한 경우에는 `String Constant Pool`이라는 영역에 할당된다.
> 참고로 문자열이 담기는 상수풀의 위치는 자바 7부터 `Heap` 영역으로 옮겨졌다.

아래와 같이 문자열을 선언해보자.

```java
String str1 = "madplay";
String str2 = "madplay";
String str3 = new String("madplay");
String str4 = new String("madplay");
str1 = str2;

// ... 생략
```

자바 힙(heap) 영역에 매핑해본다면 아래와 같은 모습으로 그려볼 수 있다. 상수풀에 생성된 문자열의 경우 하나만 존재하게 된다.
따라서 str1, str2는 같은 문자열을 참조하게 된다. 

반대로 `heap` 영역에 객체를 생성한 경우 각각의 인스턴스가 생성되기 때문에 str3, str4는 각각 다른 문자열을 참조한다.

<img class="post_image" width="450"  alt="java heap space"
src="{{ site.baseurl }}/img/post/2018-05-12-java-string-literal-vs-string-object-1.png"/>

<br><br>

# 문자열을 비교해보자. equals vs == 
다음의 문자열을 비교하는 간단한 코드를 살펴보자.

```java
/**
 * Compare String.
 *
 * @author kimtaeng
 * created on 2018. 5. 12.
 */
 
public class MadPlay {
    public static void main(String[] args) {
        String someLiteral = "kimtaeng";
        String someObject = new String("kimtaeng");
        
        System.out.println(someLiteral.equals(someObject)); // print 'true'
        System.out.println(someLiteral == someObject); // print 'false'
    }
}
```

<br><br>

동일하게 'kimtaeng'이라는 문자열을 선언하였는데 String의 eqauls 메서드로 비교한 경우는 true,
`==` 연산으로 비교한 경우는 false가 반환된다. 이유가 뭘까?

String의 eqauls 메서드를 조금 더 자세히 살펴보자. 단순하게 문자열의 값을 비교한다.

```java
/**
 * Compares this string to the specified object.  The result is {@code
 * true} if and only if the argument is not {@code null} and is a {@code
 * String} object that represents the same sequence of characters as this
 * object.
 *
 * @param  anObject
 *         The object to compare this {@code String} against
 *
 * @return  {@code true} if the given object represents a {@code String}
 *          equivalent to this string, {@code false} otherwise
 *
 * @see  #compareTo(String)
 * @see  #equalsIgnoreCase(String)
 */
public boolean equals(Object anObject) {
    if (this == anObject) {
        return true;
    }
    if (anObject instanceof String) {
        String anotherString = (String) anObject;
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

반면에 `== 연산`의 경우 객체의 주소값을 비교한다. 그렇기 때문에 `new 연산자`**를 통해 Heap 영역에 생성된 String**과
**리터럴을 이용해 String Constant Pool 영역에 위치한 String**의 주소값은 같을 수가 없다.

<br><br>

# 왜 그럴까?
String의 **equals와 == 연산의 차이**에 대한 질문은 IT기업 면접 문제에서 많이 출제된 것 같다. (요즘은 이런 질문은 나오지도 않는 듯...)
그만큼 동작 방식에 대한 차이를 조금 더 명확하게 알아할 필요도 있다.

문자열 리터럴의 경우 내부적으로 String의 `intern` 메서드를 호출하게 된다. Java API를 통해 메서드를 살펴보면

```java
/**
* Returns a canonical representation for the string object.
* <p>
* A pool of strings, initially empty, is maintained privately by the
* class <code>String</code>.
* <p>
* When the intern method is invoked, if the pool already contains a
* string equal to this <code>String</code> object as determined by
* the {@link #equals(Object)} method, then the string from the pool is`
* returned. Otherwise, this <code>String</code> object is added to the
* pool and a reference to this <code>String</code> object is returned.
* <p>
* It follows that for any two strings <code>s</code> and <code>t</code>,
* <code>s.intern() == t.intern()</code> is <code>true</code>
* if and only if <code>s.equals(t)</code> is <code>true</code>.
* <p>
* All literal strings and string-valued constant expressions are
* interned. String literals are defined in section 3.10.5 of the
* <cite>The Java&trade; Language Specification</cite>.
*
* @return  a string that has the same contents as this string, but is
*          guaranteed to be from a pool of unique strings.
*/
public native String intern();
```

<br><br>

간단하게 요약해보면 intern 메서드는 해당 문자열이 String Constant Pool에 이미 있는 경우에는
그 문자열의 주소값을 반환하고 없다면 새로 집어넣고 그 주소값을 반환한다.

아래의 `intern` 메서드를 이용한 문자열을 비교하는 코드를 살펴보자.

```java
/**
 * Compare String with intern method.
 *
 * @author kimtaeng
 * created on 2018. 5. 12.
 */
public class MadPlay {
    public static void main(String[] args) {
        String someLiteral = "kimtaeng";
        String someObject = new String("kimtaeng");
        String internResult = someObject.intern();
        
        System.out.println(someLiteral.equals(someObject)); // print 'true'
        System.out.println(someLiteral == internResult); // print 'true'
    }
}
```

기존에 `new`연산자를 통해서 생성된 String 객체와 `리터럴`로 생성된 String 객체의 주소값을 비교하였을 때는 같지 않다는 결과를
알 수 있었으나, `new`연산자로 생성된 객체를 intern 메서드를 이용한 후 비교하는 경우에 `리터럴`로 생성된 객체와 주소값이 같음을 알 수 있다.

<img class="post_image" width="450"  alt="java heap space"
src="{{ site.baseurl }}/img/post/2018-05-12-java-string-literal-vs-string-object-2.png"/>

앞서 말한 것처럼 'kimtaeng' 이라는 문자열이 String Constant Pool에 존재하는지 확인하는 과정에서
문자열이 이미 존재하기 때문에 동일한 주소값이 반환되었고 비교 연산 결과 주소값이 같게 된 것이다.

<br><br>

# Immutable 하다. 
문자열 리터럴도 상수로서 불변이다. 이러한 특성 때문에 참조하려는 문자열이 같다면 동일한 객체(상수풀)을 참조할 수 있다.
아래의 코드에서 someObject를 new 연산자가 아닌 리터럴 방식으로 선언한다면 someLiteral과 동일한 객체를 참조하게 될 것이다.

```java
String someLiteral = "kimtaeng";
String someObject = new String("kimtaeng");

String weAreSameRef = "kimtaeng"; // someLiteral과 같은 객체 참조
```

자바 언어가 담긴 자바 소스 파일(.java)이 클래스 파일(.class)로 컴파일되고 JVM(Java Virtual Machine)에 로드(load) 될 때,
JVM은 String Constant Pool에 동일한 문자열(위 코드에서는 kimtaeng)이 있는지 확인하고 이미 존재한다면 재사용을 하고 없는 경우에는
새로운 문자열을 만든다.

이러한 관점에서 여러 레퍼런스가 같은 문자열 리터럴을 참조하더라도 서로 영향이 없도록 `불변(immutable)` 해야 하는데
다행히 `thread-safe` 하기 때문에 멀티 스레드 환경에서 공유하여 사용할 수 있다.

<br><br>

# String의 최적화
불변인 `String`을 가지고 연산을 할 때는 고려할 부분이 있다. 문자열을 `+ 연산자` 등을 이용하여 다른 문자열을 추가할 때는,
기존 문자열에 새롭게 문자열이 추가되는 것이 아니라, 새로운 문자열 객체를 만들고 그 객체를 참조하도록 한다.

따라서 기존 문자열은 레퍼런스 참조가 사라져 **가비지 컬렉터(Garbage Collector)**의 수집 대상이 된다.
하지만 자바 5버전부터는 `String`의 연산 과정이 조금 달라졌다. 내부적으로 `StringBuilder`를 사용하게 변경되었다.

- <a href="/post/difference-between-string-stringbuilder-and-stringbuffer-in-java" target="_blank">
더 상세한 내용은 링크 참고: "자바 String, StringBuilder 그리고 StringBuffer 성능 차이 비교"</a>

<br><br>

# Spring Constant Pool
상수풀(String Constant Pool)의 위치는 `Java 7`부터 `Perm` 영역에서 `Heap` 영역으로 옮겨졌다.
Perm 영역은 실행 시간(Runtime)에 가변적으로 변경할 수 없는 고정된 사이즈이기 때문에 intern 메서드의 호출은
저장할 공간이 부족하게 만들 수 있었다. 즉 OOM(Out Of Memory) 문제가 발생할 수 있는 위험이 있었던 것이다.

Heap 영역으로 변경된 이후에는 상수풀에 들어간 문자열도 Garbage Collection 대상이 된다. 
 
<a href="https://bugs.java.com/view_bug.do?bug_id=6962931" rel="nofollow" target="_blank">
관련 링크) JDK-6962931 : move interned strings out of the perm gen(Oracle Java Bug Database)</a>

`Java 7`버전에서 상수풀의 위치가 Perm 영역(정확히 풀어서 써보면 Permanent Generation)에서 Heap으로 옮겨지고
이후에 `Java 8` 버전에서는 Perm 영역은 완전히 사라지고 이를 MetaSpace라는 영역이 대신하고 있다.