---
layout:   post
title:    Selection Sort
author:   madplay
tags: 	  algorithm selectionsort
description: Learning about selection sort, one of the in-place sorting algorithms.
category: Algorithm
comments: true
slug:     selection-sort
lang:     en
permalink: /en/post/selection-sort
---

# What is Selection Sort?
Selection sort is an in-place sorting algorithm that selects data appropriate for a position from all unsorted data
and exchanges positions. It proceeds with the following steps:

- 1) Find the data with the smallest value among the given data list.
- 2) Replace the found data with the position of the data located at the very beginning.
- 3) Replace the remaining data excluding the very first position in the same way.

Expressed in pseudo code, it looks like this:

```c
For i -> 0 to n:
    Among data compared from a[i] to a[n-1], if the smallest data is in a[j],
    swap a[i] and a[j] 
``` 

<br/>

# Selection Sort Process
Examining the selection sort process in detail through diagrams. The way of counting rotation count (PASS) may differ
depending on whether the starting state is included (whether given as initial state or not).

<div class="post_caption">"Here, we count only cases where positions are changed as N rotations (PASS)."</div>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-1.png"
width="650" alt="Selection Sort Step1"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-2.png"
width="650" alt="Selection Sort Step2"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-3.png"
width="650" alt="Selection Sort Step3"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-4.png"
width="650" alt="Selection Sort Step4"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-5.png"
width="650" alt="Selection Sort Step5"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-6.png"
width="650" alt="Selection Sort Step6"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-7.png"
width="650" alt="Selection Sort Step7"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-8.png"
width="650" alt="Selection Sort Step8"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-9.png"
width="650" alt="Selection Sort Step9"/>

<br/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-01-07-selection-sort-10.png"
width="650" alt="Selection Sort Step10"/>

<br/><br/>

# Selection Sort Implementation
Examining the above process through source code:

```java
void selectionSort(int *list, const int n)
{
    int i, j, indexMin, temp;

    for (i = 0; i < n - 1; i++)
    {
        indexMin = i;
        for (j = i + 1; j < n; j++)
        {
            if (list[j] < list[indexMin])
            {
                indexMin = j;
            }
        }
        temp = list[indexMin];
        list[indexMin] = list[i];
        list[i] = temp;
    }
}
```

<br/>

# Performance of Selection Sort
Examining complexity: When C is the comparison count for sorting in best (min), average (ave), and worst (max) cases, it can be expressed as follows:

$$
{ C }_{ min }{ =C }_{ ave }={ C }_{ max }=\sum _{ i=1 }^{ N-1 }{ N-i } =\frac { N(N-1) }{ 2 } =O({ n }^{ 2 })
$$

Here, N represents the number of data.
