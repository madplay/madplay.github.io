---
layout: post
title: "Claude Code에서 MCP 서버를 연동하는 방법과 주의할 점"
author: madplay
tags: claude-code mcp anthropic automation
description: "MCP를 활용하면 Claude Code가 외부 시스템까지 다룰 수 있다. MCP 서버 연결 방법을 알아보자!"
category: AI
date: "2025-06-21 20:41:09"
comments: true
---

# 외부 도구 연결과 MCP
Claude Code 단독으로도 파일을 읽고 코드를 수정할 수 있지만, 이슈 트래커나 운영 로그 같은 외부 시스템에는 직접 접근하지 못한다.
이때 사용하는 것이 MCP(Model Context Protocol)다. MCP는 Claude Code가 외부 데이터 소스나 도구에 접근할 수 있게 해주는 프로토콜이다.
전동드릴 본체는 같아도 비트를 바꿔 끼우면 나사 조이기, 구멍 뚫기, 연마 등 다른 작업이 가능해지는 것처럼,
Claude Code에 MCP 서버를 연결하면 접근할 수 있는 정보의 범위가 달라진다.

2025년 6월 18일, Claude Code에 원격 MCP 서버 지원이 추가됐다. 이전에는 로컬에서 stdio 방식으로만 MCP 서버를 연결할 수 있었는데,
이 업데이트 이후로 Streamable HTTP 기반 원격 서버에 OAuth 인증을 붙여 연결하는 것이 가능해졌다.
서버 제공자가 URL만 공개하면 로컬에서 프로세스를 직접 띄우지 않아도 되고, 인증도 브라우저에서 한 번만 수행하면 액세스 토큰이 로컬에 저장되는 구조다.

<br>

# MCP 서버를 추가하는 명령어

Claude Code에서 MCP 서버를 추가하는 기본 명령어는 `claude mcp add`다.
전송 방식(transport)에 따라 세 가지 형태가 있다.

## HTTP 원격 서버

Streamable HTTP를 사용하는 원격 서버에 연결하는 방식이다. Anthropic 공식 문서에서 권장하는 방법이기도 하다.
URL만 지정하면 로컬에 서버 프로세스를 띄울 필요가 없고, 서버 측의 업데이트나 스케일링도 제공자가 관리한다.
인증이 필요한 서버라면 처음 연결 시 브라우저가 열리면서 OAuth 인증이 진행되고, 발급된 토큰은 로컬에 저장된다.

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

## SSE 원격 서버

HTTP 이전에 사용하던 방식으로, 2025년 6월 기준 deprecated 상태다. 기존에 SSE로 구성한 서버가 있다면 아직 동작하지만,
새로 구성하는 경우에는 HTTP를 사용하는 것이 권장사항에 맞다.

```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

## 로컬 stdio 서버

MCP 서버를 로컬 프로세스로 직접 실행하는 방식이다. `--` 뒤에 실행할 명령어를 넣는다.

```bash
claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
```

환경 변수가 필요하면 `--env` 옵션으로 전달한다.

```bash
claude mcp add --transport stdio --env GITHUB_TOKEN=ghp_xxx github -- npx -y @modelcontextprotocol/server-github
```

주의할 점이 하나 있다. `--transport`, `--env`, `--scope` 같은 옵션은 반드시 서버 이름 **앞에** 위치해야 한다.
순서가 바뀌면 파싱에 실패한다.

추가한 서버 목록은 아래 명령어로 확인할 수 있다.

```bash
claude mcp list
```

<br>

# MCP 서버의 적용 범위(scope)

MCP 서버를 추가할 때 `--scope` 옵션으로 적용 범위를 지정할 수 있다.

```bash
# 현재 프로젝트에서만 사용 (기본값)
claude mcp add --scope local github -- npx -y @modelcontextprotocol/server-github

# 팀 공유: .mcp.json 파일에 저장돼 저장소에 커밋 가능
claude mcp add --scope project github -- npx -y @modelcontextprotocol/server-github

# 모든 프로젝트에서 사용
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github
```

`project` 스코프로 추가하면 프로젝트 루트의 `.mcp.json` 파일에 설정이 저장된다.
이 파일을 저장소에 커밋하면 팀원도 동일한 MCP 서버 구성을 사용할 수 있다.

그렇다면 인증 토큰이 `.mcp.json`에 노출되지는 않을까?
`--env`로 전달한 값은 `.mcp.json`이 아닌 로컬 설정 파일에 별도로 저장된다.
따라서 서버 정의는 `project` 스코프로 공유하되, 토큰은 각 개발자의 로컬 환경에서 관리하는 구조가 된다.

<br>

# 연동 후 동작 흐름

MCP 서버가 연결된 상태에서 요청을 보내면,
Claude Code가 필요한 시점에 MCP 서버의 도구(tool)를 자동으로 호출한다.

예를 들어 GitHub MCP 서버가 연결된 상태에서 아래와 같은 요청을 보낸다고 하자.

```text
ISSUE-1234 이슈의 원인을 분석하고, 관련 코드에서 최소 수정안을 제안해줘.
변경 파일 목록과 테스트 전략을 함께 보여줘.
```

Claude Code는 이 요청을 처리하면서 필요한 시점에 GitHub MCP 서버를 통해 이슈 정보를 조회하고,
로컬 파일 시스템에서 관련 코드를 찾은 뒤, 두 정보를 결합해서 수정안을 만든다.
개발자가 "먼저 이슈를 조회하고, 그 다음 코드를 찾고..."와 같이 단계를 명시할 필요 없이,
Claude Code가 도구 호출 순서를 스스로 결정한다.

<br>

# 원격 MCP 인증 실패 시 대응

원격 MCP 서버를 사용할 때 가장 자주 마주치는 실패는 OAuth 인증 만료다.
토큰이 만료된 상태에서 도구 호출이 발생하면 Claude Code는 해당 MCP 서버를 사용하지 못하고 요청이 중단되거나 우회된다.

상태 확인은 아래 명령어로 진행할 수 있다.

```bash
claude mcp list
claude mcp get notion
```

인증이 필요한 서버는 `/mcp` 명령으로 브라우저 인증 화면을 다시 열어 재인증한다.

```bash
/mcp
```

<br>

# 참고
- <a href="https://www.anthropic.com/news/claude-code-remote-mcp" target="_blank" rel="nofollow">Anthropic: Remote MCP support in Claude Code</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/mcp" target="_blank" rel="nofollow">Claude Code: Connect to tools via MCP</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release Notes</a>
