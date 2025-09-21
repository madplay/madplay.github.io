---
layout:   post
title:    Argument and Parameter
author:   madplay
tags: 	  knowledge
description: What's the difference between function arguments and parameters?
category: Knowledge
date: "2018-10-23 23:47:12"
comments: true
slug:     difference-between-argument-and-parameter
lang:     en
permalink: /en/post/difference-between-argument-and-parameter
---

# Weren't They the Same?
Sometimes arguments and parameters are mixed and used without much distinction.
But strictly speaking, the two terms differ.

First, consider **parameter**. It refers to variables declared in a function definition.

Example:

```js
// Here, x and y are parameters.
function foo(x, y) {
    // ... something
}
```

Next, consider **argument**. It refers to the actual values passed when calling a function.

```js
// Here, 2 and 3 are arguments.
foo(2, 3);
```

With this distinction, it is common to think of parameters as variables and arguments as values.
