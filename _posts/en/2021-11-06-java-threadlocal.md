---
layout:   post
title:    "Java ThreadLocal: Usage and Caveats"
author:   Kimtaeng
tags:    java threadlocal
description: "What ThreadLocal is in Java, how to use it, and what to watch out for in real applications."
category: Java
date: "2021-11-06 23:11:25"
comments: true
lang: en
slug: java-threadlocal
permalink: /en/java-threadlocal/
---

# What is ThreadLocal?
`ThreadLocal` is a long-standing class available since JDK 1.2. It lets you keep per-thread local variables and access them across multiple methods in a way that can look similar to global state. If you use it incorrectly, however, you can introduce serious side effects, so you need to ensure values are not shared across threads unexpectedly.

Let’s first look at the class structure around thread-local storage.

<br><br>

# ThreadLocalMap
`ThreadLocalMap` is a static inner class of `ThreadLocal`. It is entirely `private`, so there are no externally accessible APIs. Internally, it keeps hash-table data, and each element is an `Entry` class that extends `WeakReference` and uses a `ThreadLocal` object as its key.

```java
public class ThreadLocal<T> {
    // ...omitted
	static class ThreadLocalMap {
		// ...omitted
		static class Entry extends WeakReference<ThreadLocal<?>> {
			// ...omitted
		}
	}
}
```

<br>

# Thread
The `Thread` class has a member field of type `ThreadLocalMap`, which allows `ThreadLocal` to directly access data for the current thread.

```java
// Thread class
public class Thread implements Runnable {
	/* ThreadLocal values pertaining to this thread. This map is maintained
	 * by the ThreadLocal class. */
	ThreadLocal.ThreadLocalMap threadLocals = null;
}
```

<br>

# ThreadLocal
This is the core class for this topic. Let’s review the public methods exposed by `ThreadLocal`.

## set and get methods
`set` stores a value in thread-local storage, and `get` reads it.

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        map.set(this, value);
    } else {
        createMap(t, value); 
    }
}

public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}

void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

After retrieving the current thread, `getMap` returns that thread’s `ThreadLocalMap`. As shown above, the `Thread` class has a `ThreadLocalMap` field, so the member of the current thread is returned directly.

<br>

## withInitial method
This method creates a thread-local variable with an initial value. `withInitial` was added in JDK 1.8.

```java
public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
    return new SuppliedThreadLocal<>(supplier);
}
```

<br>

## remove method
This method removes the thread-local value. `remove` was added in JDK 1.5.
As discussed below, in environments that use a thread pool, call `remove` explicitly when you finish using the value. A reused thread can otherwise keep previously stored thread-local data.

```java
public void remove() {
     ThreadLocalMap m = getMap(Thread.currentThread());
     if (m != null)
         m.remove(this);
 }
```

<br>

# Using ThreadLocal
Let’s inspect ThreadLocal with an example. There is no additional synchronization code such as `synchrozied`.
The variable is declared with `private` to prevent external access, `final` to avoid reference reassignment, and `static` so it can be used as per-thread local state.

You can use ThreadLocal without `static`, but in that case the variable is scoped per thread-instance pair. That can be useful in some cases, but for request-level or transaction-level handling in web applications it often diverges from the typical ThreadLocal design intent.

- <a href="https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ThreadLocal.html" target="_blank" rel="nofollow">Reference: "Java Docs: ThreadLocal"</a>

```java
public class ThreadLocalTest {
	
	// Thread class
	static class MadThread extends Thread {
		private static final ThreadLocal<String> threadLocal = ThreadLocal.withInitial(() -> "defaultName");
		private final String name;

		public MadThread(String name) {
			this.name = name;
		}

		@Override
		public void run() {
			System.out.printf("%s Started,  ThreadLocal: %s%n", name, threadLocal.get());
			// Store a value in thread-local storage (the current thread name)
			threadLocal.set(name);
			System.out.printf("%s Finished, ThreadLocal: %s%n", name, threadLocal.get());
		}
	}

	public void runTest() {
		for (int threadCount = 1; threadCount <= 5; threadCount++) {
			final MadThread thread = new MadThread("thread-" + threadCount);
			thread.start();
		}
	}

	public static void main(String[] args) {
		new ThreadLocalTest().runTest();
	}
}
```

The output is shown below. Because threads run concurrently, output order can change per run, but you can confirm values are stored independently without cross-thread interference.

```bash
thread-1 Started,  ThreadLocal: defaultName
thread-1 Finished, ThreadLocal: thread-1
thread-5 Started,  ThreadLocal: defaultName
thread-5 Finished, ThreadLocal: thread-5
thread-4 Started,  ThreadLocal: defaultName
thread-4 Finished, ThreadLocal: thread-4
thread-3 Started,  ThreadLocal: defaultName
thread-2 Started,  ThreadLocal: defaultName
thread-3 Finished, ThreadLocal: thread-3
thread-2 Finished, ThreadLocal: thread-2
```

<br>

# Caveat When Using a Thread Pool
You need extra care with ThreadLocal in thread-pool environments. Because threads are reused, you must clear thread-local values after use.
The following example shows what can happen.

The thread class is the same, but this version executes with a thread pool.

```java
package threadlocal;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ThreadLocalTest {
	static class MadThread extends Thread {
		private static final ThreadLocal<String> threadLocal = new ThreadLocal<>();
		private final String name;

		public MadThread(String name) {
			this.name = name;
		}

		@Override
		public void run() {
			System.out.printf("%s Started,  ThreadLocal: %s%n", name, threadLocal.get());
			threadLocal.set(name);
			System.out.printf("%s Finished, ThreadLocal: %s%n", name, threadLocal.get());
		}
	}

	// Declare thread pool
	private final ExecutorService executorService = Executors.newFixedThreadPool(3);

	public void runTest() {
		for (int threadCount = 1; threadCount <= 5; threadCount++) {
			final String name = "thread-" + threadCount;
			final MadThread thread = new MadThread(name);
			executorService.execute(thread);
		}

		// Shut down thread pool
		executorService.shutdown();

		// Wait for thread pool termination
		while (true) {
			try {
				if (executorService.awaitTermination(10, TimeUnit.SECONDS)) {
					break;
				}
			} catch (InterruptedException e) {
				System.err.println("Error: " + e);
				executorService.shutdownNow();
			}
		}
		System.out.println("All threads are finished");
	}

	public static void main(String[] args) {
		new ThreadLocalTest().runTest();
	}
}
```

Look at the output. Again, order can vary by environment, but in a clean scenario each thread should print `defaultName` at startup.

Compared with the non-thread-pool example, this output differs. At startup of thread 4 and thread 5, a value already exists in ThreadLocal.

```bash
thread-1 Started,  ThreadLocal: defaultName
thread-3 Started,  ThreadLocal: defaultName
thread-3 Finished, ThreadLocal: thread-3
thread-2 Started,  ThreadLocal: defaultName
thread-2 Finished, ThreadLocal: thread-2
thread-4 Started,  ThreadLocal: thread-3
thread-4 Finished, ThreadLocal: thread-4
thread-1 Finished, ThreadLocal: thread-1
thread-5 Started,  ThreadLocal: thread-2
thread-5 Finished, ThreadLocal: thread-5
All threads are finished
```

This happens because threads are reused through the thread pool. To prevent this issue, explicitly call `remove` at the end so used thread-local data can be cleaned up.

```java
public void run() {
    System.out.printf("%s Started,  ThreadLocal: %s%n", name, threadLocal.get());
    threadLocal.set(name);
    System.out.printf("%s Finished, ThreadLocal: %s%n", name, threadLocal.get());
    threadLocal.remove(); // Call the `remove` method.
}
```

<br>

# ThreadLocal Use Cases
There are many practical use cases for ThreadLocal. It is useful when each thread handles separate client requests, or for data that must remain thread-isolated. It is also common in authentication-related logic. A representative example is Spring Security’s `SecurityContext` and `SecurityContextHolder`.

You can also use it in places such as a Spring MVC interceptor for request-scoped data.

```java
/**
 * Declare thread-local variable
 */
public class MadContext {
	public static final ThreadLocal<String> THREAD_LOCAL = ThreadLocal.withInitial(() -> "");
}

/**
 * Define interceptor
 */
public class MadContextInterceptor implements HandlerInterceptor {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		// Extract `id` parameter value
		final String id = request.getParameter("id");

		// Store value in thread-local storage
		MadContextHolder.THREAD_LOCAL.set(id);
		return true;
	}

	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
		// Remove thread-local value
		MadContextHolder.THREAD_LOCAL.remove();
	}
}
```

<br>

# Closing
So far, we reviewed what thread-local storage is and how to use it. As shown in the examples, when you run in a thread-pool environment, always remove thread-local data after use so side effects do not leak into reused threads.
