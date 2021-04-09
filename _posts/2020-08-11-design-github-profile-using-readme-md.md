---
layout:   post
title:    "Github 프로필 꾸미기"
author:   Kimtaeng
tags:    github readme
description: "README.md 파일로 나의 Github 프로필을 꾸며보자"
category: Knowledge
date: "2020-08-11 00:32:54"
comments: true
---

# Github 프로필?
최근 Github에 사용자가 직접 자신의 프로필을 조금 더 예쁘게 디자인하는 기능이 추가되었다. 정말 간단하게 프로필을 예쁘게 꾸밀 수 있다.
아래와 같은 모습이다. 기존에는 사용자의 코드 저장소만 보였는데, 이제는 아래와 같이 인삿말이나 여러가지 오픈소스를 활용하여 사용자 입맛에 맞게 꾸밀 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-1.png"
width="650" alt="madplays' profile"/>

<br>

# 프로필 저장소 만들기
Github 프로필을 시작하기 위한 첫 단계는 매우 간단하다. 그저 자신의 Github 계정 이름과 동일한 저장소를 생성하기만 하면 된다.
아래와 같이 자신의 계정명과 동일하게 적어주면 안내 문구가 노출된다. 중요한 점은 저장소를 **public으로 설정**해야 한다.

README.md 같은 경우는 나중에 수동으로 생성할 수 있지만, 어차피 생성할 것이기 때문에 저장소를 생성하면서 만들도록 하자.
하단의 **Initialize this repository with a README**를 클릭하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-2.png"
width="550" alt="make profile repository"/>

<br><br>

# 프로필 꾸미기
위에서 생성한 Github 프로필 저장소로 이동해보자. 저장소 생성과 동시에 README를 만들도록 체크했다면, 아래와 같은 모습일 것이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-3.png"
width="650" alt="madplay's profile repository"/>

<br>

이제 `README.md` 파일에 이것저것 추가해서 자신의 Github 프로필을 수정하면 되는데... 어떻게 꾸밀지 참 고민이다.
그래서, 개인적으로 설정하기 간편하고 괜찮았던 몇 가지 오픈소스 프로젝트를 소개한다.

<br>

## github-readme-stats
필자가 팔로우를 하고 있는 개발자분들의 프로필에서 제일 많이 봤던 것 같다. 자신의 github 활동 관련 통계를 프로필에 추가할 수 있는
오픈소스 프로젝트다. 아래처럼 자신이 받은 스타(star) 개수와 커밋(commits) 개수 등이 표기된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-4.png"
width="450" alt="github readme stats"/>

우측에는 등급이 표기되는데, **github-readme-stats**를 사용하고 있는 사용자들을 기반으로 매겨진다고 한다.
**그렇기 때문에 등급이 낮더라도 낙심하지 말자.**

- <a href="https://github.com/anuraghazra/github-readme-stats" rel="nofollow" target="_blank">참고 링크: github-readme-stats</a>

인상 깊었던 것은 프로젝트 README 파일에 적힌 프로젝트 가이드가 영어뿐만 아니라 스페인어, 일본어 등 다양하게 번역되어 있다는 점이었는데,
각 나라의 Github 유저들이 자국어로 번역한 것이었다.

혹시나 한국어로도 번역이 진행되고 있을까? 하고 찾아보았지만 아직 없는 것 같아서 최신 버전 가이드를 checkout 받아서 번역했다.

- <a href="https://github.com/anuraghazra/github-readme-stats/pull/347" rel="nofollow" target="_blank">github readme stats: 한국어 번역 Pull Request</a>

물론 개발자는 영어를 공부해야 한다지만, 영어가 가득한 오픈소스 프로젝트의 대문에 버젓이 **"한국어"**라고 쓰여있으니 괜히 또 뿌듯하다.
> 혹시 잘못 번역된 부분을 보셨나요? 저와 같이 한국어 번역에 기여해주시면 좋을 것 같습니다 :D

<br>

## Hits
방문자 수를 표기할 수 있는 기능이다. 개인적으로 블로그에도 붙여보고 싶은 기능이기도 하다.
~~물론 블로그에는 구글 애널리틱스가 있어서 필수는 아니긴 하다.~~ 아래처럼 URL을 입력해서 간단하게 조회수를 표기하는 뱃지를 만들 수 있다.
생성된 마크다운을 `README.md`에 넣어주기만 하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-5.png"
width="450" alt="generate github hit-counter badge"/>

<br>

비슷한 오픈소스가 꽤 있지만, 비교적 최근에 개발되었고, 연동하기도 간편한 것 같다. 개인적으로 불편함을 느껴 직접 만든 개발자분의 취지도
좋은 것 같고, 아래와 같이 최근 히스토리를 확인할 수 있는 부가적인 기능도 있어서 추천한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-6.png"
width="450" alt="github hit-counter"/>

- <a href="https://github.com/gjbae1212/hit-counter" rel="nofollow" target="_blank">참고 링크: hit-counter (코드 저장소)</a>

<br>

## shields
라이선스, github의 팔로워, 스타(start) 갯수 등 다양한 뱃지를 사용자가 직접 만들 수 있는 오픈소스 프로젝트다.
아래는 개인적으로 만든 오픈소스 프로젝트인 `Mad-jEnv` 인텔리제이 플러그인에 적용된 뱃지의 모습이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-08-10-design-github-profile-using-readme-md-7.png"
width="600" alt="shields"/>

확인해보면 커스터마이징할 수 있는 기능이 정말 많다. 직접 한 번 해보는 것을 추천한다.

- <a href="https://shields.io/" rel="nofollow" target="_blank">참고 링크: shields.io</a>

<br><br>

# 마치며
글을 작성하면서도 재밌는 Github 프로필이 없을까 살펴보았는데, "이것도 가능해?"라는 생각이 들 정도로 신기한 것들이 많았다.
MP4를 GIF로 변환해서 넣은 경우도 있었고, Github Action을 이용해서 자동 배포를 설정하는 방법도 있었다.

- <a href="https://www.aboutmonica.com/blog/how-to-create-a-github-profile-readme#fun-readmes" rel="nofollow" target="_blank">
참고 링크: 재밌는 Github 프로필 모음(원글: How To Create A GitHub Profile README)</a>

꼭 필수적인 것은 아니지만, 한 번쯤은 자신을 소개하는 Github 프로필을 꾸며보는 것도 좋을 것 같다.
> 사용하고 계신 괜찮은 Github 프로필 관련 오픈소스가 있다면 알려주세요 :D