---
layout:   post
title:    "gem 권한 에러 해결하기(Gem::FilePermissionError)"
author:   Kimtaeng
tags: 	  gem ruby
description: "루비(Ruby)의 패키지 매니저인 gem 실행하다가 발생하는 FilePermissionError 권한 오류 해결하기"
category: Knowledge
date: "2022-11-30 02:11:20"
comments: true
---

# While executing gem ... (Gem::FilePermissionError)
루비(Ruby) 언어를 위한 패키지 매니저인 gem을 사용하다가 아래와 같은 오류를 만날 수 있다.

```bash
$ gem install bundler
...
ERROR:  While executing gem ... (Gem::FilePermissionError)
You don't have write permissions for the /Library/Ruby/Gems/2.6.0 directory.
```

간단하게 `sudo` 권한을 통해 실행하면 해결할 수 있지만, 수행하려는 작업이 명확하더라도 권한을 변경하는 것은 권장되지 않는다.
따라서 루비 언어의 버전 관리 매니저인 `rbenv`를 통해서 문제를 해결해보자.

<br>

# 오류 해결
설치는 <a href="https://brew.sh/index_ko" rel="nofollow" target="_blank">Homebrew</a>로 설치를 진행한다.
혹시나 설치가 필요하다면, 아래 명령어로 진행하면 된다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```


먼저 Homebrew를 최신 버전으로 `update` 하고, `rbenv` <a href="https://github.com/rbenv/rbenv#homebrew" rel="nofollow" target="_blank">Github에 명시된 가이드</a>를 참고해서 설치한다.

```bash
$ brew update
$ brew install rbenv ruby-build
```

설치가 끝난 후 `rbenv` 명령어를 통해 설치 가능한 루비(Ruby) 버전을 확인해보자.

```bash
$ rbenv install -l
2.7.7
3.0.5
3.1.3
// 생략...
```

2022년 11월 기준으로 가장 최신 버전인 3.1.3 버전으로 설치하면 된다.


```bash
$ rbenv install 3.1.3
Downloading ruby-3.1.3.tar.gz...
-> https://cache.ruby-lang.org/pub/ruby/3.1/ruby-3.1.3.tar.gz
Installing ruby-3.1.3...
ruby-build: using readline from homebrew
Installed ruby-3.1.3 to /Users/madplay/.rbenv/versions/3.1.3
```

설치한 후에는 `rbenv`를 사용해서 3.1.3 버전을 전역으로 설정하고 정상적으로 반영되었는지 확인해보자.

```bash
# 글로벌 버전 설정
$ rbenv global 3.1.3

# 버전 확인
$ rbenv versions
  system
* 3.1.3 (set by /Users/madplay/.rbenv/version)
```

그리고 쉘 설정 파일에 `rbenv` PATH를 추가한다. 사용하는 쉘에 따라서 bash는 `.bashrc` zsh는 `.zshrc`에 각각 아래 내용을 추가하면 된다.

```bash
$ vi ~/.zshrc

[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

위 설정이 반영될 수 있도록 `source` 명령어로 해당 내용을 적용한다.

```bash
$ source ~/.zshrc
```

끝으로 오류가 발생했던 명령어를 다시 입력해보자. 정상적으로 수행된다.

```bash
gem install bundler
Fetching bundler-2.3.26.gem
Successfully installed bundler-2.3.26
Parsing documentation for bundler-2.3.26
Installing ri documentation for bundler-2.3.26
Done installing documentation for bundler after 2 seconds
1 gem installed
```

## 참고
- <a href="https://stackoverflow.com/a/54873916/9212562" rel="nofollow" target="_blank">StackOverflow: You don't have write permissions for the ...</a>
