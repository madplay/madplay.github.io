---
layout: post
title: "Prompt Engineering Techniques"
author: madplay
tags: prompt-engineering zero-shot few-shot chain-of-thought self-consistency
description: "Summarizes practical prompt engineering techniques with implementation-oriented examples."
category: AI
date: "2024-02-03 21:43:00"
comments: true
lang: en
slug: prompt-engineering-techniques
permalink: /en/post/prompt-engineering-techniques
---

# Prompt Engineering Techniques

- <a href="/en/post/prompt-engineering-basics-and-llm-settings" target="_blank">Prompt Engineering Guide: 1. Prompt
  Basics and LLM Settings</a>
- Prompt Engineering Guide: 2. From Zero-shot to Self-Consistency
- <a href="/en/post/prompt-engineering-tree-of-thoughts-rag" target="_blank">Prompt Engineering Guide: 3. Tree of
  Thoughts, Retrieval Augmented Generation</a>

<br>

# Selecting the Appropriate Prompting Technique

Zero-shot, Few-shot, Chain-of-Thought, and Self-Consistency are distinct prompt design methodologies tailored for
specific problem sets. Zero-shot relies on direct instruction without examples, while Few-shot leverages demonstrations
to establish patterns. Chain-of-Thought (CoT) enhances accuracy for complex, multi-step tasks by exposing intermediate
reasoning, and Self-Consistency refines CoT by sampling multiple paths and selecting the most frequent answer.

Selection should be based on the problem domain—classification, pattern recognition, or multi-level inference—rather
than technical novelty. This article outlines the practical application of these four methods and discusses how to layer
them effectively for production use.

<br>

# Establishing Evaluation Metrics

A common pitfall is iterating on prompts without a stable evaluation baseline. At a minimum, track accuracy, format
compliance, latency, and token cost under identical conditions.

```text
Recommended Evaluation Metrics
- taskAccuracy: Percentage of correct answers or graded scores.
- formatPassRate: Compliance with JSON, XML, or specific label formats.
- p95LatencyMs: 95th percentile response time.
- avgTokens: Mean input and output token count.
```

While Chain-of-Thought often yields higher accuracy, its latency and cost trade-offs might make Few-shot a more
pragmatic choice for high-throughput systems.

<br>

# Zero-shot Prompting

Zero-shot is the baseline approach where the model receives instructions without explicit examples. Modern models,
refined through instruction tuning, handle simple classification and summarization tasks reliably using this method.

**Prompt:**

```text
Classify the following text as neutral, negative, or positive.
Text: "I think the upcoming vacation will be fine."
Sentiment:
```

**Output:**

```text
neutral
```

Zero-shot is the ideal starting point for prototyping due to its low complexity and minimal token overhead. Its
effectiveness stems from the model's pre-existing alignment with human instructions.

## Best Use Cases

- Simple classification with well-defined labels.
- Standard tasks like summarization or translation.
- Initial feasibility testing.

## Constraints

- Accuracy degrades in domain-specific tasks with specialized terminology.
- Format compliance can be inconsistent compared to Few-shot.

If Zero-shot falters, introduce examples (Few-shot) before upgrading the model or complicating the logic.

<br>

# Few-shot Prompting

Few-shot prompting provides input-output demonstrations to guide the model toward a specific pattern or tone. It is
particularly effective for tasks where criteria are subtle or difficult to articulate through instructions alone.

**Prompt:**

```text
Input: "That's really cool!" // Sentiment: positive
Input: "This is bad!" // Sentiment: negative
Input: "Wow, that movie was amazing!" // Sentiment: positive
Input: "What a terrible show!" // Sentiment:
Output: negative
```

Research indicates that the consistency of the demo's format is often as critical as the accuracy of the labels
themselves. Maintaining a stable pattern ensures the model aligns with the desired output structure.

## Best Use Cases

- Subtle classification (e.g., assessing customer complaint severity).
- Enforcing specific brand tones or complex output formats.
- Extraction tasks involving domain-specific dictionaries.

## Constraints

- Increased demonstrations lead to higher token costs and latency.
- Poorly selected examples can degrade performance relative to Zero-shot.
- Subject to prompt length limits (context window).

In production, prioritize high-quality representative and edge cases (3–5 examples) over a large volume of repetitive
demos.

<br>

# Chain-of-Thought (CoT) Prompting

CoT improves performance on complex reasoning tasks by inducing the model to generate intermediate steps. This is
effective for arithmetic, symbolic logic, and multi-step common sense reasoning.

**Standard CoT (Few-shot):**

```text
Q: The sum of the odd numbers in this group is even: 4, 8, 9, 15, 12, 2, 1.
A: The odd numbers are 9, 15, and 1. Their sum is 25, which is odd. The statement is false.

Q: The sum of the odd numbers in this group is even: 15, 32, 5, 13, 82, 7, 1.
A:
```

**Zero-shot CoT:**
Simply adding "Let's think step by step" can trigger reasoning paths without requiring manual examples.

**Prompt:**

```text
I bought 10 apples. I gave 2 to my neighbor and 2 to the repairman.
Then I bought 5 more and ate one. How many apples do I have left?
Let's think step by step. Provide the final count on the last line.
```

**Output:**

```text
1. Started with 10 apples.
2. Gave away 2+2=4 apples, leaving 6.
3. Bought 5 more, totaling 11.
4. Ate 1, leaving 10.
Final Answer: 10
```

## Best Use Cases

- Arithmetic and logical reasoning.
- Multi-step decision-making pipelines.
- Tasks where the rationale is as important as the final answer.

## Constraints

- Overkill for simple extraction or classification, leading to unnecessary latency.
- Effectiveness correlates strongly with model size; smaller models may produce "hallucinated" reasoning.
- Requires validation of the final answer, as the model may provide plausible but incorrect steps.

<br>

# Self-Consistency

Self-Consistency extends CoT by sampling multiple reasoning paths and selecting the most consistent final answer via
majority vote. This mitigates the risk of a single "wrong turn" in a model's reasoning chain.

```text
Question:
When I was 6, my sister was half my age. If I am 70 now, how old is my sister?

Path 1 Result: 67
Path 2 Result: 67
Path 3 Result: 35

Final Selection (Majority): 67
```

By solving the problem multiple times, you normalize the stochastic nature of the model's output.

## Best Use Cases

- High-stakes reasoning where accuracy is critical.
- Logic/Math tasks where correct answers can be verified through redundancy.
- Mitigating instability in complex CoT prompts.

## Constraints

- Significantly higher cost and latency due to multiple invocations.
- Requires clear aggregation and tie-breaking rules.
- Does not guarantee correctness if the model has a systematic bias toward a specific incorrect answer.

<br>

# Conclusion

Zero-shot, Few-shot, CoT, and Self-Consistency are not competing techniques but a progression. The most cost-effective
strategy is to baseline with Zero-shot, optimize with Few-shot, and reserve CoT and Self-Consistency for complex
reasoning bottlenecks.

The next article explores Tree of Thoughts for deeper search and Retrieval Augmented Generation (RAG) for external
knowledge integration.

- <a href="/en/post/prompt-engineering-tree-of-thoughts-rag" target="_blank">Next: Prompt Engineering Guide Part 3: Tree
  of Thoughts and RAG</a>

## References

- <a href="https://www.promptingguide.ai/techniques/zeroshot" target="_blank" rel="nofollow">Prompt Engineering Guide:
  Zero-shot Prompting</a>
- <a href="https://www.promptingguide.ai/techniques/fewshot" target="_blank" rel="nofollow">Prompt Engineering Guide:
  Few-shot Prompting</a>
- <a href="https://www.promptingguide.ai/techniques/cot" target="_blank" rel="nofollow">Prompt Engineering Guide:
  Chain-of-Thought Prompting</a>
- <a href="https://www.promptingguide.ai/techniques/consistency" target="_blank" rel="nofollow">Prompt Engineering
  Guide: Self-Consistency</a>
