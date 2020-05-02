---
layout:   post
title:    "crossdomain.xml 파일은 무엇일까?"
author:   Kimtaeng
tags: 	  crossdomain flash
description: "플래시(SWF) 파일이 외부 도메인의 데이터에 접근하기 위해 필요한 보안 정책 파일인 crossdomain.xml에 대해서 알아보자."
category: Knowledge
date: "2020-05-02 23:14:23"
comments: true
---

# 어도비 플래시(Adobe Flash)
플래시는 2000년대 초반에 플래시 애니메이션이 유행하기 시작하면서 본격적으로 퍼지기 시작했다. 하지만 요즘은 입지가 다르다. 점차 없어지는 추세며 어도비에서도
2020년을 끝으로 **플래시에 대한 지원 종료**를 선언했다. ~~랜섬웨어 감염의 유일한 경로이기 때문에 어도비에서조차 중단...~~ 이에 따라 인터넷 브라우저들은
플래시 플레이어를 기본적으로 비활성화 상태로 두었고 플래시 삭제를 예고하고 있다.

어디서 플래시가 사용되고 있는 곳이 궁금하다면, 크롬 브라우저를 통해 쉽게 확인할 수 있다. 크롬으로 네이버 블로그에 접속해보면 아래와 같이 플래시 차단 문구가
노출된다. 네이버 블로그의 BGM 플레이어가 플래시 기반이다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-05-02-what-is-crossdomain-xml-file-1.jpg"
width="500" alt="allow flash plugin"/>

<br>

요즘 대부분 프로젝트에는 HTML5 플레이어를 사용하고, 오래된 프로젝트라면 이미 관련 설정을 선임자가 다 해두었을 확률이 높기 때문에 정책 파일이란 것 자체를
알기 어렵다. (사실 플래시를 아는 것 자체가 어려운 것 같다) 하지만 공식적으로 페이드아웃 되기 전까지 아직도 플래시 기반 콘텐츠들이 있기 때문에 정책 파일인
`crossdomain.xml`에 대해서 알아보자.

<br>

# 외부 도메인에 관한 정책 파일
swf 파일이 외부 다른 도메인과 통신을 할 때는 `crossdomain.xml`이라는 보안에 관한 정책 파일이 필요하다. 다른 도메인에 있는 SWF가
자기 서버에 있는 데이터를 읽어갈 수 있도록 해주는 것이다. 아래 그림을 통해 확인해보자.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-05-02-what-is-crossdomain-xml-file-2.jpg"
width="500" alt="cross domain workflow"/>

- (1): `a.com`에는 swf 파일이 있다. 사용자는 플래시 기반 컨텐츠를 요청하는 중이다.
- (2): 그런데 플래시에서 `b.com`에 있는 데이터가 필요하다. 따라서 `a.com`의 파일은 `b.com`의 정책 파일로부터 로드 권한을 받는다.
- (3): `b.com` 도메인에 정책 파일이 있기 때문에 (정확히는 `a.com` 도메인을 허용하는 내용도 있는 정책 파일) `b.com`의 데이터를 로드할 수 있게 됐다.
- (4): 이제 `a.com` swf 파일이 `b.com`의 데이터에 접근할 수 있다.

정리해보면 `a.com`에는 swf 파일이 있을 때, 플래시에서 `b.com`에 있는 데이터(예를 들면, 이미지)를 불러올 때는 `b.com`에 정책 파일인
`crossdomain.xml` 파일이 **서버 루트에** 있어야 한다. `b.com/crossdomain.xml`처럼 말이다.

<br>

# 정책 파일은 어떻게 작성할까?
그렇다면 정책 파일은 어떻게 작성할까? 정책 파일은 XML(eXtensible Markup Language) 언어 기반으로 되어 있다.
스펙이 정해져있기 때문에 예제를 통해 어떤 설정값들이 있는지 알아보자.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
    <!-- 모든 도메인에 대해 허용한다. -->
    <allow-access-from domain="*"/>

    <!-- a.com에 도메인에 대한 요청을 허용한다. -->
    <allow-access-from domain="a.com"/>

    <!-- a.com의 하위 도메인에 대해서도 허용한다. 예를 들면 b.a.com -->
    <allow-access-from domain="*.a.com"/>

    <!-- 123.123.123.123 IP에 대해 허용 -->
    <allow-access-from domain="123.123.123.123"/>

    <!-- b.a.com 도메인에 대해 허용한다. -->
    <allow-access-from domain="b.a.com"/>

    <!-- https 프로토콜을 사용하는 a.com를 허용한다. -->
    <allow-access-from domain="a.com" secure="true"/>

    <!-- b.com의 특정 포트만 허용한다. -->
    <allow-access-from domain="a.com" to-ports="8080"/>
</cross-domain-policy>
```

## secure 옵션
정책 파일이 HTTPS 프로토콜을 사용하는 서버에 있다면, HTTPS가 아닌 서버의 SWF 파일이 HTTPS 프로토콜을 사용하는 서버에서 데이터를 로드할 수 있도록
`secure` 옵션은 `false`로 선언해야 한다.

## allow-http-request-headers-from
접근을 허용하는 또 다른 방법이다. `<allow-access-from>` 태그는 다른 도메인에게 사용자 도메인에서 데이터를 가져오는 권한을 부여하지만,
`<allow-http-request-headers-from>`은 다른 도메인에게 사용자 도메인에 헤더 형태로 데이터를 밀어넣는 권한을 부여한다.

아래와 같이 사용하면, 모든 도메인이 현재 도메인에 Hello 라는 헤더를 보낼 수 있다.

```xml
<cross-domain-policy> 
    <allow-http-request-headers-from domain="*" headers="Hello"/> 
</cross-domain-policy>
```

## site-control
어떤 크로스 도메인 정책 파일을 허용할 것인지 정의한다. 정책 파일에 대한 권한이라고 보면 되는데 다른 파일명 또는 형식의 정책 파일 사용을 허용할 것인지
설정하는 것이다. 플래시 버전 10 전부터는 기본값이 `all`이었으나 이후부터는 `master-only`로 변경되어, 기본적으로 마스터 정책 파일만 사용할 수 있게 됐다.

주요 설정 값들은 아래와 같다.

- `none`: 이 마스터 정책 파일을 포함하여 대상 서버의 어느 곳에서도 정책 파일을 사용할 수 없다.
- `master-only`: 이 마스터 정책 파일만 허용된다.
- `by-content-type`: (HTTP/HTTPS만 해당) Content-Type 이 `text/x-cross-domain-policy` 정책과 함께 제공되는 정책 파일만 허용된다.
- `by-ftp-filename`: (FTP만 해당) 파일 이름이 crossdomain.xml인 정책 파일(즉, /crossdomain.xml로 끝나는 URL)만 허용된다.
- `all`: 대상 도메인의 모든 정책 파일이 허용된다.