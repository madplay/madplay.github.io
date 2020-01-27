---
layout:   post
title:    "jEnv로 여러 버전의 Java 사용하기(JDK 버전 관리)"
author:   Kimtaeng
tags: 	  java jenv
description: "Mac OS 환경에서 jEnv를 설치하고 여러 버전의 JDK를 간편하게 관리해보자."
category: Java
comments: true
---

<hr/>

# jEnv가 무엇일까?

jEnv는 JDK 버전 관리 도구인데요. 여러 개의 jdk를 설치해두고 손쉽게 버전을 변경해가며 사용할 수 있습니다.
이번 포스팅에서는 Mac OS에서 jEnv를 설치하고 사용하는 방법을 알아봅니다. 

<br/>

# jEnv 설치 및 설정하기

Mac OS 기준으로 brew를 이용하면 바로 설치 가능합니다.
<pre class="line-numbers"><code class="language-bash" data-start="1">$ brew install jenv
</code></pre>

설치가 끝나면 현재 설정된 JDK 버전을 확인해봅시다. 혹시나 아래처럼 JDK가 보이지 않는다고해서 JDK가 설치된 것이 아닐 수 있습니다.
처음 jEnv 설치한 후에 아무것도 등록하지 않았다면 원래 보이지 않습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ jenv versions
 * system (set by /Users/madplay/.jenv/version) 
</code></pre>

설치되어 있는 모든 버전의 Java를 확인하려면 ```/usr/libexec/java_home -V```를 입력하거나
또는 ```/Library/Java/JavaVirtualMachines``` 경로에서 직접 확인 가능합니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ /usr/libexec/java_home -V
Matching Java Virtual Machines (3):
  11.0.2, x86_64:  "OpenJDK 11.0.2"	/Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
  1.8.0_73, x86_64: "Java SE 8"	/Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
  1.7.0_79, x86_64:	"Java SE 7"	/Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
</code></pre>

혹시나 설치된 JDK가 없더라도 걱정하지 않아도 됩니다. 아래와 같이 cask 패키지를 통해서 간단하게 설치할 수 있습니다.
(다만, 최신 버전이 기본으로 설치됩니다.)
<pre class="line-numbers"><code class="language-bash" data-start="1">$ brew cask install java
</code></pre>

예제에서는 최신 버전만 설치했지만 다른 버전도 같이 설치해주면 됩니다.
설치가 완료되었다면 이제 마지막으로 jenv를 초기화해줍니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ echo 'export PATH="HOME/.jenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(jenv init -)"' >> ~/.bash_profile
</code></pre>

혹시나 설정이 반영되지 않는다면 ```.bash_profile``` 파일을 열어서 직접 아래 코드를 추가하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ sudo vi ~/.bash_profile
if which jenv > /dev/null; then eval "$(jenv init -)"; fi
</code></pre>

그리고 변경된 설정을 반영시키기 위해 터미널을 재실행하거나 ```source``` 명령어를 입력해주면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ source ~/.bash_profile
</code></pre>

<br/>

# jEnv 사용하기

드디어 jEnv를 사용할 차례입니다. 먼저 관리할 자바 버전들을 추가해야 하는데요. ```jenv add``` 명령어를 통해서 버전을 추가하면 됩니다.
그런데 포스팅을 위해서 다른 환경에서 다시 설치를 해보니, jEnv의 버전 관리 디렉터리(~/.jenv/versions)가 없더군요.
먼저 생성하고 진행하면 됩니다. 버전 추가는 각자 설치된 버전에 맞추어서 진행하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># jenv의 관련 디렉터리 먼저 생성
# -p는 현재 없는 하위 경로까지 생성하는 옵션
$ mkdir -p ~/.jenv/versions

# JDK 1.7 추가
$ jenv add /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home/
oracle64-1.7.0.79 added
1.7.0.79 added
1.7 added

# JDK 1.8 추가
$ jenv add /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home/
oracle64-1.8.0.73 added
1.8.0.73 added
1.8 added

# JDK 11 추가
$ jenv add /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home/
openjdk64-11.0.2 added
11.0.2 added
11.0 added
</code></pre>

jEnv에 자바 버전을 추가하는 명령어를 모두 입력했다면, 정상적으로 설정되었는지 확인해봅시다. 

<pre class="line-numbers"><code class="language-bash" data-start="1">$ jenv versions
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
</code></pre>

이제 사용하고 싶은 디렉터리에서 명령어만 입력하면 설치된 JDK 버전 내에서 자유롭게 변경할 수 있습니다.
```jenv global``` 명령어를 이용하여 버전을 지정하는 경우 전역으로 설정이 됩니다. 

<pre class="line-numbers"><code class="language-bash" data-start="1"># 전역 설정으로 버전 11을 사용
$ jenv global 11.0.2
$ java -version
openjdk version "11.0.2" 2019-01-15
OpenJDK Runtime Environment 18.9 (build 11.0.2+9)
OpenJDK 64-Bit Server VM 18.9 (build 11.0.2+9, mixed mode)
</code></pre>

그리고 ```jenv local```을 이용하면 현재 디렉터리에 대해서만 JDK 버전을 지정할 수 있습니다.
설정된 디렉터리에 대해서 전역 설정보다 더 높은 우선 순위를 갖습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># 현재 디렉터리에서는 버전 1.8을 사용
$ jenv local 1.8

# 자바 버전 확인
$ java -version
java version "1.8.0_73"
Java(TM) SE Runtime Environment (build 1.8.0_73-b02)
Java HotSpot(TM) 64-Bit Server VM (build 25.73-b02, mixed mode)
</code></pre>

<br/>

# 마치며

jEnv를 이용해서 자바 버전을 조금 더 편리하게 관리하는 법을 알아보았습니다. 사실 jEnv가 없어도 환경변수 설정을 바꿔가며 사용할 수도 있습니다.
하지만 에디터 화면을 여는 것 보다 더 빠르지요. 

한편 버전이 로컬 설정된 디렉터리를 보면 숨긴 파일 하나를 볼 수 있습니다. ```.java-version``` 라는 이름을 가진 파일인데 내용은
단순하게 버전만 명시되어 있습니다. 아마 이 파일을 참조하지 않나 싶습니다.

한편 의도하지 않았으나 jenv 설정 오류로 직접 생성한 ```~/.jenv/versions``` 디렉터리가 있었는데요. 자바를 설정을 추가할 때 필요한 것 같아서
```jenv add``` 명령어를 입력한 후에 변경을 살펴보니, 실제 JDK가 설치된 디렉터리로 **심볼릭 링크**가 생기더군요. 무엇인가 이런식으로
실제 JDK 디렉터리를 참조하여 서비스를 제공하는 것 같습니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ pwd
/Users/madplay/.jenv/versions
$ ls -al
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:03 1.7 -> /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:06 1.8 -> /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   66  3  25 23:06 11.0 -> /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   66  3  25 23:06 openjdk64-11.0.2 -> /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:03 oracle64-1.7.0.79 -> /Library/Java/JavaVirtualMachines/jdk1.7.0_79.jdk/Contents/Home
lrwxr-xr-x   1 madplay  madplay   63  3  25 23:06 oracle64-1.8.0.73 -> /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
# ... 일부 생략
</code></pre>

특정 명령어의 경로를 찾아주는 ```which```를 이용하여 java를 확인해보았을 때도 기본 자바로 설정했을 때와 조금 다릅니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">$ which java
/Users/madplay/.jenv/shims/java

# 원래는 아래와 같은 형태로 보입니다.
$ which java
/usr/bin/java
</code></pre>

끝으로 필요성이 없어질 떄를 대비해서 설치된 jenv를 삭제도 해봤는데, jEnv를 **언인스톨(uninstall)** 하고
관련 **디렉터리까지 삭제**해야 깔끔하게 지워집니다. 디렉터리 삭제없이 언인스톨만 진행하면
**/usr/local/Cellar/jenv/0.5.2/libexec/libexec/jenv: No such file or directory**를 신나게 만날 수 있습니다...

<pre class="line-numbers"><code class="language-bash" data-start="1">$ brew uninstall jenv
$ rm -rf ~/.jenv
</code></pre>