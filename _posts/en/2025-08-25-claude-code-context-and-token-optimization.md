---
layout: post
title: "How to Manage Claude Code Context and Reduce Token Usage"
author: madplay
tags: claude-code context token compact session
description: "Longer sessions slow down due to the context window. Learn how to manage token usage with /compact, /clear, and /cost."
category: AI
date: "2025-08-25 22:09:31"
comments: true
lang: en
slug: claude-code-context-and-token-optimization
permalink: /en/post/claude-code-context-and-token-optimization
---

# Token Consumption Structure
When using Claude Code, users often notice that while the tool answers quickly early in a session, it slows down during the later stages despite receiving similar questions.
This happens because of the context window mechanism. Just as packing light makes traveling easier, keeping the context minimal makes sessions faster and more accurate.

Claude Code's context window encompasses the entire conversation history of the current session, the system prompt, and the contents of read files.
Because the entire previous conversation is sent along with each new message, token consumption for every request increases cumulatively as the conversation lengthens.
Consequently, the 10th request processes while containing the history of conversations 1 through 9.

<br>

# /compact and /clear: Two Initialization Methods

There are two commands to manage an expanding context.

## /compact

`/compact` summarizes and compresses the conversation history up to the present point.
Rather than discarding the previous conversation entirely, it replaces the history with a summary containing only essential information.

```bash
/compact
```

Users can also explicitly designate the content to preserve.

```bash
/compact keep only coding patterns and decisions
```

Executing this command prompts Claude Code to analyze the conversation and categorize it into "information to preserve" and "information to summarize."
It preserves details like project configurations, coding patterns, and recent code changes, while replacing exploratory dialogue or resolved debugging processes with brief summaries.

When is the best time to run `/compact`?
Since auto-compact triggers automatically around the 75% threshold, executing it manually beforehand is helpful if you want to dictate the preserved context explicitly.
You can check your current usage with the `/cost` command.

```bash
/cost
```

## /clear

`/clear` completely deletes the conversation history and initializes a blank state.
Unlike `/compact`, no previous context remains.

```bash
/clear
```

This is useful when the task completely changes or when the previous conversation impedes the current task.

<br>

# auto-compact: Automatic Compression

Claude Code also features an `auto-compact` capability.
This function automatically executes `/compact` when the context window approaches its limit.
It activates by default, and users can verify its current status via the `/config` command.

```bash
/config
```

When auto-compact activates, the session continues uninterrupted.
However, because automatic compression does not always summarize exactly as intended, manually executing `/compact` and explicitly defining the content to preserve provides a safer route for sessions containing critical context.

<br>

# CLAUDE.md and Recurring Context

A common cause of wasted tokens is repeating the same background explanation at the start of every session.
Inputting descriptions like "Our project utilizes Spring Boot, Kotlin, and Gradle builds..." at the beginning of each session consumes tokens accordingly.

Using a `CLAUDE.md` file eliminates this repetition. Placing a `CLAUDE.md` file in the project root prompts Claude Code to read it automatically at session startup and include it in the system prompt.

```markdown
# Project Overview
Spring Boot 3.2 + Kotlin, Gradle Build

# Tests
./gradlew test

# Code Style
- Variables/Functions: camelCase
- Maximum 30 lines per function
- Use data class for DTOs, regular class for entities
```

Documenting project background, build commands, and coding conventions in this file essentially reduces the "background explanation tokens" for each session to near zero.

<br>

# Criteria for Splitting Sessions

Mixing various task types within a single session accumulates unnecessary context.
If a user resolves a bug and subsequently sends a refactoring request within the same session, the file contents and dialogue from the bug-fixing process carry over into the refactoring context.

Starting a new session when the task changes keeps the context window small.

```bash
# Start a new session after ending the current one
claude

# Or initialize within the session
/clear
```

While teams vary in how they split sessions, a good rule of thumb is "one session per PR."
In this structure, a bug fix PR, a feature addition PR, and a refactoring PR each get their own session.

<br>

# Checking Usage with /cost

The `/cost` command reveals the token amount consumed within the current session.

```bash
# For API billing users
/cost
```

> The `/stats` command was added in December 2025 (v2.0.64). Subscription (Pro/Max) users utilize it to review usage patterns and statistics.

```bash
# For Subscription (Pro/Max) users
/stats
```

According to the official Anthropic documentation, the average cost for Claude Code hovers around $6 per developer daily, with 90% of users spending under $12 daily.
Based on the Sonnet 4 model, API token pricing stands at $3 per 1 million input tokens and $15 per 1 million output tokens.

If costs exceed expectations, two scenarios merit investigation.
The first involves prolonged sessions that transmit massive contexts with every request.
The second involves Claude Code executing repetitive, expansive searches due to vaguely defined request scopes.

<br>

# References
- <a href="https://docs.anthropic.com/en/docs/claude-code/costs" target="_blank" rel="nofollow">Claude Code: Manage costs effectively</a>
- <a href="https://docs.anthropic.com/en/docs/build-with-claude/context-windows" target="_blank" rel="nofollow">Anthropic Docs: Context windows</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release Notes</a>
