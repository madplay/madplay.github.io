---
layout:   post
title:    자바의 데이터 타입
author:   Kimtaeng
tags: 	  java datatype
description: 자바 언어의 데이터 타입에는 무엇이 있을까?
category: Java
comments: true
---

# Java의 데이터 타입
자바에서는 변수의 타입에 따라 저장할 수 있는 값의 범위와 종류가 다릅니다. 변수의 타입은 크게 기본형(Primitive)과 참조형(Reference)으로
분류할 수 있는데 기본형 변수는 실제 값을, 참조형 변수는 값이 저장되어 있는 주소를 저장합니다.

조금 더 자세히 살펴보면!

| 종류 | 범위 | 크기(Byte) |
| :---: | :---: | :---: |
| boolean | true, false | 1 |
| char | /u0000 ~ /uffff <br/>(0~2^-1, 0 ~ 65535) | 2 |
| byte | -128 ~ 126 | 1 |
| short	| -32768 ~ 32767 <br/> (-2^15 ~ 2^15 -1) | 2 |
| int | -2147483648 ~ 2147483647 <br/> ( -2^31 ~ 2^31 -1) | 4
| long | -9223372036854775808 ~ 9223372036854775807 <br/> (-2^63 ~ 2^63 -1) | 8
| float | 1.4E-45 ~ 3.4028235E38 | 4 |
| double | 4.9E-324 ~ 1.7976931348623157E308 | 8 |




참조형의 경우 기본형을 제외한 나머지 타입, 객체의 주소를 말합니다.<br/>
그리고 new 키워드를 통하여 객체를 생성, 초기화 해야 합니다. <br/>
		
예를 들면, 아래와 같습니다.

```java
클래스이름 레퍼런스명 = new 클래스이름(); 
/* MadPlay instance = new MadPlay(); */		
```

<br/>

# String 클래스의 특징
한편 String 클래스는 실질적으로 말하면 참조형이지만 기본형처럼 사용 가능합니다. 즉, `String str = "madplay";` 이렇게 사용이 가능하지요.
물론 참조형이기 때문에 `String str = new String("madplay");` 도 가능합니다. 하지만 이런 경우 메모리 적재 장소가 다릅니다.

- <a href="/post/java-string-literal-vs-string-object" target="_blank">
참조 링크 : 자바의 String 리터럴과 String 객체의 차이는 무엇일까?</a>

기본형 데이터 타입의 개수는 위에서 살펴본 것처럼 총 8개이지만, 참조형의 경우 개발자가 직접 추가할 수 있기 때문에 개수가 정해져 있지 않습니다.
