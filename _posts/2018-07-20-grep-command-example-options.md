---
layout:   post
title:    grep 예제와 옵션
author:   Kimtaeng
tags: 	  grep 
description: grep 명령어로 파일 내의 특정 문자열들을 찾아보자
category: Knowledge
comments: true
---

# grep 명령어
grep 명령어는 특정 파일 내에서 정규표현식으로 문자열을 탐색해 그 문자열이 포함된 라인을 출력한다.
사용법(usage)은 아래와 같다.

```bash
grep: invalid option -- ?
usage: grep [-abcDEFGHhIiJLlmnOoqRSsUVvwxZ] [-A num] [-B num] [-C[num]]
	[-e pattern] [-f file] [--binary-files=value] [--color=when]
	[--context[=num]] [--directories=action] [--label] [--line-buffered]
	[--null] [pattern] [file ...]
```

<br>

# grep 옵션
grep 명령어와 같이 사용할 수 있는 옵션들이 있다.

- -c : 문자열이 포함된 라인 개수를 표시한다.
- -i : 문자열의 대소문자를 구분하지 않는다.
- -h : 파일 이름을 출력하지 않는다.
- -l : 문자열이 일치한 파일의 이름만 출력한다.
- -v : 입력한 패턴이 포함되지 않은 문자열을 출력한다.
- -r : 서브 디렉터리의 파일까지 모두 출력한다.
- -n : 일치한 문자열이 포함된 라인 번호를 출력한다.
- -w : 입력한 문자열이 독립된 단어로 존재하는 경우만 출력한다.

<br>

# grep 예제들
여러가지의 경우를 통해 사용 방법을 익혀보자. 아래와 같이 예시 파일(test.txt)이 있다고 가정하고 진행합니다.

<img class="post_image" width="520" alt="grep example file"
src="{{ site.baseurl }}/img/post/2018-07-20-grep-command-example-options-1.png"/>

<br>

#### 특정 단어(Opening)가 포함된 라인 찾기
```bash
$ grep 'Opening' test.txt
```

#### 특정 단어(Open)로 시작하는 라인 찾기
```bash
grep '^Open' test.txt
```

#### 특정 단어(up)로 끝나는 라인 찾기
```bash
grep 'up$' test.txt
```

#### 특정 단어(up)가 독립적으로 존재하는 라인 찾기
- cup과 같은 문자열은 검색되지 않음

```bash
grep -w 'up' test.txt
```

#### 특정 단어(a)와 바로 뒤 한글자로 이루어진 라인 찾기
- Ex) ab, ac, ad

```bash
grep 'a.' test.txt
```

#### 소문자가 아닌 대문자가 있는 라인 찾기
```bash
grep '[^a-z]' test.txt
```

#### 대문자, 소문자 그리고 공백 이후 소문자가 연이어 나오는 라인 찾기
```bash
grep '[A-Z][a-z] [a-z]' test.txt
```
  
#### 소문자 a가 나오고 바로 뒤에 b가 0번 또는 N번 나온 후에 공백이 연이어 나오는 라인 찾기
```bash
grep 'ab* ' test.txt'
```
  
#### OR 조건으로 찾기
- Ex) grep 'got\|to' test.txt (got 또는 to가 포함된 라인)

```bash
grep 'pattern1\|pattern2' test.txt
```
  
#### AND 조건으로 찾기
- grpe 명령어에는 AND 연산은 없지만 비슷하게 사용할 수 있다. 
- Ex) grep -E 'got.*to' test.txt (got 또는 to가 모두 포함된 라인) 

```bash
grep -E pattern1.*pattern2 test.txt
```
