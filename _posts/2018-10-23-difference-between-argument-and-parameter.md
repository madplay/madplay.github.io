---
layout:   post
title:    전달인자(argument)와 매개변수(parameter)
author:   Kimtaeng
tags: 	  knowledge
description: 함수의 전달인자(argument, 아큐먼트)와 매개변수(parameter, 파라미터)는 무슨 차이일까?  
category: Knowledge
date: "2018-10-23 23:47:12"
comments: true
---

# 같은 것 아니었나?
가끔 전달인자(argument)와 매개변수(parameter)를 섞어서 큰 구분없이 사용하기도 한다.
하지만 엄밀히 따진다면 두 용어는 차이가 있다.

먼저 **parameter**에 대해서 살펴보자. 우리말로 번역하면 매개변수라고 할 수 있다.
함수의 정의 부분에 선언된 변수들을 의미한다.

예제 코드를 보면 쉽게 이해해보자. 아래에 선언된 함수에서 x, y를 매개변수라고 한다.

```js
// 여기서 x, y가 매개변수가 됩니다.
function foo(x, y) {
    // ... something
}
```

다음으로 **argument**를 살펴봅시다. 우리말로 번역하면 전달인자라고 표현할 수 있다.
함수를 호출할때 전달되는 실제 값을 의미한다.

```js
// 여기서 2, 3이 전달인자(argument) 입니다.
foo(2, 3);
```

이처럼 명확한 의미를 생각한다면 매개변수는 변수(variable)로, 전달인자는 값(value)으로 생각하는 것이 일반적이다.