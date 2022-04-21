---
layout:   post
title:    "MacOS 업그레이드 후 xcrun: invalid active developer path 오류 해결"
author:   Kimtaeng
tags: 	  macos monterey xcode
description: "MacOS 업그레이드 이후에 발생하는 \"xcrun: error: invalid active developer path\" 에러 해결 방법" 
category: Knowledge
date: "2022-04-21 01:22:54"
comments: true
---

MacOS를 업그레이드를 하고 나면 꼭 `git`이 정상적으로 실행되지 않는다. 최근에도 몬테레이(Monterey) 버전으로 업데이트하면서 어김없이 관련 오류가 발생했는데
오류 내용은 카탈리나(Catalina) 버전으로 업그레이드할 때와 동일했다. ~~(거의 업데이트할 때마다 발생하는 듯한...)~~

`xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun`

오류는 아래처럼 터미널에 `git`이나 `gcc`와 같이 개발 관련 명령어를 입력하면 확인할 수 있다.

```bash
$ git
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
```

해결 방법은 간단하다. 아래와 같이 터미널에서 `xcode-select --install` 명령어로 설치해주면 된다. 

```bash
$ xcode-select --install
```

환경에 따라 다르겠지만 본인의 경우 설치 완료까지 약 10분 정도 소요됐다.
