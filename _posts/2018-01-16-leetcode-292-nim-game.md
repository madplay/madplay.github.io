---
layout:   post
title:    LeetCode 292. Nim Game
author:   Kimtaeng
tags: 	  algotithm leetcode
description: 베스킨라빈스 게임의 유래라고도 할 수 있는 님(NIM)게임
category: Algorithm
comments: true
---

# Description
You are playing the following Nim Game with your friend: There is a heap of stones on the table, each time one of you
take turns to remove 1 to 3 stones. The one who removes the last stone will be the winner. You will take the first turn
to remove the stones.

Both of you are very clever and have optimal strategies for the game. Write a function to determine whether you can win
the game given the number of stones in the heap.

For example, if there are 4 stones in the heap, then you will never win the game: no matter 1, 2, or 3 stones
you remove, the last stone will always be removed by your friend.

```java
public class Solution {
    public boolean canWinNim(int n) {

    }
}
```

- <a href="https://leetcode.com/problems/nim-game/description/" target="_blank" rel="nofllow">Reference link</a>

<br/>

# Solution
```java
/**
 * 292. Nim Game
 *
 * @author kimtaeng
 * created on 2018. 1. 16.
 */
public class Solution {
    public boolean canWinNim(int n) {
        return (n % 4 != 0);
    }
}
```

자신의 차례에 4개의 stone이 남으면 무조건 승리하게 된다. 여기서는 이길 수 있는지 없는지만 계산하면 된다.
원리를 잘 생각해보면 우리나라의 베스킨라빈스 게임과 유사한데, 바로 이 님게임에서 파생됐다고 볼 수 있다.