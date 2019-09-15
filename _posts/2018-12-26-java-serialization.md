---
layout:   post
title:    자바 직렬화(Java Serialize) 
author:   Kimtaeng
tags: 	  java serialize deserialize
subtitle: 자바에서 직렬화(serialize)와 역직렬화(deserialize)란 무엇일까?
category: Java
comments: true
---

<hr/>

# 자바 직렬화

자바 객체나 데이터를 내 자바 프로그램에서 사용하다가 나중에 다시 꺼내 쓴다거나 네트워크, 스트림 등을 통해서
다른 자바 시스템 간에 서로 데이터를 주고 받는 방법을 고민해 본 적이 있다면 **자바 직렬화(Java Serialization)**가
도움을 줄 수 있습니다.

자바 직렬화는 외부의 다른 자바 시스템에서도 사용할 수 있도록 자바 객체(Object) 또는 데이터를 Byte 형태로 데이터를
변환하는 기술을 말합니다. 이러한 문맥에서 **직렬화(Serialization)**라는 것은 여러 차원(Dimension)의 데이터를 다른 곳에
보내기 적절하도록 일차원의 흐름으로 만들어 다른 컴퓨터 환경에서도 나중에 재구성할 수 있는 포맷으로 변환하는 것을 말합니다.
이러한 직렬화라는 기본 개념에 자바(Java) 라는 구체적인 특성이 지정되는 것이지요.

<br/>

# 직렬화 해보기

자바 직렬화를 하는 방법은 간단합니다. 하지만 직렬화(Serialize)를 하기 위한 **조건** 이 있는데요.
객체를 직렬화하기 위해 **직렬화가 가능한 클래스** 를 먼저 만드는 것입니다. 바로 **Serializable 인터페이스를 구현**해서 말이지요.

<pre class="line-numbers"><code class="language-java" data-start="1">/**
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
    @Override public String toString() {
        return String.format("title = %s, pressName = %s, reporterName = %s",
                title, pressName, reporterName);
    }

    // getter 생략
} 
</code></pre>

보통은 위 코드처럼 ```java.io.Serializable``` 인터페이스를 구현(implements)하면 직렬화가 가능한 클래스가 됩니다.
물론 구현하지 않아도 직렬화가 되는 경우가 있습니다. 예를 들어 직렬화 가능한 클래스를 상속한 클래스도 직렬화가 가능한
클래스가 됩니다.

직렬화가 가능한 클래스가 준비되었다면 객체를 직렬화 해봅시다. 객체 직렬화에는 ```java.io.ObjectOutputStream```이 사용됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 직렬화 클래스인 Article은 위의 코드와 동일합니다.
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
        
        // 바이트 배열로 생성된 데이터를 정상 출력하기 위해 base64 인코딩 
        return Base64.getEncoder().encodeToString(bos.toByteArray());
    }

    public static void main(String[] args) {
        Main main = new Main();
        String serializedString = main.serializeMethod();
        
        // rO0ABXNyAAdBcn... 와 같은 인코딩된 문자열 출력 
        System.out.println(serializedString);
    }
}
</code></pre>

위의 코드에서는 직렬화 가능한 클래스(Article)의 인스턴스를 생성하고 이를 ```OutputStream```에 출력하였습니다.
그리고 결과값인 바이트 배열 데이터의 결과를 정상적으로 확인하기 위해 ```base64 인코딩```하여 콘솔 출력을 하였고요. 

main 메서드에 출력한 결과는 개발자가 알아보기 힘든 인코딩된 문자열입니다만(인코딩하지 않으면 더 힘들지만)
이 값을 이용하여 다시 **역직렬화(Deserialization)**하면 처음 선언한 객체를 얻을 수 있습니다.

<br/>

# 직렬화를 할 때

만일 객체를 직렬화할 때 특정 멤버를 제외하고 싶다면 멤버 변수에 ```transient``` 키워드를 입력하면 됩니다.
아래와 같이 특정 필드에 직렬화를 제외하도록 선언하면 역직렬화를 하더라도 해당 값은 제외됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 기자 이름은 직렬화를 제외한다.
class Article implements Serializable {
    private String title;
    private String pressName;
    private transient String reporterName;

    // 이하 위의 예제와 동일합니다.
}
</code></pre>

한편 직렬화가 가능한 클래스 내부에 **다른 클래스의 객체를 멤버 변수**로 가지고 있는 경우에는
해당 클래스도 자바 직렬화가 가능하도록 ```Serializable``` 인터페이스를 구현하고 있어야 합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;

    // java.time.LocalDateTime 클래스는 Serializable을 구현하고 있다.
    private LocalDateTime articleTime;
    
    // 개발자가 직접 만든 클래스. Serializable 구현을 명시해야만 가능하다.
    private DetailInfo detailInfo;
}
</code></pre>

위의 예제에서 ```java.time.LocalDateTime``` 클래스의 경우 클래스 선언부에 ```Serializable``` 인터페이스를
구현하고 있음을 확인할 수 있습니다. 하지만 개발자가 직접 만들었거나 자바에서 직접 제공하는 클래스의 경우
```Serializable``` 인터페이스를 구현하고 있지 않다면 직렬화가 불가능합니다.

<br/>

# 역직렬화

직렬화가 가능한 클래스의 인스턴스를 직렬화하였다면 이번에는 반대로 다시 객체로 만드는
```역직렬화(Deserialization)```를 해봅시다. 역직렬화에는 ```ObjectInputStream```을 사용합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class Main {
    // 직렬화 메서드(serializeMethod)는 위와 동일합니다.

    public Article deserializeMethod(String serializedString) {
        // 앞선 직렬화에서 Base64 인코딩하였으므로 다시 디코딩한다.
        byte[] decodedData = Base64.getDecoder().decode(serializedString);
        ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);
        try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
            Object object = ois.readObject();
            return (Article) object;
        } catch (Exception e) {
            // ... Exception Handling
        }
        return null;
    }

    public static void main(String[] args) {
        Main main = new Main();
        String serializedString = main.serializeMethod();
        Article article = main.deserializeMethod(serializedString);
        
        // title = 직렬화는 무엇인가, pressName = 김탱일보, reporterName = 김탱
        System.out.println(article);
    }
}
</code></pre>

역직렬화를 할 때는 직렬화된 객체의 클래스가 반드시 클래스 패스(Class Path)에 존재해야 하며 ```import```된 상태여야 합니다.

그리고 위의 예제에서는 직렬화된 데이터를 바로 이용하였지만  ```FileOutputStream``` 등을 사용하여
파일 출력을 한 후 그 파일을 다시 읽어 원래의 객체로 되돌릴 수도 있습니다.

<br/>


# 이어서

이번 포스팅에서는 자바 직렬화란 무엇인지, 직렬화하는 방법과 반대로 역직렬화하는 방법에 대해서 알아보았습니다.
이어지는 글에서 자바 직렬화를 사용할 때 빼먹을 수 없는 SerialVersionUID 과 같은 조금 더 상세한 내용에 대해서 살펴봅니다.
- <a href="/post/java-serialization-advanced" target="_blank">링크: 자바 직렬화와 SerialVersionUID</a>