---
layout:   post
title:    OSI 7 Layer
author:   madplay
tags: 	  Network OSI7
description: Open System Interconnection 7 Layer
category: Network
comments: true
slug:     network-osi-7-layer
lang:     en
permalink: /en/post/network-osi-7-layer
---

# What is OSI 7 Layer?

It sometimes appears in information processing engineer exams and IT company written tests or interviews! Learning about OSI 7 Layer.<br/>
For multiple computers on a network to exchange data, they must support standardized interfaces to interconnect them.

OSI (Open System Interconnection) 7 Layer established by ISO (International Standard Organization), an international standardization organization,
is a standard for hierarchical implementation models used in open data communication environments.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-17-network-osi-7-layer-1.png" width="740" height="400" alt="OSI 7 Layer"/>

As the name suggests, it consists of 7 layers, and each layer performs different roles.<br/>
Layer N modules running on any host logically communicate with Layer N modules of the peer host,
and this is called N protocol. Communication endpoints at the same layer use the same protocol to communicate,
so they're called peer processes.

Between modules located in neighboring layers above and below on one host, interfaces are defined to limit access methods,
and upper layers use lower layer services through lower layer interfaces.

Also, when transmitting data from a sending host, it doesn't directly transmit to peer processes but requests services from lower layers,
and this request repeats down to the physical layer at the bottom.

Conversely, on receiving hosts, protocol functions operate as data is transmitted to upper layers.
Although peer processes at each layer appear to communicate directly, data is always actually transmitted through the physical layer.

Learning the characteristics of each layer:

<br/>

# Physical Layer (Layer 1)

Defines functions required to transmit data bits through physical media
and defines rules for mechanical and electrical characteristics like actual connections between two devices needed for transmission such as cables and connection devices.

Transmission unit: Bit
Protocol: RS-232C, etc.
Equipment: Hub, Repeater

<br/>

# Data Link Layer (Layer 2)

Enables efficient and reliable information transmission between two open systems
and performs error control functions for error detection and recovery.
Also, performs flow control functions (when there are more packets than can be processed with stop-and-wait & sliding window methods) to resolve speed differences between sender and receiver,
and performs frame synchronization functions to distinguish frame start and end.

Transmission unit: Frame
Protocol: Ethernet, MAC, PPP, etc.
Equipment: Bridge, Switch

<br/>

# Network Layer (Layer 3)

Has responsibility for delivery from source to destination across multiple network links.
The previous layer, data layer, supervises node vs node delivery,
and the network layer performs the role of ensuring successful delivery from start point to destination.

Transmission unit: Packet
Protocol: IP, ICMP, etc.
Equipment: Router, L3 Switch

<br/>

# Transport Layer (Layer 4)

Manages control and errors end-to-end (End-to-End, from source to destination) for entire messages.
Ensures reliable communication like verifying whether packet transmission is valid and resending failed packets.
Performs addressing, error and flow control, and multiplexing.

Transmission unit: Segment
Protocol: TCP, UDP, etc.
Equipment: Gateway, L4 Switch

<br/>

# Session Layer (Layer 5)
 
Provides methods for application processes at both ends to manage communication.
Performs communication in Duplex, Half-Duplex, and Full-Duplex modes along with
checkpointing and idle, termination, restart processes, etc.
Forms communication sessions and connects based on port numbers.

Protocol: NetBIOS, SSH, TLS

<br/>

# Presentation Layer (Layer 6)

Converts data received from the application layer into forms suitable for communication before sending to the session layer, a lower layer,
and converts data received from the session layer to match the application layer.
Handles functions like code conversion, syntax search, data compression, and encryption.

Protocol: JPG, MPEG, SMB, AFP

<br/>

# Application Layer (Layer 7)

Directly relates to application processes and performs general application services.
Provides services like information exchange between application processes, email, file transfer, etc.

Protocol: DNS, FTP, HTTP
