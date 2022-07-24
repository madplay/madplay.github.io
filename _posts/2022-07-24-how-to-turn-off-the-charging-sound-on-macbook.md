---
layout:   post
title:    "맥북 충전기 연결음 끄기"
author:   Kimtaeng
tags: 	  mac macbook
description: "맥북(MacBook)에 충전기를 연결했을 때 발생하는 알림음 제거하기"
category: Knowledge
date: "2022-07-24 21:51:25"
comments: true
---

# 충전기를 꽂으면 소리가 난다!
맥북(MacBook)을 사용할 때 스피커를 음소거 상태로 설정했더라도 충전기를 연결하면 특정 연결음이 발생한다.
해당 연결음은 `/System/Library/CoreServices/PowerChime.app/Contents/Resources` 경로의 connect_power.aif 파일을 재생하면 확인할 수 있다. 

충전기를 연결할 때마다 연결음이 발생하지 않도록 설정하는 방법은 간단하다.
아래와 같이 `defaults write com.apple.PowerChime ChimeOnAllHardware -bool false;killall PowerChime` 명령어를 터미널에 입력하면 된다.

```bash
$ defaults write com.apple.PowerChime ChimeOnAllHardware -bool false;killall PowerChime
```

반대로 연결음을 다시 활성화하려면 아래 명령어를 터미널에 입력하면 된다.

```bash
$ defaults write com.apple.PowerChime ChimeOnAllHardware -bool true; open /System/Library/CoreServices/PowerChime.app &
```

<br>

# 참고
- <a href="https://www.howtogeek.com/274191/how-to-hear-a-chime-every-time-you-plug-in-your-macbook-pro-or-air/" rel="nofollow" target="_blank">How-To Geek: "How to Hear a Chime Every Time You Plug In Your MacBook Pro or Air"</a>