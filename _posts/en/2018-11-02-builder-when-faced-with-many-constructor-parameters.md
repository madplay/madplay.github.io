---
layout:   post
title:    "[Effective Java 3rd Edition] Item 2. Consider a builder when faced with many constructor parameters"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 2. Consider a builder when faced with many constructor parameters"
category: Java
comments: true
slug:     builder-when-faced-with-many-constructor-parameters
lang:     en
permalink: /en/post/builder-when-faced-with-many-constructor-parameters
---

# Problems with Static Factories or Constructors

Many optional parameters make constructors hard to use correctly. A common response is the **telescoping constructor pattern**.
That is, one constructor for required parameters, another for required plus N optional parameters, and so on.

Example:

```java
public class Person {
    private final String name;  // required
    private final int age;  // required
    private final String phoneNumber;
    private final String email;

    public Person(String name, String age) {
        this(name, age, null);
    }

    public Person(String name, String age, String phoneNumber) {
        this(name, age, phoneNumber, null);
    }

    public Person(String name, String age, String phoneNumber, String email) {
        this.name = name;
        this.age = age;
        this.phoneNumber;
        this.email = email;
    }

    // Create like this
    public void someMethod() {
        Person person = new Person("Taeng", 29, 
            "010-1234-5678", "itsmetaeng@gmail.com");
    }
}
```

With only four parameters this looks manageable. Add a home address, social handles, and more, and it becomes error-prone.
Swapping types or argument order is hard to detect and hard to debug.

<br/>

# What About the JavaBeans Pattern?

This approach creates an object with a parameterless constructor and fills values through setter methods.

```java
public class Person {
    private String name;  // required
    private int age;  // required
    private String phoneNumber;
    private String email;

    public Person() { }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    // ... omitted

    // Create like this
    public void someMethod() {
        Person person = new Person();
        person.setName("Taeng");
        person.setAge(29);
        // ... omitted
    }
}
```

The telescoping constructor problem disappears and the code reads better.
However, object creation now requires multiple calls, which breaks object consistency.
Because state changes happen in steps, it also blocks immutable designs.

<br/>

# Builder Pattern

The builder pattern keeps the **safety of telescoping constructors** and the **readability of JavaBeans**.
Instead of constructing objects directly, it creates a builder with required parameters, sets optional parameters via setter-like methods,
and calls `build` to produce an immutable instance.

Example:

```java
public class Person {
    private String name;  // required
    private int age;  // required
    private String phoneNumber;
    private String email;

    public static class Builder {
        private String name;
        private int age;
        private String phoneNumber;
        private String email;

        public Builder(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public Builder phoneNumber(String value) {
            phoneNumber = value;
            return this;
        }

        public Builder email(String value) {
            email = value;
            return this;
        }

        public Person build() {
            return new Person(this);
        }
    }

    private Person(Builder builder) {
        name = builder.name;
        age = builder.age;
        phoneNumber = builder.phoneNumber;
        email = builder.email;
    }
}
```

`Person` is immutable, and builder setter methods return the builder itself, so calls chain together.
This style is commonly called a fluent API or method chaining.

Example construction:

```java
public void someMethod() {
    Person person = new Person.Builder("Taeng", 29)
        .phoneNumber("010-1234-5678")
        .email("itsmetaeng@gmail.com")
        .build();
}
```

This reads cleanly and allows validation inside the builder methods.

```java
public Builder phoneNumber(String value) {
    if(value == null || value.equals("")) {
        throw new IllegalStateException("phoneNumber must be not empty!");
    } else {
        email = value;
    }
    return this;
}
```

It is also flexible. One builder can produce multiple objects. Fields that require auto-increment can be filled automatically.
Compared to constructors, builder methods also allow variable arguments, as below.

```java
public Builder someMethod(String ... values) {
    phoneNumber = values[0];
    email = values[1]; 
    // ... omitted
}
```

<br/>

# Trade-offs

Builders also add overhead. You must create a builder before creating an object, and builder code grows with field count.
In that case, Lombok's `@Builder` annotation reduces boilerplate by generating required code.

```java
@Builder
public class Person {
    private String name;
    private int age;
    private String phoneNumber;
    private String email;
    
    // If you want to specify initial values, apply together with @Builder.Default annotation
    @Builder.Default
    private int age = 29;
}
```

If you want initial values, add extra annotations as shown above. For final fields,
it does not generate methods automatically.

Effective Java recommends using builders when four or more arguments are required for object creation.
In practice, the threshold often feels higher. Parameter counts tend to grow over time,
so it is common to start with constructors and later migrate to builders. Starting with builders also works well.
