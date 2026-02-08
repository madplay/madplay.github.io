---
layout: post
title: "CLI 출력만 압축했을 뿐인데 토큰이 80% 줄었다고?"
author: madplay
tags: rtk token-optimization ai-coding-agent cli-proxy
description: "명령어 앞에 rtk 하나 붙였을 뿐인데 에이전트의 토큰 소비가 80% 줄었다. 오픈소스 CLI 프록시 RTK(Rust Token Killer)의 동작 원리와 설치법, 어디서 한계에 부딪히는지까지 함께 살펴본다."
category: AI
date: "2026-02-08 22:15:00"
comments: true
---

# 에이전트 토큰, 대체 어디서 이렇게 새는 걸까?

Claude Code 같은 AI 코딩 에이전트로 작업하다 보면, 토큰의 상당 부분이 실제 추론이 아니라 명령어 출력을 읽는 데 소비된다는 걸 알게 된다.
`git status`를 한 번 실행하면 변경 파일 목록, 브랜치 정보, 추적되지 않는 파일 등이 수십 줄로 쏟아진다.
테스트를 돌리면 통과한 수백 개의 항목까지 전부 컨텍스트에 올라온다.

그런데 에이전트에게 실제로 필요한 건 "어떤 파일이 바뀌었는지", "어떤 테스트가 실패했는지" 정도다.
**나머지는 대부분 토큰 낭비다.** 이런 출력이 30분짜리 작업 세션에서 차지하는 토큰은 대략 10만 토큰을 넘긴다.

**RTK(Rust Token Killer)**는 바로 이 문제를 해결할 수 있는 오픈소스 CLI 프록시다.
**명령어 출력을 에이전트에게 전달하기 전에 필터링하고 압축해서, 정작 필요한 정보만 컨텍스트에 올린다.**
시스템 프로그래밍 언어인 Rust로 작성된 단일 바이너리 하나로, 별도 런타임 없이 동작한다.
Claude Code, OpenCode 등 터미널 기반 AI 코딩 에이전트에서 사용할 수 있고, 토큰 소비를 60~90% 줄인다.

<br>

# RTK는 어떻게 토큰을 줄일까?

RTK는 명령어와 에이전트 사이에 끼어드는 프록시로 동작한다.
`git diff`를 직접 실행하는 대신 `rtk git diff`를 실행하면, RTK가 원본 출력을 받아 다음 4가지 전략으로 압축한 뒤 에이전트에게 전달한다.

- **스마트 필터링**: 주석, 빈 줄, 보일러플레이트처럼 에이전트의 판단에 영향을 주지 않는 내용을 제거한다.
- **그룹핑**: 비슷한 항목을 묶는다. 디렉터리별 파일 목록이나 규칙별 린트 경고가 대표적이다.
- **트렁케이션**: 관련성 높은 부분은 유지하면서 반복적인 내용을 잘라낸다.
- **중복 제거**: 같은 로그 메시지가 200번 반복되면 한 줄로 압축하고 횟수만 표시한다.

이 전략들을 조합하면 `git push`의 출력이 15줄(약 200토큰)에서 1줄(약 10토큰)로 줄어드는 식이다.
명령어 한 번당 추가되는 오버헤드는 10ms 미만이고, 외부 런타임 의존성도 없다.

<br>

# 설치와 자동 훅 설정

설치 방법은 세 가지다. Homebrew가 가장 간편하다.

```bash
# Homebrew (macOS, Linux) - 권장
brew install rtk-ai/tap/rtk

# 설치 스크립트
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo (Rust 환경)
cargo install --git https://github.com/rtk-ai/rtk
```

설치 후 가장 먼저 할 일은 자동 훅(Hook) 설정이다.

```bash
rtk init --global
```

이 명령 하나로 <a href="/post/claude-code-settings-json" target="_blank">Claude Code의 Bash 훅</a>이 등록된다.
이후부터 에이전트가 `git status`를 실행하면 훅이 자동으로 `rtk git status`로 변환한다.
에이전트 입장에서는 달라진 게 없고, 돌아오는 출력만 압축된다.

RTK 자체는 Claude Code 전용이 아니다. OpenCode(`rtk init -g --opencode`)도 공식 지원하고,
다른 에이전트에서도 명령어 앞에 `rtk`를 직접 붙이면 동일한 효과를 얻을 수 있다.
이하 예시는 Claude Code 기준이다.

<br>

# 어떤 명령어를 지원할까?

RTK가 압축을 지원하는 명령어 범위는 꽤 넓다.

| 영역 | 대표 명령어 | 압축 방식 | 절감률 |
|------|-----------|----------|--------|
| Git | `status`, `diff`, `log`, `push` 등 | 변경 없는 파일 정보 제거 | 75~92% |
| 테스트 러너 | `cargo test`, `pytest`, `vitest`, `go test` | 통과 항목 건수로 압축, 실패만 상세 출력 | 90% |
| 린터/빌드 | `eslint`, `tsc`, `ruff`, `cargo clippy` | 규칙별/파일별 그룹핑 | 80~85% |
| 파일 탐색 | `ls`, `cat`, `grep`, `find` | 트리 정리, 시그니처 추출 | 70~80% |
| 기타 | `gh`, `pnpm`, `docker`, `kubectl`, `curl` | 포맷 압축, 중복 제거 | 75~80% |

Git 계열은 거의 모든 서브커맨드를 지원하고, 테스트 러너는 절감 효과가 가장 크다.
Claude Code 작업에서 자주 쓰이는 명령어 대부분이 포함되어 있다.

<br>

# 30분 세션에서 실제 절감 효과

중간 규모의 TypeScript/Rust 프로젝트에서 30분 동안 작업한 벤치마크를 보면 전체 그림이 잡힌다.

- 참고: <a href="https://github.com/rtk-ai/rtk#token-savings-30-min-claude-code-session" target="_blank" rel="nofollow">RTK Token Savings Benchmark</a>

| 명령어 | 실행 횟수 | 일반 출력(토큰) | RTK 출력(토큰) | 절감률 |
|--------|----------:|---------------:|--------------:|-------:|
| ls/tree | 10 | 2,000 | 400 | 80% |
| cat/read | 20 | 40,000 | 12,000 | 70% |
| grep/rg | 8 | 16,000 | 3,200 | 80% |
| git status | 10 | 3,000 | 600 | 80% |
| git diff | 5 | 10,000 | 2,500 | 75% |
| git log | 5 | 2,500 | 500 | 80% |
| git add/commit/push | 8 | 1,600 | 120 | 92% |
| cargo/npm test | 5 | 25,000 | 2,500 | 90% |
| lint (ruff 등) | 3 | 3,000 | 600 | 80% |
| pytest | 4 | 8,000 | 800 | 90% |
| **합계** | | **약 111,000** | **약 23,200** | **80%** |

한 세션에서 약 8만 8천 토큰을 아낄 수 있다는 뜻이다. 하루에 세션을 여러 번 돌리는 환경이라면 절감량은 더 커진다.

## 절감 현황은 어떻게 추적할까?

RTK는 명령어 실행 이력과 절감량을 로컬 데이터베이스에 기록한다.

```bash
# 전체 절감 요약
rtk gain

# 30일간 일별 추이를 ASCII 그래프로 확인
rtk gain --graph

# 일별 상세 내역
rtk gain --daily

# JSON 포맷으로 내보내기
rtk gain --all --format json
```

`rtk discover`를 실행하면 RTK를 거치지 않고 실행된 명령어를 분석해서 "이 명령어도 RTK로 돌렸으면 얼마나 줄었을 것"이라는 추정치를 보여준다.
도입 초기에 어떤 명령어부터 적용하면 효과가 클지 판단하는 데 유용하다.

## 실패한 명령어의 원본 출력이 필요하면?

RTK가 출력을 압축하면 에이전트 입장에서는 좋지만, 디버깅할 때 원본 출력이 필요한 경우가 있다.
이를 위해 RTK는 tee 기능을 제공한다. 명령어가 실패하면 필터링되지 않은 원본 출력을 로컬 파일에 저장한다.

```text
FAILED: 2/15 tests
[full output: ~/.local/share/rtk/tee/1707753600_cargo_test.log]
```

에이전트는 압축된 실패 정보를 먼저 보고, 필요하면 저장된 전체 출력을 읽어 상세 분석을 할 수 있다.
명령어를 다시 실행할 필요가 없으니 그만큼 토큰과 시간을 아끼게 된다.

<br>

# 사용 전에 알아 둘 것들

만능은 아니다. 사용하기 전에 알아 둘 점이 몇 가지 있다.

**훅(Hook)의 동작 범위가 제한적이다.**
RTK의 자동 훅은 Claude Code가 Bash 도구를 호출할 때만 동작한다.
Claude Code의 내장 도구인 Read, Grep, Glob은 Bash를 거치지 않으므로 훅이 개입하지 못한다.
내장 도구가 처리하는 파일 읽기나 검색은 RTK의 압축 대상이 아닌 셈이다.
다만 이 도구들은 이미 최적화된 출력을 제공하므로 실질적인 손해는 크지 않다.

**출력 압축이 항상 이득은 아니다.**
RTK는 에이전트에게 불필요한 정보를 걷어내는 방식으로 동작한다. 그런데 RTK가 "불필요하다"고 판단한 정보가 실제로는 필요한 경우가 있을 수 있다.
실제로 Playwright 테스트 출력을 너무 공격적으로 압축해서 에이전트가 E2E 실패를 디버깅하지 못한다는 이슈 제보가 있다.
이런 경우에는 `rtk proxy <command>`로 필터링 없이 원본 출력을 받을 수 있다.

- <a href="https://github.com/rtk-ai/rtk/issues/690" target="_blank" rel="nofollow">GitHub Issue: rtk compresses Playwright test output too aggressively</a>

**이름 충돌 가능성이 있다.**
crates.io에는 "Rust Type Kit"이라는 동명의 패키지가 존재한다.
`cargo install rtk`를 실행하면 엉뚱한 패키지가 설치될 수 있으므로
`cargo install --git https://github.com/rtk-ai/rtk` 형태로 설치하거나 Homebrew를 사용하는 편이 안전하다.

<br>

# 그래서, 써 볼 만할까?

개인적으로는 RTK를 도입한 뒤로 생각보다 절약되는 토큰이 많아 꽤 유용하다고 생각한다.
다만 에이전트 스킬에서 Bash 명령어를 조합하는 경우, RTK 훅과 충돌이 생기는 케이스가 간혹 있었다.
그런 상황에서는 `rtk proxy`로 우회하거나 해당 명령어를 훅 예외로 두는 식으로 대응했다.

이처럼 RTK는 Claude Code의 공식 기능이 아니라 커스텀 훅(Hook)을 활용한 서드파티 도구라는 점을 감안하자.

<br>

# 참고

- <a href="https://github.com/rtk-ai/rtk" target="_blank" rel="nofollow">RTK(Rust Token Killer) GitHub 저장소</a>
