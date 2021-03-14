---
layout:   post
title:    "자바 14 버전에서는 어떤 새로운 기능이 추가됐을까?"
author:   Kimtaeng
tags:    java jdk14 openjdk
description: "JDK 14 버전에서는 어떤 기능이 새롭게 등장했을까? 그리고 어떤 기능이 사라졌을까?" 
category: Java
date: "2020-06-19 23:51:22"
comments: true
---

# 어느새, 자바 14
자바 14버전이 릴리즈된지 벌써 2달이 지났다. 2018년에 발표한 내용에 따르면 6개월마다 자바의 새로운 버전을 출시한다고 얘기했으니,
2020년 기준으로 올해 연말에는 또 다른 변경사항을 가진 자바 15가 등장할 예정이다.

변경사항을 살펴보니 괜찮은 변경점이 꽤 많았다. 현업에서는 안정성이 중요시되기 때문에 변경사항들을 곧바로 적용하긴 어렵겠으나,
언젠가 쓰게 될지 모르니 하나씩 살펴볼 예정이다.

### 시작하기 전에,
2018년에 오라클에서 자바의 유료화 모델을 발표하면서 `OpenJDK`에 대한 활동이 활발해졌다. 아마 대부분 회사들도 `OpenJDK`를 사용하게 되지 않을까 싶다.
**OpenJDK**의 경우 배급처(vendor)가 여러 곳이기 때문에 구현체도 여러 가지가 있다. JCP(Java Community Process)를 통해
JSR(Java Specification Request) 표준이 정해지면 각 배급처가 구현체를 정의한다.

기업체에서 빌드하는 **Zulu, RedHat OpenJDK, Amazon Corretto** 등이 있는데, 이번 예제에서는 기업체가 아닌 IBM, RedHat 등의 회원들이 참가하고
후원하는 OpenJDK 커뮤니티에 의해 빌드되는 **AdoptOpenJDK**를 사용했다.

> 6월 19일 기준으로, 이클립스 재단(Eclipse Foundation)에 합류하는 것 같다.
> <a href="https://blog.adoptopenjdk.net/2020/06/adoptopenjdk-to-join-the-eclipse-foundation/" target="_blank"
rel="nofollow">https://blog.adoptopenjdk.net/2020/06/adoptopenjdk-to-join-the-eclipse-foundation/</a>

설치는 간단하게 `brew`를 이용하면 된다. 아래와 같이 입력해보자.

```bash
# 기본적으로 최신 버전의 OpenJDK 설치
$ brew cask install adoptopenjdk

# 또는 버전을 설정할 수 있다.
$ brew tap AdoptOpenJDK/openjdk
$ brew cask install adoptopenjdk14
```

한편 오라클이 **OpenJDK** 기능에 대한 제안을 수집하기 위해, 스펙 초안을 작성하는 프로세스를 **JEP(JDK Enhancement Proposal)**라고 한다.
비슷한 용어로 자바 기술에 대한 기술 명세 절차인 **JCP(Java Community Process)**와 자바 스펙 명세인 **JSR(Java Specification Requests)**가
있다.

참고로 이번 글의 자바 14 변경사항은 <a href="https://openjdk.java.net/projects/jdk/14/" target="_blank" rel="nofollow">OpenJDK
14 버전의 JEP Feature 리스트</a>중 코드 변경사항을 기반으로 작성되었다.

<br><br>

# JEP 305: Pattern Matching for instanceof (Preview)
런타임에서 객체 타입을 확인하는 `instanceof` 연산자가 조금 강화되었다. 프리뷰 버전이라 그대로 반영될지 안될지 모른다.
보통 `instanceof` 연산자를 아래와 같이 사용했다.

```java
// 캐스팅이 들어가게 된다.
if (obj instanceof String) {
    String text = (String) obj;
}
```

그런데, 이제 아래와 같이도 사용 가능하다. `instanceof` 연산자가 적용되는 조건문 `if` 블록 내에서 지역 변수를 사용할 수 있다.

```java
// 형 변환 과정이 없고, 그 변수를 담을 수 있다.
if (obj instanceof String s) {
    System.out.println(s);
    if (s.length() > 2) {
        // ...
    }
}

// 조건을 중첩해서 넣을 수도 있다.
if (obj instanceof String s && s.length() > 2) {
    // okay!
}
```

앞서 언급한 것처럼 **지역 변수** 개념으로 적용되기 때문에 `else` 문에서는 `instanceof` 연산자에서 적용한 변수가 접근되지 않는다.

```java
if (obj instanceof String s) {

} else {
    // s가 접근되지 않는다.
}
```

<br><br>

# JEP 343: Packaging Tool (Incubator)
새로운 패키징 도구가 도입되었다. 이 인큐베이팅 기능은 자바 애플리케이션에서 플랫폼 별 패키지를 작성하기 위한 새로운 도구인 `jpackage`를 제공한다.
이는 리눅스(linux)의 `deb` 또는 `rpm` 파일, macOS의 `pkg` 또는 `dmg` 파일 그리고 Windows의 `msi` 또는 `exe` 파일을 의미한다.

간단히 따라 해보자. 먼저 `jar`를 만들어야 하는데, 그러려면 먼저 컴파일을 해야 한다. `HelloWorld.java`라는 이름의 파일을 만든다.
파일 안에는 클래스 이름으로 `HelloWorld`를 입력해보자. 코드 내용이 중요하지는 않다.

```bash
$ javac HelloWorld.java
```

결과인 `HelloWorld.class` 파일이 생성됐을 것이다. 그럼 이제 `jar`를 만들자. 예제에서 `jar` 결과 파일 이름은
클래스 파일과 동일하게 지정하였다.

```bash
$ jar -cvf HelloWorld.jar HelloWorld.class
```

이제 결과물 jar가 만들어졌으면, `jpackage`를 통해 패키징 해보자. 앞서 만든 jar 파일을 `test`라는 디렉토리에 넣었다고 가정한다.
아래 명령어를 입력해 주면 된다. 패키지 결과의 이름은 `hello_taeng`이 된다.

```bash
$ jpackage --name hello_taeng --input test --main-jar HelloWorld.jar --main-class HelloWorld
```

**MacOS 기준**으로 패키징을 완료하면, `dmg` 파일이 생성되는 것을 알 수 있다.

<br><br>

# JEP 345: NUMA-Aware Memory Allocation for G1
**NUMA(Non-Uniform Memory Access)** 메모리 시스템에서의 `G1` 가비지 컬렉터의 성능이 향상되었다. 즉, 대형 머신에서의 성능 향상이다.
**NUMA**는 불균형적인 메모리 접근을 의미하는데, 멀티 프로세서 환경에서의 메모리 접근 방식이다.

<br><br>

# JEP 358: Helpful NullPointerExceptions
`NullPointerException`이 발생하면 코드 라인 넘버를 보고 어디가 문제인지 유추했던 기억이 있을 것이다. 라인 넘버만 나오기 때문에,
정확한 이유를 유추해야 하는 불편함이 있었는데, 이 부분이 조금 강화되었다.

```java
private void runJEP358Test() {
    // 이런 메서드를 호출하는데, `b`의 리턴이 `null` 이면?
    a().b().c();
}
```

위 메서드에서 만일 `b` 메서드의 리턴이 `null`이면 어떻게 될까? 기존 버전의 자바에서는 아래와 같은 메시지가 출력됐을 것이다.

```bash
# 이전 버전에서는 아래와 같이 출력되었다. 대충 이런 모습...
Exception in thread "main" java.lang.NullPointerException
    at MadPlay.runJEP358Test(MadPlay.java:43)
    at MadPlay.main(MadPlay.java:117)
```

그런데, 자바 14버전부터는 실행 옵션에 `-XX:+ShowCodeDetailsInExceptionMessages` 넣어주면, 아래와 같이 `NPE` 메시지가 바뀐다.

```bash
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "MadPlay.c()" 
because the return value of "MadPlay.b()" is null
    at MadPlay.runJEP358Test(MadPlay.java:43)
    at MadPlay.main(MadPlay.java:1317)
```

<br><br>

# JEP 359: Records (Preview)
`record`라는 것이 생겼다. 클래스는 아닌데 뭔가 롬복(lombok) 라이브러리와 유사하다. 원래는 보통 아래와 같은 형태로 클래스를 정의했다.

```java
class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // getter, setter 생략
    // 더 나아가 toString, hashCode, equals 메서드도 생략
}
```

그런데, 단순 데이터 용도라면 아래와 같이 `record`를 사용하면 된다.

```java
record Point(int x, int y) {
    // 상속은 불가하다. (마치 final 클래스처럼)

    // 초기화 필드는 `private final`이다. 즉, 수정 불가
    x = 5; // 에러

    // static 필드와 메서드를 가질 수 있다.
    static int LENGTH = 25;

    public static int getDefaultLength() {
        return LENGTH;
    }
}
```

특징을 살펴보자. 먼저, `final` 클래스처럼 상속할 수 없는 특성을 갖고 있다. 또한 초기화에 사용되는 내부 필드는 `private final`이다.
수정할 수 없다. 하지만 `static` 필드와 메서드를 가질 수 있다.

그럼 사용할 때는 어떻게 사용할까? 아래와 같이 클래스처럼 사용하면 된다.

```java
Point point = new Point(2, 3);

// getter가 자동 생성
point.x();
```

클래스와 동일하게 `new` 연산자로 인스턴스를 생성하면 된다. 신기한 것은 `getter`가 자동으로 생성된다.
이러한 점에서 롬복 라이브러리와 비슷하다고 언급한 것이다.

<br><br>

# JEP 361: Switch Expressions (Standard)
`switch` 문에도 변화가 생겼다. 기존에 사용했던 `switch` 문을 봐보자.

```java
switch (type) {
    case TYPE_1:
    case TYPE_2:
    case TYPE_4:
        System.out.println("Type 1, 2, 4");
        break;
    case TYPE_3:
    case TYPE_5:
        System.out.println("Type 3, 5");
}
```

이제 아래와 같이 표현식(expressions)을 넣을 수 있다. 게다가 콤마로 조건 기준을 넣을 수 있다.

```java
switch (type) {
    case TYPE_1, TYPE_2, TYPE_4 -> System.out.println("Type 1, 2, 4");
    case TYPE_3, TYPE_5 -> System.out.println("Type 3, 5"); 
}
```

표현식으로 바뀌었기 때문에, `switch` 조건에 매칭된 경우 반환값을 받도록 선언할 수 있다.
리턴되는 값이 할당되는 타입에 의해 리턴값이 정의되기 때문에 아래와 같이 `Object` 타입으로 선언할 수 있다.

```java
Object retObj = switch (type) {
    case TYPE_1, TYPE_2 -> "2";
    case TYPE_3 -> 3;
    default -> "";
};
```

물론, 반환형이 `void`인 메서드를 표현식에서 사용하게 되면 오류가 발생한다.

```java
int ret = switch (type) {
    case TYPE_1, TYPE_2 -> System.out.println("Hello"); // 컴파일 오류
    case TYPE_3 -> 3;
    default -> "":
}
```

그런데 위 예제처럼 메서드도 실행하고 값도 반환하고 싶을 수 있다. 그럴 때는 `yield` 키워드를 사용하면 된다.
단순 `return`은 안된다. 메서드 자체가 종료된다.

```java
int returnFrom = switch (type) {
    case TYPE_1 -> 3;
    default -> {
        System.out.println("return default value");
        yield 2; // `yield` 키워드를 사용한다.
    }
}
```

<br><br>

# JEP 363: Remove the Concurrent Mark Sweep (CMS) Garbage Collector
`CMS` 가비지 컬렉터는 자바 9버전에 `Deprecated` 선언되었다. 그리고 이번 자바 14버전에서 삭제됐다.

<br><br>

# JEP 368: Text Blocks (Second Preview)
긴 문자열을 `+`와 `\n`을 이용하여 꾸덕꾸덕 붙인 기억이 있을 것이다. 그런데 이제 **텍스트 블록**이라는 개념을 사용하면 조금 편하다.
(정확히는 13 버전부터 등장했다)

```java
private void runJEP368() {
    String html = """
            {
                "list": [
                    {
                        "title": "hello, taeng",
                        "author": "taeng"
                    },
                    {
                        "title": "hello, news",
                        "author": "taeng"
                    }
                ]
            }
            """.indent(2);
    // indent 는 자바 12에서 추가된 것인데, 문자열 각 맨 앞 행을 n만큼 띄운다.
    System.out.println(html);
}
```

꽤 편리해보인다. 조금 더 응용하여 `placeholder`와 같이 사용하면 아래와 같이 동적으로 문자열을 다룰 수 있을 것 같다.

```java
// placeholder in textBlocks
String textBlock = """
            {
                "title": "%s"
            }
        """.indent(1);
System.out.println(String.format(textBlock, "Hello Madplay"));
```

```bash
# 앞에 한 칸 띄워짐 ...ㅎ
 {
   "title": "Hello Madplay"
 }
```

PreviewFeature이긴 하지만 문자열(String) 클래스의 `formatted` 메서드를 사용할 수도 있다.

```java
String textBlock = """
        {
            "title": "%s",
            "author": "%s",
            "id": %d
        }
        """.formatted("hi", "taeng", 2);

System.out.println(textBlock);
```

```bash
{
  "title": "hello World!",
  "author": "taeng",
  "id": 2
}
```

<br>

# 마치며
릴리즈 노트를 살펴보니 변경사항이 꽤 있다. 점점 더 새로운 버전을 학습하는 속도보다 더 빠르게 새로운 버전이 출시되는 것 같다.
실무에서는 아무래도 안정성이 중요시되기 때문에 상대적인 최신 버전을 사용하기는 쉽지 않을 것 같다.