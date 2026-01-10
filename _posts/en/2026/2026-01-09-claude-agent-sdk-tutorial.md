---
layout: post
title: "Building Custom AI Agents with the Claude Agent SDK"
author: madplay
tags: claude-agent-sdk ai-agent mcp typescript anthropic
description: "We examine the structure and core APIs of the Claude Agent SDK, exploring how to control agents with custom tools and hooks."
category: AI
date: "2026-01-09 20:34:00"
comments: true
lang: en
slug: claude-agent-sdk-tutorial
permalink: /en/post/claude-agent-sdk-tutorial
---

# Controlling Agents Programmatically Instead of the CLI?

Developers who use Claude Code in the terminal have likely wanted to leverage the agent's capabilities programmatically within their own applications. Use cases include automatically running code reviews when a PR is submitted, executing tests by detecting changes in specific directories, or providing internal APIs as tools so the agent can autonomously query data.

The Claude Agent SDK is a tool released by Anthropic to fulfill these needs. It supports both Python and TypeScript. By wrapping the Claude Code CLI as a subprocess, the SDK allows you to send prompts, receive responses as streams, and intercept tool calls all through code.

<br>

# Structure and Mechanics of the SDK

The Claude Agent SDK is a TypeScript wrapper layered on top of the Claude Code CLI. When the SDK sends a prompt, it internally executes the Claude Code CLI process and communicates via a JSON-based protocol. It can use all tools available to Claude Code (Read, Write, Edit, Bash, etc.) and allows granular control of the agent's behavior by adding custom tools and hooks.

<pre class="mermaid">
flowchart TD
    A["TypeScript Application"] --> B["Claude Agent SDK"]
    B -->|"query()"| C["One-off Query / Session-based Conversation"]
    C --> D["Claude Code CLI (subprocess)"]
    D --> E["Claude Model + Tool Execution"]
</pre>

Installation requires just one npm command. The Claude Code CLI is **bundled with the package**, so no separate installation is required.

```bash
npm install @anthropic-ai/claude-agent-sdk
```

<br>

# One-Off Queries: query()

The simplest way to use it is the `query()` function. Send a prompt, and it returns the response messages as an asynchronous iterator.

> The code examples in this post assume TypeScript, `@anthropic-ai/claude-agent-sdk` version 0.2.x, and a Node.js 18+ environment.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Explain how TypeScript type inference works in one paragraph.",
})) {
  if (message.type === "assistant") {
    // message.message is a BetaMessage object from the Anthropic SDK
    for (const block of message.message.content) {
      if (block.type === "text") {
        console.log(block.text);
      }
    }
  }
}
```

`query()` is **stateless**. Because it asks once and receives an answer once, it is suitable for simple code generation or one-off analysis tasks.

Adding options allows you to modify the behavior.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Analyze the structure of the src/ directory.",
  options: {
    systemPrompt: "You are a senior backend engineer.",
    maxTurns: 3,
    cwd: "/home/user/my-project",
    allowedTools: ["Read", "Bash"],
  },
})) {
  console.log(message);
}
```

`cwd` designates the directory the agent will work in, and `allowedTools` is a list of pre-approved tools. `maxTurns` sets the upper limit on the number of times the agent can call tools and re-reason.

<br>

# Interactive Sessions: resume

If a multi-turn conversation is necessary, capture the session ID and resume it using the `resume` option. You get the session ID from the first query and pass it to subsequent queries.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;

// First query: Capture the session ID
for await (const message of query({
  prompt: "Analyze and review git diff HEAD~1.",
  options: {
    systemPrompt: "You are a code reviewer. Analyze changes and suggest improvements.",
    allowedTools: ["Read", "Bash"],
    cwd: "/home/user/my-project",
  },
})) {
  if (message.type === "system" && message.subtype === "init") {
    sessionId = message.session_id;
  }
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if (block.type === "text") {
        console.log(block.text);
      }
    }
  }
}

// Subsequent query: Continues the previous context
for await (const message of query({
  prompt: "Are there any additional things to check from a security perspective?",
  options: { resume: sessionId },
})) {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if (block.type === "text") {
        console.log(block.text);
      }
    }
  }
}
```

Since the context of the first question carries over to the second, it conducts the security review remembering the "previously analyzed diff". Sessions do not need to be explicitly closed. The session state is automatically preserved when the `query()` iteration concludes. By passing the same `sessionId` to `resume`, you can continue the previous context any number of times. This pattern is useful when building automated code review pipelines or interactive debugging tools.

<br>

# Creating Custom Tools

One of the SDK's core features is registering functions as tools for the agent. By defining them with the `tool()` function and Zod schemas, an **in-process MCP server** is created without the need to spawn an MCP server as a separate process.

Let's take a tool that retrieves and posts PR comments as an example.

```typescript
import { z } from "zod";
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const getPrComments = tool(
  "get_pr_comments",
  "Fetches review comments by PR number",
  { pr_number: z.number() },
  async (args) => {
    // In reality, this would call the GitHub API, etc.
    const comments = await fetchPrComments(args.pr_number);
    return {
      content: [{ type: "text", text: `PR #${args.pr_number}: ${comments}` }],
    };
  }
);

const postReviewComment = tool(
  "post_review_comment",
  "Posts a review comment on a PR",
  { pr_number: z.number(), body: z.string() },
  async (args) => {
    const result = await createReviewComment(args.pr_number, args.body);
    return {
      content: [{ type: "text", text: `Comment posting result: ${result}` }],
    };
  }
);

const reviewServer = createSdkMcpServer({
  name: "review-tools",
  version: "1.0.0",
  tools: [getPrComments, postReviewComment],
});
```

If you include the created server in the options, the agent recognizes the tools and calls them when needed.

```typescript
for await (const message of query({
  prompt: "Check the review comments for PR #42.",
  options: {
    mcpServers: { review: reviewServer },
    // Tool names are formatted as mcp__{serverName}__{toolName}
    allowedTools: ["mcp__review__get_pr_comments", "mcp__review__post_review_comment"],
    systemPrompt: "You are a code review assistant agent. You use tools to answer PR-related questions.",
  },
})) {
  console.log(message);
}
```

It is also possible to use external MCP servers and in-process servers simultaneously. For internal systems, use the in-process server; for external services (GitHub, Jira, etc.), you can <a href="/en/post/claude-code-mcp-setup" target="_blank">connect existing MCP servers</a> directly.

```typescript
const options = {
  mcpServers: {
    review: reviewServer,                             // In-process
    github: {                                        // External process
      type: "stdio" as const,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
    },
  },
};
```

> Note that an in-process server is an MCP server that operates within the same process as the application without launching a separate process. External MCP servers using the `type: "stdio"` approach require launching a separate process and exchanging JSON-RPC messages via stdin/stdout, but in-process servers process these directly as function calls, resulting in faster responses and easier debugging.

<br>

# Controlling Agent Behavior with Hooks

You can inject callback functions before or after the agent calls a tool. These are called hooks, and they are used to block dangerous commands or log tool invocation results.

```typescript
import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

const BLOCKED_PATTERNS = ["rm -rf", "DROP TABLE", "shutdown"];

// The actual signature is (input, toolUseID, options), but here we only use input
const blockDangerousCommands: HookCallback = async (inputData, _toolUseID, _options) => {
  if ((inputData as any).tool_name !== "Bash") {
    return {};
  }

  const command = (inputData as any).tool_input?.command ?? "";

  for (const pattern of BLOCKED_PATTERNS) {
    if (command.includes(pattern)) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Blocked pattern: ${pattern}`,
        },
      };
    }
  }

  return {};
};

for await (const message of query({
  prompt: "Clean up the project.",
  options: {
    allowedTools: ["Read", "Write", "Bash"],
    hooks: {
      PreToolUse: [{ matcher: "Bash", hooks: [blockDangerousCommands] }],
    },
  },
})) {
  console.log(message);
}
```

When this hook is registered, it automatically denies the agent's attempts to execute Bash commands containing `rm -rf` or `DROP TABLE`. The agent receives the reason for denial and attempts a different approach.

<br>

# How Are Tool Permissions Managed?

The SDK manages tool usage permissions in three tiers.

- `allowedTools` → Pre-approved. Executed immediately without confirmation if present in the list.
- `permissionMode` → The default handling method for tools not in the pre-approved list. There are multiple modes; for example, setting it to `'acceptEdits'` automatically approves file modification tools.
- `disallowedTools` → Blocklist. Will not execute under any circumstances.

For a code review agent, for instance, it is appropriate to allow reading files while blocking direct modifications.

```typescript
const options = {
  allowedTools: ["Read", "Bash"],
  disallowedTools: ["Write", "Edit"],
};
```

To prevent the agent from unintentionally modifying files or executing dangerous commands in an automated pipeline, it is safer to keep `allowedTools` to a minimum and explicitly block actions with `disallowedTools`.

<br>

# How to Catch Errors?

The SDK handles errors by combining message streams and try-catch blocks. Check for API-level errors using the `error` field of the response message, and catch process-level errors via exceptions.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

try {
  for await (const message of query({ prompt: "Hello" })) {
    if (message.type === "assistant" && message.error) {
      switch (message.error) {
        case "authentication_failed":
          console.error("Invalid API key.");
          break;
        case "rate_limit":
          console.error("Rate limit exceeded.");
          break;
        case "server_error":
          console.error("A server error occurred.");
          break;
        default:
          console.error(`Error occurred: ${message.error}`);
      }
    }

    if ("result" in message) {
      console.log(message.result);
    }
  }
} catch (err) {
  // CLI process execution failure, disconnection, etc.
  console.error("Process error:", err);
}
```

`authentication_failed` appears when the API key is incorrect or expired, `rate_limit` when the request limit is exceeded, and `server_error` when there is a server-side issue. Because there are also `billing_error`, `invalid_request`, and `unknown` types, a `default` branch must be included. In automated pipelines, these errors are caught to send notifications via messengers like Slack or to trigger retry logic.

<br>

# Practical Application: Automated PR Review Agent

By combining the elements covered so far, you can build an agent that automatically reviews code whenever a PR is submitted.

```typescript
import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

const blockWrites: HookCallback = async (inputData) => {
  const toolName = (inputData as any).tool_name;
  if (toolName === "Write" || toolName === "Edit") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Review agents cannot modify files.",
      },
    };
  }
  return {};
};

async function reviewPr(repoPath: string, baseBranch = "main"): Promise<string> {
  const reviewResult: string[] = [];

  for await (const message of query({
    prompt:
      `Review the changes in git diff ${baseBranch}...HEAD. ` +
      "Summarize the main feedback for each file.",
    options: {
      systemPrompt:
        "You are a senior backend engineer code reviewer. " +
        "Analyze the changes and point out bugs, performance issues, and security vulnerabilities. " +
        "Please mention aspects worthy of praise.",
      cwd: repoPath,
      allowedTools: ["Read", "Bash"],
      disallowedTools: ["Write", "Edit"],
      hooks: {
        PreToolUse: [
          { matcher: "Write", hooks: [blockWrites] },
          { matcher: "Edit", hooks: [blockWrites] },
        ],
      },
      maxTurns: 10,
    },
  })) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") {
          reviewResult.push(block.text);
        }
      }
    }
  }

  return reviewResult.join("\n");
}

const result = await reviewPr("/home/user/my-project");
console.log(result);
```

By applying a double defense mechanism with `disallowedTools` and hooks, the agent is prevented from modifying the code. The agent only uses `Read` and `Bash` to read diffs, explore files, and return review results as text. Embedding this script into a CI pipeline completes an automated review structure for every PR.

<br>

# Pre-Adoption Checklist

The SDK has several limitations.

**Acknowledge that it is subprocess-based.**
The SDK internally executes the Claude Code CLI as a subprocess. The overhead is larger compared to directly calling the Claude API, and the CLI's initial loading time is added. It is more suited to tasks with low request frequencies and long processing times per task, such as CI/CD pipelines or batch jobs, rather than environments that must process hundreds of requests per second.

**Tool permission design is the core of security.**
Leaving the `Bash` tool open for an agent in an automated environment can result in unintended system commands being executed. It is advisable to apply the principle of least privilege to `allowedTools` and implement dual defense through additional validation via hooks. **Executing the agent inside a sandbox is highly recommended, particularly in production environments.**

<br>

# What It Means to Handle Agents as Code

The Claude Agent SDK is a tool that brings the agent out of the terminal and into the code level. Launching the agent, carrying out conversations, attaching tools, and restricting behavior can all be resolved in one piece of code. Although it is in the early stages and the API may change, the direction of controlling agents via code is quite intriguing.

The AI tooling ecosystem is evolving at a breakneck pace.

<br>

# References

- <a href="https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk" target="_blank" rel="nofollow">npm: @anthropic-ai/claude-agent-sdk</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/overview" target="_blank" rel="nofollow">Claude Code Official Guide</a>