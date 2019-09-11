---
layout:   post
title:    LeetCode 344. Reverse String
author:   Kimtaeng
tags: 	  algotithm leetCode
description: 입력한 문자열을 거꾸로 출력하기
category: Algorithm
comments: true
---

# Description
Write a function that takes a string as input and returns the string reversed.

Example:
Given s = "hello", return "olleh".

```java
public class Solution {
    public String reverseString(String s) {
        
    }
}
```

<a href="https://leetcode.com/problems/reverse-string/description/"
target="_blank" rel="nofollow">Reference link (Click!)</a>

<br/>

# Solution
```java
/**
 * 344. Reverse String
 *
 * @author kimtaeng
 * created on 2018. 1. 10.
 */
public class Solution {
    public String reverseString(String s) {
        char[] arr = s.toCharArray();
        int inputLength = s.length();
        for (int currentIndex = 0; currentIndex < inputLength / 2; currentIndex++) {
            char temp = arr[currentIndex];
            arr[currentIndex] = arr[inputLength - 1 - currentIndex];
            arr[inputLength - 1 - currentIndex] = temp;
        }
        return String.valueOf(arr);
    }
}
```