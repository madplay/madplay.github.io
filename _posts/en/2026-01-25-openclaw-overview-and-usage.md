---
layout: post
title: "OpenClaw: A Self-Hosted AI Agent Connected to Messenger Channels"
author: madplay
tags: openclaw ai-agent gateway llm self-hosted
description: "Organizes OpenClaw's architecture, installation flow, channel integration, skills, and security boundaries as of February 2026."
category: AI
lang: en
slug: openclaw-overview-and-usage
permalink: /en/post/openclaw-overview-and-usage
date: "2026-01-25 11:32:18"
comments: true
---

# OpenClaw

Attaching an AI agent to a team channel usually means wiring together a messenger API, session storage, model integration, and permission control by hand.
Even for personal use, if the conversation stays trapped inside an external service UI, it becomes difficult to control operational boundaries and data location.
OpenClaw is a tool that bundles this setup into one local gateway and creates a self-hosted path between a messenger and an AI model.
As of February 2026, the official documentation and repository make it clear that this project is closer to an agent runtime connected to messengers than to a simple channel connector.

In November 2025, the project's initial name was `Clawdbot`.
After passing through `Moltbot`, it began using the name `OpenClaw` on January 30, 2026.

The center of OpenClaw is the gateway.
The gateway receives messages, sends them to the model, returns responses to the channel, and in the middle manages sessions, mention rules, allowed users, skills, and local workspace access.

<br>

# Ideal Use Cases

The situations where OpenClaw shines are fairly clear.
First, when a team wants to use AI inside the messenger it already uses.
Second, when it wants to manage channel integration and model integration on an infrastructure it controls instead of through an external SaaS UI.
Third, when the use case needs more than simple Q&A and includes agent-style work such as file access, command execution, or skill invocation.

On the other hand, if all that is needed is a simple FAQ bot with no permissions, OpenClaw might be overkill.
In many cases, a combination of the official bot API for the messenger platform and a serverless function is enough.
OpenClaw becomes more meaningful when there are multiple channels,
or when the same agent must be connected to multiple messengers and local tools at once.

The configuration below, such as "a commercial model for one channel and a local model for another," is also a pattern that gets mentioned frequently in real-world scenarios.

```json5
{
  "routing": {
    "telegram": { "provider": "anthropic" },
    "discord": { "provider": "ollama" }
  }
}
```

This is useful when cost and response quality need to be balanced together.
For example, customer-facing channels can use a commercial model, while internal experiment channels can use a local model.
In practice, "one model for everything" is less common than splitting by channel characteristics.

<br>

# Core Concepts: Gateway, Channel, and Skill

Understanding OpenClaw comes down to three core terms:
gateway, channel, and skill.
The gateway is the central process that handles message I/O and sessions.
A channel is a messenger integration point such as Telegram, Slack, or Discord.
A skill is additional guidance or execution logic that the agent can use.

According to the official repository README and documentation, the supported range is fairly broad.
The built-in channels include WhatsApp, Telegram, Slack, Discord, Google Chat, Signal,
iMessage, Microsoft Teams, and WebChat, and custom channels can also be attached.

Looking at the structure in configuration makes it clear that the gateway acts as a single source of truth.

```json5
{
  "channels": {
    "telegram": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "messages": {
    "groupChat": {
      "mentionPatterns": ["@openclaw"]
    }
  }
}
```

With settings like these, the agent responds in a group chat only when there is an explicit mention.
This rule is enforced at the gateway layer first, not in the model prompt.
In other words, OpenClaw decides which messages are allowed through before the model even gets a chance to answer.

This distinction is crucial for operations.
Even if each messenger platform has a different permission model and event shape,
the gateway becomes a common entry point, so channel-specific logic does not have to be reimplemented as application code.

<br>

# From Installation to Your First Chat

As of February 2026, the official getting-started documentation provides an install script for macOS/Linux,
a PowerShell script for Windows, and an npm installation path.
Node.js 22 or later is required, so the runtime version should be checked first.

```bash
node --version

# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash

# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex

# npm
npm install -g openclaw@latest
```

After installation, the first commands most people check are the version and onboarding.

```bash
openclaw --version
openclaw onboard --install-daemon
```

`openclaw onboard --install-daemon` is not just a login command.
It is closer to one integrated flow that installs the gateway daemon, authenticates the model provider, connects a default channel, and prepares the local control UI.
The documentation guides users toward running it together with the browser-based Control UI after installation.

Gateway state can be checked like this.

```bash
openclaw gateway status
openclaw dashboard
```

The default dashboard address is `http://127.0.0.1:18789/`.
Even before any channel is connected, this is a useful place to test the model connection and the basic conversation flow first.
In practice, it is safer to verify model behavior and permission settings in the Control UI before connecting a real channel.

<br>

# How Models and Channels Connect

OpenClaw handles commercial API providers and local models together.
The official documentation lists Anthropic, OpenAI, Google, and Ollama first.
By default, configuration is stored under `~/.openclaw/openclaw.json`.

For example, a structure that stores an Anthropic API key looks like this.

```json5
{
  "models": {
    "providers": {
      "anthropic": {
        "apiKey": "sk-ant-..."
      }
    }
  }
}
```

In practice, teams usually avoid leaving this value in a file for long and move it into an environment variable or secret store.
Because the gateway tends to run as a long-lived daemon, a wrongly exposed API key has a wider blast radius.

Ollama is the most typical local-model path.
According to the docs, OpenClaw can detect and use a locally running Ollama instance.

```bash
ollama pull gemma3
ollama serve
curl http://localhost:11434/api/tags
```

One detail matters here.
Using a local model does not automatically make the whole system safer.
It does keep conversation data away from an external API, but file access and command execution permissions still reach the local host directly.

Channel integration works the same way.
For Telegram, for example, login and session connection are only the first step.
The real operational boundary appears only after allowed users and group mention policy are configured together.

```bash
openclaw channels login
openclaw gateway --port 18789
```

```json5
{
  "channels": {
    "telegram": {
      "allowFrom": ["+821012345678"],
      "groups": {
        "*": { "requireMention": true }
      }
    }
  }
}
```

`allowFrom` restricts who can talk to the agent,
and `requireMention` restricts when the agent responds in a group.
These are usually the first two values that change depending on whether the setup is for personal use or a team channel.

<br>

# Skills and the Local Workspace

What turns OpenClaw from a chat tool into an agent platform is the combination of skills and the local workspace.
Skills attach additional guidance or execution logic to the agent,
and the local workspace is the mechanism that connects file access and command execution to real directories.

According to the official documentation, OpenClaw supports both Markdown-based skills and code-based skills.
Community skills can be searched and installed through ClawHub.

```bash
npm install -g clawhub
clawhub search "calendar"
clawhub install @author/skill-name
```

Once skills are attached, the character of OpenClaw changes as well.
An agent that only answered questions can now gain tools for schedule lookup, Git work, or local file search,
which means it starts reading and modifying external state.

For that reason, it is usually better not to think about skills and workspaces separately in production.
For example, if a skill that reads a code repository is enabled,
the directory range the skill can access and the command-execution policy should be defined together.

```json5
{
  "tools": {
    "exec": {
      "ask": "always",
      "host": "sandbox"
    }
  },
  "workspace": {
    "allow": ["/srv/openclaw/workspace"]
  }
}
```

`ask: "always"` requires approval before command execution,
and `host: "sandbox"` narrows execution to the sandbox.
These settings are closer to defining a security boundary than to improving convenience.

<br>

# Security Boundaries to Inspect Before Production

The first point emphasized in OpenClaw's official security documentation is the trust boundary.
OpenClaw is closer to a tool designed for a single user or a trusted small group,
and exposing it directly like a multi-tenant service open to the public is not recommended.

This becomes easier to understand when looking at the permission model.
The agent can gain tools for reading files, writing files, running shell commands, and calling remote APIs.
If something goes wrong, the impact does not stop at "the answer was a little wrong."
It can continue all the way to local file damage or credential exposure.

The official documentation recommends running the security audit command repeatedly after changing settings.

```bash
openclaw security audit
openclaw security audit --deep
```

Before production, it is generally worth checking at least the following four points.

- Put the Control UI and API behind localhost or an authenticated proxy
- Set channel boundaries such as `allowFrom` and `requireMention` first
- Enable only the skills and tools that are actually needed
- Manage API keys and session tokens through a separate secret path instead of hardcoding them into files

If stronger isolation is needed, running the gateway inside a container or a VM is common.
This matters especially when the system is connected to a team channel and command execution is enabled.
It is safer to combine a dedicated workspace with a non-privileged runtime than to expose the entire host filesystem directly.

<br>

# The Points That Commonly Break

In practice, the most common operational problems are not the installation itself but state inspection and reconnection.
Typical cases include the gateway not starting at all, channel sessions expiring, and API keys failing to reach the actual daemon process.

For state inspection, these commands are a fast starting point.

```bash
openclaw gateway status
lsof -i :18789
```

If port `18789` is already in use, the dashboard and the gateway startup can fail together.
In daemon mode, it is also useful to inspect the actual process state through `launchctl` on macOS or `systemctl` on Linux.

When a channel disconnects, session expiration or login-state loss is usually the first suspicion.

```bash
openclaw channels login
```

Channels that support both webhooks and polling can also show sudden latency spikes when webhook registration becomes inconsistent.
In that case, the problem may be in the channel delivery path rather than in model response speed.

API key failures are similar.
Even if the key is visible in a config file, authentication still fails if the daemon process does not actually receive the environment variable.
When the service runs under a service manager, it is worth checking whether the launch script and the shell session have different environments.

If a custom configuration path is used, these environment variables are also worth checking.

```text
OPENCLAW_CONFIG_PATH
OPENCLAW_STATE_DIR
OPENCLAW_HOME
```

If the issue is hard to reproduce, it is often faster to launch the gateway in the foreground and inspect logs first.

```bash
openclaw gateway --port 18789
```

<br>

# References

- <a href="https://docs.openclaw.ai/quickstart" target="_blank" rel="nofollow">OpenClaw Getting Started</a>
- <a href="https://docs.openclaw.ai/security" target="_blank" rel="nofollow">OpenClaw Security</a>
- <a href="https://docs.openclaw.ai/skills" target="_blank" rel="nofollow">OpenClaw Skills</a>
- <a href="https://docs.openclaw.ai/start/lore" target="_blank" rel="nofollow">OpenClaw Lore</a>
- <a href="https://github.com/openclaw/openclaw/releases" target="_blank" rel="nofollow">OpenClaw Releases</a>
