---
layout:   post
title:    "Spring Cloud Config: Spring Cloud Bus 예제"
author:   Kimtaeng
tags: 	  spring springcloud springcloudbus
description: "Spring Cloud Config가 변경될 때마다 모든 클라이언트 호출해야만 할까? Spring Cloud Bus를 이용하여 모든 클라이언트를 연결해보자."
category: Spring
date: "2020-02-01 03:51:59"
comments: true
---

# 목차
- <a href="/post/introduction-to-spring-cloud-config">Spring Cloud Config: 소개와 예제</a>
- Spring Cloud Config: Spring Cloud Bus 예제
- <a href="/post/spring-cloud-config-using-git-webhook-to-auto-refresh">Spring Cloud Config: Git Webhook을 이용한 자동 갱신</a>
- <a href="/post/changes-in-spring-cloud-config-from-spring-boot-2-4">Spring Cloud Config: Spring Boot 2.4 버전에서의 변경사항</a>

<br>

# Spring Cloud Bus가 왜 필요할까?
앞선 글에서는 스프링 설정이 바뀌었을 때 배포 없이 갱신할 수 있도록 하는 **Spring Cloud Config**를 적용했었다.
그런데 클라이언트의 설정 정보 갱신이 필요할 때마다 `/actuator/refresh` 와 같은 엔드 포인트를 호출하는 단점이 있다.
마이크로 서비스 환경과 같은 독립된 수많은 클라이언트가 존재한다면, 설정 정보의 갱신을 위해 모든 클라이언트를 호출하는 것도 버거울 것이다.

그런데 여기에 **Spring Cloud Bus**를 적용하면 설정 정보가 변경될 때마다 연결된 모든 클라이언트가 한 번에 갱신되도록 할 수 있다.
모든 서버에 대해 `refresh`를 호출하는 것이 아닌 단 한 개의 클라이언트에만 호출하면 모든 클라이언트가 갱신된다는 것이다.

> **2021년 1월 내용 추가**: 스프링 부트 2.4 버전부터는 이 글의 예제에서 사용된 `bootstrap.yml` 파일을 더 이상 사용하지 않습니다.
> 또한 글의 예제에서 사용한 "설정값 갱신을 위한 actuator 엔드포인트" `bus-refresh`도 `busrefresh`로 변경되었습니다.
> 변경 사항에 대해서는 상단 목차의 네 번째 글 <a href="/post/changes-in-spring-cloud-config-from-spring-boot-2-4">"Spring Boot 2.4 버전에서의 변경사항"</a>을 참고하시기 바랍니다.

<br/><br/>

# 어떤 구조일까?
간단하게 구조를 살펴보자. 앞선 글의 구조와 동일하게 설정 파일은 Git 저장소에 위치한다. config 서버는 Git 저장소에서 최신 설정 정보를 검색하여
클라이언트를 위한 중앙 집중식 서비스로서의 역할을 수행하며 클라이언트는 구동될 때 config 서버로부터 설정 정보를 받아온다.

그리고 클라이언트는 **Spring Cloud Bus**를 통해 서로 연결된다. 스프링 클라우드는 **RabbitMQ**와 **Kafka** 같은 경량 메시지 브로커를 사용하는데
이번 예제에서는 ``RabbitMQ``를 사용하며 연결된 모든 클라이언트로 이벤트를 브로드캐스트(broadcast) 한다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-spring-cloud-bus-example-1.png"
width="800" alt="spring cloud bus structure"/>

<br/>

한편 설정 파일을 변경한 후 Git 저장소로 `push` 했다면, 설정값을 갱신하기 위해서 클라이언트의 `actuator/bus-refresh` 엔드 포인트를 호출한다.
여기서 기존 구성과의 차이는 단 하나의 클라이언트만 호출해도 **RabbitMQ로 연결된 모든 클라이언트에서 설정값이 갱신**된다는 것이다.

config 서버는 Git 저장소에서 최신 설정 정보를 가져와 config 서버 자체를 갱신한다. 이후 클라이언트가 설정 정보를 요청하면
최신으로 업데이트된 설정 정보가 제공된다.

이제 직접 코드 작성해보며 Spring Cloud Bus를 파악해보자.
> 예제에서 사용한 코드는 모두 github에 있습니다. 글 하단 링크를 참고해주세요.

<br/><br/>

# RabbitMQ 구축과 실행
**RabbitMQ**를 구축하고 실행하는 과정은 `Docker`를 이용하여 로컬 환경에서 진행한다. 아래와 같이 실행하면 되는데 옵션을 살펴보자.
우선 **RabbitMQ 연동은 5672번 포트**를 사용하고 웹 브라우저를 이용하는 어드민 페이지는 8087번 포트를 사용할 것이다.
그리고 로그인에 사용되는 아이디는 `madplay`이고 비밀번호는 동일하다.

```bash
$ docker run -d --name rabbitmq \
    -p 5672:5672 -p 8087:15672 \
    -e RABBITMQ_DEFAULT_USER=madplay \
    -e RABBITMQ_DEFAULT_PASS=madplay \
    rabbitmq:management
```

정상적으로 구동되었다면 브라우저를 열고 `http://localhost:8087`로 접속해보자. 아래와 같은 화면이 보일 텐데 컨테이너를 띄울 때 사용한
계정 정보를 입력해서 로그인하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-spring-cloud-bus-example-2.png"
width="650" alt="rabbitmq admin page"/>

<br/><br/>

# Spring Cloud Config Client 수정
클라이언트의 코드를 수정해야 한다. 아래와 같이 `pom.xml`에 의존성을 추가해준다. **Spring Cloud Bus**를 위한 의존성이다.

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bus-amqp</artifactId>
</dependency>
```

그리고 `application.yml` 파일을 아래와 같이 작성한다. 물론 앞선 예제처럼 `bootstrap.yml`로 사용해도 실행되지만 기능과 필요에 따라 구분해보자.
따라서 이번 예제에서는 설정값을 갱신하는 엔드 포인트 설정은 `application.yml` 에 작성한다.

```yaml
server:
  port: 8089
spring:
  rabbitmq: # RabbitMQ 관련 설정
    host: localhost
    port: 5672
    username: madplay
    password: madplay

management:
  endpoints:
    web:
      exposure:
        include: bus-refresh
```

다음으로 `bootstrap.yml` 파일에는 아래와 같이 작성한다.

```yaml
spring:
  profiles: # 여기에 지정해도 되고, 실행할 때 지정해도 된다.
      active: dev
  application:
    name: config
  cloud:
    config:
      uri: http://localhost:8088
```

수정은 끝났다. **config 서버는 수정하지 않아도 된다.**

<br/><br/>

# 확인해보기
테스트를 위한 준비는 모두 끝났다. RabbitMQ와 Config 서버 그리고 Config 클라이언트 모두를 실행해보자. `bootstrap.yml`에 active profiles을
지정했기 때문에 별다른 옵션없이 실행해도 된다. 직접 지정하고 싶은 경우에는 `-Dspring.profiles.active=dev` 처럼 값을 주면 된다.
또는 Intellij IDE를 사용한다면 **Run/Debug Configuration**의 Active Profiles에 지정할 값을 넣어주면 된다.

이번 테스트에서는 `RabbitMQ`에 연결된 모든 클라이언트가 갱신되는지 확인하기 위해 **2개의 클라이언트**를 구동할 것이다.
클라이언트를 띄운 후에 `application.yml`의 `server.port` 부분을 8086번 포트로 수정하여 또 다른 클라이언트를 구동시켜 보자.
즉, 아래와 같이 포트를 사용하게 된다.

- 8086번 포트: Config 클라이언트 2
- 8087번 포트: RabbitMQ
- 8088번 포트: Config 서버
- 8089번 포트: Config 클라이언트 1

<br/>

2개의 클라이언트가 모두 정상적으로 구동되면 RabbitMQ 어드민 페이지를 통해서 정상 연결됐는지 확인할 수 있다.
먼저 `Exchanges` 탭에서 `springCloudBus`가 추가된 것과 `Connection` 탭에서 연결 상태를 확인할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-spring-cloud-bus-example-3.png"
width="850" alt="rabbitmq"/>

<br/>

설정값 변경을 테스트하기 전에 클라이언트를 각각 호출해서 현재의 값을 확인해보자.

```bash
$ curl -X GET "http://localhost:8089/dynamic"

# 결과
{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated dev taeng!!!"
}

$ curl -X GET "http://localhost:8086/dynamic"

# 결과
{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated dev taeng!!!"
}
```

두 개의 클라이언트 모두 동일한 결과를 보이고 있다. 값을 확인했다면 Git Repository에 있는 `config-dev.yml` 파일의 내용을 수정해보자.
github를 통해서 바로 진행해도 되고, 로컬에서 파일을 수정한 후에 commit 후 push 해도 된다.

```yaml
taeng:
  profile: I'm dev taeng
  comment: Hello! updated by Spring Bus.
```

그리고 클라이언트 하나에만 아래와 같은 요청을 보내면 된다. 기존 방식이라면 모든 클라이언트에 갱신 요청을 해야 하지만
이제는 하나의 클라이언트만 호출해도 `RabbitMQ`로 연결된 모든 클라이언트가 갱신된다.

여러 대로 구성된 클라이언트를 하나씩 모두 호출할 필요가 없다는 뜻이다.

```bash
$ curl -X POST "http://localhost:8089/actuator/bus-refresh"
```

이제 다시 클라이언트를 호출해서 값이 변경되었는지 확인해보자.

```bash
$ curl -X GET "http://localhost:8089/dynamic"

# 결과
{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated by Spring Bus."
}

$ curl -X GET "http://localhost:8086/dynamic"

# 결과
{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated by Spring Bus."
}
```

그렇다! 하나의 클라이언트에만 갱신 요청을 했지만 다른 클라이언트까지 참조하고 있는 설정값이 최신으로 변경되었다.

이번 글 도입부에서 보았던 구조처럼 Spring Cloud Bus에 연결된 모든 클라이언트에서 설정값 갱신을 위한 이벤트를 받으며
`@RefreshScope` 어노테이션이 달린 모든 빈(Bean)은 갱신 이벤트에 의해 config 서버로부터 최신 설정값을 받는다.

이 과정은 `Spring Cloud Bus`를 통해 설정값이 갱신될 때, 서버와 클라이언트의 로그를 통해서도 알 수 있다.

```bash
# Server 로그
Fetched for remote master and found 1 updates
The local repository is dirty or ahead of origin. Resetting it to origin/master.
Reset label master to version AnyObjectId[52c3482316dd84c80f3a29fb7ba899548c7a4b2b]
Adding property source: file:/var/folders/7b/4vlwnfvd5r54h9fdd89qtnqm0000gn/T/config-repo-10779098978969336911/config-dev.yml
Adding property source: file:/var/folders/7b/4vlwnfvd5r54h9fdd89qtnqm0000gn/T/config-repo-10779098978969336911/config-dev.yml

# Client1 로그
Fetching config from server at : http://localhost:8088
Located environment: name=config, profiles=[dev], label=null, version=52c3482316dd84c80f3a29fb7ba899548c7a4b2b, state=null
Located property source: [BootstrapPropertySource {name='bootstrapProperties-configClient'},
    BootstrapPropertySource {name='bootstrapProperties-https://github.com/madplay/spring-cloud-config-repository/config-dev.yml'}]
The following profiles are active: dev
Started application in 1.982 seconds (JVM running for 316.229)
Received remote refresh request. Keys refreshed [config.client.version, taeng.comment]

# Client2 로그
Fetching config from server at : http://localhost:8088
Located environment: name=config, profiles=[dev], label=null, version=52c3482316dd84c80f3a29fb7ba899548c7a4b2b, state=null
Located property source: [BootstrapPropertySource {name='bootstrapProperties-configClient'},
    BootstrapPropertySource {name='bootstrapProperties-https://github.com/madplay/spring-cloud-config-repository/config-dev.yml'}]
The following profiles are active: dev
Started application in 1.06 seconds (JVM running for 794.7)
Received remote refresh request. Keys refreshed [config.client.version, taeng.comment]
```

<br/><br/>

# 마치며
처음 글에서는 **Spring Cloud Config**를 이용하여 설정 파일을 외부로 분리하여 빌드, 배포 없이도 갱신할 수 있도록 하였다.
그리고 이번 글에서는 **Spring Cloud Bus**를 통해 설정값을 갱신하기 위해 모든 클라이언트를 호출하는 불편함을 없애보았다.

그런데 설정값이 갱신될 때마다 호출하는 것조차 불편하다고 느낄 수 있다. 이러한 호출조차 없앨 수 있지 않을까?
이어지는 글에서 설정 파일이 변경될 때마다 자동으로 이벤트를 발생시킬 수 있는 방법에 대해서 알아본다.

- <a href="/post/spring-cloud-config-using-git-webhook-to-auto-refresh">
다음 글: "Spring Cloud Config: Git Webhook을 이용한 자동 갱신" (링크)</a>

<br/><br/>

# 예제 소스 코드
이번 글에서 사용한 소스 코드는 모두 아래 저장소에 있습니다.

- config server & config client
  - <a href="https://github.com/madplay/spring-cloud-bus-example" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-bus-example</a>
- config repository
  - <a href="https://github.com/madplay/spring-cloud-config-repository" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-repository</a>