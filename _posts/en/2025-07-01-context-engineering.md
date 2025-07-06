---
layout: post
title: "Context Engineering: The Next Step After Prompt Engineering"
author: madplay
tags: context-engineering prompt-engineering llm rag
description: "Explains context engineering, why it emerged, and how it differs from prompt engineering."
category: AI
date: "2025-07-01 22:39:00"
comments: true
lang: en
slug: context-engineering
permalink: /en/post/context-engineering
---

# What Is Context Engineering?

In June 2025, former **OpenAI** researcher Andrej Karpathy posted the following on X (Twitter):

> Context engineering is the delicate art and science of filling the context window with exactly the right information
> needed for the next step.
>
> — <a href="https://x.com/karpathy/status/1937902205765607626" target="_blank" rel="nofollow">Andrej Karpathy,
> 2025.06.25</a>

Context engineering is not about stuffing the model with documents. It is about designing what goes into and what stays
out of the LLM's context window.
In a similar vein, **LangChain**, which builds AI application development tools, compares it to a computer:

> "The LLM is the CPU and the context window is RAM. Just as the OS manages what the CPU loads into RAM, context
> engineering plays the same role."
>
> — <a href="https://blog.langchain.com/context-engineering-for-agents/" target="_blank" rel="nofollow">LangChain Blog,
> 2025</a>

Just as a system runs faster when only necessary data is loaded into RAM, the same applies to the context window.
The context window can hold many types of information.

```text
What can go into the context window

- System prompt: fixed instructions for role, constraints, output format
- Conversation history: flow of previous questions and answers
- Retrieved documents: relevant documents or passages from RAG
- Tool output: function call results, API responses, code execution results
- User input: current question and attachments
- Memory: summary information injected as long-term memory
```

What goes in, how much, and in what order directly affects response quality.
The key is relevance, not volume.

<br>

# Why It Emerged

Two trends drove the rise of context engineering.

**First, the context window expanded rapidly.**
Early GPT-style models had context windows of thousands of tokens. Recent models handle hundreds of thousands to
millions of tokens at once.
In other words, the amount an LLM can read at once grew from a short article to more than a book.
As the "space to fill" grew, "what and how to put in" became a new problem.

**Second, LLM use expanded beyond simple text generation into agent systems and business automation.**
Latest models such as GPT-5 and Gemini 2.5 Pro support external API calls, multimodal data understanding, and real-time
state tracking.
For such complex tasks, writing good prompts alone is not enough.
Designing how the LLM operates with the right information and environment became critical, and this area came to be
called context engineering.

<br>

# How It Differs from Prompt Engineering

Context engineering is not a replacement for prompt engineering; it is an architectural evolution. To illustrate the
distinction, consider a customer support agent.

**Prompt Engineering Only**
Writing instructions like "Explain delivery status procedures when a customer inquires about shipping" enables general
responses. However, if a customer provides a specific order number (e.g., "ABC1234"), the model cannot provide a
real-time status update because it lacks access to transactional data.

**Context Engineering**
Instead of merely writing instructions, you design the information environment:

- **Integration**: Connecting order databases and shipping APIs to the model.
- **Workflow**: Automatically triggering API calls when an order number is detected.
- **Dynamic Composition**: Injecting real-time shipment tracking data directly into the context window.

While prompt engineering designs the *response logic*, context engineering designs the *knowledge environment*.

| Aspect           | Prompt Engineering                  | Context Engineering                              |
|:-----------------|:------------------------------------|:-------------------------------------------------|
| **Primary Goal** | Optimize inputs for output quality. | Design information flow and environmental state. |
| **Scope**        | Single query-response interactions. | End-to-end agentic systems and automation.       |
| **Techniques**   | Few-shot, persona assignment, CoT.  | RAG, Function Calling, MCP, memory management.   |
| **Analogy**      | Crafting the right question.        | Designing the research library.                  |

<br>

# Common Context Failure Modes

More context does not correlate linearly with performance. As noted on the **LangChain** blog, context failures
typically fall into four categories:

1. **Context Poisoning**: Incorrect initial information propagates as fact throughout the session.
2. **Context Distraction**: High volumes of task-irrelevant data obscure critical evidence. Research in 2025 showed that
   semantically consistent but irrelevant data can degrade performance by over 45%.
3. **Context Confusion**: Redundant or excessive information (e.g., hundreds of pages of legal summaries) overshadows
   key data points.
4. **Context Clash**: Contradictory instructions within the context window (e.g., system prompt vs. conversation
   history) lead to erratic model behavior.

<br>

# Implementation Strategies

Building a context engineering layer requires leveraging RAG, Function Calling, MCP, and orchestration frameworks.
LangChain categorizes these strategies into four pillars:

### 1. Write: Externalize State

The context window is a finite resource. Store long-term plans and large datasets externally, retrieving only what is
necessary for the current step. Anthropic’s multi-agent systems use this "scratchpad" approach to preserve state when
context windows are truncated.

### 2. Select: Precision Retrieval

Filter context based on relevance, versioning, and permissions. Use query rewriting to convert colloquial user inputs
into search-optimized vectors, and apply re-ranking to prioritize the most semantically relevant documents.

### 3. Compress: Evidence Extraction

Avoid injecting full documents. Extract only the specific clauses or data points required to answer the query. This
reduces token consumption and minimizes distraction.

### 4. Isolate: Modular Contexts

When a task exceeds a single context window, decompose the work among specialized sub-agents, each with its own focused
context.

<br>

# Conclusion

Prompt engineering tells the model *how* to think; context engineering determines *what* it knows. As LLMs evolve into
autonomous agents, the ability to manage the information environment will become the primary driver of system
reliability and performance.

<br>

# Conclusion

If prompt engineering designs "what to have the model do,"
context engineering designs "what the model knows and sees when answering."

As LLMs gain reasoning ability and expand into agent systems and business automation, the skill of crafting good
sentences alone is not enough.
The importance of context engineering—the skill of providing the right information at the right time and making the LLM
behave appropriately—will continue to grow.

## References

- <a href="https://blog.langchain.com/context-engineering-for-agents/" target="_blank" rel="nofollow">LangChain Blog:
  Context Engineering for Agents (2025)</a>
- <a href="https://www.anthropic.com/engineering/built-multi-agent-research-system" target="_blank" rel="nofollow">
  Anthropic Engineering: Building a Multi-Agent Research System (2025)</a>
