---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 17. 변경 가능성을 최소화하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 17. Minimize mutability" 
category: Java
comments: true
---

# 불변 클래스
불변(immutable)이라는 개념을 클래스에 적용하려면 그 클래스 정보로 생성된 인스턴스의 내부 값들은 생성된 후에는
수정할 수 없어야 합니다. 그러니까 불변 인스턴스의 정보는 객체가 소멸되기 전까지 달라져서는 안됩니다.

클래스로 불변으로 설계하는 데는 여러 가지 장점이 따릅니다. 오류가 생길 가능성도 적고 훨씬 안전합니다.

<br/>

# 불변 클래스를 만드는 규칙
- 객체의 상태를 변경하는 메서드를 제공하지 않는다.
  - 예를 들면 수정자(setter) 메서드처럼 멤버의 필드도 수정해서는 안됩니다.
- 클래스를 확장할 수 없도록 한다.
  - 하위 클래스에서의 의도치 않은 객체의 상태를 변경을 막아야 합니다.
- 모든 필드를 final로 선언한다.
  - 코드 작성자의 의도를 명확하게 드러낼 수 있는 방법 
  - 멀티 스레드 환경에서도 문제없이 동작하게 보장하는 데도 필요합니다.
- 모든 필드를 private으로 선언한다.
  - 클라이언트에서 직접 멤버에 접근하여 수정하는 일을 막아줍니다.
- 자신 외에는 내부의 가변 컴포넌트에 접근할 수 없도록 한다.
  - 클래스에서 가변 객체를 참조하는 필드가 하나라도 있으면 클라이언트에서 그 객체의 참조를 얻지 못하도록 해야 합니다.
  - 접근자 메서드가 그 필드를 그대로 반환해서도 안됩니다.
  - <a href="/post/make-defensive-copies-when-needed" target="_blank">[이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라(링크)</a>

<br/>

# 불변 클래스의 장점과 단점
아래와 같은 불변 클래스가 있다고 가정해봅시다. 상속을 막기 위하여 `final class`로 선언하였고
모든 멤버 필드에도 `final`을 적용하였습니다. 
 
```java
/**
 * @author madplay
 */
public final class Complex {

    private final double realNumber; // 실수부
    private final double imaginaryNumber; // 허수부

    public Complex(double realNumber, double imaginaryNumber) {
        this.realNumber = realNumber;
        this.imaginaryNumber = imaginaryNumber;
    }

    /**
     * 덧셈 연산
     */
    public Complex plus(Complex c) {
        return new Complex(realNumber + c.realNumber, imaginaryNumber + c.imaginaryNumber);
    }
}
```

불변한 객체는 단순합니다. 생성된 시점부터 소멸되는 시점까지 상태가 동일합니다. 근본적으로 스레드 안전하므로
별도로 동기화 작업을 할 필요도 없습니다. 또한 자유롭게 불변 객체를 공유할 수 있으며 불변 객체끼리는 내부 데이터를 공유할 수 있습니다.

예로 `BigInteger` 클래스를 살펴보면 부호(sign)와 크기(magnitude)를 각각의 필드로 표현합니다. 크기는 같고
부호만 반대로 표현하는 `negate` 메서드를 보면 새로운 BigInteger를 생성하는데, 아래와 같이 가변인 배열을 복사하지 않고
원본 인스턴스와 공유하여 사용합니다. 

```java
// 코드 일부
public class BigInteger extends Number implements Comparable<BigInteger> {
    final int signum;
    final int[] mag;
    
    // ...코드 생략 
    
    public BigInteger negate() {
        return new BigInteger(this.mag, -this.signum);
    }
}
```

그리고 불변 객체는 그 자체만으로 실패 원자을 제공합니다. 그러니까 예외가 발생한 이후에도 그 객체는 여전히 동일한 상태를 보장합니다.

**하지만 단점도 있습니다.** 값이 다르면 반드시 독립된 객체로 만들어야 합니다. 이를 해결하기 위해서 가변동반 클래스를 제공합니다.
예를들어 불변인 `String` 클래스의 가변 동반 클래스로 `StringBuilder` 가 있습니다.

그리고 참고 서적에는 없는 내용입니다만 `Jackson`과 같은 라이브러리를 사용하기 위해서는 기본 생성자가 필요합니다.
아래의 코드는 실행 중에 예외가 발생합니다.

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;

class TestObj {
    private final String hello;

    public TestObj(String hello) {
        this.hello = hello;
    }

    public String getHello() {
        return hello;
    }
}

public class TestClass {
    public void someMethod() throws IOException {
        String s = "{\"hello\":\"hi\"}";

        // jackson.databind.exc.MismatchedInputException:
        // Cannot construct instance of `TestObj` (although at least one Creator exists):
        // cannot deserialize from Object value ... 생략
        TestObj complex = new ObjectMapper().readValue(s, TestObj.class);
        System.out.println(complex.getHello());
    }

    // main 메서드 생략
}
```

<br/>

# 불변 클래스를 만드는 또 다른 방법
생성자 대신에 정적 팩터리를 이용하여 불변 클래스를 만들 수 있습니다.

```java
/**
 * @author Kimtaeng
 */
public class Complex {
    // 클래스에 final이 없다.

    private final double realNumber; // 실수부
    private final double imaginaryNumber; // 허수부

    // 생성자가 private
    private Complex(double realNumber, double imaginaryNumber) {
        this.realNumber = realNumber;
        this.imaginaryNumber = imaginaryNumber;
    }

    public static Complex valueOf(double re, double im) {
        return new Complex(re, im);
    }

    // ...생략
}
```

**생성자가 private**이므로 클라이언트에서 바라본 이 불변 객체는 **사실상 final** 입니다.
다른 패키지에서는 이 클래스를 확장하는 것조차 불가능합니다. 이러한 정적 팩터리 방식은 다수의 구현 클래스를 활용한
유연성을 제공하고 객체 캐싱과 같은 기능을 추가하여 성능을 끌어올릴 수도 있습니다.

<br/>

# 정리해보면
접근자 메서드(getter)가 있다고 무조건 수정자 메서드(setter)를 만들어야 하는 것은 아닙니다. 꼭 필요한 경우가 아니라면
**클래스는 불변(immutable)**이어야 합니다. 그로 인해 얻는 장점이 많으며 꼭 단점을 뽑자면 특정 상황에서의 잠재적 성능 저하뿐입니다.

불변으로 만들 수 없는 클래스라도 변경할 수 있는 부분을 최소한으로 줄이는 것이 좋습니다. 객체가 가질 수 있는 상태의 개수가
줄어드는 것은 그 객체를 예측하기가 쉬워지고 오류가 발생할 가능성도 줄어들게 됩니다. 그리고 다른 합당한 이유가 없다면
불변을 유지하기 위해서 모든 멤버 필드는 `private final` 이어야 합니다.