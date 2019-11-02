---
layout:   post
title:    "JAXB marshal, unmarshal(마샬, 언마샬)"
author:   Kimtaeng
tags: 	  java jaxb marshal unmarshal
description: "자바에서 XML을 파싱할 때 사용하는 JAXB(Java Architecture for XML Binding) API로 마샬링, 언마샬링을 해보자."
category: Java
comments: true
---

# Java Architecture for XML Binding
JAXB는 XML Schema를 읽어서 자바 오브젝트로 만드는 언마샬링(Unmarshaling)과
반대로 자바 오브젝트를 XML로 변환하는 마샬링(Marshalling)을 가능하도록 하는 Java API를 말합니다.

대부분 JSON(JavaScript Object Notation)을 많이 사용하는 추세지만 XML도 적지않게 사용하고 있습니다.
또한 JSON을 다룰 때 자주 사용하는 `Jackson`을 통해서도 XML 파싱이 가능합니다. 하지만 이번 포스팅에서는 
단순히 JAXB API를 이용하여 자바 오브젝트를 XML 형태로 변환하거나, XML을 읽어서 자바 오브젝트로 변환하는 방법을 살펴봅니다.

<br/>

# Marshal 예제(POJO to XML)
POJO(Plain Old Java Object)를 XML로 변환하는 마샬링(Marshalling)을 해봅시다.
먼저 아래와 같은 Person 클래스가 있다고 가정합시다. 이 클래스는 이번 마샬링 예제뿐만 아니라 언마샬링 예제에서도 사용됩니다.

```java
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class Person {
    @XmlElement
    private String name;
    @XmlElement
    private String email;
    
    // 생성자, getter, setter 생략
}
```

위 클래스를 이용하여 오브젝트를 생성한 후에 그 오브젝트를 XML로 변환합니다.

```java
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;

public class JaxbText {

    public void marshalTest() {
        try {
            Person person = new Person("jaxb", "jaxb@hello.com");

            // JAXBContext 생성 & marshaller 생성
            JAXBContext context = JAXBContext.newInstance(Person.class);
            Marshaller marshaller = context.createMarshaller();

            // 보기 좋게 출력해주는 옵션
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

            // 표준 출력으로 결과를 보여준다.
            marshaller.marshal(person, System.out);
        } catch (Exception e) {
            // ... handle exception
        }
    }

    public static void main(String[] args) {
        new JaxbText().marshalTest();
    }
}
```

위 코드에서 8번 라인은 매개변수인 클래스를 통해서 파싱에 필요한 정보를 생성하고 9번 라인에서 마샬링에 필요한 마샬러 객체를 생성합니다.
12번 라인의 마샬러 옵션을 통해 XML 결과를 보기 좋게 출력하도록 설정합니다. 코드 실행 결과는 아래와 같습니다.  

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<person>
    <name>jaxb</name>
    <email>jaxb@hello.com</email>
</person>
```

<br/>

# Unmarshal 예제(XML to POJO)

다음으로는 XML을 자바 오브젝트로 변환하는 언마샬링(Unmarshalling)을 해봅시다.
먼저, 아래와 같은 XML 파일이 있다고 가정합시다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
    <name>kim jaxb</name>
    <email>jaxb@hello.com</email>
</person>
```

위의 XML 파일의 내용을 읽어서 자바 오브젝트로 변환합니다. 코드는 아래와 같습니다.

```java
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Unmarshaller;
import java.io.File;

public class JaxbText {

    public void unmarshalTest() {
        try {
            // XML 파일을 읽어온다.
            File file = new File(getClass().getResource("test.xml").getFile());
            
            // JAXBContext 생성 & unmarshaller 생성
            JAXBContext context = JAXBContext.newInstance(Person.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();
            
            // XML을 Person 오브젝트로 변환한다.
            Person person = (Person) unmarshaller.unmarshal(file);
            
            System.out.println("name: " + person.getName());
            System.out.println("email: " + person.getEmail());
        } catch (Exception e) {
            // ... handle exception
        }
    }
    
    public static void main(String[] args) {
        new JaxbText().unmarshalTest();
    }
}

// 출력 결과
// name: kim jaxb
// email: jaxb@hello.com
```

POJO 클래스에 사용된 `@XmlElement`는 옵션으로 name필드를 입력받을 수 있습니다.
클래스의 멤버 필드 이름과 XML 엘리먼트의 이름이 다를 경우에는 아래와 같이 설정하여 언마샬링할 수 있습니다.

```java
@XmlRootElement
public class Person {
    // XML 엘리먼트 이름으로 지정할 수 있다.
    @XmlElement(name="nickname")
    private String name;
    @XmlElement
    private String email;
    
    // 생성자, getter, setter 생략
}
```

<br/>

# 정리하면
JAXB API를 이용하면 간단하게 XML 파싱을 진행할 수 있습니다. 다만 `JaxbContext`를 초기화하고 마샬러, 언마샬러를 생성하는
부분에서 **주의할 점**이 있는데요. 스레드 안전한(thread-safe) JAXBContext의 경우는 **1회 생성 후 재사용을 권장**하고 있습니다.
생성 비용이 적지않기 때문에 마샬/언마샬을 수행될 때마다 매번 생성하는 것보다 한 번 생성하고 재사용하는 편이 좋습니다.

다만, 마샬러(Marshaller)와 언마샬러(Unmarshaller)의 경우 스레드 안전하지 않기 때문에 **마샬/언마샬이 수행될 때마다 다시
생성**하는 것을 권장합니다. 다행히 이를 생성하는 비용은 크지 않습니다.

이어지는 포스팅에서는 JAXB API를 사용하는 과정에서 문법 오류(Syntax Error) 등의 이유로 에러가 발생하는 것을 탐지하는
방법, 그리고 발생한 위치를 알아내는 방법 등에대해서 알아봅니다.
 
- <a href="/post/jaxb-validation-event-handler" target="_blank">
참고 링크: ValidationEventHandler를 이용하여 JAXB 파싱 에러 탐지하기</a> 