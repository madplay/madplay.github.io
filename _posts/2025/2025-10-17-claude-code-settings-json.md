---
layout: post
title: "Claude Code 설정 파일, 공유할 규칙과 숨길 설정을 어떻게 나눌까?"
author: madplay
tags: claude-code settings-json permissions hooks security
description: "권한 차단부터 환경 변수 관리까지, 팀의 보안 규칙과 개인의 로컬 환경을 분리하여 안전하게 실행 경계를 구축하는 기준을 알아보자!"
category: AI
date: "2025-10-17 23:11:00"
comments: true
---

# 문맥 다음에는 경계가 필요하다

`/init`로 `CLAUDE.md`를 만들면 Claude Code는 프로젝트 문맥을 더 빨리 잡는다. 하지만 이해하는 것과 어디까지 행동해도 되는지는 다른 문제다.
빌드 명령을 아는 것만으로는 충분하지 않다. 민감한 파일을 읽어도 되는지, 어떤 명령은 자동으로 막아야 하는지, 팀이 공통으로 강제할 규칙은
무엇인지까지 정리되지 않으면 세션 품질은 좋아져도 운영은 여전히 불안정하다.

이때 정리할 파일이 `settings.json`이다. `CLAUDE.md`가 프로젝트의 설명서라면, `settings.json`은 Claude Code가 넘어가지 말아야 할
경계를 적는 설정에 가깝다. 실제로 손이 많이 가는 부분도 비슷하다. 문맥은 한 번 정리하면 오래 가지만, 경계는 팀 정책과 저장소 구조가
바뀔 때마다 조금씩 손봐야 한다.

<br>

# 팀 규칙과 개인 설정을 한곳에 섞지 않는 편이 낫다

`settings.json`을 처음 다룰 때 가장 많이 헷갈리는 부분은 어디까지를 저장소에 커밋해야 하느냐다. 이 질문에 먼저 답하지 않으면,
팀 규칙과 개인 취향이 같은 파일에 섞인다. 누군가는 안전을 위해 막아둔 설정을 넣고, 다른 누군가는 실험 편의를 위해 예외를 추가하면서
파일이 금방 복잡해진다.

보통은 이렇게 나누면 관리가 편하다. 팀 전체가 함께 지켜야 할 규칙은 `.claude/settings.json`에 두고, 개인 실험이나 로컬 환경에만 필요한
설정은 `.claude/settings.local.json`에 둔다. 여러 저장소에 공통으로 적용할 개인 기본값이 있다면 사용자 전역 설정을 쓰는 편이 낫다.
`.claude/settings.local.json`은 생성 시 `.gitignore`에 자동으로 추가되므로, 공유 규칙과 개인 설정이 섞일 위험도 줄어든다.

이 구분이 중요한 이유는 문제의 성격이 다르기 때문이다. "운영 자격 증명 파일은 읽지 않는다"는 팀 규칙이지만, "내 로컬 샌드박스에서만 이 명령을
허용한다"는 개인 설정에 가깝다. 둘을 한 파일에 섞어두면, 공유해야 할 것과 숨겨야 할 것이 함께 움직이기 시작한다.

<br>

# 안전을 위한 설정의 시작, permissions.deny

프로젝트 저장소에 Claude Code를 도입할 때, 가장 중요하게 고민해야 할 설정은 `permissions.deny`다. 이유는 단순하다.
AI 에이전트의 뛰어난 분석 능력을 활용하기 전에, 읽지 말아야 할 파일을 원천적으로 차단하는 안전망이 먼저 필요하기 때문이다.

예를 들어 주문 서비스 저장소라면 `.env`, 운영 자격 증명 파일, 배포 비밀값이 모인 디렉터리는 Claude Code가 아예 건드리지 못하게 두는 편이 안전하다.

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)"
    ]
  }
}
```

이 설정은 Claude Code가 프로젝트를 이해하는 능력을 떨어뜨리기 위한 것이 아니다. 오히려 실수했을 때 사고 범위를 줄이기 위한 최소한의 울타리에
가깝다. 저장소 구조가 익숙하지 않은 초기 세션일수록 이런 울타리는 더 값이 크다.

`deny`는 단순히 읽기 실패를 반환하는 수준이 아니라, 해당 경로가 존재하지 않는 것처럼 보이게 한다. 그래서 목록 탐색이나 자동 제안 단계에서
민감 파일이 등장하지 않게 만든다는 의미가 있다.

물론 너무 넓게 막으면 필요한 분석까지 막힐 수 있다. 그래서 `deny`는 추상적인 보안 구호보다 실제 민감 경로 중심으로 적는 편이 낫다.
"보안상 위험할 수 있다"보다 "`./secrets/**`는 읽지 않는다"가 훨씬 관리하기 쉽다.

<br>

# hooks와 env는 편리하지만 범위를 좁게 잡아야 한다

`settings.json`에서 실무적으로 매력적인 기능은 `hooks`와 `env`다. 훅을 쓰면 특정 이벤트 전후로 검사나 포맷팅을 자동화할 수 있고,
환경 변수 설정을 쓰면 반복해서 넘기던 값을 줄일 수 있다. 다만 둘 다 편의성이 큰 만큼 범위를 넓게 잡기 시작하면 예상보다 많은 부작용을 만든다.

## 예기치 못한 사고를 막는 hooks

훅(Hooks)은 특정 도구를 실행하기 전(`PreToolUse`)이나 후(`PostToolUse`)에 스크립트를 끼워 넣을 때 유용하다.
가장 실용적인 활용처는 팀 공통의 검증 흐름을 강제하는 일이다.

예를 들어 Claude Code가 특정 파일을 수정하려 할 때 에러를 발생시키고 실행을 막는 식이다.
`.env` 파일 수정을 원천적으로 차단하고 싶다면 공유 설정인 `.claude/settings.json`에 아래처럼 추가한다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matchers": [
          {
            "tool": "Edit",
            "parameters": {
              "file_path": ".*\\.env$"
            }
          }
        ],
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Error: Editing .env files is prohibited.' && exit 1"
          }
        ]
      }
    ]
  }
}
```

또는 파일 편집이 끝난 직후 로컬 포맷터를 자동으로 실행하게 만들어, 불필요한 스타일 교정 대화를 줄일 수도 있다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matchers": [
          {
            "tool": "Edit"
          }
        ],
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_LAST_EDITED_FILE\""
          }
        ]
      }
    ]
  }
}
```

## 공통값과 개인값을 분리해야 하는 env

환경 변수 역시 유용하지만, 모두가 알아야 하는 기본값과 개인 토큰은 성격이 다르다.
팀 공통값은 공유 파일(`.claude/settings.json`)에 두고, 민감하거나 개인화된 값은 로컬 범위(`.claude/settings.local.json`)에 두는 편이 안전하다.

공유 설정에 둘 만한 값은 개발 환경의 기본 API 주소나 타임아웃처럼 외부에 노출되어도 문제없는 정보다.

```json
{
  "env": {
    "NODE_ENV": "development",
    "API_BASE_URL": "https://api.staging.example.com"
  }
}
```

반면, 로컬 데이터베이스 비밀번호나 개인 실험용 플래그는 `.claude/settings.local.json`에 선언하여 공유 규칙과 섞이지 않게 관리한다.

이쯤에서 `CLAUDE.md`와 다시 비교해 보면 역할 차이가 더 또렷해진다. `CLAUDE.md`는 "우리 프로젝트는 어떻게 읽어야 하는가"를 설명하고,
`settings.json`은 "어디까지 읽고 무엇을 실행해도 되는가"를 제한한다. 둘 중 하나만 정리하면 항상 절반만 갖춘 셈이 된다.

<br>

# 설정이 충돌할 때 무엇이 이길까?

운영 환경에서는 항상 설정이 겹치는 상황이 발생한다. 개인이 편의를 위해 추가한 훅이 팀의 보안 규칙을 무력화할 수도 있고,
반대로 너무 엄격한 전역 설정 때문에 다른 프로젝트 작업에 제한이 걸릴 수도 있다.
그래서 "어떤 설정이 우선하는가"를 먼저 파악해 두는 편이 안전하다.

## 범위가 좁을수록 우선순위가 높다

<a href="https://docs.claude.com/en/docs/claude-code/settings" target="_blank" rel="nofollow">Anthropic 공식 문서</a>는 다음
순서로 설정이 적용된다고 설명한다. 범위가 좁고 구체적일수록 더 강한 우선순위를 가진다.

| 순위 | 설정 계층      | 파일 위치 또는 형태                   | 특징 및 목적                           |
|----|------------|-------------------------------|-----------------------------------|
| 1  | 관리형/엔터프라이즈 | 조직 정책 시스템                     | 가장 강력하며 사용자가 우회할 수 없는 강제 보안 규칙    |
| 2  | 명령어 실행 인자  | CLI 플래그 (예: `--model`)        | 현재 세션에만 임시로 적용되는 일회성 설정           |
| 3  | 로컬 프로젝트    | `.claude/settings.local.json` | 개인의 예외 처리용. Git에 공유되지 않고 우선순위가 높음 |
| 4  | 공유 프로젝트    | `.claude/settings.json`       | Git을 통해 팀 전체가 공유하는 공통 규칙          |
| 5  | 사용자 전역     | `~/.claude/settings.json`     | 한 사용자의 모든 프로젝트에 기본으로 깔리는 설정       |

## 로컬 설정 파일의 목적

이 계층 구조에서 특히 주의할 부분은 `.claude/settings.local.json`이다. 이 파일은 생성 시 `.gitignore`에 자동으로 추가된다.
공유 프로젝트 설정에서 금지한 특정 명령어 권한을 내 로컬 환경에서만 항상 허용("Always Allow")하고 싶거나, 특정 프로젝트에서만
빠른 응답을 위해 모델을 변경하고 싶을 때 사용한다.

우선순위가 공유 설정보다 높기 때문에 팀 규칙을 우회할 수 있다. 따라서 팀 규칙을 반드시 지키게 만들고 싶다면 프로젝트 설정에만 기대기보다,
관리형 정책을 함께 고려하는 편이 안전하다.

<br>

# /init 다음에 settings.json을 보는 흐름이 자연스럽다

순서를 굳이 정하자면, 먼저 `/init`로 프로젝트 문맥을 만들고 그 다음 `settings.json`으로 경계를 정하는 편이 자연스럽다.
문맥 없이 권한부터 조정하면 무엇을 허용하고 막아야 하는지 기준이 흐리고, 경계 없이 문맥만 만들면 잘 이해한 뒤에 너무 많은 것을 시도하게 된다.

그래서 `settings.json`은 고급 설정이 아니라, Claude Code를 팀 환경에 데려오기 위한 두 번째 기본 파일에 가깝다.
특히 저장소를 함께 쓰는 팀이라면 개인 설정 하나로 끝내기보다, 공유 규칙과 로컬 예외를 분리해서 남기는 쪽이 운영 비용을 줄인다.
(프로젝트 문맥을 구성하는 첫 번째 단계는 <a href="/post/why-init-first-in-claude-code" target="_blank">Claude Code를 팀에 도입할 때 /init부터 실행해야
하는 이유</a> 글을 참고하자!)

<br>

# 문맥은 /init으로, 경계는 settings.json으로

Claude Code를 잘 쓰는 문제를 프롬프트 기술로만 보면 놓치기 쉬운 것이 있다. 모델이 똑똑해질수록 더 중요해지는 것은 문맥과 경계다.
`CLAUDE.md`가 문맥을 맡는다면, `settings.json`은 경계를 맡는다.

둘 중 무엇이 더 중요하다고 말하기는 어렵다. 다만 실제 운영에서는 `settings.json`이 조금 더 늦게 손에 잡힐 뿐, 필요성이 덜한 파일은 아니다.
프로젝트를 이해시키는 데 성공했다면, 그 다음에는 무엇을 허용하고 무엇을 막을지까지 적어두는 편이 오래 간다.

<br>

# 참고

- <a href="https://docs.claude.com/en/docs/claude-code/settings" target="_blank" rel="nofollow">Claude Docs:Settings</a>
- <a href="https://docs.claude.com/en/docs/claude-code/hooks" target="_blank" rel="nofollow">Claude Docs: Hooks</a>
- <a href="https://docs.claude.com/en/docs/claude-code/memory" target="_blank" rel="nofollow">Claude Docs: Manage
  Claude's memory</a>
