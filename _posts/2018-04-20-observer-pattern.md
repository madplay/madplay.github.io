---
layout:   post
title:    옵저버 패턴(Observer Pattern)
author:   Kimtaeng
tags: 	  DesignPattern
description: 객체의 상태가 변경될 때 그 객체에 의존하는 다른 객체가 알 수 있는 방법은 없을까? 
category: DesignPattern
date: "2018-04-20 01:32:12"
comments: true
---

# 옵저버 패턴이란?
객체의 상태가 변경될 때 그 객체에 의존하는 다른 객체가 그 변경을 통지받고 자동으로 내용이 갱신되도록 하는 방식을 말한다.
보통 상태를 갖고 있는 주제(Subject) 객체와 변경을 알고 있어야 하는 관찰자(Observer) 객체가 존재하며 이들은 1대N 관계를 갖는다.
즉, 하나의 주제에 한 개 이상의 관찰자가 존재할 수 있다.

<br>

# 예를 들어보자
언론사와 구독자 관계를 통해 옵저버 패턴을 알 수 있다. 매일 아침 새로운 뉴스를 발행할 때마다 구독자에게 신문을 배송한다.
인터넷 신문을 예로 들면, 새로운 기사가 홈페이지에 게시되면 구독자에게 새 기사가 업데이트 되었다는 알림을 보낼 수도 있다.

이처럼 새로운 뉴스를 보기 위한 구독자들은 정보를 제공하는 언론사를 구독하여 즉각적으로 기사가 발행된 것을 알 수 있으며
더 이상 정보가 필요하지 않다면 언론사 구독을 해지하여 기사 발행에 대한 알림이나 신문 배송을 받지 않을 수도 있다.

이를 옵저버 패턴에 대입해보면 언론사는 정보를 제공하는 주제(Subject)가 되는 것이고 구독자들은 관찰자(Observer)가 된다.

<br>

# 옵저버 패턴의 구조
아래는 옵저버 패턴을 표현한 클래스 다이어그램이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-20-observer-pattern-1.jpg"
width="500" alt="the structure of observer pattern"/>

각각 어떤 역할을 하는지 살펴보자. 구현 방식에 따라서 메서드의 네이밍이나 존재 여부가 다를 수 있다.

### Subject
주제를 나타내는 인터페이스다. 객체에서 관찰자를 등록하거나 관찰자 목록에서 제거하고 싶을 때는 이 인터페이스의 메서드들을
사용하면 된다. 네이밍은 예제마다 다를 수 있지만 클래스 다이어그램에서는 `registerOb`, `removeOb`로 정의하였다.

### ConcreteSubject
주제 역할을 하는 구상 클래스이다. Subject 인터페이스를 구현(implements) 해야 하며, 관찰자를 등록하거나 해지할 수 있는 메서드 외에
주제의 상태가 바뀔 때마다 모든 관찰자에게 통지할 수 있는 메서드가 있다. 클래스 다이어그램에서는 `notifyOb`로 정의하였다.

구현 방식에 따라 정보를 나타내는 멤버 필드가 다를 수 있다. 그리고 이 정보를 가져오기 위한 접근자(getter) 메서드와
수정자(setter) 메서드가 있을 수도 있고 없을 수도 있다. 새 정보가 `update`가 호출됨과 동시에 전달될 수도 있다.

### Observer
변경을 통보받는 관찰자 인터페이스다. 관찰자들은 이 인터페이스를 반드시 구현해야 한다. 관찰하는 주제의 상태가 변경되면
`update` 메서드가 호출된다.

### ConcreteObserver
`Observer` 인터페이스만 구현한다면 무엇이든 관찰자가 될 수 있다. 각 관찰자는 특정 주제 객체에 등록을 해서 객체의 변경을
통보받을 수 있다. 변경된 정보는 ConcreteSubject의 접근자를 통해 확인하거나 `update` 메서드를 통해 전달받는다.

<br>

# 옵저버 패턴 구현하기
이제 옵저버 패턴을 구현해보자. 관찰자 역할을 하는 구독자(Subscriber)가 있고 변경되는 주제 역할을 하는 언론사(Press)가 있다.


### Subject 인터페이스
```java
public interface Subject {
    void registerOb(Observer o);
    void removeOb(Observer o);
    void notifyOb();
}
```

### ConcreteSubject 구현
```java
import java.util.ArrayList;
import java.util.List;

/**
 * ConcreateSubject 역할을 한다.
 * @author madplay
 */
public class Press implements Subject {
    private String newsTitle;
    private List<Observer> observers;

    public Press() {
        this.observers = new ArrayList<>();
    }

    @Override
    public void registerOb(Observer o) {
        observers.add(o);
    }

    @Override
    public void removeOb(Observer o) {
        int index = observers.indexOf(o);
        if (index >= 0) {
            observers.remove(index);
        }
    }

    @Override
    public void notifyOb() {
        for (Observer o : observers) {
            o.update(newsTitle);
        }
    }

    public void setNewNewsTitle(String newsTitle) {
        this.newsTitle = newsTitle;
        notifyOb();
    }
}
```

### Observer 구현
```java
public interface Observer {
    void update(String newsTitle);
}
```


### ConcreteObserver 구현
```java
/**
 * ConcreateObserver 역할을 한다.
 * @author madplay
 */
public class NewsSubscriber implements Observer {

    Subject subject;

    public NewsSubscriber(Subject subject) {
        this.subject = subject;
        subject.registerOb(this);
    }

    @Override
    public void update(String newsTitle) {
        System.out.println("새로운 일반 기사 제목: " + newsTitle);
        System.out.println("업데이트 끝.");
    }

    public void unsubscribe() {
        subject.removeOb(this);
    }
}
```

### 실행해보기
```java
/**
 * 옵저버 패턴 테스트 코드
 */
public class ObserverPatternTester {

    public static void main(String[] args) {
        Press press = new Press();
        NewsSubscriber newsSubscriber = new NewsSubscriber(press);
        press.setNewNewsTitle("오늘 날씨는 매우 따뜻합니다.");
        newsSubscriber.unsubscribe();
    }
}
```

이제 테스트 코드를 통해 결과를 확인해보자.

```bash
새로운 일반 기사 제목: 오늘 날씨는 매우 따뜻합니다.
업데이트 끝.
```

<br>

# push vs pull
앞서 살펴본 옵저버 패턴은 변경 대상 객체인 주제(subject)가 관찰자에게 변경시마다 데이터를 건네는 푸시(push) 방식이었다.
반대로 관찰자가 데이터를 가져가는 풀(pull) 방식으로도 구현할 수도 있다. 

예제 구현을 위해서 이번에는 JDK에 내장된 옵저버 패턴을 이용할 것이다. `java.util` 패키지의 `Observer`와 `Observable` 클래스를
사용한다. 참고로 이들은 자바 9에서 `Deprecated` 되었으며 `Flow` API 사용이 권장된다.

### Subject 구현
앞서 살펴본 푸시 방식과 다르게 인터페이스를 정의할 필요가 없다. `java.util.Observable` 클래스를 확장하면 된다.

```java
import java.util.Observable;

public class Press extends Observable {
    private String newsTitle;

    public Press() {
        // 관찰자를 저장하는 리스트가 필요 없다.
    }

    public void newsUpdated() {
        // 상태가 변경되었다는 것을 인지시키는 Observable의 메서드다.
        setChanged();

        // 전달되는 매개변수가 없다. 즉, pull 방식이다.
        notifyObservers();
    }

    public void setNewsTitle(String newsTitle) {
        this.newsTitle = newsTitle;
        newsUpdated();
    }

    public String getNewsTitle() {
        return newsTitle;
    }
}
```

몇 가지 살펴보자. 먼저 생성자에는 더 이상 관찰자를 관리하는 리스트가 필요 없다.
또한 `notifyObservers` 메서드를 보면 전달되는 매개변수가 없는 것을 알 수 있다. 즉, 풀(pull) 방식을 사용한다.

한편 `setChanged` 란 메서드가 있는데, 상태가 변경되었는지 체크하는 플래그 메서드이다. `notifyObservers`가 호출되기 전에
이 메서드가 먼저 호출되어야 한다.

### Observer 구현
관찰자를 구현할 때도 푸시 방식과 다르게 관찰자 인터페이스를 만들지 않아도 된다. `java.util.Observer` 인터페이스를 구현하면 된다.

```java
import java.util.Observable;
import java.util.Observer;

public class NewsSubsriber implements Observer {
    private Observable observable;
    private String name;
    private String newsTitle;

    public NewsSubsriber(String name, Observable observable) {
        this.name = name;
        this.observable = observable;
        observable.addObserver(this);
    }

    @Override
    public void update(Observable o, Object arg) {
        if(o instanceof Press) {
            Press press = (Press) o;
            this.newsTitle = press.getNewsTitle();
            System.out.printf("구독자 이름: %s / 기사 제목: %s\n", name, newsTitle);
        }
    }
}

```

### 실행해보기

```java
public class ObserverPatterTest {
    public static void main(String[] args) {
        Press press = new Press();
        NewsSubsriber 어떤구독자 = new NewsSubsriber("어떤사람", press);
        NewsSubsriber 저런구독자 = new NewsSubsriber("저런사람", press);
        NewsSubsriber 이런구독자 = new NewsSubsriber("이런사람", press);
        press.setNewsTitle("오늘 날씨는 매우 따뜻합니다.");
        press.setNewsTitle("내일 날씨도 매우 따뜻할까요?");
    }
}
```

```bash
구독자 이름: 이런사람 / 기사 제목: 오늘 날씨는 매우 따뜻합니다.
구독자 이름: 저런사람 / 기사 제목: 오늘 날씨는 매우 따뜻합니다.
구독자 이름: 어떤사람 / 기사 제목: 오늘 날씨는 매우 따뜻합니다.
구독자 이름: 이런사람 / 기사 제목: 내일 날씨도 매우 따뜻할까요?
구독자 이름: 저런사람 / 기사 제목: 내일 날씨도 매우 따뜻할까요?
구독자 이름: 어떤사람 / 기사 제목: 내일 날씨도 매우 따뜻할까요?
```

### 내장 옵저버 패턴의 문제점
실행은 잘 되지만 앞서 언급한 것처럼 이 코드들은 사용하기에 아쉬운 점이 적지 않다. 

먼저 `Observable`가 인터페이스가 아닌 클래스다. 따라서 이를 확장(extends) 하여 서브 클래스를 만들어야 한다.
직접적으로 기능 추가가 불가능하다. 상속보다는 구성을 사용한다는 디자인 원칙도 위배한다.

이는 재사용에 제약을 주는 것이며 내부 메서드가 `protected` 접근 지정자로 되어있어 외부에서 호출할 수도 없다.
결과적으로는 리액티브(reactive) 스타일의 프로그래밍은 `Flow` API 사용이 권장된다.