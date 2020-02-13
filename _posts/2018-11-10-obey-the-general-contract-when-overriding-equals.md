---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 10. equals는 일반 규약을 지켜 재정의하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 10. Obey the general contract when overriding equals" 
category: Java
comments: true
---

# 먼저 equals 재정의에 대한 결론은,
equals를 재정의하지 않는다. 아래의 기본 equals 메서드를 쓰자는 것이다.

```java
public boolean equals(Object obj) {
    return (this == obj);
}
```

특히, 아래와 같은 경우에는 재정의하지 않는 것이 최선일 수 있습니다.
- 값을 표현하는 것이 아니라 **동작하는 개체를 표현하는 클래스라면!**
  - 예를 들어 Thread 클래스가 있는데요. Object의 equals 메서드로도 충분합니다.
  - 인스턴스가 가지는 값보다 동작하는 개체임을 나타내는 것이 더 중요합니다.
- **논리적 동치성(logical equality)을 검사할 필요가 없다면!**
  - 예를 들어서 두 개의 Random 객체가 같은 난수열을 만드는지 확인하는 것은 의미가 없다.
- **private이나 패키지 전용 클래스**라서 클래스의 equals 메서드가 절대 호출되지 않아야하는 경우라면!
  - 이런 경우에는 equals 메서드를 반드시 오버라이딩해서 호출되지 않도록 막아야 합니다.

```java
@Override
public boolean equals(Object o) {
    throw new ~Exception(); // 메서드 호출 방지
}
```

<br/>

<div class="post_caption">그런데 논리적 동치가 무엇일까요?</div>

잠깐 살펴봅시다. **반드시 알아야하는 부분은 아니므로 생략해도** 됩니다!

두 개의 명제 p, q의 쌍방조건 p <->가 항진명제이면 두 명제 p, q는 **논리적 동치**라고 합니다.
**항진명제**란 각 명제의 참과 거짓의 모든 조합에 대해서 항상 참인 것을 말합니다.
예를 들어서 "자유가 아니면 차라리 죽음을 달라" 라는 말은 "자유 혹은 죽음을 달라"와 같은 것이지요.

예를 들어봅시다. 명제 p가 "자유가 아니다", 명제 p가 "죽음을 달라" 라고 가정했을 때,

- 명제 p와 q가 참일 때,
  - p->q 는 자유가 아니라면 죽음을 달라 : 참
  - p&(p->q) 는 자유가 아니다 AND (자유가 아니라면 죽음을 달라) : 참
  - (p&(p->))-> 는 자유가 아니다 AND (자유가 아니라면 죽음을 달라) 면 죽음을 달라 : 참
- 명제 p가 참이고 명제 q가 거짓일 때,
  - p -> q 는 자유가 아니라면 죽음을 달라 : 거짓
  - p&(p->q) 는 자유가 아니다 AND (자유가 아니라면 죽음을 달라) : 거짓
  - (p^(p->q))->q 는 자유가 아니다 AND (자유가 아니라면 죽음을 달라) 면 죽음을 달라 : 참

이런식으로 확인해볼 수 있는데요. 네이버 지식백과를 통해 아래와 같이 더 자세하고 전반적인 내용을 확인할 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-10-10-obey-the-general-contract-when-ovveriding-equals-1.png"
width="700" height="400" alt="tautology"/>

다시 본론으로 돌아와서, 자바에서 값을 비교하려면 아래와 같이 해야 합니다.

```java
public boolean equals(Object obj) {
    if (obj instanceof Integer) {
        return value == ((Integer)obj).intValue();
    }
    return false;
}
```

하지만 enum 같은 경우는 재정의하지 않아도 됩니다. 어차피 논리적으로 같은 인스턴스가 2개 이상 생성되지 않으니까요.
그러니까, 논리적 동치성과 객체 식별성이 사실상 같은 의미가 되기 때문입니다.

<br/>

# equals 메서드는...
동치 관계를 구현하며 아래의 조건을 만족합니다.

<<<<<<< HEAD
- **반사성(reflexivity)** : null이 아닌 모든 참조 값 x에 대해 `x.equals(x)`는 true다.
=======
- **반사성(reflexivity)** : null이 아닌 모든 참조 값 x에 대해 `x.equals(x)`는 true
>>>>>>> 041222ac6a7efa69c8de327871a896960061e92d
  - 이건 위반하는 것이 더 어려워보입니다.
- **대칭성(symmertry)** : null이 아닌 모든 참조 값 x, y에 대해 `x.equals(y)`가 true면, `y.equals(x)`도 true다.
  - 그래도 위반해보고 싶다면 아래와 같이 하면 됩니다.

```java
public final class CaseInsensitiveString {
    private final String s;

    public CaseInsensitiveString(String s) {
        this.s = Objects.requireNonNull(s);
    }
    @Override
    public boolean equals(Object o) {
        if( o instanceof CaseInsensitiveString) {
            return s.equalsIgnoreCase((CaseInsensitiveString) o).s);
        }
        if ( o instanceof String) {
            return s.equalsIgnoreCase((String) o);
        }
    }
} 

// 실행은?
CaseInsensitiveString cis = new CaseInsensitiveString("Media");
String s = "media";

cis.equals(s); // true
s.equals(cis); // false
```

<<<<<<< HEAD
- **추이성(transitivity)** : null이 아닌 모든 참조 값 x, y, z에 대해 `x.equals(y)`가 true이고,
  `y.equals(z)`가 true 이면, `x.equals(z)`도 true다.
=======
- **추이성(transitivity)** : null이 아닌 모든 참조 값 x, y, z에 대해 `x.equals(y)`가 true면, `y.equals(x)`도 true다.
>>>>>>> 041222ac6a7efa69c8de327871a896960061e92d
- **일관성(consistency)** : null이 아닌 모든 참조 값 x, y에 대해 `x.equals(y)`를 반복해서 호출하면 항상 true를 반환하거나 항상 false를 반환한다.
- **null이 아니다** : null이 아닌 모든 참조 값 x에 대해서 `x.equals(null)`은 false다.

```java
@Override
public boolean equals(Object o) {
    if(o ==null) {
        return false;
    }
    // ... 생략
}
```

<br/>

# 그래도 구현해야 겠다면!
모든 위험을 감수하면서도 equals 메서드를 재정의해야 겠다면! 아래의 규칙을 지켜야 합니다.

- `==` 연산자를 이용하여 입력이 자기 자신의 참조인지 확인해야 합니다.
  - 자신의 참조라면 true를 반환합니다.
  
- `instanceof` 연산자로 입력된 변수가 올바른 타입인지 확인해야 합니다.
  - 그렇지 않다면 false를 반환합니다.
- 입력을 올바른 타입으로 형변환합니다.
  - 위에서 타입을 검사했으므로 무조건 성공하게 됩니다.
- 입력된 객체와 자기 자신의 대응되는 **핵심** 필드들이 모두 일치한지 비교합니다.
  - 모든 필드가 일치하면 true, 그렇지 않다면 false를 반환합니다.
  - float와 double을 제외한 기본 타입(primitive type)은 `==` 연산자로 비교하고
  - float와 double은 부동 소숫점 등을 위해  `Float.compare`, `Double.compare`로 비교합니다.
  - 참조 타입 필드의 경우는 각각의 equals 메서드로 비교합니다.
  
<br/>
  
# 코드로 적용해보면?
위에서 살펴본 규약들을 준수하여 코드로 적용해보면 아래와 같습니다.

```java
public final class phoneNumber {
    private final short areaCode, prefix, lineNum;

    @Override
    public boolean equals(Object o) {
        if( o == this) {
            return true;
        }

        if( o == null) {
            return false;
        }

        if(!(o instanceof PhoneNumber)) {
            return false;
        }

        PhoneNumber pn = (PhoneNumber)o;
        return pn.lineNum == lineNum && pn.prefix == prefix
                        && pn.areaCode == areaCode;
    }
}
```

중요한 부분은 Object 외에 타입을 매개변수로 받는 equals 메서드 작성은 안됩니다. 물론 오버라이드도 안됩니다.
File 클래스인 경우는 심볼릭 링크(symbolic link)를 비교하여 같은 파일을 가리키는 지 확인하는 행동도 위험합니다.

```java
// 참고, File 클래스
public int compare(File f1, File f2) {
        return f1.getPath().compareTo(f2.getPath());
}
```

**잘못 재정의된 사례**를 들자면 `java.sql.Timestamp` 클래스의 equals 메서드를 볼 수 있는데요.
이 클래스는 `java.util.Date` 클래스를 상속하여 만들어진 클래스입니다.
두 클래스의 equals 메서드를 살펴보면 아래와 같습니다.

```java
// java.sql.Timestamp
public boolean equals(Timestamp ts) {
    if (super.equals(ts)) {
        if  (nanos == ts.nanos) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

public boolean equals(java.lang.Object ts) {
    if (ts instanceof Timestamp) {
        return this.equals((Timestamp)ts);
    } else {
        return false;
    }
}

// java.util.Date
public boolean equals(Object obj) {
    return obj instanceof Date && getTime() == ((Date) obj).getTime();
}
```

만일 위 코드에 대해서 아래와 같은 코드를 실행하면 어떻게 될까요?

```java
public void testMethod() {    
    Timestamp timestamp = new Timestamp(0L);
    Date date = new Date(timestamp.getTime());
    
    System.out.println(timestamp.equals(date)); // false
    System.out.println(date.equals(timestamp)); // true
}
```

**Timestamp의 equals 메서드에서는** instanceof 연산자로 인해 `false`가 됩니다. 물론 타입 검사없이 형변환을 한다고 하더라도
nanos 값을 검사로 인해 false가 반환될 것입니다. **Date의 equals 메서드에서는** 시간이 같은지만 검사하므로 `true`가 됩니다.

그러니까, 먼저 살펴본 것처럼 결론적으로는! 정말 필요한 상황이 아니라면 재정의하지 않는 것이 좋아보입니다.

<div class="post_caption">해당 내용은 Effective Java 3th Edition을 기반으로 작성되었습니다.</div>
