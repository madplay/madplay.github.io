---
layout:   post
title:    "Spring Framework Summary: Testing"
author:   madplay
tags: 	  spring framework
description: Testing is one of the most effective methods for learning Spring.
category: Spring
comments: true
slug:     spring-framework-basic-test
lang:     en
permalink: /en/post/spring-framework-basic-test
---

# Table of Contents
- <a href="/en/post/spring-framework-basic-design-pattern" target="_blank">Spring Framework Summary: Design Patterns (Link)</a>
- <a href="/en/post/spring-framework-basic-inversion-of-control" target="_blank">Spring Framework Summary: Inversion of Control (Link)</a>
- Spring Framework Summary: Testing

<br/>

# What is Testing?
Testing refers to checking whether things work exactly as intended and expected, as the word itself suggests.

We can apply testing to the `UserDAO` we completed in previous posts, but there are many inconveniences if we proceed through web environments.
Because we need to create service layers, make input/output functions even roughly, and run servers.

Such inconveniences can be resolved through unit tests that focus only on small units.
The "unit" mentioned here refers to a range that can efficiently test by focusing sufficiently on one concern.

On the other hand, classes that previously served as test code (served as clients) have the problem of requiring manual verification.
First, change the class name to `UserDAOTest` to match the testing role.

```java
package post.springframework.chapter3;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {

    /**
     * There's a problem.
     */
    public static void main(String[] args) throws Exception {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

Looking at the above code, there are regrettable parts. Even though it's a simple main method, if DAOs increase, main methods for them will also increase.
Also, the current code doesn't verify whether it was properly added after adding to DB and retrieving again.

Of course, you can simply verify by adding a conditional statement comparing the id of the retrieved User object with the id used when inputting at the end of the code.

<br/>

# JUnit
> JUnit can be usefully used when creating unit tests in Java.

To proceed with tests for other DAOs using code we've worked on so far, new main methods are needed.
One or two might be okay, but as the number increases, it becomes burdensome. Such burdens can be resolved through JUnit.

JUnit was made to be usefully used when testing in Java. Checking through examples:
Code we made in main methods can be modified as follows.

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.JUnitCore;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {
    @Test
    public void addAndGet() throws Exception {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }

    public static void main(String[] args) {
        JUnitCore.main("post.springframework.chapter3.UserDAOTest");
    }
}
```

To use JUnit, the following conditions are needed.

- Must be declared with public access modifier.
- And specify that it's a test method by declaring `@Test` annotation in front.

If using Maven projects, you can add dependencies to pom.xml, or simply add jar to classpath.

Tests can be verified through methods like `assertEquals` or `assertThat`.
To use these methods, import statement declarations are needed as follows.

- `import static org.hamcrest.CoreMatchers.is;`
- `import static org.junit.Assert.assertThat;`

<br/>

# Test Driven Development
> First write test code, then write code that makes the test succeed.

Test Driven Development is also called TDD for short.
As the name suggests, it's about proceeding with development through tests, and TDD also has basic principles.

<div class="post_caption">"Create code with the purpose of making failed tests succeed."</div>

The advantage is that the interval between creating code and running tests is very short. There may be differences in individual concerns and opinions, but through Test Driven Development,
I think we can do more stable development. Of course, time allowance is needed.

<br/>

# Improving Test Code
We improved test code using main methods to use the JUnit framework, but we can still see improvement points like code duplication. Improving this once more:

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {

    private UserDAO userDAO;

    /**
     * Method that must execute first before @Test methods execute
     */
    @Before
    public void setUp() {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        userDAO = context.getBean("userDAO", UserDAO.class);
    }

    @Test
    public void addAndGet() throws Exception {
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }
}
```

The part where Application Context is created and UserDAO bean is DI is duplicated for each Test method that's created, so to improve this, extract it to a separate method and
attach the `@Before` annotation to the method so **it can execute first before test methods execute**.
And when operating as JUnit tests, main methods are no longer needed.

Then what steps does JUnit go through? Generally, JUnit proceeds with the following process for tests.

- First, finds all test methods that are public access modifier, have `@Test` annotation, are void return type, and have no parameters.
- Next, creates objects of the test class.
- Third, executes methods with `@Before` annotation first if they exist.
- Fourth, calls one test method with `@Test` annotation and stores the result.
- Fifth, executes methods with `@After` if they exist, and repeats the second ~ fifth processes above for remaining test methods.
- Finally, after all processes end, synthesizes results of all tests and returns them.

Since `@Before` and `@After` methods are not called from test methods, information or objects to exchange must use member variables.

And you should also know that objects are newly created each time each test method is executed to guarantee independent test execution.
A new term that appears here is **fixture**. It refers to information or objects needed to perform tests.

It's convenient to declare them in class instance variables and create them in `@Before` methods.

<br/>

# Spring Testing
Going a bit further from what we've examined, we can proceed with tests through features provided by Spring.
For Spring testing, the following annotations are needed.

- `@Runwith`
  - Annotation used when extending JUnit framework's test execution methods.
  - By specifying SpringJUnit4ClassRunner, JUnit proceeds with work of creating and managing Application Context that tests will use during test execution.

- `@ContextConfiguration`
  - Specifies the location of configuration files for Application Context to automatically create.
  
- `@Autowired`
  - Annotation used for Spring's DI, finds beans in the context that match variable types and injects them if they exist.
  - For reference, Spring's Application Context registers itself as a bean when initializing.

Then apply Spring testing using annotations:

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class UserDAOTest {

    // Automatically injected by Spring test context.
    @Autowired
    private ApplicationContext context;
    private UserDAO userDAO;

    @Before
    public void setUp() {
        userDAO = this.context.getBean("userDAO", UserDAO.class);
    }

    @Test
    public void addAndGet() throws Exception {
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }
}
```

Each time tests proceed, UserDaoTest objects are different each time, but ApplicationContext variables are all the same.
Therefore, you can see that test execution time is slightly shortened. The reason is the time when Application Context is created.

Going further, even when two classes use the same configuration file, only one Application Context is created and shared.

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class UserDAOTest {
    ...
}

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class YourDAOTest {
    ...
}
```

<br/>

# Other Tests
Other content to examine includes learning tests and bug tests.

**Learning Tests** are tests performed on frameworks you didn't create or libraries provided by other teams.
The main purpose is **learning usage methods, not functionality verification**.

**Bug Tests** have the purpose of creating code where tests fail due to bugs and modifying code so tests can succeed.
**If tests succeed, bugs can be viewed as resolved**.
