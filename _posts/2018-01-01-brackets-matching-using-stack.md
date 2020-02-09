---
layout:   post
title:    스택을 이용한 괄호 짝 검사(Java 코드)
author:   Kimtaeng
tags: 	  algorithm datastructure stack
description: 주어진 수식의 괄호가 서로 짝이 맞는지 어떻게 확인할 수 있을까? 스택을 이용하여 괄호의 짝이 맞는지 검사해보자.
category: Algorithm
comments: true
---

# 스택을 이용한 괄호 짝 검사
Java로 구현한 괄호의 짝이 맞는지 확인하는 코드입니다. 자료구조 중에서 스택을 사용했습니다.

괄호 검사에 가장 먼저 들어간 것이 가장 나중에 나오는 선입후출(FILO, First In Last Out)이란 특성을 가진
스택을 사용하는 이유는 단순합니다. 가장 최근에 들어간 열린 괄호와 현재 들어가는 닫힌 괄호가 같은 타입이어야 하기 때문입니다.

즉, 나중에 넣은 괄호가 먼저 나와야 합니다. 이러한 이유로 자료구조 중에서 스택을 사용합니다.

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

위 예제 코드에서는 직접 스택을 구현하였지만, 자바에서는 Stack 클래스를 제공하기도 합니다.