---
layout: post
title: "Claude Code Subagents: How Is Work Divided and Processed?"
author: madplay
tags: claude-code subagent agent-architecture worktree parallel
description: "Why does Claude Code spin up subagents instead of doing everything alone? What are the roles of the three built-in agents, and how do you build custom ones?"
category: AI
date: "2026-02-22 08:52:00"
comments: true
lang: en
slug: claude-code-subagent-architecture
permalink: /en/post/claude-code-subagent-architecture
---

# Should One Agent Read Every File Directly?

Imagine a repository with hundreds of files, and you need to simultaneously modify three unrelated modules. A method where a single agent opens, reads, modifies, and moves to the next file sequentially is slow. Tokens also accumulate rapidly in the context window, causing earlier information to be compressed or evicted by the latter half of the task.

Claude Code's subagents are structured to eliminate this bottleneck. Instead of the main agent handling all tasks alone, it spins up independent subagents to divide the work. **Each subagent operates in its own context window and returns only a summary of the results to the main agent upon completion.**

One distinction to draw early on is that this is a different realm from the previously discussed <a href="/en/post/claude-agent-sdk-tutorial" target="_blank">Claude Agent SDK</a>. The Agent SDK is a tool for programmatically controlling Claude Code from the outside via Python or TypeScript code. In contrast, subagents represent an internal mechanism automatically generated and managed within the Claude Code CLI, requiring no separate code writing.

<br>

# Structure of Subagents

## Relationship Between Main Agent and Subagents

The behavior of subagents mirrors the Orchestrator-Worker pattern. The main agent analyzes the task, delegates it to appropriate subagents, aggregates the results, and decides the next step.

<pre class="mermaid">
graph TD
    M["Main Agent<br>(Orchestrator)"] --> A["Subagent A"]
    M --> B["Subagent B"]
    M --> C["Subagent C"]
    A -->|Result Summary| D["Main agent aggregates results<br>and decides next actions"]
    B -->|Result Summary| D
    C -->|Result Summary| D
</pre>

Subagents do not inherit the conversational history of the main agent. Because they run in the same project directory, they can access project configurations like CLAUDE.md, but they maintain entirely separate conversational contexts. This keeps the main agent's context window from being polluted by the subagents' operational details. Even if a subagent reads hundreds of lines of test logs, what returns to the main agent is strictly a compressed summary.

## Three Built-In Subagents

Claude Code features three built-in subagents based on use cases.

- **Explore** is a read-only exploration agent. It uses the Haiku model and can only utilize reading tools like Read, Glob, and Grep. Write or Edit are blocked, rendering it unable to modify code. The main agent automatically deploys it when it needs to rapidly skim information, such as searching files, understanding code structure, or hunting for keywords. Since it utilizes a lightweight model, the cost is low.
- **Plan** is a design-exclusive agent. It inherits the main agent's model but remains read-only. It is used during Plan mode to analyze the codebase and formulate implementation strategies. Because it does not modify files directly, there is no risk of code being accidentally changed during the exploration process.
- **General-purpose** is an agent capable of using all tools. It accesses Read, Write, Edit, Bash, and others without restriction. It is used for complex multi-step tasks, research involving code modifications, and refactoring across multiple files. It inherits the main agent's model and effectively acts as an independent worker holding the same capabilities as the main agent.

A quick comparison of the three agents looks like this:

| Agent | Model | Tool Scope | Purpose |
|---------|------|----------|------|
| Explore | Haiku | Read-only | File exploration, code search |
| Plan | Inherit | Read-only | Structural analysis, design |
| General | Inherit | Full | Code modification, multi-step tasks |

## When Does the Main Agent Deploy Subagents?

The main agent's decision to deploy subagents happens automatically. Delegation typically occurs in the following situations.

Explore is deployed when files need to be scanned broadly. Questions like "Where is the payment-related code in this project?" trigger this. Passing the task to Explore saves the main agent's context compared to having the main agent repeatedly run Glob and Grep directly.

General-purpose subagents are deployed when a task splits into several independent units. For instance, if three modules need to be modified but lack dependencies on one another, the main agent deploys three general-purpose subagents, assigning one task to each.

Nesting, where a subagent deploys another subagent, **is not permitted.** The depth always remains at level 1.

<br>

# Worktree Isolation

If multiple subagents simultaneously modify files in the same repository, conflicts can arise. Worktree isolation solves this problem using git worktrees.

A subagent configured with the `isolation: worktree` option generates a temporary worktree in the `.claude/worktrees/<name>/` path. It operates on a `worktree-<name>` branch branching off from the primary remote branch, fully separating it from the working directories of other subagents or the main agent.

When a subagent finishes, the outcome branches in two directions. If there are no changes, the worktree and branch are automatically cleaned up. If there are changes, the worktree path and branch name are returned in the results. Subsequently, the branch can be merged into the main branch, or the worktree can be discarded if unneeded.

<pre class="mermaid">
flowchart TD
    S["Subagent task complete"] --> D{"Any changes?"}
    D -->|No| C["Worktree + Branch<br>automatically cleaned up"]
    D -->|Yes| K["Worktree path and<br>branch name returned"]
    K --> MG["Merge into main branch"]
    K --> DEL["Remove worktree"]
</pre>

If three subagents are each modifying a different module, applying worktree isolation to all three is safer. After they work independently without file conflicts, the main agent reviews the results of each worktree and decides whether to merge them.

<br>

# Creating Custom Subagents

## The .claude/agents/ Directory and Markdown Format

If the built-in agents are insufficient, you can create your own. Adding a markdown file to the `.claude/agents/` directory registers a custom subagent at the project level. To apply it across all users, place it in `~/.claude/agents/`.

The file format consists of YAML front matter followed by the body prompt.

```markdown
---
name: catalog-reviewer
description: Reviews product catalog code and provides quality feedback
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a code reviewer for the product catalog module.
Analyze the code under the catalog/ directory and provide feedback
from the perspectives of naming conventions, exception handling, and test coverage.
Do not modify files directly; return only the review results as text.
```

The main fields of the front matter are as follows:

- `name`: The agent's name. Use lowercase letters and hyphens only.
- `description`: The description the main agent relies on for delegation decisions.
- `tools`: A list of allowed tools.
- `disallowedTools`: A list of explicitly blocked tools.
- `model`: sonnet, opus, haiku, or inherit.
- `isolation`: Setting this to worktree applies worktree isolation.
- `maxTurns`: The maximum number of turns the agent can iterate.
- `background`: If set to true, it always runs in the background.

You can generate it interactively with the `/agents` command or create the file directly. The more precise the `description`, the better the main agent automatically delegates at appropriate moments.

## Restricting Tools and Selecting Models

The core of a custom subagent lies in **narrowing down the tool scope and model to suit the purpose.**

If you wish to build a read-only reviewer, simply add Read, Grep, and Glob to `tools` and omit Write and Edit. This way, no matter how much the agent wants to modify a file, it is impossible because the tool itself does not exist.

```markdown
---
name: security-auditor
description: A read-only auditing agent that detects security vulnerabilities
tools: Read, Grep, Glob
model: haiku
---

Search for hardcoded secrets, potential SQL injections, and authentication bypass patterns in the code.
Report discovered issues along with their severity. Do not modify the code directly.
```

Model selection translates directly to cost. For simple exploration, `haiku` suffices; for tasks demanding design judgment, `opus` is suitable. Setting it to `inherit` utilizes the main agent's model as is.

Agents dedicated to specific directories are also highly useful. Taking a shopping mall product catalog system as an example, you can create specialized agents for product listings, category sorting, and inventory management.

```markdown
---
name: inventory-specialist
description: Specialized agent for the inventory management module. Modifies code in the inventory/ directory.
tools: Read, Write, Edit, Bash, Grep, Glob
isolation: worktree
---

Responsible for inventory management code in the inventory/ directory.
Understands inventory deduction, receiving processing, and low-stock notification logic.
Does not touch other modules (catalog/, category/).
```

<br>

# Practical Scenarios

## Multi-Module Code Modification

Consider a scenario where the display format of product prices needs a batch change across a shopping mall platform. The product list (`catalog/`), category filters (`category/`), and inventory management (`inventory/`) modules each possess their own price formatting logic. There are no dependencies across modules, and modifications can be performed independently within each module.

When you ask the main agent to "Standardize the product price display to the Korean Won format," the main agent analyzes the task and can deploy three general-purpose subagents. Each subagent modifies its assigned module within a worktree-isolated environment, reporting a summary of the changes to the main agent upon completion.

<pre class="mermaid">
graph TD
    M["Main Agent"] -->|catalog/| S1["Subagent 1"]
    M -->|category/| S2["Subagent 2"]
    M -->|inventory/| S3["Subagent 3"]
    S1 --> R1["Modified 3 price format functions<br>Tests passed"]
    S2 --> R2["Modified 1 filter display logic<br>Tests passed"]
    S3 --> R3["Modified 2 inventory unit price displays<br>Tests passed"]
</pre>

This is faster than the main agent modifying the three modules sequentially itself, and because each subagent's workload does not consume the main agent's context, the window remains impeccably clean.

## Code Review + Test Generation

The combination of subagents is also highly effective when adding tests to existing code.

First, the Explore subagent determines the impact radius of the modified file. It quickly skims and reports "Where this method is invoked" or "Whether related configuration files exist." Based on the scope information returned by Explore, the main agent delegates test writing to a general-purpose subagent.

<pre class="mermaid">
sequenceDiagram
    participant M as Main Agent
    participant E as Explore
    participant G as General-purpose Subagent
    M->>E: Determine the impact scope of the modified file
    E-->>M: Invoked in 5 locations, config is application.yml
    M->>G: Delegate test creation based on scope info
    G-->>M: Test creation complete
</pre>

The advantage of this pattern is that the results of massive file reading during the exploration phase do not pile up in the main context. Even if Explore opened dozens of files, all that returns to the main agent is a summary stating, "This method is called in 5 places, and the configuration is in application.yml."

<br>

# Limitations and Precautions

**Direct communication between subagents is impossible.** If Subagent B must reference the results of Subagent A, A must finish first, and the main agent must include those results in B's prompt. For collaborations requiring real-time conversation between agents, subagents alone are inadequate.

**Because subagents return summarized results, the main agent cannot view the detailed intermediate processes.** If a detailed reasoning trace regarding "why it was modified this way" is needed, you must independently review the subagent's transcript.

Token costs are also hard to overlook. Since a single subagent consumes its own context window, deploying three subagents roughly incurs more than three times the token cost. **Overusing subagents for simple tasks can rack up higher costs than if the main agent handled it alone.** It is rational to weigh the scale and independence of the task and utilize delegation only when the benefits outweigh the overhead.

**Subagents running in the background (`background: true` or Ctrl+B) cannot forward permission prompts to the user.** Calling a tool that has not been pre-approved results in automatic denial, so required tools must be permitted beforehand for background agents.

<br>

# The Delegating Agent Goes Further

The reason subagents exist ultimately lies in <a href="/en/post/claude-code-context-and-token-optimization" target="_blank">context isolation</a>. A single agent does not need to know everything. Delegating exploration to a lightweight agent, modifications to specialized agents, and auditing to read-only agents ensures that each context window focuses exclusively on its own task.

Not every task requires subagents. Deploying a subagent to fix a single file makes it slower. Conversely, when the search scope is broad or independent modifications span multiple locations, not delegating incurs a heftier cost. **Developing an intuition for that boundary is a key part of mastering this tool.**

<br>

# References

- <a href="https://docs.anthropic.com/en/docs/claude-code/overview" target="_blank" rel="nofollow">Claude Code Documentation</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/sub-agents" target="_blank" rel="nofollow">Create custom subagents</a>ow">Create custom subagents</a>