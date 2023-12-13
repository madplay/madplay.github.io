---
layout: post
title: "Java Virtual Thread: Introduction and Internal Mechanics"
author: madplay
tags: java virtual-thread loom jdk21 concurrency
description: "Explore how Virtual Threads, officially released in Java 21, differ from platform threads. We examine OS thread limitations, mount/unmount mechanics, and the ForkJoinPool scheduler with code examples."
category: Java/Kotlin
date: "2023-12-14 08:17:42"
comments: true
series: "Virtual Thread"
lang: en
slug: java-virtual-thread-introduction
permalink: /en/post/java-virtual-thread-introduction
---

# Virtual Thread Series Table of Contents

- **Java Virtual Thread: Introduction and Internal Mechanics**
- <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Understanding and Mitigating Pinning</a>
- <a href="/en/post/java-virtual-thread-performance" target="_blank">Java Virtual Thread: Performance Benchmarking and Adoption Criteria</a>
- <a href="/en/post/java-virtual-thread-spring-boot" target="_blank">Java Virtual Thread: Spring Boot Integration and Best Practices</a>
- <a href="/en/post/java-virtual-thread-vs-coroutine-webflux" target="_blank">Java Virtual Thread: Comparison with Kotlin Coroutines and WebFlux</a>

<br>

# Sending 50,000 Newsletters: How Many Threads Do We Need?

Imagine you need to send a newsletter to 50,000 subscribers every Monday morning.
From the outside, it looks like a simple click of a "Send" button. Internally, however, deciding how many threads the server should use to handle this task is a critical architectural decision.

## Starting with a Thread Pool

The most common approach is to create a thread pool and submit a sending task for each subscriber.

```java
public class NewsletterDispatcher {

	private final ExecutorService executor = Executors.newFixedThreadPool(200);
	private final MailClient mailClient;

	public NewsletterDispatcher(MailClient mailClient) {
		this.mailClient = mailClient;
	}

	public void dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
		for (Subscriber subscriber : subscribers) {
			executor.submit(() -> mailClient.send(subscriber.email(), newsletter));
		}
	}
}
```

With a thread pool of 200, these 200 threads will take turns processing the 50,000 requests. Each task occupies a thread until the SMTP call is completed.
If the response is delayed, the thread sits idle, doing nothing but waiting.

## Why Not Just Increase the Number of Threads?

It might seem that increasing the thread count would improve concurrent throughput. However, platform threads map 1:1 to OS threads.
Depending on JVM and OS settings, each thread typically consumes 512KB to 1MB of stack memory.
Creating 50,000 threads would require tens of gigabytes of RAM. Even if you have the memory, the cost of the OS scheduler context-switching between tens of thousands of threads is prohibitively high.

Ultimately, the thread-per-request model has its limits. Surpassing these limits often requires asynchronous programming models like Reactive, which comes with the trade-off of significantly increased code complexity.

<br>

# Switching to Virtual Threads

If there is a limit to increasing the number of threads, why not stop wasting the time threads spend waiting?
Virtual Threads, officially introduced in <a href="/en/post/what-is-new-java-21" target="_blank">Java 21</a>, solve this problem from a different angle.

## Changing Just One Line

The business logic remains untouched.
You simply replace `Executors.newFixedThreadPool(200)` with `Executors.newVirtualThreadPerTaskExecutor()`.

```java
public class NewsletterDispatcher {

	private final MailClient mailClient;

	public NewsletterDispatcher(MailClient mailClient) {
		this.mailClient = mailClient;
	}

	public void dispatch(List<Subscriber> subscribers, Newsletter newsletter) {
		try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
			for (Subscriber subscriber : subscribers) {
				executor.submit(() -> mailClient.send(subscriber.email(), newsletter));
			}
		}
	}
}
```

There is a specific reason for using `try-with-resources`.
Since Java 19, `ExecutorService` implements `AutoCloseable`. When the block closes, it waits for all submitted tasks to complete before proceeding.

This fits perfectly with workflows where all sending tasks must finish before moving to the next stage.

> Starting with Java 19, `ExecutorService` implements `AutoCloseable`, and its `close()` method
> internally calls `shutdown()` followed by `awaitTermination(Long.MAX_VALUE, NANOSECONDS)`.
> This guarantees that all submitted tasks are finished by the time the block is exited.

## Efficient Resource Usage Even with 50,000 Tasks

In this model, 50,000 Virtual Threads handle the individual sending tasks. The number of OS threads used is roughly equivalent to the number of CPU cores.
Even with 50,000 threads running, memory and CPU usage remain low. Of course, this is a simplified observation.
In a real-world scenario, you would still need flow control to account for external SMTP rate limits and backpressure rather than firing all 50,000 requests simultaneously.

But why does the system remain so efficient even with 50,000 threads?

<br>

# What Happens Under the Hood?

## Virtual Threads Are Not OS Threads

**A Virtual Thread is a lightweight thread managed by the JVM.** While it runs on top of an OS thread, it does **not have a 1:1 mapping with it.**
The actual OS thread responsible for execution is called a **carrier thread**. A Virtual Thread mounts onto this carrier to use the CPU and unmounts when necessary.

The stack of a Virtual Thread also differs from that of a platform thread. Instead of pre-allocating a fixed-size stack, the necessary frames are stored in the heap during execution.
This is why creating tens of thousands of Virtual Threads does not lead to a massive spike in memory consumption.

## Mounting and Unmounting

The core of the Virtual Thread lifecycle lies in mounting and unmounting.

**Mounting** occurs when a Virtual Thread is scheduled onto a carrier thread to occupy the CPU.
**Unmounting** happens when the Virtual Thread encounters a blocking I/O operation. At this point, it releases the carrier thread.
Immediately after unmounting, the carrier thread is free to mount another Virtual Thread.
This creates an M:N scheduling structure where thousands of Virtual Threads are multiplexed onto a small number of carrier threads.

Returning to our newsletter example, the moment the system waits for an SMTP server response while sending an email is the unmount point.
The freed carrier thread immediately starts the next delivery task by mounting another Virtual Thread.
In a platform thread model, the entire thread would be blocked and unusable until the SMTP response arrived.

## Continuation: The Mechanism for Saving State

When a Virtual Thread leaves its carrier, its execution state, or stack frames, are stored in the JVM heap.
The JVM's **continuation** mechanism saves this state and, upon receiving an I/O completion notification, retrieves it to resume execution.

While this operates based on `jdk.internal.vm.Continuation` internally, you should not import or use this package directly.
When using the Virtual Thread API, continuations work transparently behind the scenes.

The Virtual Thread lifecycle oscillates on and off the carrier thread in this manner:

<pre class="mermaid">
stateDiagram-v2
    [*] --> Created
    Created --> Running: mount
    Running --> Parked: blocking I/O (unmount)
    Parked --> Running: I/O complete (remount)
    Running --> [*]: Task finished
</pre>

## Who Is the Scheduler?

The entity responsible for scheduling Virtual Threads is the `ForkJoinPool`.
The default parallelism is equal to `Runtime.getRuntime().availableProcessors()`, which matches the number of CPU cores.
While this can be adjusted using the system property `-Djdk.virtualThreadScheduler.parallelism`, the default value is usually sufficient for most I/O-intensive workloads.

## Verifying Carrier Thread Names

You can verify which carrier thread is running a Virtual Thread by checking its name.

```java
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 5; i++) {
        executor.submit(() -> System.out.println(Thread.currentThread()));
    }
}
```

The output will look something like this:

```
VirtualThread[#21]/runnable@ForkJoinPool-1-worker-1
VirtualThread[#22]/runnable@ForkJoinPool-1-worker-2
```

`VirtualThread[#...]` is the name of the Virtual Thread itself, and the string after `@`, `ForkJoinPool-1-worker-N`, is the carrier thread it is currently mounted on.
If you run this multiple times, you may notice the carrier thread name changing for the same Virtual Thread, showing the context switching in action.

Note that if blocking I/O occurs within a `synchronized` block, the carrier thread cannot be unmounted. This is known as **pinning**, which we will cover in the next post.

<br>

# How It Differs from Platform Threads

Now that we understand the mechanics, let's summarize the differences.

## Key Comparison

| Criterion          | Platform Thread          | Virtual Thread                          |
|--------------------|--------------------------|-----------------------------------------|
| OS Mapping         | 1:1                      | M:N (Many VTs over few carriers)        |
| Stack Memory       | Fixed (512KB to 1MB)     | Dynamic frames in heap                  |
| Creation Cost      | Heavy (OS System Call)   | Light (JVM internal)                    |
| Scheduler          | OS Scheduler             | JVM `ForkJoinPool`                      |
| Blocking I/O       | Occupies thread          | Unmounts and returns carrier            |
| Suitable Tasks     | CPU-intensive            | I/O-intensive                           |

The more waiting and short-lived tasks you have, the greater the benefit of Virtual Threads.
For tasks that use the CPU continuously without yielding, Virtual Threads offer little advantage over platform threads because there are no opportunities to yield the carrier.

## When Is It Most Effective?

The benefits are most pronounced in I/O-intensive workloads, such as external API calls, database queries, and message processing.
Conversely, for CPU-bound tasks like image encoding or complex calculations, the number of cores remains the bottleneck, so switching to Virtual Threads won't yield significant improvements.

The newsletter dispatch scenario, where most of the time is spent waiting for SMTP responses, is a perfect use case for Virtual Threads.

<br>

# Conclusion

Perhaps more important than the ability to create more threads is the fact that threads no longer need to be held captive by waiting. Instead, they gracefully yield their carrier.
This single concept explains why Virtual Threads make such a dramatic difference in I/O-intensive workloads and why they offer little for CPU-bound tasks.

Of course, in practice, this ideal picture can sometimes break down.
Situations where carriers become stuck and how to identify them will be covered in the next post.

- <a href="/en/post/java-virtual-thread-pinning-and-pitfalls" target="_blank">Java Virtual Thread: Understanding and Mitigating Pinning</a>
