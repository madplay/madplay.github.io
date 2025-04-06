---
layout:   post
title:    Getting Started with Node.js
author:   Kimtaeng
tags: 	  nodejs 
description: What is Node.js and what makes it different? A concise introduction.
category: Nodejs
comments: true
slug:     introduction-to-nodejs
lang:     en
permalink: /en/post/introduction-to-nodejs
---

# Node.js?

**Node.js** is a server platform built on Google’s V8 JavaScript engine and first announced by Ryan Dahl in 2009.
He developed it while using Flickr, looking for a simpler way to query the server to see how many files had uploaded.

Because Node.js enables server development in JavaScript, it lowers the barrier for frontend developers to step into backend work.

That said, it is not always easy. When I first built a simple server with Node.js, gaps in understanding its characteristics caused non-trivial friction.

<br/>

# Node.js Characteristics and Strengths

First, **Node.js is JavaScript-based**. That means frontend and backend can share the same language.
For frontend developers, JavaScript makes server work more accessible.

Node.js uses **single-threaded, asynchronous I/O**.
A single thread accepts a request and does work. When it needs file, DB, or network I/O, it issues a request and continues running.
When the I/O finishes, an event triggers processing. This is an **event-driven** model.

<div class="post_caption">What do “event-driven” and “asynchronous” mean?</div>

Imagine a bank. You need to pay a utility bill, deposit into savings, and open a fund account.
If you have time, you can visit each counter in order. If the counter is busy, you wait. **(traditional server model)**

A faster approach is to take a ticket at each counter and move to the next. When your number is called, you go to that counter.
You can switch between counters as your turn comes up. **(Node.js model)**

Another analogy is a payroll day auto-transfer.
When your salary is deposited **(event)**, the system pays your bill and transfers to savings **(callback execution)**.

In traditional servers, scaling often means creating more threads.
As workload grows, the number of threads grows as well.

<br/>

# Architecture and Traits

The internal architecture of Node.js looks like this. The upper layer is JavaScript, and the lower layer is C/C++.
You may notice `libev` in older diagrams, but Node.js removed that dependency in v0.9.0.
<a href="https://stackoverflow.com/a/34566312/9212562" rel="nofollow" target="_blank">(Related link: Stack Overflow)</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-12-30-introduction-to-nodejs-1.png" width="600" height="480" alt="nodejs architecture"/>

Node.js runs on the **V8 Engine**, the JavaScript engine developed by Google for Chrome.
V8 parses JavaScript quickly and compiles it into machine code, so Node.js benefits from Chrome’s performance improvements.
As long as Google invests in V8, the engine continues to improve.
V8 is also open source.
<a href="https://github.com/v8/v8" target="_blank">(Link: V8 Engine GitHub)</a>

Node.js also fits **JSON** well. JavaScript supports JSON natively, so JSON processing is straightforward.
If your data store is MongoDB, this becomes even easier because you can avoid ORM or object-JSON conversion steps.

Although Node.js is often described as single-threaded and asynchronous, it does not use only one thread.
The event loop is single-threaded, but some I/O operations run on worker threads in a thread pool.
That keeps the event loop from blocking.

<br/>

# Closing Thoughts

From a Java-centric background, this is a short introduction to Node.js.
Even though it is a brief experience, building a server with Node.js took less time than expected.
When the data format is JSON, the code can be shorter and more direct than in Java, which is a real advantage.

In the next post, we install Node.js and print **Hello World**.

<a href="/post/nodejs-install-osx" target="_blank">Link: Install Node.js on Mac OSX and run a simple example</a> 

<div class="post_caption">This post references the following links.</div>

- <a href="https://medium.freecodecamp.org/what-exactly-is-node-js-ae36e97449f5"
rel="nofollow" target="_blank">What exactly is Node.js?</a>
- <a href="https://stackoverflow.com/questions/36766696/which-is-correct-node-js-architecture"
rel="nofollow" target="_blank">Which is correct Node.js architecture?</a>
- <a href="https://medium.freecodecamp.org/understanding-node-js-event-driven-architecture-223292fcbc2d"
rel="nofollow" target="_blank">Understanding Node.js Event-Driven Architecture</a>
