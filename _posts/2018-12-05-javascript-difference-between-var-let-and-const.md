---
layout:   post
title:    var, let, const 변수의 차이점은 무엇일까?
author:   Kimtaeng
tags: 	  javascript variable scope
description: ECMAScript 2015(ES6)에 추가된 var, let, const 선언의 차이점에 대해서 알아보자. 
category: Script
comments: true
---

# var, let, const

ES5까지는 변수를 선언할 때는 아래와 같이 코드를 작성했습니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">var foo = '1';
var foo = '2';
</code></pre>

물론 ```var``` 선언 없이도 변수 선언이 가능하지만 전역 객체의 특성을 갖게되어
다른 곳에서 동일한 이름으로 변수를 네이밍했을 때 이슈가 있을 수 있습니다.
그리고 위 코드에서 볼 수 있는 것처럼 중복 선언도 허용됩니다. 동일 이름으로 2번 선언해도 아무런 문제가 되지 않습니다.

한편 ECMAScript 2015(ES6)에서는 변수 선언에 사용할 수 있는 ```let```과 ```const``` 키워드가 추가되었는데요.
각 선언마다 어떻게 다른지 하나씩 살펴봅시다.

<br/>

# 스코프

스코프(Scope)의 차이를 먼저 알아볼까 합니다. ```var``` 변수는 기본적으로 ```Function Scope```를 가집니다.
이와 다르게 ```let```과 ```const```는 ```Block Scope```를 가집니다. 조금 더 정확하게 아래 코드로 살펴봅시다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">var foo = 1;

function fuc() {
    var foo = 2;
    console.log('foo in function : ' + foo);
}

if(true) {
    var foo = 3;
}

func();
console.log('foo : ' + foo);

// 출력 결과
// foo in function : 2
// foo : 3
</code></pre>

```var```의 경우 변수를 블록으로 감싸더라도 유효 범위가 함수(function)이기 때문에 ```if```블록 내에서
값이 재할당됩니다. 반면에 ```let```은 어떨까요?

<pre class="line-numbers"><code class="language-javascript" data-start="1">let foo = 1;

function func() {
    let foo = 2;
    console.log('foo in function : ' + foo);
}

if(true) {
    let foo = 3;
}

func();
console.log('foo : ' + foo);

// 출력 결과
// foo in function : 2
// foo : 1
</code></pre>

```let```은 ```Block Scope```이므로 블록내에서 재선언하는 경우 새로운 변수로 인식합니다.
그러니까 블록 내에서만 유효하게 되지요.

<br/>

# 재선언, 재할당

```var```는 상당히 유연합니다. 동일한 변수 이름으로 다시 선언해도 아무런 문제가 되지 않습니다.
상단에서 선언한 변수를 잊고 다시 선언한 경우에 문제가 발생할 수 있습니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">var foo = 'a';
console.log(foo); // 'a'
foo = 'b';
console.log(foo); // 'b'

// 만일 이 사이에 여러 라인의 코드가 있다면..!? 
var foo = 'c';
console.log(foo); // 'c'
</code></pre>

```let```은 조금 다릅니다. 동일한 변수 이름으로 재선언하는 경우 에러를 발생합니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">let foo = 'a';
console.log(foo); // 'a'
foo = 'b';
console.log(foo); // 'b'

// 동일한 변수 이름으로 재선언하는 경우에 에러가 발생한다.
let foo = 'c'; // Uncaught SyntaxError: Identifier 'foo' has already been declared
</code></pre>

```const```도 마찬가지입니다. 하지만 조금 다른 부분도 있습니다. ```const```는 상수이기 때문에
값도 다시 할당할 수 없습니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">const foo = 'a';
console.log(foo); // 'a'
foo = 'b'; // VM456:1 Uncaught TypeError: Assignment to constant variable.

// let과 동일하게 변수를 재선언한다면 오류가 발생한다.
const foo = 'c'; // Uncaught SyntaxError: Identifier 'foo' has already been declared
</code></pre>

<br/>

# 호이스팅

호이스팅(hoisting)은 개인적으로 코드를 읽기 난해하게 만들 수 있다고 봅니다. **끌어올리다**라는 뜻을 가진 호이스팅은
아래와 같은 코드로 설명할 수 있습니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">console.log(foo); // undefined
var foo = 'a';
console.log(foo); // 'a'
</code></pre>

위의 자바스크립트 코드는 아무런 오류없이 동작합니다. 호이스팅을 통해 ```var``` 키워드가 다시 해석되기 때문인데요.
실제 값 할당을 제외하고 선언만 올려지게 되며 위에서 작성한 실제 코드는 아래와 같이 변경됩니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">var foo; // 선언을 위로 끌어올린다.
console.log(foo);
var foo = 'a';
console.log(foo);
</code></pre>

조금 더 살펴볼까요? 첫 번째 예제와 같이 ```for loop```에 선언한 ```var``` 변수도 루프 밖에서 사용이 가능합니다.
역시나 호이스팅(hoisting) 되었기 때문입니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">for(var count = 1; count <= 3; count++) {
    console.log('count : ' + count);
}
console.log('Finished : ' + count);
// 결과 출력
// count : 1
// count : 2
// count : 3
// Finished : 4
</code></pre>

반면에 ```let```은 다릅니다. 미리 선언되지 않으면 오류가 발생합니다.

<pre class="line-numbers"><code class="language-javascript" data-start="1">console.log(foo);
// Uncaught SyntaxError: Identifier 'foo' has already been declared
let foo = 'a';
console.log(foo);
</code></pre>

<br/>

# 정리하면?

**스코프(Scope)** 관점으로 보면 ```var```는 ```Function Scope```이다. 따라서 함수 블록으로 스코프가 생성되고
반면에 ```let```과 ```const```는 ```Block Scope```이므로 지정한 블록으로 스코프가 유효합니다.

그리고 ```var``` 변수는 **호이스팅(hoisting)**이 일어나는 반면에 ```let```과 ```const```는 호이스팅이 일어나지 않는다.
선언하기 전에 변수를 사용하게 되는 경우에 오류가 발생합니다.

마지막으로 ```const```는 상수이므로 값을 재할당하는 경우에 오류가 발생합니다. 