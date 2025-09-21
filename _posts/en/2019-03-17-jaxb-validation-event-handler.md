---
layout:   post
title:    "Detect JAXB Parsing Errors with ValidationEventHandler"
author:   madplay
tags: 	  java jaxb validation eventhandle
description: Detect JAXB unmarshal errors and find the error line with ValidationEventHandler.
category: Java
comments: true
slug:     jaxb-validation-event-handler
lang:     en
permalink: /en/post/jaxb-validation-event-handler
---

# Can You Find the Error Line?
This post shows how to detect XML format errors during JAXB unmarshalling
and how to locate the line that caused the error using `ValidationEventHandler`.

For JAXB basics and marshaling/unmarshalling, see the previous post.
- <a href="/post/jaxb-marshal-unmarshal" target="_blank">Reference: JAXB marshalling and unmarshalling</a>

<br/>

# ValidationEventHandler
If the XML has no syntax errors, JAXB converts it cleanly.
But errors occur when the XML violates syntax rules or includes fields not defined in the POJO.
If you do not register an event handler, JAXB ignores many of these errors by default.
When you need to detect errors or handle them differently, register a handler.

You can implement `ValidationEventHandler` directly:

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

Notes:
- `event.getSeverity()` returns one of
  **ValidationEvent.WARNING (0), ValidationEvent.ERROR (1), ValidationEvent.FATAL_ERROR (2)**.
  - These are public constants in `ValidationEvent`.
  - <a href="https://www.w3.org/TR/xml/#sec-terminology" target="_blank" rel="nofollow">
  Reference: XML 1.0 Terminology</a>
- `ValidationEventLocator` encapsulates location data.
  - It provides line number, column number, and message.
- `return` indicates whether JAXB continues processing.

Register the handler on the marshaller or unmarshaller:

```java
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Unmarshaller;
import java.io.File;

public class JaxbText {

    public void unmarshalTest() {
        try {
            // read the XML file
            File file = new File(getClass().getResource("test.xml").getFile());
            
            // create JAXBContext and Unmarshaller
            JAXBContext context = JAXBContext.newInstance(Person.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();
            
            // register handler
            unmarshaller.setEventHandler(new CustomEventHandler());
            
            // convert XML to Person
            Person person = (Person) unmarshaller.unmarshal(file);
            
            // ... omitted
        } catch (Exception e) {
            // ... handle exception
        }
    }
    
    public static void main(String[] args) {
        new JaxbText().unmarshalTest();
    }
}
```

To verify behavior, add a field that exists in XML but not in the POJO.
Assume this `Person` class:

```java
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class Person {
    @XmlElement
    private String name;
    @XmlElement
    private String email;

    // constructor, getters, setters omitted
}
```

And this XML with an extra `age` element:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
    <name>madplay</name>
    <email>hello@madplay.com</email>
    <age>30</age>
</person>
```

Running it prints something like this:

> Severity: 1<br/>Line Number: 5<br/>Column Number: 10<br/>Event Message: Unexpected element (URI: "", local: "age"). Expected elements are <{}name>,<{}email>.

`ValidationEvent` defines these constants:

```java
public interface ValidationEvent {
    public static final int WARNING     = 0;
    public static final int ERROR       = 1;
    public static final int FATAL_ERROR = 2;
    
    // ... omitted
}
```

With `ValidationEventHandler`, you can intervene in the JAXB pipeline
and handle errors in a separate flow.

<br/>

# Summary
JAXB has multiple **implementations** such as the Sun reference implementation,
Apache Camel, and EclipseLink MOXy (which supports XPath).

You can select an implementation via `JAXBContextFactory`.

```java
import org.eclipse.persistence.jaxb.JAXBContextFactory;

JAXBContext context = JAXBContextFactory.createContext(new Class[]{Person.class}, someProperties);
Unmarshaller unmarshaller = context.createUnmarshaller();
unmarshaller.setEventHandler(new CustomEventHandler());
// ... omitted
```

Sometimes the event handler reports incorrect locations.
This occurs when you unmarshal from certain inputs such as streams.
Using a file or an `InputSource` avoids the issue.

I also posted a Stack Overflow question after reproducing the issue with Eclipse MOXy and `JAXBContextFactory`:

- <a href="https://stackoverflow.com/questions/56191255/jaxb-validationeventhandlers-handleevent-method-not-being-called"
rel="nofollow" target="_blank">Reference: JAXB ValidationEventHandler's handleEvent method not being called</a>
