---
layout:   post
title:    "Turn Off the Charging Chime on MacBook"
author:   madplay
tags:    mac macbook
description: "Remove the notification sound that plays when you connect a charger to a MacBook"
category: Infra
date: "2022-07-24 21:51:25"
comments: true
slug:     how-to-turn-off-the-charging-sound-on-macbook
lang:     en
permalink: /en/post/how-to-turn-off-the-charging-sound-on-macbook
---

# A Sound Plays When You Plug In the Charger
On a MacBook, a connection chime can play when you connect the charger, even if the speaker is muted.
You can verify this by playing `connect_power.aif` under `/System/Library/CoreServices/PowerChime.app/Contents/Resources`.

The setting to stop this sound on charger connect is simple.
Run `defaults write com.apple.PowerChime ChimeOnAllHardware -bool false;killall PowerChime` in Terminal.

```bash
$ defaults write com.apple.PowerChime ChimeOnAllHardware -bool false;killall PowerChime
```

To enable the chime again, run the following command in Terminal.

```bash
$ defaults write com.apple.PowerChime ChimeOnAllHardware -bool true; open /System/Library/CoreServices/PowerChime.app &
```

<br>

# Reference
- <a href="https://www.howtogeek.com/274191/how-to-hear-a-chime-every-time-you-plug-in-your-macbook-pro-or-air/" rel="nofollow" target="_blank">How-To Geek: "How to Hear a Chime Every Time You Plug In Your MacBook Pro or Air"</a>
