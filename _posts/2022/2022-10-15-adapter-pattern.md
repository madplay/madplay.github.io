---
layout: post
title: "어댑터 패턴: 인터페이스가 맞지 않을 때의 해법"
author: madplay
tags: design-pattern java spring
description: "외부 라이브러리의 인터페이스가 우리 시스템과 맞지 않을 때, 어댑터 패턴은 기존 코드 수정 없이 둘을 연결한다."
category: Algorithm/CS
date: "2022-10-15 20:52:37"
comments: true
---

# 인터페이스가 맞지 않을 때

외부 라이브러리나 레거시 코드를 기존 시스템에 통합해야 하는 상황을 떠올려보자.
새로 가져온 클래스의 메서드 시그니처가 우리 시스템이 기대하는 인터페이스와 다르다면 어떻게 할까.
해당 클래스의 소스를 직접 수정할 수 없는 경우가 대부분이다.

어댑터 패턴은 호환되지 않는 인터페이스 사이에 변환 계층을 두어, 기존 코드를 수정하지 않고도 함께 동작하게 만드는 패턴이다.
일상에서 쓰는 돼지코(전원 어댑터)와 원리가 같다.
한국 콘센트에 맞지 않는 해외 플러그를 어댑터를 끼워서 사용하듯, 코드에서도 중간 변환 계층이 그 역할을 한다.

<br>

# 어댑터 패턴의 구조

구성 요소는 세 가지다.

- **Target:** 클라이언트가 기대하는 인터페이스
- **Adaptee:** 기존에 존재하지만 Target과 호환되지 않는 클래스
- **Adapter:** Target 인터페이스를 구현하면서 내부적으로 Adaptee를 호출하는 변환 클래스

구현 방식은 두 가지가 있다.
**객체 어댑터(Object Adapter)**는 Adaptee를 필드로 갖고 위임(delegation)하는 방식이고,
**클래스 어댑터(Class Adapter)**는 Adaptee를 상속하면서 Target 인터페이스를 구현하는 방식이다.
자바에서는 Target이 인터페이스라면 클래스 어댑터도 가능하지만, Adaptee와의 강한 결합이 생기므로 객체 어댑터가 더 일반적이다.

<br>

# LegacyMailer를 연결해보기

기존 시스템에서는 `NotificationSender` 인터페이스를 통해 알림을 보내고 있다.
새로 도입한 외부 라이브러리는 `LegacyMailer`라는 클래스로 이메일을 보내는데, 메서드 시그니처가 다르다.

```java
// Target: 우리 시스템이 기대하는 인터페이스
public interface NotificationSender {
    void send(String recipient, String message);
}

// Adaptee: 외부 라이브러리의 기존 클래스 (수정 불가)
class LegacyMailer {
    public void sendMail(String to, String subject, String body) {
        System.out.println(to + "에게 메일 발송: [" + subject + "] " + body);
    }
}
```

어댑터를 만들어 두 인터페이스를 연결한다.

```java
// Adapter: LegacyMailer를 NotificationSender로 변환
class MailerAdapter implements NotificationSender {
    private final LegacyMailer legacyMailer;

    public MailerAdapter(LegacyMailer legacyMailer) {
        this.legacyMailer = legacyMailer;
    }

    @Override
    public void send(String recipient, String message) {
        // LegacyMailer의 시그니처에 맞게 변환
        legacyMailer.sendMail(recipient, "알림", message);
    }
}
```

클라이언트 코드는 `NotificationSender`만 알면 된다.

```java
NotificationSender sender = new MailerAdapter(new LegacyMailer());
sender.send("user@example.com", "주문이 완료되었습니다.");
// user@example.com에게 메일 발송: [알림] 주문이 완료되었습니다.
```

`LegacyMailer`의 코드를 한 줄도 수정하지 않았다.
어댑터가 중간에서 인터페이스 차이를 흡수해주기 때문이다.

<br>

# Arrays.asList()도 어댑터다

## Arrays.asList()

`Arrays.asList()`는 배열을 `List` 인터페이스로 감싸는 어댑터다.
배열은 `List`의 메서드를 갖고 있지 않지만, 이 메서드를 통해 `List`처럼 다룰 수 있다.

```java
String[] array = {"singleton", "strategy", "observer"};
List<String> list = Arrays.asList(array);
```

다만 반환된 `List`는 고정 크기(fixed-size)라서 `add()`나 `remove()`를 호출하면 `UnsupportedOperationException`이 발생한다.
배열의 구조적 제약을 `List` 인터페이스 뒤에 숨긴 것이므로, 원본의 제약까지 함께 따라온다는 점을 알아두면 좋다.

## InputStreamReader

`InputStreamReader`는 바이트 스트림(`InputStream`)을 문자 스트림(`Reader`)으로 변환하는 어댑터다.
바이트를 다루는 `InputStream`과 문자를 다루는 `Reader`는 인터페이스가 다르지만,
`InputStreamReader`가 그 사이를 연결해준다.

```java
InputStream byteStream = new FileInputStream("data.txt");
Reader charStream = new InputStreamReader(byteStream, StandardCharsets.UTF_8);
```

<br>

# DispatcherServlet은 핸들러를 어떻게 호출할까

## HandlerAdapter

Spring MVC의 `HandlerAdapter`는 어댑터 패턴의 교과서적인 활용 사례다.
Spring은 다양한 형태의 핸들러(어노테이션 기반 컨트롤러, `HttpRequestHandler`, `Controller` 인터페이스 등)를 지원하는데,
`DispatcherServlet`이 이들을 통일된 방식으로 호출할 수 있는 이유가 `HandlerAdapter` 덕분이다.

`DispatcherServlet`은 핸들러의 구체적인 타입을 모른다.
대신 `HandlerAdapter`에게 "이 핸들러를 실행해달라"고 위임하면,
각 어댑터(`RequestMappingHandlerAdapter`, `HttpRequestHandlerAdapter` 등)가 해당 핸들러에 맞는 방식으로 호출을 변환한다.

```java
public interface HandlerAdapter {
    boolean supports(Object handler);
    ModelAndView handle(HttpServletRequest request, HttpServletResponse response,
                        Object handler) throws Exception;
}
```

`supports()` 메서드로 자신이 처리할 수 있는 핸들러인지 판단하고,
`handle()` 메서드로 실제 요청 처리를 수행한다.

<br>

# 어댑터 vs 데코레이터, 어댑터 vs 파사드

어댑터 패턴은 다른 구조 패턴과 혼동되기 쉽다.
데코레이터(Decorator) 패턴은 원본 객체와 같은 인터페이스를 유지하면서 기능을 덧붙이는 패턴이고,
파사드(Facade) 패턴은 복잡한 서브시스템 앞에 단순한 인터페이스를 하나 두어 클라이언트가 내부 구조를 몰라도 기능을 사용할 수 있게 하는 패턴이다.

| 기준 | 어댑터 | 데코레이터 | 파사드 |
|------|--------|-----------|--------|
| 목적 | 인터페이스 변환 | 기능 추가 | 복잡한 서브시스템을 단순화 |
| 기존 인터페이스 | 바꾼다 | 유지한다 | 새로운 인터페이스를 제공 |
| 대상 수 | 하나의 클래스를 감싼다 | 하나의 객체를 감싼다 | 여러 클래스를 묶는다 |

어댑터는 인터페이스를 변환하는 것이 목적이지, 기능을 추가하거나 단순화하는 것이 아니다.
이 차이를 기억해두면 세 패턴을 구분하기 수월해진다.

<br>

# 마무리하며

어댑터 패턴은 호환되지 않는 인터페이스를 가진 클래스들 사이에 변환 계층을 두는 방식으로 문제를 풀어낸다.
외부 라이브러리 통합이나 레거시 코드 연동처럼 기존 코드를 수정할 수 없는 상황에서 특히 유용하다.

Spring MVC의 `HandlerAdapter`가 보여주듯, 다양한 형태의 구현을 통일된 인터페이스로 다루어야 할 때 어댑터는 자연스러운 선택이 된다.
외부 시스템과의 경계에서 어댑터가 쓰이는 것은 자연스럽다.
하지만 내부 모듈 사이에 어댑터가 끼어들기 시작한다면, 어댑터를 추가하기보다 인터페이스를 먼저 맞추는 편이 장기적으로 나을 거라는 생각이 든다.

