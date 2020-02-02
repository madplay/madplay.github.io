---
layout:   post
title:    git rebase로 커밋 합치기
author:   Kimtaeng
tags: 	  git commit squash rebase
description: 여러 개의 커밋(commit)을 하나로 합치고 싶을 때는 어떻게 해야할까? git rebase를 이용하여 commit 로그를 묶어보자.
category: Knowledge
comments: true
---

# 개발을 하다보니...

개발을 하다보면 작업한 코드를 여러 커밋으로 나누어서 진행하게 되는 경우가 많습니다.
변경사항을 모았다가 한 번에 커밋하는 경우도 있긴하지만 간혹 그런 경우에는 자신이 수정한 곳이 어디인지,
어떤 기능이 개발 완료가 되었는지 헷갈릴 수 있습니다. 

**물론 개발 스타일에 따라서 다를 수 있습니다.** 가끔은 여러 기능을 개발했음에도 하나의 커밋으로 몰아서 하는 경우도 있으니까요.
그래도 커밋을 나누는 것이 **Pull Request**와 같이 온라인에서 리뷰를 진행할 때 보기 편하기는 합니다.

한편 버그를 고치거나 수정 사항을 반영하기 위해 간단한 커밋을 여러번하게 되는 경우가 있는데요. 최종적으로 브랜치에 머지(Merge)를
진행할 때 여태까지의 수정을 위한 커밋들이 모두 반영되어 예쁘게(?) 보이지 않을 수 있습니다.
실제로 몇몇 오픈소스의 github에서는 컨트리뷰터에게 Pull Request를 반영하기 전에 커밋 로그를 다듬어달라고 하는 경우도 있습니다.
즉, **git rebase**를 통해 커밋 로그를 묶어서 반영하는 것을 요구하는 것이지요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-20-squash-git-commits-with-rebase-1.png" width="700" height="600" alt="commits"/>

<div class="post_caption">너무 많이 커밋했나..?</div>

<br/>

# 커밋을 합쳐보자

코드 리뷰 수정사항이나 버그를 수정하는 코드의 리뷰가 끝났을 때, 최종 머지를 앞두고 커밋을 합쳐봅시다.
우선, 현재 커밋 상태를 확인해봅시다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git log --oneline
0daa91f (HEAD -> feature-rebase, origin/feature-rebase) add fourth
18afb89 remove third, fourth
d8eb9df fourth
8f0a8df third
c636715 second
9e76605 (origin/master, master) first 
</code></pre>


현재(HEAD)를 기준으로 최근 3개의 커밋을 합쳐봅시다. 명령어로 ```git rebase -i HEAD~3``` 을 입력해주면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git rebase -i HEAD~3

pick d8eb9df fourth
pick 18afb89 remove third, fourth
pick 0daa91f add fourth
</code></pre>

합쳐질 커밋 해시값 앞에 squash(약어로는 s)를 붙여주면 됩니다. pick 대상에 squash로 지정된 커밋이 합쳐지게 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">pick d8eb9df fourth
s 18afb89 remove third, fourth
s 0daa91f add fourth
</code></pre>

이후 ```:wq``` 명령어로 저장하여 편집화면을 종료하면 됩니다. 화면을 빠져나오자마자 아래와 같은 모습을 확인할 수 있는데요.
3개의 커밋의 조합된 것을 확인할 수 있으며, 이 화면에서 커밋 메시지도 수정 가능합니다. 

<pre class="line-numbers"><code class="language-bash" data-start="1"># This is a combination of 3 commits.
# This is the 1st commit message:

fourth

# This is the commit message #2:

remove third, fourth

# This is the commit message #3:

add fourth

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
</code></pre>

아래와 같이 수정해줍시다. 기존의 작업에 대한 커밋 메시지는 지우고 하나로 통일하면 됩니다.
포스팅 예제에서는 커밋을 합친다는 것이 분명하게 보이기 위해 이전 커밋의 내용을 그대로 사용하겠습니다.
실제로는 조금 다르고 더 멋있게(?) 커밋 메시지를 적으면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># This is a combination of 3 commits.
# This is the 1st commit message:
 
add fourth, remove third, fourth

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
</code></pre>

정상적으로 반영되었는지 로그를 다시 확인해봅시다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git log --oneline
8923928 (HEAD -> feature-rebase) add fourth, remove third, fourth
8f0a8df third
c636715 second
9e76605 (origin/master, master) first
</code></pre>

로그상으로는 원하는 모습처럼 커밋 로그가 합쳐진 상태로 보입니다. 이제 원격저장소에 반영해봅시다.

<br/>

# 원격저장소에 반영하기

```git push```를 통해서 원격 저장소에 반영할 수 있습니다. 예제에서는 ```feature-rebase```라는 브랜치를
별도로 생성해서 진행하였습니다. 마지막에 언급하겠지만, ```master``` 또는 ```develop```와 같이 여러 사람이 함께 사용하는
브랜치에서 rebase 작업을 하는 것은 위험합니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git push origin feature-rebase
To https://github.com/madplay/madplay.git
 ! [rejected]        feature-rebase -> feature-rebase (non-fast-forward)
error: failed to push some refs to 'https://github.com/madplay/madplay.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
</code></pre>

예상했듯이 rebase 등을 통해 커밋 히스토리가 합쳐진 경우는 보편적인 push로는 해결되지 않습니다.
커밋 로그를 합쳐서 새로운 변경점을 만들었기 때문에 현재의 변경점은 원격지보다 뒤에(behind) 위치하게 됩니다.
이런 경우에는 강제 옵션(--force 또는 -f)과 함께 반영해야 합니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git push -f origin feature-rebase</code></pre>

강제 옵션을 사용하여 원격 저장소에 반영하면 앞서 확인했던 Pull Request에서도 반영된 모습을 확인할 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-20-squash-git-commits-with-rebase-2.png" width="700" height="600" alt="after rebase"/>

<br/>

# 마치며

앞선 단계에서 ```git rebase```를 최근 3개의 커밋에 대해서만 진행했지만 그 이상의 커밋에 대해서도 가능합니다.
아래처럼 반영하고 싶은 커밋의 **바로 직전 커밋**의 해시 값을 이용하면 현재까지의 모든 커밋을 선택할 수 있습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git log --oneline
8923928 (HEAD -> feature-rebase, origin/feature-rebase) add fourth, remove third, fourth
8f0a8df third
c636715 second
9e76605 (origin/master, origin/develop, master) first

$ git rebase -i 9e76605d
</code></pre>

마지막의 ```git rebase -i 9e76605d``` 명령어를 입력하게 되면 c636715, 8f0a8df, 8923928 커밋이 rebase 대상으로 선택됩니다.
여기서 해시값은 사용자마다 다르기때문에 본인의 커밋 로그를 반드시 확인하셔야 합니다. 바로 직전 커밋을 대상으로 한다는 것도 중요하고요.

master 브랜치의 커밋을 제외한 모든 커밋을 squash한 후 반영하면 아래와 같이 수정됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ git log --oneline
31a7b78 (HEAD -> feature-rebase) second, third, add fourth, remove third, fourth ===> only second
9e76605 (origin/master, origin/develop, master) first
</code></pre>

이처럼 ```git rebase```를 사용하면 커밋 로그를 합칠 수도 있고 더 나아가 커밋 작성자까지도 변경할 수 있습니다.

- <a href="/post/change-git-author-name" target="_blank">참고 링크: git commit author 변경 (커밋 작성자 변경하기)</a>

끝으로, 지저분하게 만들어진 커밋을 합칠 수 있는 장점이 있지만 force push를 하기때문에 master 또는 develop처럼
**다른 개발자와 같이 사용하는 브랜치에서 적용할 때는 특히 주의**해야 합니다. 그러니까 다른 사람과 함께 만들고 있는 히스토리를
일방적으로 수정해서는 안됩니다.