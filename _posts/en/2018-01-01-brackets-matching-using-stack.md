---
layout:   post
title:    Bracket Matching with a Stack (Java)
author:   Kimtaeng
tags: 	  algorithm datastructure stack
description: How can you verify matching brackets in an expression? Use a stack to validate pairs.
category: Algorithm
comments: true
slug:     brackets-matching-using-stack
lang:     en
permalink: /en/post/brackets-matching-using-stack
---

# Bracket Matching with a Stack
This Java example validates bracket pairs with a stack.

A stack follows First In, Last Out (FILO): the first element pushed exits last. The most recent opening bracket must match the current closing bracket of the same type.

That last-in-first-out behavior makes a stack the right structure for bracket validation.

```java
import java.util.Scanner;

/**
 * Customized Stack
 * @author kimtaeng
 * Created on 2018. 1. 1.
 */
class Stack {
    char[] stack;
    int top;

    public Stack(int size) {
        stack = new char[size];
        this.top = -1;
    }

    public void push(char data) {
        stack[++top] = data;
    }

    public char pop() {
        return stack[top--];
    }

    public boolean isEmpty() {
        if(top == -1) {
            return true;
        }
        return false;
    }
}

/**
 * input example
 * "public static void main(String[] args){}"
 * 
 * @author kimtaeng
 * Created on 2018. 1. 1.
 */
public class MadPlay {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();
        Stack stack = new Stack(input.length());

        int loopCount = 0;
        for (loopCount = 0; loopCount < input.length(); loopCount++) {
            char ch = input.charAt(loopCount);
            boolean isIncorrect = false;

            switch (ch) {
            case '(': case '{': case '[':
                stack.push(ch);
                break;

            case ')':
                if (stack.isEmpty() || (ch = stack.pop()) != '(') {
                    isIncorrect = true;
                }
                break;

            case '}':
                if (stack.isEmpty() || (ch = stack.pop()) != '(') {
                    isIncorrect = true;
                }
                break;

            case ']':
                if (stack.isEmpty() || (ch = stack.pop()) != '(') {
                    isIncorrect = true;
                }
                break;
            }
            
            if(isIncorrect) {
                break;
            }
        }
        
        if(stack.isEmpty() && loopCount == input.length()) {
            System.out.println("correct");
        }
        else {
            System.out.println("incorrect");
        }
    }
}
```

This example builds a custom stack, but Java also provides a `Stack` class.
