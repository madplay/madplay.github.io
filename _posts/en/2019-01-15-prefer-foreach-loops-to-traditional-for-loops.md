---
layout:   post
title:    "[Effective Java 3rd Edition] Item 58. Prefer for-each Loops to Traditional for Loops"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 58. Prefer for-each loops to traditional for loops"
category: Java
comments: true
slug:     prefer-foreach-loops-to-traditional-for-loops
lang:     en
permalink: /en/post/prefer-foreach-loops-to-traditional-for-loops
---

# Iterating Arrays and Collections
When you traverse arrays and collections, you typically write code like this:

```java
// some list
List<String> list = new ArrayList<>();

// iterate a collection - for loop
for (Iterator<String> iterator = list.iterator(); iterator.hasNext(); ) {
    String element = iterator.next();
    // do something
}

// iterate a collection - while loop
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String element = iterator.next();
    // do something
}

// iterate an array
String[] arr = new String[]{"a", "b", "c"};
for (int index = 0; index < arr.length; index++) {
    String element = arr[index];
    // do something
}
```

These loops add iterator and index variables that clutter the code.
They are not the real goal, and mistakes with them can cause bugs.

<br/>

# for-each
Most of the time, you only need the element itself, so use a `for-each` loop.
The **for-each** loop is the enhanced for statement.
It avoids iterators and index variables, so the code is cleaner and less error-prone.

```java
// traditional for loop
for (int index = 0; index < arr.length; index++) {
    String element = arr[index];
    // do something
}

// for each
for (String element : arr) {
    // do something
}
```

You can read the colon as “in”: “each element in arr.”
The advantage grows with nested loops.

```java
// nested for-each
for (Suit suit : suits) {
    for (Rank rank : ranks) {
        deck.add(new Card(suit, rank));
    }
}
```

<br/>

# When You Cannot Use for-each
There are cases where `for-each` is not an option.

**Filtering:** If you need to remove selected elements while iterating,
you must use an explicit `Iterator` so you can call `remove`.

If you modify the list directly inside a `for-each`, you get `ConcurrentModificationException`.
Lists do not allow structural changes during iteration.

```java
// some list
List<String> list = new ArrayList<>();
list.add("a"); list.add("b"); list.add("c");

for (Iterator<String> iterator = list.iterator(); iterator.hasNext(); ) {
    String element = iterator.next();
    if(element.equals("a")) {
        iterator.remove();
    }
    // do something
}
```

With **Java 8**, you can use `removeIf` and avoid explicit iteration.

```java
// Lambda
list.removeIf(s -> s.equals("a"));

// expanded version
list.removeIf(new Predicate<String>() {
    @Override
    public boolean test(String s) {
        return s.equals("a");
    }
});
```

**Transforming:** If you need to modify elements in place, you must use an iterator or array index.

```java
// some array
String[] arr = new String[]{"a", "b", "c"};

// must use index
for (int index = 0; index < arr.length; index++) {
    String s = arr[index];
    if(s.equals("a")) {
        arr[index] = "d";
    }
}
```

**Parallel iteration:** If you need to iterate multiple collections in lockstep,
you must control the iterators or indices explicitly. Otherwise, you get errors like this.

```java
enum Suit {
    CLUB, DIAMOND, HEART, SPADE
}

enum Rank {
    ACE, DEUCE, THREE, FOUR, 
    // ... omitted 
    QUEEN, KING
}

List<Card> deck = new ArrayList<>();
List<Suit> suits = Arrays.asList(Suit.values());
List<Rank> ranks = Arrays.asList(Rank.values());
for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
    for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); ) {
        // next should be called once per suit,
        // but it is called once per rank
        deck.add(new Card(i.next(), j.next()));
    }
} 
```

`next` should run once per `Suit`, but it runs once per `Rank`,
so eventually you get a `NoSuchElementException`.

In these cases, use the traditional `for` loop.
`for-each` works with arrays, collections, and anything that implements `Iterable`.
