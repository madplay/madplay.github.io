---
layout:   post
title:    "Gradle 프로젝트 구조와 Gradle Wrapper"
author:   Kimtaeng
tags: 	  java gradle
description: "Gradle 기반 프로젝트의 구조와 Gradle 설치 없이도 빌드를 할 수 있도록 해주는 Gradle Wrapper를 알아보자."
category: Knowledge
date: "2018-08-19 00:11:46"
comments: true
---

# Gradle
앞선 글에서는 Ant`의 장점과 `Maven`의 단점을 보완한 그래들(Gradle)에 대해서 알아보았다. 이번 글에서는 Gradle 프로젝트를 생성하는
방법과 생성된 프로젝트의 구조 그리고 Gradle이 설치되지 않은 환경에서도 프로젝트를 빌드 할 수 있도록 해주는 Gradle Wrapper에 대해서 알아본다.

- <a href="/post/what-is-gradle" target="_blank">링크 참고: Gradle이란 무엇일까?</a>

<br>

# 프로젝트 초기화
그래들 프로젝트는 `init` 명령을 통해 시작할 수 있다. 이 명령어를 실행하면 현재 위치에 Gradle 관련 기본 파일이 자동으로 생성된다.
생성할 때는 `--type` 옵션으로 프로젝트 타입을 지정할 수 있다. 

### 프로젝트 타입
- `basic`: 기본 타입이다. `--type` 옵션을 주지 않으면 기본적으로 지정된다.
- `java-application`: 자바 애플리케이션 프로젝트 타입이다. 기본적으로 `App.java`가 만들어진다.
- `java-library`: 자바 라이브러리 프로젝트 타입이다.
- `groovy-application`: Groovy 애플리케이션 프로젝트이다.
- 그 밖에도 `scala-library`, `pom` 등이 있다.

```bash
$ gradle init --type java-application

BUILD SUCCESSFUL in 7s
2 actionable tasks: 2 executed
```

예제에서는 간단한 자바 프로젝트 생성을 위해 `--type` 옵션으로 자바 애플리케이션 프로젝트로 지정했다. 기본적으로 `App.java` 파일이 생성된다.

```java
/*
 * This Java source file was generated by the Gradle 'init' task.
 */
package temp;

public class App {
    public String getGreeting() {
        return "Hello world.";
    }

    public static void main(String[] args) {
        System.out.println(new App().getGreeting());
    }
}
```

간단하게 빌드 후 실행해보자. 빌드는 `build` 명령어를 통해 실행하며 자바 실행은 `java` 명령어에 `-jar` 옵션을 주면 된다.
빌드를 진행하면 `jar` 파일이 `build/libs` 경로 밑에 생성된다.

```bash
# 프로젝트 빌드
$ gradle build

BUILD SUCCESSFUL in 1s
7 actionable tasks: 7 executed

# jar 파일 실행
$ java -jar build/libs/temp.jar
build/libs/temp.jar에 기본 Manifest 속성이 없습니다.
```

그런데 실행하면 `Manifest` 속성이 없다는 오류가 발생한다. `build.gradle` 파일 하단에 `manifest` 속성을 선언해야 한다.
실행 가능한(excutable) `jar` 파일을 만드는 것과 같다.

```java
jar {
    manifest {
        attributes 'Main-Class': 'temp.App'
    }
}
```

`build.gradle` 파일을 수정한 후에 다시 빌드, 실행하면 된다.

```bash
# 프로젝트 빌드
$ gradle build

BUILD SUCCESSFUL in 625ms
7 actionable tasks: 7 up-to-date

# jar 파일 실행
$ jar -jar build/libs/temp.jar
Hello world.
```

<br>

# Gradle Wrapper
Gradle을 사용하려면 기본적으로 로컬 환경에 설치된 상태여야 한다. 특히 기존 프로젝트를 빌드 할 때는 자바 버전을 맞춰야 하는 경우가 있다.
하지만 `Gradle Wrapper`를 사용하면 Gradle 설치나 Java 버전에 상관없이 프로젝트를 빌드할 수 있다.

`Gradle Wrapper`는 Gradle이 설치되지 않아도 Gradle Task를 실행할 수 있도록 해준다. 이를 통해 빌드 하게 되면 프로젝트와
동일한 버전의 Gradle을 사용할 수 있다. 따라서 **Gradle Wrapper 사용이 권장**된다.

예시로 앞서 생성한 Gradle 프로젝트를 다른 자바 버전에서 빌드를 한다고 해보자. `gradle build`를 사용하면 기본적으로 로컬에 설치된
Gradle을 사용하게 된다.

```bash
# 프로젝트 빌드
$ gradle build

BUILD SUCCESSFUL in 625ms
7 actionable tasks: 7 up-to-date

# jar 파일 실행
$ java -jar build/libs/temp.jar
Error: A JNI error has occurred, please check your installation and try again
Exception in thread "main" java.lang.UnsupportedClassVersionError:
  temp/App has been compiled by a more recent version of the Java Runtime (class file version 57.0),
  this version of the Java Runtime only recognizes class file versions up to 52.0
```

이러한 상황에서 `Gradle Wrapper`를 이용해보자. 래퍼를 이용한 빌드는 `./gradlew build`를 입력하면 된다.

```bash
# 프로젝트 빌드
$ ./gradlew build

BUILD SUCCESSFUL in 1s
7 actionable tasks: 6 executed, 1 up-to-date

# jar 파일 실행
$ java -jar build/libs/temp.jar
Hello world.
```

실행 결과처럼 프로젝트의 버전과 다를 때 발생할 수 있는 이슈를 해결할 수 있다.


<br>

# 프로젝트 구조
Gradle 관련 파일이 생성된 디렉터리에서 `tree` 명령어를 통해 프로젝트 구조를 확인해보자.
아래와 같은 구성을 확인할 수 있다.

```bash
$ tree
.
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── temp
    │   │       └── App.java
    │   └── resources
    └── test
        ├── java
        │   └── temp
        │       └── AppTest.java
        └── resources
```

## build.gradle
Gradle의 기본 빌드 파일이다. 이 파일에 프로젝트의 빌드에 대한 내용을 명시한다.

## gradle/wrapper/gradle-wrapper.jar
`Gradle Wrapper` 파일이다. `gradlew` 명령어로 프로젝트를 빌드 할 때 이 파일을 참조하여 설정 파일을 구성하므로
`gradle build`와 다르게 새로운 환경에 대한 영향이 없다.

## gradle/wrapper/gradle-wrapper.properties
`Gradle Wrapper` 설정 파일이다.

## gradlew
Unix용 실행 스크립트이다.

## gradlew.bat
Windows용 실행 스크립트이다.

## settings.gradle
프로젝트의 설정 정보 파일이다. 멀티 프로젝트를 구성할 때 하위 프로젝트들과의 관계를 여기서 서술해야 한다.
명시된 정보를 기준으로 프로젝트를 구성하게 된다.

## src 폴더
프로젝트의 소스 폴더가 된다. `src/main/java`와 `src/main/test` 디렉터리 이름처럼
구조를 보면 `maven`과 동일하다.