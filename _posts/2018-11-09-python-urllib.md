---
layout:   post
title:    파이썬 URL 파싱, 호출(urllib)
author:   Kimtaeng
tags: 	  python
description: Python에서 URL 파싱, 호출 등을 쉽게해주는 urllib 라이브러리
category: Python
comments: true
---

# urllib

파이썬에서는 웹과 관련된 데이터를 쉽게 다룰 수 있도록 ```urllib```모듈을 제공합니다.
사용하는 파이썬 버전에 따라서 조금씩 다른 부분이 있긴합니다.
예를 들어 URL을 파싱하는 모듈의 경우 ```python2``` 버전에서는 ```urlparse``` 라는 이름의 모듈로 제공되었으나
```python3```에서는 ```urllib.parse```로 변경되었습니다.

<br/>

# urllib.request 

```urllib.request``` 모듈을 이용하여 간단하게 웹 페이지 요청 및 데이터를 가져올 수 있습니다.

아래와 같이 ```urlopen``` 함수를 이용하면 **웹 페이지**를 불러올 수 있습니다.
리턴값으로 호출하여 얻은 데이터에 대한 객체를 반환합니다.
<pre class="line-numbers"><code class="language-bash" data-start="1">>>> import urllib.request
>>> urllib.request.urlopen("https://madplay.github.io")
<http.client.HTTPResponse object at 0x102c26438>
</code></pre>

실제로 결과를 출력하려면 반환된 객체의 ```read``` 함수를 실행하면 됩니다.
아래 코드에서 decode를 하지 않으면 인코딩된 페이지의 결과가 보이기 때문에 읽기 어렵습니다.
<pre class="line-numbers"><code class="language-bash" data-start="1">>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.read().decode("utf-8")
</code></pre>

**헤더(Header) 정보**를 가져오기 위해서는 앞서 살펴본 ```urlopen``` 함수의 반환값인 HTTPResponse 객체를
이용하면 됩니다. 헤더의 전체 정보를 출력할 때는 ```getheaders``` 함수를 사용하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.getheader('content-type)
'text/html; charset=utf-8'
</code></pre>



**상태값(HTTP Status)**을 가져오기 위해서는 반환된 객체의 status 변수를 이용하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.status
200
</code></pre>

<br/>

# urllib.parse

```urllib.parse``` 모듈을 이용하면 간단하게 URL과 파라미터를 다룰 수 있습니다.

**URL을 파싱** 하기 위해서는 ```urlparse``` 함수를 이용하면 됩니다. 아래 코드의 실행 결과와 같이
입력한 URL 정보를 각각의 변수에 할당된 객체가 반환됩니다. 

<pre class="line-numbers"><code class="language-bash" data-start="1">>>> from urllib import parse
>>> url = parse.urlparse("https://예시도메인/post/java-kafka-example?test=hi")
>>> print (url)
ParseResult(scheme='https', netloc='예시도메인', path='/post/java-kafka-example', params='', query='test=hi', fragment='')
</code></pre>

**쿼리 스트링**을 가져오기 위해서는 ```urlparse```함수를 통해 반환된 객체의 ```query 변수```와
```parse_qs``` 함수를 이용하면 됩니다. 리턴 타입이 딕셔너리(dictionary)입니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">>>> from urllib import parse
>>> url = parse.urlparse("https://예시도메인/post/java-kafka-example?test=hi")
>>> print (parse.parse_qs(url.query))
{'test': ['hi']}
>>> parse.parse_qs(url.query)['test'][0]
'hi'
</code></pre>

**인코딩** 관련 처리도 가능합니다. 공백을 ```+```로 처리 할 떄는 ```quote_plus```함수를 사용하고
```%20```으로 처리할 때는 ```quote``` 함수를 사용하면 됩니다.

<pre class="line-numbers"><code class="language-bash" data-start="1">>>> from urllib import parse
>>> parse.quote_plus("김탱은 블로그 주인")
'%EA%B9%80%ED%83%B1%EC%9D%80+%EB%B8%94%EB%A1%9C%EA%B7%B8+%EC%A3%BC%EC%9D%B8'
>>> parse.quote("김탱은 블로그 주인")
'%EA%B9%80%ED%83%B1%EC%9D%80%20%EB%B8%94%EB%A1%9C%EA%B7%B8%20%EC%A3%BC%EC%9D%B8'
</code></pre>