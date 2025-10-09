---
layout:   post
title:    "How to Fix a Node.js Project Not Being Recognized in IntelliJ"
author:   Kimtaeng
tags:     coupling cohesion module
description: "How to resolve the \"Unresolved function or method for require()\" warning when developing a Node.js project with IntelliJ IDEA/WebStorm"
category: Knowledge
lang: en
slug: how-to-fix-unresolved-function-or-method-in-intellij
permalink: /en/how-to-fix-unresolved-function-or-method-in-intellij/
date: "2020-08-02 22:42:59"
comments: true
---

# “Unresolved function or method” for require()
When you create or reopen a Node.js project in `IntelliJ IDEA` or `WebStorm`, you may see warnings such as
`"Unresolved function or method" for require()` in module declarations that use `require`.

The application may still run, but productivity drops because the IDE does not fully recognize the Node.js project,
for example, you cannot navigate to module usages.

In this case, enable the `Coding assistance for Node.js` option.
On macOS, go to `Preferences` -> `Languages & Frameworks` -> `Node.js and NPM`.

<img class="post_image" width="600" alt="nodejs and npm settings"
src="{{ site.baseurl }}/img/post/2020-08-02-how-to-fix-unresolved-function-or-method-in-intellij-1.jpg" />

Additionally, you can use `Manage Scopes` to define libraries used in specific files or directories.
By default, the `node_modules` path under the current project is included.
