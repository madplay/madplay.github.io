---
layout:   post
title:    "도커(Docker): 도커 설치와 명령어 따라하기"
author:   Kimtaeng
tags: 	  docker
description: 컨테이너 기반의 오픈소스 가상화 플랫폼인 도커! 일단 해보자!
categories: Docker
comments: true
---

# Docker란 무엇일까?
간단하게 말하자면 가상화된 컨테이너입니다. 필요한 프로그램과 라이브러리를 설치한 뒤 만들어낸 **파일**을 도커(Docker)를 통해서 실행하게 되는데요.
여기서 만들어진 파일을 **도커 이미지(Docker Image)**라고 합니다. 도커 이미지는 컨테이너를 실행하기 위한 모든 정보를 가지고 있지요.

도커에 대한 자세한 이론은 차후 이어지는 글에서 다룰 예정이고요. 이번 글에서는 무작정 도커를 설치하고 간단한 명령어를 직접 실행해보는 것이 목표입니다.

<div class="post_caption">차후 이 영역에 링크가 생성될 예정입니다.</div>

<br/>

# Docker 설치하기
Docker는 설치 환경에 따라서 설치 방법이 다릅니다. 환경별로 Linux, CentOS 등으로 나눌 수 있고 실행에 있어서도
curl, yum 등 설치할 수 있는 방법은 많은데요. 이번 글에서는 Mac OS 기준으로 진행합니다.

다음 링크를 참조하여 <a href="https://docs.docker.com/docker-for-mac/install/" rel="nofollow" target="_blank">
Install Docker for Mac(링크)</a> 설치하면 됩니다. 다운로드가 끝나고 별다른 설정 작업없이도 설치가 완료됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-28-docker-basic-1.png"
width="400" alt="Docker for Mac"/>

설치가 정상적으로 완료되었는지 터미널에서 `docker` 명령어를 실행해봅시다.
마치 `java` 명령어를 입력한 것처럼 Docker의 여러가지 명령어가 출력된다면 완료입니다.

만일 `docker` 명령어를 입력했는데 실행되지 않는다면 `sudo docker`와 같이 root 권한으로 실행해보시기 바랍니다.

<br/>

# Docker 명령어 실행하기
그렇습니다! 설치한지 얼마 되지도 않았는데 벌써 실행합니다.
이번 포스팅의 목표는 무작정 설치하고 실행해보는 것이니까요!

Docker는 기본적으로 `docker + 명령어` 형태로 동작합니다.

## docker search
Docker 이미지를 검색할 수 있는 명령어입니다.

`docker search [OPTIONS] TERM`

실습으로 mysql 이미지를 찾아봅시다. 명령어를 실행하면 Docker Hub라는 곳에 있는 이미지들을 검색하게 됩니다.  

<div class="post_caption">Docker Hub는 마치 GitHub처럼 Docker 이미지를 공유할 수 있는 곳입니다.</div>

터미널에 `docker search mysql` 라는 명령어를 입력해봅시다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-28-docker-basic-2.png"
width="1200" alt="docker search result"/>

mysql이라는 이름으로 꽤 많은 도커 이미지가 공유되어 있습니다.

<a href="https://hub.docker.com/" rel="nofollow" target="_blank">Docker Hub(링크)</a>에서 직접 검색해보면 알 수 있지만
공식(Official) 이미지의 경우 별도 표기가 있습니다. 그 외에는 사용자들이 직접 만들어서 공유한 도커 이미지입니다.

## docker pull
도커 이미지를 다운받을 수 있는 명령어입니다.

`docker pull [OPTIONS] NAME[:TAG|@DIGEST]`

위의 검색 명령어를 통해서 살펴본 mysql 이미지를 다운받아봅시다.
`docker pull mysql` 명령어를 입력하면 mysql 도커 이미지를 다운받을 수 있습니다.

- `이미지 이름:태그명` 등을 통해서 특정 버전을 받을 수 있습니다.
- 태그명에 `latest`를 입력하면 가장 최신 버전을 다운 받습니다.
- 이미지 이름에서 슬래시(/) 앞에 사용자 이름을 입력하면 해당 사용자가 올린 이미지를 받습니다.
- 공식 이미지의 경우는 사용자 이름이 없습니다.

```bash
$ docker pull mysql
Using default tag: latest
latest: Pulling from library/mysql
a5a6f2f73cd8: Pull complete 
936836019e67: Pull complete 
283fa4c95fb4: Pull complete 
1f212fb371f9: Pull complete 
e2ae0d063e89: Pull complete 
5ed0ae805b65: Pull complete 
0283dc49ef4e: Pull complete 
a7e1170b4fdb: Pull complete 
88918a9e4742: Pull complete 
241282fa67c2: Pull complete 
b0fecf619210: Pull complete 
bebf9f901dcc: Pull complete 
Digest: sha256:b7f7479f0a2e7a3f4ce008329572f3497075dc000d8b89bac3134b0fb0288de8
Status: Downloaded newer image for mysql:latest
```

<br/>

## docker images
다운받은 이미지를 살펴볼 때 사용하면 됩니다.

`docker images [OPTIONS] [REPOSITORY[:TAG]]`

```bash
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
mysql               latest              f991c20cb508        2 weeks ago         486MB
```

위에서 다운받은 mysql 도커 이미지가 있는 것을 확인할 수 있습니다.

## docker run
이제 다운받은 도커 이미지를 실행할 차례입니다. 실행 명령은 아래와 같이 구성됩니다.

`docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`

간단하게 몇 가지 옵션만 살펴봅시다.
- -i --interactive :  : 컨테이너와 상호작용을 하겠다는 뜻이고 컨테이너와 표준 입력을 유지합니다.
  - 대부분 이 옵션을 사용하여 bash 명령어를 인자로 같이 사용합니다.
- --name : 컨테이너에 이름을 지정할 수 있습니다.
- -d --detach : 백그라운드로 실행하게 됩니다.
- -e --env : 컨테이너에 환경 변수를 설정합니다. 비밀번호나 설정 값을 전달할 수 있습니다.
- -t --tty : TTY 모드를 사용합니다. Bash를 사용하려면 이 옵션과 같이 사용해야 합니다.
- -p --publish : 호스트에 연결된 컨테이너의 특정 포트를 외부에 노출하게 됩니다.
  - 예를 들어 `-p 80:80`
  
자, 이제 실행해봅시다.

```bash
$ docker run -d -p 3306:3306 \
-e MYSQL_ROOT_PASSWORD=pw \
--name taeng_mysql \
mysql
```

실행 명령어 사용된 옵션들은 바로 위에 있으므로 생략합니다.

## docker ps
taeng_mysql 이라는 이름을 가진 컨테이너가 실제로 동작하고 있는지 확인해봅시다.

```bash
$ docker ps -a
CONTAINER ID   IMAGE   COMMAND                  CREATED         STATUS         PORTS                               NAMES
7bbe51f63c3b   mysql   "docker-entrypoint.s…"   2 seconds ago   Up 1 second    0.0.0.0:3306->3306/tcp, 33060/tcp   taeng_mysql
```

정상적으로 실행되고 있음을 확인할 수 있습니다. STATUS 값이 exit인 경우는 종료된 상태입니다.
종료되어 보이지 않는 경우에는 `docker ps -a` 명령어를 통해서 확인할 수 있습니다.

## docker exec
외부에서 컨테이너에 특정 명령을 줄 수 있습니다.

`docker exec [OPTIONS] CONTAINER COMMAND [ARG...]`

이 명령어와 bash를 인자로 전달하여 컨테이너에 직접 접속할 수 있습니다.
아래와 같이 명령어를 입력하여 컨테이너의 shell에 접속해봅시다. 접속 후에는 mysql을 실행합니다.

```bash
# 컨테이너의 shell 접속
$ docker exec -it taeng_mysql bash

# 접속한 이후 mysql 명령어 실행
root@3342a578b8e2:/# mysql -u root -p

# 컨테이너 실행시에 -e 파라미터로 입력한 pw 입력
Enter password:

# MySQL 실행 성공
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.0.13 MySQL Community Server - GPL

Copyright (c) 2000, 2018, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>

# 테스트로 database 목록 출력
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
4 rows in set (0.00 sec)

# 실행 종료
mysql> exit
Bye

# 컨테이너 접속 종료
root@3342a578b8e2:/# exit
exit
```

## docker stop
컨테이너를 정지시킬 수 있습니다.

`docker stop [OPTIONS] CONTAINER [CONTAINER...]`

참고로 컨테이너의 이름이 아닌 컨테이너의 ID를 사용해도 됩니다.

ID는 `docker ps` 명령어를 입력했을 때 가장 좌측에서 확인할 수 있습니다.

```bash
$ docker ps
CONTAINER ID        IMAGE               ...
3342a578b8e2        mysql               ...
```

참고로 정지된 컨테이너의 경우 `docker ps -a` 옵션까지 붙여야 확인 가능합니다. 

## docker rm
실행이 끝난 도커 컨테이너를 삭제할 수 있습니다.

`docker rm [OPTIONS] CONTAINER [CONTAINER...]`

## docker rmi
도커 이미지를 삭제할 수 있습니다.

`docker rmi [OPTIONS] IMAGE [IMAGE...]`