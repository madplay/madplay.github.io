---
layout: post
title: "Claude Code 설치 방법과 첫 실행"
author: madplay
tags: claude-code anthropic ai-coding cli
description: "Anthropic이 공개한 터미널 기반 에이전트 코딩 도구, Claude Code를 설치하고 첫 실행까지 해보자."
category: AI
date: "2025-05-23 09:17:42"
comments: true
---

# Claude Code
Claude Code는 Anthropic이 만든 터미널 기반의 에이전트 코딩 도구다.
2025년 2월에 리서치 프리뷰로 공개된 뒤, 같은 해 5월 22일 "Code with Claude" 행사에서 정식 출시(GA)됐다.
IDE 플러그인이 아니라 터미널에서 직접 실행하는 CLI 형태이며, 프로젝트 파일을 읽고, 코드를 수정하고, 테스트를 실행하고, Git 커밋까지 자동으로 처리할 수 있다.

처음 접하면 "터미널에서 AI 도구를 쓴다"는 것 자체가 낯설 수 있다. 하지만 IDE 자동완성이 한 줄 단위로 돕는다면,
Claude Code는 파일 단위, 작업 단위로 돕는 도구에 가깝다. 택시 기사에게 "여기서 우회전"이라고 한 번씩 알려주는 것과
"이 주소로 가주세요"라고 목적지를 한 번에 전달하는 것의 차이와 비슷하다.

<br>

# 설치 방법

Claude Code를 설치하는 방법은 크게 두 가지다. npm을 통한 설치와 네이티브 인스톨러를 사용하는 방법이 있다.

## npm으로 설치하기

> 2025년 10월 기준으로 npm 설치는 deprecated 상태다. 호환성 목적이 아니라면 네이티브 인스톨러를 사용한다.

Node.js 18 이상이 설치된 환경에서 아래 명령어로 설치한다.

```bash
npm install -g @anthropic-ai/claude-code

claude --version
```

`-g` 플래그는 전역 설치를 의미하며, 설치 후 어떤 디렉터리에서든 `claude` 명령어를 사용할 수 있다.
이때 `sudo npm install -g`는 권한 충돌과 보안 문제를 일으킬 수 있으므로 사용하지 않는다.
권한 오류가 발생하면 npm 글로벌 디렉터리의 소유권 설정을 먼저 확인한다.

## 네이티브 인스톨러로 설치하기

> 네이티브 인스톨러는 2025년 10월 31일에 정식 제공됐다. GA 출시 시점(5월)에는 npm이 유일한 공식 설치 방법이었다.

Node.js 없이 설치할 수 있는 방법이다. 2025년 10월 이후 Anthropic 공식 문서에서 우선 권장하는 방식이기도 하다.

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew
brew install --cask claude-code
```

어떤 방법으로 설치하든 `claude --version`으로 정상 설치를 확인하면 된다.

<br>

# 첫 실행과 인증

설치 후 프로젝트 디렉터리에서 `claude`를 실행한다.

```bash
cd ~/workspace/order-service
claude
```

처음 실행하면 Anthropic 계정 인증이 진행된다. 브라우저가 열리고 로그인 화면이 뜨며, 인증이 끝나면 터미널로 돌아온다.

인증 이후에도 실행이 실패하는 경우가 있는데, 대부분 현재 디렉터리가 Git 저장소가 아니거나 의도한 브랜치가 아닌 경우다.

```bash
pwd
git branch --show-current
git status -s
```

Claude Code는 실행 시점의 디렉터리와 Git 상태를 기반으로 프로젝트를 인식한다.
저장소 루트에서 실행하는 것이 가장 안정적이다.

<br>

# 요청 작성 방식

요청을 보낼 때는 범위, 출력 형식, 제약 조건을 분리해서 작성하면 재작업이 줄어든다.

```text
OrderEventConsumer에서 NPE 가능 구간을 찾아줘.
수정안은 변경 파일 목록 + 이유 3줄 + 테스트 코드로 보여줘.
```

```text
PaymentService timeout 처리 누락을 보완해줘.
공개 API 시그니처는 바꾸지 말고, 단위 테스트 2개를 함께 제안해줘.
```

첫 번째 예시에서 "어디를"은 `OrderEventConsumer`, "무엇을"은 `NPE 가능 구간`, "어떤 형태로"는 `변경 파일 목록 + 이유 + 테스트`로 분리돼 있다.
이 세 가지가 뒤섞인 긴 문장보다, 분리된 짧은 요청이 결과 품질을 높인다.

그렇다면 반대로 어떤 요청이 결과를 흐리게 만들까?

```text
우리 서비스 전체적으로 코드 품질 개선해줘.
```

범위가 "전체"이고 기준이 "품질"이면, Claude Code는 어디서부터 시작할지 판단하기 어렵다.
응답이 길어지고, 토큰 사용량이 늘어나며, 결과가 산만해진다.

<br>

# 참고

- <a href="https://www.anthropic.com/news/claude-4" target="_blank" rel="nofollow">Anthropic: Introducing Claude 4</a>
- <a href="https://docs.anthropic.com/en/docs/claude-code/getting-started" target="_blank" rel="nofollow">Claude Code:
  Getting started</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release
  Notes</a>
