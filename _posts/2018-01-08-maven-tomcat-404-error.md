---
layout:   post
title:    메이븐 톰캣 404 에러 해결하기(Maven Tomcat 404 Error)
author:   Kimtaeng
tags: 	  framework maven tomcat
description: Maven + Tomcat에서 404 에러가 발생하는 여러가지 원인을 찾아보자. 
category: Knowledge
comments: true
---

# 그만 보고 싶다. 404 Not Found.
톰캣과 같은 (또는 아파치) 서버를 이용하여 웹 프로젝트를 많이 설계하실텐데요.
아직도 공부중이지만, 이것저것 공부하면서 많이 겪었던 것이 톰캣 에러가 아니었나 싶습니다. 특히나 `404 Not Found.` 에러를 참 많이 봤습니다.

404 에러를 발생시키는 이유는 깊게 생각해 본다면 생각한 것보다 정말 많기에 정리한다는 것이 매우 부담스러울 수 있지만
어떻게 보면 404에러는 **'찾을 수 없다'** 라는 간단한 이유이기 때문에! 에러를 해결했던 경험들을 모아보았습니다.

IDE로 Intellij를 주로 사용하지만 이번 포스팅에서는 사용자가 더 많은 **Eclipse를 기준**으로 합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-08-maven-tomcat-404-error-1.png"
width="740" alt="반가워 404"/>

<div class="post_caption">그...그래 반갑다.</div>

<br/><br/>

# 톰캣 설정(server.xml)
가장 기본적으로 톰캣의 설정을 확인해보는 것이 좋습니다. 바로 server.xml 파일을 말이지요.

`Server Runtime Environments를 등록해두고 NEW -> Server` 과정을 통해서 톰캣 서버를 생성했다면 Package Explorer 에서 Servers 폴더를
확인할 수 있습니다. (또는 `Window -> Show View -> Servers`를 통해서도 확인 가능합니다.)

사용할 톰캣의 설정 파일 server.xml 을 확인해보면 아래와 같은 부분이 있습니다. web.xml 또는 Servlet 설정에서 매핑과 일치한 지 확인해봐야 겠지요.

```xml
<!-- web.xml -->
<url-pattern>/</url-pattern>

<!-- server.xml -->
<!-- MadPlay_MadLife는 임의로 지정한 경로입니다. -->
<Context docbase="MadPlay_MadLife" path="/" ... > ... </Context>
```

docBase의 경우도 이클립스에서는 Servers의 View 화면에서 해당 톰캣을 오른 클릭하여 `Add and Remove`를 통해 추가 또는 삭제할 수 있지만
터미널로 직접 실행하는 경우 경로를 잘 체크해야 합니다.

<br/><br/>

# IDE 설정
web.xml을 못 찾는 경우도 있습니다. 다른 Git remote Repository에서 clone을 한 후에 Maven으로 변환하는 경우에서도 겪은 적이 있네요.

Mac OSX El Capitan 환경을 기준으로 `프로젝트 우클릭 -> Properties -> Deployment Assembly` 를 보면
아래와 같은 화면이 나타납니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-08-maven-tomcat-404-error-2.png"
width="700" alt="Eclipse 설정"/>

이 부분이 자신의 프로젝트의 설정과 다를 수 있는데요. 경로를 올바르게 변경하도록 합니다.
Maven의 `pom.xml` 설정이 잘 되있으면 참 좋았을텐데 말이지요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-08-maven-tomcat-404-error-3.png"
width="400" alt="Directory Path 설정"/>

<br/><br/>

# Java의 문제
개발 환경에 설치된 자바의 버전과 톰캣의 버전에서 문제가 있을 수 있습니다.
아래 Java와 Tomcat 버전에 링크를 보시면 버전 가이드를 확인하실 수 있는데요. 혹시 이슈가 없는 지 확인해봅시다.

- <a href="http://tomcat.apache.org/whichversion.html" target="_blank" rel="nofollow">링크: Java와 Tomcat 버전</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-08-maven-tomcat-404-error-4.png"
width="700" alt="Java와 톰캣"/>

위와 같이 버전을 잘 매핑했더라도 프로젝트 버전과 맞지 않는 경우가 있습니다.

`프로젝트 우클릭 -> Build Path -> Configuration Build Path...` 로 들어가서 버전을 직접 확인해보세요.

또, 설치돤 자바 버전의 문제로 인해서 톰캣이 정상적으로 실행되지 않은 경우일 수도 있습니다.
Max OSX El Capitan 환경을 기준으로 터미널에서 아래와 같이 버전을 확인해봅시다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-08-maven-tomcat-404-error-5.png"
width="480" alt="Java Version"/>

<br/>

프로젝트에 맞게 버전을 사용하기 위해서 여러 버전의 자바를 설치한 경우라면 환경 변수를 설정해야 하는데요.
터미널을 열어서 아래와 같이 명령어를 입력하여 환경 변수를 설정하도록 합시다.

```bash

#.bash_profile 열기
sudo vi ~/.bash_profile

# i를 눌러서 편집 모드로 전환 후 아래와 같이 입력한다.
# { } 영역의 값은 설치한 JDK 버전에 따라서 다르다.
export JAVA_HOME=/Library/Java/JavaVirtualMachines/{jdk1.7.0_79.jdk}/Contents/Home

# ESC키로 편집 모드를 종료 -> :wq 명령어로 저장한 후 아래 명령어를 입력한다.
# 변경된 .bash_profile을 반영한다.
source ~/.bash_profile

# 자바 버전을 다시 확인한다.
java -version
```

<br/><br/>

# 번외, 로그를 잘 보자!
지금까지 살펴본 `404 Not Found.` 에러를 직접적으로 발생시키지는 않지만 톰캣이 실행될 때 남겨지는 로그 중 흔하게 '경고'를 표기하는 메시지가 있습니다.

```bash
경고: [SetPropertiesRule]{Server/Service/Engine/Host/Context}
Setting property 'source' to 'org.eclipse.jst.jee.server:{....}'
did not find a matching property.
```

에러가 아닌 이 경고는 톰캣의 버전 6 부터 추가된 `source` 라는 속성때문에 발생하는데요.

해결책으로는 이클립스 IDE의 Servers의 해당 톰캣을 더블 클릭하면 나타나는 Overview 화면에서
Server Options의 `Publish module contexts to separate XML files` 를 체크하면 됩니다.

그래도 이 경고 메시지가 사라지지 않는 경우에는 Servers 뷰에서 해당 톰캣을 오른 클릭한 후 `Remove And Add`를 클릭하여 프로젝트를 제거하고,
그 프로젝트를 오른 클릭하여 `Close Project` 한 후 Servers 뷰의 톰캣을 Clean한 후 다시 프로젝트를 열어서 Clean한 뒤 톰캣에서 다시 프로젝트 Add를...

하라고 하는데 맞는 말입니다. 톰캣과 프로젝트의 설정이 뒤엉키는 경우도 발생하더라고요. 개인적인 경험상 이 설정 이슈로 인해서 404 에러가 직접 발생한 적은
없었던 것 같습니다. 어떤 참조 사이트에서는 이 경고 메시지를 '당연시하게 발생하여 무시해도 된다' 라고 말하기도 하네요.

**_404 Not Found를 발생시키는 설정의 이슈, 또 어떤 경우가 있을까요?_**