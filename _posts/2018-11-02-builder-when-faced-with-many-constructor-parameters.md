---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 2. Consider a builder when faced with many constructor parameters" 
category: Java
comments: true
---

# 정적 팩토리나 생성자의 문제

선택적인 매개변수가 많을 때 적절하게 대응하기 어려운 점이 있습니다. 대부분 **점층적 생성자 패턴(telescoping constructor pattern)**을 사용할텐데요.
그러니까 필수 매개변수만 받는 생성자, 필수 매개변수와 선택적인 매개변수 N개 등을 갖고 있는 생성자처럼 말이지요.

예를 들어서 코드로 살펴보면 아래와 같습니다.

```java
public class Person {
    private final String name;  // 필수
    private final int age;  // 필수
    private final String phoneNumber;
    private final String email;

    public Person(String name, String age) {
        this(name, age, null);
    }

    public Person(String name, String age, String phoneNumber) {
        this(name, age, phoneNumber, null);
    }

    public Person(String name, String age, String phoneNumber, String email) {
        this.name = name;
        this.age = age;
        this.phoneNumber;
        this.email = email;
    }

    // 생성할 때는 이렇게
    public void someMethod() {
        Person person = new Person("탱", 29, 
            "010-1234-5678", "itsmetaeng@gmail.com");
    }
}
```

지금은 매개변수가 4개밖에 없어서 간단하지만, 연락처와 이메일 외에 집주소, SNS주소 등과 같이
다른 정보들이 추가된다면 어떨까요? 또, 위와 같은 형태는 타입과 인자의 순서를 바꾸는 실수를 하게 되면
오류를 찾기 매우 어려울 수 있습니다.

<br/>

# 그럼 자바빈(JavaBeans) 패턴을 사용하면 어떨까요?

매개변수가 없는 생성자로 객체를 생성한 후에 수정자(setter) 메서드를 호출해서 값을 채우는 것입니다!
코드로 살펴보면 아래와 같습니다.


```java
public class Person {
    private String name;  // 필수
    private int age;  // 필수
    private String phoneNumber;
    private String email;

    public Person() { }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    // ... 생략

    // 생성할 때는 이렇게
    public void someMethod() {
        Person person = new Person();
        person.setName("탱");
        person.setAge(29);
        // ... 생략
    }
}
```

점층적으로 증가하는 생성자 패턴의 문제점도 보이지 않고 읽기에도 더 좋아보입니다.
하지만! 1회의 메서드 호출로 객체 생성을 완료할 수 없게 되는데요. 그러니까 객체의 일관성(consistency)가 무너집니다.
한 번 수정하고 또 수정해야 하므로 변경 불가능(immutable)한 클래스를 만들 수 없게 되지요.

<br/>

# 그래서 빌더 패턴을 제안합니다.

빌더 패턴을 사용하면 **점층적인 생성자 패턴의 안정성과 자바빈 패턴의 가독성**을 함께할 수 있습니다.
기본 동작은 필요한 객체를 직접 만드는 것이 아니라 필수 매개변수만으로 생성자를 호출하여 빌더 객체를 얻고
수정자(setter) 역할을 하는 메서드들로 원하는 매개변수를 설정합니다. 마지막으로 build 메서드를 호출하여
변경 불가능한, 그러니까 immutable한 객체를 얻는 것입니다.

아래와 같이 코드로 나타내보면!

```java
public class Person {
    private String name;  // 필수
    private int age;  // 필수
    private String phoneNumber;
    private String email;

    public static class Builder {
        private String name;
        private int age;
        private String phoneNumber;
        private String email;

        public Builder(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public Builder phoneNumber(String value) {
            phoneNumber = value;
            return this;
        }

        public Builder email(String value) {
            email = value;
            return this;
        }

        public Person build() {
            return new Person(this);
        }
    }

    private Person(Builder builder) {
        name = builder.name;
        age = builder.age;
        phoneNumber = builder.phoneNumber;
        email = builder.email;
    }
}
```

Person 클래스는 불변이며 빌더의 setter 메서드들은 빌더 자신을 반환하기 때문에 연쇄적인 호출을 하게 되는데요.
이런 방식을 메서드 호출이 흐르듯 연결된다하여 플루언트 API(fluent API) 또는 메서드 연쇄(method chaining)이라고 합니다.

클래스의 객체를 생성하는 메서드를 살펴봅시다.

```java
public void someMethod() {
    Person person = new Person.Builder("탱", 29)
        .phoneNumber("010-1234-5678")
        .email("itsmetaeng@gmail.com")
        .build();
}
```

우선 **읽기 쉽습니다.** 그리고 build 메서드 안에서 인자들의 유효성 검사도 할 수 있습니다.

```java
public Builder phoneNumber(String value) {
    if(value == null || value.equals("")) {
        throw new IllegalStateException("phoneNumber must be not empty!");
    } else {
        email = value;
    }
    return this;
}
```

또한 **유연합니다.** 하나의 빌더 객체로 여러 객체를 만들 수도 있고요. 자동 증가(auto increment)가 필요한 필드는
자동으로 값을 채울 수도 있습니다. 그리고 아래와 같이 생성자 대비 장점으로 여러 개의 가변 인자 매개변수를 가질 수도 있습니다.

```java
public Builder someMethod(String ... values) {
    phoneNumber = values[0];
    email = values[1]; 
    // ... 생략
}
```

<br/>

# 좋은 점만 있는 걸까?

물론 단점도 있습니다. 객체를 생성하려면 우선 빌더부터 만들어야 하는 **귀찮음**이 있습니다.
코드가 많아지면 빌더의 코드만해도 꽤 길어질 것 같습니다. 이런 경우에는 롬복(lombok)의 @Builder 어노테이션을 쓰면 간편하긴 합니다.
필수적으로 만들어야하는 코드를 자동 생성해주는 고마운 라이브러리입니다!

```java
@Builder
public class Person {
    private String name;
    private int age;
    private String phoneNumber;
    private String email;
    
    // 만일 초기값을 지정하고 싶다면 @Builder.Default 어노테이션과 같이 적용
    @Builder.Default
    private int age = 29;
}
```

초기값을 지정하고 싶다면 위와 같이 추가적인 어노테이션과 함께 사용하면 됩니다. 참고로 final 필드에 대해서는 
자동으로 메서드를 생성해주지 않습니다. 

이펙티브 자바 서적에서는 객체 생성시 필요한 인자가 네 개 이상은 되어야 좋을 것 같다고 추천하지만,
개인적으로는 더 많아야 좋을 것 같기도 합니다. 개발을 진행하다보면 처음보다 매개변수가 많아지는 경향이 있지요.
처음에는 생성자로 시작했다가 차후 빌더 패턴으로 전환할 수도 있겠지만 애초에 빌더로 시작하는 것도 좋을 것 같습니다.