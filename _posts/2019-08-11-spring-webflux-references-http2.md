---
layout:   post
title:    "[Web on Reactive Stack] 1. 스프링 웹플럭스: 1.12. HTTP/2"
author:   Kimtaeng
tags: 	  spring reactive webflux
description: "한글로 번역한 Web on Reactive Stack, 1. Spring Webflux: 1.12. HTTP/2"
category: Spring
date: "2019-08-11 21:35:09"
comments: true
---

# 1.12. HTTP/2
HTTP/2는 Reactor Netty, Tomcat, Jetty 및 Undertow에서 지원된다. 하지만 서버 설정과 관련하여 고려해야 할 내용들이 있다.
자세한 내용은 <a href="https://github.com/spring-projects/spring-framework/wiki/HTTP-2-support" target="_blank"
rel="nofollow">HTTP/2 위키 페이지</a>를 참조하라.

<div class="post_comments">[역주] 레퍼런스 원문에는 HTTP/2 위키 페이지 링크만 게시되어 있어, 위키 페이지의 일부 내용을 번역하여
첨부합니다.</div>

<br><br>

# HTTP 2 지원(HTTP 2 support)
## TLS 고려사항
HTTP/2 스펙과 브라우저 구현은 기존의 HTTP/1.1 애플리케이션 보안사항과 비교하여 새로운 보안관련 제약사항이 있다.

- HTTP/2 프로토콜로 업그레이드 하려면 TLS 1.2, SNI와 ALPN이 모두 필요하다.
- 보안된 서버 인증서 - 일반적으로 강력한 서명 알고리즘과 2048+ 비트 키
- <a href="https://http2.github.io/http2-spec/#rfc.section.9.2" target="_blank" rel="nofollow">HTTP/2 스펙에 나열된 모든 TLS 요구사항</a>

TLS 1.2는 JDK8 에서 기본 제공되지 않지만, JDK9에는 포함되어 있다. 또한, 대체 TLS 구현(네이티브 바인딩 포함)은 JDK 스택에 비해
성능 향상을 제공할 수 있어 널리 사용된다. 다음은 컨테이너가 다양한 배포 옵션을 제공하고 각각의 장단점이 있는 이유를 설명한다.

<br>

## 컨테이너 설정
### 아파치 톰캣(Apache Tomcat)
8.5 버전부터 톰캣은 JDK8(톰캣 네이티브를 사용)과 JDK9(네이티브 JSSE 사용) 모두에서 HTTP/2를 지원한다.
서블릿 4.0 버전은 톰캣 9 버전부터 지원된다. 

네이티브 바인딩(Tomcat Native와 OpenSSL)을 사용하려면, <a href="https://tomcat.apache.org/tomcat-8.5-doc/apr.html#Installation" target="_blank" rel="nofollow">톰캣의 설치 지침</a>
을 따르거나 패키지 관리자를 사용하여 라이브러리를 설치해야 한다.
톰캣 서버 버전과 호환되는 올바른 톰캣 네이티브와 OpenSSL 버전을 사용해야 한다.

그 다음에 <a href="https://tomcat.apache.org/tomcat-8.5-doc/ssl-howto.html" target="_blank" rel="nofollow">
톰캣 커넥터(Tomcat Connector)를 적절하게</a>(대부분 Http11NioProtocol과 JSSEImplementation을 사용해야 한다) 구성하고
<a href="https://tomcat.apache.org/tomcat-8.5-doc/config/http2.html" target="_blank" rel="nofollow">업그레이드
프로토콜로 HTTP/2를 설정</a>해야 한다.

<br>

### 이클립스 제티(Eclipse Jetty)
제티는 여러 가지 배포 모드를 제공하며, TLS 1.2와 ALPN을 지원하는 다양한 방법을 제공한다.

- boot classpath jar를 사용하여 JDK8의 ALPN 구현을 패치: <a href="https://github.com/jetty-project/jetty-alpn-agent" target="_blank" rel="nofollow">Jetty ALPN 에이전트</a>와 <a href="https://www.eclipse.org/jetty/documentation/current/alpn-chapter.html" target="_blank" rel="nofollow">ALPN 참조 문서</a> 참고
- <a href="https://www.conscrypt.org" target="_blank" rel="nofollow">Conscrypt</a>와 함께 네이티브 바인딩을 사용하여 - 자세한 내용은 <a href="https://webtide.com/conscrypting-native-ssl-for-jetty/" taregt="_blank" rel="nofollow">공식 블로그 게시물</a> 참조

제티를 독립형 모드로 실행하는 경우, <a href="https://www.eclipse.org/jetty/documentation/current/http2.html" target="_blank" rel="nofollow">참조할 문서는 상당히 명확</a>하다.

제티를 내장 서버로 사용하는 경우, <a herf="https://github.com/eclipse/jetty.project/tree/jetty-9.4.x/examples/embedded/src/main/java/org/eclipse/jetty/embedded" target="_blank" rel="nofollow">제티 코드 저장소의 samples 폴더</a>에는 HTTP2서버 예제가 있다.

<br>

### 언더토우(Undertow)
언더토우 1.3에서는 개발자가 <a href="https://github.com/jetty-project/jetty-alpn-agent" target="_blank" rel="nofollow">제티의 ALPN 에이전트</a>를
사용하여 ALPN 지원을 받아 서버를 실행해야 했다. 언더토우 1.4부터, 단일 옵션으로 HTTP/2 지원을 활성화할 수 있다.
(<a href="https://undertow.io/undertow-docs/undertow-docs-1.4.0/index.html#http2-listener" target="blank" rel="nofollow">관련 문서</a> 참조)

<br>

### 리액터 네티(Reactor Netty)
스프링 프레임워크 5.1 (리액터 네티 0.8) 부터는 HTTP/2를 지원한다. JDK9+ 부터는 특정 인프라 변경없이 프로토콜을 지원한다.

JDK 8 환경 또는 최적화된 런타임 성능을 위해서, 제티는 네이티브 라이브러리와 함께 HTTP/2를 지원한다. 이를 가능하게 하려면 애플리케이션에
추가적인 의존성 설정을 해야 한다.

스프링 부트는 모든 플랫폼을 위한 네이티브 라이브러리를 포함하는 `io.netty:netty-tcnative-boringssl-static` "uber jar" 버전을
관리한다. 개발자는 식별자를 사용하여 필요한 의존성만 가져오도록 선택할 수 있다.
(<a href="https://netty.io/wiki/forked-tomcat-native.html" target="_blank" rel="nofollow">네티 공식 문서</a> 참조)

---

> ### 목차 가이드
> - <a href="/post/web-on-reactive-stack-webclient">다음장 "2. WebClient" 로 이동</a>
> - <a href="/post/web-on-reactive-stack">전체 목차 페이지로 이동</a>