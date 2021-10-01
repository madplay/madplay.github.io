---
layout:   post
title:    "자바 17의 새로운 기능들, 3년 만에 LTS 버전 릴리즈!"
author:   Kimtaeng
tags:    java jdk17 openjdk
description: "3년 만에 새로운 자바 LTS 버전 출시! JDK 17 버전에서는 어떤 새로운 기능이 추가됐을까?"
category: Java
date: "2021-10-02 00:24:31"
comments: true
---

# 자바 17, 3년 만에 LTS 릴리즈!
지난 9월, 3년 만에 새로운 자바 LTS(Long-Term-Support) 버전이 출시됐다. 작년에 자바 14버전에서의 주목할 만한 릴리즈 노트를 정리했었는데,
벌써 자바 17버전이다.

- <a href="/post/what-is-new-in-java-14" target="_blank">참고 링크 : 자바 14 버전에서는 어떤 새로운 기능이 추가됐을까?</a>

자바는 아래와 같은 릴리즈 계획(출처: 위키피디아)이 있다. 이번에 출시한 자바 17버전은 2018년에 등장한 11버전 이후의 새로운 LTS 버전이며,
다음 LTS 버전은 2023년에 출시될 자바 21이다. 자바 버전 히스토리에 대한 전체 내용은 <a href="https://www.oracle.com/java/technologies/java-se-support-roadmap.html" target="_blank" rel="nofollow">오라클의 자바 로드맵</a>이나
<a href="https://en.wikipedia.org/wiki/Java_version_history" target="_blank" rel="nofollow">위키피디아의 자바 버전 히스토리</a>를 참고하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-10-02-what-is-new-java-17.jpg" width="600" alt="java version history"/>

<br><br>

# JDK 17 Release Notes
> 해당 내용은 JEP(JDK Enhancement Proposal)를 참고하여 코드 변경사항 위주로 작성되었다.
> 전체 릴리즈 목록은 <a href="https://openjdk.java.net/projects/jdk/17/" target="_blank" rel="nofollow">OpenJDK JDK17</a> 문서에 소개되있다.

## JEP 356: Enhanced Pseudo-Random Number Generators
기본 레거시 랜덤(`java.util.Random`) 클래스를 확장, 리팩토링한 `RandomGenerator` 난수 생성 API가 추가되었다.
아래와 같은 코드로 자바 17에서 사용 가능한 알고리즘을 확인할 수 있다.

```java
RandomGeneratorFactory.all()
	.map(factory -> String.format("%s: %s", factory.group(), factory.name()))
	.sorted()
	.forEach(System.out::println);
```

```bash
LXM: L128X1024MixRandom
LXM: L128X128MixRandom
LXM: L128X256MixRandom
LXM: L32X64MixRandom
LXM: L64X1024MixRandom
LXM: L64X128MixRandom
LXM: L64X128StarStarRandom
LXM: L64X256MixRandom
Legacy: Random
Legacy: SecureRandom
Legacy: SplittableRandom
Xoroshiro: Xoroshiro128PlusPlus
Xoshiro: Xoshiro256PlusPlus
```

<br>

## JEP 382: New macOS Rendering Pipeline
애플사에서 기존의 OpenGL이 아닌 Metal 이라는 새로운 렌더링 API로 대체하는 움직임에 맞춘 대응이다. 향후 MacOS 버전에서 OpenGL API를 제거하는 경우를
대비하기 위함이다. 코드 사용과 직접적인 관련은 없겠으나, MacOS에서 인텔리제이(Intellij) IDE의 렌더링이 개선되지 않을까 하는 기대가 된다.

<br>

## JEP 398: Deprecate the Applet API for Removal
애플릿(`Applet`) API는 자바 9에서부터 이미 `@Deprecated` 선언되었는데, 이번 버전에서는 `forRemoval` 태깅도 선언되었다.
아마도 다음 릴리즈에서는 볼 수 없을지도 모른다. 

```java
@Deprecated(since = "9", forRemoval = true)
@SuppressWarnings("removal")
public class Applet extends Panel {
	// ...
}
```

<br>

## JEP 403: Strongly Encapsulate JDK Internals
중요한 내부 API를 제외하고는 JDK의 모든 내부 요소를 강력하게 캡슐화한다. 아래와 같은 리플렉션 코드가 더 이상 동작하지 않는다.

```java
var ks = java.security.KeyStore.getInstance("jceks");
var f = ks.getClass().getDeclaredField("keyStoreSpi");
f.setAccessible(true);
```

<br>

## JEP 406: Pattern Matching for switch (Preview)
> 자바 14부터 등장했던 내용인데 아직까지 프리뷰(Preview) 기능이다.
> 실행하려면 명령어 옵션 추가가 필요하다. (Intellij에서는 Language Level 설정을 변경하면 된다.)

아래 예시처럼 `instanceof`를 사용할 때 캐스팅하는 단계를 간소화할 수 있다.

```java
// AS-IS: 기존의 instanceof 연산자 사용. 캐스팅이 들어간다.
if (o instanceof String) {
    String s = (String) str;
    // ... 변수 s를 사용하는 코드
}

// TO-BE: 형변환 과정을 없애고, 그 변수('s')를 담을 수 있다.
if (o instanceof String s) {
    // ... 변수 s를 사용하는 코드
}
```

그리고 `null`에 대해서도 조금 더 간편하게 핸들링할 수 있다.

```java
// 기존
static void someMethod(String s) {
    if (s == null) {
        System.out.println("null!");
        return;
    }

    switch (s) {
        case "kim", "taeng" -> System.out.println("Hello~");
        default -> System.out.println("Wow!");
    }
}

// 변경
static void someMethod(String s) {
    switch (s) {
        case null -> System.out.println("null!");
        case "kim", "taeng" -> System.out.println("Hello~");
        default -> System.out.println("Wow!");
    }
}
```

더 나아가 `switch` 문을 위한 패턴 매칭을 적용할 수 있다. 아래와 같은 형태의 `switch` 코드를 작성할 수 있는데,
`switch`문의 파라미터 `o` 값은 `Long l`에 매칭되어 코드가 실행된다.

```java
Object o = 123L;
String formatted = switch (o) {
    case Integer i -> String.format("int %d", i);
    case Long l -> String.format("long %d", l);
    case Double d -> String.format("double %f", d);
    case String s -> String.format("String %s", s);
    default -> o.toString();
};
```

<br>

## JEP 407: Remove RMI Activation
RMI 일부 기능(`java.rmi.activation` 패키지)이 제거되었다.

<br>

## JEP 409: Sealed Classes
자바에서는 상속을 통해서 코드를 재사용할 수 있지만 너무 무분별한 상속은 코드를 이해하는데 더 어려움을 줄 수 있다. 따라서 상속을 일부 제한하는 방법이 제안되었다.
JEP 스펙 문서를 보면 알 수 있듯이 새로운 패러다임이기 때문에 조금 복잡하다. 내용 또한 여러 버전에 거쳐서 Preview로 소개되었다.

- <a href="https://openjdk.java.net/jeps/360" target="_blank" rel="nofollow">JDK 15에서 Preview로 제안(JEP 360)</a>
- <a href="https://openjdk.java.net/jeps/397" target="_blank" rel="nofollow">JDK 16에서 Second Preview로 수정제안(JEP 397)</a>

핵심은 "확장(extends) 하거나 구현(implements) 할 수 있는 클래스 또는 인터페이스를 제한한다." 라고 생각하면 된다.
보통 우리 말로는 봉인 클래스 또는 봉인된 클래스로 표기하는 것 같다. 이제 상속, 구현에 이은 "**봉인**" 이라는 단어도 사용되지 않을까 싶다.

물론 상속을 제한하는 방법은 이전에도 있었다. 바로 `final` 키워드를 통해서말이다.

```java
class Person {
}

// `Developer` 클래스는 확장/상속(extends)할 수 없다.
final class Developer extends Person {
}

// `Designer` 클래스는 확장/상속(extends)할 수 없다.
final class Designer extends Person {
}
```

하지만 이번에는 조금 다른 컨셉이다. 특정 서브 클래스에게만 확장을 허용하고 다른 클래스에는 봉인(sealed) 하는 방법이다.


```java
// `Person`는 허용된(permits) 서브 클래스만 확장할 수 있다.
sealed class Person
    permits Developer, Designer {
}

// `Developer` 클래스는 봉인이 해제되었다.
non-sealed class Developer extends Person {

}

// 봉인이 해제된 `Student` 클래스는 다른 서브 클래스에서 확장 가능하다.
// 그리고 자기 자신을 Developer 봉인(sealed)할 수 있다. 
sealed class Student extends Developer 
    permits HighSchoolStudent, MiddleSchoolStudent {
    // 이 클래스는 `HighSchoolStudent`, `MiddleSchoolStudent` 클래스만 확장 가능하다.
}

// permitted 서브 클래스는 확장을 못하게 하거나(final),
// 서브 클래스를 가진채로 자신을 봉인하거나(sealed), 봉인을 해제(non-sealed)해야만 한다.
final class HighSchoolStudent extends Student {

}

non-sealed class MiddleSchoolStudent extends Student {

}
```

봉인 클래스를 사용하려면 아래와 같은 몇가지 규칙이 있다.

- sealed 클래스와 permitted된 서브 클래스와 동일한 모듈 또는 패키지에 속해야한다.
- 모든 permitted 서브 클래스는 sealed 클래스를 확장(extends)해야한다. 그렇지 않으면 컴파일 오류가 발생한다.
- 모든 permitted 서브 클래스는 수퍼 클래스에 의해 시작된 봉인을 계속할지 말지 선언해야한다.
    - 더이상 확장되지 않도록 `final`을 적용할 수 있다.
    - `non-sealed`로 선언하여 다른 클래스가 확장하도록 할 수 있다.
    - 자기 자신도 봉인(`sealed`) 클래스로 선언될 수 있다.

<br>

## JEP 410: Remove the Experimental AOT and JIT Compiler
AOT(Ahead-Of-Time), JIT(Just-In-Time) 컴파일러가 제거되었다. 대상은 `jdk.aot`, `jdk.internal.vm.compiler`,
`jdk.internal.vm.compiler.management` 이다.

<br>

## JEP 411: Deprecate the Security Manager for Removal
`java.lang.SecurityManager` 와 일부 클래스에 `@Deprecated(forRemoval=true)` 가 선언되었다.

<br><br>

# 기타
지난 글(<a href="/post/what-is-new-in-java-14" target="_blank">자바 14 버전에서는 어떤 새로운 기능이 추가됐을까?</a>)에서 소개했던
Preview 중에서 몇 가지가 정식 반영되었다.

## JEP 359: Records
`record`는 자바 16에서 스펙이 확정되어 정식 추가되었다.

```java
record RecordPoint(int x, int y) {
    // 상속 불가(final 클래스)

    // 각 필드는 private final. 수정 불가
    // x = 5;

    // serialize 할 때는? 필드에 `@JsonProperty`를 붙여준다.

    // static 필드와 메서드 소유 가능
    static int MAX_LENGTH = 25;

    public static int getMaxLength() {
        return MAX_LENGTH;
    }
}

// 사용할 때는? 클래스와 동일하게 `new` 연산자로 인스턴스화한다.
RecordPoint recordPoint = new RecordPoint(2, 3);

// 그런데 getter가 자동 생성!
recordPoint.x();
```

<br>

## JEP 378: Text Blocks
JDK 15에 드디어 정식 포함되었다. 더이상 긴 문자열을 `+`와 `\n`을 사용해서 꾸덕꾸덕 붙이지 않아도 된다!

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

아래와 같이 변수도 매핑시킬 수 있다.

```java
String textBlock = """
        {
            "title": %s,
            "author": %s,
            "id": %d
        }
        """.formatted("hi", "taeng", 2);

System.out.println(textBlock);
```

결과는 아래와 같다.

```bash
{
  "title": hi,
  "author": taeng,
  "id": 2
}
```

<br><br>

# 마치며
오랜만에 등장한 LTS 버전이라서 기대가 크다. 개인적으로 패턴 매칭이나 레코드처럼 코드를 더 간결하고 우아하게 작성할 수 있는 방법들이 생겨나는 것 같아서 좋다.
특히나 텍스트 블록은 작년에 작성한 <a href="/post/sql-management-when-using-spring-jdbc" target="_blank">"Spring JDBC를 사용할 때 SQL 관리"</a> 글에서처럼
성능과 가독성에 대한 고민을 시원하게 해소시켜줄 것 같다.

끝으로 작년에도 언급했지만, 점점 더 기술을 학습하는 속도보다 새로운 기술이 등장하고 발전하는 속도가 무척이나 빠른 것 같다.