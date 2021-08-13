---
layout:   post
title:    "git push 오류: Please use a personal access token instead"
author:   Kimtaeng
tags: 	  git github accesstoken
description: github에 소스코드를 push를 하는데 "Support for password authentication was removed on August 13, 2021. Please use a personal access token instead" 오류가 발생한다면?
category: Knowledge
date: "2021-08-13 01:33:21"
comments: true
---

# push가 안된다.
개발한 소스 코드를 Github에 올리려고 하니 아래와 같은 오류가 발생한다. 오류 메시지와 참고를 위해 제공된 페이지를 확인해보니
Github의 인증 방식이 비밀번호 방식에서 개인용 액세스 토큰 방식으로 변경된듯하다.

```bash
$ git push origin master
remote: Support for password authentication was removed on August 13, 2021. Please use a personal access token instead.
remote: Please see https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/ for more information.
fatal: unable to access 'https://github.com/madplay/~~~.git/': The requested URL returned error: 403
```

<br>

# 어떻게 해결할까?
> 아래 방법은 MacOS Big Sur 환경 기준으로 진행되었습니다.

## 액세스 토큰 발급
먼저, 액세스 토큰을 받아야 한다. github에 먼저 접속해서 로그인한 후에 우측 상단의 프로필(Profile) 영역에 접근한 후에 **"Settings"** 메뉴로 진입한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-1.jpg"
width="700" alt="open profile menu"/>

<br>

설정 메뉴에서 왼쪽 하단의 **"Developer settings""** 메뉴로 진입한다. (아래 메뉴에서 보이는 몇몇 항목은 개인적인 정보이기 때문에 일부러 제거했습니다.)

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-2.jpg"
width="700" alt="github settings"/>

<br>

그다음에 아래 사진과 같이 **"Personal access tokens"** 메뉴에서 새로운 액세스 토큰을 생성하면 된다. 각 입력 항목에 대한 설명은 아래와 같다.

- Note: 토큰의 사용 용도에 맞게 이름을 입력하면 된다.
- Expiration: 토큰의 만료 일자를 설정한다. 무제한(No Expiration)으로 설정할 수도 있으나, 추천하지 않는다는 툴팁이 노출된다.
- Select scopes: 부여할 권한을 설정한다. 예시에서는 간단히 코드 저장소만 관리할 목적이기 때문에 "repo" 에만 체크했다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-3.jpg"
width="700" alt="new personal access token"/>

<br>

입력을 완료하면 아래와 같이 액세스 토큰을 확인할 수 있다. "Make sure to copy your personal access token now. You won’t be able to see it again!"라는 안내 메시지처럼
다시 확인할 수 없기 때문에 바로 복사해서 메모장에 옮겨두자.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-4.jpg"
width="700" alt="personal access token"/>

<br><br>

## 키체인에 액세스 토큰 등록
액세스 토큰은 발급은 끝났다. 이제 키체인에 저장된 비밀번호를 변경하면 된다! Spotlight를 통해서 "키체인 접근" 또는 "keychain Access"를 검색해서 실행시킨 후에 "github"로 검색해보자.
아래와 같이 인터넷 암호(Internet password) 타입의 키를 확인할 수 있다. 더블클릭해서 열어보자.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-5.jpg"
width="700" alt="keychain access "/>

<br>

아래와 같이 "암호 보기" 항목을 체크한 후에 앞선 과정에서 발급받은 액세스 토큰을 입력하면 모든 과정은 끝이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-6.jpg"
width="500" alt="enter access token"/>

<br><br>

변경사항을 저장한 후에 다시 터미널을 실행시켜 github에 소스 코드를 push 해보면, 정상적으로 실행되는 것을 확인할 수 있다.