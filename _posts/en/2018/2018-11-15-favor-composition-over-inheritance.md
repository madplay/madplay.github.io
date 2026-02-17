---
layout:   post
title:    "[Effective Java 3rd Edition] Item 18. Favor Composition over Inheritance"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 18. Favor composition over inheritance"
category: Java/Kotlin
comments: true
slug:     favor-composition-over-inheritance
lang:     en
permalink: /en/post/favor-composition-over-inheritance
---

# Inheritance (extends)
Inheritance is a powerful way to reuse code, but it is not always the best choice. It breaks encapsulation.
When a superclass implementation changes, subclasses can be affected.

Assume we have a `MyHashSet` that extends `HashSet`.

```java
public class MyHashSet<E> extends HashSet<E> {
    private int addCount = 0; // number of elements added

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount = addCount + c.size();
        return super.addAll(c);
    }

    public int getAddCount() {
        return addCount;
    }
}

// after creating the object, add 3 elements via addAll
MyHashSet<String> mySet = new MyHashSet<>();
mySet.addAll(List.of("item1","item2","item3"));

// what does it print?
System.out.println(mySet.getAddCount());
```

What happens when you run it? You might expect `addCount` to be 3, but it returns 6.
The reason is that `HashSet` implements `addAll` by calling `add` for each element.

```java
// HashSet(AbstractSet) addAll method
public boolean addAll(Collection<? extends E> c) {
    boolean modified = false;
    for (E e : c)
        if (add(e))
            modified = true;
    return modified;
}
```

Because `addAll` calls `add`, the `addAll` override should not increment `addCount` itself.

<br/>

# What Is Safer?
Creating a **new method instead of overriding** can be safer, but it is not risk-free.
If a subclass adds a method with the same signature but a different return type, the class does not compile.
If the return type is the same, it becomes an override.

<div class="post_caption">A method signature consists of the method name and parameters.</div> 

Instead of extending an existing class, create a new class and keep an instance of the existing class as a private field.
Because the existing class becomes a component of the new class, this is called **composition**.

Instance methods in the new class call the corresponding methods in the existing class and return the result.
This is forwarding, and those methods are forwarding methods.

With this approach, the new class is less affected by changes in the existing class, and it stays safe even when the existing class adds new methods.
Let’s rewrite the example using composition and forwarding.

```java
public class MySet<E> extends ForwardingSet<E>  {
    private int addCount = 0;

    public MySet(Set<E> set) {
        super(set);
    }

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> collection) {
        addCount = addCount + collection.size();
        return super.addAll(collection);
    }

    public int getAddCount() {
        return addCount;
    }
}

public class ForwardingSet<E> implements Set<E> {
    private final Set<E> set;
    public ForwardingSet(Set<E> set) { this.set = set; }
    public void clear() { set.clear(); }
    public boolean isEmpty() { return set.isEmpty(); }
    public boolean add(E e) { return set.add(e); }
    public boolean addAll(Collection<? extends E> c) { return set.addAll(c); }
    // ... omitted
}
```

Because `MySet` wraps another `Set`, this is called a **wrapper class**.
And because it adds instrumentation to another `Set`, it is also the **Decorator Pattern**.
The combination of composition and forwarding is broadly called delegation, but strictly speaking it applies only when the wrapper passes itself to the wrapped object.

<br/>

# When Should You Use Inheritance?
Use inheritance only when class B has an **is-a relationship** with class A.
It should only be used when the subclass is truly a subtype of the superclass.
If you plan to create class B that extends class A, ask: **"Is B really an A?"**
For example, a red wine class that extends a wine class. A red wine is a wine.

If that condition does not hold, keep A as a private instance inside B.
In that case, A is not an essential part of B’s identity, but just one way to implement it.
