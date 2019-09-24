---
layout:   post
title:    MacOS High Sierra에서 Jekyll 실행 오류 해결하기
author:   Kimtaeng
tags: 	  HighSierra Jekyll
description: High Sierra 버전에서 Jekyll 실행 오류를 해결해보자.
category: Knowledge
comments: true
---

# High Sierra 업데이트 이후 Jekyll 실행이 안된다.

기대반 걱정반의 심정으로 진행한 High Sierra 업데이트를 진행했는데요.
재시동까지 완료한 후에 블로그 관리를 하려고 ```jekyll serve --watch``` 를 타이핑한 순간, 아래와 같은 오류 메시지를 만났습니다.

```
-bash: /usr/local/bin/jekyll: /System/Library/Frameworks/Ruby.framework/Versions/2.0/usr/bin/ruby: bad interpreter:No such file or directory
```

이전 버전과 다르게 무언가가 바뀐 것 같습니다.
검색을 통해 이것저것 찾아본 결과 Ruby 2.0을 더이상 지원하지 않기 때문이었습니다.
따라서 MAC OS High Sierra 에서는 몇가지의 업데이트가 필요합니다.

<br/>

# 아래와 같은 과정을 실행합니다.

**Step 1. Homebrew를 설치하도록 합니다.(이미 설치되어 있다면 Skip)**
```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-08-jekyll-build-not-working-in-mac-os-high-sierra-1.png" width="600" height="200" alt="install homebrew"/>

<br/>

**Step 2. ruby 관련 설치를 진행합니다.**
```
curl https://gist.githubusercontent.com/DirtyF/5d2bde5c682101b7b5d90708ad333bf3/raw/bbac59647ac66016cf443caf7d48c6ae173ae57f/setup-rbenv.sh | bash
```
기존에 설치가 되어있지 않은 상태라면 아래와 같이 설치 과정을 볼 수 있습니다.
```
brew update
Updated Homebrew from 67c4402634 to b4d43e950f.
...
brew install rbenv ruby-build
installing… rbenv 1.1.1
installing… ruby-build 20171215
rbenv install 2.4.3
ruby-build: use openssl from homebrew
Downloading ruby-2.4.3.tar.bz2...
-> https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.3.tar.bz2
... 생략
```

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-08-jekyll-build-not-working-in-mac-os-high-sierra-2.png" width="600" height="200" alt="install ruby"/>

<br/>

**Step 3. ruby가 정상 설치되었는지 확인해봅시다.**
```
MadPlayui-MacBook-Pro:~ madplay$ ruby -v
ruby 2.4.3p205 (2017-12-14 revision 61247) [x86_64-darwin17]
```

**Step 4. RubyGems을 이용한 jekyll과 bundler 설치**
```
gem install jekyll bundler
Fetching: jekyll-3.6.2.gem (100%)
Successfully installed jekyll-3.6.2
Fetching: bundler-1.16.0.gem (100%)
Successfully installed bundler-1.16.0
```
그리고 정상적으로 반영되었는지 ```jekyll -v``` 명령어로 버전 확인!

<br/>

**Step 5. RubyGems 업데이트**
```
gem update --system
Updating rubygems-update
Fetching: rubygems-update-2.7.3.gem (100%)
....생략

선택적으로,
gem update jekyll
```

위 과정을 마치고 다시 ```jekyll serve --watch``` 명령어를 실행하여
로컬 환경에서 블로그를 구동시키려고 했으나! 또 다른 에러를 만났습니다.

```
... "cannot load such file -- jekyll-paginate“
```
최초 에러를 수정하려고 이것저것 Gem 업데이트를 진행하다가 디펜던시가 꼬인듯한 느낌!

<a href="https://github.com/jekyll/jekyll/issues/4518" rel="nofollow" target="_blank">Jekyll Github Issue(링크)</a>

아래와 같이 2단계의 명령어를 실행해서 해결했습니다.
```gem uninstall --all``` 그리고 이후에 ```gem install github-pages``` 명령어 실행!

이제 정말로 High Sierra 업데이트 이후 Jekyll 블로그가 정상 동작하는 것 확인!