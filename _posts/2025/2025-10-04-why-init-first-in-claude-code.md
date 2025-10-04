---
layout: post
title: "Claude Code를 시작하면 가장 먼저 /init을 해야 하는 이유"
author: madplay
tags: claude-code init claude-md ai-coding context
description: "Claude Code에서 /init을 먼저 실행해야 하는 이유는 프로젝트 문맥을 CLAUDE.md로 고정하기 위해서다. 반복 설명과 흔들리는 첫 응답이 왜 줄어드는지 정리했다."
category: AI
date: "2025-10-04 21:00:00"
comments: true
---

# 프로젝트 문맥을 먼저 고정해야 한다

Claude Code를 처음 열면 많은 것이 가능해 보인다. 저장소를 읽고, 파일을 고치고, 테스트도 돌릴 수 있다. 그런데 몇 번만 써보면
실수하는 지점이 꽤 일정하다는 걸 알게 된다. 빌드 명령어를 헷갈리고, 테스트 범위를 넓게 잡고, 팀이 싫어하는 코드 스타일을 다시 제안한다.
모델이 약해서라기보다 프로젝트에 대한 기준점이 없는 상태에서 출발했기 때문이다.

`/init`는 이 기준점을 가장 빠르게 만들어주는 기본 명령어다. 실행 즉시 프로젝트를 분석하여 핵심 규칙을 담은 `CLAUDE.md` 파일을 생성하며,
이후 Claude Code는 새로운 세션이 시작될 때마다 이 파일을 가장 먼저 읽고 프로젝트의 컨텍스트를 파악하게 된다.
한 번의 대화에서 잘 동작하는 것보다, 다음 세션에서도 비슷한 품질로 다시 시작하는 편이 더 중요하다면 여기부터 먼저 챙겨두는 편이 낫다.

> 2025년 10월 4일 기준 Anthropic 공식 문서는 `/init`를 `CLAUDE.md` 가이드를 초기화하는 기본 슬래시 명령으로 안내한다.
> 프로젝트 메모리는 `./CLAUDE.md` 또는 `./.claude/CLAUDE.md`에 둘 수 있고, 빌드·테스트·린트 명령과 코드 스타일, 아키텍처 패턴을 적어두라고 권장한다.

<br>

# /init가 만드는 것은 파일보다 기준점이다

`/init`의 결과물은 마크다운 파일 하나지만, 실제로 생기는 변화는 그보다 크다. 세션이 시작될 때마다 Claude Code가 같은 프로젝트를 어떤
방식으로 읽어야 하는지 기준이 생기기 때문이다.

## 코드베이스 스캔과 문맥 추출

`/init`를 실행하면 Claude Code는 디렉터리 구조와 핵심 설정 파일(`package.json`, `build.gradle`, `requirements.txt`), 주요 문서를 빠르게 훑고,
언어·프레임워크·테스트 실행 방식·아키텍처 패턴을 요약해 `CLAUDE.md`로 만든다.

하지만 팀마다 기본 명령과 금지선이 다르다. `./gradlew test`가 기본인지, 통합 테스트를 로컬에서 돌리지 않는지, DTO 규칙을 어떻게 보는지 같은 내용은
코드만 읽어서는 늦게 드러난다. 그래서 공식 문서도 자주 쓰는 명령과 규칙을 `CLAUDE.md`에 넣으라고 안내한다.

예를 들어 주문 서비스를 다루는 저장소라면 생성된 파일에 아래 정도만 덧붙여도 첫 응답의 방향이 많이 달라진다.

```markdown
# Build and test

- build: ./gradlew assemble
- unit test: ./gradlew test
- integration test는 로컬에서 실행하지 않는다

# Conventions

- 공개 API 스펙은 승인 없이 바꾸지 않는다
- Kotlin DTO는 `data class`를 사용한다
- 신규 비즈니스 규칙은 `OrderPolicy` 계층에 둔다

# Read first

- @README.md
- @docs/architecture/order-flow.md
```

이 파일이 있으면 Claude Code는 처음부터 `OrderPolicy`를 먼저 살피고, 로컬에서 무거운 테스트를 함부로 돌리지 않으며, README를 뒤늦게
찾느라 세션 초반을 낭비하지 않는다.

## 초기 토큰 투자와 프롬프트 캐싱

`/init`를 실행하면 코드베이스의 크기와 복잡도에 따라 수천에서 수만 단위의 토큰이 한 번에 소비된다.
프로젝트 전반을 스캔하고 요약하는 작업이므로 초기 비용이 제법 드는 셈이다.

이 블로그 프로젝트로 `/init`을 테스트했을 때, `/context` 기준 누적 사용량은 대략 2만 토큰 수준으로 표시됐다.
그중 시스템 프롬프트가 약 5~6k, 시스템 도구가 약 8~9k, 메시지가 약 6k 정도였다.
다만 `/init` 과정에서 내부적으로 소비되는 탐색 토큰은 별도로 집계될 수 있어, 이 숫자만으로 전체 비용을 대표한다고 보기는 어렵다.
따라서 "초기 비용이 확실히 생긴다" 정도로만 알아두자.

그래도 사용 관점에서 이러한 투자는 곧바로 회수된다. 완성된 `CLAUDE.md`는 새로운 세션이 열릴 때마다 시스템 프롬프트의 일부로 자동 주입된다.
이때 Anthropic 모델의 프롬프트 캐싱(Prompt Caching)이 동작하면서, 반복해서 주입되는 프로젝트 문맥은 캐시 히트(Cache Hit)를 발생시킨다.

- <a href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching" target="_blank" rel="nofollow">Anthropic Docs: Prompt Caching</a>

결과적으로 매번 저장소를 처음부터 다시 탐색하며 낭비하던 수만 토큰의 '발견(Discovery) 비용'이 사라지고, 훨씬 저렴해진 캐시 토큰으로 빠르고 일관된 응답을 얻게 된다.

<br>

# /init 없이 시작하면 반복 비용이 쌓인다

`/init` 없이도 작업은 된다. 다만 같은 설명을 세션마다 다시 해야 하고, 그때마다 답의 방향이 조금씩 흔들린다.
특히 저장소가 크거나 모노레포에 가까울수록 이 비용은 금방 커진다.

가장 흔한 반복은 세 가지다. 어떤 명령으로 검증해야 하는지 다시 알려줘야 하고, 어디부터 읽어야 하는지 다시 잡아줘야 하며,
팀이 싫어하는 출력 형식을 다시 교정해야 한다. 한 번 보면 작은 불편 같지만, 이런 왕복이 쌓이면 캐싱되지 않은 입력 토큰이 계속 발생하고 토큰 비용보다 집중력이 먼저 깎인다.

## 첫 요청의 품질 하락과 보정 비용

`/init`가 특히 유용한 순간은 "첫 요청의 품질"이 중요한 작업이다. 예를 들어 버그 원인 분석, 최소 수정안 제안, 리뷰 코멘트 정리 같은 작업은
처음 방향이 틀어지면 뒤의 모든 대화가 보정 비용으로 바뀐다. 이때 `CLAUDE.md`가 있으면 Claude Code는 프로젝트의 금지선과 우선순위를
이미 알고 출발하므로, "일단 넓게 뒤진 다음 좁혀가는" 탐색을 줄이기 쉽다.

<br>

# /init만으로 충분하지는 않다

`/init`를 먼저 한다고 해서 자동으로 좋은 컨텍스트가 생기지는 않는다. `CLAUDE.md`가 낡아 있으면 오래된 명령어를 그대로 믿고,
너무 장황하면 오히려 중요한 규칙이 묻힌다. 문서를 만들었는데도 세션 품질이 들쭉날쭉하다면, 대개는 `/init`이 부족해서가 아니라
메모리의 내용이 부정확하거나 비대해진 경우가 많다.

보안 관점에서도 구분이 필요하다. 팀과 공유할 `CLAUDE.md`에는 API 키, 운영 URL, 개인 샌드박스 정보처럼 민감한 내용을 넣지 않는 편이 좋다.
공식 문서가 개인 메모리(`~/.claude/CLAUDE.md`)나 import 구문(`@path/to/file`)을 함께 안내하는 이유도 같은 맥락이다.
공유해야 할 기준과 개인 취향, 민감한 정보는 한 파일에 섞이지 않을수록 관리가 쉽다.

- <a href="https://docs.anthropic.com/en/docs/claude-code/memory" target="_blank" rel="nofollow">Anthropic Docs: Memory and Project Context</a>

결국 더 중요한 것은 `/init` 실행 여부 자체보다, 프로젝트가 Claude Code에게 무엇을 항상 기억시켜야 하는지 먼저 정리하는 태도다.
공식 가이드 역시 무작정 코딩부터 시작하기보다는, 1) `/init`로 기본 문맥을 추출하고, 2) 추출된 `CLAUDE.md`를 팀의 실제 룰에 맞게 다듬은 뒤, 3) 본격적인 작업을 시작하는 순서를 기본 워크플로우로 권장하고 있다.

<br>

# 일단 /init부터 실행하고 보자
Claude Code를 잘 쓰는 방법을 복잡한 프롬프트에서 찾기 시작하면 금방 지친다. 오히려 먼저 손봐야 하는 것은 세션마다 다시 설명하던 기본 문맥이다.
`/init`는 그 반복을 줄이는 가장 작고 실용적인 시작점이다.

아래 이미지는 실제로 이 블로그 프로젝트를 `/init`한 결과다. 코드베이스를 훑고 나서 `CLAUDE.md`를 생성하는 흐름과,
생성된 파일의 개요가 한 화면에 보인다. "무엇을 먼저 읽어야 하는지"와 "어떤 명령을 기본으로 삼는지"가
초반에 고정되는 느낌을 여기서 확인할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2025-10-04-why-init-first-in-claude-code-1.png" width="700" alt="/init 실행 후 CLAUDE.md 생성 화면"/>

처음 한두 번은 그냥 대화로 설명해도 된다. 하지만 같은 프로젝트에서 세 번째 세션을 열었다면, 그때부터는 모델보다 문맥을 먼저 고정하는 편이 대체로 낫다.
**Claude Code에서 `/init`를 먼저 실행해야 하는 이유는, 더 똑똑한 답을 바로 얻기 위해서라기보다 다음 세션도 같은 출발선에서 시작하기 위해서다.**

<br>

# 참고

- <a href="https://docs.claude.com/en/docs/claude-code/slash-commands" target="_blank" rel="nofollow">Claude Docs: Slash
  commands</a>
- <a href="https://docs.claude.com/en/docs/claude-code/memory" target="_blank" rel="nofollow">Claude Docs: Manage
  Claude's memory</a>
- <a href="https://docs.claude.com/en/docs/claude-code/quickstart" target="_blank" rel="nofollow">Claude Docs:
  Quickstart</a>
