---
layout:   post
title:    "인텔리제이에서 JUnit5 @DisplayName 어노테이션이 동작하지 않을 때 해결하기"
author:   madplay
tags:    intellij junit5
description: "IntelliJ IDEA에서 JUnit5의 @DisplayName 어노테이션에 선언된 내용이 표기되지 않는 문제 해결방법"
category: Engineering
date: "2022-03-05 21:33:51"
comments: true
---

# `@DisplayName` 어노테이션
JUnit5에서는 `@DisplayName` 어노테이션을 사용하여 테스트 클래스나 각각의 테스트 메서드에 이름이나 설명을 넣을 수 있다.  

```java
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("클래스에도 선언할 수 있다.")
class FooClass {
	@Test
	@DisplayName("메서드에도 선언할 수 있다.")
	void barMethod() {
		System.out.println("barMethod");
	}
}
```

위 코드를 실행하면 아래와 같이 `@DisplayName` 어노테이션에 선언한 이름이 각각 표기된다. 쉽게 테스트를 구분할 수 있다.
~~물론 한글로 테스트 메서드 이름을 짓는 방법도 있지만...~~

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_normal-execution-result.png" width="650" alt="normal-execution-result"/>

<br>

# 동작이 안된다면?
그런데 `@DisplayName` 어노테이션을 적용했음에도 아래 사진처럼 실행 결과에 표기되지 않는 경우가 있다.
이 부분은 테스트 코드 실행이 인텔리제이 기본 설정인 `Gradle`로 실행돼서 발생하는 이슈인데, 실행 시 출력되는 로그를 통해서도 이를 유추할 수 있다.

> 2019.2 버전부터 기본값이 변경됐습니다. 자세한 내용은 하단 내용을 참고해 주세요. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_not-showing-display-name.png" width="700" alt="not-showing-display-name"/>

<br>

# 어떻게 해결할까?
> 해당 화면은 IntelliJ 2021.2 버전 기준이지만, 해당 옵션 설정은 다른 버전에서도 유사합니다. 

수정 방법은 간단하다. `Preferences` → `Build, Execution, Deployment` → `Build Tools` → `Gradle` 메뉴로 접속해서 아래와 같이
`Run tests using` 옵션을 IntelliJ IDEA로 변경하면 된다. 즉, 테스트 실행 기본값을 변경하는 것이다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-03-06-junit5-displayname-not-working-in-intellij_set-gradle-options.png" width="800" alt="set-gradle-options"/>

추가로 본인의 로컬 환경에서의 빌드와 실행 속도 향상을 위해서 `Build and run using` 옵션도 기본값인 Gradle이 아닌 IntelliJ IDEA로 변경해도 좋다.

<br>

# 왜 바뀌었을까?
해당 버전은 2019.2 버전에서 적용된 것을 공식 가이드를 통해서 확인할 수 있었는데 설명은 다음과 같다.

<div class="post_comments">
IntelliJ IDEA uses Gradle as a default test runner.
As an outcome, you get the same test results on the continuous integration (CI) server.
Also, tests that are run in the command line will always work in the IDE.
</div>

_"IntelliJ IDEA는 Gradle을 기본 테스트 실행기로 사용한다. 결과적으로 Continuous Integration(CI) 서버에서 동일한 테스트 결과를 얻을 수 있다.
또한 명령줄에서 실행되는 테스트는 항상 IDE에서 동작한다."_

자신의 로컬 환경에서는 코드가 잘 동작하지만, 배포를 하려고 하니까 정상적으로 동작하지 않는 경우를 방지하고자 기본 옵션을 변경한 것으로 보인다.

- <a href="https://www.jetbrains.com/help/idea/2019.2/work-with-tests-in-gradle.html#configure_gradle_test_runner" target="_blank" rel="nofollow">
IntelliJ IDEA 2019.2 버전 가이드</a>
