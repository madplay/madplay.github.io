---
layout:   post
title:    자바 실행파일 만들기
author:   Kimtaeng
tags: 	  Java JSmooth
description: JSmooth를 이용하여 자바 실행 파일을 만들어보자.
category: Java
comments: true
---

JSmooth를 이용하여 자바 실행파일을 만들어보겠습니다. 다운로드는 아래 링크를 클릭해서 받으면 됩니다.
- <a href="https://sourceforge.net/projects/jsmooth/files/jsmooth/" target="_blank" rel="nofollow">JSmooth 다운로드</a>

그렇다면 이제 모든 준비 과정이 끝났다는 가정하에 JSmooth를 이용하여 자바 exe파일을 만들어봅시다.

<br/>

<div class="post_caption">1) 이클립스에서 프로젝트를 오른 클릭하여 Export를 선택합니다.</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-1.png" width="740" height="420" alt="Step1"/>

<br/>

<div class="post_caption">2) Export 화면에서 Runnable JAR file을 선택하고 Next</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-2.png" width="580" height="540" alt="Step2"/>

<br/>

<div class="post_caption">3) Launch Configuration 에서 실행 환경을 설정합니다.</div>
이클립에서 한 번이라도 실행하셨으면 main이 속한 클래스가 보일겁니다

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-3.png" width="590" height="550" alt="Step3"/>

<br/>

<div class="post_caption">4) JSmooth를 실행합니다.</div>
Skeleton 창에서 알맞은 타입을 설정하시면 됩니다. UI를 구성한 경우에는 Windowed Wrapper를 선택하면 됩니다.
저는 Swing을 사용한 프로그램을 실행 파일로 만들 예정이기 때문에 Windowed Wrapper를 선택했습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-4.png" width="500" height="400" alt="Step4"/>

<br/>

<div class="post_caption">4-1) Windowed Wrapper를 선택한 경우</div>
하단의 Launch java app in the exe process를 체크합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-5.png" width="740" height="560" alt="Step4-1"/>

<br/>

<div class="post_caption">5) Executable로 이동합니다.</div>
Executable Binary는 만들어진 실행 파일의 이름(.exe를 붙이세요)을 뜻하고
Executable Icon은 실행 파일의 아이콘입니다. 사용하고 싶은 이미지를 선택하면 됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-6.png" width="730" height="560" alt="Step5"/>

<br/>

<div class="post_caption">6) Application으로 이동합니다.</div>
먼저 Embedded jar settings 박스에서 Use an embedded jar에 체크하시고 이전 단계에서 만든 jar 파일을 선택합니다.
그 다음으로 Application Settings에서 설정 버튼을 클릭한 후 main이 속한 클래스로 지정합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-7.png" width="730" height="560" alt="Step6"/>

<br/>

<div class="post_caption">7) JVM 버전을 선택합니다.</div>
최소 버전(Minimun)만 지정해도 무방합니다. 그 다음 상단의 톱니바퀴 모양을 클릭하면!

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-8.png" width="730" height="560" alt="Step7"/>

<br/>

<div class="post_caption">8) 톱니바퀴 모양의 버튼을 클릭하면 다음과 같은 화면이 나옵니다.</div>
실행 파일의 이름을 적어줍니다. (.exe를 반드시 붙이세요)

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-9.png" width="730" height="560" alt="Step8"/>

여기까지 이상이 없었으면 exe 파일이 만들어집니다.
가끔 JSmooth가 실행되지 않거나 오류가 나는 부분이 있습니다만 대부분의 원인은
JDK가 설치되어있지 않거나 Java Path가 올바르지 않게 설정되는 경우에 발생합니다.
