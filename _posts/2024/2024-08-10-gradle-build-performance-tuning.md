---
layout: post
title: "Gradle 빌드 성능 튜닝: 5분 걸리던 빌드를 2분으로"
author: madplay
tags: gradle build-performance configuration-cache build-scan parallel
description: "Build Scan으로 Gradle 빌드 병목을 찾고, 병렬 실행과 캐시 설정으로 빌드 시간을 절반 이하로 줄이는 과정을 담았다."
category: Backend
date: "2024-08-10 21:22:51"
comments: true
---

# 빌드가 느린 건 알겠는데, 어디가 느린지 모르겠다

빌드가 느리다는 건 체감하지만, 컴파일이 느린 건지 테스트가 느린 건지 설정 단계에서 빠지는 건지는 잘 모른다.
Gradle의 성능 옵션은 각각 다른 병목에 대응하므로, 원인부터 찾아야 효과를 볼 수 있다.

> 이 글의 예제는 Gradle 8.x 기준이다. 대부분의 설정은 Gradle 7.x에서도 동작하지만, Configuration Cache는 Gradle 8.1 이상에서 안정적이다.

<br>

# Build Scan으로 병목 찾기

빌드 성능을 개선하려면 측정부터 해야 한다. Gradle은 `--scan` 옵션으로 빌드 프로파일링 리포트를 생성할 수 있다.

```bash
./gradlew build --scan
```

명령을 실행하면 빌드가 끝난 뒤 URL이 하나 출력된다. 이 링크를 브라우저에서 열면 Gradle Build Scan 대시보드가 나타난다.

## 타임라인 뷰에서 병목을 찾는 법

Build Scan의 타임라인(Timeline) 탭은 각 태스크가 언제 시작되어 얼마나 걸렸는지를 시각적으로 보여준다.
가로 막대가 유독 긴 태스크가 있다면 그것이 병목이다. 흔히 발견되는 패턴은 다음과 같다.

**컴파일 태스크 하나가 전체 빌드 시간의 절반 이상을 차지하는 경우.** 모듈 간 의존 관계 때문에 병렬 실행이 불가능한 구조일 가능성이 높다.
모듈 의존 그래프를 확인해서 불필요한 의존을 끊으면 병렬 실행 효과가 살아난다.

**테스트 태스크가 지나치게 오래 걸리는 경우.** 느린 통합 테스트가 단위 테스트와 같은 태스크에 묶여 있을 수 있다.
`test`와 `integrationTest`를 분리하면 로컬 빌드에서 불필요한 대기를 줄일 수 있다.

**Configuration 단계가 수 초 이상 소요되는 경우.** 뒤에서 다룰 Configuration Cache로 해결할 수 있는 영역이다.

<br>

# 병렬 실행으로 멀티 모듈 빌드 줄이기

Gradle은 기본적으로 태스크를 순차 실행한다.
모듈이 여러 개인 프로젝트에서는 서로 의존하지 않는 모듈의 태스크를 동시에 돌릴 수 있다.

```properties
# gradle.properties
org.gradle.parallel=true
```

이 한 줄이면 Gradle이 모듈 간 의존 관계를 분석하여, 독립적인 모듈의 태스크를 병렬로 실행한다.

## 어떤 프로젝트에서 효과가 클까?

병렬 실행의 효과는 모듈 간 의존 그래프의 모양에 달렸다.
`:app → :domain → :infrastructure`처럼 일직선 구조라면 어차피 순서대로 실행해야 하므로 효과가 제한적이다.
반면 `:api`, `:batch`, `:admin`이 각각 `:domain`에만 의존하는 부채꼴 구조라면,
세 모듈의 컴파일이 동시에 진행되어 빌드 시간이 크게 줄어든다.

워커 수는 기본적으로 CPU 코어 수만큼 생성되며, CI처럼 자원을 공유하는 환경에서는 `org.gradle.workers.max`로 조절할 수 있다.

<br>

# Configuration Cache

Gradle 빌드는 크게 세 단계로 나뉜다. 초기화(Initialization) → 설정(Configuration) → 실행(Execution).
설정 단계에서는 모든 `build.gradle.kts` 파일을 평가하여 태스크 그래프를 만든다.
모듈이 수십 개인 프로젝트에서는 이 과정만 수 초가 걸리기도 한다.

문제는 빌드 스크립트가 바뀌지 않았는데도 매 빌드마다 설정 단계를 처음부터 반복한다는 점이다.
Configuration Cache는 설정 단계의 결과를 캐싱하여, 스크립트에 변경이 없으면 캐시된 태스크 그래프를 재사용한다.

```properties
# gradle.properties
org.gradle.configuration-cache=true
```

## 실제로 얼마나 빨라질까?

설정 단계가 전체 빌드의 10~20%를 차지하는 프로젝트라면, 캐시 히트 시 그만큼이 통째로 사라진다.
모듈 수가 많을수록 절감 폭이 커진다. 모듈이 5개 미만인 소규모 프로젝트에서는 체감 차이가 크지 않을 수 있다.

## 호환되지 않는 플러그인 대응

Configuration Cache를 켜면 일부 플러그인에서 호환성 경고나 오류가 발생할 수 있다.
빌드 스크립트에서 `Task.project` 같은 API를 런타임에 접근하면 직렬화가 불가능하기 때문이다.

처음 도입할 때는 다음 옵션으로 문제가 되는 부분만 경고로 표시하면서 점진적으로 대응할 수 있다.

```properties
# gradle.properties
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn
```

플러그인 호환성은 Gradle 공식 문서의 Configuration Cache 섹션에서 확인할 수 있고,
주요 플러그인들은 최신 버전에서 대부분 호환성을 확보했다.

## buildSrc와 Configuration Cache

<a href="/post/gradle-version-catalog" target="_blank">Version Catalog 글</a>에서 다룬 것처럼,
`buildSrc`에 변경이 생기면 전체 빌드 캐시가 무효화된다.
Configuration Cache도 마찬가지로 `buildSrc` 변경 시 캐시가 무효화된다.
버전 관리를 `buildSrc`에서 Version Catalog(TOML)로 옮기면 이 문제를 완화할 수 있다.

<br>

# Build Cache

Build Cache는 태스크의 입력(소스 파일, 의존성, 컴파일러 옵션 등)이 동일하면 이전 실행 결과를 재사용하는 기능이다.
Configuration Cache가 설정 단계를 캐싱한다면, Build Cache는 실행 단계의 각 태스크 결과를 캐싱한다.

```properties
# gradle.properties
org.gradle.caching=true
```

## 로컬 캐시와 리모트 캐시

로컬 Build Cache는 `~/.gradle/caches/build-cache-1/` 디렉터리에 저장된다.
같은 머신에서 브랜치를 오가며 빌드할 때 효과가 있다.
기능 브랜치에서 작업하다 `main`으로 돌아왔을 때, 이미 캐싱된 태스크 결과를 재사용할 수 있다.

## 캐시가 무효화되는 흔한 원인들

Build Cache의 효과는 캐시 히트율에 달렸다.
히트율이 낮다면 다음 항목을 점검해 볼 필요가 있다.

**절대 경로 참조.** 빌드 스크립트나 태스크에서 절대 경로를 사용하면, 머신마다 경로가 달라서 캐시가 재사용되지 않는다.
Gradle은 상대 경로 정규화(path normalization)를 지원하므로, 가능하면 프로젝트 루트 기준 상대 경로를 사용한다.

**타임스탬프 포함.** 빌드 시각을 소스 코드에 주입하면 매 빌드마다 입력이 달라져서 캐시가 무효화된다.
빌드 번호나 타임스탬프는 최종 패키징 단계에서만 주입하는 편이 좋다.

**비결정적 태스크.** 같은 입력에 대해 다른 출력을 만드는 태스크가 있으면 캐시의 의미가 없다.
코드 생성 도구가 출력 순서를 보장하지 않는 경우가 대표적이다.

<br>

# Daemon과 JVM 튜닝

## Gradle Daemon

Gradle Daemon은 빌드가 끝난 뒤에도 JVM 프로세스를 유지하여, 다음 빌드 시 JVM 기동 시간을 절약한다.
로컬 개발 환경에서는 Gradle 3.0부터 기본으로 활성화되어 있어 별도 설정이 필요 없다.

CI 환경에서는 상황이 다를 수 있다.
빌드마다 새 컨테이너를 띄우는 CI라면 Daemon이 재사용될 기회가 없어서 오히려 기동 오버헤드만 추가된다.
이런 환경에서는 Daemon을 끄는 것이 나을 수 있다.

```properties
# CI용 gradle.properties
org.gradle.daemon=false
```

## JVM 메모리 설정

Gradle 빌드는 JVM 위에서 돌아가므로 힙 메모리 설정이 빌드 성능에 직접적인 영향을 준다.

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC
```

기본 힙 크기는 512MB인데, 모듈이 많거나 어노테이션 프로세싱이 무거운 프로젝트에서는 부족할 수 있다.
`OutOfMemoryError`가 발생하거나 GC 시간이 길어진다면 힙을 늘려볼 만하다.

다만 무작정 힙을 키우는 것이 능사는 아니다. Daemon 프로세스가 상주하므로 메모리를 과도하게 잡으면 로컬 머신의 다른 작업에 영향을 줄 수 있다.
Build Scan의 "Performance" 탭에서 GC 시간과 힙 사용량을 확인하고, 실제로 메모리가 부족한 경우에만 조정하는 편이 합리적이다.

<br>

# gradle.properties 한 파일로 모으기

지금까지 다룬 설정들을 프로젝트 루트의 `gradle.properties`에 모으면 다음과 같다.

```properties
# gradle.properties

# 병렬 실행
org.gradle.parallel=true

# Configuration Cache
org.gradle.configuration-cache=true

# Build Cache
org.gradle.caching=true

# JVM 튜닝
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC

# 파일 시스템 워칭 (Gradle 7.0+ 기본값)
org.gradle.vfs.watch=true
```

이 설정을 프로젝트에 커밋해 두면 팀 전원이 동일한 빌드 옵션을 사용하게 된다.
개인별로 다른 값을 쓰고 싶다면 `~/.gradle/gradle.properties`에 오버라이드할 수 있다.

<br>

# 돌아보며

옵션을 전부 켜는 것보다 중요한 건 자기 프로젝트의 빌드 프로필을 먼저 읽는 것이다.
병렬 실행은 모듈 구조에 따라, Configuration Cache는 설정 단계 비용에 따라, Build Cache는 반복 빌드 빈도에 따라 효과가 달라진다.
Build Scan 한 번 돌려보는 것이 튜닝의 출발점이라고 생각한다.
