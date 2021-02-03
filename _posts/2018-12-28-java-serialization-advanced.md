---
layout:   post
title:    "자바 직렬화: SerialVersionUID는 무엇일까?"
author:   Kimtaeng
tags: 	  java serialization deserialization suid
description: 자바 직렬화를 사용할 때 필요한 SerialVersionUID는 무엇일까?
category: Java
comments: true
---

# 목차
- <a href="/post/java-serialization">자바 직렬화: 직렬화(Serialize)란 무엇일까?</a>
- 자바 직렬화: SerialVersionUID는 무엇일까?
- <a href="/post/why-java-serialization-is-bad">자바 직렬화: 자바 직렬화를 사용할 때 고민하고 주의할 점</a>

<br>

# SerialVersionUID
앞선 글에서는 자바 직렬화란 무엇인지, 직렬화 가능한 클래스의 객체로 자바 직렬화를 하는 방법과 반대로 객체를 역직렬화 하는
방법에 대해서 알아보았다. 이번 글에서는 SerialVersionUID와 같은 자바 직렬화에 대한 조금 상세한 내용에 대해서 소개한다.

직렬화와 역직렬화를 얘기할 때 빼놓을 수 없는 것이 **SerialVersionUID(이하 SUID)**다. 직렬화를 할 때 SUID 선언이 없다면
내부에서 자동으로 유니크한 번호를 생성하여 관리하게 된다. SUID는 직렬화와 역직렬화 과정에서 값이 서로 맞는지 확인한 후에
처리를 하기 때문에 이 값이 맞지 않다면 `InvalidClassException` 예외가 발생한다.

자바의 직렬화 스펙 정의를 살펴보면 SUID 값은 필수가 아니며 선언되어 있지 않으면 클래스의 기본 해시값을 사용한다.

- <a href="https://docs.oracle.com/javase/10/docs/specs/serialization/class.html"
rel="nofollow" target="_blank">참고 링크: Oracle Docs(링크)</a>

따라서 **직접 SUID를 명시하지 않더라도 내부에서 자동으로 값이 추가**되며 이 값들은 클래스의 이름, 생성자 등과 같이
클래스의 구조를 이용해서 생성한다. 앞선 예제에서도 직렬화 가능한 클래스(Article)를 선언할 때 SUID 값을 생략했지만
내부적으로 정보가 생성되어 있음을 유추할 수 있다.

<br>

# 정말로 자동 생성될까?
정말로 자동으로 추가 되는지 예제로 확인해보자. 클래스의 구조 정보를 이용하여 SUID를 생성하므로 직렬화 시점의 클래스 구조와
역직렬화 시점의 클래스의 구조를 바꿔보면 확인할 수 있을 것 같다. 물론 구조를 바꾸기 때문에 오류가 발생할 것이다.

먼저 기존과 동일한 Article 클래스를 준비하고 이 클래스의 인스턴스를 직렬화한다.
그리고 바이트 배열로 생성된 데이터를 `Base64`로 인코딩한 문자열을 콘솔 출력한다.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    public Article(String title, String pressName, String reporterName) {
        this.title = title;
        this.pressName = pressName;
        this.reporterName = reporterName;
    }

    @Override
    public String toString() {
        return String.format("title = %s, pressName = %s, reporterName = %s",
                title, pressName, reporterName);
    }
}

public class Main {
    public String serializeMethod() {
        Article article = new Article("직렬화는 무엇인가", "김탱일보", "김탱");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        // 아래와 같은 try 구문은 java 9 버전부터 지원합니다.
        try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(article);
        } catch (Exception e) {
            // ...Exception Handling
        }
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    public static void main(String[] args) {
        Main main = new Main();
        String serializedString = main.serializeMethod();
        System.out.println(serializedString);
    }
}
```

출력된 결과는 아래와 같이 `Base64`로 인코딩되어 ASCII 영역 문자로만 이루어진 문자열 데이터일 것이다.

```bash
// 인코딩된 문자열
rO0ABXNyAAdBcnRpY2xlXrUf2Yf... 생략
```

그럼 이 상태에서 **Article 클래스에 멤버 변수를 추가**해보자. 이후에는 위에서 얻은 직렬화 데이터를 통해서
바로 역직렬화를 진행하면 된다.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;
    
    // 새로운 멤버 추가
    private String phoneNumber;
    
    // ... 이하 생략
}
```
 
역직렬화를 진행하면 바로 예외가 발생함을 알 수 있다.

```bash
java.io.InvalidClassException: Article;
    local class incompatible: stream classdesc serialVersionUID = 6824395829496368166,
    local class serialVersionUID = 1162379196231584967
```

예제를 통해서 **Article 클래스** 에서는 SUID를 선언한 적이 없으나 오류 메시지처럼 자동으로 선언됨을 알 수 있다.
그리고 클래스의 구조가 변경되었을 때 오류가 발생한다는 것도 알게 되었다.

<div class="post_caption">그러면 어떻게 해야할까? SUID를 관리라도 해야하나?</div>

<br/>

# SUID 관리
자바에서는 SUID를 개발자가 선언하고 관리하는 방식을 권장한다.
예제에서 사용한 Article 클래스에 **SerialVersionUID** 를 직접 선언해보자.

```java
class Article implements Serializable {
    // 간단한 예를 들기위해 간단한 값으로 선언합니다.
    private static final long serialVersionUID = 1L;

    private String title;
    private String pressName;
    private String reporterName;

    // ... 이하 생략
} 
```

SUID를 추가한 후에 직렬화하여 출력된 값은 아래와 같다.

```java
// 인코딩된 문자열
rO0ABXNyAAdBcnRpY2xlAAAAAAAAAAECAA... 생략
```

Article 클래스에 멤버를 추가한 뒤 출력된 문자열 값으로 다시 역직렬화를 해보자.
SUID 값이 선언되면 직렬화 클래스의 멤버가 추가되더라도 역직렬화 과정에서 오류가 발생하지 않는다.

사실 이러한 관점에서 직렬화를 사용할 때는 자주 변경될 소지가 있는 클래스의 객체는 사용하지 않는 것이 좋다.
프레임워크 또는 라이브러리에서 제공하는 클래스의 객체도 버전업을 통해 **SerialVersionUID**가 변경될 경우가 있으므로
예상하지 못한 오류가 발생할 수 있다.

직렬화를 사용할 때 오류가 발생하거나 주의해야 하는 경우를 정리해보면 다음과 같다.

- **멤버 변수를 추가할 때**
  - SUID 값이 선언되면 멤버 변수가 추가하더라도 오류는 발생하지 않는다.
  - 재구성되는 클래스에 스트림에 없는 필드가 있으면 객체의 해당 필드가 기본값(예를 들어 null)으로 초기화된다.
  
- **멤버 변수가 삭제될 때**
  - 멤버 변수를 추가하는 것과 동일하게 오류는 발생하지 않으나 값 자체가 사라진다.
  
- **멤버 변수의 이름이 바뀔 때**
  - 멤버 변수의 이름이 바뀌게되면 역직렬화 오류는 발생하지 않으나 값이 할당되지 않는다.

- **멤버 변수의 타입이 바뀔 때**
  - 기존 멤버 변수의 타입이 변경되면 역직렬화 과정에서 `ClassCastException`이 발생할 수 있다.
  - int 타입을 double 타입 등으로 바꾸는 primitive Type 간의 변경에서도 동일하다.
  
- **접근 지정자의 변경**
  - public, protected 등과 같은 접근 지정자의 변경은 직렬화에 영향을 주지 않는다.
  
- **static과 transient**
  - static 멤버를 직렬화 후 non-static 멤버로 변경하게 되는 경우 직렬화된 값은 무시된다.
  - transient 키워드는 직렬화 대상에서 제외하는 선언이므로 역직렬화 시에 transient 선언을 제외하더라도 값은 채워지지 않는다.

<br>

# 이어서
이번 글에서는 자바 직렬화를 사용할 때 등장하는 **SerialVersionUID** 에 대해서 알아보았다. 이 유니크한 SUID 값은 명시하지
않으면 직렬화 시에 자동 생성되지만 직접 관리하는 것을 권장한다. 

그리고 클래스의 멤버 변수 타입이 바뀌는 등의 변경사항이 발생하는 경우 역직렬화 과정에서 예외가 생길 수 있다는 점도
반드시 고려해야 한다. 이어지는 글에서는 자바 직렬화를 사용할 때 주의할 점에 대해서 알아본다.

- <a href="/post/why-java-serialization-is-bad">다음글: "자바 직렬화: 자바 직렬화를 사용할 때 고민하고 주의할 점"</a>

