---
layout:   post
title:    "Intellij에서 nodejs 프로젝트가 인식되지 않을 때 해결 방법"
author:   Kimtaeng
tags:     coupling cohesion module
description: "Intellij IDEA/WebStorm으로 nodejs 프로젝트를 개발할 때 'Unresolved function or method for require()' 경고 메시지 해결 방법"
category: Knowledge
date: "2020-08-02 22:42:59"
comments: true
---

# “Unresolved function or method” for require()
`Intellij IDEA`나 `WebStorm` 에서 노드 프로젝트를 생성 또는 새로 오픈하는 경우 `require`가 사용된 모듈 선언 구문에서
`"Unresolved function or method" for require()` 등의 경고가 발생하는 경우가 있다.

애플리케이션 실행에는 문제가 없을 수 있지만, 해당 모듈을 사용하는 곳으로 이동이 되지 않는 등과 같이
정상적으로 nodejs 프로젝트가 인식이 되지 않아 개발 속도를 저하시킨다.

이럴 때는 아래와 같이 `Coding assistance for Node.js` 옵션을 체크하면 된다.
위치는 MacOS 환경 기준으로 `Preferences` -> `Languages & Frameworks` -> `Node.js and NPM` 메뉴로 진입하면 된다.

<img class="post_image" width="600" alt="nodejs and npm settings"
src="{{ site.baseurl }}/img/post/2020-08-02-how-to-fix-unresolved-function-or-method-in-intellij-1.jpg" />

추가적으로 `Manage Scopes` 설정을 통해서 특정 파일 또는 디렉터리에서 사용되는 라이브러리를 지정할 수도 있다.
기본적으로 현재 프로젝트 하위의 `node_modules` 경로가 포함되어 있다.