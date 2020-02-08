---
layout:   post
title:    Mac OS에서 MySQL root 비밀번호 변경 오류 해결하기
author:   Kimtaeng
tags: 	  Database MySQL
description: access denied for user... 오류 해결하기
category: Database
comments: true
---

# MySQL 비밀번호 변경 오류

Mac OS 환경에서 MySQL을 설치하여 최초 접속을 시도할 때 흔히 발생하는 에러 메시지가 있습니다.<br/>
(터미널에서 ./mysql을 실행하거나 sequel pro 등을 이용하여 접속을 시도할 때)

<div class="post_caption">ERROR 1045 (28000): access denied for user 'root'@localhost</div>

간단한 해결책으로 옵션을 통해 비밀번호를 입력하여 해결하는 방법도 있습니다.

```bash
./mysql -p<password>
```

비밀번호가 일치하는 경우 접속되겠으나, 일치하지 않는 경우 다음과 같은 메시지로 변경됩니다.<br/>
<div class="post_caption">ERROR 1045 (28000): access denied for user 'root'@localhost (using password: YES)</div>

분명히 일치하지만 접속이 안되는 경우도 있겠지요. 이런 경우에 패스워드를 새로 지정하여 접속해야 합니다.<br/>
구글링해보면 UPDATE 명령어를 통해 변경하라고 제안합니다. 우선 그렇게 해봅시다.

먼저, MySQL를 중단시킵니다. 중단 방법은 아래 링크를 참고하면 됩니다.
- <a href="https://coolestguidesontheplanet.com/start-stop-mysql-from-the-command-line-terminal-osx-linux"
rel="nofollow" target="_blank">링크: MySQL 중단 방법 참고</a>

그리고 아래 명령어를 통해 잠시 동안 패스워드 없이 동작하도록 조정합니다.
```bash
sudo /usr/local/mysql/bin/mysqld_safe --skip-grant-tables
``` 

또다른 터미널을 열어서(맥 기준으로 Command + T) 다음 명령어를 수행하여 접속합니다.
```bash
sudo /usr/local/mysql/bin/mysql -u root
```

그리고 마침내 기다리던 비밀번호를 변경할 시간입니다.
```mysql
UPDATE mysql.user SET password=PASSWORD(새로운 비밀번호) WHERE user='root';
```

<br/>

<div class="post_caption">그런데... password 컬럼이 없다고!?</div>

그렇습니다. 아이러니하게도 설치 버전에 따라 password 컬럼이 존재하지 않는 경우가 있습니다.<br/>
저도 이러한 사실을 모른채 많은 시간을 소비했던 것 같습니다. 우선 아래와 같이 진행하면 됩니다.

우선 mysql을 Start 상태로 돌리고 나서 접속을 시도합니다.<br/>
그리고 use mysql 명령어를 통해 데이터베이스를 선택한 후 다음 명령어를 실행합니다.

```mysql
UPDATE user set authentication_string=password('새로운 비밀번호') where user='root';
```

왜 그럴까요? 보통 최신 버전(2016년?)을 설치하면 Mac의 MySQL은 대부분 아래와 같이 되어있답니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-19-mysql-change-root-password-error-1.png" width="740" height="560" alt="MySQL user테이블"/>

<div class="post_caption">직접 겪었던 부분이라서 기억에 잘 남네요...</div>