---
layout:   post
title:    "구글의 코드 리뷰 가이드: 리뷰중인 코드 변경사항 탐색"
author:   Kimtaeng
tags: 	  google codereview reviewer
description: 구글의 코드 리뷰 가이드. 리뷰어는 리뷰중인 코드에서 어떤 것들을 살펴보아야 할까?
category: Knowledge
date: "2019-09-09 00:00:02"
comments: true
---

# 요약

<a href="/post/what-to-look-for-in-a-code-review" target="_blank">**무엇을 찾아야 하는지**</a> 알게 되었으므로 여러 파일에 걸쳐
분산된 리뷰를 관리하는 가장 효율적인 방법은 무엇인가요?

1. 변화가 의미가 있습니까? 좋은 설명이 있습니까?
2. 변화의 가장 중요한 부분을 먼저 보세요. 전체적으로 잘 설계되었습니까?
3. 나머지 코드 변경사항을 적절한 순서로 보세요.

<br/>

# 1단계: 변화를 광범위하게 바라본다.

코드 변경사항에 대한 설명과 일반적으로 하는 것들을 보십시오. 의미가 없는 변경이라면 변경이 일어나서는 안되는 이유를
즉시 설명해주십시오. 이렇게 변경 사항을 거절할 때, 개발자에게 다른 대안책을 제시하는 것도 좋은 생각입니다.

예를 들어, "좋은 코드네요. 고맙습니다! 하지만 우리는 당신이 수정하고 있는 FooWidget 시스템을 제거하는 방향으로 진행하고 있어서
지금 당장 그것에 대한 새로운 수정을 하고 싶지 않습니다. 대신에 BarWidget 클래스를 리팩토링하시면 어때요?" 처럼 말이다.

리뷰어는 현재의 코드 변경사항을 거절하고 대안을 제시했다. 그뿐만 아니라 정중하게 이를 요청했다. 의견이 다르더라도 서로 존중해야
하기 때문에 이러한 정중함은 중요합니다. 만약 원하지 않는 코드 변경사항이 많아지면, 팀의 개발 프로세스 또는 외부 컨트리뷰어를
위해 게시된 프로세스를 다시 점검해보는 것을 고려해야 하며 본격적으로 개발 작업을 시작하기 전에 반려하는 것이 낫습니다.

<br/>

# 2단계: 코드 변경사항의 주요 부분 검토

코드 변경사항의 주된 파일을 찾아야 합니다. 가장 많은 수의 변경이 있는 파일이 있으며 이는 코드 변경 사항의 주요 부분입니다.
이 부분을 먼저 보아야 합니다. 모든 작은 부분에 대한 맥락을 파악하는데 도움을 주며, 일반적으로 코드 리뷰의 속도를 가속화합니다.
코드 변경사항이 너무 많아서 어떤 부분이 핵심인지 모를 때는, 코드 작성자에게 무엇을 먼저 봐야하는지 문의하거나 변경 사항을
여러 개로 분리하도록 요청합니다.

주요 부분에 대한 설계가 잘못되었다면, 나머지 코드 변경사항을 리뷰하기 전에 코드 작성자에게 곧바로 알려야 합니다.
즉, 나머지 코드 변경사항은 설계를 수정하면서 사라지기 때문에 주요 부분 설계가 잘못된 경우에는 나머지 코드 변경사항을
보는 것이 시간 낭비가 될 수 있다.

주요 설계 이슈에 대한 의견을 곧바로 전달해야 하는 두 가지 주요 이유는 아래와 같습니다.

- 일반적으로 개발자는 코드 리뷰를 기다리는 동안 해당 변경사항을 기반으로 새로운 작업을 즉시 시작한다. 리뷰 내용을 반영할 때
잘못된 설계로 인해 더 많은 추가 작업을 해야할지 모른다. 
- 주요 설계 변경은 작은 변경보다 더 오래 걸립니다. 마감 일자를 지키고 코드의 품질을 유지하려면
개발자는 가능한 한 빨리 코드 변경사항의 주요 재설계을 시작해야 합니다.

<br/>

# 3단계: 나머지 변경사항을 적절한 순서대로 살펴본다.

전체 변경사항에 중대한 설계 문제가 없다면, 놓치는 파일이 없도록 논리적인 순서를 찾으십시오. 일반적으로 주요 파일을 살펴본 후에
코드 리뷰 도구에서 제시하는 순서대로 보는 것이 가장 간단합니다. 때로는 주요 코드를 읽기 전에 테스트 코드를 먼저 읽는 것도
도움이 됩니다. 왜냐하면 그 변경사항이 어떤 것을 하는지 알 수 있기 때문입니다.

<br/>

- <a href="/post/speed-of-code-reviews" target="_blank">**이어지는 글: 코드 리뷰의 속도**</a>