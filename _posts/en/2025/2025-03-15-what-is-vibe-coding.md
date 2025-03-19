---
layout: post
title: "What Is Vibe Coding?"
author: madplay
tags: vibe-coding ai-coding llm prompt-engineering
description: "Andrej Karpathy coined the term vibe coding, a programming style where you describe what you want in plain English and let AI write the code. Where did it come from, how does it work, and what does it change?"
category: AI
date: "2025-03-15 08:23:00"
comments: true
lang: en
slug: what-is-vibe-coding
permalink: /en/post/what-is-vibe-coding
---

# Programming Without Reading Code

If you spend enough time with AI coding tools, you hit a peculiar inflection point.
Instead of writing code line by line, you say "build me this feature," run whatever the AI produces, and if it doesn't work, you ask for fixes in plain English.
Before you know it, a working program exists and you never actually read the code. One person decided to give this style of programming a name.

In February 2025, Andrej Karpathy, former OpenAI researcher and ex-head of AI at Tesla, posted this on X (Twitter):

> There's a new kind of coding I call "vibe coding", where you fully give in to the vibes,
> embrace exponentials, and forget that the code even exists.
>
> <a href="https://x.com/karpathy/status/1886192184808149383" target="_blank" rel="nofollow">Andrej Karpathy, 2025.02.02</a>

Programming where you "fully give in to the vibes and forget that the code even exists."
Karpathy called it **vibe coding**.
Whether it was the catchy name or the fact that so many developers were already doing something similar,
the post spread through the developer community fast.

<br>

# How Vibe Coding Works

The workflow is straightforward.
A developer describes what they want in natural language, and the AI generates code. The developer runs the output, and if the result does not match the intent,
they provide feedback in natural language again. The program takes shape through this loop.

The key difference is that the developer never touches the low-level implementation details.
In traditional programming, you name variables, structure conditionals, and design function signatures.
In vibe coding, you delegate all of that to the AI and focus on describing *what* you want to build.

The tools that enable this workflow already exist.
Cursor, GitHub Copilot, and Claude Code are the most prominent examples.
These tools accept natural language input, generate code, understand project context, and can even apply changes across multiple files.

<br>

# How It Differs from Autocomplete

"AI writes the code for you" sounds a lot like traditional code autocomplete, but the locus of control is fundamentally different.

Code autocomplete operates within the developer's writing flow.
You start typing a function, the AI suggests the rest, and you accept or reject one line at a time.
The developer drives; the AI assists.

Vibe coding flips this relationship.
You say "build a user login feature," the AI generates the entire implementation, and you review the output.
Control shifts toward the AI, and the developer's role moves closer to steering than building.

On the autonomy spectrum, the progression looks like this: code autocomplete → AI pair programming → vibe coding,
with AI autonomy increasing at each step.

<br>

# Where It Shines and Where It Falls Short

Vibe coding is not a universal solution. Its strengths and limitations are fairly well defined.

For rapid prototyping and idea validation, vibe coding is highly effective.
Building a quick web app over the weekend, writing a one-off data processing script,
or generating example code while learning a new technology are all solid use cases.
It excels in contexts where speed matters more than code quality, the "just make it work" scenarios.

Team projects with large codebases are a different story.
In an environment where multiple engineers maintain the same code, everyone needs to understand the intent and structure behind it.
If AI-generated code gets merged without anyone actually reading it, debugging becomes painful and technical debt accumulates fast.
Security-sensitive systems require even more caution. Vulnerabilities can hide in AI-generated code, and without proper review, they go undetected.

The core trade-off in vibe coding sits between **speed and understanding**.
You get results fast, but you risk losing deep comprehension of the code in the process.
Karpathy himself noted in his post that he uses this approach for "weekend projects where code quality is not a major concern."
Treating vibe coding as a prototyping tool and following up with hands-on code review and refinement helps manage the trade-off.

That said, skipping the code-writing step does not mean you can throw any prompt at the AI and expect good results.
There is a massive difference between saying "build me a login feature" and specifying input validation rules with error handling strategies.
<a href="/en/post/prompt-engineering-basics-and-llm-settings" target="_blank">How you structure your prompts</a> directly determines output quality,
and <a href="/en/post/prompt-engineering-techniques" target="_blank">learning prompting techniques</a> makes a tangible difference even in vibe coding.

<br>

# The Question Vibe Coding Raises

People with no coding background are building functional apps with AI, and experienced developers are shifting more of their workflow to natural language.
**The developer's role is gradually moving from "person who writes code" to "person who defines what to build and validates the output,"**
and vibe coding represents one facet of that shift.

Instead of "writing code," you might become a code picker, selecting from the AI's output, or you might orchestrate code like a conductor,
directing each section to complete the composition.
Either way, what the word "developer" points to is probably going to look quite different from what it means today.
