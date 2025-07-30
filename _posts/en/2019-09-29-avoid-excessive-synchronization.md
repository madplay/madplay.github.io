---
layout:   post
title:    "[Effective Java 3rd Edition] Item 79. Avoid Excessive Synchronization"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 79. Avoid excessive synchronization"
category: Java
lang: en
slug: avoid-excessive-synchronization
permalink: /en/avoid-excessive-synchronization/
date: "2019-09-29 00:23:49"
comments: true
---

# Too Much Is Also a Problem
Insufficient synchronization is a problem, but excessive synchronization is also a problem.
It can hurt performance, cause deadlocks, and even trigger liveness or safety failures.

To avoid those failures, never hand control to clients inside synchronized methods or blocks.
Do not call overridable methods in synchronized regions.
Do not invoke function objects supplied by clients there either.
Those calls may throw exceptions, create deadlocks, or corrupt state.
Such methods are often called alien methods.

<br/>

# Alien Method
Let's build an alien-method example.
This is a wrapper around a `Set` with observer notification when elements are added.

```java
public class ObservableSet<E> extends ForwardingSet<E> {
    public ObservableSet(Set<E> set) {
        super(set);
    }

    private final List<SetObserver<E>> observers = new ArrayList<>();

    public void addObserver(SetObserver<E> observer) {
        synchronized(observers) {
            observers.add(observer);
        }
    }

    public boolean removeObserver(SetObserver<E> observer) {
        synchronized(observers) {
            return observers.remove(observer);
        }
    }

    private void notifyElementAdded(E element) {
        synchronized(observers) {
            for (SetObserver<E> observer : observers)
                observer.added(this, element);
        }
    }

    @Override
    public boolean add(E element) {
        boolean added = super.add(element);
        if (added)
            notifyElementAdded(element);
        return added;
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        boolean result = false;
        for (E element : c)
            result |= add(element); // calls notifyElementAdded
        return result;
    }
}
```

```java
@FunctionalInterface
public interface SetObserver<E> {
    // Called when an element is added to ObservableSet.
    void added(ObservableSet<E> set, E element);
}
```

Observers are added/removed via `addObserver` and `removeObserver`.
Now let's see problematic examples.

<br/>

# Alien Method Example: Exception
In the code below, `s.removeObserver` uses an anonymous class intentionally.
It must pass function object itself, and lambda has no direct self-reference.

```java
public static void main(String[] args) {
    ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());
    set.addObserver(new SetObserver<>() {
        public void added(ObservableSet<Integer> s, Integer e) {
            System.out.println(e);
            if (e == 23)
                s.removeObserver(this);
        }
    });

    for (int i = 0; i < 100; i++)
        set.add(i;)
}
```

This throws `ConcurrentModificationException`.
It looks like it should print 0 to 23 and stop after removing observer,
but actually it throws after printing 0 to 23.
Reason: `added` is called while `notifyElementAdded` is iterating observer list.

Inside `added`, `ObservableSet.removeObserver` calls `observers.remove`.
That attempts to modify the list currently being iterated.
Iteration is inside synchronized block so external concurrent modification is blocked,
but self-modification through callback is not blocked.

<br/>

# Alien Method Example: Unnecessary Background Thread
Another example uses `ExecutorService` to remove observer from another thread.

```java
public static void main(String[] args) {
    ObservableSet<Integer> set = new ObservableSet<>(new HashSet<>());

    set.addObserver(new SetObserver<>() {
        public void added(ObservableSet<Integer> s, Integer e) {
            System.out.println(e);
            if (e == 23) {
                ExecutorService exec = Executors.newSingleThreadExecutor();
                try {
                    // lock occurs here (main thread is waiting)
                    // waits for specific task completion (submit().get())
                    exec.submit(() -> s.removeObserver(this)).get();
                } catch (ExecutionException | InterruptedException ex) {
                    throw new AssertionError(ex);
                } finally {
                    exec.shutdown();
                }
            }
        }
    })

    for (int i = 0; i < 100; i++) {
        set.add(i);
    }
}
```

This does not throw an exception, but deadlocks.
Background thread tries to lock observer list in `removeObserver`,
but main thread already holds that lock.

Because `removeObserver` is synchronized, it needs the lock.
Meanwhile main thread is waiting for background task completion.
So both wait forever.

<br/>

# Fix for Exception/Deadlock
Move alien method invocation outside synchronized block.

```java
private void notifyElementAdded(E element) {
    List<SetObserver<E>> snapshot = null;
    synchronized (observers) {
        snapshot = new ArrayList<>(observers);
    }
    for (SetObserver<E> observer : snapshot) {
        observer.added(this, element);
    }
}
```

A better option is using Java concurrent collections.
Then explicit synchronization with `synchronized` is unnecessary.

```java
private final List<SetObserver<E>> observers = new CopyOnWriteArrayList<>();

public void addObserver(SetObserver<E> observer) {
    observers.add(observer);
}

public boolean removeObserver(SetObserver<E> observer) {
    return observers.remove(observer);
}

private void notifyElementAdded(E element) {
    for (SetObserver<E> observer : observers)
        observer.added(this, element);
}
```

`CopyOnWriteArrayList` creates a fresh copy on every structural modification.
Internal array is not mutated during iteration, so iteration needs no lock and is fast.
It is slow for frequent writes, but ideal for observer lists with rare updates and frequent iteration.

<br/>

# Performance Perspective
Excessive synchronization removes opportunities for parallel execution.
A major real cost is latency required for all cores to maintain memory consistency.
It also limits JVM optimizations.

When designing mutable classes, you have two options:
1) Do not synchronize internally and require external synchronization by callers.
   - Example: most of `java.util` except `Vector` and `Hashtable`.
2) Synchronize internally and provide thread-safe classes.
   - Choose this when it can improve concurrency over whole-object external locking.
   - Example: `java.util.concurrent`.

Another case is `StringBuffer`.
Although mostly used in single-threaded contexts, it synchronizes internally.
Later `StringBuilder` appeared to address performance.

- <a href="/post/difference-between-string-stringbuilder-and-stringbuffer-in-java" target="_blank">
Reference: Java String vs StringBuilder vs StringBuffer</a>

`java.util.Random` is similar.
It was effectively replaced by unsynchronized `ThreadLocalRandom` for concurrent use.
If uncertain, avoid synchronization and document it as _not thread-safe_.

<br/>

# Summary
Minimize work done inside synchronized regions.
For long-running operations, move them outside synchronized blocks when possible.
If a method that may be called by multiple threads updates static fields,
synchronize before accessing those fields.

When designing mutable classes, explicitly decide whether internal synchronization is needed.
Avoid excessive synchronization.
Synchronize internally only with clear justification, and document thread-safety policy.
