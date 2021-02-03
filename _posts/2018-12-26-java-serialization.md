---
layout:   post
title:    "자바 직렬화: 직렬화(Serialize)란 무엇일까?"
author:   Kimtaeng
tags: 	  java serialization deserialization
description: 자바에서 직렬화(serialization)와 역직렬화(deserialization)란 무엇이며 어떻게 사용할까?
category: Java
comments: true
---

# 목차
- 자바 직렬화: 직렬화(Serialize)란 무엇일까?
- <a href="/post/java-serialization-advanced">자바 직렬화: SerialVersionUID는 무엇일까?</a>
- <a href="/post/why-java-serialization-is-bad">자바 직렬화: 자바 직렬화를 사용할 때 고민하고 주의할 점</a>

<br>

# 직렬화? 그게 무엇일까?
자바 직렬화는 외부의 다른 자바 시스템에서 사용할 수 있도록 자바 객체나 데이터를 바이트 형태로 변환하는
기술을 말한다. 이러한 문맥에서 **직렬화(Serialization)**란 간단하게 포맷을 변환하는 기술이라 말할 수 있다.
그러니까, 자바 직렬화라는 직렬화의 기본 개념에 자바(Java) 라는 구체적인 특성이 지정된 것이다.

<br>

# 자바 직렬화 사용하기
직렬화를 하기 위해서는 조건이 있다. 객체가 **직렬화 가능한 클래스**의 인스턴스여야 한다. 
직렬화 가능한 클래스로 만드는 방법은 간단하다. `java.io.Serializable` 인터페이스 구현(implements)하도록 선언하면 된다. 

```java
/**
 * 직렬화 가능한 클래스로 만들기 위해
 * java.io.Serializable 인터페이스를 구현한다.
 */
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    public Article(String title, String pressName, String reporterName) {
        this.title = title;
        this.pressName = pressName;
        this.reporterName = reporterName;
    }
    
    // 차후 역직렬화에서 정상적으로 멤버 필드가 복원되었는지 값 확인을 위해! 
    @Override
    public String toString() {
        return String.format("title = %s, pressName = %s, reporterName = %s",
                title, pressName, reporterName);
    }

    // getter 생략
} 
```

물론 직접 구현하지 않아도 **직렬화 가능한 클래스를 상속(extends)**하면 직렬화 가능한 클래스가 된다.
클래스가 준비되었다면 객체 생성해서 직렬화 해보자. 객체 직렬화에는 `java.io.ObjectOutputStream` 클래스가 사용된다.

먼저 직렬화 가능한 클래스(Article)의 인스턴스를 생성하고 이를 `ObjectOutputStream`에 출력하였다.
그리고 결과를 정상적으로 확인하기 위해 `base64` 인코딩하여 콘솔 출력을 한다.

```java
// 직렬화 클래스인 Article은 위의 코드와 동일하다.
public class SerializeTester {
    public String serializeMethod() {
        Article article = new Article("직렬화는 무엇인가", "김탱일보", "김탱");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        
        // 아래와 같은 형태의 try-with-resources 구문은 java 9 버전부터 지원한다.
        try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(article);
        } catch (Exception e) {
            // ... 생략
        }
        
        // 바이트 배열로 생성된 데이터를 정상 출력하기 위해 base64 인코딩 
        return Base64.getEncoder().encodeToString(bos.toByteArray());
    }

    public static void main(String[] args) {
        SerializeTester tester = new SerializeTester();
        String data = tester.serializeMethod();
        
        // rO0ABXNyAAdBcn... 와 같은 인코딩된 문자열 출력 
        System.out.println(data);
    }
}
```


main 메서드에 출력한 결과는 개발자가 알아보기 힘든 인코딩된 문자열이다. 따라서 base64 인코딩을 진행했다.
이제 직렬화된 데이터를 이용하여 반대로 **역직렬화(Deserialization)** 하면 처음 선언한 객체를 얻을 수 있다.

<br>

# 직렬화를 할 때,
객체를 직렬화할 때 특정 멤버 필드를 제외하고 싶다면 멤버 변수에 `transient` 키워드를 선언하면 된다.
아래와 같이 특정 필드에 선언하면 역직렬화를 하더라도 해당 값은 제외된다. 

물론 `transient`로 선언되었더라도 우회시킬 수 있는 방법은 있다.

- <a href="/post/what-is-readobject-method-and-writeobject-method" target="_blank">
참고 링크 : "자바 직렬화: writeObject와 readObject"</a>

```java
// 기자 이름은 직렬화를 제외한다.
class Article implements Serializable {
    private String title;
    private String pressName;
    private transient String reporterName;

    // 이하 위의 예제와 동일합니다.
}
```

한편 직렬화가 가능한 클래스 내부에 **다른 클래스의 객체를 멤버 변수**로 가지고 있을 수 있다.
이럴 때는 해당 클래스도 직렬화가 가능하도록 `Serializable` 인터페이스를 구현하고 있어야 한다.

```java
class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    // java.time.LocalDateTime 클래스는 Serializable을 구현하고 있다.
    private LocalDateTime articleTime;
    
    // 개발자가 직접 만든 클래스. Serializable 구현을 명시해야만 가능하다.
    private DetailInfo detailInfo;
}
```

위의 예제에서 `java.time.LocalDateTime` 클래스의 경우 클래스 선언부에 `Serializable` 인터페이스를 구현하고 있음을
확인할 수 있다. 하지만 개발자가 직접 만들었거나 자바에서 직접 제공하는 클래스의 경우 `Serializable` 인터페이스를 구현하고
있지 않다면 직렬화가 불가능하다.

<br>

# 역직렬화
직렬화가 가능한 클래스의 인스턴스를 직렬화하였다면 이번에는 반대로 직렬화된 데이터를 다시 객체로 만드는
`역직렬화(Deserialization)`를 해보자. 역직렬화에는 `ObjectInputStream`을 사용한다.

```java
public class SerializeTester {

    // 직렬화 메서드(serializeMethod)는 위와 동일하다.

    public Article deserializeMethod(String serializedString) {
        // 앞선 직렬화에서 Base64 인코딩하였으므로 다시 디코딩한다.
        byte[] decodedData = Base64.getDecoder().decode(serializedString);
        ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);
        try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (Article) ois.readObject();
        } catch (Exception e) {
            // ... 생략
        }
        return null;
    }

    public static void main(String[] args) {
        SerializeTester tester = new SerializeTester();
        String data = tester.serializeMethod();
        Article article = tester.deserializeMethod(data);
        
        // title = 직렬화는 무엇인가, pressName = 김탱일보, reporterName = 김탱
        System.out.println(article);
    }
}
```

역직렬화를 할 때는 직렬화된 객체의 클래스가 반드시 클래스 경로(Class Path)에 존재해야 하며 `import` 된 상태여야 한다.

그리고 위의 예제에서는 직렬화된 데이터를 바로 이용하였지만 `FileOutputStream` 등을 사용하여 파일 출력을 한 후
그 파일을 다시 읽어 원래의 객체로 되돌릴 수도 있다.

<br>

# 정리하면
이번 글에서는 자바 직렬화에 대해서 알아보았다. 정리하면, 직렬화는 모든 클래스에 적용되는 것은 아니며
`java.io.Serializable` 인터페이스를 구현하는 클래스만 가능하다. 클래스의 멤버 변수로 선언된 클래스의 경우도 동일하다.

이어지는 글에서는 자바 직렬화를 사용할 때 등장하는 **SerialVersionUID** 에 대해서 알아본다.

- <a href="/post/java-serialization-advanced">다음글: "자바 직렬화: SerialVersionUID는 무엇일까?"</a>