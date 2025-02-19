---
layout:   post
title:    Why Are Computers Based on Binary System?
author:   Kimtaeng
tags: 	  knowledge binary
description: Learning why computers use the binary system.
category: Knowledge
comments: true
slug:     why-computer-is-based-on-binary-system
lang:     en
permalink: /en/post/why-computer-is-based-on-binary-system
---

# Why Only 0 and 1?
Why do computers use a binary system consisting only of 0 and 1? There's also the decimal system we commonly use,
so why were they designed based on binary?

The reason is noise that occurs in circuits that make up computers. Looking at the dictionary meaning of noise:

<div class="post_caption">Unnecessary signals that occur due to electrical and mechanical reasons in systems. When transmitting data,
checks are performed in predetermined ways for each transmitted character to prevent data from changing due to this. This is commonly called noise.</div>

As seen above, we said binary system is used due to noise, but the phenomenon of data changing also occurs in binary systems.
However, relatively larger problems occur in systems higher than binary.

<br>

# Computers and Binary System
Computers judge binary expressions as electrical signals. If there's a signal, it's 1, if not, it's 0.
Then what happens if we use a decimal system? We would need 10 levels of distinction for signals.

For example, if we assume electrical signal size is from 0V (Volt) to 5V, in 10 levels, there would be a 0.5V difference for each level.
But what happens if 2.3V is transmitted due to mechanical defects or reasons? Since it's closer to 2.5V, it might be judged as a different level.
For this reason, we can say that binary systems can be safer.

<br>

# Analog and Digital
What if computers operated based on analog signals, which are opposite to digital signals, these electrical signals?
You can easily think of Arduino boards that have both digital and analog output boards as examples.

Taking Arduino board's LED lighting as an example, digital output can only display completely on and completely off states,
but analog output can arbitrarily set and display all brightness levels from completely on to off states.

Isn't it a really big difference? As we entered the millennium era, most analog products changed to digital products.
It seems difficult to find analog products around us now.
