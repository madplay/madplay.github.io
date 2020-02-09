---
layout:   post
title:    자바의 숫자 표현과 언더스코어(_)
author:   Kimtaeng
tags: 	  java
description: 자바7 부터는 숫자 리터럴에 언더스코어(또는 언더바)를 사용하여 가독성을 높일 수 있습니다.
category: Java
comments: true
---

# 자바에서의 숫자 표현 

자바 언어에서의 숫자 표현은 다른 언어들과 특별히 다른 것은 없습니다.
물론 실수형 데이터의 표현에서 명시적인 float형임을 선언하기 위해 ```2.4F```와 같이 suffix를 추가하는 것과
정수형의 표현에서도 기본 int 타입보다 더 넓은 범위의 정수 표현을 위해 ```정수값 뒤에 L``` 이라는 접미사(suffix)를 추가하는 것을
제외하면 말이지요.

<pre class="line-numbers"><code class="language-java" data-start="1">public class TestClass {
    public void someMethod() {
        // int: -2147483648 ~ 2147483647

        // compile error: integer number to large
        long value1 = 2147483648;

        // Okay!
        long value2 = 2147483648L;
    }
}
</code></pre>

정수형 int의 기본 데이터 범위는 ```-2147483648 ~ 2147483647``` 입니다. 해당 값을 넘게되면 오버 플로우가 발생하게 되지요.
참고로 long의 경우는 ```-9223372036854775808 ~ 9223372036854775807``` 입니다. 

그런데 위의 코드에서 int 형의 최댓값보다 1이 더 큰 정수를 long 타입 변수에 담았으나 컴파일 오류가 발생합니다.
변수는 long 타입이지만 변수에 대입되는 숫자 리터럴이 여전히 int 타입이기 때문이지요. 따라서 두 번째 경우처럼 suffix를 추가하여
long형 타입인 것을 명시적으로 선언해주어야 합니다.


<br/>

# 너무 큰 숫자가 읽기 힘들다

자바7 버전부터는 숫자를 사용할 때 ```_``` 기호인 언더스코어(또는 언더바)를 사용할 수 있습니다.
흔히 은행에서 금액을 표기할 때 볼 수 있는 세자리 콤마와 같은 형태로 사용할 수 있지요.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    // 훨씬 더 읽기 편한 것 같다.
    long valueWithUnderscore = 2_147_483_648L;
}
</code></pre>

하지만 언더스코어를 아무 곳에서나 쓸 수 없습니다. **무조건 숫자 사이에만 위치**할 수 있습니다.
예시로 몇가지 살펴보면 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    long value1 = 2_147_483_648L; // 2147483648
    System.out.println(value1);

    int value2 = 3_2; // 32
    System.out.println(value2);

    int value3 = 2____4; // 24
    System.out.println(value3);

    long value4 = 2_222_L; // Error! 숫자 사이에만 가능

    float value5 = _24F; // Error! 변수로 인식됩니다.
}
</code></pre>

참고로 언더스코어가 가장 앞에 등장하는 경우 변수의 이름으로 인식될 수 있습니다. 그리고 앞서 소개드린 것처럼 
**자바7 버전부터 사용이 가능**합니다. 혼동될 수도 있겠지만 이전보다 큰 수를 읽기에는 더 편한 것 같습니다.

<a href="https://docs.oracle.com/javase/7/docs/technotes/guides/language/underscores-literals.html"
rel="nofollow" target="_blank">Oracle Java Docs: Underscores in Numeric Literals(참고링크)
</a>