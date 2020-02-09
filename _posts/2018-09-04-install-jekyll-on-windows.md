---
layout:   post
title:    Windows 10 Jekyll 설치 및 github blog 만들기
author:   Kimtaeng
tags: 	  jekyll windows github
description: 윈도우 10(Windows 10) 환경에서 지킬(Jekyll)을 설치하고 github blog 를 생성해봅시다 
category: Knowledge
comments: true
---

# 아... Windows

주로 맥북으로 블로그 포스팅을 진행하는데, 오늘 하필 **회사에 맥북을 두고** 왔습니다.
마침 정리할 내용이 있었는데... 아쉽기도 하고 나중에 이런 상황이 더 있을 것 같아서
Windows 환경에서 Jekyll을 설정하는 방법을 검색해보았네요.

Ruby 다운로드... 환경변수 설정 등등... 설치하는 것은 뭐가 이렇게 많고
보기만해도 스트레스 받을 것 같아서 새로운 방법을 찾았습니다.

<br/>

# 먼저 설정해보자!

우선 제어판에 들어가서 아래와 같은 설정이 필요합니다.
```제어판 > ``` ```프로그램 및 기능 > ``` 좌측에 있는 ```Windows 기능 켜기/끄기 > ``` 팝업된 창에서 ```Linux용 Windows 하위 시스템``` 체크

이 WSF(Windows Subsystem for Linux)기능은 Windows 10 에서만 제공되고 빌드 버전도 특정 버전(14316) 이상이어야 합니다.

다음으로 이 작업이 완료되었다면 키보드의 Windows 키를 누르고 ```bash```를 검색하거나 ```Windows + R``` 키를 눌러서 팝업되는 실행창에
```bash``` 를 입력하여 실행시키면 됩니다.

진행이 안되신다면 아래와 같이 ```설정 > ``` ```업데이트 및 보안 > ``` ```개발자용``` 메뉴로 진입해서 개발자 모드로 설정한 후에 진행하시기 바랍니다.
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-3.jpg" width="560" height="400" alt="windows developer mode"/>

<br/>

혹시나 아래와 같은 문구가 노출될 수 있는데요.
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-1.jpg" width="560" height="400" alt="Linux용 Windows 하위 시스템에..."/>

<br/>

<a href="https://aka.ms/wslstore" rel="nofollow" target="_blank">Microsoft Store(클릭시 이동)</a> 또는
직접 Microsoft Store 앱을 실행하셔서 Linux 배포판을 받으시면 됩니다. 저는 우분투(Ubuntu)로 설치했습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-2.jpg" width="560" height="400" alt="linux in microsoft store"/>

<br/>

저는 언제 설정을 바꿔둔 것인지... 막히는 경우가 발생하지 않았으나 이것저것 찾아보니 가이드가 있더군요.
bash 쉘을 정상적으로 실행했으면 이제 몇가지 명령어만 입력하면 설정은 끝납니다.

<br/>

# 이제 설치해보자!

먼저 다음과 같이 최신 버전 유지와 Ruby 설치를 위한 명령어를 순차적으로 입력합니다. 
- ```sudo apt-get update -y && sudo apt-get upgrade -y``` 
- ```sudo apt-get install -y build-essential ruby-full```

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-4.jpg" width="560" height="400" alt="up to date"/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-5.jpg" width="560" height="400" alt="install ruby"/> 

<br/>

다음으로 Ruby Gems를 업데이트하고 Jekyll을 설치하는 명령어를 순차적으로 입력합니다.

- ```sudo gem update --system```
- ```sudo gem install jekyll bundler```

이후 ```jekyll {폴더명}``` 명령어로 신규 디렉터리 생성 후 시작하시면 됩니다.
혹시나 Windows 바탕화면에 이미 프로젝트가 있다면 아래와 같이 경로를 입력하면 됩니다.
```
# /mnt/c/Users/MadPlay/Desktop/blog/madplay.github.io
$ cd /mnt/c/Users/${사용자 유저명}/Desktop/
```

저는 기존에 깃헙(github)에 레파지토리를 두고 관리하고 있어서 clone 받은 후 디렉터리로 이동해서 아래와 같이 실행했습니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-6.jpg" width="560" height="400" alt="jekyll serve"/>

```--no-watch``` 옵션은 Windows 버전에서 ```watch``` 옵션이 적용이 안된다고 하네요.
경고(Warning) 레벨의 메시지가 뜨면서 동작을 하지 않는다는 가이드가 나옵니다.

<a href="https://github.com/Microsoft/BashOnWindows/issues/216" rel="nofollow" target="_blank">
관련 링크) Microsoft Github Issue (클릭시 이동)</a>

중간에 삽질이 조금 있었는데... 특히 jekyll 설치부분에서 오류를 만났습니다.
이것저것 찾아보니 중간과정에서 ```sudo apt-get install build-essential``` 명령어 누락이 있었네요.
위에 정리한 내용은 삽질한 시간을 생략한 최단 방법입니다.

이제 Windows만 사용하는 집에서도 Jekyll을 실행해서 github 블로그를 관리할 수 있게 됐네요.