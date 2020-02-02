---
layout:   post
title:    "파이썬 한글 주석 입력하기(SyntaxError: Non-ASCII character)"
author:   Kimtaeng
tags: 	  python
description: Python에서 한글로 주석을 입력하는 방법에 대해 알아봅시다.
category: Python
comments: true
---

# SyntaxError: Non-ASCII character

파이썬에서 한글로 주석을 입력하면 아래와 같은 오류를 볼 수 있습니다.

<pre class="line-numbers"><code class="language-python" data-start="1">def main():
    print ("Main Function")

# 메인 함수
# @see https://madplay.github.io/post/python-main-function
if __name__ == "__main__":
	main()
</code></pre>

<pre class="line-numbers"><code class="language-bash" data-start="1">$ python taeng.py 
  File "taeng.py", line 4
SyntaxError: Non-ASCII character '\xeb' in file taeng.py on line 4,
but no encoding declared; see http://python.org/dev/peps/pep-0263/ for details
</code></pre>

해결책은 간단합니다. 코드 최상단에 아래와 같이 ```# -*- coding: utf-8 -*-```을 추가해주면 간단히 해결됩니다.
주의할 점은 이 주석을 **1~2번 라인에 선언**해야 한다는 점입니다. 세 번째 라인에 선언하는 경우
정상적으로 적용되지 않습니다.

<pre class="line-numbers"><code class="language-python" data-start="1"># -*- coding: utf-8 -*-

def main():
    print ("Main Function")

# 메인 함수
if __name__ == "__main__":
	main()
</code></pre>