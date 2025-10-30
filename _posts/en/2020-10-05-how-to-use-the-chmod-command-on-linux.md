---
layout:   post
title:    How to Use the chmod Command on Linux
author:   Kimtaeng
tags: 	  linux chmod
description: Learn about the chmod command for changing file and directory permissions on Linux.
category: Knowledge
lang: en
slug: how-to-use-the-chmod-command-on-linux
permalink: /en/how-to-use-the-chmod-command-on-linux/
date: "2020-10-05 23:51:22"
comments: true
---

# What Is chmod?
In Linux, this command changes file permissions. It is short for **change mode**.
You can change permissions for files and directories using octal mode or symbolic mode.
In practice, octal mode is more widely used because it is simpler.

<br>

# Usage
The basic form of the `chmod` command is below. Let's look at options and modes.

```bash
$ chmod [option] [mode] [file]
```

## Options
You can use options as follows.
- R: Changes permissions for files and directories under the target.
- v: Lists all files currently being processed.
- c: Prints only files that were actually changed, with details.

## Symbolic Mode
`chmod` can assign permissions using symbols. Compared with octal mode, symbolic mode is more intuitive.

```bash
$ chmod [reference] [operator] [mode] [target name]
```

References are:
- `u`: user (owner), the file owner.
- `g`: group, users who are members of the file's group.
- `o`: others, users who are neither owner nor group members.
- `a`: all of the above, same as `ugo`.

Operators are:
- `+`: adds permission.
- `-`: removes permission.
- `=`: sets permission exactly to the specified value.

Modes are:

- `r`: read, can read a file or list directory contents.
- `w`: write, can write to a file or directory.
- `x`: execute, can execute a file.


## Octal Mode
This is the common permission-setting method using octal numbers.
It is less intuitive, but simple to use.

```bash
$ chmod [option] [octal number] [target name] 
```

File permissions are displayed like `-rwxrwxrwx`.
Ignore the first character, which indicates file type (`d` for directory, `l` for symbolic link, etc.),
and split the next 9 characters into 3 groups for user, group, and other permissions.

Map read `r` to 4, write `w` to 2, and execute `x` to 1.
You can set permissions by adding these values.
For example, `-rwxr-xr-x` maps to `755`.

<br>

# Examples
Now let's look at examples using the methods above.

```bash
# Grant read and write permissions on test to user
$ chmod u+rw test


# Grant only write permission on test to user
# Grant read permission on test to group
$ chmod u=w, g+r test


# Grant read, write, execute permissions to user
# Grant read and execute permissions to group and other
$ chmod 755 test
```
