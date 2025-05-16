---
layout:   post
title:    "Manage Multiple Java Versions with jEnv"
author:   Kimtaeng
tags: 	  java jenv
description: Install jEnv on macOS and manage multiple JDK versions.
category: Java
comments: true
slug:     manage-java-version-using-jenv
lang:     en
permalink: /en/post/manage-java-version-using-jenv
---

# What Is jEnv?
jEnv is a JDK version manager. It lets you install multiple JDKs and switch between them easily.
This post covers installation and usage on **macOS**.

<br>

# Install and Configure jEnv
On macOS, install with Homebrew:

```bash
$ brew install jenv
```

After installation, check the configured JDKs.
If you have not added any versions yet, the list is empty.

```bash
$ jenv versions
 * system (set by /Users/madplay/.jenv/version) 
```

To list all installed JDKs, run `/usr/libexec/java_home -V`,
or browse `/Library/Java/JavaVirtualMachines`.

```bash
$ /usr/libexec/java_home -V
Matching Java Virtual Machines (3):
  11.0.2, x86_64:  "OpenJDK 11.0.2"	/Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
  1.8.0_73, x86_64: "Java SE 8"	/Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
  1.7.0_79, x86_64:	"Java SE 7"	/Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
```

If no JDK is installed, you can use a cask package (latest version):

```bash
$ brew cask install java
```

Now initialize jEnv.

```bash
$ echo 'export PATH="HOME/.jenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(jenv init -)"' >> ~/.bash_profile
```

If settings do not apply, edit `.bash_profile` directly:

```bash
$ sudo vi ~/.bash_profile
if which jenv > /dev/null; then eval "$(jenv init -)"; fi
```

Reload your shell:

```bash
$ source ~/.bash_profile
```

<br>

# Use jEnv
Add installed JDK versions with `jenv add`.

> In a fresh environment, `~/.jenv/versions` may not exist. Create it first.

```bash
# create jenv version directory
# -p creates intermediate directories
$ mkdir -p ~/.jenv/versions

# add JDK 1.7
$ jenv add /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home/
oracle64-1.7.0.79 added
1.7.0.79 added
1.7 added

# add JDK 1.8
$ jenv add /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home/
oracle64-1.8.0.73 added
1.8.0.73 added
1.8 added

# add JDK 11
$ jenv add /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home/
openjdk64-11.0.2 added
11.0.2 added
11.0 added
```

Verify:

```bash
$ jenv versions
* system (set by /Users/madplay/.jenv/version)
  1.7
  1.7.0.79
  1.8
  1.8.0.73
  11.0
  11.0.2
  openjdk64-11.0.2
  oracle64-1.7.0.79
  oracle64-1.8.0.73
```

Set a global version:

```bash
$ jenv global 11.0.2
$ java -version
openjdk version "11.0.2" 2019-01-15
OpenJDK Runtime Environment 18.9 (build 11.0.2+9)
OpenJDK 64-Bit Server VM 18.9 (build 11.0.2+9, mixed mode)
```

Set a local version for the current directory:

```bash
$ jenv local 1.8

$ java -version
java version "1.8.0_73"
Java(TM) SE Runtime Environment (build 1.8.0_73-b02)
Java HotSpot(TM) 64-Bit Server VM (build 25.73-b02, mixed mode)
```

<br>

# A Deeper Look
When you set a local version, jEnv writes a `.java-version` file containing the version string.

After running `jenv add`, jEnv creates **symbolic links** under `~/.jenv/versions`
that point to the real JDK directories.

```bash
$ pwd
/Users/madplay/.jenv/versions
$ ls -al
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:03 1.7 -> /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:06 1.8 -> /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   66  3  25 23:06 11.0 -> /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   66  3  25 23:06 openjdk64-11.0.2 -> /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:03 oracle64-1.7.0.79 -> /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:06 oracle64-1.8.0.73 -> /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
# ... omitted
```

`which java` also points to jEnv shims:

```bash
$ which java
/Users/madplay/.jenv/shims/java

# without jEnv
$ which java
/usr/bin/java
```

To uninstall, remove both the package and its directory.
If you only uninstall, you may see:
**/usr/local/Cellar/jenv/0.5.2/libexec/libexec/jenv: No such file or directory**.

```bash
$ brew uninstall jenv
$ rm -rf ~/.jenv
```

<br>

# Closing Thoughts
jEnv makes Java version switching faster than editing environment variables.

I looked for an IntelliJ plugin but did not find one.
There are IntelliJ plugin APIs with many features, so a custom plugin may be possible.

> Update: I built and released a plugin so IntelliJ can use jEnv. Building it at night is not easy, but it is done.
> For details, see the post below.

- <a href="/post/creating-intellij-plugin-project" target="_blank">IntelliJ Plugin: 1. Environment Setup</a>
