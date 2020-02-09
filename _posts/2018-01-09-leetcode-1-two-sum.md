---
layout:   post
title:    LeetCode 1. Two Sum
author:   Kimtaeng
tags: 	  algotithm leetcode
description: 1~N이 포함된 배열이 주어질 때, 입력한 숫자 M을 만들 수 있는 배열의 인덱스 찾기
category: Algorithm
comments: true
---

# Description
Given an array of integers, return indices of the two numbers such that they add up to a specific target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.

```bash
Example:
Given nums = [2, 7, 11, 15], target = 9,

Because nums[0] + nums[1] = 2 + 7 = 9,
return [0, 1].
```

```java
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}
```

- <a href="https://leetcode.com/problems/two-sum/description/" target="_blank" rel="nofollow">Reference link</a>

<br/>

# Solution
```java
import java.util.HashMap;
import java.util.Map;

/**
 * 1. Two Sum
 *
 * @author kimtaeng
 * created on 2018. 1. 9
 */
public class Solution {
	public int[] twoSum(int[] nums, int target) {
		Map<Integer, Integer> map = new HashMap<Integer, Integer>();

		for (int i = 0; i < nums.length; i++) {
			int otherValue = target - nums[i];
			if (map.containsKey(otherValue)) {
				return new int[] { map.get(otherValue), i };
			} 
			map.put(nums[i], i);
		}
		throw new IllegalArgumentException("No two sum solution");
	}
}
```