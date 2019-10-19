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

## 방어적 복사를 사용하는 불변 클래스
_"아이템 50. 적시에 방어적 복사본을 만들라"_ 에서는 불변식을 지키고 불변을 유지한 날짜 클래스를 만들기 위해 생성자와 접근자(getter)에서
Date 객체를 방어적으로 복사하도록 했다. 아래와 같은 모습이다.

- <a href="/post/make-defensive-copies-when-needed" target="_blank">
관련 참고: "[이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라"</a>

```java
public final class Period {
    private final Date start;
    private final Date end;

    /**
     * @param  start 시작 시각
     * @param  end 종료 시각; 시작 시각보다 뒤여야 한다.
     * @throws IllegalArgumentException 시작 시각이 종료 시각보다 늦을 때 발생한다.
     * @throws NullPointerException start나 end가 null이면 발생한다.
     */
    public Period(Date start, Date end) {
        this.start = new Date(start.getTime()); // 가변인 Date 클래스의 위험을 막기 위해 새로운 객체로 방어적 복사
        this.end = new Date(end.getTime());

        if (this.start.compareTo(this.end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
    }

    public Date start() { return new Date(start.getTime()); }
    public Date end() { return new Date(end.getTime()); }
    public String toString() { return start + " - " + end; }
    // ... 나머지 코드는 생략
}
```

물리적 표현과 논리적 표현이 같기 때문에 기본 직렬화 형태를 사용해도 무방하다. 따라서 `Serializable`만 구현하면 될 것 같다.
하지만 실제로는 불변식을 보장하지 못하게 된다. `readObject`가 또 다른 public 생성자이기 때문이다.

`readObject` 메서드도 생성자와 같은 수준으로 주의해야 한다. 인수가 유효한지 검사하고, 매개변수를 방어적으로 복사해야 한다.
그렇지 않다면 불변식을 깨뜨리는 공격으로부터 취약해질 수 있다.

## readObject 메서드
`readObject` 메서드는 매개변수로 바이트 스트림을 받는 생성자라고 할 수 있다. 보통 바이트 스트림은 정상적으로 생성된 인스턴스를
직렬화해서 만들어진다. 하지만 불변을 깨뜨릴 의도로 만들어진 바이트 스트림을 받으면 문제가 생긴다. 정상적인 방법으로는 만들어낼 수 없는
객체를 생성할 수 있기 때문이다. 

단순하게 앞서 살펴본 `Period` 클래스에 `Serializable` 구현을 추가했다고 가정했을 때, 아래와 같은 코드는 불변식을 깨뜨리는 공격을
할 수 있다.

```java
public class BogusPeriod {
    // 진짜 Period 인스턴스에서는 만들어질 수 없는 바이트 스트림,
    // 정상적인 Period 인스턴스를 직렬화한 후에 손수 수정한 바이트 스트림이다.
    private static final byte[] serializedForm = {
        (byte)0xac, (byte)0xed, 0x00, 0x05, 0x73, 0x72, 0x00, 0x06,
        0x50, 0x65, 0x72, 0x69, 0x6f, 0x64, 0x40, 0x7e, (byte)0xf8,
        ... 생략
    }

    // 상위 비트가 1인 바이트 값들은 byte로 형변환 했는데,
    // 이유는 자바가 바이트 리터럴을 지원하지 않고 byte 타입은 부호가 있는(signed) 타입이기 때문이다.

    public static void main(String[] args) {
        Period p = (Period) deserialize(serializedForm);
        System.out.println(p);
    }

    // 주어진 직렬화 형태(바이트 스트림)로부터 객체를 만들어 반환한다.
    static Object deserialize(byte[] sf) {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(sf)) {
            try (ObjectInputStream objectInputStream = new ObjectInputStream(byteArrayInputStream)) {
                return objectInputStream.readObject();
            }
        } catch (IOException | ClassNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
```

```bash
# 실행 결과, end가 start 보다 과거다. 즉, Period의 불변식이 깨진다.
Fri Jan 01 12:00:00 PST 1999 - Sun Jan 01 12:00:00 PST 1984
```

이처럼 직렬화할 수 있도록 선언한 것만으로도 클래스의 불변식을 깨뜨린 객체를 만들 수 있게 된다.

## 어떻게 방어할 수 있을까?
`readObject` 메서드가 `defaultReadObject`를 호출하게 한 후에 역직렬화된 객체가 유효한지 검사해야 한다. 여기서 유효성 검사에
실패한다면 `InvalidObjectException`을 던져 잘못된 역직렬화가 발생하는 것을 막아야 한다.

```java
private void readObject(ObjectInputStream s)
        throws IOException, ClassNotFoundException {

    // 불변식을 만족하는지 검사한다.
    if (start.compareTo(end) > 0) {
        throw new InvalidObjectException(start + "after" + end);
    }
}
```

그래도 아직 부족하다. 정상적인 Period 인스턴스에서 시작된 바이트 스트림 끝에 `private Date` 필드로의 참조를 추가하면
가변적인 Period 인스턴스를 만들어낼 수 있다.

공격자가 역직렬화를 통해 바이트 스트림 끝의 참조 값을 읽으면 Period의 내부 정보를 얻을 수 있다. 이 참조를 이용하여 인스턴스를 수정할 수 있다.
즉, 불변이 아니게 되는 것이다.

```java
public class MutablePeriod {
    // Period 인스턴스
    public final Period period;

    // 시작 시각 필드 - 외부에서 접근할 수 없어야 한다.
    public final Date start;

    // 종료 시각 필드 - 외부에서 접근할 수 없어야 한다.
    public final Date end;

    public MutablePeriod() {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream out = new ObjectOutputStream(bos);

            // 유효한 Period 인스턴스를 직렬화한다.
            out.writeObject(new Period(new Date(), new Date()));

            /*
             * 악의적인 '이전 객체 참조', 즉 내부 Date 필드로의 참조를 추가한다.
             * 상세 내용은 자바 객체 직렬화 명세의 6.4절 참조.
             */
            byte[] ref = { 0x71, 0, 0x7e, 0, 5 }; // 참조 #5
            bos.write(ref); // 시작(start) 필드
            ref[4] = 4; // 참조 #4
            bos.write(ref); // 종료(end) 필드

            ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(bos.toByteArray()));
            period = (Period) in.readObject();
            start = (Date) in.readObject();
            end = (Date) in.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new AssertionError(e);
        }
    }

    public static void main(String[] args) {
        MutablePeriod mp = new MutablePeriod();
        Period p = mp.period;
        Date pEnd = mp.end;

        // 시간을 되돌린다.
        pEnd.setYear(78);
        System.out.println(p);

        // 60년대로 돌아간다.
        pEnd.setYear(69);
        System.out.println(p);
    }
}
```

```bash
Wed Nov 22 00:21:29 PST 2017 - Wed Nov 22 00:21:29 PST 1978
Wed Nov 22 00:21:29 PST 2017 - Sat Nov 22 00:21:29 PST 1969
```

문제의 원인은 `Period`의 `readObject` 메서드가 방어적 복사를 하지 않음에 있다.
**역직렬화를 할 때는 클라이언트가 접근해서는 안 되는 객체 참조를 갖는 필드는 모두 방어적으로 복사를 해야 한다.**

## 방어적 복사와 유효성 검사를 모두 수행한다.
`Period`를 공격으로부터 보호하기 위해 방어적 복사를 유효성 검사보다 먼저 수행해야 한다. 또한 Date의 `clone` 메서드는 사용되지 않았다.

```java
private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // 가변 요소들을 방어적으로 복사한다.
    start = new Date(start.getTime());
    end = new Date(end.getTime());

    // 불변식을 만족하는지 검사한다.
    if (start.compareto(end) > 0) {
        throw new InvalidObjectException(start + " after " + end);
    }
}
```

```bash
# MutablePeriod의 main 메서드 출력 결과. 
Fri May 31 01:01:06 KST 2019 - Fri May 31 01:01:06 KST 2019
Fri May 31 01:01:06 KST 2019 - Fri May 31 01:01:06 KST 2019
```

한편 `final` 필드는 방어적 복사가 불가능하니 주의해야 한다. 따라서 start와 end 필드에서 `final` 키워드를 제거해야 한다.
공격을 받는 것보다는 더 나은 방향이다.

## 그럼 언제 기본 readObject를 사용할까?
`transient` 필드를 제외한 모든 필드의 값을 매개변수로 받아 유효성 검사를 없이도 필드에 대입하는 public 생성자를 추가해도 괜찮다고 판단되면
기본 `readObject` 메서드를 사용해도 된다. 아닌 경우 직접 `readObject` 메서드를 정의하여 생성자에서 수행했어야 할 모든 유효성 검사와
방어적 복사를 수행해야 한다. 가장 추천되는 것은 **직렬화 프록시 패턴**을 사용하는 것이다. 역직렬화를 안전하게 만드는 데 필요한 노력을 줄여준다.

`final`이 아닌 직렬화 가능한 클래스라면 생성자처럼 `readObject` 메서드도 재정의(overriding) 가능한 메서드를 호출해서는 안 된다.
하위 클래스의 상태가 완전히 역직렬회되기 전에 하위 클래스에서 재정의된 메서드가 실행되기 때문이다.

## 정리하면
* `readObject` 메서드를 작성할 때는 언제나 public 생성자를 작성하는 자세로 임해야 한다.
* `readObject` 메서드는 어떤 바이트 스트림이 넘어오더라도 유효한 인스턴스를 만들어내야 한다.
  * 이 바이트 스트림이 항상 진짜 직렬화된 인스턴스라고 믿으면 안 된다.
* 안전한 `readObject` 메서드를 작성하는 지침
  * `private` 이여야 하는 객체 참조 필드는 각 필드가 가리키는 객체를 방어적으로 복사하라.
  * 모든 불변식을 검사하고, 어긋난다면 `InvalidObjectException`을 던져라
  * 역직렬화한 후 객체 그래프 전체의 유효성을 검사해야 한다면 ObjectInputValidation 인터페이스를 사용하라.
    * 이 부분은 책에서 다루지 않는다.
  * 재정의(overriding) 가능한 메서드는 호출하지 말자.

<br>

# 아이템 89. 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라
> For instance control, prefer enum types to readResolve

<br>

# 아이템 90. 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라
> Consider serialization proxies instead of serialized instances