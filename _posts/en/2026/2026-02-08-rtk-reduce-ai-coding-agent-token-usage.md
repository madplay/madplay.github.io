---
layout: post
title: "I Only Compressed CLI Output, Yet Tokens Dropped by 80%?"
author: madplay
tags: rtk token-optimization ai-coding-agent cli-proxy
description: "Just by prepending 'rtk' to a command, the agent's token consumption was reduced by 80%. We explore the operational mechanics of the open-source CLI proxy RTK (Rust Token Killer), how to install it, and where it hits its limits."
category: AI
date: "2026-02-08 22:15:00"
comments: true
lang: en
slug: rtk-reduce-ai-coding-agent-token-usage
permalink: /en/post/rtk-reduce-ai-coding-agent-token-usage
---

# Where Are All These Agent Tokens Leaking?

While working with an AI coding agent like Claude Code, you realize that a significant portion of tokens is consumed not by actual reasoning but by reading command outputs. Running `git status` once dumps dozens of lines listing changed files, branch information, and untracked files. Running tests uploads hundreds of passing test items into the context entirely.

However, all the agent really needs are "which files changed" and "which tests failed." **The rest is mostly token waste.** The tokens consumed by such outputs in a 30-minute work session easily exceed 100,000 tokens.

**RTK (Rust Token Killer)** is an open-source CLI proxy that addresses this exact problem. **Before passing command outputs to the agent, it filters and compresses them, uploading only the necessary information into the context.** Written in Rust, a systems programming language, it functions as a single binary without the need for a separate runtime. It can be used in terminal-based AI coding agents like Claude Code and OpenCode, reducing token consumption by 60 to 90%.

<br>

# How Does RTK Reduce Tokens?

RTK operates as an intervening proxy between the command and the agent. If you run `rtk git diff` instead of executing `git diff` directly, RTK receives the original output, compresses it using the following four strategies, and then passes it to the agent.

- **Smart Filtering**: Removes content that does not affect the agent's judgment, such as comments, blank lines, and boilerplate.
- **Grouping**: Bundles similar items together. Common examples include file lists by directory or lint warnings by rule.
- **Truncation**: Retains highly relevant parts while cutting off repetitive content.
- **Deduplication**: If the same log message repeats 200 times, it compresses it into a single line indicating the count.

By combining these strategies, the output of `git push` reduces from 15 lines (about 200 tokens) to 1 line (about 10 tokens). The overhead added per command is less than 10ms, and there are no external runtime dependencies.

<br>

# Installation and Automatic Hook Configuration

There are three ways to install it. Homebrew is the simplest.

```bash
# Homebrew (macOS, Linux) - Recommended
brew install rtk-ai/tap/rtk

# Installation Script
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo (Rust Environment)
cargo install --git https://github.com/rtk-ai/rtk
```

The first thing to do after installation is to configure the automatic hook.

```bash
rtk init --global
```

This single command registers the <a href="/en/post/claude-code-settings-json" target="_blank">Bash hook for Claude Code</a>. From then on, whenever the agent runs `git status`, the hook automatically transforms it into `rtk git status`. From the agent's perspective, nothing has changed, but the returned output is compressed.

RTK itself is not exclusive to Claude Code. It officially supports OpenCode (`rtk init -g --opencode`), and for other agents, manually prepending `rtk` to commands yields the same effect. The following examples assume Claude Code.

<br>

# Which Commands Are Supported?

The range of commands RTK supports for compression is quite broad.

| Category | Representative Commands | Compression Method | Savings Rate |
|------|-----------|----------|--------|
| Git | `status`, `diff`, `log`, `push`, etc. | Removes unchanged file info | 75~92% |
| Test Runner | `cargo test`, `pytest`, `vitest`, `go test` | Compresses passed items by count, prints only failed details | 90% |
| Linter/Build | `eslint`, `tsc`, `ruff`, `cargo clippy` | Grouping by rule/file | 80~85% |
| File Search | `ls`, `cat`, `grep`, `find` | Tree cleanup, signature extraction | 70~80% |
| Others | `gh`, `pnpm`, `docker`, `kubectl`, `curl` | Format compression, deduplication | 75~80% |

It supports nearly all subcommands for Git, and test runners offer the greatest savings. Most commands frequently used during Claude Code sessions are included.

<br>

# Actual Savings in a 30-Minute Session

A benchmark of working for 30 minutes in a mid-sized TypeScript/Rust project provides the full picture.

- Reference: <a href="https://github.com/rtk-ai/rtk#token-savings-30-min-claude-code-session" target="_blank" rel="nofollow">RTK Token Savings Benchmark</a>

| Command | Execution Count | Normal Output (Tokens) | RTK Output (Tokens) | Savings Rate |
|--------|----------:|---------------:|--------------:|-------:|
| ls/tree | 10 | 2,000 | 400 | 80% |
| cat/read | 20 | 40,000 | 12,000 | 70% |
| grep/rg | 8 | 16,000 | 3,200 | 80% |
| git status | 10 | 3,000 | 600 | 80% |
| git diff | 5 | 10,000 | 2,500 | 75% |
| git log | 5 | 2,500 | 500 | 80% |
| git add/commit/push | 8 | 1,600 | 120 | 92% |
| cargo/npm test | 5 | 25,000 | 2,500 | 90% |
| lint (ruff, etc.) | 3 | 3,000 | 600 | 80% |
| pytest | 4 | 8,000 | 800 | 90% |
| **Total** | | **Approx. 111,000** | **Approx. 23,200** | **80%** |

This means roughly 88,000 tokens can be saved in a single session. In environments where multiple sessions run per day, the savings grow substantially.

## How Do You Track Savings Status?

RTK records the command execution history and the amount saved in a local database.

```bash
# Overall savings summary
rtk gain

# 30-day daily trend displayed as an ASCII graph
rtk gain --graph

# Daily detailed breakdown
rtk gain --daily

# Export in JSON format
rtk gain --all --format json
```

Running `rtk discover` analyzes commands executed without RTK and provides estimates indicating, "If this command had been run through RTK, it would have saved this much." This is useful in the early stages of adoption to determine which commands offer the greatest impact.

## What If You Need the Original Output of a Failed Command?

While it is great for the agent when RTK compresses outputs, there are cases where the original output is needed for debugging. To accommodate this, RTK provides a tee feature. When a command fails, it saves the unfiltered original output to a local file.

```text
FAILED: 2/15 tests
[full output: ~/.local/share/rtk/tee/1707753600_cargo_test.log]
```

The agent views the compressed failure information first, and if necessary, reads the saved full output for detailed analysis. Since there is no need to re-execute the command, both tokens and time are preserved.

<br>

# Things to Know Before Use

It is not a silver bullet. There are a few things to note before deploying it.

**The scope of the hook is limited.**
RTK's automatic hook only operates when Claude Code invokes the Bash tool. Since Claude Code's built-in tools like Read, Grep, and Glob do not go through Bash, the hook cannot intervene. Essentially, file readings or searches handled by internal tools are not targeted by RTK's compression. However, since these tools already provide optimized output, the practical loss is minimal.

**Output compression is not always beneficial.**
RTK operates by filtering out information it deems "unnecessary" for the agent. However, information deemed "unnecessary" might actually be required in some cases. In fact, an issue has been reported where RTK compressed Playwright test outputs so aggressively that the agent failed to debug an E2E failure. In such cases, you can use `rtk proxy <command>` to receive the original output without filtering.

- <a href="https://github.com/rtk-ai/rtk/issues/690" target="_blank" rel="nofollow">GitHub Issue: rtk compresses Playwright test output too aggressively</a>

**Possibility of name collisions.**
A package with the identical name "Rust Type Kit" exists on crates.io. Running `cargo install rtk` might install the wrong package, so it is safer to install using the format `cargo install --git https://github.com/rtk-ai/rtk` or rely on Homebrew.

<br>

# So, Is It Worth Using?

Personally, after adopting RTK, I found the amount of tokens saved to be quite substantial, proving it highly useful. However, when combining Bash commands in agent skills, I occasionally encountered collisions with the RTK hook. In those situations, I adapted by bypassing with `rtk proxy` or adding the command to the hook exceptions.

It is worth noting that RTK is not an official feature of Claude Code but a third-party tool utilizing a custom hook.

<br>

# References

- <a href="https://github.com/rtk-ai/rtk" target="_blank" rel="nofollow">RTK(Rust Token Killer) GitHub Repository</a>