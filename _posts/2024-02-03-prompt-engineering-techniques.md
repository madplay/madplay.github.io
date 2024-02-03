---
layout: post
title: "프롬프트 엔지니어링 가이드: 2. Zero-shot부터 Self-Consistency까지"
author: madplay
tags: prompt-engineering zero-shot few-shot chain-of-thought self-consistency
description: "같은 질문도 방식 선택에 따라 성능이 달라진다. Zero-shot, Few-shot, Chain-of-Thought, Self-Consistency를 문제 유형과 운영 조건에 맞춰 어떻게 선택할지 사례 중심으로 정리한다."
category: Backend
date: "2024-02-03 21:43:00"
comments: true
---

# 목차
- <a href="/post/prompt-engineering-basics-and-llm-settings" target="_blank">프롬프트 엔지니어링 가이드: 1. 프롬프트 기초와 LLM 설정</a>
- 프롬프트 엔지니어링 가이드: 2. Zero-shot부터 Self-Consistency까지
- <a href="/post/prompt-engineering-tree-of-thoughts-rag" target="_blank">프롬프트 엔지니어링 가이드: 3. Tree of Thoughts, Retrieval Augmented Generation</a>

<br>

# 같은 작업인데 왜 방식이 다를까
Zero-shot, Few-shot, Chain-of-Thought, Self-Consistency는 모두 프롬프트 설계 방식이지만, 해결하려는 문제가 다르다.
Zero-shot은 예시 없이 지시만으로 답을 얻는 방식이고, Few-shot은 몇 개의 예시를 붙여 원하는 패턴을 맞추는 방식이다.
그리고 Chain-of-Thought는 중간 추론 단계를 드러내게 해, 계산이나 논리처럼 단계가 필요한 작업의 정확도를 높이는 접근이다.
Self-Consistency는 여러 추론 경로를 샘플링한 뒤 가장 일관된 답을 고르는 방식이다.

프롬프트 방식은 "무엇이 더 고급인가"보다 "어떤 문제에 맞는가"로 선택해야 한다.
Prompt Engineering Guide에서도 네 가지를 별도로 다루는 이유가 여기에 있다.
단순 분류, 패턴 학습, 다단계 추론은 실패 지점이 다르기 때문이다.

이번 글에서는 네 가지 방식을 기준으로, 언제 무엇을 선택하면 좋은지 실무 관점에서 정리해 본다.
특히 Chain-of-Thought로도 오차가 남을 때, Self-Consistency를 어떻게 보정 계층으로 붙일지까지 함께 본다.

<br>

# 방식을 고르기 전에 평가 기준부터 정한다
방식 비교에서 가장 자주 생기는 실수는, 프롬프트는 바꾸면서 평가 기준은 고정하지 않는 것이다.
최소한 정확도, 형식 준수율, 평균 지연 시간, 토큰 비용은 같은 조건에서 함께 봐야 한다.

```text
권장 비교 지표
- taskAccuracy: 정답률/채점 점수
- formatPassRate: JSON/라벨 형식 통과율
- p95LatencyMs: 상위 5% 지연 시간
- avgTokens: 평균 입력+출력 토큰 수
```

정확도만 보면 Chain-of-Thought가 좋아 보일 수 있지만, 지연 시간과 비용을 포함하면 Few-shot이 더 현실적인 경우가 많다.
이 기준을 바탕으로 각 방식을 순서대로 보면 다음과 같다.

<br>

# Zero-shot Prompting
Zero-shot은 예시 없이 지시만으로 답을 받는 방식이다.
오늘날 모델은 지시 튜닝을 기반으로, 단순한 작업에서는 Zero-shot만으로도 꽤 안정적으로 동작한다.
가이드의 감정 분류 예시도 같은 구조다.

Prompt:
```text
텍스트를 중립, 부정 또는 긍정으로 분류합니다.
텍스트: 휴가는 괜찮을 것 같아요.
감정:
```

Output:
```text
중립
```

모델이 해당 작업 패턴을 이미 학습한 경우, Zero-shot만으로도 충분히 동작한다.
장점은 빠른 구현, 짧은 프롬프트, 낮은 토큰 비용이다.
핵심은 "예시 없이도 되는지"를 가장 먼저 확인하는 출발점이라는 점이다.
이런 결과가 나오는 이유는, 최근 모델이 사람의 지시를 더 잘 따르도록 학습됐기 때문이다. 그래서 예시가 없는 Zero-shot에서도 답변 품질이 예전보다 좋아졌다.

## 언제 쓰면 좋은가
- 라벨 정의가 명확한 단순 분류
- 요약/번역처럼 목표가 분명한 작업
- 초기 프로토타입 단계

## 주의할 점
- 도메인 용어가 많은 작업에서 오답률이 급격히 올라갈 수 있다.
- 포맷 준수율이 낮을 수 있다.

Zero-shot이 흔들리면 무조건 모델을 바꾸기 전에 예시를 붙인 Few-shot으로 먼저 확장하는 편이 효율적이다.
또한 출력 형식 실패가 자주 발생하면, 방식을 바꾸기 전에 출력 지시자부터 고정하는 편이 빠르다.

<br>

# Few-shot Prompting
Few-shot은 입력-출력 데모를 프롬프트에 포함해 모델이 원하는 패턴을 따라오게 만드는 방식이다.
가이드에서는 Zero-shot으로 어려운 작업을 Few-shot으로 개선하는 흐름을 보여준다.
실무에서는 1-shot으로 시작한 뒤, 필요할 때 3-shot, 5-shot으로 늘리며 비교하는 편이 유지보수에 유리하다.

Prompt:
```text
입력: 정말 멋지네요! // 부정
입력: 이건 나쁘다! // 긍정
입력: 와우 그 영화 정말 멋졌어요! // 긍정
입력: 정말 끔찍한 쇼였어! //
출력: 부정
```

Output:
```text
부정
```

가이드에서 흥미로운 포인트는, 라벨이 일부 무작위여도 "형식" 자체가 성능에 영향을 준다는 관찰이다.
즉 정답 라벨도 중요하지만, 데모의 분포와 형식 일관성이 성능을 크게 좌우한다.

Prompt(형식만 유지한 예):
```text
정말 멋지네요! // 부정
이건 나쁘다! // 긍정
와우, 그 영화 정말 멋졌어요! // 긍정
정말 끔찍한 쇼였어! //
```

Output:
```text
부정
```

라벨 품질이 완벽하지 않아도 형식을 일관되게 주면 정답을 맞추는 경우가 있다는 점이 Few-shot의 실무 포인트다.

## 언제 쓰면 좋은가
- 기준이 미묘한 분류 (예: 고객 불만 severity)
- 특정 말투/포맷 강제가 필요한 생성
- 도메인 사전이 있는 추출 작업

## 주의할 점
- 데모가 길어질수록 토큰 비용과 지연이 증가한다.
- 데모 품질이 낮으면 오히려 Zero-shot보다 나빠질 수 있다.
- 프롬프트 길이 제한에 걸리기 쉽다.

성능 관점에서는 데모를 늘리기 전에 "대표 사례 + 경계 사례"를 먼저 배치하는 편이 효과가 좋다.
실무에서는 데모를 무작정 늘리기보다 3~5개부터 시작해, 실패 유형별로 교체하는 방식이 유지보수에 유리하다.

<br>

# Chain-of-Thought Prompting
Chain-of-Thought는 중간 추론 단계를 드러내도록 유도해 복잡한 추론 정확도를 올리는 방식이다.
가이드의 홀수 합 문제 예시처럼, 단답보다 단계적 추론을 넣으면 결과가 개선되는 케이스가 많다.

```text
이 그룹의 홀수의 합은 짝수야: 4, 8, 9, 15, 12, 2, 1
A: 홀수(9, 15, 1)를 모두 더하면 25가 돼. 정답은 거짓이야.

이 그룹의 홀수의 합은 짝수야: 15, 32, 5, 13, 82, 7, 1
A:
```

또한 가이드에는 Zero-shot Chain-of-Thought도 나온다.
원래 질문에 "단계별로 생각해 보자"를 추가해 추론 과정을 유도하는 방식이다.

Prompt(단순):
```text
나는 시장에 가서 사과 10개를 샀다.
이웃에게 2개를 주고, 수리공에게 2개를 줬다.
그리고 사과 5개를 더 사서 1개를 먹었다.
나는 지금 사과가 몇 개인가?
```

Output:
```text
11개
```

Prompt(Zero-shot Chain-of-Thought):
```text
나는 시장에 가서 사과 10개를 샀다.
이웃에게 2개를 주고, 수리공에게 2개를 줬다.
그리고 사과 5개를 더 사서 1개를 먹었다.
단계별로 생각해 보자. 마지막 줄에 최종 답만 적어라.
```

Output:
```text
처음에 사과는 10개다.
2개와 2개를 줬으니 6개가 남는다.
5개를 더 사서 11개가 된다.
1개를 먹어 10개가 남는다.
최종 답: 10개
```

예시처럼 지시 한 줄만 추가해도 정답이 개선되는 경우가 많아, Zero-shot 다음에 바로 시도할 수 있는 확장으로 자주 쓰인다.

## 언제 쓰면 좋은가
- 산술/논리처럼 중간 추론이 필요한 문제
- 다단계 의사결정
- 최종 답보다 근거 품질이 중요한 작업

## 주의할 점
- 모든 작업에 Chain-of-Thought가 필요한 것은 아니다.
- 단순 추출/분류에 Chain-of-Thought를 넣으면 토큰만 증가할 수 있다.
- 가이드에서도 충분히 큰 모델에서 효과가 더 두드러진다고 언급한다.
- 근거를 길게 쓰게 하면 그럴듯하지만 틀린 설명도 같이 늘어날 수 있어, 최종 답 검증 규칙이 필요하다.

<br>

# Self-Consistency
Self-Consistency는 Chain-of-Thought에서 단일 경로만 따르지 않고, 여러 추론 경로를 샘플링해 다수결로 최종 답을 고르는 방식이다.
Prompt Engineering Guide에서도 추론 문제에서 정답률을 올리기 위한 확장 방법으로 소개한다.

```text
질문:
내가 6살일 때 여동생은 내 나이의 절반이었다.
지금 내가 70살이면 여동생은 몇 살인가?

출력 1: 67
출력 2: 67
출력 3: 35

최종 선택(다수결): 67세
```

한 번의 출력만 신뢰하지 않고 여러 번 풀게 한 뒤 일관된 답을 고른다는 점이 핵심이다.
Chain-of-Thought 결과가 가끔 흔들리는 문제에서 실용적으로 쓰기 좋다.

## 언제 쓰면 좋은가
- Chain-of-Thought를 적용했는데 정답이 자주 흔들리는 추론 문제
- 정답 검증이 가능한 산술/논리 작업
- 한 번의 오답 비용이 큰 업무

## 주의할 점
- 호출 횟수가 늘어 비용과 지연이 커진다.
- 다수결이 항상 정답을 보장하지는 않는다.
- 동률 처리, 표본 수, 집계 규칙을 먼저 정하지 않으면 운영 결과가 불안정해진다.

<br>

# 마무리
Zero-shot, Few-shot, Chain-of-Thought, Self-Consistency는 경쟁 관계가 아니라 단계별 선택지다.
작업 난도와 실패 유형에 맞춰 점진적으로 올리는 편이 가장 안정적이다.
실무에서는 보통 Zero-shot과 Few-shot으로 기본 성능을 만든 뒤, 추론 오류가 남는 구간에 Chain-of-Thought와 Self-Consistency를 제한적으로 붙이는 방식이 비용 대비 효율이 좋다.

다음 글에서는 추론 탐색을 확장하는 Tree of Thoughts와 외부 지식을 붙이는 RAG(Retrieval Augmented Generation)만 따로 정리한다.

- <a href="/post/prompt-engineering-tree-of-thoughts-rag" target="_blank">다음글: "프롬프트 엔지니어링 가이드: 3. Tree of Thoughts, Retrieval Augmented Generation"</a>

## 참고한 문서
- <a href="https://www.promptingguide.ai/kr/techniques/zeroshot" target="_blank" rel="nofollow">Prompt Engineering Guide: Zero-shot Prompting</a>
- <a href="https://www.promptingguide.ai/kr/techniques/fewshot" target="_blank" rel="nofollow">Prompt Engineering Guide: Few-shot Prompting</a>
- <a href="https://www.promptingguide.ai/kr/techniques/cot" target="_blank" rel="nofollow">Prompt Engineering Guide: Chain-of-Thought Prompting</a>
- <a href="https://www.promptingguide.ai/kr/techniques/consistency" target="_blank" rel="nofollow">Prompt Engineering Guide: Self-Consistency</a>
