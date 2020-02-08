---
layout:   post
title:    "자바 유료화? OpenJDK와 Oracle JDK 차이"
author:   Kimtaeng
tags: 	  java openjdk oraclejdk
description: "오라클의 자바 유료화? OpenJDK와 Oracle JDK의 차이는 무엇일까?"
category: Java
comments: true
---

# Java SE Subscription

2018년 6월 21일, 오라클은 Java SE에 대한 유료 구독 모델인 **Java SE Subscription**을 발표했다.
자바 서브스크립션은 데스크탑, 서버 또는 클라우드 환경에서 사용을 목적으로 하는 자바 라이선스와 기술 지원을
포함하고 있는 월 단위 구독 모델을 말한다.
<a href="https://www.oracle.com/technetwork/java/javaseproducts/overview/index.html" target="_blank" rel="nofollow">
(링크: Oracle Java SE Subscription)</a>

데스크탑 기준 사용자당 월 2.50 달러의 가격을 지불해야 한다. 대신 패키지의 소프트웨어 사용권, 업그레이드, 
기술 지원 등의 혜택을 받을 수 있다.

<br/>

# JDK 유료화?

우선 JDK(Java Development Kit)에 대해서 알아야 한다. 자바 프로그램을 실행하기 위해서는 **JVM(Java Virtual Machine)**이 필요하지만
사전 단계인 바이트 코드로 만들기 위한 컴파일 과정에서는 JDK가 필요하다.

그리고 흔히 자바의 유료화 관련 글에서 자주 등장하는 2가지 종류의 JDK가 있다. 하나는 상업 코드 기반의 Oracle JDK이고
또 다른 하나는 오픈 소스(Open Source) 기반의 OpenJDK다. Oracle JDK의 빌드 프로세스는 OpenJDK 소스 코드를 기반으로 하며
모든 기능은 OpenJDK를 통해서 제공되지만 차이는 있다. 대표적으로 Oracle JDK에만 있는 폰트 라이브러리 등을 말할 수 있는데
버전이 올라갈수록 OpenJDK와 Oracle JDK의 기능 상의 차이는 점차 줄어들고 있다.
<a href="https://stackoverflow.com/questions/22358071/differences-between-oracle-jdk-and-openjdk"
target="_blank" rel="nofollow">링크: Stackoverflow - Differences between Oracle JDK and OpenJDK</a>

<div class="post_caption">Oracle JDK 8 기준으로 jre/lib/fonts 경로를 보면 폰트 파일들이 포함되어 있다.</div> 

한편 OpenJDK의 명세는 차후 버전과 기능에 대한 정의에 대한 표준화 과정인 **자바 커뮤니티 프로세스(Java Community Process, JCP)**에 
의해서 정해진다.
<a href="https://ko.wikipedia.org/wiki/자바_커뮤니티_프로세스" target="_blank" rel="nofollow">
(링크: 위키백과 - 자바 커뮤니티 프로세스)</a>

즉, JCP에 의해 결정된 스펙인 **자바 스펙 요구서(Java Specification Request, JSR)**를 구현한 소스 코드를 OpenJDK라고 하며
이를 기반으로 오라클, 레드햇, Azul 등이 각자의 JVM 벤더를 제작한다. 물론 JVM 명세를 만족하고 있는지
**TCK(Technology Compatibility Kit)**라는 인증을 통해서 검증된 것만 인정된다고 한다.


<br/>

# 그럼 어떻게 해야하나?

이 부분이 제일 궁금했다. 과거에 학교에서, 지금은 집에서 자바를 잘 사용하고 있는데 말이다. 사람들이 무료라고 말하는
OpenJDK로 다시 설치해야 하나 싶었다. 처음 자바를 다운로드할 때 무료라고 쓰여있는 걸 분명히 본 것 같은데 말이다.
<a href="https://www.java.com/ko/download/faq/whatis_java.xml" target="_blank" rel="nofollow">
(링크: Oracle - What is Java?)</a>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-02-24-openjdk-vs-oracle-jdk-1.png" width="650" height="300" alt="whatisjava"/>
<div class="post_caption">무료라면서요...</div>


<br/>

그런데 자바를 시작할 때 만났던 보통의 JDK, 그러니까 Oracle JDK는 원래부터 유료였다고 한다.
개인이 사용할 때는 무료지만 기업에서 사용할 때는 라이선스를 구매해야 했다. 이런 고민을 해본 적이 없었으니 모를만했다.
국내에서 사용하는 몇몇 프로그램에서도 차이를 찾을 수 있었다. 개인이 비상업적인 목적으로 그냥 사용하면 무료지만
기업에서 사용하면 유료인 경우가 많다. 그러니까 자바도 언어 자체는 무료이지만 JDK(Java Development Kit)의 경우는 완전한 무료가 아니었던 것이다.

그렇다고 크게 동요할 필요는 없어보인다. 하지만 패치 버전 제공과 같은 기술 지원이 제한적인 부분은 생각할 필요가 있는 것 같다.
지금 노트북에서 사용하고 있는 Oracle JDK 1.8 버전은 개인 사용자를 대상으로 2020년 12월까지만 패치가 제공된다고 한다. 
<a href="https://www.oracle.com/technetwork/java/java-se-support-roadmap.html" target="_blank" rel="nofollow">
(링크: Oracle - Java Support Roadmap)</a>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-02-24-openjdk-vs-oracle-jdk-2.png" width="650" height="300" alt="whatisjava"/>


비상업적인 목적인 개발 용도로 개인이 사용하는 것은 위반 사항이 아닐 테지만 개인이 자바 개발을 목적이라면 Oracle JDK를
고수할 필요는 없을 것 같다. 그래도 2020년 12월이면 아직 많이 남았지만... OpenJDK를 살펴보니 벌써 11버전까지 있다. 설치해봐야겠다.
(2019년 5월에 다시보니, OpenJDK 13버전의 릴리즈 노트가...) 