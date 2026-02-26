---
layout:   post
title:    LeetCode 344. Reverse String
author:   madplay
tags: 	  algotithm leetCode
description: Output the input string in reverse
category: Algorithm/CS
comments: true
slug:     leetcode-344-reverse-string
lang:     en
permalink: /en/post/leetcode-344-reverse-string
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
