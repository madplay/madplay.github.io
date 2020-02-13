---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 39. 명명 패턴보다 애너테이션을 사용하라"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3th Edition] Item 39. Prefer annotations to naming patterns" 
category: Java
date: "2019-06-15 01:12:25"
comments: true
---

# 명명 패턴의 단점
전통적으로 도구나 프레임워크가 특별하게 다뤄야할 요소에는 딱 구분되는 명명 패턴을 적용해왔다. 예를 들어 JUnit은 3버전까지 테스트 메서드 이름이 test로
시작해야 했다. 이러한 설정에는 몇 가지 단점이 따랐다.

첫 번째로 오타가 실행에 큰 영향을 주었다. 실수로 `tsetSomething`과 같이 test라는 단어에 오타를 내면 메서드가 무시되었다.
테스트가 실패하지 않았으니 통과했다고 오해할 수 있다. 두 번째로 메서드가 아닌 클래스 이름을 TestSafetyMechanisms로 지어서 JUnit에 던져주었다고 하자.
클래스 내의 테스트 메서드를 수행할 것 같으니 JUnit은 클래스 이름에 관심이 없다. 마지막으로 특정 예외를 던지는 경우에만 테스트가 성공하는 등의 테스트를
작성한다고 했을 때, 매개변수를 전달할 방법이 없다.

애너테이션은 이러한 문제를 해결해주는 요소인데, JUnit도 4버전부터 도입하였다.

<br/><br/>

# 마커 애너테이션
간단한 마커 애너테이션을 직접 정의해보자. 아무 매개변수 없이 **단순히 대상에 마킹(marking)한다고 하여 마커 애너테이션이라고 한다.**
별다른 처리가 없다.

```java
// 테스트 메서드임을 선언하는 애너테이션
// 매개변수 없는 정적 메서드 전용이다.
@Retention(RetentionPolicy.RUNTIME) // @MadTest가 런타임에도 유지되어야 한다는 뜻
@Target(ElementType.METHOD) // @MadTest가 메서드 선언에서만 사용돼야 한다는 뜻
public @interface MadTest {
}
```

**애너테이션 선언에 다는 애너테이션을 메타애너테이션(meta-annotation)이라고 한다.** 위의 예제에서 사용한 `@Retention`과 `@Target`을
포함하여 다른 메타 애너테이션의 종류에 대해 살펴보면 아래와 같다.

## 메타 애너테이션의 종류

- `@Documented`: 문서에도 애너테이션 정보가 표현되게 한다.
- `@Inherited`: 자식클래스가 애너테이션을 상속받을 수 있게 한다.
- `@Repeatable`: 애너테이션을 반복적으로 사용할 수 있게 한다.
- `@Retention(RetentionPolicy)`: 애너테이션의 범위를 지정한다.
  - RetentionPolicy.RUNTIME: 컴파일 이후에도 JVM에 의해 참조가 가능하다.
  - RetentionPolicy.CLASS: 컴파일러가 클래스를 참조 할때 까지 유효하다.
  - RetentionPolicy.SOURCE: 애너테이션 정보가 컴파일 이후 사라진다.
- `@Target(ElementType[])`: 애너테이션이 적용될 위치를 선언한다.
  - ElementType.PACKAGE: 패키지 선언시에
  - ElementType.TYPE: 타입 선언시에
  - ElementType.CONSTRUCTOR: 생성자 선언시에
  - ElementType.FIELD: 멤버 변수 선언시에
  - ElementType.METHOD: 메소드 선언시에
  - ElementType.ANNOTATION_TYPE: 어노테이션 타입 선언시에
  - ElementType.LOCAL_VARIABLE: 지역 변수 선언시에
  - ElementType.PARAMETER: 매개 변수 선언시에
  - ElementType.TYPE_PARAMETER: 매개 변수 타입 선언시에
  - ElementType.TYPE_USE: 타입 사용시에

즉, 위에 선언한 `MadTest` 애너테이션을 클래스에 선언하면 컴파일 오류가 발생한다. 그리고 "매개변수 없는 정적 메서드 전용이다" 라는 주석의 제약은
컴파일러가 강제할 수 없다. `javax.annotation.processing` API 문서를 참조하여 적절한 애너테이션 처리기를 통해 구현해야 한다.

<br/><br/>

# 애너테이션 처리 코드 구현
위에서 정의한 마커 애너테이션을 사용하는 코드와 애너테이션도 처리하는 코드도 작성해보자.

```java
class Sample {
    @MadTest
    public static void m1() {
        // 성공한다.
    }

    public static void m2() {
        // 무시된다.
    }

    @MadTest
    public void m3() {
        // 잘못 사용되었다. 정적 메서드가 아니다.
    }

    @MadTest
    public static void m4() {
        throw new RuntimeException("실패");
    }
}

class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    passedCount++;
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    System.out.println(method + " 실패: " + ex);
                } catch (Exception e) {
                    System.out.println("잘못 사용한 @MadTest: " + method);
                }
            }
        }
        System.out.printf("성공: %d, 실패: %d%n", passedCount, testCount - passedCount);
    }
}

// 실행 결과
// public static void Sample.m4() 실패: java.lang.RuntimeException: 실패
// 잘못 사용한 @MadTest: public void Sample.m3()
// 성공: 1, 실패: 2
```

직접 정의한 `@MadTest` 애너테이션이 Sample 클래스의 의미에 직접적인 영향을 주진 않는다. 그저 애너테이션에 관심 있는 코드에서 처리하도록 하는 것이다.
위의 코드에서 InvocationTargetException 외의 예외가 발생했다면 애너테이션을 잘못 사용했다는 뜻이다. 선언된 곳이 메서드가 아니거나 m4 메서드처럼
정적 메서드가 아닌 인스턴스 메서드 등에 달았을 가능성이 높다. 

<br/><br/>

# 매개변수가 있는 애너테이션
매개변수를 추가하여 특정 예외를 던져야만 테스트가 성공하도록 할 수 있다. 우선 애너테이션을 새롭게 정의해보자.

```java
// 명시한 예외를 던져야만 성공하는 테스트 메서드용 애너테이션
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionTest {
    Class<? extends Throwable> value();
}
```

테스트를 위한 샘플도 수정이 필요하다. 새롭게 정의한 애너테이션을 사용하도록 선언하고 기대하는 예외를 매개변수로 넣는다.
물론 애너테이션을 처리하는 코드의 수정도 필요하다. 

```java
// 애너테이션 테스트 샘플
class Sample {
    @MadExceptionTest(ArithmeticException.class)
    public static void m1() {
        int i = 0;
        i = i / i;
        // 성공해야 한다.
    }

    @MadExceptionTest(ArithmeticException.class)
    public static void m2() {
        int[] a = new int[0];
        a[1] = 2;
        // 다른 예외가 발생하므로 실패해야 한다.
    }

    @MadExceptionTest(ArithmeticException.class)
    public static void m3() {
        // 예외가 발생하지 않기 때문에 실패해야 한다.
    }
}

public class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadExceptionTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("테스트 %s 실패: 예외를 던지지 않음%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    Class<? extends Throwable> type = method.getAnnotation(MadExceptionTest.class).value();
                    if (type.isInstance(ex)) {
                        passedCount++;
                    } else {
                        System.out.printf("테스트 %s 실패: 기대한 예외: %s, 실제 예외: %s%n",
                                method, type.getName(), ex);
                    }
                } catch (Exception e) {
                    System.out.println("잘못 사용한 @MadExceptionTest: " + method);
                }
            }
        }
        System.out.printf("성공: %d, 실패: %d%n", passedCount, testCount - passedCount);
    }
}

// 실행 결과
// 테스트 public static void Sample.m2() 실패: 기대한 예외: java.lang.ArithmeticException,
// 실제 예외: java.lang.ArrayIndexOutOfBoundsException: Index 1 out of bounds for length 0
// 테스트 public static void Sample.m3() 실패: 예외를 던지지 않음
// 성공: 1, 실패: 2
```

앞서 살펴본 `@MadTest` 애너테이션과의 차이는 새롭게 추가한 매개변수의 값을 가져와 테스트 메서드가 올바른 예외를 던지는지 확인하는데 사용하는 것이다.

<br/><br/>

# 배열 매개변수를 갖는 받는 애너테이션
배열 매개변수를 받게 변경할 수 있다. 앞서 살펴본 방식보다 문법적으로 조금 더 유연함을 기대할 수 있다. 게다가 앞선 `@MadExceptionTest`의
매개변수를 배열로 변경함에도 기존의 애너테이션 샘플 코드는 수정할 필요가 없다.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionTest {
    // 배열로 변경한다.
    Class<? extends Throwable>[] value();
}
```

이제 테스트할 샘플 코드와 애너테이션 처리 코드를 수정하면 된다. 아래와 같이 쉼표로 구분하여 예외를 나열하면 된다.

```java
class Sample {
    @MadExceptionTest({IndexOutOfBoundsException.class, NullPointerException.class})
    public static void doublyBad() {
        List<String> list = new ArrayList<>();
        list.addAll(1, null);
    }
}

class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadExceptionTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("테스트 %s 실패: 예외를 던지지 않음%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    int oldPassedCount = passedCount;
                    Class<? extends Throwable>[] types = method.getAnnotation(MadExceptionTest.class).value();

                    for (Class<? extends Throwable> type : types) {
                        if (type.isInstance(ex)) {
                            passedCount++;
                            break;
                        }
                    }
                    if (passedCount == oldPassedCount) {
                        System.out.printf("테스트 %s 실패: %s %n", method, ex);
                    }
                } catch (Exception e) {
                    System.out.println("잘못 사용한 @MadExceptionTest: " + method);
                }
            }
        }
        System.out.printf("성공: %d, 실패: %d%n", passedCount, testCount - passedCount);
    }
}

// 실행 결과
// 성공: 1, 실패: 0
```

<br/><br/>

# 반복 가능 애너테이션
**자바 8부터는** 앞서 살펴본 배열 매개변수 대신 애너테이션에 `@Repeatable` 메타애너테이션을 사용하여 여러 개의 값을 받을 수 있다.
단, 아래와 같이 `@Repeatable`을 달고 있는 애너테이션을 반환하는 컨테이너 애너테이션을 하나 더 정의하고 `@Repeatable`에
이 컨테이너 애녀테이션의 class 객체를 매개변수로 전달해야 한다.

그리고 컨테이너 애너테이션은 내부 애너테이션 타입의 배열을 반환하는 value 메서드를 정의해야 한다. 그리고 컨테이너 애너테이션 타입에는
적절한 **보존 정책(@Retention)과 적용 대상(@Target)을 명시해야 한다.** 그렇지 않으면 컴파일되지 않는다.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(MadExceptionContainer.class)
public @interface MadExceptionTest {
    Class<? extends Throwable> value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionContainer {
    MadExceptionTest[] value();
}
```

테스트하는 코드와 애너테이션 처리 코드를 작성해보자. 반복 가능 애너테이션을 여러 개 다는 경우와 하나만 달았을 때를 구분하기 위하여 '컨테이너' 애너테이션
타입이 적용된다. `getAnnotationsByType` 메서드는 둘의 차이를 구분하지 않지만 `isAnnotationPresent` 메서드는 구분한다.

따라서 달려있는 애너테이션 수와 상관없이 모두 검사하기 위해 둘을 따로따로 검사해야 한다.

```java
@MadExceptionTest(NullPointerException.class)
@MadExceptionTest(IndexOutOfBoundsException.class)
public static void doublyBad() { ... }

public class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {

            // 모두 검사할 수 있도록 한다.
            if (method.isAnnotationPresent(MadExceptionTest.class)
                    || method.isAnnotationPresent(MadExceptionContainer.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("테스트 %s 실패: 예외를 던지지 않음%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    int oldPassedCount = passedCount;

                    MadExceptionTest[] tests = method.getAnnotationsByType(MadExceptionTest.class);
                    for (MadExceptionTest test : tests) {
                        if (test.value().isInstance(ex)) {
                            passedCount++;
                            break;
                        }
                    }

                    if (passedCount == oldPassedCount) {
                        System.out.printf("테스트 %s 실패: %s %n", method, ex);
                    }
                } catch (Exception e) {
                    System.out.println("잘못 사용한 @MadTest: " + method);
                }
            }
        }
        System.out.printf("성공: %d, 실패: %d%n", passedCount, testCount - passedCount);
    }
}

// 실행 결과
// 성공: 1, 실패: 0
```

정리하면, 애너테이션을 선언하고 처리하는 부분의 코드 양이 많아지지만 명명 패턴보다는 권장하는 방식이다. 물론 실무에서 직접적으로 애너테이션을 처리하는 코드를
구현할 경우가 많은 것은 아니지만 예외 없이 자바가 제공하는 애너테이션 타입을 사용하는 것을 권장한다. 다른 개발자가 코드에 추가 정보를 제공할 수 있는
도구를 만드는 일을 한다면, 적당한 애너테이션 타입도 함께 정의해 제공하자.