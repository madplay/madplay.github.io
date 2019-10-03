---
layout:   post
title:    Intellij에서 Spring Boot 프로젝트 설정하기
author:   Kimtaeng
tags: 	  springboot intellij 
description: Intellij IDE를 이용해서 스프링부트(SpringBoot) 프로젝트를 생성해보자 
category: Spring
comments: true
---

# 스프링 프레임워크를 조금 더 빠르게! 스프링 부트(Spring Boot)
`스프링 프레임워크`는 J2EE로 알려진 자바 엔터프라이즈 환경을 경량화하기 위해 등장했는데요.
POJO(Plain Old Java Object) 기반으로 개발을 하더라도 **가볍게** 개발을 할 수 있도록 지원해주는 프레임워크입니다.
비록 코드의 작성은 가벼워졌지만 스프링 프레임워 기반의 웹 프로젝트를 구성하게 되면 최초의 설정에 필요한 시간이 많이 필요했습니다.
그러니까 애플리케이션 로직의 코드를 작성하는 것이 아닌 프로젝트 구성 설정에 시간을 더 쓰는 것이지요.

스프링부트는 기존의 스프링 프레임워크 기반의 웹 애플리케이션 프로젝트를 구성하는데 필요한 **시간을 많이 단축**시킨다고 합니다.
사실 개인적으로 스프링을 제대로(?)사용해보지 않아서 그 장점을 몸으로 느끼기엔 이른 점이 있지만 최근에는 개인적으로 토이 프로젝트를 진행할 때
이전과 다른 상대적인 장점들이 보이는 것 같습니다.

`스프링부트`는 이러한 스프링의 복잡한 설정을 최소화하고 빠르게 프로젝트 개발을 시작하게 해줍니다.
`Intellij`에서는 공식적으로 SpringBoot를 지원하고 있으며 이번 포스트에서는 프로젝트를 생성하고
간단하게 개발의 시작인 `Hello World`부터 찍어보겠습니다.

<br/>

# 프로젝트 생성
Mac OS 기준으로 진행되었습니다.

먼저 `Intellij`를 실행하여 순차적으로 File > New > Project를 클릭하여 프로젝트 템플릿을 엽니다.(Create New Project)

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-1.png"
width="700" alt="create new project"/>

왼쪽 선택 리스트에서 `Spring Initializr`를 선택하고 JDK 버전을 선택하면 됩니다.

혹시나 그럴 경우는 없을 것 같습니다만 위와 같이 선택 리스트 화면이 보이지 않는다면, 아래의 SpringBoot Plugin이 설치되어 있는지 확인해보세요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-2.png"
width="700" alt="springboot plugin"/>

**Spring Initializr**를 선택하고 Next 버튼을 누르면 아래와 같은 화면을 볼 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-3.png"
width="700" alt="set project"/>

- Group : 프로젝트 저장소와 관련된 Artifact 그룹을 말합니다. 통상적으로 도메인 주
- Artifact : 프로젝트의 Artifact
- Type : 프로젝트의 타입(Maven 또는 Gradle)
- Language : 프로젝트의 언어
- Package : 프로젝트의 빌드 이후 패키징될 타입(jar 또는 war)
  - jar : 스프링부트에 내장된 톰캣을 이용하고 별도 톰캣 설정을 하지 않아도 됩니다.
  - war : 외부 톰캣에 배포하여 구동하는 형태
- Version : 프로젝트의 버전
- Name : 프로젝트의 이름
- Description : 프로젝트의 설명
- Package : 프로젝트의 패키지 이름

빈칸에 입력한 이후에 Next 버튼을 누르면 SpringBoot 프로젝트를 생성할 때 추가할 라이브러리들을 설정하는 화면이 나옵니다.
우선 간단하게 Web 부분에만 체크를 해줍니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-4.png"
width="700" alt="set project"/>
이후 Next 버튼을 누르면 프로젝트의 이름과 경로를 체크하는 화면이 나오는데, 확인 후 Finish 버튼을 누르면 프로젝트 생성이 완료됩니다.

프로젝트 생성이 완료되자마자 `Intellij의 Run Configuration`에는 방금 생성한 스프링부트 애플리케이션이 자동으로 보일텐데요.
우선은 그냥 Run 해봅시다. 톰캣이 내장되어 있으므로 별다른 설정을 하지 않아도 우선 구동됩니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-5.png"
width="700" alt="run springboot project"/>

콘솔 로그에 찍히는 내용중 아래와 같은 부분을 볼 수 있습니다.<br/>
```bash
... Tomcat started on port(s): 8080 (http) with context path ''
```

톰캣이 8080 포트로 구동되었습니다. 그렇다면 우리는 `http://localhost:8080`으로 접속해볼 수 있겠지요.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-6.png"
width="700" alt="connect to localhost"/>

그런데 접속하자마자 에러 페이지와 만날 수 있습니다. 우린 아무것도 작성하지 않았으니까요.
기본 URL로 접속했을 때 화면이 보일 수 있도록 `index.html`을 생성하도록 합시다.
경로는 `src/main/resources/static`로 하시면 됩니다. static 디렉터리는 정적 요소들을 관리할 때 사용합니다.
기본적으로 잡히게 됩니다. 파일명을 다른 이름으로 바꾸고 기본 URL로 접속해서 한번 테스트해보세요.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>First SpringBoot Project</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>
```

위의 `index.html` 파일을 생성한 후 프로젝트를 재시작하게 되면! 정상적으로 Hello World! 가 노출됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-7.png"
width="500" alt="hello world with springboot"/>

조금 더 나아가 다른 URL도 매핑될 수 있도록 `HelloController`라는 새로운 Controller를 추가하고
Json 형태로 구성된 Body를 파라미터로 받아 단순히 출력하게 해봅시다.

```java
package com.madplay.bootdemo.controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * @author Kimtaeng
 */
@RestController
public class HelloController {

    @RequestMapping(value = "hello", method = RequestMethod.POST)
    public void greet(@RequestBody Map<String, Object> bodyMap) {
        List<String> nameList = (List<String>)bodyMap.get("nameList");
        nameList.forEach(name -> System.out.println(name));
    }
}
```

추가적인 설정은 없고 `Controller 관련 어노테이션`만 추가해주었고 호출은 `PostMan`을 통해서 진행했습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-8.png"
width="500" alt="call using postman"/>

<br/>

중단점(Break Point)를 걸어서 한줄씩 살펴보면 20번 라인의 코드로 인해 PostMan에서 입력한 문자열이 출력되는 것을 볼 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-9.png"
width="700" alt="debug mode when calling URL"/>

스프링부트 프로젝트를 실행했을 때 이미 사용중인 포트라고 나오는 경우 아래와 같이 `application.properties` 파일을 추가(또는 수정)해주면 됩니다.

```properties
server.port=포트번호
```

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-07-22-create-springboot-project-in-intellij-10.png"
width="500" alt="change port"/>

파일 내용이 변경된 이후 다시 실행하면 실행과정 출력에서 포트 번호가 변경된 것을 확인할 수 있습니다.
이후 접속은 `localhost:변경한포트번호`로 하면 되고요.

지금까지 인텔리제이(IntelliJ)를 이용해서 스프링부트 프로젝트를 생성하는 방법을 진행했습니다.
추가 작성되는 포스트와 함께 이번에 생성한 프로젝트에 코드를 추가해보며 Spring에 대한 내용을 공부해봅시다.