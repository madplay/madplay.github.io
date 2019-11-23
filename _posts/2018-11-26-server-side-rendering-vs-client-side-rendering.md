---
layout:   post
title:    서버 사이드 렌더링과 클라이언트 사이드 렌더링
author:   Kimtaeng
tags: 	  serverside clientside rendering SPA
description: 서버 사이드 렌더링(Server Side Rendering)과 클라이언트 사이드 렌더링(Client Side Rendering)은 어떤 차이가 있을까? 
category: Knowledge
comments: true
---

# 렌더링

**렌더링(Rendering)**은 요청을 받은 웹 페이지의 내용을 화면에 그려주는 것을 말합니다.
어느 쪽에서 리소스를 해석하고 그려주느냐에 따라서 ```서버 사이드 렌더링(Server Side Rendering)```과
```클라이언트 사이드 렌더링(Client Side Rendering)```으로 나눌 수 있습니다.

조금 더 자세히 각각의 렌더링에 대해서 살펴봅시다.

<br/>

# 서버 사이드 렌더링

기존의 보편적인 웹 애플리케이션의 렌더링 방식입니다. 사용자가 웹 페이지에 접속하면 서버에 해당 페이지를 요청하고
서버에서는 HTML과 같은 리소스를 해석하고 렌더링하여 사용자에게 보여줍니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-11-26-server-side-rendering-client-vs-side-rendering-1.png" width="500" height="300" alt="server side rendering"/>

이처럼 **서버 사이드 렌더링**은 요청시마다 새로고침이 발생하며 새로운 페이지를 서버에 매번 요청하게 됩니다.
예를 들자면 마치 새로운 옷을 입고 싶을 때마다 백화점에 가서 옷을 구매하는 것이지요.

한편 모바일 환경이 대중화되고 그에 따라 제공되어지는 정보량이 많아지면서 기존의 방식과
다른 모바일에 최적화된 서비스가 필요해졌습니다. 그래서 등장한 방식이 **SPA(Single Page Application)**입니다.

<br/>

# Single Page Application

```SPA(Single Page Application)```은 브라우저가 로드된 이후에 페이지 전체를 서버에 요청하는 것이 아니라
최초에 페이지 전체를 불러온 후에는 데이터만 필요에 맞게 변경하여 사용하는 웹 애플리케이션을 말합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-11-26-server-side-rendering-client-vs-side-rendering-2.png" width="550" height="350" alt="single page application"/>

**서버 사이드 렌더링**처럼 또 다른 웹페이지를 보고 싶을 때마다 서버에 새로운 페이지 요청을 하는 것이 아니라
최초 요청에 대해서만 서버 측에서 제공하고 이후의 페이지 또는 데이터 변경에 대해서는 클라이언트 측의 스크립트를 이용해
렌더링하게 됩니다. 이를 **클라이언트 사이드 렌더링(Client Side Rendering)** 이라고 합니다.

예를 들자면 백화점에 한 번만 방문하여 조금 더 오랜 시간동안 필요한 옷(리소스)들을 고른 후에 옷장에 넣어둡니다.
이후에 새로운 옷이 필요하면 백화점(서버)에 가지 않고 옷장에서 꺼내 입으면 되지요.

이 방식은 기존 보편적인 방식인 서버 사이드 렌더링과 다르게 페이지 요청마다 새로고침이 일어나지 않으며 서버측의 트래픽을 감소시킵니다.
또한 사용자 입장에서는 더 쾌적한 인터랙션(interaction)을 경험할 수 있습니다. 서버의 역할은 단순하게 스크립트에 이용할 데이터만 내려주면 되고
페이지를 그리는 역할은 클라이언트가 스크립트를 통해 수행하게 됩니다.

<br/>

# 그럼 어느게 더 좋은가?

각 렌더링 방식의 특성에 대해서 비교해보면 장단점을 정리할 수 있습니다.

**서버 사이드 렌더링**의 경우 서버 측에서 뷰(View)를 렌더링하여 가져오기 때문에 **첫 로딩 속도**가 상대적으로 빠릅니다.
페이지에서 자바스크립트를 사용한다면 그에 필요한 스크립트 파일들이 모두 로드된 후에 실행되므로 아무런 인터렉션이 반응하지 않지만
페이지를 보고 있는 사용자 입장에서는 로딩이 빠르다고 볼 수 있습니다.

반대로 **클라이언트 사이드 렌더링**의 경우 서버 측이 아닌 페이지 구성을 위한 HTML, 자바스크립트 파일 등을 로드한 후에 브라우저에서 렌더링을
시작하므로 서버 사이드 렌더링보다 상대적으로 초기 로딩 속도는 오래 걸립니다. 하지만 그 이후에는 서버로부터 페이지를 다시 요청하지 않기때문에
더 빠른 인터렉션을 기대할 수 있습니다.

**보안적인 측면**도 생각할 수 있습니다. 세션(Session)으로 사용자 정보를 관리하는 서버 사이드 렌더링과 다르게
클라이언트 사이드 렌더링은 항상 클라이언트 측에 저장되는 쿠키(Cookie)를 이용하게 됩니다.

**검색 엔진 최적화**에 대해서도 고려해야 합니다. 웹 상에는 컨텐츠를 수집하는 다양한 봇(bot)과 웹 크롤러(Web Crawler)가 있습니다.
자신이 운영하는 페이지가 정상적으로 수집되어야 한다면 클라이언트 사이드 렌더링 방식은 치명적일 수 있는데요.
대다수의 수집 봇들이 자바스크립트를 실행하지 못하기 때문입니다. 렌더링된 페이지(HTML)에 대해서만 컨텐츠를 수집하기 때문에
클라이언트 사이드 렌더링을 사용하는 페이지를 빈 페이지로 인식할 수 있습니다.

다행히도 구글 크롤러의 경우 ```<script>``` 태그를 만나면 웹 브라우저같이 실제로 코드를 실행, DOM을 조작합니다.
구글 웹마스터 도구를 사용한다면 URL을 입력해서 구글 크롤러가 방문했을 때의 실제 페이지 모습을 확인할 수 있지요.

끝으로 많이 혼동된 부분이었던... 클라이언트 사이드 렌더링은 무조건 Single Page Application이 아니라
**SPA가 클라이언트 사이드 렌더링을 사용한다**는 것과 기존의 **전통적인 웹 페이지 방식이 서버 사이드 렌더링을 사용한다**는 것!

<div class="post_caption">해당 내용은
<a href="https://medium.com/@adamzerner/client-side-rendering-vs-server-side-rendering-a32d2cf3bfcc"
rel="nofollow" target="_blank"> Adam Zerner - Client-side rendering vs. server-side rendering </a>을 참고하여 작성하였습니다.</div>