---
layout:   post
title:    자바의 String 객체와 String 리터럴 
author:   Kimtaeng
tags: 	  Java String Literal Object
subtitle: 자바에서 문자열을 선언하는 방법에 차이가 있다.
category: Java
comments: true
---

<hr/>

> ## 문자열을 생성해보자. new String("Hello"); vs "Hello";

Java에서 문자열(String)을 선언하는 방법은 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">String str1 = new String("madplay");
String str2 = "madplay";
</code></pre>

첫번째는 <b>생성자인 new 연산자를 이용한 문자열 생성</b> 방식, 두번째는 <b>문자열 리터럴 생성</b> 방식인데,
겉으로 보았을 때의 문법 차이도 있지만 실제 메모리에 할당되는 영역에도 차이가 있습니다.

new 연산자를 통해 문자열 객체를 생성하는 경우 메모리의 ```Heap```영역에 할당되어지고
두 번째 방법인 리터럴을 이용한 경우에는 ```String Constant Pool``` 이라는 영역에 할당되어집니다. 

<br/><br/>

> ## 문자열을 비교해보자. equals vs == 

다음의 문자열을 비교하는 간단한 코드를 살펴봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
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
</code></pre>

<br/>

동일하게 'kimtaeng' 이라는 문자열을 선언하였는데 String의 eqauls 메서드로 비교한 경우는 true,
== 연산으로 비교한 경우는 false가 반환되었습니다. 이유가 뭘까요?

String의 eqauls 메서드를 조금 더 살펴보면 아래와 같습니다. 단순 문자열 값을 비교하게 되있지요.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
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
</code></pre>

반면에 == 연산의 경우 객체의 주소값을 비교합니다. 그렇기때문에 new 연산자를 통해 Heap 영역에 생성된
String과 리터럴을 이용해 String Constant Pool 영역에 위치한 String과의 주소값은 같을 수가 없지요.

<br/><br/>

> ## 왜 그럴까?

String의 equals와 == 연산의 차이에 대한 질문을 IT기업 면접문제에서 많이 봤던 것 같습니다. (요즘은 이런 질문은 출제도 안되는 듯한...)
그만큼 이 둘의 동작 방식에 대한 차이를 조금 더 명확하게 알야할 필요도 있겠지요.

문자열 리터럴의 경우 내부적으로 String의 intern 메서드를 호출하게 됩니다.Java API를 통해 메서드를 살펴보면

<pre class="line-numbers"><code class="language-java" data-start="1">/**
* Returns a canonical representation for the string object.
* &lt;p&gt;
* A pool of strings, initially empty, is maintained privately by the
* class &lt;code&gt;String&lt;/code&gt;.
* &lt;p&gt;
* When the intern method is invoked, if the pool already contains a
* string equal to this &lt;code&gt;String&lt;/code&gt; object as determined by
* the {@link #equals(Object)} method, then the string from the pool is
* returned. Otherwise, this &lt;code&gt;String&lt;/code&gt; object is added to the
* pool and a reference to this &lt;code&gt;String&lt;/code&gt; object is returned.
* &lt;p&gt;
* It follows that for any two strings &lt;code&gt;s&lt;/code&gt; and &lt;code&gt;t&lt;/code&gt;,
* &lt;code&gt;s.intern()&amp;nbsp;==&amp;nbsp;t.intern()&lt;/code&gt; is &lt;code&gt;true&lt;/code&gt;
* if and only if &lt;code&gt;s.equals(t)&lt;/code&gt; is &lt;code&gt;true&lt;/code&gt;.
* &lt;p&gt;
* All literal strings and string-valued constant expressions are
* interned. String literals are defined in section 3.10.5 of the
* &lt;cite&gt;The Java&amp;trade; Language Specification&lt;/cite&gt;.
*
* @return  a string that has the same contents as this string, but is
*          guaranteed to be from a pool of unique strings.
*/
public native String intern();
</code></pre>

<br/>

간단하게 요약해보자면 intern 메서드는 해당 문자열이 String Constant Pool에 이미 있는 경우에는
그 문자열의 주소값을 반환하고 없다면 새로 집어넣고 그 주소값을 반환합니다.

아래의 intern 메서드를 이용한 문자열을 비교하는 코드를 살펴봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
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
</code></pre>

기존에 new 연산자를 통해서 생성된 String 객체와 리터럴로 생성된 String 객체의 주소값을 비교하였을 때는
같지 않은 결과를 알 수 있었으나, new 연산자로 생성된 객체를 intern 메서드를 이용한 후 비교하는 경우에
리터럴로 생성된 객체와 주소값이 같아졌음을 알 수 있습니다. (15번 라인)

앞서 말한것처럼 "kimtaeng" 이라는 문자열이 String Constant Pool에 존재하는 지 확인하는 과정에서
이미 있으므로 동일한 주소값이 반환되었고 비교 연산 결과 주소값이 같게 된 것이지요. 

<br/><br/>

> ## Immutable 하다. 

문자열 리터럴도 상수로서 불변합니다. 이러한 특성때문에 참조하려는 문자열이 같다면 동일한 객체(상수풀)을 참조할 수 있습니다.
아래의 코드의 2번 라인을 new 연산자가 아닌 리터럴 방식으로 선언한다면 someLiteral과 동일한 객체를 참조하게 될 것입니다. 

<pre class="line-numbers"><code class="language-java" data-start="1">String someLiteral = "kimtaeng";
String someObject = new String("kimtaeng");

String weAreSameRef = "kimtaeng"; // someLiteral과 같은 객체 참조
</code></pre>

자바 언어가 담긴 자바 소스 파일(.java)이 클래스 파일(.class)로 컴파일되고 JVM(Java Virtual Machine)에 로드(load)될 때,
JVM은 String Constant Pool에 동일한 문자열(위 코드에서는 kimtaeng)이 있는지 확인을 하고 이미 존재한다면 재사용을 하고
없는 경우에는 새로운 문자열을 만들게 됩니다. 이러한 관점에서 여러 레퍼런스가 같은 문자열 리터럴을 참조하더라도
서로 영향이 없도록 Immutable 해야할 것 같습니다.

<br/><br/>

> ## Spring Constant Pool

상수풀(Spring Constant Pool)의 위치는 ```Java 7``` 부터 ```Perm```영역에서 ```Heap``` 영역으로 옮겨졌습니다.
Perm영역은 실행시간(Runtime)에 가변적으로 변경할 수 없는 고정된 사이즈이기 때문에 intern 메서드의 호출은
저장할 공간이 부족하게 만들 수 있었습니다. 즉 OOM(Out Of Memory) 문제가 발생할 수 있었지요.
Heap 영역으로 변경된 이후에는 상수풀에 들어간 문자열도 Garbage Collection 대상이 됩니다. 
 
<a href="https://bugs.java.com/view_bug.do?bug_id=6962931" target="_blank">관련 링크) JDK-6962931 : move interned strings out of the perm gen(Oracle Java Bug Database)</a><br/>

번외로 ```Java 7```버전에서 상수풀의 위치가 Perm영역(정확히 말하면 Permanent Generation)에서 Heap으로 옮겨지고 ```Java 8``` 버전에서는
Perm영역은 완전히 사라지고 이를 MetaSpace라는 영역이 대신하고 있습니다. 이부분은 이어지는 포스팅에서 살펴보는 걸로...