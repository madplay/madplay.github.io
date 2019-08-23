---
layout:   post
title:    자바 접근 지정자(Java Access Modifier)
author:   Kimtaeng
tags: 	  java accessmodifier
description: "자바의 접근 지정자는 무엇이 있을까? public protected private 그리고 default 접근 지정자의 차이는?"
category: Java
comments: true
---

# 접근 지정자
자바에서는 `public`, `protected`, `private` 그리고 접근 지정자를 생략하는 `default`, 이렇게 총 4개의
접근 지정자를 두고 있다. 또한 이 접근 지정자는 클래스와 멤버에 사용할 수 있다. 다만 클래스에는 `private`과 `protected`
접근 지정자는 적용되지 않는다.

<br/>

# 접근 지정자와 클래스
## public과 클래스
클래스가 `public` 접근 지정자로 선언되면 아래처럼 다른 어떤 클래스에서도 사용할 수 있게 된다.

```java
public class MadPlay {
    /*
     * MadPlay 클래스가 public으로 선언되어 있기 때문에
     * 다른 클래스에서 접근이 가능하다.
     */
}

class MadLife {
    MadPlay madplay;

    public void someMethod() {
        madplay = new MadPlay();
    }
}
```

## default와 클래스
접근 지정자가 `default`로 선언된 클래스는 어떨까? 접근 지정자를 생략하고 클래스를 선언한 경우를 말한다.
이 경우에는 같은 패키지 내에 있는 클래스들만 접근이 가능하다.

```java
package p1;

class MadPlay {

}

class MadLife {
    // 같은 패키지에 있어서 접근 가능하다.
    MadPlay madplay;

    public void someMethod() {
        madplay = new MadPlay();
    }
}
```

```java
package p2;

class MadMan {
    // 다른 패키지에 있어서 사용 불가능 하다.
    MadPlay madplay;
}
```

위 예제를 보면 `default` 접근 지정자로 선언된 MadPlay 클래스와 같은 패키지에 있는 MadLife 클래스에서는 오류가 발생하지
않는다. 하지만 다른 패키지에 있는 MadMan 클래스에서는 `Cannot be accessed from outside package`와 같은 오류 메시지를
만날 수 있다.

<br/>

# 접근 지정자와 멤버
## public과 멤버
멤버가 `public`으로 선언된 경우를 먼저 보자. 패키지의 내부, 외부 등 모든 클래스에서 접근이 가능하다.
물론 정적 멤버가 아닌 경우 인스턴스화 후에 접근해야 한다.

```java
package p1;

public class MadPlay {
    public String name;
    public void sayHi() [
        System.out.println("hello~");
    ]
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

```java
package p2;

import p1.MadPlay; // 단, import 해야 한다.

class MadMan {
    void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

`public`으로 저정된 MadPlay 클래스에 public 멤버 변수와 메서드가 있다. 이들은 public 이어서 같은 패키지에 선언된 클래스에서
자유롭게 접근이 가능하다. 물론 다른 패키지에 선언된 클래스에서도 접근이 가능하다. 하지만 다른 패키지에 있는 클래스는 반드시
public으로 공개된 클래스를 import 해야 하는데, import할 클래스가 public인 경우만 가능하다.

## private가 멤버
멤버가 `private`으로 선언된 경우를 살펴보자. 이 접근 지정자는 기본적으로 비공개를 의미한다. 즉, 같은 클래스 내부 멤버에
의해서만 접근이 가능하다는 뜻으로 다른 어떤 클래스에서도 접근할 수 없다.

```java
package p1;

public class MadPlay {
    private void sayHi() {
        System.out.println("Hi~");
    }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi(); // 오류
    }
}
```

이 경우에는 같은 패키지에 있어도 접근이 불가능하다. 오직 자기 자신 클래스에서만 접근이 가능하게 된다.
접근하려는 메서드 또는 변수가 private으로 선언된 것은 외부에 공개되지 않음을 뜻한다.

## protected와 멤버
같은 패키지에 `protected`로 선언된 멤버의 동작을 살펴보자. 부분적인 공개를 뜻하는데, 같은 패키지 내의 모든 클래스에서
접근이 가능하다. 혹은 다른 패키지의 클래스라도 해당 클래스를 상속 받았다면 접근이 가능하다.

```java
package p1;

public class MadPlay {
    protected void sayHi() {
        System.out.println("Hi~");
    }
}

class MadLife {
    public void someMethod() {
        Madplay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

```java
package p1;

import p1.MadPlay;

class MadMan extends MadPlay {
    public void someMethod() {
        // MadPlay 클래스의 멤버에 접근하는 것이다.
        sayHi();

        // 인스턴스를 통해 접근하려면 상속받은 객체를 인스턴스화해야 한다.
        MadMan madMan = new MadMan();
        madMan.sayHi();
    }
}

class Madness {
    public void someMethod() {
        MadPlay madplay = new MadPlay();

        // 오류. 상속 받지 않았다.
        madplay.sayHi(); 
    }
}
```

이처럼 `protected` 멤버로 선언된 멤버는 같은 패키지에 속한 경우나 이를 상속한 클래스만 접근이 가능하다.
혹시나 패키지의 경로가 모호한 경우는 어떨까?

```java
package a.b.c;

public class ABC {
    public void sayHi() { ... }
    protected void callMe() { ... }
}
```

```java
package a.b.c.d;

import a.b.c.A;

public class ABCD {
    public void someMethod() {
        ABC abc = new ABC();
        abc.sayHi(); // Okay :D
        abc.callMe(); // Compile Error :(
    }
}
```

역시나 `protected` 멤버에는 같은 패키지가 아니면 접근이 가능하다. 위의 예제는 패키지 경로가 반대인 경우에도 안된다.

## default와 멤버
접근 지정자를 생략한 `default`를 살펴보자. 접근 지정자의 선언이 생략된 경우는 멤버가 default 접근 지정자임을 뜻한다.
이 경우에는 동일한 패키지 내에 있는 모든 클래스가 자유롭게 접근 가능하다.

```java
package p1;

public class MadPlay {
    void sayHi() { ... }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();

        // 같은 패키지에 있어서 접근 가능
        madplay.sayHi();
    }
}
```

```java
package p2;

import p1.MadPlay;

class MadMan extends MadPlay {
    public void someMethod() {
        // 상속해도 접근 불가
        sayHi();

        MadMan madMan = new MadMan();
        madMan.sayHi(); // 역시나 접근 불가
    }
}

class Madness {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi(); // 접근 불가
    }
}
```

그런데 `default` 접근 지정자는 `protected`와 다르게 상속을 받았더라도 접근이 불가능하다.
무조건 같은 패키지에 있어야 접근이 허용된다.

<br/>

# 그렇다면 어떤 접근 지정자를?
자바가 객체지향언어라는 것을 숙지해야 한다. 또한 객체 지향의 특성에는 캡슐화(Encapsulation)라는 것이 있다. 특별한 경우가
아닌 경우 데이터 멤버에 대해서는 외부에 공개하는 `public` 선언을 자제하고 가능한 `private`으로 선언해야 한다.

그런데 `private`으로 선언하면 자유로운 사용이 제한된다. 하지만 캡슐화의 원칙을 깨지 않으면서 멤버 변수에 안전하게
접근할 수 있는 접근자(getter)와 수정자(setter) 메서드를 사용하면 된다.

종류 | 대상 | 내용 | 비고
|:--:|:--:|:----:|:--:
public | 클래스, 멤버 | 모든 외부에서 접근 가능
protected | 멤버 | 같은 패키지, 상속한 경우만 접근 가능 | **클래스에 적용할 수 없음**
default | 클래스, 멤버 | 같은 패키지에 속한 경우만 접근 가능 | 접근 지정자를 생략한 경우를 말함 
private | 멤버 | 오직 내부에서만 접근 가능 | **클래스에 적용할 수 없음**