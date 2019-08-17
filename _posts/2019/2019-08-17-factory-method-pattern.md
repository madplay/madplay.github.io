---
layout: post
title: "팩토리 메서드 패턴: 객체 생성을 서브클래스에 맡기기"
author: madplay
tags: design-pattern java
description: "객체 생성을 서브클래스에 위임하면 어떤 이점이 있을까? 팩토리 메서드 패턴의 구조와 자바, Spring 활용 사례를 코드로 확인한다."
category: Algorithm/CS
date: "2019-08-17 21:18:43"
comments: true
---

# 객체를 직접 만들지 않는 이유

`new` 키워드로 객체를 직접 생성하면 간단하지만, 생성할 클래스가 늘어날 때마다 호출하는 쪽 코드를 함께 수정해야 한다.
예를 들어 알림 시스템에서 이메일만 보내다가 SMS, 푸시 알림을 추가해야 한다면 어떨까.

```java
// 알림 유형이 추가될 때마다 이 코드를 수정해야 한다
if (type.equals("email")) {
    notification = new EmailNotification();
} else if (type.equals("sms")) {
    notification = new SmsNotification();
} else if (type.equals("push")) {
    notification = new PushNotification();
}
```

조건 분기가 늘어나고, 생성 로직이 여러 곳에 퍼져 있다면 변경의 파급 범위가 넓어진다.
팩토리 메서드 패턴은 이 문제를 객체 생성의 책임을 서브클래스에 넘기는 방식으로 해결한다.

<br>

# 팩토리 메서드 패턴의 구조

팩토리 메서드 패턴(Factory Method Pattern)은 객체 생성을 위한 인터페이스를 정의하되, 어떤 클래스의 인스턴스를 만들지는 서브클래스가 결정하도록 하는 패턴이다.

구성 요소는 다음과 같다.

- **Product:** 생성될 객체의 인터페이스
- **ConcreteProduct:** Product를 구현하는 실제 클래스
- **Creator:** 팩토리 메서드를 선언하는 추상 클래스
- **ConcreteCreator:** 팩토리 메서드를 오버라이드하여 ConcreteProduct를 반환하는 클래스

Creator가 직접 ConcreteProduct를 알지 못하는 것이 핵심이다.
어떤 객체를 생성할지는 ConcreteCreator가 결정하므로, 새로운 Product가 추가되어도 Creator의 코드를 수정할 필요가 없다.

<br>

# 알림 시스템으로 살펴보기

알림(Notification) 시스템을 예시로 팩토리 메서드 패턴을 구현해보자.

먼저 Product에 해당하는 `Notification` 인터페이스와 구현체를 정의한다.

```java
public interface Notification {
    void send(String message);
}

class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("이메일 발송: " + message);
    }
}

class SmsNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS 발송: " + message);
    }
}
```

다음으로 Creator에 해당하는 `NotificationCreator` 추상 클래스를 정의한다.
`createNotification()`이 팩토리 메서드다.

```java
public abstract class NotificationCreator {

    // 팩토리 메서드: 어떤 Notification을 생성할지는 서브클래스가 결정한다
    protected abstract Notification createNotification();

    public void sendNotification(String message) {
        Notification notification = createNotification();
        notification.send(message);
    }
}
```

ConcreteCreator는 팩토리 메서드를 오버라이드하여 구체적인 Notification 객체를 반환한다.

```java
class EmailNotificationCreator extends NotificationCreator {
    @Override
    protected Notification createNotification() {
        return new EmailNotification();
    }
}

class SmsNotificationCreator extends NotificationCreator {
    @Override
    protected Notification createNotification() {
        return new SmsNotification();
    }
}
```

사용하는 쪽 코드를 보면 패턴의 효과가 드러난다.

```java
public class FactoryMethodTest {
    public static void main(String[] args) {
        NotificationCreator creator = new EmailNotificationCreator();
        creator.sendNotification("주문이 완료되었습니다.");

        // 알림 방식을 SMS로 변경해도 호출 코드는 동일하다
        creator = new SmsNotificationCreator();
        creator.sendNotification("주문이 완료되었습니다.");
    }
}
```

새로운 알림 방식(예: 푸시 알림)이 추가되더라도, `PushNotification`과 `PushNotificationCreator`를 만들면 된다.
기존 코드를 수정할 필요가 없으므로 개방-폐쇄 원칙(OCP)을 자연스럽게 따르게 된다.

<br>

# Calendar는 왜 new로 만들지 않을까

팩토리 메서드 패턴은 JDK 곳곳에서 활용되고 있다.

## Calendar.getInstance()

`java.util.Calendar`의 `getInstance()` 메서드는 로케일이나 타임존에 따라 서로 다른 Calendar 구현체를 반환한다.

```java
Calendar calendar = Calendar.getInstance();
// 로케일에 따라 GregorianCalendar, JapaneseImperialCalendar 등이 반환된다
```

호출하는 쪽에서는 구체적인 구현 클래스를 알 필요가 없다. `Calendar`라는 추상 타입만으로 날짜 연산을 수행할 수 있다.

## NumberFormat.getInstance()

`java.text.NumberFormat`도 비슷한 구조다. `getInstance()`, `getCurrencyInstance()`, `getPercentInstance()` 등이
로케일에 따라 적절한 포매터를 반환한다.

```java
NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.KOREA);
System.out.println(formatter.format(50000)); // ₩50,000
```

이들은 정적 팩토리 메서드(Static Factory Method)라고 부르기도 한다.
정적 팩토리 메서드는 생성자 대신 정적 메서드를 통해 객체를 반환하는 관용구에 가깝고, GoF의 팩토리 메서드 패턴은 상속을 통해 생성 결정을 서브클래스에 위임하는 구조다.
접근 방식은 다르지만 객체 생성을 캡슐화한다는 본질은 같다.

<br>

# Spring의 빈 생성 구조

## BeanFactory와 ApplicationContext

Spring의 `BeanFactory`는 이름 그대로 빈(Bean) 객체를 생성하는 팩토리다.
`getBean()` 메서드를 호출하면 설정에 따라 적절한 빈 인스턴스를 반환한다.

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
NotificationService service = context.getBean(NotificationService.class);
```

호출하는 쪽에서는 `NotificationService`의 구현 클래스가 무엇인지 몰라도 된다.
어떤 구현체가 주입되는지는 설정(Configuration)이 결정한다.

## FactoryBean 인터페이스

Spring은 `FactoryBean<T>` 인터페이스를 통해 복잡한 객체 생성 로직을 캡슐화할 수 있다.
`getObject()` 메서드를 오버라이드하여 원하는 객체를 반환하면, Spring 컨테이너가 이를 빈으로 등록한다.

```java
public class NotificationFactoryBean implements FactoryBean<Notification> {

    private String type;

    @Override
    public Notification getObject() throws Exception {
        if ("email".equals(type)) {
            return new EmailNotification();
        }
        return new SmsNotification();
    }

    @Override
    public Class<?> getObjectType() {
        return Notification.class;
    }

    public void setType(String type) {
        this.type = type;
    }
}
```

일반적인 빈 등록으로는 표현하기 어려운 복잡한 초기화 로직이 있을 때 유용하다.

<br>

# 팩토리 메서드 vs 추상 팩토리

팩토리 메서드와 혼동하기 쉬운 패턴으로 추상 팩토리(Abstract Factory)가 있다.
두 패턴 모두 객체 생성을 캡슐화하지만 초점이 다르다.

| 기준 | 팩토리 메서드 | 추상 팩토리 |
|------|-------------|------------|
| 생성 대상 | 한 종류의 객체 | 관련된 객체 군(family) |
| 확장 방식 | 상속(서브클래스가 팩토리 메서드 오버라이드) | 구성(팩토리 객체를 주입) |
| 복잡도 | 상대적으로 단순 | 여러 팩토리 메서드를 묶으므로 복잡 |

알림 하나를 만드는 것이라면 팩토리 메서드로 충분하다.
알림, 로거, 모니터링 등 관련된 객체 군을 한 벌로 만들어야 한다면 추상 팩토리가 어울린다.

<br>

# 언제 쓰고, 언제 피할까

팩토리 메서드 패턴이 빛나는 순간은 분명하다. 생성할 객체의 종류가 런타임에 결정되거나, 새로운 타입이 계속 추가될 가능성이 있을 때 효과적이다.

반면 생성할 객체가 한두 종류뿐이고 변경 가능성이 낮다면 패턴을 적용하는 것이 오히려 과설계가 될 수 있다.
Creator, ConcreteCreator 클래스가 늘어나면서 코드의 양이 불필요하게 많아지기 때문이다.

패턴은 도구에 가깝다고 생각한다. "이 상황에서 이 도구가 필요한가?"를 먼저 따져보는 편이 좋지 않을까 싶다.

<br>

# 정리하며

팩토리 메서드 패턴은 객체 생성의 책임을 서브클래스에 위임하여, 생성 로직의 변경이 호출 코드에 영향을 주지 않도록 격리하는 데 초점을 둔다.
JDK의 `Calendar`, `NumberFormat`에서 이미 활용되고 있고, Spring의 `BeanFactory`와 `FactoryBean`에서도 같은 원리를 찾을 수 있다.

코드 리뷰에서 타입별 `if-else` 분기가 여러 곳에 복사되어 있다면, 팩토리 메서드를 떠올려볼 타이밍이다.
분기를 한 곳으로 모으는 것만으로도 변경의 파급 범위가 눈에 띄게 줄어든다.

