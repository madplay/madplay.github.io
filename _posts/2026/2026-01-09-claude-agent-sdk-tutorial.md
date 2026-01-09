---
layout: post
title: "Claude Agent SDK로 나만의 AI 에이전트 만들기"
author: madplay
tags: claude-agent-sdk ai-agent mcp typescript anthropic
description: "Claude Agent SDK의 구조와 핵심 API를 살펴보고, 커스텀 도구와 훅으로 에이전트를 제어하는 방법을 알아본다."
category: AI
date: "2026-01-09 20:34:00"
comments: true
---

# CLI 대신 코드로 에이전트를 다룰 수 있을까?

터미널에서 Claude Code를 쓰는 개발자라면, 이 에이전트의 능력을 내 애플리케이션 안에서 프로그래밍 방식으로 활용하고 싶었던 적이 있을 것이다.
PR이 올라오면 자동으로 코드 리뷰를 돌리거나, 특정 디렉터리의 변경을 감지해 테스트를 실행하거나,
사내 API를 에이전트에게 도구로 제공해 자율적으로 데이터를 조회하게 만들고 싶은 경우다.

Claude Agent SDK는 이런 요구를 해결하기 위해 Anthropic이 공개한 SDK다. Python과 TypeScript를 모두 지원한다.
Claude Code CLI를 서브프로세스로 감싸서, 코드에서 프롬프트를 보내고 응답을 스트리밍으로 받고
도구 호출을 가로채는 것까지 프로그래밍할 수 있게 해 준다.

<br>

# SDK의 구조와 동작 원리

Claude Agent SDK는 Claude Code CLI 위에 놓인 TypeScript 래퍼다.
SDK가 프롬프트를 보내면 내부적으로 Claude Code CLI 프로세스를 실행하고, JSON 기반 프로토콜로 메시지를 주고받는다.
Claude Code가 가진 모든 도구(Read, Write, Edit, Bash 등)를 그대로 사용할 수 있고,
여기에 커스텀 도구와 훅을 더해 에이전트의 행동을 세밀하게 제어하는 구조다.

<pre class="mermaid">
flowchart TD
    A["TypeScript 애플리케이션"] --> B["Claude Agent SDK"]
    B -->|"query()"| C["단발성 질의 / 세션 기반 대화"]
    C --> D["Claude Code CLI (subprocess)"]
    D --> E["Claude 모델 + 도구 실행"]
</pre>

설치는 npm 한 줄이면 된다. Claude Code CLI가 **패키지에 번들로 포함**되어 있어서 별도 설치가 필요 없다.

```bash
npm install @anthropic-ai/claude-agent-sdk
```

<br>

# 단발성 질의: query()

가장 간단한 사용법은 `query()` 함수다. 프롬프트를 보내면 응답 메시지를 비동기 이터레이터로 돌려준다.

> 본문의 코드 예제는 모두 TypeScript 기준이며, `@anthropic-ai/claude-agent-sdk` 0.2.x와 Node.js 18 이상 환경을 전제로 한다.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "TypeScript의 타입 추론이 어떻게 동작하는지 한 문단으로 설명해줘",
})) {
  if (message.type === "assistant") {
    // message.message는 Anthropic SDK의 BetaMessage 객체다
    for (const block of message.message.content) {
      if (block.type === "text") {
        console.log(block.text);
      }
    }
  }
}
```

`query()`는 **상태를 유지하지 않는다.** 한 번 질문하고 한 번 답을 받는 구조라서,
단순 코드 생성이나 일회성 분석 작업에 적합하다.

옵션을 추가하면 동작을 조절할 수 있다.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "src/ 디렉터리의 구조를 분석해줘",
  options: {
    systemPrompt: "당신은 시니어 백엔드 엔지니어입니다.",
    maxTurns: 3,
    cwd: "/home/user/my-project",
    allowedTools: ["Read", "Bash"],
  },
})) {
  console.log(message);
}
```

`cwd`는 에이전트가 작업할 디렉터리를 지정하고, `allowedTools`는 사전 승인할 도구 목록이다.
`maxTurns`는 에이전트가 도구를 호출하고 다시 추론하는 반복 횟수의 상한을 설정한다.

<br>

# 대화형 세션: resume

여러 턴에 걸친 대화가 필요하면 세션 ID를 캡처한 뒤 `resume` 옵션으로 이어간다.
첫 번째 질의에서 세션 ID를 얻고, 후속 질의에서 그 ID를 넘기는 구조다.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;

// 첫 번째 질의: 세션 ID를 캡처한다
for await (const message of query({
  prompt: "git diff HEAD~1을 분석하고 리뷰해줘",
  options: {
    systemPrompt: "당신은 코드 리뷰어입니다. 변경 사항을 분석하고 개선점을 제안합니다.",
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

// 후속 질문: 앞선 맥락을 이어간다
for await (const message of query({
  prompt: "보안 관점에서 추가로 확인할 부분이 있어?",
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

첫 번째 질문의 맥락이 두 번째 질문까지 이어지므로, "앞서 분석한 diff"를 기억한 채로 보안 리뷰를 수행한다.
세션은 명시적으로 종료하지 않아도 된다. `query()`의 이터레이션이 끝나면 세션 상태가 자동으로 보존된다.
같은 `sessionId`를 `resume`에 넘기면 몇 번이든 이전 맥락을 이어갈 수 있다.
자동 코드 리뷰 파이프라인이나 대화형 디버깅 도구를 만들 때 이 패턴이 유용하다.

<br>

# 커스텀 도구 만들기

SDK의 핵심 기능 중 하나는 함수를 에이전트의 도구로 등록하는 것이다.
MCP 서버를 별도 프로세스로 띄울 필요 없이, `tool()` 함수와 Zod 스키마로 정의하면 **인프로세스 MCP 서버**가 만들어진다.

PR 코멘트를 조회하고 등록하는 도구를 예로 들어 보자.

```typescript
import { z } from "zod";
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const getPrComments = tool(
  "get_pr_comments",
  "PR 번호로 리뷰 코멘트 목록을 조회한다",
  { pr_number: z.number() },
  async (args) => {
    // 실제로는 GitHub API 등을 호출
    const comments = await fetchPrComments(args.pr_number);
    return {
      content: [{ type: "text", text: `PR #${args.pr_number}: ${comments}` }],
    };
  }
);

const postReviewComment = tool(
  "post_review_comment",
  "PR에 리뷰 코멘트를 등록한다",
  { pr_number: z.number(), body: z.string() },
  async (args) => {
    const result = await createReviewComment(args.pr_number, args.body);
    return {
      content: [{ type: "text", text: `코멘트 등록 결과: ${result}` }],
    };
  }
);

const reviewServer = createSdkMcpServer({
  name: "review-tools",
  version: "1.0.0",
  tools: [getPrComments, postReviewComment],
});
```

만든 서버를 옵션에 넣으면 에이전트가 도구를 인식하고, 필요할 때 알아서 호출한다.

```typescript
for await (const message of query({
  prompt: "PR #42의 리뷰 코멘트를 확인해줘",
  options: {
    mcpServers: { review: reviewServer },
    // 도구 이름은 mcp__{서버명}__{도구명} 형식이다
    allowedTools: ["mcp__review__get_pr_comments", "mcp__review__post_review_comment"],
    systemPrompt: "당신은 코드 리뷰 보조 에이전트입니다. PR 관련 질문에 도구를 활용해 답변합니다.",
  },
})) {
  console.log(message);
}
```

외부 MCP 서버와 인프로세스 서버를 동시에 사용하는 것도 가능하다.
사내 시스템은 인프로세스로, 외부 서비스(GitHub, Jira 등)는 <a href="/post/claude-code-mcp-setup" target="_blank">기존 MCP 서버를 그대로 연결</a>하면 된다.

```typescript
const options = {
  mcpServers: {
    review: reviewServer,                             // 인프로세스
    github: {                                        // 외부 프로세스
      type: "stdio" as const,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
    },
  },
};
```

> 참고로 인프로세스 서버는 별도 프로세스를 띄우지 않고 애플리케이션과 같은 프로세스 안에서 동작하는 MCP 서버다.
> `type: "stdio"` 방식의 외부 MCP 서버는 별도 프로세스를 띄우고 stdin/stdout으로 JSON-RPC 메시지를 주고받아야 하지만,
> 인프로세스 서버는 이 과정 없이 함수 호출로 바로 처리되므로 응답이 빠르고 디버깅도 쉽다.

<br>

# 훅(Hook)으로 에이전트의 행동을 제어하기

에이전트가 도구를 호출하기 전이나 후에 콜백 함수를 끼워 넣을 수 있다.
이를 훅이라 하며, 위험한 명령어를 차단하거나 도구 호출 결과를 로깅하는 등의 용도로 쓴다.

```typescript
import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

const BLOCKED_PATTERNS = ["rm -rf", "DROP TABLE", "shutdown"];

// 실제 시그니처는 (input, toolUseID, options)이지만, 여기서는 input만 사용한다
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
          permissionDecisionReason: `차단된 패턴: ${pattern}`,
        },
      };
    }
  }

  return {};
};

for await (const message of query({
  prompt: "프로젝트를 정리해줘",
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

이 훅이 등록되면 에이전트가 `rm -rf`나 `DROP TABLE`을 포함한 Bash 명령어를 시도할 때 자동으로 거부된다.
에이전트는 거부 사유를 전달받고, 다른 접근 방식을 시도한다.

<br>

# 도구 권한은 어떻게 관리할까?

SDK는 도구 사용 권한을 세 단계로 관리한다.

- `allowedTools` → 사전 승인. 목록에 있으면 확인 없이 즉시 실행한다.
- `permissionMode` → 사전 승인 목록에 없는 도구의 기본 처리 방식이다. 여러 모드가 있는데, 예를 들어 `'acceptEdits'`로 설정하면 파일 수정 도구를 자동 승인한다.
- `disallowedTools` → 차단 목록. 어떤 상황에서도 실행하지 않는다.

예를 들어 코드 리뷰 에이전트라면 파일을 읽는 것은 허용하되, 직접 수정은 차단하는 설정이 적절하다.

```typescript
const options = {
  allowedTools: ["Read", "Bash"],
  disallowedTools: ["Write", "Edit"],
};
```

자동화 파이프라인에서 에이전트가 의도치 않게 파일을 수정하거나 위험한 명령어를 실행하는 사고를 예방하려면,
`allowedTools`를 최소한으로 잡고 `disallowedTools`로 명시적으로 차단하는 편이 안전하다.

<br>

# 에러가 발생하면 어떻게 잡을까?

SDK는 메시지 스트림과 try-catch를 조합해 에러를 처리한다.
응답 메시지의 `error` 필드로 API 수준 에러를 확인하고, 프로세스 수준 에러는 예외로 잡는다.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

try {
  for await (const message of query({ prompt: "Hello" })) {
    if (message.type === "assistant" && message.error) {
      switch (message.error) {
        case "authentication_failed":
          console.error("API 키가 유효하지 않습니다.");
          break;
        case "rate_limit":
          console.error("요청 한도를 초과했습니다.");
          break;
        case "server_error":
          console.error("서버 오류가 발생했습니다.");
          break;
        default:
          console.error(`에러 발생: ${message.error}`);
      }
    }

    if ("result" in message) {
      console.log(message.result);
    }
  }
} catch (err) {
  // CLI 프로세스 실행 실패, 연결 끊김 등
  console.error("프로세스 에러:", err);
}
```

`authentication_failed`는 API 키가 잘못되었거나 만료된 경우, `rate_limit`는 요청 한도를 초과했을 때, `server_error`는 서버 측 문제일 때 나타난다.
이 외에도 `billing_error`, `invalid_request`, `unknown` 타입이 있으므로 `default` 분기를 반드시 포함해야 한다.
자동화 파이프라인에서는 이 에러들을 잡아서 슬랙과 같은 메신저로 알림을 보내거나 재시도 로직을 태우는 식으로 활용한다.

<br>

# 실전 활용: PR 자동 리뷰 에이전트

지금까지 다룬 요소를 조합하면, PR이 올라올 때마다 자동으로 코드를 리뷰하는 에이전트를 만들 수 있다.

```typescript
import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

const blockWrites: HookCallback = async (inputData) => {
  const toolName = (inputData as any).tool_name;
  if (toolName === "Write" || toolName === "Edit") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "리뷰 에이전트는 파일을 수정할 수 없습니다.",
      },
    };
  }
  return {};
};

async function reviewPr(repoPath: string, baseBranch = "main"): Promise<string> {
  const reviewResult: string[] = [];

  for await (const message of query({
    prompt:
      `git diff ${baseBranch}...HEAD의 변경 사항을 리뷰해줘. ` +
      "파일별로 주요 피드백을 정리해줘.",
    options: {
      systemPrompt:
        "당신은 시니어 백엔드 엔지니어 코드 리뷰어입니다. " +
        "변경 사항을 분석하고 버그, 성능 문제, 보안 취약점을 짚어주세요. " +
        "칭찬할 부분이 있으면 함께 언급해주세요.",
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

`disallowedTools`와 훅을 이중으로 걸어 에이전트가 코드를 수정하지 못하게 방어했다.
에이전트는 `Read`와 `Bash`만 사용해서 diff를 읽고, 파일을 탐색하고, 리뷰 결과를 텍스트로 돌려준다.
이 스크립트를 CI 파이프라인에 넣으면 PR마다 자동 리뷰가 돌아가는 구조가 완성된다.

<br>

# 도입 전 체크리스트

SDK에도 몇 가지 제약이 있다.

**서브프로세스 기반이라는 점을 인식해야 한다.**
SDK는 내부적으로 Claude Code CLI를 서브프로세스로 실행한다.
Claude API를 직접 호출하는 것보다 오버헤드가 크고, CLI의 초기 로딩 시간이 추가된다.
초당 수백 건의 요청을 처리해야 하는 환경보다는 CI/CD 파이프라인이나 배치 작업처럼
요청 빈도가 낮고 건당 처리 시간이 긴 작업에 적합하다.

**도구 권한 설계가 보안의 핵심이다.**
자동화 환경에서 에이전트에게 `Bash` 도구를 열어 두면, 의도치 않은 시스템 명령어가 실행될 수 있다.
`allowedTools`는 최소 권한 원칙으로 설정하고, 훅으로 추가 검증을 거는 이중 방어가 바람직하다.
특히 **프로덕션 환경에서는 샌드박스 안에서 에이전트를 실행하는 것을 권장**한다.

<br>

# 에이전트를 코드로 다룬다는 것

Claude Agent SDK는 터미널 안에 머물던 에이전트를 코드 레벨로 꺼낼 수 있는 도구다.
에이전트를 띄우고, 대화하고, 도구를 붙이고, 행동을 제한하는 것까지 코드 한 곳에서 해결할 수 있다.
아직 초기 버전이라 API가 바뀔 수 있지만, 에이전트를 코드로 제어한다는 방향 자체는 참 흥미롭다고 생각한다.

그나저나 새로운 것들이 참 금방 나온다.

<br>

# 참고한 문서

- <a href="https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk" target="_blank" rel="nofollow">npm: @anthropic-ai/claude-agent-sdk</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/overview" target="_blank" rel="nofollow">Claude Code 공식 가이드</a>
