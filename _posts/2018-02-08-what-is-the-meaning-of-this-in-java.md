---
layout:   post
title:    자바의 this 키워드
author:   Kimtaeng
tags: 	  java this
description: "자바에서 객체 자기 자신을 가리키는 this 키워드를 알아보자"
category: Java
comments: true
---

# 들어가기에 앞서

우리가 인스턴스를 생성하는 이유는 무엇일까? 그러니까 ```new 클래스이름()``` 라는 코드를 실행하여 메모리에 할당하고 생성된
인스턴스를 가리키는 레퍼런스를 통해 그 인스턴스의 멤버 필드나 메서드를 실행한다. 아래처럼 말이다.

```java
class MadPlay {
    String name;

    public void sayHi() {
        System.out.println("Hi!")
    }

    public static void main(String[] args) {
        MadPlay ref = new MadPlay();
        ref.sayHi();
    }
}
```

위 코드를 하나씩 뜯어보자. 먼저 ```MadPlay``` 라는 클래스를 정의했다. 그리고 이 클래스에는 문자열(String) 타입의 name이 있다.
그리고 단순 문자열을 출력하는 sayHi 라는 메서드가 있다.

다음으로 자바 코드의 시작인 **main 메서드**를 보자. MadPlay 클래스의 객체(인스턴스)를 생성하고, 이를 ref라는 이름의 레퍼런스에
담았다. 즉, 여기서 **레퍼런스 ref**는 생성된 MadPlay 클래스의 객체를 가리키고 있다. 그리고 이를 통해 인스턴스 멤버(메서드)를
호출하고 있다. 이처럼 클래스의 멤버는 그 클래스의 객체를 생성하지 않으면 사용이 불가능하다. 즉, 인스턴스 멤버는 인스턴스를
통해서만 사용한다.

<br/>

# this

자바 프로그램을 개발하다보면 언젠가는 ```this``` 키워드를 만나게 된다. 객체 자신을 가리키는 키워드인데, 조금 더 풀어보면
현재 실행되고 있는 컨텍스트에 속한 객체에 대한 레퍼런스를 말한다. 어떤 경우에는 컴파일러에 의해 자동으로 생성되기 때문에
반드시 필수적으로 붙여야 하는 것은 아니다. 하지만 아래와 같은 경우는 다르다. 클래스의 멤버 변수와 수정자(setter)의
매개변수의 이름이 같은 경우 어떻게 될까?

```java
class Person {
    String name;

    public void setName(String name) {
        this.name = name // !?
    }

    public String getName() {
        return name;
    }

    // ...
}

public static void main(String[] args) {
    Person p = new Person();
    p.setName("MadPlay");
}
```

위의 수정자(setter)에서 ```this``` 키워드를 생략하면 어떻게 될까? 알아서 잘 대입해주길 기대하겠지만 그렇지 않다. 자기 자신에게
값을 할당하고 있다는 경고 메시지를 만날 수 있다. **변수의 지역성**으로 인해 두 개의 name이 모두 지역 변수를 뜻하게 된다.
그렇기 때문에 ```this```는 이처럼 멤버 필드임을 명확하게 하기 위해 사용할 수 있다.

반면에 접근자(getter)에서는 this를 사용하지 않았다. 매개변수가 없을뿐더러 접근자 메서드가 수행되는 블록 내에서는 동일한 이름을
가진 변수가 없다. 따라서 접근자 내의 name은 멤버 필드임이 명확하다.

<br/>

# this와 생성자

```this```는 생성자와도 같이 사용할 수 있다. 자기 자신의 생성자를 호출할 때 사용된다.

```java
public class Person {
    private String name;
    private String email;
    private String phoneNumber;

    public Person(String name) {
        this(name, null);
    }

    public Person(String name, String email) {
        this(name, email, null);
    }

    public Person(String name, String email, String phoneNumber) {
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }
}
```

여기서 주의할 점은 생성자의 가장 첫 번째 줄에 위치해야 한다는 점이다. 이처럼 메서드 호출과 같은 ```this()```는 생성자에서만
사용이 가능하다.

<br/>

# this와 자기 반환

앞서 얘기한 것처럼 ```this```는 객체 자신을 가리키는 키워드이다. 이를 이용하여 자기 자신의 레퍼런스를 반환할 수 있다.
앞에서 만든 **this와 생성자** 코드를 조금 수정해보자. 여기서는 빌더(builder) 패턴을 사용할 것이다.

```java
public class Person {
    private String name;
    private String email;
    private String phoneNumber;

    public static class Builder {
        private String name;
        private String email;
        private String phoneNumber;

        // 생성자
        public Builder(String name) {
            this.name = name;
        }

        public Builder email(String value) {
            email = value;
            return this; // 자기 자신 반환
        }

        public Builder phoneNumber(String value) {
            phoneNumber = value;
            return this; // 자기 자신 반환
        }

        public Person build() {
            return new Person(this);
        }
    }

    private Person(Builder builder) {
        name = builder.name;
        email = builder.email;
        phoneNumber = builder.phoneNumber;
    }
}
```

메서드에서 자기 자신을 반환할 수 있는 점을 이용하여 빌더 패턴을 적용하였다. 생성자에 매개변수가 많은 경우에 이처럼 ```this```를
이용한 빌더 패턴을 적용하는 방법도 좋다.

<br/>

# this 와 정적 메서드

```this``` 키워드는 실행 중에 즉, 동적으로 자기 자신 객체에 대한 레퍼런스라고 정의된다.
따라서 정적(static) 메서드에서는 사용할 수 없다.

```java
class Person {
    private String name;

    public static void someMethod(String name) {
        // Cannot use this in a static context 오류.
        this.name = name;
    }
}
```