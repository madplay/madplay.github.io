---
layout:   post
title:    LeetCode 412. Fizz Buzz
author:   Kimtaeng
tags: 	  algotithm leetcode
description: 1부터 N까지의 숫자에서 3의 배수는 Fizz, 5의 배수는 Buzz, 모두일 경우 FizzBuzz 출력하기
category: Algorithm
comments: true
---

# Description
Write a program that outputs the string representation of numbers from 1 to n.

But for multiples of three it should output "Fizz" instead of the number and for the multiples of five output "Buzz".
For numbers which are multiples of both three and five output "FizzBuzz".

Example:

```bash
n = 15,

Return:
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

- <a href="https://leetcode.com/problems/fizz-buzz/description/" target="_blank" rel="nofollow">Reference link<a>

<br/>

# Solution
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
            String s = "";
            if (i % 3 == 0) s = "Fizz";
            if (i % 5 == 0) s += "Buzz";
            else if (i % 3 != 0) s = i + "";
            list.add(s);
        }
        return list;
    }
}
```

Not using "%" Operation.

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
            if(fizz == 3 && buzz == 5) {
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