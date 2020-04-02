---
layout:   post
title:    심볼릭 링크(symbolic link)
author:   Kimtaeng
tags: 	  linux symboliclink symlink 
description: 리눅스에서 파일이나 디렉터리에 대한 참조를 포함하는 특별한 종류의 파일인 심볼릭 링크는 무엇일까?
category: Knowledge
date: "2020-09-02 01:12:58"
comments: true
---

# 심볼릭 링크란
특정 파일이나 디렉터리에 대한 참조를 포함하는 특별한 파일이다. 간단하게 Windows 운영체제에서 '바로 가기' 와 같은 기능을
한다고 보면 된다.


<br>

# 사용법: 심볼릭 링크 생성
사용법은 간단하다. `link`라는 시스템 호출(system call)을 사용하는 `ln`이라는 명령어를 사용한다.
이 명령어에 `-s` 옵션이 지정되면 `symlink` 시스템 호출이 대신 사용되면서 심볼릭 링크가 생성된다.

```bash
$ ln -s [대상 경로] [링크 경로]
```

여기서 대상 경로는 심볼릭 링크가 가리키게 되는 상대 또는 절대 경로이며, 잘 사용하지 않겠지만 존재하지 않는 대상을
지정할 수도 있다. 예시를 통해 확인해보자

```bash
# 테스트할 `test.txt` 파일 생성
$ echo "hi" > test.txt

# 테스트 파일에 대한 `link_a` 심볼릭 링크 생성 
$ ln -s test.txt link_a
$ ls -l
lrwxrwxrwx  1 kimtaeng other    8 2020-09-02 18:39 link_a -> test.txt
-rw-r--r--  1 kimtaeng other    3 2020-09-02 18:38 test.txt
```

<br>

# 사용법: 심볼릭 링크 삭제
심볼릭 링크 삭제는 `rm` 명령어를 사용하면 된다. 참고로 삭제할 심볼릭 링크의 이름 끝에 `/`를 붙이게 되는 경우 삭제되지 않는다.

```bash
# 테스트할 `test` 디렉터리 생성
$ mkdir test

# 테스트 디렉터리에 대한 `link_sym` 심볼릭 링크 생성 
$ ln -s test link_sym

# 삭제 명령어 수행
$ rm link_sym/
rm: cannot remove `link_sym/': 디렉터리입니다

# `/`를 제거하고 삭제 명령어 수행
$ rm link_sym
```

여기서 주의할 점은 원본 디렉터리에 대한 심볼릭 링크를 삭제할 때 `-r`, `-f` 와 같은 옵션을 사용할 때이다.
아래와 같은 경우 원본 내의 파일들이 삭제될 수 있다.

```bash
# 테스트할 `test` 디렉터리 생성
$ mkdir test

# `test` 디렉터리 하위에 `test.txt` 파일 생성
$ echo "hi" > test/test.txt

# 테스트 디렉터리에 대한 `link_sym` 심볼릭 링크 생성 
$ ln -s test link_sym

# 삭제 명령어 수행
$ rm -r link_sym/
rm: cannot remove `link_sym': 디렉터리가 아닙니다

# `test` 디렉터리는 삭제되지 않았으나, 내부의 파일은 삭제됨
```

<br>

# 사용법: 심볼릭 링크 변경
심볼릭 링크를 추가한 다음에 변경하고 싶을 때는, 링크를 삭제한 후에 다시 생성하면 되지만
링크를 유지한 상태에서 가리키는 원본 대상만 변경하는 더 효율적인 방법이 있다. 

```bash
$ ln -Tfs [새로운 대상 경로] [변경할 심볼릭 링크]
```

이 중에서 `-s` 옵션을 제외한 나머지 옵션이 새롭다. 하나씩 살펴보면
`-T` 옵션의 경우 링크를 일반 파일로 취급하는 옵션이며, `-f` 옵션인 경우 기존 심볼릭 링크가 있는 경우
덮어쓰는 옵션이다. 이 옵션을 제외하는 경우, 이미 심볼릭 링크가 존재하는 경우 변경이 안된다.

테스트해보자.

```bash
# 테스트할 디렉터리 `test1`, `test2` 생성
$ mkdir test1 && mkdir test2

# `test1` 디렉터리에 대한 `link_a` 심볼릭 링크 생성
$ ln -s test1 link_a

$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:40 link_a -> test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2

# `test2` 디렉터리에 대한 `link_a` 심볼릭 링크 생성, 결과가 변경되지 않음.
$ ln -s test2 link_a
$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:40 link_a -> test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2

# `-Tfs` 옵션을 사용하여 원본 타겟 변경
$ ln -Tfs test2 link_a
$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:41 link_a -> test2
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2
```


<br>

# 하드 링크와 심볼릭 링크
`ln` 명령어를 사용할 때 사용한 `-s` 옵션을 사용하지 않는 경우 **하드 링크(hard link)**가 생성된다.
하드 링크의 경우는 원본과 동일한 `inode`를 가진다. 따라서 원본 파일이 삭제되더라도 사용 가능하다.

실제로 그러한지 아래와 같이 테스트해보면, 하드 링크의 경우 원본과 동일한 `inode` 값을 갖고 있는 것을
확인할 수 있다. 반면에 심볼릭 링크의 경우 원본 파일과 다른 값을 갖는다.

```bash
# 테스트할 `test.txt` 파일 생성
$ echo "hi" > test.txt

# 테스트 파일에 대한 `link_symbolic` 심볼릭 링크 생성 
$ ln -s test.txt link_symbolic

# 테스트 파일에 대한 `link_hard` 하드 링크 생성
$ ln text.txt link_ahrd 

# 현재 경로 출력 (inode 정보 포함)
$ ls -li
164888621 -rw-r--r-- 2 kimtaeng other 3 2020-09-02 18:42 link_hard
164888626 lrwxrwxrwx 1 kimtaeng other 8 2020-09-02 18:42 link_symbolic -> text.txt
164888621 -rw-r--r-- 2 kimtaeng other 3 2020-09-02 18:42 test.txt
```

여기서 원본 파일을 삭제해보자. 그리고 링크가 어떻게 동작하는지 확인해보면 그 차이를 정확히 알 수 있다.

```bash
$ rm test.txt

# 심볼릭 링크 
$ cat link_symbolic
cat: link_symbolic: 그런 파일이나 디렉터리가 없습니다

# 하드 링크
$ cat link_hard
hi
```

하드 링크가 생성된 순간부터는 디스크 상에서 같은 파일이라고 볼 수 있다. 한편, 예시에서는 원본/링크로 구분했으나
원본 자체도 디스크 상에서 실제 파일을 가리키는 하드 링크이기 때문에 원본/링크를 구분하는 것이 무의미할 수 있다.