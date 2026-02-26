---
layout:   post
title:    "Java effectively final"
author:   madplay
tags:    java final effectivelyfinal
description: What is "effectively final" in Java, where a variable is not declared final but behaves as final because its reference is not changed after initialization?
category: Java/Kotlin
date: "2021-03-09 02:33:18"
comments: true
slug:     effectively-final-in-java
lang:     en
permalink: /en/post/effectively-final-in-java
---

# Not final, but final-like
In Java, a variable can behave like `final` even when it is not declared with `final`, as long as it is never reassigned.
This is called **effectively final**.
The concept was introduced in Java 8 and is commonly seen with anonymous classes and lambda expressions.

In anonymous classes or lambdas, captured external local variables are accessible only when they are declared `final` or are **effectively final**.
For example, if a referenced local variable is modified as below, compilation fails with an error like
**"local variables referenced from a lambda expression must be final or effectively final"**.

```java
// Anonymous Classes
public void someMethod() {
    int count = 0;
    Runnable runnable = new Runnable() {
        @Override
        public void run() {
            // "local variables referenced from an inner class
            // must be final or effectively final"
            count++;
        }
    };
}

// Lambda Expressions
public void someMethod() {
    List<Integer> list = Arrays.asList(1, 2, 3, 4);
    Integer criteria;
    
    for (Integer integer : list) {
        if (integer > 2) {
            criteria = 3;
            // "local variables referenced from a lambda expression
            // must be final or effectively final"
            list.removeIf(o -> o.equals(criteria));
        }
    }
}
```

<br>

# effectively final
Then what exactly counts as **effectively final**?
According to the Java Language Specification, a local variable is treated as **effectively final** when:

- it is not declared `final`.
- it is not reassigned after initialization.
- it is not changed via prefix/postfix increment or decrement operators.

<a href="https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.12.4" rel="nofollow" target="_blank">
Reference: "Java Docs: 4.12.4. final Variables"</a>

For objects, you only need to avoid changing the reference itself.
So even if object state changes, it is still **effectively final** as below.

```java
List<Person> personList = List.of(new Person(2), new Person(3));
for (Person p : personList) {
    p.setId(2);
    personList.removeIf(o -> o.getId() == p.getId());
}
```

<br>

# Lambda Capturing
When a lambda uses variables defined outside it, Java creates a copy for lambda use.
This is called **Lambda Capturing**.
Captured variables can include local variables, instance variables, and class variables.

Example of capturing lambda:
The first example references an external instance variable.
The second example references an external local variable.

```java
// Capturing Lambda example 1: external instance variable
public class Tester {
	private int count = 0;

	public void someMethod() {
		Runnable runnable = () -> System.out.println("count: " + count);
	}
}
    
// Capturing Lambda example 2: external local variable
public void someMethod() {
    int count = 0;
    Runnable runnable = () -> System.out.println(count);
}
```

In contrast, non-capturing lambda does not reference any external variable:

```java
// Non-Capturing Lambda
Runnable runnable = () -> {
    String msg = "Taengtest";
    System.out.println(msg)
};

// Non-Capturing Lambda
Function<Integer, Integer> func = (param) -> 5 * param;
func.apply(5);
```

<br>

# Why make a copy?
Why does Java capture external variables for lambda use?
The reason is clearer when the external variable is local.

**Local variables are allocated on stack memory.**
Each thread has its own stack.
So stacks are not shared across threads, and a stack disappears when its thread ends.
Therefore lambda cannot safely reference the original external local variable directly and uses a copy.

What if no copy were made?
The code below compiles, but assume it runs under a model where
**external local variables are not captured**.

```java
public void test() {
    // local variable
    int count = 0;

    new Thread(() -> {
        try {
        	// assume `count` is not copied
            Thread.sleep(1000);
            System.out.println("count :" + count);
        } catch (InterruptedException e) {
            // Exception Handling
        }
    }).start();
    
    System.out.println("count :" + count);
}
```

If this worked, what happens?
As shown, lambda can run in another thread.
Each thread has its own stack, and local variables live on that stack.

So the thread running `test` can finish and lose its stack before the lambda thread completes.
Then lambda may fail to reference local variable `count` declared in `test`.

<br>

# Why can't lambda modify external local variables?
Why does Java raise compilation errors when lambda tries to modify external local variables?
You might ask: "If a copy exists, why not allow modifications?"

**Lambdas can run in separate threads.**
So the thread controlling the external local variable and the thread executing lambda can differ.

Consider another example.
This code does not compile, but assume it does to understand the risk.

```java
public class Tester {

	ExecutorService executor = Executors.newFixedThreadPool(1);

	public void testMultiThreading() {
		// Thread A
		boolean doLoop = true;

		executor.execute(() -> {
			// Thread B
			while (doLoop) {
				// something to do
			}
		});
		doLoop = false;
	}
}
```

Here, one thread controls the local variable and another runs the lambda.
As explained, lambdas capture external local variables by copying them.

The issue appears here: if copied external local values are mutable, freshness is not guaranteed.
This relates to visibility.
Because **each thread has its own stack**, thread A and B stacks are separate.
A thread cannot directly observe updates in another thread's stack.

So if this code were allowed to run, copied values could become stale,
causing concurrency issues and unpredictable behavior.
This is why **external local variables referenced by lambdas must not change**.

<br>

# What about instance variables and class variables?
First, define them.

**Instance variables** are class-declared fields allocated in heap memory.
**Class variables** are static fields allocated in method area.

Because their memory areas differ from local-variable stack memory,
they are not reclaimed in the same way and do not require the same copy constraints.
So code like below compiles.


```java
public class Tester {
    private int instanceVariable = 0;
	private static int staticVariable = 0;

	public void someMethodWithStaticVariable() {
		instanceVariable = 1;
		Runnable runnable = () -> {
			instanceVariable++;
		};
	}

	public void someMethodWithInstanceVariable() {
		staticVariable = 1;
		Runnable runnable = () -> {
			staticVariable++;
		};
	}
}
```

<br>

# Summary
When lambda references external local variables, they must be `final` or **effectively final**.
The core reason is that local variables are allocated on stack memory.

Because each thread has its own stack, once the defining thread ends,
that local variable is no longer safely referenceable.
So lambdas, which can run on separate threads, capture copies of external local variables.
If those copied values were mutable, freshness could not be guaranteed and multi-threading issues could occur.

Therefore, external local variables referenced in lambdas must be `final` or **effectively final**.
