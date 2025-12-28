---
layout: post
title: "AI Agent Skills, 어떻게 만들고 어떻게 쓸까?"
author: madplay
tags: agent-skills skill-md claude-code cursor codex ai-coding
description: "매번 다시 설명하던 규칙과 절차, 스킬로 분리하면 재사용이 쉬워진다. Agent Skills의 구조와 작성 포인트를 알아보자!"
category: AI
date: "2025-12-28 14:22:07"
comments: true
---

# Agent Skills란 무엇일까
Claude Code, Cursor, Codex 같은 AI 에이전트를 쓰다 보면 매번 같은 맥락을 반복해서 알려줘야 할 때가 있다.
"테스트 계정은 제외해줘", "커밋 메시지는 이 형식으로 써줘" 같은 것들이다.
신입 개발자에게 매번 같은 설명을 반복하는 대신 온보딩 문서를 만들어두는 것처럼, 반복되는 작업 절차를 문서로 만들어두면 에이전트가 알아서 읽고 수행한다.
이것이 AI Agent Skills다.

Agent Skills는 Anthropic이 2025년 10월 16일에 처음 발표한 뒤, 같은 해 12월 18일에
<a href="https://agentskills.io/" target="_blank" rel="nofollow">agentskills.io</a>를 통해 오픈 스탠다드로 공개됐다.
YAML frontmatter와 마크다운 본문으로 구성된 `SKILL.md` 파일이 핵심이며, 한 번 만들어두면 여러 에이전트에서 그대로 사용할 수 있다.

<br>

# 스킬은 어떻게 구성할까?

스킬은 디렉터리 하나가 단위다. 필수 파일은 `SKILL.md` 하나뿐이고, 나머지는 필요에 따라 추가한다.

> <a href="https://agentskills.io/specification#skill-structure" target="_blank" rel="nofollow">참고 링크: Agent Skills Specification - Skill Structure</a>

```text
code-review/
├── SKILL.md              # 필수: 에이전트가 따를 지침
├── scripts/              # 선택: 에이전트가 직접 실행하는 스크립트
│   └── run-lint.sh
├── references/           # 선택: 필요할 때 읽는 보조 문서
│   └── review-checklist.md
└── assets/               # 선택: 템플릿, 설정 파일 등 정적 리소스
    └── comment-template.md
```

`scripts/`에는 에이전트가 실행할 스크립트를 둔다. 에이전트가 매번 코드를 새로 생성하지 않고 검증된 스크립트를 실행하므로, 운영 환경에서 돌리는 작업이라면 이 방식이 안정적이다.
`references/`에는 API 문서나 체크리스트처럼 분량이 긴 참조 자료를 분리해서 넣는다. 에이전트는 필요한 시점에만 이 파일을 읽기 때문에 컨텍스트 윈도우를 아낄 수 있다.
`assets/`에는 JSON 스키마, 설정 템플릿 같은 정적 리소스를 둔다. 에이전트가 직접 실행하지는 않지만, 참조하거나 복사해서 사용하는 파일이 여기에 해당한다.

<br>

# Progressive Disclosure: 스킬은 한꺼번에 로드되지 않는다

에이전트가 스킬을 다루는 방식은 세 단계로 나뉜다.
<a href="https://agentskills.io/specification#progressive-disclosure" target="_blank" rel="nofollow">공식 스펙</a>에서는 이를
Progressive Disclosure라고 부른다.

```text
Phase 1: Metadata (~100 tokens)
  └─ 모든 스킬의 name, description만 읽는다.

Phase 2: Instructions (< 5000 tokens 권장)
  └─ 작업과 관련된 스킬의 SKILL.md 전체를 읽는다.

Phase 3: Resources (필요한 만큼)
  └─ scripts/, references/, assets/ 파일을 필요할 때 읽는다.
```

이 구조 때문에 `description`이 가장 중요하다. Phase 1에서 에이전트가 "이 스킬을 활성화할지 말지"를 판단하는 유일한 근거가 `description`이기 때문이다.

<br>

# Frontmatter에서 먼저 볼 것

`SKILL.md`는 YAML frontmatter + 마크다운 본문으로 구성된다.

```yaml
---
name: api-test-runner
description: >-
  API 엔드포인트의 응답 상태, 스키마, 성능을 자동으로 검증한다.
  API 테스트, 엔드포인트 점검, 응답 검증이 필요할 때 사용한다.
---
```

필수 필드는 `name`과 `description` 두 개다.

## name 필드

`name`은 디렉터리 이름과 반드시 일치해야 한다.
소문자, 숫자, 하이픈만 허용되며 64자 이하로 제한된다.
하이픈으로 시작하거나 끝나는 것, 연속 하이픈(`--`)도 허용되지 않는다.

```yaml
# 유효
name: api-test-runner
name: kafka-connector-restart

# 무효
name: Order-Event-Review   # 대문자 불가
name: -order-event          # 하이픈으로 시작 불가
name: order--event          # 연속 하이픈 불가
```

## description 필드

`description`은 1024자 이하로, "무엇을 하는지(WHAT)"와 "언제 쓰는지(WHEN)"를 모두 포함해야 한다.

```yaml
# 나쁜 예: 무엇을 하는지만 있고, 언제 쓰는지가 없다
description: PDF를 도와줍니다.

# 좋은 예: WHAT + WHEN
description: >-
  PDF 파일에서 텍스트와 테이블을 추출하고, 폼을 채우고, 여러 PDF를 병합한다.
  PDF, 폼, 문서 추출 작업이 필요할 때 사용한다.
```

스킬이 발동되지 않을 때, 원인은 대부분 본문이 아니라 `description`에 있다.
<a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#writing-effective-descriptions" target="_blank" rel="nofollow">Anthropic 공식 가이드</a>에서도
"The description is critical for skill selection"이라고 명시하고 있다.

한 가지 주의할 점이 있다. `description`은 시스템 프롬프트에 주입되기 때문에 "나는", "당신은", "I can" 같은 1/2인칭 표현을 쓰면
시점이 섞여 스킬 탐색에 문제가 생길 수 있다. 3인칭 서술로 작성한다.

<br>

# 본문 작성 가이드

frontmatter 아래의 마크다운 본문은 에이전트가 따를 실제 지침이다. 포맷에 대한 공식 제약은 없지만, 효과적으로 작성하기 위한 기준은 있다.

```markdown
---
name: pr-review-guide
description: >-
  PR의 코드 변경을 리뷰하고, 컨벤션 위반과 잠재적 결함을 점검한다.
  코드 리뷰, PR 점검, 변경사항 검토가 필요할 때 사용한다.
---

# PR 코드 리뷰

## 워크플로우

### Step 1: 변경 범위 파악
PR의 변경 파일 목록을 확인하고, 핵심 변경과 부수 변경을 구분한다.

### Step 2: 컨벤션 점검
네이밍, 포맷, 패키지 구조가 프로젝트 컨벤션에 맞는지 확인한다.
- scripts/run-lint.sh를 실행하여 정적 분석 결과를 수집한다.
- references/review-checklist.md의 항목과 대조한다.

### Step 3: 결함 탐색
NPE 가능 구간, 리소스 미해제, 동시성 이슈 등 잠재적 결함을 점검한다.

### Step 4: 피드백 정리
심각도별로 분류하여 피드백을 정리한다.

## 사용 예시

사용자: "이 PR 리뷰해줘"
→ Step 1~4 실행
```

그렇다면 본문을 작성할 때 무엇을 의식해야 할까?

**500줄 이하로 유지한다.** `SKILL.md` 전체가 Phase 2에서 컨텍스트에 올라가기 때문에,
길어지면 그만큼 토큰을 소비한다. 분량이 넘치면 상세 내용을 `references/` 디렉터리로 분리하고
본문에서는 경로만 언급한다.

**에이전트가 이미 아는 내용은 생략한다.** "Java의 try-catch 문법은..."처럼 범용 지식을 스킬에 적을 필요는 없다.
"이 문단이 토큰 비용을 정당화하는가?"를 기준으로 판단하면 된다.

**참조는 1단계 이내로 유지한다.** `SKILL.md`가 `references/api-reference.md`를 참조하는 것은 괜찮지만,
그 참조 파일이 다시 다른 파일을 참조하면 에이전트가 제대로 따라가지 못할 수 있다.

```text
SKILL.md → references/api-reference.md   # 1단계: 정상
SKILL.md → references/a.md → data/b.md   # 2단계: 에이전트가 놓칠 수 있다
```

**트리거 조건은 description에만 적는다.** "언제 이 스킬을 쓰는지"를 본문에 또 쓰면 토큰 낭비다.
Phase 1에서 이미 `description`을 읽었기 때문이다.

<br>

# 스킬은 어떻게 만들고 검증할까

> Anthropic 공식 가이드에서는 "Claude로 스킬을 만들고, 다른 Claude로 테스트하라"는 방식을 권장한다.

에이전트가 `SKILL.md` 포맷을 이미 알고 있어서, frontmatter나 워크플로우 구조를 직접 잡아준다.

먼저 스킬 없이 에이전트와 일반 대화로 해당 작업을 한 번 수행해본다. 이 과정에서 반복적으로 알려줘야 했던 맥락이 스킬에 담을 내용이 된다.
그 뒤 에이전트에게 스킬 생성을 요청한다.

```text
방금 했던 BigQuery 분석 패턴을 스킬로 만들어줘.
테이블 스키마, 네이밍 규칙, 테스트 계정 필터링 규칙을 포함해줘.
```

에이전트가 생성한 초안을 저장한 뒤, 새 세션(또는 다른 에이전트)에서 스킬이 로드된 상태로 실제 작업을 시켜본다.
공식 가이드에서는 스킬을 만드는 인스턴스를 "Claude A", 테스트하는 인스턴스를 "Claude B"로 구분하는데,
같은 에이전트라도 세션을 분리하면 스킬이 의도대로 동작하는지 객관적으로 확인할 수 있기 때문이다.

이때 확인할 것은 다음과 같다.

- 스킬이 자동으로 활성화되는가?
- 지침을 잘 따르는가?
- 빠뜨리는 규칙이 있는가?

문제가 발견되면 다시 만드는 쪽 세션에서 수정을 요청한다.

```text
아까 만든 스킬로 지역별 매출 리포트를 요청했더니 테스트 계정을 필터링하지 않았어.
스킬에 필터링 규칙이 있긴 한데 잘 안 보이는 것 같아. 더 눈에 띄게 수정해줘.
```

이 사이클을 두세 번 반복하면 실제로 동작하는 스킬이 만들어진다.

<br>

# 표준 포맷과 구현체별 차이

`SKILL.md` 포맷 자체는 오픈 스탠다드로 동일하지만, 저장 경로나 수동 호출 방식은 구현체마다 달라질 수 있다.
즉, 같은 스킬이라도 포맷은 재사용할 수 있지만 설치 위치와 호출 문법까지 완전히 같다고 보기는 어렵다.

## 저장 경로는 구현체마다 다르다

스킬의 저장 경로는 에이전트마다 다르다. 이 경로는 agentskills.io 오픈 스탠다드의 범위가 아니라
각 구현체가 독자적으로 정한 것이다.

```bash
# Claude Code
.claude/skills/db-migration-check/SKILL.md

# Cursor
.cursor/skills/db-migration-check/SKILL.md

# OpenAI Codex
.agents/skills/db-migration-check/SKILL.md
```

위 예시는 2025년 말 기준으로 자주 보이는 경로를 정리한 것이다.
다만 실제 지원 여부와 로딩 방식은 각 구현체 버전에 따라 달라질 수 있으므로, 현재 사용 중인 도구의 문서를 함께 확인하는 편이 안전하다.

`SKILL.md` 포맷 자체는 오픈 스탠다드로 동일하기 때문에, 지원 구현체라면 스킬을 처음부터 다시 작성하기보다 경로와 로딩 방식만 맞춰 재사용할 수 있다.
Cursor는 `.claude/skills/`도 읽을 수 있어, Claude Code에서 만든 스킬을 그대로 가져다 쓰는 흐름이 비교적 자연스럽다.

## 수동 호출 문법도 같지는 않다

팀에서 공유할 스킬은 프로젝트 레벨 경로(예: `.cursor/skills/`)에 넣으면 Git으로 관리되므로 팀원 모두 동일한 스킬을 사용하게 된다.
개인용 스킬은 홈 디렉터리(예: `~/.cursor/skills/`)에 두면 모든 프로젝트에서 사용할 수 있다.

수동 호출 문법도 에이전트마다 다르다. `/command`를 쓰는 경우도 있고, 별도 mention 문법을 두는 경우도 있다.
스킬을 설계할 때는 호출 문법보다 자동 선택이 잘 되도록 `description`을 쓰는 편이 더 중요하다.

<br>

# 스킬을 사용할 때 함께 주의할 점

## 스킬은 프로그래밍적 강제가 아니다

마크다운으로 작성된 지침이기 때문에, 에이전트가 100% 따른다는 보장은 없다.
결정적(deterministic)으로 동작해야 하는 핵심 로직은 `scripts/`에 스크립트로 넣는 것이 안전하다.
<a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#set-appropriate-degrees-of-freedom" target="_blank" rel="nofollow">Anthropic 공식 가이드</a>에서도
자유도 설정에 관한 내용을 다루고 있다.

```text
order-restart/
├── SKILL.md                  # 지침: "어떤 순서로 확인하고 재시작할지"
└── scripts/
    ├── list-connectors.sh    # 핵심 로직: 커넥터 목록 조회
    └── restart-connector.sh  # 핵심 로직: 커넥터 재시작
```

이 구조에서 에이전트는 `SKILL.md`의 지침에 따라 판단하고, 실제 실행은 검증된 스크립트를 호출하는 방식이 된다.

## 민감 정보는 하드코딩하지 않는다

API 키나 인증 토큰 같은 값을 `SKILL.md`나 `scripts/`에 직접 넣으면 Git 커밋에 포함된다. 실행 시점에 환경 변수나 입력으로 받도록 설계한다.

```bash
#!/bin/bash
# scripts/restart-connector.sh
# API_URL은 실행 시점에 환경 변수로 전달받는다.
CONNECTOR_NAME=$1
curl -X POST "${API_URL}/connectors/${CONNECTOR_NAME}/restart"
```

## 용어를 일관되게 쓴다

동일 개념에 서로 다른 용어를 혼용하면 에이전트의 해석이 흔들린다. "API endpoint"와 "URL", "재시작"과 "restart"를 섞어 쓰는 것이 대표적인 예다.
하나를 골라서 전체 스킬에서 통일한다.

<br>

# 참고
- <a href="https://agentskills.io/specification" target="_blank" rel="nofollow">Agent Skills Specification</a>
- <a href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices" target="_blank" rel="nofollow">Anthropic: Skill authoring best practices</a>
- <a href="https://www.anthropic.com/news/skills" target="_blank" rel="nofollow">Anthropic: Introducing Agent Skills</a>
