---
layout:   post
title:    자바에서 직렬화(serialize)란 무엇일까? 
author:   Kimtaeng
tags: 	  java serialize deserialize
subtitle: 자바에서의 직렬화와 역직렬화 그리고 SerialVersionUID 대해서 알아봅니다.
category: Java
comments: true
---

<hr/>

> ## 자바 직렬화

자바 객체나 데이터를 내 자바 프로그램에서 사용하다가 나중에 다시 꺼내 쓴다거나 네트워크, 스트림 등을 통해서
다른 자바 시스템 간에 서로 데이터를 주고 받는 방법을 고민해 본 적이 있다면 **자바 직렬화(Java Serialization)**가 도움을 줄 수 있습니다.

자바 직렬화는 외부의 다른 자바 시스템에서도 사용할 수 있도록 자바 객체(Object) 또는 데이터를 Byte 형태로 데이터를
변환하는 기술을 말합니다. 이러한 문맥에서 **직렬화(Serialization)**라는 것은 여러 차원(Dimension)의 데이터를 다른 곳에 보내기 적절하도록
일차원의 흐름으로 만들어 다른 컴퓨터 환경에서도 나중에 재구성할 수 있는 포맷으로 변환하는 것을 말합니다.
이러한 직렬화라는 기본 개념에 자바(Java) 라는 구체적인 특성이 지정되는 것이지요.

<br/><br/>

> ## 직렬화 해보기

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

<br/><br/>

> ## 직렬화를 할 때

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

<br/><br/>

> ## 역직렬화

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



<br/><br/>

> ## SerialVersionUID

직렬화와 역직렬화를 얘기할 때 빼놓을 수 없는 것이 **SerialVersionUID(이하 SUID)** 입니다. 직렬화를 할 때 SUID 선언이 없다면
내부에서 자동으로 유니크한 번호를 생성하여 관리하게 됩니다. 이 SUID는 직렬화와 역직렬화 과정에서 값이 서로 맞는지 확인 후에
처리를 하기 때문에 이 값이 맞지 않다면 ```InvalidClassException``` 예외가 발생합니다. 

자바의 직렬화 스펙을 <a href="https://docs.oracle.com/javase/10/docs/specs/serialization/class.html" target="_blank">
Oracle Docs(링크)</a>를 통해 살펴보면 SUID 값은 필수가 아니며 선언되어 있지 않으면 클래스의 기본 해시값을 사용한다고 합니다.

따라서 **직접 SUID를 명시하지 않아도 내부에서 자동으로 값이 추가**되며 이 값들은 클래스의 이름, 생성자 등과 같이
클래스의 구조를 이용해서 생성합니다. 앞선 예제에서도 직렬화 가능한 클래스(Article)를 선언할 때 SUID 값을 생략했지만
내부적으로 정보가 생성되어 있음을 유추할 수 있습니다.

실제로 그러한지 예제로 확인해봅시다. 클래스의 구조 정보를 이용하여 SUID를 생성하므로 직렬화 시점의 클래스 구조와
역직렬화 시점의 클래스의 구조를 바꿔보면 확인할 수 있을 것 같습니다. 물론 오류가 발생하겠지만요.

먼저 기존과 동일한 Article 클래스를 준비하고 이 클래스의 인스턴스를 직렬화합니다.
그리고 바이트 배열로 생성된 데이터를 ```Base64```로 인코딩한 문자열을 콘솔 출력합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class Article implements Serializable {
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
</code></pre>

출력된 결과는 아래와 같이 ```Base64```로 인코딩되어 ASCII 영역 문자로만 이루어진 문자열 데이터일 것입니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 인코딩된 문자열
rO0ABXNyAAdBcnRpY2xlXrUf2YfJzCYCAANMAAlwcmVzc05hbWV0ABJMamF2YS9sYW5nL1N0cmluZztMAAxyZXBvcnRlck5hbWVxAH4AAUwABXRpdGxlcQB+AAF4cHQADOq5gO2DseydvOuztHQABuq5gO2DsXQAGeyngeugrO2ZlOuKlCDrrLTsl4fsnbjqsIA=
</code></pre>

그럼 이 상태에서 **Article 클래스에 멤버 변수를 추가**해봅시다. 추가한 후에는 위에서 얻은 직렬화 데이터를 통해서
바로 역직렬화를 진행하면 됩니다.

<pre class="line-numbers"><code class="language-java" data-start="1">class Article implements Serializable {
    private String title;
    private String pressName;
    private String reporterName;
    
    // 새로운 멤버 추가
    private String phoneNumber;
    
    // ... 이하 생략
}
</code></pre>
 
역직렬화를 진행하면 바로 예외가 발생함을 알 수 있습니다. 

<pre class="line-numbers"><code class="language-java" data-start="1">java.io.InvalidClassException: Article;
    local class incompatible: stream classdesc serialVersionUID = 6824395829496368166,
    local class serialVersionUID = 1162379196231584967
</code></pre>

예제를 통해서 **Article 클래스** 에서는 SUID를 선언한 적이 없으나 오류 메시지처럼 자동으로
선언됨을 알 수 있습니다. 그리고 클래스의 구조가 변경되었을 때 오류가 발생한다는 것도 알게 되었고요. 

<div class="post_caption">그러면 어떻게 하지? SUID를 관리라도 해야하나?</div>

<br/><br/>

> ## SUID 관리

자바에서는 SUID를 개발자가 선언하고 관리하는 방식을 권장합니다. 예제에서 사용한 **Article 클래스**에
**SerialVersionUID** 를 직접 선언해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">class Article implements Serializable {
    // 간단한 예를 들기위해 간단한 값으로 선언합니다.
    private static final long serialVersionUID = 1L;

    private String title;
    private String pressName;
    private String reporterName;

    // ... 이하 생략
} 
</code></pre>

SUID를 추가한 후에 직렬화하여 출력된 값은 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 인코딩된 문자열
rO0ABXNyAAdBcnRpY2xlAAAAAAAAAAECAANMAAlwcmVzc05hbWV0ABJMamF2YS9sYW5nL1N0cmluZztMAAxyZXBvcnRlck5hbWVxAH4AAUwABXRpdGxlcQB+AAF4cHQADOq5gO2DseydvOuztHQABuq5gO2DsXQAGeyngeugrO2ZlOuKlCDrrLTsl4fsnbjqsIA=
</code></pre>

**Article 클래스**에 멤버를 추가한 뒤 출력된 문자열 값으로 다시 역직렬화를 해봅시다.
SUID 값이 선언되면 직렬화 클래스의 멤버가 추가되더라도 역직렬화 과정에서 오류는 발생하지 않습니다.

사실 이러한 관점에서 직렬화를 사용할 때는 자주 변경될 소지가 있는 클래스의 객체는 사용하지 않는 것이
좋다고 생각할 수 있을 것 같습니다. 프레임워크 또는 라이브러리에서 제공하는 클래스의 객체도 버전업을 통해
**SerialVersionUID**가 변경될 경우가 있으므로 예상하지 못한 오류가 발생할 수 있습니다. 

직렬화를 사용할 때 오류가 발생하거나 주의해야 하는 경우를 정리해보면

- **멤버 변수를 추가할 때**
  - SUID 값이 선언되면 멤버 변수가 추가하더라도 오류는 발생하지 않습니다.
  - 재구성되는 클래스에 스트림에 없는 필드가 있으면 객체의 해당 필드가 기본값(예를 들어 null)으로 초기화됩니다.
  
- **멤버 변수가 삭제될 때**
  - 멤버 변수를 추가하는 것과 동일하게 오류는 발생하지 않으나
  
- **멤버 변수의 이름이 바뀔 때**
  - 멤버 변수의 이름이 바뀌게되면 역직렬화 오류는 발생하지 않으나 값이 할당되지 않습니다.

- **멤버 변수의 타입이 바뀔 때**
  - 기존 멤버 변수의 타입이 변경되면 역직렬화 과정에서 ```ClassCastException```이 발생할 수 있습니다.
  - int 타입을 double 타입 등으로 바꾸는 primitive Type 간의 변경에서도 동일합니다.
  
- **접근 지정자의 변경**
  - public, protected 등과 같은 접근 지정자의 변경은 직렬화에 영향을 주지 않습니다.
  
- **static과 transient**
  - static 멤버를 직렬화 후 non-static 멤버로 변경하게 되는 경우 직렬화된 값은 무시됩니다.
  - transient 키워드는 직렬화 대상에서 제외하는 선언이므로 역직렬화 시에 transient 선언을 제외하더라도
  값은 채워지지 않습니다.
 
<br/><br/>

> ## 데이터의 크기

클래스의 정보를 기반으로 수행하는 자바 직렬화는 다른 포맷에 비해 상대적으로 용량이 큰 이슈가 있습니다.
앞서 진행했던 예제에서의 객체를 직렬화한 데이터와 객체를 JSON 포맷으로 변경한 것을 비교해보면

<pre class="line-numbers"><code class="language-java" data-start="1">public void compareFormatSize(String serializedString) {
    byte[] decodedData = Base64.getDecoder().decode(serializedString);
    System.out.println("decodedData size (Byte) : " + decodedData.length);
    ByteArrayInputStream bis = new ByteArrayInputStream(decodedData);

    try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
        Object object = ois.readObject();
        Article article = (Article) object;

        // jackson의 객체 -> 문자열 변환 메서드를 사용하려면 getter 메서드가 정의되어야 합니다.
        String jsonString = new ObjectMapper().writeValueAsString(article);
        System.out.println("print using json format : "+ jsonString);
        System.out.println("json string size (Byte) : " + jsonString.getBytes().length);
    } catch (Exception e) {
        // ... Exception Handling
    }
}

// 출력 결과
// decodedData size (Byte) : 146
// print using json format : {"title":"직렬화는 무엇인가","pressName":"김탱일보","reporterName":"김탱"}
// json string size (Byte) : 88
</code></pre>
 
간단한 클래스임에도 불구하고 **JSON** 데이터와 크기 차이가 꽤 발생합니다.
작은 크기의 데이터만 입력되는 서비스라면 큰 이슈가 없겠으나 트래픽에 따라 데이터가 급증하는 서비스라면
고민을 해봐야할 것 같습니다.

<div class="post_caption">그럼 애초부터 JSON을 사용하면 될 것인데, 왜 자바 직렬화를 사용할까요?</div>

<br/><br/>

> ## JSON vs 자바 직렬화

JSON은 사용하기 쉽고 자바 스크립트에서 거의 그대로 해석된다고 볼 수 있을 정도로 설계된 포맷입니다.

<pre class="line-numbers"><code class="language-json" data-start="1">{
    title: "직렬화는 무엇인가",
    pressName: "김탱일보",
    reporterName: "김탱"
}
</code></pre>

**JSON**을 비롯하여 엑셀 파일을 추출할 때 등에서 흔히 볼 수 있는 **콤마로 구분되는 CSV** 포맷은 사용된 **시스템의 특성과
상관없이** 데이터를 주고 받을 때 사용됩니다. 이러한 관점에서 보면 **자바 직렬화는 "자바 시스템 간의 데이터를
주고 받기 위함이다."** 라고 생각할 수 있습니다. 

앞선 예제에서도 살펴본 것처럼 데이터의 타입에 대한 고민마저 하지 않아도 직렬화가 가능하며 역직렬화를 통해서
그 객체를 바로 사용할 수 있습니다. 목적에 맞게 사용하는 것이 맞다고 볼 수도 있겠지만 정답은 없는 것 같습니다.
개인적으로는 JSON 포맷 형태의 데이터를 다루는데 편했으니까요.

물론 실무에서도 자바 직렬화된 객체를 **MySQL DB**에 저장해두고 꺼내쓰는 방법을 보았으나
최근에는 JSON 데이터를 더 애용하는 것 같습니다. 특히나 **MySQL 5.7** 버전에서는 JSON 형태의 타입을
적절하게 사용할 수 있도록 기능을 제공합니다. 몽고(Mongo DB)와 같은 저장소를 사용한다면 고민할 필요도 없겠지요.

<br/><br/>

> ## 정리해보면

직렬화는 모든 클래스에 적용되는 것은 아닙니다. **Serializable** 인터페이스를 구현하는 클래스만 가능하며
클래스의 멤버 변수로 선언된 클래스의 경우도 동일합니다.

**SerialVersionUID** 라는 유니크한 값은 명시하지 않으면 직렬화 시에 자동 생성되지만 직접 관리하는 것을 권장합니다.
그리고 역직렬화(Deserialization) 과정에서 예외가 생길 수 있다는 점을 반드시 생각해야 합니다.

데이터의 용량 등의 이슈가 있을 수 있으므로 JSON과 같은 다른 포맷을 사용하는 방법도 있으며
**자주 변경될 소지가 있는** 클래스에 자바 직렬화를 사용하면 숨어있는 위험 요소가 생길 수 있습니다.