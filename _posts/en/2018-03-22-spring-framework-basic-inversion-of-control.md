---
layout:   post
title:    "Spring Framework Summary: Inversion of Control"
author:   Kimtaeng
tags: 	  spring framework
description: Learning about Spring's Inversion of Control (IOC, Inversion of Control)
category: Spring
comments: true
slug:     spring-framework-basic-inversion-of-control
lang:     en
permalink: /en/post/spring-framework-basic-inversion-of-control
---

# Table of Contents
- <a href="/en/post/spring-framework-basic-design-pattern" target="_blank">Spring Framework Summary: Design Patterns (Link)</a>
- Spring Framework Summary: Inversion of Control
- <a href="/en/post/spring-framework-basic-test" target="_blank">Spring Framework Summary: Testing (Link)</a>

<br/>

# Inversion of Control: Object Factory
In the previous post, we changed it so that the client decides the implementation class of the ConnectionMaker interface through **separation of responsibilities**.

- <a href="/en/post/spring-framework-basic-design-pattern" target="_blank">Link: Spring Framework Basics - Design Patterns</a>

But the client before the change only had the responsibility of simply testing UserDAO's functionality. So it gained **responsibilities different from the original intent**.
In this context, we need to introduce the concept of **Object Factory** that decides object creation methods and returns created objects.
Using this to separate responsibilities that the client has:

```java
package post.springframework.chapter2;

/**
 * Factory class.
 * Decides how to create and prepare objects of UserDAO type.
 *
 * @author Kimtaeng
 */
public class DAOFactory {
    /**
     * Factory methods decide how to create and prepare objects of UserDAO type.
     */
    public UserDAO userDAO() {
        ConnectionMaker connectionMaker = new SimpleConnectionMaker();

        UserDAO userDAO = new UserDAO(connectionMaker);
        return userDAO;
    }
}
```

```java
package post.springframework.chapter2;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        /*
         * Now we don't worry about how UserDAO is created or initialized,
         * and just get UserDAO objects from the factory and use them only for testing!
         */
        UserDAO userDAO = new DAOFactory().userDAO();
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

It seems better than before as the client's responsibilities are separated. However, there's an issue with the `userDAO method` that returns UserDAO objects.
What happens if object creation functionality for DAOs other than UserDAO is added?

<br/>

# Inversion of Control: Utilizing Object Factories
> Separate duplicated code into methods to remove duplicated parts.

```java
package post.springframework.chapter2;

public class DAOFactory {
    public UserDAO userDAO() {
        return new UserDAO(makeConnectionMaker());
    }

    public MessageDAO messageDAO() {
        return new MessageDAO(makeConnectionMaker());
    }
    
    /**
     * Method extraction technique.
     * Code for creating objects with duplication removed through separation
     * When there are modifications, just modify this part.
     */
    public ConnectionMaker makeConnectionMaker() {
        return new SimpleConnectionMaker();
    }
}
```

The role has changed. It doesn't select or create objects it will use. And it can't know how it's created or where it's used.

Here, the concept of **Inversion of Control** emerges. Inversion of Control refers to reversing the concept of control flow.

Also, flow refers to the process where, initially, the main method of UserDAO directly creates objects of the UserDAO class and uses methods of created objects
to decide implementation (implements) classes of the ConnectionMaker interface.

To summarize, it means **delegating all control authority to another entity, not oneself**.

<br/>

# Inversion of Control: Application Cases
> The concept of Inversion of Control is already used in various places. (We've already used it in example code.)

First, we can find examples in **Servlets**. Containers that have control over servlets create objects of servlet classes at appropriate times
and call methods within them.

And we can also find it in **Design Patterns**. Sub classes that inherit abstract class UserDAO implement the getConnection method, but
they themselves cannot know when this method is used.

```java
class CustomDAO extends UserDAO {
    public Connection getConnection() throws Exception {
        // Custom DB Connection
    }
}
```

Sub classes don't decide when to use it, but it's called and used when needed by template methods like add and get methods of the super class UserDAO.

Finally, we can also find Inversion of Control in **Frameworks**. It's a method where you register classes you've developed on top of the framework, and during the flow led by the framework,
it makes your written application code be used.

- **Reference. Libraries and Frameworks**
  - Library: A collection of functions likely to be frequently used, users directly create the overall flow.
  - Framework: Contains design patterns and library elements, control flow is inherent. Rather than taking and using, the concept of entering and using is more appropriate.

<br/>

# Spring's Inversion of Control
> Then what about Inversion of Control in Spring Framework?

Before learning about Inversion of Control that appears in Spring Framework, the following word organization is needed.

- Bean: Objects that Spring Framework has control over and directly creates and establishes relationships
- Bean Factory: Inversion of Control objects that handle control like bean creation and relationship setting

However, Spring Framework mainly uses **Application Context**, which is a more expanded concept than Bean Factory.

Then change the DAOFactory class of the code written earlier so that Spring's Bean Factory can use it.
In the client, use the **AnnotationConfigApplicationContext** class to use Java code with `@Configuration` annotation as configuration information.

```java
package post.springframework.chapter2;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Indicates that it's configuration information for Bean Factory or Application Context to use
@Configuration
public class DAOFactory {

    // Indicates that it's an IoC method responsible for object creation
    @Bean
    public UserDAO userDAO() {
        return new UserDAO(makeConnectionMaker());
    }

    @Bean
    public ConnectionMaker makeConnectionMaker() {
        return new SimpleConnectionMaker();
    }
}
```

```java
package post.springframework.chapter2;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        ApplicationContext context = new AnnotationConfigApplicationContext(DAOFactory.class);
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        // Code omitted
    }
}
```

Then what's the difference between Object Factory DAOFactory and applying Application Context by modifying it?

**Object Factory** performs limited roles of creating DAO object factories and establishing relationships with DB creation objects,
but **Application Context** performs creation and relationship setting for all objects that need to be managed by applying IoC.

On the other hand, unlike factories, code for directly creating objects and establishing relationships is not visible, and information is obtained
through configuration information with `@Configuration` annotation.

<br/>

## What Are the Advantages of Application Context?
Then what are the advantages of Application Context?

**Clients don't need to know specific factory classes.** Even if the number of object factories increases, there's no need to know which factory class to create,
no hassle of creating factory objects whenever needed.

**Provides comprehensive IoC services.** Not only object creation and relationship setting, but also provides various functions like methods and timing strategies for object creation,
automatic generation, post-processing functions for objects, and interceptor execution, etc.

**Provides various methods for searching beans.** The getBean method finds beans using bean names.
You can also search beans by type only or find beans with special annotation settings.

So wouldn't Application Context be mainly used to flexibly extend IoC functionality?

<br/>

# Singleton Registry
> In Java, we need to note what "same" means for two objects.

Before learning about `Singleton`, briefly think about the expression ```same```. In Java, there are cases where two objects are said to contain the same information
(Equivalent) and cases where they're said to be completely identical (Identical).

The former is called equality comparison and is compared with `equals method`, and the latter is called identity comparison and is compared with `== operator`.
(The equals method implemented in Object class, Java's top-level class, is identity comparison)

So if two objects are identical, it means only one actually exists. Basically, Spring creates all bean objects it creates as `singletons`.

**What's the reason?** Because Spring Framework is mostly used in server-side environments. (If objects are continuously created for each user request...)
Comparing equality and identity we saw above with the operation methods of Object Factory and Application Context modified from it:

```java
package post.springframework.chapter2;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {
    public static void main(String[] args) {
        DAOFactory daoFactory = new DAOFactory();
        UserDAO factoryDAO1 = daoFactory.userDAO();
        UserDAO factoryDAO2 = daoFactory.userDAO();

        System.out.println(factoryDAO1);
        System.out.println(factoryDAO2);

        System.out.println("---------------------");

        ApplicationContext context = new AnnotationConfigApplicationContext(DAOFactory.class);
        UserDAO contextDAO1 = context.getBean("userDAO", UserDAO.class);
        UserDAO contextDAO2 = context.getBean("userDAO", UserDAO.class);

        System.out.println(contextDAO1);
        System.out.println(contextDAO2);

        // post.springframework.chapter2.UserDAO@27716f4
        // post.springframework.chapter2.UserDAO@8efb846
        // ---------------------
        // post.springframework.chapter2.UserDAO@15d9bc04
        // post.springframework.chapter2.UserDAO@15d9bc04
    }
}
```

We can see that factoryDAO1 and factoryDAO2 output different reference values, but contextDAO1 and contextDAO2 output the same reference value.
So Spring returns the same object even if beans are requested multiple times. (Singleton objects)

<br/>

## Problems with Singleton Pattern
> On the other hand, the Singleton Pattern has several problems.
- <a href="/en/post/singleton-pattern" target="_blank">Reference Link: Singleton Pattern</a>

- **Cannot inherit because it has a private constructor.** 
  - Classes with private constructors cannot inherit if there are no other constructors.
- **Difficult to test.**
  - Since object creation methods are limited, it's difficult to replace with Mock objects when used in tests.
  - _Mock Object: Objects that virtually implement unimplemented interfaces to enable testing_
- **Cannot guarantee that only one singleton is created in server environments.**
  - Depending on Class Loader configuration, even if it's a singleton, one or more objects can be created..
- **There are also opinions that singleton usage is not good because it can create global state.**
  - Singleton objects can be accessed anytime using singleton's static methods.

But don't worry. There's a **Singleton Registry** where Spring directly creates and manages objects in singleton form.

**Singleton Registry** allows not only classes with static methods and private accessor constructors,
but also ordinary classes to be used as singletons, and they can have public constructors.

Also, there's the concept of scope, which is the application range where beans managed by Spring are created.
So it's not unconditionally created with singleton scope, but can have scopes other than singleton depending on cases.

<br/><br/>

# Dependency Injection
Receiving object references from external sources and creating dependency relationships with other objects dynamically through this process
is called **Dependency Injection**.

The representative operation principle of Inversion of Control that Spring has is mainly called Dependency Injection.
So Spring, which is called an IoC container, is also called a DI container.

Then what is a dependency relationship? Examining it from a UML modeling perspective:

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-22-spring-framework-basic-inversion-of-control-1.png"
width="700" alt="dependency in uml"/> 

<br/>

Dependency relationships have **directionality**. Looking at the figure above, A depends on B, but not the opposite.
In the previous example, UserDAO depends on the ConnectionMaker interface, but there's no dependency relationship with classes that implement the interface.

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;
    
    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }
}
```

Not only dependencies from a modeling perspective, but there are also dependency relationships that occur at runtime, like **runtime dependency relationships**.

```java
public UserDAO(ConnectionMaker connectionMaker) {
    this.connectionMaker = connectionMaker;
}
```

Objects that are actually used are called **dependent objects**. **Dependency Injection** refers to the work of connecting specific dependent objects and subjects that will use them,
usually objects called clients, at runtime.

Since class models or code only depend on interfaces, runtime dependency relationships are not revealed. Runtime dependency relationships are decided by third parties like containers or factories.
Dependency relationships are created by injecting references to objects to use from external sources.

<br/>

# Dependency Injection with Examples
Examining the examples we've been working on in more detail and learning about Dependency Injection:

```java
public UserDAO() {
    simpleConnectionMaker = new SimpleConnectionMaker();
}
```

This is the part where problems first occurred. There's a problem of knowing implementation classes of interfaces at design time.

```java
public class DAOFactory {
    public UserDAO userDAO() {
        ConnectionMaker connectionMaker = new NewConnectionMaker();
        
        UserDAO userDAO = new UserDAO(connectionMaker);
        return userDAO;
    }
}
```

**Delegate decision authority**. To solve problems like the above, we delegate dependency relationship decision authority to DAOFactory, a third party.
DAOFactory here is an entity that sets runtime dependency relationships between two objects and performs work like object creation, initialization,
and provision in Inversion of Control manner, playing the role of a DI container.

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;
    
    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }
}
```

DAOFactory, a DI container, creates objects of classes that will establish dependency relationships it decided and passes them as constructor parameters.

In the example, we proceeded with Dependency Injection through constructor methods, but it's also possible through mutator (Setter) methods.
Of course, regular methods are also possible. They don't need to start with the set prefix like mutator methods, and can have one or more parameters.

<br/>

# Dependency Lookup
> Actively searches for objects it needs. But it doesn't decide which class's objects to use.

As seen earlier, there's also **Dependency Lookup** where it searches by itself rather than injecting dependencies from external sources.
Application Context, Spring's IoC container, searches through the `getBean` method.

```java
ApplicationContext context = 
    new AnnotationConfigApplicationContext(DAOFactory.class);
this.connectionMaker = context.getBean("connectionMaker", ConnectionMaker.class);
```

**Dependency Lookup** directly shows object factory classes or Spring API code in the code.
Since such code becomes dependent on other objects, Dependency Injection is usually used.

But there are times when Dependency Lookup method is used. Looking at the getBean method, even if Spring IoC and DI containers are applied, since there's no way to receive objects using DI in main methods,
at least once, Dependency Lookup method must be used to get objects.

**On the other hand, just because something was injected from external sources doesn't mean everything becomes DI.** If parameters of methods receiving injection are already fixed to specific class types,
Dependency Injection that Spring talks about cannot occur. So injection that DI talks about must proceed through interface type parameters
so that implementation classes can be dynamically decided and provided.

<br/>

# Using XML for Configuration Methods
Spring's Application Context can use information contained in XML, not Java code with annotations, as DI information.
Let's be somewhat freed from modifying code whenever DI configuration changes.

```java
@Configuration // Corresponds to <beans>
public class DAOFactory {
    @Bean // Corresponds to <bean>
    public UserDAO userDAO() {
        return new UserDAO(connectionMaker());
    }
    
    @Bean // Corresponds to <bean>
    public ConnectionMaker connectionMaker() {
        return new NewConnectionMaker();
    }
    
    // Code omitted...
}
```

As noted in comments, Java code-based configuration and XML-based configuration each have corresponding information.
`@Configuration` annotation corresponds to `<beans>` in XML configuration, and `@Bean` annotation corresponds to `<bean>`.


```xml
<?xml version="1.0" encoding="UTF-8">
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="connectionMaker" class="post.springframework.chapter2.SimpleConnectionMaker"/>
    <bean id="userDAO" class="post.springframework.chapter2.UserDAO">
        <property name="connectionMaker" ref="connectionMaker"/>
    </bean>
</beans>
```

```java
/*
 * Creates Application Context.
 * Put the class path of applicationContext.xml in the constructor.
 */
ApplicationContext context =
    new GenericXmlApplicationContext("applicationContext.xml");
```

Here, the part to note is that to set values of connectionMaker, a member variable of the UserDAO class, you must set it using the `<property>` tag.
And the UserDAO class also needs a mutator (Setter) method to set this value.

Since XML is used as configuration information, annotations declared in DAOFactory can be removed.
As we'll learn later, database configuration information can also be defined in XML.
