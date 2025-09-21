---
layout:   post
title:    Resolving MySQL Root Password Change Error on Mac OS
author:   madplay
tags: 	  Database MySQL
description: Resolving access denied for user... error
category: Database
comments: true
slug:     mysql-change-root-password-error
lang:     en
permalink: /en/post/mysql-change-root-password-error
---

# MySQL Password Change Error

There's a common error message when trying to access MySQL for the first time after installing it on Mac OS environment.<br/>
(When executing ./mysql in terminal or trying to access using sequel pro, etc.)

<div class="post_caption">ERROR 1045 (28000): access denied for user 'root'@localhost</div>

As a simple solution, there's also a method of resolving it by entering the password through options.

```bash
./mysql -p<password>
```

If the password matches, you'll connect, but if it doesn't match, it changes to the following message.<br/>
<div class="post_caption">ERROR 1045 (28000): access denied for user 'root'@localhost (using password: YES)</div>

There may also be cases where it clearly matches but connection fails.<br/>
In such cases, you need to set a new password to connect.<br/>
If you search online, they suggest changing it through UPDATE command. Trying that first:

First, stop MySQL. You can refer to the link below for stopping methods.
- <a href="https://coolestguidesontheplanet.com/start-stop-mysql-from-the-command-line-terminal-osx-linux"
rel="nofollow" target="_blank">Link: Refer to MySQL Stopping Methods</a>

Then adjust it to operate without a password for a while through the command below.
```bash
sudo /usr/local/mysql/bin/mysqld_safe --skip-grant-tables
``` 

Open another terminal (Command + T on Mac) and execute the following command to connect.
```bash
sudo /usr/local/mysql/bin/mysql -u root
```

And finally, it's time to change the password we've been waiting for.
```mysql
UPDATE mysql.user SET password=PASSWORD('new password') WHERE user='root';
```

<br/>

<div class="post_caption">But... the password column doesn't exist!?</div>

Yes. Ironically, depending on the installation version, the password column may not exist.<br/>
I think I spent a lot of time not knowing this fact. You can proceed as follows:

First, return mysql to Start state and then try to connect.<br/>
Then select the database with the use mysql command and execute the following command.

```mysql
UPDATE user set authentication_string=password('new password') where user='root';
```

Why is that? Usually, if you install the latest version (2016?), Mac's MySQL is mostly configured as follows.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-19-mysql-change-root-password-error-1.png" width="740" height="560" alt="MySQL user table"/>

<div class="post_caption">Since I experienced it directly, I remember it well...</div>
