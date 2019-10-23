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

이상적인 직렬화 형태는 물리적인 모습과 독립된 논리적인 모습만을 표현해야 한다. 클래스가 `Serializable`을 구현하고
기본 직렬화 형태를 사용한다면 현재의 구현에 종속적이게 된다.

- <a href="/post/consider-using-a-custom-serialized-form" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 87. 커스텀 직렬화 형태를 고려해보라</a>

<div class="post_caption">객체를 적절히 설명하는 커스텀 직렬화 형태를 고민해보자.</div>

<br>

# 아이템 88. readObject 메서드는 방어적으로 작성하라
> Write readObject methods defensively

`readObject` 메서드는 또 다른 `public` 생성자와 같다. 그렇기 때문에 생성자와 같은 수준으로 다뤄야 한다.
인수의 유효성 검사와 매개변수를 방어적으로 복사하는 일이 필요하다.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 88. readObject 메서드는 방어적으로 작성하라</a>

<div class="post_caption">readObject 메서드를 작성할 때는 주의하자.</div>

<br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

앞선 아이템 3에서는 아래와 같은 싱글턴 패턴 예제를 보았다.

```java
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }

    ...
}
```

하지만 이 클래스는 `Serializable`을 구현하게 되는 순간 싱글턴이 아니게 된다. 기본 직렬화를 쓰지 않거나 명시적인 `readObject` 메서드를
제공하더라도 소용이 없다. 어떤 `ReadObject` 메서드를 사용하더라도 초기화될 때 만들어진 인스턴스와 다른 인스턴스를 반환하게 된다.

이때 `readResolve` 메서드를 이용하면 `readObject` 메서드가 만든 인스턴스를 다른 것으로 대체할 수 있다. 이때 `readObject` 가
만들어낸 인스턴스는 가비지 컬렉션의 대상이 된다.

```java
private Object readResolve() {
    // 기존에 생성된 인스턴스를 반환한다.
    return INSTANCE;
}
```

한편 여기서 살펴본 `Elvis` 인스턴스의 직렬화 형태는 아무런 실 데이터를 가질 필요가 없으니 모든 인스턴스 필드는 `transient` 로 선언해야
한다. 그러니까 `readResolve` 메서드를 인스턴스의 통제 목적으로 이용한다면 모든 필드는 `transient`로 선언해야 한다.

만일 그렇지 않으면 역직렬화(Deserialization) 과정에서 역직렬화된 인스턴스를 가져올 수 있다. 즉, 싱글턴이 깨지게 된다.

하지만 `enum`을 사용하면 모든 것이 해결된다. 자바가 선언한 상수 외에 다른 객체가 없음을 보장해주기 때문이다.
물론 `AccessibleObject.setAccessible` 메서드와 같은 리플렉션을 사용했을 때는 예외다.

```java
public enum Elvis {
    INSTANCE;
    
    ...필요한 데이터들
}
```

인스턴스 통제를 위해 `readResolve` 메서드를 사용하는 것이 중요할 때도 있다. 직렬화 가능 인스턴스 통제 클래스를 작성해야 할 때,
컴파일 타임에는 어떤 인스턴스들이 있는지 모를 수 있다. 이 때는 열거 타입으로 표현하는 것이 불가능하기 때문에 `readResolve` 메서드를
사용할 수 밖에 없다.

<div class="post_caption">불변식을 지키기 위해 인스턴스를 통제할 때는 열거 타입을 사용하자.</div>

<br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances

## Serializable을 implements한 순간
정상적인 인스턴스 생성 방법인 생성자 이외의 방법이 생기게 된다. 버그와 보안 문제가 생길 가능성이 커진다는 것이다.
하지만 **직렬화 프록시 패턴**을 사용하면 위험을 크게 줄일 수 있다.

## 직렬화 프록시 패턴
바깥 클래스의 논리적 상태를 표현하는 중첩 클래스를 설계하여 `private static`으로 선언하다. 여기서 중첩 클래스가 직렬화 프록시다.

중첩 클래스의 생성자는 단 하나여야 하며, 바깥 클래스를 매개변수로 받아야 한다. 단순히 인수로 넘어온 인스턴스의 데이터를 복사한다.
일관성 검사 또는 방어적 복사도 필요가 없다. 다만 바깥 클래스와 직렬화 프록시 모두 `Serializable`을 구현해야 한다.

```java
class Period implements Serializable {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    private static class SerializationProxy implements Serializable {
        private static final long serialVersionUID = 2123123123;
        private final Date start;
        private final Date end;

        public SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        /**
         * Deserialize 할 때 호출된다.
         * 오브젝트를 생성한다.
         */
        private Object readResolve() {
            return new Period(start, end);
        }
    }


    /**
     * 이로 인해 바깥 클래스의 직렬화된 인스턴스를 생성할 수 없다.
     * 직렬화할 때 호출되는데, 프록시를 반환하게 하고 있다.
     *
     * Serialize할 때 호출된다.
     */
    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    /**
     * readObject, writeObject 가 있다면, 기본적으로 Serialization 과정에서
     * ObjectInputStream, ObjectOutputStream이 호출하게 된다.
     * 그 안에 커스텀 로직을 넣어도 된다는 것.
     */
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        // readObject는 deserialize할 때, 그러니까 오브젝트를 만들 때인데.
        // 이렇게 해두면, 직접 Period로 역직렬화를 할 수 없는 것이다.
        throw new InvalidObjectException("프록시가 필요해요.");
    }
}
```

## 직렬화 프록시 패턴의 장점
앞선 예제 코드에서 본 것처럼 멤버 필드를 `final`로 선언할 수 있기 때문에 진정한 불변으로 만들 수 있다.
또한 직렬화 프록시 패턴은 역직렬화한 인스턴스와 원래의 직렬화된 클래스가 달라도 정상적으로 동작한다.

대표적인 예로 `EnumSet`은 public 생성자 없이 정적 팩터리만 제공한다. 원소 개수가 64개 이하면 `RegularEnumSet`을 사용하고
그보다 크면 `JumboEnumSet`을 사용한다.

그런데, 64개짜리 원소를 가진 `EnumSet`을 직렬화한 다음에 원소 5개를 추가하고 역직렬화하면 어떻게 될까?
간단히 역직렬화할 때 `JumboEnumSet`으로 하면 된다. 이게 가능한 이유는 `EnumSet`에는 직렬화 프록시 패턴이 적용되어 있기 때문이다.

```java
private static class SerializationProxy <E extends Enum<E>>
        implements java.io.Serializable
{
    /**
     * The element type of this enum set.
     *
     * @serial
     */
    private final Class<E> elementType;

    /**
     * The elements contained in this enum set.
     *
     * @serial
     */
    private final Enum<?>[] elements;

    SerializationProxy(EnumSet<E> set) {
        elementType = set.elementType;
        elements = set.toArray(ZERO_LENGTH_ENUM_ARRAY);
    }

    // instead of cast to E, we should perhaps use elementType.cast()
    // to avoid injection of forged stream, but it will slow the implementation
    @SuppressWarnings("unchecked")
    private Object readResolve() {
        EnumSet<E> result = EnumSet.noneOf(elementType);
        for (Enum<?> e : elements)
            result.add((E)e);
        return result;
    }

    private static final long serialVersionUID = 362491234563181265L;
}

Object writeReplace() {
    return new SerializationProxy<>(this);
}

// readObject method for the serialization proxy pattern
// See Effective Java, Second Ed., Item 78.
private void readObject(java.io.ObjectInputStream stream)
    throws java.io.InvalidObjectException {
    throw new java.io.InvalidObjectException("Proxy required");
}
```

## 직렬화 프록시 패턴의 한계
클라이언트가 마음대로 확장할 수 있는 클래스에는 적용할 수 없다. 또한 객체가 서로 참조하는 상황, 그러니까 객체 그래프에 순환이 있는 클래스에도
적용할 수 없다. 이런 객체의 메서드를 직렬화 프록시의 `readResolve` 안에서 호출하려 하는 경우 예외가 발생할 것이다.
직렬화 프록시만 가진 것이지 실제 객체는 아직 만들어지지 않았기 때문이다. 또한 방어적 복사보다 상대적으로 속도도 느리다.

## 직렬화 프록시 패턴 테스트
직렬화 프록시가 어떻게 동작하는지 알아보기 위해 테스트 코드를 작성해보았다. 아래 전체 코드를 복사해서 디버깅해보면 된다.

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidObjectException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Base64;
import java.util.Date;

class Period implements Serializable {
    // final로 선언할 수 있는 장점이 있다.
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    private static class SerializationProxy implements Serializable {
        private static final long serialVersionUID = 2123123123;
        private final Date start;
        private final Date end;

        public SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        /**
         * Deserialize 할 때 호출된다.
         * 오브젝트를 생성한다.
         */
        private Object readResolve() {
            return new Period(start, end);
        }
    }


    /**
     * 이로 인해 바깥 클래스의 직렬화된 인스턴스를 생성할 수 없다.
     * 직렬화할 때 호출되는데, 프록시를 반환하게 하고 있다.
     *
     * Serialize할 때 호출된다.
     */
    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    /**
     * readObject, writeObject 가 있다면, 기본적으로 Serialization 과정에서
     * ObjectInputStream, ObjectOutputStream이 호출하게 된다.
     * 그 안에 커스텀 로직을 넣어도 된다는 것.
     */
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        // readObject는 deserialize할 때, 그러니까 오브젝트를 만들 때인데.
        // 이렇게 해두면, 직접 Period로 역직렬화를 할 수 없는 것이다.
        throw new InvalidObjectException("프록시가 필요해요.");
    }
}

/**
 * 직렬화 프록시를 테스트하는 코드
 * 
 * @author madplay
 */
public class SerializationTest {
    public String serializeMethod() {
        Period period = new Period(new Date(), new Date());

        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(period);
            // 바이트 배열로 생성된 데이터를 정상 출력하기 위해 base64 인코딩
            return Base64.getEncoder().encodeToString(bos.toByteArray());
        } catch (Exception e) {
            System.err.println(e);
        }
        return null;
    }


    public Period deserializeMethod(String serializedString) {
        // 앞선 직렬화에서 Base64 인코딩하였으므로 다시 디코딩한다.
        byte[] decodedData = Base64.getDecoder().decode(serializedString);
        try (ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            Object object = ois.readObject();
            return (Period) object;
        } catch (Exception e) {
            System.err.println(e);
        }
        return null;
    }

    public static void main(String[] args) {
        // 직렬화 프록시 테스트
        SerializationTest main = new SerializationTest();
        String serializedString = main.serializeMethod();
        Period period = main.deserializeMethod(serializedString);
    }
}
```