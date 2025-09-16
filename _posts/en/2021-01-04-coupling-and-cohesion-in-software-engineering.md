---
layout:   post
title:    "What Are Coupling and Cohesion?"
author:   Kimtaeng
tags:     coupling cohesion module
description: "Why should we design for low coupling and high cohesion?"
category: Knowledge
date: "2021-01-04 19:46:49"
comments: true
slug:     coupling-and-cohesion-in-software-engineering
lang:     en
permalink: /en/post/coupling-and-cohesion-in-software-engineering
---

# Before we begin
Before discussing Coupling and Cohesion, we need to review **Module** and **Modularization**.

**Modularization** means splitting software by function.
Each result unit is a **module**, used in contexts such as subroutines, program units, or task units.
A good modularization splits modules by purpose-focused functionality.
Each module performs only its assigned function independently and has minimal relation with others.

In short, **higher module independence is better.**
With higher independence, modifying one module affects others less.
Even when errors occur, finding and fixing issues is easier.

Meanwhile, **module independence is measured by coupling and cohesion.**
To improve independence, reduce coupling (inter-module dependency) and increase cohesion (internal functional unity).

Let's review coupling/cohesion with examples.

> In software engineering, reducing module size also helps module independence.
> This post omits it because it is not one of the coupling/cohesion measurement factors.

<br><br>

# What is Coupling?
Coupling means degree of dependency or relation between different modules.
In Java class terms, highly coupled classes are tightly related to others.
So changing one class requires changing related classes,
and reuse in other code becomes harder.

Coupling is commonly divided into six levels:

## Data Coupling
**Lowest coupling, best form.**
Modules simply exchange data through parameters.

The exchanged data is pure data, not logic-control elements.
Changing one module does not affect others.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-1.jpg"
width="500" alt="data coupling"/>

<br>

Example of Data Coupling:
When module boundaries are methods, one method passes simple data types to another.

```java
public void foo() {
	int result = makeSquare(5);
}

/**
 * Passes simple data.
 */
public int makeSquare(int x) {
	return x*x;
}
```

## Stamp Coupling
Modules share the same data structure.
That is, arrays/objects are passed through module interfaces.
If data structure shape changes, all referencing modules are affected,
even modules that do not use changed fields.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-2.jpg"
width="650" alt="stamp coupling"/>

<br>

Example of Stamp Coupling:
Unlike Data Coupling, it passes object-based structures instead of simple types.
If structure changes (e.g., class fields in Java), referencing modules may require changes.

```java
public void foo() {
	// initialize name and email via constructor
    Person p = new Person("김매드", "abc@abc.com");
	sendEmail(p);
}

public void sendEmail(Person person) {
	// email sending logic
}
```

## Control Coupling
A module passes elements that control another module's internal logic flow.
Example: flag parameters that change internal behavior.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-3.jpg"
width="500" alt="control coupling"/>

<br>

Code example:

```java
public void foo() {
    printCharge(true);	
}

public void printCharge(boolean isMember) {
    if (isMember) {
    	printMemberCharge();
    } else {
	    printNormalCharge();
    }
}
```

## External Coupling
A module references other external modules or external data.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-4.jpg"
width="600" alt="external coupling"/>

<br>

This appears when modules share external data or communication protocols.
Because it resembles common coupling (shared references),
External Coupling is sometimes omitted in explanations.
The difference is that referenced data is outside the system boundary.

<br>

## Common Coupling
Multiple modules share one common data area.
A typical example is global variables.
Changing a global variable can impact multiple modules.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-01-04-coupling-and-cohesion-in-software-engineering-5.jpg"
width="600" alt="common coupling"/>

<br>

Code example:
Different modules reference globally declared variables.
In Java terms, class variables and instance variables are referenced/manipulated.

```java
class Example {
	// class variable, accessible from other classes
	static int a = 5;
	// instance variable, accessible in same class
	int b = 2;
}

public void methodA() {
	// reference a or b
}

public void methodB() {
	// reference a or b
}
```

## Content Coupling
**Highest coupling, worst form.**
One module directly references another module's internal logic/data.

Like accessing another module's local data, it requires knowledge of internal implementation.
If that module changes, referencing modules need mandatory updates.
So this is the worst coupling type.

<br><br>

# What is Cohesion?
Now cohesion, the counterpart of coupling.
Cohesion is degree of relatedness among processing elements inside one module.
It indicates whether a module performs a focused independent function and whether responsibilities are well grouped.
A module with **higher cohesion is better.**

Cohesion is commonly divided into seven levels:

## Functional Cohesion
**Highest cohesion, best form.**
All elements in the module work together for one function.

Example: a function set dedicated to trigonometric computation such as cosine.

<br>

## Sequential Cohesion
Output of one element becomes input of another.
Example: a module that reads and then processes a file.

```java
public void someMethod() {
    String content = readFile();
    writeFile(content);
}
```

## Communicational Cohesion
All elements use the same input/output data but perform different functions.
Unlike sequential cohesion, execution order is not essential.

<br>

## Procedural Cohesion
Multiple functional elements execute in sequence,
but control-flow information (not data) is passed to next element.

Example: checking access permission before reading a file.

<br>

## Temporal Cohesion
Elements execute at the same time point regardless of order.

Example: startup initialization modules, or error-log notification during failure.

<br>

## Logical Cohesion
A module groups elements with similar category/behavior.
They perform logically similar functions but are not strongly related.
Example:

```java
public void someMethod(int val) {
	switch (val) {
        case 0:
	        // do something
        	break;
        case 1:
        	// do something
        	break;
        default:
        	break;
	}	
}
```

## Coincidental Cohesion
**Worst cohesion form.**
Elements are grouped with no meaningful relation.
It resembles logical cohesion, but has no shared behavior/category,
and module changes have very high side-effect risk.

<br><br>

# Closing
Grouping functions with the same purpose in one module increases cohesion and improves software design.
(Of course, reducing module size is also needed for module independence.)
Because functions are related, **maintenance becomes easier when behavior changes,
and the module is easier to reuse.**

In this context, lower inter-module coupling is better.
When dependency between modules is high, changing one module easily affects untouched modules and causes side effects.

**Conclusion: modules should be designed with low coupling and high cohesion.**
