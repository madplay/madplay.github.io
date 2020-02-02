---
layout:   post
title:    TCP와 UDP 차이 그리고 TCP/IP
author:   Kimtaeng
tags: 	  Network TCP UDP
description: TCP와 UDP의 차이에 대해서 알아보자.
category: Network
comments: true
---

# TCP/IP 란 무엇일까?

TCP와 UDP에 대해서 알아보기 전에 TCP/IP를 먼저 알아야할 필요성이 있습니다.<br/>
< Transfer Control Protocol / Internet Protocol > 를 줄여서 TCP/IP라고 하는데요.

이는 인터넷 표준 프로토콜로서 컴퓨터 간의 주고받는 데이터를 전송할 때 에러가 발생하지 않도록
알맞게 나누어 전송하고 이를 수신하여 다시 기존의 정보로 변환하는 것을 약속해 놓은 것을 말합니다.

인터넷 프로토콜 중 가장 중요한 역할을 하는 TCP와 IP의 합성어로 데이터의 흐름 관리, 정확성 확인, 패킷의 목적지 보장을 담당합니다.
(데이터의 정확성 확인은 TCP가, 패킷을 목적지까지의 전송은 IP가 담당해요)

TCP/IP는 DARPA 모델(TCP/IP를 개발한 미 정보 조직의 이름에서 유래)로 알려진 4개의 계층의 개념적인 모델에 매핑되어 있습니다.
4개의 계층은 응용(Application), 전송(Transport), 인터넷(Internet), 네트워크 인터페이스(Network Interface) 계층으로 구성됩니다.

<div class="post_caption">"잠깐, TCP/IP 4계층은 OSI 7계층과 다릅니다."</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-04-network-tcp-udp-tcpip-1.png" width="330" height="470" alt="TCP/IP와 OSI 7계층"/>

위 TCP/IP의 전송(Transport) 계층은 IP에 의해 전달되는 패킷의 오류를 검사하고 재전송 요구 등의 제어를 담당하는 계층입니다.
바로 이곳에서 TCP와 UDP라는 두 종류의 프로토콜이 사용됩니다.

<br/>

#  TCP vs UDP 

그림으로 비교하는 게 가장 명확하고 빠를 것 같습니다.<br/>

<div class="post_caption">"먼저 TCP의 모습을 살펴봅시다."</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-04-network-tcp-udp-tcpip-2.png" width="400" height="370" alt="TCP"/>

<br/>

<div class="post_caption">"다음으로 UDP의 모습도 봐볼까요?"</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-04-network-tcp-udp-tcpip-3.png" width="400" height="370" alt="UDP"/>

즉, 신뢰성이 요구되는 애플리케이션에서는 TCP를 사용하고 간단한 데이터를 빠른 속도로 전송하고자 하는 애플리케이션에서는 UDP를 사용합니다.

<br/>

# TCP 헤더 정보

아직 조금 더 자세히 살펴볼 필요가 있어요. TCP를 경유할 때 어떤 일이 진행되는지 살펴봅시다.<br/>
응용 계층으로부터 데이터를 받은 TCP는 TCP 헤더를 추가한 후에 이를 IP(Internet Protocol)로 보냅니다.

| 필&nbsp;&nbsp;&nbsp;&nbsp;드 | 크&nbsp;&nbsp;&nbsp;&nbsp;기 | 내&nbsp;&nbsp;&nbsp;&nbsp;용 |
| :---: | :---: | :---: |
| 송신자의 포트 번호 | 16 | 데이터를 보내는 애플리케이션의 포트 번호 |
| 수신자의 포트 번호 | 16 | 데이터를 받을 애플리케이션의 포트 번호 |
| 순서 번호 | 32 | 송신자가 지정하는 순서 번호(바이트 수 기준) |
| 응답 번호 | 32 | 수신 완료된 데이터 순서 번호(바이트 수 기준) |
| 데이터 오프셋 | 4 | 데이터의 시작 위치 |
| 예약 필드 | 6 | 사용하지 않음 |
| 제어 비트 | 6 | SYN, ACK, FIN 등의 제어 번호 |
| 윈도우 크기 | 16 | 수신자에서 수신할 수 있는 데이터의 크기 |
| 체크섬 | 16 | 데이터 오류 검사에 사용 |
| 긴급 위치 | 16 | 긴급하게 처리할 데이터의 위치 |

<br/>

<div class="post_caption">"TCP 헤더 정보를 조금 더 살펴보면!"</div>

| 필&nbsp;&nbsp;&nbsp;&nbsp;드 | 내&nbsp;&nbsp;&nbsp;&nbsp;용 |
| :---: | :---: |
| 송수신자의 포트 번호 | TCP로 연결되는 가상 회선 양단의 송수신 프로세스에 할당되는 포트 주소 |
| 순서 번호(Sequence Number) | 송신자가 지정하는 순서 번호, 전송되는 바이트 수를 기준으로 증가 |
| 응답 번호(ACK Number) | 수신 프로세스가 제대로 수신한 바이트의 수를 응답하기 위해 사용 |
| 데이터 오프셋(Data Offset) | TCP 세그먼트의 시작 위치를 기준으로 데이터의 시작 위치를 표현(TCP 헤더의 크기) |
| 예약 필드(Reserved) | 사용을 하지 않지만 나중을 위한 예약 필드 |
| 제어 비트(Flag Bit) | 하단 추가 설명 참조 |
| 윈도우 크기(Window) | 수신 윈도우의 버퍼 크기를 지정할 때 사용 |
| 체크섬(Checksum) | TCP 세그먼트에 포함되는 프로토콜 헤더와 데이터에 대한 오류 검출 용도 |
| 긴급 위치(Urgent Pointer) | 긴급 데이터를 처리하기 위함, URG 플래그 비트가 지정된 경우에만 유효 |

<br/>

<div class="post_caption">"TCP 헤더의 제어 비트(Flag Bit)를 살펴보면!"</div>

| 종&nbsp;&nbsp;&nbsp;&nbsp;류 | 내&nbsp;&nbsp;&nbsp;&nbsp;용 |
| :---: | :---: |
| URG | 긴급 위치를 필드가 유효한지 설정 |
| ACK | 응답 번호 필드가 유효한지 설정 |
| PSH | 현재 세그먼트에 포함된 데이터를 상위 계층에 즉시 전달할 때 |
| RST | 연결의 리셋이나 유효하지 않은 세그먼트에 대한 응답용 |
| SYN | 연결 설정 요구 |
| FIN | 더 이상 전송할 데이터가 없을 때 연결 종료 의사 표시 |

<br/>

<div class="post_caption">"그렇다면 UDP를 경유할 때는 어떤 일이 일어날까?"</div>

<br/>

# UDP 헤더 정보

응용 계층으로부터 데이터 받은 UDP도 UDP 헤더를 추가한 후에 이를 IP(Internet Protocol)로 보냅니다.

| 필&nbsp;&nbsp;&nbsp;&nbsp;드 | 크&nbsp;&nbsp;&nbsp;&nbsp;기 | 내&nbsp;&nbsp;&nbsp;&nbsp;용 |
| :---: | :---: | :---: |
| 송신자의 포트 번호 | 16 | 데이터를 보내는 애플리케이션의 포트 번호 |
| 수신자의 포트 번호 | 16 | 데이터를 받을 애플리케이션의 포트 번호 |
| 데이터의 길이 | 16 | UDP 헤더와 데이터의 총 길이 |
| 체크섬(Checksum) | 16 | 데이터 오류 검사에 사용 |

TCP 헤더와 다르게 UDP 헤더에는 포함된 정보가 부실한 느낌마저 듭니다.<br/>
UDP는 수신자가 데이터를 받는지 마는지 관심 없습니다. 즉, 신뢰성을 보장해주지 않지만 간단하고 속도가 빠르지요.

<br/>

# 정리해보면...

이들의 공통점은 포트 번호를 이용하여 주소를 지정한다는 점과 데이터 오류 검사를 위한 체크섬이 있다는 점입니다.
반대로 TCP와 UDP의 차이점은 아래와 같습니다.

| TCP(Transfer Control Protocol) | UDP(User Datagram Protocol) |
| :---: | :---: |
| 연결이 성공해야 통신 가능(연결형 프로토콜) | 비연결형 프로토콜(연결 없이 통신이 가능) |
| 데이터의 경계를 구분하지 않음(Byte-Stream Service) | 데이터의 경계를 구분함(Datagram Service) |
| 신뢰성 있는 데이터 전송(데이터의 재전송 존재) | 비신뢰성 있는 데이터 전송(데이터의 재전송 없음) |
| 일 대 일(Unicast) 통신 | 일 대 일, 일 대 다(Broadcast), 다 대 다(Multicast) 통신 |

