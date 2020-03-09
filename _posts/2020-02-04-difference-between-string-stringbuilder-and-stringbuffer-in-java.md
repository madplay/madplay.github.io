---
layout:   post
title:    "자바 String, StringBuilder 그리고 StringBuffer 성능 차이 비교"
author:   Kimtaeng
tags: 	  java string stringbuilder stringbuffer
description: "자바에서 String과 StringBuilder 그리고 StringBuffer의 차이는 무엇일까? 그리고 제일 빠른 연산 속도는 어떤 것일까?"
category: Java
date: "2020-02-04 00:06:02"
comments: true
---

# String은 immutable하다.
자바에서 문자열을 다룰 때 사용하는 **String은 불변**이다. 그래서 한 번 생성되면 변경될 수 없다.
조금 더 정확히 얘기하면 문자열이 할당된 메모리 공간이 변하지 않는다.

그러니까 문자열에 `+ 연산자` 등을 이용하여 다른 문자열을 추가할 때 기존 문자열에 새로운 문자열이 추가되는 것이 아니라
새로운 **문자열 객체를 만들고 그 객체를 참조**하게 한다. 따라서 레퍼런스가 가리키고 있던 문자열이 다른 문자열로 대체되면,
기존 문자열은 레퍼런스의 참조가 사라져 `Unreachable`  상태가 되어 가비지 컬렉션(Garbage Collection) 대상이 된다.

이러한 이유로 String을 조작하는 연산은 시간과 자원(메모리)를 사용한다.

<br/>

# StringBuilder와 StringBuffer
`StringBuilder`와 `StringBuffer`는 자바에서 String 관련 주제를 다룰 때 자주 등장한다. 가변의 속성을 가지고 있다는 점이 불변인 String과
비교되는 큰 차이다. 이 둘은 문자열을 한 번 만들고 연산이 필요할 때마다 크기를 변경해가며 문자열을 변경한다. 따라서 변경될 때마다 새롭게 객체를 만드는
String 보다 더 빠르다.

그렇다면 **StringBuilder와 StringBuffer의 차이는 무엇일까?** 바로 동기화에 있다. StringBuilder의 경우 동기화를 보장하지 않지만
StringBuffer의 경우 동기화를 보장한다. 아래 문자열을 추가하는 `append` 메서드 구현을 보면 동기화 여부를 확인할 수 있다.

```java
// StringBuilder
public StringBuilder append(String str) {
    super.append(str);
    return this;
}

// StringBuffer
public synchronized StringBuffer append(String str) {
    super.append(str);
    return this;
}
```

<br/>

# 성능을 비교해보면 어떨까?
그렇다면 String과 StringBuilder 그리고 StringBuffer의 성능은 얼마나 차이가 있을까? 문자열을 변경하는 연산을 통해 수행 시간을 측정해보자.

```java
/**
 * 시간 측정, 결과 출력 클래스
 * @author madplay
 */
class MadClock {
    private long startTime;
    private long endTime;

    public void startClock() {
        startTime = System.nanoTime();
    }

    public void stopClock() {
        endTime = System.nanoTime();
    }

    public void printResult(String clockName) {
        System.out.printf("%s" + ": %.3f seconds %n",
                clockName, (endTime - startTime) / (double) 1_000_000_000);
    }
}
```

```java
/**
 * 문자열 연산 비교 테스트 클래스
 * @author madplay
 */
public class StringTest {
    private static final int MAX_LOOP_COUNT = 50_000;

    public static void main(String[] args) {
        
        // StringBuilder
        StringBuilder builder = new StringBuilder();
        MadClock builderClock = new MadClock();
        builderClock.startClock();
        for (int loop = 1; loop <= MAX_LOOP_COUNT; loop++) {
            builder.append("mad").append(loop).append("play");
        }
        builderClock.stopClock();
        builderClock.printResult("StringBuilder");


        // StringBuffer
        StringBuffer buffer = new StringBuffer();
        MadClock bufferClock = new MadClock();
        bufferClock.startClock();
        for (int loop = 1; loop <= MAX_LOOP_COUNT; loop++) {
            buffer.append("mad").append(loop).append("play");
        }
        bufferClock.stopClock();
        bufferClock.printResult("StringBuffer");


        // String
        String str = "";
        MadClock stringClock = new MadClock();
        stringClock.startClock();
        for (int loop = 1; loop <= MAX_LOOP_COUNT; loop++) {
            str += "mad" + loop + "play";
        }
        stringClock.stopClock();
        stringClock.printResult("String");
    }
}
```

위 코드를 1만 번부터 수행하여 일정 크기만큼 증가시키며 수행 시간을 측정해보았다. 아래 그래프를 보면 알 수 있듯이 `StringBuilder`의 문자열 속도가
제일 빠르고 `String`이 연산 속도가 가장 느리다.

<img class="post_image" width="550" alt="string stringbuilder stringbuffer performance"
src="{{ site.baseurl }}/img/post/2020-02-04-difference-between-string-stringbuilder-and-stringbuffer-in-java-1.png"/>

다만 `String`의 경우 연산 횟수가 10만 번을 초과한 시점부터 급격하게 느려져 제외했다. `String`은 연산을 할 때마다 새로운 문자열 객체를 생성하기 때문에
수행 속도가 매우 느리다. 그리고 `StringBuffer`의 경우 동기화 기능으로 인해 상대적으로 ```StringBuilder``` 보다 느리다.

<br/>

# String 최적화
자바 13버전도 출시된 상황이라 너무 오래된 얘기지만 JDK 1.5 버전부터는 String도 연산 과정에서 StringBuilder를 사용하도록 변경되었다.
그래서 예전보다는 더 좋아진 성능을 기대해도 된다.

실제로 어떻게 최적화되는지 직접 확인해보자. 아래와 같은 코드를 작성해보자.

```java
public class StringTest {
    public static void main(String[] args) {
        String str = "mad";
        String result = str + "h" + "e" + "l" + "l" + "o" + str + "p" + "l" + "a" + "y";
        System.out.println(result);
    }
}
```

그리고 컴파일 한 후에 바이트 코드를 확인해보자.  결과를 확인할 때는 클래스 파일을 역어셈블해주는 `javap` 명령어에 디어셈블 결과를
출력해주는 `-c` 옵션을 넣으면 된다. 추가적으로 스택 사이즈와 같은 조금 더 상세한 내용을 보고 싶을 때는 `-v` 옵션을 추가하면 된다.

> 참고로 테스트에 사용한 소스 코드는 `1.8.0_171` 버전으로 컴파일하였습니다.

```bash
$ javac StringTest.java
$ javap -c StringTest

Compiled from "StringTest.java"
public class StringTest {
  public StringTest();
    Code:
       0: aload_0
       1: invokespecial #1  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: ldc           #2  // String mad
       2: astore_1
       3: new           #3  // class java/lang/StringBuilder
       6: dup
       7: invokespecial #4  // Method java/lang/StringBuilder."<init>":()V
      10: aload_1
      11: invokevirtual #5  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      14: ldc           #6  // String hello
      16: invokevirtual #5  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      19: aload_1
      20: invokevirtual #5  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      23: ldc           #7  // String play
      25: invokevirtual #5  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      28: invokevirtual #8  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
      31: astore_2
      32: getstatic     #9  // Field java/lang/System.out:Ljava/io/PrintStream;
      35: aload_2
      36: invokevirtual #10 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      39: return
}
```

출력 결과에서 소스 코드(자바 파일)에는 없었던 `StringBuilder`가 보인다. 그렇다면 실제로 코드가 어떻게 변경되는지 디컴파일해서 확인해보자.
다만 디컴파일러에 따라 결과를 다르게 보여주는 경우가 있기 때문에 `javap`를 이용해 바이트 코드를 보는 것이 더 정확하다.

> 여기서 디컴파일은 ```jad``` 디컴파일러를 사용하였습니다.

```java
String s = "mad";
String s1 = (new StringBuilder()).append(s).append("hello").append(s).append("play").toString();
```

디컴파일 결과처럼 `StringBuilder`를 사용하도록 개선되었지만 **반복문 안에서 문자열을 더하는 연산을 한다면** StringBuilder가 반복문 횟수만큼
생성되기 때문에 상대적으로 느릴 수밖에 없다.

이것도 직접 비교해보자. 앞서 진행했던 테스트 코드에서 반복문 안의 코드만 변경하여 수행 시간을 측정하면 된다.

```java
for (int loopCount = 1; loopCount <= 100_000; loopCount++) {
    // Case 1. 대입만 한다.
    str2 = "mad" + loopCount + "play";
}


for (int loopCount = 1; loopCount <= 100_000; loopCount++) {
    // Case 2. 기존 문자열을 더해서 연산한다.
    str += "mad" + loopCount + "play";
}
```

첫 번째 경우는 반복문 안에서 연산 결과를 대입만 했으나, 두 번째는 기존 문자열을 연산에 포함시킨 후 다시 대입한다.
수행 시간과 디컴파일된 코드가 어떻게 다른지 확인해보자.

```java
// Case 1 디컴파일 결과 / 소요 시간: 0.004 초
String s = "Hello";
for(int i = 1; i <= 50000; i++)
{
    String s1 = (new StringBuilder()).append("mad").append(i).append("play").toString();
}


// Case 2 디컴파일 결과 / 소요시간: 35.21 초
String s2 = "Hello";
for(int j = 1; j <= 50000; j++)
    s2 = (new StringBuilder()).append(s2).append("mad").append(j).append("play").toString();
}
```

왜 수행 시간에서 많은 차이가 발생할까? 기존의 문자열을 포함하면서 계속 더하는 경우에는 연산에 사용되는 문자열의 길이가 길어질 수밖에 없다.
그 결과로 반복문 안의 `new StringBuilder()`는 길어진 만큼의 문자열에 맞추어 공간을 만들고 할당해야만 한다.

따라서 연산 하나 차이지만 실제 수행되는 시간은 꽤 많은 차이가 발생한다. 그렇기 때문에 반복문 안에서 문자열 덧셈 연산을 하여
문자열의 길이 변경할 때 `String`이 매우 불리한 것을 알 수 있다.

<br/>

# 다른 경우는 어떨까?
혹시 다르게 최적화되는 경우는 없을까? 먼저, **문자열 상수(final)**를 이용하는 경우는 어떻게 되는지 살펴보자.

```java
final String str = "mad";
String result = "h" + "e" + "l" + "l" + "o" + str + "p" + "l" + "a" + "y";

// 디컴파일 결과
String s = "hellomadplay";
```

```bash
Compiled from "StringTest.java"
public class StringTest3 {
  // ... 생략

  public static void main(java.lang.String[]);
    Code:
       0: ldc           #2  // String hellomadplay
       2: astore_2
       3: return
}
```

`final` 키워드가 사용된 경우에는 `StringBuilder`를 이용하지 않고 컴파일 과정에서 하나의 문자열로 변경된다.
그렇다면 하나의 변수가 아닌 **여러 개의 변수**를 더하는 경우는 어떻게 될까?

```java
String t = "t";
String a = "a";
String e = "e";
String n = "n";
String g = "g";
String result = t + a + e + n + g;

// 디컴파일 결과
String s = "t";
String s1 = "a";
String s2 = "e";
String s3 = "n";
String s4 = "g";
String s5 = (new StringBuilder()).append(s).append(s1).append(s2).append(s3).append(s4).toString();
```

결과적으로 컴파일 과정에서 `StringBuilder`을 사용하도록 변경되긴 하지만 모든 경우에 대해서 최적화가 진행되는 것이
아님을 알 수 있다. (_혹시 또 다른 경우가 있다면 공유해주세요 :D_)

<br/>

# 마치며
결과만 보면 **StringBuilder를 사용하는 것을 권장합니다.** 하지만 같이 개발하는 동료 또는 개인의 취향에 따라서도 달라질 수 있을 것 같습니다.
어떤 코드에서는 단순히 + 연산자를 이용하는 것이 더 보기 좋은 경우가 있으니까요.

하지만 반복문을 이용하게 되는 경우 ```String```을 이용하면 성능적으로 좋지 않은 영향을 줄 수 있기 때문에 꼭 ```StringBuilder```를 사용해야 합니다.

끝으로 이번 글의 주제와 관련된, 같이 읽으면 좋은 글도 전달드립니다.

- <a href="/post/java-string-literal-vs-string-object" target="_blank">자바의 String 객체와 String 리터럴(링크)</a>
- <a href="/post/java-garbage-collection-and-java-reference" target="_blank">자바 레퍼런스와 가비지 컬렉션(링크)</a>