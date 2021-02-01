---
layout:   post
title:    "자바 직렬화: 자바 직렬화를 사용할 때 고민하고 주의할 점"
author:   Kimtaeng
tags: 	  java serialization deserialization
description: "자바 직렬화를 사용할 때 주의할 점은 무엇일까? 그리고 왜 권장되지 않을까?"
category: Java
comments: true
---

# 목차
- <a href="/post/java-serialization">자바 직렬화: 직렬화(Serialize)란 무엇일까?</a>
- <a href="/post/java-serialization-advanced">자바 직렬화: SerialVersionUID는 무엇일까?</a>
- 자바 직렬화: 자바 직렬화를 사용할 때 고민하고 주의할 점

<br>

# 자바 직렬화는 무조건 좋을까?
자바에서 직렬화는 권장되지 않는 경우가 많다. 공격 범위가 넓어 악의적으로 공격할 수 있는 요소가 많기 때문이다.
특히 신뢰할 수 없는 데이터의 역직렬화는 위험 요소로 작용할 수 있기 때문에 주의해야 한다.

이번 글에서는 자바 직렬화를 사용할 때 고민할 점과 자바 직렬화를 권장하지 않는 이유를 알아본다.

<br>

# 데이터의 크기가 상대적으로 크다.
클래스의 정보를 기반으로 수행하는 자바 직렬화는 다른 포맷에 비해 상대적으로 용량이 큰 이슈가 있다.
앞서 진행했던 예제에서의 객체를 직렬화한 데이터와 객체를 JSON 포맷으로 변경한 것을 비교해보자.

```java
public void compareFormatSize(String serializedString) {
    byte[] decodedData = Base64.getDecoder().decode(serializedString);
    System.out.println("decodedData size (Byte) : " + decodedData.length);
    ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);

    try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
        Object object = ois.readObject();
        Article article = (Article) object;

        // jackson의 객체 -> 문자열 변환 메서드를 사용하려면
        // getter 메서드가 정의되어야 한다.
        String jsonString = new ObjectMapper().writeValueAsString(article);
        System.out.println("json format : "+ jsonString);
        System.out.println("json string size (Byte) : " + jsonString.getBytes().length);
    } catch (Exception e) {
        // ... Exception Handling
    }
}

// 출력 결과
// decodedData size (Byte) : 146
// json format : {"title":"직렬화는 무엇인가","pressName":"김탱일보","reporterName":"김탱"}
// json string size (Byte) : 88
```
 
간단한 클래스임에도 불구하고 **JSON** 데이터와 크기 차이가 발생한다. 작은 크기의 데이터만 입력되는 서비스라면 큰 이슈가 없겠으나
트래픽에 따라 데이터가 급증하는 서비스라면 고민을 해봐야 할 것 같다.

<br>

# 역직렬화 필터링
한편 < 이펙티브 자바 > 서적에서는 자바 직렬화에 대해 다음과 같이 언급하고 있다.
**_"직렬화를 피할 수 없고 역직렬화한 데이터가 안전한지 확신할 수 없다면 객체 역직렬화 필터링을 사용하자."_** 

자바 직렬화 대신에 JSON 등을 사용하고 만일 대체할 수 없다면 **객체 역직렬화 필터링**을 이용하는 것을 권장하는 것이다.

- <a href="/post/prefer-alternatives-to-java-serialization" target="_blank">
참고 링크: "[이펙티브 자바 3판] 아이템 85. 자바 직렬화의 대안을 찾으라"</a>

이러한 이유는 자바 직렬화가 위험하기 때문인데, 이러한 자바 직렬화의 위험은 `readObject` 메서드로부터 온다.
이 메서드는 클래스 패스에 있고 직렬화 조건인 `Serializable` 인터페이스를 구현한 모든 타입을 생성할 수 있기 때문이다.
게다가 그 타입들 안의 모든 코드도 수행할 수 있다.

따라서 역직렬화 필터링을 사용하면 안전하다고 확신할 수 있는 클래스만 등록하여 역직렬화해서 사용해야 한다.
예제 코드를 통해 알아보자.

```java
public class ObjectInputFilterExample {
    public static void main(String[] args) throws Exception {
        filterTest(new MadPlayClass());
        filterTest(new KimtaengClass());
    }

    private static void filterTest(Object obj) throws Exception {
        Path tempFile = Files.createTempFile("test-file", "");
        ObjectOutputStream oos = new ObjectOutputStream
                (new FileOutputStream(tempFile.toFile()));

        try (oos) {
            oos.writeObject(obj);
        }

        ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream(tempFile.toFile()));
        ois.setObjectInputFilter(createFilter());
        try (ois) {
            Object o = ois.readObject();
            System.out.println("Class Name: " + o.getClass().getSimpleName());
        }
    }

    private static ObjectInputFilter createFilter() {
        return filterInfo -> {
            Class<?> clazz = filterInfo.serialClass();

            if (MadPlayClass.class.isAssignableFrom(clazz)) {
                // 역직렬화가 허용된다.
                return ObjectInputFilter.Status.ALLOWED;
            }
            System.err.println("Rejected :" + clazz.getSimpleName());
            return ObjectInputFilter.Status.REJECTED;
        };
    }

    // 예시 클래스 - 역직렬화가 허용된다.
    public static class MadPlayClass implements Serializable { }

    // 예시 클래스 - 역직렬화가 허용되지 않는다.
    public static class KimtaengClass implements Serializable { }
}
```

예제 코드를 실행한 결과는 아래와 같다.

```bash
Class Name: MadPlayClass
Rejected :KimtaengClass
Exception in thread "main" java.io.InvalidClassException: filter status: REJECTED
...생략
```

출력 결과를 보면 알 수 있듯이, 필터에 허용된(ALLOWED) 클래스만 역직렬화에 성공하고 반대로 반려된(REJECTED) 클래스의 경우는
`InvalidClassException` 예외를 던지며 역직렬화에 실패한다. 이처럼 데이터가 안전한지 확신할 수 없을 때는 필터를 통해
화이트 리스트를 관리하면 위험으로부터 보호할 수 있다.

<br>

# JSON vs 자바 직렬화
애초부터 JSON을 사용하면 될 것 같은데, 왜 자바 직렬화를 사용할까? 콤마로 구분되는 **CSV** 포맷을 떠올려보자.
이 포맷은 엑셀 파일을 추출할 때와 같은 상황에서 흔히 볼 수 있는데, **시스템의 특성과 상관없이** 데이터를 주고 받을 때 사용된다.

이러한 관점에서, 자바 직렬화는 **자바 시스템 간의 데이터를 주고받기 위함**이라고 생각할 수 있다. 데이터의 타입에 대한
고민마저 하지 않아도 직렬화가 가능하다. 또한 역직렬화를 통해서 그 객체를 바로 사용할 수 있어 매우 간편하다.

물론 실무에서도 자바 직렬화된 객체를 **MySQL DB**에 저장해두고 꺼내 쓰는 방법을 보았으나 최근에는 **JSON** 포맷을
더 쉽게 볼 수 있다. 특히나 **MySQL 5.7** 버전에서는 JSON 형태의 타입을 적절하게 사용할 수 있도록 기능을 제공한다.
몽고(MongoDB)와 같은 저장소를 사용한다면 고민할 필요도 없을 것 같다.

<br>

# 정리하면
자바 직렬화는 생각보다 사용할 때 고민할 점이 많다. 악의적인 공격 요소가 될 수 있기 때문에 대부분 JSON과 같은 플랫폼에 엮이지 않고
범용적으로 사용할 수 있는 대안을 권장한다. 꼭 직렬화를 사용해야 한다면 역직렬화 필터링 등을 통해 위험 요소를 줄여야 한다.