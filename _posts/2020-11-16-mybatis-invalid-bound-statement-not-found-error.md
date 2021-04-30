---
layout:   post
title:    "MyBatis 오류: Invalid bound statement (not found)"
author:   Kimtaeng
tags:     mybatis
description: "마이바티스(MyBatis) 쿼리를 실행하는 순간 'Invalid bound statement (not found)' 오류가 발생한다면?" 
category: MyBatis
date: "2020-11-16 23:19:04"
comments: true
---

# 너무 흔하게 만날 수 있다.
이번 글에서는 마이바티스(MyBatis)를 사용하다가 한 번쯤은 만날 수 있는 
**org.apache.ibatis.binding.BindingException: Invalid bound statement (not found)** 에러의 해결 방법에 대해서 알아본다.

하나씩 살펴보면서 자신의 프로젝트 설정을 점검해보자.

<br>

# 왜 발생할까?
> 아래 나열된 내용 외에서 발견한 케이스가 있다면 댓글로 남겨주시면 다른 분들께 도움 될 것 같습니다 :)

## Mapper 인터페이스와 XML의 오타
기본적으로 Mapper 인터페이스와 XML에 오타가 있는지 확인해보자.

`<select>` 문 등에 선언하는 `id`에 오타가 있을 수도 있고, 선언되어 있는 `id`가 Mapper 인터페이스의 메서드명과 다른지 확인해보자.
인터페이스의 이름과 XML 파일에 선언된 이름이 달라서 생길 수도 있다.

아래와 같이 IDE에서 쉽게 발견하기 어려운 공백이 숨어있는 경우도 있다.

```xml
<!-- id에 공백이 있다. -->
<select id="select " resultTYpe="String">
    ...
</select>
```

<br>

## mapper-locations
쿼리가 작성되어 있는 mapper XML이 위치한 경로를 `application.properties`에 정의하지 않아서 또는 잘못 선언된 경우 발생할 수 있다.
정확한 경로는 프로젝트에 따라 변경해 주면 된다.

```properties
mybatis.mapper-locations:classpath:mapper/*.xml
```

<br>

## 동일한 이름, 다른 패키지 경로
Mapper의 이름이 같지만 패키지 이름이 달라서 인텔리제이나 이클립스에서 컴파일 오류가 발생하지 않는 경우다.
이런 경우 애플리케이션 구동 과정에서 오류가 발생하지 않으니 직접 확인해봐야 한다.

<br>

## yaml 파일 오타
설정파일을 `properties`가 아닌 `yaml` 파일에 작성할 수도 있다. 계층 구조여서 가독성이 보다 더 좋은 장점을 갖는다.
다만 작성법에 익숙하지 않은 경우 들여 쓰기를 잘못 적용할 수 있다.

예를 들어, 최상단에 선언된 `spring` 하위에 위치하는 것이 아니라 최상단에 `mybatis`가 위치해야 한다. 
설정 파일 내에서 잘못된 들여 쓰기로 다른 설정값이 정상적으로 읽히지 않을 수 있으므로 확인해보자.

<br>

## DataSource Configuration
DataSource를 설정하는 Configuration 클래스를 점검할 필요가 있다.

`SessionFactory`가 설정된 경우 `setMapperLocations` 메서드 등으로 Mapper XML의 위치를 선언할 텐데, 의도한 대로 잘 설정되어
있는지 확인해보자. `@MapperScan`이 선언된 경우에는 Mapper 인터페이스가 있는 위치와 일치한지 확인해보자.