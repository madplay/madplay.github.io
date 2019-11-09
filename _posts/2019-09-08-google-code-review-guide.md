---
layout:   post
title:    "구글의 코드 리뷰 가이드: 한글 번역본"
author:   Kimtaeng
tags: 	  google codereview
description: 구글에서는 어떻게 코드 리뷰를 할까? 구글에서 사용하는 코드 리뷰 가이드를 한글로 번역해보았습니다.
category: Knowledge
date: "2019-09-08 00:00:00"
comments: true
---

# 들어가기에 앞서

이번 포스팅은 2019년 9월 5일에 구글에서 공개한 코드리뷰 가이드를 한글로 번역, 요약한 글입니다.
오역이 있을 수 있는 부분에 대해서는 각 섹션 하단에 역주를 첨부했습니다. 오역이 있다면 언제든지
<a href="https://github.com/madplay/madplay.github.io/issues" target="_blank" rel="nofollow">**이슈 등록**</a> 또는
<a href="https://github.com/madplay/madplay.github.io/pulls" target="_blank" rel="nofollow">**Pull Request**</a>
주시면 감사드립니다. 원문을 확인하시려면 아래 링크를 참고해주세요.

- <a href="https://google.github.io/eng-practices" target="_blank" rel="nofollow">**참고 링크: 
Code Review Developer Guide**</a>
- <a href="https://github.com/google/eng-practices" target="_blank" rel="nofollow">**참고 링크:
eng-practices(github)**</a>

본격적인 구글의 코드 리뷰 가이드에 대한 내용은 아래의 <a href="#소개">**"소개"**</a> 섹션에서 시작되며,
아래 링크를 통해서도 바로 접근 가능합니다.

- <a href="/post/google-code-review-guide-for-reviewers" target="_blank">**구글의 코드 리뷰 가이드: 리뷰어 편**</a>
- <a href="/post/google-code-review-guide-for-authors" target="_blank">**구글의 코드 리뷰 가이드: 작성자 편**</a>

<br/>

# 용어 정리

이 문서 중 일부에서는 구글 내 용어가 사용되며 외부 독자를 위해 명확하게 설명합니다.

- **CL**: changelist의 약어로 버전 관리(Version Control)에 제출되었거나 코드 리뷰가 진행중인 독립된 변경 단위
- **LGTM**: Looks Good to Me의 약어입니다. 위의 코드 리뷰를 승인할 때, 리뷰어가 사용합니다.    

<div class="post_comments">[역주] 원문 일부를 보면 "Stands for "hangelist, which means one self-contained change that
has been submitted to version control or which is undergoing code review." 여기서 self-contained를 independent와
동의로 번역하였습니다.  이어지는 포스팅에서는 CL을 "코드 변경사항" 으로 번역합니다.</div>

<br/>

# 소개

코드 리뷰는 코드 작성자가 아닌 사람이 코드를 검토하는 프로세스입니다. 구글은 코드 리뷰를 통하여 코드와 제품의 품질을 유지합니다.
이 문서는 구글의 코드 리뷰 절차와 정책에 대한 일반적인 설명입니다.
이 페이지는 코드 리뷰 절차에 대한 개요입니다. 코드 리뷰에 대한 2가지의 문서로 나눌 수 있습니다.

- <a href="/post/google-code-review-guide-for-reviewers" target="_blank">**코드 리뷰를 하는 방법: 코드 리뷰어를 위한 가이드**</a>
- <a href="/post/google-code-review-guide-for-authors" target="_blank">**코드 변경사항 작성자 가이드: 코드 작성자를 위한 가이드**</a>


<br/>

# 리뷰어는 무엇을 봐야하는가?

코드 리뷰는 아래 사항을 확인해야 합니다.

- **설계(Design)**: 코드가 잘 설계되었고 시스템에 적합한가?
- **기능(Functionality)**: 코드가 작성자의 의도대로 동작하는가? 사용자에게 적합하게 동작하는가?
- **복잡성(Complexity)**: 더 간단하게 만들 수 있는가? 나중에 코드를 다른 개발자가 보았을 때 쉽게 이해하고 사용 가능한가?
- **테스트(Tests)**: 잘 설계된 자동 테스트가 있는가?
- **작명(Naming)**: 개발자가 변수, 클래스, 메소드 등에 명확한 이름을 선택했는가?
- **주석(Comments)**: 주석이 명확하고 유용한가?
- **스타일(Style)**: 스타일 가이드(코딩 컨벤션)를 따르고 있는가?
- **문서화(Documentation)**: 개발자가 관련 문서도 업데이트 했는가?

자세한 내용은 <a href="/post/google-code-review-guide-for-reviewers" target="_blank">
**코드 리뷰를 하는 방법: 코드 리뷰어를 위한 가이드**</a>를 참고하세요.

<br/>

# 가장 적합한 리뷰어 선정

일반적으로 여러분은 합리적인 시간 내에 당신의 리뷰를 확인할 수 있는 가장 적합한 리뷰어를 찾고자 합니다.

가장 적합한 리뷰어는 당신의 코드에 대해 가장 철저하고 정확한 리뷰를 제공할 수 있는 사람입니다.
이것은 일반적으로 기존 코드의 작성자일 것입니다. 때로는 각 부분마다 다른 리뷰어에게 요청해야할 수도 있습니다.

이상적인 리뷰어를 찾았지만, 리뷰를 할 수 없는 경우에는 변경 사항에 대해서 적어도 참조(CC, Carbon Copy)는 해두어야 합니다.

<div class="post_comments">[역주] 원문 일부를 보면 "This usually means the owner(s) of the code, who may or may not be
the people in the OWNERS file" 직역이 모호한 것 같아서 "기존 코드의 작성자" 라고 번역하였습니다. Code Owner에 대한 github 가이드는
<a href="https://help.github.com/en/articles/about-code-owners" target="_blank" rel="nofollow">
About code owners(링크)</a>를 참고하세요.</div>

<br/>

# 직접 리뷰

좋은 코드 리뷰를 해줄 수 있는 사람과 페어 프로그래밍(Pair Programming)을 했다면, 그 코드는 리뷰를 받은 것으로 간주됩니다.
또한, 당신은 직접 리뷰(in-person, 대면 리뷰, 오프라인 리뷰)를 진행할 수 있는데, 리뷰어가 질문을 하고 코드 작성자는 질문을 받았을 때만 발언을 합니다.

<br/>

- <a href="/post/google-code-review-guide-for-reviewers" target="_blank">
**이어지는 글: 코드를 리뷰하는 방법, 코드 리뷰어를 위한 가이드**</a>