---
layout:   post
title:    "Code With Me: Intellij IDEA를 이용한 페어 프로그래밍(Pair Programming)"
author:   Kimtaeng
tags: 	  intellij pairprogramming codewithme
description: 인텔리제이(Intellij IDEA)에서 공동 개발 및 페어 프로그래밍을 할 수 있도록 지원하는 'Code With Me' 플러그인에 대해서 알아보자.
category: Knowledge
date: "2020-10-28 02:21:25"
comments: true
---

# Code With Me!
2020년 9월, Intellij IDEA의 개발사인 JetBrains의 기술 블로그에는 `Code With Me`의 얼리 액세스 프로그램 소식이 게시되었다. 
**얼리 액세스 프로그램(Early Access Program, EAP)**은 사전 출시된 제품/기능에 대해서 무료로 먼저 사용해보고 피드백을 남길 수 있는 참여 프로그램이다.

이번에 소개된 `Code With Me`는 플러그인 형태로 제공되는 **공동 개발(collaborative development) 및 페어 프로그래밍(Pair Programming)을 지원**하는 도구인데,
이 플러그인을 사용하면 JetBrains IDE에서 열린 프로젝트를 다른 사용자와 실시간으로 공유하며 함께 개발할 수 있다고 한다.

- <a href="https://blog.jetbrains.com/ko/blog/2020/09/29/code-with-me-eap-ko/" target="_blank" rel="nofollow">참고 링크: 공동 개발을 위한 JetBrains 도구인 Code With Me (EAP)를 만나보세요!</a>

업무 외 용도로 사용하는 VSCode에는 LiveShare 기능이 있어서 실시간으로 공동 작업을 할 수 있어서 편리했는데,
정작 업무에 주로 사용하는 인텔리제이에는 없어서 아쉬웠다.
특히나 재택근무를 하는 상황에서 동료와 화면을 공유하면서 개발할 수 있는 기능은 더 절실했다.

다행히도 이번에 새롭게 추가된 `Code With Me`를 통해 이러한 불편함을 해소할 수 있을 것 같은 기대감이 생긴다.
게다가 `Intellij IDEA`를 비롯하여 `WebStorm`, `Pycharm`과 같은 JetBrains 제품군에서 모두 사용할 수 있다고 하니 꽤 유용할 것 같다.

그렇다면 지금부터 `Code With Me`의 사용 방법에 대해서 알아보자.

<br>

# 어떻게 사용할까?
> 2020년 12월 기준, 2020.03 버전에 정식 출시되어 관련 이미지들을 최신화했습니다.
> IDE 버전마다 팝업창 UI가 조금씩 다른데, 대부분 옵션은 동일합니다.
> 2021년 5월 기준, 2021.1 버전부터 번들로 포함됐습니다. 플러그인 없이 바로 사용할 수 있습니다.

`Code With Me`는 2020.2 빌드부터 플러그인 설치를 통해서 사용할 수 있다.
Mac OS 기준으로 `Preferences > Plugins > Marketplace 탭`으로 이동해서 아래와 같이 검색하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-1.png"
width="600" alt="Plugins Marketplace"/>

<br>

플러그인을 설치하고 **인텔리제이를 재시작**하면 상단 메뉴바에 아래와 같은 메뉴들이 나타난다.
> 2020년 12월 기준으로, 2020.02.xx 버전에 있었던 `Submit 'Code With Me' feedback` 메뉴는 사라졌습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-2.png"
width="400" alt="Code With Me Toolbar"/>

<br>

### Enable Access and Copy Invitation Link
자신의 IDE에 다른 사용자가 접근할 수 있도록 **접속 링크를 생성**하는 메뉴다. 아래와 같이 접근 권한을 설정할 수 있다.
권한에 따라서 파일 접근, 터미널 접근 및 실행 등을 지정할 수 있으므로 상황에 따라서 설정하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-3.png"
width="400" alt="Enable Access and Start Session"/>

팝업에서 기본적으로 선택된 옵션들은 이어서 살펴볼 `Permissions and Security` 메뉴에서 설정 가능하다.

### Permissions and Security
링크를 생성할 때의 권한을 설정하는 메뉴다. 위에서 살펴본 `Enable Access and Copy Invitation Link` 링크 생성 메뉴를 선택했을 때
나타나는 팝업창의 기본 권한 설정을 할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-4.png"
width="400" alt="Enable Access and Start Session"/>

### Join Another IDE as Participant
내가 다른 사용자의 IDE에 접속할 때 사용한다. 공유 받은 접속 링크를 직접 입력하면 된다. 

<br>

# 사용해보자! 
이제 내가 호스트가 되어 다른 사용자를 내 인텔리제이에 초대해보자. 위에서 살펴본 `Enable Access and Copy Invitation Link` 메뉴를 클릭하고
기다리면 클립보드에 링크가 복사된다. 따라서 붙여넣기 단축키를 사용하면 완성된 링크를 확인할 수 있다.

다른 사용자 입장에서는 `Join Another IDE as Participant` 메뉴에서 아래와 같이 링크를 입력하면 된다.
물론 호스트로부터 받은 링크를 입력하면, 간단한 설치 과정과 함께 자동으로 입장된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-5.png"
width="350" alt="enter the invitation link"/>

<br>

다른 사용자가 링크를 입력하면, 호스트와 참가자의 IDE에서는 각각 아래와 같은 팝업이 나타난다. 권한에 따라서 다른 참가자가
자신의 코드를 수정할 수 있기 때문에 호스트 입장에서는 이 단계에서 꼭 신뢰할만한 참가자에게만 접근을 허용해야 한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-6.png"
width="450" alt="accept user and waiting for host approval"/>

<br>

호스트가 접근을 허용하여 참가자가 접속 상태가 되면 아래와 같이 상단 메뉴바의 UI가 변경된다.
참가자의 권한을 수정할 수도 있고, `Jump To` 또는 `Follow`와 같은 메뉴를 통해 해당 참가자의 커서로 바로 이동할 수 있으며
특정 참가자를 추방할 수도 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-7.png"
width="450" alt="code with me toolbar"/>

<br>

코드를 작성하는 에디터 상에는 참가자의 커서가 표시되기 때문에 같이 화면을 보면서 코드를 작성할 수 있다.
**단축키** 같은 경우는 호스트의 IDE 설정을 따라가는 것으로 확인했다. 이 부분은 차후 릴리즈에서 변경될지 아니면 현 상태를 유지할지는 지켜봐야 할 것 같다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-11-29-pair-programming-with-intellij-8.png"
width="400" alt="collaborate development"/>

<br>

# 아쉬운 점
개인적으로 **아쉬운 점**은 두 가지가 있었다. 첫 번째로 한글 입력이었는데, `Code With Me`를 사용하지 않은 상태에서도 느리기 때문에
어느 정도 감안해야 할 것 같다. 아니면 음성 대화 기능이 제공되므로 대화를 하거나, 메신저를 통해서 한글 채팅을 하는 것이 추천한다.

두 번째로는 동시 입력이었다. 셋이서 동시에 타이핑을 했었는데, 난장판이었다. 커서가 이리저리 왔다 갔다 하면서 제대로 된 타이핑을 기대하긴 어려웠다.
물론 이 부분도 여럿이서 같이 개발한다고 한들, 다 같이 코딩하지는 않을 것 같으니 단점이라고 보긴 어렵다.

<br>

# 사용해보니
결론적으로 **사용해보니 너무 좋다**는 의견을 남기고 싶다. 걱정한 것보다 지연 현상이 적었고 제공되는 음성 대화의 품질도 좋았다.
물론 인원이 더 많아지면 어떻게 될지 모르겠으나, JetBrains에서 만든 IDE 시리즈를 현업에서 사용한다면 도입해봐도 좋을 것 같다.

특히 재택근무를 하면서 개발하다가 막히는 상황이나 동료들과 코드에 대해 논의가 필요한 상황이 많았는데,
그때마다 화면을 공유해서 음성 대화를 하거나, 현재 개발 중인 코드를 임시로 별도 브랜치에 커밋 한 후에 각자의 로컬 환경에서
코드 리뷰 하는 등 불편한 점이 많았다.

지금은 많이 익숙해졌고 물론 서로에게 도움도 되는 시간이었다. 하지만 이러한 과정에서 시간을 많이 소요하면서 도움을 준
동료에게 미안한 적이 있어서, `Code With Me`의 등장이 꽤 반갑게 느껴진다.
스터디를 할 때만 사용해봤는데, 괜찮은 기능이 많아서 업무에서도 잘 활용할 수 있을 것 같다.

끝으로 주의할 점은 `Code With Me`의 사용이 끝났다면, 호스트는 `Turn Access Off and Disconnect All` 메뉴를 클릭하여 연결을 종료하는 것을 잊지 말자.
접속을 종료하는 것을 잊고 다음 번 사용 때 동일하게 다른 사용자에게 링크를 생성해서 공유했더니,
다른 참가자 화면에서는 접속 만료된 링크로 표기되며 접속이 불가능한 상황이 있었다.
물론 이러한 이유가 아니더라도 내 시스템에 접속 가능한 불필요한 경로는 차단하는 것은 당연하다.