---
layout:   post
title:    "[이펙티브 자바 3판] 11장. 동시성"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter11: Concurrency"
category: Java
date: "2019-09-27 23:25:42"
comments: true
---

# 목차
- <a href="#아이템-78-공유-중인-가변-데이터는-동기화해-사용하라">아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라</a>
- <a href="#아이템-79-과도한-동기화는-피하라">아이템 79. 과도한 동기화는 피하라</a>
- <a href="#아이템-80-스레드보다는-실행자-태스크-스트림을-애용하라">아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라</a>
- <a href="#아이템-81-wait와-notify보다는-동시성-유틸리티를-애용하라">아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라</a>
- <a href="#아이템-82-스레드-안전성-수준을-문서화하라">아이템 82. 스레드 안전성 수준을 문서화하라</a>
- <a href="#아이템-83-지연-초기화는-신중히-사용하라">아이템 83. 지연 초기화는 신중히 사용하라</a>
- <a href="#아이템-84-프로그램의-동작을-스레드-스케줄러에-기대지-말라">아이템 84. 프로그램의 동작을 스레드 스케줄러에 기대지 말라</a>

<br/>

# 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라
> Synchronize access to shared mutable data

여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓸 때는 항상 동기화해야 한다. 그렇지 않으면 의도하지 않은 값을 읽게 될 수 있다.

- <a href="/post/synchronize-access-to-shared-mutable-data" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 78. 공유 중인 가변 데이터는 동기화해 사용하라</a>

<div class="post_caption">여러 스레드가 가변 데이터를 공유한다면 그 데이터를 읽고 쓰는 동작은 반드시 동기화하자.</div>

<br/>

# 아이템 79. 과도한 동기화는 피하라
> Avoid excessive synchronization

동기화를 하지 않으면 문제가 된다. 하지만 과도한 동기화도 적지 않은 문제가 된다. 성능을 떨어뜨리고, 교착 상태에 빠뜨리고, 심지어는 예측할 수 없는
결과를 만들기도 한다.

- <a href="/post/avoid-excessive-synchronization" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 79. 과도한 동기화는 피하라</a>

<div class="post_caption">동기화 메서드나 블록 안에서는 클라이언트에게 제어를 양도해선 안 된다.</div>

<br/>

# 아이템 80. 스레드보다는 실행자, 태스크, 스트림을 애용하라
> Prefer executors, tasks, and streams to threads

<br/>

# 아이템 81. wait와 notify보다는 동시성 유틸리티를 애용하라
> Prefer concurrency utilities to wait and notify

<br/>

# 아이템 82. 스레드 안전성 수준을 문서화하라
> Document thread safety

<br/>

# 아이템 83. 지연 초기화는 신중히 사용하라
> Use lazy initialization judiciously

<br/>

# 아이템 84. 프로그램의 동작을 스레드 스케줄러에 기대지 말라
> Don’t depend on the thread scheduler