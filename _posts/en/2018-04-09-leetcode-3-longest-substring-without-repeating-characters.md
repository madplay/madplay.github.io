---
layout:   post
title:    LeetCode 3. Longest Substring Without Repeating Characters
author:   Kimtaeng
tags: 	  Algotithm LeetCode
description: Find the longest substring without repeating characters in a given string
category: Algorithm
comments: true
slug:     leetcode-3-longest-substring-without-repeating-characters
lang:     en
permalink: /en/post/leetcode-3-longest-substring-without-repeating-characters
---

# Description
Given a string, find the length of the longest substring without repeating characters.

Examples:
```bash
Given "abcabcbb", the answer is "abc", which the length is 3.

Given "bbbbb", the answer is "b", with the length of 1.

Given "pwwkew", the answer is "wke", with the length of 3. Note that the answer must be a substring,
"pwke" is a subsequence and not a substring.
```

```java
public class Solution {
    public int lengthOfLongestSubstring(String s) {
        
    }
}
```

<a href="https://leetcode.com/problems/longest-substring-without-repeating-characters/description/"
target="_blank" rel="nofollow">Reference link (Click!)</a>

<br/>

# Solution
```java
/**
 * 3. Longest Substring Without Repeating Characters
 *
 * @author kimtaeng
 * created on 2018. 1. 9.
 */
public class Solution {
    public int lengthOfLongestSubstring(String s) {
        int length = 0;
        int[] arr = new int[128];

        for(int idx=0; idx<arr.length; idx++) {
            arr[idx] = 0;
        }

        int position = 0;
        int inputLength = s.length();
        for (int indexOfString = 0; indexOfString < inputLength; indexOfString++) {
            int charIndex = (int) s.charAt(indexOfString);
            position = getMax(arr[charIndex], position);
            length = getMax(length, indexOfString - position + 1);
            arr[charIndex] = indexOfString + 1;
        }
        return length;
    }

    public int getMax(int a, int b) {
        return a > b ? a : b;
    }
}
```
