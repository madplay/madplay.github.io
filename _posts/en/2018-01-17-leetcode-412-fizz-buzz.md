---
layout:   post
title:    LeetCode 412. Fizz Buzz
author:   Kimtaeng
tags: 	  algotithm leetcode
description: Output Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for both from numbers 1 to N
category: Algorithm
comments: true
slug:     leetcode-412-fizz-buzz
lang:     en
permalink: /en/post/leetcode-412-fizz-buzz
---

# Problem Description
A function generates a string representation of numbers from 1 to `n`.

The function adheres to the following rules:
- For multiples of three, the output is "Fizz".
- For multiples of five, the output is "Buzz".
- For numbers divisible by both three and five, the output is "FizzBuzz".

For example, with `n = 15`, the function returns:
```json
[
    "1",
    "2",
    "Fizz",
    "4",
    "Buzz",
    "Fizz",
    "7",
    "8",
    "Fizz",
    "Buzz",
    "11",
    "Fizz",
    "13",
    "14",
    "FizzBuzz"
]
```

- <a href="https://leetcode.com/problems/fizz-buzz/description/" target="_blank" rel="nofollow">Reference: LeetCode Problem</a>

<br/>

# Solution
This implementation utilizes the modulo operator (`%`) to check for divisibility. The conditions are ordered to handle the common multiple case first.

```java
import java.util.ArrayList;
import java.util.List;

/**
 * 412. FizzBuzz
 * 
 * @author kimtaeng
 * created on 2018. 1. 10.
 */
public class Solution {
    public List<String> fizzBuzz(int n) {
        List<String> list = new ArrayList<String>();
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) {
                list.add("FizzBuzz");
            } else if (i % 3 == 0) {
                list.add("Fizz");
            } else if (i % 5 == 0) {
                list.add("Buzz");
            } else {
                list.add(String.valueOf(i));
            }
        }
        return list;
    }
}
```

# Alternative without Modulo
This alternative implementation avoids the modulo operator by using counters to track multiples.

```java
import java.util.ArrayList;
import java.util.List;

/*
 * 412. FizzBuzz
 * 
 * @author kimtaeng
 * created on 2018. 1. 10.
 */
public class Solution {
    public List<String> fizzBuzz(int n) {
        List<String> resultList = new ArrayList<String>();
        for (int i = 1, fizz = 0, buzz = 0; i <= n; i++) {
            fizz++;
            buzz++;
            if (fizz == 3 && buzz == 5) {
                resultList.add("FizzBuzz");
                fizz = 0;
                buzz = 0;
            } else if (fizz == 3) {
                resultList.add("Fizz");
                fizz = 0;
            } else if (buzz == 5) {
                resultList.add("Buzz");
                buzz = 0;
            } else {
                resultList.add(String.valueOf(i));
            }
        }
        return resultList;
    }
}
```
