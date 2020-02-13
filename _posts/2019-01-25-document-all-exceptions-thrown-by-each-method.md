---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 74. 메서드가 던지는 모든 예외를 문서화하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 74. Document all exceptions thrown by each method" 
category: Java
comments: true
---

# 메서드가 던지는 예외

메서드가 던지는 예외(Exception)는 그 메서드를 올바르게 사용하도록 하는 중요한 정보가 됩니다.
따라서 각 메서드가 던지는 예외는 왠만하면 문서화를 해야하며 이에 충분한 시간을 투자해야 합니다.

여기서 개발자가 만날 수 있는 오류(Error)와 예외(Exception)에 대한 구분이 필요합니다.
오류의 경우는 시스템적으로 정상적이지 않은 상황을 말합니다. 개발자가 개발하는 애플리케이션 레벨이 아닌
더 낮은(low) 시스템 레벨에서 발생하기 때문에 개발자가 미리 예측하여 처리하기가 어렵습니다.

반면에 예외(Exception)의 경우는 개발자가 구현한 로직의 코드에서 발생할 수 있습니다.
그러니까 개발자가 이를 예측하고 미리 대응할 수 있지요. 즉 개발자가 직접 처리할 수 있기때문에
예외를 구분하고 그에 따른 처리 방법을 명확히하는 것이 중요합니다.

<br/>

# 그러면 어떻게 문서화할까?

**검사 예외(checked exception)**의 경우는 항상 따로 하나씩 선언하고 각 예외가 발생하는 상황을 javadoc의
```@throws``` 태그를 사용하여 정확하게 문서화해야 합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * blah blah...
 *
 * @param fileName
 * @throws IOException
 */
public void someMethod(String fileName) {
    try (BufferedReader br = new BufferedReader(new FileReader(fileName))) {
    } catch (IOException e) {
        // exception handling
    }
}
</code></pre>

검사 예외의 경우도 공통적인 상위 클래스 하나로 퉁쳐서 선언하는 것은 좋지 않습니다. 예를 들어서 ```Exception```을 던진다는
것을 말하는데 이런 경우에는 코드를 사용하는 입장에서 대처해야 하는 예외에 대한 힌트를 주지 않는 것과 같습니다.
하지만 예외적으로 ```main``` 메서드에서는 괜찮습니다. 오직 JVM(Java Virtual Machine)만이 호출할 수 있는 메서드이기 때문이지요.

**비검사 예외(unchecked exception)**의 경우도 문서화를 진행하면 좋습니다. 일반적으로 프로그래밍 오류를 뜻하는데 발생할 수 있는
오류를 명시하면 자연스럽게 해당 오류가 발생하지 않도록 개발할 수 있습니다.

아래 예제에서 보이는 숫자 리터럴의 언더스코어(_)에 관해서는 아래 링크를 참고하세요. 
<a href="/post/underscores-in-numeric-literals" target="_blank">(링크: 자바의 숫자 표현과 언더스코어)</a>

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * blah blah...
 *
 * @param divisor
 * @throws ArithmeticException
 *     Exception may occur when divisor is zero    
 */
public int someMethod(int divisor) {
    try {
        // 피제수(dividend)
        int dividend = 2_147_483_647;

        // 몫(quotient)
        int quotient = dividend / divisor;
        return quotient;

    } catch (ArithmeticException e) {
        // divisor(제수)가 0인 경우
    }
} 
</code></pre>

하지만 참고 서적에서는 비검사 예외는 메서드의 ```throws 선언``` 에는 넣지 않는 것을 권장합니다.
javadoc 유틸리티에서는 메서드 선언의 throws 절에 등장하고 메서드 주석의 ```@throws``` 태그에도 명시된 예외와
```@throws``` 태그에만 명시된 예외를 시각적으로 구분하기 때문입니다.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * blah blah...
 *
 * @param divisor
 * @throws ArithmeticException
 *     Exception may occur when divisor is zero    
 */
public int someMethod(int divisor) throws ArithmeticException {
    // throws 선언에는 제외하는 것을 권장한다.
}
</code></pre>

비검사 예외가 현실적으로 모두 문서화가 안될 때도 있습니다. 클래스를 수정하면서 새로운 비검사 예외(unchecked exception)을 던져도
호환성이 유지되기 때문인데요. 예를 들어서 외부 클래스를 사용하는 메서드가 있을 때, 그 외부 클래스가 다른 예외를 던지도록 수정된다면
아무 수정도 하지 않은 기존 메서드는 javadoc 문서에 언급되지도 않은 새로운 예외를 던지게 될 것입니다.

특정 클래스에 대부분의 메서드가 같은 이유로 모두 동일한 예외를 던진다면 그 예외에 대한 설명을 클래스에 추가해도 좋습니다.
실제로 구현해보면 아래와 같은 모습과 같겠네요.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
 * blah... blah...
 *
 * @throws NullPointerException
 *     All methods throw an exception if the argument is null.
 */
public class TestClass {

    /**
     * @param paramObj
     */
    public void someMethod1(Object paramObj) {
        if(paramObj == null) {
            throw new NullPointerException();
        }
        // ...
    }

    /**
     * @param paramObj
     */
    public void someMethod2(Object paramObj) {
        if(paramObj == null) {
            throw new NullPointerException();
        }
        // ...
    }
}
</code></pre>