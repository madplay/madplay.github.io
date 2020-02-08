---
layout:   post
title:    Node.js 설치와 예제
author:   Kimtaeng
tags: 	  nodejs 
description: Node.js를 Mac OSX에 설치하고 Hello World 예제 따라해보기
category: Nodejs
comments: true
---

# Node.js 설치하기

```Node.js```를 사용하려면 먼저 설치해야 합니다.
**Mac 환경 기준**으로 설치는 <a href="https://nodejs.org/ko/" rel="nofollow" target="_blank">
Node.js 공식 다운로드 페이지(링크)</a>를 통해서 간단하게 설치할 수 있습니다.

하지만 직접 설치해서 사용해보았을 때 여러 버전을 용이하게 테스트를 하기 위해서는 **Node Version Manager(nvm)**를
사용하여 설치하고 관리하는 것이 더 편했던 것 같습니다.

```nvm```은 아래와 같이 설치하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
# 또는 wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
</code></pre>

설치된 이후에는 쉘을 껐다가 다시 실행하거나 아래와 같이 ```source``` 명령어를 통해 적용합니다.
<pre class="line-numbers"><code class="language-bash" data-start="1"># 터미널을 다시 실행하거나 아래 명령어 입력
$ source ~/.bash_profile
</code></pre>

정상적으로 설치가 되었는지 ```nvm --version``` 명령어를 입력해봅시다.
<pre class="line-numbers"><code class="language-bash" data-start="1"># nvm 버전 출력
$ nvm --version
0.34.0
</code></pre>

혹시나 ```nvm: command not found``` 과 같이 명령어를 찾을 수 없다면 ```~/.bash_profile``` 파일을 열어봅시다.
그리고 아래와 같은 내용이 있는지 확인합니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ sudo vi ~/.bash_profile


# ...생략
export NVM_DIR="${XDG_CONFIG_HOME/:-$HOME/.}nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
</code></pre>

위 내용이 없다면 추가하면 됩니다. 그런데 이글을 작성하려고 기존 제 노트북이 기존에 설치된 nvm과 nodejs를 삭제하고 설치해보니
```macOS mojave``` 버전 기준으로 ```.bashrc```에 환경변수가 적용되더군요.

잠깐 다른 얘기를 해보면 ```.bashrc```는 이미 로그인이 된 상태에서 새롭게 터미널이 실행될 때마다 로드되고
```.bash_profile```의 경우는 시스템에 로그인될 때 로드됩니다. 그리고 사용자의 개별 설정 코드들이 들어갑니다.
따라서 위에 환경 변수 관련 내용들은 이미 설치된 자바와 파이썬 관련 설정들과 함께 관리하기 위해서 ```bash_profile```로 옮겼습니다. 

그럼 이제 앞서 설치한 ```nvm```을 이용해서 ```Node.js```를 설치하면 됩니다.
공식 다운로드 사이트를 보아도 알 수 있지만 제공되는 버전은 **LTS(Long Term Supported)**와 **Stable(또는 Current)**로 구분됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-01-02-nodejs-install-osx-1.png" width="600" height="480" alt="nodejs download"/>

**LTS(Long Term Supported) 버전**은 짝수 번호대의 버전으로 장기적으로 안정적이고 신뢰도 높은 지원이 보장되는 버전이라고 보면 됩니다.
**Stable(또는 Current) 버전**의 경우는 홀수 번호대로 구성됩니다. 최신 기능을 제공하며 기존 기능의 개선에 초점이 맞춘 버전으로
업데이트와 기능 변경이 자주 발생할 수 있습니다. 따라서 실무에서 서버 운영을 위해서는 LTS 버전을 설치하고 간단한 개발 또는 
자체 테스트에는 Stable 버전을 설치하는 것이 적절할 것 같습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># 설치할 수 있는 버전 목록 보기(엄청 많습니다)
$ nvm ls-remote

# 특정 버전 설치하기
nvm install v10.15.0
</code></pre>

<br/>

# Node.js 예제 작성하기

노드 설치도 끝났으므로 이제 간단한 예제를 진행해봅시다. 혹시나 여러 버전의 노드를 설치했다면
아래와 같은 명령어로 자신이 사용할 버전을 선택할 수 있습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># nvm use 버전명
$ nvm use v11.8.0

# node.js 버전 확인하기
$ node -v
v11.8.0
</code></pre>

언어를 배울 때의 가장 첫 단계라고 할 수 있는 **Hello World** 를 웹 서버를 통해 출력해봅시다.
텍스트 편집기 또는 터미널을 열어서 **helloworld.js** 파일을 생성하고 아래와 같이 입력합니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">var http = require('http');

http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World\n');
}).listen(8000);

console.log('Server running at http://localhost:8000/');
</code></pre>

실행은 간단히 ```node helloworld.js``` 로 진행하면 됩니다.
<pre class="line-numbers"><code class="language-bash" data-start="1">$ node test.js 
Server running at http://localhost:8000/
</code></pre>

위 예제의 결과는 인터넷 브라우저를 주소창에 ```http://localhost:8000```를 입력하여 "Hello World" 가 출력되는 것으로
확인할 수 있습니다. 서버를 종료하려면 ```Ctrl + C``` 를 입력하면 됩니다.

간단히 예제 코드에 대해서 살펴보면 우선 nodejs에서 기본적으로 모듈을 로드하여 사용할 때는 ```require()``` 라는 함수를 이용합니다.
코드의 첫 번째 줄에서 http 모듈을 불러오고 ```createServer``` 함수를 이용해 서버 인스턴스를 생성했습니다.

그리고 서버 인스턴스의 ```listen``` 함수를 통해 서버 시작과 사용자의 8000포트로의 요청을 받도록 기다리고
사용자의 요청이 오면 ```response``` 객체로 요청에 대한 응답을 하게 됩니다.

간단한 코드이지만 동작 원리에 대한 더 자세한 설명은 이어지는 글에서 다룰 예정입니다.