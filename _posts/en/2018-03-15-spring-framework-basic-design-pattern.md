---
layout:   post
title:    "Spring Framework Summary: Design Patterns"
author:   Kimtaeng
tags: 	  spring framework
description: Studying Spring Framework and design patterns!
category: Spring
comments: true
slug:     spring-framework-basic-design-pattern
lang:     en
permalink: /en/post/spring-framework-basic-design-pattern
---

# Table of Contents
- Spring Framework Summary: Design Patterns
- <a href="/en/post/spring-framework-basic-inversion-of-control" target="_blank">Spring Framework Summary: Inversion of Control (Link)</a>
- <a href="/en/post/spring-framework-basic-test" target="_blank">Spring Framework Summary: Testing (Link)</a>

<br/>

# What is Spring Framework?
Spring is a framework used for Java enterprise application development. Then what is a Framework? Looking at the definition of framework,
it refers to software that provides specific functional parts' design and implementation in a collaborative form **for reuse** to **facilitate development**
of software applications or solutions.

On the other hand, you may have encountered this when downloading Java, but Java provides various editions like SE, EE, ME, etc.
- **Java SE (Standard Edition)**
  - A collection of the most widely used Java APIs. Basic Java platform
- **Java EE (Enterprise Edition)**
  - Built on top of the Java SE platform, a platform for server-side development
- **Java ME (Micro Edition)**
  - A platform for supporting devices with more limited resources like mobile phones

As such, Spring Framework is a technology based on Java. It's open source for the Java platform and is simply called Spring.
It's developing various services to build dynamic websites and is used as a base technology for the e-Government Standard Framework,
which is recommended for use in web service development for public institutions in Korea.


<br/>

# Spring's Core Philosophy
> "Spring's core philosophy is to return to the basics of object orientation"

It's that interested in objects, and that interest requires various technologies and knowledge about object design and implementation.

- **Refactoring**
  - Work of continuously improving to achieve a cleaner structure
- **Design Pattern**
  - Reusable design methods for various purposes
- **Unit Test**
  - Work of verifying that objects behave as expected
  
As such, Spring provides it in framework form so it can be easily applied. As mentioned in various books and reference materials, before learning Spring Framework,
it's good to first understand content about objects and object orientation.

Understanding through writing a simple DAO (Data Access Object) in code and improving it. First, declare a User class to store user information.

```java
package post.springframework.chapter1;

/**
 * Class to store user information
 *
 * @author Kimtaeng
 */
public class User {
    private String id;
    private String name;
    private String password;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
```

Next, define a UserDAO class that directly connects to the Database based on user information.

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author Kimtaeng
 */
public class UserDAO {
    public void add(User user) throws Exception {
        // Connect JDBC and get Connection.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");

        PreparedStatement psmt = conn.prepareStatement("insert into users(id, name, password) values(?, ?, ?)");
        psmt.setString(1, user.getId());
        psmt.setString(2, user.getName());
        psmt.setString(3, user.getPassword());

        // Store user information.
        psmt.executeUpdate();
        psmt.close();
        conn.close();
    }

    public User get(String id) throws Exception {
        // Connect JDBC and get Connection.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");

        PreparedStatement psmt = conn.prepareStatement("select * from users where id =?");
        psmt.setString(1, id);

        // Get user information from DB.
        ResultSet rs = psmt.executeQuery();
        rs.next();

        User user = new User();
        user.setId(rs.getString("id"));
        user.setName(rs.getString("name"));
        user.setPassword(rs.getString("password"));

        rs.close();
        psmt.close();
        conn.close();

        return user;
    }
}
```

And now write a Main class and method to actually test the above code.

```java
package post.springframework.chapter1;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        UserDAO userDAO = new UserDAO();

        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

The above code works normally, but from an object-oriented perspective, it's code with more problems than expected.
Because **code for getting DB Connection is duplicated in each method**.
It may not seem like a big problem yet since there are only `add` and `get` methods, but later, code duplication may be found in more methods.

<br/>

# Refactoring
> "Refactoring, work of continuously improving to achieve a cleaner structure"

Improving the code part for getting connections duplicated in each method. Use the **method extraction technique** that extracts duplicated code into a method responsible for common functionality.

```java
public void add(User user) throws Exception {
    Connection conn = getConnection();
    // Code below omitted
}

public User get(String id) throws Exception {
    Connection conn = getConnection();
    // Code below omitted
}

/**
 * Define duplicated code as one method.
 */
private Connection getConnection() throws Exception {
    // Connect JDBC and get Connection.
    Class.forName("com.mysql.jdbc.Driver");
    Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
    return conn;
}
```

We've improved duplicated code more than before through refactoring called method extraction, but problems still remain.
What happens if the method for getting DB connections changes or needs to be implemented differently from existing methods?

Before proceeding with additional improvements, there's something we need to examine first.

<br/>

# Design Patterns
> "Design Patterns, reusable design methods for various purposes"

We can apply design patterns right away.

- **Template Method Pattern**
  - A method where super classes define basic logic and sub classes implement it according to their needs

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-1.png"
width="700" alt="template method pattern"/>

<br/>

- **Factory Method Pattern**
  - A method of isolating object creation methods from basic code

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-2.png"
width="700" alt="factory method pattern"/>

<br/>

Change the existing UserDAO class to an abstract class, define the part for getting Connection as an abstract method, and have sub classes implement it through inheritance.

```java
// omitted...
public abstract class UserDAO {
    /**
     * Make it an abstract method. (Template Method Pattern)
     * Make part of functionality an abstract method and
     * have sub classes implement it according to their needs.
     */
    public abstract Connection getConnection() throws Exception;
}
```

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;

/**
 * @author Kimtaeng
 */
public class MyUserDAO extends UserDAO {

    /**
     * Sub classes decide objects. (Factory Method Pattern)
     * Decide which Connection class's object to create and how.
     * That is, sub classes decide object creation methods.
     */
    public Connection getConnection() throws Exception {
        // Connect JDBC and get Connection.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

Looking at it now, it's a bit better than before. DB connection methods can be implemented by each sub class inheriting the super class. But problems still remain.

- **Java doesn't allow multiple inheritance.**
  - If you make an inheritance structure just to separate methods for getting connection objects, it becomes difficult to apply inheritance to UserDao for other purposes later.

- **Relationships between super classes and sub classes through inheritance are close.**
  - When there are changes inside super classes, all sub classes may need to be modified or redeveloped.
  
- **Code for creating DB connections cannot be applied to DAO classes other than UserDAO.**
  - If DAO classes other than UserDAO continue to be created, then implementation code of the getConnection method created through inheritance
    will be duplicated in each DAO class. (Because it's an abstract method...)


If there are changes in super classes, changes in sub classes cannot be avoided. So it becomes difficult to apply inheritance for other purposes later.
What should we do in such cases?

<br/>

# Separating into Independent Classes
> We've tried extracting as methods and separating as classes in inheritance relationships...

All objects change. Especially, they change with unique characteristics of change, not all in the same way.
We've tried separating as **independent methods** and separating as **classes in inheritance relationships**. This time, solving the problem by making them **completely independent classes**.

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;

/**
 * @author Kimtaeng
 */
public class SimpleConnectionMaker {
    /* 
     * No need to make it an abstract class.
     * No longer need to use extension methods through inheritance.
     */
    public Connection makeNewConnection() throws Exception {
        // Connect JDBC and get Connection.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author Kimtaeng
 */
public class UserDAO {
    private SimpleConnectionMaker simpleConnectionMaker;

    public UserDAO() {
        /*
         * Create only once.
         * Since it's not managing state, create only once
         * and store it in an instance variable for use in methods.
         */ 
        simpleConnectionMaker = new SimpleConnectionMaker();
    }

    public void add(User user) throws Exception {
        // Existing code
    }

    public User get(String id) throws Exception {
        // Existing code
    }
}
```

Now we've made it completely independent classes. Problems naturally start to appear. The method of calling specific classes in constructors to create objects
means `code dependency on specific classes`. Looking at this part from a distance, it can act as a part that's difficult to freely extend.

<br/>

# Interfaces
> Java provides the interface feature for abstraction, which is the work of extracting common characteristics of things and separating them.

We're gradually finding a better appearance. This time, it's time to apply abstraction using interfaces provided in Java.
**Abstraction** refers to the work of extracting common characteristics of things and separating them. It's creating abstract, loose connections.

```java
/**
 * @author Kimtaeng
 */
public interface ConnectionMaker {
    public Connection makeNewConnection() throws Exception;
}
```

```java
public class SimpleConnectionMaker implements ConnectionMaker {

    public Connection makeNewConnection() throws Exception {
        // Connect JDBC and get Connection.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;

    public UserDAO() {
        connectionMaker = new SimpleConnectionMaker();
    }

    public void add(User user) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // Code omitted
    }

    public User get(String id) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // Code omitted
    }
}
```

We've created a bit looser connection by introducing interfaces, but specific class names still appear in constructors.
Therefore, the problem of modifying constructor methods whenever needed still remains.

<br/>

# Separation of Responsibilities, Coupling and Cohesion
> Let's pass on responsibilities. Since I don't necessarily have to do it, let the needed place bear the burden.

That's right. DAO has no reason to make decisions about object creation. Therefore, we can pass the responsibility of object creation to the client.

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;

    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }

    public void add(User user) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // Code omitted
    }

    public User get(String id) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // Code omitted
    }
}
```

```java
public class Main {
    public static void main(String[] args) throws Exception {
        /*
         * Decide which ConnectionMaker implementation class to use and create an object.
         * Changing parts to the client!
         */
        ConnectionMaker connectionMaker = new SimpleConnectionMaker();

        /*
         * Provide an object of ConnectionMaker type to use.
         * Ultimately, the effect of setting dependency relationships between two objects
         */
        UserDAO userDAO = new UserDAO(connectionMaker);

        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

Comparing with the initial DAO, we've applied quite a lot of improvements. While doing so, many object-oriented technologies were applied. Organizing them again:

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-3.png"
width="700" alt="open closed principle"/>

The **Open Closed Principle** that classes or modules should be open for extension and closed for modification can also be explained
in terms of Coherence and Coupling. High cohesion and low coupling can be viewed as well following the Open Closed Principle.

- **Coherence**
  - Refers to the degree to which code within a module focuses on providing one functionality. Higher is better.
  
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-4.png"
width="700" alt="coherence"/>

<br/>

- **Coupling**
  - Refers to the association relationship between two modules, the degree to which modules depend on each other. Lower is better.
  
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-5.png"
width="700" alt="coupling"/>

<br/>

On the other hand, if we look at the improved structure so far from a design pattern perspective, we can say that the **Strategy Pattern** has been applied.
Classes that implement ConnectionMaker become strategies, allowing strategies to be swapped and used as needed.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-6.png"
width="700" alt="strategy pattern"/>
