---
layout:   post
title:    "자바 ThreadLocal: 사용법과 주의사항"
author:   Kimtaeng
tags:    java threadlocal
description: "자바에서 스레드(thread)마다 독립적인 변수를 가질 수 있게 해주는 스레드 로컬(thread local)은 무엇이며 사용할 때 주의사항은 무엇일까?"
category: Java
date: "2021-11-06 23:11:25"
comments: true
---

# ThreadLocal 이란?
`ThreadLocal`은 JDK 1.2부터 제공된 오래된 클래스다. 이 클래스를 활용하면 스레드 단위로 로컬 변수를 사용할 수 있기 때문에 마치 전역변수처럼
여러 메서드에서 활용할 수 있다. 다만 잘못 사용하는 경우 큰 부작용(side-effect)이 발생할 수 있기 때문에 다른 스레드와 변수가 공유되지 않도록 주의해야 한다.

먼저 스레드 로컬(thread-local)과 연관된 클래스들의 구성에 대해서 알아보자.

<br><br>

# ThreadLocalMap
`ThreadLocalMap`은 `ThreadLocal` 클래스의 정적 내부 클래스다. 모두 `private` 클래스로 구성되어 있어 외부에서 접근 가능한 메서드가 없으며,
내부적으로 해시 테이블 정보를 갖는데, 요소는 `WeakReference`를 확장하고 `ThreadLocal` 객체를 키로 사용하는 `Entry` 클래스다.

```java
public class ThreadLocal<T> {
    // ...생략
	static class ThreadLocalMap {
		// ...생략
		static class Entry extends WeakReference<ThreadLocal<?>> {
			// ...생략
		}
	}
}
```

<br>

# Thread
`Thread` 클래스는 `ThreadLocalMap` 타입 멤버 필드로 가지고 있는데, 이는 특정 스레드의 정보를 `ThreadLocal`에서 직접 호출할 수 있도록 한다.

```java
// Thread 클래스
public class Thread implements Runnable {
	/* ThreadLocal values pertaining to this thread. This map is maintained
	 * by the ThreadLocal class. */
	ThreadLocal.ThreadLocalMap threadLocals = null;
}
```

<br>

# ThreadLocal
이번 주제의 핵심인 클래스다. `ThreadLocal` 클래스의 외부에 공개되는 public 메서드를 살펴보자. 

## set과 get 메서드
스레드 로컬에 값을 저장하는 `set`메서드, 값을 가져오는 `get` 메서드다.

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

현재 스레드를 확인한 후에 `getMap` 메서드를 호출하여 특정 스레드의 `ThreadLocalMap`을 가져온다. 앞서 살펴본 것처럼 `Thread` 클래스에
`ThreadLocalMap` 타입의 필드가 있기 때문에 해당 스레드의 멤버가 직접적으로 반환된다.

<br>

## withInitial 메서드
스레드 로컬 변수를 생성하면서 특정 값으로 초기화하는 메서드다. `withInitial` 메서드는 JDK 1.8에서 추가되었다.

```java
public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
    return new SuppliedThreadLocal<>(supplier);
}
```

<br>

## remove 메서드
스레드 로컬 변수 값을 삭제하는 메서드다. `remove` 메서드는 JDK 1.5에서 추가되었다.
이어지는 내용에서 언급하겠지만, 스레드 풀(thread pool)을 사용하는 환경에서는 스레드 로컬 변수 사용이 끝났다면 `remove`를 명시적으로 호출해야 한다.
스레드가 재활용되면서 이전에 설정했던 스레드 로컬 정보가 남아있을 수 있기 때문이다.

```java
public void remove() {
     ThreadLocalMap m = getMap(Thread.currentThread());
     if (m != null)
         m.remove(this);
 }
```

<br>

# 스레드 로컬 사용해보기
예제 코드로 스레드 로컬을 살펴보자. `synchrozied`와 같은 동기화를 위한 추가적인 코드는 없다.
외부에서 접근 못하도록 `private` 키워드, 레퍼런스가 재할당되지 않게 `final` 키워드로 선언되었으며 스레드당 로컬 변수로 활용될 수 있도록 `static` 키워드가 선언되었다.

물론 스레드 로컬에 `static` 키워드 없이 사용할 수도 있다. 하지만 `non-static`이라면 해당 변수는 스레드-인스턴스당 사용될 수 있는 개념이 될 것이다.
어떻게 보면 유용할 수도 있겠으나 웹 페이지에서의 요청 단위나 트랜잭션 등을 생각해 보면, 스레드 로컬의 목적과 설계 의도와는 거리가 멀다.

- <a href="https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ThreadLocal.html" target="_blank" rel="nofollow">참고: "Java Docs: ThreadLocal"</a>

```java
public class ThreadLocalTest {
	
	// 스레드 클래스
	static class MadThread extends Thread {
		private static final ThreadLocal<String> threadLocal = ThreadLocal.withInitial(() -> "defaultName");
		private final String name;

		public MadThread(String name) {
			this.name = name;
		}

		@Override
		public void run() {
			System.out.printf("%s Started,  ThreadLocal: %s%n", name, threadLocal.get());
			// 스레드 로컬에 값(현재 스레드 이름) 저장
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

실행 결과는 다음과 같다. 스레드가 동시에 실행되기 때문에 출력 순서는 실행 때마다 다를 수 있지만 스레드 간에 간섭 없이 값이 잘 저장된 것을 확인할 수 있다.

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

# 스레드 풀(Thread Pool)을 사용할 때의 주의사항
스레드 로컬은 스레드 풀(thread pool)을 사용하는 환경에서는 주의해야 한다. 스레드가 재활용될 수 있기 때문에 사용이 끝났다면 스레드 로컬을 비워주는 과정이 필수적이다.
어떤 상황이 발생할 수 있는지 다음 예제로 알아보자.

스레드 클래스는 동일하지만 스레드 풀을 사용하여 스레드를 실행시키는 점이 다르다.

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

	// 스레드 풀 선언
	private final ExecutorService executorService = Executors.newFixedThreadPool(3);

	public void runTest() {
		for (int threadCount = 1; threadCount <= 5; threadCount++) {
			final String name = "thread-" + threadCount;
			final MadThread thread = new MadThread(name);
			executorService.execute(thread);
		}

		// 스레드 풀 종료
		executorService.shutdown();

		// 스레드 풀 종료 대기
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

실행 결과를 살펴보자. 역시나 출력 순서는 본인의 환경에 따라 실행할 때마다 다를 수 있지만 정상적인 상황이라면 스레드가 시작될 때 출력되는
스레드 로컬의 값은 "defaultName" 이어야 한다.

하지만 앞서 스레드 풀을 사용하지 않았을 때와 결과와 다른 점이 보인다. 4번과 5번 스레드가 시작될 때를 보면 이미 스레드 로컬에 값이 들어있음을 확인할 수 있다.

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

이러한 결과가 발생하는 이유는 **스레드 풀을 통해서 스레드가 재사용되기 때문이다.** 이러한 문제를 방지하려면 사용이 끝난 스레드 로컬 정보는 제거될 수 있도록
`remove` 메서드를 마지막에 명시적으로 호출하면 된다.

```java
public void run() {
    System.out.printf("%s Started,  ThreadLocal: %s%n", name, threadLocal.get());
    threadLocal.set(name);
    System.out.printf("%s Finished, ThreadLocal: %s%n", name, threadLocal.get());
    threadLocal.remove(); // `remove` 메서드를 호출한다.
}
```

<br>

# 스레드 로컬의 활용
스레드 로컬을 활용할 수 있는 곳은 많다. 클라이언트 요청에 대해서 각각의 스레드에서 처리할 때나, 스레드 독립적으로 처리해야 하는 데이터와 같이
인증 관련 처리에서도 활용될 수 있다. 대표적으로 Spring Security의 `SecurityContext`, `SecurityContextHolder` 클래스를 살펴보면 된다.

또는 Spring MVC의 인터셉터(interceptor) 등에서 아래와 같이 클라이언트의 요청 등에서 활용할 수 있다.

```java
/**
 * 스레드 로컬 선언
 */
public class MadContext {
	public static final ThreadLocal<String> THREAD_LOCAL = ThreadLocal.withInitial(() -> "");
}

/**
 * 인터셉터 정의
 */
public class MadContextInterceptor implements HandlerInterceptor {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		// `id` 파라미터 값 추출
		final String id = request.getParameter("id");

		// 스레드 로컬에 값 저장
		MadContextHolder.THREAD_LOCAL.set(id);
		return true;
	}

	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
		// 스레드 로컬 정보 제거
		MadContextHolder.THREAD_LOCAL.remove();
	}
}
```

<br>

# 마치며
지금까지 스레드 로컬(thread local)이 무엇인지, 그리고 사용법에 대해서 알아보았다. 예제에서 확인한 것처럼 스레드 풀(thread pool)을 사용하는 환경에서는
반드시 사용이 끝난 후에 스레드 로컬 정보를 제거해서 사이드 이펙트가 발생하지 않도록 주의해야 한다.