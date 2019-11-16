---
layout:   post
title:    "[이펙티브 자바 3판] 3장. 모든 객체의 공통 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter3: Methods Common to All Objects"  
category: Java
comments: true
---

<hr/>

# 목록

- <a href="#아이템-10-equals는-일반-규약을-지켜-재정의하라">아이템 10. equals는 일반 규약을 지켜 재정의하라</a>
- <a href="#아이템-11-equals를-재정의하려거든-hashCode도-재정의하라">아이템 11. equals를 재정의하려거든 hashCode도 재정의하라</a> 
- <a href="#아이템-12-toString을-항상-재정의하라">아이템 12. toString을 항상 재정의하라</a>
- <a href="#아이템-13-clone-재정의는-주의해서-진행하라">아이템 13. clone 재정의는 주의해서 진행하라</a>
- <a href="#아이템-14-Comparable을-구현할지-고려하라">아이템 14. Comparable을 구현할지 고려하라</a>

<br/>

# 아이템 10. equals는 일반 규약을 지켜 재정의하라
> Obey the general contract when overriding equals

먼저, 결론은 

- <a href="/post/obey-the-general-contract-when-overriding-equals">
더 상세한 내용은 링크 참고 > [이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라
</a>


# 아이템 11. equals를 재정의하려거든 hashCode도 재정의하라
Always override hashCode when you override equals

# 아이템 12. toString을 항상 재정의하라
Always override toString

# 아이템 13. clone 재정의는 주의해서 진행하라
Override clone judiciously

# 아이템 14. Comparable을 구현할지 고려하라
Consider implementing Comparable