---
layout: post
title: "Claude Code 컨텍스트 관리 방법과 토큰 사용량 줄이기"
author: madplay
tags: claude-code context token compact session
description: "세션이 길어질수록 느려지는 이유는 컨텍스트 윈도우에 있다. /compact, /clear, /cost로 토큰 사용량을 관리하는 방법을 알아본다."
category: AI
date: "2025-08-25 22:09:31"
comments: true
---

# 토큰 소비 구조
Claude Code를 쓰다 보면 같은 질문인데도 세션 초반에는 빠르게 답하던 것이 후반에는 느려진다.
컨텍스트 윈도우 동작 방식 때문이다. 여행 가방에 꼭 필요한 물건만 넣어야 이동이 가벼운 것처럼,
세션에 쌓인 맥락이 적을수록 빠르고 정확하게 동작한다.

Claude Code의 컨텍스트 윈도우는 현재 세션의 전체 대화 내역, 시스템 프롬프트, 읽은 파일 내용을 모두 포함한다.
새 메시지를 보낼 때마다 이전 대화 전체가 함께 전송되기 때문에, 대화가 길어질수록 매 요청의 토큰 사용량이 누적적으로 늘어난다.
즉, 10번째 요청은 1~9번째 대화 내역을 모두 포함한 상태에서 처리된다.

<br>

# /compact와 /clear: 두 가지 초기화 방법

컨텍스트가 커졌을 때 사용할 수 있는 명령어는 두 가지다.

## /compact

`/compact`는 현재까지의 대화 내역을 요약해서 압축하는 명령어다.
이전 대화를 완전히 버리지 않고, 핵심 정보만 남긴 요약으로 교체한다.

```bash
/compact
```

보존할 내용을 직접 지정할 수도 있다.

```bash
/compact 코딩 패턴과 결정사항만 유지해줘
```

이 명령어를 실행하면 Claude Code는 대화 내용을 분석해서 "보존할 정보"와 "요약할 정보"를 분류한다.
프로젝트 설정, 코딩 패턴, 최근 코드 변경 같은 정보는 보존하고,
탐색적 대화나 이미 해결된 디버깅 과정 같은 정보는 짧은 요약으로 교체한다.

그렇다면 `/compact`는 언제 실행하는 것이 적절할까?
auto-compact가 약 75% 지점에서 자동 트리거되므로, 그 전에 보존할 맥락을 직접 지정하고 싶다면 수동으로 먼저 실행하는 편이 낫다.
현재 사용량은 `/cost` 명령어로 확인할 수 있다.

```bash
/cost
```

## /clear

`/clear`는 대화 내역을 완전히 삭제하고 빈 상태로 시작하는 명령어다.
`/compact`와 달리 이전 맥락이 아예 남지 않는다.

```bash
/clear
```

작업 주제가 완전히 바뀌거나, 이전 대화가 현재 작업에 방해가 되는 경우에 적합하다.

<br>

# auto-compact: 자동 압축

Claude Code에는 `auto-compact` 기능도 있다.
컨텍스트 윈도우가 한계에 가까워지면 자동으로 `/compact`를 실행해주는 기능이다.
기본적으로 활성화되어 있으며, `/config` 명령어로 현재 상태를 확인할 수 있다.

```bash
/config
```

auto-compact가 동작하면 세션이 중간에 끊기지 않고 계속 이어진다.
다만 자동 압축이 항상 의도한 대로 요약하지는 않기 때문에,
중요한 맥락이 있는 세션에서는 수동으로 `/compact`를 실행하면서
보존할 내용을 직접 지정하는 편이 안전하다.

<br>

# CLAUDE.md와 반복 맥락

토큰이 낭비되는 대표적인 패턴 중 하나는 매 세션마다 같은 배경 설명을 반복하는 것이다.
"우리 프로젝트는 Spring Boot 기반이고, Kotlin을 쓰고, 빌드는 Gradle이고..."라는 설명을
세션 시작 때마다 입력하면 그만큼 토큰이 소비된다.

`CLAUDE.md`를 사용하면 이 반복을 없앨 수 있다. 프로젝트 루트에 `CLAUDE.md` 파일을 만들어두면
Claude Code가 세션 시작 시 자동으로 읽어서 시스템 프롬프트에 포함한다.

```markdown
# 프로젝트 개요
Spring Boot 3.2 + Kotlin, Gradle 빌드

# 테스트
./gradlew test

# 코드 스타일
- 변수/함수: camelCase
- 한 함수 최대 30줄
- DTO는 data class, 엔티티는 일반 class
```

이 파일에 프로젝트 배경, 빌드 명령어, 코딩 컨벤션을 정리해두면
매 세션의 "배경 설명 토큰"이 사실상 0에 가까워진다.

<br>

# 세션을 나누는 기준

하나의 세션에 여러 성격의 작업을 섞으면 컨텍스트에 불필요한 맥락이 누적된다.
버그를 수정하다가 같은 세션에서 리팩터링 요청을 보내면,
버그 수정 과정에서 읽었던 파일 내용과 대화가 리팩터링 작업의 컨텍스트에도 포함된다.

작업 성격이 바뀔 때 새 세션으로 분리하면 각 세션의 컨텍스트를 최소한으로 유지할 수 있다.

```bash
# 현재 세션 종료 후 새 세션 시작
claude

# 또는 세션 안에서 초기화
/clear
```

어떤 단위로 세션을 나눌지는 팀마다 다를 수 있지만,
"하나의 PR이 될 수 있는 단위"를 기준으로 삼으면 자연스럽게 분리된다.
버그 수정 PR, 기능 추가 PR, 리팩터링 PR 각각이 별도 세션이 되는 구조다.

<br>

# /cost로 사용량 확인

현재 세션에서 소비한 토큰 양은 `/cost` 명령어로 확인할 수 있다.

```bash
# API 과금 사용자
/cost
```

> `/stats` 명령어는 2025년 12월(v2.0.64)에 추가됐다. 구독(Pro/Max) 사용자가 사용 패턴과 통계를 확인할 때 사용한다.

```bash
# 구독(Pro/Max) 사용자
/stats
```

Anthropic 공식 문서에 따르면 Claude Code의 평균 비용은 개발자 1인당 하루 약 $6이며,
90%의 사용자가 하루 $12 이하로 사용한다.
Sonnet 4 모델 기준으로 API 토큰 가격은 입력 100만 토큰당 $3, 출력 100만 토큰당 $15이다.

비용이 예상보다 높다면 두 가지를 먼저 의심해볼 수 있다.
하나는 세션이 길어져서 매 요청마다 큰 컨텍스트가 전송되는 경우이고,
다른 하나는 범위가 모호한 요청으로 인해 Claude Code가 넓은 탐색을 반복하는 경우다.

<br>

# 참고
- <a href="https://docs.anthropic.com/en/docs/claude-code/costs" target="_blank" rel="nofollow">Claude Code: Manage costs effectively</a>
- <a href="https://docs.anthropic.com/en/docs/build-with-claude/context-windows" target="_blank" rel="nofollow">Anthropic Docs: Context windows</a>
- <a href="https://docs.anthropic.com/en/release-notes/claude-code" target="_blank" rel="nofollow">Claude Code Release Notes</a>
