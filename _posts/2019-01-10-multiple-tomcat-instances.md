---
layout:   post
title:    톰캣 멀티 인스턴스(Multiple Tomcat Instances)
author:   Kimtaeng
tags: 	  apache tomcat
description: 여러 개의 톰캣 인스턴스를 띄우려면 어떻게 해야할까?
category: Knowledge
comments: true
---

# 톰캣 서버의 구조
여러 개의 톰캣 인스턴스를 띄우기 전에 먼저 톰캣(tomcat) 서버의 구조에 대해서 알아봅시다. 톰캣은 크게 엔진(Engine)과 인스턴스(Instance)로
구분하여 나눌 수 있습니다. `8.0.38` 버전 기준으로 디렉터리 구조를 보면 아래와 같은데요. 

```bash
$ tree -L 1
.
├── LICENSE
├── NOTICE
├── RELEASE-NOTES
├── RUNNING.txt
├── bin # 명령어 스크립트들이 있는 디렉터리
├── conf # 설정 파일 디렉터리
├── lib # 라이브러리 디렉터리
├── logs # 로그 디렉터리
├── temp # 임시 파일 디렉터리 
├── webapps # 웹 애플리케이션 deploy 디렉터리
└── work # .class로 컴파일된 디렉터리
```

톰캣의 **엔진**에 해당하는 모듈 부분은 bin, lib 이고 **인스턴스**에 해당하는 부분은
conf, logs, temp, work, webapps 으로 구분할 수 있습니다.

여기서 톰캣 엔진은 실제로 자바 애플리케이션을 실행하는 역할을 합니다. 그러니까 톰캣 인스턴스를
실행하는 역할을 한다는 것이지요. 자바 프로그램이 실행되는 것이므로 **Java Virtual Machine**이 실행될 것이고
이번에 진행할 여러 개의 톰캣을 띄운다는 것, 그러니까 멀티 인스턴스를 구성한다는 것은 여러 개의 톰캣 JVM을 구동한다는 것입니다.

<br/>

# 톰캣 실행과 환경변수
톰캣 인스턴스를 구동시키는 bin 디렉터리의 `startup.sh` 스크립트의 코드를 살펴보면 `catalina.sh` 스크립트를
실행하도록 구성되어 있습니다. 아래와 같이 말이지요.

```bash
$ vi startup.sh

EXECUTABLE=catalina.sh
# ... 생략
exec "$PRGDIR"/"$EXECUTABLE" start "$@"
```

`catalina.sh`에서는 실제 톰캣 인스턴스를 구동하는 코드를 확인할 수 있는데요. 실행 해보면 톰캣 구동에 참조하는
환경변수 내용들을 확인할 수 있습니다. (아래는 Mac OS 기준으로 수행했습니다)

```bash
$ ./catalina.sh start

Using CATALINA_BASE:   /Users/madplay/Desktop/apache-tomcat-8.0.38
Using CATALINA_HOME:   /Users/madplay/Desktop/apache-tomcat-8.0.38
Using CATALINA_TMPDIR: /Users/madplay/Desktop/apache-tomcat-8.0.38/temp
Using JRE_HOME:        /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
Using CLASSPATH:       /Users/madplay/Desktop/apache-tomcat-8.0.38/bin/bootstrap.jar:/Users/madplay/Desktop/apache-tomcat-8.0.38/bin/tomcat-juli.jar
Tomcat started.
```

각각의 독립적인 톰캣 인스턴스를 띄우기 위해서는 톰캣 인스턴스의 경로를 갖는 `CATALINA_BASE`와 톰캣 엔진의 경로인
`TOMCAT_HOME`의 값을 설정해주어야 합니다.

<br/>

# 톰캣 여러개 띄우기
먼저 톰캣을 다운로드받아 압축 해제합니다. 다운받은 1개의 톰캣 디렉터리를 복사하여 총 3개를 준비하면 됩니다.
앞서 설명한 것처럼 엔진 역할을 담당하는 부분은 lib와 bin 이므로 모든 톰캣 디렉터리에 있을 필요가 없습니다.
더불어 각각의 톰캣 인스턴스 디렉터리에는 인스턴스를 구성하기 위한 디렉터리만 있으면 되고요.

전체 디렉터리 구조를 살펴보면 아래와 같습니다.

```bash
$ tree -L 2
.
├── tomcat1
│   ├── conf
│   ├── logs
│   ├── temp
│   ├── webapps
│   └── work
├── tomcat2
│   ├── conf
│   ├── logs
│   ├── temp
│   ├── webapps
│   └── work
└── tomcat_main
    ├── bin
    └── lib
</code></pre>

각각의 톰캣 인스턴스가 다른 포트를 사용하여 구동되어야 하기때문에 `server.xml`의 정보가 수정되어야 합니다.

```xml
<!-- conf 디렉터리 내의 server.xml -->
<Server port="8006" shutdown="SHUTDOWN">
    <!-- 다른 부분은 생략하며 해당 포트로의 HTTP 연결만을 가정 -->
    <Connector port="18081" protocol="HTTP/1.1"
            connectionTimeout="20000" redirectPort="8443" />
</Server>
```

위의 포트 부분을 tomcat1과 tomcat2를 다르게 설정해주면 됩니다. ROOT 요소가 되는 `<Server>`의 shutdown 포트번호도
서로 다르게 지정해야 합니다.

이제 톰캣 인스턴스를 **구동시킬 스크립트**를 작성하면 됩니다. 이름은 임의로 `startup.sh`로 지정하며
tomcat1, 2의 디렉터리에 각각 작성하면 됩니다.

```bash
#!/bin/sh

# tomcat instance 경로 - 각 인스턴스에 맞게 경로 수정
export CATALINA_BASE=/Users/madplay/Desktop/multitomcat/tomcat1

# tomcat engine 경로
export TOMCAT_HOME=/Users/madplay/Desktop/multitomcat/tomcat_main 

# 각 톰캣 인스턴스마다 사용하는 jdk가 다를 경우
#export JAVA_HOME=${자바 경로}

cd $TOMCAT_HOME/bin
./startup.sh
```

인스턴스를 종료하는 스크립트의 경우 먼저 작성한 startup.sh 스크립트에서 가장 마지막 부분만 실행 대상 스크립트를 
`./shutdown.sh`로 변경하면 됩니다. 각 인스턴스에 생성하는 위 스크립트의 경우 이름을 임의로 지정해도 됩니다.
다만 톰캣 엔진에서의 bin 디렉터리 내의 스크립트는 수정하지 않고 그대로 사용하면 됩니다.