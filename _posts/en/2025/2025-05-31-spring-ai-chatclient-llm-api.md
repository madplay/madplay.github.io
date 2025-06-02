---
layout: post
title: "Building an LLM API with Spring AI"
author: madplay
tags: spring spring-ai springboot llm chatclient
description: "Walk through Spring AI's ChatClient and ChatModel abstractions, dependency setup, LLM integration, and a simple chat API from start to finish."
category: Spring
date: "2025-05-31 21:47:00"
comments: true
lang: en
slug: spring-ai-chatclient-llm-api
permalink: /en/post/spring-ai-chatclient-llm-api
---

# The Most Spring-like Way to Connect an LLM

OpenAI provides a REST API. With a single API key, you can call GPT using `HttpClient`, and many projects start exactly that way.
The problem comes next. Once you start assembling JSON request bodies, parsing responses, branching on error codes,
and layering retry logic, the code grows fast. Switching vendors means rewriting every call site.

```java
// Boilerplate for calling OpenAI directly without Spring AI
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
    .header("Authorization", "Bearer " + apiKey)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("""
        {
          "model": "gpt-4o",
          "messages": [{"role": "user", "content": "Recommend a beginner Java book"}]
        }
        """))
    .build();

HttpResponse<String> response = httpClient.send(request,
    HttpResponse.BodyHandlers.ofString());
// From here: JSON parsing, error handling, retry logic...
```

Spring AI eliminates this repetition the Spring way.
Just as `DataSource` hides JDBC drivers and `RestClient` hides HTTP libraries, `ChatClient` abstracts away the API differences between LLM vendors.
Swap a dependency and a config file, and you can switch from OpenAI to Anthropic or a local Ollama instance.
This post starts with Spring AI's core abstraction layer, then walks through building a simple book recommendation API to see how it all fits together.

<br>

# Core Abstractions in Spring AI

## ChatModel and ChatClient

Spring AI's architecture mirrors Spring's HTTP client abstractions.

`ChatModel` is the interface that wraps LLM vendors.
Each vendor (OpenAI, Anthropic, Ollama, etc.) provides its own implementation of this interface.
Just as `RestTemplate` hides HTTP library details, `ChatModel` hides vendor-specific API differences.

`ChatClient` is a fluent API that uses `ChatModel` internally.
If `RestTemplate` is the imperative style, then `RestClient` expresses the same operations more concisely through method chaining.
Similarly, `ChatClient` composes LLM calls with a flow like `.prompt().user(...).call().content()`.

Here is the relationship at a glance.

| HTTP World | LLM World | Role |
|---|---|---|
| `RestTemplate` | `ChatModel` | Vendor/protocol abstraction |
| `RestClient` | `ChatClient` | Fluent API |

In most application code, you interact directly with `ChatClient`.
The only time you touch `ChatModel` directly is when you need custom configuration.

## Prompt and Message Structure

Requests to the LLM are represented as `Prompt` objects.
A `Prompt` is a container wrapping a list of messages, and each message has a type based on its role.

- `SystemMessage` → the system prompt that defines the model's behavioral rules
- `UserMessage` → the user's input
- `AssistantMessage` → the model's response (used when constructing conversation history)

System prompts and user prompts serve different purposes.
A system prompt is essentially a directive that specifies the tone, scope, and format the model should follow in its responses.
Rules like "act as a book recommendation expert" or "respond in JSON format" go here.
A user prompt, on the other hand, carries the actual question or request.
"Recommend an immersive SF book" is a user prompt.

A well-crafted system prompt keeps responses consistent in format and scope regardless of the user's question.
Without one, the model may respond in a different format each time or expand beyond the intended scope.

Because these roles map to distinct code types, role-mixing mistakes surface at compile time when assembling messages.

<br>

# Project Setup

> The examples in this post are based on Spring AI 1.0 and Spring Boot 3.4.

## Dependencies and BOM

Spring AI manages versions through a BOM (Bill of Materials).
Add the following dependencies to your Spring Boot project.

> In pre-1.0 milestone versions, the artifact name was `spring-ai-openai-spring-boot-starter`.
> If you are upgrading an existing project, watch out for the artifact name change.

```groovy
dependencyManagement {
    imports {
        mavenBom "org.springframework.ai:spring-ai-bom:1.0.0"
    }
}

dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
}
```

To use Anthropic instead of OpenAI, just change the artifact name.
Replace `spring-ai-starter-model-openai` with `spring-ai-starter-model-anthropic`, and the `ChatModel` implementation swaps out.
No changes needed in application code that uses `ChatClient`.

## Configuration

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
```

`temperature` accepts a value between 0.0 and 2.0. Lower values produce more deterministic responses; higher values produce more varied ones.
Note that early reasoning models like o1-preview and o1-mini do not support this parameter, so check compatibility when switching models.

Never put API keys directly in config files. Inject them via environment variables as shown above, or use a secret manager.
For local development, store the key in a `.env` file and add it to `.gitignore` to prevent accidental commits.

> Once an API key enters Git history, retrieval is difficult. Register keys in environment variables or a secret manager
> as soon as they are issued, and keep only references in config files.

<br>

# Building a Book Recommendation API

This section walks through `ChatClient` usage by building a simple book recommendation API.
The user sends a genre and a mood, and the LLM recommends a matching book.

## Controller and ChatClient Assembly

First, define a record for the response.

```java
public record BookRecommendation(
    String title,
    String author,
    String reason
) {}
```

The controller injects `ChatClient` and composes the LLM call.

```java
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final ChatClient chatClient;

    public BookController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/recommend")
    public BookRecommendation recommend(
            @RequestParam String genre,
            @RequestParam String mood) {
        return chatClient.prompt()
            .user("Genre: " + genre + ", Mood: " + mood + ". Recommend one book that fits.")
            .call()
            .entity(BookRecommendation.class);
    }
}
```

Notice how `ChatClient.Builder` is injected through the constructor.
Spring AI's auto-configuration registers a `ChatClient.Builder` bean, so the controller only needs to call `build()`.
`.entity(BookRecommendation.class)` converts the LLM response directly into a Java object.
Under the hood, `BeanOutputConverter` sends a JSON schema to the LLM, and `ChatClient` handles deserializing the response.

<br>

# Extracting the System Prompt

Embedding the system prompt in code means recompilation on every change.
Extracting it to a resource file lets you manage prompts independently.

## Template in a Resource File

Spring AI supports a `{variable}` template syntax.
Create `src/main/resources/prompts/book-recommend-system.txt` with the following content.

```text
You are a book recommendation expert.
When a user provides a genre and mood, you recommend one book that fits.
Every recommendation must include the title, author, and reason.
Target genre: {genre}
```

## Registering Defaults on the ChatClient Bean

You can register the system prompt as a default by defining the `ChatClient` bean explicitly.

```java
@Configuration
public class ChatClientConfig {

    @Bean
    public ChatClient chatClient(
            ChatClient.Builder builder,
            @Value("classpath:prompts/book-recommend-system.txt") Resource systemPrompt) {
        return builder
            .defaultSystem(systemPrompt)
            .build();
    }
}
```

With this setup, the controller no longer needs to specify the system prompt on every call.
The system prompt is automatically included when calling `chatClient.prompt().user(...)`.

The controller also changes to inject the `ChatClient` bean directly.

```java
public BookController(ChatClient chatClient) {
    this.chatClient = chatClient;
}
```

## Prompt Caching and Cost Savings

Fixing the system prompt also has cost benefits.
OpenAI automatically caches prompts when the prefix matches a previous request, and Anthropic lets you designate the system prompt as cacheable.
When caching kicks in, OpenAI cuts input token costs by 50%, and Anthropic reduces cache-read costs by up to 90%.
Response latency can also drop by over 80%.
Each vendor has minimum token requirements (OpenAI: 1,024 tokens, Anthropic: 1,024 to 4,096 tokens), so caching benefits grow as prompts get longer.

<br>

# Verification and Troubleshooting

## Testing with curl

Start the application and send a request with curl.

```bash
curl "http://localhost:8080/api/books/recommend?genre=SF&mood=immersive"
```

A successful response returns JSON like this.

```json
{
  "title": "Project Hail Mary",
  "author": "Andy Weir",
  "reason": "A science fiction novel where you can deeply immerse yourself in the scientific problem-solving process."
}
```

LLM responses vary between calls, so your actual results may differ from this example.

## Common Issues

When first integrating Spring AI, infrastructure configuration tends to cause more friction than the LLM itself.

| Symptom | Cause | What to check |
|---|---|---|
| 401 Unauthorized | Missing or invalid API key | Run `echo $OPENAI_API_KEY` to verify it is set; watch for leading/trailing whitespace when copying |
| 400 Bad Request | Model name typo, API spec mismatch | Typos like `gpt4o` instead of `gpt-4o` are the most common; verify the model name in the vendor's official docs |
| 429 Too Many Requests | Rate limit exceeded | Free-tier rate limits are low; add intervals between requests or cache responses |
| Timeout | LLM response latency (seconds to tens of seconds) | Set `RestClient` connection/read timeouts generously |
| JSON parse failure | LLM returns an unexpected format | Lower `temperature` and explicitly specify the output format in the system prompt |

Timeouts feel very different from typical REST APIs. Since the model generates tokens one at a time, longer responses mean longer wait times.
JSON parse failures happen when the model appends explanatory text outside the JSON or renames fields on its own.

<br>

# Comparison with Direct HTTP Calls

To decide whether to adopt Spring AI, weigh what you gain and what you lose compared to direct HTTP calls.

| Aspect | Direct HTTP call | Spring AI |
|---|---|---|
| Vendor switch | Rewrite every call site | Change only dependency and config |
| Prompt management | Strings scattered across code | Resource file separation, template variable substitution |
| Response parsing | Manual parsing with `ObjectMapper`, exception handling | One-liner conversion to Java object with `.entity()` |
| Testing | Requires live API calls or an HTTP mock server | Mock the `ChatModel` interface and inject |
| Vendor-specific features | Full access | May need to drop below the abstraction layer |
| Debugging | Inspect request/response directly | One extra abstraction layer to trace through |
| Dependencies | Minimal (`java.net.http` is enough) | Spring AI BOM + vendor-specific starter |

If you expect to switch vendors frequently or want structured prompt and response management, Spring AI is a good fit.
On the other hand, if you need fine-grained control over streaming responses or plan to use vendor-specific features extensively,
direct HTTP calls may offer more flexibility.

<br>

# Wrapping Up

For developers already at home in the Spring ecosystem, the biggest advantage of Spring AI is arguably that LLM integration follows the same familiar patterns.

This post covered composing simple calls with `ChatClient`, but Spring AI offers much more beyond that.
Advisors let you build pipelines that append context before sending a request to the LLM or post-process the response.
Pair that with a vector store, and RAG (retrieving external documents and injecting them into the prompt) extends naturally on top of `ChatClient`.

<br>

# References

- <a href="https://docs.spring.io/spring-ai/reference/" target="_blank" rel="nofollow">Spring AI Reference Documentation</a>
- <a href="https://github.com/spring-projects/spring-ai" target="_blank" rel="nofollow">Spring AI GitHub Repository</a>
