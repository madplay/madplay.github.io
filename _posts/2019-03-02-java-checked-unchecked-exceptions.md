---
layout:   post
title:    "자바 예외 구분: Checked Exception, Unchecked Exception"
author:   Kimtaeng
tags: 	  java exception
description: "자바에서 예외는 어떻게 구분할까? Checked Exception과 Unchecked Exception의 차이는 무엇일까?"
category: Java
comments: true
---

# 예외(Exception)란?
`Checked Exception`과 `Unchecked Exception`의 차이를 알아보기 전에 먼저 예외와 에러가 무엇인지 알아볼 필요가 있다.
프로그래밍에서 **예외(Exception)**란 입력 값에 대한 처리가 불가능하거나, 프로그램 실행 중에 참조된 값이 잘못된 경우 등
정상적인 프로그램의 흐름을 어긋나는 것을 말한다. 그리고 자바에서 예외는 개발자가 직접 처리할 수 있기 때문에 예외 상황을 미리 예측하여
핸들링할 수 있다.

한편, **에러(Error)**는 시스템에 무엇인가 비정상적인 상황이 발생한 경우에 사용된다.
주로 자바 가상머신에서 발생시키는 것이며 예외와 반대로 이를 애플리케이션 코드에서 잡으려고 하면 안 된다. (사실 잡아도 방법이 없다.)
에러의 예로는 `OutOfMemoryError`, `ThreadDeath`, `StackOverflowError` 등이 있다.

```java
/**
 * StackOverflowError Example.
 * @author kimtaeng
 */
public class SomeTest {

    public static void test() {
        test();
    }

    public static void main(String[] args) {
        try {
            test();
        } catch (StackOverflowError e) {
            // ...!?
        }
    }
}
```

<br>

# 예외 구분
이번 글의 주제처럼 Exception은 Checked Exception과 Unchecked Exception으로 구분할 수 있는데,
간단하게 **RuntimeException을 상속하지 않는 클래스**는 Checked Exception, 반대로 상속한 클래스는 Unchecked Exception으로
분류할 수 있다.

<img class="post_image" width="700" alt="exceptions"
src="{{ site.baseurl }}/img/post/2019-03-02-java-checked-unchecked-exceptions-1.png"/>

<br>

여기서 **RuntimeException**은 **Exception** 클래스의 서브 클래스이기 때문에 **Exception의 일종**이기도 하지만 자바에서는
**RuntimeException**과 이를 상속한 클래스를 조금 특별하게 취급한다. 명시적으로 예외 처리를 하지 않아도 되기 때문이다.

<img class="post_image" width="700" alt="checked unchecked exceptions"
src="{{ site.baseurl }}/img/post/2019-03-02-java-checked-unchecked-exceptions-2.png"/>

<br>

# 예외 처리
예외를 처리하는 방법에는 **예외 복구, 예외 처리 회피, 예외 전환** 방법이 있다.

## 예외 복구
- 예외 상황을 파악하고 문제를 해결해서 정상 상태로 돌려놓는 방법
- 예외를 잡아서 일정 시간, 조건만큼 대기하고 다시 재시도를 반복한다.
- 최대 재시도 횟수를 넘기게 되는 경우 예외를 발생시킨다.

```java
final int MAX_RETRY = 100;
public Object someMethod() {
    int maxRetry = MAX_RETRY;
    while(maxRetry > 0) {
        try {
            ...
        } catch(SomeException e) {
            // 로그 출력. 정해진 시간만큼 대기한다.
        } finally {
            // 리소스 반납 및 정리 작업
        }
    }
    // 최대 재시도 횟수를 넘기면 직접 예외를 발생시킨다.
    throw new RetryFailedException();
}
```

## 예외처리 회피
- 예외 처리를 직접 담당하지 않고 호출한 쪽으로 던져 회피하는 방법
- 그래도 예외 처리의 필요성이 있다면 어느 정도는 처리하고 던지는 것이 좋다.
- 긴밀하게 역할을 분담하고 있는 관가 아니라면 예외를 그냥 던지는 것은 무책임하다.

```java
// 예시 1
public void add() throws SQLException {
    // ...생략
}

// 예시 2 
public void add() throws SQLException {
    try {
        // ... 생략
    } catch(SQLException e) {
        // 로그를 출력하고 다시 날린다!
        throw e;
    }
}
```

## 예외 전환
- 예외 회피와 비슷하게 메서드 밖으로 예외를 던지지만, 그냥 던지지 않고 적절한 예외로 전환해서 넘기는 방법
- 조금 더 명확한 의미로 전달되기 위해 적합한 의미를 가진 예외로 변경한다.
- 예외 처리를 단순하게 만들기 위해 포장(wrap) 할 수도 있다.
  
```java
// 조금 더 명확한 예외로 던진다.
public void add(User user) throws DuplicateUserIdException, SQLException {
    try {
        // ...생략
    } catch(SQLException e) {
        if(e.getErrorCode() == MysqlErrorNumbers.ER_DUP_ENTRY) {
            throw DuplicateUserIdException();
        }
        else throw e;
    }
}

// 예외를 단순하게 포장한다.
public void someMethod() {
    try {
        // ...생략
    }
    catch(NamingException ne) {
        throw new EJBException(ne);
        }
    catch(SQLException se) {
        throw new EJBException(se);
        }
    catch(RemoteException re) {
        throw new EJBException(re);
        }
}
```

<br>

# 정리하면
자바에서 예외는 **RuntimeException을 상속**하지 않고 꼭 처리해야 하는 **Checked Exception**과
반대로 명시적으로 처리하지 않아도 되는 **Unchecked Exception**로 구분할 수 있다.
