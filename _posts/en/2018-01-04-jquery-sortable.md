---
layout:   post
title:    jQuery Sortable (Implementing Sorting with Drag and Drop)
author:   Kimtaeng
tags: 	  jquery jqueryui
description: Implementing drag & drop sorting with jQuery UI!
category: Script
comments: true
slug:     jquery-sortable
lang:     en
permalink: /en/post/jquery-sortable
---

# jQuery UI Sortable
Implementing sorting through drag & drop events using jQuery.
We'll use Sortable from the jQuery User Interface Library. For detailed introduction, please refer to the link below.

- <a href="https://jqueryui.com/sortable" target="_blank" rel="nofollow">Link: Go to jQuery-UI Guide Page</a>

First, to use this library, you need related script files. You can link them or download them directly.
(If downloading directly, it's convenient to get them through bower after installing node.js)

After checking links or downloading files, declare the script file paths in the `<head>` section of the page where you'll implement Sortable as follows.

```javascript
<!-- Set file path directly -->
<script src="path/jquery.min.js" type="text/javascript"/>
<script src="path/jquery-ui.js" type="text/javascript"/>

<!--
    Set link path directly
    jQuery CDN reference https://code.jquery.com/
-->
<script src="https://code.jquery.com/jquery-3.2.1.min.js" type="text/javascript"/>
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" type="text/javascript"/>
```

<br/>

# Implementing Sortable
Using jQuery UI Sortable. Usage is as follows:

```javascript
$('.selector').sortable();

$.(.selector').sortable({
	/* Can specify what to apply or disable sorting */
	items: $('.selector')

});
```

You can check it in **jsfiddle** where I tested for this post.

- <a href="https://jsfiddle.net/Kimtaeng/xo8neqpL/1/" target="_blank" rel="nofollow">Go to Example Page (jsfiddle)</a>

The example I wrote is simple but provides more features. You can also control drag direction horizontally or vertically.

```javascript
$('.selector').sortable({
	axis: 'x' /* or write y. */
})

/* Can be applied at initialization, but can also be set afterward. */
$('.selector').sortable('option', 'axis', 'x');

/* Can also retrieve what was set. */
var axis = $('.selector').sortable('option', 'axis');
```

Of course, you can also get information about the position where dragging started and where it was dropped.

```javascript
$('.selector').sortable({
	item: $('.selector'),
	start: function(event, ui) {
	    console.log('start point : ' + ui.item.position().top);
    },
    end: function(event, ui) {
        console.log('end point : ' + ui.item.position().top);
    }
})
```

Since the object being dragged or dropped is contained in the arguments of methods provided by Sortable, you can also access through index if configured as an array.
