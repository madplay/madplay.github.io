---
layout:   post
title:    아파치 톰캣 연동하기(apache, tomcat, mod_jk)
author:   Kimtaeng
tags: 	  apache tomcat modjk ajp
description: 웹서버 아파치와 WAS 톰캣을 modjk를 통해 연동해보자. 그리고 아파치와 톰캣을 연동하는 이유는 무엇일까?
category: Knowledge
comments: true
---

# 아파치(Apache)란 무엇일까?
1995년 처음 발표된 WWW(World Wide Web) 서버용 소프트웨어를 말합니다. 대부분의 운영체제에서 운용이 가능하며 오픈소스 라이선스를 가지고 있어
자유롭게 사용할 수 있습니다. 쉽게 말해서 표현한다면 **웹 서버(Web Server)**라고 표현하면 되겠네요.

<br/>

# 톰캣(Tomcat)이란 무엇일까?
그렇다면 톰캣은 무엇일까요? 아파치 소프트웨어 재단에서 개발한 서블릿 컨테이너만 있는 **웹 애플리케이션 서버**를 말합니다.
WAS(Web Application Server)라고 말하는데, 이는 웹 서버와 웹 컨테이너의 결합으로 다양한 역할을 수행할 수 있는 서버를 말합니다.

예로는 WebLogic, Jeus, Tomcat 등이 있답니다. (Tomcat을 WAS라고 보면 안 된다는 의견도 있지만! 우선 WAS라는 관점으로 봅시다.)
클라이언트의 요청이 들어오면 내부의 실행 결과를 만들어내고 이를 다시 전달해주는 역할을 합니다.

<br/>

# 그렇다면 왜 아파치와 톰캣을 연동할까?

<div class="post_caption">"왜 WAS만 사용하지 않고 웹 서버와 같이 사용할까?"</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-05-apache-tomcat-modjk-1.png" width="650" alt="WAS"/>


**만일 웹 서버가 없이 WAS만 사용한다고 가정해봅시다.**

웹 페이지(Web Page)에는 정적인 리소스뿐만 아니라 동적인 리소스가 함께 존재합니다. WAS의 정적 데이터 처리로 인해 동적 데이터에 대한 처리는
늦어지게 될 것이고 결과적으로 본다면 클라이언트의 요청에 대한 응답 시간은 전반적으로 늘어나게 될겁니다.

**그러니까 사용 목적에 따라 다르다고 볼 수 있는데요.**
HTML 파일이나 이미지 파일과 같은 정적 컨텐츠들은 WAS까지 거치는 것보다 웹 서버를 바로 통하는 것이 더 빠릅니다.

이러한 맥락으로 본다면 웹서버인 아파치와 WAS인 톰캣을 연동하여 각자의 역할 분담이 가능하므로 더 좋겠지요?
또! 하나의 웹 서버에 여러 개의 톰캣을 연결해서 분산시킬 수 있는 로드 밸런싱(Load Balancing)을 구현할 수도 있습니다.

<div class="post_caption">"그럼 지금부터 아파치와 톰캣을 연결해봅시다. OSX El Capitan 환경을 기준으로 합니다."</div>

<br/>

# 아파치와 톰캣 설치
아파치와 톰캣을 연동하는 작업을 진행할 것인데 설치도 안 하고 진행하면 이상하겠지요. 아파치의 경우 Mac 환경을 기준으로 했기에 자체적으로 설치되어있는
아파치를 사용해도 됩니다. OSX El Capitan 기준으로 터미널에서 `cd /etc/apache2 ` 명령어를 통해 확인 가능합니다.

터미널에서 `sudo apachectl start` 명령어를 실행하고 브라우저에서 localhost로 접속을 합니다.
"It Works!" 라는 문구가 뜨면 준비 끝! `sudo apachectl stop` 명령어로 아파치를 중단합니다.

톰캣은 간단하게 공식 홈페이지를 참조하여 직접 다운로드하시면 됩니다.

- <a href="http://tomcat.apache.org/" target="_blank" rel="nofollow">링크: 톰캣 공식 홈페이지</a>

<br/>

# JK Connector 설치하기
아래의 톰캣 홈페이지에서 하거나 curl을 통해서 다운로드하셔도 됩니다.

- <a href="http://tomcat.apache.org/download-connectors.cgi" target="_blank" rel="nofollow">링크: JK Connector 다운로드</a>

```bash
curl -O http://archive.apache.org/dist/tomcat/tomcat-connectors/jk/tomcat-connectors-1.2.41-src.tar.gz
```

tar 압축을 해제하고 `cd 압축해제위치/native` 명령어로 이동합니다.
그리고 다음과 같은 명령어를 실행합니다.

```bash
./configure --with-apxs=/usr/sbin/apxs 
# 또는 아래 명령어를 실행한다.
./configure CFLAGS='-arch x86_64' APXSLDFLAGS='-arch x86_64' --with-apxs=/usr/sbin/apxs
```

혹시나 위 과정에서 에러가 발생했다면, 대부분 컴파일러를 못 찾아서 발생하는 경우가 많습니다.
다음과 같은 명령어를 타이핑하여 소프트 링크를 만듭니다. (OSX El Capitan 기준)

```bash
cd /Applications/Xcode.app/Contents/Developer/Toolchains
sudo ln -s XcodeDefault.xctoolchain ./OSX10.11.xctoolchain

# 1과 2를 묶어서 타이핑하셔도 됩니다. 1번 과정의 주소를 2번 과정의 src와 dest 앞에 두면 됩니다.
# 그리고 다시 위의 ./configure ~ 과정을 진행합니다.
```

마지막으로 아래와 같이 `make` 명령어를 실행합니다.

```bash
# 먼저 타이핑하여 실행합니다.
make

# sudo 명령어는 설치되는 경로의 접근을 위함입니다. 
sudo make install
```

`make` 과정에서도 apr_lib.h 오류가 나는 경우가 있습니다. 아래 방법으로 해결합시다.

```bash
# apr_lib.h 경로를 확인합니다.
sudo find / -name "apr_lib.h"

# 다음 명령어를 실행합니다.
./configure CFLAGS='-arch x86_64' APXSLDFLAGS='-arch x86_64' LDFLAGS='-L/usr/include/apr-1' CFLAGS='-I/usr/include/apr-1' --with-apxs=/usr/sbin/apxs

# 이후 make와 sudo make install을 진행합니다.
```

정상적으로 진행되었다면 native 디렉터리 밑 apache-2.0 디렉터리 내에 mod_jk.so가 생성됩니다.
`install: /usr/libexec/apache2/mod_jk.so: Operation not permitted` 에러가 발생해도 생성됩니다

**아파치가 설치된 경로의 modules 디렉터리 밑에 mod_jk를 넣도록 합니다.**
modules가 없다면 생성하면 됩니다. 다른 이름으로 하는 경우 httpd.conf의 mod_jk.so 위치와 일치해야 합니다.

<br/>

# 톰캣 설정하기
톰캣에서는 설정할 부분이 적습니다. 설치 후에 변경이 없었다면 이 과정은 진행하지 않아도 됩니다.
그래도 혹시 모르니 확인은 해봅시다. 다음 명령어를 통해 톰캣의 설정 부분으로 진입합니다.

```bash
# 설치한 톰캣 디렉터리가 Desktop에 존재한다고 가정
cd /Desktop/설치된 톰캣 디렉터리 이름/conf
```

이후 `server.xml`을 열어 아래 설정이 있는지 확인합니다.

```bash
vi server.xml

# 위 명령어를 통해 에디터를 열은 후 다음과 같은 설정 부분이 있는지 확인합니다.

<!-- Define an AJP 1.3 Connector on port 8009 -->
<Connector port="8009" protocol="AJP/1.3" redirectPort="8443" />

# 주석은 없어도 됩니다. 포트 번호가 8009인지 확인하면 됩니다.
# 아예 위 부분이 통째로 주석처리 되있다면 해제해주면 되겠지요.
```

<br/>

# 아파치 설정하기
이제 아파치를 설정하면 됩니다. 연동할 톰캣의 리스트를 나타낼 `workers.properties` 파일을 하나 만들어줍니다.
위치는 아파치가 설치된 디렉터리 하위의 conf 디렉터리 밑으로 하지요.

```bash
cd /etc/apache2/conf
```

여기서 `vi workers.properties` 명령어를 통해 에디터를 열고 아래와 같이 입력합니다.

```bash
worker.list=worker1

worker.worker1.type=ajp13
worker.worker1.host=localhost
worker.worker1.port=8009

# 만일, 2개 이상의 톰캣을 사용하는 경우 다음과 같이 작성합니다.

worker.list=worker1,worker2

worker.worker1.type=ajp13
worker.worker1.host=localhost
worker.worker1.port=8009 # 포트번호
worker.worker1.lbfactor=2 # 서버 밸런스 비율

worker.worker2.type=ajp13
worker.worker2.host=localhost
worker.worker2.port=8010 # 포트번호
worker.worker2.lbfactor=1 # 서버 밸런스 비율
```

여기서 worker의 이름은 임의로 지정한 것입니다. 바꾸셔도 됩니다. 서버 밸런스 비율을 뜻하는 lbfactor의 경우도 마찬가지입니다.
또한 port 번호의 경우도 worker끼리 중첩되지 않으면 됩니다.

<br/>

# 아파치 httpd.conf 수정
명령어 `cd /etc/apache2`를 통해 apache가 설치된 디렉터리로 이동합니다.
디렉터리 이동 후 `vi httpd.conf` 명령어를 통해서 httpd.conf에 mod_jk를 추가합니다.

```bash
# 위 명령어로 에디터가 열리면 다음 문장을 추가해줍니다.
# 아무것도 변경하지 않았을 때, 맥에 설치된 아파치의 기본 ServerRoot는 '/usr' 입니다.
# 기존 설정을 유지한채 앞에 /etc/apache2/를 붙이는 것으로 진행합니다.


LoadModule jk_module /etc/apache2/modules/mod_jk.so
# mod_jk.so의 위치입니다. modules는 위의 install 과정에서의 디렉터리 이름입니다.

JkWorkersFile /etc/apache2/conf/workers.properties
# workers 설정 파일 위치

JkLogFile /etc/apache2/logs/mod_jk.log
# 로그파일 위치

JkShmFile /etc/apache2/logs/mod_jk.shm
# Load balancing workers will not function properly 오류 대응, httpd의 권한

JkMount /* worker1
# URL에 따른 요청 처리 설정
```

**중요하게 살펴봐야 하는 부분은 JkMount 입니다.**
이 부분에서 어떤 URL로 오는 경우 어떤 worker(톰캣)가 처리할지 설정할 수 있습니다. `/*.jsp`도 설정할 수 있고 `/*.php`도 가능합니다.
톰캣을 여러 대 설정하였다면 workers.properties에서 설정한 worker.list의 각 worker 이름에 따라서 설정합니다.

<br/>

# 확인해보기
설정은 모두 끝났고 이제 브라우저를 열어서 확인해보면 됩니다. Tomcat의 포트는 8080이고 Apache는 80포트입니다.

```bash
# 톰캣 실행 : 톰캣의 bin 디렉터리에서 아래처럼 스크립트를 실행하면 됩니다.
./startup.sh

# 아파치 실행 : 아래 명령어를 터미널에서 실행하면 됩니다.
sudo apachectl start
```

`http://localhost` 만을 입력했을 때, Tomcat의 Web Root의 index.jsp가 보여야 합니다.
연동 전에는 포트 번호를 붙여야 하지만, 이후에는 아래 비교된 이미지처럼 포트 번호 없이 접속이 가능해야 합니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-05-apache-tomcat-modjk-2.png"
width="800" alt="연동 전 후"/>