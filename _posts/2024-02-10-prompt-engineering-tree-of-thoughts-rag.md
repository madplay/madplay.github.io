---
layout: post
title: "프롬프트 엔지니어링 가이드: 3. Tree of Thoughts, RAG(Retrieval Augmented Generation)"
author: madplay
tags: prompt-engineering tot rag retrieval
description: "Tree of Thoughts는 사고 경로를 넓히고, RAG는 근거를 보강한다. 복잡한 추론과 최신 지식이 필요한 문제를 두 축으로 푸는 방법을 다룬다."
category: Backend
date: "2024-02-10 23:11:00"
comments: true
---

# 목차
- <a href="/post/prompt-engineering-basics-and-llm-settings" target="_blank">프롬프트 엔지니어링 가이드: 1. 프롬프트 기초와 LLM 설정</a>
- <a href="/post/prompt-engineering-techniques" target="_blank">프롬프트 엔지니어링 가이드: 2. Zero-shot, Few-shot, Chain-of-Thought</a>
- 프롬프트 엔지니어링 가이드: 3. Tree of Thoughts, Retrieval Augmented Generation

<br>

# 한 줄 추론으로 부족할 때: Tree of Thoughts와 RAG
Tree of Thoughts와 RAG는 둘 다 "정답 품질을 올리는 방법"이지만, 개입 지점이 다르다.
Tree of Thoughts는 모델이 문제를 푸는 사고 경로를 여러 갈래로 탐색하게 만드는 추론 기법이고, RAG는 모델 밖에서 관련 문서를 검색해 근거를 붙이는 방식이다.
즉 Chain-of-Thought를 확장하는 방법은 두 갈래로 볼 수 있다. Tree of Thoughts는 생각 경로를 확장하고, RAG는 참고 근거를 확장한다.

복잡한 문제 해결과 최신 지식 기반 답변이 필요한 서비스에서는 결국 Tree of Thoughts와 RAG가 함께 논의된다.
이번 글은 이 두 가지에만 집중한다.

<br>

# Tree of Thoughts
Tree of Thoughts는 Chain-of-Thought를 일반화한 프레임워크다.
핵심은 중간 생각(thought)을 트리 구조로 유지하고, 각 생각을 평가하면서 탐색(BFS/DFS/빔 탐색)하는 것이다.

```text
문제
-> 후보 생각 1, 2, 3 생성
-> 각 후보를 "유망/보류/폐기"로 평가
-> 유망 후보 확장
-> 막히면 백트래킹
```

<a href="https://www.promptingguide.ai/kr/techniques/tot" target="_blank" rel="nofollow">가이드 예시</a>처럼
24 게임 문제를 여러 단계 사고로 쪼개고, 각 단계에서 상위 후보를 유지하는 방식이 대표적이다. 이 접근은 "한 번의 직진 추론"이 실패할 때 특히 강하다.

## Tree of Thoughts를 조금 더 구체적으로 보면
가이드 설명을 실무 관점으로 단순화하면 세 단계다.

1. 생각 후보 생성(Thought Generation): 현재 상태에서 다음에 시도할 사고 후보를 여러 개 만든다.
2. 생각 후보 평가(Thought Evaluation): 후보마다 "유망/보류/불가"처럼 점수를 준다.
3. 탐색 전략 적용(Search): 점수가 높은 가지를 우선 확장하고, 막히면 다른 가지로 되돌아간다.

```text
state_0
-> propose(thought_1, thought_2, thought_3)
-> value(각 thought 점수화)
-> select(상위 가지 선택)
-> expand / backtrack
```

이때 후보 수(`b`)와 탐색 깊이(`d`)가 커질수록 정답률이 오를 수 있지만, 호출 수도 같이 늘어난다.
결국 Tree of Thoughts는 정확도와 비용을 동시에 조정하는 탐색 문제로 보는 편이 맞다.

## 24 게임 예시에서 볼 수 있는 점
가이드에 인용된 실험(24 game)에서는 단일 경로 방식보다 다중 경로 탐색 방식이 더 높은 성공률을 보인다.
예시 표에서는 IO/CoT/CoT-SC 대비 Tree of Thoughts 설정이 크게 앞서는 결과가 보고된다.
핵심은 "한 번에 맞히는 능력"보다 "틀린 경로를 버리고 다시 시도하는 구조"에서 차이가 난다는 점이다.

## 언제 쓰면 좋은가
- 탐색/전략/계획 수립 문제
- 한 경로가 실패해도 대안 경로가 필요한 문제
- 다단계 의사결정

## 주의할 점
- 후보 수가 늘수록 호출 수가 급격히 증가한다.
- 지연 시간과 비용이 커지므로 탐색 폭/깊이를 제한해야 한다.
- 품질이 좋아도 SLA를 깨면 운영에서 실패다.

성능 관점에서는 "후보 수 b"와 "깊이 d"가 사실상 비용 스위치다. 둘을 고정하지 않으면 예산 통제가 어렵다.

<br>

# Retrieval Augmented Generation (RAG)
RAG 설명은 명확하다. LLM의 파라메트릭 지식은 정적이므로, 외부 문서를 검색해 프롬프트 문맥에 붙여 생성 품질을 높인다는 접근이다.
Meta가 제안한 RAG 계열 아이디어는 "검색기 + 생성기" 결합으로 이해할 수 있다.

```text
사용자 질문
-> 리트리버가 관련 문서 검색
-> 질문 + 검색 문서 결합
-> 생성기가 최종 답변 생성
```

가이드에서도 RAG의 장점으로 사실적 일관성, 신뢰성 향상, 환각(hallucination) 완화를 언급한다.
또한 파라메트릭 메모리와 비파라메트릭 메모리(문서 인덱스)를 함께 쓰는 관점이 핵심이다.

## RAG 파이프라인을 한 단계 더 풀어보면
가이드에서 설명한 구조를 기준으로 보면 RAG는 아래처럼 동작한다.

1. Query Encoder: 질문을 검색 벡터로 변환한다.
2. Document Index 검색: 관련 문서를 top-k로 가져온다.
3. Generator 결합 생성: 질문 + 문서 문맥으로 최종 답을 생성한다.
4. 필요 시 근거 반환: 어떤 문서를 근거로 답했는지 함께 반환한다.

```text
question
-> encode(query)
-> retrieve(top-k documents)
-> augment(context with docs)
-> generate(answer)
```

이 구조 덕분에 모델 내부 지식만 쓰는 답변보다 최신성/근거성이 좋아질 수 있다.
반대로 검색 품질이 흔들리면 생성 품질도 같이 떨어지므로, RAG의 병목은 보통 생성기가 아니라 검색기 쪽에서 먼저 발생한다.

## 언제 쓰면 좋은가
- 최신 정보가 필요한 질의응답
- 사내 정책/문서 기반 답변
- 근거 제시가 필수인 서비스

## 주의할 점
- 검색 품질이 낮으면 생성 품질도 같이 무너진다.
- 관련 없는 문서가 섞이면 환각(hallucination)이 줄지 않고 오히려 강화될 수 있다.
- 문서 chunk 크기, top-k, 재정렬(re-ranking)을 조정하지 않으면 성능이 불안정하다.

RAG는 생성 모델 튜닝보다 검색 파이프라인 품질에 더 많이 좌우된다.

<br>

# RAG 품질이 흔들릴 때 먼저 점검할 것
실무에서 RAG 성능이 떨어질 때 모델 파라미터부터 바꾸는 경우가 많다.
하지만 실제로는 검색 단계의 품질 문제가 원인인 경우가 더 많다.

```text
점검 순서
1) 질의 재작성(query rewrite) 유무 확인
2) chunk 크기/중첩(overlap) 확인
3) top-k 값과 재정렬(re-ranking) 사용 여부 확인
4) 프롬프트에 넣는 문서 수와 순서 점검
```

예를 들어 chunk가 너무 크면 관련 없는 문맥이 섞이고, 너무 작으면 핵심 근거가 분절돼 답변 정확도가 떨어진다.
또한 top-k를 과하게 키우면 노이즈 문서가 늘어나 오히려 환각(hallucination)이 증가할 수 있다.

<br>

# Tree of Thoughts와 RAG를 함께 적용할 때 고려할 점
둘은 대체 관계가 아니다.
Tree of Thoughts는 "추론 경로 탐색", RAG는 "근거 문맥 보강" 역할이므로 같이 묶어 설계할 수 있다.

```text
RAG로 근거 문서 수집
-> Tree of Thoughts로 해결 경로 후보 생성/평가
-> 최종 답과 근거 문서 ID 반환
```

실무에서는 아래처럼 운영 규칙을 함께 두는 방식도 많이 사용된다.

1. 타임아웃: 단계별 호출 상한을 둬 전체 요청 지연을 제한한다.
2. 재시도: 검색 실패는 제한 재시도, 정책 위반은 즉시 중단한다.
3. 멱등성: requestId 기준 중복 실행/저장을 방지한다.
4. 로그 컨텍스트: requestId, retrievalTopK, selectedDocIds, thoughtDepth, latencyMs를 남긴다.

이런 규칙을 두면 고급 방법을 "재현 가능한 시스템"으로 운영하는 데 도움이 된다.

또 하나 중요한 점은 역할 분리다.
RAG는 "무엇을 근거로 답할지"를 담당하고, Tree of Thoughts는 "그 근거를 어떻게 풀어갈지"를 담당한다.
두 축을 분리해 점검하면 문제 발생 시 원인 추적이 훨씬 빨라진다.

## 도입 순서 예시
처음부터 Tree of Thoughts와 RAG를 동시에 도입하면 원인 분석이 어렵다.
아래처럼 한 축씩 고정하면서 확장해 보는 접근도 가능하다.

1. RAG만 먼저 적용해 근거 기반 답변의 정확도를 올린다.
2. 검색 품질이 안정된 뒤에도 추론 오류가 남으면 Tree of Thoughts를 붙인다.
3. Tree of Thoughts 탐색 폭/깊이를 제한해 비용 상한을 먼저 고정한다.
4. 최종 답변에는 근거 문서 ID와 함께 반환 규칙을 둔다.

이런 순서를 참고하면 품질 개선과 비용 통제를 함께 검토하기가 수월하다.

<br>

# 마무리
Tree of Thoughts는 깊고 넓게 생각하게 만들고, RAG는 더 정확한 근거를 공급한다.
복잡한 추론과 최신 지식이 동시에 필요한 작업이라면 이 두 축을 함께 설계하는 것이 현실적인 선택이다.

핵심은 기법 자체보다 제어 포인트다. 탐색 폭/깊이, 검색 품질, 타임아웃/재시도/로그 기준을 먼저 고정하면 품질과 비용을 같이 잡을 수 있다.

## 참고한 문서
- <a href="https://www.promptingguide.ai/kr/techniques/tot" target="_blank" rel="nofollow">Prompt Engineering Guide: Tree of Thoughts</a>
- <a href="https://www.promptingguide.ai/kr/techniques/rag" target="_blank" rel="nofollow">Prompt Engineering Guide: Retrieval Augmented Generation</a>
- <a href="https://arxiv.org/abs/2305.10601" target="_blank" rel="nofollow">Yao et al. (2023): Tree of Thoughts</a>
