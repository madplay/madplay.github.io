---
layout:   post
title:    Java의 문자열 replaceAll 메서드 $(dollar sign) 이슈
author:   Kimtaeng
tags: 	  Java String Replacement
description: Java에서 String replaceAll 메서드를 사용할 때 겪을 수 있는 이슈
category: Java
comments: true
---

# Java 에서 특정 문자열 내의 패턴을 치환하기

자바 언어에서는 아래와 같이 간단하게 문자열 내의 특정 문자열을 치환할 수 있습니다.
참고로 자바 1.5 버전 이상에서는 한 글자로 제한되었던 String의 replace 메서드가
문자열 시퀀스로도 적용이 가능하도록 변경되었지요.

```java
public class MadLife {
    private static final String SOURCE_STRING = "boy";
    private static final String REPLACEMENT_STRING = "girl";
    public void runCode() {
        String sourceStr = String.format("I am a %s", SOURCE_STRING);
        sourceStr = sourceStr.replace(SOURCE_STRING, REPLACEMENT_STRING);
        System.out.print(sourceStr); // I am a girl
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```

replace 메서드 말고도 replaceAll 메서드도 있는데 두 메서드의 차이는 아래와 같습니다.
```java
/* 문자열 시퀀스 */
public String replace(CharSequence target, CharSequence replacement)

/* 정규 표현식 입력 가능 */
public String replaceAll(String regex, String replacement) 
```

두 메서드의 차이를 비교해볼까요?
```java
public class MadLife {
    public void runCode() {
        String sourceStr = "abc";
        String replaceResult = sourceStr.replace("a.b?", "DEF");
        String replaceAllResult = sourceStr.replaceAll("a.b?", "DEF");

        System.out.println("replaceResult : " + replaceResult);
        System.out.println("replaceAllResult : " + replaceAllResult);
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```


위 코드의 실행 결과는 아래와 같습니다.
```
replaceResult : abc
replaceAllResult : DEFc
```

replace의 경우는 첫 번째 파라미터를 단순 문자열로 인식하지 두 번째 replaceAll의 경우는 첫 번째 파라미터를 단순 문자열이 아닌 정규 표현식으로 인식합니다.
<a href="https://regex101.com/" rel="nofollow" target="_blank">정규표현식 테스트(링크)</a>

<br/>


# replaceAll 메서드를 사용하다가 만날 수 있는 이슈

한편 replaceAll 메서드를 아래 코드와 같이 사용하면 에러 로그를 만날 수 있습니다.
```java
public class MadLife {
    private static final String SOURCE_STRING = "<MONEY>";
    private static final String REPLACEMENT_STRING = "$25";
    public void runCode() {
        String sourceStr = String.format("I have %s", SOURCE_STRING);
        sourceStr = sourceStr.replaceAll(SOURCE_STRING, REPLACEMENT_STRING);
        System.out.print(sourceStr); // expect "I have $25"
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```
```java
Exception in thread "main" java.lang.IndexOutOfBoundsException: No group 2
	at java.util.regex.Matcher.start(Matcher.java:374)
	at java.util.regex.Matcher.appendReplacement(Matcher.java:831)
	at java.util.regex.Matcher.replaceAll(Matcher.java:906)
	at java.lang.String.replaceAll(String.java:2162)
```

오류의 원인은 달러 기호(dollar sign) 때문인데요. Java API Docs에는 아래와 같이 설명이 있습니다.

<div class="post_caption">Note that backslashes (\) and dollar signs ($) in the replacement string may cause the results
to be different than if it were being treated as a literal replacement string; see Matcher.replaceAll.
Use Matcher.quoteReplacement(java.lang.String) to suppress the special meaning of these characters, if desired.</div>

<br/>

해결은 아래와 같이 replaceAll 메서드의 두 번째 파라미터인 sourceStr을 ```quoteReplacement``` 메서드로 한번 바꿔준다음에
넣어주면 됩니다.

```java
// static method
java.util.regex.Matcher.quoteReplacement(REPLACEMENT_STRING);
```

전체 소스 코드는 아래와 같이 변경됩니다.

```java
// static import
import static java.util.regex.Matcher.quoteReplacement;

public class MadLife {
    private static final String SOURCE_STRING = "<MONEY>";
    private static final String REPLACEMENT_STRING = "$25";
    public void runCode() {
        String sourceStr = String.format("I have %s", SOURCE_STRING);
        sourceStr = sourceStr.replaceAll(SOURCE_STRING, quoteReplacement(REPLACEMENT_STRING));
        System.out.print(sourceStr); // "I have $25"
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```

꼭 달러 기호가 필요하다면, 아래와 같이 사용도 가능합니다.
```java
import static java.util.regex.Matcher.quoteReplacement;

public class MadLife {
    public void runCode() {
        String sourceStr1 = "Hello#";
        // Okay
        sourceStr1 = sourceStr1.replaceAll("#", "\\$");
        System.out.println("sourceStr 1 : " + sourceStr1);

        String sourceStr2 = "Hello#";
        // Okay
        sourceStr2 = sourceStr2.replaceAll("#", quoteReplacement("$"));
        System.out.println("sourceStr 2 : " + sourceStr2);

        String sourceStr3 = "Hello#";
        // StringIndexOutOfBoundsException
        sourceStr3 = sourceStr3.replaceAll("#", "$");
        System.out.println("sourceStr 3 : " + sourceStr3);
    }

    public static void main(String[] args) {
        new MadLife().runCode();
    }
}
```