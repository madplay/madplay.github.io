---
layout:   post
title:    "Jekyll 블로그에 utterances로 댓글 기능 추가하기"
author:   Kimtaeng
tags: 	  jekyll comment utterances
description: "지킬 블로그에 댓글 기능을 추가해보자. 댓글을 github 이슈 기반으로 연동하는 utterances를 적용하기"
category: Knowledge
date: "2020-01-27 13:41:10"
comments: true
---

# Disqus가 무겁다

기존에는 블로그에 ```Disqus```를 이용하여 댓글 시스템을 적용했었다. 그런데 어느새부턴가 페이지 로드 속도에 너무 큰 영향을 주는 것이 보였다.
로드에 10초 이상이 걸린다거나 스크롤을 댓글 영역까지 내렸음에도 모든 스크립트가 로드되지 않는 경우도 있었다. 그래서 다른 댓글 시스템을 찾아보았다.

구글링을 하다보니 ```utterances```를 발견했다. 댓글을 github의 이슈 시스템 기반으로 이용하는 것인데 이부분이 마음에 들었다.
블로그를 github로 운영하는데, 댓글까지 같은 곳에서 관리한다면 한 요소만 관리하면 되기 때문에 편할 것 같다.

우선 블로그에 적용하고 사용해보기로 했다.

<br/>

# utterances 적용

```utterances```는 댓글을 남길 때 github 저장소의 이슈에 댓글이 남겨진다. 그렇기 때문에 연동할 저장소가 필요하다.
우선 아래 링크를 통해 ```utterances```를 설치해야 한다. **Install** 버튼을 눌러서 연동할 저장소를 선택하자.

- <a href="https://github.com/apps/utterances" target="_blank" rel="nofollow">https://github.com/apps/utterances</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-1.png"
width="550" height="450" alt="install utterances"/>

<br/>

아래처럼 본인이 권한 부여를 결정할 수 있다. 모든 저장소에 ```utterances```의 접근 권한을 줄 수 있고, 특정 저장소에만 줄 수 있다.
대부분 사용자들이 ```사용자명/blog-comment``` 이런식으로 별도의 저장소를 이용하는 것을 확인했는데, 필자는 그냥 블로그와 동일한 저장소를 선택했다.
한 곳에서 모든 것을 관리하고 싶기 때문이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-2.png"
width="300" height="450" alt="selet authorization types"/>

<br/>

이제 ```utterances```를 설정할 차례다. **Repository** 항목에 동일하게 저장소 이름을 넣어준다. 중요한 것은 public 저장소여야 한다.
```사용자명/저장소이름``` 형태로 입력하면 된다. 앞서 언급한 것처럼 필자는 블로그 저장소를 입력했다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-3.png"
width="500" height="400" alt="choose the repository"/>

<br/>

다음으로 블로그 글과 이슈를 매핑할 방법을 선택한다. 우선 "제목" 기준으로 매핑하도록 했다. 혹시나 필자처럼 _"다른 설정들은 어떻게 매핑되는 걸까~?"_ 하고
궁금해하는 분들을 위해 이 포스팅 끝 부분에서 직접 테스트한 결과를 서술했다. 우선 각 설정에 대한 설명이다.

- 페이지의 pathname(도메인을 제외한 URL) 기반으로 이슈와 매핑한다.
- 페이지의 URL을 기반으로 이슈를 매핑한다.
- 페이지의 제목을 기반으로 이슈를 매핑한다.
- OG태그의 제목 정보를 기반으로 이슈를 생성한다.
- 이슈 번호를 기반으로 매핑한다. 직접 입력해야 한다.
- 특정 단어를 기반으로 매핑한다. 직접 입력해야 한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-4.png"
width="500" height="400" alt="choose the mapping"/>

그리고 기타 설정을 할 수 있다. 댓글을 남겨서 이슈가 생성될 때 레이블이 자동으로 달리도록 설정할 수 있다.
예를 들어 레이블로 comment 등을 사용하면 다른 이슈들과 혼동되지 않을 것 같다. 추가적으로 색상 테마를 수정할 수 있다.

마지막으로 블로그에 적용하기 위한 스크립트 코드를 확인할 수 있다. ```Copy``` 버튼을 클릭해서 복사한 후에 블로그에 포함시키면 된다.
포스트 레이아웃에 ```include``` 하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-5.png"
width="500" height="400" alt="enable utterances"/>

<br/>

# 적용 결과

아래는 매핑 설정을 바꿔가면서 진행한 결과다. 초기에 설정할 때는 레이블을 달지 않게 해두었는데 달아두는게 다른 이슈와 헷갈리지 않고 좋은 것 같다.
그리고 매핑 기준을 처음에는 제목 기준으로 했었는데, 블로그 제목(MadPlay's MadLife)가 연달아 붙는게 마음에 들진 않았다. 
나중에는 결국 OG 태그의 제목 정보 기준으로 바꿨다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-6.png"
width="600" height="400" alt="utterances result"/>

테스트해보면서 _"이슈를 닫으면 어떻게 될까~?"_ 하는 궁금함이 생겨서 직접 해보았는데, 이슈를 닫아도 댓글은 달 수 있다. 그런데 닫힌 이슈에 대해서
블로그에서 댓글을 달더라도 이슈가 다시 오픈되지 않았다. 

그리고 각 매핑 기준에 맞추어서 이슈 제목을 바꿔주면 특정 글에 대한 댓글 정보를 초기화할 수 있다.
그렇기 때문에 어떻게 보면 가장 유니크한 이름으로 이슈 정보를 생성해야할 것 같다. URL 기반으로 이슈 매핑을 해야하나...
