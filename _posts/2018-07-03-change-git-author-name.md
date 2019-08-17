---
layout:   post
title:    git commit author 변경 (커밋 작성자 변경하기)
author:   Kimtaeng
tags: 	  git commit rebase
description: committer를 잘못 입력하여 push까지 해버렸다. 바꿀 수 있을까?
category: Knowledge
comments: true
---

# 다른 사람의 이름으로 commit 해버렸어...
개발을 진행할 때, 특히 여러 사람들과 같이 개발을 진행할 때 버전 관리는 참 중요합니다.
대표적으로 사용되는 버전 관리 도구로 깃(Git)이 있지요. 누가, 언제, 어떠한 코드를 작성했는지 알 수도 있고
커밋(commit) 이라는 유니크한 값을 가진 개발 코드의 반영 단위가 있어서 변경점을 추적하기도 좋습니다.

이 반영 단위라는 커밋을 가끔씩 의도와 다르게 반영하는 실수를 하는 경우가 있는데요.
커밋을 진행할 때의 포함되는 메시지를 바꾸고 싶은 경우도 있고요. **작성자(author)를 바꾸고 싶은 경우**도 있습니다.

개인마다 다르겠지만 자신의 github 페이지에서 보이는 커밋 횟수로 만드는 **녹색의 풀숲(?)**을 신경쓴다면,
커밋의 작성자가 누구인가는 정말 중요하겠지요. **내가 작성한 코드가 다른 아이디의 커밋 활동**으로 반영되니까요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-03-git-author-change-name-1.png"
width="500" alt="commit with wrong author"/>

<div class="post_caption">내 커밋 내놔...</div>

특히나 Git 원격저장소로 push까지 한 상태라면 더 난감합니다.
바로 직전 커밋이고 다른 브랜치 또는 커밋에 큰 영향이 없다면 ```git reset HEAD^1``` 으로 ```HEAD```를 돌린 후
```git push origin +{branchName}```으로 강제 push를 하면 되긴 합니다.

push를 아직 하지않고 로컬에 있는 상태라면 ```git commit --amend``` 명령어로 직전 커밋을 수정할 수도 있습니다.

하지만 오늘은 git의 ```rebase``` 명령어를 통해서 아래와 같은 상황의 커밋을 수정해봅시다.
- Git 원격 저장소에 이미 반영된 상태
- 바로 직전이 아닌 중간에 위치해 있는 commit 

<br/>

# commit hash 값 찾기

먼저 **변경할 대상 커밋의 바로 직전 커밋의 hash 값**을 알아야합니다.
github에서 커밋 히스토리를 보고 해시(hash) 값을 확인하거나 터미널에서 ```git log``` 등의 명령어로 알 수 있지요.



```bash
$ git log

* commit 10aa749 (HEAD -> master, origin/master)
| Author: madplay <itsmetaeng@gmail.com>
| 
|     [포스팅] 이진 탐색 트리
|     
|     https://madplay.github.io/post/binary-search-tree-in-java
|  
* commit b813011
| Author: Kimtaeng <madplay@MadPlayui-MacBook-Pro.local>
| 
|     git 작성자 변경 테스트(얘가 잘못되었어)
|  
* commit 80be237
| Author: madplay <itsmetaeng@gmail.com>
| 
|     git 작성자 변경 테스트
|  
* commit 97a9e69
  Author: madplay <itsmetaeng@gmail.com>

```

<div class="post_caption">변경할 커밋의 해시값이 아닌 변경할 커밋의 바로 직전 커밋의 해시값을 알아야 합니다.</div>

`변경할 커밋의 hash 값은 b813011` 입니다. 이번 작업은 이 커밋의 바로 `직전 커밋을 대상으로 시작`되므로 `찾아야하는 커밋의 hash 값은 80be237` 입니다.
위의 터미널 결과는 제가 진행하는 환경을 기준으로 하므로 사용자마다 다르게 값이 생성됩니다.

<br/>

# rebase 이용하기
자 이제 시작해봅시다. 아래와 같이 터미널에 입력합니다. 물론 터미널 상의 현재 위치는 Git 프로젝트라고 가정합니다.
앞서 언급한 것처럼 **변경할 커밋의 바로 앞의 커밋의 해시값**을 입력해야 합니다.

### 1) git rebase 명령어 입력
```bash
# git rebase -i -p {커밋 hash값}
$ git rebase -i -p 80be237
```


### 2) 변경 대상의 커밋 설정 변경하기
위의 `rebase` 관련 명령어를 입력하면 아래와 같이 vi 에디터가 자동으로 열립니다. 초기 상태는 모든 커밋이 `pick {hash값} {커밋 메시지}`인 상태인데요.
`변경할 b813011 값의 커밋`의 맨 앞의 `pick`을 `edit 또는 e`로 변경합니다. 이렇게 하는 경우 해당 커밋을 `rebase 대상`으로 지정하게 됩니다.

```bash
edit b813011 git 작성자 변경 테스트(얘가 잘못되었어)
pick 10aa749 [포스팅] 이진 탐색 트리

# Rebase 80be237..10aa749 onto 80be237 (2 command(s))
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

그리고 `:wq` 명령어를 통해서 저장하고 나가면 됩니다. 주석을 보면 아시다시피 `rebase`를 진행할 때는 많은 명령어들이 있습니다.
지금은 우선 커밋의 작성자(author) 변경이 우선이므로 `edit` 으로 바꾸고 저장합시다. 

```bash
$ git rebase -i -p 80be237
Stopped at b81301124d4b292f8ce0ff484ae73c56f5b3aea4... git 작성자 변경 테스트(얘가 잘못되었어)
You can amend the commit now, with

	git commit --amend 

Once you are satisfied with your changes, run

	git rebase --continue 
```

### 3) 작성자(author) 수정하기
저장하고 나오면 위의 마지막 화면처럼  `rebase 진행모드`를 시작합니다.
앞서 `edit`으로 변경한 커밋이 있으니까요. 그럼 이제 아래와 같은 명령어로 올바른 작성자(author)를 입력하면 됩니다.

```bash
$ git commit --amend --author="작성자명 <email주소>"

# 또는 git commit --amend 까지만 입력한 후 vi 에디터로 직접 수정해도 됩니다.
$ git commit --amend
git 작성자 변경 테스트(얘가 잘못되었어)
  
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# Author:    madplay <itsmetaeng@gmail.com>
#
# interactive rebase in progress; onto 80be237
# Last command done (1 command done):
#    e b813011 git 작성자 변경 테스트(얘가 잘못되었어)
# Next command to do (1 remaining command):
#    pick 10aa749 [포스팅] 이진 탐색 트리
# You are currently splitting a commit while rebasing branch 'master' on '80be237'.
#
# Changes to be committed:
#       modified:   pom.xml
#
```

명령어를 입력하면 아래와 같이 수정사항이 반영되는 것을 볼 수 있습니다.
```bash
$ git commit --amend --author="madplay <itsmetaeng@gmail.com>"
[detached HEAD 515c3cc] git 작성자 변경 테스트(얘가 잘못되었어)
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### 4) 다음 커밋으로 계속 진행하기
우리가 수정해야 하는 커밋은 수정을 끝났으니 이제 `rebase 작업을 종료` 하도록 합시다.

```bash
$ git rebase --continue
```

만일 커밋을 2번 과정에서 또다른 커밋을 `edit`으로 변경했다면 다음 커밋을 대상으로 진행될 것이고
더 진행할 커밋이 없다면 아래와 같은 메시지가 나옵니다.

```bash
$ git rebase --continue
Successfully rebased and updated refs/heads/master.
```

수정을 해야하는 커밋이 더 있다면 3번과 4번 과정을 반복해서 진행하면 됩니다.

### 5) push한 후 확인하기
이제 로컬에 반영한 커밋 내용을 다시 원격저장소로 `push`하면 됩니다.
다만, rebase 작업 이후에는 `--force` 옵션을 사용하거나 브랜치 이름 앞에 +를 붙여 강제로 진행해야 합니다.

```bash
$ git push origin +{branchName}
# 또는 --force
```

push가 완료되었다면 github 페이지로 들어가서 확인해봅시다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-03-git-author-change-name-3.png"
width="300" alt="after rebase"/>

잘 변경되었네요. 작성자를 잘못 입력해서 잃어버린 커밋을 되찾았습니다!
사실 `git`에는 이번에 사용해본 `rebase` 명령어 말고도 `git filter-branch`라는 기능도 제공합니다.

```bash
$ git filter-branch --env-filter '
WRONG_EMAIL="{잘못된 이메일 주소}"
NEW_NAME="{바꿀 이름}"
NEW_EMAIL="{바꿀 이메일 주소}"

if [ "$GIT_COMMITTER_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$NEW_NAME"
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$NEW_NAME"
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

구조를 보았을 때, 필터를 등록해서 이전 커밋들을 찾는 것 같죠? 개인적으로 자주 접하진 않은 방법이라 낯설지만 유용할 것 같습니다.
테스트삼아 해보았는데 전체 커밋을 다 탐색하기 때문에 시간이 조금 더 걸리긴 합니다.

오늘은 `git rebase`를 통해서 이전 커밋의 author를 변경하는 방법을 알아보았습니다.
회사나 학교 계정과 개인용 github 계정을 동시에 사용하다가 흔히 겪을 수 있는 일인 것 같습니다. 저도 그랬고요.