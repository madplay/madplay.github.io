---
layout:   post
title:    Python switch Statements
author:   Kimtaeng
tags: 	  python
description: How do you implement a switch statement in Python?
category: Python
comments: true
slug:     python-switch-statement
lang:     en
permalink: /en/post/python-switch-statement
---

# Python and Conditionals

In Python, you can write conditionals like this:

```python
if a == 1:
    print ("Hello 1")
elif a == 2:
    print ("Hello 2")
elif a == 3:
    print ("Hello 3")
elif a == 4:
    print ("Hello 4")
elif a == 5:
    print ("Hello 5")
else:
    print ("Hello Everyone")
```

Like C, C++, or Java, Python supports the `if ~ else if ~ else` pattern.
So how do you write a `switch` statement?

In Java, the same logic looks like this:

```python
switch (a) {
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
```

Python does not have a `switch` statement, which is unfortunate.
However, you can implement similar behavior using a dictionary.

<br/>

# Emulating switch in Python
A dictionary is a data structure that maps keys to values.
You can use it to emulate a `switch` statement.

```python
# -*- coding: utf-8 -*-

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
```

You can also combine this with functions:

```python
# -*- coding: utf-8 -*-

def hello1():
	print("Hello 1")


def hello2():
	print("Hello 2")	

# ... omitted


def main():
	hello_switcher = {
		1: hello1,
		2: hello2,
		3: hello3,
		4: hello4,
		5: hello5,
	}
	try:
	    # prints Hello 2, calls the function
		hello_switcher[2]()
		# prints Hello Everyone, calls the function
		hello_switcher[-1]()
	except Exception as e:
		print (e)
		print("Hello Everyone")

if __name__ == "__main__":
	main()
```

You can also rewrite it with `lambda`.
The code below uses `isinstance` to check whether the returned value is a lambda.

```python
import types

# -*- coding: utf-8 -*-

def hello1(val):
	print("Hello" + val)


def hello2(val):
	print("Hello" + val)	

# ... omitted


def hello_switcher(val):
	hello = {
		1: lambda: hello1(str(val)),
		2: lambda: hello2(str(val)),
		3: lambda: hello3(str(val)),
		4: lambda: hello4(str(val)),
		5: lambda: hello5(str(val))
	}
	helloFunc = hello.get(val, "Hello Everyone")
	
	# isinstance(a, b): is a an instance of b?
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
```

As shown above, even without a `switch` statement, Python can emulate the same behavior with a dictionary.
