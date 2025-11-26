---
layout:   post
title:    "What Is RSS? RSS 2.0 Specification and Format"
author:   Kimtaeng
tags: 	  rss
description: "What is RSS (Rich Site Summary, Really Simple Syndication)? Let's look at RSS 2.0 specification and format."
category: Knowledge
lang: en
slug: rss2-specification
permalink: /en/rss2-specification/
date: "2020-03-05 00:03:21"
comments: true
---

# What Is RSS?
RSS stands for Rich Site Summary (also called Really Simple Syndication).
It is a specification for distributing content such as articles and blog posts more efficiently.
RSS is written in XML (eXtensible Markup Language), and every RSS file must follow XML 1.0 defined by W3C.

There are multiple standards:
- RDF (RSS 1.*)
  - RSS 0.90, RSS 1.0, RSS 1.1
- RSS 2.0
  - RSS 0.91, RSS 0.92, RSS 2.01

RSS 2.0 has been officially declared complete, and copyright is owned by Harvard University.

<br>

# Benefits and Decline of RSS
What is good about RSS? The main benefit is **convenient automatic aggregation**.
Instead of manually visiting each site for updates, RSS services let users receive selected new content without direct visits.
A simple analogy is reading articles from multiple news outlets in one place, like Naver News.

This role is served by an aggregator.
It is also called RSS reader, feed reader, news reader, or RSS collector.

Today, not only media websites but also most blogs support RSS.
~~This blog also supports RSS~~
Still, RSS usage has relatively declined.
Service usage patterns and monetization constraints contributed,
for example limited RSS output for paid conversion or difficulty inserting ads.
In the same context, Google shut down Google Reader years ago.

<br>

# RSS Structure
The top-level element `<rss>` must declare the supported RSS `version`.
And `<rss>` contains one `<channel>` element.

## Required Elements of &lt;channel>
Required elements inside `<channel>`:

| Element | Description | Example |
|-------|--------|--------|
| `<title>` | Defines channel title. If channel represents a website, it should match website `<title>`. | Hello World!
| `<description>` | Description of channel. | Welcome to Hello World!
| `<link>` | Hyperlink (URL) for channel. | http://hello-world.com



## Optional Elements of &lt;channel>
Optional elements inside `<channel>`:

| Element | Description | Example |
|-------|--------|--------|
| `<category>` | Defines one or more categories for the feed. | News
| `<cloud>` | Registers immediate update notifications for feed. | - 
| `<copyright>` | Copyright notice. | Copyright 2020, madplay
| `<docs>` | URL of documentation for feed format used. | http://blogs.law.harvard.edu/tech/rss
| `<generator>` | Program used to generate feed. | Jekyll v3.8.7
| `<image>` | Allows aggregators to display an image for feed. | -
| `<language>` | Language of feed. | ko
| `<lastBuildDate>` | Last modified date of feed content. | Tue, 19 Mar 2019 11:39:01 GMT
| `<managingEditor>` | Email address of feed content editor. | abc@abc.com
| `<pubDate>` | Last publication date of feed content. Uses RFC 822 date format. | Tue, 19 Mar 2019 11:39:01 GMT
| `<rating>` | PICS score for channel. | -
| `<skipHours>` | Hours when aggregator can skip update checks. | -
| `<textInput>` | Information about text input field shown with feed. | -
| `<ttl>` | Cache duration before refreshing source (minutes). | 30
| `<webMaster>` | Email address of feed webmaster. | -

### Child Elements of &lt;image>
`<image>` consists of required and optional elements:

| Element | Required | Description |
|-------|--------|--------|
| `<url>` | Required | URL of image file |
| `<title>` | Required | Title or description of image |
| `<link>` | Required | URL to open on image click |
| `<width>` | Optional | Image width in pixels. 88 (default) ~ 144 |
| `<height>` | Optional | Image height in pixels. 31 (default) ~ 400 |


## Required Elements of &lt;item>
`<channel>` can contain multiple `<item>` elements.
Required elements inside `<item>`:

| Element | Description | Example |
|-------|--------|--------|
| `<title>` | Item title. If item represents a web page, it should match page `<title>`. | What is RSS 2.0?
| `<description>` | Item description. | Let's learn RSS 2.0 specification.
| `<link>` | Hyperlink (URL) of item. | -


## Optional Elements of &lt;item>
Optional elements inside `<item>`:

| Element | Description | Example |
|-------|--------|--------|
| `<author>` | Email address of item author | -
| `<category>` | One or more categories for item | -
| `<comments>` | URL of comments for item | -
| `<enclosure>` | Media file attached to item | -
| `<guid>` | Unique string identifying item | -
| `<pubDate>` | Last publication date of item | enclosure
| `<source>` | Third-party source for item; RSS channel item belongs to | -

Let's briefly highlight a few optional elements.

### &lt;guid>
`<guid>` should be a unique string identifying the item.
Aggregators use this value to distinguish items.
There is no strict format, but it should be represented as plain string.

In this blog's RSS feed, `<guid>` includes `isPermaLink` as shown below.
That value indicates to RSS readers that the item is directly accessible by URL.

```xml
<guid isPermalLink="true">
    ...
</guid>
```

Default is `true`. If set to `false`, readers may treat it as non-item-specific URL.

In many cases, `<guid>` equals `<link>` (this blog also does that).
<a href="https://cyber.harvard.edu/rss/rss.html" target="_blank" rel="nofollow">RSS 2.0 at Harvard Law (link)</a>
recommends providing guid in all cases and using permalink when possible,
so aggregators can avoid re-fetching same item even when content changes.

### &lt;pubDate>
`<pubDate>` means item publication date.
Important point: if you set a future date, RSS aggregators may hide the item until that date.

<br>

# Format Example
A full RSS example based on the specification above:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hello World!</title>
    <description>Welcome to Hello World</description>
    <link>http://hello-world.com</link>
    <pubDate>Thu, 23 Jan 2020 23:41:38 +0900</pubDate>
    <lastBuildDate>Thu, 23 Jan 2020 23:41:38 +0900</lastBuildDate>
    <image>
      <title>hello world</title>
      <url>https://hello-world.com/image/image.png</url>
      <link>https://hello-world.com</link>
    </image>
    <docs>http://blogs.law.harvard.edu/tech/rss</docs>
    <generator>Jekyll v3.8.7</generator>
    <managingEdito>abc@abc.com</managingEditor>
    <webMaster>abc@abc.com</webMaster>
    <item>
      <title>Hello, World!</title>
      <link>https://hello-world.com/someExample</link>
      <description>How to build my 'hello world' program?</description>
      <pubDate>Thu, 23 Jan 2020 23:41:38 +0900</pubDate>
      <guid>https://hello-world.com/someExample</guid>
      <category>Computer Science</category>
    </item>
  </channel>
</rss>
```
