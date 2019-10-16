---
layout:   post
title:    "[이펙티브 자바 3판] 12장. 직렬화"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter12: Serialization"
category: Java
date: "2019-10-11 00:32:29"
comments: true
---

# 목차
- <a href="#아이템-85-자바-직렬화의-대안을-찾으라">아이템 85. 자바 직렬화의 대안을 찾으라</a>
- <a href="#아이템-86-serializable을-구현할지는-신중히-결정하라">아이템 86. Serializable을 구현할지는 신중히 결정하라</a>
- <a href="#아이템-87-커스텀-직렬화-형태를-고려해보라">아이템 87. 커스텀 직렬화 형태를 고려해보라</a>
- <a href="#아이템-88-readobject-메서드는-방어적으로-작성하라">아이템 88. readObject 메서드는 방어적으로 작성하라</a>
- <a href="#아이템-89-인스턴스-수를-통제해야-한다면-readresolve보다는-열거-타입을-사용하라">
아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라</a>
- <a href="#아이템-90-직렬화된-인스턴스-대신-직렬화-프록시-사용을-검토하라">
아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라</a>

<br>

# 아이템 85. 자바 직렬화의 대안을 찾으라
> Prefer alternatives to Java serialization

직렬화는 공격 소지가 많아 위험하다. 이러한 직렬화의 위험을 피하는 가장 좋은 방법은 "아무 것도 역직렬화하지 않는 것이다."
꼭 이용해야 한다면 객체 역직렬화 필터링 등을 사용해보자.

- <a href="/post/prefer-alternatives-to-java-serialization" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 85. 자바 직렬화의 대안을 찾으라</a>

<div class="post_caption">자바 직렬화 대신에 JSON과 같은 대안을 선택하자.</div>

<br>

# 아이템 86. Serializable을 구현할지는 신중히 결정하라
> Implement Serializable with great caution

클래스에 `Serializable` 을 구현하도록 선언하면 직렬화 가능한 클래스가 된다. 매우 간단한 선언 방법과 다르게 구현한 대가는
매우 비싸다. 구현한 순간부터 많은 위험성을 갖게 되고 확장성을 잃게 된다.

## 릴리즈 후에 수정이 어렵다.
`Serializable`을 구현하면 직렬화 형태도 하나의 공개 API가 되는 것이다. 직렬화 형태는 적용 당시 클래스의 내부 구현 방식에
종속적이게 되는 것이다. 또한 클래스의 private과 package-private 인스턴스 필드마저 API로 공개되기 때문에 캡슐화도 깨진다.

클래스의 내부 구현을 수정한다면 원래의 직렬화 형태와 달라지게 된다. 구버전의 인스턴스를 직렬화한 후에 신버전 클래스로
역직렬화를 시도하면 오류가 발생할 것이다.

### SerialVersionUID
수정을 어렵게 만드는 요소로 직렬 버전 UID를 뽑을 수 있다. 모든 직렬화된 클래스는 고유 식별 번호를 부여받는다.
클래스 내부에 직접 명시하지 않는 경우 시스템이 런타임에 자동으로 생성한다.

SUID를 생성할 때는 클래스의 이름, 구현하도록 선언한 인터페이스들 등등이 고려된다. 따라서 나중에 수정하게 된다면 SUID 값도 변한다.
즉, 자동 생성되는 값에 의존하면 호환성이 쉽게 깨져버린다.

- <a href="/post/java-serialization-advanced" target="_blank">참고 링크: "자바 직렬화: SerialVersionUID는 무엇일까?"</a>

## 버그와 보안에 취약하다.
자바에서는 객체를 생성자를 이용해 만든다. 하지만 직렬화는 이러한 언어의 기본 방식을 우회하여 객체를 생성한다.
역직렬화는 일반 생성자의 문제가 그대로 적용되는 '숨은 생성자'이다. 역직렬화를 사용하면 불편식이 깨질 수 있고 허가되지 않은
접근에 쉽게 노출될 수 있다.

## 새로운 버전을 릴리즈할 때 테스트 요소가 많아진다.
직렬화 가능한 클래스가 수정되면, 새로운 버전의 인스턴스를 직렬화한 후에 구버전으로 역직렬화가 가능한지 테스트해야 할 것이다.
물론 그 반대의 경우도 테스트해야 한다.

## 구현 여부는 쉽게 결정할 것이 아니다.
 `Serializable`을 꼭 구현해야 한다면 클래스를 설계할 때마다 따르는 이득과 비용을 잘 고려해야 한다.
 예를 들어 BigInteger와 Instant 같은 '값' 클래스와 컬렉션 클래스는 Serializable을 구현하였고
 스레드 풀처럼 '동작' 하는 객체를 표현한 클래스는 대부분 구현하지 않았다.

## 상속용으로 설계된 클래스와 대부분의 인터페이스
상속 목적으로 설계된 클래스와 대부분의 인터페이스는 `Serializable`을 구현하면 안된다. 클래스를 확장하거나 인터페이스를 구현하는
대상에게 앞서 살펴본 위험성을 그대로 전이하는 것이다.

하지만 `Serializable`을 구현한 클래스만 지원하는 프레임워크를 사용해야 한다면 방법이 없을 것이다.
대표적으로 `Throwable` 클래스가 있는데 서버가 RMI를 통해 클라이언트로 예외를 보내기 위해 `Serializable`을 구현하였다.

만일 직렬화와 확장이 모두 가능한 클래스를 만든다면, 하위 클래스에서 `finalize` 메서드를 재정의하지 못하게 해야 한다.
간단하게 자신이 재정의하고 `final` 키워드를 붙이면 된다. 인스턴스 필드 중 기본값으로 초기화되면 위배되는 불변식이 있다면
아래와 같은 메서드를 추가해야 한다.

```java
private void readObjectNoData() throws InvalidObjectException {
    throw new InvalidObjectException("스트림 데이터가 필요합니다.");
}
```

## 내부 클래스는 직렬화를 구현하면 안된다.
기본 직렬화 형태가 명확하지 않다. 내부 클래스는 바깥 인스턴스의 참조와 유효 범위에 속한 지역변수를 저장하기 위한 필드가 필요하다.
이 필드들은 컴파일러가 자동으로 추가하는데, 익명 클래스와 지역 클래스의 네이밍 규칙이 자바 명세에 없는 것처럼 이 필드들도
어떻게 추가되는지 알 수가 없다. 단, 정적 멤버 클래스는 예외다.

<div class="post_caption">Serializable 선언은 간단한만큼 대가가 따른다.</div>

<br>

# 아이템 87. 커스텀 직렬화 형태를 고려해보라
> Consider using a custom serialized form

클래스가 `Serializable`을 구현하고 기본 직렬화 형태를 사용한다면 현재의 구현에 종속적이게 된다. 즉, 기존 직렬화 형태를
버릴 수 없게 된다. 따라서 유연성, 성능, 정확성과 같은 측면을 고민한 후에 합당하다고 생각되면 기본 직렬화 형태를 사용해야 한다.

# 이상적인 직렬화 형태
기본 직렬화 형태는 객체가 포함한 데이터뿐만 아니라 그 객체를 시작으로 접근할 수 있는 모든 객체와 객체들의 연결된 정보까지 나타낸다.
**이상적인 직렬화 형태**라면 물리적인 모습과 독립된 논리적인 모습만을 표현해야 한다. 객체의 물리적 표현과 논리적 내용이 같다면
기본 직렬화 형태를 선택해도 무방하다. 예를 들어 사람의 이름을 표현하는 클래스는 괜찮을 것이다.

```java
public class Name implements Serializable {
    /**
     * 성. null이 아니어야 한다.
     * @serial
     */
    private final Stirng lastName;

    /**
     * 이름. null이 아니어야 한다.
     * @serial
     */
    private final String firstName;

    /**
     * 중간이름. 중간이름이 없다면 null
     * @serial
     */
    private final String middleName;

    ... // 나머지 코드는 생략
}
```

이름은 논리적으로 성, 이름, 중간 이름이라는 3개의 문자열로 구성하는데 위 클래스의 인스턴스 필드들은
이 논리적인 구성 요소를 정확하게 반영했다.

기본 직렬화 형태가 적합해도 불변식 보장과 보안을 위해 `readObject` 메서드를 제공해야 하는 경우가 많다.
앞에서 살펴본 Name 클래스를 예로 들면, lastName과 firstName 필드가 null이 아님을 `readObject` 메서드가 보장해야 한다.

## 기본 직렬화 형태에 적합하지 않은 경우
객체의 물리적 표현과 논리적 내용이 같은 경우 기본 직렬화 형태를 선택해도 된다고 했다. 그렇다면 적절하지 않은 경우는 어떤 모습일까?

```java
public final class StringList implements Serializable {
    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {
        String data;
        Entry next;
        Entry previous;
    }
    // ... 생략
}
```

위 클래스는 논리적으로 문자열을 표현했고 물리적으로는 문자열들을 이중 연결 리스트로 표현했다. 이 클래스에 기본 직렬화 형태를
사용하면 각 노드에 연결된 노드들까지 모두 표현할 것이다. 따라서 객체의 물리적 표현과 논리적 표현의 차이가 클 때는 아래와 같은
문제가 생긴다.

- 공개 API가 현재의 내부 표현 방식에 종속적이게 된다.
  - 예를 들어, 향후 버전에서는 연결 리스트를 사용하지 않게 바꾸더라도 관련 처리는 필요해진다. 따라서 코드를 절대 제거할 수 없다.
- 사이즈가 크다.
  - 위의 StringList 클래스를 예로 들면, 기본 직렬화를 사용할 때 각 노드의 연결 정보까지 모두 포함될 것이다.
  - 하지만 이런 정보는 내부 구현에 해당하니 직렬화 형태에 가치가 없다. 오히려 네트워크로 전송하는 속도를 느리게 한다.
- 시간이 많이 걸린다.
  - 직렬화 로직은 객체 그래프의 위상에 관한 정보를 알 수 없으니, 직접 순회할 수밖에 없다.
- 스택 오버플로를 발생시킨다.
  - 기본 직렬화 형태는 객체 그래프를 재귀 순회한다. 호출 정도가 많아지면 이를 위한 스택이 감당하지 못할 것이다.

## 합리적인 직렬화 형태
그렇다면 합리적인 직렬화 형태는 어떤 모습일까? 단순히 리스트가 포함한 문자열의 개수와 문자열들만 있으면 될 것이다.
물리적인 상세 표현은 배제하고 논리적인 구성만을 담으면 된다. 앞에서 살펴본 클래스를 개선해보자.

```java
public final class StringList implements Serializable {
    private transient int size = 0;
    private transient Entry head = null;

    // 이번에는 직렬화 하지 않는다.
    private static class Entry {
        String data;
        Entry next;
        Entry previous;
    }

    // 문자열을 리스트에 추가한다.
    public final void add(String s) { ... }

    /**
     * StringList 인스턴스를 직렬화한다.
     */
    private void writeObject(ObjectOutputStream stream)
            throws IOException {
        stream.defaultWriteObject();
        stream.writeInt(size);

        // 모든 원소를 순서대로 기록한다.
        for (Entry e = head; e != null; e = e.next) {
            s.writeObject(e.data);
        }
    }

    private void readObject(ObjectInputStream stream)
            throws IOException, ClassNotFoundException {
        stream.defaultReadObject();
        int numElements = stream.readInt();

        for (int i = 0; i < numElements; i++) {
            add((String) stream.readObject());
        }
    }
    // ... 생략
}
```

`transient` 키워드가 붙은 필드는 기본 직렬화 형태에 포함되지 않는다. 클래스의 모든 필드가 `transient`로 선언되었더라도
`writeObject`와 `readObject` 메서드는 각각 `defaultWriteObject`와 `defaultReadObject` 메서드를 호출한다. 직렬화 명세에는
이 과정을 무조건 할 것을 요구한다. 이렇게 해야 향후 릴리즈에서 `transient`가 아닌 필드가 추가되더라도 상위와 하위 모두 호환이
가능하기 때문이다.

신버전의 인스턴스를 직렬화한 후에 구버전으로 역직렬화하면 새로 추가된 필드는 무시될 것이다. 또 구버전 `readObject` 메서드에서
`defaultReadObject`를 호출하지 않는다면 역직렬화 과정에서 `StreamCorruptedException`이 발생한다.

## 고려할 점
기본 직렬화 여부에 관계없이 `defaultWriteObject` 메서드를 호출하면 `transient`로 선언하지 않은 모든 필드는 직렬화된다.
따라서 `transient` 키워드를 선언해도 되는 필드라면 모두 붙여주자. 논리적 상태와 무관한 필드라고 판단될 때만 생략하면 된다.

기본 직렬화를 사용한다면 역직렬화할 때 `transient` 필드는 기본값으로 초기화된다. 기본값을 변경해야 하는 경우에는 `readObject`
메서드에서 `defaultReadObject` 메서드를 호출한 다음 원하는 값으로 지정하면 된다. 아니면 그 값을 처음 사용할 때 초기화해도 된다.

## 동기화
기본 직렬화 사용 여부와 상관없이 직렬화에도 동기화 규칙을 적용해야 한다. 예를 들어 모든 메서드를 `synchronized`로 선언하여
스레드 안전하게 만든 객체에 기본 직렬화를 사용한다면, `writeObject`도 아래처럼 수정해야 한다.

```java
private synchronized void writeObject(ObjectOutputStream stream)
        throws IOException {
    stream.defaultWriteObject();
}
```

## SerialVersionUID
어떤 직렬화 형태를 선택하더라도 직렬화가 가능한 클래스에는 SerialVersionUID(이하 SUID)를 명시적으로 선언해야 한다.
물론 선언하지 않으면 자동 생성되지만 런타임에 이 값을 생성하느라 복잡한 연산을 수행해야 한다.

```java
// 무작위로 고른 long 값
private static final long serialVersionUID = 0204L;
```

SUID가 꼭 유니크할 필요는 없다. 다만 이 값이 변경되면 기존 버전 클래스와의 호환을 끊게 되는 것이다.
따라서 호환성을 끊는 경우가 아니라면 SUID 값을 변경해서는 안 된다.


<div class="post_caption">객체를 적절히 설명하는 커스텀 직렬화 형태를 고민해보자.</div>

<br>

# 아이템 88. readObject 메서드는 방어적으로 작성하라
> Write readObject methods defensively

<br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

<br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances