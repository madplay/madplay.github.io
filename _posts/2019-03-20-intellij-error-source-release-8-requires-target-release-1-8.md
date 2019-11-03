---
layout:   post
title:    "인텔리제이 source release 8 requires target release 1.8 오류 해결하기"
author:   Kimtaeng
tags: 	  intellij error jdk maven
description: "Intellij를 사용할 때 발생하는 Error:java: javacTask: source release 8 requires target release 1.8 오류 해결하기"
category: Knowledge
comments: true
---

# 이것은 무슨 오류인가?
Intellij IDE를 사용하여 코드를 작성하고 실행하려는 순간, 아래와 같은 에러 메시지를 만났다.

<div class="post_caption">Error:java: javacTask: source release 8 requires target release 1.8</div>

내용을 읽어보면 소스 코드에 맞는 자바 버전이 필요하다는 뜻임이 명확해 보인다. 무엇인가 버전이 안 맞는 모양이다.
다행히도 해결 방법은 간단하다.

<br/>

# 문제 해결하기
**인텔리제이의 설정을 변경**해주면 된다. Mac OS 버전을 기준으로 아래와 같이 설정 경로로
들어가서 모듈이 사용하는 Target bytecode의 버전을 변경해주면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-1.png" width="700" height="600" alt="intellij settings"/>

<br/>

**Maven을 사용하는 경우**에는 인텔리제이의 설정을 변경할 필요없이 **pom.xml**에 몇가지 내용을 추가해주면 해결된다.

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

<br/>

# 마치며
추가적으로 인텔리제이는 **프로젝트의 SDK와 Language Level을 설정**할 수 있다. 그러니까 프로젝트에 속한 모듈에는 프로젝트의 설정을
기본값으로 적용할 수 있다. 물론 **개별 모듈에 대해서도 SDK와 Language Level을 설정**할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-2.png" width="800" height="400" alt="intellij project settings"/>
<div class="post_caption">프로젝트(왼쪽)와 개별 모듈(오른쪽)의 SDK, Language Level 설정</div>

즉, 문제 해결을 위해 수정한 것처럼 컴파일 레벨을 자바8로 설정하였음에도 불구하고 정상적으로 컴파일 되지 않는 경우가 있다.
위의 스냅샷의 Language Level이 자바8 보다 낮게 되어있다면(그러니까 컴파일 레벨보다 낮다면) 오류 메시지를 만날 수도 있을 것이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-20-intellij-error-source-release-8-requires-target-release-1-8-3.png" width="600" height="400" alt="not supported source version"/>

<div class="post_caption">java: try-with-resources is not supported in -source 1.5
(use -source 7 or higher to enable try-with-resources)</div>