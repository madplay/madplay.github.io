---
layout:   post
title:    "Entering Korean Comments in Python (SyntaxError: Non-ASCII character)"
author:   Kimtaeng
tags: 	  python
description: Let's learn about methods for entering comments in Korean in Python.
category: Python
comments: true
slug:     python-korean-comment
lang:     en
permalink: /en/post/python-korean-comment
---

# Handling Non-ASCII Characters in Python Source

The Python interpreter may raise a `SyntaxError` when it encounters non-ASCII characters in a source file without an explicit encoding declaration.
This issue commonly occurs when using comments written in languages like Korean (for example, `# 메인 함수`).

Consider the following module:

```python
def main():
    print ("Main Function")

# Main function
# @see https://madplay.github.io/post/python-main-function
if __name__ == "__main__":
	main()
```

Executing this script produces the following error:

```shell
$ python taeng.py 
  File "taeng.py", line 4
SyntaxError: Non-ASCII character '\xeb' in file taeng.py on line 4,
but no encoding declared; see http://python.org/dev/peps/pep-0263/ for details
```

The resolution involves declaring the file's character encoding. Adding the following comment at the beginning of the file instructs the interpreter to parse it as UTF-8.

This declaration must appear on either the first or second line of the source file to be effective.

```python
# -*- coding: utf-8 -*-

def main():
    print ("Main Function")

# Main function
if __name__ == "__main__":
	main()
```
