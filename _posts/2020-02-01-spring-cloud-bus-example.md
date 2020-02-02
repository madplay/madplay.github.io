---
layout:   post
title:    "Spring Cloud Bus 예제"
author:   Kimtaeng
tags: 	  spring springcloud springcloudbus
description: "Spring Cloud Bus를 이용하여 Spring Cloud Config가 변경될 때마다 클라이언트 호출 없이 자동 갱신하는 방법"
category: Spring
date: "2020-02-01 03:51:59"
comments: true
---

# Spring Cloud Bus가 왜 필요할까?

앞선 글에서는 스프링 설정이 바뀌었을 때, 배포 없이 갱신할 수 있도록하는 **Spring Cloud Config**를 적용했었다.

- <a href="/post/introduction-to-spring-cloud-config">이전 글: Spring Cloud Config 예제 (링크)</a>

그런데 설정이 갱신되는 애플리케이션인 Client는 설정 정보 갱신이 필요할 때마다 ```/actuator/refresh``` 와 같은 endpoint를 호출하여
설정을 갱신하도록 해야 했다. 그런데 여기에 **Spring Cloud Bus**를 적용하면 설정 정보가 변경될 때마다 바로 서비스에서 반영되도록 할 수 있다.

<br/><br/>

# 구조

간단하게 구조를 살펴보자. 먼저 ```Git Repository```의 변경사항이 있으면 Github의 ```Webhook```을 통해 Config 서버의 갱신을 위한 endpoint를 호출한다. 그리고 이를 통해 변경 통보를 받은 **Config Server**는 설정 정보를 갱신한 후에 ```RabbitMQ```에게 등록된 서버들의 설정을 갱신하도록 한다.
그 결과로 **Config Client**는 설정 정보를 업데이트가 된다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-how-to-use-spring-cloud-bus-1.png"
width="650" alt="spring cloud bus structure"/>

<br/>

이제 직접 코드를 통해 Spring Cloud Bus를 사용해보자. 앞선 글에서 사용한 프로젝트를 그대로 이용할 예정이다.
다만 이번 예제에서 Github의 ```Webhook```은 URL 직접 호출로 대체한다.

<br/><br/>

# RabbitMQ 구축과 실행

**RabbitMQ**를 구축하고 실행하는 과정은 ```Docker```를 이용하여 로컬 환경에서 진행한다. 아래와 같이 실행하면 되는데 옵션을 살펴보자.
우선 **RabbitMQ 연동은 5672번 포트**를 사용하고 웹 브라우저를 이용하는 어드민 페이지는 8087번 포트를 사용할 것이다.
그리고 로그인에 사용되는 아이디는 ```madplay```이고 비밀번호는 동일하다.

```bash
$ docker run -d --name rabbitmq \
    -p 5672:5672 -p 8087:15672 \
    -e RABBITMQ_DEFAULT_USER=madplay \
    -e RABBITMQ_DEFAULT_PASS=madplay \
    rabbitmq:management
```

정상적으로 구동되었다면 브라우저를 열고 ```http://localhost:8087```로 접속해보자. 아래와 같은 화면이 보일 텐데 컨테이너를 띄울 때 사용한
계정 정보를 입력해서 로그인하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-how-to-use-spring-cloud-bus-2.png"
width="650" alt="rabbitmq admin page"/>

<br/><br/>

# Spring Cloud Config Server 수정

Config 서버를 수정해야 한다. ```pom.xml```에 아래 의존성을 추가해준다.

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bus-amqp</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-monitor</artifactId>
</dependency>
```

그리고 ```application.yml``` 파일을 아래처럼 수정한다.

```yaml
server:
  port: 8088

spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/madplay/spring-cloud-config-repository
  rabbitmq: # 이 부분을 추가해준다. (RabbitMQ 관련 설정)
    host: localhost
    port: 5672
    username: madplay
    password: madplay

management: # 이 부분을 추가해준다. (기존에는 client 파일에 있었음)
  endpoints:
    web:
      exposure:
        include: bus-refresh
```

<br/><br/>

# Spring Cloud Config Client 수정

Config 클라이언트도 수정해주어야 한다. 마찬가지로 ```pom.xml```에 아래 의존성을 추가해준다.

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bus-amqp</artifactId>
</dependency>
```

그리고 ```bootstrap.yml``` 파일을 아래와 같이 수정한다.

```yaml
server:
  port: 8089
spring:
  application:
    name: config
  cloud:
    config:
      uri: http://localhost:8088
  rabbitmq: # 이 부분을 추가해준다. (RabbitMQ 관련 설정)
    host: localhost
    port: 5672
    username: madplay
    password: madplay
```

<br/><br/>

# 확인해보기

테스트를 위한 준비는 모두 끝났다. RabbitMQ와 Config 서버 그리고 Config 클라이언트 모두를 실행해보자.
클라이언트를 실행할 때는 ```-Dspring.profiles.active=dev``` 값을 주면 된다. Intellij IDE를 사용한다면 **Run/Debug Configuration**의
Active Profiles에 ```dev```만 입력하면 된다.

Config 서버와 클라이언트가 모두 정상적으로 구동되면 RabbitMQ 어드민 페이지를 통해서 정상 연결됐는지 확인할 수 있다.
먼저 ```Exchanges``` 탭에서 ```springCloudBus```가 추가된 것과 ```Connection``` 탭에서 연결 상태를 확인할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-02-01-how-to-use-spring-cloud-bus-3.png"
width="850" alt="rabbitmq"/>

<br/>

설정값 변경을 테스트하기 전에 클라이언트를 호출해서 현재의 값을 확인해보자.

```bash
$ curl -X GET "http://localhost:8089/dynamic"

{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated dev taeng!!!"
}
```

값을 확인했다면 ```Spring Cloud Config```를 변경했을 때처럼 Git Repository에 있는 ```config-dev.yml``` 파일의 내용을 수정해보자.

```yaml
taeng:
  profile: I'm dev taeng
  comment: Hello! updated by Spring Bus.
```

그리고 ```Config Server```에 아래와 같은 요청을 보내면 된다. 기존에는 클라이언트에 갱신 요청을 보냈으나 이제는 설정 서버만 호출하면 된다.
실제 현업이라면 여러 대로 구성된 클라이언트에 일일이 호출할 필요가 없다는 뜻이다. 설정 서버에만 호출하면 된다는 것이다.

```bash
$ curl -X POST "http://localhost:8088/actuator/bus-refresh"
```

이제 다시 클라이언트를 호출해서 값이 변경되었는지 확인해보자.

```bash
$ curl -X GET "http://localhost:8089/dynamic"

{
  "profile": "I'm dev taeng",
  "comment": "Hello! updated by Spring Bus."
}
```

```Spring Cloud Bus```를 통해 설정값이 갱신될 때, 서버와 클라이언트에는 어떤 로그가 남는지 확인해보자.

```bash
# Server 로그
No active profile set, falling back to default profiles: default
Started application in 0.122 seconds (JVM running for 1015.25)
Adding property source: file:/var/folders/7b/4vlwnfvd5r54h9fdd89qtnqm0000gn/T/config-repo-10206987896593312288/config-dev.yml
Received remote refresh request. Keys refreshed []

# Client 로그
Fetching config from server at : http://localhost:8088
Located environment: name=config, profiles=[dev], label=null, version=3230c6b6e68299e3ce5993e596de4e1e301740b5, state=null
Located property source: [BootstrapPropertySource {name='bootstrapProperties-configClient'},
    BootstrapPropertySource {name='bootstrapProperties-https://github.com/madplay/spring-cloud-config-repository/config-dev.yml'}]
The following profiles are active: dev
Started application in 0.857 seconds (JVM running for 1171.394)
Received remote refresh request. Keys refreshed []
```

<br/><br/>

# 마치며

이렇게 Config 서버만 호출해서 모든 클라이언트의 설정값을 변경할 수 있는 것을 확인했다.
실제로는 GitHub의 ```Webhook```을 사용하기 때문에 직접적으로 갱신하기 위한 엔드 포인트를 호출하는 작업도 필요 없다.

- 예제에 사용된 소스 코드
  - <a href="https://github.com/madplay/spring-cloud-config-server" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-server</a>
  - <a href="https://github.com/madplay/spring-cloud-config-repository" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-repository</a>
  - <a href="https://github.com/madplay/spring-cloud-config-client" target="_blank" rel="nofollow">
https://github.com/madplay/spring-cloud-config-client</a>