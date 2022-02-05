---
layout:   post
title:    "인텔리제이에서 애플리케이션 분석하기"
author:   Kimtaeng
tags:    intellij profile
description: "Intellij IDEA Ultimate 에디션에서 제공하는 애플리케이션 프로파일링 도구(Profiling tools) 기능은 무엇일까?"
category: Knowledge
date: "2022-02-04 23:05:11"
comments: true
---

# Intellij IDEA Ultimate
> 시작하기 전에, 이번 글에서 소개할 프로파일링 도구(Profiling tools) 기능은 Intellij IDEA Ultimate 에디션에서만 사용 가능하다. (2022년 2월 기준)

젯브레인즈(JetBrains) 사에서 제공하는 자바 개발용 IDE는 2가지가 있다. 하나는 오픈소스 코드를 기반으로 무료로 제공되는 IntelliJ IDEA Community Edition 제품이고,
다른 하나는 유료 라이선스 기반으로 제공되는 Intellij IDEA Ultimate 제품이다. 

Ultimate 버전의 경우 유료로 제공되는 만큼 Community Edition보다 더 많은 기능들을 제공한다. 그중에서는 이번 글의 핵심인 프로파일링 도구(Profiling tools)도 포함된다.
그 밖의 차이점들은 아래 공식 사이트 링크를 통해 확인하면 된다.

- <a href="https://www.jetbrains.com/ko-kr/products/compare/?product=idea&product=idea-ce" rel="nofollow" target="_blank">참고 링크: IntelliJ IDEA Ultimate vs IntelliJ IDEA Community</a>

<br>

# Profiling tools
상용 버전인 IntelliJ IDEA Ultimate를 사용하고 있다면 활용할 수 있는 기능이다. 프로파일링 기능을 사용하면 애플리케이션에 대한 부가적인 분석 정보를 얻을 수 있다.
세부 기능으로는 애플리케이션의 실행 방식과 메모리, CPU 리소스가 할당되는 방식에 대한 분석을 제공하는 Async Profiler, 애플리케이션이 실행되는 동안
JVM에서 발생한 이벤트에 대한 정보를 수집하는 모니터링 도구인 Java Flight Recorder 등이 있다.

또한 애플리케이션의 특정 시점의 스냅샷으로 메모리를 분석하거나(Analyze memory snapshots) 애플리케이션이 실행되는 도중에도 CPU와 메모리 현황을
실시간으로 확인할 수 있는 기능(CPU and memory live charts)들이 있다.

## Profiling Application
Async Profiler, Java Flight Recorder 기능 등을 통해서 애플리케이션을 분석할 수 있다. CPU와 메모리를 많이 쓸수록 더 넓은 직사각형으로 표현하여
애플리케이션의 호출 트리(call tree)를 시각화하는 **플레임 그래프(Flame Graph)**, 프로그램의 호출 스택에 대한 정보를 나타내는 호출 트리(Call Tree)
그리고 메소드의 호출을 추적하거나 특정 메서드에서 호출된 모든 메서드를 확인할 수 있는 메서드 리스트(Method List) 등의 기능을 제공한다.

자세한 설명과 사용법은 아래 공식 사이트 링크와 영상으로 대체한다. 더 심화적인 내용을 확인하긴 어렵겠지만 대략적인 사용 방법과 느낌(?) 파악으로는 공식 사이트 설명이 기본이자 최고인 것 같다.

- <a href="https://www.jetbrains.com/help/idea/read-the-profiling-report.html" target="_blank" rel="nofollow">참고 링크: "공식 사이트: Read the profiling report"</a>
- <a href="https://www.youtube.com/watch?v=OQcyAtukps4" target="_blank" rel="nofollow">참고 링크: "유튜브 영상: Profiling Tools and IntelliJ IDEA Ultimate"</a>

<br>

## CPU and memory live charts
실행 중인 애플리케이션 리소스 상태를 아래와 같이 차트 형태로 실시간 확인할 수 있다. 옵션을 통해서 데이터 확인 기간도 모든 데이터, 최근 5분 등으로 범위를 변경할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-02-04-intellij-idea-profiling-tools_cpu-and-memory-live-charts.png" width="600" alt="cpu-and-memory-live-charts"/>

<br>

## Analyze memory snapshots
메모리 스냅샷 기능을 통해서 힙(heap) 메모리를 사용하는 코드를 분석하고 메모리 누수를 찾는 등 애플리케이션의 성능 문제를 분석할 수도 있다.
위에서 살펴본 라이브 차트에서 "Capture Memory Snapshot" 기능을 사용하면, 해당 시점의 메모리를 덤프하여 스냅샷으로 캡처할 수 있다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-02-04-intellij-idea-profiling-tools_capture-memory-snapshot.png" width="350" alt="capture-memory-snapshot"/>

캡처가 완료되면 아래와 같이 여러 정보를 분석할 수 있다. 왼쪽 프레임에서는 메모리에 할당된 각 클래스의 정보를 확인할 수 있는데 각 항목은 다음과 같다.

- **Class**: 애플리케이션의 클래스 목록
- **Count**: 각 클래스의 사용 횟수
- **Shallow**: 객체 자체가 저장되기 위해 할당되는 메모리 크기인 Shallow size 표기
- **Retained**: 객체들의 shallow size와 해당 객체에서 직간접적으로 접근 가능한 객체들의 shallow size 합인 Retained size 표기

오른쪽 프레임에서는 다음과 같은 탭을 확인할 수 있다.

- **Biggest Objects**: 리소스를 가장 많이 차지하는 객체를 순서대로 나열
- **GC Roots**: 클래스 별로 그룹핑된 가비지 수집기 루트 객체와 Shallow Size, Retained Size 표기
- **Merged Paths**: 클래스 별로 그룹핑된 인스턴스의 개수 등을 확인
- **Summary**: 인스턴스 개수, 스택 트레이스(stack traces) 등과 같이 일반적인 정보 표기
- **Packages**: 모든 객체를 패키지별로 표기

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-02-04-intellij-idea-profiling-tools_analyze-memory-snapshot.png" width="800" alt="analyze-memory-snapshot"/>

<br>

# 마치며
프로파일링 기능은 개발할 때 꼭 필수적인 기능은 아니지만 필요에 따라서 도움을 줄 수 있는 괜찮은 기능이다. 이번 글에서 생략된 내용이 많다. 유튜브 소개 영상의
댓글에서도 언급돼있지만 자세한 사용법에 대한 이해를 하기 어려운 부분이 있다. 이 기능을 알게 된 이후로 공식 사이트의
<a href="https://www.jetbrains.com/help/idea/cpu-profiler.html" rel="nofollow" target="_blank">소개/사용 가이드(링크)</a>를
가끔씩 확인해 보는데 가이드가 중간중간 업데이트되는 것을 보니 이러한 니즈를 반영하고 있는 것이 아닐까 싶다.

다만 서두에서 언급한 것처럼 프로파일링 기능은 아쉽게도 Ultimate 버전에서만 사용 가능한 유료 기능이다. 다행인 것은 학생이나 교육 기관과 같이
비상업적인 용도인 경우 아래와 같이 무료로 제공하거나 저렴한 가격에 라이선스를 제공하고 있다.
더 자세한 내용은 공식 사이트의 <a href="https://www.jetbrains.com/ko-kr/store/#discounts" rel="nofollow" target="_blank">스페셜 오퍼(링크)</a>를 참고하면 된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-02-04-intellij-idea-profiling-tools_discounts.png" width="800" alt="discounts"/>



