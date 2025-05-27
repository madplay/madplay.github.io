---
layout: post
title: "How to Install Claude Code and Run It for the First Time"
author: madplay
tags: claude-code anthropic ai-coding cli
description: "Install Claude Code, Anthropic's terminal-based agentic coding tool, and walk through the first run."
category: AI
lang: en
slug: claude-code-install-and-first-run
permalink: /en/post/claude-code-install-and-first-run
date: "2025-05-23 09:17:42"
comments: true
---

# Claude Code
Claude Code is a terminal-based agentic coding tool built by Anthropic.
It first appeared as a research preview in February 2025, then reached general availability on May 22 of the same year at the "Code with Claude" event.
It is not an IDE plugin. It runs directly in the terminal as a CLI, and it can read project files, edit code, run tests, and even create Git commits automatically.

At first, the idea of using an AI tool in the terminal can feel unfamiliar.
But while IDE autocomplete helps line by line, Claude Code is closer to a tool that helps at the file level or the task level.
It is the difference between telling a taxi driver "turn right here" one step at a time and saying "please take me to this address" in a single instruction.

<br>

# Installation

There are two main ways to install Claude Code: through npm or through the native installer.

## Install with npm

> As of October 2025, npm installation is deprecated. Unless compatibility is the goal, the native installer is the better choice.

Install it in an environment where Node.js 18 or later is already present.

```bash
npm install -g @anthropic-ai/claude-code

claude --version
```

The `-g` flag means a global installation, so the `claude` command is available from any directory after installation.
`sudo npm install -g` is best avoided because it can create permission conflicts and security problems.
If a permission error appears, inspect ownership and permissions on the npm global directory first.

## Install with the Native Installer

> The native installer was officially released on October 31, 2025. At GA in May, npm was the only official installation method.

This method works without Node.js.
After October 2025, Anthropic's official documentation also recommends it first.

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew
brew install --cask claude-code
```

Whichever method is used, `claude --version` is the simplest way to confirm that the installation succeeded.

<br>

# First Run and Authentication

After installation, run `claude` in the project directory.

```bash
cd ~/workspace/order-service
claude
```

The first launch starts Anthropic account authentication.
A browser opens to the login page, and once authentication completes, control returns to the terminal.

Even after authentication, execution can sometimes fail.
When it does, it is usually because the current directory is not a Git repository, or the shell is on a different branch from the one intended.

```bash
pwd
git branch --show-current
git status -s
```

Claude Code identifies the project based on the current directory and Git state at launch time.
Running it from the repository root is usually the most stable option.

<br>

# How to Write Requests

When writing a prompt, it is usually best to separate the scope, output format, and constraints. This reduces the need for back-and-forth.

```text
Find the parts of OrderEventConsumer that can produce an NPE.
Show the result as a list of changed files, three lines of reasoning, and test code.
```

```text
Patch the missing timeout handling in PaymentService.
Do not change the public API signature, and propose two unit tests together with the patch.
```

In the first example, `OrderEventConsumer` defines "where," `NPE-prone code path` defines "what," and `changed files + reason + tests` defines "in what form."
A short request that separates those three elements usually produces better results than one long sentence that mixes them together.

So what makes a request vague?

```text
Improve code quality across our whole service.
```

If the scope is "the whole service" and the criterion is "quality," Claude Code has a weak basis for deciding where to start.
Responses get longer, token usage rises, and the result becomes diffuse.

<br>

# References

- <a href="https://www.anthropic.com/news/claude-4" target="_blank" rel="nofollow">Anthropic: Introducing Claude 4</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/getting-started" target="_blank" rel="nofollow">Claude Code:
  Getting started</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release
  Notes</a>
