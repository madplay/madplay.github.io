---
layout:   post
title:    자바 8에서 map 메서드와 flatMap 메서드의 차이
author:   Kimtaeng
tags: 	  java java8 map flatmap
subtitle: 자바 8의 스트림에 추가된 map 메서드와 flatMap 메서드의 차이는 무엇일까? 
category: Java
comments: true
---

<hr/>

> ## 들어가기 앞서

먼저 이번 포스팅은 자바 8에서 새롭게 추가된 스트림에 대한 지식이 조금은 필요합니다.
자바 스트림에 대해 처음이시라면 아래 포스팅을 참고하시기 바랍니다.

- <a href="/post/introduction-to-java-streams" target="_blank">참고 링크: 자바 스트림 정리 - 1. 소개와 스트림 생성</a>

<br/><br/>

> ## map 메서드 살펴보기

```map``` 메서드를 사용하면 단일 스트림 안의 요소를 원하는 특정 형태로 변환할 수 있습니다. 
어떤식으로 코드를 작성할 수 있는지 예제를 통해 확인해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">// import 생략
public class MapMethodTest {
    public static void main(String[] args) {
        List&lt;Person> personList = Arrays.asList(
                new Person("Kimtaeng", 30),
                new Person("Madplay", 29)
        );

        Set&lt;String> names = personList.stream()
                .map(Person::getName) // .map(p -> p.getName()) 와 같다.
                .collect(Collectors.toSet());

        // Kimtaeng, Madplay 출력
        names.forEach(System.out::println);
    }
}

class Person {
    private String name;
    private Integer age;

    // constructor, getter, setter 생략
}
</code></pre>
