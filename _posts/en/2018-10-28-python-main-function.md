---
layout:   post
title:    Python if __name__ == "__main__" Meaning
author:   madplay
tags: 	  python
description: What is the meaning of the if __name__ == "__main__" declaration in Python?
category: Python
comments: true
slug:     python-main-function
lang:     en
permalink: /en/post/python-main-function
---

# Python's Main Function

To conclude, the meaning of `if __name__ == "__main__"` is declaration and start of the main function.
Writing function call code like main below that code to perform function functionality.

```python
# taeng.py

def main():
    # In python 3, use print()
    print "Main Function"

if __name__ == "__main__":
	main()
```

```bash
$ python taeng.py
$ Main Function 
```

It's a bit regrettable and unsatisfactory to just pass it off as **"Ah~ it's a main function declaration"**.
Learning a bit more in detail.

<br/>

# What Happens Without It?

Assuming importing another module. Assuming the module name is taengModule and
functionality simply returns addition results as below.

```python
# taengModule.py

def add(x, y):
	return x + y
```

Running python in terminal and directly importing and using the module.

```bash
# run python
>>> import taengModule
>>> print (taengModule.add(2, 3))
5 
>>>
```

Simple. Expected result value 5 is output normally. To check taengModule separately here,
adding a print function as below. And what happens if we directly execute tanegModule only?

```python
# taengModule.py

def add(x, y):
	return x + y
	
print (add(3, 4))
```

```bash
$ python taengModule.py
$ 7
```

Seeing that execution results output expected values normally.
But what happens this time when importing instead of directly executing modules?

```bash
# run python
>>> import taengModule
7
>>>
```

Just by doing ```import```, taengModule.py's code is executed and result values are output.
We only wanted to use taengModule's add function.

To solve such problems, changing taengModule.py file's code as below.

```python
# taengModule.py

def add(x, y):
	return x + y

# Add this part.	
if __name__ == "__main__":
    print (add(3, 4))
```

After modifying code, even if performing import again, the print function isn't executed as expected.
Of course, when directly executing instead of loading modules like ```python taengModule```,
the print function executes.

<br/>

# Why Is That?

In Python, the ```__name__``` variable is a special variable name used internally.
In the example above, when directly executing taeng.py file like ```python taeng.py```,
the ```__name__``` variable is assigned the value ```__main__```.

However, when loading modules through ```import taengModule``` like module loading we examined last,
the ```__name__``` variable stores the module name (taengModule here).

In conclusion, using conditional statements like ```if __name__ == "__main__"```,
when directly called and used like in terminal, it performs functionality itself, and simultaneously
can provide needed functions, etc. to other modules.
