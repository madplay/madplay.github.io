---
layout:   post
title:    "[Effective Java 3rd Edition] Item 80. Prefer Executors, Tasks, and Streams to Threads"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 80. Prefer executors, tasks, and streams to threads"
category: Java
lang: en
slug: prefer-executors-tasks-and-streams-to-threads
permalink: /en/prefer-executors-tasks-and-streams-to-threads/
date: "2019-10-03 00:52:12"
comments: true
---

# Executor Framework
The `java.util.concurrent` package provides the Executor Framework, which offers flexible interface-based task execution.
In the past, creating a simple work queue required a lot of code. Now you can create one as follows.

```java
// Create a queue.
ExecutorService exec = Executors.newSingleThreadExecutor();

// Execute a task.
exec.execute(runnable);

// Shut down the executor.
exec.shutdown();
```

Major capabilities include:

- Wait for a specific task to complete: `submit().get()`

```java
ExecutorService exec = Executors.newSingleThreadExecutor();
exec.submit(()  -> s.removeObserver(this)).get(); // Wait until completion.
```
- Wait for one (`invokeAny`) or all (`invokeAll`) tasks in a set.

```java
List<Future<String>> futures = exec.invokeAll(tasks);
System.out.println("All Tasks done");

exec.invokeAny(tasks);
System.out.println("Any Task done");
```

- Wait for executor service termination: `awaitTermination`

```java
Future<String> future = exec.submit(task);
exec.awaitTermination(10, TimeUnit.SECONDS);
```

- Retrieve completed task results in completion order: `ExecutorCompletionService`

```java
final int MAX_SIZE = 3;
ExecutorService executorService = Executors.newFixedThreadPool(MAX_SIZE);
ExecutorCompletionService<String> executorCompletionService = new ExecutorCompletionService<>(executorService);

List<Future<String>> futures = new ArrayList<>();
futures.add(executorCompletionService.submit(() -> "madplay"));
futures.add(executorCompletionService.submit(() -> "kimtaeng"));
futures.add(executorCompletionService.submit(() -> "hello"));

for (int loopCount = 0; loopCount < MAX_SIZE; loopCount++) {
    try {
        String result = executorCompletionService.take().get();
        System.out.println(result);
    } catch (InterruptedException e) {
        //
    } catch (ExecutionException e) {
        //
    }
}
executorService.shutdown();
```

- Schedule tasks at a specific time or periodically: `ScheduledThreadPoolExecutor`

```java
ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(1);

executor.scheduleAtFixedRate(() -> {
    System.out.println(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .format(LocalDateTime.now()));
}, 0, 2, TimeUnit.SECONDS);

// 2019-09-30 23:11:22
// 2019-09-30 23:11:24
// 2019-09-30 23:11:26
// 2019-09-30 23:11:28
// ...
```

<br/>

# Thread Pool Types
`Executors.newCachedThreadPool` fits servers running lightweight programs.
It does not queue incoming tasks and processes them immediately. If no thread is available, it creates a new one.
On heavy servers, CPU usage can hit 100%, and creating more threads for new tasks can make the situation worse.

For heavy production servers, `Executors.newFixedThreadPool` with a fixed thread count is usually a better choice.

<br/>

# Do Not Manage Threads Directly
In general, avoid creating work queues manually or controlling threads directly.
Use the Executor Framework instead.
Then you can separate units of work from execution mechanisms.
Work units are `Runnable` and `Callable`.
`Callable` is similar to `Runnable`, but returns a value and can throw checked exceptions.

Since Java 7, the Executor Framework also supports **fork-join tasks**.
`ForkJoinTask` instances can be split into smaller subtasks.
Threads in `ForkJoinPool` process them, and threads that finish early can steal remaining tasks from others.

This design maximizes CPU utilization for high throughput and low latency.
Parallel streams are also implemented on top of `ForkJoinPool`.
