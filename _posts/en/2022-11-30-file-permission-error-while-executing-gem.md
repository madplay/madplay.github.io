---
layout:   post
title:    "Fixing gem Permission Errors (Gem::FilePermissionError)"
author:   Kimtaeng
tags:    gem ruby
description: "How to resolve Gem::FilePermissionError when running Ruby's gem package manager"
category: Knowledge
date: "2022-11-30 02:11:20"
comments: true
slug:     file-permission-error-while-executing-gem
lang:     en
permalink: /en/post/file-permission-error-while-executing-gem
---

# While executing gem ... (Gem::FilePermissionError)
When using `gem`, the package manager for Ruby, you can encounter the following error:

```bash
$ gem install bundler
...
ERROR:  While executing gem ... (Gem::FilePermissionError)
You don't have write permissions for the /Library/Ruby/Gems/2.6.0 directory.
```

You can solve this quickly with `sudo`, but changing permissions is not recommended even when the command itself is clear.
Instead, solve the problem through `rbenv`, the Ruby version manager.

<br>

# Resolve the Error
Install via <a href="https://brew.sh/index_ko" rel="nofollow" target="_blank">Homebrew</a>.
If you need to install Homebrew first, run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```


First, update Homebrew and install `rbenv` by following the <a href="https://github.com/rbenv/rbenv#homebrew" rel="nofollow" target="_blank">guide in the GitHub repository</a>.

```bash
$ brew update
$ brew install rbenv ruby-build
```

After installation, use `rbenv` to check available Ruby versions:

```bash
$ rbenv install -l
2.7.7
3.0.5
3.1.3
// omitted...
```

As of November 2022, install the latest version, 3.1.3.


```bash
$ rbenv install 3.1.3
Downloading ruby-3.1.3.tar.gz...
-> https://cache.ruby-lang.org/pub/ruby/3.1/ruby-3.1.3.tar.gz
Installing ruby-3.1.3...
ruby-build: using readline from homebrew
Installed ruby-3.1.3 to /Users/madplay/.rbenv/versions/3.1.3
```

After installation, set 3.1.3 as the global version with `rbenv` and verify that it is applied correctly:

```bash
# Set global version
$ rbenv global 3.1.3

# Check version
$ rbenv versions
  system
* 3.1.3 (set by /Users/madplay/.rbenv/version)
```

Then add the `rbenv` PATH to your shell profile. Depending on your shell, add the following to `.bashrc` for bash or `.zshrc` for zsh.

```bash
$ vi ~/.zshrc

[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

Apply the configuration with `source`.

```bash
$ source ~/.zshrc
```

Finally, run the command that previously failed. It now succeeds.

```bash
gem install bundler
Fetching bundler-2.3.26.gem
Successfully installed bundler-2.3.26
Parsing documentation for bundler-2.3.26
Installing ri documentation for bundler-2.3.26
Done installing documentation for bundler after 2 seconds
1 gem installed
```

## References
- <a href="https://stackoverflow.com/a/54873916/9212562" rel="nofollow" target="_blank">StackOverflow: You don't have write permissions for the ...</a>
