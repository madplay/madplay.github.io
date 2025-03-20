---
layout:   post
title:    Server-Side Rendering vs Client-Side Rendering
author:   Kimtaeng
tags: 	  serverside clientside rendering SPA
description: What is the difference between server-side rendering (SSR) and client-side rendering (CSR)?
category: Knowledge
comments: true
slug:     server-side-rendering-vs-client-side-rendering
lang:     en
permalink: /en/post/server-side-rendering-vs-client-side-rendering
---

# Rendering

**Rendering** means drawing the requested web page on the screen.
Depending on where the resources are interpreted and rendered, it falls into **server-side rendering (SSR)** or **client-side rendering (CSR)**.

Let’s look at each approach in more detail.

<br/>

# Server-Side Rendering

This is the traditional rendering model for web applications.
When a user navigates to a page, the browser requests it from the server.
The server resolves resources such as HTML, renders the page, and sends it back.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-11-26-server-side-rendering-client-vs-side-rendering-1.png" width="500" height="300" alt="server side rendering"/>

With **server-side rendering**, every request triggers a full page refresh and a new request to the server.
It is like going to a department store every time you want a new outfit.

As mobile usage grew and the amount of information increased, the old model became less suitable.
This led to **SPA (Single Page Application)**.

<br/>

# Single Page Application

An **SPA (Single Page Application)** loads the full page once, then updates only the data it needs instead of requesting a full page each time.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-11-26-server-side-rendering-client-vs-side-rendering-2.png" width="550" height="350" alt="single page application"/>

Instead of requesting a new page for every navigation like SSR, the server responds once at the initial load.
After that, client-side scripts update the page or data as needed.
This is **client-side rendering (CSR)**.

Think of it as visiting the store once, picking outfits for a while, and storing them in your closet.
When you need a new outfit, you grab it from the closet instead of going back to the store (server).

Compared to SSR, CSR avoids full page refreshes for each request and reduces server traffic.
For users, it provides smoother interaction. The server only delivers data, and the client renders the UI via scripts.

<br/>

# Which One Is Better?

Comparing the characteristics of each model makes the trade-offs clear.

**Server-side rendering** renders the view on the server, so the **initial load** is relatively fast.
If the page uses JavaScript, the scripts run only after all required assets load, so there is no interaction during loading.
From the user’s perspective, the content appears quickly.

**Client-side rendering** loads HTML and JavaScript for page composition and renders in the browser.
That makes the initial load slower than SSR. However, after the initial load, it avoids full page requests and enables faster interactions.

**Security** is another factor. SSR often uses sessions to manage user data.
CSR typically relies on cookies stored on the client.

**Search engine optimization** also matters. Many bots and crawlers do not execute JavaScript.
If your page must be reliably indexed, CSR can be a liability because crawlers may see an empty page.

Google’s crawler, however, executes code when it encounters a `<script>` tag and manipulates the DOM like a real browser.
In Google Search Console, you can inspect how the crawler sees your page by entering a URL.

Finally, a common confusion: **client-side rendering does not always mean SPA**.
Instead, **SPAs use client-side rendering**, and **traditional multi-page apps use server-side rendering**.

<div class="post_caption">This post references
<a href="https://medium.com/@adamzerner/client-side-rendering-vs-server-side-rendering-a32d2cf3bfcc"
rel="nofollow" target="_blank"> Adam Zerner - Client-side rendering vs. server-side rendering </a>.</div>
