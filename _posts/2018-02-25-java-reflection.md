---
layout:   post
title:    자바 리플렉션(Java Reflection)과 동적 로딩
author:   Kimtaeng
tags: 	  Java Reflection 동적로딩
description: 클래스 내에서 다른 클래스를 동적으로 로딩(Dynamic Load) 한다.
category: Java
comments: true
---

# 리플렉션(Reflection)이란?
자바에서 제공하는 리플렉션(Reflection)은 C, C++과 같은 언어를 비롯한 다른 언어에서는 볼 수 없는 기능입니다.
이미 로딩이 완료된 클래스에서 **또 다른 클래스를 동적으로 로딩(Dynamic Loading)**하여 생성자(Constructor), 멤버 필드(Member Variables)
그리고 멤버 메서드(Member Method) 등을 사용할 수 있도록 합니다.

그러니까, 컴파일 시간(Compile Time)이 아니라 실행 시간(Run Time)에 동적으로 특정 클래스의 정보를
객체화를 통해 분석 및 추출해낼 수 있는 프로그래밍 기법이라고 표현할 수 있습니다.

<br/>

# 어떻게 사용할까?
리플렉션은 간단하게 `Class.forName("클래스이름").newInstance` 와 같은 코드처럼
클래스의 이름으로부터 인스턴스를 생성할 수 있고 이를 이용하여 클래스의 정보를 가져올 수 있습니다.

```java
import java.lang.reflect.Method;

/**
 * 리플렉션 예제 - Vector Class
 *
 * @author Kimtaeng
 * Created on 2018. 1. 5
 */
public class MadPlay {

    public void reflectionTest() {
        try {
            Class vectorClass = Class.forName("java.util.Vector");

            Method[] methods = vectorClass.getDeclaredMethods();

            for (Method method : methods) {
                System.out.println(method.toString());
            }

        } catch (ClassNotFoundException e) {
            // Exception Handling
        }
    }

    public static void main(String[] args) {
        new MadPlay().reflectionTest();
    }
}
```

13번 라인에서 자바의 벡터(Vector) 클래스의 경로를 `Class.forName()` 메서드의 인자로 주어 Class 객체를 가져옵니다.
한편 메서드의 내부를 살펴보면 클래스를 찾을 수 없는 경우에 발생하는 `ClassNotFoundException`이 선언되어 있기 때문에
위의 `try-catch` 문처럼 예외를 핸들링할 수 있도록 합니다.  

```java
@CallerSensitive
public static Class<?> forName(String className)
            throws ClassNotFoundException {
    Class<?> caller = Reflection.getCallerClass();
    return forName0(className, true, ClassLoader.getClassLoader(caller), caller);
}
```

위의 벡터 클래스 객체를 가져오고, 선언된 모든 메서드의 이름을 출력하는 코드의 실행 결과는 어떻게 될까요?
예상했던 것과 같이 클래스 내에 선언된 메서드의 목록이 출력됩니다. (많아서 중간 생략했습니다)

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-05-java-reflection-1.png"
width="540" alt="Vector 클래스의 메서드"/>

<br/>

뿐만아니라 메서드의 매개변수와 반환 타입들도 확인할 수 있습니다.

```java
import java.lang.reflect.Method;

/**
 * 리플렉션 예제 - Parameter Types
 *
 * @author Kimtaeng
 * Created on 2018. 1. 5
 */
public class MadPlay {

    public void reflectionTest() {

        try {
            Class vectorClass = Class.forName("java.util.Vector");

            Method[] methods = vectorClass.getDeclaredMethods();

            /* 임의의 메서드 지정, 이름으로 확인 */
            Method method = methods[25];
            System.out.println("Class Name : " + method.getDeclaringClass());
            System.out.println("Method Name : " + method.getName());
            System.out.println("Return Type : " + method.getReturnType());

            /* Parameter Types */
            Class[] paramTypes = method.getParameterTypes();
            for(Class paramType : paramTypes) {
                System.out.println("Param Type : " + paramType);
            }

            /* Exception Types */
            Class[] exceptionTypes = method.getExceptionTypes();
            for(Class exceptionType : exceptionTypes) {
                System.out.println("Exception Type : " + exceptionType);
            }

        } catch (ClassNotFoundException e) {
            // Exception Handling
        }
    }

    public static void main(String[] args) {
        new MadPlay().reflectionTest();
    }
}
```

<br/>

# 메서드 이름으로 호출도 가능할까?
결론부터 말하자면 가능합니다. 아래 예제로 살펴봅시다.

```java
import java.lang.reflect.Method;

/**
 * 리플렉션 예제 - Call method by name
 *
 * @author Kimtaeng
 * Created on 2018. 1. 5
 */
class MadLife {
    public void sayHello(String name) {
        System.out.println("Hello, " + name);
    }
}

public class MadPlay {

    public void reflectionTest() {

        try {
            Class myClass = Class.forName("MadLife");
            Method method = myClass.getMethod("sayHello", new Class[]{String.class});
            method.invoke(myClass.newInstance(), new Object[]{new String("Kimtaeng")});

        } catch (Exception e) {
            // Exception Handling
        }
    }

    public static void main(String[] args) {
        new MadPlay().reflectionTest();
    }
}
```

위의 20번 라인에서 `Class.forName()` 메서드의 매개변수로 찾을 클래스의 이름을 넘겨주었고
바로 아래 21번 라인에서 이름과 매개변수의 타입을 입력하여 메서드를 찾습니다.
그리고 마지막 22번 라인에서 `newInstance()` 메서드를 이용하여 메서드를 실행할 객체를 지정한 후 최종적으로 출력할 문자열 매개변수를 전달합니다.

다른 클래스의 멤버 필드의 값도 수정 가능합니다.

```java
import java.lang.reflect.Field;

/**
 * 리플렉션 예제 - Modify member variable in class
 *
 * @author Kimtaeng
 * Created on 2018. 1. 5
 */
class MadLife {
    public int number;

    public void setNumber(int number) {
        this.number = number;
    }
}

public class MadPlay {

    public void reflectionTest() {

        try {
            Class myClass = Class.forName("MadLife");

            Field field = myClass.getField("number");
            MadLife obj = (MadLife) myClass.newInstance();
            obj.setNumber(5);

            System.out.println("Before Number : " + field.get(obj));
            field.set(obj, 10);
            System.out.println("After Number : " + field.get(obj));
        } catch (Exception e) {
            // Exception Handling
        }
    }

    public static void main(String[] args) {
        new MadPlay().reflectionTest();
    }
}
```

이름을 매개변수로 전달하여 받은 멤버 필드(위의 24번 라인)를 `get(), set()` 메서드로 해당 객체의 멤버 필드 값을 임의로 변경할 수 있습니다.

<br/>

# 리플렉션은 왜 사용할까?
리플렉션을 왜 사용할까요? 앞에서 언급한 것처럼 실행 시간에 다른 클래스를 동적으로 로딩하여 접근할 때,
클래스와 멤버 필드 그리고 메서드 등에 관한 정보를 얻어야할 때 등등이 있겠지요.
물론 리플렉션이 없더라도 완성도 높은 코드를 구현할 수 있지만 사용한다면 조금 더 유연한 코드를 만들 수 있습니다.

자바 관련 서적 또는 참고 자료를 인용하자면 자바의 리플렉션으로는 클래스의 패키지 정보, 접근 지정자, 수퍼 클래스,
어노테이션(Annotation) 등도 얻을 수 있다고 합니다.

<br/>

# 주의할 점은 없을까?
다른 언어에서는 찾아볼 수 없는 강력한 기능이지만, **주의해야할 점도 있습니다.** 외부에 공개되지 않는 private 멤버도 접근과 조작이 가능하므로
주의해야 합니다. private 멤버는 `Field.setAccessible()` 메서드를 true 지정하면 접근이 가능합니다.