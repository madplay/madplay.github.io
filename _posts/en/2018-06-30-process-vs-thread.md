---
layout:   post
title:    Difference Between Process and Thread
author:   Kimtaeng
tags: 	  OS Process Thread
description: What differences do processes and threads have?
category: Knowledge
comments: true
slug:     process-vs-thread
lang:     en
permalink: /en/post/process-vs-thread
---

# Difference Between Process and Thread

What differences do processes and threads have? Related books define them like this.

<div class="post_caption">A process is a unit of work that receives resource allocation from the operating system,<br/>
and a thread is a unit of execution that uses resources allocated to processes.</div>

First, learning easily through a diagram:

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-06-30-process-vs-thread-1.jpg" width="300" height="310" alt="Process and Thread"/>

You can easily see the difference just from the figure above. Comparing in a bit more detail!

First, there's a difference in ```memory usage```.
Processes receive and use their own unique memory. So they execute independently.
They receive processors from the operating system and also receive address spaces, memory resources, etc.
On the other hand, threads execute by sharing address spaces or resources within processes, like ```multiple flows within one process```.

If we view this as a diagram, it can be seen as follows.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-06-30-process-vs-thread-2.jpg" width="500" height="350" alt="Usage Memory"/> 

Due to such characteristics, switching speed between threads is faster than switching between processes.
But that doesn't mean threads only have advantages. Errors can occur due to incorrect resource sharing between threads.

<br/>

# In Summary,
 
```Thread Advantages```
- Program response time is shortened and system resource consumption is reduced.
- Communication methods between threads are much simpler than communication methods between processes.

```Thread Disadvantages```
- Individual threads cannot be controlled outside processes.
- Errors can occur when subtle time differences or incorrect variables are shared between threads.
- Program debugging is relatively difficult, and effects are difficult to expect in Single Processor systems.
