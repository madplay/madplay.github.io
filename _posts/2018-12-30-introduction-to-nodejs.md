---
layout:   post
title:    처음 접하는 Node.js
author:   Kimtaeng
tags: 	  nodejs 
description: Node.js란 무엇이며 어떤 특징이 있을까? 기초부터 알아보며 입문해보자
category: Nodejs
comments: true
---

# Node.js?

**Node.js**는 2009년 라이언 달(Ryan Dahl)이 처음 발표한 구글의 V8 Javascript 엔진을 기반으로 만들어진 서버 플랫폼입니다. 
라이언 달이 플리커(Flickr)라는 온라인 사진 공유 커뮤니티를 사용하면서 파일이 어느만큼 업로드되었는지 알기 위해서
서버에 쿼리를 전송해야 한다는 점에서 조금 더 쉬운 방법을 찾다가 고안했다고 합니다.

Java 언어가 주를 이룬 서버 개발 환경을 탈피하여 자바스크립트(Javascript)로 서버 개발을 할 수 있기 때문에
프론트 개발자들도 서버 영역에 조금 더 쉽게 접근할 수 있게 되었습니다.

그렇지만 개인적 의견으로는 무작정 쉽지는 않은 것 같습니다. 물론 개발자의 능숙도에 따라서 얘기가 달라질 수 있겠습니다만
직접 노드로 간단하게 서버 개발을 해보았을 때 nodejs의 특징들을 잘 이해하지 못하여 적지않은 어려움을 겪었던 것 같습니다.

<br/>

# Node.js의 특징과 강점

우선 **Node.js는 Javascript 기반** 입니다. 따라서 프론트엔드와 백엔드 개발을 같은 언어로 개발할 수 있습니다.
덕분에 프론트엔드 개발자의 입장에서는 Javascript를 사용하여 더 낮은 진입 장벽을 바탕으로 서버 개발 기술을 더 빠르게 활용할 수 있습니다.

싱글 스레드(Single Thread) 기반 **비동기 I/O** 처리를 진행합니다.
하나의 스레드가 요청을 받으면 처리를 하고 파일, DB 접근 또는 네트워크 처리가 필요한 경우에는 
I/O 요청을 보내놓고 자신의 작업을 진행합니다. 그리고 이후에 보냈던 요청이 완료되면 이벤트를 받아서 처리하는 **이벤트 기반** 방식을 사용합니다.

<div class="post_caption">그런데 이벤트 기반(Event Driven), 비동기(Asynchronous)란 말은 무엇일까?</div>

쉽게 이해하기 위해서 은행에 갔다고 가정해봅시다. 우리는 은행에서 수도 요금도 내야하고 적금 금액도 내고
자산 투자를 위해 펀드 가입을 해야 하는 일이 생겼습니다. (물론 요즘은 직접 은행에 가지 않고 핸드폰으로 가능하지만...)

시간적인 여유가 있다면 단순하게 수도 요금 정산, 적금 입금, 펀드 관련 창구를 순차적으로 방문해도 됩니다.
창구에 이미 고객이 있다면 그 사람이 일을 끝낼 때까지 기다려야 합니다. **(기존의 서버 동작 방식)**

하지만 조금 더 기다리지 않고 더 빠르게 할 수도 있습니다. 각 창구의 대기 순서표를 뽑아서 기다리다가
내 차례가 오면 대기 순서표를 가지고 은행 업무를 보면 됩니다. 수도 요금 정산을 하다가 적금 창구에서
호출이 오면 그 창구로 옮겨 다니면서 또 업무를 보면 됩니다. **(Node.js의 처리 방식)**

다른 예시로 월급날 자동이체를 생각할 수도 있겠습니다. 월급날이 되어서 통장에 월급이 입금되면**(이벤트 발생)** 수도 요금 정산,
적금 계좌 입금 등을 내도록 수행**(작업 수행, 콜백 함수 실행)**하는 것입니다.

사실 기존의 서버 방식에서는 나 자신을 여러 개로 복제(스레드 생성)하여 처리하지만 해야하는 일이 많아질수록
더 많은 스레드가 생성되는 부분이 있습니다.

<br/>

# 구조와 특징

nodejs의 내부 구조(Architecture)를 살펴보면 아래 그림과 같습니다. 상위 레벨은 자바스크립트로 되어있고 하위 레벨은 C, C++로 되어있습니다.
관련된 사이트들을 찾다가보니 ```libev``` 가 보이는데 v0.9.0 버전에서 종속성이 제거되었다고 합니다. 
<a href="https://stackoverflow.com/a/34566312/9212562" rel="nofollow" target="_blank">(관련링크: Stack overflow)</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-12-30-introduction-to-nodejs-1.png" width="600" height="480" alt="nodejs architecture"/>

nodejs는 **V8 Engine** 위에서 동작합니다. 이 자바스크립트 엔진은 구글이 개발한 Chrome 브라우저에서 사용하기 위해 만들었는데요.
자바스크립트를 빠른 속도로 해석하여 인식할 수 있는 코드로 변환합니다. 따라서 Node.js는 Chrome에 적용되는 최신 트렌드와
성능 향상을 빠르게 적용할 수 있습니다. 구글이 문을 닫지 않는 한 V8 Engine은 꾸준히 개발되고 업그레이드 되겠지요.
추가적으로 V8 Engine의 경우 오픈 소스<a href="https://github.com/v8/v8" target="_blank">(링크: V8 Engine Github)</a>로 공개되어 있습니다.

그리고 **JSON 포맷에 안성맞춤** 입니다. 자바스크립트 언어가 자체적으로 JSON을 지원하기 때문에 JSON 형태의 포맷을 처리할 때 배우 편리합니다.
특히나 데이터 저장소가 MongoDB라면 더 말할 것도 없을 것 같습니다. ORM(Object-Relational Mapping)이나 객체와 JSON 사이의 변환 없이도
간편하게 처리할 수 있습니다.

앞서 **싱글스레드 기반 비동기 I/O** 라고 얘기했지만 nodejs라고 무조건 싱글 스레드만 사용하는 것은 아닙니다.
싱글스레드 기반의 이벤트 루프(Event Loop)가 요청을 처리하는데, 일부 I/O 요청에 대해서는 스레드 풀의 여러 워커(Worker)들은
멀티 스레드(Multi Thread) 방식으로 동작합니다. 그래야 이벤트 루프 스레드가 블록킹되지 않기 때문이지요.  

<br/>

# 마치며

자바만 사용해본 입장에서 Node.js을 짧고 간단하게 살펴보았습니다.
짧게 경험해보았지만 노드로 서버를 구성하는데 걱정했던 만큼 오래 걸리지 않았던 것 같습니다.
특히나 사용하는 데이터의 포맷이 JSON과 같은 형태였을 때 자바보다 더 짧고 간결한 로직을 작성할 수 있다는 점이 매력적이었습니다.

이어지는 글에서 Node.js를 직접 설치해보고 언어를 배울 때의 가장 기본이라고 할 수 있는 **Hello World**를 출력해보겠습니다.

<a href="/post/nodejs-install-osx" target="_blank">링크: Mac OSX에 Nodejs 설치하고 예제 따라해보기(클릭!)</a> 

<div class="post_caption">이 포스트는 아래의 링크들을 참고하여 직접 작성하였습니다.</div>

- <a href="https://medium.freecodecamp.org/what-exactly-is-node-js-ae36e97449f5"
rel="nofollow" target="_blank">What exactly is Node.js?</a>
- <a href="https://stackoverflow.com/questions/36766696/which-is-correct-node-js-architecture"
rel="nofollow" target="_blank">Which is correct Node.js architecture?</a>
- <a href="https://medium.freecodecamp.org/understanding-node-js-event-driven-architecture-223292fcbc2d"
rel="nofollow" target="_blank">Understanding Node.js Event-Driven Architecture</a>