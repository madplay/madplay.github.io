---
layout:   post
title:    "RSS란 무엇일까? RSS 2.0 스펙과 포맷"
author:   Kimtaeng
tags: 	  rss
description: "RSS(Rich Site Summary, Really Simple Syndication)란 무엇일까? RSS 2.0 의 스펙과 포맷에 대해서 알아보자."
category: Knowledge
date: "2020-03-05 00:03:21"
comments: true
---

# RSS란?
RSS는 Rich Site Summary의 약자(또는 Really Simple Syndication 라고도 한다.)로서 기사, 블로그의 포스팅과 같은 컨텐츠를 보다 쉽게 배포하기 위한
규약이다. XML(eXtensible Markup Language) 형태로 만들어져 있으며 모든 RSS 파일은 반드시 W3C(World Wide Web Consortium)에서 정의한
XML 1.0 사양을 준수해야 한다.

여러 표준이 존재하는데, 아래와 같이 나눌 수 있다.
- RDF (RSS 1.*)
  - RSS 0.90, RSS 1.0, RSS 1.1
- RSS 2.0
  - RSS 0.91, RSS 0.92, RSS 2.01

현재 RSS 2.0은 공식적으로 완료된 것으로 선언됐고, 저작권은 하버드 대학교에서 소유하고 있다.

<br>

# RSS 장점과 쇠퇴
그렇다면 RSS는 어떤 점이 좋을까? **자동 수집의 편리함**에 있다. 원하는 글이나 정보를 얻기 위해서 해당 웹 사이트에 접속해야 했지만 RSS 관련 서비스를 이용하면,
직접 사이트를 방문하지 않아도 최신 정보를 골라 받아볼 수 있다. 우리가 여러 언론사의 기사를 네이버 뉴스를 한 곳에서 볼 수 있다는 점으로 보면 된다.
편리하지 않은가? 모든 언론사의 사이트에 접속하지 않아도 된다. 

이러한 역할을 하는 것을 애그리게이터(aggregator)라고 한다. 웹사이트 소유자가 헤드라인을 직접 모아놓은 웹사이트를 가리키는데 RSS 리더(RSS reader),
피드 리더(feed reader), 뉴스 리더(news reader), RSS 수집기 등으로 부른다.


현재는 언론사의 웹사이트뿐만 아니라 국내외 거의 모든 블로그에서 RSS를 지원하고 있다. ~~물론, 이 블로그도 RSS를 지원하고 있다~~ 하지만, 상대적으로
쇠퇴하고 있는 편이다. 이처럼 블로그와 같은 서비스를 통해 사용해야 하는 점이나, 유료화를 위해 RSS 제한한다거나 광고를 넣기도 어려운 편이다.
같은 맥락에서 구글은 RSS 피드를 위해 제공하던 구글 리더(Google Reader)서비스도 이미 수년 전에 종료시켰다.

<br>

# RSS의 구조
RSS 문서의 최상위 레벨 요소(element)인 `<rss>` 에는 해당 문서가 지원하고 있는 RSS 버전(version) 속성을 명시해야 한다.
그리고 `<rss>` 요소는 하나의 `<channel>` 엘리먼트를 갖는다. 

## &lt;channel>의 필수 요소
다음은 `<channel>` 엘리먼트에 포함되는 **필수 요소**들이다.

| 요소 | 설명 | 예시 |
|-------|--------|--------|
| `<title>` | 채널의 제목 정의다. 웹 사이트를 RSS 피드로 나타난 경우, 웹사이트의 `<title>` 태그와 같아야 한다. | Hello World!
| `<description>` | 채널에 대한 설명을 나타낸다. | Welcome to Hello World!
| `<link>` | 채널에 대한 하이퍼링크(URL 주소) 정의 | http://hello-world.com



## &lt;channel>의 선택 요소
다음은 `<channel>` 엘리먼트에 포함되는 **선택 요소**들이다.

| 요소 | 설명 | 예시 |
|-------|--------|--------|
| `<category>` | 피드에 대한 하나 이상의 카테고리를 정의한다. | News
| `<cloud>` | 피드 업데이트의 즉시 알림을 등록한다. 업데이트 정보를 받을 수 있는 클라우드에 대한 정보를 입력한다. | - 
| `<copyright>` | 저작권으로 보호되는 자료에 대한 알림 | Copyright 2020, madplay
| `<docs>` | 피드에 사용된 형식에 대한 문서를 가리키는 URL | http://blogs.law.harvard.edu/tech/rss
| `<generator>` | 피드를 생성하기 위해 사용한 프로그램 | Jekyll v3.8.7
| `<image>` | aggregators가 피드를 표현할 때 이미지를 표시할 수 있도록 한다. JPEG, PNG 형식 등 | -
| `<language>` | 피드를 작성한 언어 | ko
| `<lastBuildDate>` | 피드 컨텐츠의 최종 수정 일자 | Tue, 19 Mar 2019 11:39:01 GMT
| `<managingEditor>` | 피드 컨텐츠 작성자의 이메일 주소 정의 | abc@abc.com
| `<pubDate>` | 피드 컨텐츠의 최종 발행 일자를 정의. RSS의 시간 형식은 RFC 822의 명세를 따른다. | Tue, 19 Mar 2019 11:39:01 GMT
| `<rating>` | 채널의 PICS(Platform for Internet Content Selection) 점수 | -
| `<skipHours>` | aggregator가 피드 업데이트를 건너뛸 날짜를 지정한다. | -
| `<textInput>` | 피드와 함께 표현될 수 있는 텍스트 입력 필드에 대한 정보 | -
| `<ttl>` | 소스를 갱신하기 전에 피드를 캐시할 수 있는 시간을 지정한다. 분 단위로 입력한다. | 30
| `<webMaster>` | 피드 웹마스터(관리자)의 이메일 주소 | -

### &lt;image> 의 하위 요소
`<image>`는 아래와 같은 필수/선택 요소로 이루어진다.

| 요소 | 필수 여부 | 설명 |
|-------|--------|--------|
| `<url>` | 이미지 파일의 위치를 나타내는 URL | 필수
| `<title>` | 이미지의 제목 또는 설명 | 필수
| `<link>` | 이미지 클릭시 이동할 URL | 필수
| `<width>` | 이미지의 너비 픽셀값. 88(기본) ~ 144 | 선택
| `<height>` | 이미지의 높이 픽셀값. 31(기본) ~ 400 | 선택


## &lt;item>의 필수 요소
`<channel>`은 여러 개의 `<item>` 요소를 가질 수 있다. 다음은 `<item>` 요소에 포함되는 **필수 요소**들이다.

| 요소 | 설명 | 예시 |
|-------|--------|--------|
| `<title>` | 아이템의 제목이다. 웹 사이트를 RSS 피드로 나타난 경우, 웹사이트의 `<title>` 태그와 같아야 한다. | RSS 2.0이란 무엇인가?
| `<description>` | 아이템에 대한 설명을 나타낸다. | RSS 2.0 스펙에 대해 알아보자.
| `<link>` | 아이템에 대한 하이퍼링크(URL 주소) 정의 | -


## &lt;item>의 선택 요소
다음은 `<item>` 요소에 포함되는 **선택 요소**들이다.

| 요소 | 설명 | 예시 |
|-------|--------|--------|
| `<author>` | 아이템 작성자의 이메일 주소 | -
| `<category>` | 아이템이 속한 하나 또는 그 이상의 카테고리 | -
| `<comments>` | 아이템에 관한 댓글의 주소 | -
| `<enclosure>` | 아이템에 포함된 미디어 파일 | -
| `<guid>` | 아이템을 식별할 수 있는 고유 문자열 | -
| `<pubDate>` | 아이템의 마지막 발행일자 | enclosure
| `<source>` | 아이템의 3자 소스. 아이템이 속한 RSS채널 | -

선택 요소 중에서 몇 가지만 짚고 넘어가보자.

### &lt;guid>
`<guid>`는 아이템을 구분할 수 있는 유일한 문자열이어야 한다.
수집기는 RSS 피드에서 이 값을 보고 아이템을 구분하기 때문이다. 정해진 규격은 없으나 단순한 문자열로 표시해야 한다.

현재 블로그의 RSS 피드를 살펴보면 `<guid>` 부분에 아래와 같이 `isPermaLink` 라는 속성을 볼 수 있는데,
이 값은 해당 아이템(여기서는 포스팅)에 바로 접근할 수 있는 URL로 RSS 리더(reader)에게 간주된다.

```xml
<guid isPermalLink="true">
    ...
</guid>
```

기본값은 `true`이며, `false`인 경우 이 값을 해당 아이템이 아닌 다른 어떤 URL으로 판별할 수 있다.

한편 대부분 `<link>` 요소와 같은 값을 가리키는 경우가 많다. (지금 이 블로그도 그렇다)
<a href="https://cyber.harvard.edu/rss/rss.html" target="_blank" rel="nofollow">RSS 2.0 at Harvard Law (링크)</a>를
인용해보면, "모든 경우에 guid를 제공하고 가능하다면 permalink(영구적인 링크, 바로가기)로 만드는 것을 권장한다. 이렇게 하면 내용을 변경하더라도
수집기가 해당 아이템을 반복 수집하지 않을 수 있다." 라고 언급한다.

### &lt;pubDate>
`<pubDate>`는 아이템이 발행된 날짜를 의미한다. 중요한 점은 미래의 날짜를 지정하게 되면 RSS 수집기는
그 날짜가 될 때까지 아이템을 표시하지 않을 수 있다.

<br>

# 포맷 예시
앞서 살펴본 RSS 스펙을 기반으로 전체 포맷 예시를 보면 아래와 같다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hello World!</title>
    <description>Welcome to Hello World</description>
    <link>http://hello-world.com</link>
    <pubDate>Thu, 23 Jan 2020 23:41:38 +0900</pubDate>
    <lastBuildDate>Thu, 23 Jan 2020 23:41:38 +0900</lastBuildDate>
    <image>
      <title>hello world</title>
      <url>https://hello-world.com/image/image.png</url>
      <link>https://hello-world.com</link>
    </image>
    <docs>http://blogs.law.harvard.edu/tech/rss</docs>
    <generator>Jekyll v3.8.7</generator>
    <managingEdito>abc@abc.com</managingEditor>
    <webMaster>abc@abc.com</webMaster>
    <item>
      <title>Hello, World!</title>
      <link>https://hello-world.com/someExample</link>
      <description>How to build my 'hello world' program?</description>
      <pubDate>Thu, 23 Jan 2020 23:41:38 +0900</pubDate>
      <guid>https://hello-world.com/someExample</guid>
      <category>Computer Science</category>
    </item>
  </channel>
</rss>
```

