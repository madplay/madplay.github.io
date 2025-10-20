---
layout: post
title: "Claude Code Settings Files: How to Separate Shared Rules from Private Configuration"
author: madplay
tags: claude-code settings-json permissions hooks security
description: "From permission blocking to environment variable management, learn how to build safe execution boundaries by separating team security rules from personal local settings."
category: AI
date: "2025-10-17 23:11:00"
comments: true
lang: en
slug: claude-code-settings-json
permalink: /en/post/claude-code-settings-json
---

# After Context Comes Boundaries

Running `/init` to create a `CLAUDE.md` helps Claude Code understand your project context faster.
But understanding the project and knowing how far it can act are two different problems.
Knowing the build command is not enough. Without defining which sensitive files are off-limits, which commands should be blocked automatically,
and what rules the team enforces collectively, session quality may improve while operations remain fragile.

The file that addresses this is `settings.json`. If `CLAUDE.md` is the project's documentation,
`settings.json` is closer to a configuration that defines the boundaries Claude Code should never cross.
In practice, the maintenance burden is similar. Context, once written, lasts a long time.
Boundaries need tweaking whenever team policies or repository structures change.

<br>

# Keep Team Rules and Personal Settings Separate

The most common confusion when first working with `settings.json` is deciding what belongs in the repository.
Without answering this question first, team rules and personal preferences end up in the same file.
One person adds settings to block something for safety, another adds exceptions for experimentation,
and the file quickly becomes a mess.

A practical split looks like this: put rules the entire team must follow in `.claude/settings.json`,
and keep settings needed only for personal experiments or local environments in `.claude/settings.local.json`.
If you have personal defaults that apply across multiple repositories, use the user-level global settings instead.
Since `.claude/settings.local.json` is automatically added to `.gitignore` on creation,
the risk of mixing shared rules with personal settings drops significantly.

This separation matters because the problems are fundamentally different. "Never read production credential files" is a team rule,
while "allow this command only in my local sandbox" is a personal setting. Mixing both in one file means shared and private
concerns start moving together.

<br>

# The Starting Point for Safety: permissions.deny

When introducing Claude Code to a project repository, the most important setting to consider is `permissions.deny`.
The reason is simple: before leveraging the AI agent's powerful analysis capabilities,
you need a safety net that blocks access to sensitive files at the source.

For example, in an order service repository, it is safer to prevent Claude Code from touching `.env` files,
production credential files, or directories containing deployment secrets entirely.

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)"
    ]
  }
}
```

This setting does not exist to reduce Claude Code's ability to understand the project. Rather, it acts as a minimal fence
to limit the blast radius when mistakes happen. This fence becomes even more valuable during early sessions
when the repository structure is still unfamiliar.

`deny` does more than simply return a read failure. It makes the target path appear as if it does not exist,
which means sensitive files never show up during directory listing or auto-suggestion steps.

Of course, blocking too broadly can prevent necessary analysis. That is why `deny` entries work better
when written around actual sensitive paths rather than abstract security slogans.
"`./secrets/**` cannot be read" is far easier to manage than "this might be a security risk."

<br>

# hooks and env Are Powerful but Need Narrow Scope

The most practically appealing features in `settings.json` are `hooks` and `env`.
Hooks let you automate checks or formatting before and after specific events.
Environment variable settings reduce values you had to pass repeatedly.
Both are highly convenient, but widening their scope too much creates more side effects than expected.

## Preventing Unexpected Incidents with hooks

Hooks are useful for inserting scripts before (`PreToolUse`) or after (`PostToolUse`) a specific tool runs.
The most practical use case is enforcing team-wide validation flows.

For example, you can raise an error and block execution when Claude Code tries to modify a specific file.
To block `.env` file edits entirely, add the following to the shared settings at `.claude/settings.json`.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matchers": [
          {
            "tool": "Edit",
            "parameters": {
              "file_path": ".*\\.env$"
            }
          }
        ],
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Error: Editing .env files is prohibited.' && exit 1"
          }
        ]
      }
    ]
  }
}
```

Alternatively, you can automatically run a local formatter right after a file edit completes,
reducing unnecessary style-correction conversations.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matchers": [
          {
            "tool": "Edit"
          }
        ],
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_LAST_EDITED_FILE\""
          }
        ]
      }
    ]
  }
}
```

## Separating Shared Values from Personal Values in env

Environment variables are useful too, but baseline values shared by the team and personal tokens are different in nature.
Put team-wide shared values in the shared file (`.claude/settings.json`) and keep sensitive or personalized values
in local scope (`.claude/settings.local.json`).

Values suitable for shared settings are things like the default API base URL for the development environment
or timeouts, information that causes no harm if exposed externally.

```json
{
  "env": {
    "NODE_ENV": "development",
    "API_BASE_URL": "https://api.staging.example.com"
  }
}
```

On the other hand, local database passwords or personal experiment flags belong in `.claude/settings.local.json`
to keep them separate from shared rules.

At this point, comparing with `CLAUDE.md` again makes the role difference clearer. `CLAUDE.md` explains
"how to read our project," while `settings.json` restricts "what can be read and what can be executed."
Having only one of these in place always means you are only half-prepared.

<br>

# When Settings Conflict, What Wins?

In production environments, settings always overlap at some point.
A hook added by an individual for convenience might override a team's security rule,
or an overly strict global setting might block work on a different project.
That is why understanding "which setting takes priority" upfront is the safer approach.

## Narrower Scope Means Higher Priority

The <a href="https://docs.claude.com/en/docs/claude-code/settings" target="_blank" rel="nofollow">Anthropic official documentation</a> describes
settings applied in the following order. The narrower and more specific the scope, the stronger its priority.

| Rank | Settings Layer | File Location or Form | Characteristics and Purpose |
|----|------------|-------------------------------|-----------------------------------|
| 1  | Managed/Enterprise | Organization policy system | The strongest level; enforced security rules that users cannot bypass |
| 2  | CLI Arguments | CLI flags (e.g., `--model`) | One-time settings applied only to the current session |
| 3  | Local Project | `.claude/settings.local.json` | For personal overrides. Not shared via Git and has higher priority |
| 4  | Shared Project | `.claude/settings.json` | Common rules shared across the team via Git |
| 5  | User Global | `~/.claude/settings.json` | Default settings applied to all projects for a single user |

## Purpose of the Local Settings File

The layer to pay special attention to in this hierarchy is `.claude/settings.local.json`.
This file is automatically added to `.gitignore` on creation.
Use it when you want to always allow a specific command permission that the shared project settings forbid,
but only in your local environment, or when you want to switch models for faster responses in a specific project.

Because its priority is higher than shared settings, it can bypass team rules.
Therefore, if you want to strictly enforce team rules, relying solely on project settings is not enough.
Consider using managed policies alongside them for a safer approach.

<br>

# After /init, Looking at settings.json Is the Natural Next Step

If you had to pick an order, it feels natural to create the project context with `/init` first,
then define boundaries with `settings.json`.
Adjusting permissions without context makes it unclear what to allow or block.
Setting up context without boundaries means the agent understands everything well, then tries to do too much.

That is why `settings.json` is not an advanced configuration. It is closer to the second essential file
for bringing Claude Code into a team environment.
Especially for teams sharing a repository, separating shared rules from local exceptions
reduces operational costs more than relying on a single personal configuration.
(For the first step of setting up project context, check out
<a href="/en/post/why-init-first-in-claude-code" target="_blank">Why You Should Run /init First When Introducing Claude Code to Your Team</a>!)

<br>

# Context with /init, Boundaries with settings.json

If you treat getting the most out of Claude Code purely as a prompt engineering problem, it is easy to miss something.
As models get smarter, what becomes more important is context and boundaries.
If `CLAUDE.md` handles context, `settings.json` handles boundaries.

It is hard to say which one matters more. In practice, `settings.json` simply takes a bit longer to pick up,
but that does not make it any less necessary.
Once you succeed in helping Claude Code understand your project,
the next step is writing down what to allow and what to block. That is what lasts.

<br>

# References

- <a href="https://docs.claude.com/en/docs/claude-code/settings" target="_blank" rel="nofollow">Claude Docs: Settings</a>
- <a href="https://docs.claude.com/en/docs/claude-code/hooks" target="_blank" rel="nofollow">Claude Docs: Hooks</a>
- <a href="https://docs.claude.com/en/docs/claude-code/memory" target="_blank" rel="nofollow">Claude Docs: Manage
  Claude's memory</a>
