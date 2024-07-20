---
layout: post
title: "Gradle Version Catalog로 의존성을 한곳에서 관리하는 방법"
author: madplay
tags: gradle version-catalog toml dependency-management kotlin
description: "Gradle Version Catalog의 TOML 구조와 type-safe 접근자 사용법, 기존 프로젝트 마이그레이션 전략을 다룬다."
category: Backend
date: "2024-07-20 23:14:21"
comments: true
---

# 멀티 모듈 프로젝트의 의존성 버전 문제

모듈이 서너 개일 때는 각 `build.gradle.kts`에 버전을 직접 적어도 큰 문제가 없다.
그런데 모듈이 열 개를 넘기 시작하면 이야기가 달라진다.
Spring Boot를 3.3에서 3.4로 올리려는데, 어느 모듈에 어떤 버전이 박혀 있는지 하나하나 찾아다녀야 한다.
Gradle의 version catalog는 이런 상황에서 버전 문자열을 한 파일로 모아 관리하는 기능이다.

<a href="/post/what-is-gradle" target="_blank">Gradle의 기본 개념</a>에 익숙하다면
`ext` 블록이나 `buildSrc`를 떠올릴 수 있다. `ext` 블록은 루트 `build.gradle.kts`에 변수를 선언하고 서브모듈에서 참조하는 방식인데,
문자열 기반이라 IDE 자동완성이 되지 않고 오타를 컴파일 시점에 잡아주지 못한다.
`buildSrc`는 타입 안전성은 확보되지만, 의존성 하나를 추가할 때마다 Kotlin 파일을 열어 코드를 수정해야 하고
변경이 생기면 `buildSrc` 전체가 다시 컴파일되어 빌드 캐시 무효화를 유발한다.

Version Catalog는 TOML 파일 하나에 버전을 선언하면 Gradle이 type-safe 접근자를 자동 생성해 준다.
`ext`의 편의성과 `buildSrc`의 타입 안전성을 동시에 취할 수 있는 셈이다.

<br>

# Version Catalog란

Version Catalog는 프로젝트에서 사용하는 라이브러리, 플러그인, 버전 정보를 한 파일에 선언하고
Gradle이 그 선언을 기반으로 type-safe 접근자를 자동 생성해 주는 기능이다.

핵심 아이디어는 버전 정보가 존재하는 곳을 딱 한 곳으로 만드는 것이다.
각 모듈의 `build.gradle.kts`에는 버전 문자열이 사라지고, 대신 `libs.spring.boot.starter.web`처럼
카탈로그가 생성한 접근자만 남는다. 버전을 올려야 할 때는 카탈로그 파일 한 곳만 수정하면 모든 모듈에 반영된다.

기존 방식과 비교하면 위치가 명확하다.
`ext` 블록은 `build.gradle.kts` 안에 섞여 있고, `buildSrc`는 Kotlin 코드로 감싸져 있지만,
Version Catalog는 TOML이라는 독립적인 선언 파일을 사용한다.
빌드 스크립트와 버전 정보가 물리적으로 분리되므로, 버전 변경이 빌드 로직에 영향을 주지 않는다.

<br>

# libs.versions.toml 파일 구조

Version Catalog의 기본 파일은 프로젝트 루트의 `gradle/libs.versions.toml`이다.
TOML은 키-값 쌍과 섹션으로 이루어진 설정 파일 포맷으로, YAML이나 JSON보다 문법이 단순하다.
Gradle은 이 경로의 TOML 파일을 자동으로 인식하므로 별도 설정 없이 바로 사용할 수 있다.
파일은 네 개의 섹션으로 구성된다.

> 이 글의 코드는 Gradle 8.x, Kotlin DSL 기준이다. Version Catalog는 Gradle 7.0에서 실험 기능으로 도입되었고 7.4에서 안정화되었다.

```toml
[versions]
spring-boot = "3.4.1"
kotlin = "2.1.0"
jackson = "2.18.2"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test", version.ref = "spring-boot" }
jackson-module-kotlin = { module = "com.fasterxml.jackson.module:jackson-module-kotlin", version.ref = "jackson" }
kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib", version.ref = "kotlin" }

[bundles]
spring-web = ["spring-boot-starter-web", "jackson-module-kotlin", "kotlin-stdlib"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
```

`[versions]`에는 재사용할 버전 문자열을 선언한다. `[libraries]`는 라이브러리의 좌표(group:artifact)와 버전을 연결하고,
`[bundles]`는 여러 라이브러리를 묶어 한 번에 의존성을 추가할 수 있게 한다. `[plugins]`는 Gradle 플러그인 버전을 관리한다.

## 라이브러리 선언 표기법

위 예제에서 사용한 `module` + `version.ref` 외에도 두 가지 표기법이 더 있다.

`module`에 버전을 직접 지정하는 방식은 해당 라이브러리만 독립적인 버전을 가질 때 간결하다.

```toml
guava = { module = "com.google.guava:guava", version = "33.4.0-jre" }
```

`group`, `name`, `version.ref`를 분리하는 방식도 있지만, 줄이 길어져서 실무에서는 잘 쓰이지 않는다.

```toml
jackson-module-kotlin = { group = "com.fasterxml.jackson.module", name = "jackson-module-kotlin", version.ref = "jackson" }
```

<br>

# build.gradle.kts에서 카탈로그 사용하기

TOML 파일에 선언한 내용은 `libs`라는 이름의 카탈로그 객체를 통해 접근한다.
IDE에서 `libs.`까지 입력하면 자동완성 목록이 나타나므로 오타 걱정 없이 의존성을 추가할 수 있다.

```kotlin
plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
}

dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.kotlin.stdlib)
    testImplementation(libs.spring.boot.starter.test)
}
```

`plugins` 블록에서는 `alias()` 함수로 카탈로그의 플러그인을 참조한다.
`dependencies` 블록에서는 `libs.` 뒤에 TOML에서 선언한 이름을 그대로 이어 붙이면 된다.

## 하이픈과 점, 접근자 이름은 어떻게 변환될까?

TOML의 라이브러리 키에 사용한 하이픈(`-`)과 점(`.`)은 Kotlin 접근자에서 모두 점(`.`)으로 변환된다.
예를 들어 TOML에서 `spring-boot-starter-web`으로 선언하면 코드에서는 `libs.spring.boot.starter.web`으로 접근한다.
밑줄(`_`)은 변환 없이 그대로 유지되므로, 계층을 구분하고 싶다면 하이픈이나 점을 쓰고
하나의 단어로 묶고 싶다면 밑줄을 쓰면 된다.

```text
TOML 키                      → Kotlin 접근자
spring-boot-starter-web      → libs.spring.boot.starter.web
jackson-module-kotlin        → libs.jackson.module.kotlin
kotlin_stdlib                → libs.kotlinStdlib
```

<br>

# 번들로 의존성을 묶으면 무엇이 달라질까?

번들은 자주 함께 쓰이는 라이브러리를 하나의 이름으로 묶는 기능이다.
앞서 TOML에서 `spring-web` 번들을 선언했는데, `build.gradle.kts`에서는 이렇게 사용한다.

```kotlin
dependencies {
    implementation(libs.bundles.spring.web)
}
```

이 한 줄로 `spring-boot-starter-web`, `jackson-module-kotlin`, `kotlin-stdlib` 세 라이브러리가 모두 추가된다.
모듈마다 같은 의존성 조합을 반복해서 나열할 필요가 없어진다.

다만 번들에는 한계가 있다. 번들에 포함된 특정 라이브러리에만 `exclude`를 적용하려면 번들을 풀어서 개별 선언해야 한다.
번들은 "이 라이브러리들은 항상 함께 쓴다"는 의미가 명확할 때 사용하고,
세밀한 의존성 제어가 필요한 경우에는 개별 선언이 더 적합하다.

<br>

# 플러그인 버전도 카탈로그에서 관리하기

플러그인 버전이 `build.gradle.kts`마다 흩어져 있으면 라이브러리 버전과 같은 문제가 생긴다.
`[plugins]` 섹션에 플러그인 ID와 버전을 선언해 두면, `plugins` 블록에서 `alias()`로 참조할 수 있다.

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
```

<a href="/post/the-structure-of-the-gradle-project" target="_blank">Gradle 프로젝트 구조</a>에서 다룬 것처럼,
`settings.gradle.kts`의 `pluginManagement` 블록은 플러그인 저장소를 지정하는 역할을 한다.
Version Catalog의 `[plugins]` 섹션과 함께 사용하면 플러그인의 저장소와 버전을 모두 중앙에서 관리할 수 있다.

한 가지 주의할 점은, `settings.gradle.kts`의 `plugins` 블록에서는 카탈로그 접근자를 사용할 수 없다는 것이다.
카탈로그는 `settings.gradle.kts`가 평가된 뒤에 생성되기 때문이다.
`settings.gradle.kts`에 플러그인을 적용해야 하는 경우에는 버전을 직접 명시해야 한다.

<br>

# 기존 프로젝트를 Version Catalog로 옮기려면

이미 운영 중인 프로젝트에서 Version Catalog를 도입할 때는 점진적으로 진행하는 편이 안전하다.

## 단계별 마이그레이션 전략

첫 번째 단계는 `gradle/libs.versions.toml` 파일을 생성하고, 현재 프로젝트에서 사용하는 라이브러리와 플러그인의 버전을 옮겨 적는 것이다.
이 시점에서는 기존 `build.gradle.kts`를 수정하지 않는다. TOML 파일만 추가한 상태에서 빌드가 정상 동작하는지 확인한다.

두 번째 단계는 `build.gradle.kts`에 하드코딩된 버전 문자열을 카탈로그 접근자로 교체하는 것이다.
모듈 하나씩 바꿔가며 매번 빌드를 돌려 보는 것이 좋다. 한꺼번에 모든 모듈을 수정하면 문제가 생겼을 때 원인을 찾기 어렵다.

세 번째 단계는 더 이상 필요 없는 `ext` 블록이나 `buildSrc`의 버전 상수를 제거하는 것이다.
이 순서를 지키면 중간에 빌드가 깨지더라도 원인을 빠르게 좁힐 수 있다.

## buildSrc와는 어떤 관계일까?

도입부에서 언급한 것처럼 `buildSrc`는 타입 안전하지만 변경 시 전체 재컴파일과 캐시 무효화 비용이 크다.
Version Catalog는 버전 선언에 특화되어 있어서 TOML 파일만 수정하면 되고, 빌드 캐시에 미치는 영향도 작다.

둘은 배타적인 관계가 아니다. `buildSrc`에서 convention plugin으로 빌드 로직을 관리하면서
버전 정보만 TOML로 분리하는 조합도 가능하다.
버전 관리만 필요하다면 Version Catalog 하나로 충분하고, 빌드 로직 재사용이 필요하면 `buildSrc`와 함께 쓰면 된다.

<br>

# 주의할 점과 한계

Version Catalog에도 몇 가지 제약이 있다.

Gradle 7.0 미만에서는 사용할 수 없다. Gradle Wrapper 버전이 오래되었다면 먼저 업그레이드해야 한다.

TOML 문법 오류가 발생하면 Gradle이 표시하는 에러 메시지가 다소 모호할 수 있다.
따옴표 누락, 콤마 대신 공백 사용 등 사소한 실수가 원인인 경우가 많다.

추가 카탈로그를 만들 때는 `libs`라는 이름을 피해야 한다. 기본 카탈로그에 이미 예약되어 있기 때문이다.

Spring Boot처럼 BOM(Bill of Materials)을 사용하는 프레임워크와도 함께 쓸 수 있다.
BOM이 관리하는 라이브러리는 TOML에서 `version`을 생략하고 좌표만 선언하면 된다.

```toml
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
```

<br>

# 정리하며

Gradle 생태계에서 의존성 버전 관리는 `ext` 블록 → `buildSrc` → Version Catalog 순으로 발전해 왔다.
`ext`는 간편하지만 타입 안전성이 없고, `buildSrc`는 타입 안전하지만 빌드 캐시 비용이 크다.
Version Catalog는 TOML 파일 하나로 두 가지 문제를 해결하면서도 도입 비용이 낮다.

새 프로젝트를 시작한다면 처음부터 `gradle/libs.versions.toml`을 만들어 두는 편이 좋다.
기존 프로젝트라면 모듈 하나씩 점진적으로 옮기면서 팀이 새 방식에 적응할 시간을 확보하는 것이 현실적이다.
결국 중요한 것은 "버전 정보가 한곳에만 존재하는가"라는 원칙이고, Version Catalog는 그 원칙을 가장 낮은 비용으로 실현하는 도구가 아닐까 싶다.
