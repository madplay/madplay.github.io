---
layout:   post
title:    빅 엔디안과 리틀 엔디안(Big Endian & Little Endian)
author:   Kimtaeng
tags: 	  Knowledge 바이트오더
subtitle: 바이트를 배열하는 방법을 알아보자.
category: Knowledge
comments: true
---

<hr/>

> ## 엔디안(Endian)이란 무엇일까?

엔디안은 컴퓨터의 메모리와 같은 1차원 공간에 여러 개의 연속된 대상을 배열하는 방법을 말합니다.<br/>

<div class="post_caption">" 영국의 소설가 조나단 스위프트(Jonathan Swift)의<br/>< 걸리버 여행기 >의 소인국 이야기에서 엔디안이라는 단어를 발견할 수 있다."</div>

달걀을 깰 때 무딘 끝(Big-End)을 먼저 개는 사람들(Big Endian)과 이와 반대로 뾰족한 끝(Little-End)을 먼저 깨는 사람들(Little Endian) 사이에 격론이 벌어진 데서 따왔다고 합니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2017-12-17-big-endian-little-endian-1.png" width="600" height="300" alt="빅 엔디안과 리틀 엔디안"/>

<br/><br/>

> ## 컴퓨터 공학에서의 엔디안(Endian)

컴퓨터 공학에서 엔디안(Endian) 이라는 말은 대니 코언(Danny Cohen)이 1980년에 쓴 < On Holy Wars and a Plea for Peace > 라는 글에서 유래했다고 합니다.

<div class="post_caption">
"...which bit should travel first, the bit from the little end of the world,<br/>
or the bit from the big end of the word?<br/>
The followers of the former approach are called the Little-Endians,<br/>
and the followers of the latter are called the Big-Endians."
</div>

<br/>

컴퓨터 공학의 관점으로 다시 풀어쓴다고 하면, 끝을 뜻하는 End가 아닌 목표, 대상이라고 해석하면 될 것 같습니다.

엔디안(Endian)은 앞서 말한 것처럼 메모리와 같은 1차원 공간에 여러 개의 연속된 대상을 배열하는 방법을 뜻하는데,<br/>
특히, 바이트를 배열하는 방법을 바이트 순서(Byte Order)라고 합니다. 
보통 큰 단위가 나오는 빅 엔디안(Big-Endian)과 작은 단위가 먼저 앞에 나오는 리틀 엔디안(Little-Endian)으로 나눌 수 있지요.

<br/><br/>

> ## 시스템에 따른 엔디안

모든 시스템이 같은 엔디안을 사용하는 것은 아닙니다. Linux, Windows 계열은 리틀 엔디안 방식을 사용하고 있습니다.<br/>
그러니까 우리는 보통 리틀 엔디안을 이용하는 시스템을 주로 사용하고 있습니다.

하지만 반대로 네트워크를 통한 전송은 빅 엔디안 방식입니다.<br/>
IP 패킷이 바이트 단위로 구분된 이후 최상위 비트(Most Significant Bit)를 먼저 전송하고 최하위 비트(Least Significant Bit)를 나중에 보냅니다.
바이트 내의 비트 전송 순서도 최상위 비트를 먼저 보냅니다. 전반적으로 빅 엔디안 순서이지요.

<br/><br/>

> ## 빅 엔디안(Big-Endian)

큰 단위부터 들어가는 빅 엔디안입니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2017-12-17-big-endian-little-endian-2.png" width="400" height="350" alt="빅 엔디안"/>

장점이라면 사람이 읽기 편합니다. 숫자를 쓰고 읽는 방법과 같기 때문이지요.<br/>
예를 들어 0x12345678은 빅 엔디안으로 12 34 56 78로 표현됩니다.

<br/><br/>

> ## 리틀 엔디안(Little-Endian)

작은 단위가 먼저 들어가는 리틀 엔디안입니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2017-12-17-big-endian-little-endian-3.png" width="400" height="350" alt="리틀 엔디안"/>

그림과 같이 오른쪽에서부터 왼쪽으로 저장됩니다.<br/>
이는 산술 연산이 메모리의 주소가 낮은 쪽에서부터 높은 쪽으로 가면서 처리되는 순서와 같습니다.

짝수, 홀수를 검사도 빠릅니다. 첫 바이트만 확인하면 되기 때문이지요.
우리가 흔히 사용하고 있는 Intel과 AMD CPU에서 이 방식을 사용합니다.

<br/><br/>

> ## 바이 엔디안(Bi-Endian)

한편으로 몇몇 시스템은 엔디안을 선택할 수 있도록 설계되어 있는데요. 이를 바이 엔디안이라고 합니다.<br/>
대표적으로 ARM, PowerPC, DED Alpha, MIPS 등이 있습니다.
