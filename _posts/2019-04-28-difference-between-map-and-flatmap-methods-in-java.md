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
자바 스트림에 대해 처음이시라면 아래 포스팅을 먼저 보시면 더 좋습니다.

- <a href="/post/introduction-to-java-streams" target="_blank">참고 링크: 자바 스트림 정리 - 1. 소개와 스트림 생성</a>

<br/><br/>

> ## map 메서드 살펴보기

```map``` 메서드를 사용하면 단일 스트림 안의 요소를 원하는 특정 형태로 변환할 수 있습니다. 
어떻게 map 메서드를 이용하여 코드를 작성할 수 있는지 확인해봅시다.

<pre class="line-numbers"><code class="language-java" data-start="1">// import 생략

class Person {
    private String name;
    private Integer age;

    // constructor, getter, setter 생략
}

public class MapMethodTest {
    public static void main(String[] args) {
        List&lt;Person> personList = Arrays.asList(
                new Person("Kimtaeng", 30),
                new Person("Madplay", 29)
        );

        Set&lt;String> names = personList.stream()
                .map(Person::getName)
                .collect(Collectors.toSet());

        // Kimtaeng, Madplay 출력
        names.forEach(System.out::println);
    }
}
</code></pre>

위 코드에서 ```stream```과 동시에 람다식(Lambda Expression)과 메서드 참조(Method References)가 사용되었는데요.
단계별로 변환해보면 아래와 같습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">// 초기 형태
personList.stream().map(new Function&lt;Person, String>() {
    @Override
    public String apply(Person person) {
        return person.getName();
    }
}).collect(Collectors.toSet());

// 람다식 적용
personList.stream().map(person -> person.getName())
    .collect(Collectors.toSet());
    
// 메서드 참조 적용
personList.stream().map(Person::getName)
    .collect(Collectors.toSet());
</code></pre>

<br/><br/>

> ## flatMap 메서드 살펴보기

```flatMap``` 메서드는 스트림 형태가 배열과 같을 때, 모든 원소를 단일 원소 스트림으로 반환할 수 있습니다.
2차원 배열에서 문자열의 길이가 3 보다 큰 문자열을 출력하는 코드입니다.

<pre class="line-numbers"><code class="language-java" data-start="1">public void someMethod() {
    String[][] namesArray = new String[][]{
            {"kim", "taeng"}, {"mad", "play"},
            {"kim", "mad"}, {"taeng", "play"}
    };
    Set&lt;String> namesWithFlatMap = Arrays.stream(namesArray)
            .flatMap(innerArray -> Arrays.stream(innerArray))
            .filter(name -> name.length() > 3)
            .collect(Collectors.toSet());
            
    // play, taeng 출력
    namesWithFlatMap.forEach(System.out::println);
}
</code></pre>

```flatMap```의 결과로 단일 원소 스트림을 반환하기 때문에 이어지는 체이닝에서 ```filter```와 같이
스트림 메서드를 사용할 수 있습니다. 

<br/><br/>