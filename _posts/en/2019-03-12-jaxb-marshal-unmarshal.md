---
layout:   post
title:    "JAXB Marshalling and Unmarshalling"
author:   madplay
tags: 	  java jaxb marshal unmarshal
description: Use JAXB (Java Architecture for XML Binding) to marshal and unmarshal XML in Java.
category: Java
comments: true
slug:     jaxb-marshal-unmarshal
lang:     en
permalink: /en/post/jaxb-marshal-unmarshal
---

# Java Architecture for XML Binding
JAXB converts XML Schema into Java objects (unmarshalling) and Java objects back into XML (marshalling).

JSON is more common today, and you can parse XML with `Jackson` as well.
This post focuses on JAXB only.

<br/>

# Marshal Example (POJO to XML)
Marshal a POJO into XML.
Assume this `Person` class. It is also used in the unmarshal example.

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

Create an object and convert it to XML.

```java
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;

public class JaxbText {

    public void marshalTest() {
        try {
            Person person = new Person("jaxb", "jaxb@hello.com");

            // create JAXBContext and Marshaller
            JAXBContext context = JAXBContext.newInstance(Person.class);
            Marshaller marshaller = context.createMarshaller();

            // pretty-print output
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

            // write to stdout
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

`JAXBContext` uses the target class to build parsing metadata.
The marshaller converts the object to XML.
Formatted output produces:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<person>
    <name>jaxb</name>
    <email>jaxb@hello.com</email>
</person>
```

<br/>

# Unmarshal Example (XML to POJO)
Unmarshal XML into a Java object.
Assume this XML file.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
    <name>kim jaxb</name>
    <email>jaxb@hello.com</email>
</person>
```

Read the file and unmarshal it.

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
            
            // convert XML to Person
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

// output
// name: kim jaxb
// email: jaxb@hello.com
```

You can rename XML elements via `@XmlElement(name=...)`.
This is useful when field names and XML element names differ.

```java
@XmlRootElement
public class Person {
    // map to XML element name
    @XmlElement(name="nickname")
    private String name;
    @XmlElement
    private String email;
    
    // constructor, getters, setters omitted
}
```

<br/>

# Summary
JAXB makes XML parsing simple.
However, be careful about object creation:
`JAXBContext` is thread-safe and expensive, so create it once and reuse it.
`Marshaller` and `Unmarshaller` are not thread-safe, so create them per operation.

The next post shows how to detect parsing errors and locate their line numbers.
 
- <a href="/post/jaxb-validation-event-handler" target="_blank">
Reference: Detect JAXB parsing errors with ValidationEventHandler</a>
