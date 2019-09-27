---
layout:   post
title:    "인텔리제이(Intellij) 플러그인 만들기: 1. 환경 구성"
author:   Kimtaeng
tags: 	  intellij plugin 
description: 인텔리제이(Intellij)에서 사용하는 플러그인(Plugin)을 직접 개발해보자
category: Knowledge
comments: true
---

# 목차
- 인텔리제이(Intellij) 플러그인 만들기: 1. 환경 구성
- <a href="/post/creating-an-intellij-plugin-action" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의</a>
- <a href="/post/deploying-and-publishing-an-intellij-plugin" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 3. 빌드 & 배포하기</a>

<br/>

# 인텔리제이 플러그인 만들기
이번 포스팅에서는 Mac OS 환경에서 인텔리제이 플러그인을 직접 개발하는 방법을 알아봅니다.
gradle을 통해서 생성하는 방법도 있으나, 이번 포스팅에서는 DevKit을 통해서 빠르게 만드는 방법으로 진행합니다.

<br/>

# 플러그인 프로젝트 생성하기
플러그인을 만들기 위해서는 먼저, 인텔리제이에서 **플러그인 프로젝트**를 생성해야 합니다.
**File -> New -> Project...** 경로로 진입하여 아래와 같은 새 프로젝트를 만드는 화면에서 **Intellij Platform Plugin**을 선택합니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-06-creating-intellij-plugin-project-1.png" width="650" height="500" alt="create plugin project"/>

<br/>

프로젝트 이름을 지정해주면 간단하게 생성이 완료됩니다. 여기서 지정하는 이름은 프로젝트의 이름이며 실제 플러그인 이름은
다르게 지정할 수 있습니다. 단, github 등으로 소스 코드를 관리한다면 코드 저장소의 이름과 일관성있게 하는 것이 좋습니다.
플러그인을 배포할 때 사용되는 정보들은 아래 이어지는 내용에서 확인할 수 있습니다.

<br/>

# 개발 환경 점검하기
프로젝트가 생성되었으면 개발하기 위한 설정이 완료되었는지 점검해야 합니다.
`Project Structure` 에서 **Project SDK**를 확인해봅니다. 아래 화면처럼 **Intellij Platform Plugin SDK**여야 합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-06-creating-intellij-plugin-project-2.png" width="650" height="500" alt="Configuring intellij platform sdk"/>

<br/>

설정이 되어있지 않은 경우는 New 버튼을 선택하여 자신의 버전에 맞게 추가하면 됩니다. 설정이 완료된 경우 프로젝트의 SDK 설정에
아래와 같이 표기됩니다. 이번 예제에서는 Intellij 2019.1 버전(Build 191)과 자바 8버전을 사용하여 설정하였습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-06-creating-intellij-plugin-project-3.png" width="650" height="500" alt="Platform SDK Settings"/>

<br/>

# 프로젝트 구조 살펴보기
위 과정을 모두 완료하면 아래와 같은 프로젝트 구조를 확인할 수 있습니다. 프로젝트 생성 직후이기 때문에 파일이 많지 않습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-06-creating-intellij-plugin-project-4.png" width="300" height="250" alt="Project structure"/>

`src` 디렉터리에는 플러그인를 동작시키는 루트 소스 디렉터리입니다. `out` 디렉터리는 빌드 결과물이 위치합니다.
한편 플러그인을 관리할 때 주의깊게 보아야 하는 것은 `plugin.xml` 입니다. 이곳에서 플러그인의 고유한 ID나 이름, 버전, 변경사항 등을 관리할 수 있습니다.

```xml
<idea-plugin>
  <id>MadPlugin</id> <!-- 플러그인의 고유값. 업로드 이후 변경할 수 없으므로 주의 -->
  <name>Mad-Plugin</name> <!-- 플러그인의 이름 -->
  <version>0.0.1</version> <!-- 플러그인의 버전 -->
  
  <!-- 플러그인 제공자 정보. email, url 등 정의 가 -->
  <vendor email="itsme@taeng.com">madplay</vendor>

  <!-- 플러그인에 대한 설명이 들어갑니다. -->
  <description><![CDATA[
      blah~ blah~
    ]]></description>

  <!-- 버전별 변경 정보를 입력할 수 있습니다 -->
  <change-notes><![CDATA[
      <ul>
        <li>Release plugin</li>
      </ul>
    ]]>
  </change-notes>

  <!-- 플러그인을 사용할 수 있는 인텔리제이의 빌드 버전을 적습니다. --> 
  <!-- since/until로 지원 버전 범위를 지정할 수 있습니다. -->
  <idea-version since-build="173.0"/>
  
  <!-- IntelliJ IDEA, PyCharm, WebStorm 등 IDE를 타겟팅할 수 있습니다. -->
  <!-- 이번 예제에서는 IntelliJ IDEA, Android Studio를 타겟으로 합니다. -->
  <depends>com.intellij.modules.java</depends>
 
  <!-- 상호 작용할 다른 플러그인을 정의할 수 있습니다. -->
  <extensions defaultExtensionNs="com.intellij">
    
  </extensions>
</idea-plugin>
```

<br/>

# 이어서
이제 인텔리제이 플러그인을 개발할 준비는 끝났습니다. 이어지는 포스팅에서는 플러그인을 실행하기 위한 동작, 액션(Action)을 정의하는 방법에 대해서 알아봅니다.

- <a href="/post/creating-an-intellij-plugin-action" target="_blank">
다음 포스팅: 인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의</a>