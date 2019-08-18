---
layout:   post
title:    인텔리제이(Intellij) 플러그인 만들기 - 3. 빌드 & 배포하기
author:   Kimtaeng
tags: 	  intellij plugin 
subtitle: 직접 개발한 인텔리제이 플러그인을 빌드하고 JetBrains의 플러그인 저장소에 배포해보자.
category: Knowledge
comments: true
---

<hr/>

> ## 인텔리제이 플러그인 만들기, 세 번째 포스팅

이전 포스팅에서는 플랫폼 UI를 커스텀하는 과정인 **액션(Action)**을 정의하는 방법에 대해 알아보았습니다.
이번에는 만들어진 플러그인은 JetBrains의 플러그인 저장소에 배포하는 방법을 알아봅니다.

- <a href="/post/creating-an-intellij-plugin-action" target="_blank">이전 포스팅: 인텔리제이(Intellij) 플러그인 만들기 - 2. Action 정의</a>

<br/><br/>

> ## 프로젝트 빌드하기
- 