---
layout:   post
title:    "암호 기법: 치환 암호, 전치 암호, 블록 암호, 스트림 암호"
author:   Kimtaeng
tags: 	  cryptology cryptography
description: 암호 기법의 종류에는 무엇이 있을까? 치환 암호와 전치 암호, 블록 암호와 스트림 암호에 대해서 알아보자.
category: Knowledge
date: "2020-10-14 00:58:37"
comments: true
---

# 시작하기 전에
몇 가지 용어를 정리해보자. 먼저 살펴볼 용어로는 평문(plaintext)이 있다. 평문은 암호화하여 보호할 원본 메시지를 말하며,
이를 암호화한 것을 암호문(ciphertext)이라고 한다. 여기서 평문을 암호문으로 변환하는 것을 암호화(encryption),
이와 반대로 암호문을 다시 평문으로 변환하는 것을 복호화(decryption)라고 한다.

<br>

# 혼돈과 확산
일반적으로 안전한 암호문은 외부 공격자가 암호화되지 않은 원문 메시지를 쉽게 추론할 수 없어야 하며, 암호화에 사용된
알고리즘 또한 유추될 수 없어야 한다. 이러한 암호문의 설계 원칙은 미국의 수학자이자 전기공학자 또는 정보 이론이 아버지라고
불리는 클로드 엘우드 섀넌(Claude Elwood Shannon)이 제안한 혼돈(Confusion)과 확산(Diffusion)이라는 용어로 정의된다.

**혼돈이란** 암호문과 암호화되지 않은 평문간의 연관된 관계를 숨기는 성질을 말한다. 예를 들면, 원본 메시지의
비트 하나가 바뀌었다고 암호문의 변화가 예측될 수 없어야 하는 것처럼 상관관계를 쉽게 유추할 수 없도록 만드는 것을 말한다.
**확산이란** 암호화에 사용된 알고리즘을 쉽게 추론하지 못하게 만드는 성질이다. 앞서 살펴본 혼돈과 비슷하게
비트 하나의 변화가 암호문 전체에 영향을 주어 쉽게 파악하지 못하게 한다.

즉, 좋은 암호는 혼돈과 확산이라는 두 가지 성질을 모두 갖춰야 한다.

<br>

# 치환 암호와 전치 암호
먼저, 치환 암호(Substitution cipher)는 문자를 다른 문자로 대체하는 방법이다. 원문 메시지의 내용을 추측하기 어렵게 만드는
혼돈의 성질을 높이는 특성을 갖는다. 여기서 평문 문자와 암호문의 문자가 일대일 대응이 아니어도 된다.

아래 그림은 ROT13(Rotate by 13)이다. 치환 암호인 카이사르(Caesar, 또는 시저 암호라고도 불린다) 암호의 일종이며
단순하게 알파벳을 13글자씩 밀어서 만든다. 예를 들어서, 'HELLO'라는 단어의 경우 'URYYB'가 된다. 

- <a href="https://en.wikipedia.org/wiki/ROT13" target="_blank" rel="nofollow">그림 출처: ROT13 - 위키백과</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-10-14-introduction-to-cryptography-and-types-of-ciphers-1.png"
width="500" alt="rotate by 13"/>

다음으로 전치 암호(Transposition cipher)는 문자들의 순서를 무작위 규칙에 따라 바꾼다. 사용된 암호화 알고리즘을 추론하기 어렵게
만들기 때문에 확산의 성질을 높이는 특성을 갖는다. 평문의 문자와 암호문에 사용된 문자가 일대일로 대응된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-10-14-introduction-to-cryptography-and-types-of-ciphers-2.png"
width="400" alt="permutation"/>

# 블록 암호와 스트림 암호
**블록 암호(Block cipher)**는 특정 비트 수의 집합을 한꺼번에 처리하는 방법을 총칭한다. 여기서 집합은 블록(block)이라고 하며,
블록의 비트 수를 블록 길이(block length)라고 한다.

블록 암호의 구조에는 페스탈(Feistel)구조와 대입-치환 네트워크(SPN, Substitution-Permutation Network) 구조가 있다.
아래는 SPN 구조이다. 혼돈과 확산을 구현하기 위해 치환과 전치를 조합한 구조이다.

> 단어 사용에 있어서 혼동되는 부분이 있습니다. 'Substitution'은 다른 문자로 대체하는 것,
> 'Permutation'은 문자들의 순서를 뒤섞는 것으로 볼 수 있으나 우리말로 번역했을 때 같은 뜻으로 번역되기에
> 위키백과의 번역을 따릅니다.

- <a href="https://en.wikipedia.org/wiki/Substitution%E2%80%93permutation_network" target="_blank" rel="nofollow">
그림 출처: Substitution-permutation network - 위키백과</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-10-14-introduction-to-cryptography-and-types-of-ciphers-3.png"
width="400" alt="substitution-permutation network"/>

**스트림 암호(Stream cipher)**는 연속적인 비트 또는 바이트를 순차적으로 암호화한다. 앞서 살펴본 블록 암호가 특정 비트를 묶어서 순서에
상관없이 암호화된다면, 스트림 암호는 순차적으로 진행되며 이전 암호화된 결과가 다음 암호화에 사용되는 연속성의 특징을 가지고 있다. 

대표적으로 RC4가 널리 사용되며, A5/1, A5/2 등의 알고리즘이 있다. 아래는 RC4 스트림 암호의 구조를 나타낸 그림이다.

- <a href="https://en.wikipedia.org/wiki/RC4" target="_blank" rel="nofollow">그림 출처: RC4 - 위키백과</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-10-14-introduction-to-cryptography-and-types-of-ciphers-4.png"
width="400" alt="rc4"/>


