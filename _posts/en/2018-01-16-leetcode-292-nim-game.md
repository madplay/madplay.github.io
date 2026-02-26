---
layout:   post
title:    LeetCode 292. Nim Game
author:   madplay
tags: 	  algotithm leetcode
description: Nim game, which can also be said to be the origin of Baskin-Robbins game
category: Algorithm/CS
comments: true
slug:     leetcode-292-nim-game
lang:     en
permalink: /en/post/leetcode-292-nim-game
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

If 4 stones remain on your turn, you will definitely lose. Here, you only need to calculate whether you can win or not.
If you think about the principle well, it's similar to Korea's Baskin-Robbins game, and it can be viewed as derived from this Nim game.
