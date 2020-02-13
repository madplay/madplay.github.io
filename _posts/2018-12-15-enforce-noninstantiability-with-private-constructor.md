---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 4. Enforce noninstantiability with a private constructor" 
category: Java
comments: true
---

# 모든 클래스들이 인스턴스화가 필요한 것은 아니다.

정적 메서드와 필드만을 담은 클래스는 쓸모 있습니다.
```java.lang.Math```, ```java.util.Array``` 처럼 기본 타입 값이나 배열에 관련된 메서드들을 모을 수 있고
```java.util.Collections``` 처럼 특정 인터페이스 구현 객체를 생성해주는 메서드를 모아놓을 수도 있습니다.

```final``` 클래스와 관련한 메서드를 모을 때도 마찬가지입니다. 이를 상속하여 하위 클래스에 메서드를 넣는 것이
불가능하기 때문입니다. 애초에 상속이 안되기도 하지요.

<br/>

# 인스턴스화를 막으려면?

아래와 같은 유틸리티성 클래스가 있다고 가정해봅시다. 인스턴스화가 필요하지 않다고 판단하여 아래와 같이
생성자를 정의하지 않았습니다. 클래스 내부에는 정적 메서드만 있고 클래스의 이름도 유틸리티 기능을 강조하기 위해
**Utility** 라고 정의했습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class DateUtility {
    private static String FULL_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";

    // 생성자 없음

    public static String convertDateToString(Date date) {
        return new SimpleDateFormat(FULL_DATE_FORMAT).format(date);
    }
}
</code></pre>

하지만 컴파일러는 생성자를 명시하지 않는 경우에 기본 생성자를 자동으로 만듭니다. 그리고 유틸성 클래스로
이름을 지었지만 다른 누군가는 인스턴스화를 할지도 모릅니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    // 이렇게 사용하길 기대했으나!
    DateUtility.convertDateToString(new Date());
    
    // 누군가는 이렇게 사용할 수도
    DateUtility dateUtility = new DateUtility();
    String formattedToday = dateUtility.convertDateToString(new Date());
}
</code></pre>

추상 클래스로 정의하는 것으로는 인스턴스화를 막을 수 없습니다. 클래스를 상속해서 하위 클래스를
인스턴스화할 수 있기 때문입니다. 

<pre class="line-numbers"><code class="language-java" data-start="1">abstract class DateUtility {
    // ...생략
}

class SubDateUtility extends DateUtility {
    // ...생략
}

public class PrivateConstructorTest {
    public static void main(String[] args) {
        // abstract 클래스는 인스턴스화 불가
        // DateUtility dateUtility = new DateUtility();

        // Okay!
        SubDateUtility subDateUtility = new SubDateUtility();
    }
}
</code></pre>

그러면 어떻게 해야할까요? 방법은 간단합니다. ```private 생성자```를 추가하면 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class DateUtility {
    private DateUtility() {
        /**
         * 클래스 내부에서도 호출이 안되도록 막는다.
         */
        throw new AssertionError();
    }

    // 생략
}

public class PrivateConstructorTest {
    public static void main(String[] args) {
        // DateUtility() has private access in DateUtility
        DateUtility dateUtility = new DateUtility();
    }
}
</code></pre>

```private 생성자``` 내부에서 ```Assertion Error```를 던지는 이유는 행여나 클래스 내부에서 실수로라도
생성자를 호출하는 것을 막기 위함입니다. 위 코드처럼 외부에 공개된 생성자가 없는 경우 상속도 불가능합니다.

참고 서적의 내용에서 조금 더 추가하면, 인자가 다른 ```public 생성자```가 존재하고 서브 클래스에서
이와 매핑되는 생성자를 선언한다면 기본 생성자가 ```private``` 일지라도 상속이 가능합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class DateUtility {
    private DateUtility() {
        throw new AssertionError();
    }

    public DateUtility(int val) {
        //
    }
}

class SubDateUtility extends DateUtility {
    public SubDateUtility(int val) {
        // 상위 클래스와 매핑되는 생성자 필요
        super(val);
    }
}
</code></pre>