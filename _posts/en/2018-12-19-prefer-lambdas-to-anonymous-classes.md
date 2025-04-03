---
layout:   post
title:    "[Effective Java 3rd Edition] Item 42. Prefer Lambdas to Anonymous Classes"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 42. Prefer lambdas to anonymous classes"
category: Java
comments: true
slug:     prefer-lambdas-to-anonymous-classes
lang:     en
permalink: /en/post/prefer-lambdas-to-anonymous-classes
---

# Function Objects
In Java, a function type was traditionally represented by an interface (or abstract class) with a single abstract method.
An instance of such an interface is called a **function object**, used to represent a specific operation.

<br/> 

# Anonymous Classes
Since `JDK 1.1`, function objects have often been implemented with **anonymous classes**.
However, anonymous classes are verbose, which made Java look unfriendly to functional programming.

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");

        Collections.sort(words, new Comparator<String>() {
            public int compare(String s1, String s2) {
                return Integer.compare(s1.length(), s2.length());
            }
        });
    }
}
```

<br/>

# Lambdas
From `JDK 1.8`, a functional interface can be instantiated with a lambda expression.
The same sort becomes:

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");

        Collections.sort(words,
                (s1, s2) -> Integer.compare(s1.length(), s2.length()));
    }
}
```

Here, the lambda type is `Comparator<String>`, the parameter types are `String`, and the return type is `int`.
The compiler infers them from context, so they are not written explicitly.
When inference fails or clarity suffers, you should specify the types.

The compiler gets much of that type information from generics.
If you omit generic type information, the compiler cannot infer lambda types and you must specify them explicitly.

The code can be simplified further:

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");
        Collections.sort(words, Comparator.comparingInt(String::length));
    }
}
```

With `JDK 1.8` and later, `List` also provides `sort`:

```java
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("kim", "taeng", "mad", "play");
        words.sort(Comparator.comparingInt(String::length));
    }
}
```

We can also simplify the enum example from
<a href="/post/use-enums-instead-of-int-constants" target="_blank">
[Effective Java 3rd Edition] Item 34. Use enums instead of int constants
</a>.
The original version looks like this:

```java
enum Operation {
    PLUS("+") { 
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x * y; }
    };
    
    private final String symbol;
   
    Operation(String symbol) { this.symbol = symbol; }
    
    @Override public String toString() { return symbol; } 
    public abstract double apply(double x, double y);
}
```

With lambdas, you can implement constant-specific behavior more cleanly using instance fields:

```java
import java.util.function.DoubleBinaryOperator;

enum Operation {
    PLUS("+", (x, y) -> x + y),
    MINUS("-", (x, y) -> x - y),
    TIMES("*", (x, y) -> x * y),
    DIVIDE("/", (x, y) -> x / y);

    private final String symbol;
    private final DoubleBinaryOperator op;

    Operation(String symbol, DoubleBinaryOperator op) {
        this.symbol = symbol;
        this.op = op;
    }

    @Override
    public String toString() { return symbol; }

    public double apply(double x, double y) {
        return op.applyAsDouble(x, y);
    }
}

public class Main {
    public static void main(String[] args) {
        // usage
        Operation.PLUS.apply(2, 3);
    }
}
```

`DoubleBinaryOperator` is a `java.util.function` interface that takes two `double` arguments and returns a `double`.

<br/>

# Limits of Lambdas
Lambdas are not always a good fit. They are anonymous and cannot be documented like methods or classes.
If the code does not make the behavior clear, or if the lambda gets long, it is better to refactor.

You also cannot use a lambda to instantiate an abstract class.
In that case, use an anonymous class.

```java
abstract class Hello {
    public void sayHello() {
        System.out.println("Hello!");
    }
}

public class Main {
    public static void main(String[] args) {
        // not allowed
        // Hello hello = new Hello();

        Hello instance1 = new Hello() {
            private String msg = "Hi";
            @Override public void sayHello() {
                System.out.println(msg);
            }
        };

        Hello instance2 = new Hello() {
            private String msg = "Hola";
            @Override public void sayHello() {
                System.out.println(msg);
            }
        };

        // Hi!
        instance1.sayHello();

        // Hola!
        instance2.sayHello();

        // false
        System.out.println(instance1 == instance2);
    }
}
```

Lambdas also cannot use `this` to refer to themselves. `this` refers to the enclosing instance.
In an anonymous class, `this` refers to the anonymous instance itself. The example below shows the difference.

```java
import java.util.Arrays;
import java.util.List;


class Anonymous {
    public void say() {}
}

public class Main {
    public void someMethod() {
        List<Anonymous> list = Arrays.asList(new Anonymous());

        Anonymous anonymous = new Anonymous() {
            @Override
            public void say() {
                System.out.println("this instanceof Anonymous : " + (this instanceof Anonymous));
            }
        };
        
        // this instanceof Anonymous : true
        anonymous.say();

        // this instanceof Main : true
        list.forEach(o -> System.out.println("this instanceof Main : " + (this instanceof Main)));
    }

    public static void main(String[] args) {
        new Main().someMethod();
    }
}
```

Like anonymous classes, lambdas can have different serialized forms depending on the implementation (for example, the JVM).
If you need a serializable function object such as `Comparator`, use an instance of a **private static nested class** instead.

<a href="/post/java-serialization" target="_blank">Reference: Java Serialization</a>
