---
layout: post
title: "AI Agent Skills: How to Create and Use Them"
author: madplay
tags: agent-skills skill-md claude-code cursor codex ai-coding
description: "Isolate recurring rules and procedures into reusable skills. Learn the structure and authoring points of Agent Skills."
category: AI
date: "2025-12-28 14:22:07"
comments: true
lang: en
slug: ai-agent-skills-and-skill-md
permalink: /en/post/ai-agent-skills-and-skill-md
---

# What are Agent Skills?
When utilizing AI agents like Claude Code, Cursor, or Codex, developers often face the need to repeatedly provide the same context.
Instructions like "exclude test accounts" or "write commit messages in this format" represent common examples.
Just as teams create onboarding documents instead of repeating the same explanations to new developers, documenting recurring procedures allows agents to read and execute them autonomously.
These are AI Agent Skills.

Anthropic initially announced Agent Skills on October 16, 2025, and subsequently released them as an open standard via <a href="https://agentskills.io/" target="_blank" rel="nofollow">agentskills.io</a> on December 18 of the same year.
A `SKILL.md` file, composed of YAML frontmatter and a Markdown body, forms the core. Once created, multiple agents can utilize it seamlessly.

<br>

# How to Structure a Skill

A skill is organized around a single directory. `SKILL.md` is the only required file; others can be added as needed.

> <a href="https://agentskills.io/specification#skill-structure" target="_blank" rel="nofollow">Reference Link: Agent Skills Specification - Skill Structure</a>

```text
code-review/
├── SKILL.md              # Mandatory: Instructions the agent follows
├── scripts/              # Optional: Scripts the agent executes directly
│   └── run-lint.sh
├── references/           # Optional: Supplementary documents read when needed
│   └── review-checklist.md
└── assets/               # Optional: Static resources like templates and configs
    └── comment-template.md
```

The `scripts/` directory holds scripts for the agent to run. This approach is safer for production environments because the agent executes validated scripts rather than generating new code repeatedly.
Lengthy reference materials, such as API documentation or checklists, reside in the `references/` directory. The agent reads these files only when required, thereby conserving the context window.
The `assets/` directory stores static resources like JSON schemas or configuration templates. While the agent does not execute these directly, it references or copies them during operations.

<br>

# Progressive Disclosure: Skills Do Not Load All at Once

Agents process skills in three phases.
The <a href="https://agentskills.io/specification#progressive-disclosure" target="_blank" rel="nofollow">official specification</a> designates this as Progressive Disclosure.

```text
Phase 1: Metadata (~100 tokens)
  └─ Reads only the name and description of all skills.

Phase 2: Instructions (< 5000 tokens recommended)
  └─ Reads the entire SKILL.md of the relevant skill for the task.

Phase 3: Resources (As needed)
  └─ Reads files in scripts/, references/, and assets/ when required.
```

This structure makes the `description` especially important. During Phase 1, the `description` serves as the sole basis for the agent to determine "whether to activate this skill or not."

<br>

# What to Examine First in the Frontmatter

`SKILL.md` comprises YAML frontmatter followed by a Markdown body.

```yaml
---
name: api-test-runner
description: >-
  Automatically verifies the response status, schema, and performance of API endpoints.
  Use when API testing, endpoint inspection, or response verification is required.
---
```

The `name` and `description` fields remain mandatory.

## The name Field

The `name` must correspond exactly to the directory name.
It permits only lowercase letters, numbers, and hyphens, and enforces a 64-character limit.
Starting or ending with a hyphen, as well as consecutive hyphens (`--`), remain prohibited.

```yaml
# Valid
name: api-test-runner
name: kafka-connector-restart

# Invalid
name: Order-Event-Review   # Uppercase prohibited
name: -order-event          # Starting with hyphen prohibited
name: order--event          # Consecutive hyphens prohibited
```

## The description Field

The `description` must remain under 1024 characters and incorporate both "what it does (WHAT)" and "when to use it (WHEN)".

```yaml
# Bad example: Includes WHAT, but lacks WHEN
description: Helps with PDFs.

# Good example: WHAT + WHEN
description: >-
  Extracts text and tables from PDF files, fills forms, and merges multiple PDFs.
  Use when tasks involving PDFs, forms, or document extraction are required.
---
```

When a skill fails to trigger, the root cause typically resides in the `description` rather than the body.
The <a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#writing-effective-descriptions" target="_blank" rel="nofollow">Anthropic Official Guide</a> also specifies, "The description is critical for skill selection."

There is one crucial detail to remember. Because the `description` injects into the system prompt, using first- or second-person pronouns like "I" or "you" can confuse the agent's perspective and interfere with skill discovery. Always write in the third person.

<br>

# Writing the Body

The Markdown body below the frontmatter contains the actual instructions for the agent. While there are no strict formatting rules, here are some best practices.

```markdown
---
name: pr-review-guide
description: >-
  Reviews code changes in PRs and inspects for convention violations and potential defects.
  Use when code reviews, PR inspections, or change evaluations are required.
---

# PR Code Review

## Workflow

### Step 1: Identify the Scope of Changes
Check the list of modified files in the PR and distinguish between core changes and side changes.

### Step 2: Convention Check
Verify whether naming, formatting, and package structures adhere to project conventions.
- Execute scripts/run-lint.sh to collect static analysis results.
- Cross-reference with items in references/review-checklist.md.

### Step 3: Defect Search
Inspect for potential defects, including possible NPE areas, unreleased resources, and concurrency issues.

### Step 4: Organize Feedback
Categorize feedback by severity and organize it.

## Usage Example

User: "Review this PR"
→ Execute Steps 1~4
```

What should you consider when drafting the body?

**Maintain under 500 lines.** Because the entire `SKILL.md` loads into context during Phase 2, excessive length consumes proportional tokens. Segregate detailed content into the `references/` directory and reference the path in the body if the length exceeds this limit.

**Omit content the agent already knows.** General knowledge, such as "The syntax for try-catch in Java is...", does not belong in a skill. Judge inclusions based on the criteria: "Does this paragraph justify the token cost?"

**Limit references to one level deep.** While `SKILL.md` referencing `references/api-reference.md` operates correctly, the agent may struggle to track chains if the referenced file links to another file.

```text
SKILL.md → references/api-reference.md   # 1 level: Normal
SKILL.md → references/a.md → data/b.md   # 2 levels: Agent might miss it
```

**State trigger conditions exclusively in the description.** Reiterating "when to use this skill" in the body wastes tokens, as the agent already processed the `description` in Phase 1.

<br>

# How to Create and Validate Skills

> The Anthropic official guide recommends the approach: "Create skills with Claude, and test them with another Claude."

Agents already comprehend the `SKILL.md` format and establish the frontmatter or workflow structure directly.

Initially, perform the specific task through standard conversation with the agent without the skill. The context repeatedly provided during this process becomes the content embedded within the skill.
Subsequently, request the agent to generate the skill.

```text
Create a skill for the BigQuery analysis pattern we just executed.
Include the table schema, naming rules, and test account filtering rules.
```

After saving the draft generated by the agent, execute actual tasks with the skill loaded in a new session (or with a different agent).
The official guide distinguishes the instance creating the skill as "Claude A" and the testing instance as "Claude B" because separating sessions, even with the same agent, enables objective verification of whether the skill operates as intended.

During this verification, assess the following.

- Does the skill activate automatically?
- Does it adhere to the instructions correctly?
- Are there any omitted rules?

If issues emerge, request modifications in the session dedicated to creation.

```text
When I requested the regional sales report using the created skill, it failed to filter test accounts.
The filtering rule exists in the skill, but it seems less visible. Please modify it to be more prominent.
```

Repeating this cycle two or three times yields an operational skill.

<br>

# Standard Formats and Implementation Differences

While the `SKILL.md` format adheres to identical open standards, storage paths or manual invocation methods diverge across implementations.
Consequently, although the format permits reuse for the same skill, the installation location and invocation syntax may lack complete uniformity.

## Storage Paths Differ by Implementation

Agent storage paths for skills vary. These paths fall outside the agentskills.io open standard and result from independent determinations by each implementation.

```bash
# Claude Code
.claude/skills/db-migration-check/SKILL.md

# Cursor
.cursor/skills/db-migration-check/SKILL.md

# OpenAI Codex
.agents/skills/db-migration-check/SKILL.md
```

The examples above summarize prevalent paths as of late 2025.
However, actual support and loading mechanisms fluctuate based on implementation versions, making it prudent to consult the documentation for the currently utilized tool.

Because the `SKILL.md` format remains identical via open standards, supported implementations allow reusing skills by aligning only the path and loading mechanism rather than rewriting the skill entirely.
Cursor processes `.claude/skills/` as well, enabling a relatively natural flow for reusing skills created in Claude Code.

## Manual Invocation Syntax Also Varies

Skills intended for team sharing belong in project-level paths (e.g., `.cursor/skills/`) to ensure management via Git, enabling all team members to utilize identical skills.
Personal skills residing in the home directory (e.g., `~/.cursor/skills/`) remain accessible across all projects.

Manual invocation syntax also diverges among agents. Some employ `/command`, while others designate separate mention syntax.
When designing skills, authoring a compelling `description` for automatic selection holds greater importance than invocation syntax.

<br>

# Precautions When Utilizing Skills

## Skills Do Not Represent Programmatic Enforcement

Because instructions utilize Markdown, no guarantee exists that the agent adheres to them flawlessly.
Core logic requiring deterministic execution belongs securely within scripts in the `scripts/` directory.
The <a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#set-appropriate-degrees-of-freedom" target="_blank" rel="nofollow">Anthropic Official Guide</a> addresses setting appropriate degrees of freedom.

```text
order-restart/
├── SKILL.md                  # Instruction: "In what order to check and restart"
└── scripts/
    ├── list-connectors.sh    # Core logic: Retrieve connector list
    └── restart-connector.sh  # Core logic: Restart connector
```

Within this structure, the agent evaluates based on `SKILL.md` instructions, while actual execution invokes validated scripts.

## Avoid Hardcoding Sensitive Information

Directly embedding values like API keys or authentication tokens into `SKILL.md` or `scripts/` includes them in Git commits. Design systems to accept these via environment variables or inputs at runtime.

```bash
#!/bin/bash
# scripts/restart-connector.sh
# API_URL is provided via environment variable at runtime.
CONNECTOR_NAME=$1
curl -X POST "${API_URL}/connectors/${CONNECTOR_NAME}/restart"
```

## Employ Terminology Consistently

Mixing diverse terms for identical concepts destabilizes the agent's interpretation. Interchanging "API endpoint" and "URL", or "restart" and "reboot", represents typical examples.
Select one term and unify its usage across the entire skill.

<br>

# References
- <a href="https://agentskills.io/specification" target="_blank" rel="nofollow">Agent Skills Specification</a>
- <a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices" target="_blank" rel="nofollow">Anthropic: Skill authoring best practices</a>
- <a href="https://www.anthropic.com/news/skills" target="_blank" rel="nofollow">Anthropic: Introducing Agent Skills</a>
