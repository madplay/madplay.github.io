---
layout: post
title: "상속 없이 기능을 조합할 수 있을까? 데코레이터 패턴"
author: madplay
tags: design-pattern java spring
description: "상속 없이 객체에 기능을 동적으로 추가하는 데코레이터 패턴, 어디까지 감쌀 수 있을까?"
category: Algorithm/CS
date: "2023-08-12 21:03:52"
comments: true
---

# 기능을 추가하고 싶은데 상속은 부담스러울 때

알림을 보내는 기능에 로깅을 추가하고 싶다. 그래서 `LoggingNotificationSender`를 만들었다.
다음에는 재시도 기능도 필요해져서 `RetryNotificationSender`를 만들었다.
로깅과 재시도를 동시에 하려면? `LoggingRetryNotificationSender`를 또 만들어야 한다.

기능 조합이 늘어날수록 클래스 수가 폭발적으로 증가한다.
데코레이터 패턴은 이 문제를 상속 대신 조합(composition)으로 해결한다.
기존 객체를 감싸는 래퍼(wrapper)를 만들어서, 원래 객체의 인터페이스는 유지하면서 기능을 덧붙인다.

<br>

# 데코레이터 패턴의 구조

구성 요소는 네 가지다.

- **Component:** 기본 기능을 정의하는 인터페이스
- **ConcreteComponent:** Component의 기본 구현
- **Decorator:** Component를 구현하면서 내부에 Component 참조를 갖는 추상 클래스
- **ConcreteDecorator:** Decorator를 확장하여 부가 기능을 추가하는 클래스

핵심은 Decorator가 Component와 동일한 인터페이스를 구현한다는 점이다.
덕분에 데코레이터를 여러 겹으로 감쌀 수 있고, 클라이언트는 감싸진 객체와 원본 객체를 구분할 필요가 없다.

<br>

# 로깅과 재시도를 조합해보기

알림 발송 기능에 로깅과 재시도를 데코레이터로 추가해보자.

먼저 Component와 ConcreteComponent를 정의한다.

```java
public interface NotificationSender {
    void send(String recipient, String message);
}

class BasicNotificationSender implements NotificationSender {
    @Override
    public void send(String recipient, String message) {
        System.out.println(recipient + "에게 알림: " + message);
    }
}
```

Decorator 추상 클래스를 만든다. 내부에 Component 참조를 갖고, 기본적으로 위임한다.

```java
abstract class NotificationDecorator implements NotificationSender {
    protected final NotificationSender delegate;

    protected NotificationDecorator(NotificationSender delegate) {
        this.delegate = delegate;
    }

    @Override
    public void send(String recipient, String message) {
        delegate.send(recipient, message);
    }
}
```

로깅 데코레이터와 재시도 데코레이터를 각각 구현한다.

```java
class LoggingDecorator extends NotificationDecorator {
    LoggingDecorator(NotificationSender delegate) {
        super(delegate);
    }

    @Override
    public void send(String recipient, String message) {
        System.out.println("[LOG] 알림 발송 시작: " + recipient);
        delegate.send(recipient, message);
        System.out.println("[LOG] 알림 발송 완료: " + recipient);
    }
}

class RetryDecorator extends NotificationDecorator {
    private final int maxRetries;

    RetryDecorator(NotificationSender delegate, int maxRetries) {
        super(delegate);
        this.maxRetries = maxRetries;
    }

    @Override
    public void send(String recipient, String message) {
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                delegate.send(recipient, message);
                return; // 성공하면 종료
            } catch (Exception e) {
                lastException = e;
                System.out.println("재시도 " + attempt + "/" + maxRetries);
            }
        }
        throw new RuntimeException("최대 재시도 횟수 초과", lastException);
    }
}
```

데코레이터를 조합하는 부분이 이 패턴의 핵심이다.

```java
NotificationSender sender = new BasicNotificationSender();

// 로깅만 추가
sender = new LoggingDecorator(sender);

// 재시도도 추가 (로깅 + 재시도 조합)
sender = new RetryDecorator(sender, 3);

sender.send("user@example.com", "주문이 완료되었습니다.");
```

`LoggingRetryNotificationSender` 같은 별도 클래스를 만들 필요가 없다.
기존 데코레이터를 원하는 순서로 조합하면 된다.

<br>

# 감싸고 또 감싸는 자바 I/O

## InputStream 체이닝

Java I/O는 데코레이터 패턴의 대표적인 사례다.
`InputStream`을 기반으로 `BufferedInputStream`, `DataInputStream` 등이 겹겹이 감싸는 구조다.

```java
InputStream input = new FileInputStream("data.bin");
input = new BufferedInputStream(input);    // 버퍼링 추가
DataInputStream dataInput = new DataInputStream(input);  // 데이터 타입 읽기 추가
int value = dataInput.readInt();
```

각 래퍼가 하나의 기능만 담당하고, 조합으로 원하는 기능 셋을 만들어낸다.
처음 접하면 생성자에 스트림을 계속 넘기는 모양이 낯설 수 있지만, 데코레이터 패턴을 알고 나면 구조가 명확하게 보인다.

## Collections.unmodifiableList()

`Collections.unmodifiableList()`는 기존 리스트를 수정 불가능한 리스트로 감싸는 데코레이터다.
`List` 인터페이스를 그대로 구현하면서, 수정 메서드(`add`, `remove` 등)에서 예외를 던진다.

```java
List<String> original = new ArrayList<>(Arrays.asList("a", "b", "c"));
List<String> readOnly = Collections.unmodifiableList(original);
readOnly.add("d"); // UnsupportedOperationException
```

<br>

# 요청 객체를 꾸미는 법

## HttpServletRequestWrapper

서블릿 API의 `HttpServletRequestWrapper`는 `HttpServletRequest`를 감싸는 데코레이터다.
Spring에서 필터(Filter)를 구현할 때, 요청 객체에 부가 정보를 추가하거나 특정 메서드의 동작을 바꾸고 싶을 때 활용한다.

```java
class CustomRequestWrapper extends HttpServletRequestWrapper {
    public CustomRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getHeader(String name) {
        if ("X-Custom".equals(name)) {
            return "custom-value";
        }
        return super.getHeader(name);
    }
}
```

원본 요청 객체를 수정하지 않으면서, 특정 헤더 값만 오버라이드할 수 있다.

## BeanPostProcessor

Spring의 `BeanPostProcessor`는 빈이 생성된 뒤 추가적인 가공을 적용하는 메커니즘이다.
엄밀히 데코레이터 패턴 그 자체는 아니지만, 원본 빈을 감싸서 프록시나 래퍼를 반환하는 방식으로 동작할 때
데코레이터와 같은 효과를 낸다.

<br>

# 데코레이터 vs 프록시

데코레이터와 프록시는 둘 다 원본 객체와 같은 인터페이스를 구현하고 내부에서 위임한다는 점에서 구조가 거의 동일하다.
차이는 의도에 있다.

- **데코레이터:** 클라이언트가 명시적으로 감싸서 기능을 추가한다. Java I/O의 `new BufferedInputStream(new FileInputStream(...))`처럼 조합 자체가 드러난다.
- **프록시:** 클라이언트가 프록시의 존재를 모르는 것이 이상적이다. Spring의 `@Transactional`처럼 프레임워크가 알아서 끼워 넣는 경우가 대표적이다.

<br>

# 정리하며

데코레이터 패턴은 상속 없이 객체에 기능을 동적으로 조합하는 방법을 제공한다.
Java I/O의 스트림 체이닝이 가장 널리 알려진 사례이고, Spring에서도 요청 래핑이나 빈 후처리에서 같은 원리를 활용한다.

데코레이터를 3겹 이상 감싸야 하는 상황이 온다면, 그 조합이 자주 쓰이는지 확인해보자.
자주 쓰이는 조합은 별도 클래스로 묶는 편이 오히려 읽기 쉽고 디버깅할 때 스택 트레이스도 짧아진다.

