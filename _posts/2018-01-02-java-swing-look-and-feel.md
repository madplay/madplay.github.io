---
layout:   post
title:    Java Swing 라이브러리 꾸미기(LookAndFeel 라이브러리)
author:   Kimtaeng
tags: 	  java swing lookandfeel
description: LookAndFeel을 이용하여 Swing 라이브러리를 꾸며보자.
category: Java
comments: true
---

# Java에서 Swing 이란?
스윙(Swing)은 자바 언어에서 GUI의 구현하기 위해 제공되는 라이브러리입니다.
자바에서 추구하는 WORE(Wirte Once, Run Everywhere)을 구현하기 위해 `JDK 1.2` 버전부터 사용되었습니다.

시스템 환경에 영향없이 어느 환경에서나 동일한 화면으로 표현될 수 있도록 시스템에 대한 의존도를 줄이고
컴포넌트들을 자바에서 직접 그려 구현하였습니다. 다만, 이러한 동일하게 구현된 부분으로 인해 해당 시스템의
고유한 모습을 보여줄 수 없게된 단점도 있습니다.

<br/><br/>

# LookAndFeel 이란?
환경에 상관없이 동일하게 구현된 모습으로 인하여 시스템의 고유한 모습을 잃은 단점을 보완하기 위해 등장했습니다.
LookAndFeel을 이용하면 프로그램 전체의 UI 모습을 변경할 수 있습니다.

자바에서 제공하는 Swing 라이브러리를 이용해 간단한 컴포넌트(Button, Label)를 올려놓은 모습을 살펴봅시다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-1.jpeg"
width="280" alt="Swing 기본"/>

<br/>

<div class="post_caption">"위 화면에서 LookAndFeel을 이용해 UI를 조금 변경해보겠습니다."</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-2.jpeg" 
width="280" alt="LookAndFeel 적용"/>

<br/>

컴포넌트가 작아서 느낌이 잘 안오는 것 같기도 합니다. 예전에 네이버 블로그를 운영했을 때 개발했던 블로그 포스트 순위 검색 프로그램에 적용해봅시다.

우선, 자바의 Swing 기본 스타일입니다. 디자인이 아닌 기능에만 충실한다면 Swing도 나름 쓸만합니다..!?!?

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-3.jpeg"
width="700" alt="MadSearch 기본"/>

<br/>

<div class="post_caption">"Nimbus 스타일"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-4.jpeg"
width="700" alt="MadSearch Nimbus"/>

<br/>

<div class="post_caption">"Liquid 스타일"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-5.jpeg"
width="700" alt="MadSearch Liquid"/>

<br/>

<div class="post_caption">"Windows 스타일"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-02-java-swing-look-and-feel-6.jpeg"
width="700" alt="MadSearch Windows"/>

<br/>

룩앤필을 적용하여 UI 디자인만 조금 바뀌었을 뿐인데 프로그램의 전체적인 느낌이 생각보다 많이 달라진 것 같습니다.

<br/>

# LookAndFeel 사용법

사용법은 정말 간단합니다. `UIManager.setLookAndFeel("클래스이름 또는 경로")` 간단하죠?
하지만 예외처리가 필요합니다. 경로를 찾지 못해 ClassNotFoundException이 발생할 수 있거든요.

```java
try {
    UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
} catch (Exception e) {
    /*
        ClassNotFoundException
        InstantiationException
        IllegalAccessException
        UnsupportedLookAndFeelException
     */
}
```

예전에는 포털 검색을 통해서 더 많은 룩앤필 테마들을 찾아 변경할 수 있었는데, 링크들이 대부분 사라졌네요.
그래도 아직 자바 공식 가이드 문서에서 몇 가지 테마를 확인할 수 있습니다.

- <a href="https://docs.oracle.com/javase/tutorial/uiswing/lookandfeel/index.html" rel="nofollow" target="_blank">
링크: Java Documentation</a> 
