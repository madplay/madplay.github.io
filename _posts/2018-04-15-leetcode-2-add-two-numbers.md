---
layout:   post
title:    LeetCode 2. Add Two Numbers
author:   Kimtaeng
tags: 	  algotithm leetCode
description: 양수(Positive Number)들로 이루어진 2개의 리스트를 각 인덱스 별로 더한 결과 구하기
category: Algorithm
comments: true
---

# Description
You are given two non-empty linked lists representing two non-negative integers.
The digits are stored in reverse order and each of their nodes contain a single digit.
Add the two numbers and return it as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

Example
```bash
Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
Output: 7 -> 0 -> 8
Explanation: 342 + 465 = 807.
```

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        
    }
}
```

<a href="https://leetcode.com/problems/add-two-numbers/description/"
target="_blank" rel="nofollow">Reference link (Click!)</a>

<br/>

# Solution
```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */

/**
 * 2. Add Two Numbers
 *
 * @author kimtaeng
 * created on 2018. 1. 9.
 */
public class Solution {
	public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
		ListNode operand1 = l1;
        ListNode operand2 = l2;
        ListNode resultNode = new ListNode(0);
        ListNode currentNode = resultNode;

        int sum = 0;

        while (operand1 != null || operand2 != null) {
            sum = sum / 10;
            if(operand1 != null) {
                sum = sum + operand1.val;
                operand1 = operand1.next;
            }

            if(operand2 != null) {
                sum = sum + operand2.val;
                operand2 = operand2.next;
            }

            currentNode.next = new ListNode(sum % 10);
            currentNode = currentNode.next;
        }
        
        if(sum / 10 == 1) {
            currentNode.next = new ListNode(1);
        }

        return resultNode.next;
	}
}
```