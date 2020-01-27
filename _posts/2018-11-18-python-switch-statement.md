---
layout:   post
title:    파이썬 switch 
author:   Kimtaeng
tags: 	  python
description: Python에서 switch 문을 사용하려면 어떻게 해야할까? 
category: Python
comments: true
---

# 파이썬과 조건문

파이썬에서는 아래 코드처럼 조건문을 작성할 수 있습니다.

<pre class="line-numbers"><code class="language-python" data-start="1">if a == 1:
    print ("Hello 1")
elif a == 2:
    print ("Hello 2")
elif a == 3:
    print ("Hello 3")
elif a == 4:
    print ("Hello 4")
elif a == 5:
    print ("Hello 5")
else
    print ("Hello Everyone")
</code></pre>

C, C++ 또는 Java 언어와 마찬가지로 ```if ~ else if ~ else``` 문장을 지원하고 있습니다.
그렇다면 ```switch``` 문장은 어떻게 사용할까요?

자바 언어를 예로 들으면 위 문장을 아래와 같은 switch 문으로 변경할 수 있습니다.

<pre class="line-numbers"><code class="language-java" data-start="1">switch (a) {
    case 1:
        System.out.println("Hello 1");
    case 2:
        System.out.println("Hello 2");
    case 3:
        System.out.println("Hello 3");
    case 4:
        System.out.println("Hello 4");
    case 5:
        System.out.println("Hello 5");
    default:
        System.out.println("Hello Everyone");
}
</code></pre>

그런데 아쉽게도 파이썬에는 위처럼 ```switch``` 조건문이 없습니다. 꽤 아쉬운 부분이긴 합니다.
하지만 딕셔너리(Dictionary)를 사용하여 유사하게 구현할 수 있습니다.

<br/>

# 파이썬으로 switch 흉내내기

딕셔너리(Dictionary)는 키와 데이터 값이 한 쌍을 이루는 자료형입니다. 이를 이용한다면
우리가 구현하고자하는 ```switch``` 조건문과 유사한 기능을 사용할 수 있습니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># -*- coding: utf-8 -*-

def hello(a):
	return {
		1: "Hello 1",
		2: "Hello 2",
		3: "Hello 3",
		4: "Hello 4",
		5: "Hello 5",
	}.get(a, "Hello Everyone")

def main():
	print(hello(2)); # Hello 2
	print(hello(6)); # Hello Everyone

if __name__ == "__main__":
	main() 
</code></pre>

함수(Function)와 조합해서 아래와 같이 사용도 가능합니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># -*- coding: utf-8 -*-

def hello1():
	print("Hello 1")

def hello2():
	print("Hello 2")	

# ... 생략

def main():
	hello_switcher = {
		1: hello1,
		2: hello2,
		3: hello3,
		4: hello4,
		5: hello5,
	}
	try:
	    # Hello 2 출력, 함수 호출
		hello_switcher[2]()
		# Hello Everyone 출력, 함수 호출
		hello_switcher[-1]()
	except Exception as e:
		print (e)
		print("Hello Everyone")

if __name__ == "__main__":
	main()
</code></pre>

방금 살펴본 코드를 ```lambda```를 사용하여 조금 변경할 수도 있습니다.
반환된 값이 람다 형태인지 비교하기 위해 ```isinstance``` 함수도 사용합니다.

<pre class="line-numbers"><code class="language-python" data-start="1">import types

# -*- coding: utf-8 -*-

def hello1(val):
	print("Hello" + val)

def hello2(val):
	print("Hello" + val)	

# ... 생략

def hello_switcher(val):
	hello = {
		1: lambda: hello1(str(val)),
		2: lambda: hello2(str(val)),
		3: lambda: hello3(str(val)),
		4: lambda: hello4(str(val)),
		5: lambda: hello5(str(val))
	}
	helloFunc = hello.get(val, "Hello Everyone")
	
	# isinstance(a, b) : a가 b타입인가?
	if isinstance(helloFunc, types.LambdaType):
		helloFunc()
	else:
		print (helloFunc)

def main():
    # Hello 2
	hello_switcher(2)
	# Hello Everyone
	hello_switcher(6)

if __name__ == "__main__":
	main()
</code></pre>

위에서 살펴본 것처럼 파이썬에서는 ```switch``` 문이 없어도 딕셔너리(Dictionary)를 이용해서
유사하게 구현할 수 있습니다.