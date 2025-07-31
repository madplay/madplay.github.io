---
layout:   post
title:    "Fix xcrun: invalid active developer path After a macOS Upgrade"
author:   Kimtaeng
tags:    macos monterey xcode
description: "How to fix the \"xcrun: error: invalid active developer path\" error after upgrading macOS"
category: Knowledge
date: "2022-04-21 01:22:54"
comments: true
slug:     invalid-active-developer-path-error-after-upgrading-to-macos-monterey
lang:     en
permalink: /en/post/invalid-active-developer-path-error-after-upgrading-to-macos-monterey
---

After upgrading macOS, `git` often does not run correctly. I recently updated to Monterey and hit the same error again.
The message was identical to what I saw when I upgraded to Catalina. ~~(It seems to happen almost every upgrade.)~~

`xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun`

You can reproduce the error by running development commands such as `git` or `gcc` in Terminal.

```bash
$ git
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
```

The fix is simple. Install the command line tools with `xcode-select --install`.

```bash
$ xcode-select --install
```

Depending on your environment, installation time varies. In my case, it took about 10 minutes.
