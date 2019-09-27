---
layout:   post
title:    "인텔리제이(Intellij) 플러그인 만들기: 3. 빌드 & 배포하기"
author:   Kimtaeng
tags: 	  intellij plugin 
description: 직접 개발한 인텔리제이 플러그인을 빌드하고 JetBrains의 플러그인 저장소에 배포해보자.
category: Knowledge
comments: true
---

# 목차
- <a href="/post/creating-intellij-plugin-project" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 1. 환경 구성</a>
- <a href="/post/creating-an-intellij-plugin-action" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의</a>
- 인텔리제이(Intellij) 플러그인 만들기: 3. 빌드 & 배포하기

<br/>

# 인텔리제이 플러그인 만들기, 세 번째 포스팅
이전 포스팅에서는 플랫폼 UI를 커스텀하는 과정인 **액션(Action)**을 정의하는 방법에 대해 알아보았습니다.
이번에는 만들어진 플러그인은 JetBrains의 플러그인 저장소에 배포하는 방법을 알아봅니다.

<br/>

# 프로젝트 빌드, 배포하기
직접 개발한 플러그인을 사용하려면 먼저 **빌드를 진행**해야 합니다. 아래와 같이 진행하면 됩니다.

- `Build` 메뉴를 클릭한 후 `Build Project` 또는 `Build Module <모듈이름>`을 선택합니다.

이후에는 플러그인을 **배포할 수 있도록 준비**하면 됩니다. 이 과정을 통해 jar 또는 .zip 아카이브가 생성됩니다.
방법은 아래와 같이 진행하면 됩니다.

- `Build` 메뉴를 클릭한 후 `Prepare Plugin Module <모듈이름> For Deployment`를 선택합니다.

이 과정은 인텔리제이에서 import 가능한 jar를 생성하므로 빌드한 후에 배포(deploy)까지 진행하는 것입니다.
만들어진 jar를 인텔리제이에 설치하면 플러그인을 곧바로 사용할 수 있으니 말이지요.
다른 사용자들도 다운로드 받을 수 있도록 플러그인 저장소를 업로드하는 과정은 이후에 진행합니다.

 
혹시나 `Prepare Plugin Module <모듈이름> For Deployment` 라는 메뉴가 Build 탭에서 보이지 않는다면, 프로젝트 설정을
확인해보세요. 프로젝트가 플러그인 프로젝트로 설정되지 않은 경우에는 해당 메뉴가 나타나지 않습니다.
인텔리제이 플러그인 만들기 시리즈의 1편으로 돌아가서 환경 설정 과정을 다시 한 번 확인해보시기 바랍니다.

- <a href="/post/creating-intellij-plugin-project" target="_blank">참고: 인텔리제이(Intellij) 플러그인 만들기: 1. 환경 구성</a> 

위 작업이 끝나면 아래와 같은 메시지를 인텔리제이 IDEA의 우측 하단에서 확인할 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-1.png"
width="300" alt="prepare plugin module"/>

프로젝트 내의 파일 변환로도 확인할 수 있습니다. 아래처럼 프로젝트 디렉터리 내에 jar 파일이 생성되기 때문이지요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-2.png"
width="350" alt="jar file was created"/>

<br/>

# 플러그인 사용하기
만들어진 jar 파일을 이용하면 플러그인을 설치하여 사용할 수 있습니다. 

Intellij IDEA의 **Preferences** 메뉴로 들어가서 **Plugin** 탭을 선택한 후에
아래와 같이 `Install Plugin from Disk...` 을 선택하여 위 과정에서 만들어진 jar 파일을 선택해주면 됩니다.
설치가 완료된 후 IDE를 다시 실행해주면 반영됩니다. 

참고로 이 과정은 JetBrains의 플러그인 저장소에 업로드하기 위한 과정은 아닙니다. 그저 사용해보기 위한 것이지요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-3.png"
width="750" alt="install plugin from disk"/>

앞서 말씀드린 것처럼 플러그인을 JetBrains의 플러그인 저장소에 업로드하는 경우에는 이 과정을 생략해도 됩니다.
그러니까 우리가 보통 접하는 Plugin 탭에서 이름을 검색하여 다운로드 받는 방식을 사용하려면 JetBrains의 플러그인 저장소에
직접 업로드를 해야 하기 때문이지요. 지금 과정은 자신의 IDE에만 설치됩니다. 그렇기 때문에 다른 사용자가 설치하려면 
플러그인 jar 파일이 필요합니다.

<br/>

# 플러그인 저장소에 업로드하기

빌드&배포 과정에서 생성된 jar 파일로 JetBrains의 플러그인 저장소<a href="https://plugins.jetbrains.com" target="_blank" rel="nofollow">
(https://plugins.jetbrains.com)</a>에 등록해봅시다. 당연히 JetBrains 계정이 필요합니다. 로그인 한 후에 우측 상단에 내 계정이 표기된 부분을 클릭한 후
`Upload plugin`을 선택해줍니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-4.png" width="650" height="400" alt="Upload Plugin"/>

<br/>

이후 화면에서 앞서 만든 jar 파일을 업로드하고 라이선스, 카테고리 등을 선택해주면 됩니다. 업로드할 채널도 지정할 수 있는데요.
설명에도 나와있듯이 기본적으로는 모든 사용자가 기본적으로 사용할 수 있는 채널인 Stable로 지정됩니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-5.png"
width="750" alt="Upload New Plugin"/>

등록 이후에 보여지는 화면에서 업로드한 플러그인에 대한 상세 정보 페이지로 이동할 수 있습니다. 상세 페이지로 이동하게 되면
위의 그림처럼 상단을 통해 플러그인에 대해 2일동안의 검토가 있음을 알 수 있습니다.

<br/>

<div class="post_caption">Thank you!<br/>The plugin has been submitted for moderation.
The request will be processed within two business days.</div>

<br/>

JetBrains의 플러그인 검토(또는 심사) 관련 내용은 계정에 등록된 이메일로도 전달됩니다.   

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-6.png"
width="750" alt="received a email"/>

<br/>

그리고 상세 페이지에서는 플러그인에 대해서 수정할 수도 있습니다. 업로드할 때보다 조금 더 디테일한 설정을 할 수 있는데요.
이슈 트래커, 코드 저장소에 대한 링크도 설정할 수 있습니다.


<br/>

# 플러그인 호환성 검증
`plugin.xml`에서 설정한 빌드 버전들에 대해서 호환성 검증(Compatibility verification)도 할 수 있습니다.
아래 이미지처럼 버전을 선택하고 검증(Verify)할 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-7.png"
width="750" alt="Compatibility verificationn"/>

<br/>

다만 포스팅을 위해 업로드한 플러그인은 테스트 용도이기 때문에 정상적으로 진행되지 않습니다. 이미지는 따로 개발하고 있는
`Mad-jEnv` 이라는 플러그인의 유효성 검사 결과입니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-13-deploying-and-publishing-an-intellij-plugin-8.png"
width="750" alt="Compatibility verificationn"/>

업로드할 때 안내된 것처럼 주말/휴일을 제외하고 2일정도 지나면 플러그인 검토에 대한 결과가 메일로 전송됩니다.
플러그인 상세 페이지에서도 확인 가능하고요. 이후부터는 자신이 사용하는 IDE의 플러그인 매니저를 통해서 설치 가능합니다.
이번 포스팅 시리즈에서는 Intellij IDEA, Android Studio를 타겟으로 개발했기 때문에 해당 IDE에서만 플러그인이 검색됩니다.
물론 `plugin.xml`에 명시한 지원 버전도 맞아야 합니다.

<br/>

# 마치며
지금까지 인텔리제이 플러그인을 직접 개발하고 JetBrains의 플러그인 저장소에 업로드하는 방법에 대해 알아보았습니다.
개인적인 취미로 <a href="https://github.com/madplay/Mad-jEnv" target="_blank" rel="nofollow">
Intellij IDEA에서 jEnv를 사용할 수 있는 플러그인(링크: Mad-jEnv)</a>을 개발중인데... 쉽지 않네요.
새벽시간에 코딩하다보니 저세상 코드가 되가는 듯한... ~~유니크 다운로드 수는 50회 정도!?~~