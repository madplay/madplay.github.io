---
layout:   post
title:    "ValidationEventHandler를 이용하여 JAXB 파싱 에러 탐지하기"
author:   Kimtaeng
tags: 	  java jaxb validation eventhandle
description: "ValidationEventHandler를 이용하여 JAXB 언마샬 에러를 탐지하고 에러 내용과 에러 라인 수를 확인해보자"
category: Java
comments: true
---

# 어디서 오류가 났는지 알 수 있을까?
이번 포스팅에서는 XML을 자바 오브젝트로 변환하는 언마샬(Unmarshal) 과정에서 XML 파일 내용에 포맷 오류가 있을 때
`ValidationEventHandler`를 이용하여 발생한 에러의 원인과 XML 파일 내의 어느 라인에서 오류가 발생했는지 알아내는 방법을
테스트해볼 예정입니다. 

JAXB에 대한 설명과 마샬(Marshal), 언마샬(Unmarshal)에 관한 내용은 이전 포스팅을 참고하시기 바랍니다.
- <a href="/post/jaxb-marshal-unmarshal" target="_blank">참고 링크: JAXB marshal, unmarshal(마샬, 언마샬)</a>

<br/>

# ValidationEventHandler
JAXB API를 사용하여 XML을 자바 오브젝트로 변환할 때, 파일 내용에 아무런 문법 오류(Syntax Error)가 없다면 간단하게 변환이 됩니다.
하지만, XML 문법 규칙에 맞지 않거나, POJO에 정의되지 않은 필드가 XML에 정의되어 있거나하는 이유 등으로 인해 에러가 발생할 수 있습니다.
개발자가 추가적으로 이벤트 핸들러(Event Handler)를 등록하지 않은 상태라면 위와 같은 오류들은 무시되는 것이 기본 스펙이지만,
에러가 발생하는 원인을 탐지해야 하거나 에러 상황을 캐치(catch)하여 다른 동작을 수행하고 싶을 때는 이벤트 핸들러가 필요합니다.

간단하게 `ValidationEventHandler`를 이용하면 JAXB 마샬, 언마샬 과정에서의 이벤트를 핸들링할 수 있습니다.
이번 예제에서는 이벤트핸들러 인터페이스를 직접 구현(implements)하여 별도의 클래스로 분리하여 진행해봅니다. 

```java
class CustomEventHandler implements ValidationEventHandler {
    public boolean handleEvent(ValidationEvent event) {
        if (event.getSeverity() == ValidationEvent.FATAL_ERROR
                || event.getSeverity() == ValidationEvent.ERROR) {
            ValidationEventLocator locator = event.getLocator();
            String message = event.getMessage();

            System.out.println("Severity: " + event.getSeverity());
            System.out.println("Line Number: " + locator.getLineNumber());
            System.out.println("Column Number: " + locator.getColumnNumber());
            System.out.println("Event Message: " + message);
        }
        return false;
    }
}
```

코드의 내용을 조금 덧붙여보면...
- `event.getSeverity()`: 이벤트 객체의 severity 값은 반드시 **ValidationEvent.WARNING(정수 값 0), 
ValidationEvent.ERROR(정수 값 1), ValidationEvent.FATAL_ERROR(정수 값 2)** 중 하나입니다.
  - 이들은 ValidationEvent 인터페이스의 public 상수로 정의되어 있으며 각 단계에서 발생하는 에러들은 문서를 참고하기 바랍니다.
  - <a href="https://www.w3.org/TR/xml/#sec-terminology" target="_blank" rel="nofollow">
  참고 링크: Extensible Markup Language (XML) 1.0 > Terminology</a>
- `ValidationEventLocator`: 발생한 ValidationEvent의 위치 정보를 캡슐화하고 있는 객체입니다.
  - 에러 발생 라인 번호(line number), 발생 열 번호(column number), 내용(message) 등을 확인할 수 있습니다.
- `return`: 이벤트 처리 이후에 현재 진행하고 있는 마샬, 언마샬, 유효성검사(validate) 등을 계속 진행할지에 대한 Boolean 값

사용할 때는 위에서 정의한 이벤트 핸들러를 마샬러 또는 언마샬러 등에 설정해주면 됩니다.

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
            
            // 직접 정의한 이벤트 핸들러 설정 추가
            unmarshaller.setEventHandler(new CustomEventHandler());
            
            // XML을 Person 오브젝트로 변환한다.
            Person person = (Person) unmarshaller.unmarshal(file);
            
            // ... 생략
        } catch (Exception e) {
            // ... handle exception
        }
    }
    
    public static void main(String[] args) {
        new JaxbText().unmarshalTest();
    }
}
```

정상적으로 동작하는지 확인하기 위해 POJO(Plain Old Java Object) 클래스에는 멤버 필드로 존재하지 않지만 XML에만 있는
필드를 추가해봅시다. 먼저 Person 클래스는 아래와 같이 구성되어 있습니다.

```java
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class Person {
    @XmlElement
    private String name;
    @XmlElement
    private String email;

    // 생성자, getter, setter 생략...
}
```

그리고 XML 파일의 내용은 아래와 같습니다. 클래스에 없는 age라는 이름의 요소가 XML에만 정의되어 있습니다. 

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
    <name>madplay</name>
    <email>hello@madplay.com</email>
    <age>30</age>
</person>
```

위에서 정의한 내용들을 통합하여 실행하면 아래와 같은 로그를 확인할 수 있습니다. 로그의 내용은 직접 정의한 이벤트 핸들러에서
표준 출력 방식(System.out)을 사용하도록 지정했었습니다.

> Severity: 1<br/>Line Number: 5<br/>Column Number: 10<br/>Event Message: 예상치 않은 요소(URI: "", 로컬: "age")입니다.
> 필요한 요소는 <{}name>,<{}email>입니다.

<br/>
  
예제를 통해 확인한 POJO 클래스와 XML에 정의된 요소의 불일치로 인해 발생한 오류의 종류는 ERROR이며, 정수값 1을 갖는데요.
ValidationEvent 인터페이스에는 아래와 같이 에러 레벨에 대한 상수가 정의되어 있습니다.

```java
public interface ValidationEvent {
    public static final int WARNING     = 0;
    public static final int ERROR       = 1;
    public static final int FATAL_ERROR = 2;
    
    // ... 생략
}
```

이처럼 **ValidationEventHandler**를 이용하면 JAXB API를 사용하면서 발생한 오류에 대해서 개발자가 직접적으로 개입할 수 있고
에러 처리 과정을 별도의 흐름으로 제어할 수 있습니다.

<br/>

# 정리하며
JAXB는 여러 종류의 **구현체 라이브러리**를 가지고 있습니다. 기본적으로 Sun에서 제공하는 JAXB 구현체, Apache Camel 등이 있으며
xPath 표현식까지 지원하여 매우 유용하게 사용할 수 있는 EclipseLink Moxy 도 있습니다. 
마치 Json 포맷을 다룰 때 Jackson, Gson 등 선택할 수 있는 라이브러리 종류가 있다는 개념으로 이해하면 될 것 같습니다.

다른 라이브러리를 사용할 때는 `JAXBContextFactory`를 통해서 직접적으로 JAXB 구현체를 선택할 수 있습니다.

```java
import org.eclipse.persistence.jaxb.JAXBContextFactory;

JAXBContext context = JAXBContextFactory.createContext(new Class[]{Person.class}, someProperties);
Unmarshaller unmarshaller = context.createUnmarshaller();
unmarshaller.setEventHandler(new CustomEventHandler());
// ... 생략
```

한편 **이벤트 핸들러에 탐지되는 정보가 올바르지 않는 경우**도 있습니다. 스트림을 포함하여 특정 형태의 인자를 언마샬링에 사용하게 되면
ValidationEvent의 위치 정보가 정확하게 표기되지 않다거나, 이벤트 핸들러에 탐지(Detect)조차 되지 않는 경우가 있습니다.
물론 이번 포스팅 예제에서 사용한 파일(file) 형태나 InputSource 등과 같은 형태로 변환하여 사용하면 이슈는 없습니다.

관련해서는 스택오버플로우(Stackoverflow)에도 질문을 올린 적이 있었는데, Eclipse Moxy + JAXBContextFactory 조합을 사용했을 때
재현되는 것을 확인할 수 있었습니다.

- <a href="https://stackoverflow.com/questions/56191255/jaxb-validationeventhandlers-handleevent-method-not-being-called"
rel="nofollow" target="_blank">참고 링크: JAXB ValidationEventHandler's handleEvent method not being called(Stackoverflow)</a>