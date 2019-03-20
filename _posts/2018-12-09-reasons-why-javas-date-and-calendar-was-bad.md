---
layout:   post
title:    Java Date와 Time 클래스를 사용하면 안되는 이유
author:   Kimtaeng
tags: 	  java date calendar
subtitle: 자바에서 기본적으로 제공하는 Date와 Calendar를 사용하면 안되는 이유는 무엇일까? 
category: Java
comments: true
---

<hr/>

> ## 자바의 Date API

자바에서는 기본적으로 날짜와 시간을 계산하는 많은 클래스를 제공합니다. 오랫동안 제공된 ```JDK 1.0의 java.util.Date```와
```JDK 1.1 이후의 java.util.Calendar``` 클래스를 비롯해서 JDK 8부터 제공되기 시작한 ```java.time``` 패키지에는
```ZonedDateTime```과 ```LocalDateTime``` 등 조금 더 개선된 날짜와 시간 관련 클래스를 제공합니다.

하지만 ```Date```와 ```Calendar``` 클래스에는 생각보다 많은 문제점이 있습니다. 이를 알아봅시다.

<br/><br/>

> ## 그래도 사용해보기

기본적으로 제공되어서 그런지 Date와 Calendar 클래스를 많이 이용했던 것 같습니다. 하지만 자바 버전업이 되면서 Date 클래스의
많은 메서드가 Deprecate 되었습니다. 그래도 기존 방식을 이용하여 오늘 날짜를 포맷에 맞추어 출력하는 코드는 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">import java.text.SimpleDateFormat;
import java.util.Date;

public class JavaDateTest {
    public static void main(String[] args) {
        Calendar cal = Calendar.getInstance();
        Date date = cal.getTime();
        String dateString = new SimpleDateFormat("yyyy-MM-dd").format(date);
        // 2018-12-09
        System.out.println(dateString);

        // 1일 더한다.
        cal.add(Calendar.DATE, 1);
        date = cal.getTime();
        dateString = new SimpleDateFormat("yyyy-MM-dd").format(date);

        // 2018-12-10
        System.out.println(dateString);
    }
}
</code></pre>

간단하긴 합니다. ```Date```를 반환하는 메서드가 ```getTime```인 모호함으로 반환 타입 예측이 불가능하다는 것만 빼면 말이지요.

<br/><br/>

> ## 애매한 상수의 이용

메서드의 이름으로 반환 타입을 예측하지 못하는 것처럼 개발자가 혼란을 일으킬 수 있는 부분은 생각보다 많습니다.

우선 위의 코드에서 본 것처럼 1일을 더하기 위한 **날짜 연산은 컴파일 시점에서 오류를 확인할 수 없습니다.**

예를 들어 아래와 같이 기대한 입력과 다른 입력을 주어도 확인할 방법이 없습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">Calendar cal = Calendar.getInstance();

// 월요일 하루를 더하자는 걸까?
cal.add(Calendar.MONDAY, 1);
</code></pre>

<br/><br/>

> ## 월(Month) 계산

그리고 참 혼동스러운 **월(Month) 지정**이 있습니다. ```Calendar``` 클래스의 월 표기를 위한 상수 값을 확인해보면
아래와 같습니다.  

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * Value of the {@link #MONTH} field indicating the
 * first month of the year in the Gregorian and Julian calendars.
 */
public final static int JANUARY = 0;

/**
 * Value of the {@link #MONTH} field indicating the
 * second month of the year in the Gregorian and Julian calendars.
 */
public final static int FEBRUARY = 1;

/**
 * Value of the {@link #MONTH} field indicating the
 * third month of the year in the Gregorian and Julian calendars.
 */
public final static int MARCH = 2;
</code></pre>

그러니까 2월을 지정하려면 월(Month) 값에서 1을 빼야하는 것이지요. 상수를 사용하지 않는다면 아래와 같이 가독성을 위해
-1을 일부러 쓰는 것도 나쁘지 않을 것 같습니다만... 혼란스럽습니다.

<br/><br/>

> ## 심지어 하위 클래스에도...

그런데 이러한 문제가 있는 클래스를 상속한 클래스도 있습니다. ```java.sql.TimeStamp``` 클래스인데요.
```java.util.Date``` 클래스에 나노 초 단위 필드를 더한 클래스입니다. ```equals 메서드``` 재정의를 어긴 것인데,
자세한 내용은 아래 링크를 참조하시기 바랍니다.

<a href="/post/obey-the-general-contract-when-overriding-equals" target="_blank">
이펙티브 자바 10: equals는 일반 규약을 지켜 재정의하라(링크)</a>

<br/><br/>

> ## 불변이 아니다

<pre class="line-numbers"><code class="language-java" data-start="1">Calendar cal = Calendar.getInstance();
cal.set(Calendar.MONTH, 2 - 1);
</code></pre>

위 코드에서 볼 수 있듯이 자바의 기본 날짜 관련 클래스는 **불변(immutable)** 객체가 아닙니다.
```Date```나 ```Calendar``` 객체가 다른 코드에서도 공유하여 사용한다면 한 쪽에서 변경한 날짜값이 다른 부분에 영향을 줄 수 있습니다.

한편 **날짜 단위 계산**처럼 ```Date``` 클래스만으로 수행이 깔끔하게 되지 않아 ```Calendar``` 객체를 생성하고
그 객체에서 ```Date``` 객체를 생성하고 있습니다. 어떻게 보면 기본적으로 제공하는 클래스보다 ```Apache Commons``` 라이브러리의
```DateUtils```를 사용하는 것이 더 나을지도 모르겠습니다.

<br/><br/>

> ## 그럼 어떻게 해야할까?

다행히도 JDK 8 부터는 보다 안전하고 간편한 날짜 관련 클래스가 제공됩니다.
<a href="/post/java8-date-and-time" target="_blank">
" 이어지는 글 : Java 8 날짜와 시간 계산(링크) "</a> 에서 예제를 통해 사용법을 알아봅시다.



