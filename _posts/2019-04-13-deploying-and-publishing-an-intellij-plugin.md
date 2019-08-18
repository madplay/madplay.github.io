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

> ## 프로젝트 빌드, 배포하기

직접 개발한 플러그인을 사용하려면 먼저 **빌드를 진행**해야 합니다. 아래와 같이 진행하면 됩니다.

- ```Build``` 메뉴를 클릭한 후 ```Build Project``` 또는 ```Build Module <모듈이름>```을 선택합니다.

이후에는 플러그인을 **배포할 수 있도록 준비**하면 됩니다. 이 과정을 통해 jar 또는 .zip 아카이브가 생성됩니다.
방법은 아래와 같이 진행하면 됩니다.

- ```Build``` 메뉴를 클릭한 후 ```Prepare Plugin Module <모듈이름> For Deployment```를 선택합니다.

이 과정은 인텔리제이에서 import 가능한 jar를 생성하므로 빌드한 후에 배포(deploy)까지 진행하는 것입니다.
만들어진 jar를 인텔리제이에 설치하면 플러그인을 곧바로 사용할 수 있으니 말이지요.
다른 사용자들도 다운로드 받을 수 있도록 플러그인 저장소를 업로드하는 과정은 이후에 진행합니다.

 
혹시나 ```Prepare Plugin Module <모듈이름> For Deployment``` 라는 메뉴가 Build 탭에서 보이지 않는다면, 프로젝트 설정을
확인해보세요. 프로젝트가 플러그인 프로젝트로 설정되지 않은 경우에는 해당 메뉴가 나타나지 않습니다.
인텔리제이 플러그인 만들기 시리즈의 1편으로 돌아가서 환경 설정 과정을 다시 한 번 확인해보시기 바랍니다.

- <a href="/post/creating-intellij-plugin-project" target="_blank">참고: 인텔리제이(Intellij) 플러그인 만들기 - 1. 환경 구성</a> 


