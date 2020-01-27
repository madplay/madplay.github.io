---
layout:   post
title:    파이썬 if __name__ == "__main__" 의미 
author:   Kimtaeng
tags: 	  python
description: Python에서 if __name__ == "__main__" 선언의 의미는 무엇일까? 
category: Python
comments: true
---

# 파이썬의 메인함수

결론부터 얘기하면 ```if __name__ == "__main__"``` 의 의미는 메인 함수의 선언, 시작을 의미합니다.
해당 코드 밑에 main 등의 함수 호출 코드를 작성해서 함수의 기능을 수행합니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># taeng.py

def main():
    # python 3에서는 print() 으로 사용합니다.
    print "Main Function"

if __name__ == "__main__":
	main()
</code></pre>

<pre class="line-numbers"><code class="language-bash" data-start="1">$ python taeng.py
$ Main Function 
</code></pre>

그냥 **"아~ 메인 함수 선언이구나"** 라고 넘어가기에는 뭔가 아쉽고 찜찜합니다.
이어서 조금만 더 자세히 알아봅시다.

<br/>

# 반대로 없다면 어떻게 될까?

다른 모듈을 불러온다고 가정합시다. 모듈 이름은 taengModule으로 가정하고
기능은 아래와 같이 단순히 덧셈 결과를 반환합니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># taengModule.py

def add(x, y):
	return x + y
</code></pre>

터미널에서 python을 실행하여 모듈을 직접 import하여 사용해봅시다.

<pre class="line-numbers"><code class="language-bash" data-start="1"># python 실행
>>> import taengModule
>>> print (taengModule.add(2, 3))
5 
>>>
</code></pre>

간단합니다. 기대한 결과값인 5가 정상적으로 출력됩니다. 여기서 taengModule만 별도로 확인하기 위해서
아래와 같이 print 함수를 추가해봅시다. 그리고 tanegModule만 직접 실행하면 어떻게 될까요?

<pre class="line-numbers"><code class="language-python" data-start="1"># taengModule.py

def add(x, y):
	return x + y
	
print (add(3, 4))
</code></pre>

<pre class="line-numbers"><code class="language-bash" data-start="1">$ python taengModule.py
$ 7
</code></pre>

실행한 결과는 기대한 값이 정상적으로 나오는 것을 알 수 있습니다.
하지만 이번에는 모듈을 직접 실행하는 것이 아닌 ```import```하는 경우 어떻게 될까요?

<pre class="line-numbers"><code class="language-bash" data-start="1"># python 실행
>>> import taengModule
7
>>>
</code></pre>

```import```만 했을 뿐인데 taengModule.py의 코드가 수행되어 결과값을 출력하게 됩니다.
우리는 단순히 taengModule의 add 함수만 사용하려고 했는데 말입니다.

이와 같은 문제를 해결하려면 아래와 같이 taengModule.py 파일의 코드를 변경하면 됩니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># taengModule.py

def add(x, y):
	return x + y

# 이 부분을 추가합니다.	
if __name__ == "__main__":
    print (add(3, 4))
</code></pre>

코드를 수정한 후에 다시 import를 수행해도 기대한 것처럼 print 함수가 수행되지 않습니다.
물론 ```python taengModule```와 같이 모듈을 불러오는 것이 아닌 직접 수행한 경우에는
print 함수가 실행됩니다.

<br/>

# 왜 그런걸까?

파이썬에서 ```__name__``` 변수는 내부적으로 사용되는 특별한 변수 이름입니다.
위의 예제에서 ```python taeng.py```와 같이 직접 taeng.py 파일을 실행하는 경우에는
```__name___``` 변수에 ```__main__``` 이라는 값이 할당됩니다.

다만 마지막에서 살펴본 모듈 불러오기와 같이 ```import taengModule```을 통해서 모듈을 불러와서 사용하는 경우
```__name__``` 변수에는 모듈 이름(여기서는 taengModule)이 저장됩니다.

결론적으로 ```if __name__ == "__main__"```와 같이 조건문을 사용하여 터미널에서와 같이 
직접 호출되어 사용될 때는 그 자체로 기능을 수행하고, 동시에 다른 모듈에서 필요한 함수 등을 제공할 수 있습니다.

