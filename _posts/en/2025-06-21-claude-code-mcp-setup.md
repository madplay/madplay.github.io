---
layout: post
title: "How to Connect MCP Servers to Claude Code and What to Watch For"
author: madplay
tags: claude-code mcp anthropic automation
description: "With MCP, Claude Code can work with external systems as well. This post explains how to connect an MCP server."
category: AI
lang: en
slug: claude-code-mcp-setup
permalink: /en/post/claude-code-mcp-setup
date: "2025-06-21 20:41:09"
comments: true
---

# External Tool Integration and MCP
Claude Code can read files and edit code on its own, but it cannot directly access external systems such as issue trackers or operational logs.
That is where MCP, the Model Context Protocol, comes in. MCP is the protocol that lets Claude Code reach external data sources and tools.
The body of a power drill stays the same, but changing the bit makes screwing, drilling, and polishing possible.
In the same way, connecting MCP servers changes the range of information Claude Code can access.

On June 18, 2025, remote MCP server support was added to Claude Code.
Before that, MCP servers could only be connected locally through stdio.
After the update, Claude Code could connect to remote servers over Streamable HTTP with OAuth authentication.
That means a server provider only has to expose a URL. There is no need to launch a local process manually, and authentication runs once in the browser while the access token is stored locally.

<br>

# Commands for Adding MCP Servers

The basic command for adding an MCP server in Claude Code is `claude mcp add`.
There are three forms depending on the transport.

## Remote HTTP Server

This connects to a remote server over Streamable HTTP.
It is also the method recommended in Anthropic's official documentation.
If only the URL is provided, there is no need to launch a local server process, and updates or scaling remain the server provider's responsibility.
If the server requires authentication, the browser opens on first connection and runs OAuth, then stores the issued token locally.

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

## Remote SSE Server

This is the older approach from before HTTP support. As of June 2025, it is deprecated.
Existing servers built with SSE can still work, but new setups should prefer HTTP.

```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

## Local stdio Server

This method runs the MCP server as a local process. The command to execute comes after `--`.

```bash
claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
```

If environment variables are required, pass them with `--env`.

```bash
claude mcp add --transport stdio --env GITHUB_TOKEN=ghp_xxx github -- npx -y @modelcontextprotocol/server-github
```

There is one important detail:
Options such as `--transport`, `--env`, and `--scope` must appear **before** the server name.
If the order changes, argument parsing fails.

Use the command below to inspect the list of configured servers.

```bash
claude mcp list
```

<br>

# Scope of an MCP Server

When adding an MCP server, the `--scope` option controls where the configuration applies.

```bash
# Use only in the current project (default)
claude mcp add --scope local github -- npx -y @modelcontextprotocol/server-github

# Team-shared: saved to .mcp.json and can be committed to the repository
claude mcp add --scope project github -- npx -y @modelcontextprotocol/server-github

# Use in every project
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github
```

If a server is added with `project` scope, the configuration is stored in `.mcp.json` at the project root.
If that file is committed, teammates can use the same MCP server configuration.

Does that expose authentication tokens in `.mcp.json`?
No. Values passed through `--env` are stored separately in a local configuration file, not in `.mcp.json`.
That means the server definition can be shared with `project` scope while tokens remain managed in each developer's local environment.

<br>

# What Happens After Integration

Once an MCP server is connected, Claude Code calls its tools automatically when a request needs them.

For example, imagine that a GitHub MCP server is connected and the user sends a request like this.

```text
Analyze the cause of issue ISSUE-1234 and propose the smallest relevant patch in the codebase.
Show the changed files and a test strategy as well.
```

While handling that request, Claude Code can fetch issue data through the GitHub MCP server, inspect relevant code in the local file system, and combine both sources into a proposed patch.
The developer does not need to specify each step explicitly, such as "look up the issue first, then find the code."
Claude Code decides the order of tool calls itself.

<br>

# What to Do When Remote MCP Authentication Fails

The most common failure when using a remote MCP server is expired OAuth authentication.
If the token has expired when a tool call happens, Claude Code cannot use that MCP server and the request either stops or falls back.

Check the current state with these commands.

```bash
claude mcp list
claude mcp get notion
```

If the server requires authentication, run `/mcp` to reopen the browser authentication screen and authenticate again.

```bash
/mcp
```

<br>

# References
- <a href="https://www.anthropic.com/news/claude-code-remote-mcp" target="_blank" rel="nofollow">Anthropic: Remote MCP support in Claude Code</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/mcp" target="_blank" rel="nofollow">Claude Code: Connect to tools via MCP</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release Notes</a>
