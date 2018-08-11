---
layout:   post
title:    "Gradle이란 무엇일까?"
author:   Kimtaeng
tags: 	  java gradle
description: "그루비(Grrovy)를 기반으로 한 빌드 자동화, 개발 지원에 중점을 둔 빌드 도구인 그래들(Gradle)에 대해서 알아보자"  
category: Knowledge
date: "2018-08-12 21:23:12"
comments: true
---

# Gradle은 무엇인가?
그래들(이하 Gradle)은 그루비(Groovy)를 기반으로 한 빌드 도구이다.
`Ant`와 `Maven`과 같은 이전 세대 빌드 도구의 단점을 보완하고 장점을 취합하여 만든 오픈소스로 공개된 빌드 도구이다.

- <a href="https://github.com/gradle/gradle" target="_blank" rel="nofollow">
참고 링크: Gradle (github)</a>

## Ant
- XML 기반으로 빌드 스크립트를 작성한다.
- 자유롭게 빌드 단위를 지정할 수 있다.
- 간단하고 사용하기 쉽다.
- 유연하지만 프로젝트가 방대해지는 경우 스크립트 관리나 빌드 과정이 복잡해진다.
- 생명주기(Lifecycle)을 갖지 않아 각각의 결과물에 대한 의존관계 등을 정의해야 한다.

## Maven
- XML 기반으로 작성한다.
- 생명주기(Lifecycle)와 프로젝트 객체 모델(POM, Project Object Model)이란 개념이 도입됐다.
- Ant의 장황한 빌드 스크립트를 개선했다.
- `pom.xml`에 필요한 라이브러리를 선언하면 자동으로 해당 프로젝트로 불러와 편리하다.
- 상대적으로 학습 장벽이 높다.
- 라이브러리가 서로 의존하는 경우 복잡해질 수 있다.

<br><br>

# Gradle의 특징
Gradle은 앞서 살펴본 `Ant`와 `Maven`이 가진 장점을 모아 만들었다. 의존성 관리를 위한 다양한 방법을 제공하고
빌드 스크립트를 XML 언어가 아닌 JVM에서 동작하는 스크립트 언어 '그루비' 기반의 DSL(Domain Specific Language)를 사용한다.

**그루비(Groovy)**는 자바 문법과 유사하여 자바 개발자가 쉽게 익힐 수 있는 장점이 있으며 `Gradle Wrapper`를 이용하면
Gradle이 설치되지 않은 시스템에서도 프로젝트를 빌드할 수 있다.

심지어 메이븐(Maven)의 `pom.xml`을 Gradle 용으로 변환할 수도 있으며 Maven의 중앙 저장소도 지원하기 때문에
라이브러리를 모두 그대로 가져다 사용할 수 있다.

<br><br>

# Gradle 사용해보기
사실 Gradle을 반드시 설치하지 않아도 된다. 앞서 살펴본 특징처럼 `Gradle`이 설치되어 있지 않아도 `Gradle Wrapper`를 통해서
사용할 수 있기 때문이다. 하지만 기본적인 사용법을 알아보기 위해 설치를 해보자.

## Gradle 설치
MacOS 기준으로 간단하게 `brew`를 이용하면 간편하다. 주의할 것은 설치된 `JDK` 또는 `JRE` 버전이 8 이상이어야 한다.

```bash
$ brew install gradle
```

## build.gradle
설치가 완료되면 빌드 파일인 `build.gradle` 파일을 생성해보자. `build.gradle` 파일은 빌드 스크립트라고 하며
엄밀히 말하면 빌드 구성 스크립트(Build Configuration Script)라고 한다.

의존성이나 플러그인 설정 등과 같은 빌드에 필요한 설정을 하게 된다.

## task 작성
그럼 지금부터 Gradle의 실행 작업 단위인 `태스크(task)`를 사용해보자. Gradle은 기본적으로 태스크를 구성하여 실행하며,
태스크를 구성하고 작성하는 것이 빌드 스크립트를 작성하는 과정이다.

`task`는 아래와 같은 구조를 작성하면 된다.

```bash
task 태스크이름 {
    ... 작업들
}
```

문자열을 출력하는 간단한 태스크를 작성해보자. `build.gradle` 파일에 아래와 같이 작성해주면 된다.

```bash
task sayHello {
    println 'Hello Taeng'
}
```

## task 실행
실행은 터미널에서 `gradle 태스크이름`으로 형태로 입력하면 된다. `gradle` 명령어를 사용하면 현재 위치한 경로에서 `build.gradle` 파일을
찾는다. 실행할 때 `-q(quiet)` 옵션을 주면 오류에 대한 로그만 출력한다.

```bash
$ gradle sayHello

gradle sayHello

> Configure project :
Hello Taeng

BUILD SUCCESSFUL in 609ms


# -q 옵션을 준 경우
$ gradle -q sayHello
Hello Taeng
```

<br><br>

# 더 자세한 task 활용법
## doFirst, doLast
태스크 내부에서 순서를 지정하고 싶을 때 사용한다. `doFirst`는 가장 처음 수행하는 액션이고 `doLast`는 가장 마지막에 수행하는 액션이다.
태스크는 구성된 액션을 순서대로 실행한다.

```bash
task greeting {
    doFirst {
        println 'hello'
    }

    doLast {
        println 'bye'
    }
}
```

### 실행결과
```bash
$ gradle greeting

> Task :greeting
hello
bye
BUILD SUCCESSFUL in 598ms
1 actionable task: 1 executed
```

<br>

## task 축약형
> leftshift 연산자는 `Gradle 5.0` 에서 제거되었다.

태스크는 아래와 같이 축약한 형태로 작성할 수 있다. `<<`는 `doLast`와 동일하다.

```bash
task hello << {
    println 'Hello world!'
}
```

<br>

## task와 파라미터
태스크를 실행할 때 `-P파라미터이름=값`을 이용하여 파라미터를 전달할 수 있다.

```bash
task sayHi {
    def loopCount = count.toInteger()
    for(def i in 1..loopCount) {
        println('LoopCount: ' + i)
    }
}
```

### 실행결과
```bash
$ gradle -q sayHi -Pcount=3
LoopCount: 1
LoopCount: 2
LoopCount: 3
```

<br>

## task간 의존성 설정
태스크가 실행될 때 의존성을 지정하여 태스크의 실행 순서를 지정할 수 있다. `dependsOn`를 사용하여 먼저 실행할 태스크를 지정할 수 있다.

```bash
task AAA(dependsOn:['BBB', 'CCC']) {
    doFirst {
        println('doFirst: AAA')
    }
    doLast {
        println('doLast: AAA')
    }
}

task BBB {
    doFirst {
        println('doFirst: BBB')
    }
    doLast {
        println('doLast: BBB')
    }
}

task CCC {
    doFirst {
        println('doFirst: CCC')
    }
    doLast {
        println('doLast: CCC')
    }
}
```

### 실행 결과
```bash
$ gradle AAA

> Task :BBB
doFirst: BBB
doLast: BBB

> Task :CCC
doFirst: CCC
doLast: CCC

> Task :AAA
doFirst: AAA
doLast: AAA

BUILD SUCCESSFUL in 603ms
3 actionable tasks: 3 executed
```

<br>

## 다른 task 호출하기
> execute는 `Gradle 5.0` 에서 제거되었다.

```bash
task sayHi {
    doFirst {
        println('say Hi')
        tasks.sayBye.execute()
    }
}

task sayBye {
    doLast {
        println('say Bye')
    }
}
```

### 실행 결과
```bash
$ gradle sayHi -q
say Hi
say Bye
```

<br>

## 사용자 정의 메서드
직접 메서드를 정의하여 사용할 수 있다.

```bash
task methodTask {
    printMessage('say Hi')
}
 
String printMessage(String msg) {
    println msg
}
```

### 실행 결과
```bash
$ gradle methodTask

> Configure project :
say Hi

BUILD SUCCESSFUL in 593ms
```

<br>

## 사용자 정의 변수
메서드뿐만 아니라 변수를 정의하여 사용할 수 있다.
```bash
task someTask {
    ext.message = 'say Hi'
}
 
task sayHi {
    println someTask.message
}
```

### 실행 결과
```bash
$ gradle -q sayHi
say Hi
```