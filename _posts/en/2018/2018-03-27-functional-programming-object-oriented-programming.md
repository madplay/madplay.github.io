---
layout:   post
title:    Functional Programming and Object-Oriented Programming
author:   madplay
tags: 	  OOP Functional Object-Oriented
description: Functional Programming and Object-Oriented Programming
category: Algorithm/CS
comments: true
slug:     functional-programming-object-oriented-programming
lang:     en
permalink: /en/post/functional-programming-object-oriented-programming
---

# What is Functional Programming?

Functional programming can be viewed as starting from lambda calculus developed by American mathematician Alonzo Church
in the 1930s.

<div class="post_caption">Lambda calculus refers to,<br/>in theoretical computer science and mathematical logic,
a formal system that abstracts function definition and application<br/> and inductive functions.</div>

Unlike imperative programming languages like Fortran and Algol that emphasize state changes,
functional programming emphasizes function application.

That is, it refers to programming that treats data processing as calculation of mathematical functions and excludes state and mutable data.
Since there's no need to specify execution order, it's also called a non-procedural language.

Functional programming languages include Haskell, Scheme, etc.

<br/>

# What is Object-Oriented Programming?

Its beginning can be found in SIMULA, a simulation language that was popular in 1960.

<div class="post_caption">Treats all data as objects (Object)<br/>
and objects that receive processing requests process them using functionality within themselves.</div>

Object-Oriented Programming, which represents the real world, has characteristics of encapsulation, inheritance, and polymorphism,
and is often compared with Procedure-Oriented Programming.

While difficulty in reuse and maintenance increases rapidly as code lines increase,
Object-Oriented Programming is relatively easier for extension and maintenance due to module reuse, etc.

Object-Oriented Programming languages include Java, Smalltalk, etc.

<br/>

# How Can We Compare Functional and Object-Oriented?

From a language perspective, we can think about first-class objects (or first-class citizens, first-class entities).

<div class="post_caption">In computer programming language design, first-class objects of a specific language refer to
objects that generally support all operations applicable to other objects.
Here, operations refer to passing to functions as parameters, assigning to variables, etc. - Wikipedia</div>

In functional languages, functions themselves become first-class objects,
but in object-oriented languages, classes (or objects, Object) become first-class objects.

Quoting Wikipedia on conditions for first-class objects:
- Can be stored in variables or data structures
- Can be passed as parameters (to subroutines)
- Can be used as return values (of subroutines)
- Can be uniquely identified regardless of names used in assignment

If Object-Oriented Programming emerged to overcome disadvantages of Procedure-Oriented Programming,
Functional Programming emerged to overcome disadvantages of Object-Oriented Programming.

For example, Object-Oriented can view programs as collections of interacting objects,
but Functional enables thinking of them as sequences of function values without state values.
