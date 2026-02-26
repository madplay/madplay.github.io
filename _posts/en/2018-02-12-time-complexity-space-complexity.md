---
layout:   post
title:    Time Complexity and Space Complexity
author:   madplay
tags: 	  Algorithm Complexity
description: Learning about complexity for evaluating algorithm performance.
category: Algorithm/CS
comments: true
slug:     time-complexity-space-complexity
lang:     en
permalink: /en/post/time-complexity-space-complexity
---

# Need for Algorithm Performance Analysis

Program scales are growing larger over time.
That is, the amount of data to process is increasing.

When the amount of input data is small, it may not matter much if ignored,
but as the amount increases, efficiency differences between algorithms inevitably grow larger.

Consider an example:

| Number of input data | Algorithm A($${ n }^{ 2 }$$) | Algorithm B($${ 2 }^{ n }$$) |
| :---: | :---: | :---: |
| n = 6 | 36 seconds | 64 seconds |
| n = 100 | 10,000 seconds | $${ 2 }^{ 100 }$$ seconds = $$4\times { 10 }^{ 22 }$$ years |

As can be seen in the table above, when the number of input data is less than 6, the execution speed difference between algorithms A and B
does not exceed 2 times, but if we assume the input count is 100, the execution speed difference becomes enormous.

<div class="post_caption">What is an efficient algorithm?<br/>
An algorithm is considered efficient when the execution time from when the algorithm starts performing until results are derived is short and
it uses fewer resources like memory within the computer performing the operations.</div>

<br/>

# Conditions for Algorithm Performance Analysis

As seen above, to compare different algorithms, you must measure algorithm execution time
using the same hardware.

So, if algorithm A is measured on a general personal computer and algorithm B is measured on a supercomputer,
the measurement results lack objectivity.

Also, the software environment used when measuring algorithms must be considered.
When using compiled languages like C, execution speed is faster than when using interpreted languages like BASIC.

<br/>

# Time Complexity and Time Complexity Function

Time Complexity does not represent the absolute execution time of an algorithm,
but expresses how many operations are performed to execute the algorithm as a number.

<div class="post_caption">Here, types of operations refer to arithmetic, assignment, comparison, and movement.</div>

However, the execution count of operations generally does not remain a constant value that doesn't change,
but varies according to n, which represents the number of input data.

Expressing the number of operations as a function of the number of input data n is called a time complexity function,
and is expressed as $$T({ n })$$ in mathematical notation.

<br/>

# Time Complexity Examples

Assume we're performing a calculation that adds positive integer n n times.

There are various methods like calculating $${ n }\times { n }$$ or calculating $${ n }$$ added $${ n }$$ times.

```c
/* Case 1 */
sum <- n * n;

/* Case 2 */
sum <- 0
for i <- 1 to n do
    sum <- sum + n;
    
/* Case 3 */
sum <- 0
for i <- 1 to n do
    for j <- 1 to n do
        sum <- sum + 1;
```

Comparing the operation counts of the above 3 algorithms can be expressed as follows. (For simplicity, loop control operations are excluded.)

| Operation Type | Case 1 | Case 2 | Case 3 |
| :---: | :---: | :---: | :---: |
| Assignment operation | 1 | n + 1 | n * n + 1 |
| Addition operation |  | n | n * n |
| Multiplication operation | 1 |  |  |
| Division operation |  |  |  |
| Total operation count | $${ 2 }$$ | $${ 2n }+1$$ | $${ 2n }^{ 2 }+1$$ |

Even if we assume multiplication operations take more time than addition operations, we can compare the above 3 algorithms assuming they're the same.

If we assume one operation requires $${ t }$$ amount of time,
**Case 1** requires $${ 2t }$$ amount of time, **Case 2** requires $$({ 2n }+1)t$$ amount of time,
and finally **Case 3** requires $$({ 2n }^{ 2 }+1)t$$ amount of time.

<br/>

# Big-O Notation

Big-O notation is a method of expressing time complexity by removing relatively unnecessary operations from time complexity functions
to make algorithm analysis a bit more convenient.

For example, looking at Case 2's loop from above:

```c
sum <- 0
/* This part */
for i <- 1 to n do
    sum <- sum + n;
    
// i <- 1 : 1 assignment operation
// to : n + 1 comparison operations (including comparison operation just before exiting loop)
// n : n operations
```

So one loop control statement adds $${ 2n }+2$$ operations overall.
Therefore, adding the loop control statement's operations $${ 2n }+2$$ to Case 2's operation count $${ 2n }+1$$ we organized earlier
results in requiring $${ 4n }+3$$ operations.

However, what's important is not the exact number of operations but the general increasing trend of the algorithm.
As n included in the formula grows, the difference between the $${ 2n }+1$$ function and $${ 4n }+3$$ function becomes minimal,
and the most important point is that execution time is directly proportional to $${ n }$$.

Applying this through Big-O notation, we don't say the algorithm has execution time directly proportional to $${ n }$$,
but say the algorithm's time complexity is $$O({ n })$$. When reading, it's read as "Big-O of n". It's commonly read as "Big-O-n".

<br/>

# Mathematical Definition and Examples of Big-O Notation

Learning about the mathematical definition of Big-O notation:

Mathematical definition: Given two functions $$f({ n })$$ and $$g({n})$$, if two constants
$${ c }$$ and $${ n }_{ 0 }$$ exist that satisfy $$|f(n)|\le c|g(n)|$$ for all $$n\ge { n }_{ 0 }$$, then $$f(n)=O(g(n))$$.

If $$f({ n })=5$$, then it's $$O(n)$$. Because when $${ n }_{ 0 }=1, { c }=10$$, for $$n\ge1$$, $$5\le10\cdot1$$ holds.

If $$f({ n })=2{ n }+1$$, then it's $$O(n)$$. Because when $${ n }_{ 0 }=2, { c }=3$$, for $$n\ge2$$, $$2{ n }+1\le3{ n }$$ holds.

If $$f({n})=3{ n }^{ 2 }+100$$, then it's $$O({ n }^{ 2 })$$. Because when $${ n }_{ 0 }=100, { c }=5$$, for $$n\ge100$$, $${ 3n }^{ 2 }+100\le{ 5n }^{ 2 }$$ holds.

Commonly used Big-O notations are as follows:


|Big-O Notation | 1 |  4 | 8 | 32 |
| :---: | :---: | :---: | :---: | :---: |
| $$O({ 1 })$$ | 1 | 1 | 1 | 1 |
| $$O(logn)$$ | 0 | 2 | 3 | 5 |
| $$O({ n })$$ | 1 | 4 | 8 | 32 |
| $$O({ nlogn })$$ | 2 | 8 | 24 | 160 |
| $$O({ n }^{ 2 })$$ | 1 | 16 | 64 | 1,024 |
| $$O({ n }^{ 3 })$$ | 1 | 64 | 512 | 32,768 |
| $$O({ 2 }^{ n })$$ | 2 | 16 | 256 | 4,294,<br/>967,296 |
| $$O({ n! })$$ | 1 | 24 | 40,326 | $$26,313\times{ 10 }^{ 33 }$$ |

<br/>

# Best, Average, Worst Cases

The same algorithm can show different execution times depending on input data.

For example, if you input data that's mostly already sorted to a sorting algorithm,
sorting will complete faster than a randomly mixed data set.

So algorithm efficiency can be evaluated in 3 cases depending on the input data set.<br/>
**Best Case** : Refers to the case with the least execution time.<br/>
**Average Case** : Refers to average execution time considering all inputs and the probability of each input occurring.<br/>
**Worst Case** : Refers to the case where the algorithm's execution time takes the longest.<br/>

Average case execution time may seem best, but calculating average values by applying algorithms to extensive data sets
can be very difficult. Therefore, worst case is mainly used when calculating time complexity measures.

For example, consider sequentially searching an unsorted array to find a specific value.
(Such an algorithm is called sequential search.) If we assume the basic operation is comparison operation,

```c
int sequencialSearch(int list[], int n, int key)
{
    int i;
    for(i = 0; i < n; i++)
    {
        if(list[i] == key)
        {
            return i; // Return index of key value if search succeeds
        }
    }
    return -1; // Return -1 if search fails
}
```

Here, the best case is when the value to find is at the very beginning of the array.

| Value | 5 | 8 | 9 | 15 | 23 | 48 | 7 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Position (index) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |

Conversely, the worst case is when the value to find is at the very end of the array.
Expressed in Big-O notation, they become $$O(1)$$ and $$O({ n })$$ respectively.

<br/>

# Space Complexity

Space Complexity refers to the amount of resource space required to execute and complete a program.

Total space requirement can be expressed as fixed space requirement + variable space requirement, and is expressed as $$S(P)=c+S_P(n)$$ in mathematical notation.

Here, **fixed space** refers to space requirements unrelated to the number or size of inputs and outputs (code storage space, simple variables, fixed-size structure variables, constants).

**Variable space** refers to space required for structured variables with sizes dependent on specific instances of problems to solve,
additional space required when functions make recursive calls, that is, dynamically required space.

<br/>

# Space Complexity Examples

Examining space complexity examples through the code below:

```c
int factorial(int n)
{
    if(n > 1) return n * factorial(n - 1);
    else return 1;
}
```

What will be the space complexity of the above code? Since the function is called recursively until n is 1 or less,
everything from n to 1 will be stacked on the stack. That is, space complexity becomes $$O(n)$$.

What happens if implemented as below?
```c
int factorial(int n)
{
    int i = 0;
    int fac = 1;
    for(i = 1; i <= n; i++)
    {
        fac = fac * i;
    }
    return fac;
}
```

Regardless of n's value, only variables n, i, and fac are stored on the stack. Space complexity here is $$O(1)$$.

<br/>

# Time Complexity vs Space Complexity

**Time Complexity** is "how fast does it execute" and **Space Complexity** is "how many resources are needed?"<br/>
To summarize, a good algorithm is "one that takes little time and uses few resources"

However, since time and space tend to be inversely proportional, algorithm measures are mainly judged by time complexity.<br/>
So if time complexity is good, space complexity is somewhat understood! Especially in an era of large capacity like now!
