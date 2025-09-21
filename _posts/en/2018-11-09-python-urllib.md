---
layout:   post
title:    Python URL Parsing and Calling (urllib)
author:   madplay
tags: 	  python
description: urllib library that makes URL parsing and calling easy in Python
category: Python
comments: true
slug:     python-urllib
lang:     en
permalink: /en/post/python-urllib
---

# urllib

Python provides the ```urllib``` module to easily handle web-related data.
There are slight differences depending on the Python version used.
For example, in the case of modules that parse URLs, in ```python2``` version, it was provided as a module named ```urlparse```, but
in ```python3```, it was changed to ```urllib.parse```.

<br/>

# urllib.request

Requesting web pages and fetching data simply using the ```urllib.request``` module.

Using the ```urlopen``` function as below, loading **web pages**.
It returns an object for data obtained by calling as a return value.
```bash
>>> import urllib.request
>>> urllib.request.urlopen("https://madplay.github.io")
<http.client.HTTPResponse object at 0x102c26438>
```

To actually output results, executing the ```read``` function of the returned object.
In the code below, if you don't decode, encoded page results appear, so it's hard to read.
```bash
>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.read().decode("utf-8")
```

To get **Header** information, using the HTTPResponse object, which is the return value of the ```urlopen``` function we examined earlier.
When outputting all header information, using the ```getheaders``` function.

```bash
>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.getheader('content-type)
'text/html; charset=utf-8'
```



To get **status values (HTTP Status)**, using the status variable of the returned object.

```bash
>>> import urllib.request
>>> req = urllib.request.urlopen("https://madplay.github.io")
>>> req.status
200
```

<br/>

# urllib.parse

Using the ```urllib.parse``` module, handling URLs and parameters simply.

To **parse URLs**, using the ```urlparse``` function. As in the execution result of the code below,
an object with input URL information assigned to each variable is returned.

```bash
>>> from urllib import parse
>>> url = parse.urlparse("https://example-domain/post/java-kafka-example?test=hi")
>>> print (url)
ParseResult(scheme='https', netloc='example-domain', path='/post/java-kafka-example', params='', query='test=hi', fragment='')
```

To get **query strings**, using the ```query variable``` of the object returned through the ```urlparse``` function and
the ```parse_qs``` function. The return type is a dictionary.

```bash
>>> from urllib import parse
>>> url = parse.urlparse("https://example-domain/post/java-kafka-example?test=hi")
>>> print (parse.parse_qs(url.query))
{'test': ['hi']}
>>> parse.parse_qs(url.query)['test'][0]
'hi'
```

**Encoding** related processing is also possible. When processing spaces as ```+```, using the ```quote_plus``` function, and
when processing as ```%20```, using the ```quote``` function.

```bash
>>> from urllib import parse
>>> parse.quote_plus("Kimtaeng is the blog owner")
'%EA%B9%80%ED%83%B1%EC%9D%80+%EB%B8%94%EB%A1%9C%EA%B7%B8+%EC%A3%BC%EC%9D%B8'
>>> parse.quote("Kimtaeng is the blog owner")
'%EA%B9%80%ED%83%B1%EC%9D%80%20%EB%B8%94%EB%A1%9C%EA%B7%B8%20%EC%A3%BC%EC%9D%B8'
```
