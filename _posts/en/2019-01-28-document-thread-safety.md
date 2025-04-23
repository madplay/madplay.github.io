---
layout:   post
title:    "[Effective Java 3rd Edition] Item 82. Document Thread Safety"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 82. Document thread safety"
category: Java
comments: true
slug:     document-thread-safety
lang:     en
permalink: /en/post/document-thread-safety
---

# Synchronized in the API Docs?

If a Java API method is marked **synchronized**, you might assume it is thread-safe.
That is not always true. Thread safety has levels.
To use a class safely in a multithreaded environment, the thread-safety level must be documented.

<br/>

# Thread-Safety Levels

From strongest to weakest:

- Immutable
  - Instances are constants; no external synchronization needed.
  - Examples: `String`, `Long`, `BigInteger`
- Unconditionally thread-safe
  - Instances can be modified, but internal synchronization makes them safe without external locking.
  - Examples: `AtomicLong`, `ConcurrentHashMap`
- Conditionally thread-safe
  - Similar to unconditional, but some methods require external synchronization.
  - Example: collections returned by `Collections.synchronized` wrappers
- Not thread-safe
  - Instances are mutable; callers must synchronize each method call.
  - Examples: `ArrayList`, `HashMap`
- Thread-hostile
  - Unsafe even with external synchronization.
  - Often created accidentally when concurrency is ignored.

<br/>

# Documenting Synchronization

Conditionally thread-safe classes require careful documentation.
You must explain which call sequences need external synchronization, and which locks must be held.

For example, the Javadoc for `Collections.synchronizedMap` says:

```java
/**
 * It is imperative that the user manually synchronize on the returned
 * map when iterating over any of its collection views
 * You must manually synchronize on the returned map when iterating its collection views.
 * 
 *  Map m = Collections.synchronizedMap(new HashMap());
 *      ...
 *  Set s = m.keySet();  // Needn't be in synchronized block
 *      ...
 *  synchronized (m) {  // Synchronizing on m, not s!
 *      Iterator i = s.iterator(); // Must be in synchronized block
 *      while (i.hasNext())
 *          foo(i.next());
 *  }
 */
```
 
If a static factory method returns a type that is not obvious from the signature,
document the thread-safety of the returned object as shown above.
 
<br/>

# Exposing Locks

Exposing a lock allows flexible code, but it has a cost.
A client can hold the lock indefinitely and cause a denial-of-service attack.
(Synchronized methods also use an exposed lock.)
Instead, use a private lock object.

```java
// private lock object, declared final
private final Object lock = new Object();

public void someMethod() {
    synchronized(lock) {
        // do something
    }
}
```

Declare the lock as `final` so it cannot be replaced by accident.
This applies to both intrinsic locks and locks from `java.util.concurrent.locks`.
This prevents clients or subclasses from breaking your synchronization discipline.
