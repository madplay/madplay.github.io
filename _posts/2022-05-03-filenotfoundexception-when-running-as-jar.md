---
layout:   post
title:    "jar 파일로 실행할 때 FileNotFoundException"
author:   madplay
tags:    java jar filenotfoundexception
description: "자바에서 jar 파일로 실행할 때 FileNotFoundException이 발생하는 경우"
category: Java
date: "2022-05-03 01:21:55"
comments: true
---

인텔리제이(Intellij)나 이클립스(Eclipse)와 같은 로컬 IDE 환경에서는 잘 실행되던 파일 입출력 관련 코드가 패키징 된 Jar 파일에서 실행될 때는
`FileNotFoundException`이 발생하며 정상적으로 실행되지 않는 경우가 있다. 

해결 방법은 아래와 같이 수정하면 된다.

### 변경 전 코드
```java
File file = new ClassPathResource("파일 경로").getFile()
```

### 변경 후 코드
```java
InputStream inputStream = new ClassPathResource("파일 경로").getInputStream()
File file = File.createTempFile("파일 이름", "확장자");

// 파일에 스트림 내용을 복사한다.
// `copyInputStreamToFile`는 commons-io 라이브러리에 포함되어 있다.
FileUtils.copyInputStreamToFile(inputStream, file);

// 또는 NIO를 사용할 수도 있다.
Files.copy(inputStream, file.toPath());

// 파일이 이미 있어서 오류가 나는 경우는 아래 옵션 추가
Files.copy(inputStream, file.toPath(), StandardCopyOption.REPLACE_EXISTING);
```

원인은 실행 환경의 차이에 있다. 자바의 `Resource` 인터페이스의 구현체인 `ClassPathResource` 클래스를 사용해서 경로를 출력해 보면 금방 이유를 확인할 수 있다. 

```java
// 로컬에서 실행하는 경우 
ClassPathResource classPathResource = new ClassPathResource("파일경로");

// IDE에서 실행했을 때와 jar 환경에서 실행했을 때의 결과가 다르다.
System.out.println("URL: " + classPathResource.getURL());
```

로컬에서 실행하는 경우 `file:`이지만  Jar 환경에서는 `jar:` 실행되는 URL이 반환되는 것을 알 수 있다.
