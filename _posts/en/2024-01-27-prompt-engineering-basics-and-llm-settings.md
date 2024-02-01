---
layout: post
title: "Prompt Engineering Basics and LLM Settings"
author: madplay
tags: prompt-engineering llm prompt
description: "Covers core prompt engineering concepts and practical LLM parameter settings for stable output quality."
category: AI
date: "2024-01-27 08:14:00"
comments: true
lang: en
slug: prompt-engineering-basics-and-llm-settings
permalink: /en/post/prompt-engineering-basics-and-llm-settings
---

# Prompt Engineering Basics

- Prompt Engineering Guide: 1. Prompt Basics and LLM Settings
- <a href="/en/post/prompt-engineering-techniques" target="_blank">Prompt Engineering Guide: 2. Zero-shot, Few-shot,
  Chain-of-Thought</a>
- <a href="/en/post/prompt-engineering-tree-of-thoughts-rag" target="_blank">Prompt Engineering Guide: 3. Tree of
  Thoughts, Retrieval Augmented Generation</a>

<br>

# What is Prompt Engineering?

Prompt engineering is the practice of designing inputs to accurately convey a desired task to a model. The objective is
not merely to write long sentences, but to decouple instructions, context, and output formats to ensure predictable
results.

The rationale is straightforward: even with the same model, ambiguous requests lead to inconsistent responses. In a
production environment, repeatability is paramount. High-quality prompt engineering reduces inspection overhead,
accelerates failure recovery, and ensures service stability. Ultimately, it is less about "hacking" a model and more
about maintaining a reliable engineering standard.

<br>

# Foundations of Effective Prompt Design

While advanced techniques are tempting, the bulk of response quality stems from foundational design. LLM configuration,
prompt structure, and instruction specificity determine the final outcome.

This guide draws on core concepts from <a href="https://www.promptingguide.ai" target="_blank" rel="nofollow">
promptingguide.ai</a>. The following sections cover LLM parameter configuration, prompt components, design best
practices, and practical use cases.

<br>

# LLM Configuration: Temperature, Top_p, and Max Length

Effective prompting extends beyond the text itself. Parameter settings significantly impact how a model interprets a
prompt. When response quality fluctuates, verify configuration consistency before iterating on the prompt.

## Temperature and Top_p

`Temperature` controls deterministic vs. creative output. Lower values yield more consistent results, while higher
values increase diversity. `Top_p` (nucleus sampling) serves a similar purpose by controlling the breadth of token
selection.

In practice, adjust only one of these parameters at a time to simplify debugging.

```text
Fact-based Q&A: Low temperature
Creative generation: High temperature
```

For consistency-critical tasks like FAQ automation, start with a low `temperature`. For creative brainstorming, increase
it. `Top_p` effectively narrows or widens the candidate pool based on probability.

## Max Length and Stop Sequence

`Max length` manages costs and latency by capping response size. `Stop sequences` are useful for enforcing structural
boundaries.

```text
Example: For a 10-item list, set the stop sequence to "11."
```

Unrestricted `max length` often leads to verbose, unnecessary background explanations, increasing token consumption and
parsing failures. In API integrations, strict length limits are essential for performance stability.

While `stop sequences` help maintain formats, rely on explicit instructions (e.g., "Output exactly 10 items") to handle
variations in line breaks or symbols.

## Penalty Options

`Frequency penalty` and `presence penalty` suppress repetition in different ways. The former penalizes tokens based on
their existing frequency, while the latter discourages revisiting previously discussed topics.

These are useful for marketing copy or summarization. Conversely, high penalties in fact-based Q&A can lead to awkward
phrasing as the model avoids repeating necessary technical terms.

<br>

# Prompt Basics: Clarity over Length

Models often extrapolate intent from short, ambiguous prompts with mixed success. Explicitly stating "what to do"
increases control.

```text
Bad: The sky is
Improved: Complete the sentence: The sky is
```

Maintain a consistent prompt structure to ensure reliable parsing:

```text
<Instruction>
<Context>
Q: <Question>?
A:
```

Clarity outweighs length. Verbose explanations can obscure the core request and degrade response quality.

<br>

# Four Core Components of a Prompt

A robust prompt typically comprises four distinct elements:

1. **Instruction**: The specific task for the model.
2. **Context**: Background information or constraints.
3. **Input Data**: The actual data to process.
4. **Output Indicator**: The desired response format.

Separating these elements simplifies debugging. For instance, format errors usually point to a weak Output Indicator,
while classification errors suggest issues in the Instruction or Context.

```text
[Instruction]
Categorize the following customer inquiry.

[Context]
You are a classification engine for a payment operations team.

[Input]
"I was charged twice for my subscription."

[Output]
Return a JSON object with: severity, category, action.
```

<br>

# Best Practices: Iterate and Refine

Follow these three principles for production-ready prompts:

### 1. Start Simple

Avoid over-complicating initial prompts. Start with a baseline, observe failures, and expand incrementally.

### 2. Use Imperative, Clear Instructions

Specify actions using strong verbs like "Write," "Classify," "Summarize," or "Translate." Ambiguity is the enemy of
quality.

### 3. Precision and Concreteness

Define constraints for length, format, audience, and prohibitions.

```text
Vague: Explain this concisely.
Specific: Explain for a high school audience in 2-3 sentences, using at most one technical term.
```

Prefer positive instructions ("Do X") over negative ones ("Don't do Y") where possible.

```text
Bad: Don't ask for personal information.
Improved: Provide refund eligibility status based only on the provided order number.
```

Finally, version control your prompts. Without historical tracking, it is impossible to distinguish genuine improvements
from statistical noise.

<br>

# Practical Examples by Task Type

## Summarization

Start with a general request and refine with constraints.

**Prompt:**

```text
Explain antibiotics.
```

**Refined Prompt:**

```text
Summarize the following text about antibiotics in exactly one sentence.
```

## Information Extraction

Define both the target data and the return format.

**Prompt:**

```text
Extract location names from the following sentence.
Input: "Minsu finished the meeting at Seoul Station and traveled to Busan."
Format: Place: <comma_separated_list>
```

## Q&A with Grounding

Limit the scope of knowledge to prevent hallucinations.

**Prompt:**

```text
Answer using only the provided document. If the information is missing, respond "Data not found."
Document: Refunds are processed within 7 days of payment.
Question: What is the refund window?
```

## Code Generation

Specify versions and signatures for immediate usability.

**Prompt:**

```text
Write a Java 17 method to deduplicate a String array.
Signature: public List<String> dedupe(String[] values)
Constraint: Handle null and empty inputs.
```

## Inference

Request step-by-step reasoning but fix the final answer format for automated validation.

**Prompt:**

```text
Solve the following problem step-by-step.
Format: One step per line, with the final answer on the last line prefixed by "Final Answer:".
Problem: If 3 apples cost $6, what is the cost of 5 apples?
```

In production, track logs including `requestId`, `promptVersion`, `model`, `temperature`, and `latencyMs` to monitor
performance and cost effectively.

<br>

# Conclusion

Stable output stems from consistent LLM configuration and structured prompt design. By decoupling instructions, context,
and format, you can build predictable AI-driven systems.

The next article covers advanced techniques for complex tasks.

- <a href="/en/post/prompt-engineering-techniques" target="_blank">Next: Prompt Engineering Guide Part 2: From Zero-shot
  to Self-Consistency</a>
