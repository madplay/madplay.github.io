---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 42. 익명 클래스보다는 람다를 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 42. Prefer lambdas to anonymous classes" 
category: Java
comments: true
---

# 함수 객체
자바에서 함수 타입을 표현할 때 추상 메서드를 하나만 담은 인터페이스(또는 추상 클래스)를 사용하곤 했습니다.
이러한 인터페이스의 인스턴스를 **함수 객체(function Object)**라고 하여 특정 함수나 동작을 나타내는 데 썼습니다.

<br/> 

# 익명 클래스(Anonymous Class)
`JDK 1.1` 버전부터는 함수 객체를 만들 때 **익명 클래스(Anonymous Class)**를 주로 사용했습니다.
하지만 익명 클래스 방식은 코드가 너무 길기 때문에 자바는 함수형 프로그래밍(Functional Programming)에 적합하지 않아 보입니다.

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");

        Collections.sort(words, new Comparator<String>() {
            public int compare(String s1, String s2) {
                return Integer.compare(s1.length(), s2.length());
            }
        });
    }
}
```

<br/>

# 람다(lambda)
`JDK 1.8` 버전 부터는 추상 메서드 하나 짜리 인터페이스, 즉 함수형 인터페이스를 말하는데
그 인터페이스의 인스턴스를 람다식(lambda expression, 짧게 람다)라고 사용해 만들 수 있게 되었습니다.
위의 익명 클래스로 구현한 정렬을 람다를 사용하면 아래와 같이 구현할 수 있습니다.

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");

        Collections.sort(words,
                (s1, s2) -> Integer.compare(s1.length(), s2.length()));
    }
}
```

여기서 `람다의 타입은 (Comparator<String>)`이고 `매개변수 (s1, s2)의 타입은 String`이며
그리고 `반환값의 타입은 int` 입니다. 하지만 컴파일러가 코드의 문맥을 살펴 타입을 추론했기 때문에
코드 상에는 이 타입들이 명시되어 있지 않습니다. 타입을 명시해야 코드가 명확할 때를 제외하고는
람다의 모든 매개변수 타입은 생략하고 상황에 따라 컴파일러가 타입을 결정하지 못하여 오류가 발생할 때는
해당 타입을 명시하면 됩니다.

한편 컴파일러가 타입을 추론하는 데 필요한 타입 정보 대부분을 제네릭에서 얻습니다. 그래서 이 정보를
제공하지 않으면 컴파일러는 람다의 타입 추론을 할 수 없게 되어 개발자가 일일이 명시해야 합니다.

위의 코드는 아래처럼 조금 더 간략해질 수 있습니다.

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");
        Collections.sort(words, Comparator.comparingInt(String::length));
    }
}
```

조금 더 나아가 `JDK 1.8` 버전 이상을 사용하게 되면 `List 인터페이스`에 추가된
`sort 메서드`를 사용할 수 있습니다.

```java
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");
        words.sort(Comparator.comparingInt(String::length));
    }
}
```

그리고 <a href="/post/use-enums-instead-of-int-constants" target="_blank">
[이펙티브 자바 3판] 아이템 34. INT 상수 대신 열거 타입을 사용하라(링크)
</a> 에서 살펴본 `enum`을 예로 들어 조금 더 간결하고 깔끔하게 만들 수 있습니다. 우선 기존 코드를 보면 아래와 같습니다.

```java
enum Operation {
    PLUS("+") { 
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x * y; }
    };
    
    private final String symbol;
   
    Operation(String symbol) { this.symbol = symbol; }
    
    @Override public String toString() { return symbol; } 
    public abstract double apply(double x, double y);
}
```

여기서 람다를 이용하면 열거 타입의 인스턴스 필드를 이용하는 방식으로 상수별로 다르게 동작하는 코드를
쉽게 구현이 가능합니다.

```java
import java.util.function.DoubleBinaryOperator;

enum Operation {
    PLUS("+", (x, y) -> x + y),
    MINUS("-", (x, y) -> x - y),
    TIMES("*", (x, y) -> x * y),
    DIVIDE("/", (x, y) -> x / y);

    private final String symbol;
    private final DoubleBinaryOperator op;

    Operation(String symbol, DoubleBinaryOperator op) {
        this.symbol = symbol;
        this.op = op;
    }

    @Override
    public String toString() { return symbol; }

    public double apply(double x, double y) {
        return op.applyAsDouble(x, y);
    }
}

public class Main {
    public static void main(String[] args) {
        // 사용은 아래와 같이
        Operation.PLUS.apply(2, 3);
    }
}
```

`DoubleBinaryOperator`는 `java.util.function` 패키지에 있는 Double 타입 인수 2개를 받아
Double 타입 결과를 반환해주는 인터페이스입니다.

<br/>

# 람다의 한계
하지만 람다를 사용하기에 적절하지 못한 경우도 있습니다. 람다는 이름도 없고 메서드나 클래스와 다르게 문서화도 할 수 없습니다.
그래서 코드 자체로 동작이 명확하게 설명되지 않거나 코드 라인 수가 많아지면 사용하는 것을 고려해야 합니다.
람다가 길거나 읽기 어렵다면 오히려 쓰지 않는 방향으로 리팩토링 하는 것을 권장합니다.

그리고 추상 클래스의 인스턴스를 만들 때 람다를 사용할 수 없습니다. 이럴 때는 익명 클래스를 사용해야 합니다.

```java
abstract class Hello {
    public void sayHello() {
        System.out.println("Hello!");
    }
}

public class Main {
    public static void main(String[] args) {
        // 이건 원래 안돼요~
        // Hello hello = new Hello();

        Hello instance1 = new Hello() {
            private String msg = "Hi";
            @Override public void sayHello() {
                System.out.println(msg);
            }
        };

        Hello instance2 = new Hello() {
            private String msg = "Hola";
            @Override public void sayHello() {
                System.out.println(msg);
            }
        };

        // Hi!
        instance1.sayHello();

        // Hola!
        instance2.sayHello();

        // false
        System.out.println(instance1 == instance2);
    }
}
```

또한 자기 자신 참조가 안됩니다. `this` 키워드는 바깥 인스턴스를 가리킵니다. 반면에 익명 클래스에서 `this`는
익명 클래스의 인스턴스 자신을 가리킵니다. 아래의 예제 코드를 보면 결과값을 알 수 있습니다.

```java
import java.util.Arrays;
import java.util.List;


class Anonymous {
    public void say() {}
}

public class Main {
    public void someMethod() {
        List<Anonymous> list = Arrays.asList(new Anonymous());

        Anonymous anonymous = new Anonymous() {
            @Override
            public void say() {
                System.out.println("this instanceof Anonymous : " + (this instanceof Anonymous));
            }
        };
        
        // this instanceof Anonymous : true
        anonymous.say();

        // this instanceof Main : true
        list.forEach(o -> System.out.println("this instanceof Main : " + (this instanceof Main)));
    }

    public static void main(String[] args) {
        new Main().someMethod();
    }
}
```

람다도 익명 클래스와 동일하게 직렬화(Serialization) 형태가 구현별(가령 가상 머신 별로)로 다를 수 있으므로 주의해야 합니다.
`Comparator`처럼 직렬화해야만 하는 함수 객체가 있다면 `private 정적 중첩 클래스`의 인스턴스를 사용하면 됩니다.

<a href="/post/java-serialization" target="_blank">참고 링크: 자바 직렬화(Serialization)</a>