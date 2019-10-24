---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 88. readObject 메서드는 방어적으로 작성하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 88. Write readObject methods defensively"
category: Java
date: "2019-10-20 23:12:56"
comments: true
---

# 방어적 복사를 사용하는 불변 클래스
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

<br/>

# readObject 메서드
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

<br/>

# 어떻게 방어할 수 있을까?
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

<br/>

# 방어적 복사와 유효성 검사를 모두 수행한다.
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

<br/>

# 그럼 언제 기본 readObject를 사용할까?
`transient` 필드를 제외한 모든 필드의 값을 매개변수로 받아 유효성 검사를 없이도 필드에 대입하는 public 생성자를 추가해도 괜찮다고 판단되면
기본 `readObject` 메서드를 사용해도 된다. 아닌 경우 직접 `readObject` 메서드를 정의하여 생성자에서 수행했어야 할 모든 유효성 검사와
방어적 복사를 수행해야 한다. 가장 추천되는 것은 **직렬화 프록시 패턴**을 사용하는 것이다. 역직렬화를 안전하게 만드는 데 필요한 노력을 줄여준다.

`final`이 아닌 직렬화 가능한 클래스라면 생성자처럼 `readObject` 메서드도 재정의(overriding) 가능한 메서드를 호출해서는 안 된다.
하위 클래스의 상태가 완전히 역직렬회되기 전에 하위 클래스에서 재정의된 메서드가 실행되기 때문이다.

<br/>

# 정리하면
* `readObject` 메서드를 작성할 때는 언제나 public 생성자를 작성하는 자세로 임해야 한다.
* `readObject` 메서드는 어떤 바이트 스트림이 넘어오더라도 유효한 인스턴스를 만들어내야 한다.
  * 이 바이트 스트림이 항상 진짜 직렬화된 인스턴스라고 믿으면 안 된다.
* 안전한 `readObject` 메서드를 작성하는 지침
  * `private` 이여야 하는 객체 참조 필드는 각 필드가 가리키는 객체를 방어적으로 복사하라.
  * 모든 불변식을 검사하고, 어긋난다면 `InvalidObjectException`을 던져라.
  * 역직렬화 후 객체 그래프 전체의 유효성을 검사해야 한다면 `ObjectInputValidation`를 사용하라.
  * 재정의(Overriding) 가능한 메서드는 호출하지 말자.