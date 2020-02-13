---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 66. 네이티브 메서드는 신중히 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 66. Use native methods judiciously" 
category: Java
comments: true
---

# 네이티브 메서드

네이티브 메서드(Native Method)는 **C, C++**와 같은 네이티브 프로그래밍 언어로 작성한 메서드를 말합니다.
그리고 자바 프로그램에서 네이티브 메서드를 호출하는 기술을 JNI(Java Native Interface)라고 합니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class HelloJNITest
    static {
        // Native Library 로드(Unix는 libhello.so, Windows는 hello.dll)
        System.loadLibrary("hello");
    }
    
    // 네이티브 메서드 선언, 구현 코드는 C, C++언어 기반
    private native void sayHi();
    
    public static void main(String[] args) {
        // 인스턴스 생성, 네이티브 메서드 호출
        new HelloJNITest().sayHello();
    
    }
}
</code></pre>

<br/>

# 네이티브 메서드의 사용

첫 번째로 레지스트리나 파일 락(Lock)과 같은 **플랫폼에 특화된 기능을 사용**할 수 있습니다.
하지만 자바 버전이 올라가면서 필요성이 줄어들고 있습니다. 특히 **Java 9** 에서는 Process API가 추가되어
OS 프로세스도 접근할 수 있습니다. 하지만 대체할만한 자바 라이브러리가 없다면 네이티브 라이브러리를 사용해야 합니다.

두 번째로 **네이티브 코드로 작성된 기존 라이브러리를 사용할 때** 사용해야 합니다.

마지막으로 **성능 개선을 목적**으로 성능에 결정적인 영향을 주는 영역만 따로 네이티브 언어로 작성할 수 있습니다.
하지만 대부분 성능 개선 목적으로 네이티브 메서드 사용을 권장하지는 않습니다. 예를 들어 ```java.math```가 처음 추가된
```JDK 1.1```의 BigInteger 클래스는 C언어로 작성된 라이브러리에 의존했지만 ```JDK 1.3``` 버전부터 순수 자바로 구현되었고
보다 더 세심한 튜닝을 통해 원래의 네이티브 구현보다 더 빨라졌습니다.

<br/>

# 네이티브 메서드의 단점

안전하지 않습니다. 네이티브 메서드를 사용하는 애플리케이션도 메모리 훼손 오류로부터 안전하지 않습니다.
<a href="/post/make-defensive-copies-when-needed" target="_blank">
(참고 링크: [이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라)</a>

자바보다 플랫폼 종속성이 높고 이식성도 낮으며 디버깅하기도 어렵습니다. 성능적인 측면으로는 오히려 속도가 더 느릴 수 있으며
가비지 컬렉터가 네이티브 메모리는 자동 회수하지 못하며 심지어 추적할 수도 없습니다.
자바 코드와 네이티브 메서드와의 호출 사이에서 비용도 발생하며 이를 잇는 코드를 작성하는 것도 귀찮은 작업이며 가독성도 떨어집니다.

따라서 Low 레벨 자원이나 네이티브 라이브러리를 반드시 사용해야만 하는 경우가 아니라면 네이티브 코드는 권장되지 않습니다.
사용하더라도 최소한만 사용하고 테스트를 철저히 해야 합니다.